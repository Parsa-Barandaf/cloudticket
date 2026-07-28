import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard,
  Headphones,
  Layers, 
  Inbox, 
  Users2, 
  User, 
  BarChart3, 
  Bell, 
  Settings, 
  LogOut, 
  Search, 
  Plus, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown, 
  CheckCircle, 
  HelpCircle, 
  Menu, 
  X, 
  Sparkles, 
  Activity, 
  PlusCircle, 
  Building, 
  UserPlus, 
  ArrowUpRight, 
  MessageSquare, 
  Sliders, 
  Eye, 
  Trash2,
  Sun,
  Moon,
  MoreHorizontal,
  Edit,
  Filter,
  RotateCcw,
  FileText,
  Check,
  Loader2,
  AlertTriangle,
  Lock,
  RefreshCw,
  Server,
  Shield,
  ShieldAlert,
  ClipboardList,
  Copy,
  Database,
  BookOpen,
  Cpu,
  Terminal,
  Phone,
  Mail,
  MapPin,
  Globe,
  ExternalLink,
  Download,
  UserCheck,
  History
} from 'lucide-react';

import CustomerWorkspaceView from './CustomerWorkspace';
import TicketInboxView from './TicketInbox';
import UserManagementView from './UserManagement';
import NotificationCenterView from './NotificationCenter';
import SupportAgentPortalView from './AgentPortal';
import { useTickets } from '../../hooks/useTickets';
import { useProducts } from '../../hooks/useProducts';
import { useCustomers } from '../../hooks/useCustomers';
import { useUsers } from '../../hooks/useUsers';
import { gql } from '../../api/graphql';
import { formatDateTime } from '../../lib/utils';
import { CREATE_CUSTOMER, UPDATE_CUSTOMER, DELETE_CUSTOMER, GET_PENDING_ACCESS_REQUESTS, APPROVE_ACCESS_REQUEST, REJECT_ACCESS_REQUEST, CREATE_PRODUCT, UPDATE_PRODUCT, DELETE_PRODUCT, GET_USERS } from '../../api/queries';
import type { ApiCustomer, ApiAccessRequest, ApiProduct, ApiUser } from '../../api/types';

// Interfaces for our state elements
export interface Ticket {
  id: string;
  ticketNumber: number;
  title: string;
  customerId: string;
  customer: string;
  product: string;
  priority: 'بحرانی' | 'بالا' | 'متوسط' | 'پایین';
  status: 'باز' | 'در حال بررسی' | 'منتظر پاسخ مشتری' | 'بسته شده';
  assignedTo: string;
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

interface ActivityItem {
  id: string;
  type: 'ticket' | 'reply' | 'product' | 'customer';
  title: string;
  subtitle: string;
  time: string;
}

import { PortalRole } from '../../types';

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'alert' | 'update' | 'sla';
  read: boolean;
}

interface ProductCustomerConnection {
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
}

interface DashboardPreviewProps {
  userEmail: string;
  onLogout: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onSwitchPortalRole?: (role: PortalRole) => void;
}

