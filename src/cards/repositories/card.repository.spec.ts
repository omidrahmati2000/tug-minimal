import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CardRepository } from './card.repository';
import { Card } from '../entities/card.entity';

describe('CardRepository', () => {
  let repository: CardRepository;
  let mockRepository: Partial<Repository<Card>>;

  const mockCard = {
    id: 1,
    cardNumber: '1234567890',
    organizationId: 1,
    isActive: true,
    dailyUsage: 100,
    monthlyUsage: 1000,
    dailyLimit: 500,
    monthlyLimit: 5000,
    lastUsageDate: new Date(),
    lastMonthReset: new Date(),
    organization: { id: 1, name: 'Test Org' },
    transactions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockQueryBuilder = {
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({ affected: 1 }),
      createQueryBuilder: jest.fn().mockReturnThis(),
    };

    mockRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CardRepository,
        {
          provide: getRepositoryToken(Card),
          useValue: mockRepository,
        },
      ],
    }).compile();

    repository = module.get<CardRepository>(CardRepository);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findByCardNumber', () => {
    it('should find card by card number with organization relation', async () => {
      mockRepository.findOne = jest.fn().mockResolvedValue(mockCard);

      const result = await repository.findByCardNumber('1234567890');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { cardNumber: '1234567890' },
        relations: ['organization'],
      });
      expect(result).toEqual(mockCard);
    });

    it('should return null if card not found', async () => {
      mockRepository.findOne = jest.fn().mockResolvedValue(null);

      const result = await repository.findByCardNumber('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByOrganization', () => {
    it('should find active cards by organization with relations', async () => {
      mockRepository.find = jest.fn().mockResolvedValue([mockCard]);

      const result = await repository.findByOrganization(1);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { organizationId: 1, isActive: true },
        relations: ['organization', 'transactions'],
      });
      expect(result).toEqual([mockCard]);
    });
  });

  describe('findActiveCards', () => {
    it('should find only active cards', async () => {
      const activeCards = [mockCard];
      mockRepository.find = jest.fn().mockResolvedValue(activeCards);

      const result = await repository.findActiveCards();

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { isActive: true },
        relations: ['organization'],
      });
      expect(result).toEqual(activeCards);
    });
  });

  describe('findWithRelations', () => {
    it('should find card by id with all relations', async () => {
      mockRepository.findOne = jest.fn().mockResolvedValue(mockCard);

      const result = await repository.findWithRelations(1);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['organization', 'transactions'],
      });
      expect(result).toEqual(mockCard);
    });

    it('should return null if card not found', async () => {
      mockRepository.findOne = jest.fn().mockResolvedValue(null);

      const result = await repository.findWithRelations(999);

      expect(result).toBeNull();
    });
  });

  describe('updateUsage', () => {
    it('should update card usage using query builder', async () => {
      const mockQueryBuilder = mockRepository.createQueryBuilder();

      await repository.updateUsage(1, 50);

      expect(mockRepository.createQueryBuilder).toHaveBeenCalled();
      expect(mockQueryBuilder.update).toHaveBeenCalledWith(Card);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('id = :cardId', { cardId: 1 });
      expect(mockQueryBuilder.execute).toHaveBeenCalled();
    });
  });

  describe('resetDailyUsage', () => {
    it('should reset daily usage', async () => {
      mockRepository.update = jest.fn().mockResolvedValue({ affected: 1 });

      await repository.resetDailyUsage(1);

      expect(mockRepository.update).toHaveBeenCalledWith(1, {
        dailyUsage: 0,
        lastUsageDate: expect.any(Date),
      });
    });
  });

  describe('resetMonthlyUsage', () => {
    it('should reset monthly usage', async () => {
      mockRepository.update = jest.fn().mockResolvedValue({ affected: 1 });

      await repository.resetMonthlyUsage(1);

      expect(mockRepository.update).toHaveBeenCalledWith(1, {
        monthlyUsage: 0,
        lastMonthReset: expect.any(Date),
      });
    });
  });

  describe('deactivateCard', () => {
    it('should deactivate card', async () => {
      mockRepository.update = jest.fn().mockResolvedValue({ affected: 1 });

      await repository.deactivateCard(1);

      expect(mockRepository.update).toHaveBeenCalledWith(1, { isActive: false });
    });
  });

  describe('findAllWithRelations', () => {
    it('should find all cards with organization relations', async () => {
      const allCards = [mockCard];
      mockRepository.find = jest.fn().mockResolvedValue(allCards);

      const result = await repository.findAllWithRelations();

      expect(mockRepository.find).toHaveBeenCalledWith({
        relations: ['organization'],
      });
      expect(result).toEqual(allCards);
    });
  });

  describe('findByCardNumberWithLock', () => {
    it('should find active card by number with pessimistic write lock', async () => {
      mockRepository.findOne = jest.fn().mockResolvedValue(mockCard);

      const result = await repository.findByCardNumberWithLock('1234567890');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { cardNumber: '1234567890', isActive: true },
        relations: ['organization'],
        lock: { mode: 'pessimistic_write' },
      });
      expect(result).toEqual(mockCard);
    });

    it('should return null if card not found or inactive', async () => {
      mockRepository.findOne = jest.fn().mockResolvedValue(null);

      const result = await repository.findByCardNumberWithLock('inactive');

      expect(result).toBeNull();
    });
  });
});