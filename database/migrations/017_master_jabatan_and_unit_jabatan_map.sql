-- =================================================================================
-- MIGRASI 017: TABEL MASTER JABATAN BAKU (tbl_master_jabatan) &
--              TABEL PEMETAAN KONDISIONAL SOTK UNIT KERJA (tbl_unit_jabatan_map)
-- Regulasi Acuan: Permendikbudristek No. 19 Tahun 2023 tentang OTK UNSIL
-- =================================================================================

-- 1. Tabel Master Jabatan Baku UNSIL (tbl_master_jabatan)
CREATE TABLE IF NOT EXISTS tbl_master_jabatan (
  id_jabatan VARCHAR(40) PRIMARY KEY,
  nama_jabatan VARCHAR(150) NOT NULL UNIQUE,
  kategori_jabatan VARCHAR(40) NOT NULL
    CHECK (kategori_jabatan IN ('STRUKTURAL_PIMPINAN', 'STRUKTURAL_SUB_UNIT', 'FUNGSIONAL_TAMBAHAN', 'ADMINISTRASI_TU')),
  is_signatory_tte BOOLEAN DEFAULT FALSE,
  level_otorisasi VARCHAR(50) DEFAULT 'Level 2: Fungsional',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed Master Jabatan Baku UNSIL (Termasuk Struktur Rektorat: 1. Rektor & 2. Wakil Rektor)
INSERT INTO tbl_master_jabatan (id_jabatan, nama_jabatan, kategori_jabatan, is_signatory_tte, level_otorisasi)
VALUES
  ('JBT_REKTOR',                  'Rektor',                                         'STRUKTURAL_PIMPINAN', TRUE,  'Level 0: Pimpinan Tertinggi Universitas'),
  ('JBT_WAREK_AKADEMIK',          'Wakil Rektor Bidang Akademik',                   'STRUKTURAL_PIMPINAN', TRUE,  'Level 1: Wakil Rektor Bidang I'),
  ('JBT_WAREK_KEUANGAN',          'Wakil Rektor Bidang Keuangan dan Umum',          'STRUKTURAL_PIMPINAN', TRUE,  'Level 1: Wakil Rektor Bidang II'),
  ('JBT_WAREK_KEMAHASISWAAN',     'Wakil Rektor Bidang Kemahasiswaan dan Alumni',   'STRUKTURAL_PIMPINAN', TRUE,  'Level 1: Wakil Rektor Bidang III'),
  ('JBT_KA_SENAT',                'Ketua Senat Universitas',                        'STRUKTURAL_PIMPINAN', TRUE,  'Level 1: Pimpinan Organ Senat'),
  ('JBT_SEK_SENAT',               'Sekretaris Senat Universitas',                   'STRUKTURAL_SUB_UNIT', TRUE,  'Level 2: Sekretaris Organ Senat'),
  ('JBT_KA_SPI',                  'Ketua SPI',                                      'STRUKTURAL_PIMPINAN', TRUE,  'Level 1: Pimpinan Organ SPI'),
  ('JBT_SEK_SPI',                 'Sekretaris SPI',                                 'STRUKTURAL_SUB_UNIT', TRUE,  'Level 2: Sekretaris Organ SPI'),
  ('JBT_AUDITOR_SPI',             'Auditor Internal SPI',                           'FUNGSIONAL_TAMBAHAN', FALSE, 'Level 2: Fungsional SPI'),
  ('JBT_KA_LEMBAGA',              'Kepala Lembaga',                                 'STRUKTURAL_PIMPINAN', TRUE,  'Level 1: Pimpinan Lembaga'),
  ('JBT_SEK_LEMBAGA',             'Sekretaris Lembaga',                             'STRUKTURAL_SUB_UNIT', TRUE,  'Level 2: Pimpinan Sub-Unit'),
  ('JBT_KAPUS_LIT',               'Kepala Pusat Penelitian',                        'STRUKTURAL_SUB_UNIT', TRUE,  'Level 2: Kepala Pusat'),
  ('JBT_KAPUS_PKM',               'Kepala Pusat Pengabdian',                        'STRUKTURAL_SUB_UNIT', TRUE,  'Level 2: Kepala Pusat'),
  ('JBT_KAPUS_HKI',               'Kepala Pusat Publikasi & HKI',                   'STRUKTURAL_SUB_UNIT', FALSE, 'Level 2: Kepala Pusat'),
  ('JBT_KAPUS_MUTU',              'Kepala Pusat Penjaminan Mutu',                   'STRUKTURAL_SUB_UNIT', TRUE,  'Level 2: Kepala Pusat'),
  ('JBT_KAPUS_PEMBELAJARAN',      'Kepala Pusat Pengembangan Pembelajaran',         'STRUKTURAL_SUB_UNIT', TRUE,  'Level 2: Kepala Pusat'),
  ('JBT_DEKAN',                   'Dekan',                                          'STRUKTURAL_PIMPINAN', TRUE,  'Level 1: Pimpinan Fakultas'),
  ('JBT_WADEK',                   'Wakil Dekan',                                    'STRUKTURAL_SUB_UNIT', TRUE,  'Level 2: Pimpinan Fakultas'),
  ('JBT_KAJUR',                   'Ketua Jurusan',                                  'STRUKTURAL_SUB_UNIT', TRUE,  'Level 2: Pimpinan Jurusan'),
  ('JBT_SEKJUR',                  'Sekretaris Jurusan',                             'STRUKTURAL_SUB_UNIT', FALSE, 'Level 2: Pimpinan Jurusan'),
  ('JBT_KOORPRODI',               'Koordinator Program Studi',                      'STRUKTURAL_SUB_UNIT', TRUE,  'Level 2: Pimpinan Prodi'),
  ('JBT_KALAB',                   'Kepala Laboratorium',                            'FUNGSIONAL_TAMBAHAN', FALSE, 'Level 2: Fungsional Tambahan'),
  ('JBT_DOSEN_HOMEBASE',          'Dosen Fungsional (Homebase Fakultas)',           'FUNGSIONAL_TAMBAHAN', FALSE, 'Level 2: Dosen Regulasi'),
  ('JBT_DIREKTUR_PASCA',          'Direktur Pascasarjana',                          'STRUKTURAL_PIMPINAN', TRUE,  'Level 1: Pimpinan Pascasarjana'),
  ('JBT_WADIR_PASCA',             'Wakil Direktur Pascasarjana',                    'STRUKTURAL_SUB_UNIT', TRUE,  'Level 2: Pimpinan Pascasarjana'),
  ('JBT_KA_BIRO',                 'Kepala Biro',                                    'STRUKTURAL_PIMPINAN', TRUE,  'Level 1: Pimpinan Biro'),
  ('JBT_KABAG',                   'Kepala Bagian',                                  'STRUKTURAL_SUB_UNIT', TRUE,  'Level 2: Pejabat Administrasi'),
  ('JBT_KASUBBAG',                'Kepala Subbagian Umum',                          'ADMINISTRASI_TU',     FALSE, 'Level 2: Koordinator Administrasi'),
  ('JBT_ARSIPARIS_TU',            'Arsiparis / Pengendali Surat Biro',              'ADMINISTRASI_TU',     FALSE, 'Level 2: Staf Khusus Kearsipan'),
  ('JBT_KA_UPA',                  'Kepala UPA',                                     'STRUKTURAL_PIMPINAN', TRUE,  'Level 1: Pimpinan UPA'),
  ('JBT_KOOR_UPA',                'Koordinator Layanan Teknis UPA',                 'FUNGSIONAL_TAMBAHAN', FALSE, 'Level 2: Fungsional UPA'),
  ('JBT_DOSEN_PENUGASAN_LEMBAGA', 'Peneliti / Dosen Penugasan LPPM',                'FUNGSIONAL_TAMBAHAN', FALSE, 'Level 2: Fungsional')
ON CONFLICT (id_jabatan) DO UPDATE
SET
  nama_jabatan = EXCLUDED.nama_jabatan,
  kategori_jabatan = EXCLUDED.kategori_jabatan,
  is_signatory_tte = EXCLUDED.is_signatory_tte,
  level_otorisasi = EXCLUDED.level_otorisasi;

-- 2. Tabel Pemetaan Kondisional Unit Kerja <-> Jabatan Legal (tbl_unit_jabatan_map)
CREATE TABLE IF NOT EXISTS tbl_unit_jabatan_map (
  id_map SERIAL PRIMARY KEY,
  kode_unit VARCHAR(32) NOT NULL REFERENCES tbl_unit_kerja(kode_unit) ON UPDATE CASCADE ON DELETE CASCADE,
  id_jabatan VARCHAR(40) NOT NULL REFERENCES tbl_master_jabatan(id_jabatan) ON UPDATE CASCADE ON DELETE RESTRICT,
  nama_jabatan_spesifik VARCHAR(180) NOT NULL,
  sub_kelompok VARCHAR(80) DEFAULT NULL,
  is_default_selection BOOLEAN DEFAULT FALSE,
  urutan INT DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_unit_jabatan_map UNIQUE (kode_unit, id_jabatan)
);

-- Bersihkan pemetaan lama pada REKTORAT agar hanya memuat 1. Rektor & 2. Wakil Rektor (3 Bidang)
DELETE FROM tbl_unit_jabatan_map WHERE kode_unit = 'REKTORAT';

-- Seed Pemetaan Unit 'REKTORAT':
-- 1. Rektor
-- 2. Wakil Rektor (Wakil Rektor Bidang Akademik, Wakil Rektor Bidang Keuangan dan Umum, Wakil Rektor Bidang Kemahasiswaan dan Alumni)
INSERT INTO tbl_unit_jabatan_map (kode_unit, id_jabatan, nama_jabatan_spesifik, sub_kelompok, is_default_selection, urutan)
VALUES
  ('REKTORAT', 'JBT_REKTOR',              'Rektor',                                       '1. Rektor',       FALSE, 1),
  ('REKTORAT', 'JBT_WAREK_AKADEMIK',      'Wakil Rektor Bidang Akademik',                 '2. Wakil Rektor', TRUE,  2),
  ('REKTORAT', 'JBT_WAREK_KEUANGAN',      'Wakil Rektor Bidang Keuangan dan Umum',        '2. Wakil Rektor', FALSE, 3),
  ('REKTORAT', 'JBT_WAREK_KEMAHASISWAAN', 'Wakil Rektor Bidang Kemahasiswaan dan Alumni', '2. Wakil Rektor', FALSE, 4)
ON CONFLICT (kode_unit, id_jabatan) DO UPDATE
SET
  nama_jabatan_spesifik = EXCLUDED.nama_jabatan_spesifik,
  sub_kelompok = EXCLUDED.sub_kelompok,
  is_default_selection = EXCLUDED.is_default_selection,
  urutan = EXCLUDED.urutan;

-- Seed Pemetaan Unit 'LPPM':
INSERT INTO tbl_unit_jabatan_map (kode_unit, id_jabatan, nama_jabatan_spesifik, is_default_selection, urutan)
VALUES
  ('LPPM', 'JBT_KA_LEMBAGA',              'Kepala Lembaga Penelitian dan Pengabdian kepada Masyarakat (LPPM)', FALSE, 1),
  ('LPPM', 'JBT_SEK_LEMBAGA',             'Sekretaris Lembaga Penelitian dan Pengabdian kepada Masyarakat (LPPM)', FALSE, 2),
  ('LPPM', 'JBT_KAPUS_LIT',               'Kepala Pusat Penelitian LPPM',                                      TRUE,  3),
  ('LPPM', 'JBT_KAPUS_PKM',               'Kepala Pusat Pengabdian kepada Masyarakat LPPM',                    FALSE, 4),
  ('LPPM', 'JBT_KAPUS_HKI',               'Kepala Pusat Publikasi Ilmiah & HKI LPPM',                          FALSE, 5),
  ('LPPM', 'JBT_KASUBBAG',                'Kepala Subbagian Umum & Tata Usaha LPPM',                           FALSE, 6),
  ('LPPM', 'JBT_DOSEN_PENUGASAN_LEMBAGA', 'Peneliti / Dosen Penugasan Khusus LPPM',                            FALSE, 7)
ON CONFLICT (kode_unit, id_jabatan) DO NOTHING;

-- Seed Pemetaan Unit 'FT' (Fakultas Teknik):
INSERT INTO tbl_unit_jabatan_map (kode_unit, id_jabatan, nama_jabatan_spesifik, is_default_selection, urutan)
VALUES
  ('FT', 'JBT_DEKAN',          'Dekan Fakultas Teknik (FT)',                 FALSE, 1),
  ('FT', 'JBT_WADEK',          'Wakil Dekan Fakultas Teknik (FT)',           FALSE, 2),
  ('FT', 'JBT_KAJUR',          'Ketua Jurusan (FT)',                         TRUE,  3),
  ('FT', 'JBT_SEKJUR',         'Sekretaris Jurusan (FT)',                    FALSE, 4),
  ('FT', 'JBT_KOORPRODI',      'Koordinator Program Studi (FT)',             FALSE, 5),
  ('FT', 'JBT_KALAB',          'Kepala Laboratorium (FT)',                   FALSE, 6),
  ('FT', 'JBT_DOSEN_HOMEBASE', 'Dosen Fungsional Fakultas Teknik (FT)',      FALSE, 7)
ON CONFLICT (kode_unit, id_jabatan) DO NOTHING;

-- 3. Referensi Foreign Key jabatan_tujuan_id pada Tabel Penugasan & Riwayat Mutasi
ALTER TABLE tbl_penugasan_sekunder
  ADD COLUMN IF NOT EXISTS jabatan_tujuan_id VARCHAR(40)
  REFERENCES tbl_master_jabatan(id_jabatan) ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE tbl_riwayat_mutasi
  ADD COLUMN IF NOT EXISTS jabatan_tujuan_id VARCHAR(40)
  REFERENCES tbl_master_jabatan(id_jabatan) ON UPDATE CASCADE ON DELETE RESTRICT;
