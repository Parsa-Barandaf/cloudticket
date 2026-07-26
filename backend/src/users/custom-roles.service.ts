import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateCustomRoleInput, UpdateCustomRoleInput, DeleteCustomRoleInput } from '../common/dto/custom-role.input';

@Injectable()
export class CustomRolesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.customRole.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findById(id: string) {
    return this.prisma.customRole.findUnique({ where: { id } });
  }

  async create(input: CreateCustomRoleInput) {
    return this.prisma.customRole.create({
      data: {
        name: input.name,
        description: input.description,
        permissions: input.permissions,
      },
    });
  }

  async update(input: UpdateCustomRoleInput) {
    return this.prisma.customRole.update({
      where: { id: input.id },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.permissions !== undefined && { permissions: input.permissions }),
      },
    });
  }

  async delete(input: DeleteCustomRoleInput) {
    const role = await this.prisma.customRole.findUnique({ where: { id: input.id } });
    if (!role) throw new BadRequestException('Custom role not found');

    if (input.reassignRoleId) {
      const target = await this.prisma.customRole.findUnique({ where: { id: input.reassignRoleId } });
      if (!target) throw new BadRequestException('Replacement role not found');
      await this.prisma.user.updateMany({
        where: { customRoleId: input.id },
        data: { customRoleId: input.reassignRoleId },
      });
    } else {
      await this.prisma.user.updateMany({
        where: { customRoleId: input.id },
        data: { customRoleId: null },
      });
    }

    await this.prisma.customRole.delete({ where: { id: input.id } });
    return true;
  }
}
