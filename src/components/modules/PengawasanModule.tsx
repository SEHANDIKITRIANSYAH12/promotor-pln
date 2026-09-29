'use client';

import React, { useState, useMemo } from 'react';
import { usePromotor } from '@/context/PromotorContext';
import { WorkOrderRecord, MaterialItem, JasaProgressState, JasaWeightsState } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useToast } from '@/components/ui/Toast';
import { MapLocationPicker } from '@/components/ui/MapLocationPicker';
import { ExportDropdown } from '@/components/ui/ExportDropdown';
import { exportToExcel, exportToPdf } from '@/lib/exportUtils';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  Boxes,
  Share2,
  Copy,
  Sliders,
  Check,
  Eye,
  ExternalLink,
  Lock,
  Sparkles,
  MapPin,
  Package,
  FileText,
  Truck,
  Layers,
  Calendar,
  Building2,
  Info
} from 'lucide-react';

const JASA_ITEMS = [
  { key: 'tiang', label: '1. Pemancangan / Erection Tiang (20%)', defaultWeight: 20 },
  { key: 'konstruksi', label: '2. Pemasangan Travers & Konstruksi (20%)', defaultWeight: 20 },
  { key: 'penarikan', label: '3. Penarikan Kabel / Stringing (20%)', defaultWeight: 20 },
  { key: 'kerangka', label: '4. Pemasangan Kerangka & Aksesoris (20%)', defaultWeight: 20 },
  { key: 'trafo_app', label: '5. Terminasi Trafo & Box APP (20%)', defaultWeight: 20 },
];

