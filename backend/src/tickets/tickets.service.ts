import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { TicketPriority, TicketStatus } from '@prisma/client';

@Injectable()
export class TicketsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.ticket.findMany({
      include: { customer: { include: { user: true } }, product: true, assignedTo: true, messages: { orderBy: { createdAt: 'asc' } } },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findById(id: string) {
    return this.prisma.ticket.findUnique({
      where: { id },
      include: { customer: { include: { user: true } }, product: true, assignedTo: true, messages: { orderBy: { createdAt: 'asc' } } },
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
      include: { customer: { include: { user: true } }, product: true, assignedTo: true, messages: { orderBy: { createdAt: 'asc' } } },
    });
  }

  async update(data: {
    id: string;
    title?: string;
    priority?: TicketPriority;
    status?: string;
    assignedToId?: string;
    productId?: string;
  }) {
    const existing = await this.prisma.ticket.findUnique({ where: { id: data.id } });
    if (!existing) throw new BadRequestException('Ticket not found');

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.status !== undefined) updateData.status = data.status as TicketStatus;
    if (data.assignedToId !== undefined) {
      updateData.assignedTo = data.assignedToId ? { connect: { id: data.assignedToId } } : { disconnect: true };
    }
    if (data.productId !== undefined) {
      updateData.product = data.productId ? { connect: { id: data.productId } } : { disconnect: true };
    }
    if (data.status === 'RESOLVED') updateData.resolvedAt = new Date();
    if (data.status === 'CLOSED') updateData.closedAt = new Date();

    return this.prisma.ticket.update({
      where: { id: data.id },
      data: updateData,
      include: { customer: { include: { user: true } }, product: true, assignedTo: true, messages: { orderBy: { createdAt: 'asc' } } },
    });
  }

  async updateStatus(id: string, status: TicketStatus) {
    return this.prisma.ticket.update({
      where: { id },
      data: { status },
    });
  }

  async createMessage(data: {
    ticketId: string;
    text: string;
    senderName: string;
    isInternal?: boolean;
    authorId?: string;
    authorType?: string;
  }) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id: data.ticketId } });
    if (!ticket) throw new BadRequestException('Ticket not found');

    const msg = await this.prisma.ticketMessage.create({
      data: {
        text: data.text,
        senderName: data.senderName,
        isInternal: data.isInternal ?? false,
        ticketId: data.ticketId,
        authorId: data.authorId,
        authorType: data.authorType,
      },
    });

    // Touch updatedAt on parent ticket
    await this.prisma.ticket.update({
      where: { id: data.ticketId },
      data: {},
    });

    return msg;
  }

  async updateMessage(id: string, text: string) {
    const existing = await this.prisma.ticketMessage.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('TicketMessage not found');

    return this.prisma.ticketMessage.update({
      where: { id },
      data: { text },
    });
  }

  async deleteMessage(id: string) {
    const existing = await this.prisma.ticketMessage.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('TicketMessage not found');

    await this.prisma.ticketMessage.delete({ where: { id } });
    return true;
  }

  async delete(id: string) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id } });
    if (!ticket) throw new BadRequestException('Ticket not found');

    await this.prisma.ticketMessage.deleteMany({ where: { ticketId: id } });
    await this.prisma.ticket.delete({ where: { id } });
    return true;
  }

  async deleteMany(ids: string[]) {
    await this.prisma.ticketMessage.deleteMany({ where: { ticketId: { in: ids } } });
    await this.prisma.ticket.deleteMany({ where: { id: { in: ids } } });
    return true;
  }
}
