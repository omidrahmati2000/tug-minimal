import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../common/enums/user-role.enum';
import { FuelStation } from '../fuel-stations/entities/fuel-station.entity';
import { Transaction } from './entities/transaction.entity';
import { TransactionStatus } from '../common/enums/transaction-status.enum';
import { FuelStationsService } from '../fuel-stations/fuel-stations.service';
import { ApiKeyGuard } from '../common/guards/api-key.guard';

describe('TransactionsController', () => {
  let controller: TransactionsController;
  let transactionsService: jest.Mocked<TransactionsService>;

  const mockFuelStation: FuelStation = {
    id: 1,
    name: 'Shell Station 001',
    apiKey: 'station_key_shell_001',
    location: 'Downtown',
    isActive: true,
    transactions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTransaction: Transaction = {
    id: 1,
    cardId: 1,
    organizationId: 1,
    fuelStationId: 1,
    amount: 100,
    status: TransactionStatus.APPROVED,
    rejectionReason: null,
    transactionDate: new Date(),
    card: null,
    organization: null,
    fuelStation: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSuperAdmin: User = {
    id: 1,
    email: 'admin@system.com',
    firstName: 'Super',
    lastName: 'Admin',
    password: 'hashedPassword',
    role: UserRole.SUPER_ADMIN,
    organizationId: null,
    isActive: true,
    organization: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockOrgAdmin: User = {
    id: 2,
    email: 'admin@test.com',
    firstName: 'Org',
    lastName: 'Admin',
    password: 'hashedPassword',
    role: UserRole.ORGANIZATION_ADMIN,
    organizationId: 1,
    isActive: true,
    organization: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockTransactionsService = {
      processTransaction: jest.fn(),
      findAll: jest.fn(),
      findByOrganization: jest.fn(),
      findByCard: jest.fn(),
      findOne: jest.fn(),
    };

    const mockFuelStationsService = {
      findByApiKey: jest.fn(),
      findOne: jest.fn(),
    };

    const mockApiKeyGuard = {
      canActivate: jest.fn().mockReturnValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionsController],
      providers: [
        {
          provide: TransactionsService,
          useValue: mockTransactionsService,
        },
        {
          provide: FuelStationsService,
          useValue: mockFuelStationsService,
        },
        {
          provide: ApiKeyGuard,
          useValue: mockApiKeyGuard,
        },
      ],
    }).compile();

    controller = module.get<TransactionsController>(TransactionsController);
    transactionsService = module.get(TransactionsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('processTransaction', () => {
    it('should process a transaction successfully', async () => {
      const createTransactionDto: CreateTransactionDto = {
        cardNumber: '1234567890123456',
        amount: 100,
        transactionDate: new Date().toISOString(),
      };

      const expectedResult = {
        success: true,
        transactionId: 1,
        message: 'Transaction processed successfully',
      };

      transactionsService.processTransaction.mockResolvedValue(expectedResult as any);

      const result = await controller.processTransaction(createTransactionDto, mockFuelStation);

      expect(transactionsService.processTransaction).toHaveBeenCalledWith(createTransactionDto, mockFuelStation);
      expect(result).toEqual(expectedResult);
    });

    it('should handle transaction failure', async () => {
      const createTransactionDto: CreateTransactionDto = {
        cardNumber: '1234567890123456',
        amount: 1000, // Large amount that might fail
        transactionDate: new Date().toISOString(),
      };

      const expectedResult = {
        success: false,
        message: 'Transaction rejected',
        rejectionReason: 'Insufficient balance',
      };

      transactionsService.processTransaction.mockResolvedValue(expectedResult as any);

      await expect(controller.processTransaction(createTransactionDto, mockFuelStation))
        .rejects.toThrow('Transaction rejected');

      expect(transactionsService.processTransaction).toHaveBeenCalledWith(createTransactionDto, mockFuelStation);
    });

    it('should handle different fuel stations', async () => {
      const createTransactionDto: CreateTransactionDto = {
        cardNumber: '1234567890123456',
        amount: 50,
        transactionDate: new Date().toISOString(),
      };

      const bpStation: FuelStation = {
        ...mockFuelStation,
        id: 2,
        name: 'BP Station 002',
        apiKey: 'station_key_bp_002',
      };

      const expectedResult = {
        success: true,
        transactionId: 2,
        message: 'Transaction processed successfully',
      };

      transactionsService.processTransaction.mockResolvedValue(expectedResult as any);

      const result = await controller.processTransaction(createTransactionDto, bpStation);

      expect(transactionsService.processTransaction).toHaveBeenCalledWith(createTransactionDto, bpStation);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findAll', () => {
    it('should return all transactions', async () => {
      const transactions = [mockTransaction];
      transactionsService.findAll.mockResolvedValue(transactions as any);

      const result = await controller.findAll();

      expect(transactionsService.findAll).toHaveBeenCalled();
      expect(result).toEqual(transactions);
    });
  });

  describe('findByOrganization', () => {
    it('should allow super admin to access any organization transactions', async () => {
      const transactions = [mockTransaction];
      transactionsService.findByOrganization.mockResolvedValue(transactions as any);

      const result = await controller.findByOrganization('1', mockSuperAdmin);

      expect(transactionsService.findByOrganization).toHaveBeenCalledWith(1);
      expect(result).toEqual(transactions);
    });

    it('should allow org admin to access their own organization transactions', async () => {
      const transactions = [mockTransaction];
      transactionsService.findByOrganization.mockResolvedValue(transactions as any);

      const result = await controller.findByOrganization('1', mockOrgAdmin);

      expect(transactionsService.findByOrganization).toHaveBeenCalledWith(1);
      expect(result).toEqual(transactions);
    });

    it('should deny access to different organization for org admin', () => {
      expect(() => controller.findByOrganization('2', mockOrgAdmin)).toThrow(
        'Access denied: You can only access transactions from your organization'
      );

      expect(transactionsService.findByOrganization).not.toHaveBeenCalled();
    });

    it('should handle string to number conversion', async () => {
      transactionsService.findByOrganization.mockResolvedValue([mockTransaction] as any);

      await controller.findByOrganization('123', mockSuperAdmin);

      expect(transactionsService.findByOrganization).toHaveBeenCalledWith(123);
    });
  });

  describe('findByCard', () => {
    it('should return transactions by card ID', async () => {
      const transactions = [mockTransaction];
      transactionsService.findByCard.mockResolvedValue(transactions as any);

      const result = await controller.findByCard('1');

      expect(transactionsService.findByCard).toHaveBeenCalledWith(1);
      expect(result).toEqual(transactions);
    });

    it('should handle string to number conversion for card ID', async () => {
      transactionsService.findByCard.mockResolvedValue([mockTransaction] as any);

      await controller.findByCard('456');

      expect(transactionsService.findByCard).toHaveBeenCalledWith(456);
    });
  });

  describe('findOne', () => {
    it('should return a single transaction', async () => {
      transactionsService.findOne.mockResolvedValue(mockTransaction as any);

      const result = await controller.findOne('1');

      expect(transactionsService.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockTransaction);
    });

    it('should handle string to number conversion for transaction ID', async () => {
      transactionsService.findOne.mockResolvedValue(mockTransaction as any);

      await controller.findOne('789');

      expect(transactionsService.findOne).toHaveBeenCalledWith(789);
    });

    it('should handle non-existent transaction', async () => {
      transactionsService.findOne.mockResolvedValue(null);

      const result = await controller.findOne('999');

      expect(transactionsService.findOne).toHaveBeenCalledWith(999);
      expect(result).toBeNull();
    });
  });
});