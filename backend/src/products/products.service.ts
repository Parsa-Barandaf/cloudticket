import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { ProductStatus } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.product.findMany({
      include: { connections: { include: { customer: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    return this.prisma.product.findUnique({
      where: { id },
      include: { connections: { include: { customer: true } } },
    });
  }

  async create(data: { name: string; category: string; description?: string; version?: string; logoColor?: string; logoInitials?: string }) {
    return this.prisma.product.create({
      data,
      include: { connections: { include: { customer: true } } },
    });
  }

  async update(id: string, data: { name?: string; category?: string; description?: string; version?: string; status?: ProductStatus; logoColor?: string; logoInitials?: string }) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new Error('Product not found');

    return this.prisma.product.update({
      where: { id },
      data,
      include: { connections: { include: { customer: true } } },
    });
  }

  async delete(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new Error('Product not found');

    await this.prisma.productCustomerConnection.deleteMany({ where: { productId: id } });
    await this.prisma.ticket.updateMany({ where: { productId: id }, data: { productId: null } });

    return this.prisma.product.delete({ where: { id } });
  }
}
