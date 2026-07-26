import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateUserInput, UpdateUserInput } from '../common/dto/user.input';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findAll() {
    return this.prisma.user.findMany({
      include: { department: true, customRole: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(input: CreateUserInput) {
    return this.prisma.user.create({
      data: {
        email: input.email,
        password: input.password,
        name: input.name,
        phone: input.phone,
        company: input.company,
        active: input.active ?? true,
        ...(input.departmentId && { department: { connect: { id: input.departmentId } } }),
        ...(input.customRoleId && { customRole: { connect: { id: input.customRoleId } } }),
      },
      include: { department: true, customRole: true },
    });
  }

  async update(input: UpdateUserInput) {
    return this.prisma.user.update({
      where: { id: input.id },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.email !== undefined && { email: input.email }),
        ...(input.phone !== undefined && { phone: input.phone }),
        ...(input.company !== undefined && { company: input.company }),
        ...(input.active !== undefined && { active: input.active }),
        ...(input.departmentId !== undefined && {
          department: input.departmentId ? { connect: { id: input.departmentId } } : { disconnect: true },
        }),
        ...(input.customRoleId !== undefined && {
          customRole: input.customRoleId ? { connect: { id: input.customRoleId } } : { disconnect: true },
        }),
      },
      include: { department: true, customRole: true },
    });
  }

  async delete(id: string) {
    await this.prisma.user.delete({ where: { id } });
    return true;
  }
}