export const PengawasanModule: React.FC = () => {
  const {
    workorders,
    daftung,
    pickupHistory,
    matStock,
    materialProgress,
    jasaProgress,
    tiangProgress,
    combinedComplete,
    updateWOMaterials,
    updateWOJasaProgress,
    updateWOKendala,
    updateWOTiang,
    approveWOForVendor,
    saveBAST
  } = usePromotor();
  const { showToast } = useToast();

  const [selectedSupervisor, setSelectedSupervisor] = useState<string>('Faisal Reza');
  const [search, setSearch] = useState('');

  // Supervisor list
  const supervisorList = useMemo(() => {
    const set = new Set<string>();
    workorders.forEach(w => {
      if (w.pengawas) set.add(w.pengawas);
      if (w.pengawas2) set.add(w.pengawas2);
    });
    const arr = Array.from(set);
    return arr.length ? arr : ['Faisal Reza', 'Winnetou Chandra', 'Hasian Sitorus', 'Yadi Triyadi', 'Rizki Wahyu'];
  }, [workorders]);

  // Selected WO for Modals
  const [activeWoNumber, setActiveWoNumber] = useState<string | null>(null);
  const [modalType, setModalType] = useState<'detail' | 'jasa' | 'material' | 'tiang' | 'reservasi' | 'vendor_share' | null>(null);
  const [detailActiveTab, setDetailActiveTab] = useState<'summary' | 'material' | 'jasa' | 'tiang' | 'sj' | 'location'>('summary');

  // Draft state for Reservasi
  const [draftMaterials, setDraftMaterials] = useState<MaterialItem[]>([]);
  const [editResIndex, setEditResIndex] = useState<number | null>(null);
  const [editResQty, setEditResQty] = useState<number>(0);

  // Vendor Share Modal states
  const [generatedVendorLink, setGeneratedVendorLink] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedWA, setCopiedWA] = useState<boolean>(false);

  // Active WO reference
  const currentWO = useMemo(() => {
    if (!activeWoNumber) return null;
    return workorders.find(w => w.noWo === activeWoNumber) || null;
  }, [workorders, activeWoNumber]);

  // Filtered WOs by supervisor & search
  const supervisorWOs = useMemo(() => {
    return workorders.filter(w => {
      const matchSup = !selectedSupervisor || w.pengawas === selectedSupervisor || w.pengawas2 === selectedSupervisor;
      const matchSearch = !search || 
        w.namaPelanggan.toLowerCase().includes(search.toLowerCase()) ||
        w.noWo.toLowerCase().includes(search.toLowerCase()) ||
        w.vendor.toLowerCase().includes(search.toLowerCase());
      return matchSup && matchSearch;
    });
  }, [workorders, selectedSupervisor, search]);

  const avgJasa = useMemo(() => {
    if (!workorders.length) return 0;
    const sum = workorders.reduce((s, w) => s + jasaProgress(w), 0);
    return Math.round(sum / workorders.length);
  }, [workorders, jasaProgress]);

  // Helper: check if WO has been reserved and approved for vendor
  const isWoReserved = (w: WorkOrderRecord) => {
    return Boolean(w.vendorApproved);
  };

  // Open Detail Modal
  const handleOpenDetailModal = (w: WorkOrderRecord) => {
    setActiveWoNumber(w.noWo);
    setDetailActiveTab('summary');
    setModalType('detail');
  };

  // Open Jasa Modal
  const handleOpenJasaModal = (w: WorkOrderRecord) => {
    setActiveWoNumber(w.noWo);
    setModalType('jasa');
  };

  // Open Material Modal
  const handleOpenMaterialModal = (w: WorkOrderRecord) => {
    setActiveWoNumber(w.noWo);
    setModalType('material');
  };

  // Open Tiang Modal
  const handleOpenTiangModal = (w: WorkOrderRecord) => {
    setActiveWoNumber(w.noWo);
    setModalType('tiang');
  };

  // Open Reservation Modal
  const handleOpenReservation = (w: WorkOrderRecord) => {
    setActiveWoNumber(w.noWo);
    setDraftMaterials(JSON.parse(JSON.stringify(w.materials || [])));
    setModalType('reservasi');
  };

  // Open Vendor Link Modal
  const handleOpenVendorPortalModal = async (w: WorkOrderRecord) => {
    setActiveWoNumber(w.noWo);
    setCopiedLink(false);
    setCopiedWA(false);

    let token = w.vendorToken;
    if (!token) {
      token = await approveWOForVendor(w.noWo);
    }
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    setGeneratedVendorLink(`${origin}/vendor/${token || w.noWo}`);
    setModalType('vendor_share');
  };

  // Save Reservation only
  const handleSaveReservationOnly = async () => {
    if (!currentWO) return;
    await updateWOMaterials(currentWO.noWo, draftMaterials);
    setModalType(null);
    showToast(`Reservasi material untuk Work Order ${currentWO.noWo} berhasil disimpan.`, 'success', 'Reservasi Tersimpan');
  };

  // Save Reservation & Authorize Vendor Link
  const handleSaveReservationAndPublishLink = async () => {
    if (!currentWO) return;
    await updateWOMaterials(currentWO.noWo, draftMaterials);
    const token = await approveWOForVendor(currentWO.noWo);
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    setGeneratedVendorLink(`${origin}/vendor/${token || currentWO.noWo}`);
    setModalType('vendor_share');
    showToast(`Reservasi disimpan dan Link Portal Vendor ${currentWO.vendor} berhasil diterbitkan!`, 'success', 'Link Vendor Aktif');
  };

  // Handle Jasa Checklist Toggle
  const handleToggleJasaIndicator = async (key: string, checked: boolean) => {
    if (!currentWO) return;
    const currentProg: JasaProgressState = currentWO.jasaProgress || {
      tiang: false,
      konstruksi: false,
      penarikan: false,
      kerangka: false,
      trafo_app: false
    };
    const currentWeights: JasaWeightsState = currentWO.jasaWeights || {
      tiang: 20,
      konstruksi: 20,
      penarikan: 20,
      kerangka: 20,
      trafo_app: 20
    };

    const nextProgress = {
      ...currentProg,
      [key]: checked
    };

    await updateWOJasaProgress(currentWO.noWo, nextProgress, currentWeights);
  };

  // Handle Jasa Weight change
  const handleChangeJasaWeight = async (key: string, weightVal: number) => {
    if (!currentWO) return;
    const currentProg: JasaProgressState = currentWO.jasaProgress || {
      tiang: false,
      konstruksi: false,
      penarikan: false,
      kerangka: false,
      trafo_app: false
    };
    const currentWeights: JasaWeightsState = currentWO.jasaWeights || {
      tiang: 20,
      konstruksi: 20,
      penarikan: 20,
      kerangka: 20,
      trafo_app: 20
    };

    const nextWeights = {
      ...currentWeights,
      [key]: Math.max(0, weightVal)
    };

    await updateWOJasaProgress(currentWO.noWo, currentProg, nextWeights);
  };

  // Handle Tiang Verification
  const handleToggleTiangVerify = async (index: number) => {
    if (!currentWO) return;
    const nextRows = JSON.parse(JSON.stringify(currentWO.tiangRows || []));
    if (nextRows[index]) {
      nextRows[index].verified = !nextRows[index].verified;
      if (nextRows[index].verified && !nextRows[index].installedQty) {
        nextRows[index].installedQty = nextRows[index].qtyWO || 1;
      }
    }
    await updateWOTiang(currentWO.noWo, nextRows);
  };

  const handleExportExcel = () => {
    const data = supervisorWOs.map(w => {
      const matP = materialProgress(w);
      const jasaP = jasaProgress(w);
      const tiangP = tiangProgress(w);
      const isDone = combinedComplete(w);

      return {
        noWo: w.noWo,
        namaPelanggan: w.namaPelanggan,
        idpel: w.idpel || '-',
        vendor: w.vendor,
        pengawas: w.pengawas,
        pengawas2: w.pengawas2 || '-',
        kontrakJasa: w.kontrakJasa || '-',
        matProgress: `${matP}%`,
        jasaProgress: `${jasaP}%`,
        tiangProgress: `${tiangP}%`,
        totalStatus: isDone ? 'Tuntas 100%' : 'Dalam Pengerjaan',
        bastStatus: (w.bast?.conditions && Object.keys(w.bast.conditions).length > 0) ? 'Sudah BAST' : 'Belum BAST',
        kendala: w.ketKendala || 'Nihil'
      };
    });

    exportToExcel({
      filename: `LAPORAN_PENGAWASAN_WO_PLN_${selectedSupervisor.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`,
      sheetName: 'PENGAWASAN_WO',
      columns: [
        { header: 'NO WORK ORDER', key: 'noWo', width: 18 },
        { header: 'NAMA PELANGGAN', key: 'namaPelanggan', width: 28 },
        { header: 'IDPEL', key: 'idpel', width: 16 },
        { header: 'VENDOR PELAKSANA', key: 'vendor', width: 25 },
        { header: 'PENGAWAS 1', key: 'pengawas', width: 20 },
        { header: 'PENGAWAS 2', key: 'pengawas2', width: 20 },
        { header: 'KONTRAK SPK', key: 'kontrakJasa', width: 22 },
        { header: 'PROG MATERIAL', key: 'matProgress', width: 15 },
        { header: 'PROG JASA', key: 'jasaProgress', width: 15 },
        { header: 'PROG TIANG', key: 'tiangProgress', width: 15 },
        { header: 'STATUS PROGRESS', key: 'totalStatus', width: 18 },
        { header: 'STATUS BAST', key: 'bastStatus', width: 15 },
        { header: 'CATATAN KENDALA', key: 'kendala', width: 30 }
      ],
      data
    });
    showToast('Laporan Pengawasan berhasil diexport ke Excel!', 'success');
  };

  const handleExportPdf = () => {
    const data = supervisorWOs.map((w, idx) => {
      const matP = materialProgress(w);
      const jasaP = jasaProgress(w);
      const tiangP = tiangProgress(w);
      const isDone = combinedComplete(w);

      return {
        no: idx + 1,
        noWo: w.noWo,
        namaPelanggan: w.namaPelanggan,
        vendor: w.vendor,
        matP: `${matP}%`,
        jasaP: `${jasaP}%`,
        tiangP: `${tiangP}%`,
        status: isDone ? 'Tuntas 100%' : 'Pengerjaan',
        kendala: w.ketKendala || '-'
      };
    });

    exportToPdf({
      filename: `LAPORAN_PENGAWASAN_WORK_ORDER_PLN_${new Date().toISOString().split('T')[0]}`,
      title: 'LAPORAN PENGAWASAN PROGRESS WORK ORDER (3 PILAR FISIK)',
      subtitle: `Monitoring Reservasi Material, Progress Jasa Berbobot, Penanaman Tiang & BAST · Pengawas: ${selectedSupervisor}`,
      unit: 'PLN ULP RANGKASBITUNG',
      orientation: 'landscape',
      columns: [
        { header: 'No', dataKey: 'no' },
        { header: 'No Work Order', dataKey: 'noWo' },
        { header: 'Nama Pelanggan', dataKey: 'namaPelanggan' },
        { header: 'Vendor Pelaksana', dataKey: 'vendor' },
        { header: 'Mat (%)', dataKey: 'matP' },
        { header: 'Jasa (%)', dataKey: 'jasaP' },
        { header: 'Tiang (%)', dataKey: 'tiangP' },
        { header: 'Status Akhir', dataKey: 'status' },
        { header: 'Kendala', dataKey: 'kendala' }
      ],
      data,
      summaryStats: [
        { label: 'Total WO Dipantau', value: `${supervisorWOs.length} Proyek` },
        { label: 'Tuntas 100%', value: `${supervisorWOs.filter(w => combinedComplete(w)).length} WO` },
        { label: 'Rata-rata Jasa', value: `${avgJasa}%` },
        { label: 'Pengawas Bertugas', value: selectedSupervisor }
      ],
      signer: {
        name: selectedSupervisor !== 'Semua Pengawas' ? selectedSupervisor : 'Pengawas Teknik ULP',
        title: 'Pengawas Pekerjaan Distribusi',
        unit: 'PT PLN (Persero) ULP Rangkasbitung'
      }
    });
    showToast('Laporan Pengawasan berhasil diexport ke PDF resmi!', 'success');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Metric Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pengawas Lapangan</div>
            <div className="text-2xl font-black text-slate-800 mt-1">{supervisorList.length}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Petugas Teknik Aktif</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold border border-blue-100">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total WO Dipantau</div>
            <div className="text-2xl font-black text-slate-800 mt-1">{supervisorWOs.length}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">{selectedSupervisor}</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center font-bold border border-slate-200">
            <Boxes className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">WO Tuntas 100%</div>
            <div className="text-2xl font-black text-emerald-700 mt-1">
              {supervisorWOs.filter(w => combinedComplete(w)).length}
            </div>
            <div className="text-[11px] text-emerald-600/80 mt-0.5">3 Pilar Selesai</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold border border-emerald-100">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Rata-rata Progress Jasa</div>
            <div className="text-2xl font-black text-blue-700 mt-1">{avgJasa}%</div>
            <div className="text-[11px] text-blue-600/80 mt-0.5">Seluruh Work Order</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold border border-blue-100">
            <Sliders className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter & Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label className="text-xs font-bold text-slate-700 whitespace-nowrap flex items-center gap-1.5">
            <span>🕵️</span>
            <span>Pilih Pengawas:</span>
          </label>
          <select
            value={selectedSupervisor}
            onChange={e => setSelectedSupervisor(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            {supervisorList.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="w-full sm:w-64 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari pelanggan, WO, vendor..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <ExportDropdown
            onExportExcel={handleExportExcel}
            onExportPdf={handleExportPdf}
            label="Export Pengawasan"
          />
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
            <h3 className="text-sm font-extrabold text-slate-800">
              Daftar Work Order dalam Pengawasan ({supervisorWOs.length})
            </h3>
          </div>
          <p className="text-[11px] text-slate-500">
            💡 <strong>Petunjuk:</strong> Klik pada bar progress atau tombol <strong>Jasa</strong> untuk mencentang indikator pekerjaan fisik berbobot.
          </p>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/90 text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Pelanggan</th>
                <th className="py-3 px-4">No WO</th>
                <th className="py-3 px-4">Vendor Pelaksana</th>
                <th className="py-3 px-4 min-w-[150px]">Progress Material</th>
                <th className="py-3 px-4 min-w-[150px]">Progress Jasa</th>
                <th className="py-3 px-4 min-w-[150px]">Progress Tiang</th>
                <th className="py-3 px-4 min-w-[170px]">Kendala Lapangan</th>
                <th className="py-3 px-4 text-center min-w-[280px]">Aksi Pengawasan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {supervisorWOs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400 text-xs">
                    Tidak ada Work Order yang ditemukan untuk pengawas ini.
                  </td>
                </tr>
              ) : (
                supervisorWOs.map(w => {
                  const pm = materialProgress(w);
                  const pj = jasaProgress(w);
                  const pt = tiangProgress(w);
                  const isDone = combinedComplete(w);
                  const isReserved = isWoReserved(w);

                  return (
                    <tr key={w.noWo} className="hover:bg-slate-50/80 transition-colors">
                      {/* Pelanggan */}
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <button
                          type="button"
                          onClick={() => handleOpenDetailModal(w)}
                          className="text-left group cursor-pointer"
                          title="Klik untuk membuka detail lengkap WO & Pengawasan"
                        >
                          <span className="group-hover:text-blue-600 transition-colors block">
                            {w.namaPelanggan}
                          </span>
                          <span className="block text-[10px] text-slate-400 font-normal">{w.idpel || 'IDPEL -'}</span>
                        </button>
                      </td>

                      {/* No WO */}
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-600 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenDetailModal(w)}
                          className="hover:text-blue-800 hover:underline transition-colors cursor-pointer"
                          title="Klik untuk membuka detail lengkap WO"
                        >
                          {w.noWo}
                        </button>
                      </td>

                      {/* Vendor */}
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        {w.vendor}
                      </td>

                      {/* Progress Material Bar */}
                      <td className="py-3.5 px-4">
                        <ProgressBar
                          percentage={pm}
                          label="Material"
                          onClick={() => handleOpenMaterialModal(w)}
                          variant="emerald"
                        />
                      </td>

                      {/* Progress Jasa Bar */}
                      <td className="py-3.5 px-4">
                        <ProgressBar
                          percentage={pj}
                          label="Jasa"
                          onClick={() => handleOpenJasaModal(w)}
                          variant="blue"
                        />
                      </td>

                      {/* Progress Tiang Bar */}
                      <td className="py-3.5 px-4">
                        <ProgressBar
                          percentage={pt}
                          label="Tiang"
                          onClick={() => handleOpenTiangModal(w)}
                          variant="amber"
                        />
                      </td>

                      {/* Kendala Lapangan Inline Input */}
                      <td className="py-3.5 px-4">
                        <div className="relative">
                          <input
                            type="text"
                            defaultValue={w.ketKendala || ''}
                            onBlur={e => updateWOKendala(w.noWo, e.target.value)}
                            placeholder="Tulis kendala..."
                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs bg-slate-50/60 hover:bg-white focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
                          />
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 min-w-[280px]">
                        <div className="flex flex-col gap-1.5">
                          {/* Row 1: 3 Action Buttons (Detail, Reservasi, Jasa) */}
                          <div className="grid grid-cols-3 gap-1.5">
                            {/* Detail Button */}
                            <button
                              type="button"
                              onClick={() => handleOpenDetailModal(w)}
                              className="py-1.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] border border-slate-200/90 flex items-center justify-center gap-1 transition-all shadow-xs"
                              title="Buka Dashboard & Detail Lengkap Work Order"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-600" />
                              <span>Detail</span>
                            </button>

                            {/* Reservasi Material Button */}
                            <button
                              type="button"
                              onClick={() => handleOpenReservation(w)}
                              className={`py-1.5 px-1.5 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1 transition-all shadow-xs ${
                                isReserved
                                  ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/90'
                                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20'
                              }`}
                              title="Checklist dan validasi reservasi material ke gudang"
                            >
                              <Boxes className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{isReserved ? 'Reservasi' : 'Reservasi'}</span>
                              {isReserved && <Check className="w-3 h-3 text-blue-600 stroke-[3]" />}
                            </button>

                            {/* Input / Update Jasa Button */}
                            <button
                              type="button"
                              onClick={() => handleOpenJasaModal(w)}
                              className="py-1.5 px-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] border border-slate-200/90 flex items-center justify-center gap-1 transition-all shadow-xs"
                              title="Update bobot & progress tahapan fisik pekerjaan konstruksi"
                            >
                              <Sliders className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span className="truncate">Jasa</span>
                              <span className="px-1 py-0.2 rounded bg-white text-slate-700 text-[10px] font-mono border border-slate-200">
                                {pj}%
                              </span>
                            </button>
                          </div>

                          {/* Row 2: Vendor Portal Status / Share Action */}
                          {isReserved ? (
                            <button
                              type="button"
                              onClick={() => handleOpenVendorPortalModal(w)}
                              className="w-full px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100/90 border border-emerald-300 text-emerald-900 text-[11px] font-semibold flex items-center justify-between transition-all group shadow-2xs"
                              title="Material telah direservasi. Klik untuk bagikan tautan portal vendor"
                            >
                              <div className="flex items-center gap-1.5">
                                <span className="relative flex h-2 w-2 shrink-0">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                <span className="font-bold text-emerald-800 truncate">Portal Vendor</span>
                              </div>
                              <div className="flex items-center gap-1 bg-emerald-600 group-hover:bg-emerald-700 text-white px-2 py-0.5 rounded-lg text-[10px] font-bold shadow-xs transition-colors shrink-0">
                                <Share2 className="w-3 h-3" />
                                <span>Bagikan Link</span>
                              </div>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenReservation(w)}
                              className="w-full px-2.5 py-1.5 rounded-xl bg-amber-50/80 hover:bg-amber-100 border border-amber-200/90 text-amber-900 text-[11px] flex items-center justify-between transition-all group"
                              title="Klik untuk reservasi material terlebih dahulu agar portal vendor aktif"
                            >
                              <div className="flex items-center gap-1.5">
                                <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                <span className="font-semibold text-amber-800 truncate">Portal Vendor</span>
                              </div>
                              <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-md border border-amber-200/60 shrink-0 group-hover:bg-amber-200 transition-colors">
                                🔒 Perlu Reservasi
                              </span>
                            </button>
                          )}
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

      {/* -------------------- 0. MODAL DETAIL PENGAWASAN & WORK ORDER -------------------- */}
      {modalType === 'detail' && currentWO && (() => {
        const daftungInfo = daftung.find(d => d.id === currentWO.daftungId || d.noWo === currentWO.noWo || d.idpel === currentWO.idpel);
        const woPickups = pickupHistory.filter(p => p.woNo === currentWO.noWo);
        const pm = materialProgress(currentWO);
        const pj = jasaProgress(currentWO);
        const pt = tiangProgress(currentWO);
        const isReserved = isWoReserved(currentWO);

        return (
          <Modal
            isOpen={true}
            onClose={() => setModalType(null)}
            title={`Dashboard Detail Pengawasan · ${currentWO.noWo}`}
            maxWidth="4xl"
            footer={
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 w-full">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">Aksi Cepat Pengawas:</span>
                  <button
                    type="button"
                    onClick={() => handleOpenReservation(currentWO)}
                    className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200 flex items-center gap-1 transition-colors"
                  >
                    <Boxes className="w-3.5 h-3.5" />
                    <span>Reservasi Material</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenJasaModal(currentWO)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 flex items-center gap-1 transition-colors"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Checklist Jasa ({pj}%)</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {isReserved ? (
                    <button
                      type="button"
                      onClick={() => handleOpenVendorPortalModal(currentWO)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Bagikan Link Vendor</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleOpenReservation(currentWO)}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Reservasi Dulu</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            }
          >
            <div className="space-y-5 text-xs">
              {/* Header Customer Profile Card */}
              <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200/80">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 px-2 py-0.5 rounded-md bg-blue-100/70">
                        {daftungInfo?.jenisTransaksi || 'PASANG BARU'}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-slate-500">
                        IDPEL: {currentWO.idpel || daftungInfo?.idpel || '-'}
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 mt-1.5">
                      {currentWO.namaPelanggan}
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{daftungInfo?.alamat || 'Alamat sesuai data survey & permohonan'}</span>
                    </p>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 sm:text-right shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Vendor Pelaksana</span>
                    <span className="text-xs font-extrabold text-slate-900 block mt-0.5">{currentWO.vendor}</span>
                    <span className="text-[11px] text-slate-500 block mt-1">
                      Pengawas PLN: <strong className="text-slate-800">{currentWO.pengawas}</strong>
                      {currentWO.pengawas2 ? ` & ${currentWO.pengawas2}` : ''}
                    </span>
                  </div>
                </div>

                {/* 4 Pillars Progress Metric Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-4 border-t border-slate-200/70">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Selesai</span>
                    <span className="text-lg font-black font-mono text-slate-900 block mt-0.5">
                      {Math.round((pm * 0.4) + (pj * 0.4) + (pt * 0.2))}%
                    </span>
                  </div>
                  <div className="bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200 text-center">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Material Fisik</span>
                    <span className="text-lg font-black font-mono text-emerald-700 block mt-0.5">{pm}%</span>
                  </div>
                  <div className="bg-blue-50/70 p-2.5 rounded-xl border border-blue-200 text-center">
                    <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">Jasa Konstruksi</span>
                    <span className="text-lg font-black font-mono text-blue-700 block mt-0.5">{pj}%</span>
                  </div>
                  <div className="bg-amber-50/70 p-2.5 rounded-xl border border-amber-200 text-center">
                    <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">Penanaman Tiang</span>
                    <span className="text-lg font-black font-mono text-amber-700 block mt-0.5">{pt}%</span>
                  </div>
                </div>

                {/* Kendala Banner if exists */}
                {currentWO.ketKendala && (
                  <div className="mt-3 p-3 bg-amber-50/90 border border-amber-200/90 rounded-xl flex items-start gap-2.5 text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block text-xs">Catatan Kendala Lapangan:</span>
                      <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">{currentWO.ketKendala}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Sub-tab Navigation */}
              <div className="flex border-b border-slate-200 gap-1 overflow-x-auto pb-1 no-scrollbar">
                {[
                  { id: 'summary', label: 'Ringkasan & Profil', icon: Info },
                  { id: 'material', label: `Material & Gudang (${(currentWO.materials || []).length})`, icon: Package },
                  { id: 'jasa', label: `Fisik Jasa (${pj}%)`, icon: Sliders },
                  { id: 'tiang', label: `Tiang (${(currentWO.tiangRows || []).length})`, icon: Layers },
                  { id: 'sj', label: `Surat Jalan (${woPickups.length})`, icon: Truck },
                  { id: 'location', label: 'Peta & Lokasi', icon: MapPin },
                ].map(tab => {
                  const Icon = tab.icon;
                  const isActive = detailActiveTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setDetailActiveTab(tab.id as any)}
                      className={`px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 whitespace-nowrap transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Sub-tab 1: Ringkasan & Profil */}
              {detailActiveTab === 'summary' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-2">
                      <span className="font-bold text-slate-900 block text-xs border-b border-slate-100 pb-1.5">Informasi Permohonan</span>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Tarif / Daya:</span>
                          <span className="font-bold text-slate-800">{daftungInfo?.tarif || 'R1'} / {daftungInfo?.daya || 1300} VA</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Durasi Hari Kerja:</span>
                          <span className="font-bold text-slate-800">{daftungInfo?.durasiHariKerja || 0} Hari</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Status Sertifikasi:</span>
                          <span className="font-bold text-slate-800">
                            NIDI: {daftungInfo?.nidi ? '✓' : 'Belum'} | SLO: {daftungInfo?.slo ? '✓' : 'Belum'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Status Permohonan:</span>
                          <span className="font-bold text-blue-600">{daftungInfo?.statusPermohonan || 'CETAK PK'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-2">
                      <span className="font-bold text-slate-900 block text-xs border-b border-slate-100 pb-1.5">Informasi Kontrak & Pengawasan</span>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Kontrak Jasa:</span>
                          <span className="font-bold text-slate-800">{currentWO.kontrakJasa || 'SPK Jasa 2026'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Nilai Jasa:</span>
                          <span className="font-bold text-slate-800">Rp {(currentWO.nilaiJasa || 0).toLocaleString('id-ID')}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Vendor Pabrikan Tiang:</span>
                          <span className="font-bold text-slate-800">{currentWO.vendorTiang || 'Pabrikan Rekanan'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Status Otorisasi Vendor:</span>
                          <span className="font-bold text-emerald-600">{isReserved ? '✓ Link Aktif' : 'Terkunci'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-tab 2: Material & Gudang */}
              {detailActiveTab === 'material' && (
                <div className="space-y-3">
                  <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b font-extrabold text-slate-600 text-[11px]">
                        <tr>
                          <th className="p-2.5">Material</th>
                          <th className="p-2.5 text-center">Satuan</th>
                          <th className="p-2.5 text-right">Kebutuhan WO</th>
                          <th className="p-2.5 text-right">Direservasi</th>
                          <th className="p-2.5 text-right">Terverifikasi (SJ)</th>
                          <th className="p-2.5 text-right">Stok Fisik Gudang</th>
                          <th className="p-2.5 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {(currentWO.materials || []).map((m, idx) => {
                          const req = Number(m.required) || 0;
                          const res = Number(m.reserved) || 0;
                          const ver = Number(m.verified) || 0;
                          const stock = matStock(m.code);

                          return (
                            <tr key={idx} className="hover:bg-slate-50/60">
                              <td className="p-2.5 font-bold text-slate-800">
                                {m.name || m.code}
                                <span className="block text-[10px] text-slate-400 font-mono font-normal">{m.code}</span>
                              </td>
                              <td className="p-2.5 text-center text-slate-500">{m.unit}</td>
                              <td className="p-2.5 text-right font-mono font-bold text-slate-800">{req}</td>
                              <td className="p-2.5 text-right font-mono font-bold text-blue-600">{res}</td>
                              <td className="p-2.5 text-right font-mono font-bold text-emerald-600">{ver}</td>
                              <td className="p-2.5 text-right font-mono font-bold text-slate-600">{stock.toLocaleString('id-ID')}</td>
                              <td className="p-2.5 text-center">
                                <Badge variant={ver >= req ? 'ok' : res >= req ? 'info' : 'warn'}>
                                  {ver >= req ? 'Lengkap' : res >= req ? 'Direservasi' : 'Belum Lengkap'}
                                </Badge>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Sub-tab 3: Fisik Jasa */}
              {detailActiveTab === 'jasa' && (
                <div className="space-y-3">
                  <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b font-extrabold text-slate-600 text-[11px]">
                        <tr>
                          <th className="p-3">Tahapan Pekerjaan Jasa</th>
                          <th className="p-3 text-center w-28">Bobot (%)</th>
                          <th className="p-3 text-center w-28">Status Pelaksanaan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {JASA_ITEMS.map(item => {
                          const isChecked = Boolean(currentWO.jasaProgress?.[item.key]);
                          const weight = currentWO.jasaWeights?.[item.key] ?? item.defaultWeight;

                          return (
                            <tr key={item.key} className={isChecked ? 'bg-emerald-50/40' : 'hover:bg-slate-50'}>
                              <td className="p-3 font-semibold text-slate-800">{item.label}</td>
                              <td className="p-3 text-center font-mono font-bold">{weight}%</td>
                              <td className="p-3 text-center">
                                <Badge variant={isChecked ? 'ok' : 'gray'}>
                                  {isChecked ? '✓ Selesai' : 'Belum'}
                                </Badge>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Sub-tab 4: Tiang */}
              {detailActiveTab === 'tiang' && (
                <div className="space-y-3">
                  <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b font-extrabold text-slate-600 text-[11px]">
                        <tr>
                          <th className="p-2.5">Spesifikasi Tiang</th>
                          <th className="p-2.5">Pabrikan</th>
                          <th className="p-2.5 text-center">Target WO</th>
                          <th className="p-2.5 text-center">Terpasang</th>
                          <th className="p-2.5 text-center">Verifikasi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {(currentWO.tiangRows || []).map((t, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2.5 font-bold text-slate-800">{t.name || t.code}</td>
                            <td className="p-2.5 text-slate-600">{t.vendor || currentWO.vendorTiang || 'Pabrikan Rekanan'}</td>
                            <td className="p-2.5 text-center font-mono font-bold">{t.qtyWO || 1} {t.unit || 'btg'}</td>
                            <td className="p-2.5 text-center font-mono font-bold text-blue-600">{t.installedQty || 0}</td>
                            <td className="p-2.5 text-center">
                              <Badge variant={t.verified ? 'ok' : 'gray'}>
                                {t.verified ? '✓ Terverifikasi Tegak' : 'Belum Tegak'}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Sub-tab 5: Riwayat Surat Jalan */}
              {detailActiveTab === 'sj' && (
                <div className="space-y-3">
                  {woPickups.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400">
                      Belum ada Surat Jalan yang di-submit oleh vendor untuk Work Order ini.
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b font-extrabold text-slate-600 text-[11px]">
                          <tr>
                            <th className="p-2.5">Tanggal</th>
                            <th className="p-2.5">No Surat Jalan</th>
                            <th className="p-2.5">Item Material</th>
                            <th className="p-2.5 text-right">Jumlah (Qty)</th>
                            <th className="p-2.5 text-center">Status Verifikasi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {woPickups.map((p, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="p-2.5 text-slate-500">{p.date}</td>
                              <td className="p-2.5 font-mono font-bold text-blue-600">{p.sj}</td>
                              <td className="p-2.5 font-bold text-slate-800">{p.material}</td>
                              <td className="p-2.5 text-right font-mono font-bold">{p.qty}</td>
                              <td className="p-2.5 text-center">
                                <Badge variant={p.verified ? 'ok' : 'warn'}>
                                  {p.verified ? '✓ Terverifikasi Gudang' : 'Menunggu Gudang'}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Sub-tab 6: Peta & Lokasi */}
              {detailActiveTab === 'location' && (
                <div className="space-y-3">
                  <MapLocationPicker
                    lat="-6.52414600"
                    lng="106.17685700"
                    address={daftungInfo?.alamat}
                    customerName={currentWO.namaPelanggan}
                    idpel={currentWO.idpel || daftungInfo?.idpel}
                    readOnly={true}
                    onChangeCoords={() => {}}
                  />
                </div>
              )}
            </div>
          </Modal>
        );
      })()}

      {/* -------------------- 1. MODAL PROGRESS JASA (100% FUNCTIONAL) -------------------- */}
      {modalType === 'jasa' && currentWO && (
        <Modal
          isOpen={true}
          onClose={() => setModalType(null)}
          title={`Progress Pekerjaan Jasa · ${currentWO.noWo}`}
          footer={
            <button
              type="button"
              onClick={() => setModalType(null)}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20"
            >
              Tutup & Simpan
            </button>
          }
        >
          <div className="space-y-4 text-xs">
            {/* Summary Progress Header */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl flex items-center justify-between">
              <div>
                <span className="font-extrabold text-blue-950 block text-sm">Indikator Progress Fisik Lapangan</span>
                <span className="text-[11px] text-blue-700">
                  Centang tahapan pekerjaan yang sudah selesai dilaksanakan di lapangan.
                </span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-blue-600 font-mono">
                  {jasaProgress(currentWO)}%
                </span>
                <span className="block text-[10px] text-slate-400 font-bold uppercase">Total Progress Jasa</span>
              </div>
            </div>

            {/* Checklist Table */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b font-extrabold text-slate-600">
                  <tr>
                    <th className="p-3">Tahapan Pekerjaan Jasa</th>
                    <th className="p-3 text-center w-28">Bobot (%)</th>
                    <th className="p-3 text-center w-28">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {JASA_ITEMS.map(item => {
                    const isChecked = Boolean(currentWO.jasaProgress?.[item.key]);
                    const weight = currentWO.jasaWeights?.[item.key] ?? item.defaultWeight;

                    return (
                      <tr key={item.key} className={isChecked ? 'bg-emerald-50/40' : 'hover:bg-slate-50/50'}>
                        <td className="p-3 font-semibold text-slate-800">
                          <label className="flex items-center gap-3 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={e => handleToggleJasaIndicator(item.key, e.target.checked)}
                              className="w-5 h-5 rounded-lg text-blue-600 focus:ring-blue-500 border-slate-300 transition-all cursor-pointer"
                            />
                            <span className={isChecked ? 'text-emerald-950 font-bold' : 'text-slate-700'}>
                              {item.label}
                            </span>
                          </label>
                        </td>
                        <td className="p-3 text-center">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={weight}
                            onChange={e => handleChangeJasaWeight(item.key, Number(e.target.value) || 0)}
                            className="w-16 text-center py-1 bg-white border border-slate-300 rounded-lg font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          />
                        </td>
                        <td className="p-3 text-center">
                          <Badge variant={isChecked ? 'ok' : 'gray'}>
                            {isChecked ? '✓ Selesai' : 'Belum'}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </Modal>
      )}

      {/* -------------------- 2. MODAL PROGRESS MATERIAL -------------------- */}
      {modalType === 'material' && currentWO && (
        <Modal
          isOpen={true}
          onClose={() => setModalType(null)}
          title={`Detail Progress Material · ${currentWO.noWo}`}
          footer={
            <button
              type="button"
              onClick={() => setModalType(null)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
            >
              Tutup
            </button>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800">
              Progress material dihitung berdasarkan rasio material yang sudah diambil dengan Surat Jalan <b>(Verified)</b> dibandingkan total kebutuhan WO.
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b font-extrabold text-slate-600">
                  <tr>
                    <th className="p-2.5">Nama Material</th>
                    <th className="p-2.5 text-center">Target Kebutuhan</th>
                    <th className="p-2.5 text-center">Terverifikasi (SJ)</th>
                    <th className="p-2.5 text-center">Progress Item</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(currentWO.materials || []).map((m, i) => {
                    const req = Number(m.required) || 0;
                    const ver = Number(m.verified) || 0;
                    const prog = req > 0 ? Math.min(100, Math.round((ver / req) * 100)) : 100;

                    return (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="p-2.5 font-bold text-slate-800">
                          {m.name || m.code}
                          <span className="block text-[10px] text-slate-400 font-normal">{m.code}</span>
                        </td>
                        <td className="p-2.5 text-center font-mono font-bold text-slate-700">{req} {m.unit}</td>
                        <td className="p-2.5 text-center font-mono font-bold text-emerald-600">{ver} {m.unit}</td>
                        <td className="p-2.5 text-center font-mono font-bold">
                          <span className={prog >= 100 ? 'text-emerald-600' : 'text-amber-600'}>
                            {prog}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </Modal>
      )}

      {/* -------------------- 3. MODAL PROGRESS TIANG -------------------- */}
      {modalType === 'tiang' && currentWO && (
        <Modal
          isOpen={true}
          onClose={() => setModalType(null)}
          title={`Detail Penanaman & Penegakan Tiang · ${currentWO.noWo}`}
          footer={
            <button
              type="button"
              onClick={() => setModalType(null)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
            >
              Tutup
            </button>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
              Klik pada checkbox status untuk memvalidasi tiang yang sudah terpasang dan berdiri tegak di lapangan.
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b font-extrabold text-slate-600">
                  <tr>
                    <th className="p-2.5">Spesifikasi Tiang</th>
                    <th className="p-2.5">Vendor Pabrikan</th>
                    <th className="p-2.5 text-center">Target WO</th>
                    <th className="p-2.5 text-center">Terpasang</th>
                    <th className="p-2.5 text-center">Verifikasi Pengawas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(currentWO.tiangRows || []).map((t, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="p-2.5 font-bold text-slate-800">{t.name || t.code}</td>
                      <td className="p-2.5 text-slate-600">{t.vendor || currentWO.vendorTiang || 'Pabrikan Rekanan'}</td>
                      <td className="p-2.5 text-center font-mono font-bold">{t.qtyWO || 1} {t.unit || 'btg'}</td>
                      <td className="p-2.5 text-center font-mono font-bold text-blue-600">{t.installedQty || 0}</td>
                      <td className="p-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleTiangVerify(i)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                            t.verified
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {t.verified ? '✓ Terverifikasi Tegak' : 'Tandai Tegak'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Modal>
      )}

      {/* -------------------- 4. MODAL RESERVASI MATERIAL -------------------- */}
      {modalType === 'reservasi' && currentWO && (
        <Modal
          isOpen={true}
          onClose={() => setModalType(null)}
          title={`Form Validasi & Reservasi Material · ${currentWO.noWo}`}
          maxWidth="4xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveReservationOnly}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                >
                  Simpan Reservasi Saja
                </button>
                <button
                  type="button"
                  onClick={handleSaveReservationAndPublishLink}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all"
                >
                  <Share2 className="w-4 h-4" />
                  <span>✓ Simpan & Terbitkan Link Vendor</span>
                </button>
              </div>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl text-blue-900">
              Bandingkan <strong>Kebutuhan WO</strong> dengan <strong>Stok Fisik Gudang</strong>. Klik <strong>Lanjut (Max)</strong> jika stok mencukupi untuk melakukan reservasi. Tautan vendor akan langsung diaktifkan setelah Anda menyetujui reservasi.
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-72 overflow-y-auto shadow-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b font-extrabold text-slate-600 sticky top-0">
                  <tr>
                    <th className="p-2.5">Material</th>
                    <th className="p-2.5 text-center">Satuan</th>
                    <th className="p-2.5 text-center">Target WO</th>
                    <th className="p-2.5 text-center">Stok Fisik Gudang</th>
                    <th className="p-2.5 text-center">Qty Direservasi</th>
                    <th className="p-2.5 text-center">Status Stok</th>
                    <th className="p-2.5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {draftMaterials.map((m, idx) => {
                    const required = Number(m.required) || 0;
                    const reserved = Number(m.reserved) || 0;
                    const stock = matStock(m.code);
                    const isEnough = stock >= required;

                    return (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-2.5 font-bold text-slate-800">
                          {m.name || m.code}
                          <span className="block text-[10px] text-slate-400 font-normal">{m.code}</span>
                        </td>
                        <td className="p-2.5 text-center text-slate-500">{m.unit}</td>
                        <td className="p-2.5 text-center font-mono font-bold text-slate-800">{required}</td>
                        <td className="p-2.5 text-center font-mono font-semibold">{stock.toLocaleString('id-ID')}</td>
                        <td className="p-2.5 text-center font-mono font-bold text-blue-600">{reserved}</td>
                        <td className="p-2.5 text-center">
                          <Badge variant={isEnough ? 'ok' : 'bad'}>
                            {isEnough ? 'Stok Mencukupi' : 'Stok Kurang'}
                          </Badge>
                        </td>
                        <td className="p-2.5 text-center">
                          {isEnough ? (
                            <button
                              type="button"
                              onClick={() => {
                                const next = [...draftMaterials];
                                next[idx].reserved = next[idx].required;
                                setDraftMaterials(next);
                              }}
                              className="px-3 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold rounded-lg transition-colors"
                            >
                              Lanjut (Max)
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setEditResIndex(idx);
                                setEditResQty(reserved);
                              }}
                              className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold rounded-lg transition-colors"
                            >
                              Edit Qty
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Sub-edit Qty Drawer */}
            {editResIndex !== null && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-amber-900 block">Sesuaikan Qty Reservasi: {draftMaterials[editResIndex]?.name}</span>
                  <span className="text-[11px] text-amber-700">Stok fisik tersedia: {matStock(draftMaterials[editResIndex]?.code)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={editResQty}
                    onChange={e => setEditResQty(Math.max(0, Number(e.target.value) || 0))}
                    className="w-20 px-2 py-1 border rounded-lg font-mono font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const next = [...draftMaterials];
                      next[editResIndex].reserved = editResQty;
                      setDraftMaterials(next);
                      setEditResIndex(null);
                    }}
                    className="px-3 py-1 bg-amber-600 text-white font-bold rounded-lg"
                  >
                    Terapkan
                  </button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* -------------------- 5. MODAL SHARE LINK VENDOR -------------------- */}
      {modalType === 'vendor_share' && currentWO && (
        <Modal
          isOpen={true}
          onClose={() => setModalType(null)}
          title={`Otorisasi & Tautan Akses Vendor · ${currentWO.noWo}`}
          footer={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
              >
                Tutup
              </button>
              <a
                href={generatedVendorLink}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm"
              >
                <span>Buka Portal Vendor</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900">
              <div className="flex items-center gap-2 font-bold mb-1 text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Work Order Telah Direservasi & Disetujui Pengawas</span>
              </div>
              <p className="text-[11px] text-emerald-700 leading-relaxed">
                Vendor pelaksana <strong>({currentWO.vendor})</strong> sekarang dapat membuka portal input Surat Jalan dan memperbarui tahapan pekerjaan tanpa perlu login.
              </p>
            </div>

            {/* Direct Link Section */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700">Tautan Langsung Vendor (URL)</label>
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-bold">Public Secure Link</span>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={generatedVendorLink}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-xs text-slate-700 select-all"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedVendorLink);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 3000);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shrink-0 flex items-center gap-1.5 shadow-xs"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Salin Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* WhatsApp Share Template */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700 flex items-center gap-1.5">
                  <span>📱</span>
                  <span>Template Pesan WhatsApp Rekanan</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const waText = `*SURAT PERINTAH KERJA (WO) PLN - PORTAL MITRA VENDOR*\n\n` +
                      `Halo Rekanan *${currentWO.vendor}*,\n` +
                      `Perintah Kerja berikut telah disetujui untuk dilaksanakan:\n\n` +
                      `📋 *No WO:* ${currentWO.noWo}\n` +
                      `👤 *Pelanggan:* ${currentWO.namaPelanggan}\n` +
                      `🕵️ *Pengawas PLN:* ${currentWO.pengawas}\n\n` +
                      `Silakan input pengambilan material gudang (Surat Jalan) dan update progres penarikan/tiang melalui link berikut:\n` +
                      `👉 ${generatedVendorLink}\n\n` +
                      `_Terima kasih (PLN UP3 / ULP)_`;
                    
                    navigator.clipboard.writeText(waText);
                    setCopiedWA(true);
                    setTimeout(() => setCopiedWA(false), 3000);
                  }}
                  className="text-xs text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedWA ? 'Teks WA Tersalin!' : 'Salin Teks WA'}</span>
                </button>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl font-mono text-[11px] text-slate-600 whitespace-pre-wrap leading-relaxed border border-slate-100">
                {`*SURAT PERINTAH KERJA (WO) PLN - PORTAL MITRA VENDOR*
Halo Rekanan *${currentWO.vendor}*,
No WO: ${currentWO.noWo}
Pelanggan: ${currentWO.namaPelanggan}
Link Akses: ${generatedVendorLink}`}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
