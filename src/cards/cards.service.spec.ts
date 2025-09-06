import { Test, TestingModule } from '@nestjs/testing';
import { CardsService } from './cards.service';
import { CardRepository } from './repositories/card.repository';
import { Card } from './entities/card.entity';
import { CreateCardDto } from './dto/create-card.dto';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('CardsService', () => {
  let service: CardsService;
  let cardRepository: CardRepository;

  const mockCard: Card = {
    id: 1,
    cardNumber: '1234567890123456',
    holderName: 'John Doe',
    dailyLimit: 500,
    monthlyLimit: 10000,
    dailyUsage: 100,
    monthlyUsage: 2000,
    lastUsageDate: new Date('2024-01-15'),
    lastMonthReset: new Date('2024-01-01'),
    organizationId: 1,
    organization: null,
    transactions: [],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CardsService,
        {
          provide: CardRepository,
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findAllWithRelations: jest.fn(),
            findByOrganization: jest.fn(),
            findByIdOrFail: jest.fn(),
            findByCardNumber: jest.fn(),
            deactivateCard: jest.fn(),
            resetDailyUsage: jest.fn(),
            resetMonthlyUsage: jest.fn(),
            updateUsage: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CardsService>(CardsService);
    cardRepository = module.get<CardRepository>(CardRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createCardDto: CreateCardDto = {
      cardNumber: '1234567890123456',
      holderName: 'John Doe',
      dailyLimit: 500,
      monthlyLimit: 10000,
      organizationId: 1,
    };

    it('should create a new card', async () => {
      jest.spyOn(cardRepository, 'findByCardNumber').mockResolvedValue(null);
      jest.spyOn(cardRepository, 'create').mockReturnValue(mockCard);
      jest.spyOn(cardRepository, 'save').mockResolvedValue(mockCard);

      const result = await service.create(createCardDto);

      expect(result).toEqual(mockCard);
      expect(cardRepository.create).toHaveBeenCalledWith({
        ...createCardDto,
        lastUsageDate: expect.any(Date),
        lastMonthReset: expect.any(Date),
      });
    });

    it('should throw ConflictException if card number exists', async () => {
      jest.spyOn(cardRepository, 'findByCardNumber').mockResolvedValue(mockCard);

      await expect(service.create(createCardDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findOne', () => {
    it('should return a card by ID', async () => {
      jest.spyOn(cardRepository, 'findByIdOrFail').mockResolvedValue(mockCard);

      const result = await service.findOne(1);

      expect(result).toEqual(mockCard);
    });

    it('should throw NotFoundException if card not found', async () => {
      jest.spyOn(cardRepository, 'findByIdOrFail').mockRejectedValue(new NotFoundException());

      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('canProcessTransaction', () => {
    it('should allow transaction within limits (same day)', async () => {
      const today = new Date();
      const cardWithTodayUsage = {
        ...mockCard,
        lastUsageDate: today,
        dailyUsage: 100,
        monthlyUsage: 2000,
        dailyLimit: 500,
        monthlyLimit: 10000,
      };

      const result = await service.canProcessTransaction(cardWithTodayUsage, 200);

      expect(result.canProcess).toBe(true);
    });

    it('should allow transaction with reset daily usage (new day)', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const cardWithYesterdayUsage = {
        ...mockCard,
        lastUsageDate: yesterday,
        dailyUsage: 400, // This should be reset
        monthlyUsage: 2000,
        dailyLimit: 500,
        monthlyLimit: 10000,
      };

      const result = await service.canProcessTransaction(cardWithYesterdayUsage, 200);

      expect(result.canProcess).toBe(true);
    });

    it('should reject transaction when daily limit exceeded', async () => {
      const today = new Date();
      const cardAtDailyLimit = {
        ...mockCard,
        lastUsageDate: today,
        dailyUsage: 450,
        dailyLimit: 500,
        monthlyLimit: 10000,
      };

      const result = await service.canProcessTransaction(cardAtDailyLimit, 100);

      expect(result.canProcess).toBe(false);
      expect(result.reason).toBe('Daily limit exceeded');
    });

    it('should reject transaction when monthly limit exceeded', async () => {
      const today = new Date();
      const cardAtMonthlyLimit = {
        ...mockCard,
        lastUsageDate: today,
        lastMonthReset: today,
        dailyUsage: 100,
        monthlyUsage: 9500,
        dailyLimit: 1000,
        monthlyLimit: 10000,
      };

      const result = await service.canProcessTransaction(cardAtMonthlyLimit, 600);

      expect(result.canProcess).toBe(false);
      expect(result.reason).toBe('Monthly limit exceeded');
    });

    it('should reset monthly usage for new month', async () => {
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      
      const cardFromLastMonth = {
        ...mockCard,
        lastUsageDate: new Date(),
        lastMonthReset: lastMonth,
        dailyUsage: 100,
        monthlyUsage: 9000, // This should be reset
        dailyLimit: 500,
        monthlyLimit: 10000,
      };

      const result = await service.canProcessTransaction(cardFromLastMonth, 200);

      expect(result.canProcess).toBe(true);
    });
  });
});