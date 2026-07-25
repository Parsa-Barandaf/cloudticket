import type { Ticket, Product } from '../types';

export interface CustomerTicketItem {
  id: string;
  subject: string;
  product: string;
  status: string;
  priority: string;
  date: string;
  lastUpdate: string;
  messagesCount: number;
}

export interface ActiveProductItem {
  id: string;
  name: string;
  version: string;
  licenseKey: string;
  expiresAt: string;
  status: string;
  userQuota: string;
}

export function mapTicketToCustomerItem(t: Ticket): CustomerTicketItem {
  return {
    id: t.id,
    subject: t.title,
    product: t.product,
    status: t.status,
    priority: t.priority,
    date: t.date,
    lastUpdate: t.date,
    messagesCount: 0,
  };
}

export function mapProductToActiveItem(p: Product): ActiveProductItem {
  return {
    id: p.id,
    name: p.name,
    version: p.version,
    licenseKey: 'SAB-XXXX-XXXX',
    expiresAt: 'اطلاعات لایسنس در دسترس نیست',
    status: p.status,
    userQuota: `${p.clientsCount} کاربر`,
  };
}
