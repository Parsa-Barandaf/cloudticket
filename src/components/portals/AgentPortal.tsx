import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Headphones,
  Search,
  Plus,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Pin,
  Star,
  Send,
  User,
  Users,
  ArrowUpRight,
  Lock,
  FileText,
  BookOpen,
  MessageSquare,
  PhoneCall,
  UserCheck,
  BarChart2,
  RefreshCw,
  X,
  AlertCircle,
  Paperclip,
  ChevronDown,
  ChevronLeft,
  Sparkles,
  Shield,
  Command,
  Tag,
  Activity,
  Zap,
  Check,
  ArrowLeft,
  ChevronRight,
  Phone,
  LayoutDashboard,
  Inbox,
  Bell,
  Sun,
  Moon,
  LogOut,
  Menu,
  Building,
  Bookmark,
  SlidersHorizontal,
  Layers,
  Eye,
  CheckSquare,
  Square,
  Trash2,
  Share2,
  Download,
  VolumeX,
  Flame,
  CornerUpLeft,
  MoreVertical,
  Sliders,
  UserPlus,
  ExternalLink
} from 'lucide-react';
import type { Ticket, Product, Customer } from '../../types';
import { PortalRole } from '../../types';
import type { AgentTicketItem } from '../../api/transform-agent';
import { mergeAgentTicketData } from '../../api/transform-agent';
import { gql } from '../../api/graphql';
import { CREATE_TICKET } from '../../api/queries';

interface SupportAgentPortalViewProps {
  userEmail: string;
  ticketsList: Ticket[];
  productsList: Product[];
  customersList: Customer[];
  onLogout: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onSwitchPortalRole?: (role: PortalRole) => void;
  onOpenTicketDetails?: (ticketId: string) => void;
  onOpenCustomerWorkspace?: (customerId: string) => void;
}

