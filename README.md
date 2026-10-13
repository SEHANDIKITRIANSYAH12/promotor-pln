# ⚡ PROMOTOR V1.0 — Project Monitoring & Material Control System

> **Sistem Informasi Terintegrasi Perencanaan, Pengawasan Proyek Distribusi, dan Pengendalian Material Konstruksi PLN UP3 / ULP**

[![Next.js](https://img.shields.io/badge/Next.js-14.2.15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22.0-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-316192?style=for-the-badge&logo=postgresql)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

---

## 1. Nama Project dan Deskripsi

**PROMOTOR V1.0 (Project Monitoring & Material Control)** adalah aplikasi web terintegrasi berbasis *enterprise* yang dikembangkan khusus untuk unit operasional PT PLN (Persero) UP3 Banten Selatan / ULP Rangkasbitung.

Aplikasi ini menyatukan alur siklus hidup proyek distribusi tenaga listrik mulai dari:
1. **Survei Lapangan Calon Pelanggan**: Kalkulasi *Bill of Materials* (BOM) otomatis berbasis standar konstruksi TM dan geotagging koordinat GPS.
2. **Monitoring Antrean Pelanggan (Daftung)**: Pelacakan SLA batas waktu pelayanan Tingkat Mutu Pelayanan (TMP 24 / 45 / 100 hari) serta status SLO & NIDI.
3. **Penerbitan Surat Perintah Kerja (Work Order)**: Penugasan vendor pelaksana, pengawas lapangan, dan alokasi pagu kontrak jasa borongan.
4. **Pengawasan Fisik & Opname Tiang**: Verifikasi persentase progres pekerjaan 3 pilar, opname tiang pabrikan, verifikasi berita acara via Vendor Portal unik (*Token-based*), hingga cetak BAST digital.
5. **Pengendalian Saldo Material**: Sinkronisasi saldo riil fisik gudang dengan saldo sistem SAP logistik serta perhitungan agregasi defisit kebutuhan material proyek.

### 🎯 Masalah yang Diselesaikan:
- **Human Error Estimasi Material**: Menggantikan perhitungan manual excel dengan rumus matriks otomatis standar PLN (1B–14B, Gardu Cantol/Portal).
- **Proyek Terhenti Akibat Defisit Material**: Menyajikan sistem peringatan dini (*early warning deficit*) sebelum SPK diterbitkan ke vendor.
- **Penyalahgunaan Akses & Disparitas Data**: Menerapkan *Role-Based Access Control* (RBAC) ketat dan audit trail menyeluruh (*immutable audit log*).

---

## 2. Screenshot dan Demo Tampilan

### 📸 Antarmuka Utama & Branding Resmi
```
+------------------------------------------------------------------------------------------------+
|  ⚡ PROMOTOR V1.0                                                [👤 Budi Santoso | Super Admin] |
+------------------------------------------------------------------------------------------------+
|  [MENU UTAMA]      |  📊 DASHBOARD STATISTIK & MODUL AKTIF                                     |
|  📐 STD KONSTRUKSI |  • Total Survei: 12 Pelanggan      • Saldo Material Kritis: 2 Item        |
|  📍 SURVEY         |  • SPK / WO Aktif: 8 Proyek        • Batas SLA TMP Mendekati: 1 Antrean   |
|  ⏳ DAFTUNG        +---------------------------------------------------------------------------+
|  📋 WORK ORDER     |  [TABEL OPERASIONAL / FORM MULTI-STEP / MAP GEOTAGGING]                   |
|  🔍 PENGAWASAN     |  - Validasi stok real-time saat submit survei                             |
|  🏢 GUDANG         |  - Opname tiang & verifikasi tanda terima material via Surat Jalan        |
|  📄 KONTRAK        |  - Verifikasi mandiri vendor tanpa login via Secure URL Token             |
|  📊 KEB MATERIAL   |  - Ekspor dokumen resmi otomatis ke format Excel (.xlsx) dan PDF          |
|  🛡️ AUDIT LOG      |  - Manajemen kredensial & otorisasi peran pengguna (Super Admin)         |
|  👥 KELOLA USER    |                                                                           |
+--------------------+---------------------------------------------------------------------------+
```

### 🌐 Tautan & Akses Demo
- **Demo URL Lokal**: `http://localhost:3000` (atau port `3001` / `3002`)
- **Demo GIS Map**: `/demo-gis/index.html` (Interaktif Leaflet OSM Geolocation)

---

## 3. Latar Belakang dan Fitur Utama

### 💡 Latar Belakang
Pada unit distribusi PLN, koordinasi antara tim survei, perencana teknik, logistik gudang, pengawas lapangan, dan vendor mitra sering terkendala berkas manual terpisah, selisih catatan stok fisik vs SAP, serta risiko pelanggaran komitmen SLA Tingkat Mutu Pelayanan (TMP). PROMOTOR hadir sebagai sistem *single-source-of-truth* yang mengeliminasi friksi antar bagian.

### 🌟 10 Fitur Unggulan Sistem:

1. **📐 Master Standar Konstruksi TM**:
   - Master formula BOM (Bill of Materials) untuk seluruh tipe konstruksi Jaringan Tegangan Menengah (1B s.d 14B, Gardu Cantol, Gardu Portal, Co Aftak, Stayset).
   - Pengaturan aktivasi/nonaktivasi standar dan ekspor matriks ke format Excel & PDF.

2. **📍 Survei Pelanggan & Geotagging**:
   - Formulir terpandu 5 tahap (Data Pelanggan, Teknis, Koordinat GPS/Picker Map, Pilihan Standar BOM, Review & Submit).
   - **Validasi Kunci Stok**: Survei tidak dapat diajukan jika stok material di master konstruksi bernilai 0.

3. **⏳ Daftung & Monitoring SLA / TMP**:
   - Pemantauan antrean pelanggan siap bayar dengan hitungan mundur SLA (24, 45, dan 100 hari kerja).
   - Saklar status Sertifikat Laik Operasi (**SLO**) dan Nomor Identitas Instalasi Tenaga Listrik (**NIDI**).
   - Konversi 1-klik dari antrean Daftung menjadi Perintah Kerja (WO).

4. **📋 Work Order (WO) & Manajemen SPK**:
   - Penomoran otomatis No WO resmi (`WO-xxxx` / `295.07.WO.YYYY`).
   - Penugasan vendor pelaksana, pengawas utama, pengawas pendamping, dan pagu kontrak jasa.
   - Pencatatan kendala lapangan (*Right of Way*, pohon, penolakan warga, perizinan).

5. **🔍 Pengawasan Lapangan & Opname Tiang**:
   - Opname tiang beton (Kebutuhan Survei vs Target WO vs Terpasang vs Pabrikan).
   - Kalkulasi otomatis bobot fisik jasa (Pondasi, Konstruksi, Penarikan JTM, Kerangka, Trafo & APP).
   - **Vendor Portal Approval**: Penerbitan link token khusus agar vendor rekanan dapat memvalidasi pekerjaan tanpa perlu akun internal PLN.
   - Cetak Berita Acara Serah Terima (**BAST**) berstandar resmi.

6. **🏢 Gudang Logistik (Stok Fisik vs SAP)**:
   - Pencatatan saldo sistem SAP vs Saldo Riil Fisik.
   - Deteksi dini selisih barang guna mencegah *losses*.
   - Riwayat penarikan barang rekanan (*Vendor Pickup History*) berbasis Nomor Surat Jalan (SJ).

7. **📄 Manajemen Kontrak (Jasa & Material)**:
   - Kontrak Jasa: Pagu anggaran, pemakaian jasa per SPK, dan saldo sisa pagu.
   - Kontrak Material: Komitmen pengadaan pabrikan dan pelacakan *Material In-Transit*.

8. **📊 Analisis Kebutuhan Material (KEB Material)**:
   - Rumus komparasi makro: $\text{Kekurangan} = (\text{Stok Fisik} + \text{In-Transit}) - \text{Kebutuhan WO}$.
   - Indikator peringatan dini untuk material yang berada dalam status defisit kritis.

9. **🛡️ Rekam Jejak Audit (Audit Log Module)**:
   - Pencatatan otomatis riwayat aksi sensitif (login, perubahan stok, penerbitan WO, approval, BAST).
   - Filter tanggal, pengguna, tingkat keparahan (*Info, Sukses, Peringatan, Kritis*), tampilan Timeline, dan ekspor CSV.

10. **👥 Kelola Pengguna & Hak Akses (User Management)**:
    - Manajemen akun pegawai PLN dengan NIP 18 digit, email kedinasan, unit kerja, dan peran (RBAC).
    - Fitur aktifkan/nonaktifkan akun instan, reset kata sandi, dan proteksi akun Super Administrator utama.
    - Ekspor daftar akun ke format Excel dan PDF.

---

## 4. Tech Stack dan Arsitektur

### 🛠️ Daftar Teknologi

| Layer | Teknologi | Alasan Pemilihan |
| :--- | :--- | :--- |
| **Framework** | Next.js 14 (App Router) | Performa SSR tinggi, routing modular, dan integrasi API route handler terpadu |
| **Bahasa** | TypeScript (Strict Mode) | Menjamin type safety end-to-end, meminimalkan bug runtime pada kalkulasi material |
| **Styling** | Tailwind CSS + Token Design System | Desain modern responsif berstandar korporat PLN dengan micro-animations |
| **Database** | PostgreSQL (Supabase) | Database relasional tangguh untuk integritas transaksi proyek dan stok material |
| **ORM** | Prisma ORM | Schema-driven modeling, type-safe queries, dan migrasi terstruktur |
| **State & Cache** | React Context API + LocalStorage Hydration | Waktu render instan 0ms (*Instant Cache Hydration*) dengan sinkronisasi background |
| **Export Engine** | `xlsx` & `jspdf` / `jspdf-autotable` | Pembuatan laporan resmi Excel & PDF client-side tanpa membebani server |
| **Pemetaan** | Leaflet / OpenStreetMap | Penentuan koordinat GPS & visualisasi titik tiang/gardu pelanggan |

### 🏗️ Diagram Arsitektur Sistem

```mermaid
graph TD
    Client[Browser Client / Next.js React UI] --> Context[PromotorContext State & Cache Hydration]
    Context --> API[Next.js API Route /api/promotor]
    API --> Prisma[Prisma ORM Client]
    Prisma --> DB[(PostgreSQL Supabase)]
    
    API -.-> Fallback[MockStore Resilient Fallback]
    Fallback -.-> DB_Offline[Graceful Degradation jika DB Terputus]
    
    Vendor[Vendor Rekanan Lapangan] --> VendorAPI[/api/vendor/:token]
    VendorAPI --> Prisma
```

---

## 5. Instalasi dan Cara Menjalankan

### 📋 Prasyarat Sistem
- **Node.js**: Versi `18.17.0` atau yang lebih baru
- **npm**: Versi `9.x` atau lebih baru (atau yarn / pnpm)
- **Database**: PostgreSQL (Lokal atau Cloud Supabase)

### ⚙️ Langkah Instalasi

1. **Clone Repository**:
   ```bash
   git clone https://github.com/SEHANDIKITRIANSYAH12/promotor-pln.git
   cd promotor-pln
   ```

2. **Instal Dependensi**:
   ```bash
   npm install
   ```

3. **Konfigurasi Environment Variable**:
   Salin atau buat file `.env` di direktori *root* proyek:
   ```env
   # Format Koneksi PostgreSQL Supabase
   DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:6543/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"

   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

4. **Sinkronisasi Skema Database & Generate Prisma Client**:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Jalankan Seeding Data Awal**:
   ```bash
   node prisma/seed.js
   ```

6. **Jalankan Server Development**:
   ```bash
   npm run dev
   ```
   Aplikasi akan aktif di `http://localhost:3000`.

---

### 🔑 Kredensial Akun Bawaan (Seed Accounts)

> Kata sandi default untuk seluruh akun: **`admin`** *(juga menerima `admin123`)*

| Role (Hak Akses) | Nama Pegawai | NIP (ID Login) | Email Kedinasan | Unit Kerja |
| :--- | :--- | :---: | :--- | :--- |
| **Super Admin** 👨‍💼 | Budi Santoso, S.T. | `198503152010011001` | `budi.santoso@pln.co.id` | PLN ULP Rangkasbitung |
| **Surveyor** 👷‍♂️ | Ahmad Fauzi | `199207242015021002` | `ahmad.fauzi@pln.co.id` | PLN ULP Rangkasbitung |
| **Pengawas Teknik** 🕵️‍♂️ | Faisal Reza, S.T. | `198911042013031003` | `faisal.reza@pln.co.id` | PLN ULP Rangkasbitung |
| **Admin Gudang** 📦 | Siti Rahmawati | `199405182018012004` | `siti.rahmawati@pln.co.id` | Gudang Logistik Rangkasbitung |
| **Manager UP3** 👨‍💼 | Hendra Gunawan, S.T. | `198006122005011005` | `hendra.gunawan@pln.co.id` | PLN UP3 Banten Selatan |

---

## 6. Struktur Folder dan API

### 📁 Struktur Direktori Penting

```text
PROMOTOR-V1/
├── prisma/
│   ├── schema.prisma             # Skema relasional database PostgreSQL
│   └── seed.js                   # Script inisialisasi master data & akun pegawai
├── public/
│   ├── pln-logo.png              # Logo resmi PLN
│   └── demo-gis/                 # Demo modul peta koordinat GIS
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── promotor/route.ts # Endpoint sentral sinkronisasi data sistem
│   │   │   └── vendor/[token]/   # Endpoint otentikasi token vendor eksternal
│   │   ├── layout.tsx            # Root layout Next.js
│   │   └── page.tsx              # Halaman utama aplikasi & router modul
│   ├── components/
│   │   ├── auth/
│   │   │   └── LoginPage.tsx     # Halaman login otentikasi NIP/Email PLN
│   │   ├── layout/
│   │   │   ├── Header.tsx        # Top navigation & user switcher
│   │   │   └── Sidebar.tsx       # Navigasi menu otorisasi peran (RBAC)
│   │   ├── modules/              # 10 Modul Bisnis Utama
│   │   │   ├── StdKonstruksiModule.tsx
│   │   │   ├── SurveyModule.tsx
│   │   │   ├── DaftungModule.tsx
│   │   │   ├── WorkOrderModule.tsx
│   │   │   ├── PengawasanModule.tsx
│   │   │   ├── GudangModule.tsx
│   │   │   ├── KontrakModule.tsx
│   │   │   ├── KebMaterialModule.tsx
│   │   │   ├── AuditLogModule.tsx
│   │   │   └── UserManagementModule.tsx
│   │   └── ui/                   # Komponen Reusable (Modal, Badge, Toast, Confirm)
│   ├── context/
│   │   └── PromotorContext.tsx   # State management sentral & logic RBAC
│   └── lib/
│       ├── types.ts              # Kontrak definisi tipe TypeScript
│       ├── prisma.ts             # Instansiasi Prisma client singleton
│       └── exportUtils.ts        # Helper utilitas cetak Excel dan PDF
└── DOKUMENTASI.md                # Dokumentasi spesifikasi lengkap proyek
```

### 🔌 Spesifikasi Endpoint API

#### 1. Sinkronisasi Data Utama (`GET /api/promotor`)
Mengambil seluruh data operasional (Standar Konstruksi, Saldo Gudang, Survei, Daftung, Work Order, dan Kontrak).

- **Contoh Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": {
      "standards": [
        { "id": "1b", "name": "1B", "active": true, "materials": { "TRAVES TUMPU": 1, "PIN ISOLATOR": 3 } }
      ],
      "gudang": [
        { "material": "1030075", "description": "TRF DIS 160kVA", "sap": 6, "fisik": 6, "unit": "unit" }
      ],
      "surveys": [],
      "daftung": [],
      "workorders": []
    }
  }
  ```

#### 2. Portal Konfirmasi Vendor (`GET & POST /api/vendor/[token]`)
Digunakan oleh vendor mitra tanpa kredensial akun untuk memeriksa status opname dan menyetujui berita acara pekerjaan.
- **GET**: Mengambil detail SPK dan tiang berdasarkan token unik 32 karakter.
- **POST**: Mengirim konfirmasi persetujuan (*approval*) dan catatan digital vendor.

---

## 7. Keamanan, Testing, dan Keterbatasan

### 🔒 Keamanan & Integritas Data
1. **Role-Based Access Control (RBAC)**:
   - Pembatasan rute dan tombol aksi secara terisolasi berdasarkan wewenang dinas.
   - Menu sensitif seperti **Kelola Pengguna** dan **Audit Log** dikunci secara eksklusif hanya untuk peran `superadmin`.
2. **Proteksi Integritas Akun**:
   - Akun Super Administrator utama dilindungi dari penghapusan (*system-protected*).
   - Pengguna aktif dicegah dari menonaktifkan atau menghapus akunnya sendiri saat sedang login.
3. **Audit Trail Imutabel**:
   - Seluruh mutasi data dicatat lengkap dengan stempel waktu ISO, ID pengguna, peran, aksi, dan metadata perubahan.
4. **Resilient Offline Fallback**:
   - Jika koneksi database cloud mengalami kendala jaringan atau *paused*, sistem otomatis mengaktifkan *graceful degradation* menggunakan *cache hydration* dan cadangan memori sehingga antarmuka tidak mengalami *blank screen*.

### 🧪 Pengujian (Testing)
- **Type Checking**: Validasi menyeluruh dengan TypeScript Compiler (`npx tsc --noEmit`) dengan **0 error** pada *strict mode*.
- **Automated Browser Walkthrough**: Uji fungsionalitas mencakup alur login, pergantian hak akses akun, penambahan pengguna baru, filter tabel, dan verifikasi modal.

### ⚠️ Keterbatasan Saat Ini & Rencana Masa Depan
- **Integrasi SAP Langsung**: Sinkronisasi saldo gudang saat ini menggunakan input terverifikasi dan rekonsiliasi manual; integrasi langsung via RFC/REST BAPI SAP PLN direncanakan pada rilis V2.0.
- **Tanda Tangan Digital Bersertifikasi**: Cetak BAST saat ini menghasilkan format PDF resmi dengan stempel digital instansi; integrasi API BSrE / e-Sign Peruri direncanakan pada pengembangan lanjutan.

---

<div align="center">
  <b>PT PLN (Persero) UP3 Banten Selatan</b><br>
  <i>Dokumentasi Sistem PROMOTOR V1.0 · Hak Cipta Dilindungi Undang-Undang</i>
</div>
