import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';
import 'dotenv/config';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const hashed = await bcrypt.hash('123456', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@sahab.ir' },
    update: {},
    create: { email: 'admin@sahab.ir', password: hashed, name: 'مدیر سامانه', role: 'ADMIN' },
  });
  const agent1 = await prisma.user.upsert({
    where: { email: 'rezaei@sahab.ir' },
    update: {},
    create: { email: 'rezaei@sahab.ir', password: hashed, name: 'امیرحسین رضایی', role: 'AGENT' },
  });
  const agent2 = await prisma.user.upsert({
    where: { email: 'mousavi@sahab.ir' },
    update: {},
    create: { email: 'mousavi@sahab.ir', password: hashed, name: 'زهرا موسوی', role: 'AGENT' },
  });
  const agent3 = await prisma.user.upsert({
    where: { email: 'alavi@sahab.ir' },
    update: {},
    create: { email: 'alavi@sahab.ir', password: hashed, name: 'علی علوی', role: 'AGENT' },
  });
  const agent4 = await prisma.user.upsert({
    where: { email: 'akbari@sahab.ir' },
    update: {},
    create: { email: 'akbari@sahab.ir', password: hashed, name: 'مریم اکبری', role: 'AGENT' },
  });
  const custUser = await prisma.user.upsert({
    where: { email: 'a.karimi@ariasecurity.ir' },
    update: {},
    create: { email: 'a.karimi@ariasecurity.ir', password: hashed, name: 'مهندس آرش کریمی', role: 'CUSTOMER' },
  });

  const cust1 = await prisma.customer.upsert({
    where: { userId: custUser.id },
    update: {},
    create: {
      userId: custUser.id,
      industry: 'امنیت سایبری',
      commercialName: 'توسعه امنیت آریا',
      phone: '۰۲۱-۸۸۲۲۳۳۹۹',
      website: 'www.ariasecurity.ir',
      address: 'تهران، پارک فناوری پردیس، خیابان نوآوری ۱۲',
      tier: 'GOLD',
      status: 'ACTIVE',
      usersCount: 23,
      activeProductsCount: 5,
      partnershipStartDate: new Date('2021-07-15'),
    },
  });

  const products = await Promise.all([
    prisma.product.upsert({
      where: { id: 'prod-csp' },
      update: {},
      create: {
        id: 'prod-csp', name: 'Cloud Security Platform', category: 'امنیت ابری',
        description: 'سامانه هوشمند و یکپارچه پایش امنیت', version: 'v2.4.1',
        status: 'ACTIVE', clientsCount: 42, logoInitials: 'CS', logoColor: 'from-blue-500 to-indigo-600',
      },
    }),
    prisma.product.upsert({
      where: { id: 'prod-ips' },
      update: {},
      create: {
        id: 'prod-ips', name: 'Identity Protection Server', category: 'مدیریت دسترسی',
        description: 'سیستم پیشرفته مدیریت دسترسی', version: 'v3.1.2',
        status: 'ACTIVE', clientsCount: 28, logoInitials: 'IP', logoColor: 'from-emerald-500 to-teal-600',
      },
    }),
    prisma.product.upsert({
      where: { id: 'prod-ecn' },
      update: {},
      create: {
        id: 'prod-ecn', name: 'Elastic Compute Node', category: 'زیرساخت پردازشی',
        description: 'چارچوب توزیع‌شده برای پردازش‌های سنگین ابری', version: 'v5.0.1',
        status: 'ACTIVE', clientsCount: 19, logoInitials: 'EC', logoColor: 'from-rose-500 to-orange-500',
      },
    }),
    prisma.product.upsert({
      where: { id: 'prod-cdn' },
      update: {},
      create: {
        id: 'prod-cdn', name: 'Global Edge CDN', category: 'شبکه توزیع محتوا',
        description: 'شبکه توزیع محتوای بین‌المللی', version: 'v2.0.0',
        status: 'ACTIVE', clientsCount: 35, logoInitials: 'GC', logoColor: 'from-purple-500 to-pink-500',
      },
    }),
  ]);

  await Promise.all([
    prisma.ticket.create({
      data: { title: 'قطع متناوب گره‌های مانیتورینگ شعبه پردیس', priority: 'CRITICAL', status: 'OPEN', customerId: cust1.id, productId: products[0].id, assignedToId: agent1.id },
    }),
    prisma.ticket.create({
      data: { title: 'درخواست بازنگری در سقف ترافیک وب‌هوک‌ها', priority: 'HIGH', status: 'INVESTIGATING', customerId: cust1.id, productId: products[1].id, assignedToId: agent2.id },
    }),
    prisma.ticket.create({
      data: { title: 'خطای عدم همگام‌سازی امضای امنیتی کلاینت', priority: 'CRITICAL', status: 'INVESTIGATING', customerId: cust1.id, productId: products[2].id, assignedToId: agent1.id },
    }),
    prisma.ticket.create({
      data: { title: 'سوال در مورد پیکربندی SSL و گواهی TLS گره‌ها', priority: 'MEDIUM', status: 'AWAITING_CUSTOMER', customerId: cust1.id, productId: products[0].id, assignedToId: agent3.id },
    }),
    prisma.ticket.create({
      data: { title: 'درخواست ارتقای لایسنس به نسخه Enterprise', priority: 'LOW', status: 'OPEN', customerId: cust1.id, productId: products[3].id, assignedToId: agent4.id },
    }),
  ]);

  await prisma.activity.createMany({
    data: [
      { type: 'ticket', title: 'تیکت جدید ایجاد شد', subtitle: 'تیکت قطعی گره‌ها توسط مشتری ثبت شد' },
      { type: 'reply', title: 'پاسخ جدید دریافت شد', subtitle: 'پشتیبان به تیکت پاسخ داد' },
      { type: 'product', title: 'محصول جدید اضافه شد', subtitle: 'API وب‌هوک به کاتالوگ اضافه شد' },
      { type: 'customer', title: 'کاربر جدید ثبت شد', subtitle: 'نماینده جدید به سامانه پیوست' },
    ],
  });

  await prisma.notification.createMany({
    data: [
      { title: 'افزایش زمان پاسخگویی API', description: 'زمان استعلام متد کالا به بیش از ۵ ثانیه', type: 'sla', read: false },
      { title: 'ثبت شرکت طلایی جدید', description: 'پتروشیمی سپهر پارس به مشتریان اضافه شد', type: 'update', read: false },
      { title: 'هشدار امنیتی', description: 'تلاش مشکوک برای ورود از آی‌پی خارجی', type: 'alert', read: true },
    ],
  });

  console.log('Seed complete.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
