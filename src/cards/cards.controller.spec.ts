import { Test, TestingModule } from '@nestjs/testing';
import { CardsController } from './cards.controller';
import { CardsService } from './cards.service';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { UpdateCardLimitsDto } from './dto/update-card-limits.dto';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../common/enums/user-role.enum';
import { Card } from './entities/card.entity';

describe('CardsController', () => {
  let controller: CardsController;
  let cardsService: jest.Mocked<CardsService>;

  const mockCard: Card = {
    id: 1,
    cardNumber: '1234567890123456',
    holderName: 'John Doe',
    organizationId: 1,
    isActive: true,
    dailyUsage: 100,
    monthlyUsage: 1000,
    dailyLimit: 500,
    monthlyLimit: 5000,
    lastUsageDate: new Date(),
    lastMonthReset: new Date(),
    organization: null,
    transactions: [],
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
    const mockCardsService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findByOrganization: jest.fn(),
      findOne: jest.fn(),
      checkAccess: jest.fn(),
      update: jest.fn(),
      updateLimits: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CardsController],
      providers: [
        {
          provide: CardsService,
          useValue: mockCardsService,
        },
      ],
    }).compile();

    controller = module.get<CardsController>(CardsController);
    cardsService = module.get(CardsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a card with super admin', async () => {
      const createCardDto: CreateCardDto = {
        cardNumber: '9876543210987654',
        holderName: 'Jane Doe',
        organizationId: 2,
        dailyLimit: 600,
        monthlyLimit: 6000,
      };

      const expectedCard = { ...mockCard, ...createCardDto, id: 2 };
      cardsService.create.mockResolvedValue(expectedCard as any);

      const result = await controller.create(createCardDto, mockSuperAdmin);

      expect(cardsService.create).toHaveBeenCalledWith(createCardDto);
      expect(result).toEqual(expectedCard);
    });

    it('should set organization ID for org admin', async () => {
      const createCardDto: CreateCardDto = {
        cardNumber: '9876543210987654',
        holderName: 'Jane Doe',
        organizationId: 5, // This should be overridden
        dailyLimit: 600,
        monthlyLimit: 6000,
      };

      const expectedCard = { ...mockCard, ...createCardDto, organizationId: 1, id: 2 };
      cardsService.create.mockResolvedValue(expectedCard as any);

      await controller.create(createCardDto, mockOrgAdmin);

      expect(createCardDto.organizationId).toBe(1); // Should be set to org admin's org ID
      expect(cardsService.create).toHaveBeenCalledWith(createCardDto);
    });
  });

  describe('findAll', () => {
    it('should return all cards', async () => {
      const cards = [mockCard];
      cardsService.findAll.mockResolvedValue(cards as any);

      const result = await controller.findAll();

      expect(cardsService.findAll).toHaveBeenCalled();
      expect(result).toEqual(cards);
    });
  });

  describe('findByOrganization', () => {
    it('should allow super admin to access any organization cards', async () => {
      const cards = [mockCard];
      cardsService.findByOrganization.mockResolvedValue(cards as any);

      const result = await controller.findByOrganization('1', mockSuperAdmin);

      expect(cardsService.findByOrganization).toHaveBeenCalledWith(1);
      expect(result).toEqual(cards);
    });

    it('should allow org admin to access their own organization cards', async () => {
      const cards = [mockCard];
      cardsService.findByOrganization.mockResolvedValue(cards as any);

      const result = await controller.findByOrganization('1', mockOrgAdmin);

      expect(cardsService.findByOrganization).toHaveBeenCalledWith(1);
      expect(result).toEqual(cards);
    });

    it('should deny access to different organization for org admin', () => {
      expect(() => controller.findByOrganization('2', mockOrgAdmin)).toThrow(
        'Access denied: You can only access cards from your organization'
      );

      expect(cardsService.findByOrganization).not.toHaveBeenCalled();
    });

    it('should handle string to number conversion', async () => {
      cardsService.findByOrganization.mockResolvedValue([mockCard] as any);

      await controller.findByOrganization('123', mockSuperAdmin);

      expect(cardsService.findByOrganization).toHaveBeenCalledWith(123);
    });
  });

  describe('findOne', () => {
    it('should allow super admin to access any card', async () => {
      cardsService.findOne.mockResolvedValue(mockCard as any);

      const result = await controller.findOne('1', mockSuperAdmin);

      expect(cardsService.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockCard);
    });

    it('should check access for organization admin', async () => {
      cardsService.checkAccess.mockResolvedValue(mockCard as any);

      const result = await controller.findOne('1', mockOrgAdmin);

      expect(cardsService.checkAccess).toHaveBeenCalledWith(1, 1);
      expect(result).toEqual(mockCard);
    });

    it('should handle string to number conversion', async () => {
      cardsService.findOne.mockResolvedValue(mockCard as any);

      await controller.findOne('456', mockSuperAdmin);

      expect(cardsService.findOne).toHaveBeenCalledWith(456);
    });
  });

  describe('update', () => {
    it('should update card for super admin without access check', async () => {
      const updateCardDto: UpdateCardDto = {
        holderName: 'Updated Name',
      };

      const updatedCard = { ...mockCard, ...updateCardDto };
      cardsService.update.mockResolvedValue(updatedCard as any);

      const result = await controller.update('1', updateCardDto, mockSuperAdmin);

      expect(cardsService.checkAccess).not.toHaveBeenCalled();
      expect(cardsService.update).toHaveBeenCalledWith(1, updateCardDto);
      expect(result).toEqual(updatedCard);
    });

    it('should check access for organization admin before update', async () => {
      const updateCardDto: UpdateCardDto = {
        holderName: 'Updated Name',
      };

      const updatedCard = { ...mockCard, ...updateCardDto };
      cardsService.checkAccess.mockResolvedValue(mockCard as any);
      cardsService.update.mockResolvedValue(updatedCard as any);

      const result = await controller.update('1', updateCardDto, mockOrgAdmin);

      expect(cardsService.checkAccess).toHaveBeenCalledWith(1, 1);
      expect(cardsService.update).toHaveBeenCalledWith(1, updateCardDto);
      expect(result).toEqual(updatedCard);
    });

    it('should handle string to number conversion', async () => {
      const updateDto: UpdateCardDto = { holderName: 'Test' };
      cardsService.update.mockResolvedValue(mockCard as any);

      await controller.update('789', updateDto, mockSuperAdmin);

      expect(cardsService.update).toHaveBeenCalledWith(789, updateDto);
    });
  });

  describe('updateLimits', () => {
    it('should update limits for super admin without access check', async () => {
      const updateLimitsDto: UpdateCardLimitsDto = {
        dailyLimit: 1000,
        monthlyLimit: 10000,
      };

      const updatedCard = { ...mockCard, ...updateLimitsDto };
      cardsService.updateLimits.mockResolvedValue(updatedCard as any);

      const result = await controller.updateLimits('1', updateLimitsDto, mockSuperAdmin);

      expect(cardsService.checkAccess).not.toHaveBeenCalled();
      expect(cardsService.updateLimits).toHaveBeenCalledWith(1, updateLimitsDto);
      expect(result).toEqual(updatedCard);
    });

    it('should check access for organization admin before updating limits', async () => {
      const updateLimitsDto: UpdateCardLimitsDto = {
        dailyLimit: 1000,
        monthlyLimit: 10000,
      };

      const updatedCard = { ...mockCard, ...updateLimitsDto };
      cardsService.checkAccess.mockResolvedValue(mockCard as any);
      cardsService.updateLimits.mockResolvedValue(updatedCard as any);

      const result = await controller.updateLimits('1', updateLimitsDto, mockOrgAdmin);

      expect(cardsService.checkAccess).toHaveBeenCalledWith(1, 1);
      expect(cardsService.updateLimits).toHaveBeenCalledWith(1, updateLimitsDto);
      expect(result).toEqual(updatedCard);
    });

    it('should handle string to number conversion for limits', async () => {
      const updateLimitsDto: UpdateCardLimitsDto = { dailyLimit: 500 };
      cardsService.updateLimits.mockResolvedValue(mockCard as any);

      await controller.updateLimits('999', updateLimitsDto, mockSuperAdmin);

      expect(cardsService.updateLimits).toHaveBeenCalledWith(999, updateLimitsDto);
    });
  });

  describe('remove', () => {
    it('should remove card for super admin without access check', async () => {
      cardsService.remove.mockResolvedValue();

      await controller.remove('1', mockSuperAdmin);

      expect(cardsService.checkAccess).not.toHaveBeenCalled();
      expect(cardsService.remove).toHaveBeenCalledWith(1);
    });

    it('should check access for organization admin before removal', async () => {
      cardsService.checkAccess.mockResolvedValue(mockCard as any);
      cardsService.remove.mockResolvedValue();

      await controller.remove('1', mockOrgAdmin);

      expect(cardsService.checkAccess).toHaveBeenCalledWith(1, 1);
      expect(cardsService.remove).toHaveBeenCalledWith(1);
    });

    it('should handle string to number conversion for removal', async () => {
      cardsService.remove.mockResolvedValue();

      await controller.remove('111', mockSuperAdmin);

      expect(cardsService.remove).toHaveBeenCalledWith(111);
    });
  });
});