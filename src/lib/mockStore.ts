// In-Memory Resilient Mock & Fallback Store
// Ensures the entire application runs smoothly and reliably during live demos/interviews
// even if Supabase PostgreSQL connection is paused, offline, or experiencing network timeout.

import {
  StandardKonstruksiItem,
  GudangMaterialRecord,
  SurveyRecord,
  DaftungRecord,
  WorkOrderRecord,
  KontrakJasaRecord,
  KontrakMaterialRecord,
  VendorPickupItem,
  MaterialItem
} from '@/lib/types';

const LATEST_STD_DATA = [
  {"name":"1B","active":true,"materials":{"SERANDANG CANTOL":0,"SERANDANG PORTAL":0,"LVSB CANTOL":0,"LVSB PORTAL":0,"NYY 1X95":0,"NYY 1X240":0,"CABLE SHOE CU 95":0,"CABLE SHOE CU 240":0,"CABLE SHOE AL CU 150":0,"LA":0,"CUT OUT":0,"FUSE LINK 2A":0,"FUSE LINK 4A":0,"FUSE LINK 8A":0,"FUSE LINK 12A":0,"TRAVES TUMPU":1,"TRAVES GANDA":0,"TRAVES AFSPAN":0,"UNP GALVANIS":1,"PIN ISOLATOR":3,"HANG ISOLATOR":0,"TOP TIES":3,"DOUBLE TIES":0,"STAYSET TM":0,"GROUND ROD":0,"CABLE SHOE CU 50":0,"CCO 150":0,"COVER BUSHING TRAFO":0,"COVER BUSHING ISOLATOR":3,"A3CS":0,"A3CS GARDU":0}},
  {"name":"2B","active":true,"materials":{"SERANDANG CANTOL":0,"SERANDANG PORTAL":0,"LVSB CANTOL":0,"LVSB PORTAL":0,"NYY 1X95":0,"NYY 1X240":0,"CABLE SHOE CU 95":0,"CABLE SHOE CU 240":0,"CABLE SHOE AL CU 150":0,"LA":0,"CUT OUT":0,"FUSE LINK 2A":0,"FUSE LINK 4A":0,"FUSE LINK 8A":0,"FUSE LINK 12A":0,"TRAVES TUMPU":0,"TRAVES GANDA":1,"TRAVES AFSPAN":0,"UNP GALVANIS":2,"PIN ISOLATOR":6,"HANG ISOLATOR":0,"TOP TIES":0,"DOUBLE TIES":3,"STAYSET TM":0,"GROUND ROD":0,"CABLE SHOE CU 50":0,"CCO 150":0,"COVER BUSHING TRAFO":0,"COVER BUSHING ISOLATOR":6,"A3CS":0,"A3CS GARDU":0}},
  {"name":"3B","active":true,"materials":{"SERANDANG CANTOL":0,"SERANDANG PORTAL":0,"LVSB CANTOL":0,"LVSB PORTAL":0,"NYY 1X95":0,"NYY 1X240":0,"CABLE SHOE CU 95":0,"CABLE SHOE CU 240":0,"CABLE SHOE AL CU 150":0,"LA":0,"CUT OUT":0,"FUSE LINK 2A":0,"FUSE LINK 4A":0,"FUSE LINK 8A":0,"FUSE LINK 12A":0,"TRAVES TUMPU":0,"TRAVES GANDA":0,"TRAVES AFSPAN":0,"UNP GALVANIS":0,"PIN ISOLATOR":0,"HANG ISOLATOR":0,"TOP TIES":0,"DOUBLE TIES":0,"STAYSET TM":0,"GROUND ROD":0,"CABLE SHOE CU 50":0,"CCO 150":0,"COVER BUSHING TRAFO":0,"COVER BUSHING ISOLATOR":0,"A3CS":0,"A3CS GARDU":0}},
  {"name":"4B","active":true,"materials":{"SERANDANG CANTOL":0,"SERANDANG PORTAL":0,"LVSB CANTOL":0,"LVSB PORTAL":0,"NYY 1X95":0,"NYY 1X240":0,"CABLE SHOE CU 95":0,"CABLE SHOE CU 240":0,"CABLE SHOE AL CU 150":0,"LA":0,"CUT OUT":0,"FUSE LINK 2A":0,"FUSE LINK 4A":0,"FUSE LINK 8A":0,"FUSE LINK 12A":0,"TRAVES TUMPU":0,"TRAVES GANDA":0,"TRAVES AFSPAN":1,"UNP GALVANIS":2,"PIN ISOLATOR":1,"HANG ISOLATOR":6,"TOP TIES":1,"DOUBLE TIES":0,"STAYSET TM":0,"GROUND ROD":0,"CABLE SHOE CU 50":0,"CCO 150":0,"COVER BUSHING TRAFO":0,"COVER BUSHING ISOLATOR":1,"A3CS":0,"A3CS GARDU":0}},
  {"name":"5B","active":true,"materials":{"SERANDANG CANTOL":0,"SERANDANG PORTAL":0,"LVSB CANTOL":0,"LVSB PORTAL":0,"NYY 1X95":0,"NYY 1X240":0,"CABLE SHOE CU 95":0,"CABLE SHOE CU 240":0,"CABLE SHOE AL CU 150":0,"LA":0,"CUT OUT":0,"FUSE LINK 2A":0,"FUSE LINK 4A":0,"FUSE LINK 8A":0,"FUSE LINK 12A":0,"TRAVES TUMPU":0,"TRAVES GANDA":0,"TRAVES AFSPAN":1,"UNP GALVANIS":2,"PIN ISOLATOR":1,"HANG ISOLATOR":6,"TOP TIES":1,"DOUBLE TIES":0,"STAYSET TM":0,"GROUND ROD":0,"CABLE SHOE CU 50":0,"CCO 150":0,"COVER BUSHING TRAFO":0,"COVER BUSHING ISOLATOR":1,"A3CS":0,"A3CS GARDU":0}},
  {"name":"6B","active":true,"materials":{"SERANDANG CANTOL":0,"SERANDANG PORTAL":0,"LVSB CANTOL":0,"LVSB PORTAL":0,"NYY 1X95":0,"NYY 1X240":0,"CABLE SHOE CU 95":0,"CABLE SHOE CU 240":0,"CABLE SHOE AL CU 150":0,"LA":0,"CUT OUT":0,"FUSE LINK 2A":0,"FUSE LINK 4A":0,"FUSE LINK 8A":0,"FUSE LINK 12A":0,"TRAVES TUMPU":0,"TRAVES GANDA":0,"TRAVES AFSPAN":1,"UNP GALVANIS":2,"PIN ISOLATOR":0,"HANG ISOLATOR":6,"TOP TIES":0,"DOUBLE TIES":0,"STAYSET TM":0,"GROUND ROD":0,"CABLE SHOE CU 50":0,"CCO 150":0,"COVER BUSHING TRAFO":0,"COVER BUSHING ISOLATOR":0,"A3CS":0,"A3CS GARDU":0}},
  {"name":"7B","active":true,"materials":{"SERANDANG CANTOL":0,"SERANDANG PORTAL":0,"LVSB CANTOL":0,"LVSB PORTAL":0,"NYY 1X95":0,"NYY 1X240":0,"CABLE SHOE CU 95":0,"CABLE SHOE CU 240":0,"CABLE SHOE AL CU 150":0,"LA":0,"CUT OUT":0,"FUSE LINK 2A":0,"FUSE LINK 4A":0,"FUSE LINK 8A":0,"FUSE LINK 12A":0,"TRAVES TUMPU":0,"TRAVES GANDA":0,"TRAVES AFSPAN":1,"UNP GALVANIS":2,"PIN ISOLATOR":1,"HANG ISOLATOR":6,"TOP TIES":1,"DOUBLE TIES":0,"STAYSET TM":0,"GROUND ROD":0,"CABLE SHOE CU 50":0,"CCO 150":0,"COVER BUSHING TRAFO":0,"COVER BUSHING ISOLATOR":1,"A3CS":0,"A3CS GARDU":0}},
  {"name":"8B","active":true,"materials":{"SERANDANG CANTOL":0,"SERANDANG PORTAL":0,"LVSB CANTOL":0,"LVSB PORTAL":0,"NYY 1X95":0,"NYY 1X240":0,"CABLE SHOE CU 95":0,"CABLE SHOE CU 240":0,"CABLE SHOE AL CU 150":0,"LA":0,"CUT OUT":0,"FUSE LINK 2A":0,"FUSE LINK 4A":0,"FUSE LINK 8A":0,"FUSE LINK 12A":0,"TRAVES TUMPU":1,"TRAVES GANDA":0,"TRAVES AFSPAN":1,"UNP GALVANIS":3,"PIN ISOLATOR":4,"HANG ISOLATOR":3,"TOP TIES":4,"DOUBLE TIES":0,"STAYSET TM":0,"GROUND ROD":0,"CABLE SHOE CU 50":0,"CCO 150":0,"COVER BUSHING TRAFO":0,"COVER BUSHING ISOLATOR":4,"A3CS":0,"A3CS GARDU":0}},
  {"name":"9B","active":true,"materials":{"SERANDANG CANTOL":0,"SERANDANG PORTAL":0,"LVSB CANTOL":0,"LVSB PORTAL":0,"NYY 1X95":0,"NYY 1X240":0,"CABLE SHOE CU 95":0,"CABLE SHOE CU 240":0,"CABLE SHOE AL CU 150":0,"LA":0,"CUT OUT":0,"FUSE LINK 2A":0,"FUSE LINK 4A":0,"FUSE LINK 8A":0,"FUSE LINK 12A":0,"TRAVES TUMPU":0,"TRAVES GANDA":0,"TRAVES AFSPAN":0,"UNP GALVANIS":0,"PIN ISOLATOR":0,"HANG ISOLATOR":0,"TOP TIES":0,"DOUBLE TIES":0,"STAYSET TM":0,"GROUND ROD":0,"CABLE SHOE CU 50":0,"CCO 150":0,"COVER BUSHING TRAFO":0,"COVER BUSHING ISOLATOR":0,"A3CS":0,"A3CS GARDU":0}},
  {"name":"10B","active":true,"materials":{"SERANDANG CANTOL":0,"SERANDANG PORTAL":0,"LVSB CANTOL":0,"LVSB PORTAL":0,"NYY 1X95":0,"NYY 1X240":0,"CABLE SHOE CU 95":0,"CABLE SHOE CU 240":0,"CABLE SHOE AL CU 150":0,"LA":0,"CUT OUT":0,"FUSE LINK 2A":0,"FUSE LINK 4A":0,"FUSE LINK 8A":0,"FUSE LINK 12A":0,"TRAVES TUMPU":1,"TRAVES GANDA":0,"TRAVES AFSPAN":1,"UNP GALVANIS":3,"PIN ISOLATOR":5,"HANG ISOLATOR":6,"TOP TIES":5,"DOUBLE TIES":0,"STAYSET TM":0,"GROUND ROD":0,"CABLE SHOE CU 50":0,"CCO 150":0,"COVER BUSHING TRAFO":0,"COVER BUSHING ISOLATOR":5,"A3CS":0,"A3CS GARDU":0}},
  {"name":"11B","active":true,"materials":{"SERANDANG CANTOL":0,"SERANDANG PORTAL":0,"LVSB CANTOL":0,"LVSB PORTAL":0,"NYY 1X95":0,"NYY 1X240":0,"CABLE SHOE CU 95":0,"CABLE SHOE CU 240":0,"CABLE SHOE AL CU 150":0,"LA":3,"CUT OUT":0,"FUSE LINK 2A":0,"FUSE LINK 4A":0,"FUSE LINK 8A":0,"FUSE LINK 12A":0,"TRAVES TUMPU":0,"TRAVES GANDA":0,"TRAVES AFSPAN":1,"UNP GALVANIS":2,"PIN ISOLATOR":0,"HANG ISOLATOR":3,"TOP TIES":0,"DOUBLE TIES":0,"STAYSET TM":1,"GROUND ROD":1,"CABLE SHOE CU 50":2,"CCO 150":0,"COVER BUSHING TRAFO":0,"COVER BUSHING ISOLATOR":0,"A3CS":0,"A3CS GARDU":0}},
  {"name":"GARDU CANTOL","active":true,"materials":{"SERANDANG CANTOL":1,"SERANDANG PORTAL":0,"LVSB CANTOL":1,"LVSB PORTAL":0,"NYY 1X95":44,"NYY 1X240":0,"CABLE SHOE CU 95":8,"CABLE SHOE CU 240":0,"CABLE SHOE AL CU 150":12,"LA":3,"CUT OUT":3,"FUSE LINK 2A":0,"FUSE LINK 4A":3,"FUSE LINK 8A":0,"FUSE LINK 12A":0,"TRAVES TUMPU":0,"TRAVES GANDA":0,"TRAVES AFSPAN":0,"UNP GALVANIS":0,"PIN ISOLATOR":0,"HANG ISOLATOR":0,"TOP TIES":0,"DOUBLE TIES":0,"STAYSET TM":0,"GROUND ROD":4,"CABLE SHOE CU 50":8,"CCO 150":9,"COVER BUSHING TRAFO":3,"COVER BUSHING ISOLATOR":3,"A3CS":15,"A3CS GARDU":0}},
  {"name":"GARDU PORTAL","active":true,"materials":{"SERANDANG CANTOL":0,"SERANDANG PORTAL":1,"LVSB CANTOL":0,"LVSB PORTAL":1,"NYY 1X95":0,"NYY 1X240":44,"CABLE SHOE CU 95":0,"CABLE SHOE CU 240":8,"CABLE SHOE AL CU 150":12,"LA":3,"CUT OUT":3,"FUSE LINK 2A":0,"FUSE LINK 4A":0,"FUSE LINK 8A":3,"FUSE LINK 12A":0,"TRAVES TUMPU":2,"TRAVES GANDA":0,"TRAVES AFSPAN":1,"UNP GALVANIS":4,"PIN ISOLATOR":6,"HANG ISOLATOR":3,"TOP TIES":6,"DOUBLE TIES":0,"STAYSET TM":0,"GROUND ROD":4,"CABLE SHOE CU 50":8,"CCO 150":9,"COVER BUSHING TRAFO":3,"COVER BUSHING ISOLATOR":6,"A3CS":20,"A3CS GARDU":0}},
  {"name":"STAYSET","active":true,"materials":{"SERANDANG CANTOL":0,"SERANDANG PORTAL":0,"LVSB CANTOL":0,"LVSB PORTAL":0,"NYY 1X95":0,"NYY 1X240":0,"CABLE SHOE CU 95":0,"CABLE SHOE CU 240":0,"CABLE SHOE AL CU 150":0,"LA":0,"CUT OUT":0,"FUSE LINK 2A":0,"FUSE LINK 4A":0,"FUSE LINK 8A":0,"FUSE LINK 12A":0,"TRAVES TUMPU":0,"TRAVES GANDA":0,"TRAVES AFSPAN":0,"UNP GALVANIS":0,"PIN ISOLATOR":0,"HANG ISOLATOR":0,"TOP TIES":0,"DOUBLE TIES":0,"STAYSET TM":1,"GROUND ROD":0,"CABLE SHOE CU 50":0,"CCO 150":0,"COVER BUSHING TRAFO":0,"COVER BUSHING ISOLATOR":0,"A3CS":0,"A3CS GARDU":0}}
];

