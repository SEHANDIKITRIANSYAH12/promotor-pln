export type UserRole = 'superadmin' | 'surveyor' | 'pengawas' | 'admin_gudang';

export interface UserProfile {
  id: string;
  name: string;
  nip?: string;
  email?: string;
  password?: string;
  role: UserRole;
  roleTitle: string;
  unit: string;
  avatar?: string;
}

export interface MaterialItem {
  code: string;
  name: string;
  unit: string;
  qty?: number;
  required?: number;
  reserved?: number;
  verified?: number;
  note?: string;
  condition?: string;
  sourceStandards?: string[];
  manualAdjusted?: boolean;
}

export interface StandardCategorySelection {
  name: string;
  qty: number;
  note?: string;
}

export interface StandardKonstruksiItem {
  id: string;
  name: string;
  active: boolean;
  materials: Record<string, number>;
}

export interface SurveyCustomer {
  idpel?: string;
  name: string;
  address?: string;
  daya?: number | string;
  tarif?: string;
  jenis?: string;
  phone?: string;
}

export interface SurveyTechnical {
  pelangganKhusus?: string;
  ulp?: string;
  tipeGardu?: string;
  kapasitasTrafo?: number | string;
  jumlahKabelNaik?: number | string;
  penyulang?: string;
}

export interface SurveyLocation {
  address?: string;
  lat?: string;
  lng?: string;
  photos?: string[];
}

export interface SurveyRecord {
  id: string;
  status: 'Draft' | 'Berjalan' | 'Selesai' | 'Historical' | 'Ditolak';
  surveyor: string;
  customer: SurveyCustomer;
  technical: SurveyTechnical;
  location: SurveyLocation;
  standardSelections: StandardCategorySelection[];
  materials: MaterialItem[];
  sourceLegacy?: boolean;
  supersededBy?: string | null;
  daftungId?: string | null;
  created: string;
  updated: string;
}

export interface DaftungRecord {
  id: string;
  idpel: string;
  nama: string;
  alamat?: string;
  tarifLama?: string;
  dayaLama?: number;
  tarif?: string;
  daya?: number;
  jenisTransaksi?: string;
  woTiang?: string;
  noWo?: string;
  penyediaJasa?: string;
  pengawas?: string;
  tglBayar?: string;
  durasiHariKerja: number;
  kriteriaTmp?: string;
  statusPermohonan?: string;
  namaup?: string;
  surveyId?: string;
  sumber?: 'SURVEY' | 'MANUAL';
  statusDaftung?: string;
  nidi?: boolean;
  slo?: boolean;
}

export interface JasaProgressState {
  tiang: boolean;
  konstruksi: boolean;
  penarikan: boolean;
  kerangka: boolean;
  trafo_app: boolean;
  [key: string]: boolean;
}

export interface JasaWeightsState {
  tiang: number;
  konstruksi: number;
  penarikan: number;
  kerangka: number;
  trafo_app: number;
  [key: string]: number;
}

export interface TiangRow {
  code: string;
  name: string;
  unit: string;
  qtySurvey: number;
  qtyWO: number;
  vendor: string;
  installedQty: number;
  verifiedQty?: number;
  verified?: boolean;
  progress?: number;
}

export interface BASTState {
  conditions: Record<string, string>;
  asmanKonstruksi: string;
  asmanJaringan: string;
}

export interface WorkOrderRecord {
  noWo: string;
  namaPelanggan: string;
  vendor: string;
  pengawas: string;
  pengawas2?: string;
  status: string;
  ketKendala?: string;
  daftungId?: string;
  surveyId?: string;
  idpel?: string;
  kontrakJasa?: string;
  nilaiJasa?: number;
  vendorTiang?: string;
  materials: MaterialItem[];
  jasaProgress: JasaProgressState;
  jasaWeights: JasaWeightsState;
  tiangRows: TiangRow[];
  bast: BASTState;
  vendorToken?: string;
  vendorApproved?: boolean;
  vendorCatatan?: string;
  tglPemeriksaanPengawas?: string;
}

export interface KontrakJasaRecord {
  no: string;
  pt: string;
  desc: string;
  awal: string;
  akhir: string;
  nilai: number;
}

export interface KontrakMaterialItem {
  code: string;
  name: string;
  qty: number;
  unit: string;
  checked: boolean;
}

export interface KontrakMaterialRecord {
  no: string;
  pt: string;
  desc: string;
  awal: string;
  akhir: string;
  nilai: number;
  materials: KontrakMaterialItem[];
}

export interface GudangMaterialRecord {
  material: string;
  description: string;
  sap: number;
  fisik: number;
  unit: string;
  keterangan?: string;
}

export interface VendorPickupItem {
  id: string;
  date: string;
  woNo: string;
  vendor: string;
  material: string;
  qty: string;
  sj: string;
  verified: boolean;
  proofName?: string;
}
