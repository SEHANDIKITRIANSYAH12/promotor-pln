'use client';

import React, { useState, useMemo } from 'react';
import { usePromotor } from '@/context/PromotorContext';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Search, Upload, Download, Check, Layers, AlertTriangle, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

export const StdKonstruksiModule: React.FC = () => {
  const { standards, stdHeaders, gudang, updateStandardQty, refreshData } = usePromotor();
  const [activeSubTab, setActiveSubTab] = useState<'kategori' | 'material'>('kategori');
  const [search, setSearch] = useState('');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadMode, setUploadMode] = useState<'replace' | 'add'>('replace');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const activeCount = useMemo(() => standards.filter(s => s.active).length, [standards]);
  const inactiveCount = useMemo(() => standards.filter(s => !s.active).length, [standards]);

  const filteredStandards = useMemo(() => {
    let list = [...standards];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        s => s.name.toLowerCase().includes(q) ||
             stdHeaders.some(h => h.toLowerCase().includes(q) && (s.materials[h] || 0) > 0)
      );
    }
    // Natural sort: 1B, 2B, 3B, ..., 9B, 10B, 11B, 12B, ...
    return list.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
  }, [standards, search, stdHeaders]);

  const handleQtyChange = (name: string, mat: string, value: string) => {
    const s = standards.find(x => x.name === name);
    if (!s) return;
    const nextMats = { ...s.materials, [mat]: Math.max(0, Number(value) || 0) };
    updateStandardQty(name, nextMats, s.active);
  };

  const handleToggleActive = (name: string) => {
    const s = standards.find(x => x.name === name);
    if (!s) return;
    updateStandardQty(name, s.materials, !s.active);
  };

  const handleExportExcel = () => {
    const data = standards.map(s => {
      const row: Record<string, any> = { 'KATEGORI KONSTRUKSI TM': s.name };
      stdHeaders.forEach(h => {
        row[h] = s.materials[h] || 0;
      });
      row['STATUS'] = s.active ? 'AKTIF' : 'NONAKTIF';
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'STD_KONSTRUKSI');
    XLSX.writeFile(wb, 'STD_KONSTRUKSI_TM.xlsx');
  };

  const handleImportExcel = async () => {
    if (!uploadFile) return alert('Pilih file Excel terlebih dahulu');
    try {
      setIsProcessing(true);
      const data = await uploadFile.arrayBuffer();
      const wb = XLSX.read(data, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

      if (!json || json.length < 2) throw new Error('File tidak memiliki data yang valid');

      const headers = json[0].map(x => String(x || '').trim());
      const mats = headers.slice(1).filter(Boolean);

      for (let r = 1; r < json.length; r++) {
        const catName = String(json[r][0] || '').trim();
        if (!catName) continue;
        const catMaterials: Record<string, number> = {};
        mats.forEach((m, idx) => {
          const val = Number(json[r][idx + 1]);
          catMaterials[m] = Number.isFinite(val) ? val : 0;
        });

        const existing = standards.find(s => s.name === catName);
        await updateStandardQty(catName, catMaterials, existing ? existing.active : true);
      }

      await refreshData();
      setUploadModalOpen(false);
      setUploadFile(null);
      alert('Database Standard Konstruksi berhasil diperbarui!');
    } catch (e: any) {
      alert('Gagal mengunggah file: ' + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Standard</div>
            <div className="text-2xl font-black text-slate-800 mt-1">{standards.length}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Kategori Konstruksi</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-pln-50 text-pln-600 flex items-center justify-center font-bold border border-pln-100">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Standard Aktif</div>
            <div className="text-2xl font-black text-emerald-700 mt-1">{activeCount}</div>
            <div className="text-[11px] text-emerald-600/80 mt-0.5">Siap digunakan di Survey</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold border border-emerald-100">
            <Check className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Nonaktif</div>
            <div className="text-2xl font-black text-amber-700 mt-1">{inactiveCount}</div>
            <div className="text-[11px] text-amber-600/80 mt-0.5">Dengan notifikasi warning</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold border border-amber-100">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Master Material</div>
            <div className="text-2xl font-black text-slate-800 mt-1">{stdHeaders.length}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Jenis Komponen Terdaftar</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center font-bold border border-slate-200">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Panel */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveSubTab('kategori')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
                activeSubTab === 'kategori'
                  ? 'bg-pln-600 text-white shadow-pln-500/20'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Matriks Kategori TM
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('material')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
                activeSubTab === 'material'
                  ? 'bg-pln-600 text-white shadow-pln-500/20'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Daftar Material Master
            </button>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari kategori / material..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pln-500/30 focus:border-pln-500 bg-white w-60"
              />
            </div>

            <button
              type="button"
              onClick={() => setUploadModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Excel</span>
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Excel</span>
            </button>
          </div>
        </div>

        {/* Notice Info */}
        <div className="px-5 py-3 bg-pln-50/70 border-b border-pln-100 flex items-center justify-between text-xs text-pln-800">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-pln-600 flex-shrink-0" />
            <span>
              Angka pada matriks adalah <b>Qty standar untuk 1 unit kategori</b>. Nilai tersimpan langsung dan otomatis mengkalkulasi kebutuhan pada menu Survey.
            </span>
          </div>
        </div>

        {/* Tab 1: Matriks Kategori */}
        {activeSubTab === 'kategori' && (
          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full text-left border-collapse min-w-[1200px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider sticky top-0 z-20">
                  <th className="p-3.5 sticky left-0 z-30 bg-slate-100 border-r border-slate-200 shadow-sm min-w-[180px]">
                    Kategori Konstruksi
                  </th>
                  {stdHeaders.map(h => (
                    <th key={h} className="p-3 text-center min-w-[110px] whitespace-nowrap border-r border-slate-200/60 font-mono text-[10px]">
                      {h}
                    </th>
                  ))}
                  <th className="p-3 text-center min-w-[100px]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredStandards.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 sticky left-0 z-10 bg-white border-r border-slate-200 font-bold text-slate-800 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span>{s.name}</span>
                        <Badge variant={s.active ? 'ok' : 'bad'} size="sm">
                          {s.active ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                      </div>
                    </td>

                    {stdHeaders.map(h => (
                      <td key={h} className="p-2 text-center border-r border-slate-100">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={s.materials[h] ?? 0}
                          onChange={e => handleQtyChange(s.name, h, e.target.value)}
                          className={`w-14 text-center py-1 px-1 rounded-lg border text-xs font-mono font-bold transition-all focus:outline-none focus:ring-2 focus:ring-pln-500/40 ${
                            (s.materials[h] || 0) > 0
                              ? 'bg-pln-50 border-pln-300 text-pln-800 font-black'
                              : 'bg-slate-50/50 border-slate-200 text-slate-400'
                          }`}
                        />
                      </td>
                    ))}

                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(s.name)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                          s.active
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {s.active ? 'Aktif' : 'Nonaktif'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Material Master List */}
        {activeSubTab === 'material' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="p-3.5">Material</th>
                  <th className="p-3.5">Deskripsi Master</th>
                  <th className="p-3.5 text-center">Stok SAP</th>
                  <th className="p-3.5 text-center">Stok Fisik</th>
                  <th className="p-3.5 text-center">Satuan</th>
                  <th className="p-3.5 text-center">Dipakai di Standard</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {stdHeaders.map(m => {
                  const g = gudang.find(x => String(x.material).trim() === m || x.description.includes(m));
                  const usedCount = standards.filter(s => (s.materials[m] || 0) > 0).length;

                  return (
                    <tr key={m} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-bold font-mono text-slate-900">{m}</td>
                      <td className="p-3.5 text-slate-600">{g?.description || '-'}</td>
                      <td className="p-3.5 text-center font-mono font-semibold">{g?.sap?.toLocaleString('id-ID') ?? '-'}</td>
                      <td className="p-3.5 text-center font-mono font-bold text-pln-700">{g?.fisik?.toLocaleString('id-ID') ?? '-'}</td>
                      <td className="p-3.5 text-center text-slate-500">{g?.unit || 'pcs'}</td>
                      <td className="p-3.5 text-center">
                        <Badge variant={usedCount > 0 ? 'info' : 'gray'}>
                          {usedCount} Standard
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <Modal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title="Upload / Update Database STD KONSTRUKSI"
        footer={
          <>
            <button
              type="button"
              onClick={() => setUploadModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleImportExcel}
              disabled={!uploadFile || isProcessing}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-50"
            >
              {isProcessing ? 'Memproses...' : 'Upload & Terapkan'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="p-3 bg-pln-50 border border-pln-200 text-xs text-pln-800 rounded-xl">
            Format file mengikuti <b>KATEGORI(1).xlsx</b>: kolom pertama adalah nama kategori konstruksi, kolom berikutnya adalah nama material, angka dalam sel adalah Qty standar.
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Pilih File Excel (.xlsx, .xls, .csv)</label>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={e => setUploadFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-pln-50 file:text-pln-700 hover:file:bg-pln-100 border border-slate-200 rounded-xl p-2"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
