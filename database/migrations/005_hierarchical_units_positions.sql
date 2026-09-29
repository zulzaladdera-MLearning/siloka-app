-- =============================================================================
-- MIGRATION 005: HIERARCHICAL UNITS & LEADERSHIP POSITIONS SOTK UNSIL
-- Berdasarkan Permendikbudristek No. 19/2023 & Peraturan Rektor No. 3/2023
-- Sesuai Dokumen Resmi "Program Studi di Unsil.pdf" (Ketua Jurusan & Sekretaris Jurusan)
-- =============================================================================

BEGIN;

-- 1. Tabel Master Unit Organisasi Hierarkis
CREATE TABLE IF NOT EXISTS tbl_units (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(30) NOT NULL CHECK (category IN (
        'UNIVERSITAS', 'FAKULTAS', 'JURUSAN', 'PROGRAM_STUDI', 
        'PASCASARJANA', 'LEMBAGA', 'BIRO', 'UPA', 'LABORATORIUM'
    )),
    parent_unit_id VARCHAR(50) REFERENCES tbl_units(id) ON DELETE CASCADE
);

-- 2. Penambahan Kolom Hierarki pada tbl_positions
ALTER TABLE tbl_positions 
ADD COLUMN IF NOT EXISTS level VARCHAR(30) DEFAULT 'FAKULTAS',
ADD COLUMN IF NOT EXISTS can_sign_policy BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS can_sign_letter_types TEXT[] DEFAULT '{}';

-- 3. SEED UNIT ORGANISASI SESUAI DOKUMEN RESMI UNSIL & "Program Studi di Unsil.pdf"
INSERT INTO tbl_units (id, name, category, parent_unit_id) VALUES
-- Tingkat Universitas
('UNSIL', 'Universitas Siliwangi', 'UNIVERSITAS', NULL),
('UN58', 'Rektorat Universitas Siliwangi', 'UNIVERSITAS', 'UNSIL'),
('BKU', 'Biro Keuangan dan Umum', 'BIRO', 'UNSIL'),
('BAKPK', 'Biro Akademik, Kemahasiswaan, Perencanaan, dan Kerjasama', 'BIRO', 'UNSIL'),
('LPPM', 'Lembaga Penelitian dan Pengabdian kepada Masyarakat', 'LEMBAGA', 'UNSIL'),
('LP3M', 'Lembaga Pengembangan Pembelajaran & Penjaminan Mutu', 'LEMBAGA', 'UNSIL'),
('SPI', 'Satuan Pengawas Internal', 'LEMBAGA', 'UNSIL'),

-- 7 Fakultas & Pascasarjana
('FKIP', 'Fakultas Keguruan dan Ilmu Pendidikan', 'FAKULTAS', 'UNSIL'),
('FEB', 'Fakultas Ekonomi dan Bisnis', 'FAKULTAS', 'UNSIL'),
('FT', 'Fakultas Teknik', 'FAKULTAS', 'UNSIL'),
('FP', 'Fakultas Pertanian', 'FAKULTAS', 'UNSIL'),
('FAI', 'Fakultas Agama Islam', 'FAKULTAS', 'UNSIL'),
('FIK', 'Fakultas Ilmu Kesehatan', 'FAKULTAS', 'UNSIL'),
('FISIP', 'Fakultas Ilmu Sosial dan Ilmu Politik', 'FAKULTAS', 'UNSIL'),
('PASCA', 'Program Pascasarjana', 'FAKULTAS', 'UNSIL'),

-- Jurusan / Unit Akademik di Bawah Fakultas (Sesuai PDF "Program Studi di UNSIL")
-- FT (5 Jurusan)
('JUR_SIPIL_FT', 'Jurusan Teknik Sipil', 'JURUSAN', 'FT'),
('JUR_ELEKTRO_FT', 'Jurusan Teknik Elektro', 'JURUSAN', 'FT'),
('JUR_INFORMATIKA_FT', 'Jurusan Informatika', 'JURUSAN', 'FT'),
('JUR_SI_FT', 'Jurusan Sistem Informasi', 'JURUSAN', 'FT'),
('JUR_SAINSDATA_FT', 'Jurusan Sains Data', 'JURUSAN', 'FT'),

-- FEB (5 Jurusan)
('JUR_EKOPEM_FEB', 'Jurusan Ekonomi Pembangunan', 'JURUSAN', 'FEB'),
('JUR_MANAJEMEN_FEB', 'Jurusan Manajemen', 'JURUSAN', 'FEB'),
('JUR_AKUNTANSI_FEB', 'Jurusan Akuntansi', 'JURUSAN', 'FEB'),
('JUR_PERBANKAN_D3_FEB', 'Jurusan Perbankan dan Keuangan (D3)', 'JURUSAN', 'FEB'),
('JUR_PERBANKAN_D4_FEB', 'Jurusan Perbankan dan Keuangan Digital (D4)', 'JURUSAN', 'FEB'),

-- FP (3 Jurusan)
('JUR_AGROTEK_FP', 'Jurusan Agroteknologi', 'JURUSAN', 'FP'),
('JUR_AGRIBISNIS_FP', 'Jurusan Agribisnis', 'JURUSAN', 'FP'),
('JUR_TEKPANGAN_FP', 'Jurusan Teknologi Pangan dan Hasil Pertanian', 'JURUSAN', 'FP'),

