import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Send,
  Paperclip,
  Clock,
  User,
  Building,
  Layers,
  Shield,
  MoreVertical,
  CheckCircle,
  AlertTriangle,
  Trash2,
  Printer,
  Download,
  History,
  UserPlus,
  ArrowLeftRight,
  Tag,
  ChevronLeft,
  FileText,
  Image as ImageIcon,
  FileArchive,
  ExternalLink,
  Bold,
  Italic,
  List,
  Code,
  Link2,
  Smile,
  HelpCircle,
  Activity,
  Check,
  RotateCcw,
  Lock,
  Plus,
  Search,
  BookOpen,
  ArrowRight,
  Eye,
  AlertCircle,
  Edit,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import type { Ticket, Customer, Product } from '../../types';
import { gql } from '../../api/graphql';
import { UPDATE_TICKET_STATUS } from '../../api/queries';

interface TicketDetailsWorkspaceProps {
  ticket: Ticket;
  onBack: () => void;
  tickets: Ticket[];
  setTickets: React.Dispatch<React.SetStateAction<Ticket[]>>;
  customers: Customer[];
  products: Product[];
  showCustomerToast: (msg: string, type?: 'success' | 'error') => void;
  conversationThreads: { [ticketId: string]: any[] };
  setConversationThreads: React.Dispatch<React.SetStateAction<{ [ticketId: string]: any[] }>>;
  agentsList: string[];
}

