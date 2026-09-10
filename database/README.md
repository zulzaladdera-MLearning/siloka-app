# Dokumentasi Basis Data PostgreSQL - SILOKA UNSIL

Basis data aplikasi **SILOKA (Sistem Informasi Layanan Organisasi, Kearsipan, dan Administrasi)** menggunakan sistem manajemen basis data relasional **PostgreSQL (versi 15 atau yang lebih baru)** dengan standar tata naskah dinas elektronik dan enkripsi kearsipan nasional.

---

## 1. Struktur Berkas SQL

| Berkas | Deskripsi |
| :--- | :--- |
| [`schema.sql`](./schema.sql) | Berisi definisi skema DDL lengkap: ekstensi pgcrypto/uuid, custom ENUM types, tabel relasional, foreign keys, indeks B-tree, trigger otomatisasi timestamp, dan database views. |
| [`seeds.sql`](./seeds.sql) | Berisi data awal: 21 satuan kerja resmi UNSIL, kode klasifikasi kearsipan (KU/PL/KR/PP/KP/HM), master pengguna lintas unit, jadwal retensi arsip (JRA), dan sampel naskah dinas. |

---

## 2. Cara Menyiapkan Database di PostgreSQL

### A. Melalui Terminal / Command Line (`psql`)

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

### B. Melalui pgAdmin 4 / DBeaver

1. Buat database baru bernama `siloka_db`.
2. Buka **Query Tool**.
3. Buka dan eksekusi file `database/schema.sql`.
4. Buka dan eksekusi file `database/seeds.sql`.

---

## 3. Konfigurasi Variabel Lingkungan (`.env`)

Untuk menghubungkan backend ke database PostgreSQL ini, gunakan connection string berikut:

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

## 4. Rangkuman Tabel Relasional

1. **`master_unit_kerja`**: 21 Satuan Kerja resmi UNSIL (Rektorat, Senat, SPI, Dewan Penyantun, 2 Biro, 8 Fakultas/Pascasarjana, 2 Lembaga, 5 UPA).
2. **`master_user`**: Entitas akun terpadu dengan kolom `nip_nik`, `nama_lengkap`, `email`, `role`, dan relasi `unit_kerja_id`.
3. **`master_klasifikasi_arsip`**: Klasifikasi naskah kedinasan (`KU`, `PL`, `KR`, `PP`, `KP`, `HM`).
4. **`naskah_dinas`**: Dokumen surat masuk/keluar/nota dinas lengkap dengan rumus penomoran otomatis `[No]/[kode_unit]/[Klasifikasi]/[Tahun]`, metadata keamanan, dan TTE BSrE.
5. **`disposisi`**: Lembar instruksi digital pimpinan dengan tenggat waktu penyelesaian.
6. **`riwayat_paraf_tte`**: Jejak audit paraf berjenjang per tahap.
7. **`log_audit_keamanan`**: Log keamanan terenkripsi berstandar BSSN dan auditor SPI.
8. **`jadwal_retensi_arsip`**: Pengaturan umur arsip aktif, inaktif, dan penanda kunci *safeguard* untuk berkas permanen.
9. **`brankas_digital_vital`**: Penyimpanan metadata arsip vital dengan enkripsi AES-256 dan hash SHA-256.

