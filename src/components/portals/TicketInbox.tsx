import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Plus,
  Download,
  CheckCircle,
  AlertTriangle,
  MoreVertical,
  Inbox,
  ChevronLeft,
  ChevronRight,
  User,
  Folder,
  Tag,
  Clock,
  AlertCircle,
  Trash2,
  UserPlus,
  ArrowLeftRight,
  MessageSquare,
  RefreshCw,
  X,
  Send,
  Check,
  CheckCheck,
  Filter,
  Users,
  Shield,
  Layers,
  Building,
  HelpCircle,
  HelpCircle as LifeBuoy,
  FileText,
  Paperclip,
  Activity,
  UserCheck
} from 'lucide-react';
import { formatTimeAgo } from '../../lib/utils';
import type { Ticket, Product, Customer } from '../../types';
import { gql } from '../../api/graphql';
import { UPDATE_TICKET_STATUS, UPDATE_TICKET, DELETE_TICKETS, CREATE_TICKET_MESSAGE } from '../../api/queries';
import { useUsers } from '../../hooks/useUsers';
import { useDepartments } from '../../hooks/useDepartments';
import TicketDetailsWorkspace from './TicketDetailsWorkspace';

interface TicketInboxViewProps {
  tickets: Ticket[];
  setTickets: React.Dispatch<React.SetStateAction<Ticket[]>>;
  customers: Customer[];
  products: Product[];
  ticketSearch: string;
  setTicketSearch: (search: string) => void;
  ticketPriorityFilter: string;
  setTicketPriorityFilter: (filter: string) => void;
  ticketStatusFilter: string;
  setTicketStatusFilter: (filter: string) => void;
  setShowTicketModal: (show: boolean) => void;
  setNewTicketCustomer: React.Dispatch<React.SetStateAction<string>>;
  setNewTicketProduct: React.Dispatch<React.SetStateAction<string>>;
  showCustomerToast: (msg: string, type?: 'success' | 'error') => void;
}

