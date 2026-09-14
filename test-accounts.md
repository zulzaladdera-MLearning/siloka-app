# Daftar Akun Dummy Testing SILOKA
**Sistem Informasi Layanan Organisasi, Kearsipan, dan Administrasi Persuratan**  
**Universitas Siliwangi (UNSIL)**  

Dokumen ini berisi daftar lengkap kredensial akun dummy untuk pengujian fitur E-Disposisi, E-Paraf, TTE BSrE, dan Scoping Multi-Tenancy pada aplikasi SILOKA.

---

## Informasi Kredensial Umum
- **URL Login Demo:** `http://localhost:3000/` atau `http://localhost:3001/`
- **Domain Email:** `@unsil.ac.id`
- **Kata Sandi Standar (Testing):** `Siloka2026!`
- **Passphrase TTE BSrE (Khusus Pejabat):** `UNSIL-TTE-2026`
- **Catatan Otorisasi:**
  - Role **`PEJABAT`**: Berwenang menandatangani surat dinas via TTE BSrE dan menerbitkan lembar disposisi instruksi pimpinan.
  - Role **`OPERATOR_UNIT`**: Berwenang membuat konsep draf naskah dinas dan membubuhkan paraf verifikasi tata usaha.
  - Role **`PENGAWAS`**: Akses monitoring/read-only audit trail kearsipan & kepatuhan tata naskah.

---

## 1. Akun Unit Krusial (Pimpinan & Staf Operator)
Unit kerja dengan hierarki lengkap (Pejabat & Operator) untuk skenario pengajuan draf, paraf berjenjang, dan penerusan disposisi:

| No | Nama Lengkap & Gelar | Jabatan / Role | Email | Password | Kode Unit Kerja |
|:---|:---------------------|:---------------|:------|:---------|:---------------|
| 1 | **Prof. Dr. Eng. Ir. Aripin, IPU., ASEAN Eng.** | Rektor Universitas Siliwangi (PEJABAT) | `aripin.rektor@unsil.ac.id` | `Siloka2026!` | `UN58` |
| 2 | **Rahmat Hidayat, S.AP.** | Staf Tata Usaha & Protokoler Rektorat (OPERATOR_UNIT) | `tu.rektorat@unsil.ac.id` | `Siloka2026!` | `UN58` |
| 3 | **Drs. H. Ade Rustandi, M.Si.** | Kepala Biro BAKPK (PEJABAT) | `ade.bakpk@unsil.ac.id` | `Siloka2026!` | `UN58.5` |
| 4 | **Neni Triana, S.Sos.** | Staf Persuratan & Tata Usaha BAKPK (OPERATOR_UNIT) | `operator.bakpk@unsil.ac.id` | `Siloka2026!` | `UN58.5` |
| 5 | **Dr. Nana Sujana, Drs., M.Si.** | Kepala Biro Keuangan dan Umum (PEJABAT) | `nana.sujana@unsil.ac.id` | `Siloka2026!` | `UN58.6` |
| 6 | **Siti Rohmah, S.AP.** | Staf Persuratan & Kearsipan BKU (OPERATOR_UNIT) | `siti.rohmah@unsil.ac.id` | `Siloka2026!` | `UN58.6` |
| 7 | **Dr. H. Cucu Suherman, M.Pd.** | Dekan Fakultas Keguruan dan Ilmu Pendidikan (PEJABAT) | `cucu.suherman@unsil.ac.id` | `Siloka2026!` | `UN58.10` |
| 8 | **Dian Fitriani, S.Pd.** | Operator Tata Usaha FKIP (OPERATOR_UNIT) | `dian.fkip@unsil.ac.id` | `Siloka2026!` | `UN58.10` |
| 9 | **Prof. Dr. H. Iis Rahmawati, S.E., M.Si.** | Dekan Fakultas Ekonomi dan Bisnis (PEJABAT) | `dekan.feb@unsil.ac.id` | `Siloka2026!` | `UN58.11` |
| 10 | **Asep Saepuloh, S.E.** | Operator Tata Usaha FEB (OPERATOR_UNIT) | `operator.feb@unsil.ac.id` | `Siloka2026!` | `UN58.11` |
| 11 | **Dr. Gumilar Mulya, M.Pd.** | Ketua LPPM Universitas Siliwangi (PEJABAT) | `ketua.lppm@unsil.ac.id` | `Siloka2026!` | `UN58.21` |
| 12 | **Rina Marlina, S.Si.** | Staf Administrasi Penelitian LPPM (OPERATOR_UNIT) | `operator.lppm@unsil.ac.id` | `Siloka2026!` | `UN58.21` |

