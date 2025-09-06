import { Test, TestingModule } from '@nestjs/testing';
import { TransactionListener } from './transaction.listener';
import { AppLoggerService } from '../../common/logger/logger.service';
import { TransactionCreatedEvent, TransactionApprovedEvent, TransactionRejectedEvent } from '../events/transaction.events';
import { TransactionStatus } from '../../common/enums/transaction-status.enum';

describe('TransactionListener', () => {
  let listener: TransactionListener;
  let logger: jest.Mocked<AppLoggerService>;

  beforeEach(async () => {
    const mockLogger = {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionListener,
        {
          provide: AppLoggerService,
          useValue: mockLogger,
        },
      ],
    }).compile();

    listener = module.get<TransactionListener>(TransactionListener);
    logger = module.get(AppLoggerService);
  });

  it('should be defined', () => {
    expect(listener).toBeDefined();
  });

  describe('handleTransactionCreated', () => {
    it('should log transaction creation event', () => {
      const event = new TransactionCreatedEvent(
        123,      // transactionId
        456,      // cardId
        789,      // organizationId
        100.50,   // amount
        TransactionStatus.APPROVED
      );

      listener.handleTransactionCreated(event);

      expect(logger.log).toHaveBeenCalledWith(
        '🆕 Transaction Created: ID=123, Card=456, Org=789, Amount=100.5, Status=approved',
        'TransactionEvents'
      );
    });
  });

  describe('handleTransactionApproved', () => {
    it('should log transaction approval event', () => {
      const event = new TransactionApprovedEvent(
        123,      // transactionId
        456,      // cardId
        789,      // organizationId
        100.50    // amount
      );

      listener.handleTransactionApproved(event);

      expect(logger.log).toHaveBeenCalledWith(
        '✅ Transaction Approved: ID=123, Card=456, Org=789, Amount=100.5',
        'TransactionEvents'
      );
    });
  });

  describe('handleTransactionRejected', () => {
    it('should log transaction rejection event', () => {
      const event = new TransactionRejectedEvent(
        123,                            // transactionId
        456,                            // cardId
        789,                            // organizationId
        100.50,                         // amount
        'Insufficient organization balance'  // reason
      );

      listener.handleTransactionRejected(event);

      expect(logger.warn).toHaveBeenCalledWith(
        '❌ Transaction Rejected: ID=123, Card=456, Org=789, Amount=100.5, Reason=Insufficient organization balance',
        'TransactionEvents'
      );
    });
  });

  describe('handleTransactionAnalytics', () => {
    it('should log analytics event', () => {
      const event = new TransactionCreatedEvent(
        123,      // transactionId
        456,      // cardId
        789,      // organizationId
        100.50,   // amount
        TransactionStatus.APPROVED
      );

      listener.handleTransactionAnalytics(event);

      expect(logger.debug).toHaveBeenCalledWith(
        '📊 Analytics: Processing transaction metrics for Org=789, Amount=100.5',
        'TransactionAnalytics'
      );
    });
  });
});