import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserRepository } from './repositories/user.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from '../common/enums/user-role.enum';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs');

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: jest.Mocked<UserRepository>;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    password: 'hashedPassword',
    role: 'admin',
    organizationId: 1,
    isActive: true,
    organization: { id: 1, name: 'Test Org' },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockUserRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findActiveUsers: jest.fn(),
      findByIdOrFail: jest.fn(),
      findByEmail: jest.fn(),
      findByOrganization: jest.fn(),
      deactivateUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get(UserRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createUserDto: CreateUserDto = {
      email: 'newuser@example.com',
      firstName: 'Jane',
      lastName: 'Smith',
      password: 'password123',
      role: UserRole.ORGANIZATION_ADMIN,
      organizationId: 1,
    };

    it('should create a new user successfully', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.create.mockReturnValue(mockUser as any);
      userRepository.save.mockResolvedValue(mockUser as any);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      const result = await service.create(createUserDto);

      expect(userRepository.findByEmail).toHaveBeenCalledWith(createUserDto.email);
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(userRepository.create).toHaveBeenCalledWith({
        ...createUserDto,
        password: 'hashedPassword',
      });
      expect(userRepository.save).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockUser);
    });

    it('should throw ConflictException if user with email already exists', async () => {
      userRepository.findByEmail.mockResolvedValue(mockUser as any);

      await expect(service.create(createUserDto)).rejects.toThrow(ConflictException);
      expect(userRepository.findByEmail).toHaveBeenCalledWith(createUserDto.email);
      expect(userRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all active users', async () => {
      const activeUsers = [mockUser];
      userRepository.findActiveUsers.mockResolvedValue(activeUsers as any);

      const result = await service.findAll();

      expect(userRepository.findActiveUsers).toHaveBeenCalled();
      expect(result).toEqual(activeUsers);
    });
  });

  describe('findById', () => {
    it('should return user by id', async () => {
      userRepository.findByIdOrFail.mockResolvedValue(mockUser as any);

      const result = await service.findById(1);

      expect(userRepository.findByIdOrFail).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockUser);
    });
  });

  describe('findByEmail', () => {
    it('should return user by email', async () => {
      userRepository.findByEmail.mockResolvedValue(mockUser as any);

      const result = await service.findByEmail('test@example.com');

      expect(userRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(result).toEqual(mockUser);
    });
  });

  describe('findByOrganization', () => {
    it('should return users by organization id', async () => {
      const organizationUsers = [mockUser];
      userRepository.findByOrganization.mockResolvedValue(organizationUsers as any);

      const result = await service.findByOrganization(1);

      expect(userRepository.findByOrganization).toHaveBeenCalledWith(1);
      expect(result).toEqual(organizationUsers);
    });
  });

  describe('update', () => {
    const updateUserDto: UpdateUserDto = {
      firstName: 'Updated',
      lastName: 'Name',
    };

    it('should update user successfully', async () => {
      userRepository.findByIdOrFail.mockResolvedValue(mockUser as any);
      userRepository.save.mockResolvedValue({ ...mockUser, ...updateUserDto } as any);

      const result = await service.update(1, updateUserDto);

      expect(userRepository.findByIdOrFail).toHaveBeenCalledWith(1);
      expect(userRepository.save).toHaveBeenCalled();
      expect(result).toEqual({ ...mockUser, ...updateUserDto });
    });

    it('should throw ConflictException if email update conflicts', async () => {
      const updateWithEmail = { ...updateUserDto, email: 'conflict@example.com' };
      const existingUser = { ...mockUser, email: 'conflict@example.com' };
      
      userRepository.findByIdOrFail.mockResolvedValue(mockUser as any);
      userRepository.findByEmail.mockResolvedValue(existingUser as any);

      await expect(service.update(1, updateWithEmail)).rejects.toThrow(ConflictException);
      expect(userRepository.findByIdOrFail).toHaveBeenCalledWith(1);
      expect(userRepository.findByEmail).toHaveBeenCalledWith('conflict@example.com');
      expect(userRepository.save).not.toHaveBeenCalled();
    });

    it('should allow email update if email belongs to same user', async () => {
      const updateWithEmail = { ...updateUserDto, email: mockUser.email };
      
      userRepository.findByIdOrFail.mockResolvedValue(mockUser as any);
      userRepository.save.mockResolvedValue({ ...mockUser, ...updateWithEmail } as any);

      const result = await service.update(1, updateWithEmail);

      expect(userRepository.findByIdOrFail).toHaveBeenCalledWith(1);
      expect(userRepository.findByEmail).not.toHaveBeenCalled();
      expect(userRepository.save).toHaveBeenCalled();
      expect(result).toEqual({ ...mockUser, ...updateWithEmail });
    });
  });

  describe('remove', () => {
    it('should deactivate user', async () => {
      userRepository.deactivateUser.mockResolvedValue();

      await service.remove(1);

      expect(userRepository.deactivateUser).toHaveBeenCalledWith(1);
    });
  });
});