---

## 2. Akun Unit Kerja Lainnya (Organ, Fakultas, Lembaga & UPA)
Berikut perwakilan akun pimpinan/pejabat dan operator untuk seluruh unit kerja lainnya di lingkungan UNSIL:

| No | Nama Lengkap & Gelar | Jabatan / Role | Email | Password | Kode Unit Kerja |
|:---|:---------------------|:---------------|:------|:---------|:---------------|
| 1 | **Prof. Dr. Dedi Kusmayadi, S.E., M.Si., Ak., CA.** | Ketua Senat Universitas Siliwangi (PEJABAT) | `ketua.senat@unsil.ac.id` | `Siloka2026!` | `UN58.SENAT` |
| 2 | **Dewi Sartika, S.Sos.** | Staf Sekretariat Senat (OPERATOR_UNIT) | `sekretariat.senat@unsil.ac.id` | `Siloka2026!` | `UN58.SENAT` |
| 3 | **Hendra Pratama, S.E., Ak., C.A.** | Ketua Satuan Pengawas Internal (SPI) (PENGAWAS) | `hendra.spi@unsil.ac.id` | `Siloka2026!` | `UN58.SPI` |
| 4 | **Mochamad Iqbal, S.Ak.** | Staf Administrasi & Audit SPI (OPERATOR_UNIT) | `operator.spi@unsil.ac.id` | `Siloka2026!` | `UN58.SPI` |
| 5 | **Drs. H. Syarif Hidayat, M.Si.** | Ketua Dewan Penyantun (PEJABAT) | `ketua.dp@unsil.ac.id` | `Siloka2026!` | `UN58.DP` |
| 6 | **Lilis Suryani, S.AP.** | Staf Sekretariat Dewan Penyantun (OPERATOR_UNIT) | `sekretariat.dp@unsil.ac.id` | `Siloka2026!` | `UN58.DP` |
| 7 | **Dr. Rudi Priyadi, Ir., M.P.** | Dekan Fakultas Pertanian (PEJABAT) | `dekan.fp@unsil.ac.id` | `Siloka2026!` | `UN58.12` |
| 8 | **Enok Widaningsih, S.P.** | Operator Tata Usaha FP (OPERATOR_UNIT) | `operator.fp@unsil.ac.id` | `Siloka2026!` | `UN58.12` |
| 9 | **Dr. Nurul Hiron, S.T., M.Eng.** | Dekan Fakultas Teknik (PEJABAT) | `dekan.ft@unsil.ac.id` | `Siloka2026!` | `UN58.13` |
| 10 | **Arif Hidayat, S.T.** | Operator Tata Usaha Fakultas Teknik (OPERATOR_UNIT) | `arif.ft@unsil.ac.id` | `Siloka2026!` | `UN58.13` |
| 11 | **Dr. H. Akhmad Satori, Drs., M.Si.** | Dekan Fakultas Ilmu Sosial dan Ilmu Politik (PEJABAT) | `dekan.fisip@unsil.ac.id` | `Siloka2026!` | `UN58.14` |
| 12 | **Yanti Maryanti, S.IP.** | Operator Tata Usaha FISIP (OPERATOR_UNIT) | `operator.fisip@unsil.ac.id` | `Siloka2026!` | `UN58.14` |
| 13 | **Dr. Hj. Nina Herlina, Dra., M.Kes.** | Dekan Fakultas Ilmu Kesehatan (PEJABAT) | `dekan.fik@unsil.ac.id` | `Siloka2026!` | `UN58.15` |
| 14 | **Fajar Nugraha, S.KM.** | Operator Tata Usaha FIK (OPERATOR_UNIT) | `operator.fik@unsil.ac.id` | `Siloka2026!` | `UN58.15` |
| 15 | **Dr. H. Aam Abdussalam, M.Ag.** | Dekan Fakultas Agama Islam (PEJABAT) | `dekan.fai@unsil.ac.id` | `Siloka2026!` | `UN58.16` |
| 16 | **Imas Masitoh, S.Ag.** | Operator Tata Usaha FAI (OPERATOR_UNIT) | `operator.fai@unsil.ac.id` | `Siloka2026!` | `UN58.16` |
| 17 | **Prof. Dr. H. Deden Mulyana, S.E., M.Si.** | Direktur Program Pascasarjana (PEJABAT) | `direktur.pasca@unsil.ac.id` | `Siloka2026!` | `UN58.17` |
| 18 | **Gilar Gandana, S.Pd., M.Pd.** | Operator Tata Usaha Pascasarjana (OPERATOR_UNIT) | `operator.pasca@unsil.ac.id` | `Siloka2026!` | `UN58.17` |
| 19 | **Dr. H. Supratman, Drs., M.Pd.** | Ketua LPMPP Universitas Siliwangi (PEJABAT) | `ketua.lpmpp@unsil.ac.id` | `Siloka2026!` | `UN58.22` |
| 20 | **Cecep Supriadi, S.Pd.** | Staf Administrasi Mutu LPMPP (OPERATOR_UNIT) | `operator.lpmpp@unsil.ac.id` | `Siloka2026!` | `UN58.22` |
| 21 | **Dra. Hj. Lilis Rohaeti, M.Si.** | Kepala UPA Perpustakaan (PEJABAT) | `kepala.perpus@unsil.ac.id` | `Siloka2026!` | `UN58.31` |
| 22 | **Agus Salim, S.Sos.** | Operator Pengelola Perpustakaan (OPERATOR_UNIT) | `operator.perpus@unsil.ac.id` | `Siloka2026!` | `UN58.31` |
| 23 | **Alam Rahmatulloh, S.T., M.T.** | Kepala UPA TIK (PEJABAT) | `kepala.tik@unsil.ac.id` | `Siloka2026!` | `UN58.32` |
| 24 | **Gilang Ramadhan, S.Kom.** | Staf Admin Jaringan & Server TIK (OPERATOR_UNIT) | `operator.tik@unsil.ac.id` | `Siloka2026!` | `UN58.32` |
| 25 | **Dr. Soni Tantan Tandiana, S.Pd., M.Pd.** | Kepala UPA Bahasa (PEJABAT) | `kepala.bahasa@unsil.ac.id` | `Siloka2026!` | `UN58.33` |
| 26 | **Eka Nur Fitriani, S.Pd.** | Operator Layanan Bahasa (OPERATOR_UNIT) | `operator.bahasa@unsil.ac.id` | `Siloka2026!` | `UN58.33` |
| 27 | **Dr. Dian Kurniawan, S.E., M.Si.** | Kepala UPA PKKM (PEJABAT) | `kepala.pkkm@unsil.ac.id` | `Siloka2026!` | `UN58.34` |
| 28 | **Rizki Fauzi, S.M.** | Operator Layanan Karier & Alumni PKKM (OPERATOR_UNIT) | `operator.pkkm@unsil.ac.id` | `Siloka2026!` | `UN58.34` |
| 29 | **Dr. Ir. H. Ade Ismail, M.P.** | Kepala UPA Layanan Uji Kompetensi (PEJABAT) | `kepala.luk@unsil.ac.id` | `Siloka2026!` | `UN58.35` |
| 30 | **Wawan Setiawan, S.T.** | Operator Sertifikasi & Uji Kompetensi LUK (OPERATOR_UNIT) | `operator.luk@unsil.ac.id` | `Siloka2026!` | `UN58.35` |

