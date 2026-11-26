import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { RolesService } from '../roles/roles.service';
import { PrismaService } from '../common/prisma.service';

describe('AuthService', () => {
  let authService: AuthService;

  const usersService = {
    findByEmail: jest.fn(),
  };

  const jwtService = {
    sign: jest.fn(),
  };

  const rolesService = {
    getUserEffectivePermissions: jest.fn(),
  };

  const prismaService = {
    user: {
      update: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockUser = {
    id: 'user-1',
    email: 'admin@example.com',
    name: 'Admin',
    password: '',
    role: 'admin',
    isCustomer: false,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: RolesService, useValue: rolesService },
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);

    jwtService.sign.mockReturnValue('test-access-token');

    rolesService.getUserEffectivePermissions.mockResolvedValue({
      accessiblePortals: ['main'],
      permissions: [{ key: 'users.read' }],
    });

    prismaService.user.update.mockResolvedValue({});
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const passwordHash = await bcrypt.hash('password123', 10);

      usersService.findByEmail.mockResolvedValue({
        ...mockUser,
        password: passwordHash,
      });

      const result = await authService.login(
        'admin@example.com',
        'password123',
      );

      expect(usersService.findByEmail).toHaveBeenCalledWith(
        'admin@example.com',
      );

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          lastLoginAt: expect.any(Date),
        },
      });

      expect(jwtService.sign).toHaveBeenCalledWith(
        {
          sub: 'user-1',
          email: 'admin@example.com',
        },
        { expiresIn: '1d' },
      );

      expect(result.accessToken).toBe('test-access-token');
      expect(result.permissions).toEqual(['users.read']);
      expect(result.accessiblePortals).toEqual(['main']);
      expect(result.user.id).toBe('user-1');
    });

    it('should reject login when user does not exist', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        authService.login('unknown@example.com', 'password123'),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(prismaService.user.update).not.toHaveBeenCalled();
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('should reject login with incorrect password', async () => {
      const passwordHash = await bcrypt.hash('correct-password', 10);

      usersService.findByEmail.mockResolvedValue({
        ...mockUser,
        password: passwordHash,
      });

      await expect(
        authService.login('admin@example.com', 'wrong-password'),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(prismaService.user.update).not.toHaveBeenCalled();
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('should normalize email casing before looking up the user', async () => {
      const passwordHash = await bcrypt.hash('password123', 10);

      usersService.findByEmail.mockResolvedValue({
        ...mockUser,
        password: passwordHash,
      });

      await authService.login('  Admin@Example.COM  ', 'password123');

      expect(usersService.findByEmail).toHaveBeenCalledWith(
        'admin@example.com',
      );
    });

    it('should generate a 30-day token when rememberMe is enabled', async () => {
      const passwordHash = await bcrypt.hash('password123', 10);

      usersService.findByEmail.mockResolvedValue({
        ...mockUser,
        password: passwordHash,
      });

      await authService.login('admin@example.com', 'password123', true);

      expect(jwtService.sign).toHaveBeenCalledWith(
        {
          sub: 'user-1',
          email: 'admin@example.com',
        },
        { expiresIn: '30d' },
      );
    });
  });

  describe('register', () => {
    it('should reject registration when email already exists', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);

      await expect(
        authService.register('admin@example.com', 'password123', 'Admin'),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(prismaService.user.create).not.toHaveBeenCalled();
    });

    it('should register a new user with a hashed password', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      prismaService.user.create.mockImplementation(async ({ data }: any) => ({
        id: 'new-user',
        ...data,
        role: 'user',
        isCustomer: false,
      }));

      const result = await authService.register(
        'new@example.com',
        'password123',
        'New User',
      );

      const createCall = prismaService.user.create.mock.calls[0][0];

      expect(createCall.data.email).toBe('new@example.com');
      expect(createCall.data.name).toBe('New User');

      expect(createCall.data.password).not.toBe('password123');

      expect(
        await bcrypt.compare('password123', createCall.data.password),
      ).toBe(true);

      expect(result.accessToken).toBe('test-access-token');
      expect(result.user.id).toBe('new-user');
    });

    it('should store a normalized email when registering', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      prismaService.user.create.mockImplementation(async ({ data }: any) => ({
        id: 'new-user',
        ...data,
        role: 'user',
        isCustomer: false,
      }));

      await authService.register(
        '  New@Example.COM  ',
        'password123',
        'New User',
      );

      expect(usersService.findByEmail).toHaveBeenCalledWith('new@example.com');

      const createCall = prismaService.user.create.mock.calls[0][0];
      expect(createCall.data.email).toBe('new@example.com');
    });
  });
});
