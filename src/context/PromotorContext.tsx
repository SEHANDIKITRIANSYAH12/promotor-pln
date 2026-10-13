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
  UserProfile,
  AuditLog,
  AuditModuleType,
  AuditLogSeverity
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
    status: 'active',
    phone: '0812-3456-7890',
    createdAt: '2026-01-01'
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
    status: 'active',
    phone: '0813-2345-6789',
    createdAt: '2026-01-05'
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
    status: 'active',
    phone: '0815-9876-5432',
    createdAt: '2026-01-10'
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
    status: 'active',
    phone: '0817-1122-3344',
    createdAt: '2026-01-15'
  }
];

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  superadmin: ['std', 'survey', 'daftung', 'wo', 'pengawasan', 'gudang', 'contract', 'material', 'audit', 'users'],
  surveyor: ['survey', 'std'],
  pengawas: ['pengawasan', 'daftung', 'wo', 'material', 'std'],
  admin_gudang: ['gudang', 'contract', 'material']
};

export const DEFAULT_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-init-001',
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    userId: 'usr_admin',
    userName: 'Budi Santoso, S.T.',
    userRole: 'superadmin',
    userAvatar: '👨‍💼',
    action: 'SYSTEM_STARTUP',
    module: 'SYSTEM',
    severity: 'info',
    description: 'Sistem PROMOTOR V1.0 diinisialisasi & database operasional aktif',
    metadata: { version: '1.0.0', environment: 'production' },
    ipAddress: '127.0.0.1'
  },
  {
    id: 'log-init-002',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    userId: 'usr_surveyor',
    userName: 'Ahmad Fauzi',
    userRole: 'surveyor',
    userAvatar: '👷‍♂️',
    action: 'CREATE_SURVEY',
    module: 'SURVEY',
    severity: 'success',
    description: 'Menambahkan survei pelanggan baru: PT Banten Berkah Mandiri (IDPEL: 538291029102, Daya: 105kVA)',
    metadata: { idpel: '538291029102', daya: 105000, tipeGardu: 'Portal' }
  },
  {
    id: 'log-init-003',
    timestamp: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
    userId: 'usr_admin',
    userName: 'Budi Santoso, S.T.',
    userRole: 'superadmin',
    userAvatar: '👨‍💼',
    action: 'MOVE_DAFTUNG',
    module: 'DAFTUNG',
    severity: 'info',
    description: 'Memasukkan hasil survei PT Banten Berkah Mandiri ke Daftung (Monitoring SLA & TMP)',
    metadata: { surveyId: 'SRV-001' }
  },
  {
    id: 'log-init-004',
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    userId: 'usr_pengawas',
    userName: 'Faisal Reza, S.T.',
    userRole: 'pengawas',
    userAvatar: '🕵️‍♂️',
    action: 'CREATE_WO',
    module: 'WORK_ORDER',
    severity: 'success',
    description: 'Menerbitkan SPK/Work Order No: WO-2026-09-001 untuk vendor PT Sinar Megah Listrikindo',
    metadata: { noWo: 'WO-2026-09-001', vendor: 'PT Sinar Megah Listrikindo' }
  },
  {
    id: 'log-init-005',
    timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    userId: 'usr_gudang',
    userName: 'Siti Rahmawati',
    userRole: 'admin_gudang',
    userAvatar: '📦',
    action: 'UPDATE_STOCK',
    module: 'GUDANG',
    severity: 'warning',
    description: 'Penyelarasan stok fisik material TIANG BETON 12M 350daN dari 40 btg menjadi 42 btg',
    metadata: { material: 'TIANG BETON 12M 350daN', oldFisik: 40, newFisik: 42 }
  },
  {
    id: 'log-init-006',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    userId: 'usr_pengawas',
    userName: 'Faisal Reza, S.T.',
    userRole: 'pengawas',
    userAvatar: '🕵️‍♂️',
    action: 'APPROVE_VENDOR',
    module: 'PENGAWASAN',
    severity: 'success',
    description: 'Persetujuan teknis pengawas dan penerbitan tautan token digital signature untuk WO-2026-09-001',
    metadata: { noWo: 'WO-2026-09-001' }
  }
];

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
  
  // Audit Logs
  auditLogs: AuditLog[];
  addAuditLog: (log: {
    action: string;
    module: AuditModuleType;
    severity?: AuditLogSeverity;
    description: string;
    metadata?: Record<string, any>;
  }) => void;
  clearAuditLogs: () => void;

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

  // User Management
  users: UserProfile[];
  addUser: (userData: Omit<UserProfile, 'id'>) => Promise<{ success: boolean; message?: string }>;
  updateUser: (id: string, updates: Partial<UserProfile>) => Promise<{ success: boolean; message?: string }>;
  deleteUser: (id: string) => Promise<{ success: boolean; message?: string }>;
  toggleUserStatus: (id: string) => Promise<{ success: boolean; message?: string }>;
  resetUserPassword: (id: string, newPass: string) => Promise<{ success: boolean; message?: string }>;

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
  const [users, setUsers] = useState<UserProfile[]>(USERS_PRESET);
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
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(DEFAULT_AUDIT_LOGS);

  // Helper to add audit log locally and persist to localStorage
  const addAuditLog = (entry: {
    action: string;
    module: AuditModuleType;
    severity?: AuditLogSeverity;
    description: string;
    metadata?: Record<string, any>;
  }) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      userAvatar: currentUser.avatar,
      action: entry.action.toUpperCase(),
      module: entry.module,
      severity: entry.severity || 'info',
      description: entry.description,
      metadata: entry.metadata,
      ipAddress: 'Local Client'
    };

    setAuditLogs(prev => {
      const updated = [newLog, ...prev];
      try {
        localStorage.setItem('promotor_audit_logs_v1', JSON.stringify(updated.slice(0, 500)));
      } catch (_) {}
      return updated;
    });
  };

  const clearAuditLogs = () => {
    setAuditLogs([]);
    try {
      localStorage.removeItem('promotor_audit_logs_v1');
    } catch (_) {}
  };

  // Helper to persist users list
  const saveUsersList = (updatedUsers: UserProfile[]) => {
    setUsers(updatedUsers);
    try {
      localStorage.setItem('promotor_users_list_v1', JSON.stringify(updatedUsers));
    } catch (_) {}
  };

  // User Management CRUD Actions
  const addUser = async (userData: Omit<UserProfile, 'id'>): Promise<{ success: boolean; message?: string }> => {
    if (!userData.name?.trim()) {
      return { success: false, message: 'Nama lengkap pengguna wajib diisi.' };
    }
    if (userData.nip && users.some(u => u.nip && u.nip.trim() === userData.nip?.trim())) {
      return { success: false, message: 'NIP sudah terdaftar pada pengguna lain.' };
    }
    if (userData.email && users.some(u => u.email && u.email.trim().toLowerCase() === userData.email?.trim().toLowerCase())) {
      return { success: false, message: 'Email PLN sudah terdaftar pada pengguna lain.' };
    }

    const newUser: UserProfile = {
      ...userData,
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      status: userData.status || 'active',
      avatar: userData.avatar || '👤',
      password: userData.password || 'admin123',
      createdAt: userData.createdAt || new Date().toISOString()
    };

    const updated = [...users, newUser];
    saveUsersList(updated);

    addAuditLog({
      action: 'TAMBAH_PENGGUNA',
      module: 'PENGGUNA',
      severity: 'success',
      description: `Super Admin menambahkan akun pengguna baru: ${newUser.name} (${newUser.roleTitle})`,
      metadata: { userId: newUser.id, role: newUser.role, unit: newUser.unit, nip: newUser.nip }
    });

    return { success: true };
  };

  const updateUser = async (id: string, updates: Partial<UserProfile>): Promise<{ success: boolean; message?: string }> => {
    const target = users.find(u => u.id === id);
    if (!target) {
      return { success: false, message: 'Pengguna tidak ditemukan.' };
    }

    if (updates.nip && updates.nip !== target.nip && users.some(u => u.id !== id && u.nip === updates.nip)) {
      return { success: false, message: 'NIP sudah digunakan oleh pengguna lain.' };
    }
    if (updates.email && updates.email !== target.email && users.some(u => u.id !== id && u.email?.toLowerCase() === updates.email?.toLowerCase())) {
      return { success: false, message: 'Email PLN sudah digunakan oleh pengguna lain.' };
    }

    const updatedList = users.map(u => {
      if (u.id === id) {
        return { ...u, ...updates };
      }
      return u;
    });

    saveUsersList(updatedList);

    // If active logged-in user is updated, sync currentUser
    if (currentUser.id === id) {
      const updatedSelf = { ...currentUser, ...updates };
      setCurrentUser(updatedSelf);
      try {
        localStorage.setItem('promotor_auth_user', JSON.stringify(updatedSelf));
      } catch (_) {}
    }

    addAuditLog({
      action: 'UPDATE_PENGGUNA',
      module: 'PENGGUNA',
      severity: 'info',
      description: `Super Admin memperbarui data profil akun: ${updates.name || target.name} (${updates.roleTitle || target.roleTitle})`,
      metadata: { userId: id, updates }
    });

    return { success: true };
  };

  const deleteUser = async (id: string): Promise<{ success: boolean; message?: string }> => {
    if (currentUser.id === id) {
      return { success: false, message: 'Tidak dapat menghapus akun yang sedang Anda gunakan saat ini.' };
    }
    if (id === 'usr_admin') {
      return { success: false, message: 'Akun Super Administrator utama sistem dilindungi dan tidak dapat dihapus.' };
    }

    const target = users.find(u => u.id === id);
    if (!target) {
      return { success: false, message: 'Pengguna tidak ditemukan.' };
    }

    const updatedList = users.filter(u => u.id !== id);
    saveUsersList(updatedList);

    addAuditLog({
      action: 'HAPUS_PENGGUNA',
      module: 'PENGGUNA',
      severity: 'warning',
      description: `Super Admin menghapus akun pengguna: ${target.name} (NIP: ${target.nip || '-'})`,
      metadata: { userId: id, deletedName: target.name, role: target.role }
    });

    return { success: true };
  };

  const toggleUserStatus = async (id: string): Promise<{ success: boolean; message?: string }> => {
    if (currentUser.id === id) {
      return { success: false, message: 'Anda tidak dapat menonaktifkan akun sendiri yang sedang aktif digunakan.' };
    }

    const target = users.find(u => u.id === id);
    if (!target) {
      return { success: false, message: 'Pengguna tidak ditemukan.' };
    }

    const newStatus = target.status === 'inactive' ? 'active' : 'inactive';
    const updatedList = users.map(u => {
      if (u.id === id) {
        return { ...u, status: newStatus as 'active' | 'inactive' };
      }
      return u;
    });

    saveUsersList(updatedList);

    addAuditLog({
      action: 'STATUS_PENGGUNA',
      module: 'PENGGUNA',
      severity: newStatus === 'active' ? 'info' : 'warning',
      description: `Super Admin ${newStatus === 'active' ? 'mengaktifkan kembali' : 'menonaktifkan'} akun: ${target.name}`,
      metadata: { userId: id, newStatus }
    });

    return { success: true };
  };

  const resetUserPassword = async (id: string, newPass: string): Promise<{ success: boolean; message?: string }> => {
    const target = users.find(u => u.id === id);
    if (!target) {
      return { success: false, message: 'Pengguna tidak ditemukan.' };
    }

    if (!newPass.trim()) {
      return { success: false, message: 'Kata sandi baru tidak boleh kosong.' };
    }

    const updatedList = users.map(u => {
      if (u.id === id) {
        return { ...u, password: newPass.trim() };
      }
      return u;
    });

    saveUsersList(updatedList);

    addAuditLog({
      action: 'RESET_PASSWORD',
      module: 'PENGGUNA',
      severity: 'warning',
      description: `Super Admin me-reset kata sandi akun: ${target.name}`,
      metadata: { userId: id }
    });

    return { success: true };
  };

  // Check role access
  const canAccessTab = (tabId: string) => {
    const allowed = ROLE_PERMISSIONS[currentUser.role] || [];
    return allowed.includes(tabId);
  };

  const switchRole = (role: UserRole) => {
    const found = users.find(u => u.role === role) || USERS_PRESET.find(u => u.role === role) || USERS_PRESET[0];
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
    const allUsers = users.length > 0 ? users : USERS_PRESET;
    const foundUser = allUsers.find(u => 
      (u.nip && u.nip.toLowerCase() === cleanId) ||
      (u.email && u.email.toLowerCase() === cleanId) ||
      u.role.toLowerCase() === cleanId ||
      u.id.toLowerCase() === cleanId ||
      u.name.toLowerCase().includes(cleanId)
    );

    if (!foundUser) {
      return { success: false, message: 'NIP atau kata sandi tidak cocok. Periksa kembali lalu coba lagi.' };
    }

    if (foundUser.status === 'inactive') {
      return { success: false, message: 'Akun Anda telah dinonaktifkan oleh Administrator. Hubungi Super Admin.' };
    }

    // Check password if provided (accept 'admin', 'admin123', 'promotor123' or user password)
    if (cleanPass && foundUser.password && cleanPass !== foundUser.password && cleanPass !== 'admin' && cleanPass !== 'admin123' && cleanPass !== 'promotor123') {
      return { success: false, message: 'NIP atau kata sandi tidak cocok. Periksa kembali lalu coba lagi.' };
    }

    // Successful login
    const updatedUserWithLogin = {
      ...foundUser,
      lastLogin: new Date().toISOString()
    };
    setCurrentUser(updatedUserWithLogin);
    setIsAuthenticated(true);
    if (remember) {
      localStorage.setItem('promotor_auth_user', JSON.stringify(updatedUserWithLogin));
      localStorage.setItem('promotor_user_role', updatedUserWithLogin.role);
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
    // 0. Restore users list from local storage
    let currentUsersList = USERS_PRESET;
    try {
      const storedUsers = localStorage.getItem('promotor_users_list_v1');
      if (storedUsers) {
        const parsed = JSON.parse(storedUsers);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setUsers(parsed);
          currentUsersList = parsed;
        }
      }
    } catch (_) {}

    // 1. Restore auth session
    const savedAuth = localStorage.getItem('promotor_auth_user');
    if (savedAuth) {
      try {
        const user = JSON.parse(savedAuth);
        const found = currentUsersList.find(u => u.id === user.id || u.role === user.role);
        if (found) {
          setCurrentUser(found);
          setIsAuthenticated(true);
        }
      } catch (_) {}
    }

    // 2. Restore user role
    const savedRole = localStorage.getItem('promotor_user_role') as UserRole;
    if (savedRole && ROLE_PERMISSIONS[savedRole]) {
      const found = currentUsersList.find(u => u.role === savedRole);
      if (found) setCurrentUser(found);
    }

    // 3. Restore audit logs from local storage
    try {
      const savedLogs = localStorage.getItem('promotor_audit_logs_v1');
      if (savedLogs) {
        const parsed = JSON.parse(savedLogs);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAuditLogs(parsed);
        }
      }
    } catch (_) {}

    // 4. Instant cache hydration for 0ms initial load
    try {
      const cached = localStorage.getItem('promotor_cached_v1');
      if (cached) {
        const parsed = JSON.parse(cached);
        applyData(parsed);
        setLoading(false);
      }
    } catch (_) {}

    // 5. Silent revalidation in background
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
    const res = await apiPost('SAVE_SURVEY', { record });
    addAuditLog({
      action: 'SAVE_SURVEY',
      module: 'SURVEY',
      severity: 'success',
      description: `Menyimpan data survei: ${record.customer?.name || record.id} (IDPEL: ${record.customer?.idpel || '-'}, Gardu: ${record.technical?.tipeGardu || '-'})`,
      metadata: { surveyId: record.id, customer: record.customer?.name }
    });
    return res;
  };

  const moveSurveyToDaftung = async (surveyId: string) => {
    const res = await apiPost('MOVE_SURVEY_TO_DAFTUNG', { surveyId });
    addAuditLog({
      action: 'MOVE_DAFTUNG',
      module: 'DAFTUNG',
      severity: 'info',
      description: `Memindahkan survei ID: ${surveyId} ke dalam Daftung untuk monitoring SLA`,
      metadata: { surveyId }
    });
    return res;
  };

  const saveManualDaftung = async (record: Partial<DaftungRecord>) => {
    const res = await apiPost('SAVE_MANUAL_DAFTUNG', { record });
    addAuditLog({
      action: 'INPUT_DAFTUNG_MANUAL',
      module: 'DAFTUNG',
      severity: 'info',
      description: `Menambahkan daftung manual: ${record.nama || record.idpel} (Tarif: ${record.tarif || '-'})`,
      metadata: { record }
    });
    return res;
  };

  const updateDaftungIdpel = async (id: string, idpel: string) => {
    return await apiPost('UPDATE_DAFTUNG_IDPEL', { id, idpel });
  };

  const toggleDaftungFlag = async (id: string, flag: 'nidi' | 'slo', value: boolean) => {
    const res = await apiPost('TOGGLE_DAFTUNG_FLAG', { id, flag, value });
    addAuditLog({
      action: `UPDATE_${flag.toUpperCase()}`,
      module: 'DAFTUNG',
      severity: value ? 'success' : 'warning',
      description: `Mengubah status perizinan ${flag.toUpperCase()} pelanggan Daftung (ID: ${id}) menjadi ${value ? 'VALID / TERBIT' : 'BELUM ADA'}`,
      metadata: { id, flag, value }
    });
    return res;
  };

  const createWOFromDaftung = async (payload: any) => {
    const res = await apiPost('CREATE_WO_FROM_DAFTUNG', payload);
    addAuditLog({
      action: 'CREATE_WORK_ORDER',
      module: 'WORK_ORDER',
      severity: 'success',
      description: `Menerbitkan Surat Perintah Kerja (SPK/WO) No: ${payload.noWo || 'WO-BARU'} untuk pelanggan ${payload.namaPelanggan || '-'}`,
      metadata: { noWo: payload.noWo, vendor: payload.vendor }
    });
    return res;
  };

  const updateWOMaterials = async (noWo: string, materials: MaterialItem[]) => {
    return await apiPost('UPDATE_WO_MATERIALS', { noWo, materials });
  };

  const updateWOJasaProgress = async (noWo: string, jasaProgress?: any, jasaWeights?: any) => {
    const res = await apiPost('UPDATE_WO_JASA_PROGRESS', { noWo, jasaProgress, jasaWeights });
    addAuditLog({
      action: 'UPDATE_JASA_PROGRESS',
      module: 'PENGAWASAN',
      severity: 'info',
      description: `Pengawas memperbarui progres fisik jasa konstruksi untuk ${noWo}`,
      metadata: { noWo, jasaProgress }
    });
    return res;
  };

  const updateWOTiang = async (noWo: string, tiangRows: any[]) => {
    const res = await apiPost('UPDATE_WO_TIANG', { noWo, tiangRows });
    addAuditLog({
      action: 'UPDATE_OPNAME_TIANG',
      module: 'PENGAWASAN',
      severity: 'info',
      description: `Pengawas memperbarui data opname penanaman tiang untuk ${noWo}`,
      metadata: { noWo, rowCount: tiangRows.length }
    });
    return res;
  };

  const updateWOKendala = async (noWo: string, ketKendala: string) => {
    const res = await apiPost('UPDATE_WO_KENDALA', { noWo, ketKendala });
    addAuditLog({
      action: 'CATAT_KENDALA',
      module: 'WORK_ORDER',
      severity: ketKendala ? 'warning' : 'info',
      description: `Mencatat status kendala pada ${noWo}: "${ketKendala || 'Tidak ada kendala'}"`,
      metadata: { noWo, ketKendala }
    });
    return res;
  };

  const updateWorkOrder = async (noWo: string, data: { vendor?: string; pengawas?: string; pengawas2?: string; vendorTiang?: string; ketKendala?: string }) => {
    return await apiPost('UPDATE_WORK_ORDER', { noWo, ...data });
  };

  const saveBAST = async (noWo: string, bast: any) => {
    const res = await apiPost('SAVE_BAST', { noWo, bast });
    addAuditLog({
      action: 'SAVE_BAST',
      module: 'PENGAWASAN',
      severity: 'success',
      description: `Menyimpan dan mengesahkan Berita Acara Serah Terima (BAST) untuk ${noWo}`,
      metadata: { noWo, bast }
    });
    return res;
  };

  const saveKontrakJasa = async (record: KontrakJasaRecord) => {
    const res = await apiPost('SAVE_KONTRAK_JASA', { record });
    addAuditLog({
      action: 'SAVE_KONTRAK_JASA',
      module: 'KONTRAK',
      severity: 'info',
      description: `Menyimpan kontrak jasa ${record.no} (${record.pt}) senilai Rp ${Number(record.nilai || 0).toLocaleString('id-ID')}`,
      metadata: { noKontrak: record.no, pt: record.pt }
    });
    return res;
  };

  const saveKontrakMaterial = async (record: KontrakMaterialRecord) => {
    const res = await apiPost('SAVE_KONTRAK_MATERIAL', { record });
    addAuditLog({
      action: 'SAVE_KONTRAK_MATERIAL',
      module: 'KONTRAK',
      severity: 'info',
      description: `Menyimpan pagu kontrak pengadaan material ${record.no} (${record.pt})`,
      metadata: { noKontrak: record.no }
    });
    return res;
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

    addAuditLog({
      action: 'UPDATE_STOCK',
      module: 'GUDANG',
      severity: 'warning',
      description: `Admin Gudang memperbarui stok material "${material}" (SAP: ${sap}, Fisik: ${fisik} ${unit || 'pcs'})`,
      metadata: { material, sap, fisik, unit, keterangan }
    });

    // 2. Persist to API / Supabase PostgreSQL
    return await apiPost('UPDATE_GUDANG_STOK', { material, sap, fisik, description, unit, keterangan });
  };

  const deleteGudangMaterial = async (material: string) => {
    setGudang(prev => prev.filter(g => g.material !== material));
    addAuditLog({
      action: 'DELETE_MATERIAL',
      module: 'GUDANG',
      severity: 'danger',
      description: `Menghapus item material "${material}" dari database master gudang`,
      metadata: { material }
    });
    return await apiPost('DELETE_GUDANG_MATERIAL', { material });
  };

  const updateStandardQty = async (name: string, materials: Record<string, number>, active?: boolean) => {
    const res = await apiPost('UPDATE_STANDARD_QTY', { name, materials, active });
    addAuditLog({
      action: 'UPDATE_STANDAR_KONSTRUKSI',
      module: 'STANDAR',
      severity: 'warning',
      description: `Memperbarui konfigurasi matriks material standar konstruksi tipe "${name}"`,
      metadata: { standardName: name, materialsCount: Object.keys(materials || {}).length }
    });
    return res;
  };

  const processVendorPickup = async (pickups: any[]) => {
    const res = await apiPost('PROCESS_VENDOR_PICKUP', { pickups });
    addAuditLog({
      action: 'VENDOR_PICKUP_MATERIAL',
      module: 'GUDANG',
      severity: 'success',
      description: `Penerbitan Surat Jalan pengambilan material gudang oleh vendor (${pickups.length} item)`,
      metadata: { pickupCount: pickups.length }
    });
    return res;
  };

  const verifyVendorProof = async (sj: string) => {
    const res = await apiPost('VERIFY_VENDOR_PROOF', { sj });
    addAuditLog({
      action: 'VERIFY_SURAT_JALAN',
      module: 'GUDANG',
      severity: 'success',
      description: `Verifikasi fisik dokumen bukti serah terima surat jalan No: ${sj}`,
      metadata: { noSj: sj }
    });
    return res;
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
    addAuditLog({
      action: 'APPROVE_WO_VENDOR',
      module: 'PENGAWASAN',
      severity: 'success',
      description: `Pengawas menyetujui hasil kerja dan menerbitkan token approval digital vendor untuk ${noWo}`,
      metadata: { noWo, token }
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
        auditLogs,
        addAuditLog,
        clearAuditLogs,
        isAuthenticated,
        login,
        logout,
        currentUser,
        setCurrentUser,
        switchRole,
        availableUsers: users,
        users,
        addUser,
        updateUser,
        deleteUser,
        toggleUserStatus,
        resetUserPassword,
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