export default function SupportAgentPortalView({
  userEmail,
  ticketsList,
  productsList,
  customersList,
  onLogout,
  isDark,
  onToggleTheme,
  onSwitchPortalRole,
  onOpenTicketDetails,
  onOpenCustomerWorkspace
}: SupportAgentPortalViewProps) {
  // Support Agent Navigation Tab
  const [agentTab, setAgentTab] = useState<'dashboard' | 'inbox' | 'my-tickets' | 'related-customers' | 'knowledge-base' | 'saved-replies' | 'team-activity' | 'notifications' | 'profile'>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showPortalSwitchMenu, setShowPortalSwitchMenu] = useState(false);

  // Agent Status / Availability
  const [agentStatus, setAgentStatus] = useState<'آنلاین' | 'مشغول' | 'جلسه' | 'آفلاین' | 'خارج از شیفت'>('آنلاین');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  // Command Palette State
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [commandSearch, setCommandSearch] = useState('');

  // Modals
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [newTicketFields, setNewTicketFields] = useState({ title: '', customerId: '', productId: '', priority: 'متوسط' });
  const [viewingTicketModal, setViewingTicketModal] = useState<AgentTicketItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Queue Filter & Search
  const [queueFilter, setQueueFilter] = useState<'همه' | 'تخصیص داده شده به من' | 'بدون پاسخ' | 'بحرانی' | 'امروز' | 'SLA'>('همه');
  const [queueSearch, setQueueSearch] = useState('');

  // Knowledge Base Search & Saved Replies State
  const [kbSearch, setKbSearch] = useState('');
  const [savedRepliesCategory, setSavedRepliesCategory] = useState<'همه' | 'عمومی' | 'فنی' | 'مالی'>('همه');

  // Active Ticket Reply State
  const [replyMode, setReplyMode] = useState<'reply' | 'note'>('reply');
  const [replyText, setReplyText] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

  // Initial Agent Queue Data — synced from backend via props
  const [agentTickets, setAgentTickets] = useState<AgentTicketItem[]>([]);

  // Sync real ticket data from props to agent ticket state
  const mockMessagesMap = useMemo(() => ({} as Record<string, AgentTicketItem['messages']>), []);
  useEffect(() => {
    if (ticketsList.length > 0) {
      setAgentTickets(mergeAgentTicketData(ticketsList, customersList, userEmail, mockMessagesMap));
    }
  }, [ticketsList, customersList, userEmail, mockMessagesMap]);

  // Selected Active Ticket
  const [activeTicketId, setActiveTicketId] = useState<string>('TKT-1024');

  const activeTicket = useMemo(() => {
    return agentTickets.find(t => t.id === activeTicketId) || agentTickets[0];
  }, [agentTickets, activeTicketId]);

  // Support Ticket Inbox State
  const [inboxFilter, setInboxFilter] = useState<string>('صف کاری من');
  const [inboxSearch, setInboxSearch] = useState<string>('');
  const [inboxSortBy, setInboxSortBy] = useState<'newest' | 'oldest' | 'priority' | 'sla'>('newest');
  const [inboxViewMode, setInboxViewMode] = useState<'detailed' | 'compact'>('detailed');
  const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([]);
  const [starredTicketIds, setStarredTicketIds] = useState<string[]>(['TKT-1024']);
  const [unreadTicketIds, setUnreadTicketIds] = useState<string[]>(['TKT-1024', 'TKT-1023']);
  const [showSavedFiltersModal, setShowSavedFiltersModal] = useState<boolean>(false);
  const [showBulkAssignModal, setShowBulkAssignModal] = useState<boolean>(false);
  const [showBulkStatusModal, setShowBulkStatusModal] = useState<boolean>(false);
  const [showBulkTagModal, setShowBulkTagModal] = useState<boolean>(false);
  const [isRefreshingInbox, setIsRefreshingInbox] = useState<boolean>(false);
  const [previewQuickReplyMode, setPreviewQuickReplyMode] = useState<'reply' | 'note'>('reply');
  const [previewQuickReplyText, setPreviewQuickReplyText] = useState<string>('');
  const [selectedDrawerTicketId, setSelectedDrawerTicketId] = useState<string | null>(null);

  // Filter badge counts
  const filterCounts = useMemo(() => {
    return {
      all: agentTickets.length,
      myQueue: agentTickets.filter(t => t.assignedToMe).length,
      needsAction: agentTickets.filter(t => t.status === 'جدید' || t.status === 'در حال بررسی').length,
      waitingCustomer: agentTickets.filter(t => t.status === 'منتظر پاسخ مشتری').length,
      urgent: agentTickets.filter(t => t.priority === 'بحرانی').length,
      unanswered: agentTickets.filter(t => t.messages.length === 1 || t.messages[t.messages.length - 1]?.sender === 'customer').length,
      today: agentTickets.filter(t => t.createdAt.includes('۱۴۰۳') || t.waitingTime.includes('پیش')).length,
      recentUpdated: agentTickets.length,
      slaRisk: agentTickets.filter(t => t.slaRisk).length,
      pinned: agentTickets.filter(t => t.pinned).length,
    };
  }, [agentTickets]);

  // Filtered tickets for inbox list
  const filteredInboxTickets = useMemo(() => {
    return agentTickets.filter(ticket => {
      if (inboxSearch.trim()) {
        const q = inboxSearch.toLowerCase();
        const matchId = ticket.id.toLowerCase().includes(q);
        const matchTitle = ticket.title.toLowerCase().includes(q);
        const matchCustomer = ticket.customer.toLowerCase().includes(q);
        const matchProduct = ticket.product.toLowerCase().includes(q);
        if (!matchId && !matchTitle && !matchCustomer && !matchProduct) return false;
      }

      switch (inboxFilter) {
        case 'صف کاری من':
          return ticket.assignedToMe;
        case 'نیازمند اقدام':
          return ticket.status === 'جدید' || ticket.status === 'در حال بررسی';
        case 'منتظر پاسخ مشتری':
          return ticket.status === 'منتظر پاسخ مشتری';
        case 'بحرانی':
          return ticket.priority === 'بحرانی';
        case 'بدون پاسخ':
          return ticket.messages.length === 1 || ticket.messages[ticket.messages.length - 1]?.sender === 'customer';
        case 'امروز':
          return ticket.createdAt.includes('۱۴۰۳') || ticket.waitingTime.includes('پیش');
        case 'بروزرسانی اخیر':
          return true;
        case 'SLA در خطر':
          return ticket.slaRisk;
        case 'سنجاق‌شده':
          return ticket.pinned;
        case 'همه':
        default:
          return true;
      }
    }).sort((a, b) => {
      if (inboxSortBy === 'newest') return b.id.localeCompare(a.id);
      if (inboxSortBy === 'oldest') return a.id.localeCompare(b.id);
      if (inboxSortBy === 'priority') {
        const pOrder: Record<string, number> = { 'بحرانی': 4, 'بالا': 3, 'متوسط': 2, 'پایین': 1 };
        return (pOrder[b.priority] || 0) - (pOrder[a.priority] || 0);
      }
      if (inboxSortBy === 'sla') return (b.slaRisk ? 1 : 0) - (a.slaRisk ? 1 : 0);
      return 0;
    });
  }, [agentTickets, inboxSearch, inboxFilter, inboxSortBy]);

  const handleToggleSelectAll = () => {
    if (selectedTicketIds.length === filteredInboxTickets.length) {
      setSelectedTicketIds([]);
    } else {
      setSelectedTicketIds(filteredInboxTickets.map(t => t.id));
    }
  };

  // Saved Replies List
  const savedReplies = [
    { id: 'SR-1', title: 'تایید دریافت و بررسی اولیه', text: 'با سلام و احترام، درخواست شما توسط تیم پشتیبانی فنی  دریافت شد و در حال بررسی است.', category: 'عمومی' },
    { id: 'SR-2', title: 'درخواست فایل لاگ سیستم', text: 'لطفاً فایل‌های گزارش (Log) مربوط به آخرین زمان بروز خطا را جهت بررسی دقیق‌تر ارسال نمایید.', category: 'فنی' },
    { id: 'SR-3', title: 'اعلام رفع کامل مشکل', text: 'با سلام، مشکل گزارش‌شده با موفقیت در هسته مرکزی  برطرف گردید. لطفاً مجدداً بررسی فرمایید.', category: 'عمومی' },
    { id: 'SR-4', title: 'ارسال مستندات لایسنس', text: 'مستندات و کلید لایسنس جدید صادر شده و در بخش کارپوشه سازمان شما فعال گردید.', category: 'مالی' }
  ];

  // Knowledge Base Articles List
  const kbArticles = [
    { id: 'KB-101', title: 'راهنمای رفع خطای لایسنس پلتفرم ابری', category: 'لایسنسینگ', readTime: '۲ دقیقه' },
    { id: 'KB-102', title: 'چک‌لیست کانفیگ اولیه وب‌هوک‌ها و امنیت', category: 'شبکه و امنیت', readTime: '۵ دقیقه' },
    { id: 'KB-103', title: 'دستورالعمل بازیابی کلمه عبور ارشد دسترسی', category: 'کاربران', readTime: '۳ دقیقه' },
    { id: 'KB-104', title: 'نحوه فعال‌سازی SSL در CDN ', category: 'شبکه و CDN', readTime: '۴ دقیقه' }
  ];

  // Team Activity Items
  const teamActivities = [
    { id: 'ACT-1', agent: 'علی رضایی', action: 'پاسخ داد به', ticketId: 'TKT-1019', time: '۲ دقیقه پیش', avatarColor: 'bg-blue-500' },
    { id: 'ACT-2', agent: 'سارا موسوی', action: 'تیکت را حل کرد', ticketId: 'TKT-1008', time: '۱۲ دقیقه پیش', avatarColor: 'bg-emerald-500' },
    { id: 'ACT-3', agent: 'سیستم ', action: 'تیکت جدید ایجاد شد', ticketId: 'TKT-1025', time: '۲۵ دقیقه پیش', avatarColor: 'bg-brand-500' },
    { id: 'ACT-4', agent: 'هشدار SLA', action: 'تیکت نزدیک به اتمام زمان', ticketId: 'TKT-1011', time: '۴۰ دقیقه پیش', avatarColor: 'bg-rose-500' }
  ];

  // Keyboard Navigation for Command Palette (Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setCommandPaletteOpen(false);
        setShowStatusDropdown(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filtered Queue Calculation
  const filteredQueue = useMemo(() => {
    return agentTickets.filter(t => {
      const matchesSearch =
        t.title.toLowerCase().includes(queueSearch.toLowerCase()) ||
        t.id.toLowerCase().includes(queueSearch.toLowerCase()) ||
        t.customer.toLowerCase().includes(queueSearch.toLowerCase()) ||
        t.product.toLowerCase().includes(queueSearch.toLowerCase());

      if (!matchesSearch) return false;

      if (queueFilter === 'تخصیص داده شده به من') return t.assignedToMe;
      if (queueFilter === 'بدون پاسخ') return t.status === 'جدید';
      if (queueFilter === 'بحرانی') return t.priority === 'بحرانی';
      if (queueFilter === 'امروز') return t.createdAt.includes('۱۴۰۳');
      if (queueFilter === 'SLA') return t.slaRisk;

      return true;
    });
  }, [agentTickets, queueFilter, queueSearch]);

  // Toggle Pin & Important
  const togglePin = (ticketId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setAgentTickets(prev =>
      prev.map(t => (t.id === ticketId ? { ...t, pinned: !t.pinned } : t))
    );
    showToast('وضعیت سنجاق تیکت تغییر یافت.');
  };

  const toggleImportant = (ticketId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setAgentTickets(prev =>
      prev.map(t => (t.id === ticketId ? { ...t, important: !t.important } : t))
    );
    showToast('علامت اهمیت تیکت بروزرسانی شد.');
  };

  // Handle Send Reply / Note
  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() && attachedFiles.length === 0) return;

    const newMsg = {
      id: `MSG-${Date.now()}`,
      sender: 'agent' as const,
      senderName: 'امیرحسین رضایی (کارشناس ارشد)',
      text: replyText,
      time: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      isInternalNote: replyMode === 'note',
      attachments: attachedFiles.map(f => ({ name: f.name, size: `${Math.round(f.size / 1024)} KB` }))
    };

    setAgentTickets(prev =>
      prev.map(t => {
        if (t.id === activeTicket.id) {
          const updatedStatus = replyMode === 'reply' ? ('منتظر پاسخ مشتری' as const) : t.status;
          return {
            ...t,
            status: updatedStatus,
            messages: [...t.messages, newMsg]
          };
        }
        return t;
      })
    );

    setReplyText('');
    setAttachedFiles([]);
    showToast(
      replyMode === 'note'
        ? 'یادداشت داخلی با موفقیت ذخیره گردید.'
        : 'پاسخ شما به مشتری ارسال شد و وضعیت تیکت بروز گردید.'
    );
  };

  // Status Change Helper
  const handleChangeStatus = (status: AgentTicketItem['status']) => {
    setAgentTickets(prev =>
      prev.map(t => (t.id === activeTicket.id ? { ...t, status } : t))
    );
    showToast(`وضعیت تیکت به "${status}" تغییر یافت.`);
  };

  // Insert Saved Reply / KB text
  const insertTextToReply = (text: string) => {
    setReplyText(prev => (prev ? `${prev}\n${text}` : text));
    showToast('متن آماده به جعبه پاسخ اضافه شد.');
  };

  // Status Colors Mapping
  const getStatusBadge = (status: AgentTicketItem['status']) => {
    switch (status) {
      case 'جدید':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      case 'در حال بررسی':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'منتظر پاسخ مشتری':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
      case 'حل شده':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'بسته شده':
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
    }
  };

  const getPriorityBadge = (prio: AgentTicketItem['priority']) => {
    switch (prio) {
      case 'بحرانی':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 font-black';
      case 'بالا':
        return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20 font-bold';
      case 'متوسط':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 font-medium';
      case 'پایین':
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20 font-medium';
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'} font-sans flex flex-col text-right transition-colors duration-200`} dir="rtl" id="agent-portal-root">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-2.5 rounded-2xl shadow-xl border border-slate-700/60 flex items-center gap-2.5 text-xs font-bold"
          >
            <Sparkles className="w-4 h-4 text-brand-400 animate-pulse" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

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
                {agentTab === 'dashboard' && 'داشبورد پشتیبانی'}
                {agentTab === 'inbox' && 'صندوق ورودی تیکتها'}
                {agentTab === 'my-tickets' && 'تیکتهای من'}
                {agentTab === 'related-customers' && 'مشتریان مرتبط'}
                {agentTab === 'knowledge-base' && 'پایگاه دانش'}
                {agentTab === 'saved-replies' && 'پاسخهای آماده'}
                {agentTab === 'team-activity' && 'فعالیت تیم'}
                {agentTab === 'notifications' && 'اعلان‌ها'}
                {agentTab === 'profile' && 'پروفایل کارشناس'}
              </span>
            </div>
            <h1 className="text-base font-black text-slate-900 dark:text-white mt-0.5">
              {agentTab === 'dashboard' && 'داشبورد پشتیبانی'}
              {agentTab === 'inbox' && 'صندوق ورودی تیکتها'}
              {agentTab === 'my-tickets' && 'تیکتهای من'}
              {agentTab === 'related-customers' && 'مشتریان مرتبط'}
              {agentTab === 'knowledge-base' && 'پایگاه دانش'}
              {agentTab === 'saved-replies' && 'پاسخهای آماده'}
              {agentTab === 'team-activity' && 'فعالیت تیم'}
              {agentTab === 'notifications' && 'مرکز اعلان‌های سیستم'}
              {agentTab === 'profile' && 'پروفایل کارشناس'}
            </h1>
          </div>
        </div>

        {/* Left Side Elements */}
        <div className="flex items-center gap-3">
          {/* Shift Availability Selector / Status */}
          <div className="relative">
            <button
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <span className={`w-2.5 h-2.5 rounded-full ${
                agentStatus === 'آنلاین' ? 'bg-emerald-500 animate-pulse' :
                agentStatus === 'مشغول' ? 'bg-amber-500' :
                agentStatus === 'جلسه' ? 'bg-indigo-500' : 'bg-slate-400'
              }`} />
              <span className="hidden sm:inline">وضعیت: {agentStatus}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showStatusDropdown && (
              <div className="absolute left-0 mt-2 w-44 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl z-50 p-1.5 space-y-1 text-right">
                {(['آنلاین', 'مشغول', 'جلسه', 'آفلاین', 'خارج از شیفت'] as const).map(st => (
                  <button
                    key={st}
                    onClick={() => {
                      setAgentStatus(st);
                      setShowStatusDropdown(false);
                      showToast(`وضعیت حضور شما به "${st}" تغییر یافت.`);
                    }}
                    className="w-full text-right p-2 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                  >
                    <span className={`w-2 h-2 rounded-full ${
                      st === 'آنلاین' ? 'bg-emerald-500' : st === 'مشغول' ? 'bg-amber-500' : 'bg-slate-400'
                    }`} />
                    <span>{st}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Search Tooltip / Input Trigger */}
          <div className="relative hidden sm:block">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="جستجوی سریع..." 
              className="pl-4 pr-10 py-2 w-44 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-xs focus:w-60 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all duration-300"
              value={queueSearch}
              onChange={(e) => setQueueSearch(e.target.value)}
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
              onClick={() => setAgentTab('notifications')}
              className="p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 text-slate-500 hover:text-brand-500 dark:text-slate-400 dark:hover:text-brand-400 hover:scale-105 active:scale-95 transition-all cursor-pointer relative"
              id="notifications-toggle"
            >
              <Bell className="w-4.5 h-4.5" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500" />
            </button>
          </div>

          {/* User Profile Mini Block */}
          <div className="h-9 w-[1px] bg-slate-200 dark:bg-slate-800" />
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold text-xs shadow-inner">
              ار
            </div>
            <div className="hidden lg:flex flex-col text-right">
              <span className="text-xs font-black text-slate-800 dark:text-slate-200">امیرحسین رضایی</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">کارشناس ارشد پشتیبانی</span>
            </div>
          </div>
        </div>
      </header>

      {/* WORKSPACE LAYOUT CONTAINER */}
      <div className="flex-1 flex" id="main-workspace-container">
        
        {/* FIXED RIGHT SIDEBAR NAVIGATION */}
        <aside 
          className={`md:sticky md:top-0 fixed inset-y-0 right-0 z-30 bg-white dark:bg-slate-900 border-l border-slate-200/60 dark:border-slate-800/60 pt-20 pb-6 transform transition-all duration-300 ease-in-out md:translate-x-0 md:pt-6 ${
            sidebarCollapsed ? 'md:w-20 md:px-2.5' : 'md:w-64 md:px-4'
          } w-64 px-4 ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col justify-between`}
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

          <div>
            {/* Logo / Brand Area */}
            <div className={`flex items-center ${sidebarCollapsed ? 'justify-center mb-8' : 'gap-3 mb-8 px-2'}`}>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-white shadow-md shadow-brand-500/20 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              {!sidebarCollapsed && (
                <div className="text-right">
                  <span className="text-sm font-black text-slate-900 dark:text-white block tracking-tight">سامانه ابری مدیریت مشتریان</span>
                  <span className="text-[10px] text-brand-600 dark:text-brand-400 font-bold block">پرتال پشتیبانی</span>
                </div>
              )}
            </div>

            {/* Navigation Items */}
            <nav className="space-y-1">
              <button
                onClick={() => { setAgentTab('dashboard'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center transition-all duration-200 ${sidebarCollapsed ? 'justify-center px-2 py-3' : 'gap-3 px-4 py-3'} rounded-xl text-xs font-semibold cursor-pointer ${
                  agentTab === 'dashboard' 
                    ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 border-r-4 border-brand-500' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title={sidebarCollapsed ? "داشبورد" : undefined}
              >
                <LayoutDashboard className="w-4.5 h-4.5 shrink-0" />
                {!sidebarCollapsed && <span className="whitespace-nowrap">داشبورد</span>}
              </button>

              <button
                onClick={() => { setAgentTab('inbox'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center transition-all duration-200 ${sidebarCollapsed ? 'justify-center px-2 py-3' : 'gap-3 px-4 py-3'} rounded-xl text-xs font-semibold cursor-pointer ${
                  agentTab === 'inbox' 
                    ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 border-r-4 border-brand-500' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title={sidebarCollapsed ? "صندوق ورودی تیکتها" : undefined}
              >
                <Inbox className="w-4.5 h-4.5 shrink-0" />
                {!sidebarCollapsed && <span className="whitespace-nowrap">صندوق ورودی تیکتها</span>}
                {!sidebarCollapsed && (
                  <span className="mr-auto text-[10px] bg-rose-500/10 text-rose-500 font-extrabold px-1.5 py-0.5 rounded-md border border-rose-500/20">
                    ۸
                  </span>
                )}
              </button>

              <button
                onClick={() => { setAgentTab('my-tickets'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center transition-all duration-200 ${sidebarCollapsed ? 'justify-center px-2 py-3' : 'gap-3 px-4 py-3'} rounded-xl text-xs font-semibold cursor-pointer ${
                  agentTab === 'my-tickets' 
                    ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 border-r-4 border-brand-500' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title={sidebarCollapsed ? "تیکتهای من" : undefined}
              >
                <Headphones className="w-4.5 h-4.5 shrink-0" />
                {!sidebarCollapsed && <span className="whitespace-nowrap">تیکتهای من</span>}
                {!sidebarCollapsed && (
                  <span className="mr-auto text-[10px] bg-amber-500/10 text-amber-500 font-extrabold px-1.5 py-0.5 rounded-md border border-amber-500/20">
                    ۲۴
                  </span>
                )}
              </button>

              <button
                onClick={() => { setAgentTab('related-customers'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center transition-all duration-200 ${sidebarCollapsed ? 'justify-center px-2 py-3' : 'gap-3 px-4 py-3'} rounded-xl text-xs font-semibold cursor-pointer ${
                  agentTab === 'related-customers' 
                    ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 border-r-4 border-brand-500' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title={sidebarCollapsed ? "مشتریان مرتبط" : undefined}
              >
                <Users className="w-4.5 h-4.5 shrink-0" />
                {!sidebarCollapsed && <span className="whitespace-nowrap">مشتریان مرتبط</span>}
              </button>

              <button
                onClick={() => { setAgentTab('knowledge-base'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center transition-all duration-200 ${sidebarCollapsed ? 'justify-center px-2 py-3' : 'gap-3 px-4 py-3'} rounded-xl text-xs font-semibold cursor-pointer ${
                  agentTab === 'knowledge-base' 
                    ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 border-r-4 border-brand-500' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title={sidebarCollapsed ? "پایگاه دانش" : undefined}
              >
                <BookOpen className="w-4.5 h-4.5 shrink-0" />
                {!sidebarCollapsed && <span className="whitespace-nowrap">پایگاه دانش</span>}
              </button>

              <button
                onClick={() => { setAgentTab('saved-replies'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center transition-all duration-200 ${sidebarCollapsed ? 'justify-center px-2 py-3' : 'gap-3 px-4 py-3'} rounded-xl text-xs font-semibold cursor-pointer ${
                  agentTab === 'saved-replies' 
                    ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 border-r-4 border-brand-500' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title={sidebarCollapsed ? "پاسخهای آماده" : undefined}
              >
                <MessageSquare className="w-4.5 h-4.5 shrink-0" />
                {!sidebarCollapsed && <span className="whitespace-nowrap">پاسخهای آماده</span>}
              </button>

              <button
                onClick={() => { setAgentTab('team-activity'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center transition-all duration-200 ${sidebarCollapsed ? 'justify-center px-2 py-3' : 'gap-3 px-4 py-3'} rounded-xl text-xs font-semibold cursor-pointer ${
                  agentTab === 'team-activity' 
                    ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 border-r-4 border-brand-500' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title={sidebarCollapsed ? "فعالیت تیم" : undefined}
              >
                <Activity className="w-4.5 h-4.5 shrink-0" />
                {!sidebarCollapsed && <span className="whitespace-nowrap">فعالیت تیم</span>}
              </button>

              <button
                onClick={() => { setAgentTab('notifications'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center transition-all duration-200 ${sidebarCollapsed ? 'justify-center px-2 py-3' : 'gap-3 px-4 py-3'} rounded-xl text-xs font-semibold cursor-pointer ${
                  agentTab === 'notifications' 
                    ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 border-r-4 border-brand-500' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title={sidebarCollapsed ? "اعلانها" : undefined}
              >
                <Bell className="w-4.5 h-4.5 shrink-0" />
                {!sidebarCollapsed && <span className="whitespace-nowrap">اعلانها</span>}
              </button>

              <button
                onClick={() => { setAgentTab('profile'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center transition-all duration-200 ${sidebarCollapsed ? 'justify-center px-2 py-3' : 'gap-3 px-4 py-3'} rounded-xl text-xs font-semibold cursor-pointer ${
                  agentTab === 'profile' 
                    ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 border-r-4 border-brand-500' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title={sidebarCollapsed ? "پروفایل" : undefined}
              >
                <User className="w-4.5 h-4.5 shrink-0" />
                {!sidebarCollapsed && <span className="whitespace-nowrap">پروفایل</span>}
              </button>
            </nav>
          </div>

          {/* Sidebar Footer */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
            {/* Quick Portal Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowPortalSwitchMenu(!showPortalSwitchMenu)}
                className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:border-brand-500 transition-all cursor-pointer`}
              >
                <div className="flex items-center gap-2">
                  <Headphones className="w-4 h-4 text-brand-500 shrink-0" />
                  {!sidebarCollapsed && <span>پرتال پشتیبانی</span>}
                </div>
                {!sidebarCollapsed && <span className="text-[9px] bg-brand-500/10 text-brand-500 px-1.5 py-0.5 rounded font-black">تغییر پرتال</span>}
              </button>

              {showPortalSwitchMenu && (
                <div className="absolute bottom-12 right-0 left-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1.5 space-y-1 z-50 text-right">
                  <div className="text-[10px] text-slate-400 px-2 py-1 font-bold">تغییر پرتال فعال:</div>
                  <button
                    onClick={() => { onSwitchPortalRole?.('admin'); setShowPortalSwitchMenu(false); }}
                    className="w-full text-right p-2 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                  >
                    <Building className="w-3.5 h-3.5 text-blue-500" />
                    <span>پرتال مدیریت سیستم</span>
                  </button>
                  <button
                    onClick={() => { onSwitchPortalRole?.('customer'); setShowPortalSwitchMenu(false); }}
                    className="w-full text-right p-2 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5 text-emerald-500" />
                    <span>پرتال مشتریان سازمانی</span>
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

        {/* WORKSPACE MAIN BODY */}
        <main className="p-6 flex-1 space-y-6 overflow-x-hidden">
          {agentTab === 'dashboard' && (
            <div className="space-y-6">
              {/* 4 COMPACT ACTIONABLE KPI CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {/* Card 1: تیکتهای نیازمند اقدام */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-amber-500/20 dark:border-amber-500/30 shadow-xs flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">تیکتهای نیازمند اقدام</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">12</span>
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-extrabold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                        اقدام ضروری
                      </span>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                </div>

                {/* Card 2: SLA نزدیک */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-rose-500/20 dark:border-rose-500/30 shadow-xs flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">SLA نزدیک</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">5</span>
                      <span className="text-[10px] text-rose-600 dark:text-rose-400 font-extrabold bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                        کمتر از ۱ ساعت
                      </span>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>

                {/* Card 3: منتظر پاسخ مشتری */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-indigo-500/20 dark:border-indigo-500/30 shadow-xs flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">منتظر پاسخ مشتری</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">8</span>
                      <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-extrabold bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
                        پاسخ ارسال شد
                      </span>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                </div>

                {/* Card 4: حل شده امروز */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-emerald-500/20 dark:border-emerald-500/30 shadow-xs flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">حل شده امروز</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">42</span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                        +۱۸٪ رشد
                      </span>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* CLEAN DASHBOARD OPERATIONAL OVERVIEW SECTION */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                
                {/* PERFORMANCE & QUALITY METRICS GRID (8 Cols) */}
                <div className="lg:col-span-8 space-y-5">
                  {/* Quality Metrics Box */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 p-5 shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-brand-500" />
                        <h2 className="text-sm font-black text-slate-900 dark:text-white">شاخص‌های کیفیت و پاسخگویی شیفت</h2>
                      </div>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                        وضعیت مطلوب شیفت
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Metric 1 */}
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60 space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                          <span>میانگین زمان اولین پاسخ (FRT)</span>
                          <Zap className="w-4 h-4 text-amber-500" />
                        </div>
                        <div className="flex items-baseline justify-between">
                          <span className="text-xl font-black text-slate-900 dark:text-white font-mono">۱۲ دقیقه</span>
                          <span className="text-[10px] text-emerald-500 font-extrabold bg-emerald-500/10 px-2 py-0.5 rounded">
                            ۵ دقیقه سریع‌تر از هدف
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-amber-500 h-full rounded-full" style={{ width: '82%' }} />
                        </div>
                      </div>

                      {/* Metric 2 */}
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60 space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                          <span>رضایت مشتریان (CSAT)</span>
                          <Star className="w-4 h-4 text-yellow-500" />
                        </div>
                        <div className="flex items-baseline justify-between">
                          <span className="text-xl font-black text-slate-900 dark:text-white font-mono">۹۸.۴٪</span>
                          <span className="text-[10px] text-emerald-500 font-extrabold bg-emerald-500/10 px-2 py-0.5 rounded">
                            از ۱۴۲ بازخورد
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 h-full rounded-full" style={{ width: '98%' }} />
                        </div>
                      </div>

                      {/* Metric 3 */}
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60 space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                          <span>پایبندی به زمان‌بندی SLA</span>
                          <Shield className="w-4 h-4 text-brand-500" />
                        </div>
                        <div className="flex items-baseline justify-between">
                          <span className="text-xl font-black text-slate-900 dark:text-white font-mono">۹۹.۱٪</span>
                          <span className="text-[10px] text-brand-500 font-extrabold bg-brand-500/10 px-2 py-0.5 rounded">
                            استاندارد عالی
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-brand-500 h-full rounded-full" style={{ width: '99%' }} />
                        </div>
                      </div>

                      {/* Metric 4 */}
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60 space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                          <span>میانگین زمان بستن تیکت</span>
                          <Clock className="w-4 h-4 text-indigo-500" />
                        </div>
                        <div className="flex items-baseline justify-between">
                          <span className="text-xl font-black text-slate-900 dark:text-white font-mono">۴۵ دقیقه</span>
                          <span className="text-[10px] text-indigo-500 font-extrabold bg-indigo-500/10 px-2 py-0.5 rounded">
                            بهینه‌شده
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-indigo-500 h-full rounded-full" style={{ width: '75%' }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* QUICK OPERATIONAL SHORTCUT CARDS */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 p-5 shadow-xs space-y-4">
                    <h3 className="text-xs font-black text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
                      دسترسی سریع به ابزارهای پشتیبانی
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        onClick={() => setAgentTab('inbox')}
                        className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 hover:bg-brand-50 dark:hover:bg-brand-500/10 border border-slate-200/60 dark:border-slate-800 text-right transition-all group cursor-pointer flex items-center justify-between"
                      >
                        <div className="space-y-1">
                          <span className="text-xs font-black text-slate-900 dark:text-white group-hover:text-brand-500 transition-colors block">
                            صندوق ورودی تیکت‌ها
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">
                            مشاهده و مدیریت کلیه تیکت‌های دریافتی
                          </span>
                        </div>
                        <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:text-brand-500 group-hover:-translate-x-1 transition-all shrink-0" />
                      </button>

                      <button
                        onClick={() => setAgentTab('saved-replies')}
                        className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 hover:bg-brand-50 dark:hover:bg-brand-500/10 border border-slate-200/60 dark:border-slate-800 text-right transition-all group cursor-pointer flex items-center justify-between"
                      >
                        <div className="space-y-1">
                          <span className="text-xs font-black text-slate-900 dark:text-white group-hover:text-brand-500 transition-colors block">
                            پاسخ‌های آماده (Canned Responses)
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">
                            ارسال سریع قالب‌های پاسخ استاندارد
                          </span>
                        </div>
                        <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:text-brand-500 group-hover:-translate-x-1 transition-all shrink-0" />
                      </button>

                      <button
                        onClick={() => setAgentTab('knowledge-base')}
                        className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 hover:bg-brand-50 dark:hover:bg-brand-500/10 border border-slate-200/60 dark:border-slate-800 text-right transition-all group cursor-pointer flex items-center justify-between"
                      >
                        <div className="space-y-1">
                          <span className="text-xs font-black text-slate-900 dark:text-white group-hover:text-brand-500 transition-colors block">
                            پایگاه دانش و راهنماها
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">
                            جستجو در مستندات فنی و راهنمای حل مشکلات
                          </span>
                        </div>
                        <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:text-brand-500 group-hover:-translate-x-1 transition-all shrink-0" />
                      </button>

                      <button
                        onClick={() => setAgentTab('related-customers')}
                        className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 hover:bg-brand-50 dark:hover:bg-brand-500/10 border border-slate-200/60 dark:border-slate-800 text-right transition-all group cursor-pointer flex items-center justify-between"
                      >
                        <div className="space-y-1">
                          <span className="text-xs font-black text-slate-900 dark:text-white group-hover:text-brand-500 transition-colors block">
                            اطلاعات و سابقه مشتریان
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">
                            بررسی سطوح پشتیبانی و تیکت‌های قبلی کاربران
                          </span>
                        </div>
                        <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:text-brand-500 group-hover:-translate-x-1 transition-all shrink-0" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* SHIFT CHECKLIST & SYSTEM NOTICES (4 Cols) */}
                <div className="lg:col-span-4 space-y-5">
                  {/* Shift Routine Checklist */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 p-5 shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                      <h3 className="text-xs font-black text-slate-900 dark:text-white">چک‌لیست روزانه شیفت</h3>
                      <span className="text-[10px] text-brand-500 font-mono font-bold">۲ از ۴ انجام شده</span>
                    </div>

                    <div className="space-y-2.5 text-xs">
                      <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800 cursor-pointer">
                        <input type="checkbox" defaultChecked className="rounded accent-brand-500 w-4 h-4" />
                        <span className="text-slate-700 dark:text-slate-300 font-medium line-through opacity-70">
                          بررسی تیکت‌های دارای اولویت بحرانی
                        </span>
                      </label>

                      <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800 cursor-pointer">
                        <input type="checkbox" defaultChecked className="rounded accent-brand-500 w-4 h-4" />
                        <span className="text-slate-700 dark:text-slate-300 font-medium line-through opacity-70">
                          پاسخگویی به موارد در آستانه SLA
                        </span>
                      </label>

                      <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800 cursor-pointer">
                        <input type="checkbox" className="rounded accent-brand-500 w-4 h-4" />
                        <span className="text-slate-800 dark:text-slate-200 font-bold">
                          هماهنگی با لایه ۲ فنی برای مشکلات دیتابیس
                        </span>
                      </label>

                      <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800 cursor-pointer">
                        <input type="checkbox" className="rounded accent-brand-500 w-4 h-4" />
                        <span className="text-slate-800 dark:text-slate-200 font-bold">
                          ثبت خلاصه عملکرد شیفت جاری
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* System & Team Announcements */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 p-5 shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <h3 className="text-xs font-black text-slate-900 dark:text-white">اطلاعیه‌های مهم تیم پشتیبانی</h3>
                      </div>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-amber-900 dark:text-amber-200 space-y-1">
                        <span className="text-[10px] font-black font-mono text-amber-600 dark:text-amber-400 block">
                          امشب ساعت ۲۴:۰۰
                        </span>
                        <p className="font-bold leading-relaxed text-[11px]">
                          بروزرسانی زیرساخت ابری  به مدت ۱۵ دقیقه صورت می‌گیرد.
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-brand-500/5 border border-brand-500/20 text-slate-800 dark:text-slate-200 space-y-1">
                        <span className="text-[10px] font-black font-mono text-brand-500 block">
                          امروز ۱۰:۳۰
                        </span>
                        <p className="font-bold leading-relaxed text-[11px]">
                          قالب‌های جدید پاسخ آماده برای مشکلات درگاه پرداخت اضافه شد.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* SUPPORT TICKET INBOX VIEW (3-COLUMN WORKSPACE) */}
          {(agentTab === 'inbox' || agentTab === 'my-tickets') && (
            <div className="space-y-4 dir-rtl text-right">
              {/* PAGE HEADER WITH DROPDOWN FILTERS */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 p-4 shadow-xs">
                <div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center shrink-0">
                      <Inbox className="w-4 h-4" />
                    </div>
                    <div>
                      <h1 className="text-base font-black text-slate-900 dark:text-white">
                        صندوق ورودی تیکتها
                      </h1>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                        مدیریت و بررسی درخواستهای پشتیبانی با پاسخ‌دهی سریع
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Smart Filters Dropdown */}
                  <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <Filter className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                    <select
                      value={inboxFilter}
                      onChange={e => setInboxFilter(e.target.value)}
                      className="bg-transparent text-slate-900 dark:text-white font-extrabold text-xs outline-none cursor-pointer pr-1"
                    >
                      <option value="صف کاری من" className="dark:bg-slate-900">صف کاری من ({filterCounts.myQueue})</option>
                      <option value="نیازمند اقدام" className="dark:bg-slate-900">نیازمند اقدام ({filterCounts.needsAction})</option>
                      <option value="منتظر پاسخ مشتری" className="dark:bg-slate-900">منتظر پاسخ مشتری ({filterCounts.waitingCustomer})</option>
                      <option value="بحرانی" className="dark:bg-slate-900">بحرانی ({filterCounts.urgent})</option>
                      <option value="بدون پاسخ" className="dark:bg-slate-900">بدون پاسخ ({filterCounts.unanswered})</option>
                      <option value="امروز" className="dark:bg-slate-900">امروز ({filterCounts.today})</option>
                      <option value="بروزرسانی اخیر" className="dark:bg-slate-900">بروزرسانی اخیر ({filterCounts.recentUpdated})</option>
                      <option value="SLA در خطر" className="dark:bg-slate-900">SLA در خطر 🔥 ({filterCounts.slaRisk})</option>
                      <option value="سنجاق‌شده" className="dark:bg-slate-900">سنجاق‌شده 📌 ({filterCounts.pinned})</option>
                      <option value="همه" className="dark:bg-slate-900">همه تیکت‌ها ({filterCounts.all})</option>
                    </select>
                  </div>

                  {/* Saved Filters Dropdown */}
                  <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <Bookmark className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <select
                      onChange={e => {
                        if (e.target.value === 'golden') {
                          setInboxFilter('همه');
                          setInboxSearch('پتروشیمی');
                        } else if (e.target.value === 'ssl') {
                          setInboxFilter('همه');
                          setInboxSearch('SSL');
                        } else if (e.target.value === 'new') {
                          setShowSavedFiltersModal(true);
                        }
                        e.target.value = '';
                      }}
                      defaultValue=""
                      className="bg-transparent text-slate-900 dark:text-white font-extrabold text-xs outline-none cursor-pointer pr-1"
                    >
                      <option value="" disabled className="dark:bg-slate-900">فیلترهای شخصی ذخیره‌شده...</option>
                      <option value="golden" className="dark:bg-slate-900">تیکت‌های مشتریان طلایی (۲)</option>
                      <option value="ssl" className="dark:bg-slate-900">خطاهای امنیت و SSL (۱)</option>
                      <option value="new" className="dark:bg-slate-900">+ تعریف فیلتر جدید</option>
                    </select>
                  </div>

                  <button
                    onClick={() => setShowNewTicketModal(true)}
                    className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-brand-500/20 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>ثبت تیکت</span>
                  </button>
                </div>
              </div>

              {/* UNCLUTTERED FULL-WIDTH INBOX WORKSPACE */}
              <div className="w-full space-y-3">
                {/* INBOX LIST CONTAINER */}
                <div className="space-y-3">
                  {/* TOOLBAR & SEARCH */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 p-3.5 shadow-xs space-y-3">
                    {/* Row 1: Search & Refresh */}
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input
                          type="text"
                          value={inboxSearch}
                          onChange={e => setInboxSearch(e.target.value)}
                          placeholder="جستجوی شماره تیکت، نام مشتری یا عنوان..."
                          className="w-full pr-10 pl-3 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium outline-none focus:border-brand-500 transition-colors placeholder:text-slate-400"
                        />
                        {inboxSearch && (
                          <button
                            onClick={() => setInboxSearch('')}
                            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          setIsRefreshingInbox(true);
                          setTimeout(() => setIsRefreshingInbox(false), 600);
                        }}
                        className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer shrink-0"
                        title="بروزرسانی لیست"
                      >
                        <RefreshCw className={`w-4 h-4 ${isRefreshingInbox ? 'animate-spin text-brand-500' : ''}`} />
                      </button>
                    </div>

                    {/* Row 2: Sort, View mode & Select All */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleToggleSelectAll}
                          className="p-1 rounded text-slate-500 hover:text-brand-500 cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                          title="انتخاب همه"
                        >
                          {selectedTicketIds.length > 0 && selectedTicketIds.length === filteredInboxTickets.length ? (
                            <CheckSquare className="w-4 h-4 text-brand-500" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                          )}
                          <span>{selectedTicketIds.length > 0 ? `${selectedTicketIds.length} انتخاب` : 'انتخاب همه'}</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2.5">
                        {/* Sort Dropdown */}
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">مرتب‌سازی:</span>
                          <select
                            value={inboxSortBy}
                            onChange={e => setInboxSortBy(e.target.value as any)}
                            className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
                          >
                            <option value="newest">جدیدترین</option>
                            <option value="oldest">قدیمی‌ترین</option>
                            <option value="priority">اولویت</option>
                            <option value="sla">ریسک SLA</option>
                          </select>
                        </div>

                        {/* View Mode Toggle */}
                        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[11px]">
                          <button
                            onClick={() => setInboxViewMode('detailed')}
                            className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                              inboxViewMode === 'detailed' ? 'bg-white dark:bg-slate-900 text-brand-500 font-extrabold shadow-2xs' : 'text-slate-400'
                            }`}
                          >
                            مفصل
                          </button>
                          <button
                            onClick={() => setInboxViewMode('compact')}
                            className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                              inboxViewMode === 'compact' ? 'bg-white dark:bg-slate-900 text-brand-500 font-extrabold shadow-2xs' : 'text-slate-400'
                            }`}
                          >
                            فشرده
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* BULK ACTIONS FLOATING TOOLBAR */}
                  <AnimatePresence>
                    {selectedTicketIds.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-brand-600 text-white p-3 rounded-2xl shadow-lg flex items-center justify-between text-xs font-bold gap-2"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{selectedTicketIds.length} تیکت انتخاب شده</span>
                        </div>

                        <div className="flex items-center gap-2 text-xs">
                          <button
                            onClick={() => setShowBulkAssignModal(true)}
                            className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
                          >
                            تخصیص
                          </button>
                          <button
                            onClick={() => setShowBulkStatusModal(true)}
                            className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
                          >
                            تغییر وضعیت
                          </button>
                          <button
                            onClick={() => setShowBulkTagModal(true)}
                            className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
                          >
                            برچسب
                          </button>
                          <button
                            onClick={() => {
                              setSelectedTicketIds([]);
                              showToast('عملیات بستن گروهی اجرا گردید.');
                            }}
                            className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-colors cursor-pointer"
                          >
                            بستن
                          </button>
                          <button
                            onClick={() => setSelectedTicketIds([])}
                            className="p-1 rounded hover:bg-white/10 cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* INBOX ITEMS STREAM */}
                  <div className="space-y-2.5 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
                    {filteredInboxTickets.length === 0 ? (
                      /* EMPTY STATE */
                      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 p-12 text-center space-y-3">
                        <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                          <Inbox className="w-7 h-7" />
                        </div>
                        <div>
                          <h3 className="text-base font-black text-slate-900 dark:text-white">
                            هیچ تیکتی در این فیلتر یا جستجو وجود ندارد
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 leading-relaxed max-w-sm mx-auto">
                            با تغییر فیلترهای بالای صفحه یا پاک کردن عبارت جستجو، لیست کامل تیکت‌ها را مشاهده فرمایید.
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setInboxFilter('همه');
                            setInboxSearch('');
                          }}
                          className="px-4 py-2 rounded-xl bg-brand-500 text-white font-bold text-xs shadow-md cursor-pointer hover:bg-brand-600 transition-all inline-flex items-center gap-1.5"
                        >
                          <span>نمایش همه تیکت‌ها</span>
                        </button>
                      </div>
                    ) : (
                      filteredInboxTickets.map(t => {
                        const isSelected = activeTicketId === t.id;
                        const isChecked = selectedTicketIds.includes(t.id);
                        const isUnread = unreadTicketIds.includes(t.id);
                        const isStarred = starredTicketIds.includes(t.id);

                        return (
                          <div
                            key={t.id}
                            onClick={() => {
                              setActiveTicketId(t.id);
                              setSelectedDrawerTicketId(t.id);
                            }}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer relative group ${
                              isSelected
                                ? 'bg-brand-50/70 dark:bg-brand-500/10 border-brand-500 shadow-xs ring-1 ring-brand-500/30'
                                : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800/80 hover:border-brand-500/40 hover:bg-slate-50/60 dark:hover:bg-slate-950/40'
                            }`}
                          >
                            {/* Unread Indicator Pill */}
                            {isUnread && (
                              <span className="absolute top-4 right-3 w-2.5 h-2.5 rounded-full bg-brand-500 ring-2 ring-white dark:ring-slate-900" />
                            )}

                            <div className="space-y-2.5 pr-3">
                              {/* Top Row: Checkbox, ID, Customer, Status, Priority */}
                              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                                <div className="flex items-center gap-2.5">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={e => {
                                      e.stopPropagation();
                                      if (isChecked) {
                                        setSelectedTicketIds(selectedTicketIds.filter(id => id !== t.id));
                                      } else {
                                        setSelectedTicketIds([...selectedTicketIds, t.id]);
                                      }
                                    }}
                                    className="rounded accent-brand-500 cursor-pointer w-4 h-4"
                                  />
                                  <span className="font-mono font-black text-brand-600 dark:text-brand-400 text-xs">
                                    {t.id}
                                  </span>
                                  <span className="font-bold text-slate-800 dark:text-slate-200">
                                    {t.customer}
                                  </span>
                                  <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-md font-extrabold border border-amber-500/20">
                                    {t.customerTier}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className={`px-2.5 py-0.5 rounded-md border text-[11px] font-bold ${getPriorityBadge(t.priority)}`}>
                                    {t.priority}
                                  </span>
                                  <span className={`px-2.5 py-0.5 rounded-md border text-[11px] font-bold ${getStatusBadge(t.status)}`}>
                                    {t.status}
                                  </span>
                                </div>
                              </div>

                              {/* Middle Row: Title & Latest Message Preview */}
                              <div>
                                <h3 className={`text-sm ${isUnread ? 'font-black text-slate-900 dark:text-white' : 'font-bold text-slate-800 dark:text-slate-200'} leading-relaxed`}>
                                  {t.title}
                                </h3>
                                {inboxViewMode === 'detailed' && t.messages.length > 0 && (
                                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium line-clamp-1 mt-1 dir-rtl">
                                    <span className="font-bold text-slate-700 dark:text-slate-300">{t.messages[t.messages.length - 1].senderName}:</span> {t.messages[t.messages.length - 1].text}
                                  </p>
                                )}
                              </div>

                              {/* Bottom Row: Tags, SLA, Time & Action Hint */}
                              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 text-xs text-slate-400 font-medium">
                                <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
                                  <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded">
                                    {t.product}
                                  </span>

                                  {t.slaRisk && (
                                    <span className="flex items-center gap-1 text-[10px] text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded font-mono font-bold border border-rose-500/20 shrink-0">
                                      <Clock className="w-3 h-3 animate-pulse" />
                                      <span>SLA: {t.slaRemaining}</span>
                                    </span>
                                  )}

                                  {t.pinned && (
                                    <Pin className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                                  )}

                                  <span className="font-mono text-[11px] text-slate-400 shrink-0">{t.waitingTime}</span>
                                </div>

                                {/* Item Quick Action Buttons */}
                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] text-brand-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                    <span>مشاهده و گفتگو</span>
                                    <MessageSquare className="w-3.5 h-3.5" />
                                  </span>

                                  <button
                                    onClick={e => {
                                      e.stopPropagation();
                                      if (isStarred) {
                                        setStarredTicketIds(starredTicketIds.filter(id => id !== t.id));
                                      } else {
                                        setStarredTicketIds([...starredTicketIds, t.id]);
                                      }
                                    }}
                                    className="p-1 text-slate-400 hover:text-amber-500 cursor-pointer"
                                    title="ستاره‌دار"
                                  >
                                    <Star className={`w-4 h-4 ${isStarred ? 'fill-amber-500 text-amber-500' : ''}`} />
                                  </button>

                                  <button
                                    onClick={e => {
                                      e.stopPropagation();
                                      setAgentTickets(prev =>
                                        prev.map(x => (x.id === t.id ? { ...x, pinned: !x.pinned } : x))
                                      );
                                    }}
                                    className="p-1 text-slate-400 hover:text-brand-500 cursor-pointer"
                                    title="سنجاق‌کردن"
                                  >
                                    <Pin className={`w-4 h-4 ${t.pinned ? 'fill-brand-500 text-brand-500' : ''}`} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* SHORTCUTS HINT BAR */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/60 dark:border-slate-800 text-xs text-slate-400 font-bold flex flex-wrap items-center justify-between gap-2 dir-rtl">
                    <div className="flex items-center gap-3">
                      <span>راهنمای تعاملی:</span>
                      <span className="text-slate-600 dark:text-slate-300">کلیک روی هر تیکت = باز شدن کشوی پیام‌ها و چت سریع</span>
                    </div>
                    <span><kbd className="bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">Esc</kbd> بستن کشو</span>
                  </div>
                </div>

                {/* SLIDE-OVER DRAWER FOR MESSAGES & CHAT (DRAWER) */}
                <AnimatePresence>
                  {selectedDrawerTicketId && activeTicket && (
                    <>
                      {/* Darkened Glass Backdrop */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedDrawerTicketId(null)}
                        className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 transition-opacity cursor-pointer"
                      />

                      {/* Slide-over Drawer Panel */}
                      <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                        className="fixed inset-y-0 left-0 w-full max-w-xl bg-white dark:bg-slate-900 shadow-2xl border-r border-slate-200 dark:border-slate-800 z-50 flex flex-col dir-rtl overflow-hidden"
                      >
                        {/* Drawer Header */}
                        <div className="p-4 bg-slate-50/80 dark:bg-slate-950/80 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
                          <div className="flex items-center gap-2.5">
                            <span className="font-mono text-xs font-black text-brand-600 dark:text-brand-400 bg-brand-500/10 px-2.5 py-1 rounded-lg border border-brand-500/20">
                              {activeTicket.id}
                            </span>
                            <span className={`text-xs px-2.5 py-0.5 rounded-lg font-extrabold border ${getStatusBadge(activeTicket.status)}`}>
                              {activeTicket.status}
                            </span>
                            <span className={`text-xs px-2.5 py-0.5 rounded-lg font-extrabold border ${getPriorityBadge(activeTicket.priority)}`}>
                              {activeTicket.priority}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedDrawerTicketId(null);
                                if (onOpenTicketDetails) {
                                  onOpenTicketDetails(activeTicket.id);
                                } else {
                                  setViewingTicketModal(activeTicket);
                                }
                              }}
                              className="px-3 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-black text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                              title="انتقال به صفحه اختصاصی گفتگو"
                            >
                              <span>صفحه کامل گفتگو</span>
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => setSelectedDrawerTicketId(null)}
                              className="p-2 rounded-xl bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                              title="بستن کشو"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Ticket Overview Banner */}
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 space-y-3 shrink-0">
                          <h2 className="text-sm font-black text-slate-900 dark:text-white leading-relaxed">
                            {activeTicket.title}
                          </h2>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800">
                              <span className="text-[10px] text-slate-400 font-medium block">مشتری:</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">{activeTicket.customer}</span>
                            </div>
                            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800">
                              <span className="text-[10px] text-slate-400 font-medium block">سطح حساب:</span>
                              <span className="font-extrabold text-amber-600 dark:text-amber-400">{activeTicket.customerTier}</span>
                            </div>
                            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800">
                              <span className="text-[10px] text-slate-400 font-medium block">محصول:</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">{activeTicket.product}</span>
                            </div>
                            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800">
                              <span className="text-[10px] text-slate-400 font-medium block">مهلت SLA:</span>
                              <span className="font-mono font-bold text-rose-500">{activeTicket.slaRemaining || '۱ ساعت'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Chat / Messages Thread (Scrollable) */}
                        <div className="flex-1 p-4 space-y-3 overflow-y-auto bg-slate-50/50 dark:bg-slate-950/30">
                          <div className="flex items-center justify-between text-xs text-slate-400 font-bold pb-1 border-b border-slate-200/50 dark:border-slate-800/50">
                            <span>تاریخچه گفتگو ({activeTicket.messages.length} پیام)</span>
                            <span className="font-mono text-[10px]">{activeTicket.waitingTime}</span>
                          </div>

                          {activeTicket.messages.map(m => (
                            <div
                              key={m.id}
                              className={`p-3.5 rounded-2xl border text-xs space-y-1.5 transition-all ${
                                m.isInternalNote
                                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200'
                                  : m.sender === 'agent'
                                  ? 'bg-brand-50 dark:bg-brand-500/10 border-brand-500/20 mr-4'
                                  : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 ml-4 shadow-2xs'
                              }`}
                            >
                              <div className="flex items-center justify-between font-bold">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-slate-900 dark:text-white font-extrabold">{m.senderName}</span>
                                  {m.isInternalNote && (
                                    <span className="text-[10px] bg-amber-500 text-white px-1.5 py-0.2 rounded font-black">
                                      یادداشت محرمانه
                                    </span>
                                  )}
                                </div>
                                <span className="font-mono text-[10px] text-slate-400">{m.time}</span>
                              </div>
                              <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed whitespace-pre-wrap">
                                {m.text}
                              </p>
                            </div>
                          ))}
                        </div>

                        {/* Composer & Quick Actions Footer */}
                        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 space-y-3 shrink-0">
                          {/* Composer Mode Toggle */}
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs">
                              {previewQuickReplyMode === 'reply' ? 'پاسخ مستقیم به مشتری' : 'افزودن یادداشت محرمانه داخلی'}
                            </span>

                            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
                              <button
                                onClick={() => setPreviewQuickReplyMode('reply')}
                                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                                  previewQuickReplyMode === 'reply' ? 'bg-white dark:bg-slate-900 text-brand-500 font-extrabold shadow-2xs' : 'text-slate-400'
                                }`}
                              >
                                پاسخ مشتری
                              </button>
                              <button
                                onClick={() => setPreviewQuickReplyMode('note')}
                                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                                  previewQuickReplyMode === 'note' ? 'bg-amber-500 text-white font-extrabold shadow-2xs' : 'text-slate-400'
                                }`}
                              >
                                یادداشت داخلی
                              </button>
                            </div>
                          </div>

                          {/* Quick Message Input */}
                          <textarea
                            rows={3}
                            value={previewQuickReplyText}
                            onChange={e => setPreviewQuickReplyText(e.target.value)}
                            placeholder={previewQuickReplyMode === 'reply' ? 'متن پاسخ مستقیم به مشتری...' : 'متن یادداشت محرمانه داخلی برای همکاران پشتیبانی...'}
                            className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-xs outline-none focus:border-brand-500 transition-colors placeholder:text-slate-400"
                          />

                          {/* Submit & Action Buttons */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-xs">
                              <button
                                onClick={() => setShowTransferModal(true)}
                                className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold transition-colors cursor-pointer"
                              >
                                ارجاع تیکت
                              </button>
                              <button
                                onClick={() => {
                                  setAgentTickets(prev =>
                                    prev.map(t => (t.id === activeTicket.id ? { ...t, status: 'حل شده' } : t))
                                  );
                                  showToast(`تیکت ${activeTicket.id} علامت‌گذاری شد به عنوان حل‌شده.`);
                                }}
                                className="px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-emerald-600 dark:text-emerald-400 font-bold transition-colors cursor-pointer border border-emerald-500/20"
                              >
                                علامت به‌عنوان حل‌شده
                              </button>
                            </div>

                            <button
                              onClick={() => {
                                if (!previewQuickReplyText.trim()) return;
                                const newMsg = {
                                  id: `MSG-${Date.now()}`,
                                  sender: 'agent' as const,
                                  senderName: 'امیرحسین رضایی',
                                  text: previewQuickReplyText,
                                  time: 'هم‌اکنون',
                                  isInternalNote: previewQuickReplyMode === 'note'
                                };
                                setAgentTickets(prev =>
                                  prev.map(t => (t.id === activeTicket.id ? { ...t, messages: [...t.messages, newMsg] } : t))
                                );
                                setPreviewQuickReplyText('');
                                showToast(previewQuickReplyMode === 'note' ? 'یادداشت داخلی ثبت شد.' : 'پاسخ مستقیم ارسال گردید.');
                              }}
                              className={`px-4 py-2 rounded-xl text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5 ${
                                previewQuickReplyMode === 'note' ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' : 'bg-brand-500 hover:bg-brand-600 shadow-brand-500/20'
                              }`}
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>{previewQuickReplyMode === 'note' ? 'ثبت یادداشت' : 'ارسال پاسخ'}</span>
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* RELATED CUSTOMERS TAB VIEW */}
          {agentTab === 'related-customers' && (
            <div className="space-y-4 dir-rtl text-right">
              <div className="flex items-center justify-between bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 p-4 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h1 className="text-base font-black text-slate-900 dark:text-white">مشتریان مرتبط و تحت پوشش پشتیبانی</h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">مشاهده مشخصات فنی، سطح پشتیبانی (SLA) و سازمان‌های زیرمجموعه</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {customersList.map(c => (
                  <div key={c.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 p-4 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-black text-slate-400">{c.id}</span>
                      <span className="text-[10px] bg-amber-500/10 text-amber-500 font-extrabold px-2 py-0.5 rounded-full border border-amber-500/20">
                        {c.tier}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-black text-xs text-slate-900 dark:text-white">{c.name}</h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">{c.industry} • {c.managerName}</p>
                    </div>
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-300">
                      <span>تیکت‌های فعال: {c.activeTickets}</span>
                      <button
                        onClick={() => onOpenCustomerWorkspace?.(c.id)}
                        className="text-brand-500 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>کارپوشه</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* KNOWLEDGE BASE TAB VIEW */}
          {agentTab === 'knowledge-base' && (
            <div className="space-y-4 dir-rtl text-right">
              <div className="flex items-center justify-between bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 p-4 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h1 className="text-base font-black text-slate-900 dark:text-white">پایگاه دانش فنی و دستورالعمل‌ها</h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">جستجو در مقاله ها، راهنماهای رفع خطا و چک‌لیست‌های پشتیبانی</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {kbArticles.map(kb => (
                  <div key={kb.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 p-4 shadow-xs space-y-2">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
                      <span className="bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded">{kb.category}</span>
                      <span>{kb.readTime} مطالعه</span>
                    </div>
                    <h3 className="text-xs font-black text-slate-900 dark:text-white leading-relaxed">{kb.title}</h3>
                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => showToast(`مقاله ${kb.id} باز شد.`)}
                        className="text-xs font-bold text-brand-500 hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <span>مشاهده کامل مقاله</span>
                        <ArrowLeft className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SAVED REPLIES TAB VIEW */}
          {agentTab === 'saved-replies' && (
            <div className="space-y-4 dir-rtl text-right">
              <div className="flex items-center justify-between bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 p-4 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h1 className="text-base font-black text-slate-900 dark:text-white">پاسخ‌های آماده و قالب‌های سریع</h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">قالب‌های استاندارد جهت افزایش سرعت پاسخ‌دهی تیم</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedReplies.map(sr => (
                  <div key={sr.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 p-4 shadow-xs space-y-2">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
                      <span className="bg-purple-500/10 text-purple-500 px-2 py-0.5 rounded">{sr.category}</span>
                      <span className="font-mono">{sr.id}</span>
                    </div>
                    <h3 className="text-xs font-black text-slate-900 dark:text-white">{sr.title}</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      {sr.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TEAM ACTIVITY TAB VIEW */}
          {agentTab === 'team-activity' && (
            <div className="space-y-4 dir-rtl text-right">
              <div className="flex items-center justify-between bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 p-4 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <h1 className="text-base font-black text-slate-900 dark:text-white">فعالیت‌های زنده تیم پشتیبانی</h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">گزارش لحظه‌ای تغییرات، پاسخ‌ها و جابجایی تیکت‌ها</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 p-4 shadow-xs space-y-3">
                {teamActivities.map(act => (
                  <div key={act.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 text-xs">
                    <div className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${act.avatarColor}`} />
                      <span className="font-bold text-slate-900 dark:text-white">{act.agent}</span>
                      <span className="text-slate-500">{act.action}</span>
                      <span className="font-mono text-brand-500 font-bold">{act.ticketId}</span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-400">{act.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* NOTIFICATIONS TAB VIEW */}
          {agentTab === 'notifications' && (
            <div className="space-y-4 dir-rtl text-right">
              <div className="flex items-center justify-between bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 p-4 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <h1 className="text-base font-black text-slate-900 dark:text-white">مرکز اعلان‌های پشتیبانی</h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">هشدار ارجاع جدید، زمان‌بندی SLA و یادداشت‌های همکاران</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 p-4 shadow-xs space-y-3">
                <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/20 text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-rose-600 dark:text-rose-400">
                    <span>هشدار بحرانی SLA</span>
                    <span className="font-mono text-[10px]">۱۰ دقیقه پیش</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 font-medium">
                    تیکت TKT-1024 (پتروشیمی سپهر پارس) کمتر از ۴۵ دقیقه تا نقض SLA زمان دارد.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* PROFILE TAB VIEW */}
          {agentTab === 'profile' && (
            <div className="space-y-4 dir-rtl text-right">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-brand-500 text-white flex items-center justify-center font-black text-xl shadow-md">
                    AR
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900 dark:text-white">امیرحسین رضایی</h2>
                    <p className="text-xs text-slate-500 mt-0.5">کارشناس ارشد پشتیبانی فنی  • شیفت صبح</p>
                    <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-bold text-[10px]">
                      وضعیت: {agentStatus}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

      {/* COMMAND PALETTE MODAL (Ctrl + K) */}
      <AnimatePresence>
        {commandPaletteOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden dir-rtl text-right"
            >
              {/* Palette Input Header */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                <Command className="w-5 h-5 text-brand-500 shrink-0" />
                <input
                  type="text"
                  autoFocus
                  value={commandSearch}
                  onChange={e => setCommandSearch(e.target.value)}
                  placeholder="جستجو یا تایپ دستور (ایجاد تیکت، انتقال، جستجوی مشتری)..."
                  className="w-full text-sm bg-transparent outline-none font-bold text-slate-900 dark:text-white placeholder:text-slate-400"
                />
                <button
                  onClick={() => setCommandPaletteOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Commands List */}
              <div className="p-2 max-h-80 overflow-y-auto space-y-1 text-xs">
                {[
                  { id: 'cmd-1', icon: Plus, title: 'ایجاد تیکت جدید پشتیبانی', desc: 'افزودن درخواست برای مشتری سازمانی', action: () => { setShowNewTicketModal(true); setCommandPaletteOpen(false); } },
                  { id: 'cmd-2', icon: UserCheck, title: 'انتقال تیکت به همکار یا دپارتمان', desc: 'ارجاع تیکت جاری به دپارتمان مرتبط', action: () => { setShowTransferModal(true); setCommandPaletteOpen(false); } },
                  { id: 'cmd-3', icon: PhoneCall, title: 'ثبت درخواست تماس تلفنی فوری', desc: 'هماهنگی تماس با نماینده سازمان', action: () => { setShowCallModal(true); setCommandPaletteOpen(false); } },
                  { id: 'cmd-4', icon: RefreshCw, title: 'تغییر وضعیت تیکت جاری به حل‌شده', desc: 'بستن کامل چرخه پشتیبانی', action: () => { handleChangeStatus('حل شده'); setCommandPaletteOpen(false); } },
                  { id: 'cmd-5', icon: Lock, title: 'افزودن یادداشت محرمانه داخلی', desc: 'درج یادداشت دیده‌نشده توسط مشتری', action: () => { setReplyMode('note'); setCommandPaletteOpen(false); } },
                  { id: 'cmd-6', icon: Users, title: 'جستجو و مشاهده کارپوشه مشتری', desc: 'باز کردن صفحه مشتریان سازمانی', action: () => { onOpenCustomerWorkspace?.('CST-101'); setCommandPaletteOpen(false); } }
                ]
                  .filter(c => c.title.includes(commandSearch) || c.desc.includes(commandSearch))
                  .map(cmd => {
                    const IconComp = cmd.icon;
                    return (
                      <button
                        key={cmd.id}
                        onClick={cmd.action}
                        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors text-right cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-500 flex items-center justify-center shrink-0 group-hover:bg-brand-500 group-hover:text-white transition-colors">
                            <IconComp className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-800 dark:text-slate-200">{cmd.title}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{cmd.desc}</div>
                          </div>
                        </div>
                        <ChevronLeft className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-brand-500 transition-colors" />
                      </button>
                    );
                  })}
              </div>

              {/* Palette Footer */}
              <div className="p-3 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-bold">
                <div className="flex items-center gap-2">
                  <span>ناوبری: <kbd className="bg-slate-200 dark:bg-slate-800 px-1 rounded">↑↓</kbd></span>
                  <span>انتخاب: <kbd className="bg-slate-200 dark:bg-slate-800 px-1 rounded">Enter</kbd></span>
                </div>
                <span>خروج: <kbd className="bg-slate-200 dark:bg-slate-800 px-1 rounded">Esc</kbd></span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TRANSFER MODAL */}
      <AnimatePresence>
        {showTransferModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 text-right space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-black text-slate-900 dark:text-white">انتقال تیکت {activeTicket.id}</h3>
                <button
                  onClick={() => setShowTransferModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    انتخاب دپارتمان یا پشتیبان مقصد
                  </label>
                  <select className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 outline-none font-bold">
                    <option value="1">تیم امنیت شبکه و SSL (علی علوی)</option>
                    <option value="2">تیم زیرساخت ابری و سرورها (زهرا موسوی)</option>
                    <option value="3">امور مالی و لایسنسینگ (مریم اکبری)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    علت ارجاع / توضیحات فنی
                  </label>
                  <textarea
                    rows={3}
                    placeholder="علت انتقال تیکت جهت اطلاع همکار مقصد..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  onClick={() => {
                    setShowTransferModal(false);
                    showToast(`تیکت ${activeTicket.id} با موفقیت انتقال یافت.`);
                  }}
                  className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-black cursor-pointer shadow-md shadow-brand-500/15"
                >
                  تایید و ارجاع
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* REQUEST CALL MODAL */}
      <AnimatePresence>
        {showCallModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 text-right space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-black text-slate-900 dark:text-white">درخواست تماس فوری با مشتری</h3>
                <button
                  onClick={() => setShowCallModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 rounded-xl border border-emerald-500/20 text-[11px] font-bold">
                  تماس مستقیم با نماینده فنی سازمان: {activeTicket.customer}
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    شماره تماس مستقیم نماینده
                  </label>
                  <input
                    type="text"
                    defaultValue="۰۹۱۲۸۸۸۹۹۰۰ (محمدرضا کریمی)"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 outline-none font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowCallModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  onClick={() => {
                    setShowCallModal(false);
                    showToast('درخواست تماس مستقیم در سیستم مرکز تماس ویپ ثبت گردید.');
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black cursor-pointer shadow-md shadow-emerald-500/15 flex items-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>برقراری تماس ابری</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE NEW TICKET MODAL */}
      <AnimatePresence>
        {showNewTicketModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 text-right space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-black text-slate-900 dark:text-white">ایجاد تیکت جدید پشتیبانی</h3>
                <button
                  onClick={() => setShowNewTicketModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form
                onSubmit={async e => {
                  e.preventDefault();
                  if (!newTicketFields.title || !newTicketFields.customerId) return;
                  const priorityToApi: Record<string, string> = { 'بحرانی': 'CRITICAL', 'بالا': 'HIGH', 'متوسط': 'MEDIUM', 'پایین': 'LOW' };
                  try {
                    await gql(CREATE_TICKET, {
                      input: {
                        title: newTicketFields.title,
                        priority: priorityToApi[newTicketFields.priority] || 'MEDIUM',
                        customerId: newTicketFields.customerId,
                      },
                    });
                    showToast('تیکت جدید با موفقیت ثبت و به صف کاری اضافه شد.');
                  } catch {
                    showToast('خطا در ثبت تیکت. لطفاً دوباره تلاش کنید.', 'error');
                  }
                  setShowNewTicketModal(false);
                  setNewTicketFields({ title: '', customerId: '', productId: '', priority: 'متوسط' });
                }}
                className="space-y-3 text-xs"
              >
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    انتخاب سازمان / مشتری <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={newTicketFields.customerId}
                    onChange={e => setNewTicketFields(f => ({ ...f, customerId: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 outline-none font-bold"
                  >
                    <option value="">انتخاب مشتری...</option>
                    {customersList.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.industry})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    محصول یا زیرسرویس مرتبط <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={newTicketFields.productId}
                    onChange={e => setNewTicketFields(f => ({ ...f, productId: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 outline-none font-bold"
                  >
                    <option value="">انتخاب محصول...</option>
                    {productsList.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    موضوع درخواست <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newTicketFields.title}
                    onChange={e => setNewTicketFields(f => ({ ...f, title: e.target.value }))}
                    placeholder="مثال: اختلال در احراز هویت سرویس"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      اولویت پاسخگویی
                    </label>
                    <select
                      value={newTicketFields.priority}
                      onChange={e => setNewTicketFields(f => ({ ...f, priority: e.target.value }))}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 outline-none font-bold"
                    >
                      <option value="بحرانی">بحرانی (SLA زیر ۱ ساعت)</option>
                      <option value="بالا">بالا (SLA ۴ ساعت)</option>
                      <option value="متوسط">متوسط</option>
                      <option value="پایین">پایین</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      تخصیص به پشتیبان
                    </label>
                    <select className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 outline-none font-bold">
                      <option value="me">امیرحسین رضایی (من)</option>
                      <option value="alavi">علی علوی</option>
                      <option value="mousavi">زهرا موسوی</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowNewTicketModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold cursor-pointer"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-black cursor-pointer shadow-md shadow-brand-500/15"
                  >
                    ثبت تیکت جدید
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* TICKET DETAIL / REPLY MODAL */}
        {viewingTicketModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 dir-rtl text-right my-8 max-h-[90vh] flex flex-col space-y-4"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-black text-brand-600 dark:text-brand-400 bg-brand-500/10 px-2.5 py-0.5 rounded-lg border border-brand-500/20">
                      {viewingTicketModal.id}
                    </span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-lg border font-bold ${getStatusBadge(viewingTicketModal.status)}`}>
                      {viewingTicketModal.status}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-lg border font-extrabold ${getPriorityBadge(viewingTicketModal.priority)}`}>
                      اولویت: {viewingTicketModal.priority}
                    </span>
                  </div>
                  <h2 className="text-sm font-black text-slate-900 dark:text-white leading-relaxed">
                    {viewingTicketModal.title}
                  </h2>
                  <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                    <span>مشتری: <strong className="text-slate-800 dark:text-slate-200">{viewingTicketModal.customer}</strong></span>
                    <span>•</span>
                    <span>محصول: <strong className="text-slate-800 dark:text-slate-200">{viewingTicketModal.product}</strong></span>
                  </div>
                </div>

                <button
                  onClick={() => setViewingTicketModal(null)}
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Messages History */}
              <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 py-2">
                {viewingTicketModal.messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`p-4 rounded-2xl border transition-all space-y-2 ${
                      msg.isInternalNote
                        ? 'bg-amber-500/5 border-amber-500/30 text-amber-900 dark:text-amber-200'
                        : msg.sender === 'agent'
                        ? 'bg-brand-50/50 dark:bg-brand-500/10 border-brand-500/30'
                        : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200/60 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs pb-1 border-b border-black/5 dark:border-white/5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            msg.isInternalNote
                              ? 'bg-amber-500'
                              : msg.sender === 'agent'
                              ? 'bg-brand-500'
                              : 'bg-emerald-500'
                          }`}
                        />
                        <span className="font-bold text-slate-900 dark:text-white">{msg.senderName}</span>
                        {msg.isInternalNote && (
                          <span className="text-[10px] bg-amber-500 text-white px-1.5 py-0.5 rounded font-extrabold flex items-center gap-0.5">
                            <Lock className="w-2.5 h-2.5" />
                            <span>یادداشت محرمانه داخلی</span>
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-[11px] text-slate-400">{msg.time}</span>
                    </div>

                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium whitespace-pre-wrap">
                      {msg.text}
                    </p>

                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="pt-2 flex flex-wrap gap-2">
                        {msg.attachments.map((att, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300"
                          >
                            <Paperclip className="w-3.5 h-3.5 text-brand-500" />
                            <span>{att.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">({att.size})</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Fast Reply Composer */}
              <form onSubmit={e => {
                e.preventDefault();
                if (!replyText.trim()) return;
                const newMsg = {
                  id: `MSG-${Date.now()}`,
                  sender: 'agent' as const,
                  senderName: 'امیرحسین رضایی (پشتیبان ارشد)',
                  text: replyText,
                  time: 'هم‌اکنون',
                  isInternalNote: replyMode === 'note',
                };
                setViewingTicketModal(prev => prev ? ({ ...prev, messages: [...prev.messages, newMsg] }) : null);
                setReplyText('');
                showToast(replyMode === 'note' ? 'یادداشت داخلی با موفقیت ثبت شد' : 'پاسخ تیکت با موفقیت ارسال شد');
              }} className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3 shrink-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                    {replyMode === 'note' ? 'افزودن یادداشت داخلی (همکاران)' : 'ارسال پاسخ به مشتری'}
                  </span>
                  <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setReplyMode('reply')}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                        replyMode === 'reply' ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-xs' : 'text-slate-500'
                      }`}
                    >
                      پاسخ مشتری
                    </button>
                    <button
                      type="button"
                      onClick={() => setReplyMode('note')}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                        replyMode === 'note' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-500'
                      }`}
                    >
                      یادداشت داخلی
                    </button>
                  </div>
                </div>

                <textarea
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  rows={3}
                  placeholder={
                    replyMode === 'note'
                      ? 'متن یادداشت داخلی جهت هماهنگی با تیم فنی...'
                      : 'پاسخ رسمی پشتیبانی جهت ارسال به مشتری...'
                  }
                  className={`w-full p-3 text-xs rounded-xl border outline-none transition-all placeholder:text-slate-400 ${
                    replyMode === 'note'
                      ? 'bg-amber-500/5 border-amber-500/30 focus:border-amber-500'
                      : 'bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 focus:border-brand-500'
                  }`}
                />

                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setViewingTicketModal(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold cursor-pointer"
                  >
                    بستن
                  </button>

                  <button
                    type="submit"
                    className={`px-5 py-2 rounded-xl text-white text-xs font-black shadow-md cursor-pointer flex items-center gap-1.5 ${
                      replyMode === 'note'
                        ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/15'
                        : 'bg-brand-500 hover:bg-brand-600 shadow-brand-500/15'
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{replyMode === 'note' ? 'ذخیره یادداشت' : 'ارسال پاسخ'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
