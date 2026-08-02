import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Layers,
  Ticket as TicketIcon,
  BookOpen,
  Bell,
  User,
  Sun,
  Moon,
  LogOut,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Shield,
  Download,
  Building,
  Headphones,
  Send,
  ChevronLeft,
  X,
  Menu,
  Key,
  Calendar,
  ExternalLink,
  Inbox,
  RefreshCw,
  Edit,
  Trash2,
  MessageSquare,
  ChevronDown
} from 'lucide-react';
import type { Ticket, Product, Customer, ProductCustomerConnection } from '../../types';
import { PortalRole } from '../../types';
import type { CustomerTicketItem, ActiveProductItem } from '../../api/transform-customer';
import { mapTicketToCustomerItem } from '../../api/transform-customer';
import { gql } from '../../api/graphql';
import { CREATE_TICKET, CREATE_TICKET_MESSAGE, GET_CUSTOMER_CONNECTIONS, UPDATE_TICKET, DELETE_TICKET, UPDATE_TICKET_STATUS, GET_TICKET } from '../../api/queries';
import { formatDateTime } from '../../lib/utils';

interface CustomerPortalViewProps {
  userEmail: string;
  currentCustomerId?: string;
  ticketsList?: Ticket[];
  productsList?: Product[];
  customersList?: Customer[];
  onLogout: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onSwitchPortalRole?: (role: PortalRole) => void;
}

