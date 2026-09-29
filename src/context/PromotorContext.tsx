'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  StandardKonstruksiItem,
  GudangMaterialRecord,
  SurveyRecord,
  DaftungRecord,
  WorkOrderRecord,
  KontrakJasaRecord,
  KontrakMaterialRecord,
  VendorPickupItem,
  MaterialItem,
  UserRole,
  UserProfile
} from '@/lib/types';

export const USERS_PRESET: UserProfile[] = [
  {
    id: 'usr_admin',
    name: 'Budi Santoso, S.T.',
    role: 'superadmin',
    roleTitle: 'Super Administrator / Manager ULP',
    unit: 'PLN ULP Rangkasbitung',
    avatar: '👨‍💼',
  },
  {
    id: 'usr_surveyor',
    name: 'Ahmad Fauzi',
    role: 'surveyor',
    roleTitle: 'Petugas Survey Lapangan',
    unit: 'PLN ULP Rangkasbitung',
    avatar: '👷‍♂️',
  },
  {
    id: 'usr_pengawas',
    name: 'Faisal Reza, S.T.',
    role: 'pengawas',
    roleTitle: 'Pengawas Teknik Konstruksi & Jaringan',
    unit: 'PLN ULP Rangkasbitung',
    avatar: '🕵️‍♂️',
  },
  {
    id: 'usr_gudang',
    name: 'Siti Rahmawati',
    role: 'admin_gudang',
    roleTitle: 'Admin Logistik & Gudang',
    unit: 'Gudang Rangkasbitung',
    avatar: '📦',
  }
];

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  superadmin: ['std', 'survey', 'daftung', 'wo', 'pengawasan', 'gudang', 'contract', 'material'],
  surveyor: ['survey', 'std'],
  pengawas: ['pengawasan', 'daftung', 'wo', 'material', 'std'],
  admin_gudang: ['gudang', 'contract', 'material']
};

interface PromotorContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  loading: boolean;
  isSyncing: boolean;
  standards: StandardKonstruksiItem[];
  stdHeaders: string[];
  gudang: GudangMaterialRecord[];
  surveys: SurveyRecord[];
  daftung: DaftungRecord[];
  workorders: WorkOrderRecord[];
  kontrakJasa: KontrakJasaRecord[];
  kontrakMaterial: KontrakMaterialRecord[];
  vendorTiangMaster: string[];
  pickupHistory: VendorPickupItem[];
  
  // RBAC User & Roles
  currentUser: UserProfile;
  setCurrentUser: (user: UserProfile) => void;
  switchRole: (role: UserRole) => void;
  availableUsers: UserProfile[];
  canAccessTab: (tabId: string) => boolean;

  // Refresh data
  refreshData: (isInitial?: boolean) => Promise<void>;

  // Survey Actions
  saveSurvey: (record: SurveyRecord) => Promise<void>;
  moveSurveyToDaftung: (surveyId: string) => Promise<void>;
  
  // Daftung Actions
  saveManualDaftung: (record: Partial<DaftungRecord>) => Promise<void>;
  updateDaftungIdpel: (id: string, idpel: string) => Promise<void>;
  toggleDaftungFlag: (id: string, flag: 'nidi' | 'slo', value: boolean) => Promise<void>;
  
  // WO Actions
  createWOFromDaftung: (payload: any) => Promise<void>;
  updateWOMaterials: (noWo: string, materials: MaterialItem[]) => Promise<void>;
  updateWOJasaProgress: (noWo: string, jasaProgress?: any, jasaWeights?: any) => Promise<void>;
  updateWOTiang: (noWo: string, tiangRows: any[]) => Promise<void>;
  updateWOKendala: (noWo: string, ketKendala: string) => Promise<void>;
  updateWorkOrder: (noWo: string, data: { vendor?: string; pengawas?: string; pengawas2?: string; vendorTiang?: string; ketKendala?: string }) => Promise<void>;
  saveBAST: (noWo: string, bast: any) => Promise<void>;
  
  // Vendor Approval & Link from Pengawas
  approveWOForVendor: (noWo: string) => Promise<string>;
  updateWOVendorCatatan: (noWo: string, catatan: string) => Promise<void>;
  
  // Kontrak Actions
  saveKontrakJasa: (record: KontrakJasaRecord) => Promise<void>;
  saveKontrakMaterial: (record: KontrakMaterialRecord) => Promise<void>;
  toggleKontrakMaterialCheck: (contractNo: string, materialCode: string, checked: boolean) => Promise<void>;
  
  // Gudang & Standard Actions
  updateGudangStok: (material: string, sap: number, fisik: number, description?: string, unit?: string, keterangan?: string) => Promise<void>;
  deleteGudangMaterial: (material: string) => Promise<void>;
  updateStandardQty: (name: string, materials: Record<string, number>, active?: boolean) => Promise<void>;
  
  // Vendor Actions
  processVendorPickup: (pickups: any[]) => Promise<void>;
  verifyVendorProof: (sj: string) => Promise<void>;
  saveVendorTiang: (name: string) => Promise<void>;

  // Calculations
  matStock: (code: string) => number;
  jasaProgress: (w: WorkOrderRecord) => number;
  materialProgress: (w: WorkOrderRecord) => number;
  tiangProgress: (w: WorkOrderRecord) => number;
  combinedComplete: (w: WorkOrderRecord) => boolean;
  jasaTerpakai: (contractNo: string) => number;
  jasaSisa: (c: KontrakJasaRecord) => number;
  transitMaterialMap: Record<string, number>;
  totalTransit: number;
}

