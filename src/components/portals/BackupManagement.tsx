import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Activity,
  AlertTriangle,
  Bell,
  Building,
  Check,
  CheckCircle2,
  ClipboardList,
  Clock,
  Database,
  Download,
  FileText,
  HardDrive,
  Headphones,
  Layers,
  Loader2,
  Lock,
  RefreshCw,
  Shield,
  Trash2,
  UserCheck,
  Users2,
  XCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn, formatDateTime } from '../../lib/utils';
import {
  createBackup,
  deleteBackup,
  downloadBackup,
  getBackupJob,
  listBackups,
  type BackupJob,
  type BackupRecord,
} from '../../api/backups';

interface BackupManagementViewProps {
  showToast: (message: string, type?: 'success' | 'error') => void;
}

interface BackupSectionOption {
  key: string;
  label: string;
  description: string;
  icon: LucideIcon;
  tables: string[];
}

const SECTIONS: BackupSectionOption[] = [
  {
    key: 'users',
    label: 'کاربران و دپارتمان‌ها',
    description: 'حساب‌های کاربری، اطلاعات تماس و ساختار سازمانی',
    icon: Users2,
    tables: ['User', 'Department'],
  },
  {
    key: 'rbac',
    label: 'نقش‌ها و دسترسی‌ها',
    description: 'نقش‌ها، پورتال‌ها، مجوزها و تخصیص دسترسی',
    icon: Shield,
    tables: [
      'Portal',
      'Permission',
      'Role',
      'RolePortal',
      'RolePermission',
      'UserRoleAssignment',
    ],
  },
  {
    key: 'customers',
    label: 'مشتریان و لایسنس‌ها',
    description: 'پرونده مشتریان و اتصال محصولات به آن‌ها',
    icon: Building,
    tables: ['Customer', 'ProductCustomerConnection'],
  },
  {
    key: 'products',
    label: 'محصولات',
    description: 'کاتالوگ محصولات، نسخه‌ها و وضعیت انتشار',
    icon: Layers,
    tables: ['Product'],
  },
  {
    key: 'tickets',
    label: 'تیکت‌ها و مکالمات',
    description: 'تیکت‌ها، پیام‌های گفتگو و پیوست‌ها',
    icon: Headphones,
    tables: ['Ticket', 'TicketMessage', 'TicketAttachment'],
  },
  {
    key: 'tasks',
    label: 'وظایف و یادداشت‌ها',
    description: 'وظایف تیمی، وضعیت‌ها و کامنت‌های هر وظیفه',
    icon: ClipboardList,
    tables: ['Task', 'TaskComment'],
  },
  {
    key: 'activities',
    label: 'فعالیت‌ها',
    description: 'تاریخچه رویدادها و رخدادهای سامانه',
    icon: Activity,
    tables: ['Activity'],
  },
  {
    key: 'notifications',
    label: 'اعلان‌ها',
    description: 'اعلان‌های درون‌برنامه‌ای و وضعیت خوانده‌شدن',
    icon: Bell,
    tables: ['Notification'],
  },
  {
    key: 'accessRequests',
    label: 'درخواست‌های دسترسی',
    description: 'درخواست‌های ثبت‌شده برای ورود به سامانه',
    icon: UserCheck,
    tables: ['AccessRequest'],
  },
];

const TABLE_LABELS: Record<string, string> = {
  User: 'کاربران',
  Department: 'دپارتمان‌ها',
  Portal: 'پورتال‌ها',
  Permission: 'مجوزها',
  Role: 'نقش‌ها',
  RolePortal: 'دسترسی نقش به پورتال',
  RolePermission: 'مجوزهای نقش',
  UserRoleAssignment: 'تخصیص نقش به کاربر',
  Customer: 'مشتریان',
  ProductCustomerConnection: 'لایسنس‌ها و اتصال محصول',
  Product: 'محصولات',
  Ticket: 'تیکت‌ها',
  TicketMessage: 'پیام‌های تیکت',
  TicketAttachment: 'پیوست‌های تیکت',
  Task: 'وظایف',
  TaskComment: 'یادداشت‌های وظیفه',
  Activity: 'فعالیت‌ها',
  Notification: 'اعلان‌ها',
  AccessRequest: 'درخواست‌های دسترسی',
  __write__: 'ساخت و ذخیره فایل نهایی',
};

const ALL_TABLE_COUNT = SECTIONS.reduce(
  (total, section) => total + section.tables.length,
  0,
);

