'use client';

import React, { useState, useMemo } from 'react';
import { usePromotor } from '@/context/PromotorContext';
import { DaftungRecord, WorkOrderRecord } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  Users,
  Plus,
  Search,
  Download,
  Clock,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Building,
  Check,
  Eye,
  ShieldAlert,
  Calendar
} from 'lucide-react';
import * as XLSX from 'xlsx';

export const DaftungModule: React.FC = () => {
  const {
    daftung,
    surveys,
    workorders,
    kontrakJasa,
    vendorTiangMaster,
    combinedComplete,
    jasaSisa,
    saveManualDaftung,
    updateDaftungIdpel,
    createWOFromDaftung,
    toggleDaftungFlag,
    setActiveTab
  } = usePromotor();

  const [search, setSearch] = useState('');
  const [slaFilter, setSlaFilter] = useState<string>('all');

  // Manual Daftung Modal
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [manualForm, setManualForm] = useState({
    idpel: '',
    nama: '',
    alamat: '',
    daya: 16500,
    tarif: 'B2T',
    jenisTransaksi: 'PASANG BARU',
    namaup: 'ULP RANGKASBITUNG'
  });

  // Edit IDPEL Modal
  const [idpelModalOpen, setIdpelModalOpen] = useState(false);
  const [editingDaftungId, setEditingDaftungId] = useState<string | null>(null);
  const [tempIdpel, setTempIdpel] = useState('');

  // Apply WO Modal
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [applyDaftung, setApplyDaftung] = useState<DaftungRecord | null>(null);
  const [applyTab, setApplyTab] = useState<'umum' | 'tiang'>('umum');
  const [applyForm, setApplyForm] = useState({
    kontrakJasa: '',
    nilaiJasa: 50000000,
    vendor: 'PT. TRI STARS NUSANTARA',
    pengawas: 'Faisal Reza',
    pengawas2: 'Daud Febriansyah',
    vendorTiang: 'PT Tiang Nusantara',
    tiangQtys: {} as Record<string, number>
  });

  // Detail Modal
  const [detailItem, setDetailItem] = useState<DaftungRecord | null>(null);

  // SLA Calculation Helper
  const parseTargetDays = (str?: string): number | null => {
    if (!str) return null;
    const m = str.match(/(\d+)\s*Hari/i);
    return m ? Number(m[1]) : null;
  };

  const getSlaInfo = (r: DaftungRecord) => {
    const target = parseTargetDays(r.kriteriaTmp);
    const dur = Number(r.durasiHariKerja) || 0;
    if (target === null) return { target: null, dur, remaining: null, status: 'monitor' };
    const remaining = target - dur;
    let status = remaining < 0 ? 'over' : remaining <= 3 ? 'near' : remaining <= 7 ? 'watch' : 'safe';
    return { target, dur, remaining, status };
  };

  const slaStats = useMemo(() => {
    const counts = { over: 0, near: 0, watch: 0, safe: 0, monitor: 0 };
    daftung.forEach(r => {
      const { status } = getSlaInfo(r);
      if (status in counts) counts[status as keyof typeof counts]++;
    });
    return counts;
  }, [daftung]);

  const criticalDaftung = useMemo(() => {
    return daftung
      .map(r => ({ record: r, sla: getSlaInfo(r) }))
      .filter(x => x.sla.status === 'over' || x.sla.status === 'near')
      .sort((a, b) => (a.sla.remaining ?? 999) - (b.sla.remaining ?? 999))
      .slice(0, 6);
  }, [daftung]);

  const getMonitoringStatus = (r: DaftungRecord) => {
    const w = workorders.find(x => String(x.noWo) === String(r.noWo));
    if (!w) return 'Belum WO';
    if (combinedComplete(w)) {
      return r.nidi && r.slo ? 'Selesai' : 'WO Selesai';
    }
    return 'WO Proses';
  };

  const filteredDaftung = useMemo(() => {
    return daftung.filter(r => {
      const sla = getSlaInfo(r);
      if (slaFilter !== 'all' && sla.status !== slaFilter) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        r.nama.toLowerCase().includes(q) ||
        r.idpel.toLowerCase().includes(q) ||
        (r.noWo && r.noWo.toLowerCase().includes(q)) ||
        (r.surveyId && r.surveyId.toLowerCase().includes(q))
      );
    });
  }, [daftung, slaFilter, search]);

  const openApplyWOModal = (r: DaftungRecord) => {
    if (r.noWo) return alert('Pelanggan ini sudah memiliki Work Order');
    if (!r.idpel || r.idpel.startsWith('TMP-')) {
      setEditingDaftungId(r.id);
      setTempIdpel(r.idpel || '');
      setIdpelModalOpen(true);
      return;
    }

    setApplyDaftung(r);
    setApplyTab('umum');
    const defaultKontrak = kontrakJasa[0]?.no || '';
    const defaultVendorTiang = vendorTiangMaster[0] || 'PT Tiang Nusantara';

    // Get survey pole items
    const s = r.surveyId ? surveys.find(x => x.id === r.surveyId) : null;
    const initialTiangQtys: Record<string, number> = {};
    if (s) {
      s.materials.forEach(m => {
        if (/tiang/i.test(m.code + ' ' + m.name) || /\b\d{1,2}\/\d{2,4}\b/.test(m.name)) {
          initialTiangQtys[m.code] = m.qty || 1;
        }
      });
    }

    setApplyForm({
      kontrakJasa: defaultKontrak,
      nilaiJasa: 65000000,
      vendor: 'PT. TRI STARS NUSANTARA',
      pengawas: 'Faisal Reza',
      pengawas2: 'Daud Febriansyah',
      vendorTiang: defaultVendorTiang,
      tiangQtys: initialTiangQtys
    });
    setApplyModalOpen(true);
  };

  const handleCreateWO = async () => {
    if (!applyDaftung) return;
    const c = kontrakJasa.find(x => x.no === applyForm.kontrakJasa);
    if (!c) return alert('Kontrak Jasa wajib dipilih pada Tab Umum');
    if (applyForm.nilaiJasa <= 0) return alert('Nilai Jasa WO harus lebih dari 0');

    const s = applyDaftung.surveyId ? surveys.find(x => x.id === applyDaftung.surveyId) : null;
    const mats = (s?.materials || []).map(m => ({
      code: m.code,
      name: m.name,
      unit: m.unit,
      required: Number(m.qty) || 0,
      reserved: 0,
      verified: 0,
      condition: 'Baik'
    }));

    const poles = (s?.materials || []).filter(
      m => /tiang/i.test(m.code + ' ' + m.name) || /\b\d{1,2}\/\d{2,4}\b/.test(m.name)
    );

    const tiangRows = poles.map(m => ({
      code: m.code,
      name: m.name,
      unit: m.unit || 'batang',
      qtySurvey: m.qty || 0,
      qtyWO: applyForm.tiangQtys[m.code] ?? (m.qty || 0),
      vendor: applyForm.vendorTiang,
      installedQty: 0,
      verifiedQty: 0,
      verified: false,
      progress: 0
    }));

    const noWo = `WO-${String(workorders.length + 1).padStart(3, '0')}`;

    await createWOFromDaftung({
      daftungId: applyDaftung.id,
      noWo,
      namaPelanggan: applyDaftung.nama,
      vendor: applyForm.vendor,
      pengawas: applyForm.pengawas,
      pengawas2: applyForm.pengawas2,
      kontrakJasa: applyForm.kontrakJasa,
      nilaiJasa: applyForm.nilaiJasa,
      vendorTiang: applyForm.vendorTiang,
      surveyId: applyDaftung.surveyId,
      idpel: applyDaftung.idpel,
      materials: mats,
      tiangRows
    });

    setApplyModalOpen(false);
    alert(`Work Order ${noWo} berhasil dibuat!`);
  };

  const handleExportExcel = () => {
    const data = filteredDaftung.map(r => ({
      'IDPEL': r.idpel,
      'NAMA PELANGGAN': r.nama,
      'ALAMAT': r.alamat || '-',
      'ID SURVEY': r.surveyId || 'MANUAL',
      'TGL BAYAR': r.tglBayar || '-',
      'DURASI (HARI)': r.durasiHariKerja,
      'KRITERIA TMP': r.kriteriaTmp || '-',
      'NO WO': r.noWo || '-',
      'STATUS PEKERJAAN': getMonitoringStatus(r),
      'NIDI': r.nidi ? 'Sudah' : 'Belum',
      'SLO': r.slo ? 'Sudah' : 'Belum'
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DAFTUNG_MONITORING');
    XLSX.writeFile(wb, 'DAFTUNG_MONITORING_SLA.xlsx');
  };

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-card">
          <div className="text-[10px] font-bold text-slate-400 uppercase">Total Pelanggan</div>
          <div className="text-xl font-black text-slate-800 mt-1">{daftung.length}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-card">
          <div className="text-[10px] font-bold text-slate-400 uppercase">Belum WO</div>
          <div className="text-xl font-black text-amber-600 mt-1">
            {daftung.filter(r => getMonitoringStatus(r) === 'Belum WO').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-card">
          <div className="text-[10px] font-bold text-slate-400 uppercase">WO Proses</div>
          <div className="text-xl font-black text-pln-600 mt-1">
            {daftung.filter(r => getMonitoringStatus(r) === 'WO Proses').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-card">
          <div className="text-[10px] font-bold text-slate-400 uppercase">WO Selesai</div>
          <div className="text-xl font-black text-emerald-600 mt-1">
            {daftung.filter(r => getMonitoringStatus(r) === 'WO Selesai').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-card">
          <div className="text-[10px] font-bold text-slate-400 uppercase">NIDI Terbit</div>
          <div className="text-xl font-black text-purple-600 mt-1">
            {daftung.filter(r => r.nidi).length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-card">
          <div className="text-[10px] font-bold text-slate-400 uppercase">SLO Terbit</div>
          <div className="text-xl font-black text-indigo-600 mt-1">
            {daftung.filter(r => r.slo).length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-card">
          <div className="text-[10px] font-bold text-slate-400 uppercase">Selesai Total</div>
          <div className="text-xl font-black text-emerald-700 mt-1">
            {daftung.filter(r => getMonitoringStatus(r) === 'Selesai').length}
          </div>
        </div>
      </div>

      {/* SLA Analytics Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* SLA Distribution Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Clock className="w-4 h-4 text-pln-600" />
                <span>Analisis Tingkat Mutu Pelayanan (TMP / SLA)</span>
              </h3>
              <span className="text-[11px] text-slate-400 font-medium">Kategori prioritas hari kerja</span>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-2 my-3">
              {[
                { id: 'all', label: 'Semua', count: daftung.length, color: 'bg-slate-100 text-slate-700' },
                { id: 'over', label: 'Lewat SLA', count: slaStats.over, color: 'bg-rose-50 text-rose-700 border-rose-200' },
                { id: 'near', label: '≤ 3 Hari', count: slaStats.near, color: 'bg-amber-50 text-amber-700 border-amber-200' },
                { id: 'watch', label: '4–7 Hari', count: slaStats.watch, color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
                { id: 'safe', label: '> 7 Hari', count: slaStats.safe, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                { id: 'monitor', label: 'Tanpa Target', count: slaStats.monitor, color: 'bg-slate-50 text-slate-600' }
              ].map(pill => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setSlaFilter(pill.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                    slaFilter === pill.id
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
          <div className="grid grid-cols-5 gap-3 pt-3 border-t border-slate-100">
            {[
              { id: 'over', label: 'Lewat SLA', count: slaStats.over, color: 'bg-rose-500' },
              { id: 'near', label: '≤ 3 Hari', count: slaStats.near, color: 'bg-amber-500' },
              { id: 'watch', label: '4–7 Hari', count: slaStats.watch, color: 'bg-yellow-500' },
              { id: 'safe', label: '> 7 Hari', count: slaStats.safe, color: 'bg-emerald-500' },
              { id: 'monitor', label: 'Lainnya', count: slaStats.monitor, color: 'bg-slate-400' }
            ].map(b => {
              const max = Math.max(1, daftung.length);
              const heightPct = Math.min(100, Math.max(10, Math.round((b.count / max) * 100)));

              return (
                <div
                  key={b.id}
                  onClick={() => setSlaFilter(b.id)}
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

        {/* Critical SLA Priority List */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 text-rose-600">
              <AlertTriangle className="w-4 h-4" />
              <span>Prioritas Perhatian</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-mono font-bold">
              {criticalDaftung.length} Antrian
            </span>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto max-h-[190px]">
            {criticalDaftung.length > 0 ? (
              criticalDaftung.map((item, i) => (
                <div
                  key={i}
                  onClick={() => setDetailItem(item.record)}
                  className="p-2.5 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/80 transition-all cursor-pointer flex items-center justify-between"
                >
                  <div className="truncate pr-2">
                    <div className="text-xs font-bold text-slate-800 truncate">{item.record.nama}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{item.record.idpel}</div>
                  </div>
                  <Badge variant={item.sla.status === 'over' ? 'bad' : 'warn'}>
                    {item.sla.remaining !== null && item.sla.remaining < 0
                      ? `${Math.abs(item.sla.remaining)} hari lewat`
                      : `${item.sla.remaining} hari sisa`}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-slate-400 text-xs">
                Tidak ada Daftung yang kritis.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Table Panel */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setManualModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Daftung Manual</span>
            </button>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari IDPEL, nama, No WO..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pln-500/30 focus:border-pln-500 bg-white w-64"
              />
            </div>

            <button
              type="button"
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Excel</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="p-3.5">IDPEL</th>
                <th className="p-3.5">Nama Pelanggan</th>
                <th className="p-3.5">Survey</th>
                <th className="p-3.5">No WO</th>
                <th className="p-3.5 text-center">Status Pekerjaan</th>
                <th className="p-3.5 text-center">SLA</th>
                <th className="p-3.5 text-center">NIDI</th>
                <th className="p-3.5 text-center">SLO</th>
                <th className="p-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredDaftung.map(r => {
                const sla = getSlaInfo(r);
                const w = r.noWo ? workorders.find(x => x.noWo === r.noWo) : null;
                const woDone = !!w && combinedComplete(w);
                const status = getMonitoringStatus(r);

                return (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-bold font-mono text-slate-900">
                      {r.idpel}
                    </td>
                    <td className="p-3.5 font-bold text-slate-800">{r.nama}</td>
                    <td className="p-3.5">
                      <Badge variant={r.sumber === 'SURVEY' ? 'ok' : 'warn'}>
                        {r.surveyId || 'Manual'}
                      </Badge>
                    </td>
                    <td className="p-3.5 font-mono text-slate-600 font-semibold">
                      {r.noWo || '-'}
                    </td>
                    <td className="p-3.5 text-center">
                      <Badge
                        variant={
                          status === 'Selesai'
                            ? 'ok'
                            : status === 'WO Selesai'
                            ? 'ok'
                            : status === 'WO Proses'
                            ? 'info'
                            : 'gray'
                        }
                      >
                        {status}
                      </Badge>
                    </td>
                    <td className="p-3.5 text-center">
                      <Badge
                        variant={
                          sla.status === 'over'
                            ? 'bad'
                            : sla.status === 'near'
                            ? 'warn'
                            : 'ok'
                        }
                      >
                        {sla.status === 'over'
                          ? 'Lewat SLA'
                          : sla.status === 'near'
                          ? 'Mendekati'
                          : 'Aman'}
                      </Badge>
                    </td>

                    {/* NIDI Toggle */}
                    <td className="p-3.5 text-center">
                      <button
                        type="button"
                        disabled={!woDone}
                        onClick={() => toggleDaftungFlag(r.id, 'nidi', !r.nidi)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                          r.nidi
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : woDone
                            ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            : 'bg-slate-50 text-slate-300 cursor-not-allowed'
                        }`}
                      >
                        {r.nidi ? '✓ NIDI' : 'NIDI'}
                      </button>
                    </td>

                    {/* SLO Toggle */}
                    <td className="p-3.5 text-center">
                      <button
                        type="button"
                        disabled={!woDone}
                        onClick={() => toggleDaftungFlag(r.id, 'slo', !r.slo)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                          r.slo
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : woDone
                            ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            : 'bg-slate-50 text-slate-300 cursor-not-allowed'
                        }`}
                      >
                        {r.slo ? '✓ SLO' : 'SLO'}
                      </button>
                    </td>

                    {/* Action */}
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setDetailItem(r)}
                          className="px-2.5 py-1 rounded-lg bg-pln-50 hover:bg-pln-100 text-pln-700 font-bold text-[11px]"
                        >
                          Detail
                        </button>

                        {!r.noWo ? (
                          <button
                            type="button"
                            onClick={() => openApplyWOModal(r)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-xs"
                          >
                            Apply WO
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setActiveTab('wo')}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px]"
                          >
                            Lihat WO
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Daftung Modal */}
      {manualModalOpen && (
        <Modal
          isOpen={manualModalOpen}
          onClose={() => setManualModalOpen(false)}
          title="Tambah Daftung Manual"
          footer={
            <>
              <button
                type="button"
                onClick={() => setManualModalOpen(false)}
                className="px-4 py-2 rounded-xl border text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!manualForm.idpel || !manualForm.nama) {
                    return alert('IDPEL dan Nama pelanggan wajib diisi');
                  }
                  await saveManualDaftung(manualForm);
                  setManualModalOpen(false);
                  alert('Daftung manual berhasil ditambahkan!');
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold"
              >
                Simpan Daftung
              </button>
            </>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">IDPEL *</label>
              <input
                type="text"
                value={manualForm.idpel}
                onChange={e => setManualForm({ ...manualForm, idpel: e.target.value })}
                placeholder="5621xxxxxxxx"
                className="w-full px-3 py-2 border rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nama Pelanggan *</label>
              <input
                type="text"
                value={manualForm.nama}
                onChange={e => setManualForm({ ...manualForm, nama: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Alamat</label>
              <textarea
                rows={2}
                value={manualForm.alamat}
                onChange={e => setManualForm({ ...manualForm, alamat: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Daya (VA)</label>
              <input
                type="number"
                value={manualForm.daya}
                onChange={e => setManualForm({ ...manualForm, daya: Number(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-xl font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tarif</label>
              <input
                type="text"
                value={manualForm.tarif}
                onChange={e => setManualForm({ ...manualForm, tarif: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl"
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Edit IDPEL Modal */}
      {idpelModalOpen && (
        <Modal
          isOpen={idpelModalOpen}
          onClose={() => setIdpelModalOpen(false)}
          title="Lengkapi IDPEL Sebelum Apply WO"
          footer={
            <>
              <button
                type="button"
                onClick={() => setIdpelModalOpen(false)}
                className="px-4 py-2 rounded-xl border text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!tempIdpel || tempIdpel.startsWith('TMP-')) {
                    return alert('Masukkan IDPEL yang valid');
                  }
                  if (editingDaftungId) {
                    await updateDaftungIdpel(editingDaftungId, tempIdpel);
                  }
                  setIdpelModalOpen(false);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
              >
                Simpan IDPEL
              </button>
            </>
          }
        >
          <div className="space-y-3">
            <div className="p-3 bg-amber-50 border border-amber-200 text-xs text-amber-800 rounded-xl">
              IDPEL opsional pada tahap survey, tetapi <b>wajib diisi valid sebelum Work Order dibuat</b>.
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">IDPEL Resmi PLN *</label>
              <input
                type="text"
                value={tempIdpel}
                onChange={e => setTempIdpel(e.target.value)}
                placeholder="Contoh: 562101594784"
                className="w-full px-3 py-2 border rounded-xl text-xs font-mono font-bold"
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Apply WO Modal with Umum & Tiang Tabs */}
      {applyModalOpen && applyDaftung && (
        <Modal
          isOpen={applyModalOpen}
          onClose={() => setApplyModalOpen(false)}
          title={`Apply Work Order · ${applyDaftung.nama}`}
          maxWidth="2xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <button
                type="button"
                onClick={() => setApplyModalOpen(false)}
                className="px-4 py-2 rounded-xl border text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleCreateWO}
                className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20"
              >
                Buat Work Order (WO)
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            {/* Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <button
                type="button"
                onClick={() => setApplyTab('umum')}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  applyTab === 'umum' ? 'bg-pln-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
                }`}
              >
                Tab 1: Identitas & Kontrak Jasa
              </button>
              <button
                type="button"
                onClick={() => setApplyTab('tiang')}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  applyTab === 'tiang' ? 'bg-pln-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
                }`}
              >
                Tab 2: Alokasi Vendor Tiang
              </button>
            </div>

            {applyTab === 'umum' ? (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Pelanggan</label>
                    <input type="text" readOnly value={applyDaftung.nama} className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-bold" />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">IDPEL</label>
                    <input type="text" readOnly value={applyDaftung.idpel} className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-mono font-bold text-pln-700" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">Kontrak Jasa *</label>
                    <select
                      value={applyForm.kontrakJasa}
                      onChange={e => setApplyForm({ ...applyForm, kontrakJasa: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl bg-white font-semibold"
                    >
                      {kontrakJasa.map(c => (
                        <option key={c.no} value={c.no}>
                          {c.no} — {c.pt} (Sisa: Rp {jasaSisa(c).toLocaleString('id-ID')})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nilai Jasa WO (Rp) *</label>
                    <input
                      type="number"
                      value={applyForm.nilaiJasa}
                      onChange={e => setApplyForm({ ...applyForm, nilaiJasa: Number(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border rounded-xl font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Vendor Pelaksana *</label>
                    <input
                      type="text"
                      value={applyForm.vendor}
                      onChange={e => setApplyForm({ ...applyForm, vendor: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Pengawas 1 *</label>
                    <input
                      type="text"
                      value={applyForm.pengawas}
                      onChange={e => setApplyForm({ ...applyForm, pengawas: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Pengawas 2</label>
                    <input
                      type="text"
                      value={applyForm.pengawas2}
                      onChange={e => setApplyForm({ ...applyForm, pengawas2: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pilih Vendor Tiang *</label>
                  <select
                    value={applyForm.vendorTiang}
                    onChange={e => setApplyForm({ ...applyForm, vendorTiang: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl bg-white font-bold"
                  >
                    {vendorTiangMaster.map(v => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-3 bg-pln-50 border border-pln-100 rounded-xl text-pln-800">
                  Kebutuhan tiang di bawah ditarik otomatis dari Survey. Anda dapat menyesuaikan alokasi Qty untuk WO ini tanpa mengubah data survey.
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Detail Daftung Modal */}
      {detailItem && (
        <Modal
          isOpen={!!detailItem}
          onClose={() => setDetailItem(null)}
          title={`Detail Daftung · ${detailItem.nama}`}
          footer={
            <button
              type="button"
              onClick={() => setDetailItem(null)}
              className="px-4 py-2 rounded-xl border text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              Tutup
            </button>
          }
        >
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">IDPEL</span>
              <span className="font-mono font-bold text-slate-800">{detailItem.idpel}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Tgl Bayar</span>
              <span className="font-bold text-slate-800">{detailItem.tglBayar || '-'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Durasi Hari Kerja</span>
              <span className="font-bold text-slate-800">{detailItem.durasiHariKerja} hari</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Kriteria TMP</span>
              <span className="font-bold text-slate-800">{detailItem.kriteriaTmp || '-'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">No WO</span>
              <span className="font-mono font-bold text-pln-700">{detailItem.noWo || 'Belum dibuat'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">ULP</span>
              <span className="font-bold text-slate-800">{detailItem.namaup || '-'}</span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
