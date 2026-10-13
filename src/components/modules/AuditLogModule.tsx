'use client';

import React, { useState, useMemo } from 'react';
import { usePromotor } from '@/context/PromotorContext';
import { AuditLog, AuditModuleType, AuditLogSeverity } from '@/lib/types';
import {
  History,
  ShieldCheck,
  Search,
  Filter,
  Download,
  Trash2,
  Calendar,
  User,
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Info,
  Layers,
  FileSpreadsheet,
  PlusCircle,
  Eye,
  RefreshCw,
  Sparkles,
  ArrowUpDown
} from 'lucide-react';
import clsx from 'clsx';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export const AuditLogModule: React.FC = () => {
  const { auditLogs, addAuditLog, clearAuditLogs, currentUser, setActiveTab } = usePromotor();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedUser, setSelectedUser] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'timeline'>('table');
  const [selectedLogDetail, setSelectedLogDetail] = useState<AuditLog | null>(null);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [isAddCustomLogOpen, setIsAddCustomLogOpen] = useState(false);

  // Security guard: Only superadmin is allowed to view audit logs
  if (currentUser.role !== 'superadmin') {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center space-y-4 shadow-2xs max-w-lg mx-auto mt-8 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-black text-slate-800">Akses Terbatas: Khusus Super Administrator</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Modul Rekam Jejak Audit ini berisi catatan sensitif integritas data transaksi dan hanya dapat diakses oleh peran <strong>Super Administrator</strong>.
          </p>
        </div>
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('survey')}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            Kembali ke Menu Operasional
          </button>
        </div>
      </div>
    );
  }

  // Custom log form state
  const [customAction, setCustomAction] = useState('VERIFIKASI_MANUAL');
  const [customModule, setCustomModule] = useState<AuditModuleType>('PENGAWASAN');
  const [customSeverity, setCustomSeverity] = useState<AuditLogSeverity>('info');
  const [customDesc, setCustomDesc] = useState('');

  // Module filter options
  const moduleOptions: { value: string; label: string }[] = [
    { value: 'ALL', label: 'Semua Modul' },
    { value: 'SURVEY', label: 'Survey Lapangan' },
    { value: 'DAFTUNG', label: 'Daftung & Perizinan' },
    { value: 'WORK_ORDER', label: 'Work Order (SPK)' },
    { value: 'PENGAWASAN', label: 'Pengawasan & BAST' },
    { value: 'GUDANG', label: 'Logistik & Gudang' },
    { value: 'KONTRAK', label: 'Kontrak & Anggaran' },
    { value: 'STANDAR', label: 'Standar Konstruksi' },
    { value: 'PENGGUNA', label: 'Kelola Pengguna' },
    { value: 'SYSTEM', label: 'Sistem & Database' }
  ];

  // Severity styling helper
  const getSeverityBadge = (severity: AuditLogSeverity) => {
    switch (severity) {
      case 'success':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Sukses
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            Peringatan
          </span>
        );
      case 'danger':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertOctagon className="w-3 h-3 text-rose-600" />
            Kritis / Hapus
          </span>
        );
      case 'info':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Info className="w-3 h-3 text-blue-600" />
            Info
          </span>
        );
    }
  };

  // Module color badge helper
  const getModuleBadge = (mod: AuditModuleType) => {
    const badgeColors: Record<AuditModuleType, string> = {
      SURVEY: 'bg-blue-50 text-blue-700 border-blue-200',
      DAFTUNG: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      WORK_ORDER: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      PENGAWASAN: 'bg-purple-50 text-purple-700 border-purple-200',
      GUDANG: 'bg-amber-50 text-amber-700 border-amber-200',
      KONTRAK: 'bg-rose-50 text-rose-700 border-rose-200',
      STANDAR: 'bg-teal-50 text-teal-700 border-teal-200',
      PENGGUNA: 'bg-violet-50 text-violet-700 border-violet-200',
      SYSTEM: 'bg-slate-100 text-slate-700 border-slate-200'
    };

    return (
      <span
        className={clsx(
          'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border',
          badgeColors[mod] || 'bg-slate-100 text-slate-700 border-slate-200'
        )}
      >
        {mod.replace('_', ' ')}
      </span>
    );
  };

  // Date formatting helper
  const formatDateTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).format(date);
    } catch {
      return isoString;
    }
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Baru saja';
      if (diffMins < 60) return `${diffMins} mnt lalu`;
      if (diffHours < 24) return `${diffHours} jam lalu`;
      if (diffDays === 1) return 'Kemarin';
      return `${diffDays} hari lalu`;
    } catch {
      return '';
    }
  };

  // Filter logs
  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      // Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesDesc = log.description?.toLowerCase().includes(q);
        const matchesAction = log.action?.toLowerCase().includes(q);
        const matchesUser = log.userName?.toLowerCase().includes(q);
        const matchesModule = log.module?.toLowerCase().includes(q);
        if (!matchesDesc && !matchesAction && !matchesUser && !matchesModule) {
          return false;
        }
      }

      // Module filter
      if (selectedModule !== 'ALL' && log.module !== selectedModule) {
        return false;
      }

      // Severity filter
      if (selectedSeverity !== 'ALL' && log.severity !== selectedSeverity) {
        return false;
      }

      // User filter
      if (selectedUser !== 'ALL' && log.userName !== selectedUser) {
        return false;
      }

      return true;
    });
  }, [auditLogs, searchQuery, selectedModule, selectedSeverity, selectedUser]);

  // Distinct users for dropdown filter
  const distinctUsers = useMemo(() => {
    const set = new Set<string>();
    auditLogs.forEach(l => {
      if (l.userName) set.add(l.userName);
    });
    return Array.from(set);
  }, [auditLogs]);

  // Statistics
  const stats = useMemo(() => {
    const total = auditLogs.length;
    const today = new Date().toISOString().split('T')[0];
    const todayCount = auditLogs.filter(l => l.timestamp.startsWith(today)).length;
    const warningOrDanger = auditLogs.filter(l => l.severity === 'warning' || l.severity === 'danger').length;
    
    // Most active user
    const countsByUser: Record<string, number> = {};
    auditLogs.forEach(l => {
      countsByUser[l.userName] = (countsByUser[l.userName] || 0) + 1;
    });
    let topUser = '-';
    let maxCount = 0;
    Object.entries(countsByUser).forEach(([user, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topUser = user;
      }
    });

    return { total, todayCount, warningOrDanger, topUser };
  }, [auditLogs]);

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      alert('Tidak ada log untuk diexport.');
      return;
    }

    const headers = ['ID', 'Waktu (ISO)', 'Waktu Lokal', 'Pengguna', 'Role', 'Modul', 'Aksi', 'Tingkat', 'Keterangan', 'IP / Asal'];
    const rows = filteredLogs.map(l => [
      `"${l.id}"`,
      `"${l.timestamp}"`,
      `"${formatDateTime(l.timestamp)}"`,
      `"${l.userName}"`,
      `"${l.userRole}"`,
      `"${l.module}"`,
      `"${l.action}"`,
      `"${l.severity}"`,
      `"${(l.description || '').replace(/"/g, '""')}"`,
      `"${l.ipAddress || 'Local Client'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Audit_Log_PROMOTOR_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Log this export action
    addAuditLog({
      action: 'EXPORT_AUDIT_LOG',
      module: 'SYSTEM',
      severity: 'info',
      description: `Mengekspor ${filteredLogs.length} baris riwayat audit log ke file CSV`
    });
  };

  // Submit custom log test
  const handleSaveCustomLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customDesc.trim()) return;

    addAuditLog({
      action: customAction.trim().toUpperCase() || 'CUSTOM_ACTION',
      module: customModule,
      severity: customSeverity,
      description: customDesc.trim(),
      metadata: { createdManually: true, byUser: currentUser.name }
    });

    setCustomDesc('');
    setIsAddCustomLogOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-200/80">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200/80">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Sistem Audit &amp; Keamanan Transaksi</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-800 flex items-center gap-2">
            Audit Log &amp; Rekam Jejak Aktivitas
          </h1>
          <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
            Pencatatan real-time seluruh aktivitas operasional: verifikasi survei, penerbitan WO/SPK, mutasi logistik gudang, persetujuan teknis pengawas, hingga pengesahan BAST.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsAddCustomLogOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all border border-slate-200 shadow-2xs cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-emerald-600" />
            <span>Catat Aktivitas</span>
          </button>
          
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-pln-600 hover:bg-pln-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <History className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Log</div>
            <div className="text-xl font-black text-slate-800">{stats.total.toLocaleString()}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Log Hari Ini</div>
            <div className="text-xl font-black text-slate-800">{stats.todayCount}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Perubahan Kritis</div>
            <div className="text-xl font-black text-slate-800">{stats.warningOrDanger}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Paling Aktif</div>
            <div className="text-sm font-black text-slate-800 truncate">{stats.topUser}</div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari aksi, user, atau keterangan..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-pln-500/20 focus:border-pln-500 transition-all text-slate-800 font-medium placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Module Selector */}
            <select
              value={selectedModule}
              onChange={e => setSelectedModule(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-pln-500/20 focus:border-pln-500"
            >
              {moduleOptions.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Severity Selector */}
            <select
              value={selectedSeverity}
              onChange={e => setSelectedSeverity(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-pln-500/20 focus:border-pln-500"
            >
              <option value="ALL">Semua Tingkat</option>
              <option value="info">Info</option>
              <option value="success">Sukses</option>
              <option value="warning">Peringatan</option>
              <option value="danger">Kritis</option>
            </select>

            {/* User Selector */}
            {distinctUsers.length > 0 && (
              <select
                value={selectedUser}
                onChange={e => setSelectedUser(e.target.value)}
                className="px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-pln-500/20 focus:border-pln-500"
              >
                <option value="ALL">Semua Pengguna</option>
                {distinctUsers.map(u => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            )}

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                  viewMode === 'table' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                )}
              >
                Tabel
              </button>
              <button
                type="button"
                onClick={() => setViewMode('timeline')}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                  viewMode === 'timeline' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                )}
              >
                Timeline
              </button>
            </div>

            {/* Reset Logs Button */}
            <button
              type="button"
              onClick={() => setIsClearConfirmOpen(true)}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
              title="Bersihkan Log Lokal"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Result Summary */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
          <div>
            Menampilkan <span className="font-bold text-slate-700">{filteredLogs.length}</span> dari {auditLogs.length} riwayat log
          </div>
          {(selectedModule !== 'ALL' || selectedSeverity !== 'ALL' || selectedUser !== 'ALL' || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedModule('ALL');
                setSelectedSeverity('ALL');
                setSelectedUser('ALL');
              }}
              className="text-pln-700 hover:underline font-bold"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4 w-44">Waktu</th>
                  <th className="py-3 px-4 w-44">Pengguna &amp; Peran</th>
                  <th className="py-3 px-4 w-32">Modul</th>
                  <th className="py-3 px-4 w-36">Aksi</th>
                  <th className="py-3 px-4 min-w-[280px]">Keterangan Aktivitas</th>
                  <th className="py-3 px-4 w-28 text-center">Status</th>
                  <th className="py-3 px-4 w-16 text-center">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <History className="w-8 h-8 text-slate-300" />
                        <div className="font-bold text-slate-600">Tidak ada riwayat aktivitas ditemukan</div>
                        <div className="text-xs text-slate-400 max-w-sm">
                          Coba sesuaikan filter atau kata kunci pencarian Anda.
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors group">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-800 text-[11px]">{formatDateTime(log.timestamp)}</div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatRelativeTime(log.timestamp)}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{log.userAvatar || '👤'}</span>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-800 truncate text-xs">{log.userName}</div>
                            <div className="text-[10px] text-slate-400 capitalize">{log.userRole?.replace('_', ' ')}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">{getModuleBadge(log.module)}</td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-mono text-[11px] font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {log.action}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-700 text-xs">
                        <div className="line-clamp-2 leading-relaxed">{log.description}</div>
                      </td>

                      <td className="py-3 px-4 text-center whitespace-nowrap">{getSeverityBadge(log.severity)}</td>

                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedLogDetail(log)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-pln-700 hover:bg-pln-50 transition-colors"
                          title="Lihat Detail Lengkap"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* TIMELINE VIEW */
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
          {filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <div className="font-bold text-slate-600">Tidak ada riwayat aktivitas ditemukan</div>
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
              {filteredLogs.map(log => {
                const getDotColor = (s: AuditLogSeverity) => {
                  if (s === 'success') return 'bg-emerald-500 ring-emerald-100';
                  if (s === 'warning') return 'bg-amber-500 ring-amber-100';
                  if (s === 'danger') return 'bg-rose-500 ring-rose-100';
                  return 'bg-blue-500 ring-blue-100';
                };

                return (
                  <div key={log.id} className="relative group">
                    {/* Dot */}
                    <div
                      className={clsx(
                        'absolute -left-[27px] top-1.5 w-3.5 h-3.5 rounded-full ring-4 transition-all group-hover:scale-125',
                        getDotColor(log.severity)
                      )}
                    />

                    {/* Card */}
                    <div className="bg-slate-50/70 hover:bg-slate-50 p-4 rounded-xl border border-slate-200/70 transition-all space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{log.userAvatar || '👤'}</span>
                          <span className="font-bold text-slate-800 text-xs">{log.userName}</span>
                          <span className="text-[10px] text-slate-400">({log.userRole?.replace('_', ' ')})</span>
                          {getModuleBadge(log.module)}
                        </div>

                        <div className="flex items-center gap-2">
                          {getSeverityBadge(log.severity)}
                          <span className="text-[11px] font-semibold text-slate-400">{formatDateTime(log.timestamp)}</span>
                        </div>
                      </div>

                      <div className="text-xs text-slate-800 font-medium leading-relaxed">{log.description}</div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                        <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 font-bold text-slate-700">
                          {log.action}
                        </span>
                        {log.metadata && (
                          <button
                            type="button"
                            onClick={() => setSelectedLogDetail(log)}
                            className="text-pln-700 font-bold hover:underline flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Lihat Metadata</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {selectedLogDetail && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-pln-50 text-pln-700">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-sm">Detail Rekam Jejak Audit</h3>
                  <p className="text-[10px] font-mono text-slate-400">{selectedLogDetail.id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLogDetail(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Waktu Log</div>
                  <div className="font-semibold text-slate-800">{formatDateTime(selectedLogDetail.timestamp)}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Modul &amp; Status</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {getModuleBadge(selectedLogDetail.module)}
                    {getSeverityBadge(selectedLogDetail.severity)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Pengguna</div>
                  <div className="font-semibold text-slate-800">
                    {selectedLogDetail.userName} ({selectedLogDetail.userRole})
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Aksi</div>
                  <div className="font-mono font-bold text-slate-800">{selectedLogDetail.action}</div>
                </div>
              </div>

              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Deskripsi Lengkap</div>
                <div className="p-3 bg-white border border-slate-200 rounded-xl text-slate-800 leading-relaxed font-medium">
                  {selectedLogDetail.description}
                </div>
              </div>

              {selectedLogDetail.metadata && (
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Metadata / Payload</div>
                  <pre className="p-3 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-xl overflow-x-auto max-h-48">
                    {JSON.stringify(selectedLogDetail.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedLogDetail(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah Catatan Log Manual */}
      {isAddCustomLogOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-slate-800 text-sm">Catat Aktivitas Manual</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddCustomLogOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCustomLog} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Modul Terkait</label>
                <select
                  value={customModule}
                  onChange={e => setCustomModule(e.target.value as AuditModuleType)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-700"
                >
                  <option value="PENGAWASAN">PENGAWASAN &amp; BAST</option>
                  <option value="SURVEY">SURVEY LAPANGAN</option>
                  <option value="DAFTUNG">DAFTUNG &amp; SLA</option>
                  <option value="WORK_ORDER">WORK ORDER (SPK)</option>
                  <option value="GUDANG">GUDANG &amp; MATERIAL</option>
                  <option value="KONTRAK">KONTRAK</option>
                  <option value="STANDAR">STANDAR KONSTRUKSI</option>
                  <option value="PENGGUNA">KELOLA PENGGUNA &amp; RBAC</option>
                  <option value="SYSTEM">SISTEM &amp; DATABASE</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Tingkat Status (Severity)</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['info', 'success', 'warning', 'danger'] as AuditLogSeverity[]).map(sev => (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setCustomSeverity(sev)}
                      className={clsx(
                        'py-1.5 px-2 rounded-lg text-center font-bold text-[10px] capitalize border transition-all',
                        customSeverity === sev
                          ? 'bg-pln-600 text-white border-pln-600 shadow-2xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      )}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Nama Aksi / Tindakan</label>
                <input
                  type="text"
                  value={customAction}
                  onChange={e => setCustomAction(e.target.value)}
                  placeholder="Misal: VERIFIKASI_LAPANGAN"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Keterangan Aktivitas</label>
                <textarea
                  value={customDesc}
                  onChange={e => setCustomDesc(e.target.value)}
                  rows={3}
                  placeholder="Deskripsikan detail aktivitas yang dilakukan..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddCustomLogOpen(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-pln-600 hover:bg-pln-700 text-white font-bold cursor-pointer shadow-md"
                >
                  Simpan Catatan Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal to Clear Logs */}
      <ConfirmDialog
        isOpen={isClearConfirmOpen}
        title="Bersihkan Seluruh Audit Log Lokal?"
        message="Tindakan ini akan menghapus seluruh rekaman jejak audit dari penyimpanan lokal browser Anda. Apakah Anda yakin ingin melanjutkan?"
        confirmText="Ya, Bersihkan Log"
        cancelText="Batal"
        variant="danger"
        onConfirm={() => {
          clearAuditLogs();
          setIsClearConfirmOpen(false);
        }}
        onClose={() => setIsClearConfirmOpen(false)}
      />
    </div>
  );
};
