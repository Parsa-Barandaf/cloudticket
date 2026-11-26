import {
  Injectable,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { ActivitiesService } from '../activities/activities.service';
import * as bcrypt from 'bcryptjs';
import { normalizeEmail } from '../common/utils/email';

@Injectable()
export class AccessRequestsService {
  constructor(
    private prisma: PrismaService,
    private activitiesService: ActivitiesService,
  ) {}

  async create(data: {
    name: string;
    companyName: string;
    email: string;
    phone: string;
    industry?: string;
  }) {
    const email = normalizeEmail(data.email);
    const existingUser = await this.prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
    });
    if (existingUser)
      throw new ConflictException('این ایمیل قبلاً ثبت‌نام شده است');

    const existingRequest = await this.prisma.accessRequest.findFirst({
      where: {
        email: { equals: email, mode: 'insensitive' },
        status: { in: ['PENDING', 'APPROVED'] },
      },
    });
    if (existingRequest) {
      if (existingRequest.status === 'PENDING') {
        throw new ConflictException(
          'درخواست ثبت‌نام با این ایمیل در انتظار تأیید است',
        );
      }
      throw new ConflictException(
        'درخواست ثبت‌نام با این ایمیل قبلاً تأیید شده است',
      );
    }

    return this.prisma.accessRequest.create({ data: { ...data, email } });
  }

  async findAll() {
    return this.prisma.accessRequest.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findPending() {
    return this.prisma.accessRequest.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approve(id: string, industry?: string) {
    const request = await this.prisma.accessRequest.findUnique({
      where: { id },
    });
    if (!request) throw new BadRequestException('Access request not found');
    if (request.status !== 'PENDING')
      throw new BadRequestException(
        'Request is already ' + request.status.toLowerCase(),
      );

    const email = normalizeEmail(request.email);
    const existingUser = await this.prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
    });
    if (existingUser)
      throw new ConflictException('A user with this email already exists');

    const hashed = await bcrypt.hash('123456', 10);
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashed,
        name: request.name,
        role: 'ADMIN',
        isCustomer: true,
        phone: request.phone,
        company: request.companyName,
      },
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

    await this.activitiesService.create({
      type: 'customer',
      title: 'مشتری جدید تأیید شد',
      subtitle: `«${request.companyName}» از طریق درخواست دسترسی به سامانه پیوست.`,
    });

    return this.prisma.accessRequest.update({
      where: { id },
      data: { status: 'APPROVED' },
    });
  }

  async reject(id: string) {
    const request = await this.prisma.accessRequest.findUnique({
      where: { id },
    });
    if (!request) throw new BadRequestException('Access request not found');
    if (request.status !== 'PENDING')
      throw new BadRequestException(
        'Request is already ' + request.status.toLowerCase(),
      );

    return this.prisma.accessRequest.update({
      where: { id },
      data: { status: 'REJECTED' },
    });
  }
}
