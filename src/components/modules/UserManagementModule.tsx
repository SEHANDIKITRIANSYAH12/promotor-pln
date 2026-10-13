'use client';

import React, { useState, useMemo } from 'react';
import { usePromotor } from '@/context/PromotorContext';
import { UserProfile, UserRole } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ExportDropdown } from '@/components/ui/ExportDropdown';
import { exportToExcel, exportToPdf } from '@/lib/exportUtils';
import {
  Users,
  UserPlus,
  UserCheck,
  UserX,
  ShieldCheck,
  ShieldAlert,
  HardHat,
  Warehouse,
  Search,
  Filter,
  Edit,
  Trash2,
  KeyRound,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Lock,
  Mail,
  Phone,
  Building,
  RefreshCw,
  Info,
  ChevronRight
} from 'lucide-react';

const AVATAR_OPTIONS = ['👨‍💼', '👷‍♂️', '🕵️‍♂️', '📦', '👩‍💼', '👩‍💻', '⚡', '🏢', '🛠️', '👨‍🔧', '🧑‍💼'];

const ROLE_CONFIG: Record<
  UserRole,
  {
    label: string;
    badgeVariant: 'purple' | 'info' | 'warn' | 'ok';
    badgeClass: string;
    icon: React.ElementType;
    defaultTitle: string;
    description: string;
    modules: string[];
  }
> = {
  superadmin: {
    label: 'Super Admin',
    badgeVariant: 'purple',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    icon: ShieldCheck,
    defaultTitle: 'Super Administrator / Manager ULP',
    description: 'Akses penuh ke seluruh 10 modul sistem, manajemen pengguna, audit log, dan persetujuan SPK/WO.',
    modules: ['Master STD', 'Survey', 'Daftung', 'Work Order', 'Pengawasan', 'Gudang', 'Kontrak', 'Keb Material', 'Audit Log', 'Kelola Pengguna']
  },
  surveyor: {
    label: 'Surveyor Lapangan',
    badgeVariant: 'info',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
    icon: HardHat,
    defaultTitle: 'Petugas Survey Lapangan',
    description: 'Input data survei pelanggan baru, penentuan koordinat GPS, geotagging, dan estimasi material awal.',
    modules: ['Survey Pelanggan', 'Master STD Konstruksi (Lihat)']
  },
  pengawas: {
    label: 'Pengawas Teknik',
    badgeVariant: 'warn',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: HardHat,
    defaultTitle: 'Pengawas Teknik Konstruksi & Jaringan',
    description: 'Monitoring opname tiang, bobot fisik jasa lapangan, verifikasi vendor portal, dan penerbitan BAST.',
    modules: ['Pengawasan Lapangan', 'Daftung Monitoring', 'Work Order', 'Kebutuhan Material', 'Master STD']
  },
  admin_gudang: {
    label: 'Admin Gudang',
    badgeVariant: 'ok',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: Warehouse,
    defaultTitle: 'Admin Logistik & Gudang',
    description: 'Pengendalian saldo stok fisik, rekonsiliasi SAP, checklist kontrak material, dan verifikasi Surat Jalan.',
    modules: ['Gudang Stok & SAP', 'Kontrak Material', 'Kebutuhan Material']
  }
};

const UNIT_OPTIONS = [
  'PLN ULP Rangkasbitung',
  'PLN ULP Malingping',
  'PLN ULP Labuan',
  'PLN UP3 Banten Selatan',
  'Gudang Rangkasbitung',
  'Gudang Malingping',
  'Kantor Distribusi Banten'
];

