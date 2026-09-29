-- ============================================================================
-- MIGRATION 006: RESTRUKTURISASI FORMASI JABATAN REKTORAT & PEJABAT STRUKTURAL BIRO
-- Berdasarkan Peraturan Rektor UNSIL No. 3/2023 & Permendikbudristek No. 19/2023
-- ============================================================================

-- 1. Pastikan Unit Biro dan Sub-Biro Terdaftar
INSERT INTO tbl_units (id, name, category, parent_unit_id) VALUES
('BKU', 'Biro Keuangan dan Umum', 'BIRO', 'UNSIL'),
('BAKPK', 'Biro Akademik, Kemahasiswaan, Perencanaan, dan Kerjasama', 'BIRO', 'UNSIL')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  parent_unit_id = EXCLUDED.parent_unit_id;

-- 2. Update Nama Formasi Pimpinan Rektorat & Biro agar seragam
UPDATE tbl_positions 
SET name = 'Rektor Universitas Siliwangi', level = 'UNIVERSITAS', unit_id = 'UNSIL'
WHERE position_code = 'REKTOR';

UPDATE tbl_positions 
SET name = 'Wakil Rektor Bidang Akademik', level = 'UNIVERSITAS', unit_id = 'UNSIL'
WHERE position_code = 'WAREK_1';

UPDATE tbl_positions 
SET name = 'Wakil Rektor Bidang Keuangan dan Umum', level = 'UNIVERSITAS', unit_id = 'UNSIL'
WHERE position_code = 'WAREK_2';

UPDATE tbl_positions 
SET name = 'Wakil Rektor Bidang Kemahasiswaan dan Alumni', level = 'UNIVERSITAS', unit_id = 'UNSIL'
WHERE position_code = 'WAREK_3';

UPDATE tbl_positions 
SET name = 'Kepala Biro Keuangan dan Umum (BKU)', level = 'BIRO', unit_id = 'BKU'
WHERE position_code = 'KEPALA_BIRO_BKU';

UPDATE tbl_positions 
SET name = 'Kepala Biro Akademik, Kemahasiswaan, Perencanaan, dan Kerja Sama (BAKPK)', level = 'BIRO', unit_id = 'BAKPK'
WHERE position_code = 'KEPALA_BIRO_BAKPK';

-- 3. Tambahkan Posisi Baru: Kepala Bagian Umum (BKU) dan Kepala Bagian Akademik (BAKPK)
INSERT INTO tbl_positions (position_code, name, unit_id, level, default_role_key, can_sign_policy)
VALUES 
('KABAG_UMUM_BKU', 'Kepala Bagian Umum (pada BKU)', 'BKU', 'BIRO', 'STAFF_TU', FALSE)
ON CONFLICT (position_code) DO UPDATE SET
  name = EXCLUDED.name,
  unit_id = EXCLUDED.unit_id,
  level = EXCLUDED.level,
  default_role_key = EXCLUDED.default_role_key,
  can_sign_policy = EXCLUDED.can_sign_policy;

INSERT INTO tbl_positions (position_code, name, unit_id, level, default_role_key, can_sign_policy)
VALUES 
('KABAG_AKADEMIK_BAKPK', 'Kepala Bagian Akademik (pada BAKPK)', 'BAKPK', 'BIRO', 'STAFF_TU', FALSE)
ON CONFLICT (position_code) DO UPDATE SET
  name = EXCLUDED.name,
  unit_id = EXCLUDED.unit_id,
  level = EXCLUDED.level,
  default_role_key = EXCLUDED.default_role_key,
  can_sign_policy = EXCLUDED.can_sign_policy;

-- 4. Hapus WAREK_4 jika ada (karena tidak ada dalam SOTK UNSIL Permendikbudristek 19/2023)
DELETE FROM tbl_position_assignments WHERE position_id IN (SELECT id FROM tbl_positions WHERE position_code = 'WAREK_4');
DELETE FROM tbl_positions WHERE position_code = 'WAREK_4';

