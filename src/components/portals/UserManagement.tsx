import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useUsers } from '../../hooks/useUsers';
import { useDepartments } from '../../hooks/useDepartments';
import { useCustomRoles } from '../../hooks/useCustomRoles';
import { useCustomers } from '../../hooks/useCustomers';
import { useProducts } from '../../hooks/useProducts';
import { formatDate } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  UserCheck, 
  Shield, 
  Users2, 
  Search, 
  Filter, 
  RotateCcw, 
  Plus, 
  MoreVertical, 
  Eye, 
  Edit3, 
  Trash2, 
  UserX, 
  Key, 
  Check, 
  X, 
  Mail, 
  Phone, 
  Building, 
  ShieldCheck, 
  Activity, 
  AlertTriangle, 
  Copy, 
  Sliders, 
  FolderPlus, 
  Briefcase,
  CheckCircle2,
  Lock,
  ChevronDown,
  Sparkles,
  Info
} from 'lucide-react';

interface UserItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  team: string;
  role: string;
  status: 'فعال' | 'غیرفعال' | 'دعوت شده';
  lastLogin: string;
  createdDate: string;
  avatarColor: string;
  isCustomer: boolean;
  departmentId?: string;
  customRoleId?: string;
}

interface RoleItem {
  id: string;
  name: string;
  userCount: number;
  description: string;
  permissions: { [key: string]: string[] }; // category: string[] of permission types
}

interface TeamItem {
  id: string;
  name: string;
  membersCount: number;
  lead: string;
  assignedProducts: string[];
}

