# PRODUCT REQUIREMENT DOCUMENT (PRD)
## Aplikasi SILOKA: Sistem Informasi Layanan Organisasi, Kearsipan, dan Administrasi
**Unit Pemilik: Biro Keuangan dan Umum, Universitas Siliwangi (UNSIL)**  
**Versi: 1.0 (Versi Website Internal / Intranet)**  
**Tanggal: 7 September 2026**  
**Status: Draf Pengembangan (Vibe Coding Ready - Staff & Pimpinan Only)**

---

## 1. Latar Belakang & Tujuan

Biro Keuangan dan Umum Universitas Siliwangi saat ini memerlukan digitalisasi proses persuratan, disposisi, dan kearsipan untuk mengurangi risiko dokumen terselip serta penumpukan berkas kedaluwarsa di ruang kerja.

Aplikasi **SILOKA** versi ini dirancang sebagai platform website internal (intranet) yang responsif. Aplikasi ini difokuskan penuh untuk staf administrasi dan pimpinan guna mempercepat alur kerja harian tanpa melibatkan akses dari pihak luar maupun mahasiswa.

---

## 2. Profil Pengguna & Hak Akses (Role-Based Access Control / RBAC)

Sistem ini menggunakan pembatasan hak akses yang ketat (tanpa ada hak akses untuk level publik/mahasiswa):

| Level Akses | Jabatan Riil di UNSIL | Fungsi & Hak Akses di Aplikasi | Persona Akun Demo |
| :--- | :--- | :--- | :--- |
| **Level 1: Pimpinan** | Rektor, Wakil Rektor (WR II), Dekan, Kepala Biro | Membaca dokumen, memberikan E-Disposisi, melakukan Tanda Tangan Elektronik (TTE), membuka berkas Sangat Rahasia (SR). | `ahmad.fauzi` (Dr. H. Ahmad Fauzi, M.Si. - Kepala Biro BPKU) |
| **Level 2: Pelaksana (Staf)** | Kabag Umum, Koordinator Keuangan, Staf Administrasi, Arsiparis | Menginput surat masuk/keluar, memproses draf surat, mengunggah PDF, memindahkan arsip, memantau antrean paraf. | `siti.rohmah` (Siti Rohmah, S.AP.) / `budi.santoso` (Budi Santoso, S.E., M.Ak.) |
| **Level 3: Pengawas** | Satuan Pengawas Internal (SPI), Auditor BPK | Akses *read-only* (hanya membaca) ke laporan keuangan, dokumen audit, SIMAK BMN, dan logistik untuk pemeriksaan kepatuhan. | `hendra.spi` (Hendra Pratama, S.E., Ak., C.A. - Auditor SPI) |

---

## 3. Ruang Lingkup Fitur (Functional Requirements)

### Modul 1: Pengendalian Surat Masuk & Keluar (Fokus: Kerja Staf)
* **Penomoran Otomatis**: Sistem menghasilkan nomor surat otomatis berdasarkan rumus baku dinas UNSIL:
  $$\text{[Nomor Urut] / UN58 / [Kode Unit] / [Kode Klasifikasi Arsip] / [Tahun]}$$
  *Contoh format valid*: `0142/UN58/BKU/KU.01.00/2026` atau `0289/UN58/TIK/KR.07.00/2026`.
* **Input Metadata Lengkap**: Form input wajib diisi oleh akun staf:
  1. *Asal Surat / Pengirim*
  2. *Tanggal Surat*
  3. *Nomor Surat Asal (dari pengirim)*
  4. *Hal / Perihal*
  5. *Kode Klasifikasi Arsip* (`KU`, `PL`, `KR`, `PP`)
  6. *Kategori Keamanan* (`Biasa/Terbuka`, `Terbatas`, `Rahasia`, `Sangat Rahasia`)
  7. *Tujuan Surat* (Default: Kepala Biro Keuangan dan Umum)
  8. *Ringkasan Pokok Isi Dokumen*