const GUDANG_DATA_RAW = [
  {material:"3250046",description:"MCB;230/400V;1P;2A;50Hz;",sap:550,fisik:550,unit:"pcs"},
  {material:"3250048",description:"MCB;230/400V;1P;4A;50Hz;",sap:3507,fisik:3507,unit:"pcs"},
  {material:"3250050",description:"MCB;230/400V;1P;6A;50Hz;",sap:2873,fisik:2873,unit:"pcs"},
  {material:"3250052",description:"MCB;230/400V;1P;10A;50Hz;",sap:921,fisik:921,unit:"pcs"},
  {material:"3250056",description:"MCB;230/400V;1P;20A;50Hz;",sap:181,fisik:181,unit:"pcs"},
  {material:"2190224",description:"MTR;kWH E-PR;;1P;230V;5-60A;1;;2W",sap:510,fisik:510,unit:"pcs"},
  {material:"2190252",description:"MTR;kWH E-PR;;3P;230/400V;5-80A;1;;4W",sap:195,fisik:195,unit:"pcs"},
  {material:"3110025",description:"CABLE PWR;NFA2X;2X10mm2;0.6/1kV;OH",sap:66,fisik:66,unit:"meter"},
  {material:"3110517",description:"CABLE PWR;NYY;1X240mm2;0.6/1kV;Opstig",sap:440,fisik:440,unit:"meter"},
  {material:"3110515",description:"CABLE PWR;NYY;1X95mm2;0.6/1kV;Opstig",sap:956,fisik:956,unit:"meter"},
  {material:"1030075",description:"TRF DIS;D3;20kV/400V;3P;160kVA;YZN5;OD",sap:6,fisik:6,unit:"unit"},
  {material:"3260238",description:"LVSB;DIST;3P;400V;400A;4LINE;OD",sap:5,fisik:5,unit:"unit"},
  {material:"3190012",description:"CUT OUT;24kV;6-100A;8kA;125kV",sap:52,fisik:52,unit:"pcs"},
  {material:"3120114",description:"CABLE PWR ACC;CABLE SHOE CU 70mm2",sap:1055,fisik:1055,unit:"pcs"},
  {material:"3040035",description:"POLE ACC;CR ARM UNP100X50X6X2000mm GALV",sap:50,fisik:50,unit:"pcs"},
  {material:"3041017",description:"UNIV ACC;TRAVES TUMPU",sap:35,fisik:35,unit:"pcs"},
  {material:"2090032",description:"LA;20-24kV;K;10kA;POLYMER;;",sap:12,fisik:12,unit:"pcs"},
  {material:"4190454",description:"UNIV ACC;GROUND ROD CU 5/8\"X2500mm",sap:1519,fisik:1519,unit:"pcs"},
  {material:"TIANG-12M",description:"Tiang Beton 12M 350daN",sap:45,fisik:45,unit:"batang"}
];

