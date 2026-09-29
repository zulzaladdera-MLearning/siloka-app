-- =============================================================================
-- MIGRATION 009: FORMASI JABATAN STRUKTURAL LPPM & LPMPP (SOTK UNSIL)
-- Berdasarkan Permendikbudristek No. 19/2023 Pasal 33 - 52 & Arahan Resmi:
--
-- 1. LPPM (Total 8 Formasi):
--    - Kepala LPPM
--    - Sekretaris LPPM
--    - Kepala Subbagian Umum LPPM
--    - Kepala Pusat Penelitian
--    - Kepala Pusat Pengabdian kepada Masyarakat
--    - Kepala Pusat Publikasi Ilmiah, HaKI, dan Paten
--    - Kepala Pusat Manajemen Inovasi dan Inkubator Bisnis
--    - Kepala Pusat Studi Halal
--
-- 2. LPMPP (Total 7 Formasi):
--    - Kepala LPMPP
--    - Sekretaris LPMPP
--    - Kepala Subbagian Umum LPMPP
--    - Kepala Pusat Penjaminan Mutu & Audit Mutu Internal
--    - Kepala Pusat Pengkajian dan Pengembangan Kurikulum
--    - Kepala Pusat Pengembangan Pembelajaran, Pendidikan, dan MBKM
--    - Kepala Pusat Pendidikan Karakter, Bimbingan Konseling, dan Layanan Psikologi
-- =============================================================================

BEGIN;

-- 1. Pastikan unit LPPM dan LPMPP terdaftar di tbl_units
INSERT INTO tbl_units (id, name, category, parent_unit_id)
VALUES 
  ('LPPM', 'Lembaga Penelitian dan Pengabdian kepada Masyarakat', 'LEMBAGA', 'UNSIL'),
  ('LPMPP', 'Lembaga Penjaminan Mutu dan Pengembangan Pembelajaran', 'LEMBAGA', 'UNSIL')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name, 
  category = EXCLUDED.category, 
  parent_unit_id = EXCLUDED.parent_unit_id;

-- Update record LP3M jika ada agar namanya selaras
UPDATE tbl_units 
SET name = 'Lembaga Penjaminan Mutu dan Pengembangan Pembelajaran' 
WHERE id = 'LP3M';

-- 2. Migrasi formasi KEPALA_LP3M menjadi KEPALA_LPMPP jika ada
UPDATE tbl_positions 
SET position_code = 'KEPALA_LPMPP', unit_id = 'LPMPP', name = 'Kepala LPMPP' 
WHERE position_code = 'KEPALA_LP3M';

-- 3. Seed Formasi Struktural LPPM & LPMPP
INSERT INTO tbl_positions (position_code, name, unit_id, level, default_role_key, can_sign_policy)
VALUES
  -- LPPM (Pimpinan & Tata Usaha)
  ('KEPALA_LPPM', 'Kepala LPPM', 'LPPM', 'LEMBAGA', 'KEPALA_LEMBAGA', TRUE),
  ('SEKRETARIS_LPPM', 'Sekretaris LPPM', 'LPPM', 'LEMBAGA', 'KEPALA_LEMBAGA', FALSE),
  ('KASUBBAG_TU_LPPM', 'Kepala Subbagian Umum LPPM', 'LPPM', 'LEMBAGA', 'STAFF_TU', FALSE),
  -- LPPM (Kepala-Kepala Pusat di Lingkungan LPPM)
  ('KAPUS_PENELITIAN_LPPM', 'Kepala Pusat Penelitian', 'LPPM', 'LEMBAGA_PUSAT', 'KEPALA_LEMBAGA', FALSE),
  ('KAPUS_PENGABDIAN_LPPM', 'Kepala Pusat Pengabdian kepada Masyarakat', 'LPPM', 'LEMBAGA_PUSAT', 'KEPALA_LEMBAGA', FALSE),
  ('KAPUS_PUBLIKASI_HAKI_LPPM', 'Kepala Pusat Publikasi Ilmiah, HaKI, dan Paten', 'LPPM', 'LEMBAGA_PUSAT', 'KEPALA_LEMBAGA', FALSE),
  ('KAPUS_INOVASI_BISNIS_LPPM', 'Kepala Pusat Manajemen Inovasi dan Inkubator Bisnis', 'LPPM', 'LEMBAGA_PUSAT', 'KEPALA_LEMBAGA', FALSE),
  ('KAPUS_STUDI_HALAL_LPPM', 'Kepala Pusat Studi Halal', 'LPPM', 'LEMBAGA_PUSAT', 'KEPALA_LEMBAGA', FALSE),

  -- LPMPP (Pimpinan & Tata Usaha)
  ('KEPALA_LPMPP', 'Kepala LPMPP', 'LPMPP', 'LEMBAGA', 'KEPALA_LEMBAGA', TRUE),
  ('SEKRETARIS_LPMPP', 'Sekretaris LPMPP', 'LPMPP', 'LEMBAGA', 'KEPALA_LEMBAGA', FALSE),
  ('KASUBBAG_TU_LPMPP', 'Kepala Subbagian Umum LPMPP', 'LPMPP', 'LEMBAGA', 'STAFF_TU', FALSE),
  -- LPMPP (Kepala-Kepala Pusat di Lingkungan LPMPP)
  ('KAPUS_MUTU_AUDIT_LPMPP', 'Kepala Pusat Penjaminan Mutu & Audit Mutu Internal', 'LPMPP', 'LEMBAGA_PUSAT', 'KEPALA_LEMBAGA', FALSE),
  ('KAPUS_KURIKULUM_LPMPP', 'Kepala Pusat Pengkajian dan Pengembangan Kurikulum', 'LPMPP', 'LEMBAGA_PUSAT', 'KEPALA_LEMBAGA', FALSE),
  ('KAPUS_PEMBELAJARAN_MBKM_LPMPP', 'Kepala Pusat Pengembangan Pembelajaran, Pendidikan, dan MBKM', 'LPMPP', 'LEMBAGA_PUSAT', 'KEPALA_LEMBAGA', FALSE),
  ('KAPUS_KARAKTER_KONSELING_LPMPP', 'Kepala Pusat Pendidikan Karakter, Bimbingan Konseling, dan Layanan Psikologi', 'LPMPP', 'LEMBAGA_PUSAT', 'KEPALA_LEMBAGA', FALSE)
ON CONFLICT (position_code) DO UPDATE SET
  name = EXCLUDED.name,
  unit_id = EXCLUDED.unit_id,
  level = EXCLUDED.level,
  default_role_key = EXCLUDED.default_role_key,
  can_sign_policy = EXCLUDED.can_sign_policy;

COMMIT;

