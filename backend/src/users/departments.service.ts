import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import {
  CreateDepartmentInput,
  UpdateDepartmentInput,
} from '../common/dto/department.input';

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.department.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findById(id: string) {
    return this.prisma.department.findUnique({ where: { id } });
  }

  async create(input: CreateDepartmentInput) {
    return this.prisma.department.create({
      data: {
        name: input.name,
        lead: input.lead,
        icon: input.icon ?? 'Users2',
        color: input.color ?? 'indigo',
        assignedProducts: input.assignedProducts ?? [],
      },
    });
  }

  async update(input: UpdateDepartmentInput) {
    return this.prisma.department.update({
      where: { id: input.id },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.lead !== undefined && { lead: input.lead }),
        ...(input.icon !== undefined && { icon: input.icon }),
        ...(input.color !== undefined && { color: input.color }),
        ...(input.assignedProducts !== undefined && {
          assignedProducts: input.assignedProducts,
        }),
      },
    });
  }

  async delete(id: string) {
    await this.prisma.user.updateMany({
      where: { departmentId: id },
      data: { departmentId: null },
    });
    await this.prisma.department.delete({ where: { id } });
    return true;
  }
}
