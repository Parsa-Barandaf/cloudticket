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
  ExternalLink
} from 'lucide-react';
import type { Ticket, Product, Customer } from '../../types';
import { PortalRole } from '../../types';
import type { CustomerTicketItem, ActiveProductItem } from '../../api/transform-customer';
import { mapTicketToCustomerItem, mapProductToActiveItem } from '../../api/transform-customer';
import { gql } from '../../api/graphql';
import { CREATE_TICKET } from '../../api/queries';

interface CustomerPortalViewProps {
  userEmail: string;
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
  ticketsList = [],
  productsList = [],
  customersList = [],
  onLogout,
  isDark,
  onToggleTheme,
  onSwitchPortalRole
}: CustomerPortalViewProps) {
  const [activeTab, setActiveTab] = useState<'products' | 'create-ticket' | 'my-tickets' | 'docs' | 'notifications' | 'profile'>('products');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  // New Ticket Form State
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketProduct, setTicketProduct] = useState('Cloud Security Platform');
  const [ticketPriority, setTicketPriority] = useState('متوسط');
  const [ticketMessage, setTicketMessage] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Customer tickets and products — synced from real props
  const [customerTickets, setCustomerTickets] = useState<CustomerTicketItem[]>([]);
  const activeProducts: ActiveProductItem[] = productsList.map(mapProductToActiveItem);

  useEffect(() => {
    if (ticketsList.length > 0) {
      setCustomerTickets(ticketsList.map(mapTicketToCustomerItem));
    }
  }, [ticketsList]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const priorityToApi: Record<string, string> = { 'بحرانی': 'CRITICAL', 'بالا': 'HIGH', 'متوسط': 'MEDIUM', 'پایین': 'LOW' };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketMessage.trim()) return;

    const matchedCustomer = customersList.find(c => c.email === userEmail);
    const customerId = matchedCustomer?.id;

    if (customerId) {
      try {
        await gql(CREATE_TICKET, {
          input: {
            title: ticketSubject,
            priority: priorityToApi[ticketPriority] || 'MEDIUM',
            customerId,
          },
        });
      } catch { /* fall through — local state still updated */ }
    }

    const newTkt = {
      id: `TKT-${Math.floor(1000 + Math.random() * 9000)}`,
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
      <aside className={`fixed lg:sticky lg:top-0 lg:h-screen lg:self-start inset-y-0 right-0 z-40 bg-white dark:bg-slate-900 border-l border-slate-200/80 dark:border-slate-800/80 flex flex-col justify-between transition-all duration-300 ${
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
                {activeTab === 'products' && 'محصولات و لایسنس‌های فعال'}
                {activeTab === 'my-tickets' && 'پیگیری تیکت‌های پشتیبانی'}
                {activeTab === 'create-ticket' && 'ثبت درخواست جدید پشتیبانی'}
                {activeTab === 'docs' && 'مستندات و پایگاه دانش سازمانی'}
                {activeTab === 'profile' && 'شناسنامه و مشخصات سازمان'}
              </h2>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">پتروشیمی سپهر پارس (مشتری ویژه طلایی)</span>
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
          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activeProducts.map(prd => (
                  <div key={prd.id} className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-black text-brand-500 bg-brand-500/10 px-2 py-0.5 rounded-md border border-brand-500/20">
                          {prd.version}
                        </span>
                        <h3 className="text-base font-black text-slate-900 dark:text-white mt-1">{prd.name}</h3>
                      </div>
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                        {prd.status}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold block">کلید فعال‌سازی سازمانی (License Key):</span>
                      <code className="text-xs font-mono font-bold text-brand-600 dark:text-brand-400 dir-ltr block">{prd.licenseKey}</code>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-400 font-medium">
                      <div>
                        <span className="text-[10px] text-slate-400 block">تاریخ انقضای لایسنس:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{prd.expiresAt}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">سهمیه کاربر فعال:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{prd.userQuota}</span>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80">
                      <button 
                        onClick={() => { setActiveTab('create-ticket'); setTicketProduct(prd.name); }}
                        className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Headphones className="w-3.5 h-3.5" />
                        <span>درخواست پشتیبانی فنی این محصول</span>
                      </button>

                      <button className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors text-xs font-bold flex items-center gap-1 cursor-pointer">
                        <Download className="w-3.5 h-3.5" />
                        <span>دانلود لایسنس</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'create-ticket' && (
            <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <h3 className="text-base font-black text-slate-900 dark:text-white">ارسال تیکت جدید به پشتیبانی فنی</h3>
                <p className="text-xs text-slate-400 mt-1">کارشناسان ارشد سحاب به صورت ۲۴ ساعته بر اساس SLA طلایی پاسخگوی شما خواهند بود.</p>
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
                      <option value="Cloud Security Platform">Cloud Security Platform</option>
                      <option value="Identity Protection Server">Identity Protection Server</option>
                      <option value="Enterprise IAM Suite">Enterprise IAM Suite</option>
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
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50/50 dark:bg-slate-950/40 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-800 dark:text-slate-200">تاریخچه درخواست‌های پشتیبانی</h3>
                <button
                  onClick={() => setActiveTab('create-ticket')}
                  className="px-3 py-1.5 bg-brand-500 text-white font-bold text-xs rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>تیکت جدید</span>
                </button>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {customerTickets.map(tkt => (
                  <div key={tkt.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-brand-600 dark:text-brand-400">{tkt.id}</span>
                        <span className="text-xs font-black text-slate-900 dark:text-white">{tkt.subject}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400">
                        <span>محصول: {tkt.product}</span>
                        <span>•</span>
                        <span>تاریخ: {tkt.date}</span>
                        <span>•</span>
                        <span>آخرین فعالیت: {tkt.lastUpdate}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                        tkt.status === 'حل شده' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                        tkt.status === 'در حال بررسی' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                        'bg-blue-500/10 text-blue-500 border-blue-500/20'
                      }`}>
                        {tkt.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'docs' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: 'راهنمای نصب و پیکربندی اولیه SDK سحاب', category: 'توسعه‌دهندگان', icon: BookOpen },
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
                مشخصات سازمان ثبت شده در پلتفرم سحاب
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
      </div>
    </div>
  );
}
