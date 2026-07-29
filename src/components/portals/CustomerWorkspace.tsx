import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building, 
  Layers, 
  Users2, 
  Inbox, 
  Clock, 
  ClipboardList, 
  Activity, 
  Settings, 
  CheckCircle, 
  AlertTriangle, 
  PlusCircle, 
  Edit, 
  RefreshCw, 
  UserCheck, 
  MapPin, 
  ExternalLink, 
  User, 
  Mail, 
  Phone, 
  Plus, 
  UserPlus, 
  Copy, 
  Shield, 
  ShieldAlert,
  X,
  Trash2,
  CheckSquare,
  Square
} from 'lucide-react';
import type { Customer, Product, Ticket, ProductCustomerConnection } from '../../types';
import { gql } from '../../api/graphql';
import { UPDATE_CUSTOMER, CREATE_CONNECTION, DELETE_CONNECTION, UPDATE_CONNECTION, GET_CUSTOMER_CONNECTIONS, GET_USERS_BY_COMPANY, CREATE_USER, UPDATE_USER, DELETE_USER } from '../../api/queries';
import type { ApiCustomer, ApiConnection, ApiUser } from '../../api/types';
import { mapConnection } from '../../api/transform';

interface CustomerWorkspaceViewProps {
  selectedCustomerWorkspace: Customer | null;
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  tickets: Ticket[];
  setTickets: React.Dispatch<React.SetStateAction<Ticket[]>>;
  products: Product[];
  setActiveTab: (tab: any) => void;
  setTicketSearch: (search: string) => void;
  setShowTicketModal: (show: boolean) => void;
  setNewTicketCustomer: React.Dispatch<React.SetStateAction<string>>;
  setNewTicketProduct: React.Dispatch<React.SetStateAction<string>>;
  showCustomerToast: (msg: string, type?: 'success' | 'error') => void;
  onAddCustomerUser?: (companyName: string) => void;
}