const KONTRAK_JASA_DATA: KontrakJasaRecord[] = [
  {no:'SPK-JASA-001/2026',pt:'PT. TRI STARS NUSANTARA',desc:'Pekerjaan Konstruksi Jaringan Distribusi Banten Selatan',awal:'2026-01-15',akhir:'2026-12-31',nilai:1000000000},
  {no:'SPK-JASA-002/2026',pt:'PT. Fakhri Putra Utama',desc:'Pembangunan dan Pemeliharaan Gardu Distribusi',awal:'2026-03-01',akhir:'2026-10-31',nilai:750000000},
  {no:'SPK-JASA-003/2026',pt:'PT. Datu Nahima Teknik',desc:'Pekerjaan Konstruksi ULP Rangkasbitung',awal:'2026-02-01',akhir:'2026-09-30',nilai:500000000}
];

const KONTRAK_MATERIAL_DATA: KontrakMaterialRecord[] = [
  {
    no:'SPK-MAT-001/2026',pt:'PT. PLN Material Nusantara',desc:'Pengadaan Material Gardu dan Jaringan',awal:'2026-01-10',akhir:'2026-12-31',nilai:2500000000,
    materials: [
      {code:'1030075',name:'TRF DIS;D3;20kV/400V;3P;160kVA;YZN5;OD',qty:3,unit:'unit',checked:false},
      {code:'3110515',name:'CABLE PWR;NYY;1X95mm2;0.6/1kV;Opstig',qty:250,unit:'meter',checked:false},
      {code:'3040035',name:'POLE ACC;CR ARM UNP100X50X6X2000mm GALV',qty:8,unit:'pcs',checked:true}
    ]
  },
  {
    no:'SPK-MAT-002/2026',pt:'PT. Energi Material Indonesia',desc:'Pengadaan Kabel dan Perlengkapan Distribusi',awal:'2026-02-15',akhir:'2026-11-30',nilai:1500000000,
    materials: [
      {code:'3110517',name:'CABLE PWR;NYY;1X240mm2;0.6/1kV;Opstig',qty:180,unit:'meter',checked:false},
      {code:'3260238',name:'LVSB;DIST;3P;400V;400A;4LINE;OD',qty:4,unit:'unit',checked:true}
    ]
  }
];