-- FAI (2 Jurusan + Payung Syariah)
('JUR_EKSYAR_FAI', 'Jurusan Ekonomi Syariah', 'JURUSAN', 'FAI'),
('JUR_MMH_FAI', 'Jurusan Manajemen Mutu Halal', 'JURUSAN', 'FAI'),
('JUR_SYARIAH_FAI', 'Jurusan Studi Islam & Syariah', 'JURUSAN', 'FAI'),

-- FIK (2 Jurusan)
('JUR_KESMAS_FIK', 'Jurusan Kesehatan Masyarakat', 'JURUSAN', 'FIK'),
('JUR_GIZI_FIK', 'Jurusan Gizi', 'JURUSAN', 'FIK'),

-- FISIP (2 Jurusan)
('JUR_ILPOL_FISIP', 'Jurusan Ilmu Politik', 'JURUSAN', 'FISIP'),
('JUR_HUKUMBISNIS_FISIP', 'Jurusan Hukum Bisnis', 'JURUSAN', 'FISIP'),
('JUR_POLITIK_FISIP', 'Jurusan Ilmu Sosial & Politik', 'JURUSAN', 'FISIP'),

-- FKIP (13 Jurusan Sesuai PDF + 4 Payung)
('JUR_PENMAS_FKIP', 'Jurusan Pendidikan Masyarakat', 'JURUSAN', 'FKIP'),
('JUR_BINDO_FKIP', 'Jurusan Pendidikan Bahasa Indonesia', 'JURUSAN', 'FKIP'),
('JUR_BING_FKIP', 'Jurusan Pendidikan Bahasa Inggris', 'JURUSAN', 'FKIP'),
('JUR_MAT_FKIP', 'Jurusan Pendidikan Matematika', 'JURUSAN', 'FKIP'),
('JUR_BIO_FKIP', 'Jurusan Pendidikan Biologi', 'JURUSAN', 'FKIP'),
('JUR_EKO_FKIP', 'Jurusan Pendidikan Ekonomi', 'JURUSAN', 'FKIP'),
('JUR_GEO_FKIP', 'Jurusan Pendidikan Geografi', 'JURUSAN', 'FKIP'),
('JUR_PENJAS_FKIP', 'Jurusan Pendidikan Jasmani', 'JURUSAN', 'FKIP'),
('JUR_SEJ_FKIP', 'Jurusan Pendidikan Sejarah', 'JURUSAN', 'FKIP'),
('JUR_FIS_FKIP', 'Jurusan Pendidikan Fisika', 'JURUSAN', 'FKIP'),
('JUR_PPG_FKIP', 'Jurusan Pendidikan Profesi Guru', 'JURUSAN', 'FKIP'),
('JUR_PKO_FKIP', 'Jurusan Pendidikan Kepelatihan Olahraga', 'JURUSAN', 'FKIP'),
('JUR_SENI_FKIP', 'Jurusan Pendidikan Seni Pertunjukan', 'JURUSAN', 'FKIP'),
('JUR_PEND_MIPA', 'Jurusan Pendidikan MIPA', 'JURUSAN', 'FKIP'),
('JUR_PEND_BAHASA', 'Jurusan Pendidikan Bahasa', 'JURUSAN', 'FKIP'),
('JUR_PEND_IPS', 'Jurusan Pendidikan IPS', 'JURUSAN', 'FKIP'),
('JUR_PEND_OLAHRAGA', 'Jurusan Pendidikan Olahraga & Seni', 'JURUSAN', 'FKIP'),

-- Pascasarjana (10 Program)
('JUR_S2_GEO_PASCA', 'Program Studi Magister Pendidikan Geografi', 'JURUSAN', 'PASCA'),
('JUR_S2_AGRI_PASCA', 'Program Studi Magister Agribisnis', 'JURUSAN', 'PASCA'),
('JUR_S2_MAN_PASCA', 'Program Studi Magister Manajemen', 'JURUSAN', 'PASCA'),
('JUR_S2_MAT_PASCA', 'Program Studi Magister Pendidikan Matematika', 'JURUSAN', 'PASCA'),
('JUR_S2_AGRO_PASCA', 'Program Studi Magister Agroteknologi', 'JURUSAN', 'PASCA'),
('JUR_S2_IPA_PASCA', 'Program Studi Magister Pendidikan IPA', 'JURUSAN', 'PASCA'),
('JUR_S2_PENJAS_PASCA', 'Program Studi Magister Pendidikan Jasmani', 'JURUSAN', 'PASCA'),
('JUR_S3_MAN_PASCA', 'Program Studi Doktor Ilmu Manajemen', 'JURUSAN', 'PASCA'),
('JUR_S3_PERTANIAN_PASCA', 'Program Studi Doktor Ilmu Pertanian', 'JURUSAN', 'PASCA'),
('JUR_S3_PENDIDIKAN_PASCA', 'Program Studi Doktor Pendidikan', 'JURUSAN', 'PASCA'),