---

## 3. Matriks 21 Master Unit Kerja UNSIL
Daftar kode resmi unit kerja berdasarkan Permendikbudristek No. 19/2023 yang digunakan dalam penomoran surat dinas:

| No | Kode Unit | Singkatan | Nama Resmi Unit Kerja | Tipe Unit |
|:---|:----------|:----------|:----------------------|:----------|
| 1 | `UN58` | **UNSIL** | Universitas Siliwangi (Rektorat) | UNIVERSITAS |
| 2 | `UN58.SENAT` | **SENAT** | Senat Universitas Siliwangi | ORGAN |
| 3 | `UN58.SPI` | **SPI** | Satuan Pengawas Internal | ORGAN |
| 4 | `UN58.DP` | **DP** | Dewan Penyantun | ORGAN |
| 5 | `UN58.5` | **BAKPK** | Biro Akademik, Kemahasiswaan, Perencanaan, dan Kerja Sama | BIRO |
| 6 | `UN58.6` | **BKU** | Biro Keuangan dan Umum | BIRO |
| 7 | `UN58.10` | **FKIP** | Fakultas Keguruan dan Ilmu Pendidikan | FAKULTAS |
| 8 | `UN58.11` | **FEB** | Fakultas Ekonomi dan Bisnis | FAKULTAS |
| 9 | `UN58.12` | **FP** | Fakultas Pertanian | FAKULTAS |
| 10 | `UN58.13` | **FT** | Fakultas Teknik | FAKULTAS |
| 11 | `UN58.14` | **FISIP** | Fakultas Ilmu Sosial dan Ilmu Politik | FAKULTAS |
| 12 | `UN58.15` | **FIK** | Fakultas Ilmu Kesehatan | FAKULTAS |
| 13 | `UN58.16` | **FAI** | Fakultas Agama Islam | FAKULTAS |
| 14 | `UN58.17` | **PASCA** | Program Pascasarjana | FAKULTAS |
| 15 | `UN58.21` | **LPPM** | Lembaga Penelitian dan Pengabdian kepada Masyarakat | LEMBAGA |
| 16 | `UN58.22` | **LPMPP** | Lembaga Penjaminan Mutu dan Pengembangan Pembelajaran | LEMBAGA |
| 17 | `UN58.31` | **UPA PERPUS** | Unit Penunjang Akademik Perpustakaan | UPA |
| 18 | `UN58.32` | **UPA TIK** | Unit Penunjang Akademik Teknologi Informasi dan Komunikasi | UPA |
| 19 | `UN58.33` | **UPA BAHASA** | Unit Penunjang Akademik Bahasa | UPA |
| 20 | `UN58.34` | **UPA PKKM** | Unit Penunjang Akademik Pengembangan Karier dan Kewirausahaan Mahasiswa | UPA |
| 21 | `UN58.35` | **UPA LUK** | Unit Penunjang Akademik Layanan Uji Kompetensi | UPA |