const VENDOR_TIANG_LIST = [
  'PT Tiang Nusantara',
  'CV Pilar Tiang Jaya',
  'PT Beton Distribusi Mandiri'
];

const DAFTUNG_RAW = [
  {"idpel":"562300789984","nama":"HJ ATI MUFLIHAT","alamat":"KP MARGAMULYA RT005/RW002 SUKAMANAH, MALINGPING, KAB. LEBAK, BANTEN","tarif":"I2","daya":23000,"jenisTransaksi":"PASANG BARU","noWo":"295.07.WO.2026","penyediaJasa":"PT Fakhri Putra Utama","pengawas":"Winnetou Chandra","tglBayar":"2026-07-02","durasiHariKerja":57,"kriteriaTmp":"Lebih dari 24 Hari","statusPermohonan":"CETAK PK","namaup":"ULP MALINGPING"},
  {"idpel":"562101101806","nama":"PT MUNS CIPTA BANGUN","alamat":"JL RAYA KADUANGUNG - CILELES CIGOONG SELATAN, CIKULUR, KAB. LEBAK, BANTEN","tarifLama":"B1T","dayaLama":5500,"tarif":"I3","daya":345000,"jenisTransaksi":"PERUBAHAN DAYA","noWo":"311.07.WO.2026","penyediaJasa":"PT Cipta Sedayu Elektrindo","pengawas":"Faisal Reza","tglBayar":"2026-07-10","durasiHariKerja":51,"kriteriaTmp":"60 Hari","statusPermohonan":"CETAK PK","namaup":"ULP RANGKASBITUNG"},
  {"idpel":"562101594784","nama":"HIDIR HIDAYAT","alamat":"KP PASIR GINTUNG ANGGALAN, CIKULUR, KAB. LEBAK, BANTEN","tarif":"I2","daya":66000,"jenisTransaksi":"PASANG BARU","noWo":"316.07.WO.2026","penyediaJasa":"PT Datu Nahima Teknik","pengawas":"Hasian Sitorus","tglBayar":"2026-07-13","durasiHariKerja":50,"kriteriaTmp":"Lebih dari 24 Hari","statusPermohonan":"CETAK PK","namaup":"ULP RANGKASBITUNG"},
  {"idpel":"562300793039","nama":"KDMP KADUMELATI SDNGRESMI","alamat":"KP SINAR GUNUNG SINDANGRESMI, KAB. PANDEGLANG, BANTEN","tarif":"B2T","daya":16500,"jenisTransaksi":"PASANG BARU","noWo":"362.08.WO.2026","penyediaJasa":"PT Lynard Power Kontraktor","pengawas":"Yadi Triyadi","tglBayar":"2026-07-18","durasiHariKerja":46,"kriteriaTmp":"Lebih dari 24 Hari","statusPermohonan":"CETAK PK","namaup":"ULP MALINGPING"},
  {"idpel":"562101597296","nama":"PT SINAR TERNAK SEJAHTERA","alamat":"DS MEKARAHAYU, BOJONGMANIK, KAB. LEBAK, BANTEN","tarif":"I3","daya":240000,"jenisTransaksi":"PASANG BARU","noWo":"352.07.WO.2026","penyediaJasa":"PT Tri Stars Nusantara","pengawas":"Faisal Reza","tglBayar":"2026-07-22","durasiHariKerja":43,"kriteriaTmp":"75 Hari","statusPermohonan":"CETAK PK","namaup":"ULP RANGKASBITUNG"},
  {"idpel":"562400798799","nama":"KDMP BANJARMASIN","alamat":"JL RAYA CARITA BANJARMASIN, CARITA, KAB. PANDEGLANG, BANTEN","tarif":"B2T","daya":16500,"jenisTransaksi":"PASANG BARU","noWo":"","penyediaJasa":"","pengawas":"","tglBayar":"2026-08-28","durasiHariKerja":18,"kriteriaTmp":"24 Hari","statusPermohonan":"CETAK PK","namaup":"ULP LABUAN"},
  {"idpel":"562101607754","nama":"PT PRIMA NIAGA LANCAR","alamat":"KP TALUN MASJID CIBADAK, KAB. LEBAK, BANTEN","tarif":"I1","daya":13200,"jenisTransaksi":"PASANG BARU","noWo":"","penyediaJasa":"","pengawas":"","tglBayar":"2026-09-01","durasiHariKerja":16,"kriteriaTmp":"24 Hari","statusPermohonan":"CETAK PK","namaup":"ULP RANGKASBITUNG"}
];

