import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class ActivitiesService {
  constructor(private prisma: PrismaService) {}

  async findAll(limit = 20) {
    return this.prisma.activity.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async create(data: { type: string; title: string; subtitle: string }) {
    return this.prisma.activity.create({ data });
  }
}
