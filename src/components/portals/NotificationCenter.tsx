import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNotifications } from '../../hooks/useNotifications';
import type { NotificationItem } from '../../types';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Trash2, 
  Archive, 
  Filter, 
  RotateCcw, 
  Search, 
  AtSign, 
  Settings, 
  Activity, 
  Clock, 
  AlertTriangle, 
  Info, 
  ShieldAlert, 
  Ticket, 
  Layers, 
  Users, 
  Key, 
  Send, 
  ExternalLink, 
  ChevronDown, 
  ChevronUp, 
  Sliders, 
  Mail, 
  Smartphone, 
  Monitor, 
  User, 
  MessageSquare, 
  FileText, 
  MoreVertical, 
  Eye, 
  X,
  Radio,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

export interface ActivityFeedItem {
  id: string;
  actor: string;
  actorRole: string;
  avatarBg: string;
  action: string;
  target: string;
  time: string;
  category: 'tickets' | 'products' | 'users' | 'licenses' | 'system';
  badgeColor: string;
}

interface NotificationCenterViewProps {
  showToast: (msg: string, type?: 'success' | 'error') => void;
  onNavigateToTicket?: (ticketId: string) => void;
  onNotificationsChanged?: () => void;
}

export default function NotificationCenterView({ showToast, onNotificationsChanged }: NotificationCenterViewProps) {
  // Sub-tabs in Notification Center Page
  const [activeSubTab, setActiveSubTab] = useState<'timeline' | 'activity' | 'mentions' | 'preferences'>('timeline');

  // Real notifications from API
  const [showArchived, setShowArchived] = useState<boolean>(false);
  const {
    notifications,
    loading,
    error: notificationsError,
    refetch: refetchNotifications,
    markRead,
    markAllRead,
    toggleArchive,
    remove,
    removeMany,
  } = useNotifications(100, showArchived);

  // Activity Feed State
  const [activities] = useState<ActivityFeedItem[]>([
    { id: 'ACT-1', actor: 'امیرحسین رضایی', actorRole: 'کارشناس پشتیبانی', avatarBg: 'bg-blue-600', action: 'وضعیت تیکت #TK-1025 را تغییر داد به:', target: 'در حال بررسی', time: '۱۰ دقیقه پیش', category: 'tickets', badgeColor: 'bg-amber-500/10 text-amber-600' },
    { id: 'ACT-2', actor: 'آرش کریمی', actorRole: 'مدیر ارشد امنیت', avatarBg: 'bg-indigo-600', action: 'کلید فعال‌سازی جدید برای محصول صادر کرد:', target: 'Cloud Security Platform', time: '۲۵ دقیقه پیش', category: 'licenses', badgeColor: 'bg-blue-500/10 text-blue-600' },
    { id: 'ACT-3', actor: 'سارا صادقی', actorRole: 'مدیر فروش', avatarBg: 'bg-emerald-600', action: 'مشخصات شرکت مشتری را بروزرسانی کرد:', target: 'فروشگاه آنلاین آفرین', time: '۱ ساعت پیش', category: 'users', badgeColor: 'bg-emerald-500/10 text-emerald-600' },
    { id: 'ACT-4', actor: 'علیرضا مجیدی', actorRole: 'مدیر کل', avatarBg: 'bg-purple-600', action: 'نقش دسترسی دسته‌جمعی جدید تعریف کرد:', target: 'مدیر ارشد پشتیبانی (RBAC)', time: '۳ ساعت پیش', category: 'system', badgeColor: 'bg-purple-500/10 text-purple-600' },
    { id: 'ACT-5', actor: 'سیستم خودمختار ', actorRole: 'Bot', avatarBg: 'bg-rose-600', action: 'هشدار انقضای لایسنس ارسال کرد به:', target: 'هلدینگ عمران مهر', time: '۵ ساعت پیش', category: 'licenses', badgeColor: 'bg-rose-500/10 text-rose-600' },
    { id: 'ACT-6', actor: 'مریم اکبری', actorRole: 'پشتیبانی فنی', avatarBg: 'bg-pink-600', action: 'فایل پیکربندی جدید را آپلود کرد در:', target: 'تیکت #TK-1022', time: 'دیروز', category: 'tickets', badgeColor: 'bg-indigo-500/10 text-indigo-600' }
  ]);

  // Filters State for Notification Timeline
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('همه');
  const [filterStatus, setFilterStatus] = useState<string>('همه');
  const [filterPriority, setFilterPriority] = useState<string>('همه');

  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Expanded Notification detail view modal
  const [expandedNotification, setExpandedNotification] = useState<NotificationItem | null>(null);

  // Mention system state
  const [mentionInput, setMentionInput] = useState<string>('');
  const [showMentionAutocomplete, setShowMentionAutocomplete] = useState<boolean>(false);
  const [mentionSearchText, setMentionSearchText] = useState<string>('');
  const [savedNotes, setSavedNotes] = useState<Array<{ id: string; text: string; author: string; time: string }>>([
    { id: '1', text: 'با @آرش کریمی جهت بررسی لاگ‌های SSL گره‌های  هماهنگ شد.', author: 'امیرحسین رضایی', time: '۱۰ دقیقه پیش' },
    { id: '2', text: 'لطفاً @سارا صادقی وضعیت فاکتور تمدید شرکت آفرین را پیگیری نمایند.', author: 'علیرضا مجیدی', time: '۱ ساعت پیش' }
  ]);

  const teamMembers = [
    { name: 'امیرحسین رضایی', role: 'کارشناس پشتیبانی', email: 'rezaei@example.com' },
    { name: 'آرش کریمی', role: 'مدیر امنیت', email: 'a.karimi@ariasecurity.ir' },
    { name: 'سارا صادقی', role: 'مدیر فروش', email: 's.sadeghi@afarin.shop' },
    { name: 'علیرضا مجیدی', role: 'مدیر کل', email: 'majidi@novintech.ir' },
    { name: 'مریم اکبری', role: 'کارشناس فنی', email: 'akbari@example.com' }
  ];

  // Notification Preferences State
  const [preferences, setPreferences] = useState({
    ticketNew: { inApp: true, email: true, push: false, frequency: 'instant' },
    ticketReply: { inApp: true, email: true, push: true, frequency: 'instant' },
    ticketClosed: { inApp: true, email: false, push: false, frequency: 'daily' },
    userMentions: { inApp: true, email: true, push: true, frequency: 'instant' },
    userInvites: { inApp: true, email: true, push: false, frequency: 'instant' },
    licenseExpiring: { inApp: true, email: true, push: true, frequency: 'instant' },
    systemAlerts: { inApp: true, email: true, push: false, frequency: 'weekly' }
  });

  // Filtered Notifications computation
  const filteredNotifications = useMemo(() => {
    return notifications.filter(item => {
      if (item.archived !== showArchived) return false;

      const matchesSearch = 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.linkedObject && item.linkedObject.name.toLowerCase().includes(searchQuery.toLowerCase()));

      let matchesType = true;
      if (filterType === 'تیکت‌ها') matchesType = item.type === 'tickets';
      else if (filterType === 'وظایف') matchesType = item.type === 'tasks';
      else if (filterType === 'کاربران') matchesType = item.type === 'users';
      else if (filterType === 'محصولات') matchesType = item.type === 'products';
      else if (filterType === 'لایسنس‌ها') matchesType = item.type === 'licenses';
      else if (filterType === 'سیستم') matchesType = item.type === 'system';

      let matchesStatus = true;
      if (filterStatus === 'خوانده‌نشده') matchesStatus = !item.read;
      else if (filterStatus === 'خوانده‌شده') matchesStatus = item.read;

      let matchesPriority = true;
      if (filterPriority === 'عادی') matchesPriority = item.priority === 'normal';
      else if (filterPriority === 'مهم') matchesPriority = item.priority === 'important';
      else if (filterPriority === 'بحرانی') matchesPriority = item.priority === 'critical';

      return matchesSearch && matchesType && matchesStatus && matchesPriority;
    });
  }, [notifications, searchQuery, filterType, filterStatus, filterPriority, showArchived]);

  // Bulk Helpers
  const handleSelectAll = () => {
    if (selectedIds.length === filteredNotifications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredNotifications.map(n => n.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkMarkRead = async () => {
    await Promise.all(selectedIds.map(id => markRead(id)));
    await refetchNotifications();
    onNotificationsChanged?.();
    showToast(`${selectedIds.length} اعلان انتخاب شده به عنوان خوانده شده علامت‌گذاری شدند.`, 'success');
    setSelectedIds([]);
  };

  const handleBulkArchive = async () => {
    await Promise.all(selectedIds.map(id => toggleArchive(id)));
    await refetchNotifications();
    onNotificationsChanged?.();
    showToast(`${selectedIds.length} اعلان منتقل شدند.`, 'success');
    setSelectedIds([]);
  };

  const handleBulkDelete = async () => {
    await removeMany(selectedIds);
    await refetchNotifications();
    onNotificationsChanged?.();
    showToast(`${selectedIds.length} اعلان با موفقیت حذف شدند.`, 'error');
    setSelectedIds([]);
  };

  const handleMarkSingleRead = async (id: string) => {
    await markRead(id);
    onNotificationsChanged?.();
  };

  const handleArchiveSingle = async (id: string) => {
    const item = notifications.find(n => n.id === id);
    if (!item) return;
    await toggleArchive(id);
    onNotificationsChanged?.();
    showToast(item.archived ? 'اعلان به صندوق اصلی بازگردانده شد.' : 'اعلان بایگانی شد.', 'success');
  };

  const handleDeleteSingle = async (id: string) => {
    await remove(id);
    onNotificationsChanged?.();
    showToast('اعلان با موفقیت حذف گردید.', 'error');
  };

  const handleMarkAllRead = async () => {
    await markAllRead();
    await refetchNotifications();
    onNotificationsChanged?.();
    showToast('تمامی اعلان‌های پلتفرم خوانده شده تلقی شدند.', 'success');
  };

  // Mention text area typing tracker
  const handleMentionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setMentionInput(text);

    const lastChar = text[text.length - 1];
    if (lastChar === '@') {
      setShowMentionAutocomplete(true);
      setMentionSearchText('');
    } else if (showMentionAutocomplete) {
      const atIndex = text.lastIndexOf('@');
      if (atIndex !== -1) {
        setMentionSearchText(text.substring(atIndex + 1));
      } else {
        setShowMentionAutocomplete(false);
      }
    }
  };

  const handleInsertMention = (userName: string) => {
    const atIndex = mentionInput.lastIndexOf('@');
    if (atIndex !== -1) {
      const newText = mentionInput.substring(0, atIndex) + `@${userName} ` ;
      setMentionInput(newText);
    }
    setShowMentionAutocomplete(false);
  };

  const handleSaveMentionNote = () => {
    if (!mentionInput.trim()) return;
    const newNote = {
      id: String(Date.now()),
      text: mentionInput,
      author: 'امیرحسین رضایی',
      time: 'هم‌اکنون'
    };
    setSavedNotes([newNote, ...savedNotes]);
    setMentionInput('');
    showToast('یادداشت جدید به همراه منشن‌ها ذخیره و اعلانات ارسال شد.', 'success');
  };

  // Toggle helper for preferences
  const togglePref = (key: keyof typeof preferences, channel: 'inApp' | 'email' | 'push') => {
    setPreferences(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [channel]: !prev[key][channel]
      }
    }));
  };

  const changePrefFreq = (key: keyof typeof preferences, freq: string) => {
    setPreferences(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        frequency: freq
      }
    }));
  };

  return (
    <div className="space-y-6 text-right font-sans pb-12 relative">
      
      {/* 1. HEADER SECTION */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-brand-500/10 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div>
            <h1 className="text-lg font-black text-slate-950 dark:text-white flex items-center gap-2">
              <Bell className="w-5.5 h-5.5 text-brand-500" />
              <span>مرکز اعلان‌ها و رویدادهای زنده</span>
            </h1>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-1">
              مدیریت یکپارچه اعلان‌های درون‌برنامه‌ای، منشن‌ها، هشدارها و تنظیمات کانال‌های اطلاع‌رسانی
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkAllRead}
              className="px-4 py-2 text-xs font-black bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 rounded-xl transition-all cursor-pointer border border-slate-150 dark:border-slate-800/50 flex items-center gap-1.5"
            >
              <CheckCheck className="w-4 h-4 text-brand-500" />
              <span>خواندن همه</span>
            </button>
          </div>
        </div>

        {/* SUB NAVIGATION TAB HEADER BAR */}
        <div className="flex items-center gap-1.5 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/60 relative z-10">
          <button
            onClick={() => setActiveSubTab('timeline')}
            className={`px-4.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'timeline'
                ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-100 dark:border-brand-500/20'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>زمان‌بندی اعلان‌ها</span>
            {notifications.filter(n => !n.read).length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-2xs bg-rose-500 text-white font-mono">
                {notifications.filter(n => !n.read).length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveSubTab('activity')}
            className={`px-4.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'activity'
                ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-100 dark:border-brand-500/20'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>فید فعالیت‌های سیستم</span>
          </button>
          <button
            onClick={() => setActiveSubTab('mentions')}
            className={`px-4.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'mentions'
                ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-100 dark:border-brand-500/20'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <AtSign className="w-4 h-4" />
            <span>سیستم منشن‌ها (@)</span>
          </button>
          <button
            onClick={() => setActiveSubTab('preferences')}
            className={`px-4.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'preferences'
                ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-100 dark:border-brand-500/20'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>تنظیمات و کانال‌ها</span>
          </button>
        </div>
      </div>

      {/* 2. SUB TAB PANELS */}
      <AnimatePresence mode="wait">
        
        {/* TAB 1: TIMELINE NOTIFICATIONS */}
        {activeSubTab === 'timeline' && (
          <motion.div
            key="timeline-tab"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="space-y-6"
          >
            {/* Filter Bar */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/50">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-brand-500" />
                  <h3 className="text-xs font-black text-slate-900 dark:text-white">فیلتر اعلان‌ها و جستجو</h3>
                </div>
                <button
                  onClick={() => setShowArchived(!showArchived)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    showArchived
                      ? 'bg-amber-500/10 text-amber-600 border border-amber-500/30'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span>{showArchived ? 'نمایش صندوق اصلی' : 'بایگانی‌شده‌ها'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute right-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="جستجو در عنوان یا متن..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-xs font-bold pl-3 pr-9 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/40 focus:border-brand-500 outline-none text-slate-700 dark:text-slate-350"
                  />
                </div>

                {/* Type Filter */}
                <div>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full text-xs font-bold px-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/40 focus:border-brand-500 outline-none text-slate-700 dark:text-slate-350 cursor-pointer"
                  >
                    <option value="همه">دسته: همه موارد</option>
                    <option value="تیکت‌ها">تیکت‌ها</option>
                    <option value="وظایف">وظایف</option>
                    <option value="کاربران">کاربران</option>
                    <option value="محصولات">محصولات</option>
                    <option value="لایسنس‌ها">لایسنس‌ها</option>
                    <option value="سیستم">سیستم</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full text-xs font-bold px-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/40 focus:border-brand-500 outline-none text-slate-700 dark:text-slate-350 cursor-pointer"
                  >
                    <option value="همه">وضعیت: همه</option>
                    <option value="خوانده‌نشده">خوانده‌نشده</option>
                    <option value="خوانده‌شده">خوانده‌شده</option>
                  </select>
                </div>

                {/* Priority Filter */}
                <div>
                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="w-full text-xs font-bold px-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/40 focus:border-brand-500 outline-none text-slate-700 dark:text-slate-350 cursor-pointer"
                  >
                    <option value="همه">اولویت: همه</option>
                    <option value="عادی">عادی</option>
                    <option value="مهم">مهم</option>
                    <option value="بحرانی">بحرانی</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Bulk Actions Bar (if any selected) */}
            {selectedIds.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-brand-500/10 border border-brand-500/30 p-3.5 rounded-2xl flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200"
              >
                <span><b>{selectedIds.length}</b> اعلان انتخاب شده است.</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleBulkMarkRead}
                    className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>علامت خوانده شده</span>
                  </button>
                  <button
                    onClick={handleBulkArchive}
                    className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-500/10 text-slate-700 dark:text-slate-200 hover:text-amber-700 dark:hover:text-amber-300 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Archive className="w-3.5 h-3.5 text-amber-500" />
                    <span>بایگانی</span>
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="px-3 py-1.5 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>حذف گروهی</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* Notification Cards List */}
            {loading && filteredNotifications.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 p-10 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 text-center space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center mx-auto animate-pulse">
                  <Bell className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-200">در حال بارگذاری اعلان‌ها...</h3>
                <p className="text-xs text-slate-400">در حال دریافت داده‌های زنده از سامانه</p>
              </div>
            ) : notificationsError ? (
              <div className="bg-rose-50 dark:bg-rose-950/30 p-10 rounded-2xl border border-rose-200/60 dark:border-rose-800/50 text-center space-y-3">
                <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
                <h3 className="text-sm font-black text-rose-700 dark:text-rose-300">خطا در دریافت اعلان‌ها</h3>
                <p className="text-xs text-slate-400">{notificationsError}</p>
                <button
                  onClick={() => refetchNotifications()}
                  className="px-4 py-2 text-xs font-black bg-rose-500 hover:bg-rose-600 text-white rounded-xl transition-colors cursor-pointer"
                >
                  تلاش مجدد
                </button>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 text-center space-y-3">
                <Bell className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-200">هیچ اعلانی با این مشخصات پیدا نشد!</h3>
                <p className="text-xs text-slate-400">فیلترهای خود را تغییر دهید یا وضعیت بایگانی را بررسی بفرمایید.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Select All Checkbox bar */}
                <div className="flex items-center justify-between px-2 text-xs font-bold text-slate-400">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === filteredNotifications.length && filteredNotifications.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    <span>انتخاب همه موارد این صفحه</span>
                  </label>
                  <span>نمایش {filteredNotifications.length} اعلان</span>
                </div>

                {filteredNotifications.map((n) => (
                  <motion.div
                    key={n.id}
                    layout
                    className={`p-5 rounded-2xl border transition-all text-right flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                      n.read 
                        ? 'bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-800/60 opacity-90' 
                        : 'bg-brand-500/5 dark:bg-brand-500/10 border-brand-500/30 shadow-xs'
                    }`}
                  >
                    <div className="flex items-start gap-3.5 flex-1">
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(n.id)}
                        onChange={() => handleToggleSelect(n.id)}
                        className="mt-1.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                      />

                      {/* Icon Avatar */}
                      <div className={`w-10 h-10 rounded-2xl shrink-0 flex items-center justify-center font-black ${
                        n.priority === 'critical' ? 'bg-rose-500/10 text-rose-500' :
                        n.priority === 'important' ? 'bg-amber-500/10 text-amber-500' :
                        'bg-blue-500/10 text-blue-500'
                      }`}>
                        {n.type === 'tickets' ? <Ticket className="w-5 h-5" /> :
                         n.type === 'tasks' ? <FileText className="w-5 h-5" /> :
                         n.type === 'licenses' ? <Key className="w-5 h-5" /> :
                         n.type === 'users' ? <Users className="w-5 h-5" /> :
                         n.type === 'products' ? <Layers className="w-5 h-5" /> :
                         <Bell className="w-5 h-5" />}
                      </div>

                      {/* Content */}
                      <div className="space-y-1 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className={`text-xs font-black ${n.read ? 'text-slate-800 dark:text-slate-200' : 'text-slate-950 dark:text-white'}`}>
                            {n.title}
                          </h4>
                          
                          {/* Unread indicator dot */}
                          {!n.read && (
                            <span className="w-2 h-2 rounded-full bg-brand-500 inline-block" />
                          )}

                          {/* Priority Badge */}
                          <span className={`px-2 py-0.5 rounded-full text-2xs font-black ${
                            n.priority === 'critical' ? 'bg-rose-500/10 text-rose-600' :
                            n.priority === 'important' ? 'bg-amber-500/10 text-amber-600' :
                            'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}>
                            {n.priority === 'critical' ? 'بحرانی' : n.priority === 'important' ? 'مهم' : 'عادی'}
                          </span>

                          {/* Linked object tag */}
                          {n.linkedObject && (
                            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                              <ExternalLink className="w-3 h-3 text-slate-400" />
                              <span>{n.linkedObject.type}: {n.linkedObject.name}</span>
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                          {n.description}
                        </p>

                        <div className="flex items-center gap-3 text-2xs text-slate-400 pt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{n.time}</span>
                          </span>
                          {n.authorName && (
                            <span>فرستنده: <b className="text-slate-600 dark:text-slate-300">{n.authorName}</b></span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="flex items-center gap-1 shrink-0 self-end md:self-center">
                      <button
                        onClick={() => setExpandedNotification(n)}
                        className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-brand-500 transition-colors cursor-pointer"
                        title="مشاهده جزئیات کامل"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      {!n.read && (
                        <button
                          onClick={() => handleMarkSingleRead(n.id)}
                          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-emerald-500 transition-colors cursor-pointer"
                          title="علامت خوانده شده"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() => handleArchiveSingle(n.id)}
                        className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-amber-500 transition-colors cursor-pointer"
                        title={n.archived ? "خروج از بایگانی" : "انتقال به بایگانی"}
                      >
                        <Archive className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteSingle(n.id)}
                        className="p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* TAB 2: ACTIVITY FEED */}
        {activeSubTab === 'activity' && (
          <motion.div
            key="activity-tab"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="space-y-6"
          >
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-brand-500" />
                  <h3 className="text-xs font-black text-slate-900 dark:text-white">جریان رویدادها و فعالیتهای لحظه‌ای پلتفرم</h3>
                </div>
                <span className="text-2xs text-slate-400 font-mono">Real-time Stream Log</span>
              </div>

              {/* Timeline Items */}
              <div className="relative pr-6 border-r-2 border-slate-150 dark:border-slate-800 space-y-6">
                {activities.map((act) => (
                  <div key={act.id} className="relative group">
                    {/* Circle Dot */}
                    <div className="absolute -right-[31px] top-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 bg-brand-500" />

                    <div className="bg-slate-50/70 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-brand-500/30 transition-all">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full ${act.avatarBg} text-white flex items-center justify-center font-black text-xs shrink-0 shadow-inner`}>
                          {act.actor.substring(0, 2)}
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-900 dark:text-white">{act.actor}</span>
                            <span className="text-2xs text-slate-400 font-bold">({act.actorRole})</span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-350">
                            {act.action} <b className="text-brand-600 dark:text-brand-400">{act.target}</b>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <span className={`px-2.5 py-1 rounded-lg text-2xs font-black ${act.badgeColor}`}>
                          {act.category}
                        </span>
                        <span className="text-2xs text-slate-400 font-bold font-mono">
                          {act.time}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 3: MENTION SYSTEM (@) */}
        {activeSubTab === 'mentions' && (
          <motion.div
            key="mentions-tab"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Left Col: Interactive Mention Editor */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <AtSign className="w-5 h-5 text-brand-500" />
                  <h3 className="text-xs font-black text-slate-900 dark:text-white">ارسال یادداشت داخلی و منشن همکاران</h3>
                </div>
                <span className="text-2xs text-slate-400 font-medium">برای لیست اعضا کاراکتر @ را تایپ کنید</span>
              </div>

              {/* Textarea Area */}
              <div className="relative">
                <textarea
                  rows={4}
                  value={mentionInput}
                  onChange={handleMentionChange}
                  placeholder="متن یادداشت یا پیام پشتیبانی خود را بنویسید... (برای منشن از @ استفاده کنید)"
                  className="w-full text-xs font-bold p-4 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-950/40 focus:border-brand-500 outline-none text-slate-800 dark:text-slate-200 resize-none leading-relaxed"
                />

                {/* Autocomplete Dropdown */}
                <AnimatePresence>
                  {showMentionAutocomplete && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-4 bottom-16 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-50 overflow-hidden"
                    >
                      <div className="p-2 bg-slate-50 dark:bg-slate-900/50 text-2xs font-black text-slate-400 border-b border-slate-100 dark:border-slate-700">
                        انتخاب همکار جهت منشن
                      </div>
                      <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/50">
                        {teamMembers
                          .filter(m => m.name.toLowerCase().includes(mentionSearchText.toLowerCase()))
                          .map((member, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleInsertMention(member.name)}
                              className="w-full p-2.5 text-right hover:bg-brand-50 dark:hover:bg-brand-950/30 flex items-center justify-between transition-colors cursor-pointer"
                            >
                              <div>
                                <h5 className="text-xs font-black text-slate-900 dark:text-white">@{member.name}</h5>
                                <span className="text-2xs text-slate-400">{member.role}</span>
                              </div>
                              <User className="w-4 h-4 text-brand-500" />
                            </button>
                          ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-1.5 text-2xs text-slate-400">
                  <Info className="w-3.5 h-3.5 text-brand-500" />
                  <span>افراد منشن شده بلافاصله اعلان دریافت خواهند کرد.</span>
                </div>

                <button
                  onClick={handleSaveMentionNote}
                  className="px-5 py-2.5 text-xs font-black bg-brand-600 hover:bg-brand-700 text-white rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-brand-500/10"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>ثبت یادداشت و منشن</span>
                </button>
              </div>

              {/* Saved Mention Notes */}
              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">تاریخچه یادداشت‌های منشن شده</h4>
                {savedNotes.map((note) => (
                  <div key={note.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/50 space-y-1">
                    <div className="flex items-center justify-between text-2xs text-slate-400">
                      <span className="font-bold text-slate-700 dark:text-slate-300">{note.author}</span>
                      <span>{note.time}</span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-bold">
                      {note.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Col: Team directory */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs space-y-4">
              <h3 className="text-xs font-black text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
                دایرکتوری اعضای قابل منشن
              </h3>

              <div className="space-y-3">
                {teamMembers.map((m, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <h5 className="text-xs font-black text-slate-900 dark:text-white">{m.name}</h5>
                      <span className="text-2xs text-slate-400 block">{m.role}</span>
                    </div>
                    <button
                      onClick={() => handleInsertMention(m.name)}
                      className="px-2.5 py-1 text-2xs font-bold bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/30 text-brand-600 dark:text-brand-400 rounded-lg cursor-pointer"
                    >
                      + منشن
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 4: NOTIFICATION PREFERENCES */}
        {activeSubTab === 'preferences' && (
          <motion.div
            key="preferences-tab"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="space-y-6"
          >
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">تنظیمات کانال‌های دریافت اعلان</h3>
                  <p className="text-xs text-slate-400">نحوه و فرکانس ارسال اعلان‌ها را بر اساس ترجیحات خود شخصی‌سازی کنید.</p>
                </div>

                <button
                  onClick={() => showToast('تنظیمات کانال‌های دریافت با موفقیت ذخیره شد.', 'success')}
                  className="px-5 py-2 text-xs font-black bg-brand-600 hover:bg-brand-700 text-white rounded-xl shadow-md cursor-pointer"
                >
                  ذخیره تنظیمات
                </button>
              </div>

              {/* Channels legend */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-950/40 p-4 rounded-2xl">
                <div className="flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-brand-500" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">درون برنامه‌ای (In-App)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-indigo-500" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">ایمیل (Email Digest)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">پوش نوتیفیکیشن (Push)</span>
                </div>
              </div>

              {/* Preference rows */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                
                {/* 1. Ticket New */}
                <div className="py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white">تیکت جدید (New Ticket)</h4>
                    <p className="text-xs text-slate-400">ارسال اعلان هنگام ثبت تیکت جدید توسط مشتریان</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <button onClick={() => togglePref('ticketNew', 'inApp')} className="cursor-pointer text-xs font-bold flex items-center gap-1.5">
                      {preferences.ticketNew.inApp ? <ToggleRight className="w-6 h-6 text-brand-600" /> : <ToggleLeft className="w-6 h-6 text-slate-400" />}
                      <span>In-App</span>
                    </button>
                    <button onClick={() => togglePref('ticketNew', 'email')} className="cursor-pointer text-xs font-bold flex items-center gap-1.5">
                      {preferences.ticketNew.email ? <ToggleRight className="w-6 h-6 text-indigo-600" /> : <ToggleLeft className="w-6 h-6 text-slate-400" />}
                      <span>ایمیل</span>
                    </button>
                    <button onClick={() => togglePref('ticketNew', 'push')} className="cursor-pointer text-xs font-bold flex items-center gap-1.5">
                      {preferences.ticketNew.push ? <ToggleRight className="w-6 h-6 text-emerald-600" /> : <ToggleLeft className="w-6 h-6 text-slate-400" />}
                      <span>Push</span>
                    </button>
                  </div>
                </div>

                {/* 2. User Mentions */}
                <div className="py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white">منشن شدن نام شما (@Mention)</h4>
                    <p className="text-xs text-slate-400">اطلاع‌رسانی فوری هنگام منشن شدن در تیکت‌ها یا یادداشت‌ها</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <button onClick={() => togglePref('userMentions', 'inApp')} className="cursor-pointer text-xs font-bold flex items-center gap-1.5">
                      {preferences.userMentions.inApp ? <ToggleRight className="w-6 h-6 text-brand-600" /> : <ToggleLeft className="w-6 h-6 text-slate-400" />}
                      <span>In-App</span>
                    </button>
                    <button onClick={() => togglePref('userMentions', 'email')} className="cursor-pointer text-xs font-bold flex items-center gap-1.5">
                      {preferences.userMentions.email ? <ToggleRight className="w-6 h-6 text-indigo-600" /> : <ToggleLeft className="w-6 h-6 text-slate-400" />}
                      <span>ایمیل</span>
                    </button>
                    <button onClick={() => togglePref('userMentions', 'push')} className="cursor-pointer text-xs font-bold flex items-center gap-1.5">
                      {preferences.userMentions.push ? <ToggleRight className="w-6 h-6 text-emerald-600" /> : <ToggleLeft className="w-6 h-6 text-slate-400" />}
                      <span>Push</span>
                    </button>
                  </div>
                </div>

                {/* 3. License Expiring */}
                <div className="py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white">هشدار انقضای لایسنس (License Expiry)</h4>
                    <p className="text-xs text-slate-400">هشدارهای بحرانی قبل از اتمام اعتبار اعتبارنامه‌های ابری</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <button onClick={() => togglePref('licenseExpiring', 'inApp')} className="cursor-pointer text-xs font-bold flex items-center gap-1.5">
                      {preferences.licenseExpiring.inApp ? <ToggleRight className="w-6 h-6 text-brand-600" /> : <ToggleLeft className="w-6 h-6 text-slate-400" />}
                      <span>In-App</span>
                    </button>
                    <button onClick={() => togglePref('licenseExpiring', 'email')} className="cursor-pointer text-xs font-bold flex items-center gap-1.5">
                      {preferences.licenseExpiring.email ? <ToggleRight className="w-6 h-6 text-indigo-600" /> : <ToggleLeft className="w-6 h-6 text-slate-400" />}
                      <span>ایمیل</span>
                    </button>
                    <button onClick={() => togglePref('licenseExpiring', 'push')} className="cursor-pointer text-xs font-bold flex items-center gap-1.5">
                      {preferences.licenseExpiring.push ? <ToggleRight className="w-6 h-6 text-emerald-600" /> : <ToggleLeft className="w-6 h-6 text-slate-400" />}
                      <span>Push</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* EXPANDED NOTIFICATION DETAIL MODAL */}
      <AnimatePresence>
        {expandedNotification && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 text-right space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-black text-brand-600 dark:text-brand-400">جزئیات کامل اعلان</span>
                <button
                  onClick={() => setExpandedNotification(null)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-black text-slate-900 dark:text-white">{expandedNotification.title}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-bold">
                  {expandedNotification.description}
                </p>

                {expandedNotification.detailedContent && (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/60 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {expandedNotification.detailedContent}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div>زمان ثبت: <b className="text-slate-700 dark:text-slate-300">{expandedNotification.time}</b></div>
                  <div>اولویت: <b className="text-slate-700 dark:text-slate-300">{expandedNotification.priority}</b></div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setExpandedNotification(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-black rounded-xl cursor-pointer"
                >
                  بستن
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
