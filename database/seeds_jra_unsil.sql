-- =============================================================================
-- SEED DATA RESMI SK REKTOR UNSIL NO. 2803
-- Pedoman Jadwal Retensi Arsip (JRA) & Pengendalian Naskah Dinas SILOKA
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. DATA SEED: HIERARKI KLASIFIKASI UTAMA (TIER 1)
-- -----------------------------------------------------------------------------
INSERT INTO tbl_master_klasifikasi_utama (kode_utama, nama_urusan, jenis_klasifikasi)
VALUES
    ('PP', 'PENDIDIKAN DAN PENGAJARAN', 'Substantif'),
    ('KU', 'KEUANGAN DAN PENGANGGARAN', 'Fasilitatif'),
    ('KP', 'KEPEGAWAIAN DAN SUMBER DAYA MANUSIA', 'Fasilitatif'),
    ('KR', 'KERUMAHTANGGAAN DAN SARANA PRASARANA', 'Fasilitatif'),
    ('HM', 'HUBUNGAN MASYARAKAT DAN PROTOKOLER', 'Fasilitatif')
ON CONFLICT (kode_utama) DO UPDATE 
SET nama_urusan = EXCLUDED.nama_urusan,
    jenis_klasifikasi = EXCLUDED.jenis_klasifikasi;


-- -----------------------------------------------------------------------------
-- 2. DATA SEED: HIERARKI SUB-KLASIFIKASI (TIER 2)
-- -----------------------------------------------------------------------------
INSERT INTO tbl_master_sub_klasifikasi (kode_sub, kode_utama, nama_sub_urusan)
VALUES
    ('PP.00', 'PP', 'Penerimaan Mahasiswa Baru'),
    ('PP.01', 'PP', 'Kurikulum, Pembelajaran, dan Evaluasi Akademik'),
    ('PP.02', 'PP', 'Kelulusan, Ijazah, dan Wisuda Sarjana/Magister'),
    ('KU.00', 'KU', 'Perencanaan dan Alokasi Anggaran (RBA & DIPA)'),
    ('KU.01', 'KU', 'Pelaksanaan Anggaran, Perbendaharaan, dan SPM'),
    ('KU.02', 'KU', 'Pertanggungjawaban Keuangan dan Laporan Keuangan Audited'),
    ('KP.01', 'KP', 'Formasi, Pengadaan, dan Seleksi Pegawai'),
    ('KP.02', 'KP', 'Mutasi, Kenaikan Pangkat, dan Jabatan Fungsional'),
    ('KR.07', 'KR', 'Pemanfaatan Sarana Prasarana dan Kendaraan Dinas'),
    ('HM.01', 'HM', 'Keprotokolan, Acara Resmi Pimpinan, dan Kehumasan')
ON CONFLICT (kode_sub) DO UPDATE 
SET kode_utama = EXCLUDED.kode_utama,
    nama_sub_urusan = EXCLUDED.nama_sub_urusan;


-- -----------------------------------------------------------------------------
-- 3. DATA SEED: MATRIKS ATURAN JRA RESMI (TIER 3)
-- -----------------------------------------------------------------------------
INSERT INTO tbl_master_jra (
    kode_jra, kode_sub, series_arsip, 
    retensi_aktif_tahun, retensi_inaktif_tahun, 
    keterangan_akhir, klasifikasi_keamanan, unit_pengolah_default
)
VALUES
    -- Urusan Pendidikan & Kemahasiswaan (Substantif - BAKPK & Fakultas)
    ('PP.00.01', 'PP.00', 'Sosialisasi dan Promosi Penerimaan Mahasiswa Baru', 1, 2, 'Musnah', 'Biasa/Terbuka', 'BAKPK'),
    ('PP.00.02', 'PP.00', 'Berkas Pendaftaran dan Seleksi Administrasi Mahasiswa Baru', 2, 3, 'Musnah', 'Terbatas', 'BAKPK'),
    ('PP.00.03', 'PP.00', 'Surat Keputusan Kelulusan dan Buku Registrasi Induk Mahasiswa', 5, 10, 'Permanen', 'Biasa/Terbuka', 'BAKPK'),
    ('PP.01.01', 'PP.01', 'Rencana Pembelajaran Semester (RPS), Silabus, dan Panduan Akademik', 5, 5, 'Permanen', 'Biasa/Terbuka', 'FAKULTAS'),
    ('PP.01.02', 'PP.01', 'Jadwal Perkuliahan Semester, Presensi Kuliah, dan Jadwal Ujian', 1, 2, 'Musnah', 'Biasa/Terbuka', 'FAKULTAS'),
    ('PP.02.01', 'PP.02', 'Buku Induk Lulusan, Transkrip Akademik, dan Penomoran Ijazah Nasional', 5, 25, 'Permanen', 'Terbatas', 'BAKPK'),

    -- Urusan Keuangan & Anggaran (Fasilitatif - BKU)
    ('KU.00.01', 'KU.00', 'Rencana Bisnis dan Anggaran (RBA) dan Petunjuk Operasional Kegiatan', 3, 7, 'Permanen', 'Biasa/Terbuka', 'BKU'),
    ('KU.01.01', 'KU.01', 'Surat Perintah Membayar (SPM) dan SP2D Belanja Pegawai/Barang', 2, 8, 'Musnah', 'Terbatas', 'BKU'),
    ('KU.01.04', 'KU.01', 'Surat Pertanggungjawaban (SPJ) Realisasi Anggaran BOPTN / DIPA', 5, 5, 'Musnah', 'Terbatas', 'BKU'),
    ('KU.02.01', 'KU.02', 'Laporan Keuangan Tahunan Universitas Siliwangi (Audited BPK/KAP)', 5, 10, 'Permanen', 'Biasa/Terbuka', 'BKU'),

    -- Urusan Kepegawaian & SDM (Fasilitatif - BKU)
    ('KP.01.02', 'KP.01', 'Berkas Penetapan NIP, Pengangkatan CPNS, PPPK, dan Dosen Tetap', 2, 5, 'Dinilai Kembali', 'Rahasia', 'BKU'),
    ('KP.02.01', 'KP.02', 'Berkas Kenaikan Pangkat dan Jabatan Fungsional Dosen (Asisten Ahli s.d. Guru Besar)', 2, 8, 'Permanen', 'Terbatas', 'BKU'),

    -- Urusan Kerumahtanggaan & Humas (Fasilitatif - BKU)
    ('KR.07.01', 'KR.07', 'Surat Izin Peminjaman Gedung Auditorium dan Kendaraan Operasional Kampus', 1, 1, 'Musnah', 'Biasa/Terbuka', 'BKU'),
    ('HM.01.01', 'HM.01', 'Notula Rapat Koordinasi Pimpinan, Rundown Acara Dies Natalis, dan Siaran Pers', 2, 3, 'Musnah', 'Biasa/Terbuka', 'BKU')