// Initialize in-memory singleton state
class MockDataStore {
  standards: StandardKonstruksiItem[];
  gudang: GudangMaterialRecord[];
  kontrakJasa: KontrakJasaRecord[];
  kontrakMaterial: KontrakMaterialRecord[];
  vendorTiang: string[];
  surveys: SurveyRecord[];
  daftung: DaftungRecord[];
  workorders: WorkOrderRecord[];
  pickupHistory: VendorPickupItem[];

  constructor() {
    this.standards = LATEST_STD_DATA.map((item, idx) => ({
      id: `std-${idx + 1}`,
      name: item.name,
      active: item.active,
      materials: item.materials
    }));

    this.gudang = GUDANG_DATA_RAW.map(m => ({
      material: m.material,
      description: m.description,
      sap: m.sap,
      fisik: m.fisik,
      unit: m.unit,
      keterangan: ''
    }));

    this.kontrakJasa = [...KONTRAK_JASA_DATA];
    this.kontrakMaterial = [...KONTRAK_MATERIAL_DATA];
    this.vendorTiang = [...VENDOR_TIANG_LIST];

    this.surveys = [];
    this.daftung = [];
    this.workorders = [];

    // Seed surveys, daftung, and workorders
    DAFTUNG_RAW.forEach((raw, i) => {
      const srvId = `SRV-${String(i + 1).padStart(4, '0')}`;
      const dtId = `DT-${String(i + 1).padStart(4, '0')}`;

      const surveyMaterials: MaterialItem[] = [
        { code: '1030075', name: 'TRF DIS;D3;20kV/400V;3P;160kVA;YZN5;OD', unit: 'unit', qty: 1, note: '' },
        { code: '3110515', name: 'CABLE PWR;NYY;1X95mm2;0.6/1kV;Opstig', unit: 'meter', qty: 44, note: '' },
        { code: '3120114', name: 'CABLE PWR ACC;CABLE SHOE CU 70mm2', unit: 'pcs', qty: 8, note: '' },
        { code: 'TIANG-12M', name: 'Tiang Beton 12M 350daN', unit: 'batang', qty: 2, note: '' }
      ];

      this.surveys.push({
        id: srvId,
        status: i < 5 ? 'Selesai' : 'Draft',
        surveyor: ['Surveyor 01', 'Surveyor 02', 'Surveyor 03'][i % 3],
        created: raw.tglBayar || '2026-09-20',
        updated: raw.tglBayar || '2026-09-20',
        customer: {
          idpel: raw.idpel,
          name: raw.nama,
          address: raw.alamat,
          daya: raw.daya,
          tarif: raw.tarif,
          jenis: raw.jenisTransaksi
        },
        technical: {
          pelangganKhusus: '',
          ulp: raw.namaup,
          tipeGardu: i % 2 === 0 ? 'Portal' : 'Cantol',
          kapasitasTrafo: 160,
          jumlahKabelNaik: 4,
          penyulang: 'KADUAGUNG'
        },
        location: {
          address: raw.alamat,
          lat: '-6.52414600',
          lng: '106.17685700',
          photos: [`Foto_Lokasi_${raw.nama.replace(/\s+/g, '_')}.jpg`]
        },
        standardSelections: [{ name: i % 2 === 0 ? 'GARDU PORTAL' : 'GARDU CANTOL', qty: 1, note: 'Standar utama' }],
        materials: surveyMaterials,
        daftungId: dtId,
        sourceLegacy: false
      });

      this.daftung.push({
        id: dtId,
        idpel: raw.idpel,
        nama: raw.nama,
        alamat: raw.alamat,
        tarifLama: (raw as any).tarifLama || '',
        dayaLama: (raw as any).dayaLama || 0,
        tarif: raw.tarif,
        daya: raw.daya,
        jenisTransaksi: raw.jenisTransaksi,
        noWo: raw.noWo || '',
        penyediaJasa: raw.penyediaJasa || '',
        pengawas: raw.pengawas || '',
        tglBayar: raw.tglBayar,
        durasiHariKerja: raw.durasiHariKerja,
        kriteriaTmp: raw.kriteriaTmp,
        statusPermohonan: raw.statusPermohonan,
        namaup: raw.namaup,
        surveyId: srvId,
        sumber: 'SURVEY',
        statusDaftung: raw.noWo ? 'WO Proses' : 'Siap WO',
        nidi: i === 0,
        slo: i === 0
      });

      if (raw.noWo) {
        const isInitialDone = i === 0;
        const woMaterials: MaterialItem[] = [
          { code: '1030075', name: 'TRF DIS;D3;20kV/400V;3P;160kVA;YZN5;OD', unit: 'unit', required: 1, reserved: isInitialDone ? 1 : 0, verified: isInitialDone ? 1 : 0, condition: 'Baik' },
          { code: '3110515', name: 'CABLE PWR;NYY;1X95mm2;0.6/1kV;Opstig', unit: 'meter', required: 44, reserved: isInitialDone ? 44 : 0, verified: isInitialDone ? 44 : 0, condition: 'Baik' },
          { code: '3120114', name: 'CABLE PWR ACC;CABLE SHOE CU 70mm2', unit: 'pcs', required: 8, reserved: isInitialDone ? 8 : 0, verified: isInitialDone ? 8 : 0, condition: 'Baik' }
        ];

        const tiangRows = [
          { code: 'TIANG-12M', name: 'Tiang Beton 12M 350daN', unit: 'batang', qtySurvey: 2, qtyWO: 2, vendor: 'PT Tiang Nusantara', installedQty: isInitialDone ? 2 : 0, verifiedQty: isInitialDone ? 2 : 0, verified: isInitialDone, progress: isInitialDone ? 100 : 0 }
        ];

        this.workorders.push({
          noWo: raw.noWo,
          namaPelanggan: raw.nama,
          vendor: raw.penyediaJasa || 'PT. TRI STARS NUSANTARA',
          pengawas: raw.pengawas || 'Faisal Reza',
          pengawas2: 'Daud Febriansyah',
          status: isInitialDone ? 'Selesai' : 'Aktif',
          ketKendala: i === 2 ? 'Menunggu penanaman tiang dari vendor' : '',
          daftungId: dtId,
          surveyId: srvId,
          idpel: raw.idpel,
          kontrakJasa: KONTRAK_JASA_DATA[i % 3].no,
          nilaiJasa: 75000000,
          vendorTiang: 'PT Tiang Nusantara',
          vendorApproved: isInitialDone,
          vendorToken: isInitialDone ? `VND-${raw.noWo.replace(/[^a-zA-Z0-9]/g, '')}-DEMO` : '',
          materials: woMaterials,
          jasaProgress: {
            tiang: isInitialDone,
            konstruksi: false,
            penarikan: false,
            kerangka: false,
            trafo_app: false
          },
          jasaWeights: { tiang: 20, konstruksi: 20, penarikan: 20, kerangka: 20, trafo_app: 20 },
          tiangRows: tiangRows,
          bast: {
            conditions: { '1030075': 'Baik', '3110515': 'Baik' },
            asmanKonstruksi: 'Hendra Setiawan, S.T.',
            asmanJaringan: 'Budi Santoso, M.T.'
          }
        });
      }
    });

    this.pickupHistory = [
      {
        id: 'pk-001',
        date: '2026-09-25',
        woNo: '295.07.WO.2026',
        vendor: 'PT Fakhri Putra Utama',
        material: 'TRF DIS;D3;20kV/400V;3P;160kVA;YZN5;OD',
        qty: '1 unit',
        sj: 'SJ-2026-0091',
        verified: true,
        proofName: 'Bukti_SJ_2026_0091.pdf'
      }
    ];
  }

