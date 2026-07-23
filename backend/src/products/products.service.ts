import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

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

  async create(data: { name: string; category: string; description?: string; version?: string }) {
    return this.prisma.product.create({ data });
  }
}