-- Entitas Program Studi
('PRODI_PENMAS', 'Pendidikan Masyarakat', 'PROGRAM_STUDI', 'FKIP'),
('PRODI_BINDO', 'Pendidikan Bahasa Indonesia', 'PROGRAM_STUDI', 'FKIP'),
('PRODI_BING', 'Pendidikan Bahasa Inggris', 'PROGRAM_STUDI', 'FKIP'),
('PRODI_MAT', 'Pendidikan Matematika', 'PROGRAM_STUDI', 'FKIP'),
('PRODI_BIO', 'Pendidikan Biologi', 'PROGRAM_STUDI', 'FKIP'),
('PRODI_EKO', 'Pendidikan Ekonomi', 'PROGRAM_STUDI', 'FKIP'),
('PRODI_GEO', 'Pendidikan Geografi', 'PROGRAM_STUDI', 'FKIP'),
('PRODI_PENJAS', 'Pendidikan Jasmani', 'PROGRAM_STUDI', 'FKIP'),
('PRODI_SEJ', 'Pendidikan Sejarah', 'PROGRAM_STUDI', 'FKIP'),
('PRODI_FIS', 'Pendidikan Fisika', 'PROGRAM_STUDI', 'FKIP'),
('PRODI_PPG', 'Pendidikan Profesi Guru', 'PROGRAM_STUDI', 'FKIP'),
('PRODI_PKO', 'Pendidikan Kepelatihan Olahraga', 'PROGRAM_STUDI', 'FKIP'),
('PRODI_SENI', 'Pendidikan Seni Pertunjukan', 'PROGRAM_STUDI', 'FKIP'),
('PRODI_EKOPEM', 'Ekonomi Pembangunan', 'PROGRAM_STUDI', 'FEB'),
('PRODI_MANAJEMEN', 'Manajemen', 'PROGRAM_STUDI', 'FEB'),
('PRODI_AKUNTANSI', 'Akuntansi', 'PROGRAM_STUDI', 'FEB'),
('PRODI_PERBANKAN_D3', 'Perbankan dan Keuangan (D3)', 'PROGRAM_STUDI', 'FEB'),
('PRODI_PERBANKAN_D4', 'Perbankan dan Keuangan Digital (D4)', 'PROGRAM_STUDI', 'FEB'),
('PRODI_SIPIL', 'Teknik Sipil', 'PROGRAM_STUDI', 'FT'),
('PRODI_ELEKTRO', 'Teknik Elektro', 'PROGRAM_STUDI', 'FT'),
('PRODI_IF', 'Informatika', 'PROGRAM_STUDI', 'FT'),
('PRODI_SI', 'Sistem Informasi', 'PROGRAM_STUDI', 'FT'),
('PRODI_SAINSDATA', 'Sains Data', 'PROGRAM_STUDI', 'FT'),
('PRODI_AGROTEK', 'Agroteknologi', 'PROGRAM_STUDI', 'FP'),
('PRODI_AGRIBISNIS', 'Agribisnis', 'PROGRAM_STUDI', 'FP'),
('PRODI_TEKPANGAN', 'Teknologi Pangan dan Hasil Pertanian', 'PROGRAM_STUDI', 'FP'),
('PRODI_EKSYAR', 'Ekonomi Syariah', 'PROGRAM_STUDI', 'FAI'),
('PRODI_MMH', 'Manajemen Mutu Halal', 'PROGRAM_STUDI', 'FAI'),
('PRODI_KESMAS', 'Kesehatan Masyarakat', 'PROGRAM_STUDI', 'FIK'),
('PRODI_GIZI', 'Gizi', 'PROGRAM_STUDI', 'FIK'),
('PRODI_ILPOL', 'Ilmu Politik', 'PROGRAM_STUDI', 'FISIP'),
('PRODI_HUKUMBISNIS', 'Hukum Bisnis', 'PROGRAM_STUDI', 'FISIP'),
('PRODI_S2_GEO', 'Magister Pendidikan Geografi', 'PROGRAM_STUDI', 'PASCA'),
('PRODI_S2_AGRI', 'Magister Agribisnis', 'PROGRAM_STUDI', 'PASCA'),
('PRODI_S2_MAN', 'Magister Manajemen', 'PROGRAM_STUDI', 'PASCA'),
('PRODI_S2_MAT', 'Magister Pendidikan Matematika', 'PROGRAM_STUDI', 'PASCA'),
('PRODI_S2_AGRO', 'Magister Agroteknologi', 'PROGRAM_STUDI', 'PASCA'),
('PRODI_S2_IPA', 'Magister Pendidikan IPA', 'PROGRAM_STUDI', 'PASCA'),
('PRODI_S2_PENJAS', 'Magister Pendidikan Jasmani', 'PROGRAM_STUDI', 'PASCA'),
('PRODI_S3_MAN', 'Doktor Ilmu Manajemen', 'PROGRAM_STUDI', 'PASCA'),
('PRODI_S3_PERTANIAN', 'Doktor Ilmu Pertanian', 'PROGRAM_STUDI', 'PASCA'),
('PRODI_S3_PENDIDIKAN', 'Doktor Pendidikan', 'PROGRAM_STUDI', 'PASCA')
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    parent_unit_id = EXCLUDED.parent_unit_id;

-- 4. Purge total posisi Koordinator Program Studi (Kaprodi)
DELETE FROM tbl_positions 
WHERE position_code LIKE 'KAPRODI_%';

-- 5. SEED FORMASI JABATAN STRUKTURAL KEPEMIMPINAN (OTK UNSIL)
INSERT INTO tbl_positions (position_code, name, unit_id, level, default_role_key, can_sign_policy) VALUES
-- Tingkat Universitas (Rektorat)
('REKTOR', 'Rektor Universitas Siliwangi', 'UNSIL', 'UNIVERSITAS', 'REKTOR', TRUE),
('WAREK_1', 'Wakil Rektor Bidang Akademik', 'UNSIL', 'UNIVERSITAS', 'WAKIL_REKTOR', TRUE),
('WAREK_2', 'Wakil Rektor Bidang Umum dan Keuangan', 'UNSIL', 'UNIVERSITAS', 'WAKIL_REKTOR', TRUE),
('WAREK_3', 'Wakil Rektor Bidang Kemahasiswaan dan Alumni', 'UNSIL', 'UNIVERSITAS', 'WAKIL_REKTOR', TRUE),
('WAREK_4', 'Wakil Rektor Bidang Perencanaan, Kerjasama dan Sistem Informasi', 'UNSIL', 'UNIVERSITAS', 'WAKIL_REKTOR', TRUE),

