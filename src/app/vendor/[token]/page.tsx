'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { MapLocationPicker } from '@/components/ui/MapLocationPicker';
import {
  Upload,
  Camera,
  FileText,
  Image as ImageIcon,
  Eye,
  Trash2,
  CheckCircle2,
  X,
  ExternalLink,
  FileCheck,
  Check,
  AlertCircle,
  Printer,
  Calendar,
  Building2,
  UserCheck,
  Package,
  Layers,
  Sparkles,
  ClipboardList
} from 'lucide-react';

export default function VendorPortalPage() {
  const params = useParams();
  const token = params?.token as string;

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'material' | 'tiang' | 'jasa'>('material');

  // Form states for pickup & file upload
  const [pickupMaterial, setPickupMaterial] = useState<string>('');
  const [pickupQty, setPickupQty] = useState<string>('');
  const [pickupSJ, setPickupSJ] = useState<string>('');
  const [pickupProofName, setPickupProofName] = useState<string>('');
  const [uploadedProof, setUploadedProof] = useState<{
    name: string;
    dataUrl: string;
    sizeStr: string;
    isPdf: boolean;
  } | null>(null);

  // Modals
  const [previewModal, setPreviewModal] = useState<{
    title: string;
    url: string;
    isPdf: boolean;
    name: string;
  } | null>(null);

  const [printSlipPickup, setPrintSlipPickup] = useState<any | null>(null);

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Form states for notes/kendala
  const [vendorNote, setVendorNote] = useState<string>('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const loadData = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/vendor/${token}`);
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
        setVendorNote(json.data.workOrder?.vendorCatatan || '');
        if (json.data.workOrder?.materials?.length && !pickupMaterial) {
          setPickupMaterial(json.data.workOrder.materials[0].code || json.data.workOrder.materials[0].name);
        }
      } else {
        setError(json.error || 'Gagal memuat data Work Order.');
      }
    } catch (e: any) {
      setError(e.message || 'Terjadi kesalahan jaringan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  // Handle Tiang Progress Checkbox
  const handleToggleTiangStep = async (index: number, field: 'installedQty' | 'verified') => {
    if (!data?.workOrder) return;
    const newTiangRows = [...(data.workOrder.tiangRows || [])];
    const current = newTiangRows[index];

    if (field === 'verified') {
      current.verified = !current.verified;
      if (current.verified && current.installedQty === 0) {
        current.installedQty = current.qtyWO || 1;
      }
    }

    try {
      setSaving(true);
      const res = await fetch(`/api/vendor/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_VENDOR_PROGRESS',
          payload: { tiangRows: newTiangRows }
        })
      });
      if (res.ok) {
        await loadData();
        showToast('✅ Progres tiang berhasil diperbarui!');
      }
    } finally {
      setSaving(false);
    }
  };

  // Handle Jasa Progress Toggle
  const handleToggleJasa = async (key: string) => {
    if (!data?.workOrder) return;
    const newJasaProgress = {
      ...(data.workOrder.jasaProgress || {}),
      [key]: !data.workOrder.jasaProgress?.[key]
    };

    try {
      setSaving(true);
      const res = await fetch(`/api/vendor/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_VENDOR_PROGRESS',
          payload: { jasaProgress: newJasaProgress }
        })
      });
      if (res.ok) {
        await loadData();
        showToast('✅ Progres tahapan pekerjaan berhasil disimpan!');
      }
    } finally {
      setSaving(false);
    }
  };

  // Handle File Upload for Surat Jalan
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const sizeKb = (file.size / 1024).toFixed(1);
    const sizeStr = file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : `${sizeKb} KB`;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setUploadedProof({
        name: file.name,
        dataUrl,
        sizeStr,
        isPdf
      });
      setPickupProofName(file.name);
      showToast(`Bukti file "${file.name}" berhasil diunggah.`);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveUploadedFile = () => {
    setUploadedProof(null);
    setPickupProofName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  // Handle Submit Pickup
  const handleSubmitPickup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickupMaterial || !pickupQty || !pickupSJ) {
      alert('Mohon lengkapi material, jumlah, dan nomor Surat Jalan.');
      return;
    }

    try {
      setSaving(true);
      const proofPayload = uploadedProof
        ? JSON.stringify({
            name: uploadedProof.name,
            sizeStr: uploadedProof.sizeStr,
            isPdf: uploadedProof.isPdf,
            dataUrl: uploadedProof.dataUrl
          })
        : (pickupProofName || `SJ_${pickupSJ}.pdf`);

      const res = await fetch(`/api/vendor/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SUBMIT_VENDOR_PICKUP',
          payload: {
            material: pickupMaterial,
            qty: pickupQty,
            sj: pickupSJ,
            proofName: proofPayload
          }
        })
      });
      if (res.ok) {
        setPickupQty('');
        setPickupSJ('');
        setPickupProofName('');
        setUploadedProof(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (cameraInputRef.current) cameraInputRef.current.value = '';
        await loadData();
        showToast('✅ Laporan Surat Jalan & bukti fisik material berhasil dikirim!');
      }
    } finally {
      setSaving(false);
    }
  };

  // Handle Save Note / Kendala
  const handleSaveNote = async () => {
    try {
      setSaving(true);
      const res = await fetch(`/api/vendor/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SUBMIT_KENDALA',
          payload: { catatan: vendorNote }
        })
      });
      if (res.ok) {
        await loadData();
        showToast('✅ Catatan kendala berhasil dilaporkan ke Pengawas PLN!');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-700 font-bold">Memuat data Work Order...</p>
        <p className="text-xs text-slate-400 mt-1">Portal Mitra Vendor Lapangan PLN</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-rose-100 p-8 text-center">
          <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto text-3xl mb-4">
            ⚠️
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Akses Work Order Tidak Ditemukan</h2>
          <p className="text-sm text-slate-600 mb-6">
            {error || 'Link ini belum diotorisasi oleh Pengawas Teknik PLN atau token telah kedaluwarsa.'}
          </p>
          <div className="p-4 bg-slate-50 rounded-xl text-left text-xs text-slate-500 space-y-1">
            <p className="font-bold text-slate-700">Panduan:</p>
            <p>• Pastikan Pengawas PLN telah menyetujui pemeriksaan WO ini.</p>
            <p>• Hubungi Pengawas terkait untuk mendapatkan tautan akses terbaru.</p>
          </div>
        </div>
      </div>
    );
  }

  // If WO exists but Pengawas has not reserved materials yet
  if (!data.isReserved) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-amber-200 p-8 text-center">
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto text-3xl mb-4">
            📦
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Menunggu Reservasi Pengawas PLN</h2>
          <p className="text-sm text-slate-600 mb-6">
            Work Order <strong>{data.workOrder?.noWo}</strong> belum selesai direservasi oleh Pengawas Teknik PLN ({data.workOrder?.pengawas}).
          </p>
          <div className="p-4 bg-amber-50/70 border border-amber-200/60 rounded-xl text-left text-xs text-amber-800 space-y-1.5">
            <p className="font-bold">Informasi untuk Rekanan Vendor:</p>
            <p>• Form pengisian Surat Jalan dan tahapan pekerjaan akan aktif secara otomatis begitu Pengawas memvalidasi ketersediaan material di gudang.</p>
            <p>• Silakan koordinasikan dengan Pengawas terkait.</p>
          </div>
        </div>
      </div>
    );
  }

  const wo = data.workOrder;
  const daftung = data.daftung;
  const pickups = data.pickups || [];

  // Calculate Progress
  const jProg = Object.values(wo.jasaProgress || {}).filter(Boolean).length * 20;
  const tTotal = (wo.tiangRows || []).reduce((a: number, b: any) => a + (Number(b.qtyWO) || 0), 0);
  const tDone = (wo.tiangRows || []).reduce((a: number, b: any) => a + (b.verified ? (Number(b.installedQty) || 0) : 0), 0);
  const tProg = tTotal > 0 ? Math.min(100, Math.round((tDone / tTotal) * 100)) : 100;

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 pb-20 font-sans">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-5 right-5 left-5 sm:left-auto sm:w-96 z-50 bg-emerald-700 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center justify-between text-xs font-bold animate-bounce">
          <span>{toastMsg}</span>
          <button onClick={() => setToastMsg(null)} className="ml-2 text-white/80 hover:text-white">✕</button>
        </div>
      )}

      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center shadow-md shadow-blue-500/20 text-base">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black tracking-wider text-blue-600 uppercase">PROMOTOR PLN</span>
                <span className="px-2 py-0.2 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200/60">
                  PORTAL MITRA VENDOR
                </span>
              </div>
              <h1 className="text-sm sm:text-base font-extrabold text-slate-900 font-mono leading-tight">
                {wo.noWo}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 hidden sm:inline-block">
              Vendor: <strong className="text-slate-800">{wo.vendor}</strong>
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              ● {wo.status || 'Aktif'}
            </span>
          </div>
        </div>

        {/* Segmented Tab Navigation */}
        <div className="max-w-5xl mx-auto px-4 flex border-t border-slate-100 overflow-x-auto gap-1 py-1.5 no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('material')}
            className={`py-2 px-3.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'material'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>🚚</span>
            <span>Surat Jalan & Material</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`py-2 px-3.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'info'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>📋</span>
            <span>Rincian WO & Lokasi</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tiang')}
            className={`py-2 px-3.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'tiang'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>🏗️</span>
            <span>Progres Tiang ({tProg}%)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('jasa')}
            className={`py-2 px-3.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'jasa'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>⚡</span>
            <span>Progres Jasa & Kendala ({jProg}%)</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">

        {/* -------------------- TAB 1: SURAT JALAN & PENGAMBILAN MATERIAL -------------------- */}
        {activeTab === 'material' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Form Input Surat Jalan Card */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/70 font-bold flex items-center justify-center text-lg">
                    🚚
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                      Input Pengambilan Material (Surat Jalan)
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Laporkan barang yang diambil dari gudang logistik PLN beserta bukti foto Surat Jalan resmi.
                    </p>
                  </div>
                </div>

                <div className="text-right hidden sm:block">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pelanggan</span>
                  <span className="text-xs font-bold text-slate-800 truncate max-w-[200px] block">{wo.namaPelanggan}</span>
                </div>
              </div>

              <form onSubmit={handleSubmitPickup} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Select Material */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Pilih Material <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={pickupMaterial}
                      onChange={e => setPickupMaterial(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
                    >
                      {(wo.materials || []).map((m: any, i: number) => {
                        const remaining = Math.max(0, (m.required || 0) - (m.verified || 0));
                        return (
                          <option key={i} value={m.code || m.name}>
                            {m.name || m.code} (Sisa Butuh: {remaining} {m.unit})
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Qty Input */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Jumlah Diambil (Qty) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="Contoh: 10"
                      value={pickupQty}
                      onChange={e => setPickupQty(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Nomor Surat Jalan */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nomor Surat Jalan (SJ) Fisik <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: SJ-GDG/2026/0491"
                      value={pickupSJ}
                      onChange={e => setPickupSJ(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
                    />
                  </div>

                  {/* File / Camera Upload Box */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-blue-600" />
                        <span>Unggah Bukti Foto Fisik / Dokumen Surat Jalan</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">Format: JPG, PNG, WEBP, PDF (Maks 10MB)</span>
                    </label>

                    {/* ALWAYS 100% INVISIBLE FILE INPUTS */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*,application/pdf"
                      style={{ display: 'none' }}
                    />
                    <input
                      type="file"
                      ref={cameraInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      capture="environment"
                      style={{ display: 'none' }}
                    />

                    {uploadedProof ? (
                      /* Uploaded Preview Card */
                      <div className="p-3.5 bg-blue-50/70 border-2 border-blue-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                        <div className="flex items-center gap-3 min-w-0">
                          {uploadedProof.isPdf ? (
                            <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200 shadow-xs">
                              <FileText className="w-6 h-6" />
                            </div>
                          ) : (
                            <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-200 border border-slate-300 shrink-0 shadow-xs">
                              <img
                                src={uploadedProof.dataUrl}
                                alt="Preview SJ"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}

                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate flex items-center gap-1.5">
                              <span>{uploadedProof.name}</span>
                              <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">Siap Kirim</span>
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                              Ukuran: {uploadedProof.sizeStr} • {uploadedProof.isPdf ? 'Dokumen PDF' : 'Foto Surat Jalan'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => setPreviewModal({
                              title: `Bukti Surat Jalan: ${pickupSJ || 'Draft'}`,
                              url: uploadedProof.dataUrl,
                              isPdf: uploadedProof.isPdf,
                              name: uploadedProof.name
                            })}
                            className="px-3 py-1.5 bg-white hover:bg-slate-100 text-blue-700 text-xs font-bold rounded-xl border border-blue-200 flex items-center gap-1 shadow-xs transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Lihat Preview</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleRemoveUploadedFile}
                            className="p-1.5 bg-white hover:bg-rose-50 text-rose-600 rounded-xl border border-rose-200 transition-colors"
                            title="Hapus / Ganti File"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Drag & Drop Buttons */
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() => cameraInputRef.current?.click()}
                          className="p-4 rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/40 hover:bg-blue-50 hover:border-blue-400 text-blue-900 text-left flex items-center gap-3 transition-all group"
                        >
                          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                            <Camera className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="block text-xs font-bold text-slate-800 group-hover:text-blue-700">Ambil Foto Fisik SJ</span>
                            <span className="block text-[11px] text-slate-500">Buka kamera HP langsung</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="p-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/70 hover:bg-slate-100 hover:border-slate-400 text-slate-800 text-left flex items-center gap-3 transition-all group"
                        >
                          <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                            <Upload className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="block text-xs font-bold text-slate-800 group-hover:text-slate-900">Pilih dari Galeri / Dokumen</span>
                            <span className="block text-[11px] text-slate-500">Upload Foto atau PDF</span>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit button */}
                <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-slate-100">
                  <p className="text-[11px] text-slate-400">
                    💡 <em>Petugas gudang & pengawas PLN akan memverifikasi fisik material berdasarkan Surat Jalan ini.</em>
                  </p>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    <span>{saving ? 'Menyimpan...' : 'Kirim Laporan Surat Jalan'}</span>
                    <span>📤</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Riwayat Surat Jalan Terkirim Card */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <span>Riwayat Surat Jalan Terkirim</span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-mono font-bold">
                      {pickups.length} Dokumen
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500">Daftar Surat Jalan yang telah diinput dan disinkronkan ke Pengawas & Gudang PLN</p>
                </div>
              </div>

              {pickups.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-600">Belum ada Surat Jalan yang di-submit</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Gunakan formulir di atas untuk melaporkan pengambilan material.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-3.5">Tanggal</th>
                        <th className="py-3 px-3.5">No Surat Jalan</th>
                        <th className="py-3 px-3.5">Item Material</th>
                        <th className="py-3 px-3.5 text-right">Jumlah (Qty)</th>
                        <th className="py-3 px-3.5 text-center">Bukti Fisik</th>
                        <th className="py-3 px-3.5 text-center">Status Gudang</th>
                        <th className="py-3 px-3.5 text-center">Slip Resmi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {pickups.map((p: any, idx: number) => {
                        let proofObj: any = null;
                        try {
                          if (p.proofName && p.proofName.startsWith('{')) {
                            proofObj = JSON.parse(p.proofName);
                          }
                        } catch (e) {}

                        const hasDataUrl = proofObj?.dataUrl || (p.proofName && p.proofName.startsWith('data:'));
                        const previewUrl = proofObj?.dataUrl || p.proofName;
                        const isPdf = proofObj?.isPdf || (p.proofName && p.proofName.toLowerCase().endsWith('.pdf'));

                        return (
                          <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-3.5 text-slate-500 whitespace-nowrap font-medium">{p.date}</td>
                            <td className="py-3 px-3.5 font-mono font-bold text-blue-600 whitespace-nowrap">{p.sj}</td>
                            <td className="py-3 px-3.5 font-bold text-slate-800">{p.material}</td>
                            <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-900">{p.qty}</td>
                            
                            {/* Bukti Fisik Lightbox */}
                            <td className="py-3 px-3.5 text-center">
                              {hasDataUrl ? (
                                <button
                                  type="button"
                                  onClick={() => setPreviewModal({
                                    title: `Bukti Surat Jalan: ${p.sj}`,
                                    url: previewUrl,
                                    isPdf: Boolean(isPdf),
                                    name: proofObj?.name || p.sj
                                  })}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] border border-blue-200 transition-colors"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Lihat Bukti</span>
                                </button>
                              ) : (
                                <span className="text-slate-400 font-mono text-[10px]">
                                  {p.proofName || 'File dilampirkan'}
                                </span>
                              )}
                            </td>

                            {/* Status Verifikasi Gudang */}
                            <td className="py-3 px-3.5 text-center">
                              {p.verified ? (
                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold inline-flex items-center gap-1">
                                  ✓ Terverifikasi Gudang
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold inline-flex items-center gap-1">
                                  ⏳ Menunggu Verifikasi
                                </span>
                              )}
                            </td>

                            {/* Slip Print Button */}
                            <td className="py-3 px-3.5 text-center">
                              <button
                                type="button"
                                onClick={() => setPrintSlipPickup(p)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] border border-slate-200 transition-colors shadow-2xs"
                                title="Lihat dan Cetak Slip Surat Jalan Format Resmi PLN"
                              >
                                <Printer className="w-3.5 h-3.5 text-slate-600" />
                                <span>Slip SJ</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* -------------------- TAB 2: INFO RINCIAN WO & LOKASI -------------------- */}
        {activeTab === 'info' && (
          <div className="space-y-5 animate-fadeIn">
            {/* Status Card (Clean White) */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="inline-block text-[10px] uppercase tracking-wider text-blue-700 font-extrabold px-2.5 py-0.5 rounded-md bg-blue-50 border border-blue-200/80">
                    Pelanggan & Lokasi Pekerjaan
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">{wo.namaPelanggan}</h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl flex items-center gap-1.5">
                    <span>📍</span>
                    <span>{daftung?.alamat || 'Alamat sesuai data survey & permohonan'}</span>
                  </p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4 sm:text-right border border-slate-200/70 shadow-xs">
                  <p className="text-[11px] text-slate-400 font-semibold">Mitra Pelaksana</p>
                  <p className="text-sm font-extrabold text-slate-900 mt-0.5">{wo.vendor}</p>
                  <p className="text-[11px] text-slate-500 mt-1">Pengawas PLN: <strong className="text-slate-800">{wo.pengawas}</strong></p>
                </div>
              </div>

              {/* Quick metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-100 text-center">
                <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/60">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ID Pelanggan</p>
                  <p className="text-sm font-black text-slate-800 mt-0.5 font-mono">{wo.idpel || daftung?.idpel || '-'}</p>
                </div>
                <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/60">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tarif / Daya</p>
                  <p className="text-sm font-black text-slate-800 mt-0.5">{daftung?.tarif || 'R1'} / {daftung?.daya || 1300} VA</p>
                </div>
                <div className="bg-blue-50/60 rounded-xl p-3 border border-blue-200/60">
                  <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Progres Jasa</p>
                  <p className="text-sm font-black text-blue-700 mt-0.5 font-mono">{jProg}%</p>
                </div>
                <div className="bg-emerald-50/60 rounded-xl p-3 border border-emerald-200/60">
                  <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Progres Tiang</p>
                  <p className="text-sm font-black text-emerald-700 mt-0.5 font-mono">{tProg}%</p>
                </div>
              </div>
            </div>

            {/* List of Ordered Materials */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
              <h3 className="text-sm font-extrabold text-slate-900 mb-3 flex items-center">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 mr-2" />
                Daftar Kebutuhan Material Work Order
              </h3>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Kode & Nama Material</th>
                      <th className="py-2.5 px-3 text-center">Satuan</th>
                      <th className="py-2.5 px-3 text-right">Target Kebutuhan</th>
                      <th className="py-2.5 px-3 text-right">Sudah Diambil (SJ)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(wo.materials || []).map((m: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-bold text-slate-800">
                          {m.name || m.code}
                          <span className="block text-[10px] text-slate-400 font-normal">{m.code}</span>
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-500">{m.unit || 'pcs'}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-700">{m.required || 0}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600">{m.verified || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Peta Lokasi & Geotagging */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
              <h3 className="text-sm font-extrabold text-slate-900 mb-3 flex items-center">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 mr-2" />
                Peta Titik Lokasi & Navigasi Lapangan
              </h3>
              <MapLocationPicker
                lat="-6.52414600"
                lng="106.17685700"
                address={daftung?.alamat}
                customerName={wo.namaPelanggan}
                idpel={wo.idpel || daftung?.idpel}
                readOnly={true}
                onChangeCoords={() => {}}
              />
            </div>
          </div>
        )}

        {/* -------------------- TAB 3: PROGRES TIANG -------------------- */}
        {activeTab === 'tiang' && (
          <div className="space-y-5 animate-fadeIn">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Pemancangan & Penegakan Tiang</h3>
                  <p className="text-xs text-slate-500">Centang tahapan tiang yang sudah selesai berdiri tegak di lapangan</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-emerald-600 font-mono">{tProg}%</span>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Progres Tiang</p>
                </div>
              </div>

              {(!wo.tiangRows || wo.tiangRows.length === 0) ? (
                <div className="p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-500">
                  WO ini tidak mencakup item penanaman tiang khusus.
                </div>
              ) : (
                <div className="space-y-3">
                  {wo.tiangRows.map((t: any, idx: number) => (
                    <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/60 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold text-slate-900">{t.name || t.code}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Pabrikan: <strong>{t.vendor || wo.vendorTiang || 'Pabrikan Rekanan'}</strong> | Target: <strong>{t.qtyWO || 1} {t.unit || 'btg'}</strong>
                          </p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <label className="flex items-center space-x-2 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs hover:border-blue-300 transition-colors">
                            <input
                              type="checkbox"
                              checked={Boolean(t.verified)}
                              disabled={saving}
                              onChange={() => handleToggleTiangStep(idx, 'verified')}
                              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            <span className="text-xs font-bold text-slate-800">
                              {t.verified ? '✓ Tiang Berdiri Tegak' : 'Tandai Selesai Tegak'}
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* -------------------- TAB 4: PROGRES JASA & KENDALA -------------------- */}
        {activeTab === 'jasa' && (
          <div className="space-y-6 animate-fadeIn">
            {/* 5 Tahapan Jasa Checklist */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Checklist Pelaksanaan Jasa Lapangan</h3>
                  <p className="text-xs text-slate-500">Perbarui tahapan fisik konstruksi yang telah selesai dikerjakan rekanan</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-blue-600 font-mono">{jProg}%</span>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Progres Jasa</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { key: 'tiang', label: '1. Pemancangan / Erection Tiang (20%)', icon: '🏗️' },
                  { key: 'konstruksi', label: '2. Pemasangan Konstruksi / Travers (20%)', icon: '🔩' },
                  { key: 'penarikan', label: '3. Penarikan Kabel / Stringing (20%)', icon: '🔌' },
                  { key: 'kerangka', label: '4. Pemasangan Kerangka & Aksesoris (20%)', icon: '⚙️' },
                  { key: 'trafo_app', label: '5. Terminasi Trafo / APP Pelanggan (20%)', icon: '⚡' },
                ].map(step => {
                  const isDone = Boolean(wo.jasaProgress?.[step.key]);
                  return (
                    <button
                      key={step.key}
                      type="button"
                      onClick={() => handleToggleJasa(step.key)}
                      disabled={saving}
                      className={`p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
                        isDone
                          ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100/80'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-xl">{step.icon}</span>
                        <span className="text-xs font-bold">{step.label}</span>
                      </div>
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                        isDone ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'
                      }`}>
                        {isDone ? '✓' : ''}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pelaporan Kendala Lapangan */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
              <h3 className="text-base font-extrabold text-slate-900 mb-1">Catatan & Pelaporan Kendala Lapangan</h3>
              <p className="text-xs text-slate-500 mb-3">Tuliskan hambatan teknis (cuaca, izin warga, medan berat) agar langsung dibaca oleh Pengawas PLN</p>

              <textarea
                rows={3}
                value={vendorNote}
                onChange={e => setVendorNote(e.target.value)}
                placeholder="Tuliskan kendala teknis atau hambatan di lapangan..."
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />

              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveNote}
                  disabled={saving}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2"
                >
                  <span>{saving ? 'Menyimpan...' : 'Kirim Catatan ke Pengawas PLN'}</span>
                  <span>💬</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* -------------------- 1. LIGHTBOX PREVIEW MODAL -------------------- */}
      {previewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-blue-600" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{previewModal.title}</h4>
                  <p className="text-[11px] text-slate-500 font-mono">{previewModal.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewModal(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 flex items-center justify-center bg-slate-100/60 min-h-[300px]">
              {previewModal.isPdf ? (
                <div className="w-full h-96 bg-white rounded-xl border border-slate-300 flex flex-col items-center justify-center p-6 text-center">
                  <FileText className="w-16 h-16 text-rose-500 mb-3" />
                  <p className="font-bold text-sm text-slate-800 mb-1">{previewModal.name}</p>
                  <p className="text-xs text-slate-500 mb-4">Dokumen PDF Surat Jalan Pengambilan Material</p>
                  <a
                    href={previewModal.url}
                    download={previewModal.name || 'Surat_Jalan.pdf'}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-2"
                  >
                    <span>Unduh / Buka Dokumen PDF</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              ) : (
                <div className="max-w-full max-h-[60vh] rounded-xl overflow-hidden shadow-md bg-white border border-slate-200">
                  <img
                    src={previewModal.url}
                    alt={previewModal.name}
                    className="max-w-full max-h-[60vh] object-contain"
                  />
                </div>
              )}
            </div>

            <div className="p-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Dokumen bukti fisik resmi pengambilan material vendor.
              </span>
              <button
                type="button"
                onClick={() => setPreviewModal(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- 2. OFFICIAL PLN SURAT JALAN SLIP MODAL -------------------- */}
      {printSlipPickup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-blue-600" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Slip Resmi Surat Jalan Material</h4>
                  <p className="text-[11px] text-slate-500">Format Standar Logistik PT PLN (Persero)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPrintSlipPickup(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Slip Paper */}
            <div className="p-6 overflow-y-auto flex-1 bg-slate-100 flex justify-center">
              <div className="bg-white p-6 sm:p-8 rounded-xl shadow-md border border-slate-200 max-w-xl w-full text-xs font-sans text-slate-900 space-y-4">
                {/* Letterhead */}
                <div className="border-b-2 border-slate-900 pb-3 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-600 text-white font-black flex items-center justify-center text-lg">
                      ⚡
                    </div>
                    <div>
                      <h2 className="font-black text-sm tracking-wider uppercase">PT PLN (PERSERO)</h2>
                      <p className="text-[10px] text-slate-600 font-semibold">UNIT PELAKSANA PELAYANAN PELANGGAN (UP3)</p>
                      <p className="text-[9px] text-slate-400">SISTEM MONITORING & KONTROL LOGISTIK PROMOTOR</p>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <span className="block text-[9px] text-slate-400">NO. SURAT JALAN</span>
                    <span className="block text-xs font-black text-blue-600">{printSlipPickup.sj}</span>
                  </div>
                </div>

                {/* Title */}
                <div className="text-center py-1">
                  <h3 className="text-xs font-black tracking-wider uppercase underline">SURAT BUKTI PENGELUARAN / PENGAMBILAN MATERIAL</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">Tanggal: {printSlipPickup.date}</p>
                </div>

                {/* Meta details grid */}
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px]">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Nomor Work Order (WO):</span>
                    <span className="font-mono font-bold text-slate-900">{wo.noWo}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Vendor / Rekanan:</span>
                    <span className="font-bold text-slate-900">{wo.vendor}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Nama Pelanggan:</span>
                    <span className="font-bold text-slate-900">{wo.namaPelanggan}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Pengawas PLN:</span>
                    <span className="font-bold text-slate-900">{wo.pengawas}</span>
                  </div>
                </div>

                {/* Table of item */}
                <table className="w-full text-left border-collapse border border-slate-300">
                  <thead className="bg-slate-100 font-bold text-[10px] uppercase">
                    <tr>
                      <th className="border border-slate-300 p-2 text-center w-8">No</th>
                      <th className="border border-slate-300 p-2">Deskripsi Material</th>
                      <th className="border border-slate-300 p-2 text-right w-24">Jumlah</th>
                      <th className="border border-slate-300 p-2 text-center w-28">Status Gudang</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-slate-300 p-2 text-center">1</td>
                      <td className="border border-slate-300 p-2 font-bold">{printSlipPickup.material}</td>
                      <td className="border border-slate-300 p-2 text-right font-mono font-bold">{printSlipPickup.qty}</td>
                      <td className="border border-slate-300 p-2 text-center">
                        <span className="text-[10px] font-bold text-emerald-700">
                          {printSlipPickup.verified ? 'TERVERIFIKASI' : 'TERCATAT'}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Signatures */}
                <div className="pt-4 grid grid-cols-2 gap-6 text-center text-[10px] text-slate-700">
                  <div>
                    <p className="font-semibold text-slate-500">Penerima (Mitra Vendor):</p>
                    <div className="h-16 flex items-end justify-center font-bold text-slate-900">
                      ( {wo.vendor} )
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-500">Petugas Gudang / Pengawas PLN:</p>
                    <div className="h-16 flex items-end justify-center font-bold text-slate-900">
                      ( {wo.pengawas} )
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Gunakan tombol cetak untuk menyimpan slip sebagai PDF atau mencetak fisik.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Slip</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrintSlipPickup(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