export default function DashboardPreview({ userEmail, onLogout, isDark, onToggleTheme, onSwitchPortalRole }: DashboardPreviewProps) {
  // Sidebar collapsed state (desktop)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSavingCustomer, setIsSavingCustomer] = useState(false);
  const [currentUserData, setCurrentUserData] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    gql<{ users: ApiUser[] }>(GET_USERS)
      .then(data => {
        const u = data.users.find(x => x.email === userEmail);
        if (u) setCurrentUserData({ name: u.name, role: u.role });
      })
      .catch(() => {});
  }, [userEmail]);

  // Active Tab state
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'products' | 'product-details' | 'tickets' | 'customers' | 'access-requests' | 'users' | 'reports' | 'notifications' | 'settings' | 'customer-details' | 'agent-portal'
  >('dashboard');

  const [selectedCustomerWorkspace, setSelectedCustomerWorkspace] = useState<Customer | null>(null);
  const [customerWorkspaceTab, setCustomerWorkspaceTab] = useState<'overview' | 'products' | 'users' | 'tickets' | 'licenses' | 'activities' | 'settings'>('overview');

  // Customer workspace custom records (e.g. for user lists, products list, active licenses, timeline, settings)
  const [customerWorkspaceUsers, setCustomerWorkspaceUsers] = useState<any[]>([
    { id: 'USR-201', name: 'مهندس آرش کریمی', email: 'a.karimi@ariasecurity.ir', role: 'مدیر', lastLogin: '۱۰ دقیقه پیش', status: 'فعال' },
    { id: 'USR-202', name: 'مهندس حسام نوری', email: 'h.noori@ariasecurity.ir', role: 'کاربر', lastLogin: '۱ ساعت پیش', status: 'فعال' },
    { id: 'USR-203', name: 'خانم الهام سلیمی', email: 'e.salimi@ariasecurity.ir', role: 'مشاهده‌گر', lastLogin: 'دیروز', status: 'غیرفعال' }
  ]);

  const [customerWorkspaceProducts, setCustomerWorkspaceProducts] = useState<any[]>([
    { id: 'PRD-01', name: 'Cloud Security Platform', logoInitials: 'CS', logoColor: 'from-blue-500 to-indigo-600', version: 'v2.4.1', status: 'فعال', expDate: '۱۴۰۵/۰۴/۱۵', type: 'Enterprise', userLimit: 50, licenseKey: 'SEC-PLAT-88392-CMP' },
    { id: 'PRD-02', name: 'Identity Protection Server', logoInitials: 'IP', logoColor: 'from-emerald-500 to-teal-600', version: 'v3.1.2', status: 'فعال', expDate: '۱۴۰۴/۱۲/۲۰', type: 'Enterprise', userLimit: 100, licenseKey: 'ID-PROT-10029-CMP' },
    { id: 'PRD-03', name: 'Elastic Compute Node', logoInitials: 'EC', logoColor: 'from-rose-500 to-orange-500', version: 'v5.0.1', status: 'فعال', expDate: '۱۴۰۴/۱۰/۰۱', type: 'Business', userLimit: 15, licenseKey: 'EL-COMP-49301-CMP' },
    { id: 'PRD-05', name: 'Global Edge CDN', logoInitials: 'GC', logoColor: 'from-purple-500 to-pink-500', version: 'v2.0.0', status: 'فعال', expDate: '۱۴۰۵/۰۱/۱۰', type: 'Business', userLimit: 20, licenseKey: 'EDGE-CDN-00392-CMP' },
    { id: 'PRD-06', name: 'AI Analytics Framework', logoInitials: 'AI', logoColor: 'from-violet-500 to-fuchsia-500', version: 'v1.5.0', status: 'غیرفعال', expDate: '۱۴۰۳/۰۴/۰۱', type: 'Standard', userLimit: 10, licenseKey: 'AI-ANLT-22910-CMP' }
  ]);

  // Workspace feedback messages
  const [workspaceFeedback, setWorkspaceFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showEditOrgModal, setShowEditOrgModal] = useState(false);

  const showWorkspaceToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setWorkspaceFeedback({ message: msg, type });
    setTimeout(() => setWorkspaceFeedback(null), 4000);
  };

  // Dynamic States for robust interactivity
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const { tickets: apiTickets, loading: ticketsLoading, createTicket: apiCreateTicket, updateTicketStatus: apiUpdateTicketStatus } = useTickets();
  const { products: apiProducts, loading: productsLoading, refetch: refetchProducts } = useProducts();
  const { customers: apiCustomers, loading: customersLoading, refetch: refetchCustomers } = useCustomers();
  const { users: apiUsers } = useUsers();
  useEffect(() => { if (apiTickets.length) setTickets(apiTickets); }, [apiTickets]);
  useEffect(() => { if (apiProducts.length) setProducts(apiProducts); }, [apiProducts]);
  useEffect(() => { if (apiCustomers.length) setCustomers(apiCustomers); }, [apiCustomers]);

  // Access requests state
  const [pendingRequests, setPendingRequests] = useState<ApiAccessRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const fetchPendingRequests = useCallback(async () => {
    setRequestsLoading(true);
    try {
      const data = await gql<{ pendingAccessRequests: ApiAccessRequest[] }>(GET_PENDING_ACCESS_REQUESTS);
      setPendingRequests(data.pendingAccessRequests);
    } catch { /* ignore */ }
    setRequestsLoading(false);
  }, []);
  useEffect(() => { fetchPendingRequests(); }, [fetchPendingRequests]);

  const [agents] = useState([
    { id: 'AGN-01', name: 'امیرحسین رضایی', role: 'پشتیبان فنی ارشد', email: 'rezaei@example.com', status: 'فعال', load: '۳ تیکت فعال' },
    { id: 'AGN-02', name: 'زهرا موسوی', role: 'کارشناس توسعه‌دهندگان', email: 'mousavi@example.com', status: 'فعال', load: '۲ تیکت فعال' },
    { id: 'AGN-03', name: 'علی علوی', role: 'کارشناس امنیت شبکه', email: 'alavi@example.com', status: 'مشغول', load: '۱ تیکت فعال' },
    { id: 'AGN-04', name: 'مریم اکبری', role: 'کارشناس امور مشتریان', email: 'akbari@example.com', status: 'آفلاین', load: '۰ تیکت فعال' }
  ]);

  const [activities, setActivities] = useState<ActivityItem[]>([
    { id: 'ACT-1', type: 'ticket', title: 'تیکت جدید ایجاد شد', subtitle: 'توسط شرکت فناوری نوین در ۲ دقیقه پیش', time: '۱۰:۴۲' },
    { id: 'ACT-2', type: 'reply', title: 'پاسخ جدید دریافت شد', subtitle: 'پشتیبان امیرحسین رضایی به تیکت TKT-1023 پاسخ داد', time: '۱۰:۲۷' },
    { id: 'ACT-3', type: 'product', title: 'محصول جدید اضافه شد', subtitle: 'زیرسرویس API وب‌هوک به کاتالوگ اضافه شد', time: '۰۹:۱۵' },
    { id: 'ACT-4', type: 'customer', title: 'کاربر جدید ثبت شد', subtitle: 'نماینده جدید مریم اکبری به سامانه پیوست', time: 'دیروز' }
  ]);

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    { id: 'NTF-1', title: 'افزایش زمان پاسخگویی API', description: 'زمان استعلام متد کالا به بیش از ۵ ثانیه رسیده است.', time: '۱۰ دقیقه پیش', type: 'sla', read: false },
    { id: 'NTF-2', title: 'ثبت شرکت طلایی جدید', description: 'پتروشیمی سپهر پارس به جمع مشتریان سحاب اضافه شد.', time: '۲ ساعت پیش', type: 'update', read: false },
    { id: 'NTF-3', title: 'هشدار امنیتی سامانه ورود', description: 'تلاش مشکوک برای ورود از آی‌پی خارجی مسدود گردید.', time: '۴ ساعت پیش', type: 'alert', read: true }
  ]);

  // Modal Control States
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);

  // Filter & Search states for the Lists
  const [ticketSearch, setTicketSearch] = useState('');
  const [ticketPriorityFilter, setTicketPriorityFilter] = useState('همه');
  const [ticketStatusFilter, setTicketStatusFilter] = useState('همه');

  const [productSearch, setProductSearch] = useState('');
  const [productStatusFilter, setProductStatusFilter] = useState('همه');
  const [productVersionFilter, setProductVersionFilter] = useState('همه');
  const [productDateFilter, setProductDateFilter] = useState('همه');

  // UI simulation states (loading, empty, error, feedback, active row actions)
  const [isProductLoading, setIsProductLoading] = useState(false);
  const [productErrorState, setProductErrorState] = useState(false);
  const [productFeedback, setProductFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [activeRowActionId, setActiveRowActionId] = useState<string | null>(null);

  // Pagination states
  const [productPage, setProductPage] = useState(1);
  const [productItemsPerPage, setProductItemsPerPage] = useState(5);

  // Drawer details
  const [showProductDrawer, setShowProductDrawer] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Drawer Form fields
  const [drawerName, setDrawerName] = useState('');
  const [drawerDescription, setDrawerDescription] = useState('');
  const [drawerVersion, setDrawerVersion] = useState('v1.0.0');
  const [drawerLogoColor, setDrawerLogoColor] = useState('from-blue-500 to-indigo-600');
  const [drawerStatus, setDrawerStatus] = useState<'فعال' | 'غیرفعال' | 'منقضی شده'>('فعال');
  const [drawerCategory, setDrawerCategory] = useState('امنیتی');

  // Drawer live validation
  const [drawerErrors, setDrawerErrors] = useState<{ name?: string; version?: string }>({});

  // Screen 04 - Product Details Page States
  const [selectedDetailProduct, setSelectedDetailProduct] = useState<Product | null>(null);
  const [detailSubTab, setDetailSubTab] = useState<'overview' | 'customers' | 'tickets' | 'versions' | 'docs' | 'settings'>('overview');
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailErrorState, setDetailErrorState] = useState(false);
  const [detailIsEmpty, setDetailIsEmpty] = useState(false);
  const [copiedTextId, setCopiedTextId] = useState<string | null>(null);
  
  // Assign Customer Drawer Visibility & Form Fields
  const [showAssignCustomerDrawer, setShowAssignCustomerDrawer] = useState(false);
  const [assignCustomerName, setAssignCustomerName] = useState('');
  const [assignSubscriptionType, setAssignSubscriptionType] = useState('Enterprise');
  const [assignUserCount, setAssignUserCount] = useState(10);
  const [assignStartDate, setAssignStartDate] = useState('۱۴۰۵/۰۴/۲۰');
  const [assignEndDate, setAssignEndDate] = useState('۱۴۰۶/۰۴/۲۰');
  const [assignActivationKey, setAssignActivationKey] = useState('LIC-CMP-E4A1-28BF-81C5');
  const [assignNotes, setAssignNotes] = useState('');

  // Product-Customer Connections State
  const [productCustomerConnections, setProductCustomerConnections] = useState<ProductCustomerConnection[]>([
    {
      id: 'CON-1',
      productId: 'PRD-01',
      customerId: 'CST-101',
      customerName: 'شرکت فناوری نوین',
      managerName: 'امیرحسین رضایی',
      startDate: '۱۴۰۱/۰۵/۲۰',
      endDate: '۱۴۰۵/۰۵/۲۰',
      licenseStatus: 'فعال',
      userCount: 125,
      activationKey: 'LIC-CS-9382-XT91-A1',
      subscriptionType: 'Enterprise',
      notes: 'پشتیبانی فنی اختصاصی طلایی و آپشن‌های مانیتورینگ سفارشی.'
    },
    {
      id: 'CON-2',
      productId: 'PRD-01',
      customerId: 'CST-106',
      customerName: 'پتروشیمی سپهر پارس',
      managerName: 'علی علوی',
      startDate: '۱۴۰۲/۰۶/۲۵',
      endDate: '۱۴۰۶/۰۶/۲۵',
      licenseStatus: 'فعال',
      userCount: 80,
      activationKey: 'LIC-CS-4821-ZP88-B2',
      subscriptionType: 'Premium',
      notes: 'لایسنس با سقف دسترسی بالا و لود بالانسر اختصاصی.'
    },
    {
      id: 'CON-3',
      productId: 'PRD-01',
      customerId: 'CST-102',
      customerName: 'بازرگانی آریا جم',
      managerName: 'زهرا موسوی',
      startDate: '۱۴۰۱/۰۷/۱۰',
      endDate: '۱۴۰۴/۰۷/۱۰',
      licenseStatus: 'منقضی شده',
      userCount: 45,
      activationKey: 'LIC-CS-1274-QK42-C3',
      subscriptionType: 'Standard',
      notes: 'نیاز به تمدید سالانه دارد. با پشتیبانی هماهنگ شود.'
    }
  ]);

  const [customerSearch, setCustomerSearch] = useState('');

  // CRM Customer Management Filter States
  const [customerStatusFilter, setCustomerStatusFilter] = useState('همه');
  const [customerProductFilter, setCustomerProductFilter] = useState('همه');
  const [customerDateFilter, setCustomerDateFilter] = useState('همه');
  const [customerTierFilter, setCustomerTierFilter] = useState('همه');

  // Customer Drawer States (Add/Edit)
  const [showCustomerDrawer, setShowCustomerDrawer] = useState(false);
  const [customerDrawerMode, setCustomerDrawerMode] = useState<'create' | 'edit'>('create');
  const [selectedCustomerForEdit, setSelectedCustomerForEdit] = useState<Customer | null>(null);

  // Customer Drawer Fields
  const [companyName, setCompanyName] = useState('');
  const [companyCommercialName, setCompanyCommercialName] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyIndustry, setCompanyIndustry] = useState('');

  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  const [businessType, setBusinessType] = useState<'Enterprise' | 'Business' | 'Standard'>('Enterprise');
  const [businessStatus, setBusinessStatus] = useState<'فعال' | 'غیرفعال' | 'در انتظار'>('فعال');

  // Customer Quick Profile View States
  const [showCustomerProfile, setShowCustomerProfile] = useState(false);
  const [selectedCustomerProfile, setSelectedCustomerProfile] = useState<Customer | null>(null);
  const [profileTab, setProfileTab] = useState<'general' | 'products' | 'users' | 'tickets' | 'activities' | 'licenses' | 'audit'>('general');

  // CRM Simulation States
  const [isCustomerLoading, setIsCustomerLoading] = useState(false);
  const [customerErrorState, setCustomerErrorState] = useState(false);
  const [customerFeedback, setCustomerFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Confirmation dialogs
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [customerToDeactivate, setCustomerToDeactivate] = useState<Customer | null>(null);
  const [showDeleteCustomerConfirm, setShowDeleteCustomerConfirm] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [isDeletingCustomer, setIsDeletingCustomer] = useState(false);
  const [pendingCustomerCompany, setPendingCustomerCompany] = useState<string | null>(null);

  // Form Field States
  const [newTicketTitle, setNewTicketTitle] = useState('');
  const [newTicketCustomer, setNewTicketCustomer] = useState('');
  const [newTicketProduct, setNewTicketProduct] = useState('پنل کاربری سحاب');
  const [newTicketPriority, setNewTicketPriority] = useState<'بحرانی' | 'بالا' | 'متوسط' | 'پایین'>('متوسط');

  const [newProductName, setNewProductName] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('وب‌سرویس');
  const [newProductVersion, setNewProductVersion] = useState('v1.0.0');

  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerIndustry, setNewCustomerIndustry] = useState('فناوری');
  const [newCustomerTier, setNewCustomerTier] = useState<'طلایی' | 'نقره‌ای' | 'برنزی'>('نقره‌ای');

  const priorityToApi: Record<string, string> = { 'بحرانی': 'CRITICAL', 'بالا': 'HIGH', 'متوسط': 'MEDIUM', 'پایین': 'LOW' };

  // Interactive functions
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketTitle || !newTicketCustomer) return;

    const matchedCustomer = customers.find(c => c.name === newTicketCustomer || c.commercialName === newTicketCustomer);
    const customerId = matchedCustomer?.id;

    if (customerId) {
      await apiCreateTicket({
        title: newTicketTitle,
        priority: priorityToApi[newTicketPriority] || 'MEDIUM',
        customerId,
      });
    }

    // Append to activities (local only — no API for activities)
    const newAct: ActivityItem = {
      id: `ACT-${Date.now()}`,
      type: 'ticket',
      title: 'تیکت جدید ایجاد شد',
      subtitle: `تیکت توسط ${newTicketCustomer} با اولویت ${newTicketPriority} ثبت شد.`,
      time: 'هم‌اکنون'
    };
    setActivities([newAct, ...activities]);

    // Append to notifications (local only)
    const newNtf: NotificationItem = {
      id: `NTF-${Date.now()}`,
      title: 'تیکت بحرانی/جدید ثبت شد',
      description: `موضوع: ${newTicketTitle}`,
      time: 'هم‌اکنون',
      type: 'sla',
      read: false
    };
    setNotifications([newNtf, ...notifications]);

    // Reset Form
    setNewTicketTitle('');
    setNewTicketCustomer('');
    setNewTicketPriority('متوسط');
    setShowTicketModal(false);
    showFeedback('تیکت با موفقیت ثبت شد.', 'success');
  };

  const showFeedback = (message: string, type: 'success' | 'error' = 'success') => {
    setProductFeedback({ message, type });
    setTimeout(() => {
      setProductFeedback(null);
    }, 4000);
  };

  const handleOpenDrawerForCreate = () => {
    setDrawerMode('create');
    setSelectedProduct(null);
    setDrawerName('');
    setDrawerDescription('');
    setDrawerVersion('v1.0.0');
    setDrawerLogoColor('from-blue-500 to-indigo-600');
    setDrawerStatus('فعال');
    setDrawerCategory('امنیتی');
    setDrawerErrors({});
    setShowProductDrawer(true);
  };

  const handleOpenDrawerForEdit = (prd: Product) => {
    setDrawerMode('edit');
    setSelectedProduct(prd);
    setDrawerName(prd.name);
    setDrawerDescription(prd.description || '');
    setDrawerVersion(prd.version);
    setDrawerLogoColor(prd.logoColor || 'from-blue-500 to-indigo-600');
    setDrawerStatus(prd.status);
    setDrawerCategory(prd.category);
    setDrawerErrors({});
    setShowProductDrawer(true);
    setActiveRowActionId(null);
  };

  const handleOpenDrawerForView = (prd: Product) => {
    setDrawerMode('view');
    setSelectedProduct(prd);
    setDrawerName(prd.name);
    setDrawerDescription(prd.description || '');
    setDrawerVersion(prd.version);
    setDrawerLogoColor(prd.logoColor || 'from-blue-500 to-indigo-600');
    setDrawerStatus(prd.status);
    setDrawerCategory(prd.category);
    setDrawerErrors({});
    setShowProductDrawer(true);
    setActiveRowActionId(null);
  };

  const handleSaveDrawerProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (drawerMode === 'view') {
      setShowProductDrawer(false);
      return;
    }

    // Validation
    const errors: { name?: string; version?: string } = {};
    if (!drawerName || drawerName.trim().length < 3) {
      errors.name = 'نام محصول باید حداقل ۳ کاراکتر باشد.';
    }
    if (!drawerVersion || !/^v\d+\.\d+\.\d+/.test(drawerVersion)) {
      errors.version = 'نسخه محصول باید با ساختار استاندارد باشد (مانند v1.0.0)';
    }

    if (Object.keys(errors).length > 0) {
      setDrawerErrors(errors);
      showFeedback('لطفاً خطاهای فرم را برطرف نمایید.', 'error');
      return;
    }

    if (drawerMode === 'create') {
      const statusApiMap: Record<string, string> = { 'فعال': 'ACTIVE', 'غیرفعال': 'INACTIVE', 'منقضی شده': 'EXPIRED' };

      gql<{ createProduct: ApiProduct }>(CREATE_PRODUCT, {
        input: {
          name: drawerName,
          category: drawerCategory,
          description: drawerDescription || null,
          version: drawerVersion,
          logoColor: drawerLogoColor,
          logoInitials: drawerName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() || 'PR',
        },
      })
        .then(() => {
          showFeedback(`محصول "${drawerName}" با موفقیت ایجاد شد.`);
          refetchProducts();
          setActivities([
            {
              id: `ACT-${Date.now()}`,
              type: 'product',
              title: 'محصول جدید اضافه شد',
              subtitle: `زیرسرویس ${drawerName} به ساختار کاتالوگ سحاب اضافه گردید.`,
              time: 'هم‌اکنون'
            },
            ...activities
          ]);
        })
        .catch((err) => {
          showFeedback('خطا در ایجاد محصول: ' + ((err as Error).message || 'خطای ناشناخته'), 'error');
        });
    } else {
      // Edit
      if (!selectedProduct) return;
      const statusApiMap: Record<string, string> = { 'فعال': 'ACTIVE', 'غیرفعال': 'INACTIVE', 'منقضی شده': 'EXPIRED' };

      gql<{ updateProduct: ApiProduct }>(UPDATE_PRODUCT, {
        input: {
          id: selectedProduct.id,
          name: drawerName,
          category: drawerCategory,
          description: drawerDescription || null,
          version: drawerVersion,
          status: statusApiMap[drawerStatus],
          logoColor: drawerLogoColor,
          logoInitials: drawerName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() || 'PR',
        },
      })
        .then(() => {
          showFeedback(`محصول "${drawerName}" با موفقیت بروزرسانی شد.`);
          refetchProducts();
        })
        .catch((err) => {
          showFeedback('خطا در بروزرسانی محصول: ' + ((err as Error).message || 'خطای ناشناخته'), 'error');
        });
    }

    setShowProductDrawer(false);
  };

  const handleOpenProductDetails = (prd: Product) => {
    setIsDetailLoading(true);
    setDetailErrorState(false);
    setDetailIsEmpty(false);
    setSelectedDetailProduct(prd);
    setDetailSubTab('overview');
    setActiveTab('product-details');
    setTimeout(() => {
      setIsDetailLoading(false);
    }, 500);
  };

  const handleAssignCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignCustomerName) return;

    const newConn: ProductCustomerConnection = {
      id: `CON-${Date.now()}`,
      productId: selectedDetailProduct?.id || 'PRD-01',
      customerId: `CST-${Math.floor(100 + Math.random() * 900)}`,
      customerName: assignCustomerName,
      managerName: 'امیرحسین رضایی',
      startDate: assignStartDate,
      endDate: assignEndDate,
      licenseStatus: 'فعال',
      userCount: assignUserCount,
      activationKey: assignActivationKey || `LIC-CMP-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      notes: assignNotes,
      subscriptionType: assignSubscriptionType
    };

    setProductCustomerConnections([newConn, ...productCustomerConnections]);
    setShowAssignCustomerDrawer(false);
    
    // Increment product's clientCount
    if (selectedDetailProduct) {
      setProducts(products.map(p => p.id === selectedDetailProduct.id ? { ...p, clientsCount: p.clientsCount + 1 } : p));
      setSelectedDetailProduct({ ...selectedDetailProduct, clientsCount: selectedDetailProduct.clientsCount + 1 });
    }

    showFeedback(`مشتری "${assignCustomerName}" با موفقیت به این محصول تخصیص داده شد.`);

    // Reset Form fields
    setAssignCustomerName('');
    setAssignNotes('');
  };

  const handleDeleteConnection = (connId: string) => {
    const conn = productCustomerConnections.find(c => c.id === connId);
    if (!conn) return;
    setProductCustomerConnections(productCustomerConnections.filter(c => c.id !== connId));
    
    // Decrement product's clientCount
    if (selectedDetailProduct) {
      setProducts(products.map(p => p.id === selectedDetailProduct.id ? { ...p, clientsCount: Math.max(0, p.clientsCount - 1) } : p));
      setSelectedDetailProduct({ ...selectedDetailProduct, clientsCount: Math.max(0, selectedDetailProduct.clientsCount - 1) });
    }

    showFeedback(`اتصال مشتری "${conn.customerName}" با موفقیت حذف گردید.`);
  };

  const handleRenewConnection = (connId: string) => {
    const conn = productCustomerConnections.find(c => c.id === connId);
    if (!conn) return;
    setProductCustomerConnections(productCustomerConnections.map(c => c.id === connId ? { ...c, endDate: '۱۴۰۷/۰۴/۲۰', licenseStatus: 'فعال' } : c));
    showFeedback(`اشتراک مشتری "${conn.customerName}" تا تاریخ ۱۴۰۷/۰۴/۲۰ با موفقیت تمدید شد.`);
  };

  const handleToggleProductStatus = (prdId: string) => {
    const prd = products.find(p => p.id === prdId);
    if (!prd) return;
    const nextStatus: Product['status'] = prd.status === 'فعال' ? 'غیرفعال' : 'فعال';
    setProducts(products.map(p => p.id === prdId ? { ...p, status: nextStatus, lastUpdated: '۱۴۰۲/۱۰/۱۲' } : p));
    showFeedback(`وضعیت محصول "${prd.name}" به "${nextStatus}" تغییر یافت.`);
    setActiveRowActionId(null);
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    handleSaveDrawerProduct(e);
  };

  const handleDeleteProduct = async (prd: Product) => {
    try {
      await gql<{ deleteProduct: boolean }>(DELETE_PRODUCT, { id: prd.id });
      showFeedback(`محصول "${prd.name}" با موفقیت حذف شد.`);
      refetchProducts();
      setActiveRowActionId(null);
    } catch (err) {
      showFeedback('خطا در حذف محصول: ' + ((err as Error).message || 'خطای ناشناخته'), 'error');
    }
  };

  // CRM Customer Action Handlers
  const showCustomerToast = (message: string, type: 'success' | 'error' = 'success') => {
    setCustomerFeedback({ message, type });
    setTimeout(() => {
      setCustomerFeedback(null);
    }, 4000);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !contactName) return;

    setIsCustomerLoading(true);

    if (customerDrawerMode === 'create') {
      try {
        const matchedUser = apiUsers.find(u => u.email === contactEmail);
        if (!matchedUser) {
          showCustomerToast('کاربری با این ایمیل در سامانه یافت نشد. ابتدا کاربر را ثبت نام کنید.', 'error');
          setIsCustomerLoading(false);
          return;
        }

        const businessTypeToApiTier: Record<string, string> = {
          Enterprise: 'GOLD',
          Business: 'SILVER',
          Standard: 'BRONZE',
        };
        const persianStatusToApi: Record<string, string> = {
          'فعال': 'ACTIVE',
          'غیرفعال': 'INACTIVE',
          'در انتظار': 'PENDING',
        };

        const data = await gql<{ createCustomer: ApiCustomer }>(CREATE_CUSTOMER, {
          input: {
            industry: companyIndustry || 'سایر',
            commercialName: companyCommercialName || companyName,
            phone: companyPhone || null,
            website: companyWebsite || null,
            address: companyAddress || null,
            tier: businessTypeToApiTier[businessType] || 'BRONZE',
            status: persianStatusToApi[businessStatus] || 'ACTIVE',
            userId: matchedUser.id,
          },
        });

        const apiCust = data.createCustomer;
        const newCust: Customer = {
          id: apiCust.id,
          name: apiCust.commercialName || matchedUser.name,
          industry: apiCust.industry,
          activeTickets: 0,
          tier: apiCust.tier === 'GOLD' ? 'طلایی' : apiCust.tier === 'SILVER' ? 'نقره‌ای' : 'برنزی',
          commercialName: apiCust.commercialName,
          phone: apiCust.phone,
          website: apiCust.website,
          address: apiCust.address,
          managerName: matchedUser.name,
          managerEmail: matchedUser.email,
          managerPhone: apiCust.phone,
          customerType: businessType,
          status: apiCust.status === 'ACTIVE' ? 'فعال' : apiCust.status === 'INACTIVE' ? 'غیرفعال' : 'در انتظار',
          usersCount: apiCust.usersCount,
          activeProductsCount: apiCust.activeProductsCount,
          partnershipStartDate: apiCust.partnershipStartDate,
          lastActivity: apiCust.lastActivity || 'هم‌اکنون',
        };

        setCustomers([newCust, ...customers]);
        showCustomerToast(`مشتری سازمانی "${companyName}" با موفقیت ثبت گردید.`);
      } catch (err) {
        showCustomerToast('خطا در ثبت مشتری: ' + ((err as Error).message || 'خطای ناشناخته'), 'error');
      }
    } else {
      // Edit mode
      if (!selectedCustomerForEdit) {
        setIsCustomerLoading(false);
        return;
      }
      try {
        const persianStatusToApi: Record<string, string> = {
          'فعال': 'ACTIVE',
          'غیرفعال': 'INACTIVE',
          'در انتظار': 'PENDING',
        };
        const persianTierToApi: Record<string, string> = {
          'طلایی': 'GOLD',
          'نقره‌ای': 'SILVER',
          'برنزی': 'BRONZE',
        };
        await gql<{ updateCustomer: ApiCustomer }>(UPDATE_CUSTOMER, {
          input: {
            id: selectedCustomerForEdit.id,
            commercialName: companyCommercialName || companyName,
            industry: companyIndustry,
            phone: companyPhone || null,
            website: companyWebsite || null,
            address: companyAddress || null,
            tier: persianTierToApi[businessType === 'Enterprise' ? 'طلایی' : businessType === 'Business' ? 'نقره‌ای' : 'برنزی'],
            status: persianStatusToApi[businessStatus] || 'ACTIVE',
          },
        });
        const updated = customers.map(c => {
          if (c.id === selectedCustomerForEdit.id) {
            return {
              ...c,
              name: companyName,
              commercialName: companyCommercialName,
              industry: companyIndustry,
              phone: companyPhone,
              website: companyWebsite,
              address: companyAddress,
              managerName: contactName,
              managerEmail: contactEmail,
              managerPhone: contactPhone,
              customerType: businessType,
              status: businessStatus,
              tier: businessType === 'Enterprise' ? 'طلایی' : businessType === 'Business' ? 'نقره‌ای' : 'برنزی' as any,
            };
          }
          return c;
        });
        setCustomers(updated);
        showCustomerToast(`اطلاعات مشتری "${companyName}" با موفقیت بروزرسانی شد.`);
      } catch (err) {
        showCustomerToast('خطا در بروزرسانی مشتری: ' + ((err as Error).message || 'خطای ناشناخته'), 'error');
      }
    }

    setIsCustomerLoading(false);
    setShowCustomerDrawer(false);
  };

  const handleOpenEditCustomer = (cust: Customer) => {
    setSelectedCustomerForEdit(cust);
    setCustomerDrawerMode('edit');
    
    // Fill fields
    setCompanyName(cust.name);
    setCompanyCommercialName(cust.commercialName || '');
    setCompanyPhone(cust.phone || '');
    setCompanyWebsite(cust.website || '');
    setCompanyAddress(cust.address || '');
    setCompanyIndustry(cust.industry || '');
    setContactName(cust.managerName || '');
    setContactEmail(cust.managerEmail || '');
    setContactPhone(cust.managerPhone || '');
    setBusinessType(cust.customerType || 'Enterprise');
    setBusinessStatus(cust.status || 'فعال');

    setShowCustomerDrawer(true);
    setActiveRowActionId(null);
  };

  const handleOpenCreateCustomer = () => {
    setSelectedCustomerForEdit(null);
    setCustomerDrawerMode('create');
    
    // Clear fields
    setCompanyName('');
    setCompanyCommercialName('');
    setCompanyPhone('');
    setCompanyWebsite('');
    setCompanyAddress('');
    setCompanyIndustry('فناوری اطلاعات');
    setContactName('');
    setContactEmail('');
    setContactPhone('');
    setBusinessType('Enterprise');
    setBusinessStatus('فعال');

    setShowCustomerDrawer(true);
  };

  const handleDeactivateCustomer = (cust: Customer) => {
    setCustomerToDeactivate(cust);
    setShowDeactivateConfirm(true);
    setActiveRowActionId(null);
  };

  const handleDeleteCustomer = (cust: Customer) => {
    setCustomerToDelete(cust);
    setShowDeleteCustomerConfirm(true);
    setActiveRowActionId(null);
  };

  const confirmDeleteCustomer = async () => {
    if (!customerToDelete) return;
    setIsDeletingCustomer(true);
    try {
      await gql<{ deleteCustomer: boolean }>(DELETE_CUSTOMER, { id: customerToDelete.id });
      setCustomers(customers.filter((c) => c.id !== customerToDelete.id));
      showCustomerToast(`مشتری «${customerToDelete.name}» و تمامی داده‌های مرتبط با موفقیت حذف شد.`, 'success');
    } catch (err) {
      showCustomerToast('خطا در حذف مشتری: ' + ((err as Error).message || 'خطای ناشناخته'), 'error');
    }
    setIsDeletingCustomer(false);
    setShowDeleteCustomerConfirm(false);
    setCustomerToDelete(null);
  };

  const confirmDeactivateCustomer = async () => {
    if (!customerToDeactivate) return;

    const updatedStatus = customerToDeactivate.status === 'فعال' ? 'غیرفعال' : 'فعال';
    const apiStatus = updatedStatus === 'فعال' ? 'ACTIVE' : 'INACTIVE';

    try {
      await gql<{ updateCustomer: ApiCustomer }>(UPDATE_CUSTOMER, {
        input: { id: customerToDeactivate.id, status: apiStatus },
      });
      setCustomers(customers.map(c =>
        c.id === customerToDeactivate.id ? { ...c, status: updatedStatus } : c
      ));
      showCustomerToast(
        `وضعیت مشتری "${customerToDeactivate.name}" به "${updatedStatus === 'فعال' ? 'فعال' : 'غیرفعال'}" تغییر یافت.`,
        updatedStatus === 'فعال' ? 'success' : 'error'
      );
    } catch (err) {
      showCustomerToast('خطا در تغییر وضعیت: ' + ((err as Error).message || 'خطای ناشناخته'), 'error');
    }

    setShowDeactivateConfirm(false);
    setCustomerToDeactivate(null);
  };

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    handleSaveCustomer(e);
  };

  const handleApproveRequest = async (req: ApiAccessRequest) => {
    try {
      await gql<{ approveAccessRequest: ApiAccessRequest }>(APPROVE_ACCESS_REQUEST, {
        input: { id: req.id, industry: req.industry || 'سایر' },
      });
      setPendingRequests(pendingRequests.filter(r => r.id !== req.id));
      showCustomerToast(`درخواست "${req.companyName}" تأیید و حساب کاربری ایجاد شد.`, 'success');
      refetchCustomers();
    } catch (err) {
      showCustomerToast('خطا در تأیید درخواست: ' + ((err as Error).message || 'خطای ناشناخته'), 'error');
    }
  };

  const handleRejectRequest = async (req: ApiAccessRequest) => {
    try {
      await gql<{ rejectAccessRequest: ApiAccessRequest }>(REJECT_ACCESS_REQUEST, {
        input: { id: req.id },
      });
      setPendingRequests(pendingRequests.filter(r => r.id !== req.id));
      showCustomerToast(`درخواست "${req.companyName}" رد شد.`, 'error');
    } catch (err) {
      showCustomerToast('خطا در رد درخواست: ' + ((err as Error).message || 'خطای ناشناخته'), 'error');
    }
  };

  const updateTicketStatus = (id: string, nextStatus: Ticket['status']) => {
    setTickets(tickets.map(t => t.id === id ? { ...t, status: nextStatus } : t));
  };

  const markAllNotificationsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  // Memoized search and filter results
  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const matchesSearch = 
        t.title.toLowerCase().includes(ticketSearch.toLowerCase()) || 
        t.customer.toLowerCase().includes(ticketSearch.toLowerCase()) || 
        t.id.toLowerCase().includes(ticketSearch.toLowerCase());
      const matchesPriority = ticketPriorityFilter === 'همه' || t.priority === ticketPriorityFilter;
      const matchesStatus = ticketStatusFilter === 'همه' || t.status === ticketStatusFilter;
      return matchesSearch && matchesPriority && matchesStatus;
    });
  }, [tickets, ticketSearch, ticketPriorityFilter, ticketStatusFilter]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // Search term
      const matchesSearch = 
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.category.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.id.toLowerCase().includes(productSearch.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(productSearch.toLowerCase()));

      // Status filter
      const matchesStatus = productStatusFilter === 'همه' || p.status === productStatusFilter;

      // Version filter
      const matchesVersion = productVersionFilter === 'همه' || p.version === productVersionFilter;

      // Date filter
      let matchesDate = true;
      if (productDateFilter !== 'همه') {
        const year = p.createdAt ? p.createdAt.split('/')[0] : '';
        if (productDateFilter === '۱۴۰۲' && year !== '۱۴۰۲') matchesDate = false;
        if (productDateFilter === '۱۴۰۱' && year !== '۱۴۰۱') matchesDate = false;
        if (productDateFilter === '۱۴۰۰' && year !== '۱۴۰۰') matchesDate = false;
      }

      return matchesSearch && matchesStatus && matchesVersion && matchesDate;
    });
  }, [products, productSearch, productStatusFilter, productVersionFilter, productDateFilter]);

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const matchesSearch = 
        c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        c.industry.toLowerCase().includes(customerSearch.toLowerCase()) ||
        (c.commercialName && c.commercialName.toLowerCase().includes(customerSearch.toLowerCase())) ||
        (c.managerName && c.managerName.toLowerCase().includes(customerSearch.toLowerCase()));

      const matchesStatus = customerStatusFilter === 'همه' || c.status === customerStatusFilter;
      
      const matchesTier = customerTierFilter === 'همه' || c.customerType === customerTierFilter;

      let matchesProduct = true;
      if (customerProductFilter !== 'همه') {
        matchesProduct = (c.activeProductsCount ?? 0) > 0;
      }

      let matchesDate = true;
      if (customerDateFilter !== 'همه') {
        const raw = c.partnershipStartDate || '';
        const year = raw.includes('/') ? raw.split('/')[0] : raw.substring(0, 4);
        if (customerDateFilter === '۱۴۰۱' && year !== '۱۴۰۱') matchesDate = false;
        if (customerDateFilter === '۱۴۰۲' && year !== '۱۴۰۲') matchesDate = false;
        if (customerDateFilter === '۱۴۰۳' && year !== '۱۴۰۳') matchesDate = false;
      }

      return matchesSearch && matchesStatus && matchesTier && matchesProduct && matchesDate;
    });
  }, [customers, customerSearch, customerStatusFilter, customerProductFilter, customerDateFilter, customerTierFilter]);

  const unreadNotificationCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200" dir="rtl" id="cmp-dashboard-wrapper">
      
      {/* LOADING OVERLAY */}
      {ticketsLoading && tickets.length === 0 && (
        <div className="fixed inset-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
            <span className="text-sm text-slate-500">در حال بارگذاری...</span>
          </div>
        </div>
      )}

      {/* GLOBAL HEADER BAR */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/60 px-6 py-4 flex items-center justify-between" id="dashboard-header">
        <div className="flex items-center gap-4">
          {/* Mobile Menu Trigger */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            className="md:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            id="mobile-menu-trigger"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          
          {/* Page Title & Breadcrumb */}
          <div className="text-right">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">خانه /</span>
              <span className="text-xs text-brand-500 font-bold">
                {activeTab === 'dashboard' && 'داشبورد'}
                {activeTab === 'agent-portal' && 'پنل پشتیبانی'}
                {activeTab === 'products' && 'محصولات'}
                {activeTab === 'product-details' && `محصولات / ${selectedDetailProduct?.name || 'جزئیات محصول'}`}
                {activeTab === 'tickets' && 'تیکت‌ها'}
                {activeTab === 'customers' && 'مشتریان'}
                {activeTab === 'customer-details' && `مشتریان / کارپوشه ${selectedCustomerWorkspace?.name || 'توسعه امنیت آریا'}`}
                {activeTab === 'access-requests' && 'درخواست‌های دسترسی'}
                {activeTab === 'users' && 'کاربران'}
                {activeTab === 'reports' && 'گزارش‌ها'}
                {activeTab === 'notifications' && 'اعلان‌ها'}
                {activeTab === 'settings' && 'تنظیمات'}
              </span>
            </div>
            <h1 className="text-base font-black text-slate-900 dark:text-white mt-0.5">
              {activeTab === 'dashboard' && 'داشبورد'}
              {activeTab === 'agent-portal' && 'پنل پشتیبانی کارشناسان'}
              {activeTab === 'products' && 'محصولات و زیرسرویس‌ها'}
              {activeTab === 'product-details' && `شناسنامه فنی: ${selectedDetailProduct?.name || 'Cloud Security Platform'}`}
              {activeTab === 'tickets' && 'مدیریت و صندوق تیکت‌ها'}
              {activeTab === 'customers' && 'مدیریت مشتریان سازمانی'}
              {activeTab === 'customer-details' && `میز کار مشتری: ${selectedCustomerWorkspace?.name || 'شرکت توسعه امنیت آریا'}`}
              {activeTab === 'access-requests' && 'درخواست‌های دسترسی به سامانه'}
              {activeTab === 'users' && 'تیم پشتیبانی و کاربران'}
              {activeTab === 'reports' && 'گزارش‌ها و تحلیل عملکرد'}
              {activeTab === 'notifications' && 'مرکز اعلان‌های سیستم'}
              {activeTab === 'settings' && 'تنظیمات پیکربندی سحاب'}
            </h1>
          </div>
        </div>

        {/* Left Side Elements */}
        <div className="flex items-center gap-3">
          {/* Interactive Search Tooltip Trigger */}
          <div className="relative hidden sm:block">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="جستجوی سریع..." 
              className="pl-4 pr-10 py-2 w-44 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-xs focus:w-60 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all duration-300"
              value={ticketSearch}
              onChange={(e) => {
                setTicketSearch(e.target.value);
                if (activeTab !== 'tickets' && activeTab !== 'products' && activeTab !== 'customers') {
                  setActiveTab('tickets');
                }
              }}
            />
          </div>

          {/* Theme Switcher Button */}
          <button
            onClick={onToggleTheme}
            className="p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 text-slate-500 hover:text-brand-500 dark:text-slate-400 dark:hover:text-brand-400 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            title={isDark ? "پوسته روشن" : "پوسته تاریک"}
            id="theme-toggle-header"
          >
            {isDark ? <Sun className="w-4.5 h-4.5 text-amber-500" /> : <Moon className="w-4.5 h-4.5 text-brand-600" />}
          </button>

          {/* Notifications Trigger with Unread Badge */}
          <div className="relative">
            <button
              onClick={() => setShowNotificationMenu(!showNotificationMenu)}
              className="p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 text-slate-500 hover:text-brand-500 dark:text-slate-400 dark:hover:text-brand-400 hover:scale-105 active:scale-95 transition-all cursor-pointer relative"
              id="notifications-toggle"
            >
              <Bell className="w-4.5 h-4.5" />
              {unreadNotificationCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              )}
              {unreadNotificationCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500" />
              )}
            </button>

            {/* Notification Dropdown Popover */}
            <AnimatePresence>
              {showNotificationMenu && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowNotificationMenu(false)} />
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 mt-2.5 w-88 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xl z-40 overflow-hidden text-right"
                  >
                    <div className="p-4 bg-slate-50/80 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-brand-500" />
                        <span className="text-xs font-black text-slate-900 dark:text-white">اعلان‌های سیستم</span>
                        {unreadNotificationCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
                            {unreadNotificationCount} جدید
                          </span>
                        )}
                      </div>
                      <button 
                        onClick={markAllNotificationsRead}
                        className="text-[10px] font-bold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
                      >
                        خوانده شدن همه
                      </button>
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/40">
                      {notifications.map((n) => (
                        <div 
                          key={n.id} 
                          className={`p-3.5 text-right transition-colors cursor-pointer relative group ${
                            n.read ? 'bg-transparent' : 'bg-brand-500/5 dark:bg-brand-500/10'
                          }`}
                          onClick={() => {
                            setNotifications(notifications.map(item => item.id === n.id ? { ...item, read: true } : item));
                          }}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
                              {n.title}
                            </span>
                            <span className="text-[9px] font-mono text-slate-400 shrink-0">{n.time}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                            {n.description}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="p-3 bg-slate-50/50 dark:bg-slate-950/30 border-t border-slate-100 dark:border-slate-800 text-center flex items-center justify-between">
                      <button 
                        onClick={() => { setActiveTab('notifications'); setShowNotificationMenu(false); }}
                        className="text-xs font-black text-brand-600 dark:text-brand-400 hover:underline transition-colors flex items-center gap-1 mx-auto cursor-pointer"
                      >
                        <span>ورود به مرکز اعلان‌ها</span>
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* User Profile Mini Block */}
          <div className="h-9 w-[1px] bg-slate-200 dark:bg-slate-800" />
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold text-xs shadow-inner">
              {currentUserData ? currentUserData.name.substring(0, 2) : '?'}
            </div>
            <div className="hidden lg:flex flex-col text-right">
              <span className="text-xs font-black text-slate-800 dark:text-slate-200">{currentUserData?.name ?? '?'}</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">{currentUserData?.role ?? '?'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* WORKSPACE LAYOUT CONTAINER */}
      <div className="flex-1 flex" id="main-workspace-container">
        
        {/* FIXED RIGHT SIDEBAR NAVIGATION */}
        <aside 
          className={`md:sticky md:top-0 fixed inset-y-0 right-0 z-30 bg-white dark:bg-slate-900 border-l border-slate-200/60 dark:border-slate-800/60 pt-20 pb-6 transform transition-all duration-300 ease-in-out md:translate-x-0 md:pt-6 flex flex-col ${
            sidebarCollapsed ? 'md:w-20 md:px-2.5' : 'md:w-64 md:px-4'
          } w-64 px-4 ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
          id="sidebar-navigation"
        >
          {/* Collapse/Expand Toggle Button (Desktop Only) */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden md:flex absolute top-6 -left-3.5 z-40 w-7 h-7 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-full items-center justify-center text-slate-500 hover:text-brand-500 dark:text-slate-400 dark:hover:text-brand-400 shadow-sm hover:scale-110 transition-all cursor-pointer"
            title={sidebarCollapsed ? "گسترش منو" : "جمع کردن منو"}
          >
            {sidebarCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>

          <div className="flex-1 overflow-y-auto min-h-0">
            {/* Logo / Brand Area */}
            <div className={`flex items-center ${sidebarCollapsed ? 'justify-center mb-8' : 'gap-3 mb-8 px-2'}`}>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-white shadow-md shadow-brand-500/20 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              {!sidebarCollapsed && (
                <div className="text-right">
                  <span className="text-sm font-black text-slate-900 dark:text-white block tracking-tight">سامانه ابری مدیریت مشتریان</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">پشتیبانی و امور مشتریان</span>
                </div>
              )}
            </div>

            {/* Navigation Items (All 8 requested tabs + active states) */}
            <nav className="space-y-1">
            <button
              onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center transition-all duration-200 ${sidebarCollapsed ? 'justify-center px-2 py-3' : 'gap-3 px-4 py-3'} rounded-xl text-xs font-semibold ${
                activeTab === 'dashboard' 
                  ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 border-r-4 border-brand-500' 
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title={sidebarCollapsed ? "داشبورد" : undefined}
            >
              <LayoutDashboard className="w-4.5 h-4.5 shrink-0" />
              {!sidebarCollapsed && <span className="whitespace-nowrap">داشبورد</span>}
            </button>

            <button
              onClick={() => { setActiveTab('products'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center transition-all duration-200 ${sidebarCollapsed ? 'justify-center px-2 py-3' : 'gap-3 px-4 py-3'} rounded-xl text-xs font-semibold ${
                activeTab === 'products' 
                  ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 border-r-4 border-brand-500' 
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title={sidebarCollapsed ? "محصولات" : undefined}
            >
              <Layers className="w-4.5 h-4.5 shrink-0" />
              {!sidebarCollapsed && <span className="whitespace-nowrap">محصولات</span>}
              {!sidebarCollapsed && (
                <span className="mr-auto text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-500 dark:text-slate-400 font-mono">
                  {products.length}
                </span>
              )}
            </button>

            <button
              onClick={() => { setActiveTab('tickets'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center transition-all duration-200 ${sidebarCollapsed ? 'justify-center px-2 py-3' : 'gap-3 px-4 py-3'} rounded-xl text-xs font-semibold ${
                activeTab === 'tickets' 
                  ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 border-r-4 border-brand-500' 
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title={sidebarCollapsed ? "تیکت‌ها" : undefined}
            >
              <Inbox className="w-4.5 h-4.5 shrink-0" />
              {!sidebarCollapsed && <span className="whitespace-nowrap">تیکت‌ها</span>}
              {!sidebarCollapsed && (
                <span className="mr-auto text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-500 dark:text-slate-400 font-mono">
                  {tickets.filter(t => t.status !== 'بسته شده').length}
                </span>
              )}
            </button>

            <button
              onClick={() => { setActiveTab('customers'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center transition-all duration-200 ${sidebarCollapsed ? 'justify-center px-2 py-3' : 'gap-3 px-4 py-3'} rounded-xl text-xs font-semibold ${
                (activeTab === 'customers' || activeTab === 'customer-details')
                  ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 border-r-4 border-brand-500' 
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title={sidebarCollapsed ? "مشتریان" : undefined}
            >
              <Users2 className="w-4.5 h-4.5 shrink-0" />
              {!sidebarCollapsed && <span className="whitespace-nowrap">مشتریان</span>}
              {!sidebarCollapsed && (
                <span className="mr-auto text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-500 dark:text-slate-400 font-mono">
                  {customers.length}
                </span>
              )}
            </button>

            <button
              onClick={() => { setActiveTab('access-requests'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center transition-all duration-200 ${sidebarCollapsed ? 'justify-center px-2 py-3' : 'gap-3 px-4 py-3'} rounded-xl text-xs font-semibold ${
                activeTab === 'access-requests' 
                  ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 border-r-4 border-brand-500' 
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title={sidebarCollapsed ? "درخواست‌ها" : undefined}
            >
              <ClipboardList className="w-4.5 h-4.5 shrink-0" />
              {!sidebarCollapsed && <span className="whitespace-nowrap">درخواست‌ها</span>}
              {!sidebarCollapsed && pendingRequests.length > 0 && (
                <span className="mr-auto text-[10px] bg-amber-500/15 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full font-mono font-extrabold">
                  {pendingRequests.length}
                </span>
              )}
            </button>

            <button
              onClick={() => { setActiveTab('users'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center transition-all duration-200 ${sidebarCollapsed ? 'justify-center px-2 py-3' : 'gap-3 px-4 py-3'} rounded-xl text-xs font-semibold ${
                activeTab === 'users' 
                  ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 border-r-4 border-brand-500' 
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title={sidebarCollapsed ? "کاربران" : undefined}
            >
              <User className="w-4.5 h-4.5 shrink-0" />
              {!sidebarCollapsed && <span className="whitespace-nowrap">کاربران</span>}
            </button>

            <button
              onClick={() => { setActiveTab('reports'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center transition-all duration-200 ${sidebarCollapsed ? 'justify-center px-2 py-3' : 'gap-3 px-4 py-3'} rounded-xl text-xs font-semibold ${
                activeTab === 'reports' 
                  ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 border-r-4 border-brand-500' 
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title={sidebarCollapsed ? "گزارش‌ها" : undefined}
            >
              <BarChart3 className="w-4.5 h-4.5 shrink-0" />
              {!sidebarCollapsed && <span className="whitespace-nowrap">گزارش‌ها</span>}
            </button>

            <button
              onClick={() => { setActiveTab('notifications'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center transition-all duration-200 ${sidebarCollapsed ? 'justify-center px-2 py-3' : 'gap-3 px-4 py-3'} rounded-xl text-xs font-semibold ${
                activeTab === 'notifications' 
                  ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 border-r-4 border-brand-500' 
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title={sidebarCollapsed ? "اعلان‌ها" : undefined}
            >
              <Bell className="w-4.5 h-4.5 shrink-0" />
              {!sidebarCollapsed && <span className="whitespace-nowrap">اعلان‌ها</span>}
              {unreadNotificationCount > 0 && !sidebarCollapsed && (
                <span className="mr-auto text-[10px] bg-rose-500 text-white px-2 py-0.5 rounded-full font-mono font-bold">
                  {unreadNotificationCount}
                </span>
              )}
            </button>

            <button
              onClick={() => { setActiveTab('settings'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center transition-all duration-200 ${sidebarCollapsed ? 'justify-center px-2 py-3' : 'gap-3 px-4 py-3'} rounded-xl text-xs font-semibold ${
                activeTab === 'settings' 
                  ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 border-r-4 border-brand-500' 
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title={sidebarCollapsed ? "تنظیمات" : undefined}
            >
              <Settings className="w-4.5 h-4.5 shrink-0" />
              {!sidebarCollapsed && <span className="whitespace-nowrap">تنظیمات</span>}
            </button>
          </nav>
          </div>

          {/* SIDEBAR FOOTER: USER PROFILE MINI CARD (Requested) */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 text-right sticky bottom-7">
            {!sidebarCollapsed ? (
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/60 flex flex-col gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-800 dark:text-slate-200 font-bold text-xs">
                    {currentUserData ? currentUserData.name.substring(0, 2) : '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{currentUserData?.name ?? '?'}</h4>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{currentUserData?.role ?? '?'}</p>
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  className="w-full py-2 px-3 rounded-xl border border-rose-200/50 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center justify-center gap-2 text-[11px] font-bold transition-all cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>خروج از حساب</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onLogout}
                className="w-10 h-10 mx-auto rounded-xl border border-rose-200 dark:border-rose-900/30 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center justify-center transition-all cursor-pointer"
                title="خروج از حساب کاربری"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </aside>

        {/* MOBILE MENU OVERLAY BACKDROP */}
        {mobileMenuOpen && (
          <div 
            onClick={() => setMobileMenuOpen(false)} 
            className="fixed inset-0 z-20 bg-slate-950/40 backdrop-blur-xs md:hidden"
          />
        )}

        {/* MAIN WORKSPACE CONTENT */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
          <AnimatePresence mode="wait">
            
            {/* TABS SWITCH ENGINE */}

            {/* TAB 1: MAIN DASHBOARD VIEW (Specified in detailed Screen 02 request) */}
            {activeTab === 'dashboard' && (
              <motion.div
                key="dashboard-tab"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* 1. WELCOME SECTION */}
                <div className="bg-gradient-to-l from-brand-600 to-brand-700 dark:from-slate-900 dark:to-slate-800/80 p-6 md:p-8 rounded-3xl text-white relative overflow-hidden shadow-lg shadow-brand-600/10 border border-transparent dark:border-slate-800">
                  {/* Subtle vector circles overlay for 2026 feel */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.06),transparent_50%)] pointer-events-none" />
                  <div className="absolute top-1/2 left-8 -translate-y-1/2 opacity-15 pointer-events-none hidden md:block">
                    <Sparkles className="w-36 h-36 text-white" />
                  </div>

                  <div className="max-w-xl space-y-4 relative z-10">
                    <span className="text-[10px] uppercase tracking-wider font-extrabold bg-white/10 dark:bg-brand-500/20 px-3 py-1 rounded-full text-brand-100 dark:text-brand-300">
                      محیط مدیریت فعال
                    </span>
                    <h2 className="text-xl md:text-2xl font-black">سلام، خوش آمدید</h2>
                    <p className="text-xs md:text-sm text-brand-100 dark:text-slate-300 leading-relaxed">
                      وضعیت سیستم و فعالیت‌های اخیر را مشاهده کنید. تمام فرایندهای پشتیبانی، پاسخگویی به زیرسرویس‌ها و مشتریان سازمانی در وضعیت ایمن قرار دارند.
                    </p>
                    <div className="pt-2">
                      <button 
                        onClick={() => setShowTicketModal(true)}
                        className="bg-white hover:bg-slate-100 text-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600 dark:text-white text-xs font-black px-5 py-3 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-md shadow-black/10 cursor-pointer"
                      >
                        ایجاد تیکت جدید
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. STATISTICS CARDS (4 KPIs) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Card 1: "تعداد محصولات" → clickable → products tab */}
                  <div
                    onClick={() => setActiveTab('products')}
                    className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs flex items-center justify-between cursor-pointer hover:border-brand-500/40 dark:hover:border-brand-500/40 transition-colors"
                  >
                    <div className="space-y-1">
                      <span className="text-xs text-slate-400 dark:text-slate-500 block font-semibold">تعداد محصولات</span>
                      <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">{products.length}</span>
                      <span className="text-[10px] text-emerald-500 block font-medium">{products.filter(p => p.status === 'فعال').length} محصول فعال</span>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-brand-500/10 dark:bg-brand-500/20 text-brand-500 flex items-center justify-center">
                      <Layers className="w-6 h-6" />
                    </div>
                  </div>

                  {/* Card 2: "تیکت‌های باز" → clickable → tickets tab */}
                  <div
                    onClick={() => setActiveTab('tickets')}
                    className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs flex items-center justify-between cursor-pointer hover:border-amber-500/40 dark:hover:border-amber-500/40 transition-colors"
                  >
                    <div className="space-y-1">
                      <span className="text-xs text-slate-400 dark:text-slate-500 block font-semibold">تیکت‌های باز</span>
                      <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                        {tickets.filter(t => t.status !== 'بسته شده').length}
                      </span>
                      <span className="text-[10px] text-amber-500 block font-medium">پاسخ سریع برای حفظ SLA</span>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-500 flex items-center justify-center animate-pulse">
                      <Inbox className="w-6 h-6" />
                    </div>
                  </div>

                  {/* Card 3: "مشتریان فعال" → clickable → customers tab */}
                  <div
                    onClick={() => setActiveTab('customers')}
                    className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs flex items-center justify-between cursor-pointer hover:border-brand-500/40 dark:hover:border-brand-500/40 transition-colors"
                  >
                    <div className="space-y-1">
                      <span className="text-xs text-slate-400 dark:text-slate-500 block font-semibold">مشتریان فعال</span>
                      <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">{customers.length}</span>
                      <span className="text-[10px] text-brand-500 block font-medium">{customers.filter(c => c.status === 'فعال').length} مشتری فعال</span>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-brand-500/10 dark:bg-brand-500/20 text-brand-500 flex items-center justify-center">
                      <Users2 className="w-6 h-6" />
                    </div>
                  </div>

                  {/* Card 4: "میانگین زمان پاسخ" → clickable → tickets tab */}
                  <div
                    onClick={() => setActiveTab('tickets')}
                    className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs flex items-center justify-between cursor-pointer hover:border-emerald-500/40 dark:hover:border-emerald-500/40 transition-colors"
                  >
                    <div className="space-y-1">
                      <span className="text-xs text-slate-400 dark:text-slate-500 block font-semibold">میانگین زمان پاسخ</span>
                      <span className="text-2xl font-black text-slate-900 dark:text-white">۲ ساعت</span>
                      <span className="text-[10px] text-emerald-500 block font-medium">سریع‌تر از سطح توافق (SLA)</span>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                      <Clock className="w-6 h-6" />
                    </div>
                  </div>
                </div>

                {/* 3. MAIN DASHBOARD SECTIONS (Two-Column Layout) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Column 1 (2/3 width on desktop): RECENT TICKETS */}
                  <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Inbox className="w-5 h-5 text-brand-500" />
                        <h3 className="text-sm font-bold text-slate-950 dark:text-white">آخرین تیکت‌ها</h3>
                      </div>
                      <button 
                        onClick={() => setActiveTab('tickets')}
                        className="text-xs text-brand-500 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>مشاهده همه</span>
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-right border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-slate-800/60 text-slate-400 dark:text-slate-500 text-[10px] font-bold">
                            <th className="p-4 pr-5">موضوع تیکت</th>
                            <th className="p-4">مشتری</th>
                            <th className="p-4">اولویت</th>
                            <th className="p-4">وضعیت</th>
                            <th className="p-4 pl-5">زمان</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/30">
                          {tickets.slice(0, 4).map((ticket) => (
                            <tr 
                              key={ticket.id} 
                              className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 text-xs text-slate-700 dark:text-slate-300 transition-colors"
                            >
                              <td className="p-4 pr-5 font-semibold text-slate-900 dark:text-white max-w-[200px] truncate">{ticket.title}</td>
                              <td className="p-4">{ticket.customer}</td>
                              <td className="p-4">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                  ticket.priority === 'بحرانی' ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400' :
                                  ticket.priority === 'بالا' ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' :
                                  ticket.priority === 'متوسط' ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400' :
                                  'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                }`}>
                                  <span className={`w-1 h-1 rounded-full ${
                                    ticket.priority === 'بحرانی' ? 'bg-rose-500' :
                                    ticket.priority === 'بالا' ? 'bg-amber-500' :
                                    ticket.priority === 'متوسط' ? 'bg-brand-500' :
                                    'bg-slate-400'
                                  }`} />
                                  {ticket.priority}
                                </span>
                              </td>
                              <td className="p-4">
                                <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[9px] font-bold ${
                                  ticket.status === 'باز' ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' :
                                  ticket.status === 'در حال بررسی' ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' :
                                  ticket.status === 'منتظر پاسخ مشتری' ? 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400' :
                                  'bg-slate-100 text-slate-500 dark:bg-slate-800/80 dark:text-slate-400'
                                }`}>
                                  {ticket.status}
                                </span>
                              </td>
                              <td className="p-4 pl-5 text-slate-400 dark:text-slate-500 font-bold text-sm">{formatDateTime(ticket.date)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Column 2 (1/3 width on desktop): RECENT ACTIVITY TIMELINE */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs p-5 flex flex-col">
                    <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                      <Activity className="w-5 h-5 text-indigo-500" />
                      <h3 className="text-sm font-bold text-slate-950 dark:text-white">فعالیت‌های اخیر</h3>
                    </div>

                    {/* Timeline items */}
                    <div className="flex-1 space-y-5 relative">
                      {/* Left vertical timeline pipe */}
                      <div className="absolute right-3.5 top-1 bottom-1 w-[1.5px] bg-slate-100 dark:bg-slate-800" />

                      {activities.map((act) => (
                        <div key={act.id} className="flex gap-4 relative z-10 text-right">
                          <div className={`w-7.5 h-7.5 rounded-full flex items-center justify-center shrink-0 ${
                            act.type === 'ticket' ? 'bg-blue-500/10 text-blue-500' :
                            act.type === 'reply' ? 'bg-emerald-500/10 text-emerald-500' :
                            act.type === 'product' ? 'bg-brand-500/10 text-brand-500' :
                            'bg-indigo-500/10 text-indigo-500'
                          }`}>
                            {act.type === 'ticket' && <Inbox className="w-4 h-4" />}
                            {act.type === 'reply' && <MessageSquare className="w-4 h-4" />}
                            {act.type === 'product' && <Layers className="w-4 h-4" />}
                            {act.type === 'customer' && <Users2 className="w-4 h-4" />}
                          </div>

                          <div className="flex-1 min-w-0 space-y-0.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-900 dark:text-white">{act.title}</span>
                              <span className="text-[9px] font-mono text-slate-400 font-bold">{act.time}</span>
                            </div>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-normal">{act.subtitle}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </motion.div>
            )}

            {/* TAB 2: PRODUCTS VIEW */}
            {activeTab === 'products' && (
              <motion.div
                key="products-tab"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="space-y-6 relative"
              >
                {/* TOAST FEEDBACK ALERT */}
                <AnimatePresence>
                  {productFeedback && (
                    <motion.div
                      initial={{ opacity: 0, y: -20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.95 }}
                      className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4.5 py-3 rounded-xl shadow-xl border ${
                        productFeedback.type === 'success'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/80 dark:border-emerald-800 dark:text-emerald-300'
                          : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/80 dark:border-rose-800 dark:text-rose-300'
                      }`}
                    >
                      {productFeedback.type === 'success' ? (
                        <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
                      )}
                      <span className="text-xs font-bold leading-none">{productFeedback.message}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* PAGE HEADER */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/50 dark:border-slate-800/50" id="products-page-header">
                  <div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">مدیریت محصولات</h2>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-semibold">مشاهده، ایجاد و مدیریت محصولات سامانه</p>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* SIMULATION CONTROLS */}
                    <div className="hidden lg:flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/40 dark:border-slate-700/40">
                      <button
                        onClick={() => {
                          setIsProductLoading(true);
                          setTimeout(() => setIsProductLoading(false), 1200);
                        }}
                        className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 bg-white dark:bg-slate-900 shadow-xs cursor-pointer flex items-center gap-1 transition-colors"
                        title="شبیه‌سازی بارگذاری سرور با اسکلتون"
                      >
                        <RefreshCw className="w-3 h-3 text-brand-500 animate-spin" />
                        <span>اسکلتون</span>
                      </button>

                      <button
                        onClick={() => setProductErrorState(!productErrorState)}
                        className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                          productErrorState
                            ? 'bg-rose-500 text-white shadow-xs'
                            : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 bg-white dark:bg-slate-900'
                        }`}
                        title="شبیه‌سازی خطای شبکه سرور"
                      >
                        <span>خطای سرور</span>
                      </button>
                    </div>

                    <button
                      onClick={handleOpenDrawerForCreate}
                      className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-black px-5 py-3 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-brand-500/20 active:scale-95 transition-all cursor-pointer"
                    >
                      <Plus className="w-4.5 h-4.5" />
                      <span>افزودن محصول جدید</span>
                    </button>
                  </div>
                </div>

                {/* SEARCH AND FILTER TOOLBAR */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs space-y-3">
                  <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
                    
                    {/* Search Input */}
                    <div className="relative flex-1">
                      <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 pointer-events-none" />
                      <input 
                        type="text" 
                        placeholder="جستجوی محصول..." 
                        className="pl-4 pr-10 py-2.5 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-xs font-semibold outline-none focus:ring-2 focus:ring-brand-500/10 focus:border-brand-500 transition-all text-slate-800 dark:text-slate-100"
                        value={productSearch}
                        onChange={(e) => { setProductSearch(e.target.value); setProductPage(1); }}
                      />
                    </div>

                    {/* Filter Dropdowns container */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 lg:w-[500px]">
                      
                      {/* Filter 1: Status */}
                      <div className="relative">
                        <select
                          value={productStatusFilter}
                          onChange={(e) => { setProductStatusFilter(e.target.value); setProductPage(1); }}
                          className="w-full text-[11px] font-bold border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/40 px-3 py-2.5 outline-none focus:border-brand-500 text-slate-600 dark:text-slate-300 cursor-pointer"
                        >
                          <option value="همه">وضعیت: همه</option>
                          <option value="فعال">فعال</option>
                          <option value="غیرفعال">غیرفعال</option>
                          <option value="منقضی شده">منقضی شده</option>
                        </select>
                      </div>

                      {/* Filter 2: Version */}
                      <div className="relative">
                        <select
                          value={productVersionFilter}
                          onChange={(e) => { setProductVersionFilter(e.target.value); setProductPage(1); }}
                          className="w-full text-[11px] font-bold border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/40 px-3 py-2.5 outline-none focus:border-brand-500 text-slate-600 dark:text-slate-300 cursor-pointer"
                        >
                          <option value="همه">نسخه: همه</option>
                          <option value="v2.4.1">v2.4.1</option>
                          <option value="v3.1.2">v3.1.2</option>
                          <option value="v5.0.1">v5.0.1</option>
                          <option value="v1.0.4">v1.0.4</option>
                          <option value="v2.0.0">v2.0.0</option>
                          <option value="v1.5.0">v1.5.0</option>
                        </select>
                      </div>

                      {/* Filter 3: Creation Date */}
                      <div className="relative">
                        <select
                          value={productDateFilter}
                          onChange={(e) => { setProductDateFilter(e.target.value); setProductPage(1); }}
                          className="w-full text-[11px] font-bold border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/40 px-3 py-2.5 outline-none focus:border-brand-500 text-slate-600 dark:text-slate-300 cursor-pointer"
                        >
                          <option value="همه">تاریخ ایجاد: همه</option>
                          <option value="۱۴۰۲">امسال (۱۴۰۲)</option>
                          <option value="۱۴۰۱">سال گذشته (۱۴۰۱)</option>
                          <option value="۱۴۰۰">دو سال قبل (۱۴۰۰)</option>
                        </select>
                      </div>

                    </div>

                    {/* Clear Filters Button */}
                    <button
                      onClick={() => {
                        setProductSearch('');
                        setProductStatusFilter('همه');
                        setProductVersionFilter('همه');
                        setProductDateFilter('همه');
                        setProductPage(1);
                        showFeedback('فیلترها با موفقیت بازنشانی شدند.');
                      }}
                      className="px-4.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>پاک کردن فیلترها</span>
                    </button>

                  </div>
                </div>

                {/* CORE CONTENT SWITCHER (ERROR, LOADING SKELETON, TABLE OR EMPTY STATE) */}
                {productErrorState ? (
                  /* ERROR STATE */
                  <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-10 text-center space-y-4 shadow-sm">
                    <div className="w-14 h-14 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto">
                      <AlertTriangle className="w-8 h-8" />
                    </div>
                    <div className="max-w-md mx-auto space-y-2">
                      <h3 className="text-base font-black text-slate-900 dark:text-white">خطا در دریافت لیست محصولات</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        سامانه در حال حاضر قادر به ارتباط با درگاه وب‌سرویس پلتفرم‌های ابری نمی‌باشد. لطفا صحت اتصال اینترنت خود را چک کرده و دوباره تلاش کنید.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setIsProductLoading(true);
                        setProductErrorState(false);
                        setTimeout(() => setIsProductLoading(false), 800);
                      }}
                      className="bg-rose-500 hover:bg-rose-600 text-white text-xs font-black px-5 py-2.5 rounded-xl transition-all shadow-md shadow-rose-500/10 cursor-pointer"
                    >
                      تلاش مجدد
                    </button>
                  </div>
                ) : isProductLoading ? (
                  /* LOADING SKELETON STATE */
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs overflow-hidden">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold text-xs font-semibold">
                      در حال دریافت اطلاعات...
                    </div>
                    <div className="p-6 space-y-4">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="flex items-center justify-between gap-4 animate-pulse">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-200 dark:bg-slate-800 rounded-xl" />
                            <div className="space-y-2">
                              <div className="h-3 w-36 bg-slate-200 dark:bg-slate-800 rounded-sm" />
                              <div className="h-2 w-24 bg-slate-100 dark:bg-slate-800/60 rounded-sm" />
                            </div>
                          </div>
                          <div className="h-3 w-16 bg-slate-100 dark:bg-slate-800 rounded-sm" />
                          <div className="h-3 w-20 bg-slate-100 dark:bg-slate-800 rounded-sm" />
                          <div className="h-6 w-14 bg-slate-100 dark:bg-slate-800 rounded-full" />
                          <div className="h-8 w-8 bg-slate-100 dark:bg-slate-800 rounded-lg" />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  /* EMPTY STATE */
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-12 text-center space-y-5 shadow-xs">
                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                      <Layers className="w-7 h-7 opacity-70" />
                    </div>
                    <div className="max-w-sm mx-auto space-y-1.5">
                      <h3 className="text-sm font-black text-slate-900 dark:text-white">هنوز محصولی ثبت نشده است</h3>
                      <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
                        هیچ محصول یا پلتفرمی مطابق با فیلترهای جستجوی شما یافت نشد یا هنوز کاتالوگی ایجاد نکرده‌اید.
                      </p>
                    </div>
                    <div className="flex justify-center gap-3">
                      {productSearch || productStatusFilter !== 'همه' || productVersionFilter !== 'همه' || productDateFilter !== 'همه' ? (
                        <button
                          onClick={() => {
                            setProductSearch('');
                            setProductStatusFilter('همه');
                            setProductVersionFilter('همه');
                            setProductDateFilter('همه');
                          }}
                          className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer"
                        >
                          پاک کردن فیلترها
                        </button>
                      ) : null}
                      <button
                        onClick={handleOpenDrawerForCreate}
                        className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-black px-5 py-2.5 rounded-xl shadow-md shadow-brand-500/10 cursor-pointer"
                      >
                        ایجاد محصول جدید
                      </button>
                    </div>
                  </div>
                ) : (
                  /* PRODUCTS DATA TABLE */
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-right border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-xs font-black select-none bg-slate-50/50 dark:bg-slate-900/50">
                            <th className="p-4 pr-6">لوگو / آیکون محصول</th>
                            <th className="p-4">نام محصول</th>
                            <th className="p-4">نسخه</th>
                            <th className="p-4">تعداد مشتریان</th>
                            <th className="p-4">وضعیت</th>
                            <th className="p-4">آخرین بروزرسانی</th>
                            <th className="p-4 pl-6 text-left">عملیات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-xs text-slate-700 dark:text-slate-300">
                          {filteredProducts
                            .slice((productPage - 1) * productItemsPerPage, productPage * productItemsPerPage)
                            .map((p) => (
                              <tr 
                                key={p.id} 
                                className="hover:bg-slate-50/40 dark:hover:bg-slate-800/10 group transition-colors duration-150"
                              >
                                {/* logo */}
                                <td className="p-4 pr-6">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${p.logoColor || 'from-slate-500 to-slate-600'} text-white font-extrabold flex items-center justify-center shadow-xs text-xs tracking-wider shrink-0`}>
                                      {p.logoInitials || p.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <span className="font-mono font-bold text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">{p.id}</span>
                                  </div>
                                </td>

                                {/* Name & category */}
                                <td className="p-4">
                                  <div 
                                    onClick={() => handleOpenProductDetails(p)}
                                    className="font-black text-slate-900 dark:text-white text-xs hover:text-brand-600 dark:hover:text-brand-400 cursor-pointer transition-colors hover:underline"
                                  >
                                    {p.name}
                                  </div>
                                  <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-bold">دسته: {p.category}</div>
                                </td>

                                {/* Version */}
                                <td className="p-4 font-mono font-semibold">
                                  <span className="px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-800 text-[10px] bg-slate-50 dark:bg-slate-950/40 text-slate-600 dark:text-slate-400">
                                    {p.version}
                                  </span>
                                </td>

                                {/* Client count */}
                                <td className="p-4 font-bold text-slate-800 dark:text-slate-200 font-mono">
                                  {p.clientsCount} مشتری
                                </td>

                                {/* Status */}
                                <td className="p-4">
                                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                                    p.status === 'فعال' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' :
                                    p.status === 'غیرفعال' ? 'bg-slate-100 text-slate-500 dark:bg-slate-800/80 dark:text-slate-400' :
                                    'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'
                                  }`}>
                                    {p.status === 'فعال' && (
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    )}
                                    {p.status}
                                  </span>
                                </td>

                                {/* Last Updated */}
                                <td className="p-4 text-slate-500 dark:text-slate-400 font-medium">
                                  {p.lastUpdated}
                                </td>

                                {/* Operations menu */}
                                <td className="p-4 pl-6 text-left relative">
                                  <div className="inline-block text-right">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveRowActionId(activeRowActionId === p.id ? null : p.id);
                                      }}
                                      className="p-1.5 rounded-lg border border-slate-200/50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-500 dark:text-slate-400 cursor-pointer transition-colors"
                                      title="عملیات مدیریت محصول"
                                    >
                                      <MoreHorizontal className="w-4 h-4" />
                                    </button>

                                    {/* Action Dropdown Menu */}
                                    <AnimatePresence>
                                      {activeRowActionId === p.id && (
                                        <>
                                          {/* Screen overlay to click close */}
                                          <div 
                                            className="fixed inset-0 z-10 cursor-default" 
                                            onClick={() => setActiveRowActionId(null)}
                                          />
                                          <motion.div
                                            initial={{ opacity: 0, scale: 0.95, y: -5 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95, y: -5 }}
                                            transition={{ duration: 0.12 }}
                                            className="absolute left-6 mt-1.5 w-44 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl z-20 overflow-hidden py-1 text-right"
                                          >
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setActiveRowActionId(null);
                                                handleOpenProductDetails(p);
                                              }}
                                              className="w-full px-3.5 py-2 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center gap-2 cursor-pointer transition-colors text-right"
                                            >
                                              <Eye className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                              <span>مشاهده جزئیات</span>
                                            </button>

                                            <button
                                              type="button"
                                              onClick={() => handleOpenDrawerForEdit(p)}
                                              className="w-full px-3.5 py-2 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center gap-2 cursor-pointer transition-colors text-right"
                                            >
                                              <Edit className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                              <span>ویرایش محصول</span>
                                            </button>

                                            <button
                                              type="button"
                                              onClick={() => {
                                                setActiveRowActionId(null);
                                                showFeedback(`بخش مدیریت مشتریان محصول "${p.name}" فراخوانی شد.`);
                                              }}
                                              className="w-full px-3.5 py-2 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center gap-2 cursor-pointer transition-colors text-right"
                                            >
                                              <Users2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                              <span>مدیریت مشتریان</span>
                                            </button>

                                            <button
                                              type="button"
                                              onClick={() => {
                                                setActiveRowActionId(null);
                                                setTicketSearch(p.name);
                                                setTicketPriorityFilter('همه');
                                                setTicketStatusFilter('همه');
                                                setActiveTab('tickets');
                                                showFeedback(`نمایش تیکت‌های مربوط به محصول "${p.name}"`);
                                              }}
                                              className="w-full px-3.5 py-2 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center gap-2 cursor-pointer transition-colors text-right"
                                            >
                                              <Inbox className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                              <span>مشاهده تیکت‌ها</span>
                                            </button>

                                            <div className="h-[1px] bg-slate-100 dark:bg-slate-800 my-1" />

                                            <button
                                              type="button"
                                              onClick={() => handleToggleProductStatus(p.id)}
                                              className={`w-full px-3.5 py-2 text-[11px] font-bold flex items-center gap-2 cursor-pointer transition-colors text-right ${
                                                p.status === 'فعال'
                                                  ? 'text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10'
                                                  : 'text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10'
                                              }`}
                                            >
                                              <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                                              <span>{p.status === 'فعال' ? 'غیرفعال کردن' : 'فعال کردن'}</span>
                                            </button>

                                            <div className="h-[1px] bg-slate-100 dark:bg-slate-800 my-1" />

                                            <button
                                              type="button"
                                              onClick={() => handleDeleteProduct(p)}
                                              className="w-full px-3.5 py-2 text-[11px] font-bold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10 flex items-center gap-2 cursor-pointer transition-colors text-right"
                                            >
                                              <Trash2 className="w-3.5 h-3.5 shrink-0" />
                                              <span>حذف محصول</span>
                                            </button>
                                          </motion.div>
                                        </>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>

                    {/* PAGINATION PANEL */}
                    <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/30">
                      
                      {/* Left: count description */}
                      <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                        نمایش{' '}
                        <span className="font-mono text-slate-800 dark:text-slate-200">
                          {Math.min((productPage - 1) * productItemsPerPage + 1, filteredProducts.length)}
                        </span>{' '}
                        تا{' '}
                        <span className="font-mono text-slate-800 dark:text-slate-200">
                          {Math.min(productPage * productItemsPerPage, filteredProducts.length)}
                        </span>{' '}
                        از{' '}
                        <span className="font-mono text-slate-800 dark:text-slate-200">
                          {filteredProducts.length}
                        </span>{' '}
                        محصول ثبت شده
                      </div>

                      {/* Right side controls: items per page + navigation */}
                      <div className="flex items-center gap-4.5 font-bold">
                        
                        {/* Selector items count */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-400 font-semibold">تعداد در صفحه:</span>
                          <select
                            value={productItemsPerPage}
                            onChange={(e) => { setProductItemsPerPage(Number(e.target.value)); setProductPage(1); }}
                            className="text-[10px] font-bold px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
                          >
                            <option value={2}>۲ تایی</option>
                            <option value={5}>۵ تایی</option>
                            <option value={10}>۱۰ تایی</option>
                          </select>
                        </div>

                        {/* Prev/Next buttons */}
                        <div className="flex items-center gap-1">
                          
                          <button
                            onClick={() => setProductPage(prev => Math.max(prev - 1, 1))}
                            disabled={productPage === 1}
                            className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/80 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer transition-colors"
                            title="صفحه قبل"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>

                          <div className="text-[11px] font-mono px-2">
                            صفحه <span className="text-slate-900 dark:text-white font-extrabold">{productPage}</span> از <span className="text-slate-400">{Math.ceil(filteredProducts.length / productItemsPerPage)}</span>
                          </div>

                          <button
                            onClick={() => setProductPage(prev => Math.min(prev + 1, Math.ceil(filteredProducts.length / productItemsPerPage)))}
                            disabled={productPage >= Math.ceil(filteredProducts.length / productItemsPerPage)}
                            className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/80 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer transition-colors"
                            title="صفحه بعد"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>

                        </div>

                      </div>

                    </div>
                  </div>
                )}

                {/* PRODUCT CREATION/EDIT/VIEW RIGHT SIDE DRAWER */}
                <AnimatePresence>
                  {showProductDrawer && (
                    <>
                      {/* Drawer overlay backdrop */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowProductDrawer(false)}
                        className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 cursor-default"
                      />

                      {/* Right-side Drawer panel */}
                      <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 26, stiffness: 220 }}
                        className="fixed inset-y-0 right-0 w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl z-50 flex flex-col justify-between"
                      >
                        {/* Drawer Header */}
                        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-500 flex items-center justify-center">
                              <Layers className="w-4 h-4" />
                            </div>
                            <div>
                              <h3 className="text-sm font-black text-slate-950 dark:text-white">
                                {drawerMode === 'create' && 'افزودن محصول جدید'}
                                {drawerMode === 'edit' && 'ویرایش مشخصات محصول'}
                                {drawerMode === 'view' && 'جزئیات و مشخصات فنی محصول'}
                              </h3>
                              <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                                {drawerMode === 'create' && 'کاتالوگ و شناسنامه جدید ثبت کنید'}
                                {drawerMode === 'edit' && `ویرایش شناسه ${selectedProduct?.id}`}
                                {drawerMode === 'view' && `شناسه فنی: ${selectedProduct?.id}`}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowProductDrawer(false)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer transition-colors"
                          >
                            <X className="w-4.5 h-4.5" />
                          </button>
                        </div>

                        {/* Drawer Form Body (Scrollable) */}
                        <form onSubmit={handleSaveDrawerProduct} className="flex-1 overflow-y-auto p-6 space-y-5 text-right">
                          
                          {/* Live Preview of Product Logo & Name */}
                          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80 flex items-center gap-4">
                            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${drawerLogoColor} text-white font-black flex items-center justify-center text-lg shadow-sm shrink-0 select-none`}>
                              {drawerName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() || 'PR'}
                            </div>
                            <div className="min-w-0">
                              <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">پیش‌نمایش زنده لوگو</div>
                              <h4 className="text-xs font-black text-slate-900 dark:text-white truncate mt-0.5">{drawerName || 'نام محصول شما'}</h4>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-mono truncate">{drawerVersion || 'v1.0.0'}</p>
                            </div>
                          </div>

                          {/* Field 1: Name */}
                          <div className="space-y-1.5">
                            <label className="block text-[11px] font-black text-slate-600 dark:text-slate-400">نام محصول / پلتفرم</label>
                            <input
                              type="text"
                              required
                              disabled={drawerMode === 'view'}
                              placeholder="مثال: Cloud Security Platform"
                              value={drawerName}
                              onChange={(e) => {
                                setDrawerName(e.target.value);
                                if (e.target.value.trim().length >= 3) {
                                  setDrawerErrors(prev => ({ ...prev, name: undefined }));
                                }
                              }}
                              className={`w-full text-xs px-3.5 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-950/40 outline-none focus:ring-2 focus:ring-brand-500/10 focus:border-brand-500 font-semibold transition-all ${
                                drawerErrors.name 
                                  ? 'border-rose-400 dark:border-rose-900/60 focus:ring-rose-500/10 focus:border-rose-500' 
                                  : 'border-slate-200 dark:border-slate-800'
                              } disabled:opacity-60 disabled:cursor-not-allowed text-slate-950 dark:text-slate-100`}
                            />
                            {drawerErrors.name && (
                              <p className="text-[10px] text-rose-500 font-bold">{drawerErrors.name}</p>
                            )}
                          </div>

                          {/* Field 2: Description */}
                          <div className="space-y-1.5">
                            <label className="block text-[11px] font-black text-slate-600 dark:text-slate-400">توضیحات کلی و کاربردی</label>
                            <textarea
                              disabled={drawerMode === 'view'}
                              placeholder="توضیحاتی درباره این پلتفرم، کاربرد اصلی آن و زیرسرویس‌های متصل بنویسید..."
                              value={drawerDescription}
                              onChange={(e) => setDrawerDescription(e.target.value)}
                              rows={3.5}
                              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 outline-none focus:ring-2 focus:ring-brand-500/10 focus:border-brand-500 font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed resize-none text-slate-950 dark:text-slate-100"
                            />
                          </div>

                          {/* Field 3 & 4 Grid: Version & Category */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="block text-[11px] font-black text-slate-600 dark:text-slate-400">نسخه پلتفرم</label>
                              <input
                                type="text"
                                required
                                disabled={drawerMode === 'view'}
                                placeholder="v1.0.0"
                                value={drawerVersion}
                                onChange={(e) => {
                                  setDrawerVersion(e.target.value);
                                  if (/^v\d+\.\d+\.\d+/.test(e.target.value)) {
                                    setDrawerErrors(prev => ({ ...prev, version: undefined }));
                                  }
                                }}
                                className={`w-full text-xs px-3.5 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-950/40 outline-none focus:ring-2 focus:ring-brand-500/10 focus:border-brand-500 font-mono font-bold transition-all ${
                                  drawerErrors.version 
                                    ? 'border-rose-400 dark:border-rose-900/60 focus:ring-rose-500/10 focus:border-rose-500' 
                                    : 'border-slate-200 dark:border-slate-800'
                                } disabled:opacity-60 disabled:cursor-not-allowed text-slate-950 dark:text-slate-100`}
                              />
                              {drawerErrors.version && (
                                <p className="text-[10px] text-rose-500 font-bold">{drawerErrors.version}</p>
                              )}
                            </div>

                            <div className="space-y-1.5">
                              <label className="block text-[11px] font-black text-slate-600 dark:text-slate-400">دسته‌بندی پلتفرم</label>
                              <select
                                disabled={drawerMode === 'view'}
                                value={drawerCategory}
                                onChange={(e) => setDrawerCategory(e.target.value)}
                                className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 outline-none focus:border-brand-500 cursor-pointer text-slate-700 dark:text-slate-300 font-bold disabled:opacity-60 disabled:cursor-not-allowed"
                              >
                                <option value="امنیتی">🛡️ امنیتی</option>
                                <option value="احراز هویت">🔑 احراز هویت</option>
                                <option value="زیرساخت">⚙️ زیرساخت</option>
                                <option value="مالی">💳 مالی</option>
                                <option value="ارتباطات">💬 ارتباطات</option>
                                <option value="وب‌سرویس">🌐 وب‌سرویس</option>
                              </select>
                            </div>
                          </div>

                          {/* Field 5: Logo background gradients */}
                          <div className="space-y-2">
                            <label className="block text-[11px] font-black text-slate-600 dark:text-slate-400">طرح لوگو و رنگ پیش‌زمینه</label>
                            {drawerMode !== 'view' ? (
                              <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950/20 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                                {[
                                  { color: 'from-blue-500 to-indigo-600', label: 'آبی اقیانوس' },
                                  { color: 'from-emerald-500 to-teal-600', label: 'سبز زمرد' },
                                  { color: 'from-rose-500 to-orange-500', label: 'قرمز زغال' },
                                  { color: 'from-amber-500 to-yellow-500', label: 'طلایی آفتاب' },
                                  { color: 'from-purple-500 to-pink-500', label: 'بنفش کهکشان' },
                                  { color: 'from-violet-500 to-fuchsia-500', label: 'سرخابی' },
                                ].map((grad) => (
                                  <button
                                    type="button"
                                    key={grad.color}
                                    onClick={() => setDrawerLogoColor(grad.color)}
                                    className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${grad.color} flex items-center justify-center cursor-pointer transform hover:scale-110 active:scale-90 transition-all ${
                                      drawerLogoColor === grad.color ? 'ring-2 ring-brand-500 ring-offset-2 dark:ring-offset-slate-900 scale-105 shadow-md' : 'opacity-80'
                                    }`}
                                    title={grad.label}
                                  />
                                ))}
                              </div>
                            ) : (
                              <input
                                type="text"
                                disabled
                                value={
                                  drawerLogoColor.includes('blue') ? 'آبی اقیانوس' :
                                  drawerLogoColor.includes('emerald') ? 'سبز زمرد' :
                                  drawerLogoColor.includes('rose') ? 'قرمز زغال' :
                                  drawerLogoColor.includes('amber') ? 'طلایی آفتاب' :
                                  drawerLogoColor.includes('purple') ? 'بنفش کهکشان' : 'سرخابی'
                                }
                                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/60 font-semibold outline-none text-slate-800 dark:text-slate-300"
                              />
                            )}
                          </div>

                          {/* Field 6: Status Toggle */}
                          <div className="space-y-1.5">
                            <label className="block text-[11px] font-black text-slate-600 dark:text-slate-400">وضعیت فعلی پلتفرم</label>
                            <div className="grid grid-cols-3 gap-2 p-1.5 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800">
                              {[
                                { status: 'فعال', label: '🟢 فعال' },
                                { status: 'غیرفعال', label: '⚪ غیرفعال' },
                                { status: 'منقضی شده', label: '🔴 منقضی شده' },
                              ].map((item) => (
                                <button
                                  type="button"
                                  key={item.status}
                                  disabled={drawerMode === 'view'}
                                  onClick={() => setDrawerStatus(item.status as Product['status'])}
                                  className={`py-2 text-[10px] font-black rounded-lg transition-all ${
                                    drawerMode === 'view' ? 'cursor-not-allowed' : 'cursor-pointer'
                                  } ${
                                    drawerStatus === item.status
                                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200/40 dark:border-slate-700/40'
                                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                                  }`}
                                >
                                  {item.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* If View Mode, display technical audits */}
                          {drawerMode === 'view' && selectedProduct && (
                            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                              <h5 className="text-[11px] font-black text-slate-800 dark:text-slate-200">گزارش تله‌متری و آمار فنی</h5>
                              <div className="grid grid-cols-2 gap-3 text-[10px] font-bold">
                                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80">
                                  <span className="text-slate-400 block mb-1">مشتریان متصل</span>
                                  <span className="text-xs text-slate-800 dark:text-slate-200 font-mono font-black">{selectedProduct.clientsCount} سازمان</span>
                                </div>
                                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80">
                                  <span className="text-slate-400 block mb-1">تاریخ ایجاد سند</span>
                                  <span className="text-xs text-slate-800 dark:text-slate-200 font-mono font-black">{selectedProduct.createdAt || '۱۴۰۱/۰۵/۲۰'}</span>
                                </div>
                              </div>
                            </div>
                          )}

                        </form>

                        {/* Drawer Footer Actions */}
                        <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-end gap-3">
                          {drawerMode === 'view' ? (
                            <button
                              type="button"
                              onClick={() => setShowProductDrawer(false)}
                              className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-black transition-all cursor-pointer"
                            >
                              بستن پنل جزئیات
                            </button>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => setShowProductDrawer(false)}
                                className="px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                              >
                                انصراف و خروج
                              </button>
                              <button
                                type="button"
                                onClick={handleSaveDrawerProduct}
                                className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-black shadow-md shadow-brand-500/15 transition-all cursor-pointer"
                              >
                                {drawerMode === 'create' ? 'ایجاد محصول جدید' : 'ذخیره تغییرات'}
                              </button>
                            </>
                          )}
                        </div>

                      </motion.div>
                    </>
                  )}
                </AnimatePresence>

              </motion.div>
            )}

            {/* TAB 2.5: PRODUCT DETAILS PAGE */}
            {activeTab === 'product-details' && (
              <motion.div
                key="product-details-tab"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="space-y-6"
                id="product-details-view"
              >
                {/* Back Button and Quick Info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs" id="product-details-header">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setActiveTab('products')}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
                      title="بازگشت به لیست محصولات"
                      id="details-back-btn"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-block w-2 h-2 rounded-full ${(selectedDetailProduct || products[0]).status === 'فعال' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                        <h2 className="text-lg font-black text-slate-900 dark:text-white">{(selectedDetailProduct || products[0]).name}</h2>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {(selectedDetailProduct || products[0]).id}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-1">
                        دسته: {(selectedDetailProduct || products[0]).category} | آخرین بروزرسانی: {(selectedDetailProduct || products[0]).lastUpdated}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => {
                        const detailPrd = selectedDetailProduct || products[0];
                        setSelectedProduct(detailPrd);
                        setDrawerName(detailPrd.name);
                        setDrawerDescription(detailPrd.description || '');
                        setDrawerCategory(detailPrd.category);
                        setDrawerVersion(detailPrd.version);
                        setDrawerStatus(detailPrd.status);
                        setDrawerLogoColor(detailPrd.logoColor || 'from-blue-500 to-indigo-600');
                        setDrawerMode('edit');
                        setShowProductDrawer(true);
                      }}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5"
                      id="edit-details-btn"
                    >
                      <Edit className="w-4 h-4 text-slate-400" />
                      <span>ویرایش شناسنامه</span>
                    </button>

                    <button
                      onClick={() => {
                        const detailPrd = selectedDetailProduct || products[0];
                        setNewTicketProduct(detailPrd.name);
                        setNewTicketCustomer('');
                        setNewTicketTitle('');
                        // Trigger create ticket dialog/modal in App
                        const createBtn = document.getElementById('add-ticket-btn');
                        if (createBtn) {
                          createBtn.click();
                        } else {
                          showFeedback('محیط ثبت تیکت آماده شد. لطفاً تیکت جدید را اضافه فرمایید.', 'success');
                        }
                      }}
                      className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-black shadow-md shadow-brand-500/10 cursor-pointer transition-all flex items-center gap-1.5"
                      id="details-new-ticket-btn"
                    >
                      <Plus className="w-4 h-4" />
                      <span>ثبت تیکت جدید</span>
                    </button>

                    <button
                      onClick={() => {
                        const detailPrd = selectedDetailProduct || products[0];
                        const nextStat: Product['status'] = detailPrd.status === 'فعال' ? 'غیرفعال' : 'فعال';
                        setProducts(products.map(p => p.id === detailPrd.id ? { ...p, status: nextStat } : p));
                        setSelectedDetailProduct({ ...detailPrd, status: nextStat });
                        showFeedback(`وضعیت پلتفرم به "${nextStat}" تغییر یافت.`);
                      }}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
                      title="تغییر وضعیت"
                      id="toggle-details-status"
                    >
                      <RefreshCw className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </div>

                {/* Sub Navigation Tabs */}
                <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar gap-2" id="product-details-subtabs">
                  {[
                    { id: 'overview', label: 'بررسی اجمالی', icon: Activity },
                    { id: 'customers', label: 'مشتریان متصل', icon: Users2 },
                    { id: 'tickets', label: 'تیکت‌های پشتیبانی', icon: Inbox },
                    { id: 'versions', label: 'آرشیو نسخه‌ها', icon: RefreshCw },
                    { id: 'docs', label: 'مستندات فنی', icon: BookOpen },
                    { id: 'settings', label: 'تنظیمات زیرسیستم', icon: Settings },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = detailSubTab === tab.id;
                    const detailPrd = selectedDetailProduct || products[0];
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setDetailSubTab(tab.id as any)}
                        className={`pb-3.5 pt-1.5 px-4 text-xs font-black transition-all border-b-2 flex items-center gap-2 cursor-pointer shrink-0 ${
                          isActive
                            ? 'border-brand-500 text-brand-600 dark:text-brand-400 font-extrabold'
                            : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-bold'
                        }`}
                        id={`subtab-btn-${tab.id}`}
                      >
                        <Icon className={`w-4 h-4 ${isActive ? 'text-brand-500' : 'text-slate-400'}`} />
                        <span>{tab.label}</span>
                        {tab.id === 'customers' && (
                          <span className="mr-1 font-mono text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold">
                            {productCustomerConnections.filter(c => c.productId === detailPrd.id).length}
                          </span>
                        )}
                        {tab.id === 'tickets' && (
                          <span className="mr-1 font-mono text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold">
                            {tickets.filter(t => t.product === detailPrd.name).length}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* SUB TAB VIEWS */}
                <div className="space-y-6" id="product-details-tab-content">

                  {/* SUB TAB 1: OVERVIEW */}
                  {detailSubTab === 'overview' && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                      id="details-overview-panel"
                    >
                      {/* Right column: Description & Features */}
                      <div className="lg:col-span-2 space-y-6">
                        {/* Info card */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs space-y-4">
                          <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <Server className="w-4 h-4 text-slate-400" />
                            <span>توضیحات و اهداف سیستم</span>
                          </h3>
                          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                            {(selectedDetailProduct || products[0]).description || 'توضیحاتی برای این محصول ثبت نشده است. این پلتفرم یکی از ابزارهای استراتژیک در زیرساخت‌های ابری سحاب می‌باشد که با نظارت ۲۴ ساعته امنیت کلاینت‌ها را تضمین می‌کند.'}
                          </p>

                          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 space-y-3">
                            <h4 className="text-[11px] font-black text-slate-800 dark:text-white">قابلیت‌ها و ماژول‌های فنی</h4>
                            <div className="flex flex-wrap gap-2">
                              {['تشخیص نفوذ بلادرنگ (IDS)', 'پایش ترافیک رمزنگاری شده TLS', 'یکپارچگی هوشمند با Active Directory', 'رمزنگاری پایگاه داده محلی AES-256', 'تولید خودکار گواهی امنیتی SSL', 'پروتکل پاسخ سریع پورت‌ها', 'سیستم لاگین پیشرفته دو عاملی'].map((feat, idx) => (
                                <span 
                                  key={idx} 
                                  className="px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800/60 text-[10px] bg-slate-50 dark:bg-slate-950/20 text-slate-600 dark:text-slate-400 font-bold"
                                >
                                  🛡️ {feat}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Uptime and Health Widget */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                              <Activity className="w-4 h-4 text-emerald-500" />
                              <span>وضعیت سلامت و پایداری لایسنس‌ها (Uptime)</span>
                            </h3>
                            <span className="text-xs font-mono font-black text-emerald-500">۹۹.۹۸٪ پایداری</span>
                          </div>

                          <div className="p-4 rounded-xl border border-emerald-100 dark:border-emerald-950/30 bg-emerald-500/[0.02] dark:bg-emerald-500/[0.01] space-y-3">
                            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                              <span>پایش وضعیت ۳۰ روز گذشته</span>
                              <span className="text-emerald-500 font-semibold">۱۰۰٪ بدون قطعی بحرانی</span>
                            </div>
                            
                            {/* Visual contribution-style grid */}
                            <div className="flex flex-wrap gap-1 md:gap-1.5 h-auto">
                              {Array.from({ length: 30 }).map((_, idx) => (
                                <div 
                                  key={idx} 
                                  className={`w-3.5 h-4.5 rounded-xs transition-all duration-150 cursor-pointer shrink-0 ${
                                    idx === 14 ? 'bg-amber-400 hover:bg-amber-500' : 'bg-emerald-500 dark:bg-emerald-600 hover:opacity-85'
                                  }`}
                                  title={`روز ${30 - idx} قبل: ${idx === 14 ? '۹۹.۸٪ پایداری (کند‌ی موقت وب‌هوک)' : '۱۰۰٪ پایدار'}`}
                                />
                              ))}
                            </div>

                            <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 pt-1">
                              <span>۳۰ روز قبل</span>
                              <span>امروز</span>
                            </div>
                          </div>

                          {/* Latency and technical specs */}
                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800">
                              <span className="block text-[10px] font-bold text-slate-400 mb-1">متوسط زمان پاسخ‌دهی</span>
                              <span className="text-xs font-mono font-black text-slate-800 dark:text-white">۱۴ میلی‌ثانیه</span>
                            </div>
                            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800">
                              <span className="block text-[10px] font-bold text-slate-400 mb-1">گره‌های مستقر شده</span>
                              <span className="text-xs font-mono font-black text-slate-800 dark:text-white">۳ گره ابری</span>
                            </div>
                            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800">
                              <span className="block text-[10px] font-bold text-slate-400 mb-1">رویدادهای ثبت شده</span>
                              <span className="text-xs font-mono font-black text-slate-800 dark:text-white">۴.۵ میلیون لاگ</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Left column: Technical Profile & Quick Summary */}
                      <div className="space-y-6">
                        {/* Summary panel */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs space-y-4">
                          <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <Shield className="w-4 h-4 text-brand-500" />
                            <span>مشخصات فنی و مجوزها</span>
                          </h3>

                          <div className="divide-y divide-slate-100 dark:divide-slate-800/40 text-xs font-medium space-y-3.5">
                            <div className="flex justify-between items-center pt-3.5">
                              <span className="text-slate-400 font-bold">شناسه یکتای پلتفرم:</span>
                              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{(selectedDetailProduct || products[0]).id}</span>
                            </div>
                            <div className="flex justify-between items-center pt-3.5">
                              <span className="text-slate-400 font-bold">نسخه توزیع شده پایدار:</span>
                              <span className="font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                {(selectedDetailProduct || products[0]).version}
                              </span>
                            </div>
                            <div className="flex justify-between items-center pt-3.5">
                              <span className="text-slate-400 font-bold">سازمان‌های دارای پروانه:</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200">{(selectedDetailProduct || products[0]).clientsCount} مشتری فعال</span>
                            </div>
                            <div className="flex justify-between items-center pt-3.5">
                              <span className="text-slate-400 font-bold">تیم فنی پشتیبان:</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200">تیم آلفا (امنیت ابری)</span>
                            </div>
                            <div className="flex justify-between items-center pt-3.5">
                              <span className="text-slate-400 font-bold">نوع اعتبار پروانه:</span>
                              <span className="font-bold text-brand-600 dark:text-brand-400">سازمانی جامع</span>
                            </div>
                            <div className="flex justify-between items-center pt-3.5">
                              <span className="text-slate-400 font-bold">تاریخ ایجاد کاتالوگ:</span>
                              <span className="font-mono font-bold text-slate-500">{(selectedDetailProduct || products[0]).createdAt || '۱۴۰۱/۰۵/۲۰'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Developer quick action */}
                        <div className="p-6 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-800 text-white space-y-4 shadow-md shadow-brand-500/10">
                          <div className="space-y-1.5">
                            <h4 className="text-xs font-black">پورتال راهنمای توسعه‌دهندگان</h4>
                            <p className="text-[10px] text-brand-100 leading-relaxed font-medium">
                              زیرسیستم‌ها و کدهای نمونه جهت اتصال ساده‌ترین کلاینت‌ها با استفاده از توکن اهدا شده در تب مستندات فنی موجود است.
                            </p>
                          </div>
                          <button
                            onClick={() => setDetailSubTab('docs')}
                            className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-black transition-all cursor-pointer text-center block"
                          >
                            مشاهده کدهای وب‌سرویس
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* SUB TAB 2: CONNECTED CUSTOMERS */}
                  {detailSubTab === 'customers' && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                      id="details-customers-panel"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xs font-black text-slate-900 dark:text-white">مشتریان متصل و مجوزها</h3>
                          <p className="text-[10px] text-slate-400 mt-1">مدیریت مشتریان اختصاص یافته به محصول و فعال‌سازی/تمدید دوره‌ای اشتراک‌ها.</p>
                        </div>
                        <button
                          onClick={() => {
                            setAssignActivationKey(`LIC-CMP-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`);
                            setShowAssignCustomerDrawer(true);
                          }}
                          className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-black px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-brand-500/10 cursor-pointer"
                          id="assign-new-cust-btn"
                        >
                          <PlusCircle className="w-4.5 h-4.5" />
                          <span>تخصیص مشتری جدید</span>
                        </button>
                      </div>

                      {/* Connection Table */}
                      {productCustomerConnections.filter(c => c.productId === (selectedDetailProduct || products[0]).id).length === 0 ? (
                        <div className="bg-white dark:bg-slate-900 p-12 text-center rounded-2xl border border-slate-200/60 dark:border-slate-800/60 space-y-4 shadow-xs">
                          <Building className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
                          <div className="max-w-xs mx-auto space-y-1">
                            <h4 className="text-xs font-black text-slate-900 dark:text-white">هیچ مشتری تخصیص داده نشده است</h4>
                            <p className="text-[10px] text-slate-400">شما می‌توانید از دکمه بالا برای اتصال اولین کلاینت به این محصول استفاده کنید.</p>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full text-right border-collapse text-xs">
                              <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-xs font-black bg-slate-50/50 dark:bg-slate-900/50 select-none">
                                  <th className="p-4 pr-6">نام کلاینت سازمانی</th>
                                  <th className="p-4">نوع اشتراک</th>
                                  <th className="p-4">کاربران مجاز</th>
                                  <th className="p-4">دوره اعتبار لایسنس</th>
                                  <th className="p-4">کلید فعال‌سازی</th>
                                  <th className="p-4">وضعیت</th>
                                  <th className="p-4 pl-6 text-left">عملیات</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-[11px] font-medium text-slate-700 dark:text-slate-300">
                                {productCustomerConnections
                                  .filter(c => c.productId === (selectedDetailProduct || products[0]).id)
                                  .map((conn) => (
                                    <tr key={conn.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/10 group transition-colors">
                                      <td className="p-4 pr-6">
                                        <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center font-bold text-xs shrink-0">
                                            {conn.customerName.substring(0, 2)}
                                          </div>
                                          <div>
                                            <div className="font-black text-slate-900 dark:text-white text-xs">{conn.customerName}</div>
                                            <div className="text-[10px] text-slate-400 mt-0.5 font-bold">مسئول فنی: {conn.managerName}</div>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="p-4">
                                        <span className={`px-2 py-0.5 rounded-md border font-bold text-[10px] ${
                                          conn.subscriptionType === 'Enterprise' ? 'border-indigo-100 dark:border-indigo-950/40 bg-indigo-50/50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' :
                                          conn.subscriptionType === 'Premium' ? 'border-amber-100 dark:border-amber-950/40 bg-amber-50/50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                                          'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                                        }`}>
                                          {conn.subscriptionType === 'Enterprise' ? 'سازمانی طلایی' : conn.subscriptionType === 'Premium' ? 'پریمیوم نقره‌ای' : 'استاندارد برنزی'}
                                        </span>
                                      </td>
                                      <td className="p-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                                        {conn.userCount} کاربر
                                      </td>
                                      <td className="p-4 text-slate-500 dark:text-slate-400">
                                        <div className="flex items-center gap-1 font-mono">
                                          <span>{conn.startDate}</span>
                                          <span className="text-slate-300">←</span>
                                          <span>{conn.endDate}</span>
                                        </div>
                                      </td>
                                      <td className="p-4">
                                        <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 max-w-[160px] justify-between">
                                          <span className="font-mono text-[9px] text-slate-500 truncate select-all">{conn.activationKey}</span>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              navigator.clipboard.writeText(conn.activationKey);
                                              setCopiedTextId(conn.id);
                                              setTimeout(() => setCopiedTextId(null), 1500);
                                            }}
                                            className="text-slate-400 hover:text-brand-500 cursor-pointer"
                                            title="کپی لایسنس"
                                          >
                                            {copiedTextId === conn.id ? (
                                              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                            ) : (
                                              <Copy className="w-3.5 h-3.5 shrink-0" />
                                            )}
                                          </button>
                                        </div>
                                      </td>
                                      <td className="p-4">
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black ${
                                          conn.licenseStatus === 'فعال' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' :
                                          conn.licenseStatus === 'منقضی شده' ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400' :
                                          'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                                        }`}>
                                          <span className={`w-1 h-1 rounded-full ${conn.licenseStatus === 'فعال' ? 'bg-emerald-500' : conn.licenseStatus === 'منقضی شده' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                                          {conn.licenseStatus}
                                        </span>
                                      </td>
                                      <td className="p-4 pl-6 text-left">
                                        <div className="flex items-center justify-end gap-1">
                                          <button
                                            onClick={() => handleRenewConnection(conn.id)}
                                            className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-brand-500 hover:border-brand-500 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-all font-bold text-[10px]"
                                            title="تمدید یکساله لایسنس"
                                          >
                                            تمدید
                                          </button>
                                          <button
                                            onClick={() => handleDeleteConnection(conn.id)}
                                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer transition-all"
                                            title="لغو اتصال لایسنس"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* SUB TAB 3: TICKETS */}
                  {detailSubTab === 'tickets' && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                      id="details-tickets-panel"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xs font-black text-slate-900 dark:text-white">تیکت‌های باز و تاریخچه حوادث</h3>
                          <p className="text-[10px] text-slate-400 mt-1">لیست تیکت‌های پشتیبانی کلاینت‌ها که روی این زیرسرویس فنی ثبت شده است.</p>
                        </div>
                        <button
                          onClick={() => {
                            setNewTicketProduct((selectedDetailProduct || products[0]).name);
                            setNewTicketCustomer('');
                            setNewTicketTitle('');
                            const createBtn = document.getElementById('add-ticket-btn');
                            if (createBtn) createBtn.click();
                          }}
                          className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-black px-4 py-2.5 rounded-xl transition-all shadow-md shadow-brand-500/10 cursor-pointer"
                        >
                          ثبت تیکت فنی
                        </button>
                      </div>

                      {/* Ticket content filter */}
                      {tickets.filter(t => t.product === (selectedDetailProduct || products[0]).name).length === 0 ? (
                        <div className="bg-white dark:bg-slate-900 p-12 text-center rounded-2xl border border-slate-200/60 dark:border-slate-800/60 space-y-4 shadow-xs">
                          <Inbox className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
                          <div className="max-w-xs mx-auto space-y-1">
                            <h4 className="text-xs font-black text-slate-900 dark:text-white">تیکتی برای این محصول ثبت نشده</h4>
                            <p className="text-[10px] text-slate-400">تمام تیکت‌های این پلتفرم در وضعیت بسته شده قرار دارند یا هنوز گزارش مشکلی ثبت نشده است.</p>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full text-right border-collapse text-xs">
                              <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-xs font-black bg-slate-50/50 dark:bg-slate-900/50 select-none">
                                  <th className="p-4 pr-6">کد تیکت / عنوان</th>
                                  <th className="p-4">سازمان شاکی</th>
                                  <th className="p-4">درجه اهمیت</th>
                                  <th className="p-4">آخرین وضعیت</th>
                                  <th className="p-4">کارشناس پاسخگو</th>
                                  <th className="p-4">تاریخ ثبت</th>
                                  <th className="p-4 pl-6 text-left">عملیات</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-[11px] font-medium text-slate-700 dark:text-slate-300">
                                {tickets
                                  .filter(t => t.product === (selectedDetailProduct || products[0]).name)
                                  .map((t) => (
                                    <tr key={t.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/10 group transition-colors">
                                      <td className="p-4 pr-6">
                                        <div className="flex items-start gap-2.5">
                                          <span className="font-mono font-bold text-slate-400 text-[10px] shrink-0 mt-0.5">{t.id}</span>
                                          <div>
                                            <div className="font-black text-slate-900 dark:text-white text-xs group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors line-clamp-1">{t.title}</div>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="p-4 font-bold text-slate-800 dark:text-slate-200">
                                        {t.customer}
                                      </td>
                                      <td className="p-4">
                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                                          t.priority === 'بحرانی' ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400' :
                                          t.priority === 'بالا' ? 'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400' :
                                          t.priority === 'متوسط' ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' :
                                          'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                        }`}>
                                          {t.priority}
                                        </span>
                                      </td>
                                      <td className="p-4">
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black ${
                                          t.status === 'باز' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' :
                                          t.status === 'در حال بررسی' ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' :
                                          t.status === 'منتظر پاسخ مشتری' ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' :
                                          'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                        }`}>
                                          {t.status}
                                        </span>
                                      </td>
                                      <td className="p-4 text-slate-500 dark:text-slate-400 font-bold">
                                        {t.assignedTo || 'تخصیص نیافته'}
                                      </td>
                                      <td className="p-4 text-slate-400 font-bold font-mono">
                                        {t.date}
                                      </td>
                                      <td className="p-4 pl-6 text-left">
                                        <button
                                          onClick={() => {
                                            setTicketSearch(t.id);
                                            setTicketPriorityFilter('ignore');
                                            setTicketStatusFilter('ignore');
                                            setActiveTab('tickets');
                                            showFeedback(`تیکت ${t.id} در صندوق کار هوشمند متمرکز گردید.`);
                                          }}
                                          className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
                                        >
                                          مشاهده تیکت
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* SUB TAB 4: RELEASE ARCHIVE */}
                  {detailSubTab === 'versions' && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs space-y-6"
                      id="details-versions-panel"
                    >
                      <div>
                        <h3 className="text-xs font-black text-slate-900 dark:text-white">آرشیو و خط‌زمان انتشار نسخه‌ها</h3>
                        <p className="text-[10px] text-slate-400 mt-1">تغییرات فنی، وصله‌های امنیتی و ویژگی‌های معرفی شده در طول چرخه‌ی حیات نرم‌افزار.</p>
                      </div>

                      {/* Release Timeline */}
                      <div className="relative pr-5 border-r border-slate-100 dark:border-slate-800/60 space-y-6">
                        {/* Ver 1 */}
                        <div className="relative">
                          {/* Dot */}
                          <div className="absolute -right-[25px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-black text-slate-900 dark:text-white">{(selectedDetailProduct || products[0]).version}</span>
                              <span className="px-1.5 py-0.5 rounded-md text-[8px] font-black bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">آخرین نسخه پایدار فعلی</span>
                              <span className="text-[10px] text-slate-400 font-bold font-mono">انتشار در ۱۴۰۲/۱۰/۱۲</span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                              بهینه‌سازی مصرف حافظه موقت در فیلتر کردن رویدادهای زنده، ارتقای کتابخانه رمزنگاری هسته به آخرین استاندارد ایمن OpenSSL، و رفع باگ جزئی در پاسخگویی وب‌هوک به کلاینت‌های با ترافیک بالا.
                            </p>
                          </div>
                        </div>

                        {/* Ver 2 */}
                        <div className="relative">
                          {/* Dot */}
                          <div className="absolute -right-[25px] top-1 w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700 border-2 border-white dark:border-slate-900" />
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-black text-slate-800 dark:text-slate-350">v2.3.0</span>
                              <span className="text-[10px] text-slate-400 font-bold font-mono">انتشار در ۱۴۰۲/۰۶/۰۵</span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-450 leading-relaxed font-medium">
                              افزودن داشبورد مانیتورینگ بلادرنگ، قابلیت برون‌سپاری گزارش‌های امنیتی به فرمت PDF استاندارد، افزایش محدودیت توابع وب‌سرویس و همگام‌سازی سریع‌تر با اکتیو دایرکتوری.
                            </p>
                          </div>
                        </div>

                        {/* Ver 3 */}
                        <div className="relative">
                          {/* Dot */}
                          <div className="absolute -right-[25px] top-1 w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700 border-2 border-white dark:border-slate-900" />
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-black text-slate-800 dark:text-slate-350">v2.0.0</span>
                              <span className="text-[10px] text-slate-400 font-bold font-mono">انتشار در ۱۴۰۱/۱۲/۲۰</span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-450 leading-relaxed font-medium">
                              بازنویسی کامل هسته پلتفرم به زبان Go جهت دستیابی به پایداری پردازشی فوق‌العاده و پاسخگویی به درخواست‌های موازی بالا، به همراه‌ پیاده‌سازی مکانیزم کش چندلایه‌ای.
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* SUB TAB 5: DOCS */}
                  {detailSubTab === 'docs' && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                      id="details-docs-panel"
                    >
                      {/* Documentation Content */}
                      <div className="lg:col-span-2 space-y-6 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs">
                        <div className="space-y-1">
                          <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-brand-500" />
                            <span>مستندات راه‌اندازی و ادغام کلاینت</span>
                          </h3>
                          <p className="text-[10px] text-slate-400">کدهای نمونه جهت هدیه و تایید اعتبار کلید اشتراک محصول در زیرسیستم شرکت مقصد.</p>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800/60">
                          
                          <div className="space-y-2">
                            <h4 className="text-[11px] font-black text-slate-800 dark:text-white flex items-center gap-1">
                              <Terminal className="w-3.5 h-3.5 text-slate-400" />
                              <span>گام اول: احراز هویت با هدر هدیه لایسنس</span>
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                              کلید فعال‌سازی دریافت شده در پنل مدیریت را با هدر <code className="font-mono bg-slate-50 dark:bg-slate-950 px-1 py-0.5 rounded text-rose-500 text-[10px]">X-CMP-License</code> در بدنه درخواست‌ها به آدرس API محصول ارسال کنید.
                            </p>
                          </div>

                          {/* Code Block */}
                          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 text-slate-300 p-4 space-y-2 font-mono text-[10px] text-left relative" dir="ltr">
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(`curl -X POST https://api.example.com/v2/auth \\\n  -H "X-CMP-License: LIC-CMP-E4A1-28BF" \\\n  -H "Content-Type: application/json" \\\n  -d '{"client_id": "PRD-01"}'`);
                                setCopiedTextId('curl-code');
                                setTimeout(() => setCopiedTextId(null), 1500);
                              }}
                              className="absolute top-3 right-3 text-slate-500 hover:text-white cursor-pointer"
                              title="کپی نمونه کد"
                            >
                              {copiedTextId === 'curl-code' ? (
                                <span className="text-[8px] bg-emerald-500 text-white px-1.5 py-0.5 rounded font-sans">Copied!</span>
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <div className="text-slate-500">// Send request with system license</div>
                            <div><span className="text-brand-400">curl</span> -X POST https://api.example.com/v2/auth \</div>
                            <div>  -H <span className="text-emerald-400">"X-CMP-License: LIC-CMP-E4A1-28BF"</span> \</div>
                            <div>  -H <span className="text-emerald-400">"Content-Type: application/json"</span> \</div>
                            <div>  -d <span className="text-amber-400">{"'{\"client_id\": \"PRD-01\"}'"}</span></div>
                          </div>

                          <div className="space-y-2 pt-2">
                            <h4 className="text-[11px] font-black text-slate-800 dark:text-white flex items-center gap-1">
                              <Terminal className="w-3.5 h-3.5 text-slate-400" />
                              <span>گام دوم: مدیریت کدهای خطا</span>
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                              در صورتی که اعتبار پروانه مشتری به اتمام رسیده باشد، پاسخ سیستم با کد وضعیت <code className="font-mono bg-slate-50 dark:bg-slate-950 px-1 py-0.5 rounded text-rose-500 text-[10px]">402 Payment Required</code> برگشت داده خواهد شد و پروسه به تمدید فوری نیاز دارد.
                            </p>
                          </div>

                        </div>
                      </div>

                      {/* Right bar: Helpful Links */}
                      <div className="space-y-6">
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs space-y-4">
                          <h4 className="text-xs font-black text-slate-900 dark:text-white">سندهای فنی پربازدید</h4>
                          <div className="space-y-3">
                            {[
                              'توابع وب‌هوک و ساختار بازگشت داده',
                              'پیکربندی گیت‌وی ورودی شبکه ابری',
                              'راهنمای رفع ارورهای اعتبار سنجی کلید',
                              'افزایش حجم دیتای رویدادها در مانیتورینگ'
                            ].map((docItem, idx) => (
                              <a
                                key={idx}
                                href="#docs"
                                onClick={(e) => { e.preventDefault(); showFeedback(`کتابخانه راهنما "${docItem}" دانلود شد.`); }}
                                className="block p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-brand-300 dark:hover:border-brand-800 hover:bg-slate-50 dark:hover:bg-slate-950/20 text-xs font-bold text-slate-600 dark:text-slate-400 transition-all"
                              >
                                📄 {docItem}
                              </a>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* SUB TAB 6: SETTINGS */}
                  {detailSubTab === 'settings' && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs space-y-6"
                      id="details-settings-panel"
                    >
                      <div>
                        <h3 className="text-xs font-black text-slate-900 dark:text-white">تنظیمات سیستمی و مدیریتی پلتفرم</h3>
                        <p className="text-[10px] text-slate-400 mt-1">پیکربندی پارامترهای تله‌متری، لاگ‌برداری، و محدودیت‌های ترافیکی در سطح محصول.</p>
                      </div>

                      {/* Settings Form */}
                      <form 
                        onSubmit={(e) => {
                          e.preventDefault();
                          showFeedback('تنظیمات اختصاصی با موفقیت در سراسر گره‌های محصول بروزرسانی گردید.');
                        }}
                        className="space-y-5 max-w-xl text-right font-medium"
                      >
                        {/* Option 1 */}
                        <div className="space-y-1.5">
                          <label className="block text-xs font-black text-slate-700 dark:text-slate-300">میزان دقیق پایش لاگ‌ها (Telemetry level)</label>
                          <select className="w-full text-xs font-bold border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/40 px-3.5 py-3 outline-none focus:border-brand-500 text-slate-600 dark:text-slate-300 cursor-pointer">
                            <option>پایش حساس (حداکثر نظارت روی درخواست‌ها و وب‌هوک‌ها)</option>
                            <option>پایش استاندارد (پیش‌فرض سیستم)</option>
                            <option>پایش سطح کم (فقط خطاهای بحرانی سیستم)</option>
                          </select>
                        </div>

                        {/* Option 2 */}
                        <div className="space-y-1.5">
                          <label className="block text-xs font-black text-slate-700 dark:text-slate-300">سقف مجاز نرخ درخواست در دقیقه (Rate Limit)</label>
                          <select className="w-full text-xs font-bold border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/40 px-3.5 py-3 outline-none focus:border-brand-500 text-slate-600 dark:text-slate-300 cursor-pointer">
                            <option>۵,۰۰۰ درخواست در دقیقه (لایسنس‌های سازمانی بزرگ)</option>
                            <option>۱,۰۰۰ درخواست در دقیقه (اشتراک‌های استاندارد)</option>
                            <option>۲۰۰ درخواست در دقیقه (کاربران آزمایشی)</option>
                          </select>
                        </div>

                        {/* Option 3: Checkboxes */}
                        <div className="space-y-3 pt-2">
                          <h4 className="text-[11px] font-black text-slate-800 dark:text-white">گزینه‌های دسترسی و ارتباطی</h4>
                          
                          <label className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all">
                            <input type="checkbox" defaultChecked className="rounded text-brand-600 focus:ring-brand-500/20 cursor-pointer" />
                            <div className="text-right">
                              <span className="block text-xs font-bold text-slate-800 dark:text-white">ارسال هشدار به ایمیل مدیران فنی در صورت خطا</span>
                              <span className="block text-[10px] text-slate-400 mt-0.5">در صورت ریزش پایداری یا قطع گره به سرعت پیامک و ایمیل فرستاده شود.</span>
                            </div>
                          </label>

                          <label className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all">
                            <input type="checkbox" defaultChecked className="rounded text-brand-600 focus:ring-brand-500/20 cursor-pointer" />
                            <div className="text-right">
                              <span className="block text-xs font-bold text-slate-800 dark:text-white">تجدید دوره‌ای کلیدهای توکن بدون قطع لایسنس فعال</span>
                              <span className="block text-[10px] text-slate-400 mt-0.5">امکان استفاده موازی از کلید قدیمی و جدید برای ۲۴ ساعت.</span>
                            </div>
                          </label>
                        </div>

                        <div className="pt-4 flex justify-end">
                          <button
                            type="submit"
                            className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-black px-6 py-3 rounded-xl shadow-md shadow-brand-500/15 transition-all cursor-pointer"
                          >
                            ذخیره تنظیمات محصول
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  )}

                </div>

                {/* DRAWERS INSIDE THE DETAILS PAGE: ASSIGN CUSTOMER SLIDEOUT */}
                <AnimatePresence>
                  {showAssignCustomerDrawer && (
                    <>
                      {/* Backdrop overlay */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowAssignCustomerDrawer(false)}
                        className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 cursor-default"
                      />

                      {/* Panel */}
                      <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 26, stiffness: 220 }}
                        className="fixed inset-y-0 right-0 w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl z-50 flex flex-col justify-between text-right"
                        id="assign-customer-drawer-panel"
                      >
                        {/* Header */}
                        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-500 flex items-center justify-center">
                              <Building className="w-4.5 h-4.5" />
                            </div>
                            <div>
                              <h3 className="text-xs font-black text-slate-950 dark:text-white">اتصال مشتری به {(selectedDetailProduct || products[0]).name}</h3>
                              <p className="text-[9px] text-slate-400 mt-0.5">تخصیص مجوز استفاده به همراه تعداد کاربران و زمان اعتبار لایسنس.</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setShowAssignCustomerDrawer(false)}
                            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                          >
                            <X className="w-4.5 h-4.5" />
                          </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleAssignCustomerSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 font-medium text-xs">
                          {/* Field 1: Customer select */}
                          <div className="space-y-1.5">
                            <label className="block text-[11px] font-black text-slate-600 dark:text-slate-400">نام کلاینت سازمانی</label>
                            <select
                              required
                              value={assignCustomerName}
                              onChange={(e) => setAssignCustomerName(e.target.value)}
                              className="w-full text-xs font-bold border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/40 px-3.5 py-3 outline-none focus:border-brand-500 text-slate-700 dark:text-slate-300 cursor-pointer"
                            >
                              <option value="">-- انتخاب سازمان هدف --</option>
                              {customers.map(c => (
                                <option key={c.id} value={c.name}>{c.name} ({c.industry})</option>
                              ))}
                            </select>
                          </div>

                          {/* Field 2: Subscription Type */}
                          <div className="space-y-1.5">
                            <label className="block text-[11px] font-black text-slate-600 dark:text-slate-400">نوع اشتراک تخصیص یافته</label>
                            <select
                              value={assignSubscriptionType}
                              onChange={(e) => setAssignSubscriptionType(e.target.value)}
                              className="w-full text-xs font-bold border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/40 px-3.5 py-3 outline-none focus:border-brand-500 text-slate-700 dark:text-slate-300 cursor-pointer"
                            >
                              <option value="Enterprise">سازمانی طلایی (Enterprise)</option>
                              <option value="Premium">پریمیوم نقره‌ای (Premium)</option>
                              <option value="Standard">استاندارد برنزی (Standard)</option>
                            </select>
                          </div>

                          {/* Field 3: Max Users */}
                          <div className="space-y-1.5">
                            <label className="block text-[11px] font-black text-slate-600 dark:text-slate-400">سقف تعداد کاربران مجاز</label>
                            <input
                              type="number"
                              required
                              min={1}
                              value={assignUserCount}
                              onChange={(e) => setAssignUserCount(Number(e.target.value))}
                              className="w-full text-xs font-bold border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/40 px-3.5 py-3 outline-none focus:border-brand-500 text-slate-700 dark:text-slate-300"
                            />
                          </div>

                          {/* Field 4: Dates */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <label className="block text-[11px] font-black text-slate-600 dark:text-slate-400">تاریخ شروع اعتبار</label>
                              <input
                                type="text"
                                value={assignStartDate}
                                onChange={(e) => setAssignStartDate(e.target.value)}
                                className="w-full font-mono text-xs font-bold border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/40 px-3.5 py-3 outline-none focus:border-brand-500 text-slate-700 dark:text-slate-300"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="block text-[11px] font-black text-slate-600 dark:text-slate-400">تاریخ اتمام اعتبار</label>
                              <input
                                type="text"
                                value={assignEndDate}
                                onChange={(e) => setAssignEndDate(e.target.value)}
                                className="w-full font-mono text-xs font-bold border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/40 px-3.5 py-3 outline-none focus:border-brand-500 text-slate-700 dark:text-slate-300"
                              />
                            </div>
                          </div>

                          {/* Field 5: Activation Key */}
                          <div className="space-y-1.5">
                            <label className="block text-[11px] font-black text-slate-600 dark:text-slate-400">کلید لایسنس تولید شده</label>
                            <input
                              type="text"
                              value={assignActivationKey}
                              onChange={(e) => setAssignActivationKey(e.target.value)}
                              className="w-full font-mono text-[11px] font-bold border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/40 px-3.5 py-3 outline-none focus:border-brand-500 text-slate-700 dark:text-slate-300"
                            />
                          </div>

                          {/* Field 6: Notes */}
                          <div className="space-y-1.5">
                            <label className="block text-[11px] font-black text-slate-600 dark:text-slate-400">توضیحات و الزامات اختصاصی</label>
                            <textarea
                              rows={3}
                              value={assignNotes}
                              onChange={(e) => setAssignNotes(e.target.value)}
                              placeholder="مواردی مانند نیاز به بک‌آپ آفلاین، یا دوره‌ی طولانی‌تر پشتیبانی..."
                              className="w-full text-xs font-medium border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/40 px-3.5 py-3 outline-none focus:border-brand-500 text-slate-700 dark:text-slate-300 leading-relaxed"
                            />
                          </div>
                        </form>

                        {/* Footer */}
                        <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-end gap-3">
                          <button
                            type="button"
                            onClick={() => setShowAssignCustomerDrawer(false)}
                            className="px-4.5 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                          >
                            انصراف
                          </button>
                          <button
                            type="button"
                            onClick={handleAssignCustomerSubmit}
                            className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-black shadow-md shadow-brand-500/15 cursor-pointer"
                          >
                            اتصال مشتری و اهدا
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>

              </motion.div>
            )}

            {/* TAB 3: TICKETS BOX */}
            {activeTab === 'tickets' && (
              <TicketInboxView
                tickets={tickets}
                setTickets={setTickets}
                customers={customers}
                products={products}
                ticketSearch={ticketSearch}
                setTicketSearch={setTicketSearch}
                ticketPriorityFilter={ticketPriorityFilter}
                setTicketPriorityFilter={setTicketPriorityFilter}
                ticketStatusFilter={ticketStatusFilter}
                setTicketStatusFilter={setTicketStatusFilter}
                setShowTicketModal={setShowTicketModal}
                setNewTicketCustomer={setNewTicketCustomer}
                setNewTicketProduct={setNewTicketProduct}
                showCustomerToast={showCustomerToast}
              />
            )}

            {/* TAB 4: CUSTOMERS CRM */}
            {activeTab === 'customers' && (
              <motion.div
                key="customers-tab"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="space-y-6"
              >
                {/* 1. CUSTOM FLOATING TOAST FOR CUSTOMER EVENTS */}
                <AnimatePresence>
                  {customerFeedback && (
                    <motion.div
                      initial={{ opacity: 0, y: -20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.95 }}
                      className={`fixed top-6 left-6 z-[100] p-4 rounded-2xl shadow-xl flex items-center gap-3 border text-right max-w-sm ${
                        customerFeedback.type === 'success'
                          ? 'bg-emerald-50 dark:bg-emerald-950/90 border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-200'
                          : 'bg-rose-50 dark:bg-rose-950/90 border-rose-200 dark:border-rose-800/80 text-rose-800 dark:text-rose-200'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        customerFeedback.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                      }`}>
                        {customerFeedback.type === 'success' ? <CheckCircle className="w-4.5 h-4.5" /> : <AlertTriangle className="w-4.5 h-4.5" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-black leading-relaxed">{customerFeedback.message}</p>
                      </div>
                      <button 
                        onClick={() => setCustomerFeedback(null)}
                        className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-slate-400 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* 2. PAGE HEADER AND BULK ACTIONS */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs relative overflow-hidden">
                  <div className="space-y-1.5 text-right relative z-10">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-brand-500" />
                      <h2 className="text-base font-black text-slate-900 dark:text-white">مدیریت مشتریان سازمانی</h2>
                    </div>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                      مشاهده، مدیریت پروانه‌ها، کاربران و تیکت‌های پشتیبانی شرکت‌های تابعه و مشتریان بزرگ سحاب
                    </p>
                  </div>

                  <div className="flex items-center gap-3 self-end md:self-auto relative z-10">
                    <button
                      onClick={() => {
                        showCustomerToast('خروجی اکسل گزارش مشتریان با موفقیت تولید و آماده دانلود گردید.', 'success');
                      }}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-slate-400" />
                      <span>خروجی گزارش</span>
                    </button>
                    <button
                      onClick={handleOpenCreateCustomer}
                      className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-black shadow-md shadow-brand-500/15 transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>افزودن مشتری جدید</span>
                    </button>
                  </div>
                </div>

                {/* 3. CRM STATISTICS CARDS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Card 1: Total */}
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs flex items-center justify-between">
                    <div className="space-y-1 text-right">
                      <span className="text-xs text-slate-400 dark:text-slate-500 block font-bold">کل سازمان‌ها</span>
                      <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">320</span>
                      <span className="text-[10px] text-emerald-500 block font-bold">+۵ سازمان جدید در این ماه</span>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800/50 text-slate-500 flex items-center justify-center">
                      <Building className="w-5.5 h-5.5" />
                    </div>
                  </div>

                  {/* Card 2: Actives */}
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs flex items-center justify-between">
                    <div className="space-y-1 text-right">
                      <span className="text-xs text-slate-400 dark:text-slate-500 block font-bold">مشتریان فعال</span>
                      <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                        {285 + customers.filter(c => c.status === 'فعال').length - 5}
                      </span>
                      <span className="text-[10px] text-brand-500 block font-bold">۹۲٪ نرخ ماندگاری سالانه</span>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center">
                      <CheckCircle className="w-5.5 h-5.5" />
                    </div>
                  </div>

                  {/* Card 3: Expiring soon */}
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs flex items-center justify-between">
                    <div className="space-y-1 text-right">
                      <span className="text-xs text-slate-400 dark:text-slate-500 block font-bold">تمدید لایسنس نزدیک</span>
                      <span className="text-2xl font-black text-amber-500 font-mono">18</span>
                      <span className="text-[10px] text-amber-500 block font-bold">اقدام فوری تمدید دوره</span>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                      <AlertTriangle className="w-5.5 h-5.5" />
                    </div>
                  </div>

                  {/* Card 4: Open tickets count */}
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs flex items-center justify-between">
                    <div className="space-y-1 text-right">
                      <span className="text-xs text-slate-400 dark:text-slate-500 block font-bold">تیکت‌های باز مشتریان</span>
                      <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                        {tickets.filter(t => t.status !== 'بسته شده').length}
                      </span>
                      <span className="text-[10px] text-emerald-500 block font-bold">پشتیبانی فعال زیر SLA</span>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                      <MessageSquare className="w-5.5 h-5.5" />
                    </div>
                  </div>
                </div>

                {/* 4. CRM TOOLBAR AND FILTER CRITERIA */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs space-y-4">
                  <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                    <div className="flex flex-1 flex-col sm:flex-row items-center gap-3">
                      {/* Search box */}
                      <div className="relative w-full sm:max-w-xs">
                        <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 pointer-events-none" />
                        <input
                          type="text"
                          placeholder="جستجوی سازمان، مدیر یا شناسه..."
                          value={customerSearch}
                          onChange={(e) => setCustomerSearch(e.target.value)}
                          className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-xs focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all duration-150 font-semibold"
                        />
                      </div>

                      {/* Filter Selectors */}
                      <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto font-bold text-slate-600 dark:text-slate-300">
                        {/* Status Filter */}
                        <div>
                          <select
                            value={customerStatusFilter}
                            onChange={(e) => {
                              setIsCustomerLoading(true);
                              setCustomerStatusFilter(e.target.value);
                              setTimeout(() => setIsCustomerLoading(false), 400);
                            }}
                            className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/50 px-3 py-2.5 outline-none focus:border-brand-500 cursor-pointer font-bold"
                          >
                            <option value="همه">وضعیت: همه</option>
                            <option value="فعال">فعال</option>
                            <option value="غیرفعال">غیرفعال</option>
                            <option value="در انتظار">در انتظار</option>
                          </select>
                        </div>

                        {/* Active Product Filter */}
                        <div>
                          <select
                            value={customerProductFilter}
                            onChange={(e) => {
                              setIsCustomerLoading(true);
                              setCustomerProductFilter(e.target.value);
                              setTimeout(() => setIsCustomerLoading(false), 400);
                            }}
                            className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/50 px-3 py-2.5 outline-none focus:border-brand-500 cursor-pointer font-bold"
                          >
                            <option value="همه">محصول: همه</option>
                            <option value="Cloud Security">Cloud Security</option>
                            <option value="Identity Protection">Identity Protection</option>
                            <option value="Elastic Compute">Elastic Compute</option>
                          </select>
                        </div>

                        {/* Partnership Year Filter */}
                        <div>
                          <select
                            value={customerDateFilter}
                            onChange={(e) => {
                              setIsCustomerLoading(true);
                              setCustomerDateFilter(e.target.value);
                              setTimeout(() => setIsCustomerLoading(false), 400);
                            }}
                            className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/50 px-3 py-2.5 outline-none focus:border-brand-500 cursor-pointer font-bold"
                          >
                            <option value="همه">عضویت: همه</option>
                            <option value="۱۴۰۳">۱۴۰۳</option>
                            <option value="۱۴۰۲">۱۴۰۲</option>
                            <option value="۱۴۰۱">۱۴۰۱</option>
                          </select>
                        </div>

                        {/* SLA Tier Filter */}
                        <div>
                          <select
                            value={customerTierFilter}
                            onChange={(e) => {
                              setIsCustomerLoading(true);
                              setCustomerTierFilter(e.target.value);
                              setTimeout(() => setIsCustomerLoading(false), 400);
                            }}
                            className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/50 px-3 py-2.5 outline-none focus:border-brand-500 cursor-pointer font-bold"
                          >
                            <option value="همه">سطح: همه</option>
                            <option value="Enterprise">Enterprise</option>
                            <option value="Business">Business</option>
                            <option value="Standard">Standard</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 justify-end border-t xl:border-t-0 pt-3 xl:pt-0 border-slate-100 dark:border-slate-800 font-bold text-xs">
                      {/* Reset Filters */}
                      {(customerSearch || customerStatusFilter !== 'همه' || customerProductFilter !== 'همه' || customerDateFilter !== 'همه' || customerTierFilter !== 'همه') && (
                        <button
                          onClick={() => {
                            setIsCustomerLoading(true);
                            setCustomerSearch('');
                            setCustomerStatusFilter('همه');
                            setCustomerProductFilter('همه');
                            setCustomerDateFilter('همه');
                            setCustomerTierFilter('همه');
                            setTimeout(() => setIsCustomerLoading(false), 400);
                          }}
                          className="text-rose-500 hover:text-rose-600 hover:underline flex items-center gap-1 cursor-pointer font-bold shrink-0"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>حذف فیلترها</span>
                        </button>
                      )}

                      {/* Server Error Simulation Toggle */}
                      <label className="flex items-center gap-2 cursor-pointer bg-slate-50 dark:bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 transition-all text-[11px] text-slate-500 font-bold">
                        <input
                          type="checkbox"
                          checked={customerErrorState}
                          onChange={(e) => setCustomerErrorState(e.target.checked)}
                          className="rounded text-brand-600 focus:ring-brand-500/20 cursor-pointer w-3.5 h-3.5"
                        />
                        <span className="shrink-0">شبیه‌سازی خطای سرور</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* 5. SERVER ERROR BOUNDARY SIMULATED STATE */}
                {customerErrorState ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-8 text-center bg-rose-500/5 dark:bg-rose-500/10 rounded-2xl border border-rose-500/20 text-rose-600 dark:text-rose-400 space-y-4 max-w-xl mx-auto text-right"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                        <Server className="w-6 h-6" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <h4 className="text-sm font-black text-rose-700 dark:text-rose-400">خطای برقراری ارتباط با پایگاه داده مشتریان</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                          سامانه در دریافت لیست سازمان‌ها با خطای <code className="font-mono bg-rose-500/10 px-1 py-0.5 rounded text-rose-600 text-[10px]">503 Service Unavailable</code> مواجه گردید. لطفاً اتصال سرورهای لودبالانسر را بررسی نموده یا دکمه تلاش مجدد را کلیک کنید.
                        </p>
                        <div className="pt-2">
                          <button
                            onClick={() => {
                              setIsCustomerLoading(true);
                              setCustomerErrorState(false);
                              setTimeout(() => setIsCustomerLoading(false), 500);
                            }}
                            className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-rose-600/10"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>تلاش مجدد اتصال</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  /* 6. DATA LOADING SKELETON STATE */
                  isCustomerLoading ? (
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs overflow-hidden p-6 space-y-4">
                      <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-36 animate-pulse" />
                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-24 animate-pulse" />
                      </div>
                      <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map((skeRow) => (
                          <div key={skeRow} className="grid grid-cols-6 gap-4 py-3">
                            <div className="h-8 bg-slate-100 dark:bg-slate-800/50 rounded-lg animate-pulse col-span-2" />
                            <div className="h-4 bg-slate-100 dark:bg-slate-800/50 rounded-md animate-pulse mt-2" />
                            <div className="h-6 bg-slate-100 dark:bg-slate-800/50 rounded-full animate-pulse mt-1" />
                            <div className="h-4 bg-slate-100 dark:bg-slate-800/50 rounded-md animate-pulse mt-2" />
                            <div className="h-8 bg-slate-100 dark:bg-slate-800/50 rounded-lg animate-pulse" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* 7. CRM CLIENTS DATA TABLE */
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-right border-collapse">
                          <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-xs font-bold">
                              <th className="p-4 pr-6">سازمان / شرکت</th>
                              <th className="p-4">مدیر اصلی / رابط فنی</th>
                              <th className="p-4">محصولات فعال</th>
                              <th className="p-4">وضعیت اشتراک</th>
                              <th className="p-4 text-center">کاربران فعال</th>
                              <th className="p-4">آخرین فعالیت</th>
                              <th className="p-4 pl-6 text-left">عملیات</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-xs text-slate-700 dark:text-slate-300">
                            {filteredCustomers.length > 0 ? (
                              filteredCustomers.map((c) => (
                                <tr 
                                  key={c.id} 
                                  className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all duration-150"
                                >
                                  {/* Company metadata */}
                                  <td className="p-4 pr-6">
                                    <div className="flex items-center gap-3">
                                      <div className={`w-10 h-10 rounded-full bg-gradient-to-tr flex items-center justify-center font-black text-white text-xs shrink-0 select-none shadow-sm ${
                                        c.customerType === 'Enterprise' ? 'from-amber-500 to-yellow-400' :
                                        c.customerType === 'Business' ? 'from-indigo-600 to-brand-500' :
                                        'from-slate-500 to-slate-400'
                                      }`}>
                                        {c.name.substring(0, 2)}
                                      </div>
                                      <div className="space-y-0.5">
                                        <div className="flex items-center gap-1.5">
                                          <span className="font-bold text-slate-900 dark:text-white group-hover:text-brand-500 transition-colors cursor-pointer flex items-center gap-1.5" onClick={() => {
                                            setSelectedCustomerWorkspace(c);
                                            setCustomerWorkspaceTab('overview');
                                            setActiveTab('customer-details');
                                            showWorkspaceToast(`کارپوشه مدیریتی ${c.name} بارگذاری شد.`, 'success');
                                          }}>
                                            {c.name}
                                            <ArrowUpRight className="w-3 h-3 text-brand-500" />
                                          </span>
                                          <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-full ${
                                            c.customerType === 'Enterprise' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' :
                                            c.customerType === 'Business' ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400' :
                                            'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                          }`}>
                                            {c.customerType === 'Enterprise' ? 'Enterprise' : c.customerType === 'Business' ? 'Business' : 'Standard'}
                                          </span>
                                        </div>
                                        <div className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1.5 font-bold">
                                          <span className="font-mono">{c.id}</span>
                                          <span className="text-slate-300">•</span>
                                          <span>{c.industry}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </td>

                                  {/* Main Contact */}
                                  <td className="p-4">
                                    <div className="space-y-0.5">
                                      <div className="font-black text-slate-800 dark:text-slate-200">{c.managerName || 'ثبت نشده'}</div>
                                      <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono font-bold">{c.managerEmail || '-'}</div>
                                    </div>
                                  </td>

                                  {/* Active Products Count & List */}
                                  <td className="p-4">
                                    <div className="relative">
                                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-black ${
                                        (c.activeProductsCount || 0) > 0 
                                          ? 'bg-brand-500/10 text-brand-500' 
                                          : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                                      }`}>
                                        <Layers className="w-3 h-3" />
                                        <span>{(c.activeProductsCount || 0)} محصول فعال</span>
                                      </span>
                                    </div>
                                  </td>

                                  {/* Subscription Status pill */}
                                  <td className="p-4">
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-extrabold ${
                                      c.status === 'فعال' 
                                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' 
                                        : c.status === 'در انتظار'
                                        ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                                        : 'bg-slate-100 text-slate-400 dark:bg-slate-800/80 dark:text-slate-500'
                                    }`}>
                                      <span className={`w-1.5 h-1.5 rounded-full ${
                                        c.status === 'فعال' ? 'bg-emerald-500' :
                                        c.status === 'در انتظار' ? 'bg-amber-500' : 'bg-slate-400'
                                      }`} />
                                      {c.status || 'غیرفعال'}
                                    </span>
                                  </td>

                                  {/* Users Count */}
                                  <td className="p-4 text-center font-mono font-bold text-slate-900 dark:text-white text-xs">
                                    {c.usersCount !== undefined ? c.usersCount : '۰'}
                                  </td>

                                  {/* Last Activity */}
                                  <td className="p-4">
                                    <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                                      <Clock className="w-3.5 h-3.5" />
                                      <span className="font-bold">{c.lastActivity || 'بدون فعالیت'}</span>
                                    </div>
                                  </td>

                                  {/* Action Popover Menu */}
                                  <td className="p-4 pl-6 text-left relative">
                                    <button
                                      onClick={() => setActiveRowActionId(activeRowActionId === c.id ? null : c.id)}
                                      className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                                    >
                                      <MoreHorizontal className="w-4 h-4" />
                                    </button>

                                    {activeRowActionId === c.id && (
                                      <>
                                        {/* Transparent backdrop overlay */}
                                        <div className="fixed inset-0 z-30" onClick={() => setActiveRowActionId(null)} />
                                        
                                        {/* Dropdown Menu block */}
                                        <div className="absolute left-6 mt-1.5 w-48 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-40 p-1.5 flex flex-col gap-0.5 text-right font-medium">
                                          <button
                                            onClick={() => {
                                              setSelectedCustomerWorkspace(c);
                                              setCustomerWorkspaceTab('overview');
                                              setActiveTab('customer-details');
                                              setActiveRowActionId(null);
                                              showWorkspaceToast(`کارپوشه مدیریتی ${c.name} با موفقیت بارگذاری شد.`, 'success');
                                            }}
                                            className="w-full text-right text-[11px] font-black px-3 py-2 rounded-xl text-brand-650 dark:text-brand-400 hover:bg-brand-500/5 dark:hover:bg-brand-500/10 flex items-center gap-2 cursor-pointer border-b border-slate-100 dark:border-slate-800 pb-2"
                                          >
                                            <Sparkles className="w-4.5 h-4.5 text-brand-500 shrink-0 animate-pulse" />
                                            <span>ورود به میز کار (Workspace)</span>
                                          </button>

                                          <button
                                            onClick={() => {
                                              setSelectedCustomerProfile(c);
                                              setProfileTab('general');
                                              setShowCustomerProfile(true);
                                              setActiveRowActionId(null);
                                            }}
                                            className="w-full text-right text-[11px] font-bold px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 flex items-center gap-2 cursor-pointer"
                                          >
                                            <Eye className="w-4.5 h-4.5 text-slate-400" />
                                            <span>مشاهده پروفایل کامل</span>
                                          </button>

                                          <button
                                            onClick={() => {
                                              // Simulated routing to connections tab of product details
                                              // Search for product and open detail
                                              const prd = products[0];
                                              handleOpenProductDetails(prd);
                                              setActiveRowActionId(null);
                                            }}
                                            className="w-full text-right text-[11px] font-bold px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 flex items-center gap-2 cursor-pointer"
                                          >
                                            <Shield className="w-4.5 h-4.5 text-slate-400" />
                                            <span>مشاهده لایسنس‌ها</span>
                                          </button>

                                          <button
                                            onClick={() => {
                                              // Seamless CRM transition: Switch to tickets tab and search for customer!
                                              setActiveTab('tickets');
                                              setTicketSearch(c.name);
                                              setActiveRowActionId(null);
                                            }}
                                            className="w-full text-right text-[11px] font-bold px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 flex items-center gap-2 cursor-pointer"
                                          >
                                            <MessageSquare className="w-4.5 h-4.5 text-slate-400" />
                                            <span>مشاهده تیکت‌های فعال</span>
                                          </button>

                                          <button
                                            onClick={() => {
                                              showCustomerToast(`در حال بارگذاری لیست کاربران شرکت ${c.name}...`, 'success');
                                              setActiveRowActionId(null);
                                            }}
                                            className="w-full text-right text-[11px] font-bold px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 flex items-center gap-2 cursor-pointer"
                                          >
                                            <Users2 className="w-4.5 h-4.5 text-slate-400" />
                                            <span>مدیریت کاربران رابط</span>
                                          </button>

                                          <button
                                            onClick={() => handleOpenEditCustomer(c)}
                                            className="w-full text-right text-[11px] font-bold px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 flex items-center gap-2 cursor-pointer border-t border-slate-100 dark:border-slate-800"
                                          >
                                            <Edit className="w-4.5 h-4.5 text-slate-400" />
                                            <span>ویرایش اطلاعات</span>
                                          </button>

                                          <button
                                            onClick={() => handleDeactivateCustomer(c)}
                                            className={`w-full text-right text-[11px] font-black px-3 py-2 rounded-xl flex items-center gap-2 cursor-pointer border-t border-slate-100 dark:border-slate-800 ${
                                              c.status === 'فعال' ? 'text-rose-600 hover:bg-rose-500/10' : 'text-emerald-600 hover:bg-emerald-500/10'
                                            }`}
                                          >
                                            <RefreshCw className="w-4.5 h-4.5 text-slate-400 shrink-0" />
                                            <span>{c.status === 'فعال' ? 'غیرفعال‌سازی شرکت' : 'فعال‌سازی مجدد'}</span>
                                          </button>

                                          <button
                                            onClick={() => handleDeleteCustomer(c)}
                                            className="w-full text-right text-[11px] font-black px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-500/10 flex items-center gap-2 cursor-pointer border-t border-slate-100 dark:border-slate-800"
                                          >
                                            <Trash2 className="w-4.5 h-4.5 text-rose-400 shrink-0" />
                                            <span>حذف دائمی شرکت</span>
                                          </button>
                                        </div>
                                      </>
                                    )}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              /* 8. EMPTY SEARCH STATE */
                              <tr>
                                <td colSpan={7} className="p-12 text-center text-slate-400 dark:text-slate-500">
                                  <HelpCircle className="w-12 h-12 mx-auto mb-3 opacity-40 text-slate-400" />
                                  <div className="text-sm font-black text-slate-800 dark:text-slate-300">مشتری سازمانی یافت نشد</div>
                                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 leading-relaxed max-w-sm mx-auto font-bold">
                                    با فیلترهای اعمال شده فعلی موردی در سیستم سحاب ثبت نشده است. لطفاً واژه‌ی جستجو را تغییر دهید یا دکمه زیر را کلیک کنید.
                                  </p>
                                  <div className="pt-4 flex justify-center">
                                    <button
                                      onClick={() => {
                                        setIsCustomerLoading(true);
                                        setCustomerSearch('');
                                        setCustomerStatusFilter('همه');
                                        setCustomerProductFilter('همه');
                                        setCustomerDateFilter('همه');
                                        setCustomerTierFilter('همه');
                                        setTimeout(() => setIsCustomerLoading(false), 400);
                                      }}
                                      className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                                    >
                                      حذف کلیه فیلترها
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )
                )}
              </motion.div>
            )}

            {/* TAB 5: AGENTS & USERS */}
            {activeTab === 'users' && (
              <motion.div
                key="users-tab"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="space-y-6"
              >
                <UserManagementView showCustomerToast={showWorkspaceToast} initialCustomerCompany={pendingCustomerCompany ?? undefined} onClearInitialCustomerCompany={() => setPendingCustomerCompany(null)} />
              </motion.div>
            )}

            {/* TAB 6: REPORTS & PERFORMANCE */}
            {activeTab === 'reports' && (
              <motion.div
                key="reports-tab"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="space-y-6"
              >
                {/* Custom Responsive SVG Charting Engine (Visualizing 2026 SaaS SLA metrics) */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                    <div className="text-right">
                      <h3 className="text-sm font-black text-slate-950 dark:text-white">نمودار حجم تیکت‌های دریافتی روزانه</h3>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">میانگین توزیع تیکت‌های پشتیبانی در بازه زمانی اخیر</p>
                    </div>

                    <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/60 dark:border-slate-800/60 self-start sm:self-auto font-bold">
                      <span className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 text-[10px] text-slate-900 dark:text-white shadow-xs">۷ روز اخیر</span>
                      <span className="px-3 py-1.5 text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer">۳۰ روز اخیر</span>
                    </div>
                  </div>

                  {/* SVG Responsive Area Chart */}
                  <div className="h-60 w-full relative">
                    <svg className="w-full h-full" viewBox="0 0 700 240" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25"/>
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0"/>
                        </linearGradient>
                      </defs>

                      {/* Grid Lines */}
                      <line x1="50" y1="30" x2="680" y2="30" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3" className="dark:stroke-slate-800/50" />
                      <line x1="50" y1="90" x2="680" y2="90" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3" className="dark:stroke-slate-800/50" />
                      <line x1="50" y1="150" x2="680" y2="150" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3" className="dark:stroke-slate-800/50" />
                      <line x1="50" y1="210" x2="680" y2="210" stroke="#cbd5e1" strokeWidth="1" className="dark:stroke-slate-800" />

                      {/* Y-Axis Labels */}
                      <text x="35" y="34" className="text-[10px] fill-slate-400 font-mono" textAnchor="end">۶۰ تیکت</text>
                      <text x="35" y="94" className="text-[10px] fill-slate-400 font-mono" textAnchor="end">۴۰ تیکت</text>
                      <text x="35" y="154" className="text-[10px] fill-slate-400 font-mono" textAnchor="end">۲۰ تیکت</text>
                      <text x="35" y="214" className="text-[10px] fill-slate-400 font-mono" textAnchor="end">۰</text>

                      {/* Area Fill */}
                      <path 
                        d="M 50 210 L 140 170 L 230 110 L 320 150 L 410 70 L 500 130 L 590 90 L 680 50 L 680 210 Z" 
                        fill="url(#chartGradient)" 
                      />

                      {/* Line Path */}
                      <path 
                        d="M 50 210 L 140 170 L 230 110 L 320 150 L 410 70 L 500 130 L 590 90 L 680 50" 
                        fill="none" 
                        stroke="#3b82f6" 
                        strokeWidth="3" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                      />

                      {/* Circles for Points */}
                      <circle cx="140" cy="170" r="5" fill="#3b82f6" stroke="#fff" strokeWidth="2" className="dark:stroke-slate-900" />
                      <circle cx="230" cy="110" r="5" fill="#3b82f6" stroke="#fff" strokeWidth="2" className="dark:stroke-slate-900" />
                      <circle cx="320" cy="150" r="5" fill="#3b82f6" stroke="#fff" strokeWidth="2" className="dark:stroke-slate-900" />
                      <circle cx="410" cy="70" r="5" fill="#3b82f6" stroke="#fff" strokeWidth="2" className="dark:stroke-slate-900" />
                      <circle cx="500" cy="130" r="5" fill="#3b82f6" stroke="#fff" strokeWidth="2" className="dark:stroke-slate-900" />
                      <circle cx="590" cy="90" r="5" fill="#3b82f6" stroke="#fff" strokeWidth="2" className="dark:stroke-slate-900" />
                      <circle cx="680" cy="50" r="5" fill="#3b82f6" stroke="#fff" strokeWidth="2" className="dark:stroke-slate-900" />

                      {/* X-Axis Labels */}
                      <text x="140" y="232" className="text-[10px] fill-slate-400 font-bold" textAnchor="middle">شنبه</text>
                      <text x="230" y="232" className="text-[10px] fill-slate-400 font-bold" textAnchor="middle">یکشنبه</text>
                      <text x="320" y="232" className="text-[10px] fill-slate-400 font-bold" textAnchor="middle">دوشنبه</text>
                      <text x="410" y="232" className="text-[10px] fill-slate-400 font-bold" textAnchor="middle">سه‌شنبه</text>
                      <text x="500" y="232" className="text-[10px] fill-slate-400 font-bold" textAnchor="middle">چهارشنبه</text>
                      <text x="590" y="232" className="text-[10px] fill-slate-400 font-bold" textAnchor="middle">پنجشنبه</text>
                      <text x="680" y="232" className="text-[10px] fill-slate-400 font-bold" textAnchor="middle">جمعه</text>
                    </svg>
                  </div>
                </div>

                {/* Additional Metrics Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs">
                    <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 mb-3 text-right">تحلیل سهم تیکت‌های زیرسرویس‌ها</h4>
                    <div className="space-y-3 text-xs">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="font-bold">پنل کاربری</span>
                          <span className="font-mono">۴۲٪</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="bg-brand-500 h-full rounded-full" style={{ width: '42%' }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="font-bold">API وب‌هوک</span>
                          <span className="font-mono">۲۸٪</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="bg-blue-500 h-full rounded-full" style={{ width: '28%' }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="font-bold">API استعلام سریع</span>
                          <span className="font-mono">۲۰٪</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="bg-amber-50 h-full rounded-full" style={{ width: '20%' }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 mb-2">انطباق با قوانین SLA</h4>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed mb-4">میزان پاسخگویی صحیح به تعهدات سطح خدمات نسبت به کل ماه‌های سال جاری.</p>
                    </div>
                    <div className="flex items-end justify-between">
                      <div className="space-y-1">
                        <span className="text-3xl font-black text-emerald-500 font-mono">99.2%</span>
                        <span className="text-[10px] text-slate-400 block font-bold">هدف سازمانی: بالای ۹۸.۵٪</span>
                      </div>
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded-lg font-bold">بسیار عالی</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 7: NOTIFICATIONS */}
            {activeTab === 'notifications' && (
              <motion.div
                key="notifications-tab"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
              >
                <NotificationCenterView 
                  showToast={showWorkspaceToast} 
                  onNavigateToTicket={(tId) => {
                    setActiveTab('tickets');
                  }}
                />
              </motion.div>
            )}

            {/* TAB 8: SETTINGS */}
            {activeTab === 'settings' && (
              <motion.div
                key="settings-tab"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="space-y-6"
              >
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs space-y-6 text-right">
                  <h3 className="text-sm font-black text-slate-950 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
                    تنظیمات کلی سامانه پشتیبانی سحاب
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">نام پلتفرم پشتیبانی (برندینگ)</label>
                      <input 
                        type="text" 
                        defaultValue="سامانه ابری مدیریت مشتریان" 
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 outline-none" 
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">ایمیل پیش‌فرض مکاتبات سیستم</label>
                      <input 
                        type="email" 
                        defaultValue="support@example.com" 
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 outline-none" 
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">مهلت پاسخگویی SLA (تیکت‌های بحرانی)</label>
                      <select className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 outline-none cursor-pointer">
                        <option value="1">حداکثر ۱ ساعت</option>
                        <option value="2">حداکثر ۲ ساعت</option>
                        <option value="4">حداکثر ۴ ساعت</option>
                        <option value="8">حداکثر ۸ ساعت</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">کنترل تخصیص هوشمند تیکت‌ها</label>
                      <select className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 outline-none cursor-pointer">
                        <option value="auto">تخصیص اتوماتیک بر اساس حجم کار پشتیبان</option>
                        <option value="round-robin">تخصیص چرخشی (Round-Robin)</option>
                        <option value="manual">تخصیص دستی توسط سوپروایزر</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                    <button className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-black px-6 py-3 rounded-xl transition-all cursor-pointer">
                      ذخیره تغییرات تنظیمات
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 9: ACCESS REQUESTS */}
            {activeTab === 'access-requests' && (
              <motion.div
                key="access-requests-tab"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="space-y-6"
              >
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      درخواست‌های دسترسی در انتظار تأیید
                    </h3>
                    <button
                      onClick={fetchPendingRequests}
                      className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-4 h-4" />
                      بروزرسانی
                    </button>
                  </div>

                  {requestsLoading ? (
                    <div className="text-center py-8 text-xs text-slate-400">در حال بارگذاری...</div>
                  ) : pendingRequests.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                      <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-40" />
                      <p className="text-xs font-bold">هیچ درخواست دسترسی جدیدی وجود ندارد</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-right border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-[10px] font-extrabold uppercase">
                            <th className="p-3 pr-0">نام درخواست‌کننده</th>
                            <th className="p-3">شرکت / سازمان</th>
                            <th className="p-3">ایمیل</th>
                            <th className="p-3">تلفن</th>
                            <th className="p-3">تاریخ درخواست</th>
                            <th className="p-3 pl-0 text-left">عملیات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-xs text-slate-700 dark:text-slate-300">
                          {pendingRequests.map((req) => (
                            <tr key={req.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/10">
                              <td className="p-3 pr-0 font-bold text-slate-900 dark:text-white">{req.name}</td>
                              <td className="p-3">{req.companyName}</td>
                              <td className="p-3 font-mono text-slate-500">{req.email}</td>
                              <td className="p-3 font-mono">{req.phone}</td>
                              <td className="p-3 text-slate-500 text-[10px]">{new Date(req.createdAt).toLocaleDateString('fa-IR')}</td>
                              <td className="p-3 pl-0 text-left space-x-2 space-x-reverse">
                                <button
                                  onClick={() => handleApproveRequest(req)}
                                  className="text-[10px] bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-black px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                                >
                                  تأیید و فعال‌سازی
                                </button>
                                <button
                                  onClick={() => handleRejectRequest(req)}
                                  className="text-[10px] bg-rose-500/10 hover:bg-rose-500/15 text-rose-600 dark:text-rose-400 font-black px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                                >
                                  رد درخواست
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* TAB 10: CUSTOMER DETAILS / WORKSPACE */}
            {activeTab === 'customer-details' && (
              <CustomerWorkspaceView
                selectedCustomerWorkspace={selectedCustomerWorkspace}
                customers={customers}
                setCustomers={setCustomers}
                tickets={tickets}
                setTickets={setTickets}
                products={products}
                setActiveTab={setActiveTab}
                setTicketSearch={setTicketSearch}
                setShowTicketModal={setShowTicketModal}
                setNewTicketCustomer={setNewTicketCustomer}
                setNewTicketProduct={setNewTicketProduct}
                showCustomerToast={showCustomerToast}
                onAddCustomerUser={(companyName) => {
                  setPendingCustomerCompany(companyName);
                  setActiveTab('users');
                }}
              />
            )}



          </AnimatePresence>
        </main>
      </div>

      {/* --------------------- MODALS AND FORMS --------------------- */}

      {/* MODAL 1: CREATE TICKET (Already existing & improved with more fields) */}
      {showTicketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-black text-slate-950 dark:text-white flex items-center gap-2">
                <Inbox className="w-5 h-5 text-brand-500" />
                <span>ثبت تیکت پشتیبانی جدید</span>
              </h3>
              <button 
                onClick={() => setShowTicketModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4 text-right">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1.5">موضوع و عنوان خطا</label>
                <input
                  type="text"
                  required
                  value={newTicketTitle}
                  onChange={(e) => setNewTicketTitle(e.target.value)}
                  placeholder="مثال: خطای اتصال به گیت‌وی استعلام مالی"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1.5">مشتری سازمانی / شرکت تابعه</label>
                <select
                  required
                  value={newTicketCustomer}
                  onChange={(e) => setNewTicketCustomer(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 cursor-pointer"
                >
                  <option value="">انتخاب مشتری...</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1.5">زیرسرویس مربوطه</label>
                  <select
                    value={newTicketProduct}
                    onChange={(e) => setNewTicketProduct(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 outline-none focus:border-brand-500 cursor-pointer text-slate-600 dark:text-slate-300 font-bold"
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1.5">اولویت تیکت</label>
                  <select
                    value={newTicketPriority}
                    onChange={(e) => setNewTicketPriority(e.target.value as Ticket['priority'])}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 outline-none focus:border-brand-500 cursor-pointer text-slate-600 dark:text-slate-300 font-bold"
                  >
                    <option value="بحرانی">🚨 بحرانی</option>
                    <option value="بالا">⚠️ بالا</option>
                    <option value="متوسط">⚡ متوسط</option>
                    <option value="پایین">💤 پایین</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowTicketModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-black shadow-md shadow-brand-500/15 transition-all cursor-pointer"
                >
                  ثبت تیکت
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL 2: CREATE PRODUCT */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-black text-slate-950 dark:text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-brand-500" />
                <span>افزودن محصول / زیرسرویس جدید</span>
              </h3>
              <button 
                onClick={() => setShowProductModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 text-right">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1.5">نام زیرسرویس جدید</label>
                <input
                  type="text"
                  required
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  placeholder="مثال: گیت‌وی احراز هویت پیامکی"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1.5">دسته‌بندی فنی</label>
                  <select
                    value={newProductCategory}
                    onChange={(e) => setNewProductCategory(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 outline-none focus:border-brand-500 cursor-pointer text-slate-600 dark:text-slate-300 font-bold"
                  >
                    <option value="وب‌سرویس">وب‌سرویس</option>
                    <option value="امنیتی">امنیتی</option>
                    <option value="ارتباطات">ارتباطات</option>
                    <option value="زیرساخت">زیرساخت</option>
                    <option value="مالی">مالی</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1.5">نسخه اولیه</label>
                  <input
                    type="text"
                    required
                    value={newProductVersion}
                    onChange={(e) => setNewProductVersion(e.target.value)}
                    placeholder="v1.0.0"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-black shadow-md shadow-brand-500/15 transition-all cursor-pointer"
                >
                  ثبت محصول
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL 3: ADD / EDIT CUSTOMER CRM DRAWER */}
      <AnimatePresence>
        {showCustomerDrawer && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCustomerDrawer(false)}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 cursor-default"
            />

            {/* Slideout Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 240 }}
              className="fixed inset-y-0 right-0 w-full max-w-xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl z-50 flex flex-col justify-between text-right"
              id="customer-crm-drawer-panel"
            >
              {/* Drawer Header */}
              <div className="p-5 border-b border-slate-150 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    customerDrawerMode === 'create' ? 'bg-brand-500/10 text-brand-500' : 'bg-amber-500/10 text-amber-500'
                  }`}>
                    {customerDrawerMode === 'create' ? <UserPlus className="w-5 h-5" /> : <Edit className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-950 dark:text-white">
                      {customerDrawerMode === 'create' ? 'ثبت مشتری سازمانی جدید' : `ویرایش اطلاعات: ${companyName}`}
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-bold">
                      وارد کردن مشخصات ثبتی، اطلاعات مالی و رابط‌های فنی کلاینت
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCustomerDrawer(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Body (Form) */}
              <form 
                onSubmit={async (e) => {
                  e.preventDefault();
                  setIsSavingCustomer(true);
                  await handleSaveCustomer(e);
                  setIsSavingCustomer(false);
                }} 
                className="flex-1 overflow-y-auto p-6 space-y-6 font-medium text-xs text-slate-700 dark:text-slate-300"
              >
                {/* Section A: Company Info */}
                <div className="space-y-4">
                  <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-slate-800/60">
                    <Building className="w-4 h-4 text-slate-400" />
                    <h4 className="text-[11px] font-black text-slate-900 dark:text-white">اطلاعات ثبتی و شرکتی</h4>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-black text-slate-600 dark:text-slate-400">نام رسمی سازمان <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        required
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="مثال: شرکت نفت و گاز پارس"
                        className="w-full text-xs font-bold border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/40 px-3.5 py-2.5 outline-none focus:border-brand-500 text-slate-800 dark:text-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-black text-slate-600 dark:text-slate-400">نام تجاری / برند</label>
                      <input
                        type="text"
                        value={companyCommercialName}
                        onChange={(e) => setCompanyCommercialName(e.target.value)}
                        placeholder="مثال: پارس آنلاین"
                        className="w-full text-xs font-bold border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/40 px-3.5 py-2.5 outline-none focus:border-brand-500 text-slate-800 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-black text-slate-600 dark:text-slate-400">صنعت و حوزه فعالیت</label>
                      <input
                        type="text"
                        value={companyIndustry}
                        onChange={(e) => setCompanyIndustry(e.target.value)}
                        placeholder="مثال: انرژی، بانکی، دولت"
                        className="w-full text-xs font-bold border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/40 px-3.5 py-2.5 outline-none focus:border-brand-500 text-slate-800 dark:text-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-black text-slate-600 dark:text-slate-400">تلفن تماس شرکت</label>
                      <input
                        type="text"
                        value={companyPhone}
                        onChange={(e) => setCompanyPhone(e.target.value)}
                        placeholder="۰۲۱-۸۸۸۸XXXX"
                        className="w-full text-xs font-bold font-mono text-left border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/40 px-3.5 py-2.5 outline-none focus:border-brand-500 text-slate-800 dark:text-white"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-black text-slate-600 dark:text-slate-400">سطح مشتری (Tier)</label>
                      <select
                        value={businessType}
                        onChange={(e) => setBusinessType(e.target.value as 'Enterprise' | 'Business' | 'Standard')}
                        className="w-full text-xs font-bold border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/50 px-3.5 py-2.5 outline-none focus:border-brand-500 text-slate-700 dark:text-slate-300 cursor-pointer font-bold"
                      >
                        <option value="Enterprise">Enterprise (شرکت‌های طلایی بزرگ)</option>
                        <option value="Business">Business (شرکت‌های نقره‌ای رشد‌یافته)</option>
                        <option value="Standard">Standard (برنزی نوپا)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-black text-slate-600 dark:text-slate-400">وب‌سایت رسمی</label>
                      <input
                        type="text"
                        value={companyWebsite}
                        onChange={(e) => setCompanyWebsite(e.target.value)}
                        placeholder="https://example.com"
                        className="w-full text-xs font-bold font-mono text-left border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/40 px-3.5 py-2.5 outline-none focus:border-brand-500 text-slate-800 dark:text-white"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-black text-slate-600 dark:text-slate-400">آدرس پستی دفتر مرکزی</label>
                    <textarea
                      rows={2}
                      value={companyAddress}
                      onChange={(e) => setCompanyAddress(e.target.value)}
                      placeholder="تهران، خیابان ولیعصر، بالاتر از میدان ونک، کوچه..."
                      className="w-full text-xs font-bold border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/40 px-3.5 py-2.5 outline-none focus:border-brand-500 text-slate-800 dark:text-white leading-relaxed"
                    />
                  </div>
                </div>

                {/* Section B: Technical Contact Person */}
                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-slate-800/60">
                    <UserCheck className="w-4 h-4 text-slate-400" />
                    <h4 className="text-[11px] font-black text-slate-900 dark:text-white">رابط اصلی و مسئول فنی سازمان</h4>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-black text-slate-600 dark:text-slate-400">نام و نام‌خانوادگی <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        required
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="مثال: مهندس مهران راد"
                        className="w-full text-xs font-bold border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/40 px-3.5 py-2.5 outline-none focus:border-brand-500 text-slate-800 dark:text-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-black text-slate-600 dark:text-slate-400">شماره همراه رابط</label>
                      <input
                        type="text"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="۰۹۱۲XXXXXXX"
                        className="w-full text-xs font-bold font-mono text-left border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/40 px-3.5 py-2.5 outline-none focus:border-brand-500 text-slate-800 dark:text-white"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-black text-slate-600 dark:text-slate-400">پست الکترونیکی رابط <span className="text-rose-500">*</span></label>
                    <input
                      type="email"
                      required
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="m.rad@company.ir"
                      className="w-full text-xs font-bold font-mono text-left border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/40 px-3.5 py-2.5 outline-none focus:border-brand-500 text-slate-800 dark:text-white"
                      dir="ltr"
                    />
                  </div>
                </div>

                {/* Section C: Administration settings */}
                {customerDrawerMode === 'edit' && (
                  <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-slate-800/60">
                      <ShieldAlert className="w-4 h-4 text-slate-400" />
                      <h4 className="text-[11px] font-black text-slate-900 dark:text-white">وضعیت پلتفرم و دسترسی</h4>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-black text-slate-600 dark:text-slate-400">وضعیت دسترسی سازمان</label>
                      <select
                        value={businessStatus}
                        onChange={(e) => setBusinessStatus(e.target.value as 'فعال' | 'غیرفعال' | 'در انتظار')}
                        className="w-full text-xs font-bold border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/50 px-3.5 py-2.5 outline-none focus:border-brand-500 text-slate-700 dark:text-slate-300 cursor-pointer"
                      >
                        <option value="فعال">🟢 فعال (امکان استفاده کامل از سرویس‌ها)</option>
                        <option value="غیرفعال">🔴 غیرفعال (مسدود شدن لایسنس و توکن‌ها)</option>
                        <option value="در انتظار">🟡 در انتظار (در حال پردازش اداری و پرداخت)</option>
                      </select>
                    </div>
                  </div>
                )}
              </form>

              {/* Drawer Footer */}
              <div className="p-5 border-t border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCustomerDrawer(false)}
                  className="px-4.5 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={async (e) => {
                    setIsSavingCustomer(true);
                    await handleSaveCustomer(e);
                    setIsSavingCustomer(false);
                  }}
                  disabled={isSavingCustomer}
                  className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-black shadow-md shadow-brand-500/15 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-75"
                >
                  {isSavingCustomer ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>در حال ذخیره...</span>
                    </>
                  ) : (
                    <span>ذخیره تغییرات مشتری</span>
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* MODAL 4: DETAILED CUSTOMER PROFILE PREVIEW WORKSPACE */}
      <AnimatePresence>
        {showCustomerProfile && selectedCustomerProfile && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCustomerProfile(false)}
              className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-50 cursor-default"
            />

            {/* Central Workspace Panel */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6" dir="rtl">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full h-[85vh] flex flex-col shadow-2xl overflow-hidden text-right"
                id="customer-profile-preview-workspace"
              >
                {/* Profile Header section */}
                <div className="p-6 bg-slate-50 dark:bg-slate-950/40 border-b border-slate-150 dark:border-slate-800/60 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-full bg-gradient-to-tr flex items-center justify-center font-black text-white text-lg shadow-md ${
                      selectedCustomerProfile.customerType === 'Enterprise' ? 'from-amber-500 to-yellow-400' :
                      selectedCustomerProfile.customerType === 'Business' ? 'from-indigo-600 to-brand-500' :
                      'from-slate-500 to-slate-400'
                    }`}>
                      {selectedCustomerProfile.name.substring(0, 2)}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-black text-slate-950 dark:text-white">{selectedCustomerProfile.name}</h3>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          selectedCustomerProfile.customerType === 'Enterprise' ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400' :
                          selectedCustomerProfile.customerType === 'Business' ? 'bg-indigo-100 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400' :
                          'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}>
                          {selectedCustomerProfile.customerType === 'Enterprise' ? 'مشتری طلایی Enterprise' : selectedCustomerProfile.customerType === 'Business' ? 'مشتری نقره‌ای Business' : 'مشتری استاندارد'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-bold">
                        <span className="font-mono">کد کلاینت: {selectedCustomerProfile.id}</span>
                        <span className="text-slate-300">•</span>
                        <span>صنعت: {selectedCustomerProfile.industry}</span>
                        <span className="text-slate-300">•</span>
                        <span className="flex items-center gap-1">
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            selectedCustomerProfile.status === 'فعال' ? 'bg-emerald-500' : 'bg-slate-400'
                          }`} />
                          <span>وضعیت: {selectedCustomerProfile.status}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => {
                        setShowCustomerProfile(false);
                        handleOpenEditCustomer(selectedCustomerProfile);
                      }}
                      className="px-4 py-2 text-xs font-black bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Edit className="w-4 h-4 text-slate-400" />
                      <span>ویرایش اطلاعات</span>
                    </button>
                    <button
                      onClick={() => setShowCustomerProfile(false)}
                      className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Subtabs controller bar */}
                <div className="px-6 border-b border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 flex items-center gap-5 shrink-0">
                  {[
                    { id: 'general', label: 'پروفایل عمومی CRM', icon: Building },
                    { id: 'licenses', label: 'مجوزها و کلیدهای لایسنس', icon: Shield },
                    { id: 'tickets', label: 'تیکت‌های باز SLA', icon: MessageSquare },
                    { id: 'audit', label: 'لاگ رویدادها و ممیزی', icon: ClipboardList }
                  ].map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => setProfileTab(sub.id as any)}
                      className={`py-3.5 text-xs font-black border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
                        profileTab === sub.id 
                          ? 'border-brand-500 text-brand-600 dark:text-brand-400' 
                          : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                      }`}
                    >
                      <sub.icon className="w-4 h-4 shrink-0" />
                      <span>{sub.label}</span>
                    </button>
                  ))}
                </div>

                {/* Profile Tabs Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-950/10">
                  {/* TAB A: GENERAL */}
                  {profileTab === 'general' && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Company Info Box */}
                        <div className="md:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs space-y-4">
                          <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-slate-800/40">
                            <Building className="w-4 h-4 text-slate-400" />
                            <span>مشخصات سازمانی و مکاتباتی</span>
                          </h4>

                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div className="space-y-1">
                              <span className="text-slate-400 block font-bold">نام تجاری کلاینت:</span>
                              <span className="font-black text-slate-800 dark:text-slate-100">{selectedCustomerProfile.commercialName || selectedCustomerProfile.name}</span>
                            </div>
                            <div className="space-y-1">
                              <span className="text-slate-400 block font-bold">حوزه صنعت:</span>
                              <span className="font-black text-slate-800 dark:text-slate-100">{selectedCustomerProfile.industry}</span>
                            </div>
                            <div className="space-y-1">
                              <span className="text-slate-400 block font-bold">تلفن دفتر مرکزی:</span>
                              <span className="font-mono font-bold text-slate-800 dark:text-slate-100 text-left block" dir="ltr">{selectedCustomerProfile.phone || '۰۲۱-۸۸۸۸۴۴۲۲'}</span>
                            </div>
                            <div className="space-y-1">
                              <span className="text-slate-400 block font-bold">وب‌سایت رسمی:</span>
                              {selectedCustomerProfile.website ? (
                                <a href={selectedCustomerProfile.website} target="_blank" rel="noreferrer" className="text-brand-500 hover:underline font-mono font-bold flex items-center gap-1" dir="ltr">
                                  <span>{selectedCustomerProfile.website}</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              ) : (
                                <span className="text-slate-400 font-bold">-</span>
                              )}
                            </div>
                          </div>

                          <div className="pt-2 space-y-1 text-xs border-t border-slate-100 dark:border-slate-800/40">
                            <span className="text-slate-400 block font-bold">آدرس پستی:</span>
                            <p className="font-bold text-slate-700 dark:text-slate-300 leading-relaxed">
                              {selectedCustomerProfile.address || 'تهران، خیابان ولیعصر، بالاتر از میدان ونک، برج فناوری سحاب، طبقه چهارم'}
                            </p>
                          </div>
                        </div>

                        {/* CRM Manager info */}
                        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs space-y-4">
                          <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-slate-800/40">
                            <UserCheck className="w-4 h-4 text-slate-400" />
                            <span>مسئول فنی و اداری</span>
                          </h4>

                          <div className="space-y-4 text-xs">
                            <div className="space-y-1">
                              <span className="text-slate-400 block font-bold">رابط فنی شرکت:</span>
                              <span className="font-black text-slate-800 dark:text-slate-200 text-sm block">
                                {selectedCustomerProfile.managerName || 'نامشخص'}
                              </span>
                            </div>

                            <div className="space-y-1">
                              <span className="text-slate-400 block font-bold">شماره تماس مستقیم:</span>
                              <span className="font-mono font-bold text-slate-700 dark:text-slate-300 block" dir="ltr">
                                {selectedCustomerProfile.managerPhone || '۰۹۱۲۳۴۵۶۷۸۹'}
                              </span>
                            </div>

                            <div className="space-y-1">
                              <span className="text-slate-400 block font-bold">پست الکترونیکی:</span>
                              <span className="font-mono font-bold text-brand-500 block truncate" dir="ltr">
                                {selectedCustomerProfile.managerEmail || 'r.manager@corporate.ir'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Map Location Card placeholder */}
                      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs space-y-3">
                        <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1">
                          <MapPin className="w-4 h-4 text-brand-500" />
                          <span>موقعیت جغرافیایی و سرورها</span>
                        </h4>
                        <div className="h-28 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 relative overflow-hidden font-bold text-[10px]">
                          {/* Simulated Maps view */}
                          <div className="absolute inset-0 opacity-45 dark:opacity-20 bg-radial from-slate-600 via-slate-400 to-transparent flex items-center justify-center" />
                          <div className="z-10 text-center space-y-1">
                            <div className="text-xs font-black text-slate-800 dark:text-slate-350">موقعیت: تهران، ونک</div>
                            <div>سیستم ابری توزیع‌شده با گره‌های فعال تهران - شیراز - اصفهان</div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* TAB B: LICENSES */}
                  {profileTab === 'licenses' && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs overflow-hidden"
                    >
                      <table className="w-full text-right border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-[10px] font-bold">
                            <th className="p-4 pr-6">عنوان محصول فعال</th>
                            <th className="p-4">نسخه</th>
                            <th className="p-4">نوع اشتراک</th>
                            <th className="p-4">سقف کلاینت</th>
                            <th className="p-4">کلید لایسنس</th>
                            <th className="p-4 pl-6 text-left">انقضا</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                          {productCustomerConnections
                            .filter(conn => conn.customerName === selectedCustomerProfile.name)
                            .map((conn) => (
                              <tr key={conn.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                                <td className="p-4 pr-6">
                                  <div className="font-black text-slate-900 dark:text-white">
                                    {conn.productId === 'PRD-01' ? 'Cloud Security Platform' : 
                                     conn.productId === 'PRD-02' ? 'Identity Protection Suite' : 
                                     'Elastic Compute Module'}
                                  </div>
                                  <div className="text-[9px] text-slate-400 mt-0.5 font-bold">شناسه: {conn.productId}</div>
                                </td>
                                <td className="p-4 font-mono font-bold text-slate-500">v3.4.0</td>
                                <td className="p-4">
                                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-black ${
                                    conn.subscriptionType === 'Enterprise' ? 'bg-indigo-50/50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400' : 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                  }`}>
                                    {conn.subscriptionType === 'Enterprise' ? 'Enterprise' : 'Premium'}
                                  </span>
                                </td>
                                <td className="p-4 font-mono text-slate-800 dark:text-slate-200">{conn.userCount} کاربر</td>
                                <td className="p-4 font-mono text-[10px] text-slate-500 select-all">{conn.activationKey}</td>
                                <td className="p-4 pl-6 text-left font-mono text-rose-500 text-[10px]">{conn.endDate}</td>
                              </tr>
                            ))}
                          {productCustomerConnections.filter(conn => conn.customerName === selectedCustomerProfile.name).length === 0 && (
                            <tr>
                              <td colSpan={6} className="p-8 text-center text-slate-400">
                                <ShieldAlert className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                <div>پروانه لایسنس فعالی برای این مشتری صادر نگردیده است.</div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </motion.div>
                  )}

                  {/* TAB C: TICKETS */}
                  {profileTab === 'tickets' && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs overflow-hidden"
                    >
                      <table className="w-full text-right border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-[10px] font-bold">
                            <th className="p-4 pr-6">شناسه تیکت</th>
                            <th className="p-4">موضوع تیکت پشتیبانی</th>
                            <th className="p-4">زیرسرویس مربوطه</th>
                            <th className="p-4">اولویت</th>
                            <th className="p-4 text-center">وضعیت</th>
                            <th className="p-4 pl-6 text-left">آخرین بروزرسانی</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          {tickets
                            .filter(t => t.customer === selectedCustomerProfile.name)
                            .map((t) => (
                              <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                                <td className="p-4 pr-6 font-mono font-black text-slate-400">{t.id}</td>
                                <td className="p-4 max-w-xs truncate text-slate-900 dark:text-white">{t.title}</td>
                                <td className="p-4">
                                  <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded text-[10px] font-medium">
                                    {t.product}
                                  </span>
                                </td>
                                <td className="p-4">
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold ${
                                    t.priority === 'بحرانی' ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/10' : 'bg-slate-100 text-slate-500'
                                  }`}>
                                    {t.priority}
                                  </span>
                                </td>
                                <td className="p-4 text-center">
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold ${
                                    t.status === 'باز' ? 'text-blue-500' : 'text-slate-400'
                                  }`}>
                                    {t.status}
                                  </span>
                                </td>
                                <td className="p-4 pl-6 text-left font-mono text-[10px] text-slate-400">{t.date}</td>
                              </tr>
                            ))}
                          {tickets.filter(t => t.customer === selectedCustomerProfile.name).length === 0 && (
                            <tr>
                              <td colSpan={6} className="p-8 text-center text-slate-400">
                                <CheckCircle className="w-10 h-10 mx-auto mb-2 text-emerald-500 opacity-60" />
                                <div>هیچ تیکت پشتیبانی باز یا بسته‌شده‌ای ثبت نگردیده است.</div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </motion.div>
                  )}

                  {/* TAB D: AUDIT */}
                  {profileTab === 'audit' && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs space-y-4"
                    >
                      <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1">
                        <History className="w-4 h-4 text-slate-400" />
                        <span>تاریخچه رویدادهای سیستمی و ممیزی کلاینت</span>
                      </h4>

                      <div className="relative border-r border-slate-200 dark:border-slate-800 pr-5 mr-3 py-2 space-y-5 text-xs">
                        {[
                          { time: '۱۴۰۳/۰۴/۱۸ - ۱۱:۳۲', user: 'سرپرست سیستم (مهران راد)', text: 'تولید لایسنس کلید پروانه برای Identity Protection به مدت ۱۲ ماه.' },
                          { time: '۱۴۰۳/۰۲/۰۵ - ۰۹:۱۵', user: 'رابط فنی سازمان', text: 'ثبت اولین درخواست درگاه API و تایید امضای دیپ کلاینت.' },
                          { time: '۱۴۰۲/۱۰/۱۲ - ۱۴:۴۵', user: 'سیستم سحاب', text: 'ایجاد هویت مشتری سازمانی با کد CST-101 و انتساب رابط فنی.' }
                        ].map((evt, idx) => (
                          <div key={idx} className="relative">
                            <div className="absolute -right-[25px] top-1 w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700 border-2 border-white dark:border-slate-900" />
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[10px] font-bold text-slate-400">{evt.time}</span>
                                <span className="text-[10px] text-brand-500 font-extrabold">{evt.user}</span>
                              </div>
                              <p className="text-slate-600 dark:text-slate-400 font-bold leading-relaxed">{evt.text}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Profile Modal Footer */}
                <div className="p-5 border-t border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between shrink-0 text-xs font-bold text-slate-400">
                  <span>سیستم مدیریت مشتریان سازمانی سحاب • نسخه ۲.۶.۰</span>
                  <button
                    onClick={() => setShowCustomerProfile(false)}
                    className="px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white font-black cursor-pointer transition-colors"
                  >
                    بستن کارپوشه
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* CONFIRM DEACTIVATE CLIENT DIALOG */}
      <AnimatePresence>
        {showDeactivateConfirm && customerToDeactivate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs" dir="rtl">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl text-right"
              id="deactivate-confirm-modal"
            >
              <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 animate-bounce" />
              </div>

              <h3 className="text-xs font-black text-slate-950 dark:text-white">
                تغییر وضعیت فعال‌سازی کلاینت سازمانی
              </h3>

              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed font-bold">
                آیا از {customerToDeactivate.status === 'فعال' ? 'غیرفعال‌سازی موقت' : 'فعال‌سازی مجدد'} لایسنس‌ها و توکن‌های اتصال سازمان <strong className="text-slate-900 dark:text-white">«{customerToDeactivate.name}»</strong> اطمینان کامل دارید؟ این اقدام بلافاصله دسترسی کلاینت را به کلیه وب‌سرویس‌ها قطع یا متصل خواهد نمود.
              </p>

              <div className="pt-5 border-t border-slate-100 dark:border-slate-800 mt-4 flex items-center justify-end gap-3 font-bold">
                <button
                  onClick={() => {
                    setShowDeactivateConfirm(false);
                    setCustomerToDeactivate(null);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  onClick={confirmDeactivateCustomer}
                  className={`px-5 py-2.5 rounded-xl text-white text-xs font-black shadow-md transition-all cursor-pointer ${
                    customerToDeactivate.status === 'فعال' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/15' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/15'
                  }`}
                >
                  تایید و اعمال وضعیت
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showDeleteCustomerConfirm && customerToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs" dir="rtl">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl text-right"
            >
              <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 animate-bounce" />
              </div>

              <h3 className="text-xs font-black text-slate-950 dark:text-white">
                حذف دائمی مشتری سازمانی
              </h3>

              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed font-bold">
                آیا از حذف کامل سازمان <strong className="text-slate-900 dark:text-white">«{customerToDelete.name}»</strong> اطمینان دارید؟ این عملیات غیر قابل بازگشت بوده و تمامی تیکت‌ها، پیام‌ها، لایسنس‌ها و اطلاعات مرتبط با این مشتری به صورت کامل از پایگاه داده حذف خواهد شد.
              </p>

              <div className="pt-5 border-t border-slate-100 dark:border-slate-800 mt-4 flex items-center justify-end gap-3 font-bold">
                <button
                  onClick={() => {
                    setShowDeleteCustomerConfirm(false);
                    setCustomerToDelete(null);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  onClick={confirmDeleteCustomer}
                  disabled={isDeletingCustomer}
                  className="px-5 py-2.5 rounded-xl text-white text-xs font-black shadow-md transition-all bg-rose-600 hover:bg-rose-700 shadow-rose-600/15 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeletingCustomer ? 'در حال حذف...' : 'تایید و حذف کامل'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
