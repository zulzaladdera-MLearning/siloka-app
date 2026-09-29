-- ============================================================================
-- MIGRATION 013: SEED & SINKRONISASI AKUN REKTOR DAN WAKIL REKTOR (WAREK I, II, III)
-- Beserta Matriks Kewenangan Naskah Dinas (Tabel 1 Hal. 88-89 Peraturan Rektor No. 3/2023)
-- & Klasifikasi JRA/SKKAAD (SK Rektor Nomor 2803 Tahun 2023)
-- ============================================================================

BEGIN;

-- 1. Pastikan kolom username & jabatan tersedia pada master_user
ALTER TABLE master_user ADD COLUMN IF NOT EXISTS username VARCHAR(100);
ALTER TABLE master_user ADD COLUMN IF NOT EXISTS jabatan VARCHAR(150);

-- 2. Sinkronisasi Pejabat Struktural Rektorat (Rektor & 3 Wakil Rektor) pada master_pejabat
INSERT INTO master_pejabat (id, nip, nama, gelar, nama_gelar, jabatan, kode_unit, is_aktif)
VALUES
  (1, '196708161996031001', 'Prof. Dr. Eng. Ir. Aripin', 'IPU., ASEAN Eng.', 'Prof. Dr. Eng. Ir. Aripin, IPU., ASEAN Eng.', 'Rektor Universitas Siliwangi', 'UN58', TRUE),
  (2, '197005141997021001', 'Prof. Dr. Dedi Nurjamil', 'M.Pd.', 'Prof. Dr. Dedi Nurjamil, M.Pd.', 'Wakil Rektor Bidang Akademik', 'UN58', TRUE),
  (3, '197302212001121001', 'Dr. Gumilar Mulya', 'M.Pd.', 'Dr. Gumilar Mulya, M.Pd.', 'Wakil Rektor Bidang Keuangan dan Umum', 'UN58', TRUE),
  (4, '197204121998021001', 'Dr. Supratman', 'M.Pd.', 'Dr. Supratman, M.Pd.', 'Wakil Rektor Bidang Kemahasiswaan dan Alumni', 'UN58', TRUE)
ON CONFLICT (id) DO UPDATE SET
  nip = EXCLUDED.nip,
  nama = EXCLUDED.nama,
  gelar = EXCLUDED.gelar,
  nama_gelar = EXCLUDED.nama_gelar,
  jabatan = EXCLUDED.jabatan,
  kode_unit = EXCLUDED.kode_unit,
  is_aktif = TRUE;

-- 3. Sinkronisasi Akun Pengguna pada master_user
INSERT INTO master_user (
  id,
  nip_nik,
  username,
  nama_lengkap,
  email,
  password_hash,
  unit_kerja_id,
  role,
  role_level,
  role_label,
  jabatan,
  is_active
)
VALUES
  ('usr-01', '196708161996031001', 'aripin.rektor@unsil.ac.id', 'Prof. Dr. Eng. Ir. Aripin, IPU., ASEAN Eng.', 'aripin.rektor@unsil.ac.id', '$2a$12$e8Yg3c7z3K9Y2k9jE9gX7O.7/2xM8wHwY7e4Y7m4k8h2z5x9l1a1b', 'UN58', 'PEJABAT', 'Level 1: Pimpinan', 'Rektor Universitas Siliwangi', 'Rektor Universitas Siliwangi', TRUE),
  ('usr-warek-01', '197005141997021001', 'dedi.warek1@unsil.ac.id', 'Prof. Dr. Dedi Nurjamil, M.Pd.', 'dedi.warek1@unsil.ac.id', '$2a$12$e8Yg3c7z3K9Y2k9jE9gX7O.7/2xM8wHwY7e4Y7m4k8h2z5x9l1a1b', 'UN58', 'PEJABAT', 'Level 1: Pimpinan', 'Wakil Rektor Bidang Akademik', 'Wakil Rektor Bidang Akademik', TRUE),
  ('usr-warek-02', '197302212001121001', 'gumilar.warek2@unsil.ac.id', 'Dr. Gumilar Mulya, M.Pd.', 'gumilar.warek2@unsil.ac.id', '$2a$12$e8Yg3c7z3K9Y2k9jE9gX7O.7/2xM8wHwY7e4Y7m4k8h2z5x9l1a1b', 'UN58', 'PEJABAT', 'Level 1: Pimpinan', 'Wakil Rektor Bidang Keuangan dan Umum', 'Wakil Rektor Bidang Keuangan dan Umum', TRUE),
  ('usr-warek-03', '197204121998021001', 'supratman.warek3@unsil.ac.id', 'Dr. Supratman, M.Pd.', 'supratman.warek3@unsil.ac.id', '$2a$12$e8Yg3c7z3K9Y2k9jE9gX7O.7/2xM8wHwY7e4Y7m4k8h2z5x9l1a1b', 'UN58', 'PEJABAT', 'Level 1: Pimpinan', 'Wakil Rektor Bidang Kemahasiswaan dan Alumni', 'Wakil Rektor Bidang Kemahasiswaan dan Alumni', TRUE)
ON CONFLICT (id) DO UPDATE SET
  nip_nik = EXCLUDED.nip_nik,
  username = EXCLUDED.username,
  nama_lengkap = EXCLUDED.nama_lengkap,
  email = EXCLUDED.email,
  unit_kerja_id = EXCLUDED.unit_kerja_id,
  role = EXCLUDED.role,
  role_level = EXCLUDED.role_level,
  role_label = EXCLUDED.role_label,
  jabatan = EXCLUDED.jabatan,
  is_active = TRUE;

COMMIT;
