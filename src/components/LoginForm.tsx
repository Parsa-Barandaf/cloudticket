import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AuthScreen, PortalRole, FormErrors } from '../types';
import { useAuth } from '../hooks/useAuth';
import { 
  Mail, 
  Lock, 
  User, 
  Building, 
  Phone, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Sparkles,
  Info,
  ShieldCheck,
  Headphones,
  Users
} from 'lucide-react';
import { gql } from '../api/graphql';
import { REQUEST_ACCESS } from '../api/queries';
import type { ApiAccessRequest } from '../api/types';

interface LoginFormProps {
  onSuccess: (email: string, role: PortalRole) => void;
  onScreenChange: (screen: AuthScreen) => void;
  currentScreen: AuthScreen;
}

export default function LoginForm({ onSuccess, onScreenChange, currentScreen }: LoginFormProps) {
  const { login: apiLogin, error: apiError } = useAuth();

  // Role State
  const [selectedRole, setSelectedRole] = useState<PortalRole>('admin');

  // Input states
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('123456');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  
  // Interaction states
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Select Role Quick Handler
  const handleRoleSelect = (role: PortalRole) => {
    setSelectedRole(role);
    setErrors({});
    if (role === 'admin') {
      setEmail('admin@example.com');
    } else if (role === 'agent') {
      setEmail('agent@example.com');
    } else {
      setEmail('customer@example.com');
    }
    setPassword('123456');
  };

  // Inline Validation
  const validateEmail = (val: string) => {
    if (!val) return 'آدرس ایمیل الزامی است';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(val)) return 'فرمت ایمیل وارد شده نامعتبر است';
    return undefined;
  };

  const validatePassword = (val: string) => {
    if (!val) return 'رمز عبور الزامی است';
    if (val.length < 6) return 'رمز عبور باید حداقل ۶ کاراکتر باشد';
    return undefined;
  };

  const validateRequestAccess = () => {
    const tempErrors: FormErrors = {};
    if (!name.trim()) tempErrors.name = 'نام و نام خانوادگی الزامی است';
    if (!companyName.trim()) tempErrors.companyName = 'نام شرکت یا سازمان الزامی است';
    if (!phone.trim()) tempErrors.phone = 'شماره تماس الزامی است';
    
    const emailErr = validateEmail(email);
    if (emailErr) tempErrors.email = emailErr;

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailErr = validateEmail(email);
    const passErr = validatePassword(password);

    if (emailErr || passErr) {
      setErrors({ email: emailErr, password: passErr });
      return;
    }

    setErrors({});
    setIsLoading(true);

    const result = await apiLogin(email, password);
    setIsLoading(false);

    if (result) {
      onSuccess(result.email, result.role);
    }
  };

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emailErr = validateEmail(email);
    if (emailErr) {
      setErrors({ email: emailErr });
      return;
    }

    setErrors({});
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setSuccessMessage('لینک بازیابی رمز عبور با موفقیت به ایمیل شما ارسال شد. لطفاً صندوق ورودی خود را بررسی کنید.');
    }, 1500);
  };

  const handleRequestAccessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateRequestAccess()) return;

    setIsLoading(true);
    setErrors({});

    try {
      await gql<{ requestAccess: ApiAccessRequest }>(REQUEST_ACCESS, {
        input: { name, companyName, email, phone },
      });
      setIsLoading(false);
      setSuccessMessage('درخواست دسترسی شما با موفقیت ثبت شد. همکاران ما پس از بررسی مدارک سازمان با شما تماس خواهند گرفت.');
      setName('');
      setCompanyName('');
      setEmail('');
      setPhone('');
    } catch (err) {
      setIsLoading(false);
      const message = (err as Error).message || 'خطا در ثبت درخواست';
      if (message.includes('already exists')) {
        setErrors({ email: 'یک درخواست در انتظار برای این ایمیل وجود دارد' });
      } else {
        setErrors({ email: message });
      }
    }
  };

  // Render Login Form
  if (currentScreen === 'login') {
    return (
      <div className="w-full max-w-md mx-auto text-right">
        <div className="mb-8">
          <h2 className="text-2xl font-black text-slate-950 dark:text-white tracking-tight mb-2">ورود به سامانه</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500">برای دسترسی به پنل کاربری وارد حساب خود شوید</p>
        </div>

        {/* Portal Role Selector Bar */}
        <div className="mb-6 space-y-2">
          <label className="block text-xs font-black text-slate-700 dark:text-slate-300">انتخاب پرتال و نقش ورود:</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleRoleSelect('admin')}
              className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                selectedRole === 'admin'
                  ? 'bg-brand-500 text-white border-brand-500 shadow-md shadow-brand-500/20'
                  : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span className="text-[11px] font-bold">مدیریت</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleSelect('agent')}
              className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                selectedRole === 'agent'
                  ? 'bg-brand-500 text-white border-brand-500 shadow-md shadow-brand-500/20'
                  : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Headphones className="w-4 h-4" />
              <span className="text-[11px] font-bold">پشتیبانی</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleSelect('customer')}
              className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                selectedRole === 'customer'
                  ? 'bg-brand-500 text-white border-brand-500 shadow-md shadow-brand-500/20'
                  : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span className="text-[11px] font-bold">مشتریان</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleLoginSubmit} className="space-y-5">
          {/* Email input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">ایمیل سازمانی</label>
            <div className="relative">
              <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({ ...errors, email: undefined });
                }}
                className={`w-full pl-4 pr-11 py-3 text-xs bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white rounded-xl border ${
                  errors.email 
                    ? 'border-rose-500 focus:ring-rose-500/15' 
                    : 'border-slate-200 dark:border-slate-800 focus:ring-brand-500/15 focus:border-brand-500'
                } focus:ring-4 outline-none transition-all duration-200`}
              />
            </div>
            {errors.email && (
              <motion.p 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[10px] text-rose-500 flex items-center gap-1 mt-1 font-semibold"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.email}
              </motion.p>
            )}
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">رمز عبور</label>
              <button
                type="button"
                onClick={() => onScreenChange('forgot_password')}
                className="text-[11px] text-slate-400 dark:text-slate-500 hover:text-brand-500 dark:hover:text-brand-400 transition-colors"
              >
                رمز عبور را فراموش کرده‌اید؟
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors({ ...errors, password: undefined });
                }}
                className={`w-full pl-12 pr-11 py-3 text-xs bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white rounded-xl border ${
                  errors.password 
                    ? 'border-rose-500 focus:ring-rose-500/15' 
                    : 'border-slate-200 dark:border-slate-800 focus:ring-brand-500/15 focus:border-brand-500'
                } focus:ring-4 outline-none transition-all duration-200`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
              </button>
            </div>
            {errors.password && (
              <motion.p 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[10px] text-rose-500 flex items-center gap-1 mt-1 font-semibold"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.password}
              </motion.p>
            )}
          </div>

          {/* Remember me Checkbox */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-brand-600 focus:ring-brand-500/20"
              />
              <span className="text-xs text-slate-500 dark:text-slate-400">مرا به خاطر بسپار</span>
            </label>
          </div>

          {/* API Error */}
          {apiError && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[10px] text-rose-500 flex items-center gap-1 font-semibold bg-rose-50 dark:bg-rose-500/10 p-3 rounded-xl"
            >
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {apiError}
            </motion.p>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full relative py-3 bg-brand-600 hover:bg-brand-700 active:scale-[0.98] text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-500/15 flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer disabled:opacity-85 disabled:pointer-events-none"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>در حال تأیید هویت...</span>
              </>
            ) : (
              <span>ورود به حساب کاربری</span>
            )}
          </button>
        </form>

        {/* Form Footer Switch */}
        <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
          <span>حساب کاربری ندارید؟</span>{' '}
          <button
            onClick={() => { onScreenChange('request_access'); setErrors({}); }}
            className="text-brand-600 dark:text-brand-400 font-bold hover:underline transition-all"
          >
            درخواست دسترسی به سامانه
          </button>
        </div>
      </div>
    );
  }

  // Render Forgot Password Form
  if (currentScreen === 'forgot_password') {
    return (
      <div className="w-full max-w-md mx-auto text-right">
        <button
          onClick={() => { onScreenChange('login'); setErrors({}); setSuccessMessage(null); }}
          className="inline-flex items-center gap-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-xs mb-6 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          <span>بازگشت به صفحه ورود</span>
        </button>

        <div className="mb-6">
          <h2 className="text-2xl font-black text-slate-950 dark:text-white tracking-tight mb-2">بازیابی رمز عبور</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500">ایمیل سازمانی خود را وارد کنید تا لینک بازیابی ارسال شود</p>
        </div>

        {successMessage ? (
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs leading-relaxed"
          >
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-bold text-slate-900 dark:text-white">ارسال موفقیت‌آمیز</span>
            </div>
            {successMessage}
          </motion.div>
        ) : (
          <form onSubmit={handleForgotPasswordSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">ایمیل سازمانی</label>
              <div className="relative">
                <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors({});
                  }}
                  className={`w-full pl-4 pr-11 py-3 text-xs bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white rounded-xl border ${
                    errors.email 
                      ? 'border-rose-500 focus:ring-rose-500/15' 
                      : 'border-slate-200 dark:border-slate-800 focus:ring-brand-500/15 focus:border-brand-500'
                  } focus:ring-4 outline-none transition-all duration-200`}
                />
              </div>
              {errors.email && (
                <p className="text-[10px] text-rose-500 flex items-center gap-1 mt-1 font-semibold">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.email}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full relative py-3 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-500/15 flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer disabled:opacity-85 disabled:pointer-events-none"
            >
              {isLoading ? 'در حال ارسال...' : 'ارسال لینک بازیابی رمز'}
            </button>
          </form>
        )}
      </div>
    );
  }

  // Render Request Access Form
  if (currentScreen === 'request_access') {
    return (
      <div className="w-full max-w-md mx-auto text-right">
        <button
          onClick={() => { onScreenChange('login'); setErrors({}); setSuccessMessage(null); }}
          className="inline-flex items-center gap-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-xs mb-6 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          <span>بازگشت به صفحه ورود</span>
        </button>

        <div className="mb-6">
          <h2 className="text-2xl font-black text-slate-950 dark:text-white tracking-tight mb-2">درخواست دسترسی به سامانه</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500">مشخصات سازمان خود را ثبت کنید تا همکاران ما با شما تماس بگیرند</p>
        </div>

        {successMessage ? (
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs leading-relaxed"
          >
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 animate-bounce" />
              <span className="font-bold text-slate-900 dark:text-white">ثبت موفقیت‌آمیز</span>
            </div>
            {successMessage}
          </motion.div>
        ) : (
          <form onSubmit={handleRequestAccessSubmit} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">نام و نام خانوادگی نماینده</label>
              <div className="relative">
                <User className="absolute right-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="مثال: علی رضایی"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors({ ...errors, name: undefined });
                  }}
                  className={`w-full pl-4 pr-11 py-2.5 text-xs bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white rounded-xl border ${
                    errors.name ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
                  } outline-none focus:border-brand-500 transition-all`}
                />
              </div>
              {errors.name && <p className="text-[10px] text-rose-500 font-semibold">{errors.name}</p>}
            </div>

            {/* Company Name */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">نام شرکت / سازمان</label>
              <div className="relative">
                <Building className="absolute right-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="مثال: هلدینگ فناوری ارتباطات"
                  value={companyName}
                  onChange={(e) => {
                    setCompanyName(e.target.value);
                    if (errors.companyName) setErrors({ ...errors, companyName: undefined });
                  }}
                  className={`w-full pl-4 pr-11 py-2.5 text-xs bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white rounded-xl border ${
                    errors.companyName ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
                  } outline-none focus:border-brand-500 transition-all`}
                />
              </div>
              {errors.companyName && <p className="text-[10px] text-rose-500 font-semibold">{errors.companyName}</p>}
            </div>

            {/* Corporate Email */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">ایمیل سازمانی</label>
              <div className="relative">
                <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors({ ...errors, email: undefined });
                  }}
                  className={`w-full pl-4 pr-11 py-2.5 text-xs bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white rounded-xl border ${
                    errors.email ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
                  } outline-none focus:border-brand-500 transition-all`}
                />
              </div>
              {errors.email && <p className="text-[10px] text-rose-500 font-semibold">{errors.email}</p>}
            </div>

            {/* Phone Number */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">شماره تماس مستقیم</label>
              <div className="relative">
                <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (errors.phone) setErrors({ ...errors, phone: undefined });
                  }}
                  className={`w-full pl-4 pr-11 py-2.5 text-xs bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white rounded-xl border ${
                    errors.phone ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
                  } outline-none focus:border-brand-500 transition-all`}
                />
              </div>
              {errors.phone && <p className="text-[10px] text-rose-500 font-semibold">{errors.phone}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full relative py-3 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-500/15 flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer disabled:opacity-85 disabled:pointer-events-none"
            >
              {isLoading ? 'در حال ثبت درخواست...' : 'ارسال مشخصات سازمانی'}
            </button>
          </form>
        )}
      </div>
    );
  }

  return null;
}
