import type { ApiActivity, ApiNotification, ApiTask, ApiTaskComment, ApiTicket, ApiProduct, ApiCustomer, ApiConnection, ApiUser } from './types';
import type { ActivityItem, NotificationItem, TaskItem, TaskCommentItem, Ticket, Product, Customer, ProductCustomerConnection } from '../types';
import { formatDate, formatTimeAgo } from '../lib/utils';

const priorityMap: Record<string, 'بحرانی' | 'بالا' | 'متوسط' | 'پایین'> = {
  CRITICAL: 'بحرانی', HIGH: 'بالا', MEDIUM: 'متوسط', LOW: 'پایین',
};

const statusMap: Record<string, 'باز' | 'در حال بررسی' | 'منتظر پاسخ مشتری' | 'بسته شده'> = {
  OPEN: 'باز', INVESTIGATING: 'در حال بررسی', AWAITING_CUSTOMER: 'منتظر پاسخ مشتری', RESOLVED: 'بسته شده', CLOSED: 'بسته شده',
};

const productStatusMap: Record<string, 'فعال' | 'غیرفعال' | 'منقضی شده'> = {
  ACTIVE: 'فعال', INACTIVE: 'غیرفعال', EXPIRED: 'منقضی شده',
};

const tierMap: Record<string, 'طلایی' | 'نقره‌ای' | 'برنزی'> = {
  GOLD: 'طلایی', SILVER: 'نقره‌ای', BRONZE: 'برنزی',
};

const customerStatusMap: Record<string, 'فعال' | 'غیرفعال' | 'در انتظار'> = {
  ACTIVE: 'فعال', INACTIVE: 'غیرفعال', PENDING: 'در انتظار',
};

export function mapTicket(t: ApiTicket): Ticket {
  return {
    id: t.id,
    ticketNumber: t.ticketNumber,
    title: t.title,
    customerId: t.customerId,
    customer: t.customer?.commercialName || t.customer?.user?.name || '',
    productId: t.productId ?? undefined,
    product: t.product?.name || '',
    priority: priorityMap[t.priority] || 'متوسط',
    status: statusMap[t.status] || 'باز',
    assignedTo: t.assignedTo?.name || '',
    assignedToId: t.assignedToId,
    date: t.date,
    updatedAt: t.updatedAt,
  };
}

export function mapProduct(p: ApiProduct): Product {
  return {
    id: p.id,
    name: p.name,
    category: p.category,
    clientsCount: p.clientsCount,
    status: productStatusMap[p.status] || 'فعال',
    version: p.version,
    description: p.description,
    lastUpdated: formatDate(p.lastUpdated),
    logoColor: p.logoColor,
    logoInitials: p.logoInitials,
    createdAt: formatDate(p.createdAt),
  };
}

export function mapCustomer(c: ApiCustomer): Customer {
  const user = c.user;
  return {
    id: c.id,
    name: c.commercialName || user?.name || '',
    industry: c.industry,
    activeTickets: c.tickets?.length || 0,
    tier: tierMap[c.tier] || 'برنزی',
    commercialName: c.commercialName,
    phone: c.phone,
    website: c.website,
    address: c.address,
    managerName: user?.name,
    managerEmail: user?.email,
    managerPhone: c.phone,
    status: customerStatusMap[c.status] || 'فعال',
    usersCount: c.usersCount,
    lastActivity: c.lastActivity,
    activeProductsCount: c.activeProductsCount,
    partnershipStartDate: c.partnershipStartDate,
  };
}

const taskPriorityMap: Record<string, TaskItem['priority']> = {
  CRITICAL: 'بحرانی', HIGH: 'بالا', MEDIUM: 'متوسط', LOW: 'پایین',
};

const taskStatusMap: Record<string, TaskItem['status']> = {
  PENDING: 'در انتظار', IN_PROGRESS: 'در حال انجام', DONE: 'انجام شده', CANCELLED: 'لغو شده',
};

