import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { ActivitiesService } from '../activities/activities.service';
import { CreateUserInput, UpdateUserInput } from '../common/dto/user.input';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private activitiesService: ActivitiesService,
  ) {}

  private include() {
    return {
      department: true,
      userRoles: {
        include: {
          role: {
            include: {
              rolePermissions: { include: { permission: true } },
              portals: { include: { portal: true } },
            },
          },
        },
      },
    };
  }

  private mapUser(user: any) {
    return {
      ...user,
      userRoles: (user.userRoles ?? []).map((ur: any) => ur.role),
    };
  }

  async findByEmail(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email }, include: this.include() });
    return user ? this.mapUser(user) : null;
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id }, include: this.include() });
    return user ? this.mapUser(user) : null;
  }

  async findAll() {
    const users = await this.prisma.user.findMany({
      include: this.include(),
      orderBy: { createdAt: 'desc' },
    });
    return users.map((u: any) => this.mapUser(u));
  }

  async findByCompany(company: string) {
    const users = await this.prisma.user.findMany({
      where: { company },
      include: this.include(),
      orderBy: { createdAt: 'desc' },
    });
    return users.map((u: any) => this.mapUser(u));
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

    const user = await this.prisma.user.create({
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
      },
      include: this.include(),
    });

    await this.assignRoleForUser(user.id, input.isCustomer ?? false, input.role, input.roleId);

    await this.activitiesService.create({
      type: 'customer',
      title: 'کاربر جدید اضافه شد',
      subtitle: `${input.name} به سامانه اضافه شد.`,
    });

    const withRoles = await this.prisma.user.findUnique({ where: { id: user.id }, include: this.include() });
    return this.mapUser(withRoles);
  }

  async update(input: UpdateUserInput) {
    const existing = await this.prisma.user.findUnique({ where: { id: input.id } });
    if (!existing) throw new BadRequestException('User not found');
    const willBeCustomer = input.isCustomer ?? existing.isCustomer;
    const company = input.company ?? existing.company;
    if (willBeCustomer && !company) {
      throw new BadRequestException('برای کاربر مشتری، نام شرکت الزامی است.');
    }
    const updated = await this.prisma.user.update({
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
      },
      include: this.include(),
    });

    if (
      input.isCustomer !== undefined ||
      input.role !== undefined ||
      input.roleId !== undefined
    ) {
      await this.assignRoleForUser(
        input.id,
        input.isCustomer ?? existing.isCustomer,
        input.role ?? existing.role,
        input.roleId !== undefined ? input.roleId : undefined,
      );
    }

    const withRoles = await this.prisma.user.findUnique({ where: { id: input.id }, include: this.include() });
    return this.mapUser(withRoles);
  }

  private async assignRoleForUser(userId: string, isCustomer: boolean, role?: string, roleId?: string | null) {
    const oldAssignments = await this.prisma.userRoleAssignment.findMany({
      where: { userId },
      include: { role: true },
    });
    const oldRoleIds = oldAssignments.map(a => a.role.id);

    let newRoleId: string | null = null;

    if (isCustomer) {
      const roleName = role === 'ADMIN' ? 'Customer Admin' : 'Customer User';
      const customerRole = await this.prisma.role.findUnique({ where: { id: roleName === 'Customer Admin' ? 'role-customer-admin' : 'role-customer-user' } });
      newRoleId = customerRole?.id ?? null;
    } else if (roleId) {
      const roleRow = await this.prisma.role.findUnique({ where: { id: roleId } });
      if (roleRow) newRoleId = roleRow.id;
    }

    for (const oldId of oldRoleIds) {
      if (newRoleId !== oldId) {
        await this.prisma.userRoleAssignment.deleteMany({ where: { userId, roleId: oldId } });
      }
    }

    if (newRoleId) {
      await this.prisma.userRoleAssignment.upsert({
        where: { roleId_userId: { roleId: newRoleId, userId } },
        update: {},
        create: { roleId: newRoleId, userId },
      });
    }
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
