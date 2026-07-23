import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sun, Moon, Sparkles } from 'lucide-react';
import type { AuthScreen, PortalRole, Ticket, Product, Customer } from './types';
import { useTheme } from './hooks/useTheme';
import ErrorBoundary from './components/ErrorBoundary';
import AbstractIllustration from './components/AbstractIllustration';
import LoginForm from './components/LoginForm';
import DashboardPreview from './components/portals/DashboardPortal';
import CustomerPortalView from './components/portals/CustomerPortal';
import SupportAgentPortalView from './components/portals/AgentPortal';

const sampleTickets: Ticket[] = [
  { id: 'TKT-1025', title: 'قطعی متناوب گره‌های مانیتورینگ شعبه پردیس', customer: 'شرکت توسعه امنیت آریا', product: 'Cloud Security Platform', priority: 'بحرانی', status: 'باز', assignedTo: 'امیرحسین رضایی', date: '۳ دقیقه پیش' },
  { id: 'TKT-1026', title: 'درخواست بازنگری در سقف ترافیک وب‌هوک‌ها', customer: 'بانک آینده (فناوری اطلاعات)', product: 'Identity Protection Server', priority: 'بالا', status: 'در حال بررسی', assignedTo: 'علی علوی', date: '۲۵ دقیقه پیش' },
  { id: 'TKT-1024', title: 'خطای عدم همگام‌سازی امضای امنیتی کلاینت', customer: 'بانک ملت (دپارتمان زیرساخت)', product: 'Elastic Compute Node', priority: 'بحرانی', status: 'در حال بررسی', assignedTo: 'امیرحسین رضایی', date: '۱ ساعت پیش' },
  { id: 'TKT-1023', title: 'سوال در مورد پیکربندی SSL و گواهی TLS گره‌ها', customer: 'صنایع پتروشیمی خلیج فارس', product: 'Cloud Security Platform', priority: 'متوسط', status: 'منتظر پاسخ مشتری', assignedTo: 'زهرا موسوی', date: '۳ ساعت پیش' },
  { id: 'TKT-1022', title: 'درخواست ارتقای لایسنس به نسخه Enterprise', customer: 'فولاد مبارکه اصفهان', product: 'Global Edge CDN', priority: 'پایین', status: 'باز', assignedTo: 'مریم اکبری', date: 'دیروز' },
  { id: 'TKT-1021', title: 'کاهش شدید سرعت پاسخگویی متد استعلام کالا', customer: 'فروشگاه اینترنتی دیجی‌کالا', product: 'AI Analytics Framework', priority: 'بالا', status: 'بسته شده', assignedTo: 'مهدی قربانی', date: '۲ روز پیش' }
];

const sampleProducts: Product[] = [
  { id: 'PRD-01', name: 'Cloud Security Platform', category: 'امنیت ابری', version: 'v2.4.1', status: 'فعال', clientsCount: 42, lastUpdated: '۱۴۰۳/۰۴/۱۵', createdAt: '۱۴۰۱/۰۱/۱۰' },
  { id: 'PRD-02', name: 'Identity Protection Server', category: 'مدیریت دسترسی', version: 'v3.1.2', status: 'فعال', clientsCount: 28, lastUpdated: '۱۴۰۳/۰۳/۲۰', createdAt: '۱۴۰۱/۰۵/۱۵' },
  { id: 'PRD-03', name: 'Elastic Compute Node', category: 'زیرساخت پردازشی', version: 'v5.0.1', status: 'فعال', clientsCount: 19, lastUpdated: '۱۴۰۳/۰۴/۰۱', createdAt: '۱۴۰۲/۰۲/۰۱' },
  { id: 'PRD-05', name: 'Global Edge CDN', category: 'شبکه توزیع محتوا', version: 'v2.0.0', status: 'فعال', clientsCount: 35, lastUpdated: '۱۴۰۳/۰۴/۱۰', createdAt: '۱۴۰۲/۰۸/۱۲' }
];

const sampleCustomers: Customer[] = [
  { id: 'CST-501', name: 'شرکت توسعه امنیت آریا', industry: 'امنیت سایبری', tier: 'طلایی', activeTickets: 3, managerName: 'مهندس آرش کریمی', managerEmail: 'a.karimi@ariasecurity.ir', phone: '۰۲۱-۸۸۲۲۳۳۹۹', status: 'فعال' },
  { id: 'CST-502', name: 'بانک آینده (فناوری اطلاعات)', industry: 'بانکداری', tier: 'طلایی', activeTickets: 1, managerName: 'دکتر محمودی', managerEmail: 'it@ba24.ir', phone: '۰۲۱-۲۷۶۶۰00', status: 'فعال' },
  { id: 'CST-503', name: 'فناوری اطلاعات بانک ملت', industry: 'بانکداری', tier: 'نقره‌ای', activeTickets: 2, managerName: 'مهندس حسینی', managerEmail: 'infra@bankmellat.ir', phone: '۰۲۱-۸۲۹۶۱', status: 'فعال' }
];

