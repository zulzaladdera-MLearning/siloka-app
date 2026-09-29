-- =============================================================================
-- SUBSISTEM MATRIKS KEWENANGAN PENANDATANGANAN NASKAH DINAS (SILOKA UNSIL)
-- Berdasarkan Tabel 1 Peraturan Rektor Universitas Siliwangi No. 3 Tahun 2023
-- =============================================================================

-- 1. TABEL MATRIKS KEWENANGAN PENANDATANGANAN
CREATE TABLE IF NOT EXISTS tbl_matrix_kewenangan (
    id SERIAL PRIMARY KEY,
    kode_jenis_naskah VARCHAR(50) NOT NULL,
    nama_jenis_naskah VARCHAR(100) NOT NULL,
    role_penandatangan VARCHAR(50) NOT NULL,
    is_allowed BOOLEAN DEFAULT TRUE,
    catatan_kewenangan TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_matrix_jenis_role UNIQUE (kode_jenis_naskah, role_penandatangan)
);

CREATE INDEX IF NOT EXISTS idx_matrix_jenis ON tbl_matrix_kewenangan(kode_jenis_naskah);
CREATE INDEX IF NOT EXISTS idx_matrix_role ON tbl_matrix_kewenangan(role_penandatangan);

-- 3. SEEDING TABEL 1 MATRIKS KEWENANGAN PERATURAN REKTOR NO. 3 TAHUN 2023
-- A. KEWENANGAN DEKAN (Tepat 13 Jenis Naskah Dinas)
INSERT INTO tbl_matrix_kewenangan (kode_jenis_naskah, nama_jenis_naskah, role_penandatangan, is_allowed, catatan_kewenangan)
VALUES
    ('POS', 'Prosedur Operasional Standar (POS / SOP)', 'DEKAN', TRUE, 'Khusus pelaksanaan operasional di lingkungan fakultas'),
    ('SURAT_EDARAN', 'Surat Edaran', 'DEKAN', TRUE, 'Bersifat petunjuk pelaksanaan internal fakultas'),
    ('SURAT_TUGAS', 'Surat Tugas', 'DEKAN', TRUE, 'Penugasan dosen dan staf pelaksana lingkup fakultas'),
    ('NOTA_DINAS', 'Nota Dinas', 'DEKAN', TRUE, 'Komunikasi kedinasan internal antar pejabat/unit fakultas'),
    ('SURAT_DINAS', 'Surat Dinas', 'DEKAN', TRUE, 'Korespondensi resmi keluar fakultas atau antar unit'),
    ('SURAT_UNDANGAN', 'Surat Undangan', 'DEKAN', TRUE, 'Undangan rapat dinas dan koordinasi fakultas'),
    ('PKS_DN', 'Perjanjian Kerja Sama Dalam Negeri (PKS DN)', 'DEKAN', TRUE, 'Perjanjian operasional turunan MoU tingkat fakultas'),
    ('SURAT_KUASA', 'Surat Kuasa', 'DEKAN', TRUE, 'Pelimpahan wewenang khusus urusan internal fakultas'),
    ('BERITA_ACARA', 'Berita Acara', 'DEKAN', TRUE, 'Berita acara serah terima, yudisium, dan evaluasi fakultas'),
    ('SURAT_KETERANGAN', 'Surat Keterangan', 'DEKAN', TRUE, 'Keterangan akademik, keaktifan dosen/mahasiswa fakultas'),
    ('SURAT_PERNYATAAN', 'Surat Pernyataan', 'DEKAN', TRUE, 'Pernyataan resmi pejabat pimpinan fakultas'),
    ('SURAT_PENGANTAR', 'Surat Pengantar', 'DEKAN', TRUE, 'Pengantar berkas, usulan kenaikan jabatan, dan SPJ'),
    ('PENGUMUMAN', 'Pengumuman', 'DEKAN', TRUE, 'Pemberitahuan resmi sivitas akademika fakultas')
ON CONFLICT (kode_jenis_naskah, role_penandatangan) DO UPDATE
SET nama_jenis_naskah = EXCLUDED.nama_jenis_naskah,
    is_allowed = EXCLUDED.is_allowed,
    catatan_kewenangan = EXCLUDED.catatan_kewenangan;

