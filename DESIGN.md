# DESIGN.md — SILOKA Universitas Siliwangi (UNSIL)

## 1. Identity & Purpose
- **Product**: SILOKA (Sistem Informasi Layanan Organisasi, Kearsipan, dan Administrasi) Universitas Siliwangi.
- **Audience**: Rektorat, Dekanat, Ketua/Sekretaris Jurusan, Kepala Lembaga (LPPM, LPMPP), Kepala UPA, Dosen, dan Tenaga Kependidikan UNSIL.
- **Core Character**: Berwibawa, tertib arsip negara (Peraturan Rektor UNSIL No. 1 Tahun 2024 & Perka ANRI), jelas, dan memudahkan pekerjaan administrasi harian tanpa membebani pengguna dengan istilah teknis mesin.

## 2. Visual & Layout Discipline (`antislop-ui`)
- **Primary Palette**:
  - Institutional Forest Green: `#064e3b` (`unsil-green-900`) & `#065f46` (`unsil-green-800`)
  - Siliwangi Gold Accent: `#d97706` (`unsil-gold-600`) & `#fbbf24` (`unsil-gold-400`)
  - Neutral Surface: `#f8fafc` (`slate-50`) background, `#ffffff` elevated cards, `#0f172a` (`slate-900`) primary text.
- **Typography**:
  - UI Interface: Plus Jakarta Sans / Inter (high legibility at 12px–16px).
  - Naskah Dinas Resmi (A4 Canvas): Times New Roman / Arial 11pt–12pt sesuai Tata Naskah Dinas UNSIL.
- **Print & A4 Guarantee**:
  - Surat 1 lembar wajib tercetak tepat 1 lembar A4 (`210mm x 297mm`) tanpa luber ke halaman ke-2 (`fitSheetsToSinglePagePrint`).

## 3. Copywriting & Microcopy Rules (`antislop-copywriting`)
1. **Hilangkan Bahasa Teknis & Backend di Layar Pengguna**:
   - Dilarang menampilkan nama tabel (`tbl_users`, `tm_user`, `tbl_riwayat_mutasi`), istilah relasi (`Foreign Key`, `Upsert`, `ACID Transaction`), atau alamat API (`GET /api/v1/...`).
2. **Gunakan Bahasa Indonesia Akademik yang Humanis & Aktif**:
   - Gunakan kalimat aktif yang memandu langkah pengguna (*"Pilihan jabatan akan muncul setelah Anda memilih Unit Kerja"*).
3. **Pesan Eror Berfokus Solusi**:
   - Semua notifikasi dan pesan kesalahan wajib melewati filter `sanitizeUiText()` dari `src/utils/antiSlopGuard.js` agar bebas dari kode error internal.
