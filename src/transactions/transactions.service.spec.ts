import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TransactionsService } from './transactions.service';
import { Transaction } from './entities/transaction.entity';
import { Card } from '../cards/entities/card.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { FuelStation } from '../fuel-stations/entities/fuel-station.entity';
import { CardsService } from '../cards/cards.service';
import { TransactionRepository } from './repositories/transaction.repository';
import { CardRepository } from '../cards/repositories/card.repository';
import { OrganizationRepository } from '../organizations/repositories/organization.repository';
import { OrganizationsService } from '../organizations/organizations.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionStatus } from '../common/enums/transaction-status.enum';
import { AppLoggerService } from '../common/logger/logger.service';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let transactionRepository: TransactionRepository;
  let cardRepository: CardRepository;
  let organizationRepository: OrganizationRepository;
  let dataSource: DataSource;
  let queryRunner: QueryRunner;
  let cardsService: CardsService;
  let eventEmitter: EventEmitter2;
  let logger: AppLoggerService;

  const mockCard: Card = {
    id: 1,
    cardNumber: '1234567890123456',
    holderName: 'John Doe',
    dailyLimit: 500,
    monthlyLimit: 10000,
    dailyUsage: 100,
    monthlyUsage: 2000,
    lastUsageDate: new Date(),
    lastMonthReset: new Date(),
    organizationId: 1,
    organization: null,
    transactions: [],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockOrganization: Organization = {
    id: 1,
    name: 'Test Org',
    code: 'TEST001',
    balance: 5000,
    isActive: true,
    users: [],
    cards: [],
    transactions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockFuelStation: FuelStation = {
    id: 1,
    name: 'Test Station',
    location: 'Test Location',
    apiKey: 'test-key',
    isActive: true,
    transactions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockQueryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        {
          provide: TransactionRepository,
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findAllWithRelations: jest.fn(),
          },
        },
        {
          provide: CardRepository,
          useValue: {
            findByCardNumber: jest.fn(),
            findByIdOrFail: jest.fn(),
          },
        },
        {
          provide: OrganizationRepository,
          useValue: {
            findByIdOrFail: jest.fn(),
            deductBalance: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
          },
        },
        {
          provide: CardsService,
          useValue: {
            canProcessTransaction: jest.fn(),
          },
        },
        {
          provide: OrganizationsService,
          useValue: {},
        },
        {
          provide: AppLoggerService,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
          },
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
    transactionRepository = module.get<TransactionRepository>(TransactionRepository);
    cardRepository = module.get<CardRepository>(CardRepository);
    organizationRepository = module.get<OrganizationRepository>(OrganizationRepository);
    dataSource = module.get<DataSource>(DataSource);
    cardsService = module.get<CardsService>(CardsService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
    logger = module.get<AppLoggerService>(AppLoggerService);
    queryRunner = dataSource.createQueryRunner();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processTransaction', () => {
    const createTransactionDto: CreateTransactionDto = {
      cardNumber: '1234567890123456',
      amount: 100,
      transactionDate: '2024-01-15T10:30:00Z',
    };

    it('should successfully process a valid transaction', async () => {
      const mockTransaction = {
        id: 'transaction-1',
        amount: 100,
        status: TransactionStatus.PENDING,
      };

      jest.spyOn(queryRunner.manager, 'findOne')
        .mockResolvedValueOnce(mockCard)
        .mockResolvedValueOnce(mockOrganization);
      
      jest.spyOn(queryRunner.manager, 'create').mockReturnValue(mockTransaction as any);
      jest.spyOn(queryRunner.manager, 'save').mockResolvedValue({ ...mockTransaction, id: 'transaction-1' } as any);
      jest.spyOn(queryRunner.manager, 'update').mockResolvedValue(undefined);
      
      jest.spyOn(cardsService, 'canProcessTransaction').mockResolvedValue({
        canProcess: true,
      });

      const result = await service.processTransaction(createTransactionDto, mockFuelStation);

      expect(result.success).toBe(true);
      expect(result.transactionId).toBe('transaction-1');
      expect(result.message).toBe('Transaction processed successfully');
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('should reject transaction when organization has insufficient balance', async () => {
      const lowBalanceOrg = { ...mockOrganization, balance: 50 };
      const mockTransaction = {
        id: 'transaction-1',
        amount: 100,
        status: TransactionStatus.PENDING,
      };

      jest.spyOn(queryRunner.manager, 'findOne')
        .mockResolvedValueOnce(mockCard)
        .mockResolvedValueOnce(lowBalanceOrg);
      
      jest.spyOn(queryRunner.manager, 'create').mockReturnValue(mockTransaction as any);
      jest.spyOn(queryRunner.manager, 'save').mockResolvedValue({ ...mockTransaction, id: 'transaction-1' } as any);

      const result = await service.processTransaction(createTransactionDto, mockFuelStation);

      expect(result.success).toBe(false);
      expect(result.rejectionReason).toBe('Insufficient organization balance');
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should reject transaction when card limits are exceeded', async () => {
      // Create a card that will exceed daily limit
      const cardWithHighUsage = {
        ...mockCard,
        dailyUsage: 450, // With 100 transaction amount, will exceed 500 daily limit
        lastUsageDate: new Date(), // Same day
      };

      jest.spyOn(queryRunner.manager, 'findOne')
        .mockResolvedValueOnce(cardWithHighUsage)
        .mockResolvedValueOnce(mockOrganization);

      const result = await service.processTransaction(createTransactionDto, mockFuelStation);

      expect(result.success).toBe(false);
      expect(result.rejectionReason).toBe('Daily limit exceeded');
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should rollback transaction on error', async () => {
      // Suppress console output during this test
      const originalWrite = process.stderr.write;
      process.stderr.write = jest.fn();
      
      jest.spyOn(queryRunner.manager, 'findOne').mockRejectedValue(new Error('Database error'));

      await expect(service.processTransaction(createTransactionDto, mockFuelStation))
        .rejects.toThrow('Database error');

      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      
      // Restore console output
      process.stderr.write = originalWrite;
    });
  });
});