-- B. KEWENANGAN KETUA JURUSAN / KOORPRODI (Tepat 7 Jenis Naskah Dinas)
INSERT INTO tbl_matrix_kewenangan (kode_jenis_naskah, nama_jenis_naskah, role_penandatangan, is_allowed, catatan_kewenangan)
VALUES
    ('NOTA_DINAS', 'Nota Dinas', 'KETUA_JURUSAN', TRUE, 'Komunikasi internal ke Dekan / Wadek atau antar dosen jurusan'),
    ('SURAT_DINAS', 'Surat Dinas', 'KETUA_JURUSAN', TRUE, 'Surat dinas pelaksanaan akademik lingkup jurusan'),
    ('SURAT_UNDANGAN', 'Surat Undangan', 'KETUA_JURUSAN', TRUE, 'Undangan rapat kurikulum, sidang skripsi, rapat dosen jurusan'),
    ('SURAT_KUASA', 'Surat Kuasa', 'KETUA_JURUSAN', TRUE, 'Kuasa koordinasi pelaksanaan teknis laboratorium / kepanitiaan'),
    ('SURAT_PERNYATAAN', 'Surat Pernyataan', 'KETUA_JURUSAN', TRUE, 'Pernyataan kesediaan mengajar, integritas, dan orisinalitas'),
    ('SURAT_PENGANTAR', 'Surat Pengantar', 'KETUA_JURUSAN', TRUE, 'Pengantar nilai ujian, usulan yudisium mahasiswa ke fakultas'),
    ('PENGUMUMAN', 'Pengumuman', 'KETUA_JURUSAN', TRUE, 'Pengumuman jadwal seminar, kerja praktik, bimbingan prodi')
ON CONFLICT (kode_jenis_naskah, role_penandatangan) DO UPDATE
SET nama_jenis_naskah = EXCLUDED.nama_jenis_naskah,
    is_allowed = EXCLUDED.is_allowed,
    catatan_kewenangan = EXCLUDED.catatan_kewenangan;

-- C. KEWENANGAN TINGKAT UNIVERSITAS (REKTOR & WAKIL REKTOR)
-- Dokumen tingkat universitas hanya boleh dibuat/ditandatangani jika lingkup universitas
INSERT INTO tbl_matrix_kewenangan (kode_jenis_naskah, nama_jenis_naskah, role_penandatangan, is_allowed, catatan_kewenangan)
VALUES
    ('PERATURAN', 'Peraturan Rektor', 'REKTOR', TRUE, 'Hanya oleh Rektor (Naskah Dinas Pengaturan Institusi)'),
    ('KEPUTUSAN', 'Keputusan Rektor', 'REKTOR', TRUE, 'Hanya oleh Rektor (Naskah Penetapan Hak/Kewajiban Pokok)'),
    ('INSTRUKSI', 'Instruksi Rektor', 'REKTOR', TRUE, 'Hanya oleh Rektor (Perintah Pelaksanaan Kebijakan)'),
    ('SURAT_PERINTAH', 'Surat Perintah', 'REKTOR', TRUE, 'Perintah penugasan strategis skala universitas'),
    ('MOU', 'Nota Kesepahaman (MoU)', 'REKTOR', TRUE, 'Kerja sama strategis kelembagaan nasional/internasional'),
    ('POS', 'Prosedur Operasional Standar (POS / SOP)', 'REKTOR', TRUE, 'Standar operasional baku universitas'),
    ('SURAT_EDARAN', 'Surat Edaran', 'REKTOR', TRUE, 'Edaran umum untuk seluruh sivitas akademika universitas'),
    ('SURAT_TUGAS', 'Surat Tugas', 'REKTOR', TRUE, 'Surat penugasan dinas luar kota/negeri pimpinan dan delegasi'),
    ('SURAT_DINAS', 'Surat Dinas', 'REKTOR', TRUE, 'Surat dinas eksternal universitas'),
    ('NOTA_DINAS', 'Nota Dinas', 'REKTOR', TRUE, 'Komunikasi nota pimpinan universitas ke bawahan'),
    ('SURAT_UNDANGAN', 'Surat Undangan', 'REKTOR', TRUE, 'Undangan dinas acara universitas'),
    ('SURAT_KETERANGAN', 'Surat Keterangan', 'REKTOR', TRUE, 'Keterangan kepegawaian/kelembagaan universitas'),
    ('PENGUMUMAN', 'Pengumuman', 'REKTOR', TRUE, 'Pengumuman resmi rektorat'),
    -- Wakil Rektor (Pelimpahan Wewenang)
    ('SURAT_TUGAS', 'Surat Tugas', 'WAREK', TRUE, 'Sesuai pelimpahan bidang tugas akademik/keuangan/kemahasiswaan'),
    ('SURAT_DINAS', 'Surat Dinas', 'WAREK', TRUE, 'Sesuai bidang tugas teknis universitas'),
    ('NOTA_DINAS', 'Nota Dinas', 'WAREK', TRUE, 'Nota dinas koordinasi universitas'),
    ('SURAT_UNDANGAN', 'Surat Undangan', 'WAREK', TRUE, 'Undangan rapat koordinasi bidang'),
    ('SURAT_KETERANGAN', 'Surat Keterangan', 'WAREK', TRUE, 'Keterangan bidang teknis yang dibawahi')