export function mapTaskComment(c: ApiTaskComment): TaskCommentItem {
  return {
    id: c.id,
    taskId: c.taskId,
    text: c.text,
    type: c.type === 'timeline' ? 'timeline' : 'note',
    authorId: c.authorId,
    authorName: c.author?.name || 'کاربر',
    createdAt: c.createdAt,
    time: formatTimeAgo(c.createdAt),
  };
}

export function mapTask(t: ApiTask): TaskItem {
  const now = new Date().getTime();
  const due = t.dueDate ? new Date(t.dueDate).getTime() : null;
  const overdue = t.status !== 'DONE' && t.status !== 'CANCELLED' && due !== null && due < now;

  return {
    id: t.id,
    title: t.title,
    description: t.description,
    priority: taskPriorityMap[t.priority] || 'متوسط',
    priorityRaw: t.priority,
    status: taskStatusMap[t.status] || 'در انتظار',
    statusRaw: t.status,
    dueDate: t.dueDate,
    overdue,
    completedAt: t.completedAt,
    sortOrder: t.sortOrder,
    seenAt: t.seenAt,
    archivedAt: t.archivedAt,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    createdById: t.createdById,
    createdByName: t.createdBy?.name || 'کاربر',
    assigneeId: t.assigneeId,
    assigneeName: t.assignee?.name,
    comments: (t.comments || []).map(mapTaskComment),
  };
}

export function mapActivity(a: ApiActivity): ActivityItem {
  return {
    id: a.id,
    type: (a.type === 'tasks' ? 'task' : a.type) as ActivityItem['type'],
    title: a.title,
    subtitle: a.subtitle,
    time: formatTimeAgo(a.createdAt),
  };
}

function notificationType(raw: string): NotificationItem['type'] {
  if (raw === 'tickets' || raw === 'tasks' || raw === 'users' || raw === 'products' || raw === 'licenses' || raw === 'system') {
    return raw;
  }
  if (raw === 'alert') return 'system';
  if (raw === 'update') return 'products';
  if (raw === 'sla') return 'tickets';
  return 'system';
}

function notificationPriority(raw: string): NotificationItem['priority'] {
  if (raw === 'important' || raw === 'critical') return raw;
  return 'normal';
}

function notificationRelativeGroup(createdAt: string): NotificationItem['relativeGroup'] {
  const then = new Date(createdAt).getTime();
  if (isNaN(then)) return 'older';
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startYesterday = startToday - 86400000;
  if (then >= startToday) {
    if (now.getTime() - then < 3600000) return 'new';
    return 'today';
  }
  if (then >= startYesterday) return 'yesterday';
  return 'older';
}

export function mapNotification(n: ApiNotification): NotificationItem {
  return {
    id: n.id,
    title: n.title,
    description: n.description,
    time: formatTimeAgo(n.createdAt),
    relativeGroup: notificationRelativeGroup(n.createdAt),
    type: notificationType(n.type),
    priority: notificationPriority(n.priority),
    read: n.read,
    archived: n.archived,
    linkedObject: n.linkedName
      ? { type: n.linkedType || '', id: n.linkedId || '', name: n.linkedName }
      : undefined,
    authorName: n.authorName,
    authorAvatarBg: n.authorAvatarBg,
    detailedContent: n.detailedContent,
  };
}

export function mapConnection(c: ApiConnection): ProductCustomerConnection {
  return {
    id: c.id,
    productId: c.productId,
    customerId: c.customerId,
    customerName: c.customer?.commercialName || '',
    managerName: c.customer?.user?.name || '',
    startDate: formatDate(c.startDate),
    endDate: formatDate(c.endDate),
    licenseStatus: c.licenseStatus === 'ACTIVE' ? 'فعال' : c.licenseStatus === 'EXPIRED' ? 'منقضی شده' : 'در انتظار تایید',
    userCount: c.userCount,
    activationKey: c.activationKey,
    notes: c.notes,
    subscriptionType: c.subscriptionType,
    productName: c.product?.name || c.productId,
    version: c.product?.version,
    logoColor: c.product?.logoColor,
    logoInitials: c.product?.logoInitials || c.product?.name?.substring(0, 2).toUpperCase(),
  };
}
