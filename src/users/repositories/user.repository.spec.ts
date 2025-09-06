import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRepository } from './user.repository';
import { User } from '../entities/user.entity';

describe('UserRepository', () => {
  let repository: UserRepository;
  let mockRepository: Partial<Repository<User>>;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'admin',
    organizationId: 1,
    isActive: true,
    organization: { id: 1, name: 'Test Org' },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRepository,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    repository = module.get<UserRepository>(UserRepository);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findByEmail', () => {
    it('should find user by email with organization relation', async () => {
      mockRepository.findOne = jest.fn().mockResolvedValue(mockUser);

      const result = await repository.findByEmail('test@example.com');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        relations: ['organization'],
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      mockRepository.findOne = jest.fn().mockResolvedValue(null);

      const result = await repository.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findByOrganization', () => {
    it('should find users by organization id with selected fields', async () => {
      mockRepository.find = jest.fn().mockResolvedValue([mockUser]);

      const result = await repository.findByOrganization(1);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { organizationId: 1 },
        relations: ['organization'],
        select: ['id', 'email', 'firstName', 'lastName', 'role', 'organizationId', 'isActive', 'createdAt', 'updatedAt'],
      });
      expect(result).toEqual([mockUser]);
    });
  });

  describe('findActiveUsers', () => {
    it('should find only active users', async () => {
      const activeUsers = [mockUser];
      mockRepository.find = jest.fn().mockResolvedValue(activeUsers);

      const result = await repository.findActiveUsers();

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { isActive: true },
        relations: ['organization'],
        select: ['id', 'email', 'firstName', 'lastName', 'role', 'organizationId', 'isActive', 'createdAt', 'updatedAt'],
      });
      expect(result).toEqual(activeUsers);
    });
  });

  describe('findByRole', () => {
    it('should find users by role', async () => {
      const adminUsers = [mockUser];
      mockRepository.find = jest.fn().mockResolvedValue(adminUsers);

      const result = await repository.findByRole('admin');

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { role: 'admin' },
        relations: ['organization'],
        select: ['id', 'email', 'firstName', 'lastName', 'role', 'organizationId', 'isActive', 'createdAt', 'updatedAt'],
      });
      expect(result).toEqual(adminUsers);
    });
  });

  describe('deactivateUser', () => {
    it('should deactivate user by setting isActive to false', async () => {
      mockRepository.update = jest.fn().mockResolvedValue({ affected: 1 });

      await repository.deactivateUser(1);

      expect(mockRepository.update).toHaveBeenCalledWith(1, { isActive: false });
    });
  });

  describe('findByIdWithRelations', () => {
    it('should find user by id with organization relation', async () => {
      mockRepository.findOne = jest.fn().mockResolvedValue(mockUser);

      const result = await repository.findByIdWithRelations(1);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['organization'],
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      mockRepository.findOne = jest.fn().mockResolvedValue(null);

      const result = await repository.findByIdWithRelations(999);

      expect(result).toBeNull();
    });
  });
});