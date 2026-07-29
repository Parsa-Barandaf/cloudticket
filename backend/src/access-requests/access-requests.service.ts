import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AccessRequestsService {
  constructor(private prisma: PrismaService) {}

  async create(data: { name: string; companyName: string; email: string; phone: string; industry?: string }) {
    const existingUser = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) throw new ConflictException('این ایمیل قبلاً ثبت‌نام شده است');

    const existingRequest = await this.prisma.accessRequest.findFirst({
      where: { email: data.email, status: { in: ['PENDING', 'APPROVED'] } },
    });
    if (existingRequest) {
      if (existingRequest.status === 'PENDING') {
        throw new ConflictException('درخواست ثبت‌نام با این ایمیل در انتظار تأیید است');
      }
      throw new ConflictException('درخواست ثبت‌نام با این ایمیل قبلاً تأیید شده است');
    }

    return this.prisma.accessRequest.create({ data });
  }

  async findAll() {
    return this.prisma.accessRequest.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findPending() {
    return this.prisma.accessRequest.findMany({ where: { status: 'PENDING' }, orderBy: { createdAt: 'desc' } });
  }

  async approve(id: string, industry?: string) {
    const request = await this.prisma.accessRequest.findUnique({ where: { id } });
    if (!request) throw new BadRequestException('Access request not found');
    if (request.status !== 'PENDING') throw new BadRequestException('Request is already ' + request.status.toLowerCase());

    const existingUser = await this.prisma.user.findUnique({ where: { email: request.email } });
    if (existingUser) throw new ConflictException('A user with this email already exists');

    const hashed = await bcrypt.hash('123456', 10);
    const user = await this.prisma.user.create({
      data: { email: request.email, password: hashed, name: request.name, role: 'ADMIN', isCustomer: true, phone: request.phone, company: request.companyName },
    });

    const customer = await this.prisma.customer.create({
      data: {
        industry: industry || request.industry || 'سایر',
        commercialName: request.companyName,
        phone: request.phone,
        userId: user.id,
        status: 'ACTIVE',
      },
    });

    await this.prisma.user.update({
      where: { id: user.id },
      data: { customerId: customer.id },
    });

    return this.prisma.accessRequest.update({ where: { id }, data: { status: 'APPROVED' } });
  }

  async reject(id: string) {
    const request = await this.prisma.accessRequest.findUnique({ where: { id } });
    if (!request) throw new BadRequestException('Access request not found');
    if (request.status !== 'PENDING') throw new BadRequestException('Request is already ' + request.status.toLowerCase());

    return this.prisma.accessRequest.update({ where: { id }, data: { status: 'REJECTED' } });
  }
}
