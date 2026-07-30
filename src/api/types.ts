export type TicketPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type TicketStatus = 'OPEN' | 'INVESTIGATING' | 'AWAITING_CUSTOMER' | 'RESOLVED' | 'CLOSED';
export type ProductStatus = 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
export type CustomerTier = 'GOLD' | 'SILVER' | 'BRONZE';
export type CustomerStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING';
export type UserRole = 'ADMIN' | 'AGENT' | 'CUSTOMER';
export type AccessRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ApiUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  active: boolean;
  avatar?: string;
  phone?: string;
  company?: string;
  isCustomer: boolean;
  departmentId?: string;
  customRoleId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiDepartment {
  id: string;
  name: string;
  lead: string;
  icon: string;
  color: string;
  assignedProducts: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiCustomRole {
  id: string;
  name: string;
  description?: string;
  portalType?: string;
  permissions: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiCustomer {
  id: string;
  commercialName?: string;
  industry: string;
  phone?: string;
  website?: string;
  address?: string;
  tier: CustomerTier;
  status: CustomerStatus;
  usersCount: number;
  activeProductsCount: number;
  partnershipStartDate?: string;
  lastActivity?: string;
  userId: string;
  user: ApiUser;
  tickets: ApiTicket[];
  connections: ApiConnection[];
}

export interface ApiProduct {
  id: string;
  name: string;
  category: string;
  description?: string;
  version: string;
  status: ProductStatus;
  clientsCount: number;
  logoColor?: string;
  logoInitials?: string;
  createdAt: string;
  lastUpdated: string;
  connections: ApiConnection[];
}

export interface ApiConnection {
  id: string;
  productId: string;
  customerId: string;
  customer: ApiCustomer;
  product: ApiProduct;
  startDate: string;
  endDate: string;
  licenseStatus: string;
  userCount: number;
  activationKey: string;
  notes?: string;
  subscriptionType: string;
}

export interface UpdateCustomerInput {
  id: string;
  commercialName?: string;
  industry?: string;
  phone?: string;
  website?: string;
  address?: string;
  tier?: CustomerTier;
  status?: CustomerStatus;
}

export interface ApiTicketMessage {
  id: string;
  text: string;
  senderName: string;
  isInternal: boolean;
  createdAt: string;
  authorId?: string;
  authorType?: string;
}

export interface ApiAccessRequest {
  id: string;
  name: string;
  companyName: string;
  email: string;
  phone: string;
  industry?: string;
  status: AccessRequestStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ApiActivity {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  createdAt: string;
}

export interface ApiTicket {
  id: string;
  ticketNumber: number;
  title: string;
  priority: TicketPriority;
  status: TicketStatus;
  date: string;
  updatedAt: string;
  resolvedAt?: string;
  closedAt?: string;
  customerId: string;
  customer: ApiCustomer;
  productId?: string;
  product?: ApiProduct;
  assignedToId?: string;
  assignedTo?: ApiUser;
  messages: ApiTicketMessage[];
}