* **Unggah Dokumen PDF**: Fitur unggah pindaian dokumen resmi dalam format PDF dengan batasan maksimal **5MB** dan validasi hash SHA-256.

### Modul 2: E-Disposisi & Workflow Persetujuan (Fokus: Kerja Pimpinan & Staf)
* **Lembar Disposisi Digital**: Pimpinan dapat memilih templat instruksi digital (Disposisi) dan meneruskannya ke akun staf/pelaksana unit bawahan secara *real-time*:
  * *Pilihan Sifat Instruksi*: Sangat Segera (24 Jam), Segera (3 Hari), Biasa (7 Hari), Rahasia Internal.
  * *Petunjuk Tindakan Standar*: Tindak lanjuti, Pelajari / Telaah Staf, Hadiri / Wakilkan, Koordinasikan, Simpan / Arsipkan.
  * *Tenggat Waktu Penyelesaian (Due Date)*.
* **Alur Kerja Paraf Berjenjang (Audit Trail)**: Draf surat dari staf wajib masuk ke antrean persetujuan digital berjenjang sebelum sah ditandatangani oleh pimpinan. Setiap tindakan paraf dicatat kronologis dengan stempel waktu dan catatan telaah.
* **Validasi TTE & Otomatisasi Cap**: Jika opsi Tanda Tangan Elektronik (TTE) divalidasi/dibubuhkan oleh pimpinan (berbasis BSrE), sistem **otomatis menghapus visual cap dinas fisik** pada dokumen keluaran PDF sesuai standar tata naskah dinas elektronik nasional.

### Modul 3: Otomatisasi Jadwal Retensi Arsip (JRA) (Kode: KU / PL / KR / PP)
* **Hitung Umur Otomatis**: Sistem menghitung umur berkas dan memindahkan folder arsip dari kategori **"Aktif"** ke **"Inaktif"** secara otomatis berdasarkan tanggal pengesahan:
  1. **Kuitansi Belanja Operasional & Pajak (`KU.02.01`)**: 2 Tahun Aktif $\rightarrow$ Berpindah otomatis ke folder Inaktif selama 5 Tahun $\rightarrow$ Status Akhir: **Dimusnahkan**.
  2. **Bukti Pembayaran Kuliah UKT (`PP.02.00`)**: 2 Tahun Aktif $\rightarrow$ Berpindah otomatis ke folder Inaktif selama 3 Tahun $\rightarrow$ Status Akhir: **Dimusnahkan**.
* **Folder Kunci (Safeguard)**: Berkas dengan status akhir **"Permanen"** dikunci secara otomatis oleh sistem (*Safeguard Lock*) dan **tidak bisa dihapus oleh akun staf**:
  1. **Laporan Keuangan Tahunan Audited (`KU.02.01.h`)**: Status Akhir **Permanen** (Terkunci Safeguard).
  2. **Gambar As-Built Drawing & Instalasi Gedung (`KR.07.00`)**: Status Akhir **Permanen** (Terkunci Safeguard).
  3. **Sertifikat Kepemilikan Tanah & Aset BMN Mugarsari (`PL.02.04`)**: Status Akhir **Permanen** (Terkunci Safeguard).

### Modul 4: Keamanan Dokumen Internal
* **Role-Based Data Masking**: Dokumen berkode **Sangat Rahasia (SR)** dan **Rahasia (R)** dienkripsi di server. Konten rahasia disamarkan (*masked*) untuk akun staf pelaksana biasa dan **hanya bisa didekripsi/dibuka oleh akun Level 1 (Pimpinan) dan Level 3 (Pengawas SPI)**.
* **Log Aktivitas (Audit Trail)**: Sistem mencatat nama pengguna, peran, jenis tindakan (input, disposisi, paraf, unduh PDF), serta stempel waktu secara permanen untuk keperluan audit internal.

---

## 4. Kebutuhan Non-Fungsional (Non-Functional Requirements)

