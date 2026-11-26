import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ClipboardList,
  List,
  Calendar,
  Plus,
  Filter,
  Clock,
  CheckCircle2,
  X,
  Trash2,
  Pencil,
  MessageSquare,
  History,
  User,
  AlertTriangle,
  Send,
  Loader2,
  CalendarClock,
  ChevronRight,
  ChevronLeft,
  Check,
  CheckCheck,
  Flag,
  GripVertical,
  CalendarPlus,
  Eye,
  Archive,
  ArchiveRestore,
  ListChecks,
  ChevronDown,
} from 'lucide-react';
import { useTasks } from '../../hooks/useTasks';
import { mapTaskComment } from '../../api/transform';
import { toJalaali, toGregorian } from 'jalaali-js';
import JalaliDatePicker from '../../components/JalaliDatePicker';
import type { ApiUser } from '../../api/types';
import type { TaskPriority, TaskStatus } from '../../api/types';
import type { TaskItem, TaskCommentItem } from '../../types';
import { formatTimeAgo } from '../../lib/utils';

interface TaskManagerProps {
  mode: 'admin' | 'agent';
  currentUserId: string;
  currentUserName: string;
  users: ApiUser[];
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

type ViewMode = 'list' | 'board';
type CommentType = 'note' | 'timeline';

const statusList: TaskStatus[] = ['PENDING', 'IN_PROGRESS', 'DONE', 'CANCELLED'];
const priorityList: TaskPriority[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

// تعداد وظایف رندر‌شده در هر مرحله؛ ادامه لیست با اسکرول یا دکمه «نمایش بیشتر» بارگذاری می‌شود
const TASK_PAGE_SIZE = 20;

type ConfirmAction =
  | { type: 'delete'; task: TaskItem }
  | { type: 'status'; task: TaskItem; status: TaskStatus }
  | { type: 'archive'; task: TaskItem }
  | { type: 'restore'; task: TaskItem }
  | { type: 'bulk-delete'; ids: string[] };

const statusMeta: Record<TaskStatus, { label: string; cls: string; iconCls: string }> = {
  PENDING: { label: 'در انتظار', cls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30', iconCls: 'text-amber-500' },
  IN_PROGRESS: { label: 'در حال انجام', cls: 'bg-brand-500/10 text-brand-600 dark:text-brand-400 border-brand-500/30', iconCls: 'text-brand-500' },
  DONE: { label: 'انجام شده', cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30', iconCls: 'text-emerald-500' },
  CANCELLED: { label: 'لغو شده', cls: 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/30', iconCls: 'text-slate-400' },
};

const priorityMeta: Record<TaskPriority, { label: string; cls: string }> = {
  CRITICAL: { label: 'بحرانی', cls: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30' },
  HIGH: { label: 'بالا', cls: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30' },
  MEDIUM: { label: 'متوسط', cls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30' },
  LOW: { label: 'پایین', cls: 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/30' },
};

function fmtDate(iso?: string): string {
  if (!iso) return 'بدون تاریخ';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return 'بدون تاریخ';
  return new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

function fmtDateTime(iso?: string): string {
  if (!iso) return 'بدون تاریخ';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return 'بدون تاریخ';
  const date = new Intl.DateTimeFormat('fa-IR', { month: '2-digit', day: '2-digit' }).format(d);
  const time = new Intl.DateTimeFormat('fa-IR', { hour: '2-digit', minute: '2-digit' }).format(d);
  return `${date} - ${time}`;
}

function fmtTimestamp(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const date = new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
  const time = new Intl.DateTimeFormat('fa-IR', { hour: '2-digit', minute: '2-digit' }).format(d);
  return `${date} - ${time}`;
}

interface TaskTimestampProps {
  icon: React.ReactNode;
  label: string;
  value?: string;
  placeholder?: string;
}

function TaskTimestamp({ icon, label, value, placeholder = 'ثبت نشده' }: TaskTimestampProps) {
  const formatted = fmtTimestamp(value);
  return (
    <span
      className="inline-flex items-center gap-1 whitespace-nowrap"
      title={`${label}: ${formatted || placeholder}`}
    >
      <span className="text-slate-400 dark:text-slate-500">{icon}</span>
      <span className="font-bold text-slate-500 dark:text-slate-400">{label}:</span>
      <span className={`font-bold tabular-nums ${formatted ? 'text-slate-700 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400'}`}>
        {formatted || placeholder}
      </span>
    </span>
  );
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

interface TaskCheckboxProps {
  checked: boolean;
  onChange: () => void;
  label: string;
}

// چک‌باکس مینیمال با ظاهر مدرن (input بومی برای دسترس‌پذیری حفظ شده است)
function TaskCheckbox({ checked, onChange, label }: TaskCheckboxProps) {
  return (
    <span className="relative inline-flex items-center justify-center shrink-0">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        aria-label={label}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className="w-[18px] h-[18px] rounded-[6px] border-[1.5px] border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-transparent flex items-center justify-center transition-all duration-150 peer-checked:bg-brand-600 peer-checked:border-brand-600 peer-checked:text-white peer-hover:border-brand-400 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500/40 peer-focus-visible:ring-offset-1 dark:peer-focus-visible:ring-offset-slate-900"
      >
        <Check className="w-3 h-3" strokeWidth={3} />
      </span>
    </span>
  );
}

export default function TaskManager({ mode, currentUserId, currentUserName, users, showToast }: TaskManagerProps) {
  const isAdmin = mode === 'admin';
  const { tasks, loading, error, refetch, createTask, updateTask, updateStatus, deleteTask, addComment, reorderTasks, markSeen, archiveTask, unarchiveTask , bulkUpdateStatus, bulkDelete  } =
    useTasks(isAdmin ? 'all' : 'mine', isAdmin ? '' : currentUserId);

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showArchived, setShowArchived] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | TaskStatus>('ALL');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);

  // board month navigation
  const [boardMonth, setBoardMonth] = useState<Date>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  // create/edit form
  const emptyForm = { title: '', description: '', assigneeId: currentUserId, priority: 'MEDIUM' as TaskPriority, dueDate: '', dueTime: '' };
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState<{ title?: string; assigneeId?: string }>({});
  const [saving, setSaving] = useState(false);

  // comment form
  const [commentText, setCommentText] = useState('');
  const [commentType, setCommentType] = useState<CommentType>('note');
  const [sendingComment, setSendingComment] = useState(false);

  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (showArchived ? !t.archivedAt : !!t.archivedAt) return false;
      if (statusFilter !== 'ALL' && t.statusRaw !== statusFilter) return false;
      if (assigneeFilter !== 'ALL' && t.assigneeId !== assigneeFilter) return false;
      return true;
    });
  }, [tasks, statusFilter, assigneeFilter, showArchived]);

  const archivedCount = useMemo(() => tasks.filter(t => !!t.archivedAt).length, [tasks]);

  // ── نمایش تدریجی، انتخاب گروهی و اکشن‌های گروهی ──
  const [visibleCount, setVisibleCount] = useState(TASK_PAGE_SIZE);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const visibleTasks = useMemo(
    () => filteredTasks.slice(0, visibleCount),
    [filteredTasks, visibleCount],
  );
  const hasMore = visibleCount < filteredTasks.length;
  const remainingCount = Math.max(filteredTasks.length - visibleCount, 0);
  const allFilteredSelected = filteredTasks.length > 0 && filteredTasks.every(t => selectedIds.has(t.id));

  // با تغییر فیلترها، لیست از ابتدا و بدون انتخاب قبلی نمایش داده می‌شود
  useEffect(() => {
    setVisibleCount(TASK_PAGE_SIZE);
    setSelectedIds(new Set());
  }, [statusFilter, assigneeFilter, showArchived]);

  // نمایش نوار اکشن فشرده پس از عبور از هدر اصلی
  useEffect(() => {
    const el = headerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      entries => {
        const entry = entries[0];
        setShowStickyBar(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      { rootMargin: '-88px 0px 0px 0px', threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // حذف خودکار شناسه‌های حذف‌شده/ناموجود از انتخاب‌ها
  useEffect(() => {
    setSelectedIds(prev => {
      if (prev.size === 0) return prev;
      const existing = new Set(filteredTasks.map(t => t.id));
      const next = new Set<string>();
      prev.forEach(id => {
        if (existing.has(id)) next.add(id);
      });
      return next.size === prev.size ? prev : next;
    });
  }, [filteredTasks]);

  // بارگذاری خودکار صفحه بعد وقتی انتهای لیست در دید است
  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel || !hasMore || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          setVisibleCount(count => Math.min(count + TASK_PAGE_SIZE, filteredTasks.length));
        }
      },
      { rootMargin: '160px 0px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [filteredTasks.length, hasMore, visibleCount]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds(allFilteredSelected ? new Set() : new Set(filteredTasks.map(t => t.id)));
  };

  const clearSelection = () => setSelectedIds(new Set());

  const runBulkStatus = async (status: TaskStatus) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0 || bulkBusy) return;
    setBulkBusy(true);
    try {
      await bulkUpdateStatus(ids, status);
      clearSelection();
      showToast(`وضعیت ${ids.length} وظیفه به «${statusMeta[status].label}» تغییر یافت.`, 'success');
    } catch (e) {
      showToast('خطا در تغییر گروهی وضعیت: ' + (e as Error).message, 'error');
    } finally {
      setBulkBusy(false);
    }
  };

  const requestBulkDelete = () => {
    if (!isAdmin || selectedIds.size === 0) return;
    setConfirmAction({ type: 'bulk-delete', ids: Array.from(selectedIds) });
  };

  const handleTaskDrop = async (targetId: string) => {
    if (!draggedTaskId || draggedTaskId === targetId) {
      setDraggedTaskId(null);
      setDragOverTaskId(null);
      return;
    }

    const visibleIds = filteredTasks.map(task => task.id);
    const fromIndex = visibleIds.indexOf(draggedTaskId);
    const toIndex = visibleIds.indexOf(targetId);
    if (fromIndex === -1 || toIndex === -1) {
      setDraggedTaskId(null);
      setDragOverTaskId(null);
      return;
    }

    const nextVisibleIds = [...visibleIds];
    const [movedId] = nextVisibleIds.splice(fromIndex, 1);
    nextVisibleIds.splice(toIndex, 0, movedId);

    let visibleCursor = 0;
    const nextAllIds = tasks.map(task => {
      if (!visibleIds.includes(task.id)) return task.id;
      const nextId = nextVisibleIds[visibleCursor];
      visibleCursor += 1;
      return nextId;
    });

    setDraggedTaskId(null);
    setDragOverTaskId(null);
    await reorderTasks(nextAllIds);
    showToast('ترتیب وظایف ذخیره شد.', 'success');
  };

  const openCreate = () => {
    setForm({ ...emptyForm, assigneeId: isAdmin ? '' : currentUserId });
    setFormErrors({});
    setEditingTask(null);
    setShowCreateModal(true);
  };

  const openEdit = (t: TaskItem) => {
    setEditingTask(t);
    let dueDate = '';
    let dueTime = '';
    if (t.dueDate) {
      const d = new Date(t.dueDate);
      if (!isNaN(d.getTime())) {
        const j = toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate());
        dueDate = `${j.jy}-${String(j.jm).padStart(2, '0')}-${String(j.jd).padStart(2, '0')}`;
        dueTime = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      }
    }
    setForm({ title: t.title, description: t.description || '', assigneeId: t.assigneeId || '', priority: t.priorityRaw, dueDate, dueTime });
    setFormErrors({});
    setShowCreateModal(true);
  };

  const clearFormError = (field: 'title' | 'assigneeId') =>
    setFormErrors(prev => (prev[field] ? { ...prev, [field]: undefined } : prev));

  const handleSaveTask = async () => {
    const nextErrors: { title?: string; assigneeId?: string } = {};
    if (!form.title.trim()) nextErrors.title = 'عنوان وظیفه الزامی است.';
    if (!form.assigneeId) nextErrors.assigneeId = 'انتخاب مسئول وظیفه الزامی است.';
    setFormErrors(nextErrors);
    const firstError = nextErrors.title ?? nextErrors.assigneeId;
    if (firstError) {
      showToast(firstError, 'error');
      return;
    }

    setSaving(true);
    try {
      let dueDate: string | undefined;
      if (form.dueDate) {
        const [jy, jm, jd] = form.dueDate.split('-').map(Number);
        if (jy && jm && jd) {
          const g = toGregorian(jy, jm, jd);
          const combined = form.dueTime ? new Date(g.gy, g.gm - 1, g.gd, Number(form.dueTime.split(':')[0]), Number(form.dueTime.split(':')[1])) : new Date(g.gy, g.gm - 1, g.gd, 23, 59);
          dueDate = combined.toISOString();
        }
      }

      if (editingTask) {
        await updateTask({
          id: editingTask.id,
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          priority: form.priority,
          assigneeId: form.assigneeId,
          dueDate,
        });
        showToast('وظیفه با موفقیت به‌روزرسانی شد.', 'success');
      } else {
        await createTask({
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          priority: form.priority,
          assigneeId: form.assigneeId,
          dueDate,
          createdById: currentUserId,
        });
        showToast('وظیفه جدید با موفقیت ثبت شد.', 'success');
      }
      setShowCreateModal(false);
    } catch (e) {
      showToast('خطا در ذخیره وظیفه: ' + (e as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const requestDelete = (t: TaskItem) => setConfirmAction({ type: 'delete', task: t });

  const requestStatusChange = (t: TaskItem, status: TaskStatus) => setConfirmAction({ type: 'status', task: t, status });

  const requestArchive = (t: TaskItem) => setConfirmAction({ type: 'archive', task: t });

  const requestRestore = (t: TaskItem) => setConfirmAction({ type: 'restore', task: t });

  const runConfirmAction = async () => {
    if (!confirmAction) return;
    setConfirming(true);
    try {
      if (confirmAction.type === 'delete') {
        await deleteTask(confirmAction.task.id);
        if (selectedTask?.id === confirmAction.task.id) setSelectedTask(null);
        showToast('وظیفه حذف شد.', 'success');
      } else if (confirmAction.type === 'archive') {
        await archiveTask(confirmAction.task.id);
        if (selectedTask?.id === confirmAction.task.id) setSelectedTask(null);
        showToast(
          confirmAction.task.statusRaw !== 'DONE'
            ? 'وظیفه آرشیو شد و وضعیت آن به «لغو شده» تغییر یافت.'
            : 'وظیفه آرشیو شد.',
          'success',
        );
      } else if (confirmAction.type === 'restore') {
        await unarchiveTask(confirmAction.task.id);
        showToast('وظیفه از آرشیو بازگردانده شد.', 'success');
      } else if (confirmAction.type === 'bulk-delete') {
        const ids = confirmAction.ids;
        await bulkDelete(ids);
        clearSelection();
        if (selectedTask && ids.includes(selectedTask.id)) setSelectedTask(null);
        showToast(`${ids.length} وظیفه حذف شد.`, 'success');
      } else if (confirmAction.type === 'status') {
        await updateStatus(confirmAction.task.id, confirmAction.status);
        if (selectedTask?.id === confirmAction.task.id) {
          setSelectedTask({ ...selectedTask, statusRaw: confirmAction.status, status: statusMeta[confirmAction.status].label as TaskItem['status'] });
        }
        showToast(`وضعیت وظیفه به «${statusMeta[confirmAction.status].label}» تغییر یافت.`, 'success');
      }
      setConfirmAction(null);
    } catch (e) {
      showToast('خطا در انجام عملیات: ' + (e as Error).message, 'error');
    } finally {
      setConfirming(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !selectedTask) return;
    setSendingComment(true);
    try {
      const created = await addComment({
        taskId: selectedTask.id,
        text: commentText.trim(),
        type: commentType,
        authorId: currentUserId,
      });
      if (created) {
        setSelectedTask(prev => prev ? { ...prev, comments: [...prev.comments, mapTaskComment(created)] } : prev);
      }
      setCommentText('');
      showToast(commentType === 'timeline' ? 'پیشرفت ثبت شد.' : 'یادداشت ثبت شد.', 'success');
    } catch (e) {
      showToast('خطا در ثبت: ' + (e as Error).message, 'error');
    } finally {
      setSendingComment(false);
    }
  };

  // «دیده شده» فقط زمانی معنا دارد که مسئول وظیفه آن را مشاهده کرده باشد
  const hasAssigneeSeen = (task: TaskItem) => Boolean(task.assigneeId && task.seenAt);
  // «دیده‌نشده برای من» تنها برای مسئول وظیفه قابل محاسبه است
  const isUnreadForMe = (task: TaskItem) => task.assigneeId === currentUserId && !hasAssigneeSeen(task);

  const openDetail = async (t: TaskItem) => {
    setSelectedTask(t);
    if (!isUnreadForMe(t)) return;

    const seenTask = await markSeen(t.id, currentUserId);
    if (seenTask) setSelectedTask(seenTask);
  };

  // Board computation
  const boardCells = useMemo(() => {
    const year = boardMonth.getFullYear();
    const month = boardMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // RTL Persian week starts Saturday
    const startOffset = (firstDay.getDay() + 1) % 7;
    const cells: { date: Date; tasks: TaskItem[] }[] = [];
    for (let i = 0; i < startOffset; i++) cells.push({ date: new Date(year, month, i - startOffset + 1), tasks: [] });
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      cells.push({ date, tasks: tasks.filter(t => !t.archivedAt && t.dueDate && sameDay(new Date(t.dueDate), date) && t.statusRaw !== 'CANCELLED') });
    }
    while (cells.length % 7 !== 0) {
      const last = cells[cells.length - 1].date;
      cells.push({ date: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1), tasks: [] });
    }
    return cells;
  }, [boardMonth, tasks]);

  const overdueTasks = useMemo(() => tasks.filter(t => t.overdue && !t.archivedAt), [tasks]);

  const monthLabel = new Intl.DateTimeFormat('fa-IR', { month: 'long', year: 'numeric' }).format(boardMonth);
  const today = new Date();

  const assigneeOptions = users.filter(u => !u.isCustomer);

  return (
    <div className="space-y-6 text-right font-sans pb-12 relative">
      {/* Header */}
      <div ref={headerRef} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-brand-500/10 to-transparent rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div>
            <h1 className="text-lg font-black text-slate-950 dark:text-white flex items-center gap-2">
              <ClipboardList className="w-5.5 h-5.5 text-brand-500" />
              <span>مدیریت وظایف</span>
            </h1>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-1">
              {isAdmin
                ? 'تعریف وظایف برای کاربران سازمان، پیگیری پیشرفت و مشاهده تقویم زمانی'
                : 'وظایف محول‌شده به شما، ثبت پیشرفت و یادداشت‌های مرتبط'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={openCreate}
              className="px-4 py-2 text-xs font-black bg-brand-600 hover:bg-brand-700 text-white rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-brand-500/10 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>وظیفه جدید</span>
            </button>
            <button
              onClick={() => { refetch(); showToast('لیست وظایف به‌روزرسانی شد.', 'success'); }}
              className="px-4 py-2 text-xs font-black bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Loader2 className="w-4 h-4 text-brand-500" />
              <span>به‌روزرسانی</span>
            </button>
          </div>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1.5 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/60 relative z-10">
          <button
            onClick={() => { setViewMode('list'); setShowArchived(false); }}
            className={`px-4.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
              viewMode === 'list' && !showArchived
                ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-100 dark:border-brand-500/20'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <List className="w-4 h-4" />
            <span>نمایش لیستی</span>
          </button>
          <button
            onClick={() => { setViewMode('board'); setShowArchived(false); }}
            className={`px-4.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
              viewMode === 'board' && !showArchived
                ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-100 dark:border-brand-500/20'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>تقویم زمانی</span>
          </button>
          <button
            onClick={() => { setViewMode('list'); setShowArchived(true); }}
            className={`px-4.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
              showArchived
                ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Archive className="w-4 h-4" />
            <span>آرشیو</span>
            {archivedCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black bg-amber-500/15 text-amber-600 dark:text-amber-400">{archivedCount}</span>
            )}
          </button>
        </div>
      </div>

      {/* نوار اکشن فشرده و استیکی هنگام عبور از هدر */}
      <AnimatePresence>
        {showStickyBar && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="sticky top-[5.5rem] z-30"
          >
            <div className="flex items-center justify-between gap-3 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border border-slate-200/70 dark:border-slate-700/60 rounded-2xl shadow-md shadow-slate-900/5 px-3 py-2">
              <div className="flex items-center gap-2 min-w-0 text-[11px] font-black text-slate-700 dark:text-slate-200">
                <ClipboardList className="w-4 h-4 text-brand-500 shrink-0" />
                <span className="truncate">مدیریت وظایف</span>
                <span className="px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 font-mono text-[10px]">
                  {filteredTasks.length.toLocaleString('fa-IR')}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={openCreate}
                  aria-label="وظیفه جدید"
                  className="px-3 py-1.5 text-[11px] font-black bg-brand-600 hover:bg-brand-700 text-white rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-brand-600/20"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">وظیفه جدید</span>
                </button>
                <button
                  type="button"
                  onClick={() => { refetch(); showToast('لیست وظایف به‌روزرسانی شد.', 'success'); }}
                  aria-label="به‌روزرسانی لیست وظایف"
                  title="به‌روزرسانی"
                  className="p-2 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-200 transition-colors cursor-pointer"
                >
                  <Loader2 className={`w-4 h-4 text-brand-500 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {/* LIST VIEW */}
        {viewMode === 'list' && (
          <motion.div
            key="task-list"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="space-y-6"
          >
            {/* Filters */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800/50">
                <Filter className="w-4 h-4 text-brand-500" />
                <h3 className="text-xs font-black text-slate-900 dark:text-white">فیلتر وظایف</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  {(['ALL', ...statusList] as const).map(s => (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        statusFilter === s
                          ? 'bg-brand-600 text-white border-transparent'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200/60 dark:border-slate-800'
                      }`}
                    >
                      {s === 'ALL' ? 'همه' : statusMeta[s].label}
                    </button>
                  ))}
                </div>
                {isAdmin && (
                  <div>
                    <select
                      value={assigneeFilter}
                      onChange={(e) => setAssigneeFilter(e.target.value)}
                      className="w-full text-xs font-bold px-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/40 focus:border-brand-500 outline-none text-slate-700 dark:text-slate-200 cursor-pointer"
                    >
                      <option value="ALL">همه کاربران</option>
                      {assigneeOptions.map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="text-xs text-slate-400 font-bold flex flex-wrap items-center gap-3">
                  <span className="flex items-center gap-1.5">
                    <span>تعداد:</span>
                    <span className="px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 font-mono">{filteredTasks.length}</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                    نمایش {visibleTasks.length.toLocaleString('fa-IR')} از {filteredTasks.length.toLocaleString('fa-IR')}
                  </span>
                  {filteredTasks.length > 0 && (
                    <label className="flex items-center gap-1.5 cursor-pointer select-none text-[11px] text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400">
                      <TaskCheckbox
                        checked={allFilteredSelected}
                        onChange={toggleSelectAll}
                        label="انتخاب همه وظایف فیلترشده"
                      />
                      <span>انتخاب همه</span>
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* Bulk action bar */}
            <AnimatePresence initial={false}>
              {selectedIds.size > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className={`sticky z-20 transition-[top] duration-200 ${showStickyBar ? 'top-[9.25rem]' : 'top-[5.5rem]'} bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/70 p-2.5 rounded-2xl shadow-lg shadow-slate-900/5 flex flex-wrap items-center gap-2`}
                >
                  <div className="flex items-center gap-2 text-[11px] font-black text-slate-700 dark:text-slate-200">
                    <span className="p-1.5 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400">
                      <ListChecks className="w-4 h-4" />
                    </span>
                    <span>{selectedIds.size.toLocaleString('fa-IR')} وظیفه انتخاب شده</span>
                    {bulkBusy && <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-500" />}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 mr-auto">
                    <div className="relative">
                      <select
                        aria-label="تغییر گروهی وضعیت"
                        value=""
                        onChange={(e) => {
                          const next = e.target.value as TaskStatus | '';
                          e.currentTarget.value = '';
                          if (next) void runBulkStatus(next);
                        }}
                        disabled={bulkBusy}
                        className="appearance-none text-[11px] font-black pr-3 pl-8 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-transparent focus:border-brand-500 outline-none cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="">تغییر وضعیت…</option>
                        {statusList.map(s => (
                          <option key={s} value={s}>{statusMeta[s].label}</option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={requestBulkDelete}
                        disabled={bulkBusy}
                        aria-label="حذف وظایف انتخاب‌شده"
                        title="حذف"
                        className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/30 text-slate-500 dark:text-slate-400 hover:text-rose-500 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={clearSelection}
                      disabled={bulkBusy}
                      aria-label="لغو انتخاب"
                      title="لغو انتخاب"
                      className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Task cards */}
            <div className="space-y-3">
            {loading && filteredTasks.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 text-center space-y-3">
                <Loader2 className="w-10 h-10 text-brand-500 mx-auto animate-spin" />
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-200">در حال بارگذاری وظایف...</h3>
              </div>
            ) : error ? (
              <div className="bg-rose-50 dark:bg-rose-950/30 p-10 rounded-2xl border border-rose-200/60 dark:border-rose-800/50 text-center space-y-3">
                <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
                <h3 className="text-sm font-black text-rose-700 dark:text-rose-300">خطا در دریافت وظایف</h3>
                <p className="text-xs text-slate-400">{error}</p>
                <button onClick={() => refetch()} className="px-4 py-2 text-xs font-black bg-rose-500 hover:bg-rose-600 text-white rounded-xl transition-colors cursor-pointer">تلاش مجدد</button>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 text-center space-y-3">
                <ClipboardList className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-200">{showArchived ? 'هیچ وظیفه آرشیو شده‌ای وجود ندارد.' : 'هیچ وظیفه‌ای پیدا نشد!'}</h3>
                <p className="text-xs text-slate-400">{showArchived ? 'وظایفی که آرشیو می‌کنید در این بخش نگهداری می‌شوند.' : 'فیلترها را تغییر دهید یا وظیفه جدیدی تعریف کنید.'}</p>
                {!showArchived && (
                  <button onClick={openCreate} className="mx-auto px-4 py-2 text-xs font-black bg-brand-600 hover:bg-brand-700 text-white rounded-xl flex items-center gap-1.5 cursor-pointer">
                    <Plus className="w-4 h-4" />
                    <span>وظیفه جدید</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {visibleTasks.map((t) => {
                  const unseen = isUnreadForMe(t);
                  const seenByAssignee = hasAssigneeSeen(t);
                  const isSelected = selectedIds.has(t.id);
                  return (
                  <motion.div
                    key={t.id}
                    layout
                    draggable={viewMode === 'list' && !showArchived}
                    onDragStart={() => setDraggedTaskId(t.id)}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverTaskId(t.id);
                    }}
                    onDragLeave={() => setDragOverTaskId(current => current === t.id ? null : current)}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleTaskDrop(t.id);
                    }}
                    onDragEnd={() => {
                      setDraggedTaskId(null);
                      setDragOverTaskId(null);
                    }}
                    onClick={() => openDetail(t)}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer text-right flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-brand-500/40 ${
                      dragOverTaskId === t.id && draggedTaskId !== t.id
                        ? 'ring-2 ring-brand-500/40 border-brand-500/60 translate-y-0.5'
                        : ''
                    } ${
                      draggedTaskId === t.id ? 'opacity-60 scale-[0.99]' : ''
                    } ${
                      isSelected ? 'ring-2 ring-brand-500/50 border-brand-500/60 bg-brand-500/5 dark:bg-brand-500/10' : ''
                    } ${
                      t.overdue
                        ? 'bg-rose-500/5 dark:bg-rose-500/10 border-rose-500/30'
                        : unseen
                          ? 'bg-brand-500/5 dark:bg-brand-500/10 border-brand-500/30 shadow-xs'
                          : 'bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-800/60 opacity-90'
                    }`}
                  >
                    <div className="flex items-start gap-3.5 flex-1">
                      <label
                        className="mt-2 shrink-0 flex items-center justify-center cursor-pointer"
                        title={isSelected ? 'لغو انتخاب وظیفه' : 'انتخاب وظیفه'}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <TaskCheckbox
                          checked={isSelected}
                          onChange={() => toggleSelect(t.id)}
                          label={`انتخاب وظیفه ${t.title}`}
                        />
                      </label>
                      <div
                        className="mt-2 text-slate-300 dark:text-slate-600 hover:text-brand-500 dark:hover:text-brand-400 cursor-grab active:cursor-grabbing"
                        title="برای تغییر ترتیب بکشید"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <GripVertical className="w-4.5 h-4.5" />
                      </div>
                      <div className="w-10 h-10 rounded-2xl shrink-0 flex items-center justify-center bg-brand-500/10 dark:bg-brand-500/15 text-brand-500">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div className="space-y-1 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className={`font-black ${unseen ? 'text-sm text-slate-950 dark:text-white' : 'text-xs text-slate-950 dark:text-white'}`}>{t.title}</h4>
                          <span className={seenByAssignee ? 'text-emerald-500' : 'text-sky-500'} title={seenByAssignee ? 'دیده شده توسط مسئول وظیفه' : 'در انتظار مشاهده توسط مسئول وظیفه'}>
                            {seenByAssignee ? <CheckCheck className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                          </span>
                          {t.overdue && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              <span>عقب افتاده</span>
                            </span>
                          )}
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${priorityMeta[t.priorityRaw].cls}`}>{t.priority}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${statusMeta[t.statusRaw].cls}`}>{t.status}</span>
                        </div>
                        {t.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-1">{t.description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-400 pt-1">
                          <span className="flex items-center gap-1">
                            <CalendarClock className="w-3 h-3" />
                            <span>{fmtDateTime(t.dueDate)}</span>
                          </span>
                          {t.assigneeName && (
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              <span>مسئول: <b className="text-slate-600 dark:text-slate-300">{t.assigneeName}</b></span>
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            <span>{t.comments.length} فعالیت</span>
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/70 text-[10px]">
                          <TaskTimestamp
                            icon={<CalendarPlus className="w-3 h-3" />}
                            label="ایجاد"
                            value={t.createdAt}
                          />
                          <TaskTimestamp
                            icon={<Eye className="w-3 h-3" />}
                            label="اولین مشاهده"
                            value={t.seenAt}
                            placeholder="مشاهده نشده"
                          />
                          <TaskTimestamp
                            icon={<History className="w-3 h-3" />}
                            label="آخرین تغییر"
                            value={t.updatedAt}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-1 shrink-0 self-end md:self-center" onClick={(e) => e.stopPropagation()}>
                      {isAdmin && (
                        <button onClick={() => openEdit(t)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-brand-500 transition-colors cursor-pointer" title="ویرایش">
                          <Pencil className="w-4 h-4" />
                        </button>
                      )}
                      {t.archivedAt ? (
                        <button onClick={() => requestRestore(t)} className="p-2 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-slate-400 hover:text-emerald-500 transition-colors cursor-pointer" title="بازگردانی از آرشیو">
                          <ArchiveRestore className="w-4 h-4" />
                        </button>
                      ) : (
                        <button onClick={() => requestArchive(t)} className="p-2 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-950/30 text-slate-400 hover:text-amber-500 transition-colors cursor-pointer" title="آرشیو وظیفه">
                          <Archive className="w-4 h-4" />
                        </button>
                      )}
                      {isAdmin && (
                        <button onClick={() => requestDelete(t)} className="p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer" title="حذف">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                  );
                })}
              </div>
            )}

            {hasMore && (
              <div ref={loadMoreRef} className="pt-2 pb-3 flex flex-col items-center justify-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setVisibleCount(count => Math.min(count + TASK_PAGE_SIZE, filteredTasks.length))}
                  className="px-4 py-2 rounded-xl text-xs font-black bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 border border-brand-200/70 dark:border-brand-500/30 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ChevronDown className="w-4 h-4" />
                  <span>نمایش بیشتر</span>
                  <span className="text-[10px] font-mono text-slate-400">({remainingCount.toLocaleString('fa-IR')} وظیفه)</span>
                </button>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">با اسکرول به انتهای لیست نیز وظایف بیشتری بارگذاری می‌شود.</span>
              </div>
            )}
            {!hasMore && filteredTasks.length > TASK_PAGE_SIZE && (
              <div className="pb-3 text-center text-[10px] font-bold text-slate-400 dark:text-slate-500">
                همه وظایف نمایش داده شد.
              </div>
            )}
            </div>
          </motion.div>
        )}

        {/* BOARD VIEW */}
        {viewMode === 'board' && (
          <motion.div
            key="task-board"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="space-y-6"
          >
            {/* Overdue strip */}
            {overdueTasks.length > 0 && (
              <div className="bg-rose-50 dark:bg-rose-950/30 p-5 rounded-2xl border border-rose-200/60 dark:border-rose-800/50 shadow-xs space-y-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                  <h3 className="text-xs font-black text-rose-700 dark:text-rose-300">وظایف عقب افتاده ({overdueTasks.length})</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {overdueTasks.map(t => (
                    <button
                      key={t.id}
                      onClick={() => openDetail(t)}
                      className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-rose-200/60 dark:border-rose-800/50 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-rose-400 transition-colors cursor-pointer"
                    >
                      {t.title}
                      <span className="mr-2 text-[10px] text-rose-500">{fmtDate(t.dueDate)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Month calendar */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-brand-500" />
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">{monthLabel}</h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setBoardMonth(new Date(boardMonth.getFullYear(), boardMonth.getMonth() - 1, 1))}
                    className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setBoardMonth(new Date(today.getFullYear(), today.getMonth(), 1))}
                    className="px-3 py-1.5 rounded-xl text-xs font-black bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 cursor-pointer"
                  >
                    ماه جاری
                  </button>
                  <button
                    onClick={() => setBoardMonth(new Date(boardMonth.getFullYear(), boardMonth.getMonth() + 1, 1))}
                    className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-16 text-brand-500">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              ) : (
                <>
                  {/* Weekday header */}
                  <div className="grid grid-cols-7 gap-1.5 text-center">
                    {['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'].map((d, i) => (
                      <div key={i} className="text-[10px] font-black text-slate-400 py-1">{d}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1.5">
                    {boardCells.map((cell, idx) => {
                      const isToday = sameDay(cell.date, today);
                      const inMonth = cell.date.getMonth() === boardMonth.getMonth();
                      const isWeekend = cell.date.getDay() === 5; // Friday
                      return (
                        <div
                          key={idx}
                          className={`min-h-[92px] rounded-xl border p-1.5 flex flex-col gap-1 transition-colors ${
                            isToday
                              ? 'border-brand-500 bg-brand-500/5'
                              : inMonth
                              ? 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30'
                              : 'border-slate-100 dark:border-slate-800/50 bg-slate-50/30 dark:bg-slate-900/30 opacity-50'
                          }`}
                        >
                          <span className={`text-[10px] font-black ${isToday ? 'text-brand-600 dark:text-brand-400' : isWeekend ? 'text-rose-400' : 'text-slate-400'}`}>
                            {new Intl.DateTimeFormat('fa-IR', { day: 'numeric' }).format(cell.date)}
                          </span>
                          <div className="space-y-1 overflow-hidden">
                            {cell.tasks.slice(0, 3).map(t => (
                              <button
                                key={t.id}
                                onClick={() => openDetail(t)}
                                className={`w-full text-right px-1.5 py-1 rounded-lg text-[10px] font-bold leading-tight truncate cursor-pointer transition-colors hover:opacity-80 ${
                                  t.statusRaw === 'DONE'
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                    : t.overdue
                                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                    : 'bg-brand-500/10 text-brand-600 dark:text-brand-400'
                                }`}
                              >
                                {t.title}
                              </button>
                            ))}
                            {cell.tasks.length > 3 && (
                              <span className="px-1.5 text-[9px] font-mono text-slate-400">+{cell.tasks.length - 3}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CREATE / EDIT MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 text-right space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-black text-slate-950 dark:text-white flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-brand-500" />
                  <span>{editingTask ? 'ویرایش وظیفه' : 'تعریف وظیفه جدید'}</span>
                </h3>
                <button onClick={() => setShowCreateModal(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 dark:text-slate-500 mb-1.5">عنوان وظیفه <b className="text-rose-500">*</b></label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => {
                      setForm({ ...form, title: e.target.value });
                      clearFormError('title');
                    }}
                    placeholder="مثال: بررسی لاگ‌های امنیتی هفتگی"
                    className={`w-full text-xs font-bold px-3 py-2.5 border rounded-xl bg-slate-50 dark:bg-slate-950/40 focus:border-brand-500 outline-none text-slate-700 dark:text-slate-200 ${
                      formErrors.title ? 'border-rose-400 dark:border-rose-500' : 'border-slate-200 dark:border-slate-800'
                    }`}
                  />
                  {formErrors.title && (
                    <span className="text-[9px] text-rose-500 font-bold block mt-1">{formErrors.title}</span>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 dark:text-slate-500 mb-1.5">توضیحات</label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="شرح کامل وظیفه..."
                    className="w-full text-xs font-bold p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/40 focus:border-brand-500 outline-none text-slate-700 dark:text-slate-200 resize-none"
                  />
                </div>

                {isAdmin ? (
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 dark:text-slate-500 mb-1.5">مسئول وظیفه <b className="text-rose-500">*</b></label>
                    <select
                      value={form.assigneeId}
                      onChange={(e) => {
                        setForm({ ...form, assigneeId: e.target.value });
                        clearFormError('assigneeId');
                      }}
                      className={`w-full text-xs font-bold px-3 py-2.5 border rounded-xl bg-slate-50 dark:bg-slate-950/40 focus:border-brand-500 outline-none text-slate-700 dark:text-slate-200 cursor-pointer ${
                        formErrors.assigneeId ? 'border-rose-400 dark:border-rose-500' : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <option value="" disabled>انتخاب مسئول وظیفه...</option>
                      {assigneeOptions.map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.role === 'ADMIN' ? 'مدیر' : 'کارشناس'})</option>
                      ))}
                    </select>
                    {formErrors.assigneeId && (
                      <span className="text-[9px] text-rose-500 font-bold block mt-1">{formErrors.assigneeId}</span>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 dark:text-slate-500 mb-1.5">مسئول وظیفه <b className="text-rose-500">*</b></label>
                    <div className="w-full flex items-center gap-2 px-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/40 text-xs font-bold text-slate-700 dark:text-slate-200">
                      <User className="w-3.5 h-3.5 text-brand-500" />
                      <span>{currentUserName}</span>
                      <span className="text-[10px] text-slate-400 font-bold mr-auto">فقط برای خودم</span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 dark:text-slate-500 mb-1.5">اولویت</label>
                    <select
                      value={form.priority}
                      onChange={(e) => setForm({ ...form, priority: e.target.value as TaskPriority })}
                      className="w-full text-xs font-bold px-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/40 focus:border-brand-500 outline-none text-slate-700 dark:text-slate-200 cursor-pointer"
                    >
                      {priorityList.map(p => (
                        <option key={p} value={p}>{priorityMeta[p].label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 dark:text-slate-500 mb-1.5">تاریخ تحویل</label>
                    <JalaliDatePicker
                      value={form.dueDate}
                      onChange={(v) => setForm({ ...form, dueDate: v })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 dark:text-slate-500 mb-1.5">ساعت تحویل</label>
                  <input
                    type="time"
                    value={form.dueTime}
                    onChange={(e) => setForm({ ...form, dueTime: e.target.value })}
                    className="w-full text-xs font-bold px-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/40 focus:border-brand-500 outline-none text-slate-700 dark:text-slate-200"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-black rounded-xl cursor-pointer">
                  انصراف
                </button>
                <button
                  onClick={handleSaveTask}
                  disabled={saving}
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-black rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>{editingTask ? 'ذخیره تغییرات' : 'ثبت وظیفه'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONFIRMATION MODAL */}
      <AnimatePresence>
        {confirmAction && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
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
                  {confirmAction.type === 'bulk-delete'
                    ? 'حذف گروهی وظایف'
                    : confirmAction.type === 'delete'
                      ? 'حذف وظیفه'
                      : confirmAction.type === 'archive'
                        ? 'آرشیو وظیفه'
                        : confirmAction.type === 'restore'
                          ? 'بازگردانی وظیفه'
                          : 'تغییر وضعیت وظیفه'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  {confirmAction.type === 'bulk-delete'
                    ? `آیا از حذف ${confirmAction.ids.length.toLocaleString('fa-IR')} وظیفه انتخاب‌شده مطمئن هستید؟ این عملیات قابل بازگشت نیست.`
                    : confirmAction.type === 'delete'
                      ? `آیا از حذف «${confirmAction.task.title}» مطمئن هستید؟ این عملیات قابل بازگشت نیست.`
                      : confirmAction.type === 'archive'
                        ? confirmAction.task.statusRaw !== 'DONE'
                          ? `«${confirmAction.task.title}» آرشیو شود؟ با آرشیو کردن، وضعیت این وظیفه به «لغو شده» تغییر می‌کند.`
                          : `«${confirmAction.task.title}» آرشیو شود؟`
                        : confirmAction.type === 'restore'
                          ? `«${confirmAction.task.title}» از آرشیو خارج شود؟`
                          : confirmAction.status
                            ? `وضعیت «${confirmAction.task.title}» به «${statusMeta[confirmAction.status].label}» تغییر یابد؟`
                            : ''}
                </p>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => setConfirmAction(null)}
                  disabled={confirming}
                  className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-black rounded-xl cursor-pointer disabled:opacity-60"
                >
                  انصراف
                </button>
                <button
                  onClick={runConfirmAction}
                  disabled={confirming}
                  className={`flex-1 px-4 py-2 text-white text-xs font-black rounded-xl flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 ${
                    confirmAction.type === 'status'
                      ? 'bg-brand-600 hover:bg-brand-700'
                      : confirmAction.type === 'archive'
                        ? 'bg-amber-600 hover:bg-amber-700'
                        : confirmAction.type === 'restore'
                          ? 'bg-emerald-600 hover:bg-emerald-700'
                          : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {confirming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>
                    {confirmAction.type === 'status'
                      ? 'تأیید تغییر'
                      : confirmAction.type === 'archive'
                        ? 'آرشیو'
                        : confirmAction.type === 'restore'
                          ? 'بازگردانی'
                          : 'حذف'}
                  </span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TASK DETAIL DRAWER */}
      <AnimatePresence>
        {selectedTask && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs"
              onClick={() => setSelectedTask(null)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 right-0 z-[60] w-full max-w-xl bg-white dark:bg-slate-900 shadow-2xl flex flex-col"
            >
              {/* Drawer header */}
              <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${statusMeta[selectedTask.statusRaw].cls}`}>{selectedTask.status}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${priorityMeta[selectedTask.priorityRaw].cls}`}>{selectedTask.priority}</span>
                    <span className={hasAssigneeSeen(selectedTask) ? 'text-emerald-500' : 'text-sky-500'} title={hasAssigneeSeen(selectedTask) ? 'دیده شده توسط مسئول وظیفه' : 'در انتظار مشاهده توسط مسئول وظیفه'}>
                      {hasAssigneeSeen(selectedTask) ? <CheckCheck className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                    </span>
                    {selectedTask.overdue && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>عقب افتاده</span>
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-black text-slate-950 dark:text-white leading-relaxed">{selectedTask.title}</h3>
                </div>
                <div className="flex items-center gap-1">
                  {isAdmin && (
                    <button onClick={() => openEdit(selectedTask)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-brand-500 transition-colors cursor-pointer">
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}
                  {isAdmin && (
                    <button onClick={() => requestDelete(selectedTask)} className="p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={() => setSelectedTask(null)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                {/* Status actions */}
                <div className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 space-y-2">
                  <h4 className="text-[10px] font-extrabold text-slate-400">تغییر وضعیت</h4>
                  <div className="flex flex-wrap gap-2">
                    {statusList.map(s => (
                      <button
                        key={s}
                        onClick={() => requestStatusChange(selectedTask, s)}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-black border transition-all cursor-pointer ${
                          selectedTask.statusRaw === s
                            ? statusMeta[s].cls + ' ring-2 ring-brand-500/20'
                            : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200/60 dark:border-slate-800 hover:border-brand-500/40'
                        }`}
                      >
                        {statusMeta[s].label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Meta info */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                    <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1"><CalendarClock className="w-3 h-3" /> مهلت</span>
                    <p className="text-xs font-black text-slate-800 dark:text-slate-200 mt-1">{fmtDateTime(selectedTask.dueDate)}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                    <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1"><User className="w-3 h-3" /> مسئول</span>
                    <p className="text-xs font-black text-slate-800 dark:text-slate-200 mt-1">{selectedTask.assigneeName || 'بدون مسئول'}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                    <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1"><User className="w-3 h-3" /> ثبت‌کننده</span>
                    <p className="text-xs font-black text-slate-800 dark:text-slate-200 mt-1">{selectedTask.createdByName}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                    <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1"><Flag className="w-3 h-3" /> اولویت</span>
                    <p className="text-xs font-black text-slate-800 dark:text-slate-200 mt-1">{selectedTask.priority}</p>
                  </div>
                </div>

                {selectedTask.description && (
                  <div className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/60">
                    <h4 className="text-[10px] font-extrabold text-slate-400 mb-2">توضیحات</h4>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-bold whitespace-pre-wrap">{selectedTask.description}</p>
                  </div>
                )}

                {/* Comments / Timeline */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <History className="w-4 h-4 text-brand-500" />
                    <span>یادداشت‌ها و روند کاری</span>
                  </h4>

                  <div className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 space-y-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCommentType('note')}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer ${
                          commentType === 'note' ? 'bg-brand-600 text-white' : 'bg-white dark:bg-slate-900 text-slate-500 border border-slate-200/60 dark:border-slate-800'
                        }`}
                      >
                        ثبت یادداشت
                      </button>
                      <button
                        onClick={() => setCommentType('timeline')}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer ${
                          commentType === 'timeline' ? 'bg-brand-600 text-white' : 'bg-white dark:bg-slate-900 text-slate-500 border border-slate-200/60 dark:border-slate-800'
                        }`}
                      >
                        ثبت پیشرفت / زمان‌بندی
                      </button>
                    </div>
                    <textarea
                      rows={3}
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder={commentType === 'timeline' ? 'چه کاری در این بازه انجام شد؟' : 'یادداشت خود را بنویسید...'}
                      className="w-full text-xs font-bold p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 focus:border-brand-500 outline-none text-slate-700 dark:text-slate-200 resize-none"
                    />
                    <div className="flex items-center justify-end">
                      <button
                        onClick={handleAddComment}
                        disabled={sendingComment || !commentText.trim()}
                        className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-black rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                      >
                        {sendingComment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        <span>{commentType === 'timeline' ? 'ثبت پیشرفت' : 'ثبت یادداشت'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="relative pr-6 border-r-2 border-slate-150 dark:border-slate-800 space-y-4 pt-1">
                    {selectedTask.comments.length === 0 ? (
                      <p className="text-xs text-slate-400 font-bold">هنوز یادداشت یا پیشرفتی ثبت نشده است.</p>
                    ) : (
                      selectedTask.comments.map((c: TaskCommentItem) => (
                        <div key={c.id} className="relative group">
                          <div className={`absolute -right-[31px] top-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 ${c.type === 'timeline' ? 'bg-brand-500' : 'bg-slate-400'}`} />
                          <div className="bg-slate-50/70 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/50">
                            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1.5">
                              <span className="flex items-center gap-1.5">
                                {c.type === 'timeline' ? <History className="w-3 h-3 text-brand-500" /> : <MessageSquare className="w-3 h-3 text-slate-400" />}
                                <b className="text-slate-700 dark:text-slate-300">{c.authorName}</b>
                                <span>· {c.time}</span>
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-slate-100 dark:bg-slate-800 text-slate-500">
                                {c.type === 'timeline' ? 'پیشرفت' : 'یادداشت'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-bold whitespace-pre-wrap">{c.text}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
