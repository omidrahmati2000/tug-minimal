import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { UserRole } from '../common/enums/user-role.enum';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: jest.Mocked<UsersService>;

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    password: 'hashedPassword',
    role: UserRole.ORGANIZATION_ADMIN,
    organizationId: 1,
    isActive: true,
    organization: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSuperAdmin: User = {
    id: 2,
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

  beforeEach(async () => {
    const mockUsersService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      findByOrganization: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createUserDto: CreateUserDto = {
        email: 'newuser@example.com',
        firstName: 'New',
        lastName: 'User',
        password: 'password123',
        role: UserRole.ORGANIZATION_ADMIN,
        organizationId: 1,
      };

      const expectedUser = { ...mockUser, ...createUserDto, id: 3 };
      usersService.create.mockResolvedValue(expectedUser as any);

      const result = await controller.create(createUserDto);

      expect(usersService.create).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual(expectedUser);
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const users = [mockUser, mockSuperAdmin];
      usersService.findAll.mockResolvedValue(users as any);

      const result = await controller.findAll();

      expect(usersService.findAll).toHaveBeenCalled();
      expect(result).toEqual(users);
    });
  });

  describe('findOne', () => {
    it('should allow super admin to access any user', async () => {
      usersService.findById.mockResolvedValue(mockUser as any);

      const result = await controller.findOne('1', mockSuperAdmin);

      expect(usersService.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockUser);
    });

    it('should allow user to access their own profile', async () => {
      usersService.findById.mockResolvedValue(mockUser as any);

      const result = await controller.findOne('1', mockUser);

      expect(usersService.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockUser);
    });

    it('should allow org admin to access users from their organization', async () => {
      const orgUsers = [mockUser];
      const orgAdmin: User = { ...mockUser, id: 5, role: UserRole.ORGANIZATION_ADMIN, organizationId: 1 };
      usersService.findByOrganization.mockResolvedValue(orgUsers as any);

      const result = await controller.findOne('3', orgAdmin);

      expect(usersService.findByOrganization).toHaveBeenCalledWith(1);
      expect(result).toEqual(orgUsers);
    });

    it('should return current user if no special access', async () => {
      const regularUser: User = { ...mockUser, id: 5, organizationId: null };
      usersService.findById.mockResolvedValue(regularUser as any);

      const result = await controller.findOne('3', regularUser);

      expect(usersService.findById).toHaveBeenCalledWith(5);
      expect(result).toEqual(regularUser);
    });

    it('should handle string to number conversion for id', async () => {
      usersService.findById.mockResolvedValue(mockUser as any);

      await controller.findOne('123', mockSuperAdmin);

      expect(usersService.findById).toHaveBeenCalledWith(123);
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const updateUserDto: UpdateUserDto = {
        firstName: 'Updated',
        lastName: 'Name',
      };

      const updatedUser = { ...mockUser, ...updateUserDto };
      usersService.update.mockResolvedValue(updatedUser as any);

      const result = await controller.update('1', updateUserDto);

      expect(usersService.update).toHaveBeenCalledWith(1, updateUserDto);
      expect(result).toEqual(updatedUser);
    });

    it('should handle string to number conversion for update', async () => {
      const updateUserDto: UpdateUserDto = { firstName: 'Test' };
      usersService.update.mockResolvedValue(mockUser as any);

      await controller.update('456', updateUserDto);

      expect(usersService.update).toHaveBeenCalledWith(456, updateUserDto);
    });
  });

  describe('remove', () => {
    it('should deactivate a user', async () => {
      usersService.remove.mockResolvedValue();

      await controller.remove('1');

      expect(usersService.remove).toHaveBeenCalledWith(1);
    });

    it('should handle string to number conversion for removal', async () => {
      usersService.remove.mockResolvedValue();

      await controller.remove('789');

      expect(usersService.remove).toHaveBeenCalledWith(789);
    });
  });
});