  getAllData() {
    return {
      standards: this.standards,
      gudang: this.gudang,
      surveys: this.surveys,
      daftung: this.daftung,
      workorders: this.workorders,
      kontrakJasa: this.kontrakJasa,
      kontrakMaterial: this.kontrakMaterial,
      vendorTiang: this.vendorTiang,
      pickupHistory: this.pickupHistory
    };
  }

  // Survey Actions
  saveSurvey(record: SurveyRecord) {
    const idx = this.surveys.findIndex(s => s.id === record.id);
    const updatedRecord = {
      ...record,
      updated: new Date().toISOString().slice(0, 10),
      created: record.created || new Date().toISOString().slice(0, 10)
    };
    if (idx >= 0) {
      this.surveys[idx] = updatedRecord;
    } else {
      this.surveys.unshift(updatedRecord);
    }
    return updatedRecord;
  }

  moveSurveyToDaftung(surveyId: string) {
    const survey = this.surveys.find(s => s.id === surveyId);
    if (!survey) throw new Error('Survey tidak ditemukan');

    if (survey.daftungId) {
      const existing = this.daftung.find(d => d.id === survey.daftungId);
      if (existing) return existing;
    }

    const nextId = `DT-${String(this.daftung.length + 1).padStart(4, '0')}`;
    const newDaftung: DaftungRecord = {
      id: nextId,
      idpel: survey.customer?.idpel || `562${Date.now().toString().slice(-9)}`,
      nama: survey.customer?.name || 'Pelanggan Baru',
      alamat: survey.customer?.address || survey.location?.address || '',
      tarif: survey.customer?.tarif || 'B2T',
      daya: Number(survey.customer?.daya) || 16500,
      jenisTransaksi: survey.customer?.jenis || 'PASANG BARU',
      noWo: '',
      penyediaJasa: '',
      pengawas: '',
      tglBayar: new Date().toISOString().slice(0, 10),
      durasiHariKerja: 0,
      kriteriaTmp: '24 Hari',
      statusPermohonan: 'CETAK PK',
      namaup: survey.technical?.ulp || 'ULP RANGKASBITUNG',
      surveyId: survey.id,
      sumber: 'SURVEY',
      statusDaftung: 'Siap WO',
      nidi: false,
      slo: false
    };

    survey.daftungId = nextId;
    survey.status = 'Selesai';
    this.daftung.unshift(newDaftung);
    return newDaftung;
  }

