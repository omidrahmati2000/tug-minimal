import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { EventEmitterModule, EventEmitter2 } from '@nestjs/event-emitter';
import { TransactionListener } from '../listeners/transaction.listener';
import { AppLoggerService } from '../../common/logger/logger.service';
import { TransactionCreatedEvent, TransactionApprovedEvent, TransactionRejectedEvent } from './transaction.events';
import { TransactionStatus } from '../../common/enums/transaction-status.enum';

describe('Event System E2E Test', () => {
  let app: INestApplication;
  let eventEmitter: EventEmitter2;
  let logger: jest.Mocked<AppLoggerService>;

  beforeAll(async () => {
    const mockLogger = {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [EventEmitterModule.forRoot()],
      providers: [
        TransactionListener,
        {
          provide: AppLoggerService,
          useValue: mockLogger,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    eventEmitter = app.get<EventEmitter2>(EventEmitter2);
    logger = app.get(AppLoggerService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should emit and handle transaction.created event in full app context', async () => {
    const event = new TransactionCreatedEvent(
      123,
      456,  
      789,
      100.50,
      TransactionStatus.APPROVED
    );

    // Emit event
    const result = eventEmitter.emit('transaction.created', event);
    console.log('Event emitted, listeners notified:', result);

    // Wait for event processing
    await new Promise(resolve => setTimeout(resolve, 200));

    // Check if logger was called
    console.log('Logger.log calls:', logger.log.mock.calls);
    console.log('Logger.debug calls:', logger.debug.mock.calls);

    // Verify at least one handler was called
    expect(logger.log.mock.calls.length + logger.debug.mock.calls.length).toBeGreaterThan(0);
  });

  it('should show event listener registration', () => {
    // Check if any listeners are registered
    const listenerCount = eventEmitter.listenerCount('transaction.created');
    console.log('Listeners registered for transaction.created:', listenerCount);
    
    expect(listenerCount).toBeGreaterThan(0);
  });

  it('should manually verify listener methods exist', () => {
    const listener = app.get<TransactionListener>(TransactionListener);
    
    // Verify listener methods exist
    expect(typeof listener.handleTransactionCreated).toBe('function');
    expect(typeof listener.handleTransactionApproved).toBe('function');
    expect(typeof listener.handleTransactionRejected).toBe('function');
    expect(typeof listener.handleTransactionAnalytics).toBe('function');

    // Manually call handler to verify it works
    const event = new TransactionCreatedEvent(999, 888, 777, 50.25, TransactionStatus.APPROVED);
    listener.handleTransactionCreated(event);

    expect(logger.log).toHaveBeenCalledWith(
      '🆕 Transaction Created: ID=999, Card=888, Org=777, Amount=50.25, Status=approved',
      'TransactionEvents'
    );
  });
});