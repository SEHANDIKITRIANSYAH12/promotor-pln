'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Menu, RefreshCw, ChevronDown, Check, ShieldCheck, UserCheck, LogOut } from 'lucide-react';
import { usePromotor } from '@/context/PromotorContext';
import { UserRole } from '@/lib/types';

interface HeaderProps {
  onToggleMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu }) => {
  const { activeTab, loading, isSyncing, refreshData, currentUser, switchRole, availableUsers, logout } = usePromotor();
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setRoleDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const titleMap: Record<string, { title: string; subtitle: string }> = {
    std: { title: 'STD KONSTRUKSI', subtitle: 'Master Database Standard Konstruksi TM & Matriks Kategori' },
    survey: { title: 'SURVEY PELANGGAN', subtitle: 'Proses survey lapangan & kalkulasi material otomatis' },
    daftung: { title: 'DAFTUNG & MONITORING SLA', subtitle: 'Pelacakan durasi hari kerja & kriteria TMP pelanggan' },
    wo: { title: 'WORK ORDER (WO)', subtitle: 'Penerbitan perintah kerja & alokasi kontrak jasa' },
    pengawasan: { title: 'PENGAWASAN & RESERVASI', subtitle: 'Pengawasan progress 3 pilar, bagikan link vendor & Cetak BAST' },
    gudang: { title: 'GUDANG MATERIAL', subtitle: 'Monitoring stok fisik vs SAP & verifikasi Surat Jalan' },
    contract: { title: 'MANAJEMEN KONTRAK', subtitle: 'Kontrol pagu kontrak jasa & pelacakan material in-transit' },
    material: { title: 'KEBUTUHAN MATERIAL (KEB)', subtitle: 'Kalkulasi kekurangan stok riil vs total kebutuhan WO aktif' },
  };

  const current = titleMap[activeTab] || { title: 'PROMOTOR V1.0', subtitle: 'Project Monitoring & Material Control' };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'superadmin':
        return { bg: 'bg-purple-50 text-purple-700 border-purple-200', label: 'Super Admin' };
      case 'surveyor':
        return { bg: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Surveyor' };
      case 'pengawas':
        return { bg: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Pengawas Teknik' };
      case 'admin_gudang':
        return { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Admin Gudang' };
    }
  };

  const currentBadge = getRoleBadge(currentUser.role);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3 flex items-center justify-between shadow-xs">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="p-2 -ml-2 rounded-xl text-slate-600 hover:bg-slate-100 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            {current.title}
            {isSyncing && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-600 border border-blue-100 animate-pulse">
                Syncing...
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-400 font-medium hidden sm:block">
            {current.subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Official PLN Logo Badge */}
        <div className="hidden md:flex items-center gap-2 pr-2 border-r border-slate-200">
          <img
            src="/pln-logo.png"
            alt="PLN UP3 Banten Selatan"
            className="h-8 w-auto object-contain"
          />
        </div>

        {/* Sync Button */}
        <button
          type="button"
          onClick={() => refreshData()}
          disabled={loading || isSyncing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:text-pln-600 hover:border-pln-300 hover:bg-pln-50/50 text-xs font-semibold transition-all shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-pln-600' : ''}`} />
          <span className="hidden sm:inline">Sync Data</span>
        </button>

        {/* RBAC Role Switcher Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
            className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/70 hover:bg-slate-100/80 transition-all text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-base shadow-xs">
              {currentUser.avatar || '👤'}
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-800 leading-tight">{currentUser.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded border font-semibold ${currentBadge.bg}`}>
                  {currentBadge.label}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-normal">{currentUser.unit}</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
          </button>

          {/* Role Dropdown Menu */}
          {roleDropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-fadeIn">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Simulasi Akun & Hak Akses (RBAC)</p>
                <p className="text-xs text-slate-600 mt-0.5">Pilih role untuk menguji tampilan menu & izin aksi:</p>
              </div>

              <div className="p-1 space-y-1">
                {availableUsers.map(user => {
                  const isSelected = user.role === currentUser.role;
                  const badge = getRoleBadge(user.role);

                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => {
                        switchRole(user.role);
                        setRoleDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all ${
                        isSelected
                          ? 'bg-pln-50 border border-pln-200 text-pln-800 font-semibold'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-xl">{user.avatar}</span>
                        <div className="truncate">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold truncate">{user.name}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">{user.roleTitle}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${badge.bg}`}>
                          {badge.label}
                        </span>
                        {isSelected && <Check className="w-4 h-4 text-pln-600" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="p-2 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">
                <div className="text-[10px] text-slate-400">
                  💡 <strong>Info:</strong> Akun Terotentikasi
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setRoleDropdownOpen(false);
                    logout();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors border border-rose-200 shadow-2xs"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Keluar</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