ON CONFLICT (kode_jenis_naskah, role_penandatangan) DO UPDATE
SET nama_jenis_naskah = EXCLUDED.nama_jenis_naskah,
    is_allowed = EXCLUDED.is_allowed,
    catatan_kewenangan = EXCLUDED.catatan_kewenangan;

-- 4. INTEGRASI HIERARKI OTK: Sub-Unit Jurusan Informatika & Pejabat Kajur
INSERT INTO master_unit_kerja (kode_unit, nama_unit, singkatan, tipe_unit, parent_kode, is_active)
VALUES 
    ('UN58.13.1', 'Jurusan Informatika Fakultas Teknik', 'IF', 'ORGAN', 'UN58.13', TRUE)
ON CONFLICT (kode_unit) DO UPDATE
SET nama_unit = EXCLUDED.nama_unit,
    singkatan = EXCLUDED.singkatan,
    parent_kode = EXCLUDED.parent_kode;

-- Tambahkan Pejabat Ketua Jurusan Informatika ke master_pejabat
INSERT INTO master_pejabat (id, nip, nama, gelar, nama_gelar, jabatan, kode_unit, is_aktif, is_active)
VALUES
    (201, '198704152014041002', 'Fredi Ganda Putra', 'M.Kom.', 'Fredi Ganda Putra, M.Kom.', 'Ketua Jurusan Informatika', 'UN58.13.1', TRUE, TRUE)
ON CONFLICT (nip) DO UPDATE
SET nama_gelar = EXCLUDED.nama_gelar,
    jabatan = EXCLUDED.jabatan,
    kode_unit = EXCLUDED.kode_unit,
    is_aktif = TRUE,
    is_active = TRUE;

-- Sinkronkan master_user / users untuk Dosen Informatika
INSERT INTO master_user (id, nip_nik, nama_lengkap, email, password_hash, unit_kerja_id, role, role_level, role_label, is_active)
VALUES
    ('usr-dosen-if', '199008122019031008', 'Dr. Aris Martono, M.Kom.', 'aris.martono@unsil.ac.id', '$2b$10$owXb7ruqi7srlbEmoCofRO71rPqDnI4x7kPvra6pO5LtRQRqpjxkO', 'UN58.13.1', 'DOSEN', 'Level 2: Fungsional Dosen', 'Dosen Jurusan Informatika (Tanpa Tugas Tambahan)', TRUE)
ON CONFLICT (nip_nik) DO UPDATE
SET unit_kerja_id = EXCLUDED.unit_kerja_id,
    role = EXCLUDED.role,
    role_label = EXCLUDED.role_label,
    is_active = TRUE;

-- Sinkronkan tbl_users (RBAC)
INSERT INTO tbl_users (id_user, nama_lengkap, nip_nik, email, password_hash, kode_unit_kerja, max_keamanan_akses, is_active)
VALUES
    (201, 'Dr. Aris Martono, M.Kom.', '199008122019031008', 'aris.martono@unsil.ac.id', '$2b$10$owXb7ruqi7srlbEmoCofRO71rPqDnI4x7kPvra6pO5LtRQRqpjxkO', 'UN58.13.1', 'Terbatas', TRUE)
ON CONFLICT (id_user) DO UPDATE
SET kode_unit_kerja = EXCLUDED.kode_unit_kerja,
    email = EXCLUDED.email;

-- Kaitkan ke role Dosen / Staf Akademik
INSERT INTO tbl_user_roles (id_user, id_role)
VALUES (201, 4)
ON CONFLICT DO NOTHING;
