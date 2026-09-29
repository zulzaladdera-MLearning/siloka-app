-- ============================================================================
-- MIGRATION 014: SEED & SINKRONISASI AKUN DOSEN TANPA JABATAN (DOSEN BIASA)
-- Beserta 11 Template Wajib di Fitur "Buat Surat":
--   1. Nota Dinas
--   2. Surat Pernyataan
--   3. Laporan
--   4. Telaah Staf
--   5. Berita Acara
--   6. Notula
--   7. ST (Lembar)
--   8. ST (Kolom)
--   9. Surat Dinas
--  10. Surat Keterangan
--  11. Surat Pengantar
-- ============================================================================

BEGIN;

-- 1. Pastikan Role ID 7 pada tbl_roles adalah Dosen Tanpa Jabatan
UPDATE tbl_roles
SET nama_role = 'Dosen Tanpa Jabatan'
WHERE id_role = 7;

-- 2. Perbaiki mapping role pada tbl_user_roles untuk akun Dosen (aris.martono@unsil.ac.id & aris.test@unsil.ac.id)
DELETE FROM tbl_user_roles WHERE id_user IN (118, 201);

INSERT INTO tbl_user_roles (id_user, id_role)
SELECT id_user, 7 FROM tbl_users WHERE id_user IN (118, 201)
ON CONFLICT DO NOTHING;

-- 3. Sinkronisasi Akun Dosen Tanpa Jabatan ke master_user
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
) VALUES
(
  'usr-dosen-01',
  '198805212015041002',
  'dosen.ft@unsil.ac.id',
  'Dr. Aris Martono, S.T., M.Kom.',
  'dosen.ft@unsil.ac.id',
  '$2a$12$e8Yg3c7z3K9Y2k9jE9gX7O.7/2xM8wHwY7e4Y7m4k8h2z5x9l1a1b',
  'UN58.13',
  'DOSEN',
  'Level 3: Dosen Tanpa Jabatan',
  'Dosen Tanpa Jabatan',
  'Dosen Tanpa Jabatan',
  TRUE
),
(
  'usr-dosen-02',
  '198908142018032001',
  'dosen.fkip@unsil.ac.id',
  'Dr. Rina Herlina, S.Pd., M.Pd.',
  'dosen.fkip@unsil.ac.id',
  '$2a$12$e8Yg3c7z3K9Y2k9jE9gX7O.7/2xM8wHwY7e4Y7m4k8h2z5x9l1a1b',
  'UN58.10',
  'DOSEN',
  'Level 3: Dosen Tanpa Jabatan',
  'Dosen Tanpa Jabatan',
  'Dosen Tanpa Jabatan',
  TRUE
),
(
  'usr-dosen-if',
  '199008122019031008',
  'aris.martono@unsil.ac.id',
  'Dr. Aris Martono, M.Kom.',
  'aris.martono@unsil.ac.id',
  '$2a$12$e8Yg3c7z3K9Y2k9jE9gX7O.7/2xM8wHwY7e4Y7m4k8h2z5x9l1a1b',
  'UN58.13.1',
  'DOSEN',
  'Level 3: Dosen Tanpa Jabatan',
  'Dosen Tanpa Jabatan',
  'Dosen Tanpa Jabatan',
  TRUE
)
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
