import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
  LogOut,
  Menu,
  Building,
  SlidersHorizontal,
  Layers,
  Eye,
  Trash2,
  Share2,
  Download,
  VolumeX,
  Flame,
  CornerUpLeft,
  MoreVertical,
  Sliders,
  UserPlus,
  ExternalLink,
  Pencil,
  ClipboardList
} from 'lucide-react';
import type { Ticket, Product, Customer } from '../../types';
import { PortalRole } from '../../types';
import type { AgentTicketItem } from '../../api/transform-agent';
import { mergeAgentTicketData } from '../../api/transform-agent';
import { useDepartments } from '../../hooks/useDepartments';
import { useUsers } from '../../hooks/useUsers';
import { usePersistentState } from '../../hooks/usePersistentState';
import AgentTicketConversation from './AgentTicketConversation';
import TaskManagerView from './TaskManager';
import { gql } from '../../api/graphql';
import { CREATE_TICKET, GET_TICKET, CREATE_TICKET_MESSAGE, UPDATE_TICKET, UPDATE_TICKET_STATUS } from '../../api/queries';
import type { ApiTicket, ApiTicketMessage } from '../../api/types';

type AgentTab = 'dashboard' | 'inbox' | 'my-tickets' | 'related-customers' | 'knowledge-base' | 'saved-replies' | 'team-activity' | 'notifications' | 'task-manager' | 'profile';

const AGENT_TABS: readonly AgentTab[] = ['dashboard', 'inbox', 'my-tickets', 'related-customers', 'knowledge-base', 'saved-replies', 'team-activity', 'notifications', 'task-manager', 'profile'];

function loadAgentFlags(userId: string): { pinned: string[]; starred: string[] } {
  const key = `cmp_agent_flags_${userId || 'anon'}`;
  try {
    return JSON.parse(localStorage.getItem(key) || '{"pinned":[],"starred":[]}');
  } catch {
    return { pinned: [], starred: [] };
  }
}

function mapApiMessageToAgent(m: ApiTicketMessage): AgentTicketItem['messages'][number] {
  return {
    id: m.id,
    sender: m.authorType === 'customer' ? 'customer' : m.isInternal ? 'agent' : 'agent',
    senderName: m.senderName,
    text: m.text,
    time: m.createdAt ? new Date(m.createdAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }) : '',
    isInternalNote: m.isInternal,
  };
}

interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

