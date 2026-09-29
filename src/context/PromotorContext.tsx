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
    nip: '198503152010011001',
    email: 'budi.santoso@pln.co.id',
    password: 'admin',
    role: 'superadmin',
    roleTitle: 'Super Administrator / Manager ULP',
    unit: 'PLN ULP Rangkasbitung',
    avatar: '👨‍💼',
  },
  {
    id: 'usr_surveyor',
    name: 'Ahmad Fauzi',
    nip: '199207242015021002',
    email: 'ahmad.fauzi@pln.co.id',
    password: 'admin',
    role: 'surveyor',
    roleTitle: 'Petugas Survey Lapangan',
    unit: 'PLN ULP Rangkasbitung',
    avatar: '👷‍♂️',
  },
  {
    id: 'usr_pengawas',
    name: 'Faisal Reza, S.T.',
    nip: '198911042013031003',
    email: 'faisal.reza@pln.co.id',
    password: 'admin',
    role: 'pengawas',
    roleTitle: 'Pengawas Teknik Konstruksi & Jaringan',
    unit: 'PLN ULP Rangkasbitung',
    avatar: '🕵️‍♂️',
  },
  {
    id: 'usr_gudang',
    name: 'Siti Rahmawati',
    nip: '199405182018012004',
    email: 'siti.rahmawati@pln.co.id',
    password: 'admin',
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
  
  // Auth state
  isAuthenticated: boolean;
  login: (identifier: string, password?: string, remember?: boolean) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;

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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
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
    if (isAuthenticated) {
      localStorage.setItem('promotor_auth_user', JSON.stringify(found));
    }
    
    // Auto redirect tab if current tab is not permitted
    const allowed = ROLE_PERMISSIONS[role] || [];
    if (!allowed.includes(activeTab) && allowed.length > 0) {
      setActiveTab(allowed[0]);
    }
  };

  const login = async (identifier: string, password?: string, remember: boolean = true): Promise<{ success: boolean; message?: string }> => {
    const cleanId = identifier.trim().toLowerCase();
    const cleanPass = (password || '').trim();

    // Match by NIP, email, id, role, or name
    const foundUser = USERS_PRESET.find(u => 
      (u.nip && u.nip.toLowerCase() === cleanId) ||
      (u.email && u.email.toLowerCase() === cleanId) ||
      u.role.toLowerCase() === cleanId ||
      u.id.toLowerCase() === cleanId ||
      u.name.toLowerCase().includes(cleanId)
    );

    if (!foundUser) {
      return { success: false, message: 'NIP atau kata sandi tidak cocok. Periksa kembali lalu coba lagi.' };
    }

    // Check password if provided (accept 'admin', 'admin123', 'promotor123' or user password)
    if (cleanPass && foundUser.password && cleanPass !== foundUser.password && cleanPass !== 'admin123' && cleanPass !== 'promotor123') {
      return { success: false, message: 'NIP atau kata sandi tidak cocok. Periksa kembali lalu coba lagi.' };
    }

    // Successful login
    setCurrentUser(foundUser);
    setIsAuthenticated(true);
    if (remember) {
      localStorage.setItem('promotor_auth_user', JSON.stringify(foundUser));
      localStorage.setItem('promotor_user_role', foundUser.role);
    }

    const allowed = ROLE_PERMISSIONS[foundUser.role] || [];
    if (!allowed.includes(activeTab) && allowed.length > 0) {
      setActiveTab(allowed[0]);
    }

    return { success: true };
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('promotor_auth_user');
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
    // 1. Restore auth session
    const savedAuth = localStorage.getItem('promotor_auth_user');
    if (savedAuth) {
      try {
        const user = JSON.parse(savedAuth);
        const found = USERS_PRESET.find(u => u.id === user.id || u.role === user.role);
        if (found) {
          setCurrentUser(found);
          setIsAuthenticated(true);
        }
      } catch (_) {}
    }

    // 2. Restore user role
    const savedRole = localStorage.getItem('promotor_user_role') as UserRole;
    if (savedRole && ROLE_PERMISSIONS[savedRole]) {
      const found = USERS_PRESET.find(u => u.role === savedRole);
      if (found) setCurrentUser(found);
    }

    // 3. Instant cache hydration for 0ms initial load
    try {
      const cached = localStorage.getItem('promotor_cached_v1');
      if (cached) {
        const parsed = JSON.parse(cached);
        applyData(parsed);
        setLoading(false);
      }
    } catch (_) {}

    // 4. Silent revalidation in background
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

  // Robust API Post Helper
  const apiPost = async (action: string, payload: any) => {
    try {
      const res = await fetch('/api/promotor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload })
      });
      
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        const errorMsg = data?.error || data?.message || `Gagal memproses ${action} (HTTP ${res.status})`;
        throw new Error(errorMsg);
      }
      
      await refreshData();
      return data;
    } catch (err: any) {
      if (err.name === 'TypeError' && (err.message.includes('fetch') || err.message.includes('Load failed') || err.message.includes('NetworkError'))) {
        throw new Error('Koneksi ke backend sempat terputus atau server sedang compiling. Silakan klik tombol sekali lagi.');
      }
      throw err;
    }
  };

  // Actions
  const saveSurvey = async (record: SurveyRecord) => {
    return await apiPost('SAVE_SURVEY', { record });
  };

  const moveSurveyToDaftung = async (surveyId: string) => {
    return await apiPost('MOVE_SURVEY_TO_DAFTUNG', { surveyId });
  };

  const saveManualDaftung = async (record: Partial<DaftungRecord>) => {
    return await apiPost('SAVE_MANUAL_DAFTUNG', { record });
  };

  const updateDaftungIdpel = async (id: string, idpel: string) => {
    return await apiPost('UPDATE_DAFTUNG_IDPEL', { id, idpel });
  };

  const toggleDaftungFlag = async (id: string, flag: 'nidi' | 'slo', value: boolean) => {
    return await apiPost('TOGGLE_DAFTUNG_FLAG', { id, flag, value });
  };

  const createWOFromDaftung = async (payload: any) => {
    return await apiPost('CREATE_WO_FROM_DAFTUNG', payload);
  };

  const updateWOMaterials = async (noWo: string, materials: MaterialItem[]) => {
    return await apiPost('UPDATE_WO_MATERIALS', { noWo, materials });
  };

  const updateWOJasaProgress = async (noWo: string, jasaProgress?: any, jasaWeights?: any) => {
    return await apiPost('UPDATE_WO_JASA_PROGRESS', { noWo, jasaProgress, jasaWeights });
  };

  const updateWOTiang = async (noWo: string, tiangRows: any[]) => {
    return await apiPost('UPDATE_WO_TIANG', { noWo, tiangRows });
  };

  const updateWOKendala = async (noWo: string, ketKendala: string) => {
    return await apiPost('UPDATE_WO_KENDALA', { noWo, ketKendala });
  };

  const updateWorkOrder = async (noWo: string, data: { vendor?: string; pengawas?: string; pengawas2?: string; vendorTiang?: string; ketKendala?: string }) => {
    return await apiPost('UPDATE_WORK_ORDER', { noWo, ...data });
  };

  const saveBAST = async (noWo: string, bast: any) => {
    return await apiPost('SAVE_BAST', { noWo, bast });
  };

  const saveKontrakJasa = async (record: KontrakJasaRecord) => {
    return await apiPost('SAVE_KONTRAK_JASA', { record });
  };

  const saveKontrakMaterial = async (record: KontrakMaterialRecord) => {
    return await apiPost('SAVE_KONTRAK_MATERIAL', { record });
  };

  const toggleKontrakMaterialCheck = async (contractNo: string, materialCode: string, checked: boolean) => {
    return await apiPost('TOGGLE_KONTRAK_MATERIAL_CHECK', { contractNo, materialCode, checked });
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
    return await apiPost('UPDATE_GUDANG_STOK', { material, sap, fisik, description, unit, keterangan });
  };

  const deleteGudangMaterial = async (material: string) => {
    setGudang(prev => prev.filter(g => g.material !== material));
    return await apiPost('DELETE_GUDANG_MATERIAL', { material });
  };

  const updateStandardQty = async (name: string, materials: Record<string, number>, active?: boolean) => {
    return await apiPost('UPDATE_STANDARD_QTY', { name, materials, active });
  };

  const processVendorPickup = async (pickups: any[]) => {
    return await apiPost('PROCESS_VENDOR_PICKUP', { pickups });
  };

  const verifyVendorProof = async (sj: string) => {
    return await apiPost('VERIFY_VENDOR_PROOF', { sj });
  };

  const saveVendorTiang = async (name: string) => {
    return await apiPost('SAVE_VENDOR_TIANG', { name });
  };

  const approveWOForVendor = async (noWo: string): Promise<string> => {
    const token = `VND-${noWo.replace(/[^a-zA-Z0-9]/g, '')}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    await apiPost('APPROVE_WO_VENDOR', { 
      noWo, 
      vendorToken: token,
      vendorApproved: true,
      tglPemeriksaanPengawas: new Date().toISOString().split('T')[0]
    });
    return token;
  };

  const updateWOVendorCatatan = async (noWo: string, catatan: string) => {
    return await apiPost('UPDATE_WO_VENDOR_CATATAN', { noWo, catatan });
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
        isAuthenticated,
        login,
        logout,
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