-- Pimpinan Fakultas & Pascasarjana
('DEKAN_FT', 'Dekan Fakultas Teknik', 'FT', 'FAKULTAS', 'DEKAN', TRUE),
('WADEK_FT_1', 'Wakil Dekan Bidang Akademik dan Kemahasiswaan FT', 'FT', 'FAKULTAS', 'WAKIL_DEKAN', FALSE),
('KASUBBAG_TU_FT', 'Kepala Subbagian Umum Fakultas Teknik', 'FT', 'FAKULTAS', 'KASUBBAG_TU', FALSE),

('DEKAN_FKIP', 'Dekan Fakultas Keguruan dan Ilmu Pendidikan', 'FKIP', 'FAKULTAS', 'DEKAN', TRUE),
('WADEK_FKIP_1', 'Wakil Dekan Bidang Akademik dan Kemahasiswaan FKIP', 'FKIP', 'FAKULTAS', 'WAKIL_DEKAN', FALSE),
('KASUBBAG_TU_FKIP', 'Kepala Subbagian Umum FKIP', 'FKIP', 'FAKULTAS', 'KASUBBAG_TU', FALSE),

('DEKAN_FEB', 'Dekan Fakultas Ekonomi dan Bisnis', 'FEB', 'FAKULTAS', 'DEKAN', TRUE),
('WADEK_FEB_1', 'Wakil Dekan Bidang Akademik dan Kemahasiswaan FEB', 'FEB', 'FAKULTAS', 'WAKIL_DEKAN', FALSE),
('KASUBBAG_TU_FEB', 'Kepala Subbagian Umum FEB', 'FEB', 'FAKULTAS', 'KASUBBAG_TU', FALSE),

('DEKAN_FP', 'Dekan Fakultas Pertanian', 'FP', 'FAKULTAS', 'DEKAN', TRUE),
('WADEK_FP_1', 'Wakil Dekan FP', 'FP', 'FAKULTAS', 'WAKIL_DEKAN', FALSE),
('KASUBBAG_TU_FP', 'Kepala Subbagian Umum FP', 'FP', 'FAKULTAS', 'KASUBBAG_TU', FALSE),

('DEKAN_FAI', 'Dekan Fakultas Agama Islam', 'FAI', 'FAKULTAS', 'DEKAN', TRUE),
('WADEK_FAI_1', 'Wakil Dekan FAI', 'FAI', 'FAKULTAS', 'WAKIL_DEKAN', FALSE),
('KASUBBAG_TU_FAI', 'Kepala Subbagian Umum FAI', 'FAI', 'FAKULTAS', 'KASUBBAG_TU', FALSE),

('DEKAN_FIK', 'Dekan Fakultas Ilmu Kesehatan', 'FIK', 'FAKULTAS', 'DEKAN', TRUE),
('WADEK_FIK_1', 'Wakil Dekan FIK', 'FIK', 'FAKULTAS', 'WAKIL_DEKAN', FALSE),
('KASUBBAG_TU_FIK', 'Kepala Subbagian Umum FIK', 'FIK', 'FAKULTAS', 'KASUBBAG_TU', FALSE),

('DEKAN_FISIP', 'Dekan Fakultas Ilmu Sosial dan Ilmu Politik', 'FISIP', 'FAKULTAS', 'DEKAN', TRUE),
('WADEK_FISIP_1', 'Wakil Dekan FISIP', 'FISIP', 'FAKULTAS', 'WAKIL_DEKAN', FALSE),
('KASUBBAG_TU_FISIP', 'Kepala Subbagian Umum FISIP', 'FISIP', 'FAKULTAS', 'KASUBBAG_TU', FALSE),

('DIREKTUR_PASCA', 'Direktur Program Pascasarjana', 'PASCA', 'FAKULTAS', 'DEKAN', TRUE),
('WADIR_PASCA', 'Wakil Direktur Program Pascasarjana', 'PASCA', 'FAKULTAS', 'WAKIL_DEKAN', FALSE),

