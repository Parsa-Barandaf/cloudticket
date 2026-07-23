import { Module } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { TicketsResolver } from './tickets.resolver';
import { PrismaService } from '../common/prisma.service';

@Module({
  providers: [TicketsService, TicketsResolver, PrismaService],
})
export class TicketsModule {}
