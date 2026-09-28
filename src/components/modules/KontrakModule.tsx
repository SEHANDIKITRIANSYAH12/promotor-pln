'use client';

import React, { useState, useMemo } from 'react';
import { usePromotor } from '@/context/PromotorContext';
import { KontrakJasaRecord, KontrakMaterialRecord, KontrakMaterialItem } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  FileSignature,
  Search,
  Plus,
  Download,
  Upload,
  CheckCircle2,
  Clock,
  DollarSign,
  Boxes,
  Truck,
  Edit,
  Trash2
} from 'lucide-react';
import * as XLSX from 'xlsx';

export const KontrakModule: React.FC = () => {
  const {
    kontrakJasa,
    kontrakMaterial,
    gudang,
    jasaTerpakai,
    jasaSisa,
    totalTransit,
    transitMaterialMap,
    saveKontrakJasa,
    saveKontrakMaterial,
    toggleKontrakMaterialCheck
  } = usePromotor();

  const [activeSubTab, setActiveSubTab] = useState<'jasa' | 'material'>('jasa');
  const [search, setSearch] = useState('');

  // Jasa Modal Form
  const [jasaModalOpen, setJasaModalOpen] = useState(false);
  const [editingJasa, setEditingJasa] = useState<KontrakJasaRecord | null>(null);

  // Material Contract Modal Form
  const [matContractModalOpen, setMatContractModalOpen] = useState(false);
  const [editingMatContract, setEditingMatContract] = useState<KontrakMaterialRecord | null>(null);

  // Material Checklist Detail Modal
  const [checklistContract, setChecklistContract] = useState<KontrakMaterialRecord | null>(null);
  const [newMatItemCode, setNewMatItemCode] = useState('');
  const [newMatItemQty, setNewMatItemQty] = useState(10);
  const [newMatItemUnit, setNewMatItemUnit] = useState('pcs');

  const contractDateStatus = (awal: string, akhir: string) => {
    const now = new Date();
    const a = new Date(awal);
    const b = new Date(akhir);
    if (now < a) return 'Belum Mulai';
    if (now > b) return 'Expired';
    return 'Aktif';
  };

  // Metrics Jasa
  const totalPaguJasa = useMemo(() => kontrakJasa.reduce((s, c) => s + (Number(c.nilai) || 0), 0), [kontrakJasa]);
  const totalTerpakaiJasa = useMemo(
    () => kontrakJasa.reduce((s, c) => s + jasaTerpakai(c.no), 0),
    [kontrakJasa, jasaTerpakai]
  );
  const totalSisaJasa = totalPaguJasa - totalTerpakaiJasa;

  const filteredJasa = useMemo(() => {
    if (!search) return kontrakJasa;
    const q = search.toLowerCase();
    return kontrakJasa.filter(c => c.no.toLowerCase().includes(q) || c.pt.toLowerCase().includes(q));
  }, [kontrakJasa, search]);

  const filteredMaterial = useMemo(() => {
    if (!search) return kontrakMaterial;
    const q = search.toLowerCase();
    return kontrakMaterial.filter(c => c.no.toLowerCase().includes(q) || c.pt.toLowerCase().includes(q));
  }, [kontrakMaterial, search]);

  const handleExportExcel = () => {
    if (activeSubTab === 'jasa') {
      const data = filteredJasa.map(c => ({
        'NOMOR SPK': c.no,
        'NAMA PT': c.pt,
        'DESKRIPSI': c.desc,
        'TGL AWAL': c.awal,
        'TGL AKHIR': c.akhir,
        'NILAI PAGU': c.nilai,
        'TERPAKAI WO': jasaTerpakai(c.no),
        'SISA NILAI': jasaSisa(c),
        'STATUS': contractDateStatus(c.awal, c.akhir)
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'KONTRAK_JASA');
      XLSX.writeFile(wb, 'DATA_KONTRAK_JASA.xlsx');
    } else {
      const data = filteredMaterial.map(c => ({
        'NOMOR SPK': c.no,
        'NAMA PT': c.pt,
        'DESKRIPSI': c.desc,
        'TGL AWAL': c.awal,
        'TGL AKHIR': c.akhir,
        'NILAI': c.nilai,
        'JUMLAH ITEM': c.materials.length,
        'IN TRANSIT': c.materials.filter(m => !m.checked).reduce((s, m) => s + (Number(m.qty) || 0), 0),
        'STATUS': contractDateStatus(c.awal, c.akhir)
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'KONTRAK_MATERIAL');
      XLSX.writeFile(wb, 'DATA_KONTRAK_MATERIAL.xlsx');
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveSubTab('jasa')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeSubTab === 'jasa'
              ? 'bg-pln-600 text-white shadow-md shadow-pln-600/20'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Kontrak Jasa Pelaksana</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('material')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeSubTab === 'material'
              ? 'bg-pln-600 text-white shadow-md shadow-pln-600/20'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Kontrak Pengadaan Material (In-Transit)</span>
        </button>
      </div>

      {/* Sub Tab 1: Kontrak Jasa */}
      {activeSubTab === 'jasa' && (
        <div className="space-y-6">
          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Kontrak Jasa</div>
              <div className="text-2xl font-black text-slate-800 mt-1">{kontrakJasa.length}</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card">
              <div className="text-xs font-semibold text-pln-600 uppercase tracking-wider">Total Pagu Anggaran</div>
              <div className="text-xl font-black text-pln-700 mt-1 font-mono">Rp {totalPaguJasa.toLocaleString('id-ID')}</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card">
              <div className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Terpakai Work Order</div>
              <div className="text-xl font-black text-amber-700 mt-1 font-mono">Rp {totalTerpakaiJasa.toLocaleString('id-ID')}</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card">
              <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Sisa Pagu Tersedia</div>
              <div className="text-xl font-black text-emerald-700 mt-1 font-mono">Rp {totalSisaJasa.toLocaleString('id-ID')}</div>
            </div>
          </div>

          {/* Table Panel */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
              <button
                type="button"
                onClick={() => {
                  setEditingJasa({
                    no: `SPK-JASA-00${kontrakJasa.length + 1}/2026`,
                    pt: '',
                    desc: '',
                    awal: new Date().toISOString().slice(0, 10),
                    akhir: '2026-12-31',
                    nilai: 500000000
                  });
                  setJasaModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
              >
                <Plus className="w-4 h-4" />
                <span>+ Kontrak Jasa</span>
              </button>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari SPK / vendor..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-9 pr-4 py-2 border rounded-xl text-xs w-60"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleExportExcel}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b font-bold text-slate-500">
                    <th className="p-3.5">Nomor SPK</th>
                    <th className="p-3.5">Nama Vendor</th>
                    <th className="p-3.5">Deskripsi Kontrak</th>
                    <th className="p-3.5">Masa Berlaku</th>
                    <th className="p-3.5 text-right">Nilai Kontrak</th>
                    <th className="p-3.5 text-right">Terpakai WO</th>
                    <th className="p-3.5 text-right">Sisa Nilai</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredJasa.map(c => {
                    const st = contractDateStatus(c.awal, c.akhir);
                    const isActive = st === 'Aktif';
                    const used = jasaTerpakai(c.no);
                    const remain = jasaSisa(c);

                    return (
                      <tr key={c.no} className={isActive ? 'bg-emerald-50/40 hover:bg-emerald-50/70' : 'hover:bg-slate-50'}>
                        <td className="p-3.5 font-bold font-mono text-slate-900">{c.no}</td>
                        <td className="p-3.5 font-bold text-slate-800">{c.pt}</td>
                        <td className="p-3.5 text-slate-600 max-w-xs truncate">{c.desc}</td>
                        <td className="p-3.5 text-slate-500 font-mono text-[11px]">{c.awal} s/d {c.akhir}</td>
                        <td className="p-3.5 text-right font-mono font-bold text-slate-800">Rp {c.nilai.toLocaleString('id-ID')}</td>
                        <td className="p-3.5 text-right font-mono font-bold text-amber-700">Rp {used.toLocaleString('id-ID')}</td>
                        <td className="p-3.5 text-right font-mono font-bold text-emerald-700">Rp {remain.toLocaleString('id-ID')}</td>
                        <td className="p-3.5 text-center">
                          <Badge variant={isActive ? 'ok' : st === 'Expired' ? 'bad' : 'warn'}>
                            {st}
                          </Badge>
                        </td>
                        <td className="p-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingJasa(c);
                              setJasaModalOpen(true);
                            }}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Sub Tab 2: Kontrak Material */}
      {activeSubTab === 'material' && (
        <div className="space-y-6">
          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Kontrak Material</div>
              <div className="text-2xl font-black text-slate-800 mt-1">{kontrakMaterial.length}</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card">
              <div className="text-xs font-semibold text-pln-600 uppercase tracking-wider">Material In Transit</div>
              <div className="text-2xl font-black text-pln-700 mt-1 font-mono">{totalTransit.toLocaleString('id-ID')}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Belum di-checklist Admin Gudang</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card">
              <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Kontrak Aktif</div>
              <div className="text-2xl font-black text-emerald-700 mt-1">
                {kontrakMaterial.filter(c => contractDateStatus(c.awal, c.akhir) === 'Aktif').length}
              </div>
            </div>
          </div>

          {/* Table Panel */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
              <button
                type="button"
                onClick={() => {
                  setEditingMatContract({
                    no: `SPK-MAT-00${kontrakMaterial.length + 1}/2026`,
                    pt: '',
                    desc: '',
                    awal: new Date().toISOString().slice(0, 10),
                    akhir: '2026-12-31',
                    nilai: 1000000000,
                    materials: []
                  });
                  setMatContractModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
              >
                <Plus className="w-4 h-4" />
                <span>+ Kontrak Material</span>
              </button>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari SPK / supplier..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-9 pr-4 py-2 border rounded-xl text-xs w-60"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleExportExcel}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b font-bold text-slate-500">
                    <th className="p-3.5">Nomor SPK</th>
                    <th className="p-3.5">Supplier / PT</th>
                    <th className="p-3.5">Deskripsi</th>
                    <th className="p-3.5 text-center">Jumlah Item</th>
                    <th className="p-3.5 text-center">In Transit</th>
                    <th className="p-3.5 text-center">Sudah Checklist</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMaterial.map(c => {
                    const st = contractDateStatus(c.awal, c.akhir);
                    const transit = (c.materials || []).filter(m => !m.checked).reduce((s, m) => s + (Number(m.qty) || 0), 0);
                    const checked = (c.materials || []).filter(m => m.checked).reduce((s, m) => s + (Number(m.qty) || 0), 0);

                    return (
                      <tr key={c.no} className="hover:bg-slate-50">
                        <td className="p-3.5 font-bold font-mono text-slate-900">{c.no}</td>
                        <td className="p-3.5 font-bold text-slate-800">{c.pt}</td>
                        <td className="p-3.5 text-slate-600">{c.desc}</td>
                        <td className="p-3.5 text-center font-mono font-bold">{(c.materials || []).length} item</td>
                        <td className="p-3.5 text-center font-mono font-bold text-amber-700">{transit.toLocaleString('id-ID')}</td>
                        <td className="p-3.5 text-center font-mono font-bold text-emerald-700">{checked.toLocaleString('id-ID')}</td>
                        <td className="p-3.5 text-center">
                          <Badge variant={st === 'Aktif' ? 'ok' : 'bad'}>{st}</Badge>
                        </td>
                        <td className="p-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setChecklistContract(c);
                              setNewMatItemCode(gudang[0]?.material || '');
                            }}
                            className="px-3 py-1 bg-pln-50 hover:bg-pln-100 text-pln-700 font-bold rounded-lg"
                          >
                            Daftar Material
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Jasa Form Modal */}
      {jasaModalOpen && editingJasa && (
        <Modal
          isOpen={jasaModalOpen}
          onClose={() => setJasaModalOpen(false)}
          title="Form Kontrak Jasa"
          footer={
            <>
              <button type="button" onClick={() => setJasaModalOpen(false)} className="px-4 py-2 border rounded-xl text-xs font-bold">
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  await saveKontrakJasa(editingJasa);
                  setJasaModalOpen(false);
                }}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold"
              >
                Simpan
              </button>
            </>
          }
        >
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-bold mb-1">Nomor SPK *</label>
              <input
                type="text"
                value={editingJasa.no}
                onChange={e => setEditingJasa({ ...editingJasa, no: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl font-mono font-bold"
              />
            </div>
            <div>
              <label className="block font-bold mb-1">Nama PT / Vendor *</label>
              <input
                type="text"
                value={editingJasa.pt}
                onChange={e => setEditingJasa({ ...editingJasa, pt: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl font-bold"
              />
            </div>
            <div className="col-span-2">
              <label className="block font-bold mb-1">Deskripsi</label>
              <textarea
                rows={2}
                value={editingJasa.desc}
                onChange={e => setEditingJasa({ ...editingJasa, desc: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold mb-1">Tanggal Awal</label>
              <input
                type="date"
                value={editingJasa.awal}
                onChange={e => setEditingJasa({ ...editingJasa, awal: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold mb-1">Tanggal Akhir</label>
              <input
                type="date"
                value={editingJasa.akhir}
                onChange={e => setEditingJasa({ ...editingJasa, akhir: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl"
              />
            </div>
            <div className="col-span-2">
              <label className="block font-bold mb-1">Nilai Pagu Kontrak (Rp)</label>
              <input
                type="number"
                value={editingJasa.nilai}
                onChange={e => setEditingJasa({ ...editingJasa, nilai: Number(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-xl font-mono font-bold"
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Material Checklist Detail Modal */}
      {checklistContract && (
        <Modal
          isOpen={!!checklistContract}
          onClose={() => setChecklistContract(null)}
          title={`Checklist Material Masuk · ${checklistContract.no}`}
          maxWidth="4xl"
          footer={
            <button
              type="button"
              onClick={() => setChecklistContract(null)}
              className="px-4 py-2 border rounded-xl text-xs font-bold"
            >
              Tutup
            </button>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-pln-50 border border-pln-200 text-pln-800 rounded-xl">
              Material yang <b>belum di-checklist Admin Gudang</b> otomatis dihitung sebagai <b>Material In Transit</b> di modul KEB MATERIAL.
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b font-bold text-slate-500 sticky top-0">
                  <tr>
                    <th className="p-2.5">Material</th>
                    <th className="p-2.5 text-center">Qty Kontrak</th>
                    <th className="p-2.5 text-center">Satuan</th>
                    <th className="p-2.5 text-center">Status Checklist Gudang</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(checklistContract.materials || []).map((m, idx) => (
                    <tr key={idx}>
                      <td className="p-2.5 font-bold text-slate-800">{m.name || m.code}</td>
                      <td className="p-2.5 text-center font-mono font-bold text-pln-700">{m.qty}</td>
                      <td className="p-2.5 text-center text-slate-500">{m.unit}</td>
                      <td className="p-2.5 text-center">
                        <button
                          type="button"
                          onClick={async () => {
                            await toggleKontrakMaterialCheck(checklistContract.no, m.code, !m.checked);
                            const updated = {
                              ...checklistContract,
                              materials: checklistContract.materials.map(x =>
                                x.code === m.code ? { ...x, checked: !x.checked } : x
                              )
                            };
                            setChecklistContract(updated);
                          }}
                          className={`px-3 py-1 rounded-lg font-bold text-xs ${
                            m.checked
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                          }`}
                        >
                          {m.checked ? '✓ Sudah Checklist' : 'In-Transit (Belum)'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add material row to contract */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Tambah Item Material</label>
                <select
                  value={newMatItemCode}
                  onChange={e => setNewMatItemCode(e.target.value)}
                  className="w-full px-2.5 py-1.5 border rounded-lg bg-white"
                >
                  {gudang.map(g => (
                    <option key={g.material} value={g.material}>
                      {g.material} — {g.description}
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-24">
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Qty</label>
                <input
                  type="number"
                  min="1"
                  value={newMatItemQty}
                  onChange={e => setNewMatItemQty(Math.max(1, Number(e.target.value) || 1))}
                  className="w-full px-2 py-1.5 border rounded-lg font-mono font-bold"
                />
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={async () => {
                    const g = gudang.find(x => x.material === newMatItemCode);
                    if (!g) return;
                    const nextMats = [
                      ...checklistContract.materials,
                      { code: g.material, name: g.description, qty: newMatItemQty, unit: g.unit || 'pcs', checked: false }
                    ];
                    const nextContract = { ...checklistContract, materials: nextMats };
                    await saveKontrakMaterial(nextContract);
                    setChecklistContract(nextContract);
                  }}
                  className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700"
                >
                  + Tambah
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