const STATUS_META: Record<
  BackupJob['status'],
  { label: string; className: string }
> = {
  pending: {
    label: 'در انتظار شروع',
    className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
  running: {
    label: 'در حال اجرا',
    className: 'bg-brand-500/10 text-brand-600 dark:text-brand-400',
  },
  completed: {
    label: 'موفق',
    className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  failed: {
    label: 'ناموفق',
    className: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  },
};

function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return '۰ بایت';
  const units = ['بایت', 'کیلوبایت', 'مگابایت', 'گیگابایت'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toLocaleString('fa-IR', {
    maximumFractionDigits: value >= 10 ? 0 : 1,
  })} ${units[unit]}`;
}

function formatDuration(ms?: number): string {
  if (!ms || ms <= 0) return '—';
  if (ms < 1000) return `${ms.toLocaleString('fa-IR')} میلی‌ثانیه`;
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds.toLocaleString('fa-IR')} ثانیه`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes.toLocaleString('fa-IR')} دقیقه${
    rest > 0 ? ` و ${rest.toLocaleString('fa-IR')} ثانیه` : ''
  }`;
}

function recordCount(record: BackupRecord): number {
  return Object.values(record.counts ?? {}).reduce(
    (total, count) => total + (Number(count) || 0),
    0,
  );
}

export default function BackupManagementView({
  showToast,
}: BackupManagementViewProps) {
  const [selectedSections, setSelectedSections] = useState<string[]>(
    SECTIONS.map((section) => section.key),
  );
  const [history, setHistory] = useState<BackupRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [starting, setStarting] = useState(false);
  const [job, setJob] = useState<BackupJob | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BackupRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const toastRef = useRef(showToast);
  useEffect(() => {
    toastRef.current = showToast;
  }, [showToast]);

  const notify = useCallback(
    (message: string, type: 'success' | 'error' = 'success') => {
      toastRef.current(message, type);
    },
    [],
  );

  const refreshHistory = useCallback(
    async (silent = false) => {
      if (!silent) setLoadingHistory(true);
      try {
        const records = await listBackups();
        setHistory(records);
      } catch (error) {
        if (!silent) {
          notify(
            error instanceof Error
              ? error.message
              : 'دریافت تاریخچه پشتیبان‌ها ناموفق بود.',
            'error',
          );
        }
      } finally {
        if (!silent) setLoadingHistory(false);
      }
    },
    [notify],
  );

  useEffect(() => {
    void refreshHistory();
  }, [refreshHistory]);

  const allSelected = selectedSections.length === SECTIONS.length;
  const selectedTableCount = useMemo(
    () =>
      SECTIONS.filter((section) => selectedSections.includes(section.key)).reduce(
        (total, section) => total + section.tables.length,
        0,
      ),
    [selectedSections],
  );

  const jobActive = Boolean(
    job && (job.status === 'pending' || job.status === 'running'),
  );

  const totalBackupSize = useMemo(
    () =>
      history.reduce(
        (total, record) =>
          total + (record.status === 'completed' ? record.sizeBytes ?? 0 : 0),
        0,
      ),
    [history],
  );

  // Poll the running job until it finishes or fails.
  useEffect(() => {
    if (!job) return;
    if (job.status !== 'pending' && job.status !== 'running') return;

    let cancelled = false;

    const tick = async () => {
      try {
        const next = await getBackupJob(job.id);
        if (cancelled) return;
        setJob(next);

        if (next.status === 'completed') {
          notify('فایل پشتیبان با موفقیت تهیه شد.', 'success');
          void refreshHistory(true);
        } else if (next.status === 'failed') {
          notify(next.error || 'تهیه فایل پشتیبان ناموفق بود.', 'error');
          void refreshHistory(true);
        }
      } catch (error) {
        if (!cancelled) {
          const message =
            error instanceof Error
              ? error.message
              : 'پیگیری وضعیت پشتیبان‌گیری ناموفق بود.';
          notify(message, 'error');
          // Stop polling and surface the failure instead of retrying forever.
          setJob((current) =>
            current && current.id === job.id
              ? {
                  ...current,
                  status: 'failed',
                  error: message,
                  completedAt: new Date().toISOString(),
                }
              : current,
          );
        }
      }
    };

    const timer = window.setInterval(tick, 450);
    void tick();

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [job?.id, job?.status, notify, refreshHistory]);

  const toggleSection = (key: string) => {
    setSelectedSections((current) =>
      current.includes(key)
        ? current.filter((item) => item !== key)
        : [...current, key],
    );
  };

  const toggleAll = () => {
    setSelectedSections(
      allSelected ? [] : SECTIONS.map((section) => section.key),
    );
  };

  const startBackup = async () => {
    if (selectedSections.length === 0) {
      notify('حداقل یک بخش برای پشتیبان‌گیری انتخاب کنید.', 'error');
      return;
    }

    setStarting(true);
    try {
      const created = await createBackup(selectedSections);
      setJob(created);
      notify('فرایند پشتیبان‌گیری آغاز شد. پیشرفت آن را در همین صفحه ببینید.');
      if (created.status === 'completed' || created.status === 'failed') {
        void refreshHistory(true);
      }
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : 'شروع فرایند پشتیبان‌گیری ناموفق بود.',
        'error',
      );
    } finally {
      setStarting(false);
    }
  };

  const handleDownload = async (record: Pick<BackupRecord, 'id' | 'fileName'>) => {
    setDownloadingId(record.id);
    try {
      await downloadBackup(record);
      notify('دانلود فایل پشتیبان آغاز شد.');
    } catch (error) {
      notify(
        error instanceof Error ? error.message : 'دانلود فایل پشتیبان ناموفق بود.',
        'error',
      );
    } finally {
      setDownloadingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteBackup(deleteTarget.id);
      setHistory((current) =>
        current.filter((record) => record.id !== deleteTarget.id),
      );
      if (job?.id === deleteTarget.id) setJob(null);
      setDeleteTarget(null);
      notify('فایل پشتیبان با موفقیت حذف شد.');
    } catch (error) {
      notify(
        error instanceof Error ? error.message : 'حذف فایل پشتیبان ناموفق بود.',
        'error',
      );
    } finally {
      setDeleting(false);
    }
  };

  const currentStepLabel = job?.currentTable
    ? TABLE_LABELS[job.currentTable] || job.currentTable
    : 'در حال آماده‌سازی...';

  const progress = Math.max(0, Math.min(100, Math.round(job?.progress ?? 0)));

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Access notice */}
      <div className="rounded-2xl border border-amber-200/70 dark:border-amber-500/20 bg-amber-50/60 dark:bg-amber-500/5 p-4 flex items-start gap-3">
        <span className="w-9 h-9 shrink-0 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
          <Lock className="w-4.5 h-4.5" />
        </span>
        <div className="space-y-0.5">
          <p className="text-xs font-black text-amber-900 dark:text-amber-200">
            این بخش فقط در اختیار مدیر کل سامانه است
          </p>
          <p className="text-2xs text-amber-800/80 dark:text-amber-300/70 font-medium leading-relaxed">
            فایل‌های پشتیبان حاوی اطلاعات حساس سامانه هستند. آن‌ها را در محیطی
            امن نگهداری کنید و دسترسی به این صفحه را محدود نگه دارید.
          </p>
        </div>
      </div>

      {/* Create backup */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="w-11 h-11 shrink-0 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-sm font-black text-slate-950 dark:text-white">
                تهیه نسخه پشتیبان
              </h3>
              <p className="text-2xs text-slate-500 dark:text-slate-400 font-medium mt-1 leading-relaxed">
                بخش‌های موردنیاز را انتخاب کنید یا از کل دیتابیس پشتیبان بگیرید.
                خروجی به‌صورت یک فایل استاندارد JSON داخل سرور ذخیره و قابل
                دانلود خواهد بود.
              </p>
            </div>
          </div>
          <span className="self-start text-4xs font-black bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2.5 py-1 rounded-lg whitespace-nowrap">
            {ALL_TABLE_COUNT.toLocaleString('fa-IR')} جدول در دسترس
          </span>
        </div>

        {/* Full database option */}
        <button
          type="button"
          onClick={toggleAll}
          className={cn(
            'w-full text-right rounded-xl border p-3.5 transition-all cursor-pointer',
            allSelected
              ? 'border-brand-500/60 bg-brand-50/70 dark:bg-brand-500/5'
              : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/20 hover:border-brand-300 dark:hover:border-brand-500/40',
          )}
        >
          <div className="flex items-center gap-3">
            <span
              className={cn(
                'w-5 h-5 shrink-0 rounded-md border flex items-center justify-center transition-colors',
                allSelected
                  ? 'bg-brand-600 border-brand-600 text-white'
                  : 'border-slate-300 dark:border-slate-600 text-transparent',
              )}
            >
              <Check className="w-3.5 h-3.5" />
            </span>
            <span className="w-8 h-8 shrink-0 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center">
              <HardDrive className="w-4 h-4" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-slate-900 dark:text-white">
                بکاپ کامل از همه دیتابیس
              </p>
              <p className="text-2xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                تمام {ALL_TABLE_COUNT.toLocaleString('fa-IR')} جدول سامانه در یک
                فایل
              </p>
            </div>
            {allSelected && (
              <span className="text-4xs font-black bg-brand-600 text-white px-2 py-0.5 rounded-md">
                انتخاب شده
              </span>
            )}
          </div>
        </button>

        <div>
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <p className="text-2xs font-black text-slate-600 dark:text-slate-300">
              یا انتخاب بخش‌های موردنیاز
            </p>
            <span className="text-4xs text-slate-400 font-bold">
              {selectedSections.length.toLocaleString('fa-IR')} بخش ·{' '}
              {selectedTableCount.toLocaleString('fa-IR')} جدول
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {SECTIONS.map((section) => {
              const Icon = section.icon;
              const checked = selectedSections.includes(section.key);
              return (
                <button
                  key={section.key}
                  type="button"
                  onClick={() => toggleSection(section.key)}
                  className={cn(
                    'text-right rounded-xl border p-3 transition-all cursor-pointer',
                    checked
                      ? 'border-brand-500/50 bg-brand-50/60 dark:bg-brand-500/5'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/20 hover:border-brand-300 dark:hover:border-brand-500/40',
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    <span
                      className={cn(
                        'w-8 h-8 shrink-0 rounded-lg flex items-center justify-center',
                        checked
                          ? 'bg-brand-500/15 text-brand-600 dark:text-brand-400'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400',
                      )}
                    >
                      <Icon className="w-4 h-4" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-2xs font-black text-slate-800 dark:text-slate-100">
                        {section.label}
                      </p>
                      <p className="text-4xs text-slate-400 dark:text-slate-500 font-medium mt-0.5 leading-relaxed">
                        {section.description}
                      </p>
                      <p className="text-4xs text-slate-400/80 dark:text-slate-500/80 font-bold mt-1">
                        {section.tables.length.toLocaleString('fa-IR')} جدول
                      </p>
                    </div>
                    <span
                      className={cn(
                        'w-4 h-4 shrink-0 rounded border flex items-center justify-center',
                        checked
                          ? 'bg-brand-600 border-brand-600 text-white'
                          : 'border-slate-300 dark:border-slate-600 text-transparent',
                      )}
                    >
                      <Check className="w-3 h-3" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-4xs text-slate-400 dark:text-slate-500 font-medium leading-relaxed">
            پشتیبان‌گیری روی سرور انجام می‌شود و در صورت بسته‌شدن صفحه، فایل در
            تاریخچه باقی می‌ماند.
          </p>
          <button
            type="button"
            onClick={startBackup}
            disabled={starting || jobActive || selectedSections.length === 0}
            className="bg-brand-600 hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-black px-5 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            {starting || jobActive ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Database className="w-4 h-4" />
            )}
            <span>
              {jobActive
                ? 'در حال تهیه پشتیبان...'
                : 'شروع پشتیبان‌گیری'}
            </span>
          </button>
        </div>
      </div>

      {/* Progress / result */}
      <AnimatePresence>
        {job && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
              'rounded-2xl border p-5 shadow-xs',
              job.status === 'completed'
                ? 'bg-emerald-50/40 dark:bg-emerald-500/5 border-emerald-200/70 dark:border-emerald-500/20'
                : job.status === 'failed'
                  ? 'bg-rose-50/40 dark:bg-rose-500/5 border-rose-200/70 dark:border-rose-500/20'
                  : 'bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-800/60',
            )}
          >
            <div className="flex items-start gap-3">
              <span
                className={cn(
                  'w-10 h-10 shrink-0 rounded-xl flex items-center justify-center',
                  job.status === 'completed'
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                    : job.status === 'failed'
                      ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                      : 'bg-brand-500/10 text-brand-600 dark:text-brand-400',
                )}
              >
                {job.status === 'completed' ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : job.status === 'failed' ? (
                  <XCircle className="w-5 h-5" />
                ) : (
                  <Loader2 className="w-5 h-5 animate-spin" />
                )}
              </span>

              <div className="flex-1 min-w-0 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white">
                      {job.status === 'completed'
                        ? 'نسخه پشتیبان با موفقیت آماده شد'
                        : job.status === 'failed'
                          ? 'تهیه نسخه پشتیبان ناموفق بود'
                          : 'در حال تهیه نسخه پشتیبان'}
                    </h4>
                    <p className="text-4xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                      {job.status === 'failed'
                        ? job.error || 'خطای نامشخص'
                        : job.status === 'completed'
                          ? `${job.fileName || ''} · ${formatBytes(job.sizeBytes)}`
                          : currentStepLabel}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'self-start text-4xs font-black px-2 py-1 rounded-lg',
                      STATUS_META[job.status].className,
                    )}
                  >
                    {STATUS_META[job.status].label}
                  </span>
                </div>

                {jobActive && (
                  <>
                    <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-l from-brand-600 to-brand-400"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.35, ease: 'easeOut' }}
                      />
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-4xs font-bold text-slate-500 dark:text-slate-400">
                      <span>
                        {progress.toLocaleString('fa-IR')}٪ · مرحله{' '}
                        {Math.min(
                          job.completedSteps + 1,
                          job.totalSteps,
                        ).toLocaleString('fa-IR')}{' '}
                        از {job.totalSteps.toLocaleString('fa-IR')}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" />
                        {job.recordsProcessed.toLocaleString('fa-IR')} رکورد
                        پردازش‌شده
                      </span>
                    </div>
                  </>
                )}

                {job.status === 'completed' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="rounded-xl bg-white/70 dark:bg-slate-900/50 border border-emerald-200/50 dark:border-emerald-500/10 p-2.5">
                        <p className="text-4xs text-slate-400 font-bold">حجم فایل</p>
                        <p className="text-2xs font-black text-slate-800 dark:text-slate-100 mt-0.5">
                          {formatBytes(job.sizeBytes)}
                        </p>
                      </div>
                      <div className="rounded-xl bg-white/70 dark:bg-slate-900/50 border border-emerald-200/50 dark:border-emerald-500/10 p-2.5">
                        <p className="text-4xs text-slate-400 font-bold">رکوردها</p>
                        <p className="text-2xs font-black text-slate-800 dark:text-slate-100 mt-0.5">
                          {job.recordsProcessed.toLocaleString('fa-IR')}
                        </p>
                      </div>
                      <div className="rounded-xl bg-white/70 dark:bg-slate-900/50 border border-emerald-200/50 dark:border-emerald-500/10 p-2.5">
                        <p className="text-4xs text-slate-400 font-bold">جدول‌ها</p>
                        <p className="text-2xs font-black text-slate-800 dark:text-slate-100 mt-0.5">
                          {job.tables.length.toLocaleString('fa-IR')}
                        </p>
                      </div>
                      <div className="rounded-xl bg-white/70 dark:bg-slate-900/50 border border-emerald-200/50 dark:border-emerald-500/10 p-2.5">
                        <p className="text-4xs text-slate-400 font-bold">مدت زمان</p>
                        <p className="text-2xs font-black text-slate-800 dark:text-slate-100 mt-0.5">
                          {formatDuration(job.durationMs)}
                        </p>
                      </div>
                    </div>
                    <p className="text-4xs font-mono text-slate-400 dark:text-slate-500 break-all">
                      SHA-256: {job.checksum || '—'}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleDownload(job)}
                        disabled={downloadingId === job.id}
                        className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-2xs font-black px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        {downloadingId === job.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Download className="w-3.5 h-3.5" />
                        )}
                        دانلود و ذخیره فایل
                      </button>
                      <button
                        type="button"
                        onClick={() => setJob(null)}
                        className="bg-white/70 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-2xs font-black px-4 py-2 rounded-xl transition-all cursor-pointer"
                      >
                        بستن
                      </button>
                    </div>
                  </div>
                )}

                {job.status === 'failed' && (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setJob(null)}
                      className="bg-white/70 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-2xs font-black px-4 py-2 rounded-xl transition-all cursor-pointer"
                    >
                      بستن
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-start gap-3">
            <span className="w-10 h-10 shrink-0 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center">
              <Clock className="w-4.5 h-4.5" />
            </span>
            <div>
              <h3 className="text-sm font-black text-slate-950 dark:text-white">
                تاریخچه پشتیبان‌های ذخیره‌شده روی سرور
              </h3>
              <p className="text-2xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                {history.length > 0
                  ? `${history.length.toLocaleString('fa-IR')} فایل · مجموع ${formatBytes(
                      totalBackupSize,
                    )}`
                  : 'هنوز فایل پشتیبانی روی سرور ذخیره نشده است.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void refreshHistory()}
            disabled={loadingHistory}
            className="self-start text-2xs font-black text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-60"
          >
            <RefreshCw
              className={cn('w-3.5 h-3.5', loadingHistory && 'animate-spin')}
            />
            بروزرسانی تاریخچه
          </button>
        </div>

        {loadingHistory ? (
          <div className="flex items-center justify-center gap-2 py-10 text-2xs text-slate-400 font-bold">
            <Loader2 className="w-4 h-4 animate-spin" />
            در حال دریافت تاریخچه...
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Database className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-xs font-bold">هیچ فایل پشتیبانی ذخیره نشده است</p>
            <p className="text-2xs font-medium mt-1">
              اولین نسخه پشتیبان را از بخش بالا تهیه کنید.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse min-w-[760px]">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-4xs font-extrabold uppercase">
                  <th className="p-3 pr-0">فایل پشتیبان</th>
                  <th className="p-3">تاریخ</th>
                  <th className="p-3">حجم</th>
                  <th className="p-3">بخش‌ها</th>
                  <th className="p-3">رکوردها</th>
                  <th className="p-3">وضعیت</th>
                  <th className="p-3 pl-0 text-left">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-xs text-slate-700 dark:text-slate-300">
                {history.map((record) => (
                  <tr
                    key={record.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10"
                  >
                    <td className="p-3 pr-0">
                      <div className="flex items-center gap-2.5">
                        <span className="w-8 h-8 shrink-0 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center">
                          <FileText className="w-4 h-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-2xs font-black text-slate-900 dark:text-white truncate max-w-[220px]">
                            {record.fileName || 'پشتیبان ناتمام'}
                          </p>
                          <p className="text-4xs font-mono text-slate-400 dark:text-slate-500 truncate max-w-[220px]">
                            {record.id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-2xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {formatDateTime(record.createdAt)}
                    </td>
                    <td className="p-3 text-2xs font-bold whitespace-nowrap">
                      {record.status === 'completed'
                        ? formatBytes(record.sizeBytes)
                        : '—'}
                    </td>
                    <td className="p-3 text-2xs whitespace-nowrap">
                      {record.sections.length.toLocaleString('fa-IR')} بخش
                    </td>
                    <td className="p-3 text-2xs font-bold whitespace-nowrap">
                      {record.status === 'completed'
                        ? recordCount(record).toLocaleString('fa-IR')
                        : '—'}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span
                        className={cn(
                          'text-4xs font-black px-2 py-1 rounded-lg',
                          STATUS_META[record.status].className,
                        )}
                      >
                        {STATUS_META[record.status].label}
                      </span>
                    </td>
                    <td className="p-3 pl-0 text-left">
                      <div className="flex items-center justify-end gap-1.5">
                        {record.status === 'completed' && (
                          <button
                            type="button"
                            onClick={() => handleDownload(record)}
                            disabled={downloadingId === record.id}
                            className="text-4xs bg-brand-500/10 hover:bg-brand-500/15 text-brand-600 dark:text-brand-400 font-black px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer disabled:opacity-60"
                          >
                            {downloadingId === record.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Download className="w-3 h-3" />
                            )}
                            دانلود
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(record)}
                          className="text-4xs bg-rose-500/10 hover:bg-rose-500/15 text-rose-600 dark:text-rose-400 font-black px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-sm w-full p-6 text-right space-y-4"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl mx-auto bg-rose-50 dark:bg-rose-950/30">
                <AlertTriangle className="w-6 h-6 text-rose-500" />
              </div>
              <div className="text-center space-y-1">
                <h3 className="text-sm font-black text-slate-950 dark:text-white">
                  حذف فایل پشتیبان
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  آیا از حذف «
                  {deleteTarget.fileName || 'پشتیبان ناتمام'}
                  » مطمئن هستید؟ این عملیات قابل بازگشت نیست و فایل از روی سرور
                  پاک می‌شود.
                </p>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-black rounded-xl cursor-pointer disabled:opacity-60"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  {deleting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  تایید حذف
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
