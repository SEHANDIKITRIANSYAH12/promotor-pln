'use client';

import React, { useState } from 'react';
import { usePromotor } from '@/context/PromotorContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { StdKonstruksiModule } from '@/components/modules/StdKonstruksiModule';
import { SurveyModule } from '@/components/modules/SurveyModule';
import { DaftungModule } from '@/components/modules/DaftungModule';
import { WorkOrderModule } from '@/components/modules/WorkOrderModule';
import { PengawasanModule } from '@/components/modules/PengawasanModule';
import { VendorModule } from '@/components/modules/VendorModule';
import { GudangModule } from '@/components/modules/GudangModule';
import { KontrakModule } from '@/components/modules/KontrakModule';
import { KebMaterialModule } from '@/components/modules/KebMaterialModule';

import { LoginPage } from '@/components/auth/LoginPage';

export default function HomePage() {
  const { activeTab, loading, isAuthenticated } = usePromotor();
  const [mobileOpen, setMobileOpen] = useState(false);

  // If not authenticated, show login page
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-slate-50/70 flex">
      {/* Sidebar */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0 transition-all duration-300">
        {/* Header */}
        <Header onToggleMobileMenu={() => setMobileOpen(prev => !prev)} />

        {/* Page Body */}
        <main className="p-4 sm:p-8 flex-1 max-w-7xl w-full mx-auto animate-fade-in">
          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
              <div className="w-10 h-10 border-4 border-pln-200 border-t-pln-600 rounded-full animate-spin" />
              <div className="text-xs font-bold text-slate-500">Memuat Sistem PROMOTOR V1.0...</div>
            </div>
          ) : (
            <>
              {activeTab === 'std' && <StdKonstruksiModule />}
              {activeTab === 'survey' && <SurveyModule />}
              {activeTab === 'daftung' && <DaftungModule />}
              {activeTab === 'wo' && <WorkOrderModule />}
              {activeTab === 'pengawasan' && <PengawasanModule />}
              {activeTab === 'vendor' && <VendorModule />}
              {activeTab === 'gudang' && <GudangModule />}
              {activeTab === 'contract' && <KontrakModule />}
              {activeTab === 'material' && <KebMaterialModule />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