-- =========================================================================
-- 1. FAKULTAS TEKNIK (FT) - Ketua Jurusan & Sekretaris Jurusan (5 Jurusan)
-- =========================================================================
('KAJUR_SIPIL_FT', 'Ketua Jurusan Teknik Sipil', 'JUR_SIPIL_FT', 'JURUSAN', 'KETUA_JURUSAN', FALSE),
('SEKJUR_SIPIL_FT', 'Sekretaris Jurusan Teknik Sipil', 'JUR_SIPIL_FT', 'JURUSAN', 'SEKRETARIS_JURUSAN', FALSE),
('KAJUR_ELEKTRO_FT', 'Ketua Jurusan Teknik Elektro', 'JUR_ELEKTRO_FT', 'JURUSAN', 'KETUA_JURUSAN', FALSE),
('SEKJUR_ELEKTRO_FT', 'Sekretaris Jurusan Teknik Elektro', 'JUR_ELEKTRO_FT', 'JURUSAN', 'SEKRETARIS_JURUSAN', FALSE),
('KAJUR_INFORMATIKA_FT', 'Ketua Jurusan Informatika', 'JUR_INFORMATIKA_FT', 'JURUSAN', 'KETUA_JURUSAN', FALSE),
('SEKJUR_INFORMATIKA_FT', 'Sekretaris Jurusan Informatika', 'JUR_INFORMATIKA_FT', 'JURUSAN', 'SEKRETARIS_JURUSAN', FALSE),
('KAJUR_SI_FT', 'Ketua Jurusan Sistem Informasi', 'JUR_SI_FT', 'JURUSAN', 'KETUA_JURUSAN', FALSE),
('SEKJUR_SI_FT', 'Sekretaris Jurusan Sistem Informasi', 'JUR_SI_FT', 'JURUSAN', 'SEKRETARIS_JURUSAN', FALSE),
('KAJUR_SAINSDATA_FT', 'Ketua Jurusan Sains Data', 'JUR_SAINSDATA_FT', 'JURUSAN', 'KETUA_JURUSAN', FALSE),
('SEKJUR_SAINSDATA_FT', 'Sekretaris Jurusan Sains Data', 'JUR_SAINSDATA_FT', 'JURUSAN', 'SEKRETARIS_JURUSAN', FALSE),

-- =========================================================================
-- 2. FAKULTAS EKONOMI DAN BISNIS (FEB) - Ketua & Sekretaris Jurusan (5 Jurusan)
-- =========================================================================
('KAJUR_EKOPEM_FEB', 'Ketua Jurusan Ekonomi Pembangunan', 'JUR_EKOPEM_FEB', 'JURUSAN', 'KETUA_JURUSAN', FALSE),
('SEKJUR_EKOPEM_FEB', 'Sekretaris Jurusan Ekonomi Pembangunan', 'JUR_EKOPEM_FEB', 'JURUSAN', 'SEKRETARIS_JURUSAN', FALSE),
('KAJUR_MANAJEMEN_FEB', 'Ketua Jurusan Manajemen', 'JUR_MANAJEMEN_FEB', 'JURUSAN', 'KETUA_JURUSAN', FALSE),
('SEKJUR_MANAJEMEN_FEB', 'Sekretaris Jurusan Manajemen', 'JUR_MANAJEMEN_FEB', 'JURUSAN', 'SEKRETARIS_JURUSAN', FALSE),
('KAJUR_AKUNTANSI_FEB', 'Ketua Jurusan Akuntansi', 'JUR_AKUNTANSI_FEB', 'JURUSAN', 'KETUA_JURUSAN', FALSE),
('SEKJUR_AKUNTANSI_FEB', 'Sekretaris Jurusan Akuntansi', 'JUR_AKUNTANSI_FEB', 'JURUSAN', 'SEKRETARIS_JURUSAN', FALSE),
('KAJUR_PERBANKAN_D3_FEB', 'Ketua Jurusan Perbankan dan Keuangan (D3)', 'JUR_PERBANKAN_D3_FEB', 'JURUSAN', 'KETUA_JURUSAN', FALSE),
('SEKJUR_PERBANKAN_D3_FEB', 'Sekretaris Jurusan Perbankan dan Keuangan (D3)', 'JUR_PERBANKAN_D3_FEB', 'JURUSAN', 'SEKRETARIS_JURUSAN', FALSE),
('KAJUR_PERBANKAN_D4_FEB', 'Ketua Jurusan Perbankan dan Keuangan Digital (D4)', 'JUR_PERBANKAN_D4_FEB', 'JURUSAN', 'KETUA_JURUSAN', FALSE),
('SEKJUR_PERBANKAN_D4_FEB', 'Sekretaris Jurusan Perbankan dan Keuangan Digital (D4)', 'JUR_PERBANKAN_D4_FEB', 'JURUSAN', 'SEKRETARIS_JURUSAN', FALSE),

-- =========================================================================
-- 3. FAKULTAS PERTANIAN (FP) - Ketua & Sekretaris Jurusan (3 Jurusan)
-- =========================================================================
('KAJUR_AGROTEK_FP', 'Ketua Jurusan Agroteknologi', 'JUR_AGROTEK_FP', 'JURUSAN', 'KETUA_JURUSAN', FALSE),
('SEKJUR_AGROTEK_FP', 'Sekretaris Jurusan Agroteknologi', 'JUR_AGROTEK_FP', 'JURUSAN', 'SEKRETARIS_JURUSAN', FALSE),
('KAJUR_AGRIBISNIS_FP', 'Ketua Jurusan Agribisnis', 'JUR_AGRIBISNIS_FP', 'JURUSAN', 'KETUA_JURUSAN', FALSE),
('SEKJUR_AGRIBISNIS_FP', 'Sekretaris Jurusan Agribisnis', 'JUR_AGRIBISNIS_FP', 'JURUSAN', 'SEKRETARIS_JURUSAN', FALSE),
('KAJUR_TEKPANGAN_FP', 'Ketua Jurusan Teknologi Pangan dan Hasil Pertanian', 'JUR_TEKPANGAN_FP', 'JURUSAN', 'KETUA_JURUSAN', FALSE),
('SEKJUR_TEKPANGAN_FP', 'Sekretaris Jurusan Teknologi Pangan dan Hasil Pertanian', 'JUR_TEKPANGAN_FP', 'JURUSAN', 'SEKRETARIS_JURUSAN', FALSE),

