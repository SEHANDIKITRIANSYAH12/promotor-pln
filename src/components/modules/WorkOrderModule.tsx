'use client';

import React, { useState, useMemo } from 'react';
import { usePromotor } from '@/context/PromotorContext';
import { WorkOrderRecord, MaterialItem } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useToast } from '@/components/ui/Toast';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ExportDropdown } from '@/components/ui/ExportDropdown';
import { exportToExcel, exportToPdf } from '@/lib/exportUtils';
import {
  FileText,
  Search,
  Download,
  Plus,
  Edit,
  Printer,
  Boxes,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const WorkOrderModule: React.FC = () => {
  const {
    workorders,
    gudang,
    kontrakJasa,
    vendorTiangMaster,
    materialProgress,
    combinedComplete,
    updateWOMaterials,
    updateWOKendala,
    updateWorkOrder,
    saveBAST
  } = usePromotor();
  const { showToast } = useToast();

  const [search, setSearch] = useState('');
  
  // Delete Confirm State
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

  // Material Edit Modal
  const [materialModalWO, setMaterialModalWO] = useState<WorkOrderRecord | null>(null);
  const [editingMaterials, setEditingMaterials] = useState<MaterialItem[]>([]);

  // Add Item inside Material Modal
  const [newMatCode, setNewMatCode] = useState('');
  const [newMatQty, setNewMatQty] = useState(1);
  const [newMatUnit, setNewMatUnit] = useState('pcs');

  // Edit WO Form Modal (Vendor, Pengawas 1 & 2, Vendor Tiang, Kendala)
  const [editWOItem, setEditWOItem] = useState<WorkOrderRecord | null>(null);
  const [tempVendor, setTempVendor] = useState('');
  const [tempPengawas, setTempPengawas] = useState('');
  const [tempPengawas2, setTempPengawas2] = useState('');
  const [tempVendorTiang, setTempVendorTiang] = useState('');
  const [tempKendala, setTempKendala] = useState('');
  const [isSavingWO, setIsSavingWO] = useState(false);

  // BAST Print Modal
  const [bastWO, setBastWO] = useState<WorkOrderRecord | null>(null);
  const [bastForm, setBastForm] = useState({
    asmanKonstruksi: 'Hendra Setiawan, S.T.',
    asmanJaringan: 'Budi Santoso, M.T.',
    conditions: {} as Record<string, string>
  });

  const totalWO = workorders.length;
  const woRunning = useMemo(() => workorders.filter(w => !combinedComplete(w)).length, [workorders, combinedComplete]);
  const woCompleted = useMemo(() => workorders.filter(w => combinedComplete(w)).length, [workorders, combinedComplete]);
  const totalVerifiedMaterial = useMemo(
    () => workorders.reduce((n, w) => n + (w.materials || []).reduce((a, m) => a + (Number(m.verified) || 0), 0), 0),
    [workorders]
  );

  const filteredWO = useMemo(() => {
    if (!search) return workorders;
    const q = search.toLowerCase();
    return workorders.filter(
      w => w.namaPelanggan.toLowerCase().includes(q) ||
           w.noWo.toLowerCase().includes(q) ||
           w.vendor.toLowerCase().includes(q) ||
           w.pengawas.toLowerCase().includes(q)
    );
  }, [workorders, search]);

  const openMaterialModal = (w: WorkOrderRecord) => {
    setMaterialModalWO(w);
    setEditingMaterials(JSON.parse(JSON.stringify(w.materials || [])));
    setNewMatCode(gudang[0]?.material || '');
    setNewMatQty(1);
  };

  const handleSaveMaterials = async () => {
    if (!materialModalWO) return;
    try {
      await updateWOMaterials(materialModalWO.noWo, editingMaterials);
      setMaterialModalWO(null);
      showToast(`Perubahan rincian material Work Order ${materialModalWO.noWo} berhasil disimpan.`, 'success', 'Material Disimpan');
    } catch (err: any) {
      showToast(`Gagal menyimpan material: ${err.message}`, 'error', 'Penyimpanan Gagal');
    }
  };

  const openEditModal = (w: WorkOrderRecord) => {
    setEditWOItem(w);
    setTempVendor(w.vendor || '');
    setTempPengawas(w.pengawas || '');
    setTempPengawas2(w.pengawas2 || '');
    setTempVendorTiang(w.vendorTiang || '');
    setTempKendala(w.ketKendala || '');
  };

  const handleSaveEditWO = async () => {
    if (!editWOItem) return;
    if (!tempVendor.trim()) {
      showToast('Vendor pelaksana wajib diisi.', 'warning', 'Perhatian');
      return;
    }
    if (!tempPengawas.trim()) {
      showToast('Pengawas 1 wajib diisi.', 'warning', 'Perhatian');
      return;
    }

    try {
      setIsSavingWO(true);
      await updateWorkOrder(editWOItem.noWo, {
        vendor: tempVendor.trim(),
        pengawas: tempPengawas.trim(),
        pengawas2: tempPengawas2.trim(),
        vendorTiang: tempVendorTiang.trim(),
        ketKendala: tempKendala.trim()
      });
      setEditWOItem(null);
      showToast(`Perubahan Work Order ${editWOItem.noWo} (Vendor & Pengawas) berhasil disimpan!`, 'success', 'Work Order Diperbarui');
    } catch (err: any) {
      showToast(`Gagal menyimpan perubahan: ${err.message || 'Terjadi kesalahan sistem'}`, 'error', 'Gagal Simpan');
    } finally {
      setIsSavingWO(false);
    }
  };

  const handleAddMaterialItem = () => {
    if (!newMatCode) {
      showToast('Pilih material terlebih dahulu.', 'warning', 'Pilih Material');
      return;
    }
    const g = gudang.find(x => x.material === newMatCode);
    if (!g) return;

    setEditingMaterials(prev => [
      ...prev,
      {
        code: g.material,
        name: g.description,
        unit: newMatUnit || g.unit || 'pcs',
        required: newMatQty,
        reserved: 0,
        verified: 0,
        condition: 'Baik'
      }
    ]);
    showToast(`Material ${g.description} (Qty: ${newMatQty}) ditambahkan.`, 'success', 'Material Ditambahkan');
    setNewMatQty(1);
  };

  const openBASTModal = (w: WorkOrderRecord) => {
    setBastWO(w);
    const conds: Record<string, string> = {};
    (w.materials || []).forEach(m => {
      conds[m.code] = m.condition || 'Baik';
    });
    setBastForm({
      asmanKonstruksi: w.bast?.asmanKonstruksi || 'Hendra Setiawan, S.T.',
      asmanJaringan: w.bast?.asmanJaringan || 'Budi Santoso, M.T.',
      conditions: conds
    });
  };

  const handlePrintBAST = async () => {
    if (!bastWO) return;
    await saveBAST(bastWO.noWo, bastForm);

    const rows = (bastWO.materials || []).map(
      m => `<tr>
        <td style="padding:8px;border:1px solid #333">${m.name}</td>
        <td style="padding:8px;border:1px solid #333;font-family:monospace">${m.code}</td>
        <td style="padding:8px;border:1px solid #333;text-align:center">${Math.min(Number(m.verified) || 0, Number(m.required) || 0)}</td>
        <td style="padding:8px;border:1px solid #333;text-align:center">${m.unit}</td>
        <td style="padding:8px;border:1px solid #333;text-align:center">${bastForm.conditions[m.code] || 'Baik'}</td>
      </tr>`
    ).join('');

    const html = `<!doctype html>
    <html lang="id">
    <head>
      <meta charset="utf-8">
      <title>BAST Operasi - ${bastWO.noWo}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; color: #111; line-height: 1.5; }
        h1 { text-align: center; font-size: 18px; margin-bottom: 4px; }
        .sub { text-align: center; font-size: 12px; color: #555; margin-bottom: 25px; }
        .meta { margin: 20px 0; font-size: 12px; }
        .meta div { margin: 4px 0; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 12px; }
        th { background: #f0f4f8; font-weight: bold; padding: 8px; border: 1px solid #333; }
        .sign { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; margin-top: 60px; text-align: center; font-size: 12px; }
        .sign .space { height: 80px; }
      </style>
    </head>
    <body>
      <h1>BERITA ACARA SERAH TERIMA OPERASI</h1>
      <div class="sub">PROMOTOR V1.0 · PT PLN (PERSERO) UNIT INDUK DISTRIBUSI BANTEN</div>
      <div class="meta">
        <div><b>Nomor Work Order:</b> ${bastWO.noWo}</div>
        <div><b>Pelanggan:</b> ${bastWO.namaPelanggan}</div>
        <div><b>IDPEL:</b> ${bastWO.idpel || '-'}</div>
        <div><b>Vendor Pelaksana:</b> ${bastWO.vendor}</div>
        <div><b>Pengawas Lapangan:</b> ${bastWO.pengawas} / ${bastWO.pengawas2 || '-'}</div>
        <div><b>Tanggal:</b> ${new Date().toLocaleDateString('id-ID')}</div>
      </div>
      <p style="font-size:12px">Dengan ini pekerjaan konstruksi pada Work Order tersebut telah selesai 100% dan material terpasang diserahterimakan untuk operasi sesuai hasil verifikasi berikut:</p>
      <table>
        <thead>
          <tr>
            <th>Material</th>
            <th>Kode Material</th>
            <th>Qty Terpasang</th>
            <th>Satuan</th>
            <th>Kondisi Fisik</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
      <p style="font-size:12px">Demikian Berita Acara Serah Terima Operasi ini dibuat dengan sebenar-benarnya untuk dipergunakan sebagaimana mestinya.</p>
      <div class="sign">
        <div>
          Asisten Manager Konstruksi
          <div class="space"></div>
          <b>${bastForm.asmanKonstruksi}</b>
        </div>
        <div>
          Asisten Manager Jaringan
          <div class="space"></div>
          <b>${bastForm.asmanJaringan}</b>
        </div>
      </div>
    </body>
    </html>`;

    const win = window.open('', '_blank');
    if (win) {
      win.document.open();
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 400);
    }
  };

  const handleExportExcel = () => {
    if (filteredWO.length === 0) {
      showToast('Tidak ada data Work Order untuk diexport', 'warn');
      return;
    }
    const data = filteredWO.map((w, index) => ({
      'NO': index + 1,
      'NO WO': w.noWo,
      'NAMA PELANGGAN': w.namaPelanggan,
      'VENDOR PELAKSANA': w.vendor,
      'PENGAWAS 1': w.pengawas,
      'PENGAWAS 2': w.pengawas2 || '-',
      'PROGRESS MATERIAL': `${materialProgress(w)}%`,
      'STATUS': combinedComplete(w) ? 'SELESAI (100%)' : 'BERJALAN',
      'KENDALA': w.ketKendala || '-'
    }));

    exportToExcel(data, `LAPORAN_WORK_ORDER_PLN_${new Date().toISOString().slice(0, 10)}`, 'WORK_ORDER');
    showToast('Berhasil mengexport data Work Order ke Excel', 'success');
  };

  const handleExportPdf = () => {
    if (filteredWO.length === 0) {
      showToast('Tidak ada data Work Order untuk diexport', 'warn');
      return;
    }
    const headers = ['No', 'No WO', 'Nama Pelanggan', 'Vendor', 'Pengawas 1', 'Pengawas 2', 'Prog Mat', 'Status', 'Kendala'];
    const rows = filteredWO.map((w, index) => [
      index + 1,
      w.noWo,
      w.namaPelanggan,
      w.vendor,
      w.pengawas || '-',
      w.pengawas2 || '-',
      `${materialProgress(w)}%`,
      combinedComplete(w) ? 'Selesai' : 'Berjalan',
      w.ketKendala || '-'
    ]);

    exportToPdf({
      title: 'LAPORAN MONITORING WORK ORDER (WO)',
      subtitle: 'Monitoring Realisasi Pelaksanaan Pekerjaan Konstruksi dan Jaringan Distribusi',
      filename: `LAPORAN_WORK_ORDER_PLN_${new Date().toISOString().slice(0, 10)}`,
      orientation: 'landscape',
      summaryCards: [
        { label: 'Total Work Order', value: totalWO, color: [0, 156, 222] },
        { label: 'WO Berjalan', value: woRunning, color: [245, 158, 11] },
        { label: 'WO Selesai (100%)', value: woCompleted, color: [16, 185, 129] },
        { label: 'Material Verified', value: totalVerifiedMaterial, color: [100, 116, 139] }
      ],
      tableHeaders: headers,
      tableData: rows,
      signatureTitle: 'Manager ULP Rangkasbitung',
      signatureName: 'SEHAN DIKI TRIANSYAH'
    });
    showToast('Berhasil membuat dokumen PDF Laporan Work Order', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total WO</div>
            <div className="text-2xl font-black text-slate-800 mt-1">{totalWO}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Perintah Kerja Terbit</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-pln-50 text-pln-600 flex items-center justify-center font-bold border border-pln-100">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-amber-600 uppercase tracking-wider">WO Berjalan</div>
            <div className="text-2xl font-black text-amber-700 mt-1">{woRunning}</div>
            <div className="text-[11px] text-amber-600/80 mt-0.5">Dalam Proses Eksekusi</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold border border-amber-100">
            <Boxes className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">WO Selesai</div>
            <div className="text-2xl font-black text-emerald-700 mt-1">{woCompleted}</div>
            <div className="text-[11px] text-emerald-600/80 mt-0.5">Material & Jasa 100%</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold border border-emerald-100">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Material Verified</div>
            <div className="text-2xl font-black text-slate-800 mt-1">{totalVerifiedMaterial}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Item Terverifikasi Surat Jalan</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center font-bold border border-slate-200">
            <Printer className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Table Panel */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">Daftar Work Order Aktif</span>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari pelanggan, No WO, vendor..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pln-500/30 focus:border-pln-500 bg-white w-64"
              />
            </div>

            <ExportDropdown
              onExportExcel={handleExportExcel}
              onExportPdf={handleExportPdf}
              label="Export WO"
            />
          </div>
        </div>

        {/* Notice */}
        <div className="px-5 py-3 bg-pln-50/70 border-b border-pln-100 flex items-center justify-between text-xs text-pln-800">
          <span>
            Pekerjaan dianggap <b>Selesai</b> jika <b>Progress Material 100%, Progress Jasa 100%, dan Progress Tiang 100%</b> pada menu PENGAWASAN. Dokumen BAST Operasi dapat dicetak setelah selesai.
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="p-3.5">Nama Pelanggan</th>
                <th className="p-3.5">No WO</th>
                <th className="p-3.5">Vendor Pelaksana</th>
                <th className="p-3.5">Pengawas 1 / 2</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5">Kendala Teknis</th>
                <th className="p-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredWO.map(w => {
                const isDone = combinedComplete(w);

                return (
                  <tr key={w.noWo} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-bold text-slate-800">{w.namaPelanggan}</td>
                    <td className="p-3.5 font-mono font-bold text-pln-700">{w.noWo}</td>
                    <td className="p-3.5 font-semibold text-slate-700">{w.vendor}</td>
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-800">{w.pengawas}</div>
                      <div className="text-[10px] text-slate-400">{w.pengawas2 || '-'}</div>
                    </td>
                    <td className="p-3.5 text-center">
                      <Badge variant={isDone ? 'ok' : 'info'}>
                        {isDone ? 'Selesai' : 'Aktif'}
                      </Badge>
                    </td>
                    <td className="p-3.5 text-slate-500 max-w-xs truncate">
                      {w.ketKendala || '-'}
                    </td>
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openMaterialModal(w);
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-pln-50 hover:bg-pln-100 text-pln-700 font-bold text-xs flex items-center gap-1 border border-pln-200 shadow-2xs transition-all hover:scale-[1.02]"
                          title="Kelola & Rincian Kebutuhan Material WO"
                        >
                          <Boxes className="w-3.5 h-3.5" />
                          <span>Material</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(w);
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 border border-slate-200 shadow-2xs transition-all hover:scale-[1.02]"
                          title="Kelola Data WO, Vendor & Pengawas"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Kelola WO</span>
                        </button>
                        {isDone && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openBASTModal(w);
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition-all hover:scale-[1.02]"
                            title="Cetak Berita Acara Serah Terima (BAST)"
                          >
                            <Printer className="w-3 h-3" />
                            <span>BAST</span>
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

      {/* Edit Materials Modal */}
      {materialModalWO && (
        <Modal
          isOpen={!!materialModalWO}
          onClose={() => setMaterialModalWO(null)}
          title={`Material Work Order · ${materialModalWO.noWo}`}
          maxWidth="4xl"
          footer={
            <>
              <button
                type="button"
                onClick={() => setMaterialModalWO(null)}
                className="px-4 py-2 rounded-xl border text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveMaterials}
                className="px-5 py-2 rounded-xl bg-pln-600 text-white text-xs font-bold hover:bg-pln-700"
              >
                Simpan Perubahan Material
              </button>
            </>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 sticky top-0">
                  <tr>
                    <th className="p-2.5">Material</th>
                    <th className="p-2.5 text-center w-28">Qty WO</th>
                    <th className="p-2.5 text-center w-20">Satuan</th>
                    <th className="p-2.5 text-center w-24">Reserved</th>
                    <th className="p-2.5 text-center w-24">Verified</th>
                    <th className="p-2.5 text-center w-16">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {editingMaterials.map((m, idx) => (
                    <tr key={idx}>
                      <td className="p-2.5">
                        <div className="font-bold text-slate-800 font-mono">{m.code}</div>
                        <div className="text-[10px] text-slate-400">{m.name}</div>
                      </td>
                      <td className="p-2.5 text-center">
                        <input
                          type="number"
                          min="0"
                          value={m.required}
                          onChange={e => {
                            const next = [...editingMaterials];
                            next[idx].required = Math.max(0, Number(e.target.value) || 0);
                            setEditingMaterials(next);
                          }}
                          className="w-20 text-center py-1 border rounded-lg font-mono font-bold"
                        />
                      </td>
                      <td className="p-2.5 text-center text-slate-500">{m.unit}</td>
                      <td className="p-2.5 text-center font-mono font-semibold text-slate-600">{m.reserved || 0}</td>
                      <td className="p-2.5 text-center font-mono font-bold text-emerald-600">{m.verified || 0}</td>
                      <td className="p-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            if (m.reserved || m.verified) {
                              showToast('Material sudah reserved / verified tidak bisa dihapus.', 'error', 'Tidak Dapat Dihapus');
                              return;
                            }
                            setDeleteConfirm({
                              isOpen: true,
                              title: 'Hapus Item Material WO',
                              message: `Apakah Anda yakin ingin menghapus material "${m.name || m.code}" dari daftar alokasi Work Order ini?`,
                              onConfirm: () => {
                                setEditingMaterials(prev => prev.filter((_, i) => i !== idx));
                                showToast(`Material "${m.name || m.code}" berhasil dihapus dari daftar WO.`, 'info', 'Material Dihapus');
                              }
                            });
                          }}
                          className="text-rose-500 font-bold hover:underline"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add new material row */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Tambah Material Baru</label>
                <select
                  value={newMatCode}
                  onChange={e => setNewMatCode(e.target.value)}
                  className="w-full px-2.5 py-1.5 border rounded-lg bg-white text-xs"
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
                  value={newMatQty}
                  onChange={e => setNewMatQty(Math.max(1, Number(e.target.value) || 1))}
                  className="w-full px-2 py-1.5 border rounded-lg text-xs font-mono font-bold"
                />
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={handleAddMaterialItem}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700"
                >
                  + Tambah
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit WO Details Modal (Vendor Pelaksana, Pengawas, Vendor Tiang, Kendala) */}
      {editWOItem && (
        <Modal
          isOpen={!!editWOItem}
          onClose={() => setEditWOItem(null)}
          title={
            <div className="flex items-center gap-2">
              <Edit className="w-4 h-4 text-pln-600" />
              <span>Edit Penugasan & Detail Work Order</span>
              <span className="font-mono text-pln-700 bg-pln-100 px-2 py-0.5 rounded text-xs">
                {editWOItem.noWo}
              </span>
            </div>
          }
          maxWidth="2xl"
          footer={
            <>
              <button
                type="button"
                disabled={isSavingWO}
                onClick={() => setEditWOItem(null)}
                className="px-4 py-2 rounded-xl border text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isSavingWO}
                onClick={handleSaveEditWO}
                className="px-5 py-2 rounded-xl bg-pln-600 text-white text-xs font-bold hover:bg-pln-700 disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSavingWO && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                <span>{isSavingWO ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
              </button>
            </>
          }
        >
          <div className="space-y-4 text-xs">
            {/* Customer Info Card */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Pelanggan</span>
                <div className="text-sm font-bold text-slate-800">{editWOItem.namaPelanggan}</div>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400">IDPEL</span>
                <div className="text-xs font-mono font-bold text-slate-700">{editWOItem.idpel || '-'}</div>
              </div>
            </div>

            {/* Vendor Pelaksana */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Vendor Pelaksana Konstruksi <span className="text-rose-500">*</span>
              </label>
              <div className="space-y-1.5">
                <input
                  type="text"
                  value={tempVendor}
                  onChange={e => setTempVendor(e.target.value)}
                  placeholder="Nama Vendor / Mitra Pelaksana"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-pln-500/30"
                />
                {/* Quick select from active contracts */}
                {kontrakJasa.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-slate-500">
                    <span>Pilih Cepat:</span>
                    {Array.from(new Set(kontrakJasa.map(k => k.pt))).map((vName, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setTempVendor(vName)}
                        className={`px-2 py-0.5 rounded-lg border text-[10px] font-medium transition-colors ${
                          tempVendor === vName ? 'bg-pln-100 text-pln-800 border-pln-300 font-bold' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                        }`}
                      >
                        {vName}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Pengawas 1 & 2 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Pengawas Lapangan 1 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={tempPengawas}
                  onChange={e => setTempPengawas(e.target.value)}
                  placeholder="Contoh: Faisal Reza"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-pln-500/30"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Pengawas Lapangan 2 <span className="text-slate-400 font-normal">(Pendamping)</span>
                </label>
                <input
                  type="text"
                  value={tempPengawas2}
                  onChange={e => setTempPengawas2(e.target.value)}
                  placeholder="Contoh: Daud Febriansyah"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-pln-500/30"
                />
              </div>
            </div>

            {/* Vendor Tiang */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Vendor Fabrikasi Tiang
              </label>
              <select
                value={tempVendorTiang}
                onChange={e => setTempVendorTiang(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-pln-500/30"
              >
                <option value="">-- Pilih Vendor Tiang --</option>
                {vendorTiangMaster.map((vt, idx) => (
                  <option key={idx} value={vt}>{vt}</option>
                ))}
              </select>
            </div>

            {/* Kendala Teknis */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Catatan Kendala Teknis Lapangan
              </label>
              <textarea
                rows={3}
                value={tempKendala}
                onChange={e => setTempKendala(e.target.value)}
                placeholder="Tuliskan kendala teknis, cuaca, atau perizinan crossing/ROW..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-pln-500/30"
              />
            </div>
          </div>
        </Modal>
      )}

      {/* BAST Print Modal */}
      {bastWO && (
        <Modal
          isOpen={!!bastWO}
          onClose={() => setBastWO(null)}
          title={`Berita Acara Serah Terima Operasi · ${bastWO.noWo}`}
          maxWidth="2xl"
          footer={
            <>
              <button
                type="button"
                onClick={() => setBastWO(null)}
                className="px-4 py-2 rounded-xl border text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handlePrintBAST}
                className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak BAST (Save as PDF)</span>
              </button>
            </>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Asisten Manager Konstruksi</label>
                <input
                  type="text"
                  value={bastForm.asmanKonstruksi}
                  onChange={e => setBastForm({ ...bastForm, asmanKonstruksi: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Asisten Manager Jaringan</label>
                <input
                  type="text"
                  value={bastForm.asmanJaringan}
                  onChange={e => setBastForm({ ...bastForm, asmanJaringan: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl font-bold"
                />
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-800 mb-2">Kondisi Material Serah Terima</h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b font-bold text-slate-500">
                    <tr>
                      <th className="p-2.5">Material</th>
                      <th className="p-2.5 text-center">Qty Terpasang</th>
                      <th className="p-2.5">Kondisi Fisik</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(bastWO.materials || []).map((m, j) => (
                      <tr key={j}>
                        <td className="p-2.5 font-bold text-slate-800">{m.name}</td>
                        <td className="p-2.5 text-center font-mono font-bold text-pln-700">
                          {Math.min(Number(m.verified) || 0, Number(m.required) || 0)} {m.unit}
                        </td>
                        <td className="p-2.5">
                          <select
                            value={bastForm.conditions[m.code] || 'Baik'}
                            onChange={e =>
                              setBastForm({
                                ...bastForm,
                                conditions: { ...bastForm.conditions, [m.code]: e.target.value }
                              })
                            }
                            className="w-full px-2 py-1 border rounded-lg bg-white font-semibold"
                          >
                            <option value="Baik">Baik</option>
                            <option value="Baik - Perlu Monitoring">Baik - Perlu Monitoring</option>
                            <option value="Perlu Perbaikan">Perlu Perbaikan</option>
                            <option value="Rusak">Rusak</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Material Item Confirmation */}
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
