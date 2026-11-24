import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(limit?: number, includeArchived = false) {
    return this.prisma.notification.findMany({
      where: includeArchived ? {} : { archived: false },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async findById(id: string) {
    return this.prisma.notification.findUnique({ where: { id } });
  }

  async create(data: {
    title: string;
    description: string;
    type: string;
    priority?: string;
    authorName?: string;
    authorAvatarBg?: string;
    detailedContent?: string;
    linkedType?: string;
    linkedId?: string;
    linkedName?: string;
  }) {
    return this.prisma.notification.create({
      data: {
        title: data.title,
        description: data.description,
        type: data.type,
        priority: data.priority ?? 'normal',
        authorName: data.authorName,
        authorAvatarBg: data.authorAvatarBg,
        detailedContent: data.detailedContent,
        linkedType: data.linkedType,
        linkedId: data.linkedId,
        linkedName: data.linkedName,
      },
    });
  }

  async markRead(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  }

  async markAllRead() {
    await this.prisma.notification.updateMany({
      where: { read: false },
      data: { read: true },
    });
    return true;
  }

  async toggleArchive(id: string) {
    const existing = await this.prisma.notification.findUnique({
      where: { id },
    });
    if (!existing) return null;
    return this.prisma.notification.update({
      where: { id },
      data: { archived: !existing.archived },
    });
  }

  async delete(id: string) {
    await this.prisma.notification.delete({ where: { id } });
    return true;
  }

  async deleteMany(ids: string[]) {
    await this.prisma.notification.deleteMany({ where: { id: { in: ids } } });
    return true;
  }
}