-- =========================================================================
-- 4. FAKULTAS AGAMA ISLAM (FAI) - Ketua & Sekretaris Jurusan (2 Jurusan)
-- =========================================================================
('KAJUR_EKSYAR_FAI', 'Ketua Jurusan Ekonomi Syariah', 'JUR_EKSYAR_FAI', 'JURUSAN', 'KETUA_JURUSAN', FALSE),
('SEKJUR_EKSYAR_FAI', 'Sekretaris Jurusan Ekonomi Syariah', 'JUR_EKSYAR_FAI', 'JURUSAN', 'SEKRETARIS_JURUSAN', FALSE),
('KAJUR_MMH_FAI', 'Ketua Jurusan Manajemen Mutu Halal', 'JUR_MMH_FAI', 'JURUSAN', 'KETUA_JURUSAN', FALSE),
('SEKJUR_MMH_FAI', 'Sekretaris Jurusan Manajemen Mutu Halal', 'JUR_MMH_FAI', 'JURUSAN', 'SEKRETARIS_JURUSAN', FALSE),
('KAJUR_SYARIAH_FAI', 'Ketua Jurusan Studi Islam & Syariah', 'JUR_SYARIAH_FAI', 'JURUSAN', 'KETUA_JURUSAN', FALSE),
('SEKJUR_SYARIAH_FAI', 'Sekretaris Jurusan Studi Islam & Syariah', 'JUR_SYARIAH_FAI', 'JURUSAN', 'SEKRETARIS_JURUSAN', FALSE),

-- =========================================================================
-- 5. FAKULTAS ILMU KESEHATAN (FIK) - Ketua & Sekretaris Jurusan (2 Jurusan)
-- =========================================================================
('KAJUR_KESMAS_FIK', 'Ketua Jurusan Kesehatan Masyarakat', 'JUR_KESMAS_FIK', 'JURUSAN', 'KETUA_JURUSAN', FALSE),
('SEKJUR_KESMAS_FIK', 'Sekretaris Jurusan Kesehatan Masyarakat', 'JUR_KESMAS_FIK', 'JURUSAN', 'SEKRETARIS_JURUSAN', FALSE),
('KAJUR_GIZI_FIK', 'Ketua Jurusan Gizi', 'JUR_GIZI_FIK', 'JURUSAN', 'KETUA_JURUSAN', FALSE),
('SEKJUR_GIZI_FIK', 'Sekretaris Jurusan Gizi', 'JUR_GIZI_FIK', 'JURUSAN', 'SEKRETARIS_JURUSAN', FALSE),

-- =========================================================================
-- 6. FAKULTAS ILMU SOSIAL DAN ILMU POLITIK (FISIP) - Ketua & Sekretaris Jurusan (2 Jurusan)
-- =========================================================================
('KAJUR_ILPOL_FISIP', 'Ketua Jurusan Ilmu Politik', 'JUR_ILPOL_FISIP', 'JURUSAN', 'KETUA_JURUSAN', FALSE),
('SEKJUR_ILPOL_FISIP', 'Sekretaris Jurusan Ilmu Politik', 'JUR_ILPOL_FISIP', 'JURUSAN', 'SEKRETARIS_JURUSAN', FALSE),
('KAJUR_HUKUMBISNIS_FISIP', 'Ketua Jurusan Hukum Bisnis', 'JUR_HUKUMBISNIS_FISIP', 'JURUSAN', 'KETUA_JURUSAN', FALSE),
('SEKJUR_HUKUMBISNIS_FISIP', 'Sekretaris Jurusan Hukum Bisnis', 'JUR_HUKUMBISNIS_FISIP', 'JURUSAN', 'SEKRETARIS_JURUSAN', FALSE),
('KAJUR_POLITIK_FISIP', 'Ketua Jurusan Ilmu Sosial & Politik', 'JUR_POLITIK_FISIP', 'JURUSAN', 'KETUA_JURUSAN', FALSE),
('SEKJUR_POLITIK_FISIP', 'Sekretaris Jurusan Ilmu Sosial & Politik', 'JUR_POLITIK_FISIP', 'JURUSAN', 'SEKRETARIS_JURUSAN', FALSE),

