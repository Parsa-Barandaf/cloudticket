import {
  Injectable,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { ActivitiesService } from '../activities/activities.service';
import {
  CreateCustomerInput,
  UpdateCustomerInput,
} from '../common/dto/customer.input';

@Injectable()
export class CustomersService {
  constructor(
    private prisma: PrismaService,
    private activitiesService: ActivitiesService,
  ) {}

  private include() {
    return {
      user: true,
      tickets: true,
      employees: { select: { id: true } },
      connections: { include: { product: true, customer: true } },
    };
  }

  async findAll() {
    return this.prisma.customer.findMany({
      include: this.include(),
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    return this.prisma.customer.findUnique({
      where: { id },
      include: this.include(),
    });
  }

  async create(input: CreateCustomerInput) {
    const user = await this.prisma.user.findUnique({
      where: { id: input.userId },
    });
    if (!user) throw new BadRequestException('User not found');

    const existing = await this.prisma.customer.findUnique({
      where: { userId: input.userId },
    });
    if (existing)
      throw new ConflictException('User already has a customer profile');

    const customer = await this.prisma.customer.create({
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
      include: this.include(),
    });

    await this.activitiesService.create({
      type: 'customer',
      title: 'کاربر جدید ثبت شد',
      subtitle: `نماینده جدید ${input.commercialName || input.userId} به سامانه پیوست.`,
    });

    return customer;
  }

  async update(input: UpdateCustomerInput) {
    const existing = await this.prisma.customer.findUnique({
      where: { id: input.id },
    });
    if (!existing) throw new BadRequestException('Customer not found');

    return this.prisma.customer.update({
      where: { id: input.id },
      data: {
        ...(input.commercialName !== undefined && {
          commercialName: input.commercialName,
        }),
        ...(input.industry !== undefined && { industry: input.industry }),
        ...(input.phone !== undefined && { phone: input.phone }),
        ...(input.website !== undefined && { website: input.website }),
        ...(input.address !== undefined && { address: input.address }),
        ...(input.tier !== undefined && { tier: input.tier }),
        ...(input.status !== undefined && { status: input.status }),
      },
      include: this.include(),
    });
  }

  async delete(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: { tickets: { include: { messages: true } }, connections: true },
    });
    if (!customer) throw new BadRequestException('مشتری یافت نشد');

    const ticketIds = customer.tickets.map((t) => t.id);
    const messageIds = customer.tickets.flatMap((t) =>
      t.messages.map((m) => m.id),
    );
    const connectionIds = customer.connections.map((c) => c.id);

    await this.prisma.$transaction([
      ...(messageIds.length
        ? [
            this.prisma.ticketMessage.deleteMany({
              where: { id: { in: messageIds } },
            }),
          ]
        : []),
      ...(ticketIds.length
        ? [this.prisma.ticket.deleteMany({ where: { id: { in: ticketIds } } })]
        : []),
      ...(connectionIds.length
        ? [
            this.prisma.productCustomerConnection.deleteMany({
              where: { id: { in: connectionIds } },
            }),
          ]
        : []),
      this.prisma.customer.delete({ where: { id } }),
      this.prisma.user.deleteMany({ where: { id: customer.userId } }),
    ]);

    return true;
  }
}