* **Aksesibilitas Multi-Device**: Berbasis Web Responsif. Staf bekerja dengan nyaman di PC/Laptop (tampilan tabel data lebar dan form multi-kolom), sedangkan Pimpinan dapat memeriksa draf, memberikan disposisi, dan membubuhkan TTE dengan cepat melalui browser HP (Safari iOS & Chrome Android).
* **Jaringan Intranet & Protokol**: Aplikasi wajib berjalan di jaringan Intranet lokal kampus UNSIL dengan protokol **HTTPS / TLS 1.3** demi mencegah kebocoran data keuangan dan naskah dinas keluar kampus.
* **Tech Stack Terintegrasi**:
  * **Frontend (Aplikasi Terpasang)**: React 18, Tailwind CSS, Lucide React Icons, Vite (berada pada direktori `Documents/siloka-app`).
  * **Basis Data Relasional Resmi**: **PostgreSQL 15+** dengan integritas kunci referensial (*foreign key*), ekstensi `pgcrypto` & `uuid-ossp`, serta skema relasional terstruktur (file: `database/schema.sql` & `database/seeds.sql`).

---

## 5. Arsitektur Data (Skema Database PostgreSQL 15+)

### 5.1. Tipe Data Enum & Master Unit Kerja (21 Satker Resmi)

