import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { RolesService } from '../roles/roles.service';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private rolesService: RolesService,
    private prisma: PrismaService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return this.generateToken(user);
  }

  async register(email: string, password: string, name: string) {
    const existing = await this.usersService.findByEmail(email);
    if (existing) throw new ConflictException('Email already registered');

    const hashed = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: { email, password: hashed, name },
    });

    return this.generateToken(user);
  }

  private async generateToken(user: { id: string; email: string; name: string; role: string; isCustomer: boolean }) {
    const payload = { sub: user.id, email: user.email };
    const effective = await this.rolesService.getUserEffectivePermissions(user.id);
    return {
      accessToken: this.jwtService.sign(payload),
      accessiblePortals: effective.accessiblePortals,
      permissions: effective.permissions.map((p: { key: string }) => p.key),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isCustomer: user.isCustomer,
      },
    };
  }
}
