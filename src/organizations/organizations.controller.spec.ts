import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { UpdateBalanceDto } from './dto/update-balance.dto';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../common/enums/user-role.enum';
import { Organization } from './entities/organization.entity';

describe('OrganizationsController', () => {
  let controller: OrganizationsController;
  let organizationsService: jest.Mocked<OrganizationsService>;

  const mockOrganization: Organization = {
    id: 1,
    name: 'Test Organization',
    code: 'TEST001',
    balance: 10000,
    isActive: true,
    users: [],
    cards: [],
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
    const mockOrganizationsService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      updateBalance: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrganizationsController],
      providers: [
        {
          provide: OrganizationsService,
          useValue: mockOrganizationsService,
        },
      ],
    }).compile();

    controller = module.get<OrganizationsController>(OrganizationsController);
    organizationsService = module.get(OrganizationsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new organization', async () => {
      const createOrganizationDto: CreateOrganizationDto = {
        name: 'New Organization',
        code: 'NEW001',
        balance: 15000,
      };

      const expectedOrg = { ...mockOrganization, ...createOrganizationDto, id: 2 };
      organizationsService.create.mockResolvedValue(expectedOrg as any);

      const result = await controller.create(createOrganizationDto);

      expect(organizationsService.create).toHaveBeenCalledWith(createOrganizationDto);
      expect(result).toEqual(expectedOrg);
    });
  });

  describe('findAll', () => {
    it('should return all organizations', async () => {
      const organizations = [mockOrganization];
      organizationsService.findAll.mockResolvedValue(organizations as any);

      const result = await controller.findAll();

      expect(organizationsService.findAll).toHaveBeenCalled();
      expect(result).toEqual(organizations);
    });
  });

  describe('findOne', () => {
    it('should allow super admin to access any organization', async () => {
      organizationsService.findOne.mockResolvedValue(mockOrganization as any);

      const result = await controller.findOne('1', mockSuperAdmin);

      expect(organizationsService.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockOrganization);
    });

    it('should allow org admin to access their own organization', async () => {
      organizationsService.findOne.mockResolvedValue(mockOrganization as any);

      const result = await controller.findOne('1', mockOrgAdmin);

      expect(organizationsService.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockOrganization);
    });

    it('should deny access to different organization for org admin', () => {
      expect(() => controller.findOne('2', mockOrgAdmin)).toThrow(
        'Access denied: You can only access your own organization'
      );

      expect(organizationsService.findOne).not.toHaveBeenCalled();
    });

    it('should handle string to number conversion', async () => {
      organizationsService.findOne.mockResolvedValue(mockOrganization as any);

      await controller.findOne('123', mockSuperAdmin);

      expect(organizationsService.findOne).toHaveBeenCalledWith(123);
    });
  });

  describe('update', () => {
    it('should update an organization', async () => {
      const updateOrganizationDto: UpdateOrganizationDto = {
        name: 'Updated Organization',
      };

      const updatedOrg = { ...mockOrganization, ...updateOrganizationDto };
      organizationsService.update.mockResolvedValue(updatedOrg as any);

      const result = await controller.update('1', updateOrganizationDto);

      expect(organizationsService.update).toHaveBeenCalledWith(1, updateOrganizationDto);
      expect(result).toEqual(updatedOrg);
    });

    it('should handle string to number conversion for update', async () => {
      const updateDto: UpdateOrganizationDto = { name: 'Test' };
      organizationsService.update.mockResolvedValue(mockOrganization as any);

      await controller.update('456', updateDto);

      expect(organizationsService.update).toHaveBeenCalledWith(456, updateDto);
    });
  });

  describe('updateBalance', () => {
    it('should update organization balance', async () => {
      const updateBalanceDto: UpdateBalanceDto = {
        balance: 20000,
      };

      const updatedOrg = { ...mockOrganization, balance: 20000 };
      organizationsService.updateBalance.mockResolvedValue(updatedOrg as any);

      const result = await controller.updateBalance('1', updateBalanceDto);

      expect(organizationsService.updateBalance).toHaveBeenCalledWith(1, updateBalanceDto);
      expect(result).toEqual(updatedOrg);
    });

    it('should handle string to number conversion for balance update', async () => {
      const updateBalanceDto: UpdateBalanceDto = { balance: 5000 };
      organizationsService.updateBalance.mockResolvedValue(mockOrganization as any);

      await controller.updateBalance('789', updateBalanceDto);

      expect(organizationsService.updateBalance).toHaveBeenCalledWith(789, updateBalanceDto);
    });
  });

  describe('remove', () => {
    it('should deactivate an organization', async () => {
      organizationsService.remove.mockResolvedValue();

      await controller.remove('1');

      expect(organizationsService.remove).toHaveBeenCalledWith(1);
    });

    it('should handle string to number conversion for removal', async () => {
      organizationsService.remove.mockResolvedValue();

      await controller.remove('999');

      expect(organizationsService.remove).toHaveBeenCalledWith(999);
    });
  });
});