export default function TicketInboxView({
  tickets,
  setTickets,
  customers,
  products,
  ticketSearch,
  setTicketSearch,
  ticketPriorityFilter,
  setTicketPriorityFilter,
  ticketStatusFilter,
  setTicketStatusFilter,
  setShowTicketModal,
  setNewTicketCustomer,
  setNewTicketProduct,
  showCustomerToast
}: TicketInboxViewProps) {
  // 1. ADVANCED FILTERS STATES
  const [selectedProductFilter, setSelectedProductFilter] = useState('همه');
  const [selectedCustomerFilter, setSelectedCustomerFilter] = useState('همه');
  const [selectedAgentFilter, setSelectedAgentFilter] = useState('همه');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // 2. QUICK FILTERS & ACTIVE CHIPS
  const [activeQuickFilter, setActiveQuickFilter] = useState<'all' | 'my' | 'critical' | 'unanswered' | 'today' | 'week' | 'open' | 'waiting' | 'resolved'>('all');

  // 3. SELECTION & BULK ACTIONS STATES
  const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([]);
  const [showBulkStatusDropdown, setShowBulkStatusDropdown] = useState(false);
  const [showBulkAgentDropdown, setShowBulkAgentDropdown] = useState(false);

  // 4. ROW ACTIONS ACTIVE OVERLAY MENU ID
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [menuFixedStyle, setMenuFixedStyle] = useState<Record<string, string> | undefined>(undefined);

  // 5. LOADING / ERROR STATES SIMULATION
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  // 6. PAGINATION
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // 7. ACTIVE CONVERSATION DRAWER (For screen 07 detail + path to screen 08)
  const [selectedTicketForDetail, setSelectedTicketForDetail] = useState<Ticket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [conversationThreads, setConversationThreads] = useState<{ [ticketId: string]: any[] }>({
    'TKT-1025': [
      { sender: 'customer', name: 'مهندس آرش کریمی', role: 'رابط فنی آریا امنیت', message: 'سلام و احترام، متاسفانه از صبح امروز گره‌های شماره ۳ و ۴ مانیتورینگ ابری در محدوده پارک فناوری پردیس به صورت متناوب قطع و وصل می‌شوند. این مسئله باعث بروز خطاهای کاذب در داشبورد امنیتی ما شده است. لطفاً اولویت بررسی را روی بحرانی قرار دهید.', time: '۱۰:۳۰ - امروز', avatarColor: 'bg-indigo-500' },
      { sender: 'agent', name: 'امیرحسین رضایی', role: 'کارشناس ارشد پشتیبانی ', message: 'سلام جناب مهندس کریمی گرامی. درخواست شما بررسی شد. پایش بلادرنگ لاگ‌ها نشان می‌دهد یک لود بالانسر در لایه شبکه پردیس وجود دارد که ترافیک گره‌ها را مسدود می‌کند. هم‌اکنون تیم زیرساخت در حال هماهنگی برای حل این مشکل است.', time: '۱۰:۴۵ - امروز', avatarColor: 'bg-brand-600' }
    ],
    'TKT-1026': [
      { sender: 'customer', name: 'خانم الهام سلیمی', role: 'رابط فناوری نوین', message: 'با سلام، لایسنس تستی که برای سیستم هویت چندعاملی برای ما فعال کرده بودید ارور انقضای کلید موقت می‌دهد، در صورتی که تاریخ معتبر آن تا پایان ماه جاری اعلام شده بود. فایل تنظیمات را پیوست کردم.', time: 'دیروز - ۱۶:۲۰', avatarColor: 'bg-emerald-500' }
    ]
  });

  const statusToApi: Record<string, string> = { 'باز': 'OPEN', 'در حال بررسی': 'INVESTIGATING', 'منتظر پاسخ مشتری': 'AWAITING_CUSTOMER', 'بسته شده': 'CLOSED', 'حل شده': 'RESOLVED' };

  const updateStatusViaApi = async (id: string, status: string) => {
    const apiStatus = statusToApi[status] || 'OPEN';
    try {
      await gql(UPDATE_TICKET_STATUS, { input: { id, status: apiStatus } });
    } catch { /* local state already updated */ }
  };

  // Agents list from real API users
  const { users: apiUsers } = useUsers();
  const { departments } = useDepartments();
  const agentsList = apiUsers.filter(u => !u.isCustomer && (u.role === 'ADMIN' || u.role === 'AGENT'));

  // Filter agents whose department covers a given product name
  const getAgentsForProduct = useCallback((productName: string) => {
    const deptIds = departments
      .filter(d => d.assignedProducts.includes(productName))
      .map(d => d.id);
    return agentsList.filter(u => !u.departmentId || deptIds.includes(u.departmentId));
  }, [agentsList, departments]);

  // Handle outside clicks to close menus
  useEffect(() => {
    const handleOutsideClick = () => {
      setActiveMenuId(null);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // 8. DATA DYNAMICS
  // Compute standard KPIs
  const totalOpenTickets = tickets.filter(t => t.status !== 'بسته شده').length;
  const totalWaitingResponse = tickets.filter(t => t.status === 'منتظر پاسخ مشتری').length;
  const totalResolved = tickets.filter(t => t.status === 'بسته شده').length;

  // Sync main search input with parent search
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTicketSearch(e.target.value);
    setCurrentPage(1);
  };

  // 9. FILTER LOGIC
  const filteredTickets = tickets.filter(t => {
    // Parent search
    const matchesSearch = 
      t.id.toLowerCase().includes(ticketSearch.toLowerCase()) ||
      t.title.toLowerCase().includes(ticketSearch.toLowerCase()) ||
      t.customer.toLowerCase().includes(ticketSearch.toLowerCase());

    // Status filter
    const matchesStatus = ticketStatusFilter === 'همه' || t.status === ticketStatusFilter;

    // Priority filter
    const matchesPriority = ticketPriorityFilter === 'همه' || t.priority === ticketPriorityFilter;

    // Product Filter
    const matchesProduct = selectedProductFilter === 'همه' || t.product === selectedProductFilter;

    // Customer Filter
    const matchesCustomer = selectedCustomerFilter === 'همه' || t.customer === selectedCustomerFilter;

    // Agent Filter
    const matchesAgent = selectedAgentFilter === 'همه' || t.assignedTo === selectedAgentFilter;

    // Quick filter chips logic
    let matchesQuick = true;
    if (activeQuickFilter === 'my') {
      matchesQuick = t.assignedTo === 'امیرحسین رضایی';
    } else if (activeQuickFilter === 'critical') {
      matchesQuick = t.priority === 'بحرانی';
    } else if (activeQuickFilter === 'unanswered') {
      matchesQuick = t.status === 'باز';
    } else if (activeQuickFilter === 'today') {
      matchesQuick = t.date.includes('دقیقه') || t.date.includes('ساعت') || t.date.includes('هم‌اکنون');
    } else if (activeQuickFilter === 'week') {
      matchesQuick = !t.date.includes('دیروز') && !t.date.includes('هفته پیش');
    } else if (activeQuickFilter === 'open') {
      matchesQuick = t.status !== 'بسته شده';
    } else if (activeQuickFilter === 'waiting') {
      matchesQuick = t.status === 'منتظر پاسخ مشتری';
    } else if (activeQuickFilter === 'resolved') {
      matchesQuick = t.status === 'بسته شده';
    }

    return matchesSearch && matchesStatus && matchesPriority && matchesProduct && matchesCustomer && matchesAgent && matchesQuick;
  });

  // Calculate Paginated subset
  const totalItems = filteredTickets.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedTickets = filteredTickets.slice(startIndex, endIndex);

  // 10. REUSABLE ACTION HANDLERS
  const handleToggleSelectAll = () => {
    if (selectedTicketIds.length === paginatedTickets.length) {
      setSelectedTicketIds([]);
    } else {
      setSelectedTicketIds(paginatedTickets.map(t => t.id));
    }
  };

  const handleToggleSelectRow = (id: string) => {
    if (selectedTicketIds.includes(id)) {
      setSelectedTicketIds(selectedTicketIds.filter(x => x !== id));
    } else {
      setSelectedTicketIds([...selectedTicketIds, id]);
    }
  };

  const handleBulkStatusChange = async (status: string) => {
    const apiStatus = status === 'باز' ? 'OPEN' : status === 'در حال بررسی' ? 'INVESTIGATING' : status === 'منتظر پاسخ مشتری' ? 'AWAITING_CUSTOMER' : status === 'بسته شده' ? 'CLOSED' : 'OPEN';
    try {
      for (const id of selectedTicketIds) {
        await gql(UPDATE_TICKET_STATUS, { input: { id, status: apiStatus } });
      }
      setTickets(tickets.map(t => {
        if (selectedTicketIds.includes(t.id)) {
          return { ...t, status: status as Ticket['status'] };
        }
        return t;
      }));
      setSelectedTicketIds([]);
      setShowBulkStatusDropdown(false);
      showCustomerToast(`وضعیت ${selectedTicketIds.length} تیکت با موفقیت به «${status}» تغییر یافت.`, 'success');
    } catch (err) {
      showCustomerToast('خطا در تغییر وضعیت: ' + ((err as Error).message || 'خطای ناشناخته'), 'error');
    }
  };

  const handleBulkAgentAssign = async (agentId: string, agentName: string) => {
    try {
      for (const id of selectedTicketIds) {
        await gql(UPDATE_TICKET, { input: { id, assignedToId: agentId } });
      }
      setTickets(tickets.map(t => {
        if (selectedTicketIds.includes(t.id)) {
          return { ...t, assignedTo: agentName };
        }
        return t;
      }));
      setSelectedTicketIds([]);
      setShowBulkAgentDropdown(false);
      showCustomerToast(`مجموعه تیکت‌های انتخابی به کارشناس «${agentName}» ارجاع داده شد.`, 'success');
    } catch (err) {
      showCustomerToast('خطا در ارجاع تیکت: ' + ((err as Error).message || 'خطای ناشناخته'), 'error');
    }
  };

  const handleBulkClose = async () => {
    try {
      for (const id of selectedTicketIds) {
        await gql(UPDATE_TICKET_STATUS, { input: { id, status: 'CLOSED' } });
      }
      setTickets(tickets.map(t => {
        if (selectedTicketIds.includes(t.id)) {
          return { ...t, status: 'بسته شده' as Ticket['status'] };
        }
        return t;
      }));
      setSelectedTicketIds([]);
      showCustomerToast(`تعداد ${selectedTicketIds.length} تیکت پشتیبانی بسته شد.`, 'success');
    } catch (err) {
      showCustomerToast('خطا در بستن تیکت: ' + ((err as Error).message || 'خطای ناشناخته'), 'error');
    }
  };

  const handleBulkDelete = async () => {
    try {
      await gql(DELETE_TICKETS, { input: { ids: selectedTicketIds } });
      setTickets(tickets.filter(t => !selectedTicketIds.includes(t.id)));
      setSelectedTicketIds([]);
      showCustomerToast('تیکت‌های انتخاب شده با موفقیت از سرور حذف گردیدند.', 'success');
    } catch (err) {
      showCustomerToast('خطا در حذف تیکت: ' + ((err as Error).message || 'خطای ناشناخته'), 'error');
    }
  };

  const handleResetAllFilters = () => {
    setTicketSearch('');
    setTicketPriorityFilter('همه');
    setTicketStatusFilter('همه');
    setSelectedProductFilter('همه');
    setSelectedCustomerFilter('همه');
    setSelectedAgentFilter('همه');
    setStartDate('');
    setEndDate('');
    setActiveQuickFilter('all');
    showCustomerToast('کلیه فیلترهای جستجو ریست شدند.', 'success');
  };

  const handleExportReport = () => {
    showCustomerToast('در حال کوئری گرفتن و تجمیع داده‌های آماری...', 'success');
    setTimeout(() => {
      // Trigger native download
      const headers = 'ID,Title,Customer,Product,Priority,Status,AssignedTo,Date\n';
      const rows = filteredTickets.map(t => 
        `"${t.id}","${t.title}","${t.customer}","${t.product}","${t.priority}","${t.status}","${t.assignedTo}","${t.date}"`
      ).join('\n');
      
      const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `CMP_Tickets_Report_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showCustomerToast('خروجی فایل اکسل تیکت‌ها با موفقیت دانلود شد.', 'success');
    }, 1200);
  };

  const simulateReload = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      showCustomerToast('بلادرنگ: اطلاعات تیکت‌ها با هسته مرکزی  همگام شد.', 'success');
    }, 850);
  };

  // Send message reply in details pane
  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicketForDetail) return;

    setIsSendingReply(true);
    const targetId = selectedTicketForDetail.id;

    // Call API
    gql(CREATE_TICKET_MESSAGE, {
      input: {
        ticketId: targetId,
        text: replyText,
        senderName: 'امیرحسین رضایی',
        isInternal: false,
      },
    })
      .then(() => {
        const currentThreads = conversationThreads[targetId] || [];
        const newMsg = {
          sender: 'agent',
          name: 'امیرحسین رضایی',
          role: 'کارشناس ارشد پشتیبانی ',
          message: replyText,
          time: 'هم‌اکنون',
          avatarColor: 'bg-brand-600'
        };

        setConversationThreads({
          ...conversationThreads,
          [targetId]: [...currentThreads, newMsg]
        });

        // Update last activity and status on ticket
        setTickets(tickets.map(t => {
          if (t.id === targetId) {
            return {
              ...t,
              status: 'منتظر پاسخ مشتری',
              updatedAt: new Date().toISOString(),
            };
          }
          return t;
        }));

        // Update selectedTicketForDetail ref
        setSelectedTicketForDetail({
          ...selectedTicketForDetail,
          status: 'منتظر پاسخ مشتری',
        });

        setReplyText('');
        setIsSendingReply(false);
        showCustomerToast('پاسخ رسمی پشتیبانی با موفقیت ثبت و ارسال شد.', 'success');
      })
      .catch((err) => {
        setIsSendingReply(false);
        showCustomerToast('خطا در ارسال پاسخ: ' + ((err as Error).message || 'خطای ناشناخته'), 'error');
      });
  };

  // Keyboard shortcut support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + Alt + R -> simulated reload
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'r') {
        simulateReload();
      }
      // Esc -> close open drawer
      if (e.key === 'Escape') {
        setSelectedTicketForDetail(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (selectedTicketForDetail) {
    return (
      <TicketDetailsWorkspace
        ticket={selectedTicketForDetail}
        onBack={() => setSelectedTicketForDetail(null)}
        tickets={tickets}
        setTickets={setTickets}
        customers={customers}
        products={products}
        showCustomerToast={showCustomerToast}
        conversationThreads={conversationThreads}
        setConversationThreads={setConversationThreads}
        agentsList={selectedTicketForDetail ? getAgentsForProduct(selectedTicketForDetail.product) : agentsList}
      />
    );
  }

  return (
    <div className="space-y-6 text-right pb-12">
      {/* 1. TOP NAV / HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-brand-500/10 to-transparent rounded-bl-full pointer-events-none" />
        
        <div className="space-y-1.5 relative z-10">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-500 animate-pulse" />
            <h2 className="text-lg font-black text-slate-900 dark:text-white">مدیریت تیکت‌ها</h2>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-bold">
            مشاهده، پیگیری و مدیریت درخواست‌های پشتیبانی فنی و امنیتی لایه سازمانی
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0 relative z-10">
          <button
            onClick={simulateReload}
            title="همگام‌سازی اطلاعات (Ctrl+Alt+R)"
            className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750 rounded-xl transition-all text-slate-550 dark:text-slate-300 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setHasError(!hasError)}
            className={`p-3 border rounded-xl text-xs font-bold transition-all cursor-pointer ${
              hasError 
                ? 'bg-rose-500/10 text-rose-600 border-rose-500/30' 
                : 'bg-slate-50 dark:bg-slate-800 border-slate-200/60 dark:border-slate-700 text-slate-400 hover:text-slate-600'
            }`}
            title="شبیه‌سازی خطای سرور"
          >
            <AlertCircle className="w-4 h-4" />
          </button>

          <button
            onClick={handleExportReport}
            className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750 text-xs font-black px-4.5 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-400" />
            <span>خروجی گزارش</span>
          </button>
          
          <button
            onClick={() => {
              setNewTicketCustomer('');
              setNewTicketProduct('پنل کاربری ');
              setShowTicketModal(true);
            }}
            className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-black px-5 py-2.5 rounded-xl shadow-md shadow-brand-500/15 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>ایجاد تیکت جدید</span>
          </button>
        </div>
      </div>

      {/* ERROR STATE SIMULATOR VIEW */}
      {hasError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-5 flex items-start gap-4 text-right"
        >
          <div className="w-10 h-10 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1.5 flex-1">
            <h4 className="text-xs font-black text-rose-800 dark:text-rose-400">خطای موقت در ارتباط با API صادرکننده لایسنس </h4>
            <p className="text-xs text-rose-700/80 dark:text-rose-450 leading-relaxed font-bold">
              مجموعه داده‌های پشتیبانی با تاخیر مواجه شدند. لطفاً اتصال شبکه خود را بررسی کرده و مجدداً تلاش کنید. همچنین می‌توانید با زدن دکمه زیر مشکل را ریست نمایید.
            </p>
            <button
              onClick={() => setHasError(false)}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-2xs font-black rounded-lg transition-all cursor-pointer"
            >
              تلاش مجدد و رفع خطا
            </button>
          </div>
        </motion.div>
      )}

      {/* 2. TICKET KPI CARDS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {/* KPI 1: Active Open Tickets */}
        <button
          onClick={() => { setActiveQuickFilter(activeQuickFilter === 'open' ? 'all' : 'open'); setTicketStatusFilter('همه'); setCurrentPage(1); }}
          className={`rounded-2xl border p-5 flex items-center justify-between shadow-xs transition-all duration-200 cursor-pointer text-right ${
            activeQuickFilter === 'open'
              ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-700'
              : 'bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-800/60 hover:border-brand-500/30'
          }`}
        >
          <div className="space-y-1">
            <span className="text-2xs font-extrabold text-slate-400 dark:text-slate-500 block uppercase tracking-wider">تیکت‌های باز</span>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white font-mono leading-none">{totalOpenTickets}</h4>
            <span className="text-2xs font-bold text-slate-400 dark:text-slate-500">جریان کار فعال در سیستم</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-500 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Inbox className="w-5 h-5" />
          </div>
        </button>

        {/* KPI 2: Waiting response */}
        <button
          onClick={() => { setActiveQuickFilter(activeQuickFilter === 'waiting' ? 'all' : 'waiting'); setTicketStatusFilter('همه'); setCurrentPage(1); }}
          className={`rounded-2xl border p-5 flex items-center justify-between shadow-xs transition-all duration-200 cursor-pointer text-right ${
            activeQuickFilter === 'waiting'
              ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700'
              : 'bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-800/60 hover:border-brand-500/30'
          }`}
        >
          <div className="space-y-1">
            <span className="text-2xs font-extrabold text-slate-400 dark:text-slate-500 block uppercase tracking-wider">در انتظار پاسخ</span>
            <h4 className="text-2xl font-black text-amber-500 font-mono leading-none">{totalWaitingResponse}</h4>
            <span className="text-2xs font-bold text-amber-500">نیاز به اقدام و مانیتورینگ</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </button>

        {/* KPI 3: Resolved */}
        <button
          onClick={() => { setActiveQuickFilter(activeQuickFilter === 'resolved' ? 'all' : 'resolved'); setTicketStatusFilter('همه'); setCurrentPage(1); }}
          className={`rounded-2xl border p-5 flex items-center justify-between shadow-xs transition-all duration-200 cursor-pointer text-right ${
            activeQuickFilter === 'resolved'
              ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-700'
              : 'bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-800/60 hover:border-brand-500/30'
          }`}
        >
          <div className="space-y-1">
            <span className="text-2xs font-extrabold text-slate-400 dark:text-slate-500 block uppercase tracking-wider">حل شده</span>
            <h4 className="text-2xl font-black text-emerald-500 font-mono leading-none">{totalResolved}</h4>
            <span className="text-2xs font-bold text-emerald-500">تیکت‌های خاتمه‌یافته نهایی</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
        </button>

        {/* KPI 4: Avg Response Time */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 p-5 flex items-center justify-between shadow-xs hover:border-brand-500/30 transition-all duration-200">
          <div className="space-y-1">
            <span className="text-2xs font-extrabold text-slate-400 dark:text-slate-500 block uppercase tracking-wider">میانگین زمان پاسخ</span>
            <h4 className="text-md font-black text-indigo-600 dark:text-indigo-400 leading-none mt-1.5">۱ ساعت و ۴۵ دقیقه</h4>
            <span className="text-2xs font-bold text-emerald-500 flex items-center gap-0.5 mt-1 font-sans">
              <UserCheck className="w-3 h-3" />
              <span>تحت پوشش کامل تعهدات SLA</span>
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. SEARCH AND FILTERS TOOLBAR PANEL */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-1 flex-col sm:flex-row items-center gap-3">
            {/* Search Box */}
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="جستجو بر اساس شماره، عنوان یا مشتری..."
                value={ticketSearch}
                onChange={handleSearchChange}
                className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-xs font-semibold focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all duration-150"
              />
            </div>

            {/* Quick dropdown filters */}
            <div className="flex items-center gap-2 w-full sm:w-auto font-bold text-slate-600 dark:text-slate-300">
              {/* Status Selector */}
              <div>
                <select
                  value={ticketStatusFilter}
                  onChange={(e) => { setTicketStatusFilter(e.target.value); setCurrentPage(1); }}
                  className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/40 px-3 py-2.5 outline-none focus:border-brand-500 cursor-pointer font-bold"
                >
                  <option className="dark:bg-slate-800 dark:text-slate-200" value="همه">وضعیت: همه</option>
                  <option className="dark:bg-slate-800 dark:text-slate-200" value="باز">باز</option>
                  <option className="dark:bg-slate-800 dark:text-slate-200" value="در حال بررسی">در حال بررسی</option>
                  <option className="dark:bg-slate-800 dark:text-slate-200" value="منتظر پاسخ مشتری">منتظر پاسخ مشتری</option>
                  <option className="dark:bg-slate-800 dark:text-slate-200" value="بسته شده">بسته شده</option>
                </select>
              </div>

              {/* Priority Selector */}
              <div>
                <select
                  value={ticketPriorityFilter}
                  onChange={(e) => { setTicketPriorityFilter(e.target.value); setCurrentPage(1); }}
                  className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/40 px-3 py-2.5 outline-none focus:border-brand-500 cursor-pointer font-bold"
                >
                  <option className="dark:bg-slate-800 dark:text-slate-200" value="همه">اولویت: همه</option>
                  <option className="dark:bg-slate-800 dark:text-slate-200" value="کم">کم</option>
                  <option className="dark:bg-slate-800 dark:text-slate-200" value="متوسط">متوسط</option>
                  <option className="dark:bg-slate-800 dark:text-slate-200" value="زیاد">زیاد</option>
                  <option className="dark:bg-slate-800 dark:text-slate-200" value="بحرانی">بحرانی</option>
                </select>
              </div>
            </div>

            {/* Toggle advanced settings button */}
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`text-xs px-4 py-2.5 rounded-xl border font-bold flex items-center gap-2 transition-all cursor-pointer ${
                showAdvancedFilters
                  ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 border-brand-500/30'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200/60 dark:border-slate-750 text-slate-600 hover:text-slate-800 dark:text-slate-350 dark:hover:text-slate-200'
              }`}
            >
              <Filter className="w-4 h-4 text-slate-400" />
              <span>فیلترهای پیشرفته</span>
            </button>
          </div>

          <button
            onClick={handleResetAllFilters}
            className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-bold hover:underline self-end lg:self-auto cursor-pointer"
          >
            حذف فیلترها
          </button>
        </div>

        {/* 3.1 EXPANDED ADVANCED FILTERS PANEL */}
        <AnimatePresence>
          {showAdvancedFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold">
                {/* Product Dropdown Selector */}
                <div className="space-y-1.5">
                  <label className="text-slate-450 dark:text-slate-400 block font-bold">محصول مرجع</label>
                  <select
                    value={selectedProductFilter}
                    onChange={(e) => { setSelectedProductFilter(e.target.value); setCurrentPage(1); }}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 outline-none focus:border-brand-500 cursor-pointer font-bold"
                  >
                    <option className="dark:bg-slate-800 dark:text-slate-200" value="همه">همه محصولات</option>
                    {products.map(p => <option className="dark:bg-slate-800 dark:text-slate-200" key={p.id} value={p.name}>{p.name}</option>)}
                  </select>
                </div>

                {/* Customer Dropdown Selector */}
                <div className="space-y-1.5">
                  <label className="text-slate-450 dark:text-slate-400 block font-bold">مشتری سازمانی</label>
                  <select
                    value={selectedCustomerFilter}
                    onChange={(e) => { setSelectedCustomerFilter(e.target.value); setCurrentPage(1); }}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 outline-none focus:border-brand-500 cursor-pointer font-bold"
                  >
                    <option className="dark:bg-slate-800 dark:text-slate-200" value="همه">همه مشتریان</option>
                    {customers.map(c => <option className="dark:bg-slate-800 dark:text-slate-200" key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>

                {/* Assigned Agent Selector */}
                <div className="space-y-1.5">
                  <label className="text-slate-450 dark:text-slate-400 block font-bold">کارشناس مسئول</label>
                  <select
                    value={selectedAgentFilter}
                    onChange={(e) => { setSelectedAgentFilter(e.target.value); setCurrentPage(1); }}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 outline-none focus:border-brand-500 cursor-pointer font-bold"
                  >
                    <option className="dark:bg-slate-800 dark:text-slate-200" value="همه">همه کارشناسان</option>
                    {agentsList.map(a => <option className="dark:bg-slate-800 dark:text-slate-200" key={a.id} value={a.name}>{a.name}</option>)}
                  </select>
                </div>

                {/* Date range selection placeholder */}
                <div className="space-y-1.5">
                  <label className="text-slate-450 dark:text-slate-400 block font-bold">بازه ثبت تیکت (از / تا)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      type="text" 
                      placeholder="۱۴۰۵/۰۱/۰۱" 
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full text-center text-xs px-2.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 outline-none font-mono" 
                    />
                    <input 
                      type="text" 
                      placeholder="۱۴۰۵/۰۵/۳۰" 
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full text-center text-xs px-2.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 outline-none font-mono" 
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 4. QUICK FILTERS CHIPS */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: 'all', label: 'همه تیکت‌ها', count: filteredTickets.length },
          { id: 'my', label: 'تیکت‌های من (امیرحسین)', count: tickets.filter(t => t.assignedTo === 'امیرحسین رضایی').length },
          { id: 'critical', label: 'وضعیت بحرانی', count: tickets.filter(t => t.priority === 'بحرانی').length },
          { id: 'unanswered', label: 'پاسخ داده نشده', count: tickets.filter(t => t.status === 'باز').length },
          { id: 'today', label: 'ثبت شده امروز', count: 3 },
          { id: 'week', label: 'تیکت‌های این هفته', count: tickets.length }
        ].map(c => {
          const isActive = activeQuickFilter === c.id;
          return (
            <button
              key={c.id}
              onClick={() => { setActiveQuickFilter(c.id as 'all' | 'my' | 'critical' | 'unanswered' | 'today' | 'week'); setCurrentPage(1); }}
              className={`flex items-center gap-2.5 px-4.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                isActive 
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-500/10 border border-transparent'
                  : 'bg-white dark:bg-slate-900 text-slate-550 hover:text-slate-800 dark:hover:text-slate-200 border border-slate-200/60 dark:border-slate-800'
              }`}
            >
              <span>{c.label}</span>
              <span className={`text-2xs font-mono px-2 py-0.5 rounded-full ${
                isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
              }`}>
                {c.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 5. BULK ACTION FLOATING BAR (Selected Tickets > 0) */}
      <AnimatePresence>
        {selectedTicketIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[80] bg-slate-900 text-white px-5 py-4 rounded-2xl shadow-2xl border border-slate-800 flex items-center justify-between gap-6 w-full max-w-3xl"
          >
            <div className="flex items-center gap-3">
              <span className="w-5.5 h-5.5 rounded-lg bg-brand-500 flex items-center justify-center text-xs font-black">
                {selectedTicketIds.length}
              </span>
              <span className="text-xs font-black">تیکت انتخاب شده است</span>
            </div>

            <div className="flex items-center gap-2.5 text-xs font-bold">
              {/* Change Status */}
              <div className="relative">
                <button
                  onClick={() => { setShowBulkStatusDropdown(!showBulkStatusDropdown); setShowBulkAgentDropdown(false); }}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white rounded-xl transition-all cursor-pointer"
                >
                  تغییر وضعیت
                </button>
                {showBulkStatusDropdown && (
                  <div className="absolute bottom-11 right-0 w-44 bg-slate-800 border border-slate-750 rounded-xl py-1 shadow-2xl z-50 text-right">
                    {(['باز', 'در حال بررسی', 'منتظر پاسخ مشتری', 'بسته شده'] as any[]).map(st => (
                      <button
                        key={st}
                        onClick={() => handleBulkStatusChange(st)}
                        className="w-full text-right text-slate-300 hover:text-white hover:bg-slate-750 px-4 py-2"
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Assign Agent */}
              <div className="relative">
                <button
                  onClick={() => { setShowBulkAgentDropdown(!showBulkAgentDropdown); setShowBulkStatusDropdown(false); }}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white rounded-xl transition-all cursor-pointer"
                >
                  تخصیص کارشناس
                </button>
                {showBulkAgentDropdown && (
                  <div className="absolute bottom-11 right-0 w-56 bg-slate-800 border border-slate-750 rounded-xl py-1 shadow-2xl z-50 text-right max-h-48 overflow-y-auto">
                    {(() => {
                      const selectedProducts = [...new Set(selectedTicketIds.map(id => tickets.find(t => t.id === id)?.product).filter(Boolean))] as string[];
                      const bulkAssignable = selectedProducts.length
                        ? agentsList.filter(u => selectedProducts.some(p => {
                            const deptIds = departments.filter(d => d.assignedProducts.includes(p)).map(d => d.id);
                            return !u.departmentId || deptIds.includes(u.departmentId);
                          }))
                        : agentsList;
                      return bulkAssignable.length ? bulkAssignable.map(ag => (
                        <button
                          key={ag.id}
                          onClick={() => handleBulkAgentAssign(ag.id, ag.name)}
                          className="w-full text-right text-slate-300 hover:text-white hover:bg-slate-750 px-4 py-2 text-xs"
                        >
                          {ag.name}
                        </button>
                      )) : (
                        <div className="text-slate-500 text-2xs px-4 py-3 text-center">کارشناسی برای این محصول تخصیص داده نشده است</div>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Close Bulk */}
              {(() => {
                const allClosed = selectedTicketIds.every(id => tickets.find(t => t.id === id)?.status === 'بسته شده');
                return (
                  <button
                    onClick={allClosed ? undefined : handleBulkClose}
                    className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                      allClosed
                        ? 'bg-slate-100 dark:bg-slate-800/40 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                        : 'bg-slate-800 hover:bg-slate-750 text-emerald-400 hover:text-emerald-300'
                    }`}
                  >
                    بستن تیکت‌ها
                  </button>
                );
              })()}

              {/* Delete Bulk */}
              <button
                onClick={handleBulkDelete}
                className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 rounded-xl transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <span>|</span>

              <button
                onClick={() => setSelectedTicketIds([])}
                className="p-2 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 6. MAIN TICKETS CONTAINER (Table on Desktop/Tablet, Custom Cards on Mobile) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs overflow-hidden">
        {isLoading ? (
          /* SKELETON LOADING STATE */
          <div className="p-8 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-12 animate-pulse" />
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-40 animate-pulse" />
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-24 animate-pulse" />
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-20 animate-pulse" />
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-16 animate-pulse" />
            </div>
            {[1, 2, 3, 4, 5].map(x => (
              <div key={x} className="flex items-center justify-between py-4">
                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-lg w-10 animate-pulse" />
                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-lg w-64 animate-pulse" />
                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-lg w-28 animate-pulse" />
                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-lg w-20 animate-pulse" />
                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-lg w-12 animate-pulse" />
              </div>
            ))}
          </div>
        ) : paginatedTickets.length > 0 ? (
          <>
            {/* TABLE: Shown on tablet / desktop (sm: block, mobile hidden) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full min-w-[1100px] text-right border-collapse">
                <thead>
                  <tr className="border-b border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-slate-450 dark:text-slate-550 text-2xs font-extrabold uppercase">
                    <th className="p-4 pr-6 w-10">
                      <input
                        type="checkbox"
                        checked={selectedTicketIds.length === paginatedTickets.length && paginatedTickets.length > 0}
                        onChange={handleToggleSelectAll}
                        className="rounded border-slate-300 dark:border-slate-700 text-brand-600 focus:ring-brand-500 cursor-pointer"
                      />
                    </th>
                    <th className="p-4 whitespace-nowrap">شماره تیکت</th>
                    <th className="p-4 pr-1 whitespace-nowrap">موضوع و خلاصه درخواست</th>
                    <th className="p-4 whitespace-nowrap">مشتری</th>
                    <th className="p-4 whitespace-nowrap">محصول / زیرسرویس</th>
                    <th className="p-4 whitespace-nowrap">کارشناس مسئول</th>
                    <th className="p-4 text-center whitespace-nowrap">اولویت</th>
                    <th className="p-4 text-center whitespace-nowrap">وضعیت</th>
                    <th className="p-4 whitespace-nowrap">آخرین بروزرسانی</th>
                    <th className="p-4 pl-6 text-left whitespace-nowrap">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-xs text-slate-700 dark:text-slate-300">
                  {paginatedTickets.map((t) => {
                    const isSelected = selectedTicketIds.includes(t.id);
                    return (
                      <tr
                        key={t.id}
                        className={`group hover:bg-slate-50/60 dark:hover:bg-slate-800/60 transition-colors duration-150 ${
                          isSelected ? 'bg-brand-500/5 dark:bg-brand-500/10' : ''
                        }`}
                      >
                        {/* Checkbox column */}
                        <td className="p-4 pr-6">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectRow(t.id)}
                            className="rounded border-slate-300 dark:border-slate-700 text-brand-600 focus:ring-brand-500 cursor-pointer"
                          />
                        </td>

                        {/* ID */}
                        <td className="p-4 whitespace-nowrap">
                          <span 
                            onClick={() => setSelectedTicketForDetail(t)}
                            className="font-mono font-bold text-slate-400 dark:text-slate-500 hover:text-brand-500 transition-colors cursor-pointer"
                          >
                            #{t.ticketNumber}
                          </span>
                        </td>

                        {/* Title / Subject */}
                        <td className="p-4 pr-1 max-w-xs md:max-w-md">
                          <div className="space-y-1">
                            <span 
                              onClick={() => setSelectedTicketForDetail(t)}
                              className="font-black text-slate-900 dark:text-white leading-relaxed hover:text-brand-500 transition-colors cursor-pointer block line-clamp-1"
                            >
                              {t.title}
                            </span>
                            <span className="text-2xs text-slate-400 dark:text-slate-500 font-bold block">
                              ثبت شده توسط نماینده شرکت
                            </span>
                          </div>
                        </td>

                        {/* Customer */}
                        <td className="p-4 whitespace-nowrap">
                          <div className="font-extrabold text-slate-800 dark:text-slate-200">
                            {t.customer}
                          </div>
                        </td>

                        {/* Product */}
                        <td className="p-4 whitespace-nowrap">
                          <span className="bg-slate-100 dark:bg-slate-800/80 text-slate-650 dark:text-slate-400 px-2.5 py-1 rounded-lg text-2xs font-extrabold border border-slate-150 dark:border-slate-700/50">
                            {t.product}
                          </span>
                        </td>

                        {/* Assigned Agent */}
                        <td className="p-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-brand-600 dark:text-brand-400 flex items-center justify-center font-black text-3xs font-sans border border-slate-200 dark:border-slate-700">
                              {t.assignedTo === 'بدون تخصیص (هوشمند)' ? '؟؟' : t.assignedTo.substring(0, 2)}
                            </div>
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {t.assignedTo}
                            </span>
                          </div>
                        </td>

                        {/* Priority */}
                        <td className="p-4 text-center whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-2xs font-black border ${
                            t.priority === 'بحرانی' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' :
                            t.priority === 'بالا' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' :
                            t.priority === 'متوسط' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' :
                            'bg-slate-100 text-slate-550 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700/80'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              t.priority === 'بحرانی' ? 'bg-rose-50' :
                              t.priority === 'بالا' ? 'bg-amber-500' :
                              t.priority === 'متوسط' ? 'bg-blue-500' : 'bg-slate-400'
                            }`} />
                            {t.priority}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="p-4 text-center whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-2xs font-black ${
                            t.status === 'باز' ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400 border border-blue-500/20' :
                            t.status === 'در حال بررسی' ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400 border border-amber-500/20' :
                            t.status === 'منتظر پاسخ مشتری' ? 'bg-purple-50 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400 border border-purple-500/20' :
                            t.status === 'بسته شده' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400 border border-emerald-500/20' :
                            'bg-slate-100 text-slate-550 dark:bg-slate-800 dark:text-slate-400'
                          }`}>
                            {t.status}
                          </span>
                        </td>

                        {/* Last Activity */}
                        <td className="p-4 whitespace-nowrap">
                          <span className="font-mono text-slate-500 font-bold">{formatTimeAgo(t.updatedAt)}</span>
                        </td>

                        {/* Actions menu */}
                        <td className="p-4 pl-6 text-left whitespace-nowrap">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const isOpen = activeMenuId === t.id;
                              setActiveMenuId(isOpen ? null : t.id);
                              if (!isOpen) {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setMenuFixedStyle({ position: 'fixed', top: `${rect.bottom + 4}px`, left: `${rect.left}px`, zIndex: '9999' });
                              } else {
                                setMenuFixedStyle(undefined);
                              }
                            }}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg text-slate-450 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {/* DROPDOWN MENU */}
                          <AnimatePresence>
                            {activeMenuId === t.id && (
                              <>
                              {activeMenuId !== null && <div className="fixed inset-0 z-[9998] cursor-default" onClick={() => { setActiveMenuId(null); setMenuFixedStyle(undefined); }} />}
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -5 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -5 }}
                                className="w-48 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200/60 dark:border-slate-700 py-1.5 text-right"
                                style={menuFixedStyle}
                              >
                                <button
                                  onClick={() => setSelectedTicketForDetail(t)}
                                  className="w-full text-right text-xs font-bold px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 block"
                                >
                                  مشاهده تیکت
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedTicketForDetail(t);
                                    // Focus reply text box directly
                                    setTimeout(() => {
                                      const replyBox = document.getElementById('reply-textarea');
                                      if (replyBox) replyBox.focus();
                                    }, 200);
                                  }}
                                  className="w-full text-right text-xs font-bold px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 block"
                                >
                                  پاسخ دادن
                                </button>
                                <button
                                  onClick={() => {
                                    const nextStateMap: { [key: string]: Ticket['status'] } = {
                                      'باز': 'در حال بررسی',
                                      'در حال بررسی': 'منتظر پاسخ مشتری',
                                      'منتظر پاسخ مشتری': 'بسته شده',
                                      'بسته شده': 'باز'
                                    };
                                    const nextStatus = nextStateMap[t.status] || 'باز';
                                    setTickets(tickets.map(item => item.id === t.id ? { ...item, status: nextStatus } : item));
                                    updateStatusViaApi(t.id, nextStatus);
                                    showCustomerToast(`وضعیت تیکت ${t.id} به «${nextStatus}» بروزرسانی شد.`, 'success');
                                  }}
                                  className="w-full text-right text-xs font-bold px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 block border-t border-slate-100 dark:border-slate-800"
                                >
                                  تغییر وضعیت نوبتی
                                </button>
                                <button
                                  onClick={() => {
                                    const nextPrd = t.product.includes('Platform') ? 'Identity Protection' : 'Cloud Security Platform';
                                    setTickets(tickets.map(item => item.id === t.id ? { ...item, product: nextPrd } : item));
                                    showCustomerToast(`تیکت به زیرسرویس «${nextPrd}» انتقال یافت.`, 'success');
                                  }}
                                  className="w-full text-right text-xs font-bold px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 block"
                                >
                                  انتقال به محصول دیگر
                                </button>
                                <button
                                  onClick={() => {
                                    const currIndex = agentsList.findIndex(a => a.name === t.assignedTo);
                                    const nextAgent = agentsList[(currIndex + 1) % agentsList.length];
                                    setTickets(tickets.map(item => item.id === t.id ? { ...item, assignedTo: nextAgent.name } : item));
                                    if (nextAgent) {
                                      gql(UPDATE_TICKET, { input: { id: t.id, assignedToId: nextAgent.id } }).catch(() => {});
                                    }
                                    showCustomerToast(`تیکت به کارشناس فنی «${nextAgent.name}» تخصیص یافت.`, 'success');
                                  }}
                                  className="w-full text-right text-xs font-bold px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 block"
                                >
                                  تخصیص به کارشناس دیگر
                                </button>
                                <button
                                  onClick={() => {
                                    setTickets(tickets.map(item => item.id === t.id ? { ...item, status: 'بسته شده' } : item));
                                    updateStatusViaApi(t.id, 'بسته شده');
                                    showCustomerToast(`تیکت ${t.id} به صورت رسمی مختومه اعلام شد.`, 'success');
                                  }}
                                  className="w-full text-right text-xs font-black px-4 py-2 hover:bg-rose-500/10 text-rose-600 dark:text-rose-450 block border-t border-slate-100 dark:border-slate-800"
                                >
                                  بستن رسمی تیکت
                                </button>
                              </motion.div>
                            </>
                            )}
                          </AnimatePresence>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* CARDS GRID: Shown on Mobile (sm: hidden) */}
            <div className="block sm:hidden p-4 space-y-4">
              {paginatedTickets.map((t) => {
                const isSelected = selectedTicketIds.includes(t.id);
                return (
                  <div
                    key={t.id}
                    className={`p-4 rounded-2xl border transition-all space-y-3.5 text-right relative ${
                      isSelected 
                        ? 'bg-brand-500/5 border-brand-500/40 shadow-xs' 
                        : 'bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-2xs font-bold text-slate-400">#{t.ticketNumber}</span>
                      <span className={`px-2 py-0.5 rounded-full text-3xs font-black ${
                        t.priority === 'بحرانی' ? 'bg-rose-500/10 text-rose-600' :
                        t.priority === 'بالا' ? 'bg-amber-500/10 text-amber-600' :
                        'bg-blue-500/10 text-blue-600'
                      }`}>
                        {t.priority}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h4 
                        onClick={() => setSelectedTicketForDetail(t)}
                        className="text-xs font-black text-slate-900 dark:text-white leading-relaxed hover:text-brand-500 transition-colors cursor-pointer"
                      >
                        {t.title}
                      </h4>
                      <p className="text-2xs text-slate-400 font-bold">{t.customer} • {t.product}</p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-2xs">
                      <span className="font-bold text-slate-500">پشتیبان: {t.assignedTo}</span>
                      <span className="font-mono text-slate-400 font-bold">{formatTimeAgo(t.updatedAt)}</span>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className={`px-2 py-0.5 rounded-md text-3xs font-black ${
                        t.status === 'باز' ? 'bg-blue-50 text-blue-600' :
                        t.status === 'منتظر پاسخ مشتری' ? 'bg-purple-50 text-purple-600' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {t.status}
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleSelectRow(t.id)}
                          className={`text-2xs px-2.5 py-1 rounded-lg border font-bold ${
                            isSelected ? 'bg-brand-500 text-white border-transparent' : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}
                        >
                          {isSelected ? 'انتخاب شده' : 'انتخاب'}
                        </button>
                        <button
                          onClick={() => setSelectedTicketForDetail(t)}
                          className="text-2xs px-2.5 py-1 bg-brand-50 text-brand-600 hover:bg-brand-100 rounded-lg font-bold"
                        >
                          مشاهده
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 7. PREMIUM PAGINATION CONTAINER */}
            <div className="bg-slate-50/50 dark:bg-slate-950/20 border-t border-slate-100 dark:border-slate-800/80 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-xs text-slate-550 dark:text-slate-450 font-bold self-center">
                نمایش <span className="font-mono text-slate-800 dark:text-white">{startIndex + 1}</span> تا{' '}
                <span className="font-mono text-slate-800 dark:text-white">{endIndex}</span> از{' '}
                <span className="font-mono text-slate-800 dark:text-white">{totalItems}</span> تیکت پشتیبانی
              </div>

              <div className="flex items-center gap-4 justify-center sm:justify-end">
                {/* Items per page Selector */}
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
                  <span>تعداد در صفحه:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                    className="text-xs border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 px-2 py-1 outline-none cursor-pointer font-bold"
                  >
                    <option className="dark:bg-slate-800 dark:text-slate-200" value={5}>۵ تیکت</option>
                    <option className="dark:bg-slate-800 dark:text-slate-200" value={10}>۱۰ تیکت</option>
                    <option className="dark:bg-slate-800 dark:text-slate-200" value={20}>۲۰ تیکت</option>
                  </select>
                </div>

                {/* Page numbers */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-500 hover:text-slate-700 disabled:opacity-40 disabled:hover:text-slate-500 transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-7.5 h-7.5 text-xs font-black font-mono rounded-lg transition-all cursor-pointer ${
                        currentPage === i + 1
                          ? 'bg-brand-600 text-white shadow-xs'
                          : 'border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-500 hover:text-slate-700 disabled:opacity-40 disabled:hover:text-slate-500 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* EMPTY STATE VIEW */
          <div className="p-16 text-center text-slate-450 dark:text-slate-500 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-slate-450 flex items-center justify-center mx-auto shadow-inner border border-slate-100 dark:border-slate-800">
              <Inbox className="w-8 h-8 opacity-60" />
            </div>
            
            <div className="space-y-1.5 max-w-sm mx-auto">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">هیچ تیکتی پیدا نشد</h3>
              <p className="text-xs text-slate-450 dark:text-slate-500 leading-relaxed font-bold">
                فیلترهای اعمال شده یا جستجوهای جاری شما هیچ تیکتی را برنگرداند. فیلترها را حذف کنید یا نسبت به تعریف تیکت جدید اقدام ورزید.
              </p>
            </div>

            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={handleResetAllFilters}
                className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-black rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                ریست کردن فیلترها
              </button>
              <button
                onClick={() => {
                  setNewTicketCustomer('');
                  setNewTicketProduct('پنل کاربری ');
                  setShowTicketModal(true);
                }}
                className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-black rounded-xl shadow-md shadow-brand-500/15 transition-all cursor-pointer"
              >
                ایجاد تیکت پشتیبانی جدید
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