```sql
-- Custom Enum Types di PostgreSQL
CREATE TYPE tipe_unit_enum AS ENUM ('UNIVERSITAS', 'ORGAN', 'BIRO', 'FAKULTAS', 'LEMBAGA', 'UPA');
CREATE TYPE role_user_enum AS ENUM ('PEJABAT', 'STAF_PERSURATAN', 'OPERATOR_UNIT', 'PENGAWAS');
CREATE TYPE kategori_keamanan_enum AS ENUM ('Biasa/Terbuka', 'Terbatas', 'Rahasia', 'Sangat Rahasia');
CREATE TYPE status_surat_enum AS ENUM ('Draft', 'Dikirim', 'Dibaca', 'Diparaf', 'Disetujui', 'Diarsipkan', 'Ditolak');

-- Tabel Master 21 Satuan Kerja Resmi UNSIL
CREATE TABLE master_unit_kerja (
    id SERIAL PRIMARY KEY,
    kode_unit VARCHAR(20) NOT NULL UNIQUE,       -- Digunakan pada rumus nomor surat (misal: 'UN58.10')
    nama_unit VARCHAR(150) NOT NULL,
    singkatan VARCHAR(30) NOT NULL,
    tipe_unit tipe_unit_enum NOT NULL,
    parent_kode VARCHAR(20) NULL REFERENCES master_unit_kerja (kode_unit),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Master User Terpadu (Multi-Tenancy)
CREATE TABLE master_user (
    id VARCHAR(50) PRIMARY KEY,                 -- ID akun (misal: 'usr-01')
    nip_nik VARCHAR(25) NOT NULL UNIQUE,
    nama_lengkap VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    unit_kerja_id VARCHAR(20) NOT NULL REFERENCES master_unit_kerja (kode_unit),
    role role_user_enum NOT NULL,
    role_level VARCHAR(50) NOT NULL,
    role_label VARCHAR(100) NOT NULL,
    avatar_url VARCHAR(255) NULL,
    is_signature_ready BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

### 5.2. Tabel Naskah Dinas, E-Disposisi & Riwayat Paraf

```sql
-- Tabel Naskah Dinas (Surat Masuk, Keluar, dan Nota Dinas)
CREATE TABLE naskah_dinas (
    id VARCHAR(50) PRIMARY KEY,
    nomor_surat VARCHAR(120) NOT NULL UNIQUE,    -- Rumus: [No]/[kode_unit]/[Klasifikasi]/[Tahun]
    nomor_surat_asal VARCHAR(120) DEFAULT '-',
    nomor_urut_seq VARCHAR(10) NOT NULL,
    tanggal DATE NOT NULL,
    perihal VARCHAR(255) NOT NULL,
    kategori VARCHAR(50) NOT NULL DEFAULT 'Surat Keluar',
    sifat VARCHAR(50) NOT NULL DEFAULT 'Biasa',
    kategori_keamanan kategori_keamanan_enum NOT NULL DEFAULT 'Biasa/Terbuka',
    kode_klasifikasi VARCHAR(10) NOT NULL,
    sub_klasifikasi VARCHAR(50) NOT NULL,
    asal_pengirim VARCHAR(150) NOT NULL,
    tujuan_penerima VARCHAR(150) NOT NULL,
    status status_surat_enum NOT NULL DEFAULT 'Dikirim',
    ringkasan TEXT NOT NULL,
    lampiran VARCHAR(255) DEFAULT '1 (satu) Berkas',
    tte_verified BOOLEAN DEFAULT FALSE,
    file_path VARCHAR(255) NULL,
    file_size_mb NUMERIC(6,2) DEFAULT 2.40,
    file_hash_sha256 VARCHAR(64) NULL,
    unit_kerja_id VARCHAR(20) NOT NULL REFERENCES master_unit_kerja (kode_unit),
    created_by_user_id VARCHAR(50) NOT NULL REFERENCES master_user (id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indeks Kinerja Query PostgreSQL
CREATE INDEX idx_naskah_unit ON naskah_dinas (unit_kerja_id);
CREATE INDEX idx_naskah_status ON naskah_dinas (status);
CREATE INDEX idx_naskah_tanggal ON naskah_dinas (tanggal);

-- Tabel Lembar E-Disposisi Pimpinan
CREATE TABLE disposisi (
    id VARCHAR(50) PRIMARY KEY,
    surat_id VARCHAR(50) NOT NULL REFERENCES naskah_dinas (id) ON DELETE CASCADE,
    nomor_agenda VARCHAR(50) NOT NULL UNIQUE,
    pemberi_user_id VARCHAR(50) NOT NULL REFERENCES master_user (id),
    pemberi_nama VARCHAR(150) NOT NULL,
    penerima_tujuan VARCHAR(150) NOT NULL,
    sifat_instruksi VARCHAR(50) NOT NULL DEFAULT 'Biasa',
    instruksi TEXT NOT NULL,
    catatan_khusus TEXT NULL,
    tanggal_disposisi DATE NOT NULL,
    batas_waktu DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Dalam Proses',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Jejak Audit & Riwayat Paraf Berjenjang
CREATE TABLE riwayat_paraf_tte (
    id SERIAL PRIMARY KEY,
    surat_id VARCHAR(50) NOT NULL REFERENCES naskah_dinas (id) ON DELETE CASCADE,
    user_id VARCHAR(50) NOT NULL REFERENCES master_user (id),
    tahap_ke INT NOT NULL DEFAULT 1,
    jenis_tindakan VARCHAR(50) NOT NULL DEFAULT 'Paraf',
    nama_petugas VARCHAR(150) NOT NULL,
    jabatan_petugas VARCHAR(100) NOT NULL,
    catatan_telaah TEXT NULL,
    stempel_waktu TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

---

## 6. Pemetaan Komponen Antarmuka (Mapping Kode `siloka-app` ke PRD)

Aplikasi frontend yang telah dibangun di `d:/Documents/siloka-app` telah mencakup seluruh kebutuhan fungsional di atas:

| Spesifikasi PRD | File Implementasi di `siloka-app` | Fitur yang Diterapkan |
| :--- | :--- | :--- |
| **Login Khusus Internal (Staff & Pimpinan)** | [`LoginPage.jsx`](file:///d:/Documents/siloka-app/src/components/auth/LoginPage.jsx) | Input `Username` dan sandi, validasi formulir, tombol demo 3 level (*Level 1: Pimpinan, Level 2: Pelaksana, Level 3: Pengawas*). |
| **Rumus Penomoran & Input Metadata** | [`CreateLetterModal.jsx`](file:///d:/Documents/siloka-app/src/components/dashboard/CreateLetterModal.jsx) | Generator rumus `[No]/UN58/[Unit]/[Klasifikasi]/[Tahun]`, klasifikasi `KU/PL/KR/PP`, keamanan, unggah PDF < 5MB. |
| **E-Disposisi Digital** | [`QuickDisposisiModal.jsx`](file:///d:/Documents/siloka-app/src/components/dashboard/QuickDisposisiModal.jsx) | Penomoran agenda, checklist tindakan disposisi, router satker, sifat instruksi, dan due date. |
| **Alur Paraf Berjenjang & TTE** | [`LetterDetailModal.jsx`](file:///d:/Documents/siloka-app/src/components/dashboard/LetterDetailModal.jsx) & [`ModuleViews.jsx`](file:///d:/Documents/siloka-app/src/components/dashboard/ModuleViews.jsx) | *Timeline* riwayat paraf kronologis, simulasi TTE BSrE, dan otomatisasi penghapusan cap dinas fisik pada dokumen sah. |
| **JRA Otomatis & Folder Kunci (Safeguard)** | [`ModuleViews.jsx`](file:///d:/Documents/siloka-app/src/components/dashboard/ModuleViews.jsx) | Matriks JRA `KU.02.01` (Kuitansi 2th $\rightarrow$ 5th $\rightarrow$ Musnah), `PP.02.00` (UKT 2th $\rightarrow$ 3th $\rightarrow$ Musnah), dan badge 🔒 *Safeguard Terkunci* untuk `KU.02.01.h` & `KR.07.00`. |
| **Role-Based Data Masking** | [`LetterDetailModal.jsx`](file:///d:/Documents/siloka-app/src/components/dashboard/LetterDetailModal.jsx) & [`ActivityTable.jsx`](file:///d:/Documents/siloka-app/src/components/dashboard/ActivityTable.jsx) | Peringatan enkripsi berkas Sangat Rahasia (SR) dan pembatasan akses hanya untuk Pimpinan & Pengawas. |
| **Responsive Web Layout** | [`MainLayout.jsx`](file:///d:/Documents/siloka-app/src/components/layout/MainLayout.jsx) & [`Sidebar.jsx`](file:///d:/Documents/siloka-app/src/components/layout/Sidebar.jsx) | Kompatibel penuh untuk PC/laptop staf dan mobile browser HP pimpinan (drawer sidebar otomatis). |

---

## 7. Kriteria Penerimaan (Acceptance Criteria)

* [x] **AC-01 (Akses Internal)**: Aplikasi hanya dapat diakses staf dan pimpinan dengan label input `Username`.
* [x] **AC-02 (Penomoran Rumus)**: Nomor surat tergenerasi mengikuti formula `[Nomor Urut]/UN58/[Kode Unit]/[Kode Klasifikasi]/[Tahun]`.
* [x] **AC-03 (E-Disposisi)**: Pimpinan dapat meneruskan disposisi digital berjenjang dengan checklist instruksi dan target batas waktu.
* [x] **AC-04 (Validasi TTE)**: Tersedia indikator TTE BSrE yang menghapus visualisasi cap fisik dinas pada berkas digital.
* [x] **AC-05 (Otomatisasi JRA)**: Tersedia pemetaan umur berkas aktif ke inaktif untuk `KU.02.01` dan `PP.02.00` (status akhir musnah).
* [x] **AC-06 (Folder Kunci Safeguard)**: Berkas permanen (`KU.02.01.h` dan `KR.07.00`) memiliki penanda kunci safeguard yang tidak dapat dihapus staf.
* [x] **AC-07 (Role Data Masking)**: Dokumen berstatus Sangat Rahasia diproteksi dan hanya dapat dibuka oleh level Pimpinan dan Pengawas SPI.