---

## 4. Panduan Skenario Pengujian Alur Surat

### Skenario A: Pembuatan Draf & Paraf Berjenjang (Contoh: FKIP $\rightarrow$ Rektorat)
1. **Login** menggunakan akun Staf TU FKIP (`tu.fkip@unsil.ac.id` / `Siloka2026!`).
2. Masuk ke modul **Buat Naskah Dinas**, pilih template (misal: *Surat Dinas*), isi perihal dan tujuan, simpan draf.
3. Bubuhkan paraf staf TU pada lembar riwayat paraf.
4. **Logout**, lalu **Login** menggunakan Dekan FKIP (`dekan.fkip@unsil.ac.id` / `Siloka2026!`).
5. Buka surat yang diparaf, lakukan verifikasi akhir dan setujui untuk diteruskan ke Biro BKU / Rektorat.

### Skenario B: Pengesahan TTE BSrE (Contoh: Biro Keuangan dan Umum)
1. **Login** menggunakan Kepala Biro Keuangan dan Umum (`nana.sujana@unsil.ac.id` / `Siloka2026!`).
2. Buka naskah berstatus *"Diparaf"* pada menu **Paraf & TTE**.
3. Klik tombol **Tandatangani Surat (TTE)**.
4. Masukkan Passphrase TTE: `UNSIL-TTE-2026`.
5. Dokumen sah diterbitkan dengan barcode QR-Code TTE tersertifikasi BSrE dan nomor surat otomatis `.../UN58.6/...`.

### Skenario C: Penerusan Disposisi Berjenjang (Contoh: BKU $\rightarrow$ UPA TIK)
1. Pada menu **E-Disposisi**, klik **+ Buat Disposisi Baru**.
2. Pilih surat target dan pilih penerima: **UPA TIK - Kepala Unit Penunjang Akademik TIK** (`hendra.tik@unsil.ac.id`).
3. Pilih sifat instruksi (*Segera*) dan instruksi tindak lanjut, lalu klik **Kirim Lembar Disposisi**.
4. **Logout** dan **Login** sebagai Kepala UPA TIK (`hendra.tik@unsil.ac.id` / `Siloka2026!`).
5. Periksa kartu disposisi yang masuk pada dashboard UPA TIK.
