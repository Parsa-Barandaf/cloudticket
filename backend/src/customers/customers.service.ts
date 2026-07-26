import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateCustomerInput } from '../common/dto/customer.input';

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

  async create(input: CreateCustomerInput) {
    const user = await this.prisma.user.findUnique({ where: { id: input.userId } });
    if (!user) throw new BadRequestException('User not found');

    const existing = await this.prisma.customer.findUnique({ where: { userId: input.userId } });
    if (existing) throw new ConflictException('User already has a customer profile');

    return this.prisma.customer.create({
      data: {
        industry: input.industry,
        commercialName: input.commercialName,
        phone: input.phone,
        website: input.website,
        address: input.address,
        tier: input.tier ?? 'BRONZE',
        status: input.status ?? 'ACTIVE',
        userId: input.userId,
      },
      include: { user: true, tickets: true, connections: { include: { product: true } } },
    });
  }
}
