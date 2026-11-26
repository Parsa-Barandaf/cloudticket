import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

import { UsersService } from './users.service';
import { PrismaService } from '../common/prisma.service';
import { ActivitiesService } from '../activities/activities.service';

describe('UsersService', () => {
  let usersService: UsersService;

  const prismaService = {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    customer: {
      findFirst: jest.fn(),
    },
    userRoleAssignment: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      upsert: jest.fn(),
    },
    role: {
      findUnique: jest.fn(),
    },
  };

  const activitiesService = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
        {
          provide: ActivitiesService,
          useValue: activitiesService,
        },
      ],
    }).compile();

    usersService = module.get<UsersService>(UsersService);
  });

  describe('findByEmail', () => {
    it('should find user with case-insensitive email', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'admin@example.com',
        userRoles: [
          {
            role: {
              id: 'role-admin',
              name: 'Admin',
            },
          },
        ],
      };

      prismaService.user.findFirst.mockResolvedValue(mockUser);

      const result = await usersService.findByEmail('  ADMIN@EXAMPLE.COM  ');

      expect(prismaService.user.findFirst).toHaveBeenCalledWith({
        where: {
          email: {
            equals: 'admin@example.com',
            mode: 'insensitive',
          },
        },
        include: expect.any(Object),
      });

      expect(result.id).toBe('user-1');
      expect(result.userRoles).toEqual([
        {
          id: 'role-admin',
          name: 'Admin',
        },
      ]);
    });

    it('should return null when user does not exist', async () => {
      prismaService.user.findFirst.mockResolvedValue(null);

      const result = await usersService.findByEmail('unknown@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should find user by ID', async () => {
      prismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'admin@example.com',
        userRoles: [],
      });

      const result = await usersService.findById('user-1');

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        include: expect.any(Object),
      });

      expect(result.id).toBe('user-1');
      expect(result.userRoles).toEqual([]);
    });

    it('should return null when user does not exist', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      const result = await usersService.findById('unknown');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should reject customer creation without company', async () => {
      await expect(
        usersService.create({
          email: 'customer@example.com',
          password: 'Password123',
          name: 'Customer',
          isCustomer: true,
        } as any),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(prismaService.user.create).not.toHaveBeenCalled();
    });

    it('should reject weak passwords', async () => {
      await expect(
        usersService.create({
          email: 'user@example.com',
          password: 'weak',
          name: 'User',
          isCustomer: false,
        } as any),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(prismaService.user.create).not.toHaveBeenCalled();
    });

    it('should hash password before storing user', async () => {
      const createdUser = {
        id: 'new-user',
        email: 'new@example.com',
        name: 'New User',
        userRoles: [],
      };

      prismaService.user.create.mockResolvedValue(createdUser);
      prismaService.userRoleAssignment.findMany.mockResolvedValue([]);
      prismaService.user.findUnique.mockResolvedValue(createdUser);

      const result = await usersService.create({
        email: 'new@example.com',
        password: 'Password123',
        name: 'New User',
        isCustomer: false,
      } as any);

      const createCall = prismaService.user.create.mock.calls[0][0];
      const storedPassword = createCall.data.password;

      expect(storedPassword).not.toBe('Password123');

      expect(await bcrypt.compare('Password123', storedPassword)).toBe(true);

      expect(result.id).toBe('new-user');
      expect(activitiesService.create).toHaveBeenCalled();
    });
  });
});