export default function CustomerPortalView({
  userEmail,
  currentCustomerId = '',
  ticketsList = [],
  productsList = [],
  customersList = [],
  onLogout,
  isDark,
  onToggleTheme,
  onSwitchPortalRole
}: CustomerPortalViewProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'create-ticket' | 'my-tickets' | 'docs' | 'notifications' | 'profile'>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  // New Ticket Form State
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketProduct, setTicketProduct] = useState('Cloud Security Platform');
  const [ticketPriority, setTicketPriority] = useState('متوسط');
  const [ticketMessage, setTicketMessage] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [recentTicketsLimit, setRecentTicketsLimit] = useState(5);

  // My-tickets filters
  const [ticketSearch, setTicketSearch] = useState('');
  const [ticketStatusFilter, setTicketStatusFilter] = useState('همه');
  const [ticketPriorityFilter, setTicketPriorityFilter] = useState('همه');
  const [ticketSortBy, setTicketSortBy] = useState<'newest' | 'oldest' | 'priority'>('newest');
  const [ticketPage, setTicketPage] = useState(1);
  const [ticketsPerPage, setTicketsPerPage] = useState(10);

  // Ticket action modals (edit / respond / delete-confirm)
  const [ticketAction, setTicketAction] = useState<'edit' | 'respond' | 'delete' | 'close' | null>(null);
  const [activeActionTicket, setActiveActionTicket] = useState<CustomerTicketItem | null>(null);
  const [editSubject, setEditSubject] = useState('');
  const [editPriority, setEditPriority] = useState('متوسط');
  const [editProduct, setEditProduct] = useState('');
  const [respondText, setRespondText] = useState('');
  const [actionBusy, setActionBusy] = useState(false);
  const [ticketThread, setTicketThread] = useState<{ id: string; sender: 'customer' | 'agent' | 'internal'; senderName: string; text: string; time: string }[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const priorityToApiLocal: Record<string, string> = { 'بحرانی': 'CRITICAL', 'بالا': 'HIGH', 'متوسط': 'MEDIUM', 'پایین': 'LOW' };

  // Customer tickets and products — synced from real props
  const [customerTickets, setCustomerTickets] = useState<CustomerTicketItem[]>([]);
  const [customerConnections, setCustomerConnections] = useState<ProductCustomerConnection[]>([]);
  const [connectionsLoading, setConnectionsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const myCustomerId =
    (customersList.find(c => c.id === currentCustomerId) || customersList.find(c => c.managerEmail === userEmail))?.id || '';

  // Fetch the customer's real product-license connections
  useEffect(() => {
    if (!myCustomerId) return;
    setConnectionsLoading(true);
    gql<{ customerConnections: any[] }>(GET_CUSTOMER_CONNECTIONS, { customerId: myCustomerId })
      .then((data) => {
        const conns = (data?.customerConnections || []).map((c: any) => ({
          id: c.id,
          productId: c.productId,
          customerId: c.customerId,
          customerName: c.customer?.commercialName || '',
          managerName: c.customer?.user?.name || '',
          startDate: c.startDate,
          endDate: c.endDate,
          licenseStatus: (c.licenseStatus === 'ACTIVE' ? 'فعال' : c.licenseStatus === 'EXPIRED' ? 'منقضی شده' : 'در انتظار تایید') as 'فعال' | 'منقضی شده' | 'در انتظار تایید',
          userCount: c.userCount,
          activationKey: c.activationKey,
          notes: c.notes,
          subscriptionType: c.subscriptionType,
          productName: c.product?.name || c.productId,
          version: c.product?.version,
          logoColor: c.product?.logoColor,
          logoInitials: c.product?.logoInitials || c.product?.name?.substring(0, 2).toUpperCase(),
        }));
        setCustomerConnections(conns);
      })
      .catch(() => { /* keep existing state */ })
      .finally(() => setConnectionsLoading(false));
  }, [myCustomerId, refreshKey]);

  const activeProducts: ActiveProductItem[] = customerConnections.map(c => ({
    id: c.productId,
    name: c.productName || c.productId,
    version: c.version || '',
    licenseKey: c.activationKey,
    expiresAt: c.endDate ? formatDateTime(c.endDate) : '—',
    status: c.licenseStatus,
    userQuota: `${c.userCount} کاربر`,
  }));

  // Dashboard derived metrics from real data
  const totalTickets = customerTickets.length;
  const openTickets = customerTickets.filter(t => t.status === 'باز' || t.status === 'در حال بررسی' || t.status === 'منتظر پاسخ مشتری').length;
  const awaitingCustomer = customerTickets.filter(t => t.status === 'منتظر پاسخ مشتری').length;
  const resolvedTickets = customerTickets.filter(t => t.status === 'حل شده' || t.status === 'بسته شده').length;
  const activeProductsCount = activeProducts.filter(p => p.status === 'فعال').length;
  const licenseExpiring = activeProducts.filter(p => p.status !== 'فعال').length;
  const recentTickets = [...customerTickets].sort((a, b) => b.ticketNumber - a.ticketNumber).slice(0, 4);

  // Filtered + sorted + paginated tickets for the my-tickets inbox
  const filteredMyTickets = customerTickets.filter(t => {
    const q = ticketSearch.toLowerCase();
    const matchesSearch =
      !q ||
      t.subject.toLowerCase().includes(q) ||
      t.id.toLowerCase().includes(q) ||
      (t.ticketNumber ? `#${t.ticketNumber}`.toLowerCase().includes(q) : false) ||
      t.product.toLowerCase().includes(q);
    const matchesStatus = ticketStatusFilter === 'همه' || t.status === ticketStatusFilter;
    const matchesPriority = ticketPriorityFilter === 'همه' || t.priority === ticketPriorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  }).sort((a, b) => {
    if (ticketSortBy === 'newest') return b.ticketNumber - a.ticketNumber;
    if (ticketSortBy === 'oldest') return a.ticketNumber - b.ticketNumber;
    const pOrder: Record<string, number> = { 'بحرانی': 4, 'بالا': 3, 'متوسط': 2, 'پایین': 1 };
    return (pOrder[b.priority] || 0) - (pOrder[a.priority] || 0);
  });

  const myTicketsTotalPages = Math.max(1, Math.ceil(filteredMyTickets.length / ticketsPerPage));
  const paginatedMyTickets = filteredMyTickets.slice((ticketPage - 1) * ticketsPerPage, ticketPage * ticketsPerPage);
  const myTicketsStart = filteredMyTickets.length === 0 ? 0 : (ticketPage - 1) * ticketsPerPage + 1;
  const myTicketsEnd = Math.min(ticketPage * ticketsPerPage, filteredMyTickets.length);

  const myCustomerInfo =
    customersList.find(c => c.id === currentCustomerId) ||
    customersList.find(c => c.managerEmail === userEmail) || null;
  const customerName = myCustomerInfo?.name || 'سازمان شما';
  const customerTier = myCustomerInfo?.tier || 'برنزی';
  const tierLabel: Record<string, string> = { 'طلایی': 'پشتیبانی طلایی VIP (24/7 SLA)', 'نقره‌ای': 'پشتیبانی نقره‌ای', 'برنزی': 'پشتیبانی پایه' };

  useEffect(() => {
    if (ticketsList.length > 0) {
      const myCustomer =
        customersList.find(c => c.id === currentCustomerId) ||
        customersList.find(c => c.managerEmail === userEmail);
      const filtered = myCustomer
        ? ticketsList.filter(t => t.customerId === myCustomer.id)
        : [];
      setCustomerTickets(filtered.map(mapTicketToCustomerItem));
    }
  }, [ticketsList, customersList, currentCustomerId, userEmail]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const priorityToApi: Record<string, string> = { 'بحرانی': 'CRITICAL', 'بالا': 'HIGH', 'متوسط': 'MEDIUM', 'پایین': 'LOW' };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketMessage.trim()) return;

    const matchedCustomer =
      customersList.find(c => c.id === currentCustomerId) ||
      customersList.find(c => c.managerEmail === userEmail);
    const customerId = matchedCustomer?.id;

    // Resolve the selected product to its real id (fall back to name match)
    const selectedProduct = activeProducts.find(p => p.name === ticketProduct);
    const productId = selectedProduct?.id || productsList.find(p => p.name === ticketProduct)?.id || undefined;

    let createdTicketId: string | null = null;
    if (customerId) {
      try {
        const data = await gql<{ createTicket: { id: string } }>(CREATE_TICKET, {
          input: {
            title: ticketSubject,
            priority: priorityToApi[ticketPriority] || 'MEDIUM',
            customerId,
            productId,
          },
        });
        createdTicketId = data?.createTicket?.id || null;

        // Persist the customer's message as the first ticket message so it shows in other portals
        if (createdTicketId) {
          try {
            await gql(CREATE_TICKET_MESSAGE, {
              input: {
                ticketId: createdTicketId,
                text: ticketMessage,
                senderName: userEmail,
                isInternal: false,
                authorType: 'customer',
              },
            });
          } catch { /* message creation is best-effort */ }
        }
      } catch { /* fall through — local state still updated */ }
    }

    const newTkt = {
      id: createdTicketId || `TKT-${Math.floor(1000 + Math.random() * 9000)}`,
      ticketNumber: Math.floor(100 + Math.random() * 900),
      subject: ticketSubject,
      product: ticketProduct,
      status: 'جدید',
      priority: ticketPriority,
      date: new Date().toLocaleDateString('fa-IR'),
      lastUpdate: 'هم‌اکنون',
      messagesCount: 1
    };

    setCustomerTickets([newTkt, ...customerTickets]);
    setTicketSubject('');
    setTicketMessage('');
    showToast('تیکت پشتیبانی شما با موفقیت ثبت شد و به کارشناسان ارشد ارجاع گردید.');
    setActiveTab('my-tickets');
  };

  // Open an action modal for a ticket
  const openTicketAction = (action: 'edit' | 'respond' | 'delete' | 'close', tkt: CustomerTicketItem) => {
    setActiveActionTicket(tkt);
    if (action === 'edit') {
      setEditSubject(tkt.subject);
      setEditPriority(tkt.priority);
      setEditProduct(tkt.product);
    } else if (action === 'respond') {
      setRespondText('');
      fetchTicketThread(tkt.id);
    }
    setTicketAction(action);
  };

  // Fetch the full message thread for a ticket (used in the respond chat box)
  const fetchTicketThread = async (ticketId: string) => {
    setThreadLoading(true);
    try {
      const data = await gql<{ ticket: { messages: { id: string; text: string; senderName: string; isInternal: boolean; createdAt: string; authorType?: string }[] } }>(GET_TICKET, { id: ticketId });
      const msgs = (data?.ticket?.messages || [])
        .filter(m => !m.isInternal) // internal support notes are never shown to customers
        .map(m => ({
          id: m.id,
          sender: (m.authorType === 'customer' ? 'customer' : 'agent') as 'customer' | 'agent' | 'internal',
          senderName: m.senderName,
          text: m.text,
          time: m.createdAt ? formatDateTime(m.createdAt) : '',
        }));
      setTicketThread(msgs);
    } catch {
      setTicketThread([]);
    } finally {
      setThreadLoading(false);
    }
  };

  // Save edited ticket (title / priority / product)
  const handleSaveEdit = async () => {
    if (!activeActionTicket) return;
    setActionBusy(true);
    try {
      const resolvedProduct = activeProducts.find(p => p.name === editProduct) || productsList.find(p => p.name === editProduct);
      await gql(UPDATE_TICKET, {
        input: {
          id: activeActionTicket.id,
          title: editSubject,
          priority: priorityToApiLocal[editPriority] || 'MEDIUM',
          productId: resolvedProduct?.id,
        },
      });
      setCustomerTickets(prev => prev.map(t => t.id === activeActionTicket.id
        ? { ...t, subject: editSubject, priority: editPriority, product: editProduct }
        : t));
      showToast('تیکت با موفقیت ویرایش شد.');
      setTicketAction(null);
      setActiveActionTicket(null);
    } catch {
      showToast('خطا در ویرایش تیکت.');
    } finally {
      setActionBusy(false);
    }
  };

  // Send a response message to the support team
  const handleSendResponse = async () => {
    if (!activeActionTicket || !respondText.trim()) return;
    setActionBusy(true);
    try {
      await gql(CREATE_TICKET_MESSAGE, {
        input: {
          ticketId: activeActionTicket.id,
          text: respondText,
          senderName: userEmail,
          isInternal: false,
          authorType: 'customer',
        },
      });
      // Append the message to the visible thread
      setTicketThread(prev => [...prev, {
        id: `msg-${Date.now()}`,
        sender: 'customer',
        senderName: userEmail,
        text: respondText,
        time: 'هم‌اکنون',
      }]);
      setRespondText('');
      setCustomerTickets(prev => prev.map(t => t.id === activeActionTicket.id
        ? { ...t, messagesCount: t.messagesCount + 1, lastUpdate: 'هم‌اکنون' }
        : t));
      showToast('پاسخ شما با موفقیت به تیم پشتیبانی ارسال شد.');
      setTicketAction(null);
      setActiveActionTicket(null);
    } catch {
      showToast('خطا در ارسال پاسخ.');
    } finally {
      setActionBusy(false);
    }
  };

  // Mark a ticket as resolved / close it
  const handleResolveTicket = async () => {
    if (!activeActionTicket) return;
    setActionBusy(true);
    try {
      const apiStatus = activeActionTicket.status === 'بسته شده' ? 'CLOSED' : 'RESOLVED';
      const persianStatus = activeActionTicket.status === 'بسته شده' ? 'بسته شده' : 'حل شده';
      await gql(UPDATE_TICKET_STATUS, { input: { id: activeActionTicket.id, status: apiStatus } });
      setCustomerTickets(prev => prev.map(t => t.id === activeActionTicket.id
        ? { ...t, status: persianStatus, lastUpdate: 'هم‌اکنون' }
        : t));
      showToast(persianStatus === 'حل شده' ? 'تیکت به‌عنوان حل‌شده علامت‌گذاری شد.' : 'تیکت بسته شد.');
      setTicketAction(null);
      setActiveActionTicket(null);
    } catch {
      showToast('خطا در تغییر وضعیت تیکت.');
    } finally {
      setActionBusy(false);
    }
  };

  // Delete a ticket (with confirmation)
  const handleDeleteTicket = async () => {
    if (!activeActionTicket) return;
    setActionBusy(true);
    try {
      await gql(DELETE_TICKET, { id: activeActionTicket.id });
      setCustomerTickets(prev => prev.filter(t => t.id !== activeActionTicket.id));
      showToast('تیکت با موفقیت حذف شد.');
      setTicketAction(null);
      setActiveActionTicket(null);
    } catch {
      showToast('خطا در حذف تیکت.');
    } finally {
      setActionBusy(false);
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'} font-sans flex text-right transition-colors duration-200`} dir="rtl">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CUSTOMER SIDEBAR */}
      <aside className={`fixed lg:sticky lg:top-0 inset-y-0 right-0 z-40 bg-white dark:bg-slate-900 border-l border-slate-200/80 dark:border-slate-800/80 flex flex-col justify-between transition-all duration-300 ${
        sidebarCollapsed ? 'w-20' : 'w-64'
      } ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}>
        
        {/* Sidebar Header */}
        <div>
          <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-white shadow-md shadow-brand-500/20 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              {!sidebarCollapsed && (
                <div className="truncate">
                  <h1 className="text-xs font-black text-slate-900 dark:text-white truncate">سامانه ابری مدیریت مشتریان</h1>
                  <span className="text-[10px] text-brand-600 dark:text-brand-400 font-extrabold bg-brand-500/10 px-1.5 py-0.5 rounded border border-brand-500/20 block mt-0.5 w-fit">
                    پرتال مشتریان سازمانی
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className={`w-4 h-4 transition-transform duration-200 ${sidebarCollapsed ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Customer Navigation Menu */}
          <nav className="p-3 space-y-1">
            <button
              onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-2 py-3' : 'gap-3 px-4 py-3'} rounded-xl text-xs font-bold transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Layers className="w-4.5 h-4.5 shrink-0" />
              {!sidebarCollapsed && <span>داشبورد</span>}
            </button>

            <button
              onClick={() => { setActiveTab('products'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-2 py-3' : 'gap-3 px-4 py-3'} rounded-xl text-xs font-bold transition-all ${
                activeTab === 'products'
                  ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Layers className="w-4.5 h-4.5 shrink-0" />
              {!sidebarCollapsed && <span>محصولات و لایسنس‌ها</span>}
            </button>

            <button
              onClick={() => { setActiveTab('my-tickets'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-2 py-3' : 'gap-3 px-4 py-3'} rounded-xl text-xs font-bold transition-all ${
                activeTab === 'my-tickets'
                  ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <TicketIcon className="w-4.5 h-4.5 shrink-0" />
              {!sidebarCollapsed && <span>پیگیری تیکت‌ها</span>}
            </button>

            <button
              onClick={() => { setActiveTab('create-ticket'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-2 py-3' : 'gap-3 px-4 py-3'} rounded-xl text-xs font-bold transition-all ${
                activeTab === 'create-ticket'
                  ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Plus className="w-4.5 h-4.5 shrink-0 text-amber-400" />
              {!sidebarCollapsed && <span>ثبت تیکت جدید</span>}
            </button>

            <button
              onClick={() => { setActiveTab('docs'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-2 py-3' : 'gap-3 px-4 py-3'} rounded-xl text-xs font-bold transition-all ${
                activeTab === 'docs'
                  ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <BookOpen className="w-4.5 h-4.5 shrink-0" />
              {!sidebarCollapsed && <span>مستندات و راهنما</span>}
            </button>

            <button
              onClick={() => { setActiveTab('profile'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-2 py-3' : 'gap-3 px-4 py-3'} rounded-xl text-xs font-bold transition-all ${
                activeTab === 'profile'
                  ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Building className="w-4.5 h-4.5 shrink-0" />
              {!sidebarCollapsed && <span>اطلاعات سازمان</span>}
            </button>
          </nav>
        </div>

        {/* Sidebar Footer: Portal Switcher & Logout */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
          {/* Quick Portal Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:border-brand-500 transition-all cursor-pointer`}
            >
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-brand-500 shrink-0" />
                {!sidebarCollapsed && <span>پرتال مشتریان</span>}
              </div>
              {!sidebarCollapsed && <span className="text-[9px] bg-brand-500/10 text-brand-500 px-1.5 py-0.5 rounded">تغییر پرتال</span>}
            </button>

            {showRoleMenu && (
              <div className="absolute bottom-12 right-0 left-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1.5 space-y-1 z-50 text-right">
                <div className="text-[10px] text-slate-400 px-2 py-1 font-bold">تغییر پرتال فعال:</div>
                <button
                  onClick={() => { onSwitchPortalRole?.('admin'); setShowRoleMenu(false); }}
                  className="w-full text-right p-2 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                >
                  <Building className="w-3.5 h-3.5 text-blue-500" />
                  <span>پرتال مدیریت سیستم</span>
                </button>
                <button
                  onClick={() => { onSwitchPortalRole?.('agent'); setShowRoleMenu(false); }}
                  className="w-full text-right p-2 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                >
                  <Headphones className="w-3.5 h-3.5 text-emerald-500" />
                  <span>پرتال کارشناسان پشتیبانی</span>
                </button>
              </div>
            )}
          </div>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-2 px-3'} py-2.5 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!sidebarCollapsed && <span>خروج از حساب</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800/80 px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white">
                {activeTab === 'dashboard' && 'داشبورد مشتری'}
                {activeTab === 'products' && 'محصولات و لایسنس‌های فعال'}
                {activeTab === 'my-tickets' && 'پیگیری تیکت‌های پشتیبانی'}
                {activeTab === 'create-ticket' && 'ثبت درخواست جدید پشتیبانی'}
                {activeTab === 'docs' && 'مستندات و پایگاه دانش سازمانی'}
                {activeTab === 'profile' && 'شناسنامه و مشخصات سازمان'}
              </h2>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">{customerName} ({tierLabel[customerTier] || 'مشتری سازمانی'})</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Dark / Light Toggle */}
            <button
              onClick={onToggleTheme}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-500 dark:text-slate-400 hover:text-brand-500 transition-colors cursor-pointer"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-brand-600" />}
            </button>

            {/* Customer User Profile Badge */}
            <div className="flex items-center gap-2.5 pr-3 border-r border-slate-200 dark:border-slate-800">
              <div className="w-8 h-8 rounded-full bg-brand-500 text-white font-black text-xs flex items-center justify-center shadow-md shadow-brand-500/20">
                پ‌س
              </div>
              <div className="hidden sm:block text-right">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">{userEmail}</span>
                <span className="text-[9px] text-emerald-500 font-bold block">مستندسازی و نماینده ارشد</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Tab Body */}
        <main className="p-6 flex-1 space-y-6">
          {activeTab === 'dashboard' && (
            <div className="space-y-6 max-w-7xl mx-auto w-full">
              {/* Welcome banner */}
              <div className="relative overflow-hidden p-6 rounded-2xl bg-gradient-to-bl from-brand-600 to-brand-800 text-white shadow-lg shadow-brand-500/20">
                <div className="absolute top-0 left-0 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
                <div className="relative z-10 space-y-2">
                  <h2 className="text-lg font-black">سلام، خوش آمدید 👋</h2>
                  <p className="text-xs font-medium text-brand-100 leading-relaxed">
                    {customerName} — {tierLabel[customerTier] || 'مشتری سازمانی'}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-[10px] bg-white/10 px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      پشتیبانی ۲۴/۷
                    </span>
                    <span className="text-[10px] bg-white/10 px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
                      <Headphones className="w-3 h-3" />
                      تیم پاسخگویی فنی
                    </span>
                  </div>
                </div>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={() => setActiveTab('my-tickets')}
                  className="group bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 hover:border-brand-500/40 shadow-xs transition-all text-right cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">تیکت‌های باز</span>
                      <h4 className="text-2xl font-black text-slate-900 dark:text-white">{openTickets.toLocaleString('fa-IR')}</h4>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                      <TicketIcon className="w-5 h-5" />
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium mt-2 block">در مجموع {totalTickets.toLocaleString('fa-IR')} تیکت</span>
                </button>

                <button
                  onClick={() => setActiveTab('my-tickets')}
                  className="group bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 hover:border-amber-500/40 shadow-xs transition-all text-right cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">منتظر پاسخ</span>
                      <h4 className="text-2xl font-black text-amber-500">{awaitingCustomer.toLocaleString('fa-IR')}</h4>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                      <Clock className="w-5 h-5" />
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium mt-2 block">نیاز به پیگیری</span>
                </button>

                <button
                  onClick={() => setActiveTab('my-tickets')}
                  className="group bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 hover:border-emerald-500/40 shadow-xs transition-all text-right cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">حل شده</span>
                      <h4 className="text-2xl font-black text-emerald-500">{resolvedTickets.toLocaleString('fa-IR')}</h4>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium mt-2 block">درخواست‌های تکمیل‌شده</span>
                </button>

                <button
                  onClick={() => setActiveTab('products')}
                  className="group bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 hover:border-indigo-500/40 shadow-xs transition-all text-right cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">محصولات فعال</span>
                      <h4 className="text-2xl font-black text-indigo-500">{activeProductsCount.toLocaleString('fa-IR')}</h4>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                      <Layers className="w-5 h-5" />
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium mt-2 block">
                    {licenseExpiring > 0 ? `${licenseExpiring.toLocaleString('fa-IR')} مورد در معرض انقضا` : 'همه لایسنس‌ها فعال'}
                  </span>
                </button>
              </div>

              {/* Support status + recent tickets */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Recent tickets */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs overflow-hidden flex flex-col">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Inbox className="w-5 h-5 text-brand-500" />
                      <h3 className="text-sm font-bold text-slate-950 dark:text-white">آخرین تیکت‌های پشتیبانی</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={recentTicketsLimit}
                        onChange={(e) => setRecentTicketsLimit(Number(e.target.value))}
                        className="text-[10px] font-bold px-2 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950/40 outline-none focus:border-brand-500 text-slate-600 dark:text-slate-300 cursor-pointer"
                        style={{ colorScheme: 'dark' }}
                        title="تعداد تیکت‌های نمایش داده شده"
                      >
                        {[3, 5, 10].map(n => (
                          <option className="dark:bg-slate-800" key={n} value={n}>آخرین {n} تیکت</option>
                        ))}
                      </select>
                      <button
                        onClick={() => setActiveTab('my-tickets')}
                        className="text-xs text-brand-500 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>مشاهده همه</span>
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {recentTickets.length === 0 ? (
                    <div className="p-10 text-center flex-1">
                      <Inbox className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400">هنوز تیکتی ثبت نشده است</p>
                      <button
                        onClick={() => setActiveTab('create-ticket')}
                        className="mt-3 px-4 py-2 bg-brand-500 text-white text-xs font-bold rounded-xl cursor-pointer"
                      >
                        ثبت اولین تیکت
                      </button>
                    </div>
                  ) : (
                    <div className="overflow-auto max-h-[400px]">
                      <table className="w-full text-right border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-slate-800/60 text-slate-400 dark:text-slate-500 text-[10px] font-bold sticky top-0 bg-white dark:bg-slate-900">
                            <th className="p-4 pr-5">موضوع تیکت</th>
                            <th className="p-4">محصول</th>
                            <th className="p-4">اولویت</th>
                            <th className="p-4">وضعیت</th>
                            <th className="p-4 pl-5">زمان</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/30">
                          {recentTickets.slice(0, recentTicketsLimit).map(tkt => (
                            <tr
                              key={tkt.id}
                              className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 text-xs text-slate-700 dark:text-slate-300 transition-colors"
                            >
                              <td className="p-4 pr-5">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="font-mono font-bold text-slate-400 dark:text-slate-500 text-[10px] shrink-0">{tkt.ticketNumber ? `#${tkt.ticketNumber}` : tkt.id}</span>
                                  <span className="font-semibold text-slate-900 dark:text-white max-w-[200px] truncate">{tkt.subject}</span>
                                </div>
                              </td>
                              <td className="p-4 text-slate-500 dark:text-slate-400 max-w-[120px] truncate">{tkt.product}</td>
                              <td className="p-4">
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold ${
                                  tkt.priority === 'بحرانی' ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400' :
                                  tkt.priority === 'بالا' ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' :
                                  tkt.priority === 'متوسط' ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400' :
                                  'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${
                                    tkt.priority === 'بحرانی' ? 'bg-rose-500' :
                                    tkt.priority === 'بالا' ? 'bg-amber-500' :
                                    tkt.priority === 'متوسط' ? 'bg-brand-500' :
                                    'bg-slate-400'
                                  }`} />
                                  {tkt.priority}
                                </span>
                              </td>
                              <td className="p-4">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                                  tkt.status === 'حل شده' || tkt.status === 'بسته شده' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' :
                                  tkt.status === 'باز' || tkt.status === 'جدید' ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' :
                                  tkt.status === 'در حال بررسی' ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' :
                                  tkt.status === 'منتظر پاسخ مشتری' ? 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400' :
                                  'bg-slate-100 text-slate-500 dark:bg-slate-800/80 dark:text-slate-400'
                                }`}>
                                  {tkt.status}
                                </span>
                              </td>
                              <td className="p-4 pl-5 text-slate-400 dark:text-slate-500 font-bold">{formatDateTime(tkt.date)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Support & system status sidebar */}
                <div className="space-y-5">
                  {/* Support status */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 p-5 shadow-xs space-y-4">
                    <h3 className="text-xs font-black text-slate-900 dark:text-white pb-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                      <Headphones className="w-4 h-4 text-brand-500" />
                      <span>وضعیت پشتیبانی</span>
                    </h3>
                    <div className="space-y-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-bold">سطح پشتیبانی:</span>
                        <span className={`font-black ${customerTier === 'طلایی' ? 'text-amber-500' : customerTier === 'نقره‌ای' ? 'text-slate-500' : 'text-brand-500'}`}>
                          {tierLabel[customerTier] || 'پشتیبانی پایه'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-bold">وضعیت پاسخگویی:</span>
                        <span className="font-black text-emerald-500 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          فعال
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-bold">زمان پاسخگویی:</span>
                        <span className="font-black text-slate-800 dark:text-slate-200">۲۴ ساعته</span>
                      </div>
                    </div>
                  </div>

                  {/* Active products quick list */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 p-5 shadow-xs space-y-4">
                    <h3 className="text-xs font-black text-slate-900 dark:text-white pb-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-brand-500" />
                      <span>محصولات فعال شما</span>
                    </h3>
                    <div className="space-y-2.5">
                      {activeProducts.slice(0, 4).map(prd => (
                        <div key={prd.id} className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-7 h-7 rounded-lg bg-brand-500/10 text-brand-500 flex items-center justify-center shrink-0">
                              <Layers className="w-3.5 h-3.5" />
                            </span>
                            <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 truncate">{prd.name}</span>
                          </div>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                            prd.status === 'فعال' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                          }`}>
                            {prd.status}
                          </span>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => setActiveTab('products')}
                      className="w-full text-center text-[10px] font-bold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
                    >
                      مشاهده همه محصولات و لایسنس‌ها
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'products' && (
            <div className="space-y-6 max-w-7xl mx-auto w-full">
              {/* Header row */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Layers className="w-4.5 h-4.5 text-brand-500" />
                    محصولات و لایسنس‌های فعال سازمان
                  </h3>
                  <p className="text-[11px] text-slate-400 font-bold">
                    {customerConnections.length > 0
                      ? `${customerConnections.length.toLocaleString('fa-IR')} لایسنس فعال در سامانه برای ${customerName}`
                      : 'لایسنس‌های اختصاصی سازمان شما'}
                  </p>
                </div>
                <button
                  onClick={() => setRefreshKey(k => k + 1)}
                  className="px-3.5 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-brand-500 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${connectionsLoading ? 'animate-spin text-brand-500' : ''}`} />
                  <span>بروزرسانی</span>
                </button>
              </div>

              {/* Loading state */}
              {connectionsLoading && activeProducts.length === 0 ? (
                <div className="flex items-center justify-center py-16">
                  <RefreshCw className="w-7 h-7 text-brand-500 animate-spin" />
                </div>
              ) : activeProducts.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-12 text-center space-y-2">
                  <Layers className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
                  <p className="text-xs font-black text-slate-500 dark:text-slate-400">هیچ محصول فعالی برای سازمان شما ثبت نشده است</p>
                  <p className="text-[10px] text-slate-400 font-bold">برای ثبت لایسنس جدید با تیم فروش و لایسنسینگ تماس بگیرید.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {activeProducts.map(prd => {
                    const conn = customerConnections.find(c => c.productId === prd.id);
                    return (
                      <div key={prd.id} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-500/10 to-brand-500/20 text-brand-500 flex items-center justify-center shrink-0">
                              <Layers className="w-4.5 h-4.5" />
                            </span>
                            <div className="min-w-0">
                              <h3 className="text-xs font-black text-slate-900 dark:text-white truncate">{prd.name}</h3>
                              <span className="text-[9px] font-bold text-slate-400">{prd.version}</span>
                            </div>
                          </div>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                            prd.status === 'فعال' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                            prd.status === 'منقضی شده' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                            'bg-amber-500/10 text-amber-500 border-amber-500/20'
                          }`}>
                            {prd.status}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800">
                          <span className="text-[9px] text-slate-400 font-bold block mb-0.5">کلید فعال‌سازی</span>
                          <code className="text-[10px] font-mono font-bold text-brand-600 dark:text-brand-400 dir-ltr block truncate">{prd.licenseKey}</code>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-600 dark:text-slate-400 font-medium">
                          <div className="space-y-0.5">
                            <span className="text-[9px] text-slate-400 block">انقضای لایسنس</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200 block truncate">{prd.expiresAt}</span>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[9px] text-slate-400 block">سهمیه کاربر</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200 block truncate">{prd.userQuota}</span>
                          </div>
                        </div>

                        {conn?.subscriptionType && (
                          <div className="flex items-center gap-1.5 text-[9px] text-slate-500 dark:text-slate-400 font-bold">
                            <Calendar className="w-3 h-3 text-brand-500 shrink-0" />
                            <span>نوع اشتراک: {conn.subscriptionType}</span>
                          </div>
                        )}

                        <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80">
                          <button
                            onClick={() => { setActiveTab('create-ticket'); setTicketProduct(prd.name); }}
                            className="text-[10px] font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Headphones className="w-3 h-3" />
                            <span>درخواست پشتیبانی</span>
                          </button>
                          <button
                            onClick={() => showToast('کلید لایسنس در حال دانلود است.')}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors cursor-pointer"
                            title="دانلود لایسنس"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'create-ticket' && (
            <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <h3 className="text-base font-black text-slate-900 dark:text-white">ارسال تیکت جدید به پشتیبانی فنی</h3>
                <p className="text-xs text-slate-400 mt-1">کارشناسان ارشد  به صورت ۲۴ ساعته بر اساس SLA طلایی پاسخگوی شما خواهند بود.</p>
              </div>

              <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">عنوان درخواست / موضوع مشکل</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: عدم اتصال به درگاه API پلتفرم ابری"
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 outline-none focus:ring-2 focus:ring-brand-500/20 font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">محصول مرتبط</label>
                    <select
                      value={ticketProduct}
                      onChange={(e) => setTicketProduct(e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 outline-none font-bold"
                    >
                      {activeProducts.length > 0 ? (
                        activeProducts.map(prd => (
                          <option key={prd.id} value={prd.name}>{prd.name}</option>
                        ))
                      ) : (
                        <option value="Cloud Security Platform">Cloud Security Platform</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">سطح اولویت (SLA Impact)</label>
                    <select
                      value={ticketPriority}
                      onChange={(e) => setTicketPriority(e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 outline-none font-bold"
                    >
                      <option value="بحرانی">بحرانی (توقف کامل سرویس - SLA زیر ۳۰ دقیقه)</option>
                      <option value="بالا">بالا (اختلال شدید در کارکرد)</option>
                      <option value="متوسط">متوسط (سوال فنی یا اختلال جزئی)</option>
                      <option value="پایین">پایین (درخواست تغییرات و راهنمایی)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">شرح کامل مشکل یا درخواست</label>
                  <textarea
                    rows={5}
                    required
                    placeholder="لطفاً جزئیات خطای مشاهده شده، کدهای بازگشتی و مراحل تکرار مشکل را شرح دهید..."
                    value={ticketMessage}
                    onChange={(e) => setTicketMessage(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 outline-none focus:ring-2 focus:ring-brand-500/20 font-medium leading-relaxed"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-lg shadow-brand-500/20 flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <Send className="w-4 h-4" />
                    <span>ارسال تیکت پشتیبانی</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'my-tickets' && (
            <div className="space-y-6 max-w-7xl mx-auto w-full">
              {/* 1. Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <TicketIcon className="w-4.5 h-4.5 text-brand-500" />
                    پیگیری تیکت‌های پشتیبانی
                  </h3>
                  <p className="text-[11px] text-slate-400 font-bold">تاریخچه درخواست‌های پشتیبانی شما</p>
                </div>
                <button
                  onClick={() => setActiveTab('create-ticket')}
                  className="px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>ثبت تیکت جدید</span>
                </button>
              </div>

              {/* 2. KPI row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  onClick={() => { setTicketStatusFilter('همه'); setTicketPriorityFilter('همه'); setTicketSearch(''); setTicketPage(1); }}
                  className={`rounded-2xl border p-4 flex items-center justify-between shadow-xs transition-all cursor-pointer text-right ${
                    ticketStatusFilter === 'همه' && ticketPriorityFilter === 'همه' && !ticketSearch
                      ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-700'
                      : 'bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-800/60 hover:border-brand-500/30'
                  }`}
                >
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 block">کل تیکت‌ها</span>
                    <h4 className="text-2xl font-black text-slate-900 dark:text-white leading-none">{totalTickets.toLocaleString('fa-IR')}</h4>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                    <TicketIcon className="w-5 h-5" />
                  </div>
                </button>

                <button
                  onClick={() => { setTicketStatusFilter('در حال بررسی'); setTicketPriorityFilter('همه'); setTicketSearch(''); setTicketPage(1); }}
                  className={`rounded-2xl border p-4 flex items-center justify-between shadow-xs transition-all cursor-pointer text-right ${
                    ticketStatusFilter === 'در حال بررسی'
                      ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700'
                      : 'bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-800/60 hover:border-amber-500/30'
                  }`}
                >
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 block">در حال بررسی</span>
                    <h4 className="text-2xl font-black text-amber-500 leading-none">{customerTickets.filter(t => t.status === 'در حال بررسی').length.toLocaleString('fa-IR')}</h4>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                </button>

                <button
                  onClick={() => { setTicketStatusFilter('حل شده'); setTicketPriorityFilter('همه'); setTicketSearch(''); setTicketPage(1); }}
                  className={`rounded-2xl border p-4 flex items-center justify-between shadow-xs transition-all cursor-pointer text-right ${
                    ticketStatusFilter === 'حل شده'
                      ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-700'
                      : 'bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-800/60 hover:border-emerald-500/30'
                  }`}
                >
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 block">حل شده</span>
                    <h4 className="text-2xl font-black text-emerald-500 leading-none">{customerTickets.filter(t => t.status === 'حل شده' || t.status === 'بسته شده').length.toLocaleString('fa-IR')}</h4>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </button>
              </div>

              {/* 3. Search & filters toolbar */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex flex-1 flex-col sm:flex-row items-center gap-3">
                    <div className="relative w-full sm:max-w-xs">
                      <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="جستجو بر اساس شماره، عنوان یا محصول..."
                        value={ticketSearch}
                        onChange={e => { setTicketSearch(e.target.value); setTicketPage(1); }}
                        className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-xs font-semibold focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all duration-150"
                      />
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto font-bold text-slate-600 dark:text-slate-300">
                      <div>
                        <select
                          value={ticketStatusFilter}
                          onChange={e => { setTicketStatusFilter(e.target.value); setTicketPage(1); }}
                          className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/40 px-3 py-2.5 outline-none focus:border-brand-500 cursor-pointer font-bold"
                        >
                          <option className="dark:bg-slate-800 dark:text-slate-200" value="همه">وضعیت: همه</option>
                          <option className="dark:bg-slate-800 dark:text-slate-200" value="جدید">جدید</option>
                          <option className="dark:bg-slate-800 dark:text-slate-200" value="در حال بررسی">در حال بررسی</option>
                          <option className="dark:bg-slate-800 dark:text-slate-200" value="منتظر پاسخ مشتری">منتظر پاسخ مشتری</option>
                          <option className="dark:bg-slate-800 dark:text-slate-200" value="حل شده">حل شده</option>
                          <option className="dark:bg-slate-800 dark:text-slate-200" value="بسته شده">بسته شده</option>
                        </select>
                      </div>
                      <div>
                        <select
                          value={ticketPriorityFilter}
                          onChange={e => { setTicketPriorityFilter(e.target.value); setTicketPage(1); }}
                          className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/40 px-3 py-2.5 outline-none focus:border-brand-500 cursor-pointer font-bold"
                        >
                          <option className="dark:bg-slate-800 dark:text-slate-200" value="همه">اولویت: همه</option>
                          <option className="dark:bg-slate-800 dark:text-slate-200" value="پایین">پایین</option>
                          <option className="dark:bg-slate-800 dark:text-slate-200" value="متوسط">متوسط</option>
                          <option className="dark:bg-slate-800 dark:text-slate-200" value="بالا">بالا</option>
                          <option className="dark:bg-slate-800 dark:text-slate-200" value="بحرانی">بحرانی</option>
                        </select>
                      </div>
                    </div>

                    <select
                      value={ticketSortBy}
                      onChange={e => setTicketSortBy(e.target.value as any)}
                      title="مرتب‌سازی"
                      className="text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/40 px-3 py-2.5 outline-none focus:border-brand-500 cursor-pointer font-bold text-slate-700 dark:text-slate-300"
                    >
                      <option className="dark:bg-slate-800 dark:text-slate-200" value="newest">جدیدترین</option>
                      <option className="dark:bg-slate-800 dark:text-slate-200" value="oldest">قدیمی‌ترین</option>
                      <option className="dark:bg-slate-800 dark:text-slate-200" value="priority">اولویت</option>
                    </select>
                  </div>

                  <button
                    onClick={() => {
                      setTicketSearch('');
                      setTicketStatusFilter('همه');
                      setTicketPriorityFilter('همه');
                      setTicketPage(1);
                    }}
                    className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer shrink-0"
                  >
                    حذف فیلترها
                  </button>
                </div>
              </div>

              {/* 4. Tickets table */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs overflow-hidden">
                {paginatedMyTickets.length === 0 ? (
                  <div className="p-12 text-center space-y-2">
                    <TicketIcon className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
                    <p className="text-xs font-black text-slate-500 dark:text-slate-400">تیکتی یافت نشد</p>
                    <p className="text-[10px] text-slate-400 font-bold">فیلترها را تغییر دهید یا تیکت جدیدی ثبت کنید.</p>
                    <button
                      onClick={() => setActiveTab('create-ticket')}
                      className="mt-3 px-4 py-2 bg-brand-500 text-white text-xs font-bold rounded-xl cursor-pointer"
                    >
                      ثبت تیکت جدید
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-right border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-slate-800/60 text-slate-400 dark:text-slate-500 text-[10px] font-bold bg-slate-50/50 dark:bg-slate-950/30">
                            <th className="p-4 pr-5">شماره / موضوع</th>
                            <th className="p-4">محصول</th>
                            <th className="p-4">اولویت</th>
                            <th className="p-4">وضعیت</th>
                            <th className="p-4">تاریخ ثبت</th>
                            <th className="p-4">آخرین فعالیت</th>
                            <th className="p-4 pl-5">عملیات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/30">
                          {paginatedMyTickets.map(tkt => (
                            <tr key={tkt.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 text-xs text-slate-700 dark:text-slate-300 transition-colors">
                              <td className="p-4 pr-5">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="font-mono font-bold text-slate-400 dark:text-slate-500 text-[10px] shrink-0">{tkt.ticketNumber ? `#${tkt.ticketNumber}` : tkt.id}</span>
                                  <span className="font-semibold text-slate-900 dark:text-white max-w-[200px] truncate">{tkt.subject}</span>
                                </div>
                              </td>
                              <td className="p-4 text-slate-500 dark:text-slate-400 max-w-[120px] truncate">{tkt.product}</td>
                              <td className="p-4">
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold ${
                                  tkt.priority === 'بحرانی' ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400' :
                                  tkt.priority === 'بالا' ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' :
                                  tkt.priority === 'متوسط' ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400' :
                                  'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${
                                    tkt.priority === 'بحرانی' ? 'bg-rose-500' :
                                    tkt.priority === 'بالا' ? 'bg-amber-500' :
                                    tkt.priority === 'متوسط' ? 'bg-brand-500' :
                                    'bg-slate-400'
                                  }`} />
                                  {tkt.priority}
                                </span>
                              </td>
                              <td className="p-4">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                                  tkt.status === 'حل شده' || tkt.status === 'بسته شده' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' :
                                  tkt.status === 'باز' || tkt.status === 'جدید' ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' :
                                  tkt.status === 'در حال بررسی' ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' :
                                  tkt.status === 'منتظر پاسخ مشتری' ? 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400' :
                                  'bg-slate-100 text-slate-500 dark:bg-slate-800/80 dark:text-slate-400'
                                }`}>
                                  {tkt.status}
                                </span>
                              </td>
                              <td className="p-4 text-slate-500 dark:text-slate-400 font-bold">{formatDateTime(tkt.date)}</td>
                              <td className="p-4 text-slate-400 dark:text-slate-500 font-bold">{tkt.lastUpdate}</td>
                              <td className="p-4 pl-5">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    onClick={() => openTicketAction('respond', tkt)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-brand-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                    title="ارسال پاسخ به پشتیبانی"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => openTicketAction('edit', tkt)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-brand-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                    title="ویرایش تیکت"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  {(tkt.status !== 'حل شده' && tkt.status !== 'بسته شده') && (
                                    <button
                                      onClick={() => openTicketAction('close', tkt)}
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                      title="علامت‌گذاری به‌عنوان حل‌شده / بستن"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => openTicketAction('delete', tkt)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                    title="حذف تیکت"
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

                    {/* Pagination */}
                    <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                      <span className="text-slate-400 font-bold">
                        نمایش <span className="font-black text-slate-800 dark:text-white">{myTicketsStart}</span> تا{' '}
                        <span className="font-black text-slate-800 dark:text-white">{myTicketsEnd}</span> از{' '}
                        <span className="font-black text-slate-800 dark:text-white">{filteredMyTickets.length.toLocaleString('fa-IR')}</span> تیکت
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setTicketPage(p => Math.max(1, p - 1))}
                          disabled={ticketPage === 1}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-brand-500 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                        >
                          قبلی
                        </button>
                        <span className="font-black text-slate-700 dark:text-slate-200 px-2">{ticketPage.toLocaleString('fa-IR')} / {myTicketsTotalPages.toLocaleString('fa-IR')}</span>
                        <button
                          onClick={() => setTicketPage(p => Math.min(myTicketsTotalPages, p + 1))}
                          disabled={ticketPage >= myTicketsTotalPages}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-brand-500 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                        >
                          بعدی
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {activeTab === 'docs' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: 'راهنمای نصب و پیکربندی اولیه SDK ', category: 'توسعه‌دهندگان', icon: BookOpen },
                { title: 'دستورالعمل تنظیمات SSL و امنیت دامنه سازمانی', category: 'شبکه و امنیت', icon: Shield },
                { title: 'نحوه اتصال به سرویس هویت یکپارچه SSO', category: 'احراز هویت', icon: Key }
              ].map((doc, idx) => (
                <div key={idx} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
                  <doc.icon className="w-8 h-8 text-brand-500" />
                  <span className="text-[10px] font-bold text-slate-400 block">{doc.category}</span>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white leading-relaxed">{doc.title}</h4>
                  <button className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 pt-2 cursor-pointer">
                    <span>مطالعه مستندات</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 text-xs">
              <h3 className="text-sm font-black text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
                مشخصات سازمان ثبت شده در پلتفرم 
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400 font-bold block">نام شرکت / سازمان:</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200">پتروشیمی سپهر پارس</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">شناسه ملی سازمان:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">۱۰۱۰۲۳۴۵۹۸۱</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">سطح پشتیبانی سازمانی:</span>
                  <span className="font-bold text-amber-500">پشتیبانی طلایی VIP (24/7 SLA)</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">مدیر حساب اختصاصی (Account Manager):</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">مهندس حمیدرضا احمدی</span>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* TICKET ACTION MODALS */}
        <AnimatePresence>
          {ticketAction && activeActionTicket && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-right space-y-4"
              >
                {/* EDIT MODAL */}
                {ticketAction === 'edit' && (
                  <>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                      <h3 className="text-sm font-black text-slate-900 dark:text-white">ویرایش تیکت {activeActionTicket.ticketNumber ? `#${activeActionTicket.ticketNumber}` : activeActionTicket.id}</h3>
                      <button onClick={() => { setTicketAction(null); setActiveActionTicket(null); }} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">عنوان / موضوع تیکت</label>
                        <input
                          type="text"
                          value={editSubject}
                          onChange={e => setEditSubject(e.target.value)}
                          className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 outline-none font-medium focus:border-brand-500"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">محصول مرتبط</label>
                          <select
                            value={editProduct}
                            onChange={e => setEditProduct(e.target.value)}
                            className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 outline-none font-bold"
                          >
                            {activeProducts.length > 0 ? (
                              activeProducts.map(prd => <option key={prd.id} value={prd.name}>{prd.name}</option>)
                            ) : (
                              <option value={editProduct}>{editProduct}</option>
                            )}
                          </select>
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">اولویت</label>
                          <select
                            value={editPriority}
                            onChange={e => setEditPriority(e.target.value)}
                            className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 outline-none font-bold"
                          >
                            <option value="پایین">پایین</option>
                            <option value="متوسط">متوسط</option>
                            <option value="بالا">بالا</option>
                            <option value="بحرانی">بحرانی</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button onClick={() => { setTicketAction(null); setActiveActionTicket(null); }} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold cursor-pointer">
                        انصراف
                      </button>
                      <button onClick={handleSaveEdit} disabled={actionBusy || !editSubject.trim()} className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-black cursor-pointer shadow-md shadow-brand-500/15 disabled:opacity-50">
                        {actionBusy ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
                      </button>
                    </div>
                  </>
                )}

                {/* RESPOND MODAL — full chat thread */}
                {ticketAction === 'respond' && (
                  <>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div className="space-y-0.5">
                        <h3 className="text-sm font-black text-slate-900 dark:text-white">گفتگو با تیم پشتیبانی</h3>
                        <span className="block text-[10px] text-slate-400 font-bold">
                          {activeActionTicket.ticketNumber ? `#${activeActionTicket.ticketNumber}` : activeActionTicket.id} • {activeActionTicket.subject}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => fetchTicketThread(activeActionTicket.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-brand-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="بروزرسانی گفتگو"
                        >
                          <RefreshCw className={`w-4 h-4 ${threadLoading ? 'animate-spin text-brand-500' : ''}`} />
                        </button>
                        <button onClick={() => { setTicketAction(null); setActiveActionTicket(null); }} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Message thread */}
                    <div className="h-[320px] overflow-y-auto p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800 space-y-3">
                      {threadLoading && ticketThread.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                          <RefreshCw className="w-6 h-6 text-brand-500 animate-spin" />
                        </div>
                      ) : ticketThread.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                          <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" />
                          <span className="text-xs font-black text-slate-500 dark:text-slate-400">هنوز پیامی در این تیکت ثبت نشده است</span>
                          <span className="text-[10px] text-slate-400 font-bold mt-1">اولین پیام خود را بنویسید.</span>
                        </div>
                      ) : (
                        ticketThread.map(msg => {
                          const isCustomer = msg.sender === 'customer';
                          return (
                            <div key={msg.id} className={`flex ${isCustomer ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[80%] p-3 rounded-2xl border text-right space-y-1 ${
                                isCustomer
                                  ? 'bg-brand-500/10 border-brand-500/20'
                                  : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-sm'
                              }`}>
                                <span className="text-[11px] font-black text-slate-900 dark:text-white">{msg.senderName}</span>
                                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium whitespace-pre-wrap">{msg.text}</p>
                                <span className="block text-[9px] font-mono text-slate-400">{msg.time}</span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Composer */}
                    <div className="space-y-2">
                      <textarea
                        rows={3}
                        value={respondText}
                        onChange={e => setRespondText(e.target.value)}
                        placeholder="پیام خود را برای کارشناسان پشتیبانی بنویسید..."
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 outline-none font-medium leading-relaxed focus:border-brand-500"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => { setTicketAction(null); setActiveActionTicket(null); }} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold cursor-pointer">
                          بستن
                        </button>
                        <button onClick={handleSendResponse} disabled={actionBusy || !respondText.trim()} className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-black cursor-pointer shadow-md shadow-brand-500/15 flex items-center gap-1.5 disabled:opacity-50">
                          <Send className="w-3.5 h-3.5" />
                          {actionBusy ? 'در حال ارسال...' : 'ارسال پاسخ'}
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {/* CLOSE / RESOLVE MODAL */}
                {ticketAction === 'close' && (
                  <>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                      <h3 className="text-sm font-black text-slate-900 dark:text-white">بستن تیکت {activeActionTicket.ticketNumber ? `#${activeActionTicket.ticketNumber}` : activeActionTicket.id}</h3>
                      <button onClick={() => { setTicketAction(null); setActiveActionTicket(null); }} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs space-y-1">
                      <p className="font-black text-slate-800 dark:text-slate-200">آیا از حل‌شدن مشکل خود مطمئن هستید؟</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">با تایید، این تیکت به‌عنوان «حل شده» علامت‌گذاری شده و در وضعیت نهایی قرار می‌گیرد.</p>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button onClick={() => { setTicketAction(null); setActiveActionTicket(null); }} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold cursor-pointer">
                        انصراف
                      </button>
                      <button onClick={handleResolveTicket} disabled={actionBusy} className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black cursor-pointer shadow-md shadow-emerald-500/15 disabled:opacity-50">
                        {actionBusy ? 'در حال ثبت...' : 'تایید و بستن تیکت'}
                      </button>
                    </div>
                  </>
                )}

                {/* DELETE CONFIRM MODAL */}
                {ticketAction === 'delete' && (
                  <>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                      <h3 className="text-sm font-black text-slate-900 dark:text-white">حذف تیکت {activeActionTicket.ticketNumber ? `#${activeActionTicket.ticketNumber}` : activeActionTicket.id}</h3>
                      <button onClick={() => { setTicketAction(null); setActiveActionTicket(null); }} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 text-xs space-y-1">
                      <p className="font-black text-rose-600 dark:text-rose-400">آیا از حذف این تیکت مطمئن هستید؟</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">این عملیات غیرقابل بازگشت است و تمام پیام‌های مرتبط با تیکت نیز حذف خواهند شد.</p>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button onClick={() => { setTicketAction(null); setActiveActionTicket(null); }} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold cursor-pointer">
                        انصراف
                      </button>
                      <button onClick={handleDeleteTicket} disabled={actionBusy} className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-black cursor-pointer shadow-md shadow-rose-500/15 disabled:opacity-50">
                        {actionBusy ? 'در حال حذف...' : 'تایید حذف'}
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
