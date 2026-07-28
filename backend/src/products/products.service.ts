import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { ActivitiesService } from '../activities/activities.service';
import { ProductStatus } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private activitiesService: ActivitiesService,
  ) {}

  async findAll() {
    return this.prisma.product.findMany({
      include: { connections: { include: { customer: true, product: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    return this.prisma.product.findUnique({
      where: { id },
      include: { connections: { include: { customer: true, product: true } } },
    });
  }

  async create(data: { name: string; category: string; description?: string; version?: string; logoColor?: string; logoInitials?: string }) {
    const product = await this.prisma.product.create({
      data,
      include: { connections: { include: { customer: true, product: true } } },
    });

    await this.activitiesService.create({
      type: 'product',
      title: 'محصول جدید اضافه شد',
      subtitle: `زیرسرویس ${data.name} به ساختار کاتالوگ اضافه گردید.`,
    });

    return product;
  }

  async update(id: string, data: { name?: string; category?: string; description?: string; version?: string; status?: ProductStatus; logoColor?: string; logoInitials?: string }) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new Error('Product not found');

    return this.prisma.product.update({
      where: { id },
      data,
      include: { connections: { include: { customer: true, product: true } } },
    });
  }

  async createConnection(data: {
    productId: string; customerId: string; startDate: string; endDate: string;
    activationKey: string; subscriptionType: string; licenseStatus?: string;
    userCount: number; notes?: string;
  }) {
    return this.prisma.productCustomerConnection.create({
      data: { ...data, startDate: new Date(data.startDate), endDate: new Date(data.endDate) },
      include: { customer: true, product: true },
    });
  }

  async deleteConnection(id: string) {
    const conn = await this.prisma.productCustomerConnection.findUnique({ where: { id } });
    if (!conn) throw new Error('Connection not found');
    return this.prisma.productCustomerConnection.delete({ where: { id } });
  }

  async updateConnection(id: string, data: {
    startDate?: string; endDate?: string; licenseStatus?: string;
    userCount?: number; subscriptionType?: string; activationKey?: string; notes?: string;
  }) {
    const conn = await this.prisma.productCustomerConnection.findUnique({ where: { id } });
    if (!conn) throw new Error('Connection not found');

    const updateData: any = { ...data };
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.endDate) updateData.endDate = new Date(data.endDate);

    return this.prisma.productCustomerConnection.update({
      where: { id },
      data: updateData,
      include: { customer: true, product: true },
    });
  }

  async findByCustomer(customerId: string) {
    return this.prisma.productCustomerConnection.findMany({
      where: { customerId },
      include: { customer: true, product: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async delete(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new Error('Product not found');

    await this.prisma.productCustomerConnection.deleteMany({ where: { productId: id } });
    await this.prisma.ticket.updateMany({ where: { productId: id }, data: { productId: null } });

    return this.prisma.product.delete({ where: { id } });
  }
}
