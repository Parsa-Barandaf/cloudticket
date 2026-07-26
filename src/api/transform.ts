import type { ApiTicket, ApiProduct, ApiCustomer, ApiConnection, ApiUser } from './types';
import type { Ticket, Product, Customer, ProductCustomerConnection } from '../types';
import { formatDate } from '../lib/utils';

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
    title: t.title,
    customerId: t.customerId,
    customer: t.customer?.commercialName || t.customer?.user?.name || '',
    product: t.product?.name || '',
    priority: priorityMap[t.priority] || 'متوسط',
    status: statusMap[t.status] || 'باز',
    assignedTo: t.assignedTo?.name || '',
    date: t.date,
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
