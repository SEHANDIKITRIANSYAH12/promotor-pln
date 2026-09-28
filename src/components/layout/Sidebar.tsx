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
  Lock
} from 'lucide-react';
import clsx from 'clsx';

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, setMobileOpen }) => {
  const { activeTab, setActiveTab, daftung, surveys, workorders, currentUser, canAccessTab } = usePromotor();

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
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pln-600 to-pln-500 flex items-center justify-center text-white shadow-md shadow-pln-500/20">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="text-base font-black text-slate-800 tracking-tight flex items-center gap-1.5">
                PROMOTOR <span className="text-xs px-1.5 py-0.5 rounded bg-pln-100 text-pln-700 font-bold">V1.0</span>
              </div>
              <p className="text-[11px] font-medium text-slate-400">
                Project & Material Control
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
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>RBAC Aktif</span>
            <span className="inline-flex items-center gap-1.5 text-emerald-600 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Role Protected
            </span>
          </div>
          <div className="mt-1 text-[10px] text-slate-400 text-center">
            PLN Unit Pelaksana Pelayanan Pelanggan
          </div>
        </div>
      </aside>
    </>
  );
};