export default function CustomerWorkspaceView({
  selectedCustomerWorkspace,
  customers,
  setCustomers,
  tickets,
  setTickets,
  products,
  setActiveTab,
  setTicketSearch,
  setShowTicketModal,
  setNewTicketCustomer,
  setNewTicketProduct,
  showCustomerToast,
  onAddCustomerUser
}: CustomerWorkspaceViewProps) {
  // Currently active internal tab
  const [customerWorkspaceTab, setCustomerWorkspaceTab] = useState<'overview' | 'products' | 'users' | 'tickets' | 'licenses' | 'activities' | 'settings'>('overview');

  // Load selected customer or fallback to standard enterprise customer
  const c = selectedCustomerWorkspace || customers[0];

  // Internal interactive data lists for this workspace
  const [customerWorkspaceUsers, setCustomerWorkspaceUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // Customer connections (active products from API)
  const [connections, setConnections] = useState<any[]>([]);
  const [connectionsLoading, setConnectionsLoading] = useState(false);
  const [selectedConnectionIds, setSelectedConnectionIds] = useState<string[]>([]);

  const fetchConnections = useCallback(async () => {
    if (!c?.id) return;
    setConnectionsLoading(true);
    try {
      const data = await gql<{ customerConnections: ApiConnection[] }>(GET_CUSTOMER_CONNECTIONS, { customerId: c.id });
      const list = data?.customerConnections;
      setConnections(Array.isArray(list) ? list.map(mapConnection) : []);
    } catch (err) {
      showWorkspaceToast('خطا در دریافت محصولات: ' + ((err as Error).message || 'خطای ناشناخته'), 'error');
    }
    setConnectionsLoading(false);
  }, [c?.id]);

  useEffect(() => { fetchConnections(); }, [fetchConnections]);

  const fetchUsers = useCallback(async () => {
    if (!c?.name) return;
    setUsersLoading(true);
    try {
      const data = await gql<{ usersByCompany: ApiUser[] }>(GET_USERS_BY_COMPANY, { company: c.name });
      const list = data?.usersByCompany;
      setCustomerWorkspaceUsers(Array.isArray(list) ? list.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.customRoleId ? 'کاربر' : 'کاربر',
        lastLogin: 'هرگز',
        status: u.active ? 'فعال' : 'غیرفعال',
      })) : []);
    } catch (err) {
      showWorkspaceToast('خطا در دریافت کاربران: ' + ((err as Error).message || 'خطای ناشناخته'), 'error');
    }
    setUsersLoading(false);
  }, [c?.name]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleToggleSelectAllConnections = () => {
    if (selectedConnectionIds.length === connections.length) {
      setSelectedConnectionIds([]);
    } else {
      setSelectedConnectionIds(connections.map((conn: any) => conn.id));
    }
  };

  const handleToggleSelectConnection = (id: string) => {
    if (selectedConnectionIds.includes(id)) {
      setSelectedConnectionIds(selectedConnectionIds.filter(x => x !== id));
    } else {
      setSelectedConnectionIds([...selectedConnectionIds, id]);
    }
  };

  const handleRemoveConnections = async () => {
    if (selectedConnectionIds.length === 0) return;
    try {
      for (const id of selectedConnectionIds) {
        await gql<{ deleteConnection: boolean }>(DELETE_CONNECTION, { id });
      }
      setSelectedConnectionIds([]);
      showWorkspaceToast(`${selectedConnectionIds.length} محصول با موفقیت از سازمان حذف شد.`);
      fetchConnections();
    } catch (err) {
      showWorkspaceToast('خطا در حذف محصول: ' + ((err as Error).message || 'خطای ناشناخته'), 'error');
    }
  };

  // Modals visibility state
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showEditOrgModal, setShowEditOrgModal] = useState(false);

  // New User Form State
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('کاربر');

  // New Product Form State
  const [newProductId, setNewProductId] = useState('');
  const [newProductLimit, setNewProductLimit] = useState(20);

  // Edit Org Form State
  const [orgCommercialName, setOrgCommercialName] = useState(c.commercialName || c.name);
  const [orgPhone, setOrgPhone] = useState(c.phone || '۰۲۱-۸۸۲۲۳۳۹۹');
  const [orgWebsite, setOrgWebsite] = useState(c.website || 'www.ariasecurity.ir');
  const [orgAddress, setOrgAddress] = useState(c.address || 'تهران، پارک فناوری پردیس، خیابان نوآوری ۱۲، برج فناوری ');

  // Filter tickets matching active customer
  const matchesTickets = tickets.filter(t => t.customerId === c.id);

  // Workspace feedback messages
  const [workspaceFeedback, setWorkspaceFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showWorkspaceToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setWorkspaceFeedback({ message: msg, type });
    setTimeout(() => setWorkspaceFeedback(null), 4000);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) {
      showWorkspaceToast('لطفا تمامی فیلدهای الزامی را تکمیل نمایید.', 'error');
      return;
    }
    try {
      const created = await gql<{ createUser: ApiUser }>(CREATE_USER, {
        input: {
          email: newUserEmail,
          password: '123456',
          name: newUserName,
          company: c.name,
          active: true,
        },
      });
      const u = created.createUser;
      const newUser = {
        id: u.id,
        name: u.name,
        email: u.email,
        role: 'کاربر',
        lastLogin: 'هرگز',
        status: 'فعال',
      };
      setCustomerWorkspaceUsers([...customerWorkspaceUsers, newUser]);
      setCustomers(customers.map(cust => cust.id === c.id ? { ...cust, usersCount: (cust.usersCount || 0) + 1 } : cust));
      setNewUserName('');
      setNewUserEmail('');
      setNewUserRole('کاربر');
      setShowAddUserModal(false);
      showWorkspaceToast(`کاربر جدید «${newUserName}» با موفقیت تعریف شد.`, 'success');
    } catch (err) {
      showWorkspaceToast('خطا در تعریف کاربر: ' + ((err as Error).message || 'خطای ناشناخته'), 'error');
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductId) {
      showWorkspaceToast('لطفا یک محصول را انتخاب کنید.', 'error');
      return;
    }
    const selectedProd = products.find(p => p.id === newProductId);
    if (!selectedProd) return;

    // Check if product is already connected
    if (connections.some((conn: any) => conn.productId === selectedProd.id)) {
      showWorkspaceToast('این محصول در حال حاضر در کارپوشه سازمان فعال است.', 'error');
      return;
    }

    try {
      const now = new Date();
      const endDate = new Date(now);
      endDate.setFullYear(endDate.getFullYear() + 1);

      await gql<{ createConnection: ApiConnection }>(CREATE_CONNECTION, {
        input: {
          productId: selectedProd.id,
          customerId: c.id,
          startDate: now.toISOString(),
          endDate: endDate.toISOString(),
          activationKey: `${selectedProd.logoInitials || 'PLAT'}-${Math.floor(10000 + Math.random() * 90000)}-CMP`,
          subscriptionType: 'Enterprise',
          userCount: newProductLimit,
          licenseStatus: 'ACTIVE',
        },
      });

      // Increment active products count
      setCustomers(customers.map(cust => cust.id === c.id ? { ...cust, activeProductsCount: (cust.activeProductsCount || 0) + 1 } : cust));
      setShowAddProductModal(false);
      setNewProductId('');
      showWorkspaceToast(`محصول «${selectedProd.name}» با موفقیت به سازمان تخصیص یافت.`);
      fetchConnections();
    } catch (err) {
      showWorkspaceToast('خطا در تخصیص محصول: ' + ((err as Error).message || 'خطای ناشناخته'), 'error');
    }
  };

  const handleSaveOrgDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await gql<{ updateCustomer: ApiCustomer }>(UPDATE_CUSTOMER, {
        input: {
          id: c.id,
          commercialName: orgCommercialName,
          phone: orgPhone,
          website: orgWebsite,
          address: orgAddress,
        },
      });
      const apiCust = data.updateCustomer;
      setCustomers(customers.map(cust => cust.id === c.id ? {
        ...cust,
        commercialName: apiCust.commercialName,
        phone: apiCust.phone,
        website: apiCust.website,
        address: apiCust.address,
      } : cust));
      setShowEditOrgModal(false);
      showWorkspaceToast('اطلاعات هویتی و ثبتی سازمان با موفقیت بروزرسانی شد.', 'success');
    } catch (err) {
      showWorkspaceToast('خطا در بروزرسانی اطلاعات: ' + ((err as Error).message || 'خطای ناشناخته'), 'error');
    }
  };

  return (
    <motion.div
      key="customer-details-tab"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="space-y-6 text-right pb-12"
    >
      {/* Toast Feedback */}
      {workspaceFeedback && (
        <div className={`fixed bottom-6 left-6 z-50 flex items-center gap-2.5 p-4 rounded-xl shadow-2xl border transition-all ${
          workspaceFeedback.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/90 text-emerald-800 dark:text-emerald-400 border-emerald-500/30' 
            : 'bg-rose-50 dark:bg-rose-950/90 text-rose-800 dark:text-rose-400 border-rose-500/30'
        }`}>
          {workspaceFeedback.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0 text-emerald-500" /> : <AlertTriangle className="w-5 h-5 shrink-0 text-rose-500" />}
          <span className="text-xs font-black">{workspaceFeedback.message}</span>
        </div>
      )}

      {/* HERO HEADER SECTION */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 p-6 md:p-8 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-brand-500/10 to-transparent rounded-bl-full pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start md:items-center gap-5">
            {/* Company Circle Initials */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center font-black text-white text-xl shadow-lg shadow-brand-500/10 shrink-0">
              {c.name.includes('آریا') ? 'آریا' : c.name.substring(0, 3)}
            </div>
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-xl font-black text-slate-900 dark:text-white leading-none">{c.name}</h2>
                <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/25">
                  {c.tier}
                </span>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                  c.status === 'فعال' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                }`}>
                  {c.status || 'فعال'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-450 dark:text-slate-500 font-bold">
                <span className="font-mono flex items-center gap-1.5"><Building className="w-3.5 h-3.5 text-slate-300" />{c.id}</span>
                <span>•</span>
                <span>صنعت: {c.industry}</span>
                <span>•</span>
                <span>شروع همکاری: {c.partnershipStartDate || '۱۴۰۰/۰۴/۱۵'}</span>
              </div>
            </div>
          </div>

          {/* Top Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-end md:self-center">
            <button 
              onClick={() => {
                setNewTicketCustomer(c.name);
                if (connections.length > 0) {
                  setNewTicketProduct(connections[0].productName || '');
                }
                setShowTicketModal(true);
              }}
              className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-black px-4.5 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-brand-600/10"
            >
              <PlusCircle className="w-4 h-4" />
              <span>ثبت تیکت پشتیبانی</span>
            </button>
            <button 
              onClick={() => {
                setShowEditOrgModal(true);
              }}
              className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold px-4.5 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer"
            >
              <Edit className="w-4 h-4" />
              <span>ویرایش اطلاعات</span>
            </button>
            <button 
              onClick={async () => {
                const newStatus = c.status === 'فعال' ? 'غیرفعال' : 'فعال';
                const apiStatus = newStatus === 'فعال' ? 'ACTIVE' : 'INACTIVE';
                try {
                  await gql<{ updateCustomer: ApiCustomer }>(UPDATE_CUSTOMER, {
                    input: { id: c.id, status: apiStatus },
                  });
                  setCustomers(customers.map(cust => cust.id === c.id ? { ...cust, status: newStatus } : cust));
                  showCustomerToast(`وضعیت سازمان با موفقیت به «${newStatus}» تغییر یافت.`, 'success');
                } catch (err) {
                  showCustomerToast('خطا در تغییر وضعیت: ' + ((err as Error).message || 'خطای ناشناخته'), 'error');
                }
              }}
              className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold px-4.5 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>تغییر وضعیت به {c.status === 'فعال' ? 'غیرفعال' : 'فعال'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 KPI METRICS CARDS ROW GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {/* KPI CARD 1: ACTIVE PRODUCTS */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 p-5 flex items-center justify-between shadow-xs relative overflow-hidden group hover:border-brand-500/30 transition-all duration-200">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 block uppercase tracking-wider">محصولات فعال سازمان</span>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white font-mono leading-none">{c.activeProductsCount || connections.length}</h4>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">لایسنس‌های معتبر ابری</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-500 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* KPI CARD 2: ACTIVE USERS LIMIT */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 p-5 flex items-center justify-between shadow-xs relative overflow-hidden group hover:border-brand-500/30 transition-all duration-200">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 block uppercase tracking-wider">تعداد کل کاربران</span>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white font-mono leading-none">{c.usersCount || customerWorkspaceUsers.length}</h4>
            <span className="text-[10px] font-bold text-emerald-650 dark:text-emerald-400 flex items-center gap-1 font-sans">
              <UserCheck className="w-3.5 h-3.5" />
              <span>تمامی حساب‌ها فعال</span>
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Users2 className="w-5 h-5" />
          </div>
        </div>

        {/* KPI CARD 3: ACTIVE TICKETS */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 p-5 flex items-center justify-between shadow-xs relative overflow-hidden group hover:border-brand-500/30 transition-all duration-200">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 block uppercase tracking-wider">تیکت‌های باز جاری</span>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white font-mono leading-none">{matchesTickets.length}</h4>
            <span className="text-[10px] font-bold text-rose-650 dark:text-rose-450">نیازمند اقدام فوری</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-500/10 text-rose-500 dark:text-rose-400 flex items-center justify-center shrink-0">
            <Inbox className="w-5 h-5" />
          </div>
        </div>

        {/* KPI CARD 4: SUBSCRIPTION EXPIRY */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 p-5 flex items-center justify-between shadow-xs relative overflow-hidden group hover:border-brand-500/30 transition-all duration-200">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 block uppercase tracking-wider">انقضای نزدیک‌ترین سرویس</span>
            <h4 className="text-lg font-black text-slate-900 dark:text-white font-mono leading-none mt-1">۱۴۰۵/۰۴/۱۵</h4>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">پلتفرم مدیریت ابری</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-500 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* PREMIUM WORKSPACE TABBED CONTAINER */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs overflow-hidden">
        {/* HORIZONTAL TAB SWITCHER */}
        <div className="overflow-x-auto border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 px-6">
          <div className="flex gap-1 py-3 whitespace-nowrap">
            {[
              { id: 'overview', label: 'خلاصه وضعیت', icon: ClipboardList },
              { id: 'products', label: 'محصولات فعال', icon: Layers, count: connections.length },
              { id: 'users', label: 'کاربران سیستم', icon: Users2, count: customerWorkspaceUsers.length },
              { id: 'tickets', label: 'تیکت‌های پشتیبانی', icon: Inbox, count: matchesTickets.length },
              { id: 'licenses', label: 'مدیریت لایسنس‌ها', icon: Shield },
              { id: 'activities', label: 'تاریخچه فعالیت‌ها', icon: Activity },
              { id: 'settings', label: 'تنظیمات پیشرفته', icon: Settings }
            ].map((t) => {
              const Icon = t.icon;
              const isActive = customerWorkspaceTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setCustomerWorkspaceTab(t.id as any)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-xs border border-slate-200/60 dark:border-slate-700' 
                      : 'text-slate-550 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <Icon className={`w-4.5 h-4.5 shrink-0 ${isActive ? 'text-brand-500' : 'text-slate-400'}`} />
                  <span>{t.label}</span>
                  {t.count !== undefined && (
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-brand-500/10 text-brand-500 font-extrabold' : 'bg-slate-200/60 dark:bg-slate-800 text-slate-500'
                    }`}>
                      {t.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* TAB CONTENTS CONTAINER */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            
            {/* TAB A: OVERVIEW */}
            {customerWorkspaceTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
              >
                {/* Company Identity Details */}
                <div className="bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl space-y-5">
                  <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <Building className="w-4.5 h-4.5 text-brand-500" />
                    <span>اطلاعات هویتی و ثبتی سازمان</span>
                  </h3>

                  <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-xs text-slate-750 dark:text-slate-300">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block mb-1">نام ثبتی شرکت</span>
                      <span className="font-bold text-slate-900 dark:text-white">{c.name}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block mb-1">نام تجاری سیستم</span>
                      <span className="font-bold text-slate-900 dark:text-white">{c.commercialName || 'توسعه امنیت آریا'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block mb-1">صنعت و حوزه تخصصی</span>
                      <span className="font-bold text-slate-900 dark:text-white">{c.industry}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block mb-1">تلفن تماس مرکزی</span>
                      <span className="font-bold text-slate-900 dark:text-white font-mono">{c.phone || '۰۲۱-۸۸۲۲۳۳۹۹'}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block mb-1">وب‌سایت رسمی سازمان</span>
                      <a 
                        href={`https://${c.website || 'www.ariasecurity.ir'}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="font-bold text-brand-500 hover:underline flex items-center gap-1.5 w-fit"
                      >
                        <span>{c.website || 'www.ariasecurity.ir'}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-brand-500" />
                      </a>
                    </div>
                    <div className="col-span-2 border-t border-slate-100 dark:border-slate-800/80 pt-3">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block mb-1">آدرس دفتر مرکزی سازمان</span>
                      <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                        <MapPin className="w-4.5 h-4.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="font-bold leading-relaxed">{c.address || 'تهران، پارک فناوری پردیس، خیابان نوآوری ۱۲، برج فناوری '}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Representative / Technical Contact Info */}
                <div className="bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl space-y-5">
                  <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <User className="w-4.5 h-4.5 text-brand-500" />
                    <span>مشخصات نماینده تام‌الاختیار و رابط فنی</span>
                  </h3>

                  <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-xs text-slate-750 dark:text-slate-300">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block mb-1">نام و نام خانوادگی رابط</span>
                      <span className="font-bold text-slate-900 dark:text-white">{c.managerName || 'مهندس آرش کریمی'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block mb-1">سمت اداری سازمان</span>
                      <span className="font-bold text-slate-900 dark:text-white">رئیس دپارتمان امنیت اطلاعات</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block mb-1">ایمیل رسمی مکاتبات فنی</span>
                      <span className="font-bold text-slate-900 dark:text-white font-mono block select-all">{c.managerEmail || 'a.karimi@ariasecurity.ir'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block mb-1">شماره تماس مستقیم</span>
                      <span className="font-bold text-slate-900 dark:text-white font-mono">{c.managerPhone || '۰۹۱۲۷۷۷۸۸۹۹'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block mb-1">سطح احراز هویت</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <Shield className="w-4.5 h-4.5 text-emerald-500" />
                        <span>تایید شده (سطح ۱)</span>
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-start gap-2.5">
                    <a 
                      href={`mailto:${c.managerEmail || 'a.karimi@ariasecurity.ir'}`}
                      onClick={(e) => {
                        e.preventDefault();
                        showWorkspaceToast(`نرم‌افزار ارسال ایمیل برای ${c.managerEmail || 'a.karimi@ariasecurity.ir'} باز شد.`, 'success');
                      }}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-black transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span>ارسال ایمیل مستقیم</span>
                    </a>
                    <button 
                      onClick={() => {
                        showWorkspaceToast(`در حال برقراری تماس سیستمی با نماینده سازمان...`, 'success');
                      }}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-black transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span>تماس با شماره مستقیم</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB B: PRODUCTS */}
            {customerWorkspaceTab === 'products' && (
              <motion.div
                key="products"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-4"
              >
                <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-xs font-black text-slate-900 dark:text-white">لیست محصولات فعال سازمان</h3>
                  <button 
                    onClick={() => setShowAddProductModal(true)}
                    className="bg-brand-500/10 hover:bg-brand-500/15 text-brand-600 dark:text-brand-400 text-xs font-black px-4.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4.5 h-4.5" />
                    <span>افزودن محصول جدید به سازمان</span>
                  </button>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-150 dark:border-slate-800/85 overflow-hidden">
                  {/* Floating bulk action bar */}
                  <AnimatePresence>
                    {selectedConnectionIds.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.95 }}
                        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[80] bg-slate-900 text-white px-5 py-4 rounded-2xl shadow-2xl border border-slate-800 flex items-center justify-between gap-6 w-full max-w-lg"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-5.5 h-5.5 rounded-lg bg-brand-500 flex items-center justify-center text-xs font-black">
                            {selectedConnectionIds.length}
                          </span>
                          <span className="text-xs font-black">محصول انتخاب شده است</span>
                        </div>

                        <div className="flex items-center gap-2.5 text-xs font-bold">
                          <button
                            onClick={() => {
                              setSelectedConnectionIds([]);
                              showWorkspaceToast('محصولات انتخاب شده از حالت انتخاب خارج شدند.');
                            }}
                            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white rounded-xl transition-all cursor-pointer"
                          >
                            لغو انتخاب
                          </button>
                          <button
                            onClick={handleRemoveConnections}
                            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>حذف از سازمان</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-[10px] font-extrabold uppercase">
                          <th className="p-4 pr-6 w-10">
                            <input
                              type="checkbox"
                              checked={selectedConnectionIds.length === connections.length && connections.length > 0}
                              onChange={handleToggleSelectAllConnections}
                              className="rounded border-slate-300 dark:border-slate-700 text-brand-600 focus:ring-brand-500 cursor-pointer"
                            />
                          </th>
                          <th className="p-4">عنوان محصول</th>
                          <th className="p-4">نوع اشتراک / لایسنس</th>
                          <th className="p-4">نسخه فعال</th>
                          <th className="p-4 text-center">ظرفیت کاربران دسترسی</th>
                          <th className="p-4">تاریخ پایان اعتبار لایسنس</th>
                          <th className="p-4">وضعیت لایسنس</th>
                          <th className="p-4 pl-6 text-left">عملیات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-xs text-slate-700 dark:text-slate-300">
                        {connections.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="p-8 text-center text-slate-400">
                              {connectionsLoading ? 'در حال بارگذاری...' : 'هیچ محصولی به این سازمان تخصیص داده نشده است.'}
                            </td>
                          </tr>
                        ) : (
                          connections.map((conn: any) => {
                            const isSelected = selectedConnectionIds.includes(conn.id);
                            return (
                              <tr key={conn.id} className={`hover:bg-slate-50/40 dark:hover:bg-slate-800/10 transition-all duration-150 ${isSelected ? 'bg-brand-500/5 dark:bg-brand-500/10' : ''}`}>
                                <td className="p-4 pr-6">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleToggleSelectConnection(conn.id)}
                                    className="rounded border-slate-300 dark:border-slate-700 text-brand-600 focus:ring-brand-500 cursor-pointer"
                                  />
                                </td>
                                <td className="p-4">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${conn.logoColor || 'from-blue-500 to-indigo-600'} flex items-center justify-center font-bold text-white text-[10px] shrink-0 shadow-xs`}>
                                      {conn.logoInitials || conn.productName?.substring(0, 2)}
                                    </div>
                                    <div className="space-y-0.5">
                                      <span className="font-bold text-slate-900 dark:text-white">{conn.productName || conn.customerName}</span>
                                      <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 block">{conn.productId}</span>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-4">
                                  <span className="font-bold text-slate-900 dark:text-white">{conn.subscriptionType}</span>
                                </td>
                                <td className="p-4 font-mono font-bold text-slate-600 dark:text-slate-400">
                                  {conn.version || '—'}
                                </td>
                                <td className="p-4 text-center font-mono font-bold">
                                  {conn.userCount} نفر
                                </td>
                                <td className="p-4 font-mono font-bold">
                                  {conn.endDate || '—'}
                                </td>
                                <td className="p-4">
                                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                    conn.licenseStatus === 'فعال' ? 'bg-emerald-500/10 text-emerald-600' : conn.licenseStatus === 'منقضی شده' ? 'bg-rose-500/10 text-rose-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                                  }`}>
                                    {conn.licenseStatus || '—'}
                                  </span>
                                </td>
                                <td className="p-4 pl-6 text-left">
                                  <button 
                                    onClick={async () => {
                                      try {
                                        const nextStatus = conn.licenseStatus === 'فعال' ? 'INACTIVE' : 'ACTIVE';
                                        await gql<{ updateConnection: ApiConnection }>(UPDATE_CONNECTION, {
                                          input: { id: conn.id, licenseStatus: nextStatus },
                                        });
                                        showWorkspaceToast(`وضعیت لایسنس به‌روزرسانی شد.`);
                                        fetchConnections();
                                      } catch (err) {
                                        showWorkspaceToast('خطا در تغییر وضعیت: ' + ((err as Error).message || 'خطای ناشناخته'), 'error');
                                      }
                                    }}
                                    className="text-[10px] text-brand-600 hover:text-brand-700 dark:text-brand-400 hover:underline font-bold cursor-pointer"
                                  >
                                    {conn.licenseStatus === 'فعال' ? 'تعلیق موقت' : 'فعال‌سازی'}
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB C: USERS */}
            {customerWorkspaceTab === 'users' && (
              <motion.div
                key="users"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-4"
              >
                <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-xs font-black text-slate-900 dark:text-white">لیست کاربران مجاز و فعال سازمان</h3>
                  <button 
                    onClick={() => {
                      if (onAddCustomerUser) {
                        onAddCustomerUser(c.name);
                      } else {
                        setShowAddUserModal(true);
                      }
                    }}
                    className="bg-brand-500/10 hover:bg-brand-500/15 text-brand-600 dark:text-brand-400 text-xs font-black px-4.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <UserPlus className="w-4.5 h-4.5" />
                    <span>تعریف کاربر سازمانی جدید</span>
                  </button>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-150 dark:border-slate-800/85 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-[10px] font-extrabold uppercase">
                          <th className="p-4 pr-6">نام کاربر</th>
                          <th className="p-4">پست الکترونیکی</th>
                          <th className="p-4">نقش دسترسی</th>
                          <th className="p-4">آخرین ورود به پنل</th>
                          <th className="p-4">وضعیت حساب</th>
                          <th className="p-4 pl-6 text-left">عملیات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-xs text-slate-700 dark:text-slate-300">
                        {customerWorkspaceUsers.map((u) => (
                          <tr key={u.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/10 transition-all duration-150">
                            <td className="p-4 pr-6 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold text-[10px] font-sans shadow-xs">
                                {u.name.substring(0, 2)}
                              </div>
                              <span>{u.name}</span>
                            </td>
                            <td className="p-4 font-mono text-slate-500 dark:text-slate-400">
                              {u.email}
                            </td>
                            <td className="p-4">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                u.role === 'مدیر' ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                              }`}>
                                {u.role}
                              </span>
                            </td>
                            <td className="p-4 text-slate-500 dark:text-slate-400 font-bold">
                              {u.lastLogin}
                            </td>
                            <td className="p-4">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                u.status === 'فعال' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                              }`}>
                                {u.status}
                              </span>
                            </td>
                            <td className="p-4 pl-6 text-left space-x-3 space-x-reverse">
                              <button 
                                onClick={async () => {
                                  try {
                                    const updated = await gql<{ updateUser: ApiUser }>(UPDATE_USER, {
                                      input: { id: u.id, active: u.status !== 'فعال' },
                                    });
                                    setCustomerWorkspaceUsers(customerWorkspaceUsers.map(wu => 
                                      wu.id === u.id ? { ...wu, status: updated.updateUser.active ? 'فعال' : 'غیرفعال' } : wu
                                    ));
                                    showWorkspaceToast(`وضعیت حساب کاربری ${u.name} بروزرسانی شد.`, 'success');
                                  } catch (err) {
                                    showWorkspaceToast('خطا در تغییر وضعیت: ' + ((err as Error).message || 'خطای ناشناخته'), 'error');
                                  }
                                }}
                                className="text-[10px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-bold cursor-pointer"
                              >
                                {u.status === 'فعال' ? 'غیرفعال‌سازی' : 'فعال‌سازی'}
                              </button>
                              <button 
                                onClick={async () => {
                                  try {
                                    await gql<{ deleteUser: boolean }>(DELETE_USER, { id: u.id });
                                    setCustomerWorkspaceUsers(customerWorkspaceUsers.filter(wu => wu.id !== u.id));
                                    showWorkspaceToast(`حساب کاربری ${u.name} با موفقیت حذف گردید.`, 'success');
                                  } catch (err) {
                                    showWorkspaceToast('خطا در حذف کاربر: ' + ((err as Error).message || 'خطای ناشناخته'), 'error');
                                  }
                                }}
                                className="text-[10px] text-rose-500 hover:text-rose-650 font-bold cursor-pointer"
                              >
                                حذف دسترسی
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB D: TICKETS */}
            {customerWorkspaceTab === 'tickets' && (
              <motion.div
                key="tickets"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-4"
              >
                <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-xs font-black text-slate-900 dark:text-white">تیکت‌های جاری و سابق سازمان</h3>
                  <button 
                    onClick={() => {
                      setNewTicketCustomer(c.name);
                      if (connections.length > 0) {
                        setNewTicketProduct(connections[0].productName || '');
                      }
                      setShowTicketModal(true);
                    }}
                    className="bg-brand-500/10 hover:bg-brand-500/15 text-brand-600 dark:text-brand-400 text-xs font-black px-4.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4.5 h-4.5" />
                    <span>ثبت فوری تیکت فنی</span>
                  </button>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-150 dark:border-slate-800/85 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-[10px] font-extrabold uppercase">
                          <th className="p-4 pr-6">شناسه / عنوان تیکت فنی</th>
                          <th className="p-4">محصول مرتبط</th>
                          <th className="p-4 text-center">اولویت</th>
                          <th className="p-4">پشتیبان مسئول</th>
                          <th className="p-4">تاریخ بروزرسانی</th>
                          <th className="p-4 text-center">وضعیت تیکت</th>
                          <th className="p-4 pl-6 text-left">عملیات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-xs text-slate-700 dark:text-slate-300">
                        {matchesTickets.length > 0 ? (
                          matchesTickets.map((t) => (
                            <tr key={t.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/10 transition-all duration-150">
                              <td className="p-4 pr-6">
                                <div className="space-y-0.5">
                                  <span className="font-bold text-slate-900 dark:text-white block hover:text-brand-500 transition-colors cursor-pointer" onClick={() => {
                                    setActiveTab('tickets');
                                    setTicketSearch(t.id);
                                  }}>
                                    {t.title}
                                  </span>
                                  <span className="text-[9px] font-mono font-bold text-slate-400">{t.id}</span>
                                </div>
                              </td>
                              <td className="p-4 text-slate-600 dark:text-slate-400 font-bold">
                                {t.product}
                              </td>
                              <td className="p-4 text-center">
                                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                                  t.priority === 'بحرانی' ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400' :
                                  t.priority === 'بالا' ? 'bg-orange-500/15 text-orange-600 dark:text-orange-400' :
                                  t.priority === 'متوسط' ? 'bg-blue-500/15 text-blue-600' :
                                  'bg-slate-100 text-slate-500'
                                }`}>
                                  {t.priority}
                                </span>
                              </td>
                              <td className="p-4 font-bold text-slate-900 dark:text-white">
                                {t.assignedTo}
                              </td>
                              <td className="p-4 text-slate-500 font-bold font-mono">
                                {t.date}
                              </td>
                              <td className="p-4 text-center">
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                                  t.status === 'باز' ? 'bg-rose-500/10 text-rose-500' :
                                  t.status === 'در حال بررسی' ? 'bg-amber-500/10 text-amber-500' :
                                  t.status === 'منتظر پاسخ مشتری' ? 'bg-blue-500/10 text-blue-500' :
                                  'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                                }`}>
                                  {t.status}
                                </span>
                              </td>
                              <td className="p-4 pl-6 text-left">
                                <button 
                                  onClick={() => {
                                    setActiveTab('tickets');
                                    setTicketSearch(t.id);
                                  }}
                                  className="text-[10px] text-brand-600 hover:text-brand-700 dark:text-brand-400 font-bold cursor-pointer"
                                >
                                  ورود به تیکت
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={7} className="p-8 text-center text-slate-400">
                              هیچ تیکت فعالی در سیستم برای این سازمان ثبت نشده است.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB E: LICENSES */}
            {customerWorkspaceTab === 'licenses' && (
              <motion.div
                key="licenses"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-4"
              >
                <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-xs font-black text-slate-900 dark:text-white">کلیدهای دسترسی و لایسنس‌های توزیع‌شده</h3>
                  <button 
                    onClick={() => showWorkspaceToast('سفارش تمدید لایسنس جدید برای واحد بازرگانی صادر شد.', 'success')}
                    className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-black px-4.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>تمدید سراسری لایسنس‌ها</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {connections.map((conn: any) => (
                    <div key={conn.id} className="bg-slate-50/50 dark:bg-slate-950/30 border border-slate-150 dark:border-slate-800 rounded-2xl p-5 space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${conn.logoColor || 'from-blue-500 to-indigo-600'} flex items-center justify-center text-white text-[10px] font-black shrink-0 shadow-xs`}>
                            {conn.logoInitials || 'PR'}
                          </div>
                          <div className="space-y-0.5">
                            <h4 className="text-xs font-black text-slate-900 dark:text-white">{conn.productName || conn.customerName}</h4>
                            <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500">منقضی در {conn.endDate || '—'}</span>
                          </div>
                        </div>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                          conn.licenseStatus === 'فعال' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                        }`}>
                          {conn.licenseStatus}
                        </span>
                      </div>

                      {/* License Key Code block with copy button */}
                      <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl p-3 flex items-center justify-between">
                        <span className="font-mono text-xs text-slate-600 dark:text-slate-300 select-all tracking-wider font-semibold">
                          {conn.activationKey}
                        </span>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(conn.activationKey);
                            showWorkspaceToast(`کلید لایسنس کپی شد.`);
                          }}
                          className="p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-250 transition-all cursor-pointer"
                          title="کپی کردن کلید"
                        >
                          <Copy className="w-4.5 h-4.5" />
                        </button>
                      </div>

                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-3">
                        <span>ظرفیت اختصاصی: {conn.userCount} کاربر همزمان</span>
                        <button 
                          onClick={async () => {
                            try {
                              await gql<{ updateConnection: ApiConnection }>(UPDATE_CONNECTION, {
                                input: { id: conn.id, userCount: conn.userCount + 10 },
                              });
                              showWorkspaceToast(`ارتقای تعداد کاربران به ${conn.userCount + 10} نفر تایید شد.`);
                              fetchConnections();
                            } catch (err) {
                              showWorkspaceToast('خطا در ارتقا: ' + ((err as Error).message || 'خطای ناشناخته'), 'error');
                            }
                          }}
                          className="text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
                        >
                          ارتقای ظرفیت (افزودن ۱۰ کاربر)
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* TAB F: ACTIVITIES */}
            {customerWorkspaceTab === 'activities' && (
              <motion.div
                key="activities"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-4"
              >
                <h3 className="text-xs font-black text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
                  تاریخچه رخدادها و وقایع سازمان در پلتفرم 
                </h3>

                <div className="relative pr-6 border-r-2 border-slate-150 dark:border-slate-800 space-y-6 py-2">
                  {[
                    { title: 'ثبت تیکت بحرانی مانیتورینگ گره‌ها', subtitle: 'توسط مهندس آرش کریمی - شعبه پردیس', time: '۳ دقیقه پیش', bg: 'bg-rose-500' },
                    { title: 'خطای ورود چندعاملی به حساب مدیریتی', subtitle: 'لاگ ورود ناموفق از آی‌پی ۹۴.۱۲.۸۸.۱۹', time: '۱۰ دقیقه پیش', bg: 'bg-amber-500' },
                    { title: 'ورود موفق به میز کار کاربری', subtitle: 'توسط مهندس حسام نوری', time: '۱ ساعت پیش', bg: 'bg-emerald-500' },
                    { title: 'بروزرسانی نسخه کلید دسترسی Cloud Security', subtitle: 'بروزرسانی به نسخه نهایی v2.4.1 توسط واحد توسعه', time: 'دیروز', bg: 'bg-indigo-500' },
                    { title: 'تغییر آدرس پستی سازمان در سیستم', subtitle: 'توسط واحد بازرگانی ', time: '۲ روز پیش', bg: 'bg-slate-400' }
                  ].map((act, index) => (
                    <div key={index} className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      {/* Visual dot on timeline */}
                      <div className={`absolute -right-[31px] top-1.5 w-4 h-4 rounded-full ${act.bg} border-4 border-white dark:border-slate-900 flex items-center justify-center`} />
                      
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-black text-slate-900 dark:text-white">{act.title}</h4>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">{act.subtitle}</span>
                      </div>
                      <span className="text-[10px] font-mono font-black text-slate-400 shrink-0">{act.time}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* TAB G: SETTINGS */}
            {customerWorkspaceTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
                    پیکربندی اختصاصی و محدودیت‌های سازمان
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-400 dark:text-slate-500 mb-2">نوع اولویت‌دهی تیکت‌های سازمان (SLA)</label>
                      <select className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 outline-none cursor-pointer">
                        <option value="critical">طلایی (حداکثر ۱ ساعت مهلت پاسخگویی)</option>
                        <option value="high">نقره‌ای (حداکثر ۲ ساعت مهلت پاسخگویی)</option>
                        <option value="normal">عادی (حداکثر ۸ ساعت مهلت پاسخگویی)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-400 dark:text-slate-500 mb-2">روش ارتباطی پیش‌فرض اعلان‌ها</label>
                      <select className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 outline-none cursor-pointer">
                        <option value="both">پیامک و ایمیل همزمان</option>
                        <option value="email">فقط ایمیل کارپوشه</option>
                        <option value="sms">فقط پیامک نمایندگان</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-400 dark:text-slate-500 mb-2">محدودیت تعداد کل کاربران قابل تعریف</label>
                      <input 
                        type="number" 
                        defaultValue={150} 
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 outline-none font-mono text-left" 
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-400 dark:text-slate-500 mb-2">محدودیت دامنه ایمیل مجاز کاربران</label>
                      <input 
                        type="text" 
                        defaultValue="ariasecurity.ir" 
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 outline-none font-mono text-left" 
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button 
                      onClick={() => showWorkspaceToast('پیکربندی اختصاصی سازمان با موفقیت بروزرسانی شد.', 'success')}
                      className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-black px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm"
                    >
                      ذخیره پیکربندی سازمان
                    </button>
                  </div>
                </div>

                {/* DANGER ZONE */}
                <div className="bg-rose-500/5 dark:bg-rose-950/10 border border-rose-500/20 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 pb-2 border-b border-rose-500/10">
                    <ShieldAlert className="w-5 h-5 shrink-0" />
                    <h4 className="text-xs font-black">ناحیه بحرانی و اقدامات امنیتی سازمان (Danger Zone)</h4>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    اقدامات زیر به صورت مستقیم بر دسترسی کاربران و لایسنس‌های معتبر این سازمان اثرگذار خواهند بود. لطفا قبل از تایید دقت فرمایید.
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button 
                      onClick={async () => {
                        const confirmSuspension = window.confirm('آیا مایل به تعلیق سراسری دسترسی و باطل کردن کلیدهای لایسنس این سازمان هستید؟');
                        if (confirmSuspension) {
                          try {
                            for (const conn of connections) {
                              await gql<{ updateConnection: ApiConnection }>(UPDATE_CONNECTION, {
                                input: { id: conn.id, licenseStatus: 'INACTIVE' },
                              });
                            }
                            showWorkspaceToast('تمامی لایسنس‌ها با موفقیت تعلیق و دسترسی سازمان معلق شد.');
                            fetchConnections();
                          } catch (err) {
                            showWorkspaceToast('خطا در تعلیق لایسنس‌ها: ' + ((err as Error).message || 'خطای ناشناخته'), 'error');
                          }
                        }
                      }}
                      className="bg-rose-650 hover:bg-rose-700 text-white text-[10px] font-black px-4.5 py-2 rounded-xl transition-all cursor-pointer"
                    >
                      تعلیق موقت کلیدهای دسترسی لایسنس
                    </button>
                    <button 
                      onClick={() => {
                        const confirmArchive = window.confirm('آیا مایل به بایگانی کردن پرونده این سازمان هستید؟ پرونده آرشیو شده از مانیتورینگ خارج می‌شود.');
                        if (confirmArchive) {
                          setCustomers(customers.map(cust => cust.id === c.id ? { ...cust, status: 'غیرفعال' } : cust));
                          setActiveTab('customers');
                          showCustomerToast(`پرونده سازمان ${c.name} بایگانی شد.`, 'success');
                        }
                      }}
                      className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 text-[10px] font-black px-4.5 py-2 rounded-xl transition-all cursor-pointer"
                    >
                      بایگانی پرونده سازمان (Archive)
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

      {/* ---------------- INTERACTION MODALS DEFINITION ---------------- */}

      {/* MODAL 1: ADD USER */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-black text-slate-950 dark:text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-brand-500" />
                <span>تعریف کاربر جدید برای سازمان</span>
              </h3>
              <button 
                onClick={() => setShowAddUserModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 text-right">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 mb-1.5">نام و نام خانوادگی کاربر <span className="text-rose-500">*</span></label>
                <input 
                  type="text" 
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="مثال: مهندس مریم علوی"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 mb-1.5">پست الکترونیکی سازمانی <span className="text-rose-500">*</span></label>
                <input 
                  type="email" 
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="username@ariasecurity.ir"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 outline-none text-left font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 mb-1.5">نقش دسترسی در پرتال</label>
                <select 
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 outline-none cursor-pointer"
                >
                  <option value="کاربر">کاربر (User)</option>
                  <option value="مدیر">مدیر دپارتمان (Manager)</option>
                  <option value="مشاهده‌گر">فقط مشاهده‌گر (Observer)</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button 
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4.5 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 text-xs font-black cursor-pointer"
                >
                  انصراف
                </button>
                <button 
                  type="submit"
                  className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-black px-5 py-2.5 rounded-xl transition-all cursor-pointer"
                >
                  تعریف و فعال‌سازی کاربر
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL 2: ALLOCATE PRODUCT */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-black text-slate-950 dark:text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-brand-500" />
                <span>تخصیص محصول جدید به کارپوشه سازمان</span>
              </h3>
              <button 
                onClick={() => setShowAddProductModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-4 text-right">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 mb-1.5">انتخاب محصول پلتفرم  <span className="text-rose-500">*</span></label>
                <select 
                  value={newProductId}
                  onChange={(e) => setNewProductId(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 outline-none cursor-pointer"
                  required
                >
                  <option value="">-- انتخاب محصول جدید --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.version})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 mb-1.5">محدودیت تعداد مجاز کاربران لایسنس</label>
                <input 
                  type="number" 
                  value={newProductLimit}
                  onChange={(e) => setNewProductLimit(parseInt(e.target.value) || 10)}
                  placeholder="تعداد کاربر"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 outline-none text-left font-mono"
                  required
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button 
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="px-4.5 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 text-xs font-black cursor-pointer"
                >
                  انصراف
                </button>
                <button 
                  type="submit"
                  className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-black px-5 py-2.5 rounded-xl transition-all cursor-pointer"
                >
                  تخصیص محصول و صدور لایسنس
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL 3: EDIT ORGANIZATION */}
      {showEditOrgModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-black text-slate-950 dark:text-white flex items-center gap-2">
                <Edit className="w-5 h-5 text-brand-500" />
                <span>ویرایش اطلاعات عمومی و هویتی سازمان</span>
              </h3>
              <button 
                onClick={() => setShowEditOrgModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOrgDetails} className="space-y-4 text-right">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 mb-1.5">نام تجاری سازمان</label>
                <input 
                  type="text" 
                  value={orgCommercialName}
                  onChange={(e) => setOrgCommercialName(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 mb-1.5">شماره تلفن ثابت دفتر مرکزی</label>
                <input 
                  type="text" 
                  value={orgPhone}
                  onChange={(e) => setOrgPhone(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 outline-none text-left font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 mb-1.5">نشانی وب‌سایت رسمی</label>
                <input 
                  type="text" 
                  value={orgWebsite}
                  onChange={(e) => setOrgWebsite(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 outline-none text-left font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 mb-1.5">آدرس پستی شعبه مرکزی</label>
                <textarea 
                  rows={3}
                  value={orgAddress}
                  onChange={(e) => setOrgAddress(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 outline-none resize-none leading-relaxed"
                  required
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button 
                  type="button"
                  onClick={() => setShowEditOrgModal(false)}
                  className="px-4.5 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 text-xs font-black cursor-pointer"
                >
                  انصراف
                </button>
                <button 
                  type="submit"
                  className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-black px-5 py-2.5 rounded-xl transition-all cursor-pointer"
                >
                  ذخیره اطلاعات جدید
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

    </motion.div>
  );
}
