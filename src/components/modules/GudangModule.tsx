'use client';

import React, { useState, useMemo } from 'react';
import { usePromotor } from '@/context/PromotorContext';
import { GudangMaterialRecord } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
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
  Trash2,
  Plus,
  Check,
  AlertTriangle,
  ArrowUpDown
} from 'lucide-react';
import * as XLSX from 'xlsx';

export const GudangModule: React.FC = () => {
  const { gudang, updateGudangStok, deleteGudangMaterial, refreshData } = usePromotor();
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Edit Stock Modal
  const [editItem, setEditItem] = useState<GudangMaterialRecord | null>(null);
  const [tempSap, setTempSap] = useState<number>(0);
  const [tempFisik, setTempFisik] = useState<number>(0);
  const [tempDescription, setTempDescription] = useState<string>('');
  const [tempUnit, setTempUnit] = useState<string>('pcs');
  const [tempKeterangan, setTempKeterangan] = useState<string>('');

  // Add Material Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    material: '',
    description: '',
    sap: 0,
    fisik: 0,
    unit: 'pcs',
    keterangan: ''
  });

  // Delete Confirm Dialog State
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

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
        { header: 'Rekonsiliasi', dataKey: 'status' },
        { header: 'Keterangan', dataKey: 'keterangan' }
      ],
      data,
      summaryStats: [
        { label: 'Total Item Terdaftar', value: `${totalItems} Material` },
        { label: 'Total Volume SAP', value: `${totalSap.toLocaleString('id-ID')} Unit` },
        { label: 'Total Fisik Riil', value: `${totalFisik.toLocaleString('id-ID')} Unit` }
      ],
      signer: {
        name: 'Supervisor Logistik & Gudang',
        title: 'Penanggung Jawab Gudang',
        unit: 'PT PLN (Persero) ULP Rangkasbitung'
      }
    });
    showToast('Laporan Stok Gudang berhasil diexport ke PDF resmi!', 'success');
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
      const sheet = wb.Sheets['GUDANG'] || wb.Sheets[wb.SheetNames[0]];
      const json: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

      if (!json || json.length === 0) throw new Error('File tidak memiliki data yang valid');

      for (const row of json) {
        const mat = String(row.MATERIAL || row.Material || row['KODE'] || '').trim();
        const desc = String(row.DESCRIPTION || row.Description || row['DESKRIPSI'] || '').trim();
        const sap = Number(row.SAP || row.Sap || 0) || 0;
        const fisik = Number(row.FISIK || row.Fisik || 0) || 0;
        const unit = String(row.UNIT || row.Unit || row['SATUAN'] || 'pcs').trim();
        const keterangan = String(row.KETERANGAN || row.Keterangan || '').trim();

        if (mat) {
          await updateGudangStok(mat, sap, fisik, desc || mat, unit, keterangan);
        }
      }

      await refreshData();
      setUploadModalOpen(false);
      setUploadFile(null);
      showToast('Data Gudang berhasil diimport dan disinkronkan ke server!', 'success');
    } catch (e: any) {
      console.error(e);
      showToast(`Gagal import Excel: ${e.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenEdit = (g: GudangMaterialRecord) => {
    setEditItem(g);
    setTempSap(g.sap);
    setTempFisik(g.fisik);
    setTempDescription(g.description);
    setTempUnit(g.unit || 'pcs');
    setTempKeterangan(g.keterangan || '');
  };

  const handleSaveEdit = async () => {
    if (!editItem) return;
    try {
      setIsSaving(true);
      await updateGudangStok(
        editItem.material,
        tempSap,
        tempFisik,
        tempDescription.trim() || editItem.description,
        tempUnit.trim() || 'pcs',
        tempKeterangan.trim()
      );
      setEditItem(null);
      showToast(`Stok ${editItem.material} berhasil diperbarui di database!`, 'success');
    } catch (error: any) {
      console.error(error);
      showToast(`Gagal menyimpan perubahan: ${error.message}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNewMaterial = async () => {
    if (!addForm.material.trim() || !addForm.description.trim()) {
      showToast('Kode Material (SAP) dan Deskripsi wajib diisi!', 'warn');
      return;
    }
    try {
      setIsSaving(true);
      await updateGudangStok(
        addForm.material.trim(),
        addForm.sap,
        addForm.fisik,
        addForm.description.trim(),
        addForm.unit.trim() || 'pcs',
        addForm.keterangan.trim()
      );
      setAddModalOpen(false);
      setAddForm({
        material: '',
        description: '',
        sap: 0,
        fisik: 0,
        unit: 'pcs',
        keterangan: ''
      });
      showToast(`Material baru ${addForm.material} berhasil ditambahkan ke Gudang!`, 'success');
    } catch (error: any) {
      console.error(error);
      showToast(`Gagal menambahkan material: ${error.message}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteItem = (g: GudangMaterialRecord) => {
    setDeleteConfirm({
      isOpen: true,
      title: 'Hapus Material Gudang',
      message: `Apakah Anda yakin ingin menghapus material "${g.description}" (${g.material}) dari database stok gudang? Tindakan ini tidak dapat dibatalkan.`,
      onConfirm: async () => {
        try {
          await deleteGudangMaterial(g.material);
          showToast(`Material ${g.material} berhasil dihapus dari Gudang!`, 'success');
        } catch (error: any) {
          showToast(`Gagal menghapus material: ${error.message}`, 'error');
        }
      }
    });
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
            <button
              type="button"
              onClick={() => setAddModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-pln-600 hover:bg-pln-700 text-white text-xs font-bold transition-all shadow-md shadow-pln-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Material</span>
            </button>
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
                <th className="p-3.5 text-center w-28">Stok SAP</th>
                <th className="p-3.5 text-center w-28">Stok Fisik</th>
                <th className="p-3.5 text-center w-32">Rekonsiliasi</th>
                <th className="p-3.5 text-center w-20">Satuan</th>
                <th className="p-3.5 text-center w-36">Kelola & Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredGudang.length > 0 ? (
                filteredGudang.map(g => {
                  const selisih = (Number(g.fisik) || 0) - (Number(g.sap) || 0);
                  return (
                    <tr
                      key={g.material}
                      onClick={() => handleOpenEdit(g)}
                      className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                      title="Klik baris untuk Kelola Stok & Rincian Material"
                    >
                      <td className="p-3.5 font-mono font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {g.material}
                      </td>
                      <td className="p-3.5 font-medium text-slate-800">
                        <div className="group-hover:text-blue-900 transition-colors">{g.description}</div>
                        {g.keterangan && (
                          <div className="text-[10px] text-slate-400 mt-0.5 italic">{g.keterangan}</div>
                        )}
                      </td>
                      <td className="p-3.5 text-center font-mono font-semibold text-slate-600">
                        {g.sap !== undefined && g.sap !== null ? g.sap.toLocaleString('id-ID') : '0'}
                      </td>
                      <td className="p-3.5 text-center font-mono font-bold text-pln-700">
                        {g.fisik !== undefined && g.fisik !== null ? g.fisik.toLocaleString('id-ID') : '0'}
                      </td>
                      <td className="p-3.5 text-center">
                        {selisih === 0 ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                            ✓ Balance
                          </span>
                        ) : selisih > 0 ? (
                          <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-[10px] border border-blue-200">
                            +{selisih} Surplus
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold text-[10px] border border-amber-200">
                            {selisih} Minus
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-center text-slate-500 font-medium">{g.unit || 'pcs'}</td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEdit(g);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs border border-blue-200 shadow-2xs transition-all hover:scale-[1.02]"
                            title="Kelola & Edit Stok Material"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Kelola Stok</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteItem(g);
                            }}
                            className="p-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 font-bold text-xs transition-colors border border-slate-200"
                            title="Hapus Material dari Gudang"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                    {search ? `Tidak ada material yang cocok dengan "${search}"` : 'Belum ada data stok material'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Stock Modal */}
      {editItem && (
        <Modal
          isOpen={!!editItem}
          onClose={() => setEditItem(null)}
          title={
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold border border-blue-100">
                📦
              </span>
              <div>
                <div className="text-sm font-bold text-slate-800">Edit Stok Material Gudang</div>
                <div className="text-[11px] font-mono text-blue-600">{editItem.material}</div>
              </div>
            </div>
          }
          maxWidth="lg"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <button
                type="button"
                onClick={() => setEditItem(null)}
                className="px-4 py-2 border border-slate-200 text-xs font-bold text-slate-600 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSaveEdit}
                className="px-5 py-2 bg-pln-600 hover:bg-pln-700 text-white text-xs font-bold rounded-xl shadow-md shadow-pln-600/20 disabled:opacity-50 flex items-center gap-1.5 transition-all"
              >
                {isSaving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Simpan Perubahan</span>
                  </>
                )}
              </button>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            {/* Live Reconciliation Preview Badge */}
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Status Rekonsiliasi:
              </span>
              {tempFisik === tempSap ? (
                <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1 border border-emerald-200">
                  <Check className="w-3.5 h-3.5" />
                  <span>Stok Fisik Sesuai SAP (Balance)</span>
                </span>
              ) : tempFisik > tempSap ? (
                <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 font-bold text-xs flex items-center gap-1 border border-blue-200">
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  <span>Surplus Fisik: +{tempFisik - tempSap} {tempUnit}</span>
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 font-bold text-xs flex items-center gap-1 border border-amber-200">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Minus Fisik: -{tempSap - tempFisik} {tempUnit}</span>
                </span>
              )}
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Kode Material (SAP)</label>
              <input
                type="text"
                readOnly
                value={editItem.material}
                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl font-mono text-slate-600 font-bold cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Deskripsi Material *</label>
              <input
                type="text"
                value={tempDescription}
                onChange={e => setTempDescription(e.target.value)}
                placeholder="Contoh: TRF DIS;D3;20kV/400V;3P;160kVA"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-pln-500/20 focus:border-pln-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Stok SAP *</label>
                <input
                  type="number"
                  min="0"
                  value={tempSap}
                  onChange={e => setTempSap(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono font-bold text-slate-800 focus:ring-2 focus:ring-pln-500/20 focus:border-pln-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Stok Fisik Riil *</label>
                <input
                  type="number"
                  min="0"
                  value={tempFisik}
                  onChange={e => setTempFisik(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono font-bold text-emerald-700 focus:ring-2 focus:ring-pln-500/20 focus:border-pln-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Satuan *</label>
                <input
                  type="text"
                  value={tempUnit}
                  onChange={e => setTempUnit(e.target.value)}
                  placeholder="pcs, meter, unit"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-pln-500/20 focus:border-pln-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Catatan / Keterangan Rekonsiliasi</label>
              <input
                type="text"
                value={tempKeterangan}
                onChange={e => setTempKeterangan(e.target.value)}
                placeholder="Catatan fisik, lokasi rak, atau hasil opname"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-pln-500/20 focus:border-pln-500 outline-none"
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Add New Material Modal */}
      {addModalOpen && (
        <Modal
          isOpen={addModalOpen}
          onClose={() => setAddModalOpen(false)}
          title={
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-bold border border-emerald-100">
                ➕
              </span>
              <span>Tambah Material Baru ke Gudang</span>
            </div>
          }
          maxWidth="lg"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-xs font-bold text-slate-600 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSaveNewMaterial}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 disabled:opacity-50 flex items-center gap-1.5 transition-all"
              >
                {isSaving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Material</span>
                  </>
                )}
              </button>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Kode Material SAP *</label>
                <input
                  type="text"
                  value={addForm.material}
                  onChange={e => setAddForm({ ...addForm, material: e.target.value })}
                  placeholder="Contoh: 1030075"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono font-bold focus:ring-2 focus:ring-pln-500/20 focus:border-pln-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Satuan *</label>
                <input
                  type="text"
                  value={addForm.unit}
                  onChange={e => setAddForm({ ...addForm, unit: e.target.value })}
                  placeholder="pcs, meter, batang, unit"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-pln-500/20 focus:border-pln-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Deskripsi Material *</label>
              <input
                type="text"
                value={addForm.description}
                onChange={e => setAddForm({ ...addForm, description: e.target.value })}
                placeholder="Contoh: TRF DIS;D3;20kV/400V;3P;160kVA;YZN5;OD"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-pln-500/20 focus:border-pln-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Stok SAP Awal</label>
                <input
                  type="number"
                  min="0"
                  value={addForm.sap}
                  onChange={e => setAddForm({ ...addForm, sap: Math.max(0, Number(e.target.value) || 0) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono font-bold focus:ring-2 focus:ring-pln-500/20 focus:border-pln-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Stok Fisik Awal</label>
                <input
                  type="number"
                  min="0"
                  value={addForm.fisik}
                  onChange={e => setAddForm({ ...addForm, fisik: Math.max(0, Number(e.target.value) || 0) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono font-bold text-emerald-700 focus:ring-2 focus:ring-pln-500/20 focus:border-pln-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Catatan / Keterangan</label>
              <input
                type="text"
                value={addForm.keterangan}
                onChange={e => setAddForm({ ...addForm, keterangan: e.target.value })}
                placeholder="Lokasi penempatan di gudang"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-pln-500/20 focus:border-pln-500 outline-none"
              />
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
            <div className="flex items-center justify-end gap-2 w-full">
              <button
                type="button"
                onClick={() => setUploadModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-xs font-bold text-slate-600 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleImportExcel}
                disabled={!uploadFile || isProcessing}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 disabled:opacity-50 flex items-center gap-1.5 transition-all"
              >
                {isProcessing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload & Terapkan</span>
                  </>
                )}
              </button>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-pln-50 border border-pln-200 text-pln-800 rounded-xl">
              Sistem akan membaca sheet <b>GUDANG</b> dengan kolom: <b>MATERIAL, DESCRIPTION, SAP, FISIK, UNIT</b>.
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Pilih File Excel (.xlsx / .xls)</label>
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

      {/* Confirmation Dialog for Delete */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm(prev => ({ ...prev, isOpen: false }))}
        onConfirm={deleteConfirm.onConfirm}
        title={deleteConfirm.title}
        message={deleteConfirm.message}
        confirmText="Ya, Hapus Material"
        cancelText="Batal"
      />
    </div>
  );
};
