import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles } from 'lucide-react';
import type { AuthScreen, PortalRole, Ticket, Product, Customer } from './types';
import { useAuth } from './hooks/useAuth';
import { useTickets } from './hooks/useTickets';
import { useProducts } from './hooks/useProducts';
import { useCustomers } from './hooks/useCustomers';
import { getAuthItem, setAuthItem, removeAuthItem } from './api/storage';
import ErrorBoundary from './components/ErrorBoundary';
import AbstractIllustration from './components/AbstractIllustration';
import LoginForm from './components/LoginForm';
import DashboardPreview from './components/portals/DashboardPortal';
import CustomerPortalView from './components/portals/CustomerPortal';
import SupportAgentPortalView from './components/portals/AgentPortal';

function AppContent() {
  const [screen, setScreen] = useState<AuthScreen>(() => {
    const saved = getAuthItem('cmp_logged_in');
    const token = getAuthItem('cmp_access_token');
    if (saved === 'true' && token) return 'dashboard';
    return 'login';
  });
  const [userEmail, setUserEmail] = useState<string>(() => {
    return getAuthItem('cmp_user_email') || 'admin@example.com';
  });
  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    return getAuthItem('cmp_user_id') || '';
  });
  const [currentCustomerId, setCurrentCustomerId] = useState<string>(() => {
    return getAuthItem('cmp_customer_id') || '';
  });
  const [currentDepartmentId, setCurrentDepartmentId] = useState<string>(() => {
    return getAuthItem('cmp_department_id') || '';
  });
  const [portalRole, setPortalRole] = useState<PortalRole>(() => {
    return (getAuthItem('cmp_portal_role') as PortalRole) || 'admin';
  });
  const { tickets: realTickets, refetch: refetchTickets } = useTickets();
  const { products: realProducts, refetch: refetchProducts } = useProducts();
  const { customers: realCustomers, refetch: refetchCustomers } = useCustomers();
  const { getCurrentUser, logout } = useAuth();

  const refreshAllData = useCallback(() => {
    refetchTickets();
    refetchProducts();
    refetchCustomers();
  }, [refetchTickets, refetchProducts, refetchCustomers]);

  useEffect(() => {
    const token = getAuthItem('cmp_access_token');
    if (!token) return;
    getCurrentUser().then(result => {
      if (result) {
        setUserEmail(result.email);
        setCurrentUserId(result.userId || '');
        setCurrentCustomerId(result.customerId || '');
        setCurrentDepartmentId(result.departmentId || '');
        setPortalRole(result.role);
        const persistent = !!getAuthItem('cmp_access_token');
        setAuthItem('cmp_logged_in', 'true', persistent);
        setScreen('dashboard');
        refreshAllData();
      } else {
        removeAuthItem('cmp_access_token');
        removeAuthItem('cmp_user_email');
        removeAuthItem('cmp_user_id');
        removeAuthItem('cmp_customer_id');
        removeAuthItem('cmp_department_id');
        removeAuthItem('cmp_portal_role');
        removeAuthItem('cmp_logged_in');
        setScreen('login');
      }
    });
  }, [getCurrentUser]);

  const handleLoginSuccess = (result: { email: string; role?: PortalRole; userId?: string; customerId?: string; departmentId?: string }) => {
    const mail = result.email || 'admin@example.com';
    const activeRole = result.role || 'admin';
    setUserEmail(mail);
    setPortalRole(activeRole);
    setCurrentUserId(result.userId || '');
    setCurrentCustomerId(result.customerId || '');
    setCurrentDepartmentId(result.departmentId || '');
    setScreen('dashboard');
    refreshAllData();
  };

  const handleLogout = () => {
    logout();
    setScreen('login');
  };

  const handleSwitchPortalRole = (newRole: PortalRole) => {
    setPortalRole(newRole);
    setAuthItem('cmp_portal_role', newRole, !!getAuthItem('cmp_access_token'));
  };

  // If logged in, render according to active portalRole
  if (screen === 'dashboard') {
    if (portalRole === 'customer') {
      return (
        <div className="dark">
          <CustomerPortalView
            userEmail={userEmail}
            currentCustomerId={currentCustomerId}
            ticketsList={realTickets}
            productsList={realProducts}
            customersList={realCustomers}
            onLogout={handleLogout}
            onSwitchPortalRole={handleSwitchPortalRole}
          />
        </div>
      );
    }

    if (portalRole === 'agent') {
      return (
        <div className="dark">
          <SupportAgentPortalView
            userEmail={userEmail}
            currentUserId={currentUserId}
            currentDepartmentId={currentDepartmentId}
            ticketsList={realTickets}
            productsList={realProducts}
            customersList={realCustomers}
            onLogout={handleLogout}
            onSwitchPortalRole={handleSwitchPortalRole}
          />
        </div>
      );
    }

    return (
      <div className="dark">
        <DashboardPreview 
          userEmail={userEmail} 
          onLogout={handleLogout} 
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

            <div className="w-8 h-8" />
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
          <AbstractIllustration />
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

