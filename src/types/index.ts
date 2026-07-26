export type AuthScreen = 'login' | 'forgot_password' | 'request_access' | 'portal' | 'dashboard';

export type PortalRole = 'admin' | 'agent' | 'customer';

export interface FormErrors {
  email?: string;
  password?: string;
  name?: string;
  companyName?: string;
  phone?: string;
}

export type Priority = 'بحرانی' | 'بالا' | 'متوسط' | 'پایین';

export type TicketStatus = 'باز' | 'در حال بررسی' | 'منتظر پاسخ مشتری' | 'بسته شده';

export interface Ticket {
  id: string;
  title: string;
  customerId: string;
  customer: string;
  product: string;
  priority: Priority;
  status: TicketStatus;
  assignedTo: string;
  date: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  clientsCount: number;
  status: 'فعال' | 'غیرفعال' | 'منقضی شده';
  version: string;
  description?: string;
  lastUpdated: string;
  logoColor?: string;
  logoInitials?: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  industry: string;
  activeTickets: number;
  tier: 'طلایی' | 'نقره‌ای' | 'برنزی';
  commercialName?: string;
  phone?: string;
  website?: string;
  address?: string;
  managerName?: string;
  managerEmail?: string;
  managerPhone?: string;
  customerType?: 'Enterprise' | 'Business' | 'Standard';
  status?: 'فعال' | 'غیرفعال' | 'در انتظار';
  usersCount?: number;
  lastActivity?: string;
  activeProductsCount?: number;
  partnershipStartDate?: string;
}

export interface ActivityItem {
  id: string;
  type: 'ticket' | 'reply' | 'product' | 'customer';
  title: string;
  subtitle: string;
  time: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'alert' | 'update' | 'sla';
  read: boolean;
}

export interface ProductCustomerConnection {
  id: string;
  productId: string;
  customerId: string;
  customerName: string;
  managerName: string;
  startDate: string;
  endDate: string;
  licenseStatus: 'فعال' | 'منقضی شده' | 'در انتظار تایید';
  userCount: number;
  activationKey: string;
  notes?: string;
  subscriptionType: string;
  productName?: string;
  version?: string;
  logoColor?: string;
  logoInitials?: string;
}

declare global {
  interface ImportMeta {
    readonly env: Record<string, string>;
  }
}
