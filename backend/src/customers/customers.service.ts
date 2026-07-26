import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateCustomerInput, UpdateCustomerInput } from '../common/dto/customer.input';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.customer.findMany({
      include: { user: true, tickets: true, connections: { include: { product: true, customer: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    return this.prisma.customer.findUnique({
      where: { id },
      include: { user: true, tickets: true, connections: { include: { product: true, customer: true } } },
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
      include: { user: true, tickets: true, connections: { include: { product: true, customer: true } } },
    });
  }

  async update(input: UpdateCustomerInput) {
    const existing = await this.prisma.customer.findUnique({ where: { id: input.id } });
    if (!existing) throw new BadRequestException('Customer not found');

    return this.prisma.customer.update({
      where: { id: input.id },
      data: {
        ...(input.commercialName !== undefined && { commercialName: input.commercialName }),
        ...(input.industry !== undefined && { industry: input.industry }),
        ...(input.phone !== undefined && { phone: input.phone }),
        ...(input.website !== undefined && { website: input.website }),
        ...(input.address !== undefined && { address: input.address }),
        ...(input.tier !== undefined && { tier: input.tier }),
        ...(input.status !== undefined && { status: input.status }),
      },
      include: { user: true, tickets: true, connections: { include: { product: true, customer: true } } },
    });
  }
}
