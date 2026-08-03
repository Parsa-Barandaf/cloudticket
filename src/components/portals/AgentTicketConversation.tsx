import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight,
  Send,
  Clock,
  Building,
  Layers,
  Shield,
  CheckCircle,
  UserPlus,
  X,
  Lock,
  BookOpen,
  Activity,
  Check,
  AlertTriangle,
  ChevronDown,
  RefreshCw,
  Tag,
  MessageSquare
} from 'lucide-react';
import type { Customer, Product } from '../../types';
import type { AgentTicketItem } from '../../api/transform-agent';
import type { ApiTicket, ApiTicketMessage, ApiDepartment, ApiUser } from '../../api/types';
import { gql } from '../../api/graphql';
import { GET_TICKET, CREATE_TICKET_MESSAGE, UPDATE_TICKET_STATUS, UPDATE_TICKET } from '../../api/queries';
import { formatTimeAgo } from '../../lib/utils';

interface AgentTicketConversationProps {
  ticket: AgentTicketItem;
  userEmail: string;
  currentUserId?: string;
  customersList: Customer[];
  productsList: Product[];
  departments: ApiDepartment[];
  agentsList: ApiUser[];
  onBack: () => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  onTicketUpdated: (updated: AgentTicketItem) => void;
}

interface ChatMessage {
  id: string;
  sender: 'agent' | 'customer' | 'internal_note';
  name: string;
  role: string;
  message: string;
  time: string;
  avatarColor: string;
}

function mapApiMessage(m: ApiTicketMessage): ChatMessage {
  return {
    id: m.id,
    sender: m.isInternal ? 'internal_note' : (m.authorType === 'customer' ? 'customer' : 'agent'),
    name: m.senderName,
    role: m.isInternal ? 'یادداشت داخلی' : (m.authorType === 'customer' ? 'مشتری' : 'کارشناس پشتیبانی'),
    message: m.text,
    time: m.createdAt ? new Date(m.createdAt).toLocaleString('fa-IR') : '',
    avatarColor: m.isInternal ? 'bg-amber-600 text-amber-50' : (m.authorType === 'customer' ? 'bg-indigo-600' : 'bg-brand-600'),
  };
}

const statusToApi: Record<string, string> = {
  'جدید': 'OPEN',
  'در حال بررسی': 'INVESTIGATING',
  'منتظر پاسخ مشتری': 'AWAITING_CUSTOMER',
  'حل شده': 'RESOLVED',
  'بسته شده': 'CLOSED',
};

const getStatusBadge = (status: AgentTicketItem['status']) => {
  switch (status) {
    case 'جدید': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
    case 'در حال بررسی': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    case 'منتظر پاسخ مشتری': return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
    case 'حل شده': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    case 'بسته شده': return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
  }
};

const getPriorityBadge = (prio: AgentTicketItem['priority']) => {
  switch (prio) {
    case 'بحرانی': return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 font-black';
    case 'بالا': return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20 font-bold';
    case 'متوسط': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 font-medium';
    case 'پایین': return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
  }
};