-- =========================================================================
-- 7. FKIP - Ketua & Sekretaris Jurusan (13 Jurusan Sesuai PDF)
-- =========================================================================
('KAJUR_PENMAS_FKIP', 'Ketua Jurusan Pendidikan Masyarakat', 'JUR_PENMAS_FKIP', 'JURUSAN', 'KETUA_JURUSAN', FALSE),
('SEKJUR_PENMAS_FKIP', 'Sekretaris Jurusan Pendidikan Masyarakat', 'JUR_PENMAS_FKIP', 'JURUSAN', 'SEKRETARIS_JURUSAN', FALSE),
('KAJUR_BINDO_FKIP', 'Ketua Jurusan Pendidikan Bahasa Indonesia', 'JUR_BINDO_FKIP', 'JURUSAN', 'KETUA_JURUSAN', FALSE),
('SEKJUR_BINDO_FKIP', 'Sekretaris Jurusan Pendidikan Bahasa Indonesia', 'JUR_BINDO_FKIP', 'JURUSAN', 'SEKRETARIS_JURUSAN', FALSE),
('KAJUR_BING_FKIP', 'Ketua Jurusan Pendidikan Bahasa Inggris', 'JUR_BING_FKIP', 'JURUSAN', 'KETUA_JURUSAN', FALSE),
('SEKJUR_BING_FKIP', 'Sekretaris Jurusan Pendidikan Bahasa Inggris', 'JUR_BING_FKIP', 'JURUSAN', 'SEKRETARIS_JURUSAN', FALSE),
('KAJUR_MAT_FKIP', 'Ketua Jurusan Pendidikan Matematika', 'JUR_MAT_FKIP', 'JURUSAN', 'KETUA_JURUSAN', FALSE),
('SEKJUR_MAT_FKIP', 'Sekretaris Jurusan Pendidikan Matematika', 'JUR_MAT_FKIP', 'JURUSAN', 'SEKRETARIS_JURUSAN', FALSE),
('KAJUR_BIO_FKIP', 'Ketua Jurusan Pendidikan Biologi', 'JUR_BIO_FKIP', 'JURUSAN', 'KETUA_JURUSAN', FALSE),
('SEKJUR_BIO_FKIP', 'Sekretaris Jurusan Pendidikan Biologi', 'JUR_BIO_FKIP', 'JURUSAN', 'SEKRETARIS_JURUSAN', FALSE),
('KAJUR_EKO_FKIP', 'Ketua Jurusan Pendidikan Ekonomi', 'JUR_EKO_FKIP', 'JURUSAN', 'KETUA_JURUSAN', FALSE),
('SEKJUR_EKO_FKIP', 'Sekretaris Jurusan Pendidikan Ekonomi', 'JUR_EKO_FKIP', 'JURUSAN', 'SEKRETARIS_JURUSAN', FALSE),
('KAJUR_GEO_FKIP', 'Ketua Jurusan Pendidikan Geografi', 'JUR_GEO_FKIP', 'JURUSAN', 'KETUA_JURUSAN', FALSE),
('SEKJUR_GEO_FKIP', 'Sekretaris Jurusan Pendidikan Geografi', 'JUR_GEO_FKIP', 'JURUSAN', 'SEKRETARIS_JURUSAN', FALSE),
('KAJUR_PENJAS_FKIP', 'Ketua Jurusan Pendidikan Jasmani', 'JUR_PENJAS_FKIP', 'JURUSAN', 'KETUA_JURUSAN', FALSE),
('SEKJUR_PENJAS_FKIP', 'Sekretaris Jurusan Pendidikan Jasmani', 'JUR_PENJAS_FKIP', 'JURUSAN', 'SEKRETARIS_JURUSAN', FALSE),
('KAJUR_SEJ_FKIP', 'Ketua Jurusan Pendidikan Sejarah', 'JUR_SEJ_FKIP', 'JURUSAN', 'KETUA_JURUSAN', FALSE),
('SEKJUR_SEJ_FKIP', 'Sekretaris Jurusan Pendidikan Sejarah', 'JUR_SEJ_FKIP', 'JURUSAN', 'SEKRETARIS_JURUSAN', FALSE),
('KAJUR_FIS_FKIP', 'Ketua Jurusan Pendidikan Fisika', 'JUR_FIS_FKIP', 'JURUSAN', 'KETUA_JURUSAN', FALSE),
('SEKJUR_FIS_FKIP', 'Sekretaris Jurusan Pendidikan Fisika', 'JUR_FIS_FKIP', 'JURUSAN', 'SEKRETARIS_JURUSAN', FALSE),
('KAJUR_PPG_FKIP', 'Ketua Jurusan Pendidikan Profesi Guru', 'JUR_PPG_FKIP', 'JURUSAN', 'KETUA_JURUSAN', FALSE),
('SEKJUR_PPG_FKIP', 'Sekretaris Jurusan Pendidikan Profesi Guru', 'JUR_PPG_FKIP', 'JURUSAN', 'SEKRETARIS_JURUSAN', FALSE),
('KAJUR_PKO_FKIP', 'Ketua Jurusan Pendidikan Kepelatihan Olahraga', 'JUR_PKO_FKIP', 'JURUSAN', 'KETUA_JURUSAN', FALSE),
('SEKJUR_PKO_FKIP', 'Sekretaris Jurusan Pendidikan Kepelatihan Olahraga', 'JUR_PKO_FKIP', 'JURUSAN', 'SEKRETARIS_JURUSAN', FALSE),
('KAJUR_SENI_FKIP', 'Ketua Jurusan Pendidikan Seni Pertunjukan', 'JUR_SENI_FKIP', 'JURUSAN', 'KETUA_JURUSAN', FALSE),
('SEKJUR_SENI_FKIP', 'Sekretaris Jurusan Pendidikan Seni Pertunjukan', 'JUR_SENI_FKIP', 'JURUSAN', 'SEKRETARIS_JURUSAN', FALSE),

