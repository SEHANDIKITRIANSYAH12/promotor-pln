'use client';

import React, { useState, useMemo } from 'react';
import { usePromotor } from '@/context/PromotorContext';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import {
  Truck,
  FileCheck,
  Upload,
  CheckCircle2,
  Plus,
  Trash2,
  Eye,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export const VendorModule: React.FC = () => {
  const {
    workorders,
    vendorTiangMaster,
    pickupHistory,
    processVendorPickup,
    verifyVendorProof,
    saveVendorTiang,
    updateWOTiang,
    updateWOMaterials
  } = usePromotor();
  const { showToast } = useToast();

  const [activeSubTab, setActiveSubTab] = useState<'pickup' | 'tiang'>('pickup');

  // Pickup Sub-tab State
  const [selectedVendor, setSelectedVendor] = useState<string>('PT. TRI STARS NUSANTARA');
  const [selectedWO, setSelectedWO] = useState<string>('');
  const [selectedPickupIndices, setSelectedPickupIndices] = useState<number[]>([]);
  const [pickupQtys, setPickupQtys] = useState<Record<number, number>>({});
  const [suratJalanNo, setSuratJalanNo] = useState<string>('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  // Vendor Proof Preview Modal
  const [previewProof, setPreviewProof] = useState<any | null>(null);

  // Master Vendor Tiang State
  const [newVendorTiangModal, setNewVendorTiangModal] = useState(false);
  const [newVTName, setNewVTName] = useState('');
  const [selectedTiangWO, setSelectedTiangWO] = useState<string>('');

  // Vendor list across WOs
  const vendorList = useMemo(() => {
    const set = new Set<string>();
    workorders.forEach(w => {
      if (w.vendor) set.add(w.vendor);
    });
    const arr = Array.from(set);
    return arr.length ? arr : ['PT. TRI STARS NUSANTARA', 'PT Fakhri Putra Utama', 'PT Datu Nahima Teknik'];
  }, [workorders]);

  // Current WO list for selected vendor
  const vendorWOs = useMemo(() => {
    return workorders.filter(w => w.vendor === selectedVendor);
  }, [workorders, selectedVendor]);

  // Active WO
  const currentWO = useMemo(() => {
    if (!vendorWOs.length) return null;
    return vendorWOs.find(w => w.noWo === selectedWO) || vendorWOs[0];
  }, [vendorWOs, selectedWO]);

  // Handle process pickup
  const handleProcessPickup = async () => {
    if (!currentWO) {
      showToast('Pilih Work Order terlebih dahulu', 'warn');
      return;
    }
    if (!selectedPickupIndices.length) {
      showToast('Pilih minimal 1 material yang akan diambil', 'warn');
      return;
    }
    if (!suratJalanNo.trim()) {
      showToast('Nomor Surat Jalan wajib diisi', 'warn');
      return;
    }

    const pickupsToSave: any[] = [];
    const updatedMats = JSON.parse(JSON.stringify(currentWO.materials || []));

    selectedPickupIndices.forEach(idx => {
      const m = updatedMats[idx];
      const takeQty = pickupQtys[idx] ?? Math.max(0, (m.reserved || 0) - (m.verified || 0));
      if (takeQty > 0) {
        m.verified = Math.min(m.required, (m.verified || 0) + takeQty);
        pickupsToSave.push({
          woNo: currentWO.noWo,
          vendor: selectedVendor,
          material: m.name,
          qty: `${takeQty} ${m.unit}`,
          sj: suratJalanNo.trim(),
          proofName: uploadFile ? uploadFile.name : `SuratJalan_${suratJalanNo}.pdf`
        });
      }
    });

    if (!pickupsToSave.length) {
      showToast('Qty pengambilan harus lebih dari 0', 'warn');
      return;
    }

    await updateWOMaterials(currentWO.noWo, updatedMats);
    await processVendorPickup(pickupsToSave);

    setSelectedPickupIndices([]);
    setSuratJalanNo('');
    setUploadFile(null);
    showToast('Pengambilan material dan Surat Jalan berhasil disimpan!', 'success');
  };

  // Tiang WO list
  const tiangWOs = useMemo(() => {
    return workorders.filter(w => (w.tiangRows || []).length > 0);
  }, [workorders]);

  const currentTiangWO = useMemo(() => {
    if (!tiangWOs.length) return null;
    return tiangWOs.find(w => w.noWo === selectedTiangWO) || tiangWOs[0];
  }, [tiangWOs, selectedTiangWO]);

  return (
    <div className="space-y-6">
      {/* Sub Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveSubTab('pickup')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeSubTab === 'pickup'
              ? 'bg-pln-600 text-white shadow-md shadow-pln-600/20'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Pengambilan Material & Surat Jalan</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('tiang')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeSubTab === 'tiang'
              ? 'bg-pln-600 text-white shadow-md shadow-pln-600/20'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>Master & Progress Vendor Tiang</span>
        </button>
      </div>

      {/* Sub Tab 1: Pengambilan Material */}
      {activeSubTab === 'pickup' && (
        <div className="space-y-6">
          {/* Top Selector Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Pilih Vendor Pelaksana
                </label>
                <select
                  value={selectedVendor}
                  onChange={e => {
                    setSelectedVendor(e.target.value);
                    setSelectedPickupIndices([]);
                  }}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white"
                >
                  {vendorList.map(v => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Pilih Work Order
                </label>
                <select
                  value={currentWO?.noWo || ''}
                  onChange={e => {
                    setSelectedWO(e.target.value);
                    setSelectedPickupIndices([]);
                  }}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-pln-700 bg-white font-mono"
                >
                  {vendorWOs.map(w => (
                    <option key={w.noWo} value={w.noWo}>
                      {w.noWo} — {w.namaPelanggan}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Pelanggan: <b className="text-slate-800">{currentWO?.namaPelanggan || '-'}</b>
            </div>
          </div>

          {/* Section 1: Material Siap Diambil */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Truck className="w-4 h-4 text-pln-600" />
                <span>1. Material Siap Diambil (Alokasi Reservasi)</span>
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500">
                    <th className="p-3 text-center w-14">Pilih</th>
                    <th className="p-3">Material</th>
                    <th className="p-3 text-center w-24">Satuan</th>
                    <th className="p-3 text-center w-28">Qty Reserved</th>
                    <th className="p-3 text-center w-28">Sudah Diambil</th>
                    <th className="p-3 text-center w-36">Qty Ambil Sekarang</th>
                    <th className="p-3 text-center w-28">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentWO && currentWO.materials?.length ? (
                    currentWO.materials.map((m, idx) => {
                      const remain = Math.max(0, (m.reserved || 0) - (m.verified || 0));
                      const isSelected = selectedPickupIndices.includes(idx);
                      const isDone = remain <= 0;

                      return (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              disabled={isDone}
                              checked={isSelected}
                              onChange={e => {
                                if (e.target.checked) {
                                  setSelectedPickupIndices(prev => [...prev, idx]);
                                  setPickupQtys(prev => ({ ...prev, [idx]: remain }));
                                } else {
                                  setSelectedPickupIndices(prev => prev.filter(x => x !== idx));
                                }
                              }}
                              className="w-4 h-4 rounded text-pln-600 focus:ring-pln-500 cursor-pointer"
                            />
                          </td>
                          <td className="p-3 font-bold text-slate-800">
                            <div>{m.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">Kode {m.code}</div>
                          </td>
                          <td className="p-3 text-center text-slate-500">{m.unit}</td>
                          <td className="p-3 text-center font-mono font-bold text-slate-700">{m.reserved || 0}</td>
                          <td className="p-3 text-center font-mono font-bold text-emerald-600">{m.verified || 0}</td>
                          <td className="p-3 text-center">
                            <input
                              type="number"
                              min="1"
                              max={remain}
                              disabled={isDone || !isSelected}
                              value={pickupQtys[idx] ?? remain}
                              onChange={e =>
                                setPickupQtys({
                                  ...pickupQtys,
                                  [idx]: Math.min(remain, Math.max(1, Number(e.target.value) || 1))
                                })
                              }
                              className="w-20 text-center py-1 border rounded-lg font-mono font-bold text-pln-700 bg-white"
                            />
                          </td>
                          <td className="p-3 text-center">
                            <Badge variant={isDone ? 'ok' : (m.verified || 0) > 0 ? 'warn' : 'info'}>
                              {isDone ? 'Sudah Diambil' : (m.verified || 0) > 0 ? 'Sebagian' : 'Siap Ambil'}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-400">
                        Belum ada material yang siap diambil untuk WO ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Surat Jalan Form */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Upload className="w-4 h-4 text-emerald-600" />
              <span>2. Input Bukti Surat Jalan Pengambilan</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nomor Surat Jalan *</label>
                <input
                  type="text"
                  placeholder="Contoh: SJ-2026-0091"
                  value={suratJalanNo}
                  onChange={e => setSuratJalanNo(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl font-bold font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">File Bukti Surat Jalan (PDF / Foto)</label>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={e => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-pln-50 file:text-pln-700 hover:file:bg-pln-100 border border-slate-200 rounded-xl p-1.5"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleProcessPickup}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Proses Pengambilan & Simpan Surat Jalan</span>
              </button>
            </div>
          </div>

          {/* Section 3: Riwayat Surat Jalan */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                3. Riwayat Transaksi Pengambilan Material
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b font-bold text-slate-500">
                    <th className="p-3">Tanggal</th>
                    <th className="p-3">No WO</th>
                    <th className="p-3">Vendor</th>
                    <th className="p-3">Material</th>
                    <th className="p-3 text-center">Qty</th>
                    <th className="p-3">No Surat Jalan</th>
                    <th className="p-3 text-center">Bukti & Verifikasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pickupHistory.length > 0 ? (
                    pickupHistory.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/50">
                        <td className="p-3 text-slate-500">{p.date}</td>
                        <td className="p-3 font-mono font-bold text-pln-700">{p.woNo}</td>
                        <td className="p-3 font-semibold text-slate-700">{p.vendor}</td>
                        <td className="p-3 font-bold text-slate-800">{p.material}</td>
                        <td className="p-3 text-center font-mono font-bold">{p.qty}</td>
                        <td className="p-3 font-mono font-bold text-slate-700">{p.sj}</td>
                        <td className="p-3 text-center">
                          {p.verified ? (
                            <button
                              type="button"
                              onClick={() => setPreviewProof(p)}
                              className="px-3 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-[11px] hover:bg-emerald-200"
                            >
                              ✓ Tersimpan
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={async () => {
                                await verifyVendorProof(p.sj);
                                showToast(`Surat Jalan ${p.sj} diverifikasi oleh Pengawas!`, 'success');
                              }}
                              className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] shadow-xs"
                            >
                              Verifikasi Pengawas
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-400">
                        Belum ada riwayat pengambilan material.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Sub Tab 2: Vendor Tiang */}
      {activeSubTab === 'tiang' && (
        <div className="space-y-6">
          {/* Master Vendor Tiang */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Master Vendor Tiang
                </h3>
                <p className="text-[11px] text-slate-400">Penyedia tiang beton terpisah dari vendor pelaksana jasa</p>
              </div>
              <button
                type="button"
                onClick={() => setNewVendorTiangModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Vendor Tiang</span>
              </button>
            </div>

            <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {vendorTiangMaster.map(name => (
                <div key={name} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">{name}</span>
                  <Badge variant="ok">Terdaftar</Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Progress Pemasangan Tiang */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <label className="text-xs font-bold text-slate-700">Pilih Work Order:</label>
                <select
                  value={currentTiangWO?.noWo || ''}
                  onChange={e => setSelectedTiangWO(e.target.value)}
                  className="px-3 py-1.5 border rounded-xl text-xs font-mono font-bold bg-white text-pln-700"
                >
                  {tiangWOs.map(w => (
                    <option key={w.noWo} value={w.noWo}>
                      {w.noWo} — {w.namaPelanggan}
                    </option>
                  ))}
                </select>
              </div>

              <span className="text-xs text-slate-500">
                Vendor Tiang: <b className="text-slate-800">{currentTiangWO?.vendorTiang || '-'}</b>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b font-bold text-slate-500">
                    <th className="p-3">Material Tiang</th>
                    <th className="p-3">Vendor Tiang</th>
                    <th className="p-3 text-center w-24">Qty WO</th>
                    <th className="p-3 text-center w-36">Qty Terpasang</th>
                    <th className="p-3 text-center w-28">Progress</th>
                    <th className="p-3 text-center w-32">Status Verifikasi</th>
                    <th className="p-3 text-center w-36">Aksi Pengawas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentTiangWO && currentTiangWO.tiangRows?.length ? (
                    currentTiangWO.tiangRows.map((t, idx) => (
                      <tr key={idx}>
                        <td className="p-3 font-bold text-slate-800">{t.name}</td>
                        <td className="p-3 text-slate-600">{t.vendor}</td>
                        <td className="p-3 text-center font-mono font-bold">{t.qtyWO} batang</td>
                        <td className="p-3 text-center">
                          <input
                            type="number"
                            min="0"
                            max={t.qtyWO}
                            value={t.installedQty || 0}
                            onChange={async e => {
                              const next = [...currentTiangWO.tiangRows];
                              next[idx].installedQty = Math.max(0, Math.min(t.qtyWO, Number(e.target.value) || 0));
                              next[idx].verified = false;
                              await updateWOTiang(currentTiangWO.noWo, next);
                            }}
                            className="w-20 text-center py-1 border rounded-lg font-mono font-bold text-pln-700"
                          />
                        </td>
                        <td className="p-3 text-center font-mono font-bold">
                          {Math.min(100, Math.round(((t.installedQty || 0) / (t.qtyWO || 1)) * 100))}%
                        </td>
                        <td className="p-3 text-center">
                          <Badge variant={t.verified ? 'ok' : 'warn'}>
                            {t.verified ? 'Terverifikasi' : 'Menunggu'}
                          </Badge>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            disabled={t.verified || (t.installedQty || 0) < t.qtyWO}
                            onClick={async () => {
                              const next = [...currentTiangWO.tiangRows];
                              next[idx].verified = true;
                              next[idx].verifiedQty = next[idx].installedQty;
                              await updateWOTiang(currentTiangWO.noWo, next);
                              showToast('Pemasangan tiang berhasil diverifikasi Pengawas!', 'success');
                            }}
                            className={`px-3 py-1 rounded-lg text-xs font-bold ${
                              t.verified
                                ? 'bg-emerald-100 text-emerald-800'
                                : (t.installedQty || 0) >= t.qtyWO
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            }`}
                          >
                            {t.verified ? 'Terverifikasi' : 'Verifikasi'}
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-400">
                        Tidak ada alokasi material tiang untuk Work Order ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add Vendor Tiang Modal */}
      {newVendorTiangModal && (
        <Modal
          isOpen={newVendorTiangModal}
          onClose={() => setNewVendorTiangModal(false)}
          title="Tambah Vendor Tiang Baru"
          footer={
            <>
              <button
                type="button"
                onClick={() => setNewVendorTiangModal(false)}
                className="px-4 py-2 border text-xs font-bold rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!newVTName.trim()) {
                    showToast('Nama vendor wajib diisi', 'warn');
                    return;
                  }
                  await saveVendorTiang(newVTName.trim());
                  setNewVendorTiangModal(false);
                  setNewVTName('');
                  showToast('Vendor tiang baru berhasil ditambahkan!', 'success');
                }}
                className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl"
              >
                Simpan
              </button>
            </>
          }
        >
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nama Vendor Tiang *</label>
            <input
              type="text"
              placeholder="Contoh: PT Beton Mandiri Jaya"
              value={newVTName}
              onChange={e => setNewVTName(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl text-xs"
            />
          </div>
        </Modal>
      )}

      {/* Proof Preview Modal */}
      {previewProof && (
        <Modal
          isOpen={!!previewProof}
          onClose={() => setPreviewProof(null)}
          title={`Bukti Surat Jalan · ${previewProof.sj}`}
          footer={
            <button
              type="button"
              onClick={() => setPreviewProof(null)}
              className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600"
            >
              Tutup
            </button>
          }
        >
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl">
              <div>
                <span className="text-slate-400 block text-[10px]">Nomor Surat Jalan</span>
                <span className="font-mono font-bold text-slate-800">{previewProof.sj}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Work Order</span>
                <span className="font-mono font-bold text-pln-700">{previewProof.woNo}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Vendor</span>
                <span className="font-bold text-slate-800">{previewProof.vendor}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Material Diambil</span>
                <span className="font-bold text-slate-800">{previewProof.material} ({previewProof.qty})</span>
              </div>
            </div>

            <div className="p-4 border rounded-xl bg-emerald-50 text-emerald-900 flex items-center justify-between">
              <div>
                <span className="block font-bold">Dokumen Fisik Terverifikasi</span>
                <span className="text-[11px] text-emerald-700 font-mono">File: {previewProof.proofName || 'SuratJalan.pdf'}</span>
              </div>
              <Badge variant="ok">Tersimpan</Badge>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
