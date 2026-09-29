'use client';

import React, { useState, useMemo } from 'react';
import { usePromotor } from '@/context/PromotorContext';
import { SurveyRecord, StandardCategorySelection, MaterialItem } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { MapLocationPicker } from '@/components/ui/MapLocationPicker';
import { useToast } from '@/components/ui/Toast';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  Plus,
  Search,
  Download,
  MapPin,
  Camera,
  Layers,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  FileCheck,
  Building2,
  Trash2,
  Eye,
  UserCheck
} from 'lucide-react';
import * as XLSX from 'xlsx';

const SURVEY_STEPS = ['Data Pelanggan', 'Data Teknis', 'Lokasi & Koordinat', 'Kategori & Material', 'Review & Submit'];

export const SurveyModule: React.FC = () => {
  const { surveys, standards, gudang, saveSurvey, moveSurveyToDaftung } = usePromotor();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [search, setSearch] = useState('');

  // Confirm Dialog State
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
  
  // Wizard Modal
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [surveyDraft, setSurveyDraft] = useState<SurveyRecord | null>(null);

  // Detail Modal
  const [detailSurvey, setDetailSurvey] = useState<SurveyRecord | null>(null);

  // Category selection sub-modal inside Step 4
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [selectedCatName, setSelectedCatName] = useState('');
  const [selectedCatQty, setSelectedCatQty] = useState(1);
  const [selectedCatNote, setSelectedCatNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const activeSurveys = useMemo(
    () => surveys.filter(s => s.status !== 'Historical' && !s.supersededBy),
    [surveys]
  );
  const readyForDaftung = useMemo(
    () => surveys.filter(s => s.status === 'Selesai' && !s.daftungId),
    [surveys]
  );
  const historicalSurveys = useMemo(
    () => surveys.filter(s => s.status === 'Historical' || !!s.supersededBy),
    [surveys]
  );
  const totalMaterialSurvey = useMemo(
    () => surveys.reduce((n, s) => n + s.materials.length, 0),
    [surveys]
  );

  const displayedSurveys = useMemo(() => {
    const list = activeTab === 'active' ? activeSurveys : historicalSurveys;
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter(
      s => s.id.toLowerCase().includes(q) ||
           s.customer.name.toLowerCase().includes(q) ||
           (s.customer.idpel && s.customer.idpel.toLowerCase().includes(q)) ||
           s.surveyor.toLowerCase().includes(q)
    );
  }, [activeTab, activeSurveys, historicalSurveys, search]);

  // Calculate unique Next ID safely
  const getNextSurveyId = () => {
    let maxNum = 0;
    surveys.forEach(s => {
      const match = s.id.match(/SRV-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    return `SRV-${String(maxNum + 1).padStart(4, '0')}`;
  };

  const openNewSurvey = () => {
    const newId = getNextSurveyId();
    const draft: SurveyRecord = {
      id: newId,
      status: 'Draft',
      surveyor: 'Surveyor 01',
      created: new Date().toISOString().slice(0, 10),
      updated: new Date().toISOString().slice(0, 10),
      customer: { idpel: '', name: '', address: '', daya: 16500, tarif: 'B2T', jenis: 'PASANG BARU' },
      technical: { pelangganKhusus: '', ulp: 'ULP RANGKASBITUNG', tipeGardu: 'Portal', kapasitasTrafo: 160, jumlahKabelNaik: 4, penyulang: 'KADUAGUNG' },
      location: { address: '', lat: '-6.52414600', lng: '106.17685700', photos: [] },
      standardSelections: [],
      materials: [],
      daftungId: null,
      supersededBy: null,
    };
    setSurveyDraft(draft);
    setCurrentStep(0);
    setIsWizardOpen(true);
  };

  // Rebuild materials from standard selections
  const recalculateMaterials = (selections: StandardCategorySelection[]): MaterialItem[] => {
    const agg: Record<string, MaterialItem> = {};

    selections.forEach(sel => {
      const s = standards.find(x => x.name === sel.name);
      if (!s) return;
      const multiplier = Math.max(0, Number(sel.qty) || 0);
      if (multiplier <= 0) return;

      Object.entries(s.materials || {}).forEach(([matName, baseQty]) => {
        const qty = (Number(baseQty) || 0) * multiplier;
        if (qty <= 0) return;

        if (!agg[matName]) {
          const g = gudang.find(x => String(x.material).trim() === matName || x.description.includes(matName));
          agg[matName] = {
            code: matName,
            name: g?.description || matName,
            unit: g?.unit || 'pcs',
            qty: 0,
            note: '',
            sourceStandards: [],
          };
        }
        agg[matName].qty = (agg[matName].qty || 0) + qty;
        if (!agg[matName].sourceStandards?.includes(sel.name)) {
          agg[matName].sourceStandards?.push(sel.name);
        }
      });
    });

    return Object.values(agg);
  };

  const handleAddCategory = () => {
    if (!selectedCatName) {
      showToast('Pilih kategori konstruksi', 'warn');
      return;
    }
    if (selectedCatQty <= 0) {
      showToast('Qty harus lebih dari 0', 'warn');
      return;
    }
    if (!surveyDraft) return;

    const nextSelections = [
      ...surveyDraft.standardSelections,
      { name: selectedCatName, qty: selectedCatQty, note: selectedCatNote }
    ];
    const nextMaterials = recalculateMaterials(nextSelections);

    setSurveyDraft({
      ...surveyDraft,
      standardSelections: nextSelections,
      materials: nextMaterials,
    });
    setCatModalOpen(false);
    setSelectedCatName('');
    setSelectedCatQty(1);
    setSelectedCatNote('');
    showToast(`Kategori ${selectedCatName} (Qty: ${selectedCatQty}) berhasil ditambahkan.`, 'success', 'Kategori Ditambahkan');
  };

  const handleRemoveCategory = (index: number) => {
    if (!surveyDraft) return;
    const item = surveyDraft.standardSelections[index];
    setDeleteConfirm({
      isOpen: true,
      title: 'Hapus Kategori Konstruksi',
      message: `Apakah Anda yakin ingin menghapus kategori "${item?.name || 'terpilih'}" beserta kalkulasi materialnya?`,
      onConfirm: () => {
        const nextSelections = surveyDraft.standardSelections.filter((_, i) => i !== index);
        const nextMaterials = recalculateMaterials(nextSelections);
        setSurveyDraft({
          ...surveyDraft,
          standardSelections: nextSelections,
          materials: nextMaterials,
        });
        showToast(`Kategori ${item?.name} berhasil dihapus dari kalkulasi.`, 'info', 'Kategori Dihapus');
      }
    });
  };

  const handleSaveDraft = async () => {
    if (!surveyDraft) return;
    try {
      setIsSaving(true);
      await saveSurvey({
        ...surveyDraft,
        status: 'Draft',
        updated: new Date().toISOString().slice(0, 10),
      });
      setIsWizardOpen(false);
      showToast(
        `Draft survey ${surveyDraft.id} (${surveyDraft.customer.name || 'Tanpa Nama'}) berhasil disimpan ke database.`,
        'success',
        'Draft Tersimpan'
      );
    } catch (err: any) {
      showToast(`Gagal menyimpan draft: ${err.message || 'Terjadi kesalahan sistem'}`, 'error', 'Penyimpanan Gagal');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitSurvey = async () => {
    if (!surveyDraft) return;
    if (!surveyDraft.customer.name) {
      showToast('Nama pelanggan wajib diisi sebelum submit survey.', 'warning', 'Perhatian');
      setCurrentStep(0);
      return;
    }
    if (!surveyDraft.standardSelections.length) {
      showToast('Pilih minimal 1 kategori konstruksi TM pada Langkah 4.', 'warning', 'Perhatian');
      setCurrentStep(3);
      return;
    }

    try {
      setIsSaving(true);
      await saveSurvey({
        ...surveyDraft,
        status: 'Selesai',
        updated: new Date().toISOString().slice(0, 10),
      });
      setIsWizardOpen(false);
      showToast(
        `Survey ${surveyDraft.id} (${surveyDraft.customer.name}) BERHASIL diselesaikan dan siap masuk ke Daftung!`,
        'success',
        'Survey Selesai'
      );
    } catch (err: any) {
      showToast(`Gagal menyelesaikan survey: ${err.message || 'Terjadi kesalahan sistem'}`, 'error', 'Gagal Submit');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportExcel = () => {
    const data = displayedSurveys.map(s => ({
      'ID SURVEY': s.id,
      'NAMA PELANGGAN': s.customer.name,
      'IDPEL': s.customer.idpel || '-',
      'SURVEYOR': s.surveyor,
      'STATUS': s.status,
      'TIPE GARDU': s.technical.tipeGardu || '-',
      'DAYA (VA)': s.customer.daya || '-',
      'TARIF': s.customer.tarif || '-',
      'TOTAL MATERIAL': s.materials.length,
      'TANGGAL': s.updated
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'SURVEY');
    XLSX.writeFile(wb, 'DATA_SURVEY_PELANGGAN.xlsx');
  };

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Survey Aktif</div>
            <div className="text-2xl font-black text-slate-800 mt-1">{activeSurveys.length}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Dalam Proses / Selesai</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-pln-50 text-pln-600 flex items-center justify-center font-bold border border-pln-100">
            <FileCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Siap Daftung</div>
            <div className="text-2xl font-black text-emerald-700 mt-1">{readyForDaftung.length}</div>
            <div className="text-[11px] text-emerald-600/80 mt-0.5">Belum masuk Daftung</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold border border-emerald-100">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Historical</div>
            <div className="text-2xl font-black text-slate-700 mt-1">{historicalSurveys.length}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Snapshot Riwayat Survey</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center font-bold border border-slate-200">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Material</div>
            <div className="text-2xl font-black text-slate-800 mt-1">{totalMaterialSurvey}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Item Komponen Terhitung</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center font-bold border border-slate-200">
            <Building2 className="w-5 h-5" />
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
              onClick={openNewSurvey}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-pln-600 hover:bg-pln-700 text-white text-xs font-bold transition-all shadow-md shadow-pln-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Survey Baru</span>
            </button>

            <div className="flex items-center p-1 bg-slate-200/70 rounded-xl ml-2">
              <button
                type="button"
                onClick={() => setActiveTab('active')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'active' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Aktif ({activeSurveys.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'history' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Historical ({historicalSurveys.length})
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari ID Survey, IDPEL, nama..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pln-500/30 focus:border-pln-500 bg-white w-64"
              />
            </div>

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

        {/* Notice */}
        <div className="px-5 py-3 bg-pln-50/70 border-b border-pln-100 flex items-center justify-between text-xs text-pln-800">
          <span>
            <b>Flow Sistem:</b> Survey $\rightarrow$ Selesai $\rightarrow$ Masukkan Daftung $\rightarrow$ Apply WO. Material survey menjadi <b>baseline</b> kebutuhan dan belum mengurangi stok gudang.
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="p-3.5">ID Survey</th>
                <th className="p-3.5">Pelanggan</th>
                <th className="p-3.5">IDPEL</th>
                <th className="p-3.5">Surveyor</th>
                <th className="p-3.5">Tanggal</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-center">Material</th>
                <th className="p-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {displayedSurveys.map(s => (
                <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3.5 font-bold font-mono text-pln-700">{s.id}</td>
                  <td className="p-3.5 font-bold text-slate-800">{s.customer.name}</td>
                  <td className="p-3.5 font-mono text-slate-500">{s.customer.idpel || '-'}</td>
                  <td className="p-3.5 text-slate-600">{s.surveyor}</td>
                  <td className="p-3.5 text-slate-500">{s.updated}</td>
                  <td className="p-3.5 text-center">
                    <Badge variant={s.status === 'Selesai' ? 'ok' : s.status === 'Draft' ? 'gray' : 'info'}>
                      {s.status}
                    </Badge>
                  </td>
                  <td className="p-3.5 text-center font-semibold text-slate-700">
                    {s.materials.length} item
                  </td>
                  <td className="p-3.5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setDetailSurvey(s)}
                        className="px-2.5 py-1 rounded-lg bg-pln-50 hover:bg-pln-100 text-pln-700 font-bold transition-colors flex items-center gap-1 text-[11px]"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Detail</span>
                      </button>

                      {s.status === 'Selesai' && !s.daftungId && (
                        <button
                          type="button"
                          onClick={() => moveSurveyToDaftung(s.id)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors flex items-center gap-1 text-[11px] shadow-xs"
                        >
                          <UserCheck className="w-3 h-3" />
                          <span>Masukkan Daftung</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5-Step Wizard Modal */}
      {isWizardOpen && surveyDraft && (
        <Modal
          isOpen={isWizardOpen}
          onClose={() => setIsWizardOpen(false)}
          title={
            <div className="flex items-center gap-2">
              <span>Form Survey Pelanggan</span>
              <span className="font-mono text-pln-600 bg-pln-100 px-2 py-0.5 rounded text-xs">
                {surveyDraft.id}
              </span>
            </div>
          }
          maxWidth="4xl"
          position="top"
          footer={
            <div className="w-full flex items-center justify-between">
              <div>
                {currentStep > 0 && (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(prev => prev - 1)}
                    className="flex items-center gap-1 px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Kembali</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSaveDraft}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all flex items-center gap-1.5"
                >
                  {isSaving && <div className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />}
                  <span>{isSaving ? 'Menyimpan...' : 'Simpan Draft'}</span>
                </button>

                {currentStep < 4 ? (
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => {
                      if (currentStep === 0 && !surveyDraft.customer.name.trim()) {
                        showToast('Langkah 1: Nama pelanggan wajib diisi sebelum lanjut.', 'warn');
                        return;
                      }
                      if (currentStep === 3 && surveyDraft.standardSelections.length === 0) {
                        showToast('Langkah 4: Silakan pilih dan tambahkan minimal 1 Kategori Konstruksi TM.', 'warn');
                        return;
                      }
                      setCurrentStep(prev => prev + 1);
                    }}
                    className="flex items-center gap-1 px-5 py-2 rounded-xl bg-pln-600 text-white text-xs font-bold hover:bg-pln-700 shadow-sm disabled:opacity-50 transition-all"
                  >
                    <span>Lanjut</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={handleSubmitSurvey}
                    className="flex items-center gap-1.5 px-6 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all"
                  >
                    {isSaving ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span>{isSaving ? 'Menyimpan ke Sistem...' : 'Submit Survey'}</span>
                  </button>
                )}
              </div>
            </div>
          }
        >
          <div className="space-y-6">
            {/* Stepper Header (Sequential, No Forward Skipping) */}
            <div className="grid grid-cols-5 gap-1.5 p-1.5 bg-slate-100/90 rounded-xl border border-slate-200">
              {SURVEY_STEPS.map((stepName, idx) => {
                const isActive = currentStep === idx;
                const isPassed = currentStep > idx;
                const isLocked = idx > currentStep;

                return (
                  <button
                    key={stepName}
                    type="button"
                    disabled={isLocked}
                    onClick={() => {
                      if (!isLocked) setCurrentStep(idx);
                    }}
                    title={isLocked ? 'Selesaikan langkah sebelumnya terlebih dahulu' : `Buka Langkah ${idx + 1}: ${stepName}`}
                    className={`py-2 px-2 text-center rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                      isActive
                        ? 'bg-white text-pln-700 shadow-sm ring-1 ring-pln-200'
                        : isPassed
                        ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100/70 cursor-pointer'
                        : 'text-slate-400 bg-slate-100/60 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold shrink-0 ${
                      isActive
                        ? 'bg-pln-600 text-white'
                        : isPassed
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-300 text-slate-600'
                    }`}>
                      {idx + 1}
                    </span>
                    <span className="hidden sm:inline truncate">{stepName}</span>
                  </button>
                );
              })}
            </div>

            {/* Step 1: Data Pelanggan */}
            {currentStep === 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Surveyor</label>
                  <input
                    type="text"
                    readOnly
                    value={surveyDraft.surveyor}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    IDPEL <span className="text-slate-400 font-normal">(opsional saat survey)</span>
                  </label>
                  <input
                    type="text"
                    value={surveyDraft.customer.idpel || ''}
                    onChange={e => setSurveyDraft({ ...surveyDraft, customer: { ...surveyDraft.customer, idpel: e.target.value } })}
                    placeholder="Contoh: 562300789984"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-pln-500/30"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Pelanggan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={surveyDraft.customer.name}
                    onChange={e => setSurveyDraft({ ...surveyDraft, customer: { ...surveyDraft.customer, name: e.target.value } })}
                    placeholder="Nama calon pelanggan..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 font-bold focus:ring-2 focus:ring-pln-500/30"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 mb-1">Alamat Pelanggan</label>
                  <textarea
                    rows={2}
                    value={surveyDraft.customer.address || ''}
                    onChange={e => setSurveyDraft({ ...surveyDraft, customer: { ...surveyDraft.customer, address: e.target.value } })}
                    placeholder="Alamat lengkap lokasi..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-pln-500/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Daya (VA)</label>
                  <input
                    type="number"
                    value={surveyDraft.customer.daya || ''}
                    onChange={e => setSurveyDraft({ ...surveyDraft, customer: { ...surveyDraft.customer, daya: Number(e.target.value) || 0 } })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-pln-500/30 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Tarif</label>
                  <input
                    type="text"
                    value={surveyDraft.customer.tarif || ''}
                    onChange={e => setSurveyDraft({ ...surveyDraft, customer: { ...surveyDraft.customer, tarif: e.target.value } })}
                    placeholder="B2T, I2, I3, dsb."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-pln-500/30"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 mb-1">Jenis Transaksi</label>
                  <select
                    value={surveyDraft.customer.jenis || 'PASANG BARU'}
                    onChange={e => setSurveyDraft({ ...surveyDraft, customer: { ...surveyDraft.customer, jenis: e.target.value } })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-pln-500/30 bg-white"
                  >
                    <option value="PASANG BARU">PASANG BARU</option>
                    <option value="PERUBAHAN DAYA">PERUBAHAN DAYA</option>
                    <option value="MULTIGUNA">MULTIGUNA</option>
                    <option value="LAINNYA">LAINNYA</option>
                  </select>
                </div>
              </div>
            )}

            {/* Step 2: Data Teknis */}
            {currentStep === 1 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Pelanggan Khusus</label>
                  <input
                    type="text"
                    value={surveyDraft.technical.pelangganKhusus || ''}
                    onChange={e => setSurveyDraft({ ...surveyDraft, technical: { ...surveyDraft.technical, pelangganKhusus: e.target.value } })}
                    placeholder="Contoh: Industri / Rumah Sakit"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Unit Layanan Pelanggan (ULP)</label>
                  <input
                    type="text"
                    value={surveyDraft.technical.ulp || ''}
                    onChange={e => setSurveyDraft({ ...surveyDraft, technical: { ...surveyDraft.technical, ulp: e.target.value } })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Tipe Gardu</label>
                  <select
                    value={surveyDraft.technical.tipeGardu || 'Portal'}
                    onChange={e => setSurveyDraft({ ...surveyDraft, technical: { ...surveyDraft.technical, tipeGardu: e.target.value } })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white"
                  >
                    <option value="Portal">Portal</option>
                    <option value="Cantol">Cantol</option>
                    <option value="Tembok">Tembok</option>
                    <option value="Beton">Beton</option>
                    <option value="Existing">Existing</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Kapasitas Trafo (kVA)</label>
                  <input
                    type="number"
                    value={surveyDraft.technical.kapasitasTrafo || ''}
                    onChange={e => setSurveyDraft({ ...surveyDraft, technical: { ...surveyDraft.technical, kapasitasTrafo: Number(e.target.value) || 0 } })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Jumlah Kabel Naik</label>
                  <input
                    type="number"
                    value={surveyDraft.technical.jumlahKabelNaik || ''}
                    onChange={e => setSurveyDraft({ ...surveyDraft, technical: { ...surveyDraft.technical, jumlahKabelNaik: Number(e.target.value) || 0 } })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Penyulang</label>
                  <input
                    type="text"
                    value={surveyDraft.technical.penyulang || ''}
                    onChange={e => setSurveyDraft({ ...surveyDraft, technical: { ...surveyDraft.technical, penyulang: e.target.value } })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800"
                  />
                </div>
              </div>
            )}

            {/* Step 3: Lokasi & Koordinat GPS dengan Peta & Geotagging */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <MapLocationPicker
                  lat={surveyDraft.location.lat || '-6.52414600'}
                  lng={surveyDraft.location.lng || '106.17685700'}
                  address={surveyDraft.customer.address}
                  customerName={surveyDraft.customer.name}
                  idpel={surveyDraft.customer.idpel}
                  photos={surveyDraft.location.photos || []}
                  onChangeCoords={(lat, lng) => {
                    setSurveyDraft({
                      ...surveyDraft,
                      location: {
                        ...surveyDraft.location,
                        lat,
                        lng
                      }
                    });
                  }}
                  onUpdatePhotos={(photos) => {
                    setSurveyDraft({
                      ...surveyDraft,
                      location: {
                        ...surveyDraft.location,
                        photos
                      }
                    });
                  }}
                />
              </div>
            )}

            {/* Step 4: Kategori Konstruksi & Material */}
            {currentStep === 3 && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Kategori Konstruksi TM</h3>
                    <p className="text-xs text-slate-500">
                      Pilih kategori standar konstruksi. Material akan dihitung otomatis: <b>Qty Standard $\times$ Qty Kategori</b>.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCatModalOpen(true)}
                    className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Kategori</span>
                  </button>
                </div>

                {/* Categories Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500">
                        <th className="p-3">Kategori Konstruksi</th>
                        <th className="p-3 text-center w-24">Qty Unit</th>
                        <th className="p-3">Keterangan</th>
                        <th className="p-3 text-center w-20">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {surveyDraft.standardSelections.length > 0 ? (
                        surveyDraft.standardSelections.map((sel, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="p-3 font-bold text-slate-800">{sel.name}</td>
                            <td className="p-3 text-center">
                              <input
                                type="number"
                                min="0.1"
                                step="any"
                                value={sel.qty}
                                onChange={e => {
                                  const next = [...surveyDraft.standardSelections];
                                  next[idx].qty = Math.max(0, Number(e.target.value) || 0);
                                  setSurveyDraft({
                                    ...surveyDraft,
                                    standardSelections: next,
                                    materials: recalculateMaterials(next)
                                  });
                                }}
                                className="w-16 text-center py-1 border rounded-lg font-mono font-bold text-xs"
                              />
                            </td>
                            <td className="p-3 text-slate-500">{sel.note || '-'}</td>
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveCategory(idx)}
                                className="p-1 rounded text-rose-500 hover:bg-rose-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="p-6 text-center text-slate-400">
                            Belum ada kategori konstruksi yang dipilih. Klik <b>Tambah Kategori</b> di atas.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Auto Calculated Material */}
                <div>
                  <h4 className="text-xs font-bold text-slate-800 mb-2 flex items-center justify-between">
                    <span>Hasil Kalkulasi Material ({surveyDraft.materials.length} item)</span>
                    <span className="text-[11px] font-normal text-slate-400">Otomatis dijumlahkan per komponen</span>
                  </h4>

                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 sticky top-0">
                          <th className="p-2.5">Material</th>
                          <th className="p-2.5 text-center w-24">Qty Hasil</th>
                          <th className="p-2.5 text-center w-20">Satuan</th>
                          <th className="p-2.5">Sumber Kategori</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {surveyDraft.materials.map((m, idx) => (
                          <tr key={idx}>
                            <td className="p-2.5">
                              <div className="font-bold text-slate-800">{m.code}</div>
                              <div className="text-[10px] text-slate-400">{m.name}</div>
                            </td>
                            <td className="p-2.5 text-center font-bold font-mono text-pln-700">{m.qty}</td>
                            <td className="p-2.5 text-center text-slate-500">{m.unit}</td>
                            <td className="p-2.5">
                              <div className="flex flex-wrap gap-1">
                                {m.sourceStandards?.map(st => (
                                  <span key={st} className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-semibold text-slate-600">
                                    {st}
                                  </span>
                                ))}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Review & Submit */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-800 mb-2 uppercase tracking-wider">Ringkasan Pelanggan</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Nama</span>
                      <span className="font-bold text-slate-800">{surveyDraft.customer.name}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">IDPEL</span>
                      <span className="font-mono text-slate-700">{surveyDraft.customer.idpel || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Daya / Tarif</span>
                      <span className="font-bold text-slate-800">{surveyDraft.customer.daya} VA / {surveyDraft.customer.tarif}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Tipe Gardu</span>
                      <span className="font-bold text-slate-800">{surveyDraft.technical.tipeGardu}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-800 mb-2 uppercase tracking-wider">Kategori Terpilih</h4>
                  <div className="flex flex-wrap gap-2">
                    {surveyDraft.standardSelections.map((c, i) => (
                      <span key={i} className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700">
                        {c.name} ({c.qty} unit)
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                  Total <b>{surveyDraft.materials.length} material</b> telah dihitung secara presisi berdasarkan standar konstruksi TM. Setelah disubmit, admin dapat memasukkan pelanggan ini ke Daftung untuk diterbitkan Work Order.
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Add Category Sub Modal */}
      {catModalOpen && (
        <Modal
          isOpen={catModalOpen}
          onClose={() => setCatModalOpen(false)}
          title="Pilih Kategori Standard Konstruksi"
          footer={
            <>
              <button
                type="button"
                onClick={() => setCatModalOpen(false)}
                className="px-4 py-2 rounded-xl border text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleAddCategory}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
              >
                Tambahkan
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kategori Konstruksi</label>
              <select
                value={selectedCatName}
                onChange={e => setSelectedCatName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white"
              >
                <option value="">-- Pilih Kategori --</option>
                {standards.map(s => (
                  <option key={s.id} value={s.name}>
                    {s.name} {s.active ? '' : '(Nonaktif)'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Qty Unit Konstruksi</label>
              <input
                type="number"
                min="0.1"
                step="any"
                value={selectedCatQty}
                onChange={e => setSelectedCatQty(Math.max(0.1, Number(e.target.value) || 1))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Catatan</label>
              <input
                type="text"
                value={selectedCatNote}
                onChange={e => setSelectedCatNote(e.target.value)}
                placeholder="Opsional keterangan..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Detail Modal */}
      {detailSurvey && (
        <Modal
          isOpen={!!detailSurvey}
          onClose={() => setDetailSurvey(null)}
          title={`Detail Survey & Peta Lokasi · ${detailSurvey.id}`}
          maxWidth="4xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <div>
                {detailSurvey.status === 'Selesai' && !detailSurvey.daftungId && (
                  <button
                    type="button"
                    onClick={() => {
                      moveSurveyToDaftung(detailSurvey.id);
                      setDetailSurvey(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 flex items-center gap-1.5"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Masukkan ke Daftung</span>
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setDetailSurvey(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Tutup
              </button>
            </div>
          }
        >
          <div className="space-y-5 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Pelanggan</span>
                <span className="font-bold text-slate-800 text-sm mt-0.5 block">{detailSurvey.customer.name}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">IDPEL</span>
                <span className="font-mono font-bold text-blue-600 text-sm mt-0.5 block">{detailSurvey.customer.idpel || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Tarif / Daya</span>
                <span className="font-bold text-slate-800 text-sm mt-0.5 block">{detailSurvey.customer.tarif} / {detailSurvey.customer.daya} VA</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">ULP</span>
                <span className="font-bold text-slate-800 text-sm mt-0.5 block">{detailSurvey.technical.ulp || '-'}</span>
              </div>
            </div>

            {/* Interactive Map & Geotag Viewer */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <h4 className="font-extrabold text-slate-800 mb-3 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <span>🗺️</span>
                <span>Peta Titik Koordinat & Foto Geotagging</span>
              </h4>
              <MapLocationPicker
                lat={detailSurvey.location.lat || '-6.52414600'}
                lng={detailSurvey.location.lng || '106.17685700'}
                address={detailSurvey.customer.address}
                customerName={detailSurvey.customer.name}
                idpel={detailSurvey.customer.idpel}
                photos={detailSurvey.location.photos || []}
                readOnly={true}
                onChangeCoords={() => {}}
              />
            </div>

            {/* Materials List */}
            <div>
              <h4 className="font-extrabold text-slate-800 mb-2 text-xs uppercase tracking-wider">
                Material Hasil Survey ({detailSurvey.materials.length} item)
              </h4>
              <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-52 overflow-y-auto shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 font-bold text-slate-600 sticky top-0 border-b">
                    <tr>
                      <th className="p-2.5">Material</th>
                      <th className="p-2.5 text-center">Qty</th>
                      <th className="p-2.5 text-center">Satuan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {detailSurvey.materials.map((m, i) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="p-2.5 font-bold text-slate-800">{m.name || m.code}</td>
                        <td className="p-2.5 text-center font-bold font-mono text-blue-600">{m.qty}</td>
                        <td className="p-2.5 text-center text-slate-500">{m.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm(prev => ({ ...prev, isOpen: false }))}
        onConfirm={deleteConfirm.onConfirm}
        title={deleteConfirm.title}
        message={deleteConfirm.message}
        confirmText="Ya, Hapus"
        cancelText="Batal"
      />
    </div>
  );
};
