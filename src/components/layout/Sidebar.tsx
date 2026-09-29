'use client';

import React from 'react';
import { usePromotor } from '@/context/PromotorContext';
import {
  Layers,
  ClipboardCheck,
  Users,
  FileText,
  ShieldCheck,
  Warehouse,
  FileSignature,
  BarChart3,
  Zap,
  Lock,
  LogOut
} from 'lucide-react';
import clsx from 'clsx';

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, setMobileOpen }) => {
  const { activeTab, setActiveTab, daftung, surveys, workorders, currentUser, canAccessTab, logout } = usePromotor();

  const allNavItems = [
    { id: 'std', label: 'STD KONSTRUKSI', icon: Layers, desc: 'Master Matriks TM' },
    { id: 'survey', label: 'SURVEY', icon: ClipboardCheck, desc: 'Input & Baseline', count: surveys.length },
    { id: 'daftung', label: 'DAFTUNG', icon: Users, desc: 'Monitoring SLA & TMP', count: daftung.length },
    { id: 'wo', label: 'WORK ORDER', icon: FileText, desc: 'Perintah Kerja', count: workorders.length },
    { id: 'pengawasan', label: 'PENGAWASAN', icon: ShieldCheck, desc: 'Reservasi & Progress' },
    { id: 'gudang', label: 'GUDANG', icon: Warehouse, desc: 'Stok Fisik & SAP' },
    { id: 'contract', label: 'KONTRAK', icon: FileSignature, desc: 'Pagu Jasa & Material' },
    { id: 'material', label: 'KEB MATERIAL', icon: BarChart3, desc: 'Kalkulasi Kekurangan' },
  ];

  // Filter items based on active role permissions
  const visibleNavItems = allNavItems.filter(item => canAccessTab(item.id));

  const handleSelect = (id: string) => {
    setActiveTab(id);
    setMobileOpen(false);
  };

  const roleLabelMap: Record<string, string> = {
    superadmin: 'Super Admin',
    surveyor: 'Surveyor Lapangan',
    pengawas: 'Pengawas Teknik',
    admin_gudang: 'Admin Gudang'
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={clsx(
          'fixed top-0 bottom-0 left-0 z-50 w-72 bg-white border-r border-slate-200/80 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 shadow-subtle',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/pln-logo.png"
              alt="PLN UP3 Banten Selatan"
              className="h-10 w-auto object-contain shrink-0"
            />
            <div className="min-w-0">
              <div className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-1.5">
                PROMOTOR <span className="text-[10px] px-1.5 py-0.5 rounded bg-pln-100 text-pln-700 font-bold">V1.0</span>
              </div>
              <p className="text-[10px] font-medium text-slate-400 truncate">
                Project &amp; Material Control
              </p>
            </div>
          </div>
        </div>

        {/* User Role Quick Info */}
        <div className="mx-3 mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center gap-2.5">
          <span className="text-2xl">{currentUser.avatar || '👤'}</span>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-slate-800 truncate">{currentUser.name}</div>
            <div className="text-[10px] text-pln-700 font-semibold truncate flex items-center gap-1">
              <span>●</span> {roleLabelMap[currentUser.role] || currentUser.role}
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <div className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          <div className="px-3 py-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase flex items-center justify-between">
            <span>Menu Otorisasi ({visibleNavItems.length})</span>
          </div>

          {visibleNavItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className={clsx(
                  'w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left font-medium transition-all group',
                  isActive
                    ? 'bg-pln-50 text-pln-700 font-semibold border border-pln-200/60 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={clsx(
                      'p-2 rounded-lg transition-colors',
                      isActive
                        ? 'bg-pln-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div className="text-xs tracking-tight truncate">{item.label}</div>
                    <div className="text-[10px] text-slate-400 font-normal truncate">{item.desc}</div>
                  </div>
                </div>

                {item.count !== undefined && (
                  <span
                    className={clsx(
                      'text-[10px] px-2 py-0.5 rounded-full font-bold font-mono',
                      isActive ? 'bg-pln-200/80 text-pln-800' : 'bg-slate-100 text-slate-600'
                    )}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer Info */}
        <div className="p-3.5 border-t border-slate-100 bg-slate-50/50 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>RBAC Aktif</span>
            <span className="inline-flex items-center gap-1.5 text-emerald-600 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Role Protected
            </span>
          </div>
          
          <button
            type="button"
            onClick={() => {
              setMobileOpen(false);
              logout();
            }}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 text-xs font-bold transition-colors border border-slate-200 hover:border-rose-200 shadow-2xs cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar (Logout)</span>
          </button>

          <div className="pt-1 flex items-center justify-center gap-1.5 opacity-80">
            <img src="/pln-logo.png" alt="PLN Logo" className="h-4 w-auto object-contain" />
            <span className="text-[10px] text-slate-400 font-semibold">PLN UP3 Banten Selatan</span>
          </div>
        </div>
      </aside>
    </>
  );
};