export default function TicketDetailsWorkspace({
  ticket,
  onBack,
  tickets,
  setTickets,
  customers,
  products,
  showCustomerToast,
  conversationThreads,
  setConversationThreads,
  agentsList
}: TicketDetailsWorkspaceProps) {
  // Current active ticket state
  const [currentTicket, setCurrentTicket] = useState<Ticket>(ticket);

  // Sync state if ticket prop changes (based on ID)
  useEffect(() => {
    setCurrentTicket(ticket);
  }, [ticket.id]);

  // UI Interactive States
  const [composerTab, setComposerTab] = useState<'reply' | 'note'>('reply');
  const [replyText, setReplyText] = useState('');
  const [editorStyles, setEditorStyles] = useState({ bold: false, italic: false, code: false });
  const [draftSavedTime, setDraftSavedTime] = useState<string>('۱۰:۴۲');
  const [isDraftSaved, setIsDraftSaved] = useState(true);
  const [isTyping, setIsTyping] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isLoadingSkeleton, setIsLoadingSkeleton] = useState(false);
  const [activeMoreMenu, setActiveMoreMenu] = useState(false);
  const [previewFile, setPreviewFile] = useState<{ name: string; type: 'pdf' | 'zip' | 'img'; size: string; url?: string } | null>(null);
  
  // Quick status / agent change states
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showAgentDropdown, setShowAgentDropdown] = useState(false);
  const [showTransferDropdown, setShowTransferDropdown] = useState(false);

  // Edit internal note modal
  const [editingNoteIndex, setEditingNoteIndex] = useState<number | null>(null);
  const [editingNoteText, setEditingNoteText] = useState('');

  // Auto typing simulator state
  // (Static typing status without automatic periodic interval)

  // Textarea reference for focusing
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus composer helper
  const handleFocusComposer = (tab: 'reply' | 'note') => {
    setComposerTab(tab);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  };

  // Safe fetch conversation threads with rich defaults for Screen 08
  const defaultThreads = [
    {
      sender: 'customer',
      name: 'مهندس احمد زارعی',
      role: 'رابط فنی ارشد و مدیر لایه امنیت کلاینت',
      message: `با سلام و عرض خسته نباشید خدمت تیم پشتیبانی فنی سحاب. ما دیشب طبق مستندات راهنمای بخش ۲.۳ اقدام به ارتقای آنتی‌ویروس سرور مرکزی سازمان کردیم. اما متأسفانه با خطای عدم همگام‌سازی دیتابیس امضاها مواجه شدیم. فایل‌های لاگ سرور ارتقا دهنده را پیوست می‌کنم. خواهشمند است موضوع را به صورت بحرانی پیگیری فرمایید.`,
      time: 'دیروز - ۱۸:۳۰',
      avatarColor: 'bg-indigo-600',
      attachments: [
        { name: 'update_error_logs_28451.txt', size: '1.4 MB', type: 'pdf' },
        { name: 'config_backup_xml.zip', size: '4.8 MB', type: 'zip' },
        { name: 'db_sync_error_screenshot.png', size: '840 KB', type: 'img' }
      ]
    },
    {
      sender: 'agent',
      name: 'امیرحسین رضایی',
      role: 'کارشناس ارشد لایه دوم پشتیبانی فنی',
      message: `سلام جناب مهندس زارعی گرامی. ارادت فراوان. لاگ‌های ارسالی شما بررسی شد. این مشکل معمولاً به دلیل مسدود بودن پورت ۸۴۴۳ در فایروال محلی سازمان هنگام همگام‌سازی امضاهای جدید رخ می‌دهد. لطفاً ارتباط سرور را روی این پورت بررسی نمایید. در این اثنا، هم‌اکنون این پرونده را به لایه سوم مهندسی جهت مانیتورینگ آنلاین دیتابیس ارجاع می‌دهم.`,
      time: 'امروز - ۰۹:۱۵',
      avatarColor: 'bg-brand-600'
    },
    {
      sender: 'internal_note',
      name: 'مدیر فنی سیستم سحاب',
      role: 'یادداشت داخلی تیم سحاب',
      message: `همکاران گرامی لایه ۲ و ۳، توجه داشته باشید که این مشتری جزء حساب‌های سطح ویژه (VIP Platinum) است. لطفاً پورت فایروال را خودمان به صورت ریموت با تایید رابط فنی آنها تست کنیم و تا رفع نهایی مشکل، پرونده بسته نشود.`,
      time: 'امروز - ۱۰:۰۵',
      avatarColor: 'bg-amber-600 text-amber-50'
    }
  ];

  const threads = conversationThreads[currentTicket.id] || defaultThreads;

  // Sync typing updates simulated
  const handleComposeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setReplyText(e.target.value);
    if (isDraftSaved) {
      setIsDraftSaved(false);
    }
  };

  // Keyboard Ctrl+Enter handler
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      handleSubmitComposer();
    }
  };

  // Simulate Auto-saving Draft
  useEffect(() => {
    if (!replyText.trim()) return;
    const delayDebounceFn = setTimeout(() => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
      setDraftSavedTime(timeStr);
      setIsDraftSaved(true);
    }, 2000);
    return () => clearTimeout(delayDebounceFn);
  }, [replyText]);

  // Submit response or note
  const handleSubmitComposer = () => {
    if (!replyText.trim()) return;

    const now = new Date();
    const timeStr = 'هم‌اکنون';

    const newMsg = {
      sender: composerTab === 'reply' ? 'agent' : 'internal_note',
      name: 'امیرحسین رضایی',
      role: composerTab === 'reply' ? 'کارشناس ارشد پشتیبانی سحاب' : 'یادداشت داخلی تیم سحاب',
      message: replyText,
      time: timeStr,
      avatarColor: composerTab === 'reply' ? 'bg-brand-600' : 'bg-amber-600 text-amber-50',
      attachments: []
    };

    const updatedThreads = [...threads, newMsg];
    setConversationThreads({
      ...conversationThreads,
      [currentTicket.id]: updatedThreads
    });

    // Update main ticket list attributes
    const nextStatus = composerTab === 'reply' ? 'منتظر پاسخ مشتری' : currentTicket.status;
    setTickets(tickets.map(t => {
      if (t.id === currentTicket.id) {
        return {
          ...t,
          status: nextStatus as Ticket['status'],
          date: 'هم‌اکنون'
        };
      }
      return t;
    }));

    setCurrentTicket(prev => ({
      ...prev,
      status: nextStatus as Ticket['status'],
      date: 'هم‌اکنون'
    }));

    showCustomerToast(
      composerTab === 'reply' 
        ? 'پاسخ رسمی با موفقیت ارسال شد و وضعیت تیکت تغییر یافت.' 
        : 'یادداشت داخلی با موفقیت در این پرونده ثبت گردید.', 
      'success'
    );

    setReplyText('');
    setIsDraftSaved(true);
  };

  // Simulate file attaching process
  const simulateFileAttach = () => {
    setIsUploading(true);
    setUploadProgress(10);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          showCustomerToast('فایل پیوست با موفقیت بارگذاری و اسکن امنیتی شد.', 'success');
          return 100;
        }
        return prev + 30;
      });
    }, 300);
  };

  const statusToApi: Record<string, string> = { 'باز': 'OPEN', 'در حال بررسی': 'INVESTIGATING', 'منتظر پاسخ مشتری': 'AWAITING_CUSTOMER', 'بسته شده': 'CLOSED', 'حل شده': 'RESOLVED' };

  const apiUpdateTicketStatus = async (id: string, status: string) => {
    const apiStatus = statusToApi[status] || 'OPEN';
    try {
      await gql(UPDATE_TICKET_STATUS, { input: { id, status: apiStatus } });
    } catch { /* local state already updated */ }
  };

  // Change single attributes of tickets
  const handleUpdateTicketStatus = (newStatus: Ticket['status']) => {
    setTickets(tickets.map(t => t.id === currentTicket.id ? { ...t, status: newStatus } : t));
    setCurrentTicket(prev => ({ ...prev, status: newStatus }));
    apiUpdateTicketStatus(currentTicket.id, newStatus);
    showCustomerToast(`وضعیت پرونده با موفقیت به «${newStatus}» تغییر یافت.`, 'success');
    setShowStatusDropdown(false);
  };

  const handleUpdateTicketAgent = (newAgent: string) => {
    setTickets(tickets.map(t => t.id === currentTicket.id ? { ...t, assignedTo: newAgent } : t));
    setCurrentTicket(prev => ({ ...prev, assignedTo: newAgent }));
    showCustomerToast(`مسئول پرونده با موفقیت به «${newAgent}» واگذار گردید.`, 'success');
    setShowAgentDropdown(false);
  };

  // Related Tickets simulation dataset
  const relatedTickets = [
    { id: 'TKT-1021', title: 'کاهش شدید سرعت پاسخگویی متد استعلام کالا', status: 'بسته شده' },
    { id: 'TKT-1014', title: 'درخواست آپدیت پکیج امنیتی کلاینت لینوکس سحاب', status: 'حل شده' },
  ];

  // Helper info card components
  const customerInfo = customers.find(c => c.name === currentTicket.customer) || {
    name: currentTicket.customer,
    managerName: 'مهندس احمد زارعی',
    managerEmail: 'zarei@aria-security.ir',
    managerPhone: '۰۲۱-۸۸۴۵۹۰۲۱',
    platformVersion: 'v2.6.0',
    status: 'فعال'
  };

  const productInfo = (products.find(p => p.name === currentTicket.product) || {
    name: currentTicket.product,
    version: 'v2.4.0-enterprise',
    supportStatus: 'طلایی - فعال'
  }) as any;

  return (
    <div className="space-y-6 text-right pb-12 font-sans">
      {/* 1. PREMIUM HEADER SECTION */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs relative">
        {/* Background gradient safely clipped without cutting off dropdowns */}
        <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none z-0">
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-brand-500/10 to-transparent rounded-bl-full" />
        </div>
        
        {/* Navigation & Controls Row */}
        <div className="flex items-center justify-between gap-4 mb-5 relative z-10">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-xs font-black text-slate-500 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 px-4 py-2 rounded-xl transition-all cursor-pointer"
          >
            <ArrowRight className="w-4 h-4" />
            <span>بازگشت به صندوق تیکت‌ها</span>
          </button>

          {/* SIMULATOR SWITCHES FOR SHOWING EXCELLENCE */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsLoadingSkeleton(true);
                setTimeout(() => setIsLoadingSkeleton(false), 1200);
              }}
              className="text-[10px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              title="تست اسکلتون لودینگ"
            >
              <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
              <span>شبیه‌سازی اسکلت لودینگ</span>
            </button>
            <button
              onClick={() => {
                showCustomerToast('بروزرسانی زنده: تیکت با موفقیت همگام‌سازی شد.', 'success');
              }}
              className="p-2 text-slate-400 hover:text-brand-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="بروزرسانی دستی"
            >
              <Activity className="w-4.5 h-4.5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Ticket Title & Status Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-black bg-slate-100 dark:bg-slate-800 text-slate-500 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                #{currentTicket.id}
              </span>
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black border ${
                currentTicket.priority === 'بحرانی' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' :
                currentTicket.priority === 'بالا' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' :
                'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
              }`}>
                اولویت {currentTicket.priority}
              </span>
              <span className={`inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black ${
                currentTicket.status === 'باز' ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400 border border-blue-500/20' :
                currentTicket.status === 'در حال بررسی' ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400 border border-amber-500/20' :
                currentTicket.status === 'منتظر پاسخ مشتری' ? 'bg-purple-50 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400 border border-purple-500/20' :
                currentTicket.status === 'بسته شده' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400 border border-emerald-500/20' :
                'bg-slate-100 text-slate-500'
              }`}>
                {currentTicket.status}
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-relaxed">
              {currentTicket.title}
            </h1>
            
            {/* Quick Metadata list */}
            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-[10.5px] font-bold text-slate-400 dark:text-slate-500 pt-1">
              <span className="flex items-center gap-1.5"><Building className="w-4 h-4 text-slate-400/80" /> {currentTicket.customer}</span>
              <span>•</span>
              <span className="flex items-center gap-1.5"><Layers className="w-4 h-4 text-slate-400/80" /> {currentTicket.product}</span>
              <span>•</span>
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-slate-400/80" /> ایجاد شده در: ۲ روز پیش</span>
              <span>•</span>
              <span className="flex items-center gap-1.5"><Activity className="w-4 h-4 text-slate-400/80" /> آخرین فعالیت: {currentTicket.date}</span>
            </div>
          </div>

          {/* Action buttons list */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Primary Response Trigger */}
            <button
              onClick={() => handleFocusComposer('reply')}
              className="px-4.5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-black rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-brand-500/15 cursor-pointer"
            >
              <Send className="w-4 h-4 rotate-180" />
              <span>پاسخ رسمی</span>
            </button>

            {/* Quick Change Status Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowStatusDropdown(!showStatusDropdown);
                  setShowAgentDropdown(false);
                  setShowTransferDropdown(false);
                  setActiveMoreMenu(false);
                }}
                className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>تغییر وضعیت</span>
                <ChevronLeft className="w-3.5 h-3.5 rotate-270" />
              </button>
              
              <AnimatePresence>
                {showStatusDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute left-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl py-1.5 z-50 text-right"
                  >
                    {['باز', 'در حال بررسی', 'منتظر پاسخ مشتری', 'حل شده', 'بسته شده'].map((st) => (
                      <button
                        key={st}
                        onClick={() => handleUpdateTicketStatus(st as Ticket['status'])}
                        className="w-full text-right text-xs font-bold px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                      >
                        {st === 'باز' ? '🔵 باز' :
                         st === 'در حال بررسی' ? '⚙️ در حال بررسی' :
                         st === 'منتظر پاسخ مشتری' ? '✉️ منتظر پاسخ' :
                         st === 'حل شده' ? '✅ حل شده' : '🔒 بسته شده'}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Transfer dropdown trigger */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowTransferDropdown(!showTransferDropdown);
                  setShowStatusDropdown(false);
                  setShowAgentDropdown(false);
                  setActiveMoreMenu(false);
                }}
                className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>انتقال به دپارتمان</span>
              </button>

              <AnimatePresence>
                {showTransferDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute left-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl py-1.5 z-50 text-right"
                  >
                    {['تیم هسته مرکزی امنیت', 'پشتیبانی فنی زیرساخت', 'واحد توسعه محصول سحاب', 'تیم مدیریت لایسنس'].map((dept) => (
                      <button
                        key={dept}
                        onClick={() => {
                          showCustomerToast(`پرونده با موفقیت به «${dept}» ارجاع و منتقل گردید.`, 'success');
                          setShowTransferDropdown(false);
                        }}
                        className="w-full text-right text-xs font-semibold px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                      >
                        {dept}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Assign Agent dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowAgentDropdown(!showAgentDropdown);
                  setShowStatusDropdown(false);
                  setShowTransferDropdown(false);
                  setActiveMoreMenu(false);
                }}
                className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>تخصیص کارشناس</span>
              </button>

              <AnimatePresence>
                {showAgentDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute left-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl py-1.5 z-50 text-right"
                  >
                    {agentsList.map((ag) => (
                      <button
                        key={ag}
                        onClick={() => handleUpdateTicketAgent(ag)}
                        className={`w-full text-right text-xs font-bold px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 ${
                          currentTicket.assignedTo === ag ? 'bg-brand-500/5 text-brand-600' : ''
                        }`}
                      >
                        {ag}
                      </button>
                    ))}
                    <button
                      onClick={() => handleUpdateTicketAgent('بدون تخصیص (هوشمند)')}
                      className="w-full text-right text-xs font-bold px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 border-t border-slate-100 dark:border-slate-700/60"
                    >
                      بدون تخصیص (هوشمند)
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Close Ticket Button */}
            <button
              onClick={() => handleUpdateTicketStatus('بسته شده')}
              className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-xl text-xs font-black transition-all cursor-pointer"
            >
              بستن تیکت
            </button>

            {/* Three Dots Menu */}
            <div className="relative">
              <button
                onClick={() => {
                  setActiveMoreMenu(!activeMoreMenu);
                  setShowStatusDropdown(false);
                  setShowAgentDropdown(false);
                  setShowTransferDropdown(false);
                }}
                className="p-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700 rounded-xl transition-all cursor-pointer"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              <AnimatePresence>
                {activeMoreMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute left-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl py-1.5 z-50 text-right"
                  >
                    <button
                      onClick={() => {
                        window.print();
                        setActiveMoreMenu(false);
                      }}
                      className="w-full text-right text-xs font-bold px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-between"
                    >
                      <span>چاپ پرونده</span>
                      <Printer className="w-4 h-4 text-slate-400" />
                    </button>
                    <button
                      onClick={() => {
                        showCustomerToast('تمامی فایل‌های ضمیمه این پرونده فشرده شده و برای دانلود آماده گردید.', 'success');
                        setActiveMoreMenu(false);
                      }}
                      className="w-full text-right text-xs font-bold px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-between"
                    >
                      <span>دانلود یکجای فایل‌ها</span>
                      <Download className="w-4 h-4 text-slate-400" />
                    </button>
                    <button
                      onClick={() => {
                        showCustomerToast('تاریخچه لاگ‌های ممیزی (Audit Log) این پرونده ثبت و بازنشانی شد.', 'success');
                        setActiveMoreMenu(false);
                      }}
                      className="w-full text-right text-xs font-bold px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-between"
                    >
                      <span>مشاهده کامل تاریخچه تغییرات</span>
                      <History className="w-4 h-4 text-slate-400" />
                    </button>
                    <button
                      onClick={() => {
                        showCustomerToast('درخواست حذف پرونده ارسال شد. پس از تایید مدیریت کل، اقدام خواهد شد.', 'error');
                        setActiveMoreMenu(false);
                      }}
                      className="w-full text-right text-xs font-bold px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 text-rose-500 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between"
                    >
                      <span>حذف پرونده پشتیبانی</span>
                      <Trash2 className="w-4 h-4 text-rose-400" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* 2. LOADING SKELETON STATE SIMULATION */}
      {isLoadingSkeleton ? (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-4 space-y-4">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 space-y-4">
              <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-lg w-1/3 animate-pulse" />
              <div className="h-20 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
              <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 space-y-3">
              <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-lg w-1/2 animate-pulse" />
              <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-lg w-1/4 animate-pulse" />
            </div>
          </div>
          <div className="xl:col-span-5 space-y-4">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 space-y-4">
              <div className="h-32 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
              <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
            </div>
          </div>
          <div className="xl:col-span-3 space-y-4">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 space-y-4">
              <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
              <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
              <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
            </div>
          </div>
        </div>
      ) : (
        /* 3. MAIN WORKSPACE: UNIFIED CHAT LAYOUT */
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          
          {/* UNIFIED CHAT COLUMN: Message list with integrated bottom composer (Takes 8 cols on XL) */}
          <div className="xl:col-span-8 space-y-5">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs flex flex-col h-[780px] overflow-hidden">
              
              {/* Unified Chat Header */}
              <div className="flex items-center justify-between border-b border-slate-150 dark:border-slate-800 p-4 bg-slate-50/60 dark:bg-slate-950/20 shrink-0">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-brand-500" />
                  <div className="space-y-0.5">
                    <h3 className="text-xs font-black text-slate-900 dark:text-white">جریان گفتگو و پاسخ به پرونده</h3>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold">
                      <span>شناسه تیکت: #{currentTicket.id}</span>
                      <span>•</span>
                      <span>{threads.length} پیام ثبت شده</span>
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-slate-450 font-bold px-3">
                  {isDraftSaved ? (
                    <span className="flex items-center gap-1 text-emerald-500">
                      <Check className="w-3 h-3" />
                      پیشنویس ذخیره شد ({draftSavedTime})
                    </span>
                  ) : (
                    <span className="animate-pulse">در حال ذخیره‌سازی پیشنویس...</span>
                  )}
                </div>
              </div>

              {/* Messages feed scroller */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/[0.15] dark:bg-slate-950/[0.05]">
                {threads.map((msg, index) => {
                  const isAgent = msg.sender === 'agent';
                  const isNote = msg.sender === 'internal_note';

                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={index}
                      className={`p-4 rounded-2xl border transition-all text-right max-w-[85%] ${
                        isNote 
                          ? 'bg-amber-500/[0.04] dark:bg-amber-500/[0.03] border-amber-200 dark:border-amber-900/60 mr-auto' 
                          : isAgent 
                            ? 'bg-brand-500/[0.03] dark:bg-brand-500/[0.02] border-brand-100 dark:border-brand-900/40 mr-auto' 
                            : 'bg-white dark:bg-slate-800 border-slate-150 dark:border-slate-800/50 ml-auto'
                      }`}
                    >
                      {/* Message Sender Header */}
                      <div className="flex items-start justify-between gap-2.5 mb-2.5">
                        <div className="flex items-center gap-2.5">
                          {/* User Avatar with Badge/Colors */}
                          <div className={`w-8.5 h-8.5 rounded-full ${msg.avatarColor} flex items-center justify-center font-bold text-xs shrink-0 shadow-xs text-white`}>
                            {msg.name.substring(0, 2)}
                          </div>
                          <div className="space-y-0.5 text-right">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-black text-slate-900 dark:text-white">{msg.name}</span>
                              {isNote && (
                                <span className="bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md">
                                  یادداشت داخلی
                                </span>
                              )}
                            </div>
                            <span className="text-[9.5px] text-slate-400 dark:text-slate-500 font-bold block">{msg.role}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-mono font-bold text-slate-400 dark:text-slate-500">{msg.time}</span>
                          
                          {/* Edit / Delete actions for internal notes */}
                          {isNote && (
                            <div className="flex items-center gap-0.5">
                              <button
                                onClick={() => {
                                  setEditingNoteIndex(index);
                                  setEditingNoteText(msg.message);
                                }}
                                className="p-1 text-slate-400 hover:text-brand-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                                title="ویرایش یادداشت"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  const updated = threads.filter((_, i) => i !== index);
                                  setConversationThreads({
                                    ...conversationThreads,
                                    [currentTicket.id]: updated
                                  });
                                  showCustomerToast('یادداشت داخلی با موفقیت حذف شد.', 'error');
                                }}
                                className="p-1 text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                                title="حذف یادداشت"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Message Message Text */}
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-semibold whitespace-pre-line mb-3">
                        {msg.message}
                      </p>

                      {/* Support formatting (Code blocks inside message) */}
                      {msg.message.includes('پورت ۸۴۴۳') && (
                        <div className="bg-slate-950 text-emerald-400 font-mono text-[10.5px] p-3 rounded-xl mb-3 text-left direction-ltr overflow-x-auto border border-slate-800/80">
                          <code>
                            # Diagnostic Firewall test on local client<br />
                            $ nmap -p 8443 secure-db.example.com<br />
                            PORT     STATE    SERVICE<br />
                            8443/tcp FILTERED https-alt
                          </code>
                        </div>
                      )}

                      {/* Attachments Section inside Message */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="border-t border-slate-150 dark:border-slate-800/60 pt-2.5 space-y-1.5">
                          <span className="text-[10px] text-slate-400 font-black block mb-1">ضمیمه‌های مشتری:</span>
                          <div className="grid grid-cols-1 gap-2">
                            {msg.attachments.map((file: any, fidx: number) => {
                              const isImg = file.type === 'img';
                              const isZip = file.type === 'zip';
                              return (
                                <div
                                  key={fidx}
                                  onClick={() => setPreviewFile(file)}
                                  className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-950/40 border border-slate-150 dark:border-slate-800/80 hover:border-brand-500 dark:hover:border-brand-500/60 cursor-pointer transition-all"
                                >
                                  <div className="flex items-center gap-2">
                                    {isImg ? <ImageIcon className="w-4 h-4 text-blue-500" /> : isZip ? <FileArchive className="w-4 h-4 text-purple-500" /> : <FileText className="w-4 h-4 text-emerald-500" />}
                                    <span className="text-[10.5px] font-mono font-bold text-slate-600 dark:text-slate-300 truncate max-w-[180px]">{file.name}</span>
                                  </div>
                                  <span className="text-[9px] font-mono font-black text-slate-400 bg-slate-50 dark:bg-slate-900 px-1.5 py-0.5 rounded-md shrink-0">
                                    {file.size}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })}

                {/* Live typing indicator */}
                <AnimatePresence>
                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500 font-black"
                    >
                      <span className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </span>
                      <span>کارشناس مسئول در حال ثبت پاسخ است...</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* INTEGRATED BOTTOM COMPOSER */}
              <div className="border-t border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shrink-0 space-y-3">
                
                {/* Composer Tab Selectors */}
                <div className="flex items-center justify-between">
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
                </div>

                {/* Textarea container */}
                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    rows={3}
                    value={replyText}
                    onChange={handleComposeChange}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      composerTab === 'reply' 
                        ? 'پاسخ رسمی خود را بنویسید (تغییرات به ایمیل و پنل مشتری ارسال می‌شود)...' 
                        : 'یادداشت داخلی برای همکاران را بنویسید (مشتری قادر به دیدن این پیام نیست)...'
                    }
                    className={`w-full text-xs font-semibold p-4 border rounded-2xl bg-slate-50/40 dark:bg-slate-950/25 outline-none leading-relaxed resize-none transition-all ${
                      editorStyles.bold ? 'font-extrabold' : ''
                    } ${editorStyles.italic ? 'italic' : ''} ${
                      editorStyles.code ? 'font-mono bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-200' : ''
                    } ${
                      composerTab === 'note'
                        ? 'focus:border-amber-500 border-slate-200 dark:border-slate-800'
                        : 'focus:border-brand-500 border-slate-200 dark:border-slate-800'
                    }`}
                  />

                  {/* Active file upload progress simulator overlays */}
                  <AnimatePresence>
                    {isUploading && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-white/90 dark:bg-slate-900/90 rounded-2xl flex flex-col items-center justify-center p-6 space-y-4 z-20 text-center"
                      >
                        <RefreshCw className="w-8 h-8 text-brand-500 animate-spin" />
                        <div className="space-y-1 w-full max-w-xs">
                          <span className="text-xs font-black text-slate-800 dark:text-slate-100 block">در حال بارگذاری فایل پیوست...</span>
                          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-brand-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                          </div>
                          <span className="text-[10px] font-mono font-bold text-slate-400">{uploadProgress}% بارگذاری شد</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Toolbar & Actions Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Rich Text Editor Tools */}
                  <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-950/40 p-1 rounded-xl border border-slate-150 dark:border-slate-800/80">
                    <button
                      onClick={() => setEditorStyles(prev => ({ ...prev, bold: !prev.bold }))}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${editorStyles.bold ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                      title="Bold"
                    >
                      <Bold className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setEditorStyles(prev => ({ ...prev, italic: !prev.italic }))}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${editorStyles.italic ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                      title="Italic"
                    >
                      <Italic className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        const codeBlockTemplate = "```javascript\n// کد مربوطه را بنویسید\n```";
                        setReplyText(prev => prev + codeBlockTemplate);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                      title="Code Block"
                    >
                      <Code className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setReplyText(prev => prev + "\n- ")}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                      title="Bulleted List"
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setReplyText(prev => prev + " [عنوان لینک](http://...) ")}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                      title="Link"
                    >
                      <Link2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setReplyText(prev => prev + " 🌹 ")}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                      title="Add Emoji"
                    >
                      <Smile className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Attachment & Submit Row */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={simulateFileAttach}
                      className="px-3 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-xs font-black rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Paperclip className="w-3.5 h-3.5" />
                      <span>افزودن فایل پیوست</span>
                    </button>

                    <button
                      onClick={handleSubmitComposer}
                      disabled={!replyText.trim()}
                      className={`px-4.5 py-2 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40 shadow-xs ${
                        composerTab === 'note'
                          ? 'bg-amber-600 hover:bg-amber-700 text-white'
                          : 'bg-brand-600 hover:bg-brand-700 text-white'
                      }`}
                    >
                      <span>
                        {composerTab === 'reply' ? 'ارسال پاسخ رسمی' : 'ثبت یادداشت داخلی'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Keyboard Shortcut Indicator */}
                <div className="text-left text-[9.5px] text-slate-400 font-bold">
                  ارسال سریع پاسخ: <kbd className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-mono">Ctrl + Enter</kbd>
                </div>
              </div>
            </div>

            {/* LIVE ATTACHMENT / FILE DETAILED VIEW WORKSPACE */}
            <AnimatePresence>
              {previewFile ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 p-5 space-y-4 shadow-xs"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/60">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-brand-500" />
                      <h4 className="text-xs font-black text-slate-900 dark:text-white">نمایشگر پیشرفته پرونده پیوست</h4>
                    </div>
                    <button
                      onClick={() => setPreviewFile(null)}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 rounded-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-800/60 text-center">
                      {previewFile.type === 'img' ? (
                        <div className="space-y-3">
                          <div className="h-40 bg-slate-900/10 dark:bg-slate-900/70 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center relative overflow-hidden">
                            <span className="text-[10px] text-slate-400 font-black absolute top-2 right-2 bg-slate-900/60 px-2 py-0.5 rounded-md text-white">تصویر سیستم مانیتورینگ</span>
                            <div className="text-center p-4">
                              <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
                              <div className="text-rose-500 font-mono text-[10px] font-bold">CRITICAL: Sync Database Fault</div>
                              <div className="text-[9px] text-slate-400 font-bold mt-1">Error code: DB_DOCKER_PORT_8443_FILTERED</div>
                            </div>
                          </div>
                        </div>
                      ) : previewFile.type === 'zip' ? (
                        <div className="space-y-2">
                          <FileArchive className="w-12 h-12 text-purple-500 mx-auto" />
                          <span className="text-xs font-black text-slate-800 dark:text-white block">{previewFile.name}</span>
                          <span className="text-[10px] text-slate-400 block font-semibold">بسته فایل پشتیبان تنظیمات سرور لینوکس سحاب</span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <FileText className="w-12 h-12 text-emerald-500 mx-auto" />
                          <span className="text-xs font-black text-slate-800 dark:text-white block">{previewFile.name}</span>
                          <span className="text-[10px] text-slate-400 block font-semibold">دفترچه گزارش لاگ خطاهای بروزرسانی امضای فایروال</span>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center text-xs font-bold pt-2">
                      <div className="space-y-0.5">
                        <span className="text-slate-400 text-[10px] block">حجم خالص پرونده</span>
                        <span className="text-slate-800 dark:text-slate-200 font-mono">{previewFile.size}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => showCustomerToast('فایل برای ویرایش مجدد و ممیزی آماده شد.', 'success')}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 rounded-xl text-[10.5px] font-black transition-all"
                        >
                          تحلیل لاگ‌ها
                        </button>
                        <button
                          onClick={() => showCustomerToast('فایل با موفقیت در سیستم محلی بارگذاری شد.', 'success')}
                          className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-[10.5px] font-black transition-all flex items-center gap-1"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>دانلود فایل</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="p-6 bg-slate-100/30 dark:bg-slate-950/20 border border-slate-150 dark:border-slate-800/80 rounded-3xl text-center">
                  <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2.5" />
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">نمایشگر ممیزی پرونده‌ها</h4>
                  <p className="text-[10.5px] text-slate-400 dark:text-slate-500 font-bold max-w-xs mx-auto mt-1 leading-relaxed">
                    با کلیک روی فایل‌های پیوست در پیام‌ها، ممیزی هوشمند لاگ‌ها و نمایش مستقیم کدهای پیکربندی را در این بخش مانیتور کنید.
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* LEFT COLUMN: Context & Details Sidebar (Takes 4 cols on XL) */}
          <div className="xl:col-span-4 space-y-5">
            
            {/* TICKET DETAILS SECTION */}
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
                    {currentTicket.assignedTo}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-bold">طبقه‌بندی موضوعی:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">فنی / بروزرسانی امنیت</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-bold">آخرین تعامل سیستم:</span>
                  <span className="font-mono text-[10.5px] font-black text-slate-500">{currentTicket.date}</span>
                </div>
              </div>
            </div>

            {/* SLA METRICS PANEL WITH ANIMATED PROGRESS */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs p-5 space-y-4">
              <h3 className="text-xs font-black text-slate-900 dark:text-white pb-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-500" />
                <span>رعایت تفاهم‌نامه SLA لایسنس</span>
              </h3>

              <div className="space-y-4 text-xs">
                {/* 1. First Response SLA */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-slate-400">ضرب‌الاجل نخستین پاسخ:</span>
                    <span className="text-emerald-500 font-black">رعایت شد (۱۵ دقیقه)</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '100%' }} />
                  </div>
                </div>

                {/* 2. Total Resolution SLA */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-slate-400">مهلت حل و فصل نهایی:</span>
                    <span className="text-amber-500 font-black">۴ ساعت باقی‌مانده</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full animate-pulse" style={{ width: '65%' }} />
                  </div>
                </div>

                <div className="p-3 bg-emerald-500/[0.04] dark:bg-emerald-500/[0.02] border border-emerald-500/10 rounded-2xl">
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold leading-relaxed">
                    تعهد طلایی: کارشناسان سحاب متعهد به پاسخگویی زیر ۲ ساعت و رفع خطاهای سطح بحرانی حداکثر طی ۶ ساعت کاری محلی هستند.
                  </p>
                </div>
              </div>
            </div>

            {/* CUSTOMER INFORMATION DETAILS CARD */}
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
                  <span className="text-[10px] text-slate-400 block font-bold">مسئول فنی / رابط ارشد:</span>
                  <span className="text-slate-800 dark:text-slate-200 font-extrabold">{customerInfo.managerName}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 block font-bold">شماره تماس ثابت ممیزی:</span>
                  <span className="text-slate-800 dark:text-slate-200 font-mono">{customerInfo.managerPhone}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 block font-bold">پست الکترونیکی مکتوب:</span>
                  <span className="text-slate-800 dark:text-slate-200 font-mono truncate block">{customerInfo.managerEmail}</span>
                </div>

                <button
                  onClick={() => {
                    showCustomerToast('ارجاع به پرونده هویت کلاینت در بخش CRM صادر شد.', 'success');
                  }}
                  className="w-full py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700 rounded-xl text-[10.5px] font-black text-brand-600 dark:text-brand-400 transition-all text-center cursor-pointer block"
                >
                  مشاهده پروفایل جامع مشتری
                </button>
              </div>
            </div>

            {/* PRODUCT MODULE DETAILS CARD */}
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
                  <span className="text-slate-800 dark:text-slate-200 font-mono font-black">{productInfo.version}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 block font-bold">وضعیت اعتبار لایسنس:</span>
                  <span className="text-emerald-500 font-black">{productInfo.supportStatus}</span>
                </div>

                <button
                  onClick={() => {
                    showCustomerToast('ارجاع به مستندات و لایسنس‌های این محصول در هسته صادر شد.', 'success');
                  }}
                  className="w-full py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700 rounded-xl text-[10.5px] font-black text-brand-600 dark:text-brand-400 transition-all text-center cursor-pointer block"
                >
                  مشاهده اطلاعات فنی محصول
                </button>
              </div>
            </div>

            {/* RELATED TICKETS */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs p-5 space-y-4">
              <h3 className="text-xs font-black text-slate-900 dark:text-white pb-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <Tag className="w-4 h-4 text-slate-400" />
                <span>تیکت‌های مرتبط سازمان</span>
              </h3>

              <div className="space-y-3">
                {relatedTickets.map((t, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 dark:bg-slate-950/20 border border-slate-150 dark:border-slate-800/60 rounded-2xl space-y-2 text-right"
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-mono font-black text-slate-400">#{t.id}</span>
                      <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                        {t.status}
                      </span>
                    </div>
                    <p className="text-[10.5px] font-bold text-slate-700 dark:text-slate-300 truncate">
                      {t.title}
                    </p>
                    <button
                      onClick={() => {
                        const targetTicket = tickets.find(x => x.id === t.id);
                        if (targetTicket) {
                          setCurrentTicket(targetTicket);
                          showCustomerToast(`پرونده #${t.id} بارگذاری شد.`, 'success');
                        } else {
                          showCustomerToast('این تیکت آرشیو شده است و دسترسی به آن محدود می‌باشد.', 'error');
                        }
                      }}
                      className="text-[9.5px] font-black text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>مشاهده پرونده</span>
                      <ChevronLeft className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* AUDIT LOG TIMELINE */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs p-5 space-y-4">
              <h3 className="text-xs font-black text-slate-900 dark:text-white pb-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>مراحل زمانی ممیزی تیکت</span>
              </h3>

              <div className="relative border-r-2 border-slate-100 dark:border-slate-800 mr-2.5 space-y-5 pr-4 text-right">
                <div className="relative">
                  <div className="absolute -right-[21px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
                  <span className="text-[9px] font-mono text-slate-400 block font-bold">دیروز - ۱۸:۳۰</span>
                  <span className="text-[10.5px] font-extrabold text-slate-800 dark:text-slate-200 block">ثبت اولیه تیکت توسط مشتری</span>
                </div>
                <div className="relative">
                  <div className="absolute -right-[21px] top-1 w-2.5 h-2.5 rounded-full bg-brand-500 border-2 border-white dark:border-slate-900 animate-pulse" />
                  <span className="text-[9px] font-mono text-slate-400 block font-bold">امروز - ۰۹:۰۰</span>
                  <span className="text-[10.5px] font-extrabold text-slate-800 dark:text-slate-200 block">ارجاع پرونده به کارشناس مسئول</span>
                </div>
                <div className="relative">
                  <div className="absolute -right-[21px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-500 border-2 border-white dark:border-slate-900" />
                  <span className="text-[9px] font-mono text-slate-400 block font-bold">امروز - ۰۹:۱۵</span>
                  <span className="text-[10.5px] font-extrabold text-slate-800 dark:text-slate-200 block">ارسال پاسخ اول پشتیبان رسمی</span>
                </div>
                <div className="relative">
                  <div className="absolute -right-[21px] top-1 w-2.5 h-2.5 rounded-full bg-amber-500 border-2 border-white dark:border-slate-900" />
                  <span className="text-[9px] font-mono text-slate-400 block font-bold">امروز - ۱۰:۰۵</span>
                  <span className="text-[10.5px] font-extrabold text-slate-800 dark:text-slate-200 block">افزودن یادداشت خصوصی و داخلی</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* EDIT INTERNAL NOTE MODAL OVERLAY */}
      <AnimatePresence>
        {editingNoteIndex !== null && (
          <div className="fixed inset-0 bg-slate-950/50 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-lg shadow-2xl text-right"
            >
              <h3 className="text-xs font-black text-slate-900 dark:text-white mb-4">ویرایش یادداشت داخلی خصوصی</h3>
              <textarea
                rows={5}
                value={editingNoteText}
                onChange={(e) => setEditingNoteText(e.target.value)}
                className="w-full text-xs font-semibold p-4 border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-950 outline-none focus:border-amber-500 text-slate-800 dark:text-slate-200 leading-relaxed mb-4"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setEditingNoteIndex(null)}
                  className="px-4 py-2 rounded-xl text-xs font-black bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 transition-colors"
                >
                  انصراف
                </button>
                <button
                  onClick={() => {
                    const updated = [...threads];
                    updated[editingNoteIndex!] = {
                      ...updated[editingNoteIndex!],
                      message: editingNoteText
                    };
                    setConversationThreads({
                      ...conversationThreads,
                      [currentTicket.id]: updated
                    });
                    setEditingNoteIndex(null);
                    showCustomerToast('یادداشت داخلی با موفقیت ویرایش شد.', 'success');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-black bg-amber-600 hover:bg-amber-700 text-white transition-colors"
                >
                  ذخیره تغییرات
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
