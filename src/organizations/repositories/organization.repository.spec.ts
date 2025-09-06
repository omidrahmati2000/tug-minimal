import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrganizationRepository } from './organization.repository';
import { Organization } from '../entities/organization.entity';

describe('OrganizationRepository', () => {
  let repository: OrganizationRepository;
  let mockRepository: Partial<Repository<Organization>>;

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
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationRepository,
        {
          provide: getRepositoryToken(Organization),
          useValue: mockRepository,
        },
      ],
    }).compile();

    repository = module.get<OrganizationRepository>(OrganizationRepository);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findByCode', () => {
    it('should find organization by code with relations', async () => {
      mockRepository.findOne = jest.fn().mockResolvedValue(mockOrganization);

      const result = await repository.findByCode('TEST001');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { code: 'TEST001' },
        relations: ['users', 'cards'],
      });
      expect(result).toEqual(mockOrganization);
    });

    it('should return null if organization not found', async () => {
      mockRepository.findOne = jest.fn().mockResolvedValue(null);

      const result = await repository.findByCode('NONEXISTENT');

      expect(result).toBeNull();
    });
  });

  describe('findWithRelations', () => {
    it('should find organization by id with all relations', async () => {
      mockRepository.findOne = jest.fn().mockResolvedValue(mockOrganization);

      const result = await repository.findWithRelations(1);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['users', 'cards', 'transactions'],
      });
      expect(result).toEqual(mockOrganization);
    });
  });

  describe('findActiveOrganizations', () => {
    it('should find only active organizations', async () => {
      const activeOrgs = [mockOrganization];
      mockRepository.find = jest.fn().mockResolvedValue(activeOrgs);

      const result = await repository.findActiveOrganizations();

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { isActive: true },
        relations: ['users', 'cards'],
      });
      expect(result).toEqual(activeOrgs);
    });
  });

  describe('deductBalance', () => {
    it('should deduct balance using query builder', async () => {
      const mockQueryBuilder = mockRepository.createQueryBuilder();

      await repository.deductBalance(1, 100);

      expect(mockRepository.createQueryBuilder).toHaveBeenCalled();
      expect(mockQueryBuilder.update).toHaveBeenCalledWith(Organization);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('id = :organizationId', { organizationId: 1 });
      expect(mockQueryBuilder.execute).toHaveBeenCalled();
    });
  });

  describe('updateBalance', () => {
    it('should update balance', async () => {
      mockRepository.update = jest.fn().mockResolvedValue({ affected: 1 });

      await repository.updateBalance(1, 2000);

      expect(mockRepository.update).toHaveBeenCalledWith(1, {
        balance: 2000,
        updatedAt: expect.any(Date),
      });
    });
  });

  describe('deactivateOrganization', () => {
    it('should deactivate organization', async () => {
      mockRepository.update = jest.fn().mockResolvedValue({ affected: 1 });

      await repository.deactivateOrganization(1);

      expect(mockRepository.update).toHaveBeenCalledWith(1, { isActive: false });
    });
  });

  describe('findAllWithRelations', () => {
    it('should find all organizations with relations', async () => {
      const allOrgs = [mockOrganization];
      mockRepository.find = jest.fn().mockResolvedValue(allOrgs);

      const result = await repository.findAllWithRelations();

      expect(mockRepository.find).toHaveBeenCalledWith({
        relations: ['users', 'cards'],
      });
      expect(result).toEqual(allOrgs);
    });
  });
});