ON CONFLICT (kode_jra) DO UPDATE 
SET series_arsip = EXCLUDED.series_arsip,
    retensi_aktif_tahun = EXCLUDED.retensi_aktif_tahun,
    retensi_inaktif_tahun = EXCLUDED.retensi_inaktif_tahun,
    keterangan_akhir = EXCLUDED.keterangan_akhir,
    klasifikasi_keamanan = EXCLUDED.klasifikasi_keamanan,
    unit_pengolah_default = EXCLUDED.unit_pengolah_default;


-- -----------------------------------------------------------------------------
-- 4. DATA SEED TRANSAKSIONAL: CONTOH PENGENDALIAN SURAT ("tbl_surat")
-- -----------------------------------------------------------------------------
-- Menyajikan variasi naskah dinas dengan skenario:
-- 1. Surat Aktif Normal (Masa retensi masih panjang)
-- 2. Surat Peringatan Kritis / Expiring Soon (Masa aktif habis dalam hitungan hari)
-- 3. Surat Kedaluwarsa Retensi Aktif (Siap dialihkan ke Unit Kearsipan / Record Center)
-- -----------------------------------------------------------------------------
INSERT INTO tbl_surat (
    nomor_surat, tanggal_surat, perihal, jenis_surat, kode_jra, status_progres, file_path
)
VALUES
    -- [KASUS 1: AKTIF NORMAL] Diterbitkan Sep 2026, Retensi Aktif 5 Tahun -> Berakhir 2031
    (
        '0842/UN58.13/PP.01.01/2026', 
        '2026-09-15', 
        'Pemberlakuan Kurikulum Outcome-Based Education (OBE) Fakultas Teknik TA 2026/2027', 
        'Surat Keluar', 
        'PP.01.01', 
        'Disetujui', 
        '/storage/surat/2026/09/FT-OBE-2026.pdf'
    ),

    -- [KASUS 2: AKTIF NORMAL] Diterbitkan Sep 2026, Retensi Aktif 5 Tahun -> Berakhir 2031
    (
        'B/1420/UN58/KU.01.04/2026', 
        '2026-09-17', 
        'Alokasi Tambahan BOPTN Penelitian dan Pengabdian Kepada Masyarakat TA 2026', 
        'Surat Masuk', 
        'KU.01.04', 
        'Diparaf', 
        '/storage/surat/2026/09/BOPTN-2026.pdf'
    ),

    -- [KASUS 3: PERINGATAN KRITIS / EXPIRING SOON] Diterbitkan 10 Oktober 2025, Retensi Aktif 1 Tahun
    -- Batas akhir aktif: 10 Oktober 2026 (Tersisa ~18 hari dari tanggal simulasi 22 Sep 2026)
    (
        '0412/UN58/PP.01.02/2025', 
        '2025-10-10', 
        'Jadwal Perkuliahan dan Evaluasi Tengah Semester Ganjil TA 2025/2026', 
        'Surat Keluar', 
        'PP.01.02', 
        'Diarsipkan', 
        '/storage/surat/2025/10/Jadwal-UTS-2025.pdf'
    ),

    -- [KASUS 4: TELAH KEDALUWARSA RETENSI AKTIF / EXPIRED] Diterbitkan 1 Agustus 2025, Retensi Aktif 1 Tahun
    -- Batas akhir aktif: 1 Agustus 2026 (Telah melewati batas ~52 hari yang lalu -> Wajib Pindah ke Record Center)
    (
        '0189/UN58.2/KR.07.01/2025', 
        '2025-08-01', 
        'Izin Penggunaan Gedung Mandala untuk Kegiatan Gladi Bersih Wisuda Gelombang II', 
        'Surat Tugas', 
        'KR.07.01', 
        'Diarsipkan', 
        '/storage/surat/2025/08/Izin-Mandala-2025.pdf'
    ),

    -- [KASUS 5: TELAH MELEWATI RETENSI TOTAL] Diterbitkan 10 Maret 2021, Retensi Aktif 1 thn + Inaktif 2 thn = 3 thn
    -- Batas akhir total: 10 Maret 2024 (Status: SIAP_TINDAK_LANJUT_AKHIR -> Musnah)
    (
        '0045/UN58.1/PP.00.01/2021', 
        '2021-03-10', 
        'Bahan Sosialisasi Promosi Masuk Kampus UNSIL Jalur Mandiri Tahun 2021', 
        'Surat Keluar', 
        'PP.00.01', 
        'Diarsipkan', 
        '/storage/surat/2021/03/Promosi-Mandiri-2021.pdf'
    )
ON CONFLICT (nomor_surat) DO NOTHING;

COMMIT;

