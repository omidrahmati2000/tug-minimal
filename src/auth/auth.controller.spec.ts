import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../common/enums/user-role.enum';
import { LoginDto } from './dto/login.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

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

  const mockLoginResult = {
    access_token: 'jwt-token-here',
    user: {
      id: 1,
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: UserRole.ORGANIZATION_ADMIN,
      organizationId: 1,
    },
  };

  beforeEach(async () => {
    const mockAuthService = {
      validateUser: jest.fn(),
      login: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should return access token and user info on successful login', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      authService.validateUser.mockResolvedValue(mockUser);
      authService.login.mockResolvedValue(mockLoginResult);

      const result = await controller.login(loginDto);

      expect(authService.login).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockLoginResult);
      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe(mockUser.email);
    });

    it('should pass user from guard to auth service', async () => {
      const loginDto: LoginDto = {
        email: 'admin@test.com',
        password: 'admin123',
      };

      const adminUser: User = {
        ...mockUser,
        email: 'admin@test.com',
        role: UserRole.SUPER_ADMIN,
      };

      const adminLoginResult = {
        ...mockLoginResult,
        user: {
          ...mockLoginResult.user,
          email: 'admin@test.com',
          role: UserRole.SUPER_ADMIN,
        },
      };

      authService.validateUser.mockResolvedValue(adminUser);
      authService.login.mockResolvedValue(adminLoginResult);

      const result = await controller.login(loginDto);

      expect(authService.login).toHaveBeenCalledWith(adminUser);
      expect(result.user.email).toBe('admin@test.com');
      expect(result.user.role).toBe(UserRole.SUPER_ADMIN);
    });

    it('should handle different user roles', async () => {
      const loginDto: LoginDto = {
        email: 'super@admin.com',
        password: 'super123',
      };

      const superAdminUser: User = {
        ...mockUser,
        email: 'super@admin.com',
        role: UserRole.SUPER_ADMIN,
        organizationId: null,
      };

      const superAdminResult = {
        access_token: 'super-admin-token',
        user: {
          id: 1,
          email: 'super@admin.com',
          firstName: 'Super',
          lastName: 'Admin',
          role: UserRole.SUPER_ADMIN,
          organizationId: null,
        },
      };

      authService.validateUser.mockResolvedValue(superAdminUser);
      authService.login.mockResolvedValue(superAdminResult);

      const result = await controller.login(loginDto);

      expect(authService.login).toHaveBeenCalledWith(superAdminUser);
      expect(result.user.role).toBe(UserRole.SUPER_ADMIN);
      expect(result.user.organizationId).toBeNull();
    });

    it('should handle organization admin login', async () => {
      const loginDto: LoginDto = {
        email: 'org@admin.com',
        password: 'org123',
      };

      const orgAdminUser: User = {
        ...mockUser,
        email: 'org@admin.com',
        organizationId: 5,
      };

      const orgAdminResult = {
        access_token: 'org-admin-token',
        user: {
          id: 1,
          email: 'org@admin.com',
          firstName: 'John',
          lastName: 'Doe',
          role: UserRole.ORGANIZATION_ADMIN,
          organizationId: 5,
        },
      };

      authService.validateUser.mockResolvedValue(orgAdminUser);
      authService.login.mockResolvedValue(orgAdminResult);

      const result = await controller.login(loginDto);

      expect(authService.login).toHaveBeenCalledWith(orgAdminUser);
      expect(result.user.organizationId).toBe(5);
    });
  });
});