  saveManualDaftung(payload: Partial<DaftungRecord>) {
    const nextId = `DT-${String(this.daftung.length + 1).padStart(4, '0')}`;
    const newDaftung: DaftungRecord = {
      id: nextId,
      idpel: payload.idpel || `562${Date.now().toString().slice(-9)}`,
      nama: payload.nama || 'Pelanggan Manual',
      alamat: payload.alamat || '',
      tarif: payload.tarif || 'B2T',
      daya: Number(payload.daya) || 16500,
      jenisTransaksi: payload.jenisTransaksi || 'PASANG BARU',
      noWo: '',
      penyediaJasa: '',
      pengawas: '',
      tglBayar: new Date().toISOString().slice(0, 10),
      durasiHariKerja: 0,
      kriteriaTmp: '24 Hari',
      statusPermohonan: 'CETAK PK',
      namaup: payload.namaup || 'ULP RANGKASBITUNG',
      sumber: 'MANUAL',
      statusDaftung: 'Siap WO',
      nidi: false,
      slo: false
    };
    this.daftung.unshift(newDaftung);
    return newDaftung;
  }

  updateDaftungIdpel(id: string, idpel: string) {
    const item = this.daftung.find(d => d.id === id);
    if (item) item.idpel = idpel;
    return item;
  }

  toggleDaftungFlag(id: string, flag: 'nidi' | 'slo', value: boolean) {
    const item = this.daftung.find(d => d.id === id);
    if (item) item[flag] = value;
    return item;
  }

  createWOFromDaftung(payload: any) {
    const { daftungId, noWo, vendor, pengawas, pengawas2, kontrakJasa, nilaiJasa, vendorTiang, tiangQtys } = payload;
    const daftungItem = this.daftung.find(d => d.id === daftungId);
    if (!daftungItem) throw new Error('Data Daftung tidak ditemukan');

    let materials: MaterialItem[] = [];
    if (daftungItem.surveyId) {
      const survey = this.surveys.find(s => s.id === daftungItem.surveyId);
      if (survey && survey.materials) {
        materials = survey.materials.map(m => ({
          ...m,
          required: m.qty || 0,
          reserved: 0,
          verified: 0,
          condition: 'Baik'
        }));
      }
    }

    const tiangRows = Object.entries(tiangQtys || {}).map(([name, qty]) => ({
      code: name.toUpperCase().replace(/\s+/g, '-'),
      name,
      unit: 'batang',
      qtySurvey: Number(qty) || 0,
      qtyWO: Number(qty) || 0,
      vendor: vendorTiang || 'PT Tiang Nusantara',
      installedQty: 0,
      verifiedQty: 0,
      verified: false,
      progress: 0
    }));

    const newWO: WorkOrderRecord = {
      noWo,
      namaPelanggan: daftungItem.nama,
      vendor,
      pengawas,
      pengawas2: pengawas2 || '',
      status: 'Aktif',
      ketKendala: '',
      daftungId,
      surveyId: daftungItem.surveyId || '',
      idpel: daftungItem.idpel,
      kontrakJasa: kontrakJasa || '',
      nilaiJasa: Number(nilaiJasa) || 0,
      vendorTiang: vendorTiang || '',
      materials,
      jasaProgress: {
        tiang: false,
        konstruksi: false,
        penarikan: false,
        kerangka: false,
        trafo_app: false
      },
      jasaWeights: { tiang: 20, konstruksi: 20, penarikan: 20, kerangka: 20, trafo_app: 20 },
      tiangRows,
      bast: { conditions: {}, asmanKonstruksi: '', asmanJaringan: '' },
      vendorToken: `VND-${noWo.replace(/[^a-zA-Z0-9]/g, '')}`,
      vendorApproved: false
    };

    const existingIdx = this.workorders.findIndex(w => w.noWo === noWo);
    if (existingIdx >= 0) {
      this.workorders[existingIdx] = newWO;
    } else {
      this.workorders.unshift(newWO);
    }

    daftungItem.noWo = noWo;
    daftungItem.penyediaJasa = vendor;
    daftungItem.pengawas = pengawas;
    daftungItem.statusDaftung = 'WO Proses';

    return newWO;
  }

