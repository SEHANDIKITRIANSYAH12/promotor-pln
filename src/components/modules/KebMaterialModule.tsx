'use client';

import React, { useState, useMemo } from 'react';
import { usePromotor } from '@/context/PromotorContext';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { ExportDropdown } from '@/components/ui/ExportDropdown';
import { exportToExcel, exportToPdf } from '@/lib/exportUtils';
import {
  BarChart3,
  Search,
  Download,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Truck,
  Boxes
} from 'lucide-react';
import * as XLSX from 'xlsx';

export const KebMaterialModule: React.FC = () => {
  const { workorders, matStock, transitMaterialMap, totalTransit } = usePromotor();
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ok' | 'warn' | 'bad'>('all');

  // Aggregated material requirement calculation
  const materialAnalysis = useMemo(() => {
    const map: Record<
      string,
      { code: string; name: string; unit: string; woNeed: number; reserved: number }
    > = {};

    workorders.forEach(w => {
      (w.materials || []).forEach(m => {
        if (!map[m.code]) {
          map[m.code] = {
            code: m.code,
            name: m.name || m.code,
            unit: m.unit || 'pcs',
            woNeed: 0,
            reserved: 0
          };
        }
        map[m.code].woNeed += Number(m.required) || 0;
        map[m.code].reserved += Number(m.reserved) || 0;
      });
    });

    return Object.values(map).map(m => {
      const stock = matStock(m.code);
      const remaining = Math.max(0, m.woNeed - m.reserved);
      const available = Math.max(0, stock - m.reserved);
      const inTransit = Number(transitMaterialMap[m.code]) || 0;
      const gap = Math.max(0, remaining - available - inTransit);

      let status: 'ok' | 'warn' | 'bad' = 'ok';
      if (available + inTransit >= remaining) {
        status = 'ok';
      } else if (available > 0) {
        status = 'warn';
      } else {
        status = 'bad';
      }

      return {
        ...m,
        stock,
        remaining,
        available,
        inTransit,
        gap,
        status
      };
    });
  }, [workorders, matStock, transitMaterialMap]);

  // Filtered
  const filteredAnalysis = useMemo(() => {
    return materialAnalysis.filter(m => {
      if (statusFilter !== 'all' && m.status !== statusFilter) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return m.code.toLowerCase().includes(q) || m.name.toLowerCase().includes(q);
    });
  }, [materialAnalysis, statusFilter, search]);

  const countOk = useMemo(() => materialAnalysis.filter(x => x.status === 'ok').length, [materialAnalysis]);
  const countWarn = useMemo(() => materialAnalysis.filter(x => x.status === 'warn').length, [materialAnalysis]);
  const countBad = useMemo(() => materialAnalysis.filter(x => x.status === 'bad').length, [materialAnalysis]);

  const criticalMaterials = useMemo(() => {
    return materialAnalysis
      .filter(x => x.status !== 'ok')
      .sort((a, b) => b.gap - a.gap)
      .slice(0, 6);
  }, [materialAnalysis]);

  const handleExportExcel = () => {
    const data = filteredAnalysis.map(m => ({
      code: m.code,
      name: m.name,
      unit: m.unit,
      woNeed: m.woNeed,
      reserved: m.reserved,
      remaining: m.remaining,
      stock: m.stock,
      available: m.available,
      inTransit: m.inTransit,
      gap: m.gap,
      status: m.status === 'ok' ? 'CUKUP (AMAN)' : m.status === 'warn' ? 'MENIPIS' : 'DEFISIT / HABIS'
    }));

    exportToExcel({
      filename: `LAPORAN_KEBUTUHAN_MATERIAL_PLN_${new Date().toISOString().split('T')[0]}`,
      sheetName: 'KEBUTUHAN_MATERIAL',
      columns: [
        { header: 'KODE SAP', key: 'code', width: 14 },
        { header: 'DESKRIPSI MATERIAL', key: 'name', width: 35 },
        { header: 'SATUAN', key: 'unit', width: 10 },
        { header: 'TOTAL BUTUH WO', key: 'woNeed', width: 16 },
        { header: 'RESERVASI', key: 'reserved', width: 14 },
        { header: 'SISA BUTUH', key: 'remaining', width: 14 },
        { header: 'STOK FISIK', key: 'stock', width: 14 },
        { header: 'STOK TERSEDIA', key: 'available', width: 14 },
        { header: 'IN-TRANSIT', key: 'inTransit', width: 14 },
        { header: 'KEKURANGAN (GAP)', key: 'gap', width: 16 },
        { header: 'STATUS KETERSEDIAAN', key: 'status', width: 20 }
      ],
      data
    });
    showToast('Analisis Kebutuhan Material berhasil diexport ke Excel!', 'success');
  };

  const handleExportPdf = () => {
    const data = filteredAnalysis.map((m, idx) => ({
      no: idx + 1,
      code: m.code,
      name: m.name,
      butuh: `${m.woNeed} ${m.unit}`,
      stok: `${m.stock} ${m.unit}`,
      transit: `${m.inTransit} ${m.unit}`,
      gap: m.gap > 0 ? `-${m.gap} ${m.unit}` : '0',
      status: m.status === 'ok' ? 'Cukup' : m.status === 'warn' ? 'Menipis' : 'Defisit'
    }));

    exportToPdf({
      filename: `LAPORAN_ANALISIS_DEFISIT_MATERIAL_PLN_${new Date().toISOString().split('T')[0]}`,
      title: 'LAPORAN ANALISIS KEBUTUHAN & DEFISIT MATERIAL WORK ORDER',
      subtitle: 'Komparasi Kebutuhan Proyek Aktif vs Stok Fisik Gudang & Alokasi Kontrak Pengadaan (In-Transit)',
      unit: 'PLN ULP RANGKASBITUNG',
      orientation: 'landscape',
      columns: [
        { header: 'No', dataKey: 'no' },
        { header: 'Kode SAP', dataKey: 'code' },
        { header: 'Deskripsi Material', dataKey: 'name' },
        { header: 'Kebutuhan WO', dataKey: 'butuh' },
        { header: 'Stok Fisik', dataKey: 'stok' },
        { header: 'In-Transit', dataKey: 'transit' },
        { header: 'Kekurangan (GAP)', dataKey: 'gap' },
        { header: 'Status', dataKey: 'status' }
      ],
      data,
      summaryStats: [
        { label: 'Total Item Komponen', value: `${materialAnalysis.length} Item` },
        { label: 'Stok Aman (Cukup)', value: `${countOk} Item` },
        { label: 'Stok Menipis', value: `${countWarn} Item` },
        { label: 'Defisit / Perlu PO', value: `${countBad} Item` }
      ],
      signer: {
        name: 'Supervisor Logistik & Gudang',
        title: 'Pengelola Material & Logistik',
        unit: 'PT PLN (Persero) ULP Rangkasbitung'
      }
    });
    showToast('Analisis Kebutuhan Material berhasil diexport ke PDF resmi!', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Jenis Material</div>
            <div className="text-2xl font-black text-slate-800 mt-1">{materialAnalysis.length}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Komponen Diperlukan WO</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-pln-50 text-pln-600 flex items-center justify-center font-bold border border-pln-100">
            <Boxes className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Stok Cukup (Aman)</div>
            <div className="text-2xl font-black text-emerald-700 mt-1">{countOk}</div>
            <div className="text-[11px] text-emerald-600/80 mt-0.5">Stok + In-Transit $\ge$ Kebutuhan</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold border border-emerald-100">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Material Warning</div>
            <div className="text-2xl font-black text-amber-700 mt-1">{countWarn + countBad}</div>
            <div className="text-[11px] text-amber-600/80 mt-0.5">Memerlukan Pengadaan Segera</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold border border-amber-100">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-pln-600 uppercase tracking-wider">Material In-Transit</div>
            <div className="text-2xl font-black text-pln-700 mt-1 font-mono">{totalTransit.toLocaleString('id-ID')}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Dari Kontrak Belum Checklist</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-pln-50 text-pln-600 flex items-center justify-center font-bold border border-pln-100">
            <Truck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Analytics Chart & Priority List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Status Distribution */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-pln-600" />
                <span>Status Ketersediaan Material Riil</span>
              </h3>
              <span className="text-[11px] text-slate-400 font-medium">Klik kategori untuk memfilter tabel</span>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-2 my-3">
              {[
                { id: 'all', label: 'Semua Material', count: materialAnalysis.length, color: 'bg-slate-100 text-slate-700' },
                { id: 'ok', label: 'Cukup (Aman)', count: countOk, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                { id: 'warn', label: 'Menipis / Kurang', count: countWarn, color: 'bg-amber-50 text-amber-700 border-amber-200' },
                { id: 'bad', label: 'Habis / Tidak Cukup', count: countBad, color: 'bg-rose-50 text-rose-700 border-rose-200' }
              ].map(pill => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setStatusFilter(pill.id as any)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                    statusFilter === pill.id
                      ? 'ring-2 ring-pln-500 bg-pln-50 text-pln-700 border-pln-300'
                      : `${pill.color} border-slate-200/70 hover:opacity-80`
                  }`}
                >
                  <span>{pill.label}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-white/80">
                    {pill.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Bar Chart Representation */}
          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100">
            {[
              { id: 'ok', label: 'Cukup', count: countOk, color: 'bg-emerald-500' },
              { id: 'warn', label: 'Menipis', count: countWarn, color: 'bg-amber-500' },
              { id: 'bad', label: 'Habis / Kurang', count: countBad, color: 'bg-rose-500' }
            ].map(b => {
              const max = Math.max(1, materialAnalysis.length);
              const heightPct = Math.min(100, Math.max(12, Math.round((b.count / max) * 100)));

              return (
                <div
                  key={b.id}
                  onClick={() => setStatusFilter(b.id as any)}
                  className="flex flex-col items-center cursor-pointer group"
                >
                  <span className="text-xs font-bold text-slate-700 group-hover:text-pln-600 font-mono">
                    {b.count}
                  </span>
                  <div className="w-full bg-slate-100 h-16 rounded-xl flex items-end p-1 my-1.5 overflow-hidden">
                    <div
                      className={`w-full rounded-lg transition-all duration-300 group-hover:opacity-90 ${b.color}`}
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium text-center truncate w-full">
                    {b.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Critical Priority Gap List */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 text-rose-600">
              <AlertCircle className="w-4 h-4" />
              <span>Kekurangan Tertinggi (GAP)</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-mono font-bold">
              {criticalMaterials.length} Item
            </span>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto max-h-[190px]">
            {criticalMaterials.length > 0 ? (
              criticalMaterials.map((m, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50/80 transition-all flex items-center justify-between"
                >
                  <div className="truncate pr-2">
                    <div className="text-xs font-bold text-slate-800 truncate">{m.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">Kode {m.code}</div>
                  </div>
                  <Badge variant={m.status === 'bad' ? 'bad' : 'warn'}>
                    Kurang {m.gap.toLocaleString('id-ID')} {m.unit}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-slate-400 text-xs">
                Semua stok material dalam kondisi cukup!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Table Panel */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
          <div className="text-xs font-bold text-slate-700">
            Matriks Analisis Kebutuhan Material Terhadap Work Order
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari kode / deskripsi..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pln-500/30 focus:border-pln-500 bg-white w-64"
              />
            </div>

            <ExportDropdown
              onExportExcel={handleExportExcel}
              onExportPdf={handleExportPdf}
              label="Export Kebutuhan"
            />
          </div>
        </div>

        {/* Notice Formula */}
        <div className="px-5 py-3 bg-pln-50/70 border-b border-pln-100 flex items-center justify-between text-xs text-pln-800">
          <span>
            <b>Formula Kekurangan (GAP):</b> (Kebutuhan WO − Reserved) − Available − Material In Transit. Material In Transit ditarik otomatis dari item Kontrak Material yang belum di-checklist Admin Gudang.
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="p-3.5">Kode</th>
                <th className="p-3.5">Material</th>
                <th className="p-3.5 text-center">Satuan</th>
                <th className="p-3.5 text-center">Kebutuhan WO</th>
                <th className="p-3.5 text-center">Sudah Reserved</th>
                <th className="p-3.5 text-center">Sisa Kebutuhan</th>
                <th className="p-3.5 text-center">Stok Fisik</th>
                <th className="p-3.5 text-center">Available</th>
                <th className="p-3.5 text-center">In Transit</th>
                <th className="p-3.5 text-center">Kekurangan (GAP)</th>
                <th className="p-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredAnalysis.map(m => (
                <tr key={m.code} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3.5 font-bold font-mono text-slate-900">{m.code}</td>
                  <td className="p-3.5 font-medium text-slate-800">{m.name}</td>
                  <td className="p-3.5 text-center text-slate-500">{m.unit}</td>
                  <td className="p-3.5 text-center font-mono font-semibold">{m.woNeed.toLocaleString('id-ID')}</td>
                  <td className="p-3.5 text-center font-mono font-semibold text-slate-600">{m.reserved.toLocaleString('id-ID')}</td>
                  <td className="p-3.5 text-center font-mono font-bold text-slate-800">{m.remaining.toLocaleString('id-ID')}</td>
                  <td className="p-3.5 text-center font-mono font-semibold">{m.stock.toLocaleString('id-ID')}</td>
                  <td className="p-3.5 text-center font-mono font-bold text-emerald-700">{m.available.toLocaleString('id-ID')}</td>
                  <td className="p-3.5 text-center font-mono font-bold text-amber-700">{m.inTransit.toLocaleString('id-ID')}</td>
                  <td className="p-3.5 text-center font-mono font-bold text-rose-700">
                    {m.gap > 0 ? m.gap.toLocaleString('id-ID') : '—'}
                  </td>
                  <td className="p-3.5 text-center">
                    <Badge variant={m.status === 'ok' ? 'ok' : m.status === 'warn' ? 'warn' : 'bad'}>
                      {m.status === 'ok' ? 'Cukup' : m.status === 'warn' ? 'Menipis' : 'Habis / Kurang'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