export default function AgentTicketConversation({
  ticket,
  userEmail,
  currentUserId = '',
  customersList,
  productsList,
  departments,
  agentsList,
  onBack,
  showToast,
  onTicketUpdated,
}: AgentTicketConversationProps) {
  const [currentTicket, setCurrentTicket] = useState<AgentTicketItem>(ticket);

  useEffect(() => {
    setCurrentTicket(ticket);
  }, [ticket.id]);

  // ── Messages (real data) ──
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  const fetchMessages = useCallback(async (id: string) => {
    setMessagesLoading(true);
    try {
      const data = await gql<{ ticket: ApiTicket }>(GET_TICKET, { id });
      setMessages((data?.ticket?.messages || []).map(mapApiMessage));
    } catch {
      // keep existing messages on failure
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  useEffect(() => { fetchMessages(ticket.id); }, [ticket.id, fetchMessages]);

  // ── Composer ──
  const [composerTab, setComposerTab] = useState<'reply' | 'note'>('reply');
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleFocusComposer = (tab: 'reply' | 'note') => {
    setComposerTab(tab);
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      handleSubmitComposer();
    }
  };

  const updateLocalStatus = (status: AgentTicketItem['status']) => {
    setCurrentTicket(prev => ({ ...prev, status }));
    onTicketUpdated({ ...currentTicket, status });
  };

  const apiUpdateTicketStatus = async (status: AgentTicketItem['status']) => {
    try {
      await gql(UPDATE_TICKET_STATUS, { input: { id: currentTicket.id, status: statusToApi[status] || status } });
    } catch { /* local state already updated */ }
  };

  const handleChangeStatus = (status: AgentTicketItem['status']) => {
    updateLocalStatus(status);
    apiUpdateTicketStatus(status);
    setShowStatusDropdown(false);
    showToast(`وضعیت تیکت به «${status}» تغییر یافت.`);
  };

  // ── Submit reply / note ──
  const handleSubmitComposer = async () => {
    if (!replyText.trim() || isSending) return;
    setIsSending(true);
    try {
      const isInternal = composerTab === 'note';
      // Auto-assign the ticket to this agent if replying and not assigned
      if (!isInternal && !currentTicket.assignedToMe && currentUserId) {
        await gql(UPDATE_TICKET, { input: { id: currentTicket.id, assignedToId: currentUserId } });
        setCurrentTicket(prev => ({ ...prev, assignedToMe: true }));
        onTicketUpdated({ ...currentTicket, assignedToMe: true });
      }
      await gql(CREATE_TICKET_MESSAGE, {
        input: {
          ticketId: currentTicket.id,
          text: replyText.trim(),
          senderName: userEmail,
          isInternal,
          authorType: 'agent',
        },
      });
      await fetchMessages(currentTicket.id);
      if (!isInternal) {
        updateLocalStatus('منتظر پاسخ مشتری');
        apiUpdateTicketStatus('منتظر پاسخ مشتری');
      }
      setReplyText('');
      showToast(isInternal ? 'یادداشت داخلی با موفقیت ثبت شد.' : 'پاسخ رسمی با موفقیت ارسال شد.');
    } catch {
      showToast('خطا در ثبت پاسخ. لطفاً دوباره تلاش کنید.');
    } finally {
      setIsSending(false);
    }
  };

  // ── Accept ticket ──
  const handleAccept = async () => {
    if (!currentUserId) {
      showToast('برای پذیرش تیکت ابتدا وارد حساب شوید.');
      return;
    }
    try {
      await gql(UPDATE_TICKET, { input: { id: currentTicket.id, assignedToId: currentUserId } });
      const updated = { ...currentTicket, assignedToMe: true };
      setCurrentTicket(updated);
      onTicketUpdated(updated);
      showToast('تیکت با موفقیت به شما تخصیص داده شد.');
    } catch {
      showToast('خطا در تخصیص تیکت.');
    }
  };

  // ── Transfer modal state ──
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferDepartmentId, setTransferDepartmentId] = useState('');
  const [transferAgentId, setTransferAgentId] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);

  // ── Close ticket confirmation ──
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  const transferDepartmentAgents = useMemo(() => {
    if (!transferDepartmentId) return [] as typeof agentsList;
    return agentsList.filter(u => u.departmentId === transferDepartmentId);
  }, [agentsList, transferDepartmentId]);

  const handleTransfer = async () => {
    if (!transferDepartmentId) {
      showToast('لطفاً دپارتمان مقصد را انتخاب کنید.');
      return;
    }
    if (!transferReason.trim()) {
      showToast('برای انتقال تیکت، نوشتن علت ارجاع الزامی است.');
      return;
    }
    setIsTransferring(true);
    try {
      const targetDept = departments.find(d => d.id === transferDepartmentId);
      const targetAgent = agentsList.find(u => u.id === transferAgentId);
      const targetProduct = targetDept?.assignedProducts?.length
        ? productsList.find(p => targetDept.assignedProducts.includes(p.name) || targetDept.assignedProducts.includes(p.id))
        : undefined;

      const updateInput: { id: string; assignedToId?: string | null; productId?: string } = { id: currentTicket.id };
      updateInput.assignedToId = transferAgentId || null;
      if (targetProduct?.id) updateInput.productId = targetProduct.id;
      await gql(UPDATE_TICKET, { input: updateInput });

      const deptName = targetDept?.name || 'دپارتمان مقصد';
      const agentName = targetAgent?.name || (transferAgentId ? 'همکار' : '');
      const noteText = `ارجاع تیکت به ${deptName}${agentName ? ` (${agentName})` : ''}\nعلت ارجاع: ${transferReason.trim()}`;
      await gql(CREATE_TICKET_MESSAGE, {
        input: { ticketId: currentTicket.id, text: noteText, senderName: userEmail, isInternal: true, authorType: 'agent' },
      });

      await fetchMessages(currentTicket.id);
      const updated = {
        ...currentTicket,
        assignedToMe: !!transferAgentId && transferAgentId === currentUserId,
        product: targetProduct?.name || currentTicket.product,
        productId: targetProduct?.id || currentTicket.productId,
      };
      setCurrentTicket(updated);
      onTicketUpdated(updated);
      setShowTransferModal(false);
      setTransferDepartmentId('');
      setTransferAgentId('');
      setTransferReason('');
      showToast(`تیکت با موفقیت به «${deptName}» ارجاع داده شد.`);
    } catch {
      showToast('خطا در ارجاع تیکت. لطفاً دوباره تلاش کنید.');
    } finally {
      setIsTransferring(false);
    }
  };

  // ── Dropdowns ──
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchMessages(currentTicket.id);
    setIsRefreshing(false);
    showToast('گفتگو همگام‌سازی شد.');
  };

  const customerInfo = customersList.find(c => c.name === currentTicket.customer) || {
    name: currentTicket.customer,
    tier: currentTicket.customerTier,
    status: 'فعال',
  };
  const productInfo = productsList.find(p => p.name === currentTicket.product) || {
    name: currentTicket.product,
    version: '—',
    status: 'فعال',
  } as any;

  return (
    <div className="space-y-6 text-right pb-12 font-sans">
      {/* 1. PREMIUM HEADER SECTION */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs relative">
        <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none z-0">
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-brand-500/10 to-transparent rounded-bl-full" />
        </div>

        <div className="flex items-center justify-between gap-4 mb-5 relative z-10">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-xs font-black text-slate-500 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 px-4 py-2 rounded-xl transition-all cursor-pointer"
          >
            <ArrowRight className="w-4 h-4" />
            <span>بازگشت به صندوق تیکت‌ها</span>
          </button>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-black bg-slate-100 dark:bg-slate-800 text-slate-500 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                #{currentTicket.ticketNumber}
              </span>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black border ${getPriorityBadge(currentTicket.priority)}`}>
                اولویت {currentTicket.priority}
              </span>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black border ${getStatusBadge(currentTicket.status)}`}>
                {currentTicket.status}
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-relaxed">
              {currentTicket.title}
            </h1>

            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-[10.5px] font-bold text-slate-400 dark:text-slate-500 pt-1">
              <span className="flex items-center gap-1.5"><Building className="w-4 h-4" /> {currentTicket.customer}</span>
              <span>•</span>
              <span className="flex items-center gap-1.5"><Layers className="w-4 h-4" /> {currentTicket.product}</span>
              <span>•</span>
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {currentTicket.createdAt || ''}</span>
              <span>•</span>
              <span className="flex items-center gap-1.5"><Activity className="w-4 h-4" /> {currentTicket.slaRemaining}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {!currentTicket.assignedToMe && (
              <button
                onClick={handleAccept}
                className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black rounded-xl transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-500/15 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>پذیرش تیکت</span>
              </button>
            )}

            <button
              onClick={() => handleFocusComposer('reply')}
              className="px-4.5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-black rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-brand-500/15 cursor-pointer"
            >
              <Send className="w-4 h-4 rotate-180" />
              <span>پاسخ رسمی</span>
            </button>

            <div className="relative">
              <button
                onClick={() => setShowStatusDropdown(prev => !prev)}
                className="px-4 py-2.5 bg-slate-50 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>تغییر وضعیت</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              <AnimatePresence>
                {showStatusDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute left-0 mt-2 w-52 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl py-1.5 z-50 text-right"
                  >
                    {(['جدید', 'در حال بررسی', 'منتظر پاسخ مشتری', 'حل شده', 'بسته شده'] as AgentTicketItem['status'][]).map(st => (
                      <button
                        key={st}
                        onClick={() => handleChangeStatus(st)}
                        className={`w-full text-right text-xs font-bold px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${
                          currentTicket.status === st ? 'bg-brand-500/5 text-brand-600' : 'text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={() => {
                setTransferDepartmentId('');
                setTransferAgentId('');
                setTransferReason('');
                setShowTransferModal(true);
              }}
              className="px-4 py-2.5 bg-slate-50 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>ارجاع تیکت</span>
            </button>

            <button
              onClick={() => setShowCloseConfirm(true)}
              className={`px-4 py-2.5 border rounded-xl text-xs font-black transition-all cursor-pointer ${
                currentTicket.status === 'بسته شده'
                  ? 'bg-slate-100 dark:bg-slate-800/40 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-700 cursor-not-allowed'
                  : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/20'
              }`}
            >
              بستن تیکت
            </button>
          </div>
        </div>
      </div>

      {/* 2. MAIN WORKSPACE: UNIFIED CHAT LAYOUT */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* UNIFIED CHAT COLUMN */}
        <div className="xl:col-span-8 space-y-5">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs flex flex-col h-[720px] overflow-hidden">
            {/* Chat Header */}
            <div className="flex items-center justify-between border-b border-slate-150 dark:border-slate-800 p-4 bg-slate-50/60 dark:bg-slate-950/20 shrink-0">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-brand-500" />
                <div className="space-y-0.5">
                  <h3 className="text-xs font-black text-slate-900 dark:text-white">جریان گفتگو و پاسخ به پرونده</h3>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold">
                    <span>شناسه تیکت: #{currentTicket.id}</span>
                    <span>•</span>
                    <span>{messages.length} پیام ثبت شده</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleRefresh}
                className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 hover:text-brand-500 transition-colors cursor-pointer"
                title="همگام‌سازی گفتگو"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-brand-500' : ''}`} />
              </button>
            </div>

            {/* Messages feed */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/[0.15] dark:bg-slate-950/[0.05]">
              {messagesLoading && messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <RefreshCw className="w-6 h-6 text-brand-500 animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageSquare className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-2" />
                  <span className="text-xs font-black text-slate-500 dark:text-slate-400">هنوز پیامی برای این تیکت ثبت نشده است</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-bold">اولین پاسخ را از طریق بخش پایین ثبت کنید.</span>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isAgent = msg.sender === 'agent';
                  const isNote = msg.sender === 'internal_note';
                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={msg.id || index}
                      className={`p-4 rounded-2xl border transition-all text-right max-w-[85%] ${
                        isNote
                          ? 'bg-amber-500/[0.04] dark:bg-amber-500/[0.03] border-amber-200 dark:border-amber-900/60 mr-auto'
                          : isAgent
                            ? 'bg-brand-500/[0.03] dark:bg-brand-500/[0.02] border-brand-100 dark:border-brand-900/40 mr-auto'
                            : 'bg-white dark:bg-slate-800 border-slate-150 dark:border-slate-800/50 ml-auto'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2.5 mb-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8.5 h-8.5 rounded-full ${msg.avatarColor} flex items-center justify-center font-bold text-xs shrink-0 shadow-xs text-white`}>
                            {msg.name.substring(0, 2)}
                          </div>
                          <div className="space-y-0.5 text-right">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-black text-slate-900 dark:text-white">{msg.name}</span>
                              {isNote && (
                                <span className="bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                                  <Lock className="w-2.5 h-2.5" />
                                  یادداشت داخلی
                                </span>
                              )}
                            </div>
                            <span className="text-[9.5px] text-slate-400 dark:text-slate-500 font-bold block">{msg.role}</span>
                          </div>
                        </div>
                        <span className="text-[9px] font-mono font-bold text-slate-400 dark:text-slate-500">{msg.time}</span>
                      </div>

                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-semibold whitespace-pre-line">
                        {msg.message}
                      </p>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Composer */}
            <div className="border-t border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shrink-0 space-y-3">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleFocusComposer('reply')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                    composerTab === 'reply'
                      ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-100 dark:border-brand-500/20 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                  }`}
                >
                  <Send className="w-3.5 h-3.5 rotate-180" />
                  <span>پاسخ رسمی پشتیبانی</span>
                </button>
                <button
                  onClick={() => handleFocusComposer('note')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                    composerTab === 'note'
                      ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>یادداشت داخلی (خصوصی)</span>
                </button>
              </div>

              <textarea
                ref={textareaRef}
                rows={3}
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  composerTab === 'reply'
                    ? 'پاسخ رسمی خود را بنویسید (تغییرات به ایمیل و پنل مشتری ارسال می‌شود)...'
                    : 'یادداشت داخلی برای همکاران را بنویسید (مشتری قادر به دیدن این پیام نیست)...'
                }
                className={`w-full text-xs font-semibold p-4 border rounded-2xl bg-slate-50/40 dark:bg-slate-950/25 outline-none leading-relaxed resize-none transition-all ${
                  composerTab === 'note'
                    ? 'focus:border-amber-500 border-slate-200 dark:border-slate-800'
                    : 'focus:border-brand-500 border-slate-200 dark:border-slate-800'
                }`}
              />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-[9.5px] text-slate-400 font-bold">
                  ارسال سریع پاسخ: <kbd className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-mono">Ctrl + Enter</kbd>
                </div>
                <button
                  onClick={handleSubmitComposer}
                  disabled={!replyText.trim() || isSending}
                  className={`px-4.5 py-2 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40 shadow-xs ${
                    composerTab === 'note'
                      ? 'bg-amber-600 hover:bg-amber-700 text-white'
                      : 'bg-brand-600 hover:bg-brand-700 text-white'
                  }`}
                >
                  {isSending && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>
                    {composerTab === 'reply' ? 'ارسال پاسخ رسمی' : 'ثبت یادداشت داخلی'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* LEFT COLUMN: Context & Details Sidebar */}
        <div className="xl:col-span-4 space-y-5">
          {/* TICKET DETAILS */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs p-5 space-y-4">
            <h3 className="text-xs font-black text-slate-900 dark:text-white pb-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <Tag className="w-4 h-4 text-brand-500" />
              <span>مشخصات فنی پرونده</span>
            </h3>
            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-bold">شناسه پرونده:</span>
                <span className="font-mono font-black text-slate-800 dark:text-slate-200">#{currentTicket.id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-bold">مسئول پیگیری:</span>
                <span className="font-black text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                  {currentTicket.assignedToMe ? 'شما (این کارشناس)' : 'بدون تخصیص'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-bold">سطح حساب:</span>
                <span className="font-extrabold text-amber-600 dark:text-amber-400">{currentTicket.customerTier}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-bold">آخرین تعامل سیستم:</span>
                <span className="font-mono text-[10.5px] font-black text-slate-500">{currentTicket.createdAt}</span>
              </div>
            </div>
          </div>

          {/* SLA METRICS */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs p-5 space-y-4">
            <h3 className="text-xs font-black text-slate-900 dark:text-white pb-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-500" />
              <span>وضعیت SLA</span>
            </h3>
            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-slate-400">مهلت باقیمانده:</span>
                  <span className={`${currentTicket.slaRisk ? 'text-rose-500' : 'text-emerald-500'} font-black`}>
                    {currentTicket.slaRemaining}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${currentTicket.slaRisk ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: currentTicket.slaRisk ? '70%' : '30%' }} />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-slate-400">وضعیت نهایی:</span>
                  <span className={`${currentTicket.status === 'بسته شده' ? 'text-emerald-500' : 'text-brand-500'} font-black`}>
                    {currentTicket.status}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${currentTicket.status === 'بسته شده' ? 'bg-emerald-500' : 'bg-brand-500'}`} style={{ width: currentTicket.status === 'بسته شده' ? '100%' : '50%' }} />
                </div>
              </div>
              {currentTicket.slaRisk && (
                <div className="flex items-center gap-2 text-[10px] font-black text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">
                  <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
                  این تیکت در خطر نقض SLA قرار دارد.
                </div>
              )}
            </div>
          </div>

          {/* CUSTOMER INFO */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs p-5 space-y-4">
            <h3 className="text-xs font-black text-slate-900 dark:text-white pb-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <Building className="w-4 h-4 text-slate-400" />
              <span>اطلاعات شرکت مشتری</span>
            </h3>
            <div className="space-y-3.5 text-xs font-semibold">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 block font-bold">عنوان کامل سازمان:</span>
                <span className="text-slate-900 dark:text-white font-black">{customerInfo.name}</span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 block font-bold">سطح پشتیبانی:</span>
                <span className="text-amber-600 dark:text-amber-400 font-extrabold">{currentTicket.customerTier}</span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 block font-bold">وضعیت مشتری:</span>
                <span className="text-emerald-500 font-black">{customerInfo.status || 'فعال'}</span>
              </div>
            </div>
          </div>

          {/* PRODUCT INFO */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs p-5 space-y-4">
            <h3 className="text-xs font-black text-slate-900 dark:text-white pb-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-400" />
              <span>اطلاعات محصول ارجاعی</span>
            </h3>
            <div className="space-y-3.5 text-xs font-semibold">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 block font-bold">سیستم نرم‌افزاری ارجاعی:</span>
                <span className="text-slate-900 dark:text-white font-black">{productInfo.name}</span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 block font-bold">نسخه فعال نصب شده:</span>
                <span className="text-slate-800 dark:text-slate-200 font-mono font-black">{productInfo.version || '—'}</span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 block font-bold">وضعیت محصول:</span>
                <span className="text-emerald-500 font-black">{productInfo.status || 'فعال'}</span>
              </div>
            </div>
          </div>

          {/* TIMELINE */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs p-5 space-y-4">
            <h3 className="text-xs font-black text-slate-900 dark:text-white pb-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>مراحل زمانی تیکت</span>
            </h3>
            <div className="relative z-0 border-r-2 border-slate-100 dark:border-slate-800 mr-2.5 space-y-5 pr-4 text-right max-h-64 overflow-y-auto">
              <div className="relative z-0">
                <div className="absolute -right-[21px] top-1 z-20 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
                <span className="text-[11px] font-mono text-slate-400 block font-bold">{currentTicket.createdAt || ''}</span>
                <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 block">ثبت اولیه تیکت</span>
              </div>
              {messages.map((msg, idx) => {
                const isNote = msg.sender === 'internal_note';
                const color = isNote ? 'bg-amber-500' : msg.sender === 'agent' ? 'bg-brand-500' : 'bg-indigo-500';
                const label = isNote ? 'افزودن یادداشت داخلی' : msg.sender === 'agent' ? 'پاسخ کارشناس پشتیبانی' : 'پاسخ مشتری';
                return (
                  <div key={msg.id || idx} className="relative">
                    <div className={`absolute -right-[21px] top-1 w-2.5 h-2.5 rounded-full ${color} border-2 border-white dark:border-slate-900`} />
                    <span className="text-[11px] font-mono text-slate-400 block font-bold">{msg.time || ''}</span>
                    <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 block">{label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

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
                <h3 className="text-sm font-black text-slate-900 dark:text-white">انتقال تیکت {currentTicket.id}</h3>
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
                  onClick={handleTransfer}
                  disabled={isTransferring}
                  className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-black cursor-pointer shadow-md shadow-brand-500/15 disabled:opacity-50"
                >
                  {isTransferring ? 'در حال ارجاع...' : 'تایید و ارجاع'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CLOSE TICKET CONFIRMATION MODAL */}
      <AnimatePresence>
        {showCloseConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 text-right space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-black text-slate-900 dark:text-white">بستن تیکت #{currentTicket.ticketNumber}</h3>
                <button
                  onClick={() => setShowCloseConfirm(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 text-xs space-y-1">
                <p className="font-black text-rose-600 dark:text-rose-400">آیا از بستن این تیکت مطمئن هستید؟</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">با بستن تیکت، چرخه پشتیبانی این درخواست به پایان می‌رسد.</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowCloseConfirm(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  onClick={() => {
                    setShowCloseConfirm(false);
                    handleChangeStatus('بسته شده');
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-black cursor-pointer shadow-md shadow-rose-500/15"
                >
                  تایید بستن تیکت
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SUCCESS ICON HINT */}
      <div className="hidden">
        <CheckCircle className="w-4 h-4" />
        <Check className="w-4 h-4" />
      </div>
    </div>
  );
}