export const UserManagementModule: React.FC = () => {
  const {
    users,
    currentUser,
    addUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    resetUserPassword
  } = usePromotor();

  const { showToast } = useToast();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [unitFilter, setUnitFilter] = useState<string>('all');
  const [showRbacInfo, setShowRbacInfo] = useState(false);

  // Modal States
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [copiedNip, setCopiedNip] = useState<string | null>(null);

  // Forms
  const [formData, setFormData] = useState<{
    name: string;
    nip: string;
    email: string;
    password: string;
    role: UserRole;
    roleTitle: string;
    unit: string;
    phone: string;
    avatar: string;
    status: 'active' | 'inactive';
  }>({
    name: '',
    nip: '',
    email: '',
    password: 'admin',
    role: 'surveyor',
    roleTitle: ROLE_CONFIG.surveyor.defaultTitle,
    unit: 'PLN ULP Rangkasbitung',
    phone: '',
    avatar: '👷‍♂️',
    status: 'active'
  });

  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Delete Dialog State
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    user: UserProfile | null;
  }>({
    isOpen: false,
    user: null
  });

  // KPI Calculations
  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter(u => u.status !== 'inactive').length;
    const inactive = users.filter(u => u.status === 'inactive').length;
    const superadmins = users.filter(u => u.role === 'superadmin').length;
    const surveyors = users.filter(u => u.role === 'surveyor').length;
    const pengawas = users.filter(u => u.role === 'pengawas').length;
    const gudang = users.filter(u => u.role === 'admin_gudang').length;

    return { total, active, inactive, superadmins, surveyors, pengawas, gudang };
  }, [users]);

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchSearch =
        searchTerm === '' ||
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.nip && u.nip.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (u.roleTitle && u.roleTitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (u.unit && u.unit.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && u.status !== 'inactive') ||
        (statusFilter === 'inactive' && u.status === 'inactive');
      const matchUnit = unitFilter === 'all' || u.unit === unitFilter;

      return matchSearch && matchRole && matchStatus && matchUnit;
    });
  }, [users, searchTerm, roleFilter, statusFilter, unitFilter]);

  // Handler: Copy NIP
  const handleCopyNip = (nip?: string) => {
    if (!nip) return;
    navigator.clipboard.writeText(nip);
    setCopiedNip(nip);
    showToast({
      title: 'NIP Disalin',
      message: `NIP ${nip} berhasil disalin ke clipboard`,
      type: 'info'
    });
    setTimeout(() => setCopiedNip(null), 2000);
  };

  // Handler: Open Add Modal
  const openAddModal = () => {
    setFormData({
      name: '',
      nip: '',
      email: '',
      password: 'admin',
      role: 'surveyor',
      roleTitle: ROLE_CONFIG.surveyor.defaultTitle,
      unit: 'PLN ULP Rangkasbitung',
      phone: '',
      avatar: '👷‍♂️',
      status: 'active'
    });
    setAddModalOpen(true);
  };

  // Handler: Submit Add
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast({ title: 'Gagal', message: 'Nama lengkap wajib diisi', type: 'error' });
      return;
    }

    const res = await addUser({
      name: formData.name.trim(),
      nip: formData.nip.trim() || undefined,
      email: formData.email.trim() || undefined,
      password: formData.password || 'admin',
      role: formData.role,
      roleTitle: formData.roleTitle.trim() || ROLE_CONFIG[formData.role].defaultTitle,
      unit: formData.unit,
      phone: formData.phone.trim() || undefined,
      avatar: formData.avatar,
      status: formData.status
    });

    if (res.success) {
      showToast({
        title: 'Berhasil',
        message: `Pengguna ${formData.name} berhasil ditambahkan`,
        type: 'success'
      });
      setAddModalOpen(false);
    } else {
      showToast({
        title: 'Gagal Menambahkan',
        message: res.message || 'Terjadi kesalahan sistem',
        type: 'error'
      });
    }
  };

  // Handler: Open Edit Modal
  const openEditModal = (user: UserProfile) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      nip: user.nip || '',
      email: user.email || '',
      password: user.password || '',
      role: user.role,
      roleTitle: user.roleTitle,
      unit: user.unit,
      phone: user.phone || '',
      avatar: user.avatar || '👤',
      status: user.status || 'active'
    });
    setEditModalOpen(true);
  };

  // Handler: Submit Edit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    if (!formData.name.trim()) {
      showToast({ title: 'Gagal', message: 'Nama lengkap wajib diisi', type: 'error' });
      return;
    }

    const res = await updateUser(selectedUser.id, {
      name: formData.name.trim(),
      nip: formData.nip.trim() || undefined,
      email: formData.email.trim() || undefined,
      role: formData.role,
      roleTitle: formData.roleTitle.trim() || ROLE_CONFIG[formData.role].defaultTitle,
      unit: formData.unit,
      phone: formData.phone.trim() || undefined,
      avatar: formData.avatar,
      status: formData.status
    });

    if (res.success) {
      showToast({
        title: 'Profil Diperbarui',
        message: `Data pengguna ${formData.name} berhasil disimpan`,
        type: 'success'
      });
      setEditModalOpen(false);
      setSelectedUser(null);
    } else {
      showToast({
        title: 'Gagal Memperbarui',
        message: res.message || 'Terjadi kesalahan saat menyimpan',
        type: 'error'
      });
    }
  };

  // Handler: Toggle Status
  const handleToggleStatus = async (user: UserProfile) => {
    const res = await toggleUserStatus(user.id);
    if (res.success) {
      const nextStatus = user.status === 'inactive' ? 'Aktif' : 'Nonaktif';
      showToast({
        title: 'Status Diubah',
        message: `Status akun ${user.name} diubah menjadi ${nextStatus}`,
        type: 'info'
      });
    } else {
      showToast({
        title: 'Gagal Mengubah Status',
        message: res.message || 'Tidak dapat mengubah status akun',
        type: 'error'
      });
    }
  };

  // Handler: Open Password Reset Modal
  const openPasswordModal = (user: UserProfile) => {
    setSelectedUser(user);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordModalOpen(true);
  };

  // Handler: Submit Reset Password
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    if (!newPassword.trim()) {
      showToast({ title: 'Gagal', message: 'Kata sandi baru tidak boleh kosong', type: 'error' });
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast({ title: 'Gagal', message: 'Konfirmasi kata sandi tidak cocok', type: 'error' });
      return;
    }

    const res = await resetUserPassword(selectedUser.id, newPassword);
    if (res.success) {
      showToast({
        title: 'Kata Sandi Di-reset',
        message: `Kata sandi untuk ${selectedUser.name} berhasil diperbarui`,
        type: 'success'
      });
      setPasswordModalOpen(false);
      setSelectedUser(null);
    } else {
      showToast({
        title: 'Gagal Reset',
        message: res.message || 'Gagal mereset kata sandi',
        type: 'error'
      });
    }
  };

  // Handler: Delete User
  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.user) return;
    const res = await deleteUser(deleteConfirm.user.id);
    if (res.success) {
      showToast({
        title: 'Akun Dihapus',
        message: `Akun ${deleteConfirm.user.name} berhasil dihapus dari sistem`,
        type: 'success'
      });
    } else {
      showToast({
        title: 'Gagal Menghapus',
        message: res.message || 'Tidak dapat menghapus akun',
        type: 'error'
      });
    }
    setDeleteConfirm({ isOpen: false, user: null });
  };

  // Export handlers
  const handleExportExcel = () => {
    const exportData = filteredUsers.map((u, i) => ({
      No: i + 1,
      Nama: u.name,
      NIP: u.nip || '-',
      Email: u.email || '-',
      Role: ROLE_CONFIG[u.role]?.label || u.role,
      Jabatan: u.roleTitle,
      Unit: u.unit,
      Telepon: u.phone || '-',
      Status: u.status === 'inactive' ? 'Nonaktif' : 'Aktif',
      'Terdaftar Sejak': u.createdAt ? new Date(u.createdAt).toLocaleDateString('id-ID') : '-'
    }));

    exportToExcel(exportData, 'DAFTAR_PENGGUNA_PLN_PROMOTOR', 'Pengguna');
    showToast({ title: 'Ekspor Selesai', message: 'Daftar pengguna diekspor ke Excel', type: 'success' });
  };

  const handleExportPdf = () => {
    const columns = [
      { header: 'No', dataKey: 'no' },
      { header: 'Nama Pegawai', dataKey: 'name' },
      { header: 'NIP', dataKey: 'nip' },
      { header: 'Role (RBAC)', dataKey: 'role' },
      { header: 'Unit Kerja', dataKey: 'unit' },
      { header: 'Email PLN', dataKey: 'email' },
      { header: 'Status', dataKey: 'status' }
    ];

    const data = filteredUsers.map((u, i) => ({
      no: i + 1,
      name: u.name,
      nip: u.nip || '-',
      role: ROLE_CONFIG[u.role]?.label || u.role,
      unit: u.unit,
      email: u.email || '-',
      status: u.status === 'inactive' ? 'Nonaktif' : 'Aktif'
    }));

    exportToPdf({
      filename: 'DAFTAR_PENGGUNA_PLN_PROMOTOR',
      title: 'DAFTAR PENGGUNA & HAK AKSES SISTEM PROMOTOR',
      subtitle: 'PT PLN (Persero) UP3 BANTEN SELATAN',
      unit: 'UP3 Banten Selatan / ULP Rangkasbitung',
      orientation: 'landscape',
      columns,
      data,
      summaryCards: [
        { label: 'Total Pengguna', value: stats.total },
        { label: 'Super Admin', value: stats.superadmins },
        { label: 'Surveyor', value: stats.surveyors },
        { label: 'Pengawas', value: stats.pengawas },
        { label: 'Admin Gudang', value: stats.gudang }
      ],
      signatureName: currentUser.name,
      signatureTitle: currentUser.roleTitle
    });
    showToast({ title: 'Ekspor Selesai', message: 'Daftar pengguna diekspor ke PDF', type: 'success' });
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-200/60 shadow-xs">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Kelola Pengguna &amp; Hak Akses
                </h1>
                <Badge variant="purple" size="sm">
                  Super Admin Exclusive
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-normal">
                Manajemen akun pegawai, kredensial login, dan otorisasi Role-Based Access Control (RBAC) PLN
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end flex-wrap">
          <button
            type="button"
            onClick={() => setShowRbacInfo(!showRbacInfo)}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
              showRbacInfo
                ? 'bg-purple-50 text-purple-700 border-purple-200'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Info className="w-4 h-4" />
            <span>Matriks RBAC</span>
          </button>

          <ExportDropdown onExportExcel={handleExportExcel} onExportPdf={handleExportPdf} />

          <button
            type="button"
            onClick={openAddModal}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer active:scale-98"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Tambah Pengguna</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Pengguna */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs hover:shadow-sm transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Pengguna</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">{stats.total}</div>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] font-semibold text-emerald-600">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>{stats.active} Aktif</span>
            {stats.inactive > 0 && <span className="text-rose-500">· {stats.inactive} Nonaktif</span>}
          </div>
        </div>

        {/* Super Administrator */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs hover:shadow-sm transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Super Admin</span>
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-700 tracking-tight">{stats.superadmins}</div>
          <div className="text-[11px] text-slate-400 font-medium mt-1 truncate">Otoritas Penuh Sistem</div>
        </div>

        {/* Surveyor */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs hover:shadow-sm transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Surveyor</span>
            <div className="p-2 rounded-lg bg-sky-50 text-sky-600">
              <HardHat className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-sky-700 tracking-tight">{stats.surveyors}</div>
          <div className="text-[11px] text-slate-400 font-medium mt-1 truncate">Input Baseline Lapangan</div>
        </div>

        {/* Pengawas */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs hover:shadow-sm transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pengawas Teknik</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <HardHat className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-700 tracking-tight">{stats.pengawas}</div>
          <div className="text-[11px] text-slate-400 font-medium mt-1 truncate">Opname &amp; Progres Jasa</div>
        </div>

        {/* Admin Gudang */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs hover:shadow-sm transition-all col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Admin Gudang</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <Warehouse className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 tracking-tight">{stats.gudang}</div>
          <div className="text-[11px] text-slate-400 font-medium mt-1 truncate">Stok Fisik &amp; SAP Logistik</div>
        </div>
      </div>

      {/* RBAC Info Accordion / Explainer */}
      {showRbacInfo && (
        <div className="bg-gradient-to-br from-purple-50/50 via-slate-50 to-blue-50/40 rounded-2xl border border-purple-200/80 p-5 shadow-sm animate-fadeIn">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-purple-700" />
              <h2 className="text-sm font-bold text-slate-900">
                Matriks Hak Akses Pengguna (Role-Based Access Control)
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setShowRbacInfo(false)}
              className="text-xs text-slate-400 hover:text-slate-600 font-bold"
            >
              Tutup ✕
            </button>
          </div>
          <p className="text-xs text-slate-600 mb-4 leading-relaxed">
            Sistem PROMOTOR menerapkan pembatasan hak akses berbasis peran secara ketat. Pengguna hanya dapat melihat dan
            mengelola modul yang didelegasikan sesuai peran kedinasan:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {(Object.keys(ROLE_CONFIG) as UserRole[]).map(roleKey => {
              const cfg = ROLE_CONFIG[roleKey];
              const Icon = cfg.icon;

              return (
                <div
                  key={roleKey}
                  className="bg-white rounded-xl border border-slate-200 p-3.5 space-y-2 shadow-2xs"
                >
                  <div className="flex items-center gap-2">
                    <span className={`p-1.5 rounded-lg border text-xs font-bold ${cfg.badgeClass}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-xs font-bold text-slate-900">{cfg.label}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">{cfg.description}</p>
                  <div className="pt-1 border-t border-slate-100">
                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Modul Diizinkan:</div>
                    <div className="flex flex-wrap gap-1">
                      {cfg.modules.map(m => (
                        <span
                          key={m}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium"
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter & Search Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari berdasarkan nama pegawai, NIP, email, jabatan, atau unit..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all bg-white"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Role Filter */}
          <div className="w-full md:w-48">
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              aria-label="Filter Role"
              className="w-full py-2.5 px-3 rounded-xl border border-slate-200 text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
            >
              <option value="all">Semua Role</option>
              <option value="superadmin">Super Admin</option>
              <option value="surveyor">Surveyor</option>
              <option value="pengawas">Pengawas Teknik</option>
              <option value="admin_gudang">Admin Gudang</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="w-full md:w-36">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              aria-label="Filter Status Akun"
              className="w-full py-2.5 px-3 rounded-xl border border-slate-200 text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
            >
              <option value="all">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
          </div>

          {/* Unit Filter */}
          <div className="w-full md:w-48">
            <select
              value={unitFilter}
              onChange={e => setUnitFilter(e.target.value)}
              aria-label="Filter Unit Kerja"
              className="w-full py-2.5 px-3 rounded-xl border border-slate-200 text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
            >
              <option value="all">Semua Unit Kerja</option>
              {UNIT_OPTIONS.map(u => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Toolbar Summary */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <div>
            Menampilkan <span className="font-bold text-slate-800">{filteredUsers.length}</span> dari{' '}
            <span className="font-bold text-slate-800">{users.length}</span> pengguna
          </div>

          {(searchTerm || roleFilter !== 'all' || statusFilter !== 'all' || unitFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setRoleFilter('all');
                setStatusFilter('all');
                setUnitFilter('all');
              }}
              className="text-blue-600 hover:text-blue-800 font-bold hover:underline cursor-pointer"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Users Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4">Pegawai / Profil</th>
                <th className="py-3.5 px-4">Role &amp; Wewenang</th>
                <th className="py-3.5 px-4">Unit Kerja &amp; Kontak</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <UserX className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p className="font-semibold text-slate-600">Tidak ada pengguna yang cocok dengan kriteria filter</p>
                    <p className="text-xs text-slate-400 mt-1">Coba gunakan kata kunci pencarian atau filter yang lain</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, idx) => {
                  const roleCfg = ROLE_CONFIG[user.role] || ROLE_CONFIG.surveyor;
                  const isSelf = currentUser.id === user.id;
                  const isPrimaryAdmin = user.id === 'usr_admin';
                  const isActive = user.status !== 'inactive';

                  return (
                    <tr
                      key={user.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isSelf ? 'bg-blue-50/20' : ''
                      }`}
                    >
                      {/* No */}
                      <td className="py-4 px-4 text-center font-mono text-slate-400 text-xs">
                        {idx + 1}
                      </td>

                      {/* Pegawai / Profil */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-slate-100 border border-slate-200/80 flex items-center justify-center text-xl shrink-0 shadow-2xs">
                            {user.avatar || '👤'}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-900 text-xs sm:text-sm">
                                {user.name}
                              </span>
                              {isSelf && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-700 font-bold border border-blue-200">
                                  Akun Anda
                                </span>
                              )}
                            </div>

                            {/* NIP Pill */}
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-[11px] font-mono text-slate-500">
                                NIP: {user.nip || '—'}
                              </span>
                              {user.nip && (
                                <button
                                  type="button"
                                  onClick={() => handleCopyNip(user.nip)}
                                  className="text-slate-400 hover:text-slate-700 p-0.5 rounded transition-colors"
                                  title="Salin NIP"
                                >
                                  {copiedNip === user.nip ? (
                                    <Check className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              )}
                            </div>

                            {/* Email */}
                            {user.email && (
                              <div className="text-[11px] text-slate-400 truncate flex items-center gap-1">
                                <Mail className="w-2.5 h-2.5" />
                                <span>{user.email}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Role & Wewenang */}
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-bold border ${roleCfg.badgeClass}`}
                          >
                            <roleCfg.icon className="w-3 h-3" />
                            <span>{roleCfg.label}</span>
                          </span>
                          <div className="text-xs text-slate-600 font-medium leading-tight">
                            {user.roleTitle}
                          </div>
                        </div>
                      </td>

                      {/* Unit Kerja & Kontak */}
                      <td className="py-4 px-4">
                        <div className="space-y-0.5">
                          <div className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                            <Building className="w-3 h-3 text-slate-400" />
                            <span>{user.unit}</span>
                          </div>
                          {user.phone ? (
                            <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{user.phone}</span>
                            </div>
                          ) : (
                            <div className="text-[11px] text-slate-400">No. Telp belum diatur</div>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(user)}
                          disabled={isSelf}
                          title={isSelf ? 'Tidak dapat menonaktifkan akun sendiri' : 'Klik untuk mengubah status'}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all ${
                            isSelf ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer hover:scale-102 active:scale-98'
                          } ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                            }`}
                          />
                          <span>{isActive ? 'Aktif' : 'Nonaktif'}</span>
                        </button>
                      </td>

                      {/* Aksi */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Edit User */}
                          <button
                            type="button"
                            onClick={() => openEditModal(user)}
                            className="p-2 rounded-xl text-slate-500 hover:text-blue-700 hover:bg-blue-50 border border-slate-200/80 hover:border-blue-200 transition-all cursor-pointer shadow-2xs"
                            title="Edit Profil & Role"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* Reset Password */}
                          <button
                            type="button"
                            onClick={() => openPasswordModal(user)}
                            className="p-2 rounded-xl text-slate-500 hover:text-amber-700 hover:bg-amber-50 border border-slate-200/80 hover:border-amber-200 transition-all cursor-pointer shadow-2xs"
                            title="Reset Kata Sandi"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete User */}
                          <button
                            type="button"
                            onClick={() => setDeleteConfirm({ isOpen: true, user })}
                            disabled={isSelf || isPrimaryAdmin}
                            className={`p-2 rounded-xl border transition-all shadow-2xs ${
                              isSelf || isPrimaryAdmin
                                ? 'text-slate-300 border-slate-100 cursor-not-allowed opacity-50'
                                : 'text-slate-500 hover:text-rose-700 hover:bg-rose-50 border-slate-200/80 hover:border-rose-200 cursor-pointer'
                            }`}
                            title={
                              isSelf
                                ? 'Tidak bisa menghapus akun yang sedang aktif'
                                : isPrimaryAdmin
                                ? 'Akun Super Administrator utama dilindungi'
                                : 'Hapus Akun Pengguna'
                            }
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Tambah Pengguna Baru */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-600" />
            <span>Tambah Pengguna Baru</span>
          </div>
        }
        maxWidth="xl"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          {/* Avatar Picker & Name */}
          <div className="flex items-start gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Avatar</label>
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 border-2 border-dashed border-blue-400 flex items-center justify-center text-3xl shadow-sm mb-2">
                  {formData.avatar}
                </div>
                <div className="flex flex-wrap gap-1 max-w-[140px] justify-center">
                  {AVATAR_OPTIONS.slice(0, 6).map(av => (
                    <button
                      key={av}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, avatar: av }))}
                      className={`w-6 h-6 rounded-lg text-sm flex items-center justify-center hover:bg-slate-200 transition-all ${
                        formData.avatar === av ? 'bg-blue-100 ring-2 ring-blue-500' : 'bg-slate-50'
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Lengkap Pegawai <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Irfan Hakim, S.T."
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  NIP PLN (18 Digit)
                </label>
                <input
                  type="text"
                  maxLength={18}
                  placeholder="Contoh: 199207242015021002"
                  value={formData.nip}
                  onChange={e => setFormData(prev => ({ ...prev, nip: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>
            </div>
          </div>

          {/* Email & Kata Sandi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email PLN</label>
              <input
                type="email"
                placeholder="nama.pegawai@pln.co.id"
                value={formData.email}
                onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kata Sandi Awal <span className="text-slate-400 font-normal">(Default: admin)</span>
              </label>
              <input
                type="text"
                placeholder="Kata sandi untuk login pertama"
                value={formData.password}
                onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Role &amp; Otorisasi Hak Akses <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(Object.keys(ROLE_CONFIG) as UserRole[]).map(roleKey => {
                const cfg = ROLE_CONFIG[roleKey];
                const isSelected = formData.role === roleKey;
                const Icon = cfg.icon;

                return (
                  <button
                    key={roleKey}
                    type="button"
                    onClick={() =>
                      setFormData(prev => ({
                        ...prev,
                        role: roleKey,
                        roleTitle: cfg.defaultTitle
                      }))
                    }
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/70 shadow-xs ring-1 ring-blue-500'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                      <span className={`text-xs font-bold ${isSelected ? 'text-blue-800' : 'text-slate-700'}`}>
                        {cfg.label}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 line-clamp-1">{cfg.defaultTitle}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Jabatan & Unit Kerja */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nama Jabatan / Title</label>
              <input
                type="text"
                value={formData.roleTitle}
                onChange={e => setFormData(prev => ({ ...prev, roleTitle: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Unit Kerja PLN</label>
              <select
                value={formData.unit}
                onChange={e => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
              >
                {UNIT_OPTIONS.map(u => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Nomor HP & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nomor WhatsApp / HP</label>
              <input
                type="tel"
                placeholder="0812-xxxx-xxxx"
                value={formData.phone}
                onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Status Awal</label>
              <select
                value={formData.status}
                onChange={e => setFormData(prev => ({ ...prev, status: e.target.value as 'active' | 'inactive' }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
              >
                <option value="active">Aktif (Dapat Langsung Login)</option>
                <option value="inactive">Nonaktif (Akses Dikunci)</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAddModalOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              Simpan Pengguna
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Pengguna */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <Edit className="w-5 h-5 text-blue-600" />
            <span>Edit Profil &amp; Hak Akses Pengguna</span>
          </div>
        }
        maxWidth="xl"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {/* Avatar Picker & Name */}
          <div className="flex items-start gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Avatar</label>
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-3xl shadow-sm mb-2">
                  {formData.avatar}
                </div>
                <div className="flex flex-wrap gap-1 max-w-[140px] justify-center">
                  {AVATAR_OPTIONS.map(av => (
                    <button
                      key={av}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, avatar: av }))}
                      className={`w-6 h-6 rounded-lg text-sm flex items-center justify-center hover:bg-slate-200 transition-all ${
                        formData.avatar === av ? 'bg-blue-100 ring-2 ring-blue-500' : 'bg-slate-50'
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Lengkap Pegawai <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">NIP PLN</label>
                <input
                  type="text"
                  maxLength={18}
                  value={formData.nip}
                  onChange={e => setFormData(prev => ({ ...prev, nip: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>
            </div>
          </div>

          {/* Email & Telepon */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email PLN</label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nomor WhatsApp / HP</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Role &amp; Otorisasi Hak Akses
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(Object.keys(ROLE_CONFIG) as UserRole[]).map(roleKey => {
                const cfg = ROLE_CONFIG[roleKey];
                const isSelected = formData.role === roleKey;
                const Icon = cfg.icon;

                return (
                  <button
                    key={roleKey}
                    type="button"
                    onClick={() =>
                      setFormData(prev => ({
                        ...prev,
                        role: roleKey,
                        roleTitle: cfg.defaultTitle
                      }))
                    }
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/70 shadow-xs ring-1 ring-blue-500'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                      <span className={`text-xs font-bold ${isSelected ? 'text-blue-800' : 'text-slate-700'}`}>
                        {cfg.label}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 line-clamp-1">{cfg.defaultTitle}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Jabatan & Unit Kerja */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nama Jabatan</label>
              <input
                type="text"
                value={formData.roleTitle}
                onChange={e => setFormData(prev => ({ ...prev, roleTitle: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Unit Kerja PLN</label>
              <select
                value={formData.unit}
                onChange={e => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
              >
                {UNIT_OPTIONS.map(u => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Status Akun</label>
            <select
              value={formData.status}
              disabled={selectedUser?.id === currentUser.id}
              onChange={e => setFormData(prev => ({ ...prev, status: e.target.value as 'active' | 'inactive' }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white disabled:opacity-50"
            >
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
            {selectedUser?.id === currentUser.id && (
              <p className="text-[10px] text-slate-400 mt-1">
                Anda tidak dapat menonaktifkan akun sendiri yang sedang aktif.
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              Simpan Perubahan
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Reset Password */}
      <Modal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-amber-600" />
            <span>Reset Kata Sandi Pengguna</span>
          </div>
        }
        maxWidth="md"
      >
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div className="p-3 rounded-xl bg-amber-50 text-amber-800 text-xs border border-amber-200/80 leading-relaxed">
            Anda sedang mereset kata sandi untuk akun <span className="font-bold">{selectedUser?.name}</span> (NIP:{' '}
            <span className="font-mono">{selectedUser?.nip || '-'}</span>).
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Kata Sandi Baru <span className="text-rose-500">*</span>
            </label>
            <input
              type="password"
              required
              placeholder="Masukkan kata sandi baru"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Konfirmasi Kata Sandi Baru <span className="text-rose-500">*</span>
            </label>
            <input
              type="password"
              required
              placeholder="Ulangi kata sandi baru"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setNewPassword('admin123');
                setConfirmPassword('admin123');
              }}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
            >
              Gunakan Default: <span className="font-mono">admin123</span>
            </button>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setPasswordModalOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-500/20 transition-all cursor-pointer"
            >
              Perbarui Kata Sandi
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, user: null })}
        onConfirm={handleDeleteConfirm}
        title="Konfirmasi Hapus Akun Pengguna"
        message={
          <div>
            Apakah Anda yakin ingin menghapus akun pegawai{' '}
            <span className="font-bold text-slate-900">{deleteConfirm.user?.name}</span> (NIP:{' '}
            <span className="font-mono">{deleteConfirm.user?.nip || '-'}</span>)?
            <p className="mt-2 text-xs text-rose-600">
              Tindakan ini tidak dapat dibatalkan. Pengguna tidak akan dapat masuk kembali ke sistem PROMOTOR.
            </p>
          </div>
        }
        confirmText="Ya, Hapus Akun"
        cancelText="Batal"
        variant="danger"
      />
    </div>
  );
};