function MetricRing({ value, color }: { value: number; color: string }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const filled = (Math.min(100, Math.max(0, value)) / 100) * c;
  return (
    <div className="relative w-20 h-20 shrink-0">
      <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={r} fill="none" strokeWidth="6" className="stroke-slate-100 dark:stroke-slate-800" />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${c}`}
          style={{ stroke: color }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-slate-800 dark:text-slate-200">
        {Math.round(value)}٪
      </div>
    </div>
  );
}

interface SupportAgentPortalViewProps {
  userEmail: string;
  currentUserId?: string;
  currentDepartmentId?: string;
  ticketsList: Ticket[];
  productsList: Product[];
  customersList: Customer[];
  onLogout: () => void;
  onSwitchPortalRole?: (role: PortalRole) => void;
  onOpenTicketDetails?: (ticketId: string) => void;
  onOpenCustomerWorkspace?: (customerId: string) => void;
}

export default function SupportAgentPortalView({
  userEmail,
  currentUserId = '',
  currentDepartmentId = '',
  ticketsList,
  productsList,
  customersList,
  onLogout,
  onSwitchPortalRole,
  onOpenTicketDetails,
  onOpenCustomerWorkspace
}: SupportAgentPortalViewProps) {
  // Support Agent Navigation Tab
  const [agentTab, setAgentTab] = usePersistentState<AgentTab>('cmp_agent_active_tab', 'dashboard', AGENT_TABS);
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
  const [transferDepartmentId, setTransferDepartmentId] = useState('');
  const [transferAgentId, setTransferAgentId] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [showCallModal, setShowCallModal] = useState(false);
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [newTicketFields, setNewTicketFields] = useState({ title: '', customerId: '', productId: '', priority: 'متوسط' });
  const [viewingTicketModal, setViewingTicketModal] = useState<AgentTicketItem | null>(null);
  const [fullConversationTicketId, setFullConversationTicketId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Leaving the inbox/my-tickets tab closes the full conversation page
  useEffect(() => {
    setFullConversationTicketId(null);
    setSelectedDrawerTicketId(null);
  }, [agentTab]);

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

  // Star & Pin flags (local, per agent), persisted to localStorage so they survive
  // re-syncs, tab switches, refreshes and logins.
  const flagsKey = `cmp_agent_flags_${currentUserId || 'anon'}`;
  const loadFlags = (): { pinned: string[]; starred: string[] } => {
    try {
      return JSON.parse(localStorage.getItem(flagsKey) || '{"pinned":[],"starred":[]}');
    } catch {
      return { pinned: [], starred: [] };
    }
  };
  const saveFlags = useCallback((next: { pinned: string[]; starred: string[] }) => {
    localStorage.setItem(flagsKey, JSON.stringify(next));
  }, [flagsKey]);

  // Sync real ticket data from props to agent ticket state, preserving pin/star
  useEffect(() => {
    if (ticketsList.length > 0) {
      const flags = loadFlags();
      setAgentTickets(
        mergeAgentTicketData(ticketsList, customersList, currentUserId, {}).map(t => ({
          ...t,
          pinned: flags.pinned.includes(t.id),
          important: flags.starred.includes(t.id),
        })),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketsList, customersList, currentUserId]);

  // Fetch real messages for a ticket from the API and merge into local state
  const fetchTicketMessages = useCallback(async (ticketId: string) => {
    try {
      const data = await gql<{ ticket: ApiTicket }>(GET_TICKET, { id: ticketId });
      const msgs = (data?.ticket?.messages || []).map(mapApiMessageToAgent);
      setAgentTickets(prev => prev.map(t => (t.id === ticketId ? { ...t, messages: msgs } : t)));
    } catch {
      // keep existing local messages on failure
    }
  }, []);

  // Send a reply or internal note through the API and refresh the thread.
  // Writing a reply to an unassigned ticket automatically assigns it to this agent.
  const sendTicketMessage = useCallback(async (ticketId: string, text: string, isInternal: boolean): Promise<boolean> => {
    if (!text.trim()) return false;
    try {
      const target = agentTickets.find(t => t.id === ticketId);
      if (target && !target.assignedToMe && currentUserId) {
        await gql(UPDATE_TICKET, { input: { id: ticketId, assignedToId: currentUserId } });
        setAgentTickets(prev => prev.map(t => (t.id === ticketId ? { ...t, assignedToMe: true } : t)));
      }
      await gql(CREATE_TICKET_MESSAGE, {
        input: {
          ticketId,
          text,
          senderName: userEmail,
          isInternal,
          authorType: 'agent',
        },
      });
      await fetchTicketMessages(ticketId);
      return true;
    } catch {
      return false;
    }
  }, [userEmail, fetchTicketMessages, agentTickets, currentUserId]);

  // Explicitly accept / assign a ticket to the current agent
  const acceptTicket = useCallback(async (ticketId: string): Promise<boolean> => {
    if (!currentUserId) {
      showToast('برای پذیرش تیکت ابتدا وارد حساب شوید.');
      return false;
    }
    try {
      await gql(UPDATE_TICKET, { input: { id: ticketId, assignedToId: currentUserId } });
      setAgentTickets(prev => prev.map(t => (t.id === ticketId ? { ...t, assignedToMe: true } : t)));
      showToast('تیکت با موفقیت به شما تخصیص داده شد و به «تیکت‌های من» اضافه گردید.');
      return true;
    } catch {
      showToast('خطا در تخصیص تیکت. لطفاً دوباره تلاش کنید.');
      return false;
    }
  }, [currentUserId]);

  // Transfer / forward the active ticket to another department or agent
  const handleTransferTicket = async (): Promise<void> => {
    if (!activeTicket) {
      showToast('تیکتی برای انتقال انتخاب نشده است.');
      return;
    }
    if (!transferDepartmentId) {
      showToast('لطفاً دپارتمان مقصد را انتخاب کنید.');
      return;
    }
    if (!transferReason.trim()) {
      showToast('برای انتقال تیکت، نوشتن علت ارجاع الزامی است.');
      return;
    }
    try {
      const targetDept = departments.find(d => d.id === transferDepartmentId);
      const targetAgent = agentsList.find(u => u.id === transferAgentId);
      const targetProduct = targetDept?.assignedProducts?.length
        ? productsList.find(p => targetDept.assignedProducts.includes(p.name) || targetDept.assignedProducts.includes(p.id))
        : undefined;

      // 1. Reassign the ticket to the target agent (if chosen) and/or target department product.
      //    When no agent is chosen, unassign so the ticket lands in the department's pool.
      const updateInput: { id: string; assignedToId?: string | null; productId?: string } = { id: activeTicket.id };
      if (transferAgentId) {
        updateInput.assignedToId = transferAgentId;
      } else {
        updateInput.assignedToId = null;
      }
      if (targetProduct?.id) updateInput.productId = targetProduct.id;
      await gql(UPDATE_TICKET, { input: updateInput });

      // 2. Record the reason as an internal note visible to the receiving department
      const deptName = targetDept?.name || 'دپارتمان مقصد';
      const agentName = targetAgent?.name || (transferAgentId ? 'همکار' : '');
      const noteText = `ارجاع تیکت به ${deptName}${agentName ? ` (${agentName})` : ''}\nعلت ارجاع: ${transferReason.trim()}`;
      await gql(CREATE_TICKET_MESSAGE, {
        input: {
          ticketId: activeTicket.id,
          text: noteText,
          senderName: userEmail,
          isInternal: true,
          authorType: 'agent',
        },
      });

      // 3. Update local state: unassign from me (unless transferring back to me), refresh thread
      await fetchTicketMessages(activeTicket.id);
      setAgentTickets(prev => prev.map(t => (t.id === activeTicket.id
        ? {
            ...t,
            assignedToMe: !!transferAgentId && transferAgentId === currentUserId,
            product: targetProduct?.name || t.product,
            productId: targetProduct?.id || t.productId,
          }
        : t)));
      setShowTransferModal(false);
      setTransferDepartmentId('');
      setTransferAgentId('');
      setTransferReason('');
      showToast(`تیکت ${activeTicket.id} با موفقیت به «${deptName}» ارجاع داده شد.`);
    } catch {
      showToast('خطا در ارجاع تیکت. لطفاً دوباره تلاش کنید.');
    }
  };

  // Selected Active Ticket
  const [activeTicketId, setActiveTicketId] = useState<string>('');

  const activeTicket = useMemo(() => {
    return agentTickets.find(t => t.id === activeTicketId) || agentTickets[0];
  }, [agentTickets, activeTicketId]);

  // Support Ticket Inbox State
  const [inboxFilter, setInboxFilter] = useState<string>('همه');
  const [activeQuickFilter, setActiveQuickFilter] = useState<string>('all');
  const [inboxSearch, setInboxSearch] = useState<string>('');
  const [inboxSortBy, setInboxSortBy] = useState<'newest' | 'oldest' | 'priority' | 'sla'>('newest');
  const [inboxViewMode, setInboxViewMode] = useState<'detailed' | 'compact'>('detailed');
  const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([]);
  const [starredTicketIds, setStarredTicketIds] = useState<string[]>(() => {
    return loadAgentFlags(currentUserId).starred;
  });
  const [unreadTicketIds, setUnreadTicketIds] = useState<string[]>([]);
  const [showBulkAssignModal, setShowBulkAssignModal] = useState<boolean>(false);
  const [showBulkStatusModal, setShowBulkStatusModal] = useState<boolean>(false);
  const [showBulkTagModal, setShowBulkTagModal] = useState<boolean>(false);
  const [showBulkCloseConfirm, setShowBulkCloseConfirm] = useState<boolean>(false);
  const [isRefreshingInbox, setIsRefreshingInbox] = useState<boolean>(false);
  const [previewQuickReplyMode, setPreviewQuickReplyMode] = useState<'reply' | 'note'>('reply');
  const [previewQuickReplyText, setPreviewQuickReplyText] = useState<string>('');
  const [selectedDrawerTicketId, setSelectedDrawerTicketId] = useState<string | null>(null);
  const [inboxStatusFilter, setInboxStatusFilter] = useState<string>('همه');
  const [inboxPriorityFilter, setInboxPriorityFilter] = useState<string>('همه');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // Departments: resolve the current agent's team product access
  const { departments } = useDepartments();

  // Products accessible by the current agent's department (matched by name or id)
  const teamProducts = useMemo(() => {
    if (!currentDepartmentId) return [] as string[];
    const dept = departments.find(d => d.id === currentDepartmentId);
    return dept?.assignedProducts || [];
  }, [departments, currentDepartmentId]);

  // Real users (agents) for the transfer / assign targets
  const { users: apiUsers } = useUsers();
  const agentsList = useMemo(() => {
    return apiUsers.filter(u => !u.isCustomer && (u.role === 'ADMIN' || u.role === 'AGENT'));
  }, [apiUsers]);

  // Real profile data of the current logged-in agent
  const currentUserInfo = useMemo(() => {
    return apiUsers.find(u => (currentUserId && u.id === currentUserId) || u.email === userEmail) || null;
  }, [apiUsers, currentUserId, userEmail]);
  const currentUserName = currentUserInfo?.name || 'کارشناس پشتیبانی';
  const currentUserRoleLabel = currentUserInfo?.role === 'ADMIN' ? 'مدیر پشتیبانی' : currentUserInfo?.role === 'AGENT' ? 'کارشناس پشتیبانی' : 'کاربر';
  const currentUserInitials = currentUserName.split(' ').slice(0, 2).map(p => p[0] || '').join('');

  // Agents belonging to the selected transfer target department
  const transferDepartmentAgents = useMemo(() => {
    if (!transferDepartmentId) return [] as typeof agentsList;
    return agentsList.filter(u => u.departmentId === transferDepartmentId);
  }, [agentsList, transferDepartmentId]);

  // ── Dashboard: daily shift checklist (persisted per agent) ──
  const checklistKey = `cmp_agent_checklist_${currentUserId || 'anon'}`;
  const defaultChecklist: ChecklistItem[] = [
    { id: 'chk-1', text: 'بررسی تیکت‌های دارای اولویت بحرانی', done: true },
    { id: 'chk-2', text: 'پاسخگویی به موارد در آستانه SLA', done: true },
    { id: 'chk-3', text: 'هماهنگی با لایه ۲ فنی برای مشکلات دیتابیس', done: false },
    { id: 'chk-4', text: 'ثبت خلاصه عملکرد شیفت جاری', done: false },
  ];
  const [checklist, setChecklist] = useState<ChecklistItem[]>(() => {
    try {
      const saved = localStorage.getItem(checklistKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch { /* ignore corrupted storage */ }
    return defaultChecklist;
  });
  const [checklistInput, setChecklistInput] = useState('');
  const [editingChecklistId, setEditingChecklistId] = useState<string | null>(null);
  const [editingChecklistText, setEditingChecklistText] = useState('');

  useEffect(() => {
    try { localStorage.setItem(checklistKey, JSON.stringify(checklist)); } catch { /* ignore */ }
  }, [checklist, checklistKey]);

  const toggleChecklistItem = (id: string) => {
    setChecklist(prev => prev.map(i => (i.id === id ? { ...i, done: !i.done } : i)));
  };
  const addChecklistItem = () => {
    const text = checklistInput.trim();
    if (!text) return;
    setChecklist(prev => [...prev, { id: `chk-${Date.now()}`, text, done: false }]);
    setChecklistInput('');
  };
  const removeChecklistItem = (id: string) => {
    setChecklist(prev => prev.filter(i => i.id !== id));
  };
  const saveChecklistEdit = (id: string) => {
    const text = editingChecklistText.trim();
    if (!text) return;
    setChecklist(prev => prev.map(i => (i.id === id ? { ...i, text } : i)));
    setEditingChecklistId(null);
    setEditingChecklistText('');
  };

  const checklistDoneCount = checklist.filter(i => i.done).length;

  // ── Dashboard: real ticket KPIs ──
  const dashboardKpis = useMemo(() => {
    const tickets = agentTickets;
    return {
      needsAction: tickets.filter(t => t.status === 'جدید' || t.status === 'در حال بررسی').length,
      slaRisk: tickets.filter(t => t.slaRisk).length,
      awaitingCustomer: tickets.filter(t => t.status === 'منتظر پاسخ مشتری').length,
      resolved: tickets.filter(t => t.status === 'حل شده' || t.status === 'بسته شده').length,
    };
  }, [agentTickets]);

  const jumpToInbox = (inboxFilterValue: string, statusFilter: string = 'همه') => {
    setAgentTab('inbox');
    setInboxFilter(inboxFilterValue);
    setInboxStatusFilter(statusFilter);
    setInboxPriorityFilter('همه');
    setInboxSearch('');
    setCurrentPage(1);
  };

  // Tickets scoped by tab: inbox → team (department products), my-tickets → assigned to me
  const teamTickets = useMemo(() => {
    if (teamProducts.length === 0) return [] as AgentTicketItem[];
    return agentTickets.filter(t => teamProducts.includes(t.product) || (t.productId ? teamProducts.includes(t.productId) : false));
  }, [agentTickets, teamProducts]);

  const myTickets = useMemo(() => {
    return agentTickets.filter(t => t.assignedToMe);
  }, [agentTickets]);

  const scopedTickets = useMemo(() => {
    return agentTab === 'inbox' ? teamTickets : myTickets;
  }, [agentTab, teamTickets, myTickets]);

  // Filter badge counts
  const filterCounts = useMemo(() => {
    return {
      all: scopedTickets.length,
      myQueue: scopedTickets.filter(t => t.assignedToMe).length,
      needsAction: scopedTickets.filter(t => t.status === 'جدید' || t.status === 'در حال بررسی').length,
      waitingCustomer: scopedTickets.filter(t => t.status === 'منتظر پاسخ مشتری').length,
      urgent: scopedTickets.filter(t => t.priority === 'بحرانی').length,
      unanswered: scopedTickets.filter(t => t.messages.length === 1 || t.messages[t.messages.length - 1]?.sender === 'customer').length,
      today: scopedTickets.filter(t => t.createdAt.includes('۱۴۰۳') || t.waitingTime.includes('پیش')).length,
      recentUpdated: scopedTickets.length,
      slaRisk: scopedTickets.filter(t => t.slaRisk).length,
      pinned: scopedTickets.filter(t => t.pinned).length,
      starred: scopedTickets.filter(t => t.important).length,
    };
  }, [scopedTickets]);

  // Filtered tickets for inbox list
  const filteredInboxTickets = useMemo(() => {
    return scopedTickets.filter(ticket => {
      if (inboxSearch.trim()) {
        const q = inboxSearch.toLowerCase();
        const matchId = ticket.id.toLowerCase().includes(q);
        const matchTitle = ticket.title.toLowerCase().includes(q);
        const matchCustomer = ticket.customer.toLowerCase().includes(q);
        const matchProduct = ticket.product.toLowerCase().includes(q);
        if (!matchId && !matchTitle && !matchCustomer && !matchProduct) return false;
      }

      if (inboxStatusFilter !== 'همه' && ticket.status !== inboxStatusFilter) return false;
      if (inboxPriorityFilter !== 'همه' && ticket.priority !== inboxPriorityFilter) return false;

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
        case 'ستاره‌دار':
          return ticket.important;
        case 'همه':
        default:
          return true;
      }
    }).sort((a, b) => {
      // Pinned tickets always float to the top of the list
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      if (inboxSortBy === 'newest') return b.id.localeCompare(a.id);
      if (inboxSortBy === 'oldest') return a.id.localeCompare(b.id);
      if (inboxSortBy === 'priority') {
        const pOrder: Record<string, number> = { 'بحرانی': 4, 'بالا': 3, 'متوسط': 2, 'پایین': 1 };
        return (pOrder[b.priority] || 0) - (pOrder[a.priority] || 0);
      }
      if (inboxSortBy === 'sla') return (b.slaRisk ? 1 : 0) - (a.slaRisk ? 1 : 0);
      return 0;
    });
  }, [scopedTickets, inboxSearch, inboxFilter, inboxSortBy, inboxStatusFilter, inboxPriorityFilter]);

  // KPI counts derived from the scoped ticket set
  const totalOpenTickets = useMemo(() => scopedTickets.filter(t => t.status === 'جدید' || t.status === 'در حال بررسی').length, [scopedTickets]);
  const totalWaitingResponse = useMemo(() => scopedTickets.filter(t => t.status === 'منتظر پاسخ مشتری').length, [scopedTickets]);
  const totalResolved = useMemo(() => scopedTickets.filter(t => t.status === 'حل شده' || t.status === 'بسته شده').length, [scopedTickets]);
  const totalSlaRisk = useMemo(() => scopedTickets.filter(t => t.slaRisk).length, [scopedTickets]);

  // Pagination over the filtered set
  const totalPages = useMemo(() => Math.max(1, Math.ceil(filteredInboxTickets.length / itemsPerPage)), [filteredInboxTickets.length, itemsPerPage]);
  const paginatedTickets = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredInboxTickets.slice(start, start + itemsPerPage);
  }, [filteredInboxTickets, currentPage, itemsPerPage]);
  const startIndex = Math.min((currentPage - 1) * itemsPerPage + 1, filteredInboxTickets.length);
  const endIndex = Math.min(currentPage * itemsPerPage, filteredInboxTickets.length);

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

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ message: msg, type });
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

  // Toggle Pin & Important (persisted in localStorage)
  const togglePin = (ticketId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const flags = loadFlags();
    const next = {
      ...flags,
      pinned: flags.pinned.includes(ticketId)
        ? flags.pinned.filter(id => id !== ticketId)
        : [...flags.pinned, ticketId],
    };
    saveFlags(next);
    setAgentTickets(prev =>
      prev.map(t => (t.id === ticketId ? { ...t, pinned: !t.pinned } : t))
    );
    showToast('وضعیت سنجاق تیکت تغییر یافت.');
  };

  // Persist star flags for a ticket (keeps separate starred list in sync with important flag)
  const toggleStarFlag = (ticketId: string) => {
    const flags = loadFlags();
    const was = flags.starred.includes(ticketId);
    const next = {
      ...flags,
      starred: was ? flags.starred.filter(id => id !== ticketId) : [...flags.starred, ticketId],
    };
    saveFlags(next);
    setStarredTicketIds(next.starred);
    setAgentTickets(prev =>
      prev.map(t => (t.id === ticketId ? { ...t, important: !was, pinned: t.pinned } : t))
    );
    showToast(was ? 'تیکت از فهرست ستاره‌دار حذف شد.' : 'تیکت به فهرست ستاره‌دار اضافه شد.');
  };

  // Handle Send Reply / Note
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() && attachedFiles.length === 0) return;

    const isInternal = replyMode === 'note';
    const ok = await sendTicketMessage(activeTicket.id, replyText, isInternal);
    if (!ok) {
      showToast('خطا در ثبت پاسخ. لطفاً دوباره تلاش کنید.');
      return;
    }

    if (replyMode === 'reply') {
      handleChangeStatus('منتظر پاسخ مشتری');
    }

    setReplyText('');
    setAttachedFiles([]);
    showToast(
      replyMode === 'note'
        ? 'یادداشت داخلی با موفقیت ذخیره گردید.'
        : 'پاسخ شما به مشتری ارسال شد و وضعیت تیکت بروز گردید.'
    );
  };

  // Status Change Helper
  const handleChangeStatus = async (status: AgentTicketItem['status']) => {
    setAgentTickets(prev =>
      prev.map(t => (t.id === activeTicket.id ? { ...t, status } : t))
    );
    try {
      const statusToApi: Record<string, string> = {
        'جدید': 'OPEN',
        'در حال بررسی': 'INVESTIGATING',
        'منتظر پاسخ مشتری': 'AWAITING_CUSTOMER',
        'حل شده': 'RESOLVED',
        'بسته شده': 'CLOSED',
      };
      await gql(UPDATE_TICKET_STATUS, { input: { id: activeTicket.id, status: statusToApi[status] || status } });
      showToast(`وضعیت تیکت به "${status}" تغییر یافت.`);
    } catch {
      showToast('خطا در بروزرسانی وضعیت. لطفاً دوباره تلاش کنید.', 'error');
    }
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
    <div className="min-h-screen dark bg-slate-950 text-slate-100 font-sans flex flex-col text-right transition-colors duration-200" dir="rtl" id="agent-portal-root">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-2xl shadow-xl border flex items-center gap-2.5 text-xs font-bold ${
              toastMessage.type === 'error'
                ? 'bg-rose-600 text-white border-rose-500'
                : 'bg-slate-900 text-white border-slate-700/60'
            }`}
          >
            {toastMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-white animate-pulse" />
            ) : (
              <Sparkles className="w-4 h-4 text-brand-400 animate-pulse" />
            )}
            <span>{toastMessage.message}</span>
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
                {agentTab === 'task-manager' && 'مدیریت وظایف'}
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
              {agentTab === 'task-manager' && 'مدیریت وظایف من'}
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
              {currentUserInitials || '؟'}
            </div>
            <div className="hidden lg:flex flex-col text-right">
              <span className="text-xs font-black text-slate-800 dark:text-slate-200">{currentUserName}</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">{currentUserRoleLabel}</span>
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
                  <span className="mr-auto text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-500 dark:text-slate-400 font-mono">
                    {teamTickets.filter(t => t.status !== 'بسته شده').length}
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
                  <span className="mr-auto text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-500 dark:text-slate-400 font-mono">
                    {myTickets.filter(t => t.status !== 'بسته شده').length}
                  </span>
                )}
              </button>

              <button
                onClick={() => { setAgentTab('task-manager'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center transition-all duration-200 ${sidebarCollapsed ? 'justify-center px-2 py-3' : 'gap-3 px-4 py-3'} rounded-xl text-xs font-semibold cursor-pointer ${
                  agentTab === 'task-manager' 
                    ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 border-r-4 border-brand-500' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title={sidebarCollapsed ? "مدیریت وظایف" : undefined}
              >
                <ClipboardList className="w-4.5 h-4.5 shrink-0" />
                {!sidebarCollapsed && <span className="whitespace-nowrap">مدیریت وظایف</span>}
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
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-2 sticky bottom-5">
            {/* Logout Button */}
            <button
              onClick={() => {
                if (window.confirm('آیا از حساب کاربری خود خارج می‌شوید؟')) {
                  onLogout();
                }
              }}
              className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-2 px-3'} py-2.5 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer`}
            >
              <LogOut className="w-4 h-4 shrink-0" />
              {!sidebarCollapsed && <span>خروج از حساب</span>}
            </button>
          </div>
        </aside>

        {/* WORKSPACE MAIN BODY */}
        <main className="p-6 flex-1 space-y-6 overflow-x-hidden">
          {fullConversationTicketId ? (() => {
            const convTicket = agentTickets.find(t => t.id === fullConversationTicketId) || activeTicket;
            if (!convTicket) return null;
            return (
              <div className="max-w-7xl mx-auto w-full">
                <AgentTicketConversation
                  ticket={convTicket}
                  userEmail={userEmail}
                  currentUserId={currentUserId}
                  customersList={customersList}
                  productsList={productsList}
                  departments={departments}
                  agentsList={agentsList}
                  onBack={() => {
                    setFullConversationTicketId(null);
                    setSelectedDrawerTicketId(null);
                  }}
                  showToast={showToast}
                  onTicketUpdated={(updated) => {
                    setAgentTickets(prev => prev.map(t => (t.id === updated.id ? updated : t)));
                    if (updated.id === activeTicketId) {
                      // keep the merged ticket in sync
                    }
                  }}
                />
              </div>
            );
          })() : (
          <>{agentTab === 'dashboard' && (
            <div className="space-y-6 max-w-7xl mx-auto w-full">
              {/* 4 ACTIONABLE KPI CARDS (real data, clickable, colored border on hover only) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {/* Card 1: تیکتهای نیازمند اقدام */}
                <button
                  onClick={() => jumpToInbox('نیازمند اقدام')}
                  className="group bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 hover:border-amber-500/50 dark:hover:border-amber-500/50 shadow-xs hover:shadow-md transition-all flex items-center justify-between text-right cursor-pointer"
                >
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">تیکتهای نیازمند اقدام</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-slate-900 dark:text-white">{dashboardKpis.needsAction.toLocaleString('fa-IR')}</span>
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-extrabold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                        اقدام ضروری
                      </span>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                </button>

                {/* Card 2: SLA نزدیک */}
                <button
                  onClick={() => jumpToInbox('SLA در خطر')}
                  className="group bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 hover:border-rose-500/50 dark:hover:border-rose-500/50 shadow-xs hover:shadow-md transition-all flex items-center justify-between text-right cursor-pointer"
                >
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">SLA نزدیک</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-slate-900 dark:text-white">{dashboardKpis.slaRisk.toLocaleString('fa-IR')}</span>
                      <span className="text-[10px] text-rose-600 dark:text-rose-400 font-extrabold bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                        کمتر از ۱ ساعت
                      </span>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                </button>

                {/* Card 3: منتظر پاسخ مشتری */}
                <button
                  onClick={() => jumpToInbox('منتظر پاسخ مشتری')}
                  className="group bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 shadow-xs hover:shadow-md transition-all flex items-center justify-between text-right cursor-pointer"
                >
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">منتظر پاسخ مشتری</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-slate-900 dark:text-white">{dashboardKpis.awaitingCustomer.toLocaleString('fa-IR')}</span>
                      <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-extrabold bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
                        نیاز به پیگیری
                      </span>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                </button>

                {/* Card 4: حل شده */}
                <button
                  onClick={() => jumpToInbox('همه', 'حل شده')}
                  className="group bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 shadow-xs hover:shadow-md transition-all flex items-center justify-between text-right cursor-pointer"
                >
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">حل شده</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-slate-900 dark:text-white">{dashboardKpis.resolved.toLocaleString('fa-IR')}</span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                        تکمیل شده
                      </span>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </button>
              </div>

              {/* CLEAN DASHBOARD OPERATIONAL OVERVIEW SECTION */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

                {/* PERFORMANCE & QUALITY METRICS (8 Cols) */}
                <div className="lg:col-span-8 space-y-5">
                  {/* Quality Metrics: minimal ring gauges */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 p-5 shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-brand-500" />
                        <h2 className="text-sm font-black text-slate-900 dark:text-white">شاخص‌های کیفیت و پاسخگویی</h2>
                      </div>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                        وضعیت مطلوب شیفت
                      </span>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Ring 1: FRT */}
                      <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60">
                        <MetricRing value={82} color="#f59e0b" />
                        <div className="text-center space-y-0.5">
                          <span className="block text-[10.5px] font-black text-slate-700 dark:text-slate-200">میانگین اولین پاسخ</span>
                          <span className="block text-[10px] text-slate-400 font-bold">۱۲ دقیقه</span>
                        </div>
                      </div>

                      {/* Ring 2: CSAT */}
                      <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60">
                        <MetricRing value={98} color="#10b981" />
                        <div className="text-center space-y-0.5">
                          <span className="block text-[10.5px] font-black text-slate-700 dark:text-slate-200">رضایت مشتری (CSAT)</span>
                          <span className="block text-[10px] text-slate-400 font-bold">از ۱۴۲ بازخورد</span>
                        </div>
                      </div>

                      {/* Ring 3: SLA Adherence */}
                      <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60">
                        <MetricRing value={99} color="#6366f1" />
                        <div className="text-center space-y-0.5">
                          <span className="block text-[10.5px] font-black text-slate-700 dark:text-slate-200">پایبندی به SLA</span>
                          <span className="block text-[10px] text-slate-400 font-bold">استاندارد عالی</span>
                        </div>
                      </div>

                      {/* Ring 4: Avg close time */}
                      <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60">
                        <MetricRing value={75} color="#0ea5e9" />
                        <div className="text-center space-y-0.5">
                          <span className="block text-[10.5px] font-black text-slate-700 dark:text-slate-200">میانگین زمان بستن</span>
                          <span className="block text-[10px] text-slate-400 font-bold">۴۵ دقیقه</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SHIFT CHECKLIST & SYSTEM NOTICES (4 Cols) */}
                <div className="lg:col-span-4 space-y-5">
                  {/* Shift Routine Checklist (editable) */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 p-5 shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                      <h3 className="text-xs font-black text-slate-900 dark:text-white">چک‌لیست روزانه شیفت</h3>
                      <span className="text-[10px] text-brand-500 font-bold">
                        {checklistDoneCount} از {checklist.length} انجام شده
                      </span>
                    </div>

                    <div className="space-y-2.5 text-xs">
                      {checklist.map(item => (
                        <div
                          key={item.id}
                          className="group flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800"
                        >
                          <input
                            type="checkbox"
                            checked={item.done}
                            onChange={() => toggleChecklistItem(item.id)}
                            className="rounded accent-brand-500 w-4 h-4 cursor-pointer shrink-0"
                          />
                          {editingChecklistId === item.id ? (
                            <input
                              autoFocus
                              value={editingChecklistText}
                              onChange={e => setEditingChecklistText(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') saveChecklistEdit(item.id);
                                if (e.key === 'Escape') setEditingChecklistId(null);
                              }}
                              className="flex-1 min-w-0 bg-white dark:bg-slate-900 border border-brand-500 rounded-lg px-2 py-1 text-xs outline-none"
                            />
                          ) : (
                            <span className={`flex-1 min-w-0 font-medium ${item.done ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-700 dark:text-slate-300'}`}>
                              {item.text}
                            </span>
                          )}
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                setEditingChecklistId(item.id);
                                setEditingChecklistText(item.text);
                              }}
                              className="p-1 text-slate-400 hover:text-brand-500 rounded-md transition-colors cursor-pointer"
                              title="ویرایش"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => removeChecklistItem(item.id)}
                              className="p-1 text-slate-400 hover:text-rose-500 rounded-md transition-colors cursor-pointer"
                              title="حذف"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add new item */}
                    <div className="flex items-center gap-2">
                      <input
                        value={checklistInput}
                        onChange={e => setChecklistInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') addChecklistItem(); }}
                        placeholder="افزودن مورد جدید..."
                        className="flex-1 min-w-0 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800 outline-none text-xs font-medium placeholder:text-slate-400 focus:border-brand-500 transition-colors"
                      />
                      <button
                        onClick={addChecklistItem}
                        className="p-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white transition-colors cursor-pointer"
                        title="افزودن"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* System & Team Announcements (minimal, with importance badges) */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 p-5 shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-slate-400" />
                        <h3 className="text-xs font-black text-slate-900 dark:text-white">اطلاعیه‌های مهم تیم پشتیبانی</h3>
                      </div>
                    </div>

                    <div className="space-y-2.5 text-xs">
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            مهم
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">امشب ساعت ۲۴:۰۰</span>
                        </div>
                        <p className="font-bold leading-relaxed text-[11px] text-slate-700 dark:text-slate-300">
                          بروزرسانی زیرساخت ابری به مدت ۱۵ دقیقه صورت می‌گیرد.
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-brand-600 dark:text-brand-400 bg-brand-500/10 border border-brand-500/20 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            اطلاعیه
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">امروز ۱۰:۳۰</span>
                        </div>
                        <p className="font-bold leading-relaxed text-[11px] text-slate-700 dark:text-slate-300">
                          قالب‌های جدید پاسخ آماده برای مشکلات درگاه پرداخت اضافه شد.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* SUPPORT TICKET INBOX VIEW (REDESIGNED TO MATCH DASHBOARD STYLE) */}
          {(agentTab === 'inbox' || agentTab === 'my-tickets') && (
            <div className="space-y-6 dir-rtl text-right pb-6 max-w-7xl mx-auto w-full">
              {/* 1. TOP NAV / HEADER */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 bg-white dark:bg-slate-900 p-6 md:p-6 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-brand-500/10 to-transparent rounded-bl-full pointer-events-none" />
                <div className="space-y-1.5 relative z-10">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-brand-500 animate-pulse" />
                    <h2 className="text-lg font-black text-slate-900 dark:text-white">
                      {agentTab === 'my-tickets' ? 'تیکت‌های من' : 'صندوق ورودی تیکت‌ها'}
                    </h2>
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-bold">
                    {agentTab === 'my-tickets'
                      ? 'تیکت‌های تخصیص‌داده‌شده به شما و در حال پیگیری'
                      : 'مشاهده، پیگیری و پاسخ‌دهی سریع به درخواست‌های پشتیبانی تحت پوشش تیم شما'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0 relative z-10">
                  <button
                    onClick={() => {
                      setIsRefreshingInbox(true);
                      setTimeout(() => {
                        setIsRefreshingInbox(false);
                        showToast('صندوق ورودی تیکت‌ها همگام‌سازی شد.');
                      }, 600);
                    }}
                    title="همگام‌سازی اطلاعات"
                    className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750 rounded-xl transition-all text-slate-550 dark:text-slate-300 cursor-pointer"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshingInbox ? 'animate-spin text-brand-500' : ''}`} />
                  </button>
                  <button
                    onClick={() => showToast('گزارش تیکت‌های جاری به صورت اکسل صادر شد.')}
                    className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750 text-xs font-black px-4.5 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-slate-400" />
                    <span>خروجی گزارش</span>
                  </button>
                  <button
                    onClick={() => setShowNewTicketModal(true)}
                    className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-black px-5 py-2.5 rounded-xl shadow-md shadow-brand-500/15 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>ایجاد تیکت جدید</span>
                  </button>
                </div>
              </div>

              {/* 2. TICKET KPI CARDS ROW */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
                <button
                  onClick={() => { setActiveQuickFilter(activeQuickFilter === 'open' ? 'all' : 'open'); setInboxFilter('نیازمند اقدام'); setInboxStatusFilter('همه'); setInboxPriorityFilter('همه'); setInboxSearch(''); setCurrentPage(1); }}
                  className={`rounded-2xl border p-5 flex items-center justify-between shadow-xs transition-all duration-200 cursor-pointer text-right ${
                    activeQuickFilter === 'open'
                      ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-700'
                      : 'bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-800/60 hover:border-brand-500/30'
                  }`}
                >
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 block uppercase tracking-wider">تیکت‌های باز</span>
                    <h4 className="text-2xl font-black text-slate-900 dark:text-white font-mono leading-none">{totalOpenTickets}</h4>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">جریان کار فعال در سیستم</span>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-500 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Inbox className="w-5 h-5" />
                  </div>
                </button>

                <button
                  onClick={() => { setActiveQuickFilter(activeQuickFilter === 'waiting' ? 'all' : 'waiting'); setInboxFilter('منتظر پاسخ مشتری'); setInboxStatusFilter('همه'); setInboxPriorityFilter('همه'); setInboxSearch(''); setCurrentPage(1); }}
                  className={`rounded-2xl border p-5 flex items-center justify-between shadow-xs transition-all duration-200 cursor-pointer text-right ${
                    activeQuickFilter === 'waiting'
                      ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700'
                      : 'bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-800/60 hover:border-brand-500/30'
                  }`}
                >
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 block uppercase tracking-wider">در انتظار پاسخ</span>
                    <h4 className="text-2xl font-black text-slate-900 dark:text-white font-mono leading-none">{totalWaitingResponse}</h4>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">نیاز به اقدام و مانیتورینگ</span>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                </button>

                <button
                  onClick={() => { setActiveQuickFilter(activeQuickFilter === 'resolved' ? 'all' : 'resolved'); setInboxFilter('همه'); setInboxStatusFilter('حل شده'); setInboxPriorityFilter('همه'); setInboxSearch(''); setCurrentPage(1); }}
                  className={`rounded-2xl border p-5 flex items-center justify-between shadow-xs transition-all duration-200 cursor-pointer text-right ${
                    activeQuickFilter === 'resolved'
                      ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-700'
                      : 'bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-800/60 hover:border-brand-500/30'
                  }`}
                >
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 block uppercase tracking-wider">حل شده</span>
                    <h4 className="text-2xl font-black text-slate-900 dark:text-white font-mono leading-none">{totalResolved}</h4>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">تیکت‌های خاتمه‌یافته نهایی</span>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </button>

                <button
                  onClick={() => { setActiveQuickFilter(activeQuickFilter === 'sla' ? 'all' : 'sla'); setInboxFilter('SLA در خطر'); setInboxStatusFilter('همه'); setInboxPriorityFilter('همه'); setInboxSearch(''); setCurrentPage(1); }}
                  className={`rounded-2xl border p-5 flex items-center justify-between shadow-xs transition-all duration-200 cursor-pointer text-right ${
                    activeQuickFilter === 'sla'
                      ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-700'
                      : 'bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-800/60 hover:border-brand-500/30'
                  }`}
                >
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 block uppercase tracking-wider">SLA در خطر</span>
                    <h4 className="text-2xl font-black text-slate-900 dark:text-white font-mono leading-none">{totalSlaRisk}</h4>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">نیازمند پیگیری فوری</span>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                </button>
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
                        value={inboxSearch}
                        onChange={e => { setInboxSearch(e.target.value); setCurrentPage(1); }}
                        className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-xs font-semibold focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all duration-150"
                      />
                    </div>

                    {/* Quick dropdown filters */}
                    <div className="flex items-center gap-2 w-full sm:w-auto font-bold text-slate-600 dark:text-slate-300">
                      <div>
                        <select
                          value={inboxStatusFilter}
                          onChange={e => { setInboxStatusFilter(e.target.value); setCurrentPage(1); setActiveQuickFilter('all'); }}
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
                          value={inboxPriorityFilter}
                          onChange={e => { setInboxPriorityFilter(e.target.value); setCurrentPage(1); setActiveQuickFilter('all'); }}
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

                    {/* Sort Selector */}
                    <select
                      value={inboxSortBy}
                      onChange={e => setInboxSortBy(e.target.value as any)}
                      title="مرتب‌سازی"
                      className="text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/40 px-3 py-2.5 outline-none focus:border-brand-500 cursor-pointer font-bold text-slate-700 dark:text-slate-300"
                    >
                      <option className="dark:bg-slate-800 dark:text-slate-200" value="newest">جدیدترین</option>
                      <option className="dark:bg-slate-800 dark:text-slate-200" value="oldest">قدیمی‌ترین</option>
                      <option className="dark:bg-slate-800 dark:text-slate-200" value="priority">اولویت</option>
                      <option className="dark:bg-slate-800 dark:text-slate-200" value="sla">ریسک SLA</option>
                    </select>
                  </div>

                  <button
                    onClick={() => {
                      setInboxFilter('همه');
                      setInboxStatusFilter('همه');
                      setInboxPriorityFilter('همه');
                      setInboxSearch('');
                      setActiveQuickFilter('all');
                      setCurrentPage(1);
                    }}
                    className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-bold hover:underline self-end lg:self-auto cursor-pointer"
                  >
                    حذف فیلترها
                  </button>
                </div>
              </div>

              {/* 4. QUICK FILTERS CHIPS */}
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: 'all', label: 'همه تیکت‌ها', count: scopedTickets.length },
                  { id: 'my', label: 'صف کاری من', count: filterCounts.myQueue },
                  { id: 'critical', label: 'وضعیت بحرانی', count: filterCounts.urgent },
                  { id: 'unanswered', label: 'پاسخ داده نشده', count: filterCounts.unanswered },
                  { id: 'sla', label: 'SLA در خطر', count: filterCounts.slaRisk },
                  { id: 'pinned', label: 'سنجاق‌شده', count: filterCounts.pinned },
                  { id: 'starred', label: 'ستاره‌دار', count: filterCounts.starred }
                ].map(c => {
                  const isActive = activeQuickFilter === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => {
                        setActiveQuickFilter(c.id);
                        setCurrentPage(1);
                        setInboxStatusFilter('همه');
                        setInboxPriorityFilter('همه');
                        switch (c.id) {
                          case 'my': setInboxFilter('صف کاری من'); break;
                          case 'critical': setInboxFilter('بحرانی'); break;
                          case 'unanswered': setInboxFilter('بدون پاسخ'); break;
                          case 'sla': setInboxFilter('SLA در خطر'); break;
                          case 'pinned': setInboxFilter('سنجاق‌شده'); break;
                          case 'starred': setInboxFilter('ستاره‌دار'); break;
                          default: setInboxFilter('همه');
                        }
                      }}
                      className={`flex items-center gap-2.5 px-4.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        isActive
                          ? 'bg-brand-600 text-white shadow-md shadow-brand-500/10 border border-transparent'
                          : 'bg-white dark:bg-slate-900 text-slate-550 hover:text-slate-800 dark:hover:text-slate-200 border border-slate-200/60 dark:border-slate-800'
                      }`}
                    >
                      <span>{c.label}</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                      }`}>
                        {c.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* 5. BULK ACTIONS FLOATING BAR */}
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
                      <button
                        onClick={() => setShowBulkAssignModal(true)}
                        className="px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white rounded-xl transition-all cursor-pointer"
                      >
                        تخصیص کارشناس
                      </button>
                      <button
                        onClick={() => setShowBulkStatusModal(true)}
                        className="px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white rounded-xl transition-all cursor-pointer"
                      >
                        تغییر وضعیت
                      </button>
                      <button
                        onClick={() => setShowBulkTagModal(true)}
                        className="px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white rounded-xl transition-all cursor-pointer"
                      >
                        برچسب
                      </button>
                      <button
                        onClick={() => setShowBulkCloseConfirm(true)}
                        className="px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-emerald-400 hover:text-emerald-300 rounded-xl transition-all cursor-pointer"
                      >
                        بستن تیکت‌ها
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

              {/* 6. MAIN TICKETS CONTAINER (Table on Desktop, Cards on Mobile) */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs overflow-hidden">
                {paginatedTickets.length > 0 ? (
                  <>
                    {/* TABLE: Shown on tablet / desktop (sm: block, mobile hidden) */}
                    <div className="hidden sm:block overflow-x-auto">
                      <table className="w-full min-w-[1100px] text-right border-collapse">
                        <thead>
                          <tr className="border-b border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-slate-450 dark:text-slate-550 text-[10px] font-extrabold uppercase">
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
                            <th className="p-4 text-center whitespace-nowrap">اولویت</th>
                            <th className="p-4 text-center whitespace-nowrap">وضعیت</th>
                            <th className="p-4 whitespace-nowrap">SLA</th>
                            <th className="p-4 pl-6 text-left whitespace-nowrap">عملیات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-xs text-slate-700 dark:text-slate-300">
                          {paginatedTickets.map((t) => {
                            const isSelected = selectedTicketIds.includes(t.id);
                            const isActive = activeTicketId === t.id;
                            const isUnread = unreadTicketIds.includes(t.id);
                            const isStarred = starredTicketIds.includes(t.id);
                            return (
                              <tr
                                key={t.id}
                                onClick={() => {
                                  setActiveTicketId(t.id);
                                  setSelectedDrawerTicketId(t.id);
                                  fetchTicketMessages(t.id);
                                }}
                                className={`group cursor-pointer hover:bg-slate-50/60 dark:hover:bg-slate-800/60 transition-colors duration-150 ${
                                  isSelected ? 'bg-brand-500/5 dark:bg-brand-500/10' : isActive ? 'bg-brand-500/5 dark:bg-brand-500/10' : ''
                                }`}
                              >
                                {/* Checkbox column */}
                                <td className="p-4 pr-6">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      if (isSelected) {
                                        setSelectedTicketIds(selectedTicketIds.filter(id => id !== t.id));
                                      } else {
                                        setSelectedTicketIds([...selectedTicketIds, t.id]);
                                      }
                                    }}
                                    className="rounded border-slate-300 dark:border-slate-700 text-brand-600 focus:ring-brand-500 cursor-pointer"
                                  />
                                </td>

                                {/* ID */}
                                <td className="p-4 whitespace-nowrap">
                                  <div className="flex items-center gap-1.5">
                                    {isUnread && <span className="w-2 h-2 rounded-full bg-brand-500 shrink-0" />}
                                    <span className="font-mono font-bold text-slate-400 dark:text-slate-500 hover:text-brand-500 transition-colors cursor-pointer">
                                      #{t.ticketNumber}
                                    </span>
                                    {t.pinned && <Pin className="w-3 h-3 text-brand-500 fill-brand-500" />}
                                    {t.assignedToMe && (
                                      <span className="flex items-center gap-0.5 text-[9px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20 shrink-0" title="به شما تخصیص داده شده">
                                        <UserCheck className="w-2.5 h-2.5" />
                                        <span>من</span>
                                      </span>
                                    )}
                                  </div>
                                </td>

                                {/* Title / Subject */}
                                <td className="p-4 pr-1 max-w-xs md:max-w-md">
                                  <div className="space-y-1">
                                    <span className={`block leading-relaxed line-clamp-1 ${isUnread ? 'font-black text-slate-900 dark:text-white' : 'font-bold text-slate-900 dark:text-slate-200'}`}>
                                      {t.title}
                                    </span>
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block">
                                      {t.customerTier} • {t.messages.length} گفتگو
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
                                  <span className="bg-slate-100 dark:bg-slate-800/80 text-slate-650 dark:text-slate-400 px-2.5 py-1 rounded-lg text-[10px] font-extrabold border border-slate-150 dark:border-slate-700/50">
                                    {t.product}
                                  </span>
                                </td>

                                {/* Priority */}
                                <td className="p-4 text-center whitespace-nowrap">
                                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black border ${getPriorityBadge(t.priority)}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${
                                      t.priority === 'بحرانی' ? 'bg-rose-500' :
                                      t.priority === 'بالا' ? 'bg-orange-500' :
                                      t.priority === 'متوسط' ? 'bg-blue-500' : 'bg-slate-400'
                                    }`} />
                                    {t.priority}
                                  </span>
                                </td>

                                {/* Status */}
                                <td className="p-4 text-center whitespace-nowrap">
                                  <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black border ${getStatusBadge(t.status)}`}>
                                    {t.status}
                                  </span>
                                </td>

                                {/* SLA */}
                                <td className="p-4 whitespace-nowrap">
                                  {t.slaRisk ? (
                                    <span className="flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-1 rounded-lg font-bold border border-rose-500/20">
                                      <Clock className="w-3.5 h-3.5 animate-pulse" />
                                      {t.slaRemaining}
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg font-bold border border-emerald-500/20">
                                      <Clock className="w-3.5 h-3.5" />
                                      {t.slaRemaining}
                                    </span>
                                  )}
                                </td>

                                {/* Actions menu */}
                                <td className="p-4 pl-6 text-left whitespace-nowrap">
                                  <div className="flex items-center justify-end gap-1">
                                    {!t.assignedToMe && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          acceptTicket(t.id);
                                        }}
                                        className="px-2 py-1.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-600 hover:text-white dark:text-emerald-400 rounded-lg text-[10px] font-black transition-colors cursor-pointer"
                                        title="پذیرش تیکت و افزودن به تیکت‌های من"
                                      >
                                        <UserPlus className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleStarFlag(t.id);
                                      }}
                                      className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-450 hover:text-amber-500 transition-colors cursor-pointer"
                                      title="ستاره‌دار"
                                    >
                                      <Star className={`w-4 h-4 ${isStarred ? 'fill-amber-500 text-amber-500' : ''}`} />
                                    </button>
                                    <button
                                      onClick={(e) => togglePin(t.id, e)}
                                      className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-450 hover:text-brand-500 transition-colors cursor-pointer"
                                      title="سنجاق‌کردن"
                                    >
                                      <Pin className={`w-4 h-4 ${t.pinned ? 'fill-brand-500 text-brand-500' : ''}`} />
                                    </button>
                                    <span className="flex items-center gap-1 text-[10px] font-bold text-brand-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                      گفتگو
                                      <MessageSquare className="w-3.5 h-3.5" />
                                    </span>
                                  </div>
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
                        const isUnread = unreadTicketIds.includes(t.id);
                        return (
                          <div
                            key={t.id}
                            onClick={() => {
                              setActiveTicketId(t.id);
                              setSelectedDrawerTicketId(t.id);
                              fetchTicketMessages(t.id);
                            }}
                            className={`p-4 rounded-2xl border transition-all space-y-3.5 text-right relative cursor-pointer ${
                              isSelected
                                ? 'bg-brand-500/5 border-brand-500/40 shadow-xs'
                                : 'bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-800/80'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {isUnread && <span className="w-2 h-2 rounded-full bg-brand-500 shrink-0" />}
                                <span className="font-mono text-[10px] font-bold text-slate-400">#{t.ticketNumber}</span>
                              </div>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border ${getPriorityBadge(t.priority)}`}>
                                {t.priority}
                              </span>
                            </div>

                            <div className="space-y-1">
                              <h4 className="text-xs font-black text-slate-900 dark:text-white leading-relaxed">
                                {t.title}
                              </h4>
                              <p className="text-[10px] text-slate-400 font-bold">{t.customer} • {t.product}</p>
                            </div>

                            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px]">
                              <span className={`px-2 py-0.5 rounded-md text-[9px] font-black border ${getStatusBadge(t.status)}`}>
                                {t.status}
                              </span>
                              <span className="text-slate-400 font-bold">{t.waitingTime}</span>
                            </div>

                            <div className="flex items-center justify-between pt-2">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  if (isSelected) {
                                    setSelectedTicketIds(selectedTicketIds.filter(id => id !== t.id));
                                  } else {
                                    setSelectedTicketIds([...selectedTicketIds, t.id]);
                                  }
                                }}
                                className="rounded accent-brand-500 cursor-pointer w-4 h-4"
                              />
                              <div className="flex items-center gap-2">
                                {!t.assignedToMe && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      acceptTicket(t.id);
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 text-emerald-600 hover:text-white dark:text-emerald-400 text-[10px] font-black transition-colors cursor-pointer flex items-center gap-1"
                                    title="پذیرش تیکت و افزودن به تیکت‌های من"
                                  >
                                    <UserPlus className="w-3 h-3" />
                                    <span>پذیرش</span>
                                  </button>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    togglePin(t.id, e);
                                  }}
                                  className="p-1 text-slate-300 dark:text-slate-600 hover:text-brand-500 cursor-pointer"
                                  title="سنجاق‌کردن"
                                >
                                  <Pin className={`w-4 h-4 ${t.pinned ? 'fill-brand-500 text-brand-500' : ''}`} />
                                </button>
                                <span className="flex items-center gap-1 text-[11px] text-brand-500 font-bold">
                                  گفتگو
                                  <MessageSquare className="w-3.5 h-3.5" />
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* PAGINATION CONTAINER */}
                    <div className="bg-slate-50/50 dark:bg-slate-950/20 border-t border-slate-100 dark:border-slate-800/80 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="text-xs text-slate-550 dark:text-slate-450 font-bold self-center">
                        نمایش <span className="font-mono text-slate-800 dark:text-white">{startIndex}</span> تا{' '}
                        <span className="font-mono text-slate-800 dark:text-white">{endIndex}</span> از{' '}
                        <span className="font-mono text-slate-800 dark:text-white">{filteredInboxTickets.length}</span> تیکت پشتیبانی
                      </div>
                      <div className="flex items-center gap-4 justify-center sm:justify-end">
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
                        onClick={() => {
                          setInboxFilter('همه');
                          setInboxStatusFilter('همه');
                          setInboxPriorityFilter('همه');
                          setInboxSearch('');
                          setActiveQuickFilter('all');
                          setCurrentPage(1);
                        }}
                        className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-black rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        ریست کردن فیلترها
                      </button>
                      <button
                        onClick={() => setShowNewTicketModal(true)}
                        className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-black rounded-xl shadow-md shadow-brand-500/15 transition-all cursor-pointer"
                      >
                        ایجاد تیکت پشتیبانی جدید
                      </button>
                    </div>
                  </div>
                )}
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
                              #{activeTicket.ticketNumber}
                            </span>
                            <span className={`text-xs px-2.5 py-0.5 rounded-lg font-extrabold border ${getStatusBadge(activeTicket.status)}`}>
                              {activeTicket.status}
                            </span>
                            <span className={`text-xs px-2.5 py-0.5 rounded-lg font-extrabold border ${getPriorityBadge(activeTicket.priority)}`}>
                              {activeTicket.priority}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {!activeTicket.assignedToMe && (
                              <button
                                onClick={() => acceptTicket(activeTicket.id)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                                title="پذیرش تیکت و افزودن به تیکت‌های من"
                              >
                                <UserPlus className="w-3.5 h-3.5" />
                                <span>پذیرش تیکت</span>
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setSelectedDrawerTicketId(null);
                                setFullConversationTicketId(activeTicket.id);
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
                              <span className="text-xs font-bold text-rose-500">{activeTicket.slaRemaining || '۱ ساعت'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Chat / Messages Thread (Scrollable) */}
                        <div className="flex-1 p-4 space-y-3 overflow-y-auto bg-slate-50/50 dark:bg-slate-950/30">
                          <div className="flex items-center justify-between text-xs text-slate-400 font-bold pb-1 border-b border-slate-200/50 dark:border-slate-800/50">
                            <span>تاریخچه گفتگو ({activeTicket.messages.length} پیام)</span>
                            <span className="text-[10px]">{activeTicket.waitingTime}</span>
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
                                onClick={() => {
                                  setTransferDepartmentId('');
                                  setTransferAgentId('');
                                  setTransferReason('');
                                  setShowTransferModal(true);
                                }}
                                className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold transition-colors cursor-pointer"
                              >
                                ارجاع تیکت
                              </button>
                              <button
                                onClick={() => {
                                  handleChangeStatus('حل شده');
                                }}
                                className="px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-emerald-600 dark:text-emerald-400 font-bold transition-colors cursor-pointer border border-emerald-500/20"
                              >
                                علامت به‌عنوان حل‌شده
                              </button>
                            </div>

                              <button
                                onClick={async () => {
                                  const ok = await sendTicketMessage(activeTicket.id, previewQuickReplyText, previewQuickReplyMode === 'note');
                                  if (!ok) {
                                    showToast('خطا در ثبت پاسخ. لطفاً دوباره تلاش کنید.');
                                    return;
                                  }
                                  if (previewQuickReplyMode === 'reply') {
                                    handleChangeStatus('منتظر پاسخ مشتری');
                                  }
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
                    {currentUserInitials || 'پ'}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-base font-black text-slate-900 dark:text-white">{currentUserName}</h2>
                    <p className="text-xs text-slate-500 mt-0.5">{currentUserRoleLabel}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-0.5 rounded-full font-bold">{userEmail}</span>
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${currentUserInfo?.active === false ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                        {currentUserInfo?.active === false ? 'غیرفعال' : 'فعال'}
                      </span>
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-bold text-[10px]">
                        وضعیت: {agentStatus}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-slate-400 font-bold md:text-left">
                    <span className="block">شماره تماس</span>
                    <span className="text-slate-800 dark:text-slate-200 font-black">{currentUserInfo?.phone || '—'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TASK MANAGER TAB */}
          {agentTab === 'task-manager' && (
            <TaskManagerView
              mode="agent"
              currentUserId={currentUserId}
              currentUserName={currentUserName}
              users={agentsList}
              showToast={showToast}
            />
          )}
          </>)}

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
                  { id: 'cmd-2', icon: UserCheck, title: 'انتقال تیکت به همکار یا دپارتمان', desc: 'ارجاع تیکت جاری به دپارتمان مرتبط', action: () => { setTransferDepartmentId(''); setTransferAgentId(''); setTransferReason(''); setShowTransferModal(true); setCommandPaletteOpen(false); } },
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
                    دپارتمان مقصد
                  </label>
                  <select
                    value={transferDepartmentId}
                    onChange={(e) => {
                      setTransferDepartmentId(e.target.value);
                      setTransferAgentId('');
                    }}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 outline-none font-bold cursor-pointer"
                  >
                    <option className="dark:bg-slate-800 dark:text-slate-200" value="">انتخاب دپارتمان...</option>
                    {departments.map(d => (
                      <option className="dark:bg-slate-800 dark:text-slate-200" key={d.id} value={d.id}>
                        {d.name}
                        {d.lead ? ` (${d.lead})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    پشتیبان مقصد (اختیاری)
                  </label>
                  <select
                    value={transferAgentId}
                    onChange={(e) => setTransferAgentId(e.target.value)}
                    disabled={!transferDepartmentId}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 outline-none font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option className="dark:bg-slate-800 dark:text-slate-200" value="">تخصیص خودکار به دپارتمان</option>
                    {transferDepartmentAgents.map(u => (
                      <option className="dark:bg-slate-800 dark:text-slate-200" key={u.id} value={u.id}>
                        {u.name} ({u.email})
                      </option>
                    ))}
                  </select>
                  {!transferDepartmentId && (
                    <p className="text-[10px] text-slate-400 font-medium mt-1">ابتدا دپارتمان مقصد را انتخاب کنید.</p>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    علت ارجاع / توضیحات فنی <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={transferReason}
                    onChange={(e) => setTransferReason(e.target.value)}
                    placeholder="علت انتقال تیکت جهت اطلاع همکار مقصد... (الزامی)"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 outline-none focus:border-brand-500 transition-colors"
                  />
                  {!transferReason.trim() && (
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium mt-1">برای ارجاع تیکت، نوشتن علت الزامی است.</p>
                  )}
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
                  onClick={handleTransferTicket}
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
                    showToast('خطا در ثبت تیکت. لطفاً دوباره تلاش کنید.');
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
                    <option className="dark:bg-slate-800 dark:text-slate-200" value="">انتخاب مشتری...</option>
                    {customersList.map(c => (
                      <option className="dark:bg-slate-800 dark:text-slate-200" key={c.id} value={c.id}>{c.name} ({c.industry})</option>
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
                    <option className="dark:bg-slate-800 dark:text-slate-200" value="">انتخاب محصول...</option>
                    {productsList.map(p => (
                      <option className="dark:bg-slate-800 dark:text-slate-200" key={p.id} value={p.id}>{p.name}</option>
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
                      <option className="dark:bg-slate-800 dark:text-slate-200" value="بحرانی">بحرانی (SLA زیر ۱ ساعت)</option>
                      <option className="dark:bg-slate-800 dark:text-slate-200" value="بالا">بالا (SLA ۴ ساعت)</option>
                      <option className="dark:bg-slate-800 dark:text-slate-200" value="متوسط">متوسط</option>
                      <option className="dark:bg-slate-800 dark:text-slate-200" value="پایین">پایین</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      تخصیص به پشتیبان
                    </label>
                    <select className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 outline-none font-bold">
                      <option className="dark:bg-slate-800 dark:text-slate-200" value="me">امیرحسین رضایی (من)</option>
                      <option className="dark:bg-slate-800 dark:text-slate-200" value="alavi">علی علوی</option>
                      <option className="dark:bg-slate-800 dark:text-slate-200" value="mousavi">زهرا موسوی</option>
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
                      #{viewingTicketModal.ticketNumber}
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
              <form onSubmit={async e => {
                e.preventDefault();
                if (!replyText.trim()) return;
                const isInternal = replyMode === 'note';
                const ok = await sendTicketMessage(viewingTicketModal.id, replyText, isInternal);
                if (!ok) {
                  showToast('خطا در ثبت پاسخ. لطفاً دوباره تلاش کنید.');
                  return;
                }
                if (replyMode === 'reply') {
                  handleChangeStatus('منتظر پاسخ مشتری');
                }
                try {
                  const data = await gql<{ ticket: ApiTicket }>(GET_TICKET, { id: viewingTicketModal.id });
                  const msgs = (data?.ticket?.messages || []).map(mapApiMessageToAgent);
                  setViewingTicketModal(prev => prev ? ({ ...prev, messages: msgs }) : prev);
                } catch {
                  // keep current modal messages on failure
                }
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

      {/* BULK CLOSE TICKETS CONFIRMATION MODAL */}
      <AnimatePresence>
        {showBulkCloseConfirm && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 text-right space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-black text-slate-900 dark:text-white">بستن گروهی تیکت‌ها</h3>
                <button
                  onClick={() => setShowBulkCloseConfirm(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 text-xs space-y-1">
                <p className="font-black text-rose-600 dark:text-rose-400">آیا از بستن گروهی تیکت‌های انتخاب‌شده مطمئن هستید؟</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  {selectedTicketIds.length.toLocaleString('fa-IR')} تیکت انتخاب شده به حالت «بسته شده» منتقل خواهند شد.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowBulkCloseConfirm(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  onClick={() => {
                    setShowBulkCloseConfirm(false);
                    setSelectedTicketIds([]);
                    showToast('عملیات بستن گروهی با موفقیت اجرا گردید.');
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-black cursor-pointer shadow-md shadow-rose-500/15"
                >
                  تایید بستن گروهی
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