export default function UserManagementView({ showCustomerToast, initialCustomerCompany, onClearInitialCustomerCompany }: { showCustomerToast: (msg: string, type?: 'success' | 'error') => void; initialCustomerCompany?: string; onClearInitialCustomerCompany?: () => void }) {
  // Page level tabs
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'roles' | 'teams'>('users');
  
  // API hooks
  const { users: apiUsers, createUser, updateUser, deleteUser, refetch: refetchUsers } = useUsers();
  const { departments, createDepartment, updateDepartment, deleteDepartment } = useDepartments();
  const { roles: apiRoles, createRole, updateRole, deleteRole } = useCustomRoles();
  const { customers: apiCustomers } = useCustomers();
  const { products } = useProducts();
  
  // Interactive loading state (Simulated)
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Users list state — synced from real API
  const [users, setUsers] = useState<UserItem[]>([]);
  useEffect(() => {
    if (apiUsers.length > 0) {
      setUsers(apiUsers.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone || '',
        company: u.company || '',
        team: departments.find(d => d.id === u.departmentId)?.name || '',
        role: u.role === 'ADMIN' ? 'مدیر کل' : u.role === 'AGENT' ? 'کارشناس پشتیبانی' : 'کاربر',
        status: u.active ? ('فعال' as const) : ('غیرفعال' as const),
        lastLogin: '',
        createdDate: formatDate(u.createdAt) || '',
        avatarColor: ['bg-blue-600', 'bg-emerald-600', 'bg-violet-600', 'bg-amber-600', 'bg-pink-600', 'bg-cyan-600'][Math.floor(Math.random() * 6)],
        isCustomer: u.isCustomer,
        departmentId: u.departmentId,
        customRoleId: u.customRoleId,
      })));
    }
  }, [apiUsers, departments]);

  // Open drawer with customer type pre-filled when initialCustomerCompany is set
  useEffect(() => {
    if (initialCustomerCompany) {
      setActiveSubTab('users');
      setUserDrawerMode('create');
      setSelectedUserForEdit(null);
      setFormDataName('');
      setFormDataEmail('');
      setFormDataPassword('');
      setFormDataPhone('');
      setFormDataCompany(initialCustomerCompany);
      setFormDataDepartmentId('');
      setFormDataCustomRoleId('');
      setUserType('customer');
      setFormDataCustomerRole('کاربر');
      setFormErrors({});
      setShowUserDrawer(true);
      onClearInitialCustomerCompany?.();
    }
  }, [initialCustomerCompany]);

  // Active role selected for Matrix editing
  const [selectedRoleForMatrix, setSelectedRoleForMatrix] = useState<string>('');
  const [matrixSearchQuery, setMatrixSearchQuery] = useState<string>('');

  // Map API roles to local RoleItem format (with parsed permissions)
  const roles = useMemo(() => {
    return apiRoles.map(r => ({
      id: r.id,
      name: r.name,
      userCount: apiUsers.filter(u => u.customRoleId === r.id).length,
      description: r.description || '',
      permissions: (() => {
        try { return JSON.parse(r.permissions); } catch { return {}; }
      })(),
    }));
  }, [apiRoles, apiUsers]);

  // Auto-select first role when roles load
  useEffect(() => {
    if (!selectedRoleForMatrix && apiRoles.length > 0) {
      setSelectedRoleForMatrix(apiRoles[0].id);
    }
  }, [apiRoles, selectedRoleForMatrix]);

  // Teams derived from departments API
  const teams = useMemo(() => {
    return departments.map(d => ({
      id: d.id,
      name: d.name,
      membersCount: apiUsers.filter(u => u.departmentId === d.id).length,
      lead: d.lead,
      assignedProducts: d.assignedProducts,
    }));
  }, [departments, apiUsers]);

  // Search & Filter state for Users
  const [userSearch, setUserSearch] = useState('');
  const [filterRole, setFilterRole] = useState('همه');
  const [filterTeam, setFilterTeam] = useState('همه');
  const [filterStatus, setFilterStatus] = useState('همه');
  const [filterLastLogin, setFilterLastLogin] = useState('همه');
  const [userTypeTab, setUserTypeTab] = useState<'employees' | 'customers'>('employees');

  // Drawer / Modals visibility control
  const [showUserDrawer, setShowUserDrawer] = useState(false);
  const [userDrawerMode, setUserDrawerMode] = useState<'create' | 'edit'>('create');
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<UserItem | null>(null);

  // User Drawer input form fields
  const [formDataName, setFormDataName] = useState('');
  const [formDataEmail, setFormDataEmail] = useState('');
  const [formDataPassword, setFormDataPassword] = useState('');
  const [formDataPhone, setFormDataPhone] = useState('');
  const [formDataCompany, setFormDataCompany] = useState('شرکت توسعه امنیت آریا');
  const [formDataDepartmentId, setFormDataDepartmentId] = useState('');
  const [formDataCustomRoleId, setFormDataCustomRoleId] = useState('');
  const [userType, setUserType] = useState<'organization' | 'customer'>('organization');
  const [formDataCustomerRole, setFormDataCustomerRole] = useState('');
  const [formDataAccessLevel, setFormDataAccessLevel] = useState('متوسط');
  const [formDataSendInvite, setFormDataSendInvite] = useState(true);
  const [formDataImmediateActive, setFormDataImmediateActive] = useState(true);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Row Action Toggle State
  const [activeRowActionId, setActiveRowActionId] = useState<string | null>(null);
  const [menuFixedStyle, setMenuFixedStyle] = useState<Record<string, string> | undefined>(undefined);

  // Profile Modal State
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUserProfile, setSelectedUserProfile] = useState<UserItem | null>(null);
  const [profileModalTab, setProfileModalTab] = useState<'info' | 'permissions' | 'activities'>('info');

  // Confirmation dialog state
  const [showConfirmModal, setShowConfirmModal] = useState<{
    show: boolean;
    type: 'delete' | 'deactivate' | 'reset-pass' | 'deleteDepartment' | 'deleteRole';
    userId: string | null;
    extra?: { departmentName?: string; roleName?: string; roleId?: string; userCount?: number };
  }>({ show: false, type: 'delete', userId: null });

  // Team modal state (Quick add/edit)
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [teamModalMode, setTeamModalMode] = useState<'create' | 'edit'>('create');
  const [selectedTeamForEdit, setSelectedTeamForEdit] = useState<TeamItem | null>(null);
  const [editingDepartmentId, setEditingDepartmentId] = useState<string>('');
  const [teamName, setTeamName] = useState('');
  const [teamLead, setTeamLead] = useState('');
  const [teamProducts, setTeamProducts] = useState<string[]>(['Cloud Security Platform']);

  // Reset Row actions on click outside
  useEffect(() => {
    const handleOutsideClick = () => setActiveRowActionId(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // Filter application
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesType = userTypeTab === 'employees' ? !user.isCustomer : user.isCustomer;
      if (!matchesType) return false;

      const matchesSearch = 
        user.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        user.email.toLowerCase().includes(userSearch.toLowerCase()) ||
        user.company.toLowerCase().includes(userSearch.toLowerCase());
      
      const matchesRole = filterRole === 'همه' || user.role === filterRole;
      const matchesTeam = filterTeam === 'همه' || user.team === filterTeam;
      const matchesStatus = filterStatus === 'همه' || user.status === filterStatus;
      
      let matchesLastLogin = true;
      if (filterLastLogin === 'امروز') {
        matchesLastLogin = user.lastLogin.includes('دقیقه') || user.lastLogin.includes('ساعت') || user.lastLogin.includes('هم‌اکنون');
      } else if (filterLastLogin === 'تاکنون وارد نشده') {
        matchesLastLogin = user.lastLogin.includes('تاکنون');
      } else if (filterLastLogin === 'اخیر') {
        matchesLastLogin = !user.lastLogin.includes('تاکنون') && !user.lastLogin.includes('۲ روز پیش');
      }

      return matchesSearch && matchesRole && matchesTeam && matchesStatus && matchesLastLogin;
    });
  }, [users, userSearch, filterRole, filterTeam, filterStatus, filterLastLogin, userTypeTab]);

  const handleResetFilters = () => {
    setUserSearch('');
    setFilterRole('همه');
    setFilterTeam('همه');
    setFilterStatus('همه');
    setFilterLastLogin('همه');
    showCustomerToast('فیلترها با موفقیت ریست شدند.', 'success');
  };

  const handleApplyFilterLoading = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      showCustomerToast('فیلترها بر روی لیست کاربران اعمال گردید.', 'success');
    }, 450);
  };

  // Drawer Controllers
  const openCreateUserDrawer = () => {
    setUserDrawerMode('create');
    setSelectedUserForEdit(null);
    setFormDataName('');
    setFormDataEmail('');
    setFormDataPassword('');
    setFormDataPhone('');
    setFormDataCompany('');
    setFormDataDepartmentId('');
    setFormDataCustomRoleId('');
    setUserType('organization');
    setFormDataCustomerRole('');
    setFormErrors({});
    setShowUserDrawer(true);
  };

  const openEditUserDrawer = (user: UserItem) => {
    setUserDrawerMode('edit');
    setSelectedUserForEdit(user);
    setFormDataName(user.name);
    setFormDataEmail(user.email);
    setFormDataPassword('');
    setFormDataPhone(user.phone);
    setFormDataCompany(user.company);
    setFormDataDepartmentId(user.departmentId || '');
    setFormDataCustomRoleId(user.customRoleId || '');
    setUserType(user.isCustomer ? 'customer' : 'organization');
    setFormDataCustomerRole('');
    setFormErrors({});
    setShowUserDrawer(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { [key: string]: string } = {};
    
    if (!formDataName.trim()) errors.name = 'نام و نام خانوادگی الزامی است.';
    if (!formDataEmail.trim() || !formDataEmail.includes('@')) errors.email = 'ایمیل نامعتبر است.';
    if (!formDataPhone.trim()) errors.phone = 'شماره تماس الزامی است.';
    if (userType === 'customer' && !formDataCompany.trim()) errors.company = 'انتخاب شرکت برای کاربر مشتری الزامی است.';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      showCustomerToast('لطفاً خطاهای فرم را برطرف کنید.', 'error');
      return;
    }

    try {
      if (userDrawerMode === 'create') {
        const newUser = await createUser({
          email: formDataEmail,
          password: formDataPassword || 'Temp@123456',
          name: formDataName,
          phone: formDataPhone,
          company: userType === 'customer' ? formDataCompany : '',
          isCustomer: userType === 'customer',
          role: formDataCustomerRole === 'مدیر اصلی' ? 'ADMIN' : formDataCustomerRole === 'کاربر' ? 'CUSTOMER' : undefined,
          departmentId: userType === 'organization' ? formDataDepartmentId || undefined : undefined,
          customRoleId: userType === 'organization' ? formDataCustomRoleId || undefined : undefined,
          active: formDataImmediateActive,
        });
        const newUserItem: UserItem = {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone || '',
          company: newUser.company || '',
          team: departments.find(d => d.id === newUser.departmentId)?.name || '',
          role: newUser.role === 'ADMIN' ? 'مدیر کل' : newUser.role === 'AGENT' ? 'کارشناس پشتیبانی' : 'کاربر',
          status: formDataImmediateActive ? 'فعال' : 'دعوت شده',
          lastLogin: '',
          createdDate: formatDate(newUser.createdAt) || '',
          avatarColor: ['bg-blue-600', 'bg-emerald-600', 'bg-purple-600', 'bg-violet-600', 'bg-rose-600', 'bg-indigo-600'][Math.floor(Math.random() * 6)],
          isCustomer: newUser.isCustomer,
          departmentId: newUser.departmentId,
          customRoleId: newUser.customRoleId,
        };
        setUsers(prev => [newUserItem, ...prev]);
        showCustomerToast(`کاربر جدید «${formDataName}» با موفقیت افزوده و ثبت گردید.`, 'success');
      } else {
        if (!selectedUserForEdit) return;
        const updated = await updateUser({
          id: selectedUserForEdit.id,
          name: formDataName,
          email: formDataEmail,
          phone: formDataPhone,
          company: userType === 'customer' ? formDataCompany : '',
          isCustomer: userType === 'customer',
          role: formDataCustomerRole === 'مدیر اصلی' ? 'ADMIN' : formDataCustomerRole === 'کاربر' ? 'CUSTOMER' : undefined,
          active: formDataImmediateActive,
          departmentId: userType === 'organization' ? formDataDepartmentId || undefined : undefined,
          customRoleId: userType === 'organization' ? formDataCustomRoleId || undefined : undefined,
        });
        setUsers(prev => prev.map(u => u.id === selectedUserForEdit.id ? {
          ...u,
          name: updated.name,
          email: updated.email,
          phone: updated.phone || '',
          company: updated.company || '',
          team: departments.find(d => d.id === updated.departmentId)?.name || '',
          role: updated.role === 'ADMIN' ? 'مدیر کل' : updated.role === 'AGENT' ? 'کارشناس پشتیبانی' : 'کاربر',
          status: formDataImmediateActive ? 'فعال' : 'غیرفعال',
          isCustomer: updated.isCustomer,
          departmentId: updated.departmentId,
          customRoleId: updated.customRoleId,
        } : u));
        showCustomerToast(`اطلاعات کاربری «${formDataName}» با موفقیت بروزرسانی شد.`, 'success');
      }
      setShowUserDrawer(false);
    } catch (e) {
      showCustomerToast(`خطا در ذخیره کاربر: ${(e as Error).message}`, 'error');
    }
  };

  // Matrix Permission toggler
  const currentRoleMatrix = useMemo(() => {
    return roles.find(r => r.id === selectedRoleForMatrix);
  }, [roles, selectedRoleForMatrix]);

  const handleTogglePermission = async (category: string, type: string) => {
    if (!currentRoleMatrix) return;
    const currentPerms: string[] = currentRoleMatrix.permissions[category] || [];
    const nextPerms = currentPerms.includes(type)
      ? currentPerms.filter(p => p !== type)
      : [...currentPerms, type];
    const newPermissions = { ...currentRoleMatrix.permissions, [category]: nextPerms };
    try {
      await updateRole({ id: selectedRoleForMatrix, permissions: JSON.stringify(newPermissions) });
    } catch (e) {
      showCustomerToast(`خطا در ذخیره دسترسی: ${(e as Error).message}`, 'error');
    }
  };

  const handleSelectAllCategoryPermissions = async (category: string) => {
    if (!currentRoleMatrix) return;
    const allTypes = ['View', 'Create', 'Edit', 'Delete', 'Assign', 'Export'];
    const currentPerms = currentRoleMatrix.permissions[category] || [];
    const isAllSelected = currentPerms.length === allTypes.length;
    const newPermissions = {
      ...currentRoleMatrix.permissions,
      [category]: isAllSelected ? [] : allTypes,
    };
    try {
      await updateRole({ id: selectedRoleForMatrix, permissions: JSON.stringify(newPermissions) });
      showCustomerToast(
        isAllSelected ? `تمام دسترسی‌های بخش ${category} لغو گردید.` : `تمام دسترسی‌های بخش ${category} اعطا شد.`,
        'success'
      );
    } catch (e) {
      showCustomerToast(`خطا: ${(e as Error).message}`, 'error');
    }
  };

  const handleSelectAllMatrix = async () => {
    if (!currentRoleMatrix) return;
    const allTypes = ['View', 'Create', 'Edit', 'Delete', 'Assign', 'Export'];
    const categories = ['Dashboard', 'Products', 'Customers', 'Tickets', 'Users', 'Reports', 'Settings'];
    const newPerms: { [key: string]: string[] } = {};
    categories.forEach(cat => { newPerms[cat] = allTypes; });
    try {
      await updateRole({ id: selectedRoleForMatrix, permissions: JSON.stringify(newPerms) });
      showCustomerToast('تمامی دسترسی‌های ماتریس برای این نقش فعال شد.', 'success');
    } catch (e) {
      showCustomerToast(`خطا: ${(e as Error).message}`, 'error');
    }
  };

  const handleClearAllMatrix = async () => {
    if (!currentRoleMatrix) return;
    try {
      await updateRole({ id: selectedRoleForMatrix, permissions: '{}' });
      showCustomerToast('کلیه دسترسی‌های ماتریس برای این نقش پاکسازی شد.', 'success');
    } catch (e) {
      showCustomerToast(`خطا: ${(e as Error).message}`, 'error');
    }
  };

  const handleDuplicateRole = async (role: RoleItem) => {
    try {
      const newRole = await createRole({
        name: `${role.name} (کپی)`,
        description: role.description,
        permissions: JSON.stringify(role.permissions),
      });
      showCustomerToast(`نقش «${role.name}» با موفقیت تکثیر شد.`, 'success');
    } catch (e) {
      showCustomerToast(`خطا: ${(e as Error).message}`, 'error');
    }
  };

  const handleDeleteRole = (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    if (!role) return;
    if (role.userCount > 0) {
      setShowConfirmModal({
        show: true,
        type: 'deleteRole',
        userId: null,
        extra: { roleName: role.name, roleId: role.id, userCount: role.userCount },
      });
    } else {
      setShowConfirmModal({
        show: true,
        type: 'deleteRole',
        userId: null,
        extra: { roleName: role.name, roleId: role.id, userCount: 0 },
      });
    }
  };

  // Team handling
  const handleSaveTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim() || !teamLead.trim()) {
      showCustomerToast('لطفاً فیلدهای الزامی تیم را تکمیل فرمایید.', 'error');
      return;
    }

    try {
      if (teamModalMode === 'create') {
        await createDepartment({ name: teamName, lead: teamLead, assignedProducts: teamProducts });
        showCustomerToast(`تیم پشتیبانی جدید «${teamName}» با موفقیت تشکیل شد.`, 'success');
      } else {
        if (!editingDepartmentId) return;
        await updateDepartment({ id: editingDepartmentId, name: teamName, lead: teamLead, assignedProducts: teamProducts });
        showCustomerToast(`تنظیمات تیم پشتیبانی «${teamName}» با موفقیت بروزرسانی شد.`, 'success');
      }
      setShowTeamModal(false);
    } catch (e) {
      showCustomerToast(`خطا: ${(e as Error).message}`, 'error');
    }
  };

  const openCreateTeamModal = () => {
    setTeamModalMode('create');
    setSelectedTeamForEdit(null);
    setEditingDepartmentId('');
    setTeamName('');
    setTeamLead('');
    setTeamProducts(['Cloud Security Platform']);
    setShowTeamModal(true);
  };

  const openEditTeamModal = (team: TeamItem) => {
    setTeamModalMode('edit');
    setSelectedTeamForEdit(team);
    setEditingDepartmentId(team.id);
    setTeamName(team.name);
    setTeamLead(team.lead);
    setTeamProducts(team.assignedProducts);
    setShowTeamModal(true);
  };

  const handleDeleteTeam = (teamId: string) => {
    const t = teams.find(team => team.id === teamId);
    if (!t) return;
    setShowConfirmModal({
      show: true,
      type: 'deleteDepartment',
      userId: null,
      extra: { departmentName: t.name, userCount: t.membersCount, roleId: teamId },
    });
  };

  // Dialog actions execution
  const [reassignRoleId, setReassignRoleId] = useState<string>('');

  const executeConfirmAction = async () => {
    const { type, userId } = showConfirmModal;

    try {
      if (type === 'deleteDepartment') {
        const deptId = showConfirmModal.extra?.roleId;
        if (deptId) await deleteDepartment(deptId);
        showCustomerToast(`دپارتمان «${showConfirmModal.extra?.departmentName}» با موفقیت حذف شد. کاربران به دپارتمان پیش‌فرض منتقل شدند.`, 'success');
      } else if (type === 'deleteRole') {
        const roleId = showConfirmModal.extra?.roleId;
        if (roleId) await deleteRole(roleId, reassignRoleId || undefined);
        showCustomerToast(`نقش «${showConfirmModal.extra?.roleName}» با موفقیت حذف گردید.`, 'success');
      } else if (type === 'delete') {
        if (!userId) return;
        await deleteUser(userId);
        setUsers(prev => prev.filter(u => u.id !== userId));
        showCustomerToast(`حساب کاربری با موفقیت حذف شد.`, 'error');
      } else if (type === 'deactivate') {
        if (!userId) return;
        const userObj = users.find(u => u.id === userId);
        if (!userObj) return;
        const isCurrentlyActive = userObj.status === 'فعال';
        await updateUser({ id: userId, active: !isCurrentlyActive });
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: isCurrentlyActive ? 'غیرفعال' : 'فعال' } : u));
        showCustomerToast(
          isCurrentlyActive ? `حساب کاربری «${userObj.name}» غیرفعال گردید.` : `حساب کاربری «${userObj.name}» مجدداً فعال گردید.`,
          isCurrentlyActive ? 'error' : 'success'
        );
      } else if (type === 'reset-pass') {
        if (!userId) return;
        const userObj = users.find(u => u.id === userId);
        if (!userObj) return;
        showCustomerToast(`لینک بازنشانی گذرواژه امن به آدرس ایمیل (${userObj.email}) با موفقیت ارسال گردید.`, 'success');
      }
    } catch (e) {
      showCustomerToast(`خطا: ${(e as Error).message}`, 'error');
    }

    setShowConfirmModal({ show: false, type: 'delete', userId: null });
    setReassignRoleId('');
  };

  return (
    <div className="space-y-6 text-right font-sans pb-12">
      
      {/* 1. TOP NAV / HEADER */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs relative">
        <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none z-0">
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-brand-500/10 to-transparent rounded-bl-full" />
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div>
            <h1 className="text-lg font-black text-slate-950 dark:text-white flex items-center gap-2">
              <Users className="w-5.5 h-5.5 text-brand-500" />
              <span>مدیریت کاربران و دسترسی‌ها (RBAC)</span>
            </h1>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-1">
              پیکربندی هوشمند دسترسی‌ها، نقش‌ها، تیم‌های پشتیبانی و ممیزی کاربران سازمان در سیستم ابری سحاب
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveSubTab('roles');
                showCustomerToast('به تب مدیریت نقش‌ها و ماتریس دسترسی هدایت شدید.', 'success');
              }}
              className="px-4 py-2 text-xs font-black bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 rounded-xl transition-all cursor-pointer border border-slate-150 dark:border-slate-800/50 flex items-center gap-1.5"
            >
              <Shield className="w-4 h-4 text-slate-400" />
              <span>پیکربندی نقش‌ها</span>
            </button>
            <button
              onClick={openCreateUserDrawer}
              className="px-4 py-2 text-xs font-black bg-brand-600 hover:bg-brand-700 text-white rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-brand-500/10 hover:shadow-brand-500/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>افزودن کاربر جدید</span>
            </button>
          </div>
        </div>

        {/* SUB NAVIGATION TAB HEADER BAR */}
        <div className="flex items-center gap-1.5 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/60 relative z-10">
          <button
            onClick={() => setActiveSubTab('users')}
            className={`px-4.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'users'
                ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-100 dark:border-brand-500/20'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>مدیریت کاربران سیستم</span>
          </button>
          <button
            onClick={() => setActiveSubTab('roles')}
            className={`px-4.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'roles'
                ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-100 dark:border-brand-500/20'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>نقش‌ها و ماتریس دسترسی</span>
          </button>
          <button
            onClick={() => setActiveSubTab('teams')}
            className={`px-4.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'teams'
                ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-100 dark:border-brand-500/20'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Users2 className="w-4 h-4" />
            <span>تیم‌های پشتیبانی و مأموریت‌ها</span>
          </button>
        </div>
      </div>

      {/* 2. KPI CARDS SECTION */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold block">کل کاربران پلتفرم</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white">۱۴۸</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Users className="w-5.5 h-5.5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold block">کاربران فعال و آنلاین</span>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">۱۲۷</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <UserCheck className="w-5.5 h-5.5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold block">تیم‌های پشتیبانی تخصصی</span>
            <span className="text-2xl font-black text-purple-600 dark:text-purple-400">۸</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Users2 className="w-5.5 h-5.5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold block">نقش‌های سفارشی تعریف شده</span>
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">۱۲</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Shield className="w-5.5 h-5.5" />
          </div>
        </div>
      </div>

      {/* 3. SUB TAB CONTENT PANELS */}
      <AnimatePresence mode="wait">
        
        {/* SUB TAB 1: USER LIST (مدیریت کاربران) */}
        {activeSubTab === 'users' && (
          <motion.div
            key="users-panel"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Search and Filters bar */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800/50">
                <Filter className="w-4 h-4 text-brand-500" />
                <h3 className="text-xs font-black text-slate-900 dark:text-white">جستجوی هوشمند و فیلترهای کنترلی</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute right-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="جستجو بر اساس نام، ایمیل یا شرکت..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full text-xs font-bold pl-3 pr-9 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/40 focus:border-brand-500 outline-none text-slate-700 dark:text-slate-300"
                  />
                </div>

                {/* Role Filter */}
                <div className="space-y-1">
                  <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="w-full text-xs font-bold px-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/40 focus:border-brand-500 outline-none text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    <option className="dark:bg-slate-800 dark:text-slate-200" value="همه">نقش: همه نقش‌ها</option>
                    <option className="dark:bg-slate-800 dark:text-slate-200" value="مدیر کل">مدیر کل</option>
                    <option className="dark:bg-slate-800 dark:text-slate-200" value="مدیر شرکت">مدیر شرکت</option>
                    <option className="dark:bg-slate-800 dark:text-slate-200" value="کارشناس پشتیبانی">کارشناس پشتیبانی</option>
                    <option className="dark:bg-slate-800 dark:text-slate-200" value="کاربر">کاربر</option>
                    <option className="dark:bg-slate-800 dark:text-slate-200" value="مشاهده‌گر">مشاهده‌گر</option>
                  </select>
                </div>

                {/* Team Filter */}
                <div className="space-y-1">
                  <select
                    value={filterTeam}
                    onChange={(e) => setFilterTeam(e.target.value)}
                    className="w-full text-xs font-bold px-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/40 focus:border-brand-500 outline-none text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    <option className="dark:bg-slate-800 dark:text-slate-200" value="همه">تیم: همه تیم‌ها</option>
                    <option className="dark:bg-slate-800 dark:text-slate-200" value="تیم فنی">تیم فنی</option>
                    <option className="dark:bg-slate-800 dark:text-slate-200" value="DevOps">DevOps</option>
                    <option className="dark:bg-slate-800 dark:text-slate-200" value="تیم فروش">تیم فروش</option>
                    <option className="dark:bg-slate-800 dark:text-slate-200" value="بدون تیم">بدون تیم</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div className="space-y-1">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full text-xs font-bold px-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/40 focus:border-brand-500 outline-none text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    <option className="dark:bg-slate-800 dark:text-slate-200" value="همه">وضعیت: همه موارد</option>
                    <option className="dark:bg-slate-800 dark:text-slate-200" value="فعال">وضعیت: فعال</option>
                    <option className="dark:bg-slate-800 dark:text-slate-200" value="غیرفعال">وضعیت: غیرفعال</option>
                    <option className="dark:bg-slate-800 dark:text-slate-200" value="دعوت شده">وضعیت: دعوت شده</option>
                  </select>
                </div>

                {/* Last Login Filter */}
                <div className="space-y-1">
                  <select
                    value={filterLastLogin}
                    onChange={(e) => setFilterLastLogin(e.target.value)}
                    className="w-full text-xs font-bold px-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/40 focus:border-brand-500 outline-none text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    <option className="dark:bg-slate-800 dark:text-slate-200" value="همه">آخرین ورود: همه زمان‌ها</option>
                    <option className="dark:bg-slate-800 dark:text-slate-200" value="امروز">امروز / هم‌اکنون</option>
                    <option className="dark:bg-slate-800 dark:text-slate-200" value="اخیر">هفته اخیر</option>
                    <option className="dark:bg-slate-800 dark:text-slate-200" value="تاکنون وارد نشده">تاکنون وارد نشده</option>
                  </select>
                </div>
              </div>

              {/* User Type Tabs */}
              <div className="flex items-center gap-1.5 pb-2">
                <button
                  onClick={() => setUserTypeTab('employees')}
                  className={`px-4 py-1.5 text-[10px] font-black rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    userTypeTab === 'employees'
                      ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-100 dark:border-brand-500/20'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  کارکنان سازمان
                </button>
                <button
                  onClick={() => setUserTypeTab('customers')}
                  className={`px-4 py-1.5 text-[10px] font-black rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    userTypeTab === 'customers'
                      ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-100 dark:border-brand-500/20'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  <Building className="w-3.5 h-3.5" />
                  مشتریان
                </button>
              </div>

              {/* Filter Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/40">
                <span className="text-[10px] text-slate-450 dark:text-slate-500 font-bold">
                  تعداد کل موارد انطباق یافته: <b className="text-brand-600 dark:text-brand-400 font-mono text-xs">{filteredUsers.length}</b> {userTypeTab === 'employees' ? 'کاربر سازمان' : 'کاربر مشتری'}
                </span>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleResetFilters}
                    className="px-3 py-2 text-[10px] font-black hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>پاکسازی فیلترها</span>
                  </button>
                  <button
                    onClick={handleApplyFilterLoading}
                    className="px-4 py-2 text-[11px] font-black bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-lg transition-colors cursor-pointer"
                  >
                    <span>اعمال فیلترها</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Simulated Loading skeleton or empty states */}
            {isLoading ? (
              <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 text-center space-y-4">
                <div className="animate-spin w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full mx-auto" />
                <p className="text-xs text-slate-400 font-black">در حال به‌روزرسانی هوشمند لیست کاربران...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 text-center space-y-4">
                <UserX className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-200">کاربری با شرایط فوق یافت نشد!</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  لطفاً فیلترها یا عبارت جستجوی خود را تغییر دهید تا کاربران مورد نظر بازیابی گردند.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-2 bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/20 text-brand-600 dark:text-brand-400 text-xs font-black rounded-xl transition-all cursor-pointer"
                >
                  نمایش کل کاربران
                </button>
              </div>
            ) : userTypeTab === 'employees' ? (
              <>
              {/* ─── Employees Table (with team column + customer badge) ─── */}
              {activeRowActionId !== null && <div className="fixed inset-0 z-[9998] cursor-default" onClick={() => { setActiveRowActionId(null); setMenuFixedStyle(undefined); }} />}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-slate-50/60 dark:bg-slate-950/20 border-b border-slate-150 dark:border-slate-800 text-slate-400 text-[10px] font-black uppercase tracking-wider">
                        <th className="p-4 pr-5">کاربر و پست سازمانی</th>
                        <th className="p-4">تیم تخصیصی</th>
                        <th className="p-4">نقش سیستمی (RBAC)</th>
                        <th className="p-4">وضعیت</th>
                        <th className="p-4">آخرین ورود</th>
                        <th className="p-4">تاریخ تعریف</th>
                        <th className="p-4 pl-5 text-left">عملیات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {filteredUsers.map((user) => (
                        <tr 
                          key={user.id}
                          className="hover:bg-slate-50/[0.3] dark:hover:bg-slate-950/[0.15] transition-colors"
                        >
                          <td className="p-4 pr-5">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-full ${user.avatarColor} text-white flex items-center justify-center font-black text-xs shadow-inner shrink-0`}>
                                {user.name.substring(0, 2)}
                              </div>
                              <div className="space-y-0.5">
                                <h4 className="font-black text-slate-900 dark:text-white">{user.name}</h4>
                                <span className="font-mono text-xs text-slate-400 dark:text-slate-500 block">{user.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-black ${
                              user.team === 'بدون تیم' 
                                ? 'text-slate-400 bg-slate-50 dark:bg-slate-950/40' 
                                : 'text-slate-600 bg-slate-100 dark:text-slate-300 dark:bg-slate-800'
                            }`}>
                              {user.team}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-brand-600 dark:text-brand-400">{user.role}</span>
                              {user.isCustomer && (
                                <span className="text-[9px] font-bold bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-md border border-amber-200 dark:border-amber-900/40">
                                  مشتری
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black inline-flex items-center gap-1 ${
                              user.status === 'فعال' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                              user.status === 'غیرفعال' ? 'bg-rose-500/10 text-rose-600' :
                              'bg-amber-500/10 text-amber-600'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                user.status === 'فعال' ? 'bg-emerald-500' :
                                user.status === 'غیرفعال' ? 'bg-rose-500' :
                                'bg-amber-500'
                              }`} />
                              {user.status}
                            </span>
                          </td>
                          <td className="p-4 font-bold text-slate-450 dark:text-slate-400 text-[11px]">{user.lastLogin}</td>
                          <td className="p-4 font-mono text-[11px] text-slate-400">{user.createdDate}</td>
                          <td className="p-4 pl-5 text-left">
                            <button
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                const isOpen = activeRowActionId === user.id;
                                setActiveRowActionId(isOpen ? null : user.id);
                                if (!isOpen) {
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  setMenuFixedStyle({ position: 'fixed', top: `${rect.bottom + 4}px`, left: `${rect.left}px`, zIndex: '9999' });
                                } else {
                                  setMenuFixedStyle(undefined);
                                }
                              }}
                              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors cursor-pointer"
                            >
                              <MoreVertical className="w-4.5 h-4.5" />
                            </button>
                            <AnimatePresence>
                              {activeRowActionId === user.id && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95, y: -5 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, y: -5 }}
                                  className="w-44 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden text-right py-1"
                                  style={menuFixedStyle}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button onClick={() => { setSelectedUserProfile(user); setProfileModalTab('info'); setShowProfileModal(true); setActiveRowActionId(null); setMenuFixedStyle(undefined); }} className="w-full px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-900/60 text-[11px] font-black text-slate-700 dark:text-slate-300 flex items-center gap-2 cursor-pointer transition-colors">
                                    <Eye className="w-4 h-4 text-slate-400" /><span>مشاهده پروفایل</span>
                                  </button>
                                  <button onClick={() => { openEditUserDrawer(user); setActiveRowActionId(null); setMenuFixedStyle(undefined); }} className="w-full px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-900/60 text-[11px] font-black text-slate-700 dark:text-slate-300 flex items-center gap-2 cursor-pointer transition-colors">
                                    <Edit3 className="w-4 h-4 text-slate-400" /><span>ویرایش اطلاعات</span>
                                  </button>
                                  <button onClick={() => { setShowConfirmModal({ show: true, type: 'deactivate', userId: user.id }); setActiveRowActionId(null); setMenuFixedStyle(undefined); }} className="w-full px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-900/60 text-[11px] font-black text-slate-700 dark:text-slate-300 flex items-center gap-2 cursor-pointer transition-colors">
                                    <UserX className="w-4 h-4 text-slate-400" /><span>{user.status === 'فعال' ? 'غیرفعال‌سازی حساب' : 'فعال‌سازی مجدد'}</span>
                                  </button>
                                  <button onClick={() => { setShowConfirmModal({ show: true, type: 'reset-pass', userId: user.id }); setActiveRowActionId(null); setMenuFixedStyle(undefined); }} className="w-full px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-900/60 text-[11px] font-black text-slate-700 dark:text-slate-300 flex items-center gap-2 cursor-pointer transition-colors">
                                    <Key className="w-4 h-4 text-slate-400" /><span>بازنشانی رمز عبور</span>
                                  </button>
                                  <div className="border-t border-slate-100 dark:border-slate-700/60 my-1" />
                                  <button onClick={() => { setShowConfirmModal({ show: true, type: 'delete', userId: user.id }); setActiveRowActionId(null); setMenuFixedStyle(undefined); }} className="w-full px-3.5 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-[11px] font-black text-rose-600 dark:text-rose-400 flex items-center gap-2 cursor-pointer transition-colors">
                                    <Trash2 className="w-4 h-4" /><span>حذف دائمی کاربر</span>
                                  </button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
            ) : (
              /* ─── Customers Table (no team column, no badge) ─── */
              <>
              {activeRowActionId !== null && <div className="fixed inset-0 z-[9998] cursor-default" onClick={() => { setActiveRowActionId(null); setMenuFixedStyle(undefined); }} />}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-slate-50/60 dark:bg-slate-950/20 border-b border-slate-150 dark:border-slate-800 text-slate-400 text-[10px] font-black uppercase tracking-wider">
                        <th className="p-4 pr-5">کاربر و پست سازمانی</th>
                        <th className="p-4">مجموعه / شرکت</th>
                        <th className="p-4">نقش سیستمی (RBAC)</th>
                        <th className="p-4">وضعیت</th>
                        <th className="p-4">آخرین ورود</th>
                        <th className="p-4">تاریخ تعریف</th>
                        <th className="p-4 pl-5 text-left">عملیات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {filteredUsers.map((user) => (
                        <tr 
                          key={user.id}
                          className="hover:bg-slate-50/[0.3] dark:hover:bg-slate-950/[0.15] transition-colors"
                        >
                          <td className="p-4 pr-5">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-full ${user.avatarColor} text-white flex items-center justify-center font-black text-xs shadow-inner shrink-0`}>
                                {user.name.substring(0, 2)}
                              </div>
                              <div className="space-y-0.5">
                                <h4 className="font-black text-slate-900 dark:text-white">{user.name}</h4>
                                <span className="font-mono text-xs text-slate-400 dark:text-slate-500 block">{user.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 font-bold text-slate-800 dark:text-slate-300">{user.company}</td>
                          <td className="p-4">
                            <span className="font-black text-brand-600 dark:text-brand-400">{user.role}</span>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black inline-flex items-center gap-1 ${
                              user.status === 'فعال' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                              user.status === 'غیرفعال' ? 'bg-rose-500/10 text-rose-600' :
                              'bg-amber-500/10 text-amber-600'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                user.status === 'فعال' ? 'bg-emerald-500' :
                                user.status === 'غیرفعال' ? 'bg-rose-500' :
                                'bg-amber-500'
                              }`} />
                              {user.status}
                            </span>
                          </td>
                          <td className="p-4 font-bold text-slate-450 dark:text-slate-400 text-[11px]">{user.lastLogin}</td>
                          <td className="p-4 font-mono text-[11px] text-slate-400">{user.createdDate}</td>
                          <td className="p-4 pl-5 text-left">
                            <button
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                const isOpen = activeRowActionId === user.id;
                                setActiveRowActionId(isOpen ? null : user.id);
                                if (!isOpen) {
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  setMenuFixedStyle({ position: 'fixed', top: `${rect.bottom + 4}px`, left: `${rect.left}px`, zIndex: '9999' });
                                } else {
                                  setMenuFixedStyle(undefined);
                                }
                              }}
                              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors cursor-pointer"
                            >
                              <MoreVertical className="w-4.5 h-4.5" />
                            </button>
                            <AnimatePresence>
                              {activeRowActionId === user.id && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95, y: -5 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, y: -5 }}
                                  className="w-44 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden text-right py-1"
                                  style={menuFixedStyle}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button onClick={() => { setSelectedUserProfile(user); setProfileModalTab('info'); setShowProfileModal(true); setActiveRowActionId(null); setMenuFixedStyle(undefined); }} className="w-full px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-900/60 text-[11px] font-black text-slate-700 dark:text-slate-300 flex items-center gap-2 cursor-pointer transition-colors">
                                    <Eye className="w-4 h-4 text-slate-400" /><span>مشاهده پروفایل</span>
                                  </button>
                                  <button onClick={() => { openEditUserDrawer(user); setActiveRowActionId(null); setMenuFixedStyle(undefined); }} className="w-full px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-900/60 text-[11px] font-black text-slate-700 dark:text-slate-300 flex items-center gap-2 cursor-pointer transition-colors">
                                    <Edit3 className="w-4 h-4 text-slate-400" /><span>ویرایش اطلاعات</span>
                                  </button>
                                  <button onClick={() => { setShowConfirmModal({ show: true, type: 'deactivate', userId: user.id }); setActiveRowActionId(null); setMenuFixedStyle(undefined); }} className="w-full px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-900/60 text-[11px] font-black text-slate-700 dark:text-slate-300 flex items-center gap-2 cursor-pointer transition-colors">
                                    <UserX className="w-4 h-4 text-slate-400" /><span>{user.status === 'فعال' ? 'غیرفعال‌سازی حساب' : 'فعال‌سازی مجدد'}</span>
                                  </button>
                                  <button onClick={() => { setShowConfirmModal({ show: true, type: 'reset-pass', userId: user.id }); setActiveRowActionId(null); setMenuFixedStyle(undefined); }} className="w-full px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-900/60 text-[11px] font-black text-slate-700 dark:text-slate-300 flex items-center gap-2 cursor-pointer transition-colors">
                                    <Key className="w-4 h-4 text-slate-400" /><span>بازنشانی رمز عبور</span>
                                  </button>
                                  <div className="border-t border-slate-100 dark:border-slate-700/60 my-1" />
                                  <button onClick={() => { setShowConfirmModal({ show: true, type: 'delete', userId: user.id }); setActiveRowActionId(null); setMenuFixedStyle(undefined); }} className="w-full px-3.5 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-[11px] font-black text-rose-600 dark:text-rose-400 flex items-center gap-2 cursor-pointer transition-colors">
                                    <Trash2 className="w-4 h-4" /><span>حذف دائمی کاربر</span>
                                  </button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
            )}
          </motion.div>
        )}

        {/* SUB TAB 2: ROLES & PERMISSION MATRIX (نقش‌ها و دسترسی‌ها) */}
        {activeSubTab === 'roles' && (
          <motion.div
            key="roles-panel"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Split Roles Selector & Permission Matrix */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
              
              {/* Right Sidebar: Roles List */}
              <div className="xl:col-span-4 space-y-4">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 p-5 space-y-4 shadow-xs">
                  <div className="pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <h3 className="text-xs font-black text-slate-950 dark:text-white flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-brand-500" />
                      <span>نقش‌های سیستمی</span>
                    </h3>
                    <button
                      onClick={async () => {
                        const newName = prompt('نام نقش سفارشی جدید خود را وارد کنید:');
                        if (newName) {
                          try {
                            const newRole = await createRole({ name: newName, description: 'نقش سفارشی تعریف شده جهت سطوح دسترسی اختصاصی کاربران پلتفرم سحاب.', permissions: '{}' });
                            setSelectedRoleForMatrix(newRole.id);
                            showCustomerToast(`نقش سفارشی «${newName}» با موفقیت ایجاد گردید.`, 'success');
                          } catch (e) {
                            showCustomerToast(`خطا: ${(e as Error).message}`, 'error');
                          }
                        }
                      }}
                      className="text-[10px] bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/20 text-brand-600 dark:text-brand-400 font-black px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      نقش سفارشی جدید +
                    </button>
                  </div>

                  <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
                    {roles.map((role) => {
                      const isSelected = role.id === selectedRoleForMatrix;
                      return (
                        <div
                          key={role.id}
                          onClick={() => setSelectedRoleForMatrix(role.id)}
                          className={`p-4 rounded-xl border transition-all text-right cursor-pointer ${
                            isSelected 
                              ? 'bg-brand-50/[0.04] dark:bg-brand-500/[0.02] border-brand-300 dark:border-brand-800/80 shadow-inner' 
                              : 'bg-slate-50/[0.2] dark:bg-slate-950/[0.05] border-slate-150 dark:border-slate-800 hover:border-slate-250'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className={`text-xs font-black ${isSelected ? 'text-brand-600 dark:text-brand-400' : 'text-slate-800 dark:text-slate-200'}`}>
                              {role.name}
                            </span>
                            <span className="text-[10px] bg-slate-100 dark:bg-slate-800/80 text-slate-500 font-mono font-bold px-2.5 py-0.5 rounded-full">
                              {role.userCount} کاربر
                            </span>
                          </div>
                          
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed line-clamp-2 mb-3 font-semibold">
                            {role.description}
                          </p>

                          <div className="flex items-center justify-between gap-4 pt-2.5 border-t border-dashed border-slate-150 dark:border-slate-800/60">
                            <span className="text-[9px] text-slate-400 font-black">شناسه نقش: {role.id}</span>
                            
                            <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                              <button
                                onClick={() => handleDuplicateRole(role)}
                                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 transition-colors"
                                title="تکثیر نقش"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={async () => {
                                  const dsc = prompt('توضیحات جدید نقش را وارد کنید:', role.description);
                                  if (dsc) {
                                    try {
                                      await updateRole({ id: role.id, description: dsc });
                                      showCustomerToast('توضیحات نقش بروزرسانی شد.', 'success');
                                    } catch (e) {
                                      showCustomerToast(`خطا: ${(e as Error).message}`, 'error');
                                    }
                                  }
                                }}
                                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 transition-colors"
                                title="ویرایش توضیحات"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              {role.id !== 'ROL-1' && (
                                <button
                                  onClick={() => handleDeleteRole(role.id)}
                                  className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-md text-slate-400 hover:text-rose-600 transition-colors"
                                  title="حذف نقش"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Left Column: Interactive Permission Matrix */}
              <div className="xl:col-span-8 space-y-4">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 p-5 space-y-4 shadow-xs">
                  
                  {/* Matrix Header */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="space-y-0.5">
                      <h3 className="text-xs font-black text-slate-950 dark:text-white flex items-center gap-1.5">
                        <Sliders className="w-4 h-4 text-brand-500" />
                        <span>ماتریس دسترسی پیشرفته: نقش <b className="text-brand-600 dark:text-brand-400 font-extrabold">«{currentRoleMatrix?.name}»</b></span>
                      </h3>
                      <p className="text-[10px] text-slate-400">تغییرات شما به صورت بلادرنگ ذخیره شده و به کاربران این نقش منتسب می‌گردد.</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleClearAllMatrix}
                        className="px-2.5 py-1.5 text-[10px] font-black bg-slate-50 hover:bg-slate-100 dark:bg-slate-950/40 text-slate-500 rounded-lg transition-colors cursor-pointer"
                      >
                        لغو همه دسترسی‌ها
                      </button>
                      <button
                        onClick={handleSelectAllMatrix}
                        className="px-2.5 py-1.5 text-[10px] font-black bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/20 text-brand-600 dark:text-brand-400 rounded-lg transition-colors cursor-pointer"
                      >
                        فعال‌سازی کل لایسنس دسترسی
                      </button>
                    </div>
                  </div>

                  {/* Search Permissions inside Matrix */}
                  <div className="relative">
                    <Search className="absolute right-3 top-2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="جستجوی دسترسی یا طبقه‌بندی..."
                      value={matrixSearchQuery}
                      onChange={e => setMatrixSearchQuery(e.target.value)}
                      className="w-full text-[11px] font-bold pl-3 pr-8 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950/20 focus:border-brand-500 outline-none text-slate-700 dark:text-slate-300"
                    />
                  </div>

                  {/* Matrix Grid */}
                  <div className="overflow-x-auto pt-2">
                    <table className="w-full text-right border-collapse">
                      <thead>
                        <tr className="bg-slate-50/60 dark:bg-slate-950/20 border-b border-slate-150 dark:border-slate-800 text-slate-400 text-[10px] font-black uppercase tracking-wider">
                          <th className="p-3 pr-4">دسته‌بندی ماژولار</th>
                          <th className="p-3 text-center">مشاهده (View)</th>
                          <th className="p-3 text-center">ایجاد (Create)</th>
                          <th className="p-3 text-center">ویرایش (Edit)</th>
                          <th className="p-3 text-center">حذف (Delete)</th>
                          <th className="p-3 text-center">تخصیص (Assign)</th>
                          <th className="p-3 text-center">خروجی (Export)</th>
                          <th className="p-3 text-left pl-4">کنترل گروهی</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {[
                          { key: 'Dashboard', name: 'میز کار پویا (Dashboard)', desc: 'نمودارها، آمار SLA و جریان‌های لحظه‌ای' },
                          { key: 'Products', name: 'مدیریت محصولات (Products)', desc: 'تعریف محصول، افزودن پکیج و کدهای لایسنس' },
                          { key: 'Customers', name: 'مشتریان و سازمان‌ها (Customers)', desc: 'اطلاعات حقوقی، لایسنس مشتریان و ممیزی' },
                          { key: 'Tickets', name: 'تیکتینگ و گفتگو (Tickets)', desc: 'تبادل پیام، پاسخ رسمی و آپلود پیوست لاگ' },
                          { key: 'Users', name: 'کاربران و سازمان (Users)', desc: 'مدیریت کاربران، نقش‌های RBAC و تیم‌ها' },
                          { key: 'Reports', name: 'گزارش‌دهی و آمار (Reports)', desc: 'دریافت خروجی گزارش‌های عملکردی و مالی' },
                          { key: 'Settings', name: 'تنظیمات کلی سامانه (Settings)', desc: 'پیکربندی گره‌ها، وب‌هوک و امنیت پیشرفته' }
                        ].filter(item => 
                          item.name.toLowerCase().includes(matrixSearchQuery.toLowerCase()) || 
                          item.key.toLowerCase().includes(matrixSearchQuery.toLowerCase())
                        ).map((category) => {
                          const activePermissions = currentRoleMatrix?.permissions[category.key] || [];
                          
                          return (
                            <tr key={category.key} className="hover:bg-slate-50/[0.2] dark:hover:bg-slate-950/[0.1] transition-colors">
                              <td className="p-3 pr-4">
                                <div className="space-y-0.5">
                                  <span className="font-black text-slate-800 dark:text-slate-100">{category.name}</span>
                                  <span className="text-[9px] text-slate-400 dark:text-slate-500 block font-bold">{category.desc}</span>
                                </div>
                              </td>

                              {/* Permission togglers */}
                              {['View', 'Create', 'Edit', 'Delete', 'Assign', 'Export'].map((type) => {
                                const hasPerm = activePermissions.includes(type);
                                return (
                                  <td key={type} className="p-3 text-center">
                                    <button
                                      onClick={() => handleTogglePermission(category.key, type)}
                                      className={`w-6 h-6 rounded-md inline-flex items-center justify-center transition-all border ${
                                        hasPerm
                                          ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 border-brand-200 dark:border-brand-900/60'
                                          : 'bg-slate-50 dark:bg-slate-950/20 text-slate-300 dark:text-slate-700 border-slate-200 dark:border-slate-800/80 hover:border-slate-300'
                                      }`}
                                    >
                                      {hasPerm && <Check className="w-3.5 h-3.5 stroke-[3.5]" />}
                                    </button>
                                  </td>
                                );
                              })}

                              {/* Group Action controller */}
                              <td className="p-3 text-left pl-4">
                                <button
                                  onClick={() => handleSelectAllCategoryPermissions(category.key)}
                                  className="text-[9px] font-black text-brand-600 hover:text-brand-700 dark:text-brand-400 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950/40 px-2.5 py-1 rounded-md transition-colors"
                                >
                                  {activePermissions.length === 6 ? 'لغو همه' : 'انتخاب همه'}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="p-4 bg-slate-50/60 dark:bg-slate-950/20 border border-slate-150 dark:border-slate-800/80 rounded-2xl flex items-center gap-3">
                    <Info className="w-5 h-5 text-brand-500 shrink-0" />
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-bold">
                      راهنما: نقش‌های سیستمی بالا توسط بخش امنیت مدیریت می‌شوند. برای اعمال هرگونه تغییر بر روی کارشناسان به صورت مستقیم، ابتدا نقش مربوطه را تنظیم کرده و سپس بر روی نام کاربر بازنشانی کنید. تغییرات ماتریس برای کل لایسنس جاری پلتفرم اعمال خواهد شد.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* SUB TAB 3: SUPPORT TEAMS MANAGEMENT (تیم‌های پشتیبانی) */}
        {activeSubTab === 'teams' && (
          <motion.div
            key="teams-panel"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* KPI header for teams */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-xs font-black text-slate-900 dark:text-white">تیم‌های کاری و دپارتمان‌های پشتیبانی سحاب</h3>
                <p className="text-[10px] text-slate-400">تخصیص هوشمند تیکت‌ها بر مبنای مهارت‌های دپارتمان‌ها و محصولات مشخص شده انجام می‌گیرد.</p>
              </div>

              <button
                onClick={openCreateTeamModal}
                className="px-3.5 py-2 text-xs font-black bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <FolderPlus className="w-4 h-4" />
                <span>تعریف دپارتمان جدید +</span>
              </button>
            </div>

            {/* Teams Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {teams.map((team) => (
                <div
                  key={team.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 p-5 flex flex-col justify-between shadow-xs transition-transform hover:translate-y-[-2px] duration-200"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black">
                          <Users2 className="w-4.5 h-4.5" />
                        </div>
                        <h4 className="text-xs font-black text-slate-900 dark:text-white">{team.name}</h4>
                      </div>
                      <span className="text-[9px] font-mono font-bold text-slate-400">{team.id}</span>
                    </div>

                    <div className="space-y-2 text-xs pt-1">
                      <div className="flex items-center justify-between text-slate-400 font-bold">
                        <span>سرپرست دپارتمان:</span>
                        <span className="text-slate-800 dark:text-slate-200 font-black">{team.lead}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-400 font-bold">
                        <span>تعداد مهندسان فعال:</span>
                        <span className="text-brand-600 dark:text-brand-400 font-black font-mono">{team.membersCount} نفر</span>
                      </div>
                    </div>

                    {/* Assigned products tag list */}
                    <div className="space-y-1.5 pt-3 border-t border-slate-100 dark:border-slate-800/60">
                      <span className="text-[10px] text-slate-400 font-bold block">محصولات تحت پوشش:</span>
                      <div className="flex flex-wrap gap-1">
                        {team.assignedProducts.map((p, idx) => (
                          <span
                            key={idx}
                            className="text-[9px] font-bold bg-slate-50 hover:bg-slate-100 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 pt-4 mt-5 border-t border-slate-100 dark:border-slate-800/60">
                    <button
                      onClick={() => openEditTeamModal(team)}
                      className="text-[10px] font-black text-brand-600 hover:text-brand-700 dark:text-brand-400 cursor-pointer"
                    >
                      ویرایش پیکربندی
                    </button>
                    <button
                      onClick={() => handleDeleteTeam(team.id)}
                      className="text-[10px] font-black text-rose-500 hover:text-rose-600 cursor-pointer"
                    >
                      انحلال دپارتمان
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. DRAWER: ADD / EDIT USER */}
      <AnimatePresence>
        {showUserDrawer && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUserDrawer(false)}
              className="fixed inset-0 bg-slate-950 z-[120] pointer-events-auto"
            />

            {/* Slide-over Content */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed top-0 bottom-0 left-0 w-full max-w-lg bg-white dark:bg-slate-900 border-r border-slate-200/60 dark:border-slate-800 shadow-2xl z-[130] flex flex-col text-right"
            >
              {/* Drawer Header */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowUserDrawer(false)}
                    className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <div>
                    <h3 className="text-xs font-black text-slate-900 dark:text-white">
                      {userDrawerMode === 'create' ? 'افزودن کاربر جدید به سامانه' : 'ویرایش جزئیات کاربری'}
                    </h3>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">تعیین سطوح دسترسی و پست‌های سازمانی سحاب</p>
                  </div>
                </div>
              </div>

              {/* Drawer Scrollable Form */}
              <div className="flex-1 p-5 overflow-y-auto space-y-6">
                <form onSubmit={handleSaveUser} className="space-y-5">
                  
                  {/* Section: Personal */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-1.5 border-b border-slate-150 dark:border-slate-800/60">
                      <Briefcase className="w-4 h-4 text-brand-500" />
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200">مشخصات هویتی و پرسنلی</span>
                    </div>

                    {/* Full Name */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold block">نام و نام خانوادگی <b className="text-rose-500">*</b></label>
                      <input
                        type="text"
                        value={formDataName}
                        onChange={(e) => {
                          setFormDataName(e.target.value);
                          if (formErrors.name) setFormErrors({ ...formErrors, name: '' });
                        }}
                        placeholder="مانند: محمد علوی"
                        className={`w-full text-xs font-bold px-3.5 py-2.5 border rounded-xl bg-slate-50 dark:bg-slate-950/20 outline-none focus:border-brand-500 text-slate-700 dark:text-slate-300 ${
                          formErrors.name ? 'border-rose-400 dark:border-rose-900/60' : 'border-slate-200 dark:border-slate-800'
                        }`}
                      />
                      {formErrors.name && <span className="text-[9px] text-rose-500 font-bold block">{formErrors.name}</span>}
                    </div>

                    {/* Email */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold block">نشانی ایمیل (نام کاربری ورود) <b className="text-rose-500">*</b></label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                        <input
                          type="email"
                          value={formDataEmail}
                          onChange={(e) => {
                            setFormDataEmail(e.target.value);
                            if (formErrors.email) setFormErrors({ ...formErrors, email: '' });
                          }}
                          placeholder="username@domain.com"
                          className={`w-full text-xs font-mono font-bold pl-10 pr-3.5 py-2.5 border rounded-xl bg-slate-50 dark:bg-slate-950/20 outline-none focus:border-brand-500 text-left text-slate-700 dark:text-slate-300 ${
                            formErrors.email ? 'border-rose-400 dark:border-rose-900/60' : 'border-slate-200 dark:border-slate-800'
                          }`}
                        />
                      </div>
                      {formErrors.email && <span className="text-[9px] text-rose-500 font-bold block">{formErrors.email}</span>}
                    </div>

                    {/* Phone */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold block">شماره تلفن همراه <b className="text-rose-500">*</b></label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          value={formDataPhone}
                          onChange={(e) => {
                            setFormDataPhone(e.target.value);
                            if (formErrors.phone) setFormErrors({ ...formErrors, phone: '' });
                          }}
                          placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                          className={`w-full text-xs font-mono font-bold pl-10 pr-3.5 py-2.5 border rounded-xl bg-slate-50 dark:bg-slate-950/20 outline-none focus:border-brand-500 text-left text-slate-700 dark:text-slate-300 ${
                            formErrors.phone ? 'border-rose-400 dark:border-rose-900/60' : 'border-slate-200 dark:border-slate-800'
                          }`}
                        />
                      </div>
                      {formErrors.phone && <span className="text-[9px] text-rose-500 font-bold block">{formErrors.phone}</span>}
                    </div>
                    {/* Password (only for create) */}
                    {userDrawerMode === 'create' && (
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold block">رمز عبور اولیه</label>
                        <input
                          type="password"
                          value={formDataPassword}
                          onChange={(e) => setFormDataPassword(e.target.value)}
                          placeholder="پیش‌فرض: Temp@123456"
                          className="w-full text-xs font-bold px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/20 outline-none focus:border-brand-500 text-slate-700 dark:text-slate-300"
                        />
                      </div>
                    )}
                  </div>

                  {/* Section: Organization Roles */}
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center gap-2 pb-1.5 border-b border-slate-150 dark:border-slate-800/60">
                      <Building className="w-4 h-4 text-brand-500" />
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200">بخش اداری و انتساب‌های سازمانی</span>
                    </div>

                    {/* User Type Toggle */}
                    <div className="flex items-center gap-3 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl">
                      <button
                        type="button"
                        onClick={() => { if (userDrawerMode !== 'edit') setUserType('organization'); }}
                        className={`flex-1 py-2 px-3 text-[11px] font-black rounded-lg transition-all ${
                          userType === 'organization'
                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                        } ${userDrawerMode === 'edit' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <Users className="w-3.5 h-3.5 inline ml-1" />
                        کاربر سازمانی
                      </button>
                      <button
                        type="button"
                        onClick={() => { if (userDrawerMode !== 'edit') setUserType('customer'); }}
                        className={`flex-1 py-2 px-3 text-[11px] font-black rounded-lg transition-all ${
                          userType === 'customer'
                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                        } ${userDrawerMode === 'edit' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <Building className="w-3.5 h-3.5 inline ml-1" />
                        کاربر مشتری
                      </button>
                    </div>

                    <motion.div
                      key={userType}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15 }}
                      className="grid grid-cols-2 gap-4"
                    >
                      {userType === 'organization' ? (
                        <>
                          {/* Department selection (from API) */}
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold block">دپارتمان / تیم کاری</label>
                            <select
                              value={formDataDepartmentId}
                              onChange={(e) => setFormDataDepartmentId(e.target.value)}
                              className="w-full text-xs font-bold px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950/20 outline-none focus:border-brand-500 text-slate-700 dark:text-slate-300 cursor-pointer"
                              style={{ colorScheme: 'dark' }}
                            >
                              <option className='dark:bg-slate-700' value="">بدون دپارتمان</option>
                              {departments.map(d => (
                                <option className='dark:bg-slate-700' key={d.id} value={d.id}>{d.name}</option>
                              ))}
                            </select>
                          </div>

                          {/* Custom role selection (from API) */}
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold block">نقش دسترسی (RBAC)</label>
                            <select
                              value={formDataCustomRoleId}
                              onChange={(e) => setFormDataCustomRoleId(e.target.value)}
                              className="w-full text-xs font-bold px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950/20 outline-none focus:border-brand-500 text-slate-700 dark:text-slate-300 cursor-pointer"
                              style={{ colorScheme: 'dark' }}
                            >
                              <option className='dark:bg-slate-700' value="">بدون نقش</option>
                              {apiRoles.map(r => (
                                <option className='dark:bg-slate-700' key={r.id} value={r.id}>{r.name}</option>
                              ))}
                            </select>
                          </div>
                        </>
                      ) : (
                        <>
                          {/* Company Selection — from real customers */}
                          <div className="space-y-1 col-span-1">
                            <label className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold block">شرکت / سازمان وابسته <b className="text-rose-500">*</b></label>
                            <select
                              value={formDataCompany}
                              onChange={(e) => setFormDataCompany(e.target.value)}
                              className="w-full text-xs font-bold px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950/20 outline-none focus:border-brand-500 text-slate-700 dark:text-slate-300 cursor-pointer"
                              style={{ colorScheme: 'dark' }}
                            >
                              <option className='dark:bg-slate-700' value="">انتخاب سازمان</option>
                              {apiCustomers.map(c => (
                                <option className='dark:bg-slate-700' key={c.id} value={c.name}>{c.name}</option>
                              ))}
                            </select>
                          </div>

                          {/* Customer role selection (predefined) */}
                          <div className="space-y-1 col-span-1">
                            <label className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold block">نقش کاربری</label>
                            <select
                              value={formDataCustomerRole}
                              onChange={(e) => setFormDataCustomerRole(e.target.value)}
                              className="w-full text-xs font-bold px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950/20 outline-none focus:border-brand-500 text-slate-700 dark:text-slate-300 cursor-pointer"
                              style={{ colorScheme: 'dark' }}
                            >
                              <option className='dark:bg-slate-700' value="">انتخاب نقش</option>
                              <option className='dark:bg-slate-700' value="مدیر اصلی">مدیر اصلی</option>
                              <option className='dark:bg-slate-700' value="کاربر">کاربر</option>
                            </select>
                          </div>
                        </>
                      )}
                    </motion.div>
                  </div>

                  {/* Section: Access Levels */}
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center gap-2 pb-1.5 border-b border-slate-150 dark:border-slate-800/60">
                      <Lock className="w-4 h-4 text-brand-500" />
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200">تعیین سطح دسترسی کلی لایسنس</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {['پایین', 'متوسط', 'بسیار بالا'].map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setFormDataAccessLevel(lvl)}
                          className={`px-3 py-2 text-[10px] font-black rounded-lg border text-center cursor-pointer transition-all ${
                            formDataAccessLevel === lvl
                              ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 border-brand-500/30'
                              : 'bg-slate-50 dark:bg-slate-950/20 text-slate-500 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Setup Options (Invite, immediate active) */}
                  <div className="pt-4 space-y-3">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formDataSendInvite}
                        onChange={(e) => setFormDataSendInvite(e.target.checked)}
                        className="w-4 h-4 accent-brand-600 rounded border-slate-300"
                      />
                      <span className="text-[11px] text-slate-600 dark:text-slate-400 font-extrabold">ارسال دعوت‌نامه ورود به همراه لینک تعیین رمز عبور به ایمیل</span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formDataImmediateActive}
                        onChange={(e) => setFormDataImmediateActive(e.target.checked)}
                        className="w-4 h-4 accent-brand-600 rounded border-slate-300"
                      />
                      <span className="text-[11px] text-slate-600 dark:text-slate-400 font-extrabold">فعال‌سازی فوری حساب کاربری در لحظه ثبت‌نام</span>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-6 border-t border-slate-150 dark:border-slate-800/80 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowUserDrawer(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-black rounded-xl transition-all cursor-pointer"
                    >
                      انصراف و لغو
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-brand-500/10 cursor-pointer"
                    >
                      <span>ذخیره نهایی اطلاعات</span>
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 5. USER PROFILE MODAL */}
      <AnimatePresence>
        {showProfileModal && selectedUserProfile && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowProfileModal(false)}
              className="fixed inset-0 bg-slate-950 pointer-events-auto"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative z-10 flex flex-col text-right font-sans"
            >
              {/* Header card banner */}
              <div className="bg-slate-50 dark:bg-slate-950/40 p-6 border-b border-slate-150 dark:border-slate-800/60 flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-full ${selectedUserProfile.avatarColor} text-white flex items-center justify-center text-lg font-black shrink-0 shadow-inner`}>
                    {selectedUserProfile.name.substring(0, 2)}
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black text-slate-900 dark:text-white">{selectedUserProfile.name}</h3>
                      <span className="text-[9px] bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400 font-black px-2 py-0.5 rounded-md">
                        {selectedUserProfile.role}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono font-bold">{selectedUserProfile.email}</p>
                    <span className="text-[10px] text-slate-500 font-bold block">وابسته به: {selectedUserProfile.company}</span>
                  </div>
                </div>

                <button
                  onClick={() => setShowProfileModal(false)}
                  className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-850 dark:hover:text-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Subtabs for Modal */}
              <div className="flex items-center gap-1.5 px-6 pt-4 border-b border-slate-100 dark:border-slate-800/60">
                <button
                  onClick={() => setProfileModalTab('info')}
                  className={`px-4 py-2 text-xs font-black transition-all cursor-pointer border-b-2 ${
                    profileModalTab === 'info'
                      ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                      : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  اطلاعات کلی
                </button>
                <button
                  onClick={() => setProfileModalTab('permissions')}
                  className={`px-4 py-2 text-xs font-black transition-all cursor-pointer border-b-2 ${
                    profileModalTab === 'permissions'
                      ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                      : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  مجوزها و دسترسی‌ها
                </button>
                <button
                  onClick={() => setProfileModalTab('activities')}
                  className={`px-4 py-2 text-xs font-black transition-all cursor-pointer border-b-2 ${
                    profileModalTab === 'activities'
                      ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                      : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  فعالیت‌های اخیر
                </button>
              </div>

              {/* Modal scroll content */}
              <div className="p-6 overflow-y-auto max-h-[400px] space-y-5">
                
                {/* Modal Tab 1: Info */}
                {profileModalTab === 'info' && (
                  <div className="space-y-4 text-xs font-bold text-slate-600 dark:text-slate-450">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-slate-50 dark:bg-slate-950/20 rounded-xl border border-slate-150 dark:border-slate-800/80">
                        <span className="text-[10px] text-slate-400 block mb-1">دپارتمان / تیم کاری:</span>
                        <span className="text-slate-900 dark:text-white font-black">{selectedUserProfile.team}</span>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-950/20 rounded-xl border border-slate-150 dark:border-slate-800/80">
                        <span className="text-[10px] text-slate-400 block mb-1">شماره تماس مستقیم:</span>
                        <span className="text-slate-900 dark:text-white font-mono font-black">{selectedUserProfile.phone}</span>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-950/20 rounded-xl border border-slate-150 dark:border-slate-800/80">
                        <span className="text-[10px] text-slate-400 block mb-1">آخرین ورود موفق به سامانه:</span>
                        <span className="text-slate-900 dark:text-white font-black">{selectedUserProfile.lastLogin}</span>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-950/20 rounded-xl border border-slate-150 dark:border-slate-800/80">
                        <span className="text-[10px] text-slate-400 block mb-1">تاریخ تعریف کاربر:</span>
                        <span className="text-slate-900 dark:text-white font-mono font-black">{selectedUserProfile.createdDate}</span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 mb-2">خلاصه آمارهای ارزیابی عملکرد (SLA)</h4>
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="p-3.5 border border-slate-150 dark:border-slate-800 rounded-2xl">
                          <span className="text-[20px] font-black text-brand-600 dark:text-brand-400 font-mono block">۲۴</span>
                          <span className="text-[9px] text-slate-400 font-bold block mt-1">تیکت حل شده</span>
                        </div>
                        <div className="p-3.5 border border-slate-150 dark:border-slate-800 rounded-2xl">
                          <span className="text-[20px] font-black text-emerald-600 dark:text-emerald-400 font-mono block">۱۲m</span>
                          <span className="text-[9px] text-slate-400 font-bold block mt-1">میانگین زمان پاسخ</span>
                        </div>
                        <div className="p-3.5 border border-slate-150 dark:border-slate-800 rounded-2xl">
                          <span className="text-[20px] font-black text-amber-500 font-mono block">۹۸٪</span>
                          <span className="text-[9px] text-slate-400 font-bold block mt-1">رضایت مشتری</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Modal Tab 2: Permissions */}
                {profileModalTab === 'permissions' && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">جزئیات مجوزهای انتسابی نقش «{selectedUserProfile.role}»</h4>
                    <div className="space-y-2">
                      {[
                        { module: 'میز کار پویا (Dashboard)', rights: ['مشاهده', 'خروجی فایل'] },
                        { module: 'مدیریت تیکتینگ (Tickets)', rights: ['پاسخ رسمی پشتیبانی', 'تعریف برچسب ارجاعی', 'ممیزی لاگ پیوست'] },
                        { module: 'مدیریت محصولات (Products)', rights: ['فقط مشاهده کاتالوگ'] }
                      ].map((perm, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-950/20 border border-slate-150 dark:border-slate-800 rounded-xl flex items-center justify-between">
                          <span className="text-xs font-black text-slate-800 dark:text-slate-200">{perm.module}</span>
                          <div className="flex gap-1.5">
                            {perm.rights.map((r, rIdx) => (
                              <span key={rIdx} className="text-[9px] font-bold bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400 px-2 py-0.5 rounded-md">
                                {r}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Modal Tab 3: Activities */}
                {profileModalTab === 'activities' && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 mb-2">لاگ فعالیت‌های سیستمی اخیر کاربر</h4>
                    <div className="space-y-3 relative border-r-2 border-slate-100 dark:border-slate-800/80 mr-3 pr-4">
                      {[
                        { act: 'ثبت پاسخ تیکت TKT-1025 (رفع قطعی گره پردیس)', time: '۱۰ دقیقه پیش' },
                        { act: 'ممیزی پیوست لاگ مانیتورینگ متصل شده', time: '۱ ساعت پیش' },
                        { act: 'تغییر وضعیت تیکت TKT-1022 به «در حال بررسی»', time: 'دیروز' },
                        { act: 'ورود موفق به سامانه پشتیبانی سحاب', time: 'دیروز' }
                      ].map((item, idx) => (
                        <div key={idx} className="relative">
                          <span className="absolute -right-[23px] top-1.5 w-2 h-2 rounded-full bg-brand-500" />
                          <div className="space-y-0.5 text-xs font-bold">
                            <p className="text-slate-700 dark:text-slate-300">{item.act}</p>
                            <span className="text-[9px] text-slate-400 font-mono">{item.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Close Button */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950/20 border-t border-slate-150 dark:border-slate-800/60 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-black rounded-xl transition-all cursor-pointer"
                >
                  بستن پنجره ممیزی
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. TEAM ADD / EDIT MODAL */}
      <AnimatePresence>
        {showTeamModal && (
          <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTeamModal(false)}
              className="fixed inset-0 bg-slate-950 pointer-events-auto"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative z-10 flex flex-col text-right font-sans"
            >
              <div className="p-5 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-900 dark:text-white">
                  {teamModalMode === 'create' ? 'تعریف دپارتمان پشتیبانی جدید' : 'ویرایش دپارتمان پشتیبانی'}
                </h3>
                <button onClick={() => setShowTeamModal(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-100">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveTeam} className="p-5 space-y-4">
                {/* Team Name */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold block">نام دپارتمان / تیم کاری <b className="text-rose-500">*</b></label>
                  <input
                    type="text"
                    value={teamName}
                    onChange={e => setTeamName(e.target.value)}
                    placeholder="مثال: تیم مانیتورینگ گره‌های ابری"
                    className="w-full text-xs font-bold px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950/20 outline-none focus:border-brand-500 text-slate-700 dark:text-slate-300"
                  />
                </div>

                {/* Team Lead */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold block">سرپرست ارشد دپارتمان <b className="text-rose-500">*</b></label>
                  <input
                    type="text"
                    value={teamLead}
                    onChange={e => setTeamLead(e.target.value)}
                    placeholder="مثال: مهندس علی علوی"
                    className="w-full text-xs font-bold px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950/20 outline-none focus:border-brand-500 text-slate-700 dark:text-slate-300"
                  />
                </div>

                {/* Assigned Products (from real API) */}
                <div className="space-y-2 pt-1">
                  <label className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold block">محصولات تحت پوشش دپارتمان</label>
                  <div className="space-y-2 max-h-[150px] overflow-y-auto border border-slate-200 dark:border-slate-700/80 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40">
                    {products.length === 0 ? (
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">هیچ محصولی یافت نشد</span>
                    ) : products.map((prod) => {
                      const hasProd = teamProducts.includes(prod.name);
                      return (
                        <label key={prod.id} className="flex items-center gap-2 cursor-pointer text-[10px] font-black text-slate-700 dark:text-slate-300">
                          <input
                            type="checkbox"
                            checked={hasProd}
                            onChange={() => {
                              setTeamProducts(
                                hasProd
                                  ? teamProducts.filter(p => p !== prod.name)
                                  : [...teamProducts, prod.name]
                              );
                            }}
                            className="accent-brand-600"
                          />
                          <span>{prod.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowTeamModal(false)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-black rounded-xl cursor-pointer"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-black rounded-xl cursor-pointer shadow-sm"
                  >
                    تشکیل و تایید نهایی
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 7. GENERAL CONFIRMATION MODAL */}
      <AnimatePresence>
        {showConfirmModal.show && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirmModal({ show: false, type: 'delete', userId: null })}
              className="fixed inset-0 bg-slate-950 pointer-events-auto"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl relative z-10 p-5 text-right font-sans space-y-4"
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  showConfirmModal.type === 'delete' ? 'bg-rose-500/10 text-rose-500' :
                  showConfirmModal.type === 'deleteDepartment' || showConfirmModal.type === 'deleteRole' ? 'bg-amber-500/10 text-amber-500' :
                  'bg-brand-500/10 text-brand-500'
                }`}>
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xs font-black text-slate-900 dark:text-white">
                    {showConfirmModal.type === 'delete' ? 'آیا از حذف دائمی این کاربر اطمینان دارید؟' :
                     showConfirmModal.type === 'deleteDepartment' ? `حذف دپارتمان «${showConfirmModal.extra?.departmentName}»` :
                     showConfirmModal.type === 'deleteRole' ? `حذف نقش «${showConfirmModal.extra?.roleName}»` :
                     showConfirmModal.type === 'deactivate' ? 'تغییر وضعیت فعال‌سازی حساب کاربری' :
                     'ارسال لینک بازنشانی گذرواژه امن'}
                  </h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed font-bold">
                    {showConfirmModal.type === 'delete' ? 'این عملیات غیر قابل بازگشت بوده و کلیه اطلاعات کاربری و دسترسی‌های وی از پایگاه داده سحاب حذف خواهد شد.' :
                     showConfirmModal.type === 'deleteDepartment' ? `این دپارتمان ${showConfirmModal.extra?.userCount || 0} کاربر دارد. پس از حذف، کاربران به دپارتمان پیش‌فرض منتقل می‌شوند.` :
                     showConfirmModal.type === 'deleteRole' ? `این نقش ${showConfirmModal.extra?.userCount || 0} کاربر دارد. ${
                       showConfirmModal.extra?.userCount ? 'لطفاً یک نقش جایگزین برای این کاربران انتخاب کنید.' : 'آیا از حذف این نقش اطمینان دارید؟'
                     }` :
                     showConfirmModal.type === 'deactivate' ? 'با تایید این درخواست، دسترسی موقت کاربر به پنل لغو یا مجدداً برقرار خواهد گردید.' :
                     'با تایید این عملیات، یک ایمیل معتبر حاوی لینک تغییر کلمه عبور برای کاربر صادر می‌گردد.'}
                  </p>
                </div>
              </div>

              {showConfirmModal.type === 'deleteRole' && showConfirmModal.extra?.userCount ? (
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold block">نقش جایگزین برای کاربران</label>
                  <select
                    value={reassignRoleId}
                    onChange={e => setReassignRoleId(e.target.value)}
                    className="w-full text-xs font-bold px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/20 outline-none focus:border-brand-500 text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    <option value="">بدون نقش (پاک شدن دسترسی)</option>
                    {apiRoles.filter(r => r.id !== showConfirmModal.extra?.roleId).map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              ) : null}

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  onClick={() => { setShowConfirmModal({ show: false, type: 'delete', userId: null }); setReassignRoleId(''); }}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-black rounded-xl cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  onClick={executeConfirmAction}
                  className={`px-4 py-2 text-xs font-black rounded-xl cursor-pointer ${
                    showConfirmModal.type === 'delete'
                      ? 'bg-rose-600 hover:bg-rose-700 text-white'
                      : 'bg-brand-600 hover:bg-brand-700 text-white'
                  }`}
                >
                  تایید و اعمال نهایی
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
