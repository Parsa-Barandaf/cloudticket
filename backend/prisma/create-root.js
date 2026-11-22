require('dotenv/config');

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const portalDefs = [
  { key: 'main', name: 'پورتال مدیریت' },
  { key: 'support', name: 'پورتال پشتیبانی' },
  { key: 'customer', name: 'پورتال مشتریان' },
];

const permissionDefs = [
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
  { key: 'tickets:view', module: 'Tickets', portalKey: 'support' },
  { key: 'tickets:create', module: 'Tickets', portalKey: 'support' },
  { key: 'tickets:edit', module: 'Tickets', portalKey: 'support' },
  { key: 'tickets:assign', module: 'Tickets', portalKey: 'support' },
  { key: 'customers:view', module: 'Customers', portalKey: 'support' },
  { key: 'products:view', module: 'Products', portalKey: 'support' },
  { key: 'tickets:view', module: 'Tickets', portalKey: 'customer' },
  { key: 'tickets:create', module: 'Tickets', portalKey: 'customer' },
  { key: 'profile:view', module: 'Profile', portalKey: 'customer' },
  { key: 'profile:edit', module: 'Profile', portalKey: 'customer' },
];

async function main() {
  const email = process.env.ROOT_EMAIL;
  const password = process.env.ROOT_PASSWORD;
  const name = process.env.ROOT_NAME || 'Root Admin';

  if (!email || !password) {
    throw new Error(
      'ROOT_EMAIL and ROOT_PASSWORD must be configured before running production bootstrap.',
    );
  }

  const portals = await Promise.all(
    portalDefs.map((portal) =>
      prisma.portal.upsert({ where: { key: portal.key }, update: { name: portal.name }, create: portal }),
    ),
  );
  const portalIds = new Map(portals.map((portal) => [portal.key, portal.id]));

  const permissions = [];
  for (const permission of permissionDefs) {
    const portalId = portalIds.get(permission.portalKey);
    if (!portalId) continue;
    permissions.push(
      await prisma.permission.upsert({
        where: { key_portalId: { key: permission.key, portalId } },
        update: { module: permission.module },
        create: { key: permission.key, module: permission.module, portalId },
      }),
    );
  }

  const superAdminRole = await prisma.role.upsert({
    where: { id: 'role-super-admin' },
    update: {
      name: 'Super Admin',
      description: 'Full system administrator',
      isEditable: false,
      isSystem: true,
      scope: 'internal',
    },
    create: {
      id: 'role-super-admin',
      name: 'Super Admin',
      description: 'Full system administrator',
      isEditable: false,
      isSystem: true,
      scope: 'internal',
    },
  });

  for (const portal of portals) {
    await prisma.rolePortal.upsert({
      where: { roleId_portalId: { roleId: superAdminRole.id, portalId: portal.id } },
      update: {},
      create: { roleId: superAdminRole.id, portalId: portal.id },
    });
  }

  for (const permission of permissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: superAdminRole.id, permissionId: permission.id } },
      update: {},
      create: { roleId: superAdminRole.id, permissionId: permission.id },
    });
  }

  const existingUser = await prisma.user.findFirst({
    where: {
      email: {
        equals: email,
        mode: 'insensitive',
      },
    },
    select: { id: true },
  });

  if (existingUser) {
    console.log('Root bootstrap skipped: a user with ROOT_EMAIL already exists. Existing account was not modified.');
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const rootUser = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role: 'ADMIN',
      active: true,
      isCustomer: false,
    },
  });

  await prisma.userRoleAssignment.create({
    data: {
      roleId: superAdminRole.id,
      userId: rootUser.id,
    },
  });

  console.log('Root dashboard user created successfully.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
