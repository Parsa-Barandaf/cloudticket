import React from 'react';
import { motion } from 'motion/react';
import { Shield, Sparkles, MessageSquare, Users, Cpu, FileText, CheckCircle2, TrendingUp } from 'lucide-react';

export default function AbstractIllustration() {
  return (
    <div className="relative w-full h-full flex flex-col justify-between p-12 overflow-hidden select-none">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(14,165,233,0.08),transparent_60%)] dark:bg-[radial-gradient(circle_at_30%_30%,rgba(14,165,233,0.15),transparent_60%)] pointer-events-none" />
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(120,119,198,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(120,119,198,0.02)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(120,119,198,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(120,119,198,0.04)_1px,transparent_1px)] bg-[size:24px_24px]" />

      {/* Decorative Top Accent */}
      <div className="relative z-10 flex items-center gap-2">
        <div className="flex -space-x-2 rtl:space-x-reverse">
          <div className="w-8 h-8 rounded-full border border-white dark:border-slate-900 bg-brand-500 flex items-center justify-center text-white text-xs font-bold shadow-md">
            S
          </div>
          <div className="w-8 h-8 rounded-full border border-white dark:border-slate-900 bg-teal-500 flex items-center justify-center text-white text-xs font-bold shadow-md">
            H
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">هسته پردازش ابری</div>
          <div className="text-2xs text-slate-400 dark:text-slate-500">موتور تخصیص هوشمند تیکت‌ها</div>
        </div>
      </div>

      {/* Main Abstract Visual Composition */}
      <div className="relative z-10 flex-1 flex items-center justify-center">
        <div className="relative w-full max-w-lg aspect-square">
          {/* Main central portal / server hub */}
          <motion.div
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 40,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full border border-slate-200/50 dark:border-slate-800/50 flex items-center justify-center"
          >
            {/* Dashed outer ring */}
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-slate-300/30 dark:border-slate-700/30 scale-110" />
            
            {/* Spinning orbit dots */}
            <div className="absolute top-0 left-1/2 w-3 h-3 rounded-full bg-brand-500 shadow-lg shadow-brand-500/50" />
            <div className="absolute bottom-0 left-1/2 w-2 h-2 rounded-full bg-teal-500 shadow-lg shadow-teal-500/50" />
            <div className="absolute left-0 top-1/2 w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-lg shadow-indigo-500/50" />
          </motion.div>

          {/* Connected Network Waves (SVGs) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <svg className="w-full h-full opacity-60" viewBox="0 0 400 400" fill="none">
              <motion.path
                d="M50,200 Q120,80 200,200 T350,200"
                stroke="url(#gradient-wave-1)"
                strokeWidth="2"
                strokeDasharray="4 4"
                animate={{ strokeDashoffset: [0, -20] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              />
              <motion.path
                d="M50,200 Q120,320 200,200 T350,200"
                stroke="url(#gradient-wave-2)"
                strokeWidth="1.5"
                animate={{ strokeDashoffset: [20, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
              />
              <defs>
                <linearGradient id="gradient-wave-1" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.1" />
                  <stop offset="50%" stopColor="#0ea5e9" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.1" />
                </linearGradient>
                <linearGradient id="gradient-wave-2" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.1" />
                  <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.1" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Floating UI Card 1: Support Ticket Queue */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: [0, -10, 0], opacity: 1 }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-4 right-12 w-64 bg-white/75 dark:bg-slate-900/75 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 shadow-xl shadow-slate-100/50 dark:shadow-black/20"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">صف تیکت‌های فعال</span>
              </div>
              <span className="text-2xs bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 px-2 py-0.5 rounded-full font-mono">
                ۲۴ تیکت
              </span>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50/50 dark:bg-slate-800/40 border border-slate-100/50 dark:border-slate-700/20 text-right">
                <div>
                  <div className="text-xs font-medium text-slate-800 dark:text-slate-200">خطای دسترسی در پرداخت ارزی</div>
                  <div className="text-3xs text-slate-400 dark:text-slate-500">توسط شرکت آرمان‌پژوه • ۲ دقیقه پیش</div>
                </div>
                <span className="text-3xs bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 px-1.5 py-0.5 rounded font-medium">بحرانی</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50/50 dark:bg-slate-800/40 border border-slate-100/50 dark:border-slate-700/20 text-right">
                <div>
                  <div className="text-xs font-medium text-slate-800 dark:text-slate-200">عدم تطابق API وب‌هوکی</div>
                  <div className="text-3xs text-slate-400 dark:text-slate-500">توسط بانک سامان • ۵ دقیقه پیش</div>
                </div>
                <span className="text-3xs bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 px-1.5 py-0.5 rounded font-medium">متوسط</span>
              </div>
            </div>
          </motion.div>

          {/* Floating UI Card 2: SLA Response Time Chart */}
          <motion.div
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: [0, 10, 0], opacity: 1 }}
            transition={{
              duration: 7,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
            className="absolute bottom-6 left-6 w-56 bg-white/75 dark:bg-slate-900/75 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 shadow-xl shadow-slate-100/50 dark:shadow-black/20"
          >
            <div className="flex items-center gap-2 mb-2 text-slate-700 dark:text-slate-300">
              <TrendingUp className="w-4 h-4 text-brand-500" />
              <span className="text-xs font-semibold">پایبندی به SLA پاسخگویی</span>
            </div>
            
            <div className="flex items-end gap-1.5 h-16 pt-3 px-1">
              {[40, 55, 45, 70, 65, 85, 95].map((height, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                  <div className="relative w-full group">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ duration: 1.5, delay: idx * 0.1 }}
                      className={`w-full rounded-t-sm ${
                        idx === 6 
                          ? 'bg-gradient-to-t from-brand-600 to-brand-400' 
                          : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-2xs text-slate-400 dark:text-slate-500">
              <span>هدف: ۹۹.۲٪</span>
              <span className="font-semibold text-emerald-500">۹۹.۸٪ واقعی</span>
            </div>
          </motion.div>

          {/* Floating UI Element 3: Smart AI Agent matching */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: [1, 1.05, 1], opacity: 1 }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5
            }}
            className="absolute top-1/2 left-0 -translate-y-1/2 w-48 bg-white/75 dark:bg-slate-900/75 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-3 shadow-xl shadow-slate-100/50 dark:shadow-black/20"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              </div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">تخصیص هوشمند تیکت</span>
            </div>
            <div className="text-2xs text-slate-500 dark:text-slate-400 mb-2">تیکت #۵۱۲۴ ارجاع شد به:</div>
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-xl border border-slate-100 dark:border-slate-700/30">
              <div className="w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400 flex items-center justify-center text-2xs font-bold">رع</div>
              <div className="text-right">
                <div className="text-2xs font-medium text-slate-800 dark:text-slate-200">رضا علوی</div>
                <div className="text-4xs text-slate-400">سرپرست پشتیبانی فنی</div>
              </div>
            </div>
          </motion.div>

          {/* Center glowing server stack icon */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-brand-500/10 dark:bg-brand-500/20 border-2 border-brand-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-brand-500/50">
            <Cpu className="w-10 h-10 text-brand-500 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Decorative Bottom Slogan */}
      <div className="relative z-10 text-right mt-auto">
        <div className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2 flex items-center gap-2 justify-end">
          <span className="text-brand-500">پلتفرم مدیریت مشتریان</span>
          <Shield className="w-5 h-5 text-brand-500" />
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mr-auto">
          سرویس یکپارچه پشتیبانی مشتریان با تکنولوژی ابری، مسیریابی هوشمند تیکت‌ها مبتنی بر هوش مصنوعی و داشبورد زنده بررسی عملکرد کل تیم.
        </p>
      </div>
    </div>
  );
}
