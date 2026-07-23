require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const hashed = await bcrypt.hash('123456', 10);

  await prisma.user.upsert({
    where: { email: 'admin@sahab.ir' },
    update: {},
    create: { email: 'admin@sahab.ir', password: hashed, name: 'مدیر سامانه', role: 'ADMIN' },
  });
  await prisma.user.upsert({
    where: { email: 'rezaei@sahab.ir' },
    update: {},
    create: { email: 'rezaei@sahab.ir', password: hashed, name: 'امیرحسین رضایی', role: 'AGENT' },
  });
  await prisma.user.upsert({
    where: { email: 'mousavi@sahab.ir' },
    update: {},
    create: { email: 'mousavi@sahab.ir', password: hashed, name: 'زهرا موسوی', role: 'AGENT' },
  });
  await prisma.user.upsert({
    where: { email: 'alavi@sahab.ir' },
    update: {},
    create: { email: 'alavi@sahab.ir', password: hashed, name: 'علی علوی', role: 'AGENT' },
  });
  await prisma.user.upsert({
    where: { email: 'akbari@sahab.ir' },
    update: {},
    create: { email: 'akbari@sahab.ir', password: hashed, name: 'مریم اکبری', role: 'AGENT' },
  });

  const custUser = await prisma.user.upsert({
    where: { email: 'a.karimi@ariasecurity.ir' },
    update: {},
    create: { email: 'a.karimi@ariasecurity.ir', password: hashed, name: 'مهندس آرش کریمی', role: 'CUSTOMER' },
  });

  await prisma.customer.upsert({
    where: { userId: custUser.id },
    update: {},
    create: {
      userId: custUser.id, industry: 'امنیت سایبری', commercialName: 'توسعه امنیت آریا',
      phone: '۰۲۱-۸۸۲۲۳۳۹۹', website: 'www.ariasecurity.ir',
      address: 'تهران، پارک فناوری پردیس، خیابان نوآوری ۱۲',
      tier: 'GOLD', status: 'ACTIVE', usersCount: 23, activeProductsCount: 5,
      partnershipStartDate: new Date('2021-07-15'),
    },
  });

  const products = [
    { id: 'prod-csp', name: 'Cloud Security Platform', category: 'امنیت ابری', version: 'v2.4.1', status: 'ACTIVE', clientsCount: 42, logoInitials: 'CS', logoColor: 'from-blue-500 to-indigo-600' },
    { id: 'prod-ips', name: 'Identity Protection Server', category: 'مدیریت دسترسی', version: 'v3.1.2', status: 'ACTIVE', clientsCount: 28, logoInitials: 'IP', logoColor: 'from-emerald-500 to-teal-600' },
    { id: 'prod-ecn', name: 'Elastic Compute Node', category: 'زیرساخت پردازشی', version: 'v5.0.1', status: 'ACTIVE', clientsCount: 19, logoInitials: 'EC', logoColor: 'from-rose-500 to-orange-500' },
    { id: 'prod-cdn', name: 'Global Edge CDN', category: 'شبکه توزیع محتوا', version: 'v2.0.0', status: 'ACTIVE', clientsCount: 35, logoInitials: 'GC', logoColor: 'from-purple-500 to-pink-500' },
  ];

  for (const p of products) {
    await prisma.product.upsert({ where: { id: p.id }, update: {}, create: p });
  }

  const agents = await prisma.user.findMany({ where: { role: 'AGENT' } });
  const customer = await prisma.customer.findFirst({ where: { userId: custUser.id } });
  const dbProducts = await prisma.product.findMany();

  if (customer) {
    const tickets = [
      {
        title: 'عدم دسترسی به داشبورد امنیتی', priority: 'CRITICAL', status: 'INVESTIGATING',
        customerId: customer.id, productId: dbProducts[0].id, assignedToId: agents[0].id,
        date: new Date('2025-06-12T08:30:00'),
        messages: [
          { text: 'از صبح امروز نمی‌توانم وارد داشبورد امنیتی شوم. خطای ۵۰۳ دریافت می‌کنم.', senderName: 'مهندس آرش کریمی' },
          { text: 'در حال بررسی مشکل هستم. سرورهای CSP را چک می‌کنم.', senderName: 'امیرحسین رضایی', isInternal: true },
        ],
      },
      {
        title: 'تمدید لایسنس Identity Protection', priority: 'HIGH', status: 'AWAITING_CUSTOMER',
        customerId: customer.id, productId: dbProducts[1].id, assignedToId: agents[0].id,
        date: new Date('2025-06-10T14:00:00'),
        messages: [
          { text: 'لایسنس IP Server ما ۱۰ روز دیگر منقضی می‌شود. لطفاً جهت تمدید راهنمایی بفرمایید.', senderName: 'مهندس آرش کریمی' },
          { text: 'لایسنس جدید صادر شده. لطفاً تست کنید و نتیجه را اطلاع دهید.', senderName: 'امیرحسین رضایی' },
        ],
      },
      {
        title: 'درخواست افزایش منابع Elastic Compute', priority: 'MEDIUM', status: 'OPEN',
        customerId: customer.id, productId: dbProducts[2].id, assignedToId: agents[1].id,
        date: new Date('2025-06-08T11:15:00'),
        messages: [
          { text: 'با توجه به افزایش بار، نیاز به ۲ هسته و ۴ گیگ رم اضافه داریم.', senderName: 'مهندس آرش کریمی' },
        ],
      },
      {
        title: 'مشکل در CDN — محتوای کش شده قدیمی', priority: 'LOW', status: 'RESOLVED',
        customerId: customer.id, productId: dbProducts[3].id, assignedToId: agents[1].id,
        date: new Date('2025-06-05T09:45:00'),
        messages: [
          { text: 'کاربران ما محتوای قدیمی را مشاهده می‌کنند. TTL را بررسی کنید.', senderName: 'مهندس آرش کریمی' },
          { text: 'پورژ کش انجام شد. TTL به ۳۰۰ ثانیه کاهش یافت.', senderName: 'زهرا موسوی' },
        ],
      },
      {
        title: 'گزارش تخلف امنیتی در Cloud Security', priority: 'CRITICAL', status: 'CLOSED',
        customerId: customer.id, productId: dbProducts[0].id, assignedToId: agents[2].id,
        date: new Date('2025-05-28T16:20:00'),
        messages: [
          { text: 'فعالیت مشکوک از IP 185.220.101.x شناسایی شده.', senderName: 'مهندس آرش کریمی' },
          { text: 'IP مسدود شد. لاگ‌ها برای تحلیل ارسال شد.', senderName: 'علی علوی' },
          { text: 'ممنون از اقدام سریع. مشکل حل شده.', senderName: 'مهندس آرش کریمی' },
        ],
      },
    ];

    const ticketIds = ['ticket-csp-down', 'ticket-ips-license', 'ticket-ecn-scale', 'ticket-cdn-cache', 'ticket-csp-breach'];
    for (let i = 0; i < tickets.length; i++) {
      const { messages, ...ticketData } = tickets[i];
      const ticket = await prisma.ticket.upsert({
        where: { id: ticketIds[i] },
        update: {},
        create: { id: ticketIds[i], ...ticketData },
      });
      for (const m of messages) {
        await prisma.ticketMessage.create({
          data: { ...m, isInternal: m.isInternal || false, ticketId: ticket.id },
        });
      }
    }
  }

  console.log('Seed complete.');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
