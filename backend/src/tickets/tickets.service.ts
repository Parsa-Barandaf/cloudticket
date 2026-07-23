import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { TicketPriority, TicketStatus } from '@prisma/client';

@Injectable()
export class TicketsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.ticket.findMany({
      include: { customer: true, product: true, assignedTo: true, messages: true },
      orderBy: { date: 'desc' },
    });
  }

  async findById(id: string) {
    return this.prisma.ticket.findUnique({
      where: { id },
      include: { customer: true, product: true, assignedTo: true, messages: true },
    });
  }

  async create(data: {
    title: string;
    priority: TicketPriority;
    customerId: string;
    productId?: string;
    assignedToId?: string;
  }) {
    return this.prisma.ticket.create({
      data,
      include: { customer: true, product: true, assignedTo: true },
    });
  }

  async updateStatus(id: string, status: TicketStatus) {
    return this.prisma.ticket.update({
      where: { id },
      data: { status },
    });
  }
}