function AppContent() {
  const [screen, setScreen] = useState<AuthScreen>(() => {
    const saved = localStorage.getItem('sahab_logged_in');
    if (saved === 'false') return 'login';
    return 'dashboard';
  });
  const { isDark, toggleTheme } = useTheme(true);
  const [userEmail, setUserEmail] = useState<string>(() => {
    return localStorage.getItem('sahab_user_email') || 'admin@sahab.ir';
  });
  const [portalRole, setPortalRole] = useState<PortalRole>(() => {
    return (localStorage.getItem('sahab_portal_role') as PortalRole) || 'admin';
  });

  const handleLoginSuccess = (email: string, role?: PortalRole) => {
    const mail = email || 'admin@sahab.ir';
    const activeRole = role || 'admin';
    setUserEmail(mail);
    setPortalRole(activeRole);
    localStorage.setItem('sahab_logged_in', 'true');
    localStorage.setItem('sahab_user_email', mail);
    localStorage.setItem('sahab_portal_role', activeRole);
    setScreen('dashboard');
  };

  const handleLogout = () => {
    localStorage.setItem('sahab_logged_in', 'false');
    localStorage.removeItem('sahab_access_token');
    setScreen('login');
  };

  const handleSwitchPortalRole = (newRole: PortalRole) => {
    setPortalRole(newRole);
    localStorage.setItem('sahab_portal_role', newRole);
  };

  // If logged in, render according to active portalRole
  if (screen === 'dashboard') {
    if (portalRole === 'customer') {
      return (
        <div className={isDark ? 'dark' : ''}>
          <CustomerPortalView
            userEmail={userEmail}
            ticketsList={sampleTickets}
            productsList={sampleProducts}
            onLogout={handleLogout}
            isDark={isDark}
            onToggleTheme={toggleTheme}
            onSwitchPortalRole={handleSwitchPortalRole}
          />
        </div>
      );
    }

    if (portalRole === 'agent') {
      return (
        <div className={isDark ? 'dark' : ''}>
          <SupportAgentPortalView
            userEmail={userEmail}
            ticketsList={sampleTickets}
            productsList={sampleProducts}
            customersList={sampleCustomers}
            onLogout={handleLogout}
            isDark={isDark}
            onToggleTheme={toggleTheme}
            onSwitchPortalRole={handleSwitchPortalRole}
          />
        </div>
      );
    }

    return (
      <div className={isDark ? 'dark' : ''}>
        <DashboardPreview 
          userEmail={userEmail} 
          onLogout={handleLogout} 
          isDark={isDark}
          onToggleTheme={toggleTheme}
          onSwitchPortalRole={handleSwitchPortalRole}
        />
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans flex flex-col transition-colors duration-200`} dir="rtl">
      
      {/* Dynamic Main Split-Screen Container */}
      <div className="flex-1 flex flex-col lg:flex-row-reverse">
        
        {/* RIGHT SECTION: Interactive Form (Eye-landing zone in RTL) */}
        <section className="flex-1 flex flex-col justify-between bg-white dark:bg-slate-950 px-6 sm:px-12 py-8 relative transition-colors duration-200">
          
          {/* Top Header Bar for Right Section */}
          <div className="flex items-center justify-between w-full mb-8">
            {/* Logo and Brand */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-white shadow-md shadow-brand-500/10">
                <Sparkles className="w-4.5 h-4.5" />
              </div>
              <div className="text-right">
                <span className="text-xs font-black text-slate-950 dark:text-white tracking-wide block">سامانه ابری سحاب</span>
                <span className="text-[9px] text-slate-400 dark:text-slate-500">پلتفرم مدیریت هوشمند پشتیبانی</span>
              </div>
            </div>

            {/* Dark / Light switch button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200/50 dark:border-slate-800/50 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-all cursor-pointer"
              title={isDark ? "تغییر به پوسته روشن" : "تغییر به پوسته تاریک"}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-brand-600" />}
            </button>
          </div>

          {/* Form Content container */}
          <div className="flex-1 flex items-center justify-center py-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={screen}
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-md"
              >
                <LoginForm 
                  onSuccess={handleLoginSuccess} 
                  onScreenChange={setScreen} 
                  currentScreen={screen} 
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer Bar for Right Section */}
          <footer className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-900/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-slate-400 dark:text-slate-500">
            <div className="flex items-center gap-4">
              <a href="#privacy" className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">سیاست حریم خصوصی</a>
              <span className="text-slate-200 dark:text-slate-800">•</span>
              <a href="#terms" className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">شرایط و قوانین خدمات</a>
            </div>
            <div>
              <span>نسخه سامانه: ۱.۴.۰ • توسعه یافته در ایران با فناوری بومی سحاب</span>
            </div>
          </footer>

        </section>

        {/* LEFT SECTION: Stunning Animated Abstract Geometric Graphic (Hidden on mobile for responsiveness) */}
        <section className="hidden lg:flex lg:w-[50%] bg-slate-50 dark:bg-slate-900 border-l border-slate-200/50 dark:border-slate-800/30 flex-col justify-between relative overflow-hidden transition-colors duration-200">
          <AbstractIllustration isDark={isDark} />
        </section>

      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

