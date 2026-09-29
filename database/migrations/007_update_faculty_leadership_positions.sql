-- ============================================================================
-- MIGRATION 007: STRUKTUR FORMASI KEPEMIMPINAN FAKULTAS LENGKAP
-- Berdasarkan Permendikbudristek No. 19/2023 Pasal 14, 15, 19, 25 & 31:
-- 1. Dekan (atau Direktur Pascasarjana)
-- 2. Wakil Dekan Bidang Akademik dan Kemahasiswaan
-- 3. Wakil Dekan Bidang Keuangan dan Umum
-- 4. Kepala Subbagian Umum
-- 5. Ketua Jurusan & Sekretaris Jurusan
-- ============================================================================

-- 1. Update nama Wadek 1 seluruh fakultas agar seragam
UPDATE tbl_positions SET name = 'Wakil Dekan Bidang Akademik dan Kemahasiswaan FT' WHERE position_code = 'WADEK_FT_1';
UPDATE tbl_positions SET name = 'Wakil Dekan Bidang Akademik dan Kemahasiswaan FKIP' WHERE position_code = 'WADEK_FKIP_1';
UPDATE tbl_positions SET name = 'Wakil Dekan Bidang Akademik dan Kemahasiswaan FEB' WHERE position_code = 'WADEK_FEB_1';
UPDATE tbl_positions SET name = 'Wakil Dekan Bidang Akademik dan Kemahasiswaan FP' WHERE position_code = 'WADEK_FP_1';
UPDATE tbl_positions SET name = 'Wakil Dekan Bidang Akademik dan Kemahasiswaan FAI' WHERE position_code = 'WADEK_FAI_1';
UPDATE tbl_positions SET name = 'Wakil Dekan Bidang Akademik dan Kemahasiswaan FIK' WHERE position_code = 'WADEK_FIK_1';
UPDATE tbl_positions SET name = 'Wakil Dekan Bidang Akademik dan Kemahasiswaan FISIP' WHERE position_code = 'WADEK_FISIP_1';
UPDATE tbl_positions SET name = 'Wakil Direktur Bidang Akademik dan Kemahasiswaan Program Pascasarjana' WHERE position_code IN ('WADIR_PASCA', 'WADIR_PASCA_1');

-- 2. Tambahkan Wakil Dekan Bidang Keuangan dan Umum (Wadek 2) untuk 7 Fakultas & Pascasarjana
INSERT INTO tbl_positions (position_code, name, unit_id, level, default_role_key, can_sign_policy)
VALUES
('WADEK_FT_2', 'Wakil Dekan Bidang Keuangan dan Umum FT', 'FT', 'FAKULTAS', 'DEKAN', FALSE),
('WADEK_FKIP_2', 'Wakil Dekan Bidang Keuangan dan Umum FKIP', 'FKIP', 'FAKULTAS', 'DEKAN', FALSE),
('WADEK_FEB_2', 'Wakil Dekan Bidang Keuangan dan Umum FEB', 'FEB', 'FAKULTAS', 'DEKAN', FALSE),
('WADEK_FP_2', 'Wakil Dekan Bidang Keuangan dan Umum FP', 'FP', 'FAKULTAS', 'DEKAN', FALSE),
('WADEK_FAI_2', 'Wakil Dekan Bidang Keuangan dan Umum FAI', 'FAI', 'FAKULTAS', 'DEKAN', FALSE),
('WADEK_FIK_2', 'Wakil Dekan Bidang Keuangan dan Umum FIK', 'FIK', 'FAKULTAS', 'DEKAN', FALSE),
('WADEK_FISIP_2', 'Wakil Dekan Bidang Keuangan dan Umum FISIP', 'FISIP', 'FAKULTAS', 'DEKAN', FALSE),
('WADIR_PASCA_2', 'Wakil Direktur Bidang Keuangan dan Umum Program Pascasarjana', 'PASCA', 'FAKULTAS', 'DEKAN', FALSE),
('KASUBBAG_TU_PASCA', 'Kepala Subbagian Umum Program Pascasarjana', 'PASCA', 'FAKULTAS', 'STAFF_TU', FALSE)
ON CONFLICT (position_code) DO UPDATE SET
  name = EXCLUDED.name,
  unit_id = EXCLUDED.unit_id,
  level = EXCLUDED.level,
  default_role_key = EXCLUDED.default_role_key,
  can_sign_policy = EXCLUDED.can_sign_policy;

