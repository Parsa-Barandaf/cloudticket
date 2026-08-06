import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import 'dotenv/config';

const prisma = new PrismaClient();

async function main() {
  const hashed = await bcrypt.hash('123456', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: { email: 'admin@example.com', password: hashed, name: 'مدیر سامانه', role: 'ADMIN' },
  });
  const agent1 = await prisma.user.upsert({
    where: { email: 'rezaei@example.com' },
    update: {},
    create: { email: 'rezaei@example.com', password: hashed, name: 'امیرحسین رضایی', role: 'AGENT' },
  });
  const agent2 = await prisma.user.upsert({
    where: { email: 'mousavi@example.com' },
    update: {},
    create: { email: 'mousavi@example.com', password: hashed, name: 'زهرا موسوی', role: 'AGENT' },
  });
  const agent3 = await prisma.user.upsert({
    where: { email: 'alavi@example.com' },
    update: {},
    create: { email: 'alavi@example.com', password: hashed, name: 'علی علوی', role: 'AGENT' },
  });
  const agent4 = await prisma.user.upsert({
    where: { email: 'akbari@example.com' },
    update: {},
    create: { email: 'akbari@example.com', password: hashed, name: 'مریم اکبری', role: 'AGENT' },
  });
  const custUser = await prisma.user.upsert({
    where: { email: 'a.karimi@ariasecurity.ir' },
    update: {},
      create: { email: 'a.karimi@ariasecurity.ir', password: hashed, name: 'مهندس آرش کریمی', role: 'CUSTOMER', isCustomer: true },
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
      partnershipStartDate: new Date('2021-07-15'),
    },
  });

  await prisma.user.update({
    where: { id: custUser.id },
    data: { customerId: cust1.id },
  });

  // ── Portals ──
  const portals = await Promise.all([
    prisma.portal.upsert({ where: { key: 'main' }, update: {}, create: { key: 'main', name: 'پورتال مدیریت' } }),
    prisma.portal.upsert({ where: { key: 'support' }, update: {}, create: { key: 'support', name: 'پورتال پشتیبانی' } }),
    prisma.portal.upsert({ where: { key: 'customer' }, update: {}, create: { key: 'customer', name: 'پورتال مشتریان' } }),
  ]);

  // ── Permissions ──
  const permDefs: { key: string; module: string; portalKey: string }[] = [
    // Main portal
    { key: 'dashboard:view', module: 'Dashboard', portalKey: 'main' },
    { key: 'dashboard:export', module: 'Dashboard', portalKey: 'main' },
    { key: 'tickets:view', module: 'Tickets', portalKey: 'main' },
    { key: 'tickets:create', module: 'Tickets', portalKey: 'main' },
    { key: 'tickets:edit', module: 'Tickets', portalKey: 'main' },
    { key: 'tickets:delete', module: 'Tickets', portalKey: 'main' },
    { key: 'tickets:assign', module: 'Tickets', portalKey: 'main' },
    { key: 'products:view', module: 'Products', portalKey: 'main' },
    { key: 'products:create', module: 'Products', portalKey: 'main' },
    { key: 'products:edit', module: 'Products', portalKey: 'main' },
    { key: 'products:delete', module: 'Products', portalKey: 'main' },
    { key: 'customers:view', module: 'Customers', portalKey: 'main' },
    { key: 'customers:create', module: 'Customers', portalKey: 'main' },
    { key: 'customers:edit', module: 'Customers', portalKey: 'main' },
    { key: 'customers:delete', module: 'Customers', portalKey: 'main' },
    { key: 'users:view', module: 'Users', portalKey: 'main' },
    { key: 'users:create', module: 'Users', portalKey: 'main' },
    { key: 'users:edit', module: 'Users', portalKey: 'main' },
    { key: 'users:delete', module: 'Users', portalKey: 'main' },
    { key: 'reports:view', module: 'Reports', portalKey: 'main' },
    { key: 'reports:export', module: 'Reports', portalKey: 'main' },
    { key: 'settings:view', module: 'Settings', portalKey: 'main' },
    { key: 'settings:edit', module: 'Settings', portalKey: 'main' },
    // Support portal
    { key: 'tickets:view', module: 'Tickets', portalKey: 'support' },
    { key: 'tickets:create', module: 'Tickets', portalKey: 'support' },
    { key: 'tickets:edit', module: 'Tickets', portalKey: 'support' },
    { key: 'tickets:assign', module: 'Tickets', portalKey: 'support' },
    { key: 'customers:view', module: 'Customers', portalKey: 'support' },
    { key: 'products:view', module: 'Products', portalKey: 'support' },
    // Customer portal
    { key: 'tickets:view', module: 'Tickets', portalKey: 'customer' },
    { key: 'tickets:create', module: 'Tickets', portalKey: 'customer' },
    { key: 'profile:view', module: 'Profile', portalKey: 'customer' },
    { key: 'profile:edit', module: 'Profile', portalKey: 'customer' },
  ];

  const portalMap = new Map(portals.map(p => [p.key, p.id]));
  const permissionIds: { [permKey: string]: string } = {};

  for (const def of permDefs) {
    const perm = await prisma.permission.upsert({
      where: { key_portalId: { key: def.key, portalId: portalMap.get(def.portalKey)! } },
      update: {},
      create: { key: def.key, module: def.module, portalId: portalMap.get(def.portalKey)! },
    });
    permissionIds[def.key] = perm.id;
  }

  // ── Fixed Roles ──
  const superAdminRole = await prisma.role.upsert({
    where: { id: 'role-super-admin' },
    update: {},
    create: { id: 'role-super-admin', name: 'Super Admin', description: 'مدیر کل سامانه با دسترسی کامل', isEditable: false, isSystem: true, scope: 'internal' },
  });
  const customerAdminRole = await prisma.role.upsert({
    where: { id: 'role-customer-admin' },
    update: {},
    create: { id: 'role-customer-admin', name: 'Customer Admin', description: 'مدیر سازمان مشتری', isEditable: false, isSystem: true, scope: 'customer' },
  });
  const customerUserRole = await prisma.role.upsert({
    where: { id: 'role-customer-user' },
    update: {},
    create: { id: 'role-customer-user', name: 'Customer User', description: 'کاربر عادی مشتری', isEditable: false, isSystem: false, scope: 'customer' },
  });
  const supportAgentRole = await prisma.role.upsert({
    where: { id: 'role-support-agent' },
    update: {},
    create: { id: 'role-support-agent', name: 'Support Agent', description: 'کارشناس پشتیبانی', isEditable: true, isSystem: false, scope: 'internal' },
  });

  // ── Role-Permission assignments ──
  const mainAndSupportPerms = permDefs.filter(d => d.portalKey === 'main' || d.portalKey === 'support');
  for (const def of mainAndSupportPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: superAdminRole.id, permissionId: permissionIds[def.key] } },
      update: {},
      create: { roleId: superAdminRole.id, permissionId: permissionIds[def.key] },
    });
  }

  const customerPerms = permDefs.filter(d => d.portalKey === 'customer');
  for (const def of customerPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: customerAdminRole.id, permissionId: permissionIds[def.key] } },
      update: {},
      create: { roleId: customerAdminRole.id, permissionId: permissionIds[def.key] },
    });
  }

  const customerUserPerms = ['tickets:view', 'tickets:create', 'profile:view'];
  for (const key of customerUserPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: customerUserRole.id, permissionId: permissionIds[key] } },
      update: {},
      create: { roleId: customerUserRole.id, permissionId: permissionIds[key] },
    });
  }

  // ── Role-Portal assignments (login gate) ──
  const portalIdMap = new Map(portals.map(p => [p.key, p.id]));
  for (const portalKey of ['main', 'support', 'customer']) {
    await prisma.rolePortal.upsert({
      where: { roleId_portalId: { roleId: superAdminRole.id, portalId: portalIdMap.get(portalKey)! } },
      update: {},
      create: { roleId: superAdminRole.id, portalId: portalIdMap.get(portalKey)! },
    });
  }
  await prisma.rolePortal.upsert({
    where: { roleId_portalId: { roleId: customerAdminRole.id, portalId: portalIdMap.get('customer')! } },
    update: {},
    create: { roleId: customerAdminRole.id, portalId: portalIdMap.get('customer')! },
  });
  await prisma.rolePortal.upsert({
    where: { roleId_portalId: { roleId: customerUserRole.id, portalId: portalIdMap.get('customer')! } },
    update: {},
    create: { roleId: customerUserRole.id, portalId: portalIdMap.get('customer')! },
  });
  await prisma.rolePortal.upsert({
    where: { roleId_portalId: { roleId: supportAgentRole.id, portalId: portalIdMap.get('support')! } },
    update: {},
    create: { roleId: supportAgentRole.id, portalId: portalIdMap.get('support')! },
  });

  const supportPerms = permDefs.filter(d => d.portalKey === 'support');
  for (const def of supportPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: supportAgentRole.id, permissionId: permissionIds[def.key] } },
      update: {},
      create: { roleId: supportAgentRole.id, permissionId: permissionIds[def.key] },
    });
  }

  // ── User-Role assignments ──
  await prisma.userRoleAssignment.upsert({
    where: { roleId_userId: { roleId: superAdminRole.id, userId: admin.id } },
    update: {},
    create: { roleId: superAdminRole.id, userId: admin.id },
  });

  await prisma.userRoleAssignment.upsert({
    where: { roleId_userId: { roleId: customerAdminRole.id, userId: custUser.id } },
    update: {},
    create: { roleId: customerAdminRole.id, userId: custUser.id },
  });

  for (const agent of [agent1, agent2, agent3, agent4]) {
    await prisma.userRoleAssignment.upsert({
      where: { roleId_userId: { roleId: supportAgentRole.id, userId: agent.id } },
      update: {},
      create: { roleId: supportAgentRole.id, userId: agent.id },
    });
  }

  console.log('RBAC seed complete.');

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
      {
        title: 'پاسخ جدید برای تیکت قطعی گره‌های مانیتورینگ',
        description: 'مهندس آرش کریمی یک پاسخ جدید ارسال کرد و فایل لوگ‌های سیستم را پیوست کرده است.',
        type: 'tickets',
        priority: 'important',
        read: false,
        authorName: 'آرش کریمی',
        authorAvatarBg: 'bg-indigo-600',
        linkedType: 'تیکت',
        linkedId: 'ticket-monitoring',
        linkedName: 'قطع متناوب گره‌های مانیتورینگ شعبه پردیس',
        detailedContent: 'بررسی‌های اولیه نشان می‌دهد مشکل مربوط به پورت سرویس DNS گره پردیس بوده و پچ امنیتی v2.4.2 اعمال گردید.',
      },
      {
        title: 'هشدار بحرانی: لایسنس در حال انقضا',
        description: 'لایسنس پلتفرم ابری Cloud Security Platform برای مشتری «توسعه امنیت آریا» ۳ روز دیگر منقضی می‌شود.',
        type: 'licenses',
        priority: 'critical',
        read: false,
        authorName: 'سیستم لایسنس',
        authorAvatarBg: 'bg-rose-600',
        linkedType: 'لایسنس',
        linkedId: 'prod-csp',
        linkedName: 'Cloud Security Platform',
        detailedContent: 'اقدام پیشنهادی: ارسال صورتحساب تمدید به مدیریت مالی یا تمدید اتوماتیک با کد تخفیف سازمانی.',
      },
      {
        title: 'کاربر جدید به سازمان دعوت شد',
        description: 'پویا راد با نقش «مشاهده‌گر» دعوت‌نامه عضویت در پنل پشتیبانی را دریافت کرد.',
        type: 'users',
        priority: 'normal',
        read: false,
        authorName: 'علیرضا مجیدی',
        authorAvatarBg: 'bg-amber-600',
        linkedType: 'کاربر',
        linkedId: 'user-pouya',
        linkedName: 'پویا راد',
      },
      {
        title: 'ارتقای سطح SLA تیکت',
        description: 'وضعیت تیکت به علت عدم پاسخگویی در مهلت مقرر به سطح «بحرانی» ارتقا یافت.',
        type: 'tickets',
        priority: 'critical',
        read: true,
        authorName: 'موتور SLA',
        authorAvatarBg: 'bg-red-600',
        linkedType: 'تیکت',
        linkedId: 'ticket-sla',
        linkedName: 'اختلال در API بانک ملت',
      },
      {
        title: 'بروزرسانی لایسنس هلدینگ عمران مهر',
        description: 'ظرفیت کاربر همزمان سامانه Identity Protection به ۱۰۰ کاربر افزایش پیدا کرد.',
        type: 'licenses',
        priority: 'normal',
        read: true,
        authorName: 'واحد فروش',
        authorAvatarBg: 'bg-blue-600',
        linkedType: 'لایسنس',
        linkedId: 'prod-ips',
        linkedName: 'Identity Protection Server',
      },
      {
        title: 'گزارش ممیزی سیستم صادر شد',
        description: 'گزارش کامل فعالیت‌های ماهانه کاربران و نشست‌های امنیتی برای دانلود آماده است.',
        type: 'system',
        priority: 'normal',
        read: true,
        authorName: 'سیستم مرکزی',
        authorAvatarBg: 'bg-slate-600',
        linkedType: 'گزارش',
        linkedId: 'report-audit',
        linkedName: 'گزارش ممیزی ماهانه',
      },
    ],
  });

  console.log('Seed complete.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