const PromotorContext = createContext<PromotorContextType | undefined>(undefined);

export function PromotorProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserProfile>(USERS_PRESET[0]);
  const [activeTab, setActiveTab] = useState<string>('std');
  const [loading, setLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const [standards, setStandards] = useState<StandardKonstruksiItem[]>([]);
  const [gudang, setGudang] = useState<GudangMaterialRecord[]>([]);
  const [surveys, setSurveys] = useState<SurveyRecord[]>([]);
  const [daftung, setDaftung] = useState<DaftungRecord[]>([]);
  const [workorders, setWorkorders] = useState<WorkOrderRecord[]>([]);
  const [kontrakJasa, setKontrakJasa] = useState<KontrakJasaRecord[]>([]);
  const [kontrakMaterial, setKontrakMaterial] = useState<KontrakMaterialRecord[]>([]);
  const [vendorTiangMaster, setVendorTiangMaster] = useState<string[]>([]);
  const [pickupHistory, setPickupHistory] = useState<VendorPickupItem[]>([]);

  // Check role access
  const canAccessTab = (tabId: string) => {
    const allowed = ROLE_PERMISSIONS[currentUser.role] || [];
    return allowed.includes(tabId);
  };

  const switchRole = (role: UserRole) => {
    const found = USERS_PRESET.find(u => u.role === role) || USERS_PRESET[0];
    setCurrentUser(found);
    localStorage.setItem('promotor_user_role', role);
    
    // Auto redirect tab if current tab is not permitted
    const allowed = ROLE_PERMISSIONS[role] || [];
    if (!allowed.includes(activeTab) && allowed.length > 0) {
      setActiveTab(allowed[0]);
    }
  };

  const applyData = (data: any) => {
    if (!data) return;
    const sortedStandards = (data.standards || []).sort((a: any, b: any) =>
      a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
    );
    setStandards(sortedStandards);
    setGudang(data.gudang || []);
    setSurveys(data.surveys || []);
    setDaftung(data.daftung || []);
    setWorkorders(data.workorders || []);
    setKontrakJasa(data.kontrakJasa || []);
    setKontrakMaterial(data.kontrakMaterial || []);
    setVendorTiangMaster(data.vendorTiang || []);
    setPickupHistory(data.pickupHistory || []);
  };

  const refreshData = async (isInitial: boolean = false) => {
    try {
      setIsSyncing(true);
      if (isInitial && standards.length === 0) {
        setLoading(true);
      }
      const res = await fetch('/api/promotor', { cache: 'no-store' });
      const json = await res.json();
      if (json.success && json.data) {
        applyData(json.data);
        try {
          localStorage.setItem('promotor_cached_v1', JSON.stringify(json.data));
        } catch (_) {}
      }
    } catch (e) {
      console.error('Failed to load data:', e);
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    // 1. Restore user role
    const savedRole = localStorage.getItem('promotor_user_role') as UserRole;
    if (savedRole && ROLE_PERMISSIONS[savedRole]) {
      const found = USERS_PRESET.find(u => u.role === savedRole);
      if (found) setCurrentUser(found);
    }

    // 2. Instant cache hydration for 0ms initial load
    try {
      const cached = localStorage.getItem('promotor_cached_v1');
      if (cached) {
        const parsed = JSON.parse(cached);
        applyData(parsed);
        setLoading(false);
      }
    } catch (_) {}

    // 3. Silent revalidation in background
    refreshData(true);
  }, []);

  // Unique standard material headers
  const stdHeaders = useMemo(() => {
    const set = new Set<string>();
    standards.forEach(s => {
      Object.keys(s.materials || {}).forEach(k => set.add(k));
    });
    return Array.from(set);
  }, [standards]);

  // Helpers & Calculations
  const matStock = (code: string) => {
    const g = gudang.find(
      x => String(x.material).trim().toUpperCase() === String(code || '').trim().toUpperCase() ||
           String(x.description).toLowerCase().includes(String(code || '').toLowerCase())
    );
    return g ? Number(g.fisik) || 0 : 0;
  };

  const materialProgress = (w: WorkOrderRecord) => {
    const total = (w.materials || []).reduce((s, m) => s + (Number(m.required) || 0), 0);
    const got = (w.materials || []).reduce((s, m) => s + Math.min(Number(m.verified) || 0, Number(m.required) || 0), 0);
    return total > 0 ? Math.round((got / total) * 100) : 0;
  };

  const jasaProgress = (w: WorkOrderRecord) => {
    const jp = w.jasaProgress || { tiang: false, konstruksi: false, penarikan: false, kerangka: false, trafo_app: false };
    const jw = w.jasaWeights || { tiang: 20, konstruksi: 20, penarikan: 20, kerangka: 20, trafo_app: 20 };
    
    const sum = Object.keys(jp).reduce((acc, k) => {
      return acc + (jp[k] ? Number(jw[k] || 20) : 0);
    }, 0);
    return Math.min(100, Math.round(sum));
  };

  const tiangProgress = (w: WorkOrderRecord) => {
    const rows = w.tiangRows || [];
    if (!rows.length) return 100;
    const total = rows.reduce((a, t) => a + (Number(t.qtyWO) || 0), 0);
    const done = rows.reduce((a, t) => a + (t.verified ? (Number(t.installedQty) || 0) : 0), 0);
    return total ? Math.min(100, Math.round((done / total) * 100)) : 100;
  };

  const combinedComplete = (w: WorkOrderRecord) => {
    return materialProgress(w) >= 100 && jasaProgress(w) >= 100 && tiangProgress(w) >= 100;
  };

  const jasaTerpakai = (contractNo: string) => {
    return workorders.reduce(
      (s, w) => s + (String(w.kontrakJasa || '') === String(contractNo) ? (Number(w.nilaiJasa) || 0) : 0),
      0
    );
  };

  const jasaSisa = (c: KontrakJasaRecord) => {
    return Number(c.nilai || 0) - jasaTerpakai(c.no);
  };

  const transitMaterialMap = useMemo(() => {
    const map: Record<string, number> = {};
    kontrakMaterial.forEach(c => {
      (c.materials || []).forEach(m => {
        if (!m.checked) {
          const q = Number(m.qty) || 0;
          if (!map[m.code]) map[m.code] = 0;
          map[m.code] += q;
        }
      });
    });
    return map;
  }, [kontrakMaterial]);

  const totalTransit = useMemo(() => {
    return Object.values(transitMaterialMap).reduce((a, b) => a + b, 0);
  }, [transitMaterialMap]);

  // Actions
  const saveSurvey = async (record: SurveyRecord) => {
    const res = await fetch('/api/promotor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'SAVE_SURVEY', payload: { record } })
    });
    if (res.ok) await refreshData();
  };

  const moveSurveyToDaftung = async (surveyId: string) => {
    const res = await fetch('/api/promotor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'MOVE_SURVEY_TO_DAFTUNG', payload: { surveyId } })
    });
    if (res.ok) await refreshData();
  };

  const saveManualDaftung = async (record: Partial<DaftungRecord>) => {
    const res = await fetch('/api/promotor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'SAVE_MANUAL_DAFTUNG', payload: { record } })
    });
    if (res.ok) await refreshData();
  };

  const updateDaftungIdpel = async (id: string, idpel: string) => {
    const res = await fetch('/api/promotor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'UPDATE_DAFTUNG_IDPEL', payload: { id, idpel } })
    });
    if (res.ok) await refreshData();
  };

  const toggleDaftungFlag = async (id: string, flag: 'nidi' | 'slo', value: boolean) => {
    const res = await fetch('/api/promotor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'TOGGLE_DAFTUNG_FLAG', payload: { id, flag, value } })
    });
    if (res.ok) await refreshData();
  };

  const createWOFromDaftung = async (payload: any) => {
    const res = await fetch('/api/promotor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'CREATE_WO_FROM_DAFTUNG', payload })
    });
    if (res.ok) await refreshData();
  };

  const updateWOMaterials = async (noWo: string, materials: MaterialItem[]) => {
    const res = await fetch('/api/promotor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'UPDATE_WO_MATERIALS', payload: { noWo, materials } })
    });
    if (res.ok) await refreshData();
  };

  const updateWOJasaProgress = async (noWo: string, jasaProgress?: any, jasaWeights?: any) => {
    const res = await fetch('/api/promotor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'UPDATE_WO_JASA_PROGRESS', payload: { noWo, jasaProgress, jasaWeights } })
    });
    if (res.ok) await refreshData();
  };

  const updateWOTiang = async (noWo: string, tiangRows: any[]) => {
    const res = await fetch('/api/promotor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'UPDATE_WO_TIANG', payload: { noWo, tiangRows } })
    });
    if (res.ok) await refreshData();
  };

  const updateWOKendala = async (noWo: string, ketKendala: string) => {
    const res = await fetch('/api/promotor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'UPDATE_WO_KENDALA', payload: { noWo, ketKendala } })
    });
    if (res.ok) await refreshData();
  };

  const updateWorkOrder = async (noWo: string, data: { vendor?: string; pengawas?: string; pengawas2?: string; vendorTiang?: string; ketKendala?: string }) => {
    const res = await fetch('/api/promotor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'UPDATE_WORK_ORDER', payload: { noWo, ...data } })
    });
    if (res.ok) await refreshData();
  };

  const saveBAST = async (noWo: string, bast: any) => {
    const res = await fetch('/api/promotor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'SAVE_BAST', payload: { noWo, bast } })
    });
    if (res.ok) await refreshData();
  };

  const saveKontrakJasa = async (record: KontrakJasaRecord) => {
    const res = await fetch('/api/promotor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'SAVE_KONTRAK_JASA', payload: { record } })
    });
    if (res.ok) await refreshData();
  };

  const saveKontrakMaterial = async (record: KontrakMaterialRecord) => {
    const res = await fetch('/api/promotor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'SAVE_KONTRAK_MATERIAL', payload: { record } })
    });
    if (res.ok) await refreshData();
  };

  const toggleKontrakMaterialCheck = async (contractNo: string, materialCode: string, checked: boolean) => {
    const res = await fetch('/api/promotor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'TOGGLE_KONTRAK_MATERIAL_CHECK', payload: { contractNo, materialCode, checked } })
    });
    if (res.ok) await refreshData();
  };

  const updateGudangStok = async (
    material: string,
    sap: number,
    fisik: number,
    description?: string,
    unit?: string,
    keterangan?: string
  ) => {
    // 1. Optimistic instant UI update
    setGudang(prev => {
      const exists = prev.some(g => g.material === material);
      if (exists) {
        return prev.map(g =>
          g.material === material
            ? {
                ...g,
                sap: Number(sap) || 0,
                fisik: Number(fisik) || 0,
                ...(description !== undefined ? { description } : {}),
                ...(unit !== undefined ? { unit } : {}),
                ...(keterangan !== undefined ? { keterangan } : {})
              }
            : g
        );
      } else {
        return [
          {
            material,
            description: description || material,
            sap: Number(sap) || 0,
            fisik: Number(fisik) || 0,
            unit: unit || 'pcs',
            keterangan: keterangan || ''
          },
          ...prev
        ];
      }
    });

    // 2. Persist to API / Supabase PostgreSQL
    const res = await fetch('/api/promotor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'UPDATE_GUDANG_STOK',
        payload: { material, sap, fisik, description, unit, keterangan }
      })
    });
    if (res.ok) await refreshData();
  };

  const deleteGudangMaterial = async (material: string) => {
    setGudang(prev => prev.filter(g => g.material !== material));
    const res = await fetch('/api/promotor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'DELETE_GUDANG_MATERIAL', payload: { material } })
    });
    if (res.ok) await refreshData();
  };

  const updateStandardQty = async (name: string, materials: Record<string, number>, active?: boolean) => {
    const res = await fetch('/api/promotor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'UPDATE_STANDARD_QTY', payload: { name, materials, active } })
    });
    if (res.ok) await refreshData();
  };

  const processVendorPickup = async (pickups: any[]) => {
    const res = await fetch('/api/promotor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'PROCESS_VENDOR_PICKUP', payload: { pickups } })
    });
    if (res.ok) await refreshData();
  };

  const verifyVendorProof = async (sj: string) => {
    const res = await fetch('/api/promotor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'VERIFY_VENDOR_PROOF', payload: { sj } })
    });
    if (res.ok) await refreshData();
  };

  const saveVendorTiang = async (name: string) => {
    const res = await fetch('/api/promotor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'SAVE_VENDOR_TIANG', payload: { name } })
    });
    if (res.ok) await refreshData();
  };

  const approveWOForVendor = async (noWo: string): Promise<string> => {
    const token = `VND-${noWo.replace(/[^a-zA-Z0-9]/g, '')}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const res = await fetch('/api/promotor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'APPROVE_WO_VENDOR', 
        payload: { 
          noWo, 
          vendorToken: token,
          vendorApproved: true,
          tglPemeriksaanPengawas: new Date().toISOString().split('T')[0]
        } 
      })
    });
    if (res.ok) await refreshData();
    return token;
  };

  const updateWOVendorCatatan = async (noWo: string, catatan: string) => {
    const res = await fetch('/api/promotor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'UPDATE_WO_VENDOR_CATATAN', payload: { noWo, catatan } })
    });
    if (res.ok) await refreshData();
  };

  return (
    <PromotorContext.Provider
      value={{
        activeTab,
        setActiveTab,
        loading,
        isSyncing,
        standards,
        stdHeaders,
        gudang,
        surveys,
        daftung,
        workorders,
        kontrakJasa,
        kontrakMaterial,
        vendorTiangMaster,
        pickupHistory,
        currentUser,
        setCurrentUser,
        switchRole,
        availableUsers: USERS_PRESET,
        canAccessTab,
        refreshData,
        saveSurvey,
        moveSurveyToDaftung,
        saveManualDaftung,
        updateDaftungIdpel,
        toggleDaftungFlag,
        createWOFromDaftung,
        updateWOMaterials,
        updateWOJasaProgress,
        updateWOTiang,
        updateWOKendala,
        updateWorkOrder,
        saveBAST,
        approveWOForVendor,
        updateWOVendorCatatan,
        saveKontrakJasa,
        saveKontrakMaterial,
        toggleKontrakMaterialCheck,
        updateGudangStok,
        deleteGudangMaterial,
        updateStandardQty,
        processVendorPickup,
        verifyVendorProof,
        saveVendorTiang,
        matStock,
        jasaProgress,
        materialProgress,
        tiangProgress,
        combinedComplete,
        jasaTerpakai,
        jasaSisa,
        transitMaterialMap,
        totalTransit
      }}
    >
      {children}
    </PromotorContext.Provider>
  );
}

export function usePromotor() {
  const context = useContext(PromotorContext);
  if (!context) {
    throw new Error('usePromotor must be used within a PromotorProvider');
  }
  return context;
}

