import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sun, Moon, Sparkles } from 'lucide-react';
import type { AuthScreen, PortalRole, Ticket, Product, Customer } from './types';
import { useTheme } from './hooks/useTheme';
import { useTickets } from './hooks/useTickets';
import { useProducts } from './hooks/useProducts';
import { useCustomers } from './hooks/useCustomers';
import ErrorBoundary from './components/ErrorBoundary';
import AbstractIllustration from './components/AbstractIllustration';
import LoginForm from './components/LoginForm';
import DashboardPreview from './components/portals/DashboardPortal';
import CustomerPortalView from './components/portals/CustomerPortal';
import SupportAgentPortalView from './components/portals/AgentPortal';

function AppContent() {
  const [screen, setScreen] = useState<AuthScreen>(() => {
    const saved = localStorage.getItem('cmp_logged_in');
    if (saved === 'false') return 'login';
    return 'dashboard';
  });
  const { isDark, toggleTheme } = useTheme(true);
  const [userEmail, setUserEmail] = useState<string>(() => {
    return localStorage.getItem('cmp_user_email') || 'admin@example.com';
  });
  const [portalRole, setPortalRole] = useState<PortalRole>(() => {
    return (localStorage.getItem('cmp_portal_role') as PortalRole) || 'admin';
  });
  const { tickets: realTickets } = useTickets();
  const { products: realProducts } = useProducts();
  const { customers: realCustomers } = useCustomers();

  const handleLoginSuccess = (email: string, role?: PortalRole) => {
    const mail = email || 'admin@example.com';
    const activeRole = role || 'admin';
    setUserEmail(mail);
    setPortalRole(activeRole);
    localStorage.setItem('cmp_logged_in', 'true');
    localStorage.setItem('cmp_user_email', mail);
    localStorage.setItem('cmp_portal_role', activeRole);
    setScreen('dashboard');
  };

  const handleLogout = () => {
    localStorage.setItem('cmp_logged_in', 'false');
    localStorage.removeItem('cmp_access_token');
    setScreen('login');
  };

  const handleSwitchPortalRole = (newRole: PortalRole) => {
    setPortalRole(newRole);
    localStorage.setItem('cmp_portal_role', newRole);
  };

  // If logged in, render according to active portalRole
  if (screen === 'dashboard') {
    if (portalRole === 'customer') {
      return (
        <div className={isDark ? 'dark' : ''}>
          <CustomerPortalView
            userEmail={userEmail}
            ticketsList={realTickets}
            productsList={realProducts}
            customersList={realCustomers}
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
            ticketsList={realTickets}
            productsList={realProducts}
            customersList={realCustomers}
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
                <span className="text-xs font-black text-slate-950 dark:text-white tracking-wide block">سامانه ابری مدیریت مشتریان</span>
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
              <span>نسخه سامانه: ۱.۴.۰ • توسعه یافته در ایران با فناوری بومی </span>
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

