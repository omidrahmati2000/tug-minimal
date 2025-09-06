import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { OrganizationRepository } from './repositories/organization.repository';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { UpdateBalanceDto } from './dto/update-balance.dto';

describe('OrganizationsService', () => {
  let service: OrganizationsService;
  let organizationRepository: jest.Mocked<OrganizationRepository>;

  const mockOrganization = {
    id: 1,
    name: 'Test Organization',
    code: 'TEST001',
    balance: 1000,
    isActive: true,
    users: [],
    cards: [],
    transactions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockOrganizationRepository = {
      findByCode: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      findAllWithRelations: jest.fn(),
      findByIdOrFail: jest.fn(),
      updateBalance: jest.fn(),
      deactivateOrganization: jest.fn(),
      deductBalance: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationsService,
        {
          provide: OrganizationRepository,
          useValue: mockOrganizationRepository,
        },
      ],
    }).compile();

    service = module.get<OrganizationsService>(OrganizationsService);
    organizationRepository = module.get(OrganizationRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createOrganizationDto: CreateOrganizationDto = {
      name: 'New Organization',
      code: 'NEW001',
      balance: 5000,
    };

    it('should create a new organization successfully', async () => {
      organizationRepository.findByCode.mockResolvedValue(null);
      organizationRepository.create.mockReturnValue(mockOrganization as any);
      organizationRepository.save.mockResolvedValue(mockOrganization as any);

      const result = await service.create(createOrganizationDto);

      expect(organizationRepository.findByCode).toHaveBeenCalledWith(createOrganizationDto.code);
      expect(organizationRepository.create).toHaveBeenCalledWith({
        ...createOrganizationDto,
        balance: createOrganizationDto.balance,
      });
      expect(organizationRepository.save).toHaveBeenCalledWith(mockOrganization);
      expect(result).toEqual(mockOrganization);
    });

    it('should create organization with default balance 0 if not provided', async () => {
      const dtoWithoutBalance = { name: 'New Org', code: 'NEW002' };
      organizationRepository.findByCode.mockResolvedValue(null);
      organizationRepository.create.mockReturnValue(mockOrganization as any);
      organizationRepository.save.mockResolvedValue(mockOrganization as any);

      await service.create(dtoWithoutBalance);

      expect(organizationRepository.create).toHaveBeenCalledWith({
        ...dtoWithoutBalance,
        balance: 0,
      });
    });

    it('should throw ConflictException if organization code already exists', async () => {
      organizationRepository.findByCode.mockResolvedValue(mockOrganization as any);

      await expect(service.create(createOrganizationDto)).rejects.toThrow(ConflictException);
      expect(organizationRepository.findByCode).toHaveBeenCalledWith(createOrganizationDto.code);
      expect(organizationRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all organizations with relations', async () => {
      const allOrganizations = [mockOrganization];
      organizationRepository.findAllWithRelations.mockResolvedValue(allOrganizations as any);

      const result = await service.findAll();

      expect(organizationRepository.findAllWithRelations).toHaveBeenCalled();
      expect(result).toEqual(allOrganizations);
    });
  });

  describe('findOne', () => {
    it('should return organization by id', async () => {
      organizationRepository.findByIdOrFail.mockResolvedValue(mockOrganization as any);

      const result = await service.findOne(1);

      expect(organizationRepository.findByIdOrFail).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockOrganization);
    });
  });

  describe('findByCode', () => {
    it('should return organization by code', async () => {
      organizationRepository.findByCode.mockResolvedValue(mockOrganization as any);

      const result = await service.findByCode('TEST001');

      expect(organizationRepository.findByCode).toHaveBeenCalledWith('TEST001');
      expect(result).toEqual(mockOrganization);
    });
  });

  describe('update', () => {
    const updateOrganizationDto: UpdateOrganizationDto = {
      name: 'Updated Organization',
    };

    it('should update organization successfully', async () => {
      organizationRepository.findByIdOrFail.mockResolvedValue(mockOrganization as any);
      organizationRepository.save.mockResolvedValue({ ...mockOrganization, ...updateOrganizationDto } as any);

      const result = await service.update(1, updateOrganizationDto);

      expect(organizationRepository.findByIdOrFail).toHaveBeenCalledWith(1);
      expect(organizationRepository.save).toHaveBeenCalled();
      expect(result).toEqual({ ...mockOrganization, ...updateOrganizationDto });
    });

    it('should throw ConflictException if code update conflicts', async () => {
      const updateWithCode = { ...updateOrganizationDto, code: 'CONFLICT001' };
      const existingOrg = { ...mockOrganization, code: 'CONFLICT001' };
      
      organizationRepository.findByIdOrFail.mockResolvedValue(mockOrganization as any);
      organizationRepository.findByCode.mockResolvedValue(existingOrg as any);

      await expect(service.update(1, updateWithCode)).rejects.toThrow(ConflictException);
      expect(organizationRepository.findByIdOrFail).toHaveBeenCalledWith(1);
      expect(organizationRepository.findByCode).toHaveBeenCalledWith('CONFLICT001');
      expect(organizationRepository.save).not.toHaveBeenCalled();
    });

    it('should allow code update if code belongs to same organization', async () => {
      const updateWithCode = { ...updateOrganizationDto, code: mockOrganization.code };
      
      organizationRepository.findByIdOrFail.mockResolvedValue(mockOrganization as any);
      organizationRepository.save.mockResolvedValue({ ...mockOrganization, ...updateWithCode } as any);

      const result = await service.update(1, updateWithCode);

      expect(organizationRepository.findByIdOrFail).toHaveBeenCalledWith(1);
      expect(organizationRepository.findByCode).not.toHaveBeenCalled();
      expect(organizationRepository.save).toHaveBeenCalled();
      expect(result).toEqual({ ...mockOrganization, ...updateWithCode });
    });
  });

  describe('updateBalance', () => {
    it('should update organization balance', async () => {
      const updateBalanceDto: UpdateBalanceDto = { balance: 2000 };
      const updatedOrg = { ...mockOrganization, balance: 2000 };
      
      organizationRepository.updateBalance.mockResolvedValue();
      organizationRepository.findByIdOrFail.mockResolvedValue(updatedOrg as any);

      const result = await service.updateBalance(1, updateBalanceDto);

      expect(organizationRepository.updateBalance).toHaveBeenCalledWith(1, updateBalanceDto.balance);
      expect(organizationRepository.findByIdOrFail).toHaveBeenCalledWith(1);
      expect(result).toEqual(updatedOrg);
    });
  });

  describe('remove', () => {
    it('should deactivate organization', async () => {
      organizationRepository.deactivateOrganization.mockResolvedValue();

      await service.remove(1);

      expect(organizationRepository.deactivateOrganization).toHaveBeenCalledWith(1);
    });
  });

  describe('deductBalance', () => {
    it('should deduct balance from organization', async () => {
      organizationRepository.deductBalance.mockResolvedValue();

      await service.deductBalance(1, 500);

      expect(organizationRepository.deductBalance).toHaveBeenCalledWith(1, 500);
    });
  });
});