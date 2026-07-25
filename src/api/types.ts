export type TicketPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type TicketStatus = 'OPEN' | 'INVESTIGATING' | 'AWAITING_CUSTOMER' | 'RESOLVED' | 'CLOSED';
export type ProductStatus = 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
export type CustomerTier = 'GOLD' | 'SILVER' | 'BRONZE';
export type CustomerStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING';
export type UserRole = 'ADMIN' | 'AGENT' | 'CUSTOMER';

export interface ApiUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  active: boolean;
  avatar?: string;
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
  customerId: string;
  customer: ApiCustomer;
  startDate: string;
  endDate: string;
  licenseStatus: string;
  userCount: number;
  activationKey: string;
  notes?: string;
  subscriptionType: string;
}

export interface ApiTicketMessage {
  id: string;
  text: string;
  senderName: string;
  isInternal: boolean;
  createdAt: string;
}

export interface ApiTicket {
  id: string;
  title: string;
  priority: TicketPriority;
  status: TicketStatus;
  date: string;
  customerId: string;
  customer: ApiCustomer;
  productId?: string;
  product?: ApiProduct;
  assignedToId?: string;
  assignedTo?: ApiUser;
  messages: ApiTicketMessage[];
}
