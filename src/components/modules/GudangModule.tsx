'use client';

import React, { useState, useMemo } from 'react';
import { usePromotor } from '@/context/PromotorContext';
import { GudangMaterialRecord } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { ExportDropdown } from '@/components/ui/ExportDropdown';
import { exportToExcel, exportToPdf } from '@/lib/exportUtils';
import {
  Warehouse,
  Search,
  Download,
  Upload,
  Boxes,
  Layers,
  Edit,
  Check
} from 'lucide-react';
import * as XLSX from 'xlsx';

export const GudangModule: React.FC = () => {
  const { gudang, updateGudangStok, refreshData } = usePromotor();
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Edit Stock Modal
  const [editItem, setEditItem] = useState<GudangMaterialRecord | null>(null);
  const [tempSap, setTempSap] = useState<number>(0);
  const [tempFisik, setTempFisik] = useState<number>(0);

  const totalItems = gudang.length;
  const totalSap = useMemo(() => gudang.reduce((s, g) => s + (Number(g.sap) || 0), 0), [gudang]);
  const totalFisik = useMemo(() => gudang.reduce((s, g) => s + (Number(g.fisik) || 0), 0), [gudang]);

  const filteredGudang = useMemo(() => {
    if (!search) return gudang;
    const q = search.toLowerCase();
    return gudang.filter(
      g => g.material.toLowerCase().includes(q) ||
           g.description.toLowerCase().includes(q)
    );
  }, [gudang, search]);

  const handleExportExcel = () => {
    const data = filteredGudang.map(g => ({
      material: g.material,
      description: g.description,
      sap: g.sap,
      fisik: g.fisik,
      selisih: g.fisik - g.sap,
      unit: g.unit,
      status: g.fisik === g.sap ? 'SESUAI (BALANCE)' : g.fisik > g.sap ? 'SURPLUS FISIK' : 'MINUS FISIK',
      keterangan: g.keterangan || '-'
    }));

    exportToExcel({
      filename: `LAPORAN_STOK_GUDANG_PLN_${new Date().toISOString().split('T')[0]}`,
      sheetName: 'STOK_GUDANG',
      columns: [
        { header: 'KODE MATERIAL (SAP)', key: 'material', width: 18 },
        { header: 'DESKRIPSI MATERIAL', key: 'description', width: 35 },
        { header: 'STOK SAP', key: 'sap', width: 14 },
        { header: 'STOK FISIK', key: 'fisik', width: 14 },
        { header: 'SELISIH', key: 'selisih', width: 12 },
        { header: 'SATUAN', key: 'unit', width: 10 },
        { header: 'STATUS REKONSILIASI', key: 'status', width: 22 },
        { header: 'KETERANGAN', key: 'keterangan', width: 25 }
      ],
      data
    });
    showToast('Data Stok Gudang berhasil diexport ke Excel!', 'success');
  };

  const handleExportPdf = () => {
    const data = filteredGudang.map((g, idx) => ({
      no: idx + 1,
      material: g.material,
      description: g.description,
      sap: `${g.sap.toLocaleString('id-ID')} ${g.unit}`,
      fisik: `${g.fisik.toLocaleString('id-ID')} ${g.unit}`,
      status: g.fisik === g.sap ? 'Sesuai' : g.fisik > g.sap ? `+${g.fisik - g.sap}` : `${g.fisik - g.sap}`,
      keterangan: g.keterangan || '-'
    }));

    exportToPdf({
      filename: `LAPORAN_STOK_GUDANG_PLN_${new Date().toISOString().split('T')[0]}`,
      title: 'LAPORAN REKONSILIASI STOK MATERIAL GUDANG (SAP VS FISIK)',
      subtitle: 'Monitoring Ketersediaan Material Distribusi, Gardu, dan Saluran Udara Tegangan Menengah',
      unit: 'PLN GUDANG RANGKASBITUNG',
      orientation: 'landscape',
      columns: [
        { header: 'No', dataKey: 'no' },
        { header: 'Kode SAP', dataKey: 'material' },
        { header: 'Deskripsi Material', dataKey: 'description' },
        { header: 'Stok SAP', dataKey: 'sap' },
        { header: 'Stok Fisik', dataKey: 'fisik' },
        { header: 'Selisih', dataKey: 'status' },
        { header: 'Keterangan', dataKey: 'keterangan' }
      ],
      data,
      summaryStats: [
        { label: 'Total Item Komponen', value: `${totalItems} Item` },
        { label: 'Total Fisik', value: totalFisik.toLocaleString('id-ID') },
        { label: 'Total SAP', value: totalSap.toLocaleString('id-ID') },
        { label: 'Status Selisih', value: `${gudang.filter(g => g.sap !== g.fisik).length} Item` }
      ],
      signer: {
        name: 'Petugas / Admin Gudang',
        title: 'Penanggung Jawab Gudang Material',
        unit: 'PT PLN (Persero) ULP Rangkasbitung'
      }
    });
    showToast('Data Stok Gudang berhasil diexport ke PDF resmi!', 'success');
  };

  const handleImportExcel = async () => {
    if (!uploadFile) {
      showToast('Pilih file Excel terlebih dahulu', 'warn');
      return;
    }
    try {
      setIsProcessing(true);
      const data = await uploadFile.arrayBuffer();
      const wb = XLSX.read(data, { type: 'array' });
      const sn = wb.SheetNames.find(n => n.toUpperCase().includes('GUDANG')) || wb.SheetNames[0];
      const ws = wb.Sheets[sn];
      const json: any[] = XLSX.utils.sheet_to_json(ws);

      for (const row of json) {
        const mat = String(row['MATERIAL'] || row['material'] || row['Kode'] || '').trim();
        if (!mat) continue;
        const desc = String(row['DESCRIPTION'] || row['description'] || row['Deskripsi'] || mat).trim();
        const sap = Number(row['SAP'] || row['sap']) || 0;
        const fisik = Number(row['FISIK'] || row['fisik']) || 0;
        await updateGudangStok(mat, sap, fisik);
      }

      await refreshData();
      setUploadModalOpen(false);
      setUploadFile(null);
      showToast('Stok Gudang berhasil diperbarui dari Excel!', 'success');
    } catch (e: any) {
      showToast('Gagal mengimpor file: ' + e.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Item Material</div>
            <div className="text-2xl font-black text-slate-800 mt-1">{totalItems}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Komponen Terdaftar</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-pln-50 text-pln-600 flex items-center justify-center font-bold border border-pln-100">
            <Boxes className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Stok SAP</div>
            <div className="text-2xl font-black text-slate-700 mt-1">{totalSap.toLocaleString('id-ID')}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Sistem Terpusat</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center font-bold border border-slate-200">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Total Stok Fisik</div>
            <div className="text-2xl font-black text-emerald-700 mt-1">{totalFisik.toLocaleString('id-ID')}</div>
            <div className="text-[11px] text-emerald-600/80 mt-0.5">Kondisi Riil Gudang</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold border border-emerald-100">
            <Warehouse className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Table Panel */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">Daftar Stok Material Gudang</span>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari kode material / deskripsi..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pln-500/30 focus:border-pln-500 bg-white w-64"
              />
            </div>

            <button
              type="button"
              onClick={() => setUploadModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import Excel</span>
            </button>

            <ExportDropdown
              onExportExcel={handleExportExcel}
              onExportPdf={handleExportPdf}
              label="Export Stok"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="p-3.5">Kode Material (SAP)</th>
                <th className="p-3.5">Deskripsi Material</th>
                <th className="p-3.5 text-center w-32">Stok SAP</th>
                <th className="p-3.5 text-center w-32">Stok Fisik</th>
                <th className="p-3.5 text-center w-24">Satuan</th>
                <th className="p-3.5 text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredGudang.map(g => (
                <tr key={g.material} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3.5 font-mono font-bold text-slate-900">{g.material}</td>
                  <td className="p-3.5 font-medium text-slate-800">{g.description}</td>
                  <td className="p-3.5 text-center font-mono font-semibold text-slate-600">
                    {g.sap ? g.sap.toLocaleString('id-ID') : '-'}
                  </td>
                  <td className="p-3.5 text-center font-mono font-bold text-pln-700">
                    {g.fisik ? g.fisik.toLocaleString('id-ID') : '-'}
                  </td>
                  <td className="p-3.5 text-center text-slate-500">{g.unit || 'pcs'}</td>
                  <td className="p-3.5 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setEditItem(g);
                        setTempSap(g.sap);
                        setTempFisik(g.fisik);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px]"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Stock Modal */}
      {editItem && (
        <Modal
          isOpen={!!editItem}
          onClose={() => setEditItem(null)}
          title={`Edit Stok · ${editItem.description}`}
          footer={
            <>
              <button
                type="button"
                onClick={() => setEditItem(null)}
                className="px-4 py-2 border text-xs font-bold rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  await updateGudangStok(editItem.material, tempSap, tempFisik);
                  setEditItem(null);
                  showToast('Stok material berhasil diperbarui!', 'success');
                }}
                className="px-4 py-2 bg-pln-600 text-white text-xs font-bold rounded-xl"
              >
                Simpan
              </button>
            </>
          }
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-600 mb-1">Kode Material</label>
              <input type="text" readOnly value={editItem.material} className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-mono" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Stok SAP</label>
                <input
                  type="number"
                  min="0"
                  value={tempSap}
                  onChange={e => setTempSap(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 border rounded-xl font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Stok Fisik</label>
                <input
                  type="number"
                  min="0"
                  value={tempFisik}
                  onChange={e => setTempFisik(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 border rounded-xl font-mono font-bold text-emerald-700"
                />
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Upload Modal */}
      {uploadModalOpen && (
        <Modal
          isOpen={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          title="Import Data Gudang dari Excel"
          footer={
            <>
              <button
                type="button"
                onClick={() => setUploadModalOpen(false)}
                className="px-4 py-2 border text-xs font-bold rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleImportExcel}
                disabled={!uploadFile || isProcessing}
                className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl disabled:opacity-50"
              >
                {isProcessing ? 'Memproses...' : 'Upload & Terapkan'}
              </button>
            </>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-pln-50 border border-pln-200 text-pln-800 rounded-xl">
              Sistem akan membaca sheet <b>GUDANG</b> dengan kolom: <b>MATERIAL, DESCRIPTION, SAP, FISIK</b>.
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Pilih File Excel</label>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={e => setUploadFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-pln-50 file:text-pln-700 hover:file:bg-pln-100 border border-slate-200 rounded-xl p-2"
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
