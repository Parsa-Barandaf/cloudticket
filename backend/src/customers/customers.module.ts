import { Module } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CustomersResolver } from './customers.resolver';
import { PrismaService } from '../common/prisma.service';

@Module({
  providers: [CustomersService, CustomersResolver, PrismaService],
})
export class CustomersModule {}