-- =========================================================================
-- 8. PASCASARJANA - Ketua & Sekretaris Program Magister / Doktor (10 Program)
-- =========================================================================
('KAJUR_S2_GEO_PASCA', 'Ketua Program Magister Pendidikan Geografi', 'JUR_S2_GEO_PASCA', 'JURUSAN', 'KETUA_JURUSAN', FALSE),
('SEKJUR_S2_GEO_PASCA', 'Sekretaris Program Magister Pendidikan Geografi', 'JUR_S2_GEO_PASCA', 'JURUSAN', 'SEKRETARIS_JURUSAN', FALSE),
('KAJUR_S2_AGRI_PASCA', 'Ketua Program Magister Agribisnis', 'JUR_S2_AGRI_PASCA', 'JURUSAN', 'KETUA_JURUSAN', FALSE),
('SEKJUR_S2_AGRI_PASCA', 'Sekretaris Program Magister Agribisnis', 'JUR_S2_AGRI_PASCA', 'JURUSAN', 'SEKRETARIS_JURUSAN', FALSE),
('KAJUR_S2_MAN_PASCA', 'Ketua Program Magister Manajemen', 'JUR_S2_MAN_PASCA', 'JURUSAN', 'KETUA_JURUSAN', FALSE),
('SEKJUR_S2_MAN_PASCA', 'Sekretaris Program Magister Manajemen', 'JUR_S2_MAN_PASCA', 'JURUSAN', 'SEKRETARIS_JURUSAN', FALSE),
('KAJUR_S2_MAT_PASCA', 'Ketua Program Magister Pendidikan Matematika', 'JUR_S2_MAT_PASCA', 'JURUSAN', 'KETUA_JURUSAN', FALSE),
('SEKJUR_S2_MAT_PASCA', 'Sekretaris Program Magister Pendidikan Matematika', 'JUR_S2_MAT_PASCA', 'JURUSAN', 'SEKRETARIS_JURUSAN', FALSE),
('KAJUR_S2_AGRO_PASCA', 'Ketua Program Magister Agroteknologi', 'JUR_S2_AGRO_PASCA', 'JURUSAN', 'KETUA_JURUSAN', FALSE),
('SEKJUR_S2_AGRO_PASCA', 'Sekretaris Program Magister Agroteknologi', 'JUR_S2_AGRO_PASCA', 'JURUSAN', 'SEKRETARIS_JURUSAN', FALSE),
('KAJUR_S2_IPA_PASCA', 'Ketua Program Magister Pendidikan IPA', 'JUR_S2_IPA_PASCA', 'JURUSAN', 'KETUA_JURUSAN', FALSE),
('SEKJUR_S2_IPA_PASCA', 'Sekretaris Program Magister Pendidikan IPA', 'JUR_S2_IPA_PASCA', 'JURUSAN', 'SEKRETARIS_JURUSAN', FALSE),
('KAJUR_S2_PENJAS_PASCA', 'Ketua Program Magister Pendidikan Jasmani', 'JUR_S2_PENJAS_PASCA', 'JURUSAN', 'KETUA_JURUSAN', FALSE),
('SEKJUR_S2_PENJAS_PASCA', 'Sekretaris Program Magister Pendidikan Jasmani', 'JUR_S2_PENJAS_PASCA', 'JURUSAN', 'SEKRETARIS_JURUSAN', FALSE),
('KAJUR_S3_MAN_PASCA', 'Ketua Program Doktor Ilmu Manajemen', 'JUR_S3_MAN_PASCA', 'JURUSAN', 'KETUA_JURUSAN', FALSE),
('SEKJUR_S3_MAN_PASCA', 'Sekretaris Program Doktor Ilmu Manajemen', 'JUR_S3_MAN_PASCA', 'JURUSAN', 'SEKRETARIS_JURUSAN', FALSE),
('KAJUR_S3_PERTANIAN_PASCA', 'Ketua Program Doktor Ilmu Pertanian', 'JUR_S3_PERTANIAN_PASCA', 'JURUSAN', 'KETUA_JURUSAN', FALSE),
('SEKJUR_S3_PERTANIAN_PASCA', 'Sekretaris Program Doktor Ilmu Pertanian', 'JUR_S3_PERTANIAN_PASCA', 'JURUSAN', 'SEKRETARIS_JURUSAN', FALSE),
('KAJUR_S3_PENDIDIKAN_PASCA', 'Ketua Program Doktor Pendidikan', 'JUR_S3_PENDIDIKAN_PASCA', 'JURUSAN', 'KETUA_JURUSAN', FALSE),
('SEKJUR_S3_PENDIDIKAN_PASCA', 'Sekretaris Program Doktor Pendidikan', 'JUR_S3_PENDIDIKAN_PASCA', 'JURUSAN', 'SEKRETARIS_JURUSAN', FALSE),

-- =========================================================================
-- 9. BIRO & LEMBAGA
-- =========================================================================
('KEPALA_BIRO_BKU', 'Kepala Biro Keuangan dan Umum', 'BKU', 'FAKULTAS', 'KEPALA_BIRO', FALSE),
('KEPALA_BIRO_BAKPK', 'Kepala Biro Akademik, Kemahasiswaan, Perencanaan, dan Kerjasama', 'BAKPK', 'FAKULTAS', 'KEPALA_BIRO', FALSE),
('KEPALA_LPPM', 'Kepala Lembaga Penelitian dan Pengabdian kepada Masyarakat', 'LPPM', 'FAKULTAS', 'KEPALA_LEMBAGA', FALSE),
('KEPALA_LP3M', 'Kepala Lembaga Pengembangan Pembelajaran & Penjaminan Mutu', 'LP3M', 'FAKULTAS', 'KEPALA_LEMBAGA', FALSE),
('KEPALA_SPI', 'Kepala Satuan Pengawas Internal', 'SPI', 'FAKULTAS', 'KEPALA_SPI', FALSE)
ON CONFLICT (position_code) DO UPDATE SET
    name = EXCLUDED.name,
    unit_id = EXCLUDED.unit_id,
    level = EXCLUDED.level,
    default_role_key = EXCLUDED.default_role_key,
    can_sign_policy = EXCLUDED.can_sign_policy;

COMMIT;
