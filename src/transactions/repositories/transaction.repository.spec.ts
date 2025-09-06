import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionRepository } from './transaction.repository';
import { Transaction } from '../entities/transaction.entity';

describe('TransactionRepository', () => {
  let repository: TransactionRepository;
  let mockRepository: Partial<Repository<Transaction>>;

  const mockTransaction = {
    id: 1,
    amount: 100,
    liters: 25,
    pricePerLiter: 4,
    status: 'completed',
    organizationId: 1,
    cardId: 1,
    fuelStationId: 1,
    card: { id: 1, cardNumber: '1234' },
    organization: { id: 1, name: 'Test Org' },
    fuelStation: { id: 1, name: 'Test Station' },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([mockTransaction]),
    };

    mockRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionRepository,
        {
          provide: getRepositoryToken(Transaction),
          useValue: mockRepository,
        },
      ],
    }).compile();

    repository = module.get<TransactionRepository>(TransactionRepository);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findByOrganization', () => {
    it('should find transactions by organization id', async () => {
      mockRepository.find = jest.fn().mockResolvedValue([mockTransaction]);

      const result = await repository.findByOrganization(1);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { organizationId: 1 },
        relations: ['card', 'organization', 'fuelStation'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual([mockTransaction]);
    });
  });

  describe('findByCard', () => {
    it('should find transactions by card id', async () => {
      mockRepository.find = jest.fn().mockResolvedValue([mockTransaction]);

      const result = await repository.findByCard(1);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { cardId: 1 },
        relations: ['card', 'organization', 'fuelStation'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual([mockTransaction]);
    });
  });

  describe('findByFuelStation', () => {
    it('should find transactions by fuel station id', async () => {
      mockRepository.find = jest.fn().mockResolvedValue([mockTransaction]);

      const result = await repository.findByFuelStation(1);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { fuelStationId: 1 },
        relations: ['card', 'organization', 'fuelStation'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual([mockTransaction]);
    });
  });

  describe('findByStatus', () => {
    it('should find transactions by status', async () => {
      mockRepository.find = jest.fn().mockResolvedValue([mockTransaction]);

      const result = await repository.findByStatus('completed');

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { status: 'completed' },
        relations: ['card', 'organization', 'fuelStation'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual([mockTransaction]);
    });
  });

  describe('findByDateRange', () => {
    it('should find transactions within date range using query builder', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      const mockQueryBuilder = mockRepository.createQueryBuilder();

      const result = await repository.findByDateRange(startDate, endDate);

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('transaction');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('transaction.card', 'card');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('transaction.organization', 'organization');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('transaction.fuelStation', 'fuelStation');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('transaction.createdAt >= :startDate', { startDate });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('transaction.createdAt <= :endDate', { endDate });
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('transaction.createdAt', 'DESC');
      expect(mockQueryBuilder.getMany).toHaveBeenCalled();
      expect(result).toEqual([mockTransaction]);
    });
  });

  describe('findWithRelations', () => {
    it('should find transaction by id with relations', async () => {
      mockRepository.findOne = jest.fn().mockResolvedValue(mockTransaction);

      const result = await repository.findWithRelations(1);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['card', 'organization', 'fuelStation'],
      });
      expect(result).toEqual(mockTransaction);
    });

    it('should return null if transaction not found', async () => {
      mockRepository.findOne = jest.fn().mockResolvedValue(null);

      const result = await repository.findWithRelations(999);

      expect(result).toBeNull();
    });
  });

  describe('findAllWithRelations', () => {
    it('should find all transactions with relations', async () => {
      mockRepository.find = jest.fn().mockResolvedValue([mockTransaction]);

      const result = await repository.findAllWithRelations();

      expect(mockRepository.find).toHaveBeenCalledWith({
        relations: ['card', 'organization', 'fuelStation'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual([mockTransaction]);
    });
  });

  describe('findRecentTransactions', () => {
    it('should find recent transactions with default limit', async () => {
      mockRepository.find = jest.fn().mockResolvedValue([mockTransaction]);

      const result = await repository.findRecentTransactions();

      expect(mockRepository.find).toHaveBeenCalledWith({
        relations: ['card', 'organization', 'fuelStation'],
        order: { createdAt: 'DESC' },
        take: 10,
      });
      expect(result).toEqual([mockTransaction]);
    });

    it('should find recent transactions with custom limit', async () => {
      mockRepository.find = jest.fn().mockResolvedValue([mockTransaction]);

      const result = await repository.findRecentTransactions(5);

      expect(mockRepository.find).toHaveBeenCalledWith({
        relations: ['card', 'organization', 'fuelStation'],
        order: { createdAt: 'DESC' },
        take: 5,
      });
      expect(result).toEqual([mockTransaction]);
    });
  });
});