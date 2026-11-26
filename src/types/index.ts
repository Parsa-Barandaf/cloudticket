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
  ticketNumber: number;
  title: string;
  customerId: string;
  customer: string;
  productId?: string;
  product: string;
  priority: Priority;
  status: TicketStatus;
  assignedTo: string;
  assignedToId?: string;
  date: string;
  updatedAt: string;
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
  type: 'ticket' | 'reply' | 'product' | 'customer' | 'task' | 'tasks';
  title: string;
  subtitle: string;
  time: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  relativeGroup: 'new' | 'today' | 'yesterday' | 'older';
  type: 'tickets' | 'tasks' | 'users' | 'products' | 'licenses' | 'system';
  priority: 'normal' | 'important' | 'critical';
  read: boolean;
  archived: boolean;
  linkedObject?: {
    type: string;
    id: string;
    name: string;
  };
  authorName?: string;
  authorAvatarBg?: string;
  detailedContent?: string;
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

export type TaskPriorityFA = 'بحرانی' | 'بالا' | 'متوسط' | 'پایین';
export type TaskStatusFA = 'در انتظار' | 'در حال انجام' | 'انجام شده' | 'لغو شده';

export interface TaskCommentItem {
  id: string;
  taskId: string;
  text: string;
  type: 'note' | 'timeline';
  authorId: string;
  authorName: string;
  createdAt: string;
  time: string;
}

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriorityFA;
  priorityRaw: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: TaskStatusFA;
  statusRaw: 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';
  dueDate?: string;
  overdue: boolean;
  completedAt?: string;
  sortOrder: number;
  seenAt?: string;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
  createdById: string;
  createdByName: string;
  assigneeId?: string;
  assigneeName?: string;
  comments: TaskCommentItem[];
}

declare global {
  interface ImportMeta {
    readonly env: Record<string, string>;
  }
}
