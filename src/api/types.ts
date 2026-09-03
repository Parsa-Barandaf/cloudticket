export type TicketPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type TicketStatus = 'OPEN' | 'INVESTIGATING' | 'AWAITING_CUSTOMER' | 'RESOLVED' | 'CLOSED';
export type ProductStatus = 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
export type CustomerTier = 'GOLD' | 'SILVER' | 'BRONZE';
export type CustomerStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING';
export type UserRole = 'ADMIN' | 'AGENT' | 'CUSTOMER';
export type AccessRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';

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
  customerId?: string;
  userRoles?: { id: string; name: string }[];
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

export interface ApiRole {
  id: string;
  name: string;
  description?: string;
  isEditable: boolean;
  isSystem: boolean;
  scope: string;
  orgId?: string;
  createdAt: string;
  updatedAt: string;
  _count?: { userRoles: number };
  rolePermissions?: ApiRolePermission[];
  portals?: ApiRolePortal[];
}

export interface ApiRolePortal {
  portalId: string;
  portal: ApiPortal;
}

export interface ApiRolePermission {
  permissionId: string;
  permission: ApiPermission;
}

export interface ApiPermission {
  id: string;
  key: string;
  module: string;
  portalId: string;
  createdAt: string;
}

export interface ApiPortal {
  id: string;
  key: string;
  name: string;
  createdAt: string;
}

export interface ApiEffectivePermissions {
  accessiblePortals: string[];
  permissions: { key: string; module: string; portalKey: string }[];
}

export interface ApiActivity {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  createdAt: string;
}

export interface ApiNotification {
  id: string;
  title: string;
  description: string;
  type: string;
  priority: string;
  read: boolean;
  archived: boolean;
  authorName?: string;
  authorAvatarBg?: string;
  detailedContent?: string;
  linkedType?: string;
  linkedId?: string;
  linkedName?: string;
  createdAt: string;
}

export interface ApiTaskComment {
  id: string;
  taskId: string;
  text: string;
  type: string;
  authorId: string;
  author: ApiUser;
  createdAt: string;
}

export interface ApiTask {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: string;
  completedAt?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  createdById: string;
  createdBy: ApiUser;
  assigneeId?: string;
  assignee?: ApiUser;
  comments: ApiTaskComment[];
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
