import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateUserInput, UpdateUserInput } from '../common/dto/user.input';
import * as bcrypt from 'bcryptjs';

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

  async findByCompany(company: string) {
    return this.prisma.user.findMany({
      where: { company },
      include: { department: true, customRole: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(input: CreateUserInput) {
    if (input.isCustomer && !input.company) {
      throw new BadRequestException('برای کاربر مشتری، نام شرکت الزامی است.');
    }
    const hashed = await bcrypt.hash(input.password, 10);

    let customerId = input.customerId;
    if (!customerId && input.company) {
      const customer = await this.prisma.customer.findFirst({ where: { commercialName: input.company } });
      if (customer) customerId = customer.id;
    }

    return this.prisma.user.create({
      data: {
        email: input.email,
        password: hashed,
        name: input.name,
        phone: input.phone,
        company: input.company,
        isCustomer: input.isCustomer ?? false,
        ...(input.role && { role: input.role as any }),
        active: input.active ?? true,
        ...(customerId && { customer: { connect: { id: customerId } } }),
        ...(input.departmentId && { department: { connect: { id: input.departmentId } } }),
        ...(input.customRoleId && { customRole: { connect: { id: input.customRoleId } } }),
      },
      include: { department: true, customRole: true },
    });
  }

  async update(input: UpdateUserInput) {
    const existing = await this.prisma.user.findUnique({ where: { id: input.id } });
    if (!existing) throw new BadRequestException('User not found');
    const willBeCustomer = input.isCustomer ?? existing.isCustomer;
    const company = input.company ?? existing.company;
    if (willBeCustomer && !company) {
      throw new BadRequestException('برای کاربر مشتری، نام شرکت الزامی است.');
    }
    return this.prisma.user.update({
      where: { id: input.id },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.email !== undefined && { email: input.email }),
        ...(input.phone !== undefined && { phone: input.phone }),
        ...(input.company !== undefined && { company: input.company }),
        ...(input.isCustomer !== undefined && { isCustomer: input.isCustomer }),
        ...(input.role !== undefined && { role: input.role as any }),
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
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { customerProfile: true },
    });
    if (!user) throw new BadRequestException('User not found');
    if (user.customerProfile) {
      throw new BadRequestException('این کاربر به یک شرکت (مشتری) متصل است. ابتدا مشتری مربوطه را حذف کنید.');
    }
    await this.prisma.user.delete({ where: { id } });
    return true;
  }
}