  updateWOMaterials(noWo: string, materials: MaterialItem[]) {
    const wo = this.workorders.find(w => w.noWo === noWo);
    if (wo) wo.materials = materials;
    return wo;
  }

  updateWOJasaProgress(noWo: string, jasaProgress?: any, jasaWeights?: any) {
    const wo = this.workorders.find(w => w.noWo === noWo);
    if (wo) {
      if (jasaProgress) wo.jasaProgress = jasaProgress;
      if (jasaWeights) wo.jasaWeights = jasaWeights;
    }
    return wo;
  }

  updateWOTiang(noWo: string, tiangRows: any[]) {
    const wo = this.workorders.find(w => w.noWo === noWo);
    if (wo) wo.tiangRows = tiangRows;
    return wo;
  }

  updateWOKendala(noWo: string, ketKendala: string) {
    const wo = this.workorders.find(w => w.noWo === noWo);
    if (wo) wo.ketKendala = ketKendala;
    return wo;
  }

  updateWorkOrder(noWo: string, data: any) {
    const wo = this.workorders.find(w => w.noWo === noWo);
    if (wo) Object.assign(wo, data);
    return wo;
  }

  saveBAST(noWo: string, bast: any) {
    const wo = this.workorders.find(w => w.noWo === noWo);
    if (wo) {
      wo.bast = bast;
      wo.status = 'Selesai';
    }
    return wo;
  }

  updateGudangStok(payload: any) {
    const { material, sap, fisik, description, unit, keterangan } = payload;
    const existing = this.gudang.find(g => g.material === material);
    if (existing) {
      existing.sap = Number(sap);
      existing.fisik = Number(fisik);
      if (description) existing.description = description;
      if (unit) existing.unit = unit;
      if (keterangan !== undefined) existing.keterangan = keterangan;
      return existing;
    } else {
      const newItem: GudangMaterialRecord = {
        material,
        description: description || material,
        sap: Number(sap) || 0,
        fisik: Number(fisik) || 0,
        unit: unit || 'pcs',
        keterangan: keterangan || ''
      };
      this.gudang.unshift(newItem);
      return newItem;
    }
  }

  deleteGudangMaterial(material: string) {
    this.gudang = this.gudang.filter(g => g.material !== material);
    return true;
  }

  updateStandardQty(name: string, materials: Record<string, number>, active?: boolean) {
    const std = this.standards.find(s => s.name === name);
    if (std) {
      std.materials = materials;
      if (active !== undefined) std.active = active;
      return std;
    }
    return null;
  }

  processVendorPickup(pickups: any[]) {
    const created = pickups.map((p, idx) => {
      const item: VendorPickupItem = {
        id: `pk-${Date.now()}-${idx}`,
        date: new Date().toISOString().slice(0, 10),
        woNo: p.woNo || '',
        vendor: p.vendor || '',
        material: p.material || '',
        qty: `${p.qty} ${p.unit || 'pcs'}`,
        sj: p.sj || `SJ-${Date.now().toString().slice(-6)}`,
        verified: false,
        proofName: ''
      };
      this.pickupHistory.unshift(item);
      return item;
    });
    return created;
  }

  verifyVendorProof(sj: string) {
    const items = this.pickupHistory.filter(p => p.sj === sj);
    items.forEach(p => { p.verified = true; });
    return items;
  }

  saveVendorTiang(name: string) {
    if (!this.vendorTiang.includes(name)) {
      this.vendorTiang.push(name);
    }
    return this.vendorTiang;
  }

  approveWOForVendor(noWo: string, token: string) {
    const wo = this.workorders.find(w => w.noWo === noWo);
    if (wo) {
      wo.vendorToken = token;
      wo.vendorApproved = true;
      wo.tglPemeriksaanPengawas = new Date().toISOString().slice(0, 10);
    }
    return wo;
  }

  updateWOVendorCatatan(noWo: string, catatan: string) {
    const wo = this.workorders.find(w => w.noWo === noWo);
    if (wo) wo.vendorCatatan = catatan;
    return wo;
  }

  // Find WO for vendor portal
  findWOByTokenOrNo(token: string) {
    return this.workorders.find(w => w.vendorToken === token || w.noWo === token);
  }
}

// Global Singleton to maintain state across requests in Next.js development server
const globalForMock = global as unknown as { mockStoreInstance?: MockDataStore };

export const mockStore = globalForMock.mockStoreInstance || new MockDataStore();
if (process.env.NODE_ENV !== 'production') {
  globalForMock.mockStoreInstance = mockStore;
}
