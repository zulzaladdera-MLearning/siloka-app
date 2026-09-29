-- =============================================================================
-- MIGRATION 008: PEMBERSIHAN FORMASI WARISAN (LEGACY) FAKULTAS SOTK UNSIL
-- Memastikan seluruh Fakultas strictly hanya memuat:
-- 1. Dekan (atau Direktur Pascasarjana)
-- 2. Wakil Dekan Bidang Akademik dan Kemahasiswaan
-- 3. Wakil Dekan Bidang Keuangan dan Umum
-- 4. Kepala Subbagian Umum
-- 5. Ketua Jurusan & Sekretaris Jurusan (Sesuai Program Studi di Unsil.pdf)
-- =============================================================================

BEGIN;

-- 1. Hapus formasi warisan FKIP yang bukan prodi resmi per dokumen
DELETE FROM tbl_positions WHERE position_code IN (
  'KAJUR_PEND_MIPA', 'SEKJUR_PEND_MIPA',
  'KAJUR_PEND_BAHASA', 'SEKJUR_PEND_BAHASA',
  'KAJUR_PEND_IPS', 'SEKJUR_PEND_IPS',
  'KAJUR_PEND_OLAHRAGA', 'SEKJUR_PEND_OLAHRAGA'
);

-- 2. Hapus formasi warisan FAI & FISIP
DELETE FROM tbl_positions WHERE position_code IN (
  'KAJUR_SYARIAH_FAI', 'SEKJUR_SYARIAH_FAI',
  'KAJUR_POLITIK_FISIP', 'SEKJUR_POLITIK_FISIP'
);

-- 3. Hapus unit warisan di tbl_units
DELETE FROM tbl_units WHERE id IN (
  'JUR_PEND_MIPA', 'JUR_PEND_BAHASA', 'JUR_PEND_IPS', 'JUR_PEND_OLAHRAGA',
  'JUR_SYARIAH_FAI', 'JUR_POLITIK_FISIP'
);

COMMIT;

