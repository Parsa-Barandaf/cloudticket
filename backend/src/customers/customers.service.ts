import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.customer.findMany({
      include: { user: true, tickets: true, connections: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    return this.prisma.customer.findUnique({
      where: { id },
      include: { user: true, tickets: true, connections: { include: { product: true } } },
    });
  }
}
