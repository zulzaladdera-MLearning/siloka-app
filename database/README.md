# Dokumentasi Basis Data PostgreSQL - SILOKA UNSIL

Basis data aplikasi **SILOKA (Sistem Informasi Layanan Organisasi, Kearsipan, dan Administrasi)** menggunakan sistem manajemen basis data relasional **PostgreSQL (versi 15 atau yang lebih baru)** dengan standar tata naskah dinas elektronik BSrE BSSN dan Kaidah Kearsipan ANRI.

---

## 1. Struktur Berkas SQL

| Berkas / Direktori | Deskripsi |
| :--- | :--- |
| [`schema.sql`](./schema.sql) | Definisi skema DDL lengkap: ekstensi pgcrypto/uuid, custom ENUM types (`role_user_enum` memuat `'DOSEN'`, `'SUPER_ADMIN'`), tabel relasional kanonik, foreign keys, trigger otomatisasi timestamp, view kompatibilitas, dan event log process mining IEEE XES. |
| [`seeds.sql`](./seeds.sql) | Data awal resmi: 21 satuan kerja UNSIL, hierarki master klasifikasi arsip 3 tingkat (Pokok, Sub, Sub-sub), master user terpadu, 26 pejabat penandatangan dengan validasi entitas, jadwal retensi arsip (JRA) terkait klasifikasi, dan naskah dinas awal. |
| [`schema_jra_unsil.sql`](./schema_jra_unsil.sql) | **Skema Normalisasi JRA 3-Tingkat (SK Rektor No. 2803):** 5 native ENUM types, `tbl_master_klasifikasi_utama`, `tbl_master_sub_klasifikasi`, `tbl_master_jra`, tabel transaksional `tbl_surat`, views kalkulasi retensi otomatis (`v_surat_retensi_lengkap`, `v_arsip_expiring_notifications`), dan fungsi agregasi ringkasan dashboard. |
| [`seeds_jra_unsil.sql`](./seeds_jra_unsil.sql) | Data seed resmi JRA UNSIL: Urusan Substantif/Fasilitatif, matriks retensi aktif/inaktif, nasib akhir berkas, dan rekaman uji transaksi naskah dinas aktif/expiring. |
| [`generate_nomor_surat_otomatis.sql`](./generate_nomor_surat_otomatis.sql) | **Sistem Penomoran Surat Otomatis UNSIL:** Tabel `tbl_counter_surat`, fungsi `generate_nomor_surat_otomatis` berpelindung *Row-Level Locking* (`SELECT ... FOR UPDATE`), zero-padding 4 digit, reset tahunan otomatis, dan trigger `trg_surat_nomor_otomatis` pada `tbl_surat`. |
| [`migrations/`](./migrations/) | Direktori skrip migrasi berjenjang untuk pembaruan skema database produksi: |
| ├── `001_unify_user_tables.sql` | Unifikasi 3 tabel user (`master_user`, `tm_user`, `users`) ke 1 tabel kanonik `master_user` dan pembuatan staging table `stg_user_simpeg`. |
| ├── `002_classification_hierarchy.sql` | Restrukturisasi pohon hierarki 3 level (`parent_id`, `level`) dan relasi JRA ke klasifikasi arsip. |
| └── `003_strengthen_pejabat.sql` | Penguatan `master_pejabat`: relasi FK ke `master_user`, masa jabatan, status Plt/Plh, penandatangan default, dan eliminasi kolom redundan. |

---

## 2. Cara Menyiapkan Database di PostgreSQL

### A. Instalasi Baru (Fresh Installation)

1. **Masuk ke terminal PostgreSQL:**
   ```bash
   psql -U postgres
   ```

2. **Buat Database SILOKA:**
   ```sql
   CREATE DATABASE siloka_db
       WITH 
       OWNER = postgres
       ENCODING = 'UTF8'
       LC_COLLATE = 'C'
       LC_CTYPE = 'C'
       TEMPLATE = template0;
   ```

3. **Jalankan Schema & Seeds:**
   ```bash
   # Dari direktori root siloka-app
   psql -U postgres -d siloka_db -f database/schema.sql
   psql -U postgres -d siloka_db -f database/seeds.sql
   ```

### B. Menjalankan Migrasi pada Database Eksisting

Jika Anda sudah memiliki database versi sebelumnya dan ingin memutakhirkan skema tanpa kehilangan data:

```bash
# Jalankan migrasi secara berurutan
psql -U postgres -d siloka_db -f database/migrations/001_unify_user_tables.sql
psql -U postgres -d siloka_db -f database/migrations/002_classification_hierarchy.sql
psql -U postgres -d siloka_db -f database/migrations/003_strengthen_pejabat.sql
```

---

## 3. Konfigurasi Variabel Lingkungan (`.env`)

```env
# PostgreSQL Database Connection
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=siloka_db
DB_USERNAME=postgres
DB_PASSWORD=your_secure_password
DATABASE_URL=postgresql://postgres:your_secure_password@127.0.0.1:5432/siloka_db?sslmode=disable
```

---

## 4. Arsitektur Tabel Relasional Terpadu

1. **`master_unit_kerja`**: 21 Satuan Kerja resmi UNSIL dengan struktur hierarki pohon (`parent_kode`) dari Rektorat (`UN58`) hingga Biro, Fakultas, Lembaga, dan UPA.
2. **`master_user`**: Tabel kanonik tunggal seluruh pengguna (Pejabat, Staf Persuratan, Operator Unit, SPI/Pengawas, Dosen, Super Admin). Memuat `username`, `nip_nik`, `email`, `role_level`, dan `role_label`.
3. **`stg_user_simpeg`**: Tabel *staging* khusus untuk proses *batch import* dari integrasi SIMPEG atau Excel sebelum disinkronkan ke tabel kanonik.
4. **`users` (View Kompatibilitas)**: SQL View cerdas yang membungkus `master_user` dengan derivasi dinamis `is_pejabat` dan pemetaan `jabatan` untuk menjamin kompatibilitas *legacy query*.
5. **`master_pejabat`**: Pejabat penandatangan berwenang yang terhubung ke `master_user(id)`, dilengkapi status Plt/Plh (`status_plt_plh`), masa jabatan (`tanggal_mulai`, `tanggal_selesai`), dan penanda pimpinan utama (`is_penandatangan_default`).
6. **`master_klasifikasi_arsip`**: Taksonomi kearsipan 3 tingkat (Level 1: Pokok, Level 2: Sub-Klasifikasi, Level 3: Sub-sub Klasifikasi) berbasis relasi `parent_id` mandiri (*self-referencing*).
7. **`jadwal_retensi_arsip` (JRA)**: Pengaturan retensi aktif dan inaktif yang kini terhubung langsung secara relasional via `klasifikasi_id` ke `master_klasifikasi_arsip`.
8. **`naskah_dinas`**: Dokumen kedinasan resmi dengan validasi TTE BSrE, foreign key klasifikasi terstandardisasi, dan *audit scoping* multi-tenancy.
9. **`disposisi`**: Pengendalian rantai instruksi pimpinan berbasis surat dinas.
10. **`riwayat_paraf_tte`**: Audit trail penelaahan dan paraf bertingkat sebelum penandatanganan TTE.
11. **`log_audit_keamanan`**: Jejak audit kepatuhan keamanan BSSN & SPI.
12. **`brankas_digital_vital`**: Enkripsi berkas vital kearsipan kampus (AES-256).
13. **`trx_process_log`**: Event log berbasis standar internasional IEEE XES untuk pemodelan data science dan *process mining* alur kerja naskah dinas.
