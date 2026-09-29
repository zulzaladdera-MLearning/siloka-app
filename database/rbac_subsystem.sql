-- =============================================================================
-- SUBSISTEM RBAC & REGISTRASI PENGGUNA TERSTRUKTUR (SILOKA UNSIL)
-- Berdasarkan SK Rektor No. 2803 & Tata Kerja OTK Universitas Siliwangi
-- =============================================================================

BEGIN;

-- 1. TABEL MASTER ROLES
CREATE TABLE IF NOT EXISTS tbl_roles (
    id_role SERIAL PRIMARY KEY,
    nama_role VARCHAR(255) NOT NULL,
    deskripsi TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABEL PERMISSIONS PER ROLE
CREATE TABLE IF NOT EXISTS tbl_role_permissions (
    id SERIAL PRIMARY KEY,
    id_role INT NOT NULL REFERENCES tbl_roles(id_role) ON DELETE CASCADE,
    permission_key VARCHAR(100) NOT NULL,
    CONSTRAINT uq_role_permission UNIQUE (id_role, permission_key)
);

-- 3. TABEL PEMETAAN DEFAULT KLASTER PREFIX JRA PER ROLE
CREATE TABLE IF NOT EXISTS tbl_role_klasifikasi_access (
    id SERIAL PRIMARY KEY,
    id_role INT NOT NULL REFERENCES tbl_roles(id_role) ON DELETE CASCADE,
    prefix_jra VARCHAR(20) NOT NULL,
    deskripsi VARCHAR(100),
    CONSTRAINT uq_role_klasifikasi UNIQUE (id_role, prefix_jra)
);

-- 4. TABEL USERS KANONIK DENGAN MAX KEAMANAN & UNIT KERJA
CREATE TABLE IF NOT EXISTS tbl_users (
    id_user SERIAL PRIMARY KEY,
    nama_lengkap VARCHAR(150) NOT NULL,
    nip_nik VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    kode_unit_kerja VARCHAR(50) NOT NULL,
    max_keamanan_akses keamanan_type NOT NULL DEFAULT 'Biasa/Terbuka',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. TABEL PENGHUBUNG USER KE ROLE (BINDING ROLE)
CREATE TABLE IF NOT EXISTS tbl_user_roles (
    id SERIAL PRIMARY KEY,
    id_user INT NOT NULL REFERENCES tbl_users(id_user) ON DELETE CASCADE,
    id_role INT NOT NULL REFERENCES tbl_roles(id_role) ON DELETE CASCADE,
    CONSTRAINT uq_user_role UNIQUE (id_user, id_role)
);

-- 6. TABEL CUSTOM OVERRIDE PREFIX JRA PER USER (OPSIONAL)
CREATE TABLE IF NOT EXISTS tbl_user_custom_klasifikasi_access (
    id SERIAL PRIMARY KEY,
    id_user INT NOT NULL REFERENCES tbl_users(id_user) ON DELETE CASCADE,
    prefix_jra VARCHAR(20) NOT NULL,
    CONSTRAINT uq_user_custom_prefix UNIQUE (id_user, prefix_jra)
);

-- Indeks Performa
CREATE INDEX IF NOT EXISTS idx_users_nip_email ON tbl_users(nip_nik, email);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON tbl_user_roles(id_user);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON tbl_role_permissions(id_role);
CREATE INDEX IF NOT EXISTS idx_role_klasifikasi_role ON tbl_role_klasifikasi_access(id_role);

-- -----------------------------------------------------------------------------
-- SEED DATA DEFAULT ROLES, PERMISSIONS, & KLASTER JRA
-- -----------------------------------------------------------------------------

-- A. Daftarkan Role Baku
INSERT INTO tbl_roles (id_role, nama_role, deskripsi)
VALUES
    (1, 'Super Admin', 'Administrator Utama Sistem Informasi SILOKA UNSIL'),
    (2, 'Staf Keuangan', 'Pengelola Perbendaharaan, DIPA, SPJ, dan Verifikasi SPM'),
    (3, 'Staf Kepegawaian', 'Pengelola Layanan Mutasi, PAK Dosen, dan Administrasi ASN'),
    (4, 'Staf Administrasi Akademik', 'Pengelola Kurikulum, Registrasi Mahasiswa, dan Perkuliahan'),
    (5, 'Staf Umum & Kerumahtanggaan', 'Pengelola Pemeliharaan Sarana Gedung dan Logistik BMN'),
    (6, 'Arsiparis / Pengendali Surat', 'Petugas Buku Agenda Masuk, Ekspedisi, dan Akuisisi Arsip')
ON CONFLICT (id_role) DO UPDATE 
SET nama_role = EXCLUDED.nama_role,
    deskripsi = EXCLUDED.deskripsi;

SELECT setval('tbl_roles_id_role_seq', (SELECT MAX(id_role) FROM tbl_roles));

-- B. Daftarkan Permissions per Role
INSERT INTO tbl_role_permissions (id_role, permission_key)
VALUES
    -- Super Admin (Full Access)
    (1, 'admin:manage_users'),
    (1, 'surat:read'),
    (1, 'surat:create_draft'),
    (1, 'surat:agenda_access'),
    (1, 'keuangan:view'),
    (1, 'kepegawaian:view'),
    (1, 'arsip:read'),
    (1, 'arsip:manage'),

    -- Staf Keuangan
    (2, 'surat:read'),
    (2, 'surat:create_draft'),
    (2, 'keuangan:view'),
    (2, 'arsip:read'),

    -- Staf Kepegawaian
    (3, 'surat:read'),
    (3, 'surat:create_draft'),
    (3, 'kepegawaian:view'),
    (3, 'arsip:read'),

    -- Staf Administrasi Akademik
    (4, 'surat:read'),
    (4, 'surat:create_draft'),
    (4, 'arsip:read'),

    -- Staf Umum & Kerumahtanggaan
    (5, 'surat:read'),
    (5, 'surat:create_draft'),
    (5, 'arsip:read'),

    -- Arsiparis / Pengendali Surat
    (6, 'surat:read'),
    (6, 'surat:create_draft'),
    (6, 'surat:agenda_access'),
    (6, 'arsip:read'),
    (6, 'arsip:manage')
ON CONFLICT (id_role, permission_key) DO NOTHING;

-- C. Daftarkan Default Klaster Prefix JRA per Role
INSERT INTO tbl_role_klasifikasi_access (id_role, prefix_jra, deskripsi)
VALUES
    -- Super Admin
    (1, 'PP', 'Pendidikan dan Pengajaran'),
    (1, 'KU', 'Keuangan dan Anggaran'),
    (1, 'KP', 'Kepegawaian dan SDM'),
    (1, 'KR', 'Kerumahtanggaan dan Sarpras'),
    (1, 'HM', 'Humas dan Keprotokolan'),

    -- Staf Keuangan: KU dan PP.02.00 (Kelulusan/Ijazah/Keuangan Mahasiswa)
    (2, 'KU', 'Klaster Urusan Keuangan & Perbendaharaan'),
    (2, 'PP.02.00', 'Klaster Bebas Tanggungan & Registrasi Keuangan Akademik'),

    -- Staf Kepegawaian: KP
    (3, 'KP', 'Klaster Urusan Kepegawaian, Mutasi & SKP'),

    -- Staf Administrasi Akademik: PP
    (4, 'PP', 'Klaster Pendidikan, Pengajaran & Kurikulum'),

    -- Staf Umum: KR dan HM
    (5, 'KR', 'Klaster Kerumahtanggaan dan Aset BMN'),
    (5, 'HM', 'Klaster Humas dan Acara Dinas'),

    -- Arsiparis: Seluruh Klaster Utama
    (6, 'PP', 'Seluruh Berkas Akademik'),
    (6, 'KU', 'Seluruh Berkas Keuangan'),
    (6, 'KP', 'Seluruh Berkas Kepegawaian'),
    (6, 'KR', 'Seluruh Berkas Sarpras'),
    (6, 'HM', 'Seluruh Berkas Humas')
ON CONFLICT (id_role, prefix_jra) DO NOTHING;

-- D. Daftarkan Contoh Akun Pegawai Uji Sesuai Spesifikasi (Password: 'siloka123#')
-- Hash bcrypt untuk 'siloka123#': $2a$10$WpA1i6d9lFq4sL23xV7rI.7oT9yH.lC0jI7pM1wX9qZ8kY5tA6j3e
INSERT INTO tbl_users (id_user, nama_lengkap, nip_nik, email, password_hash, kode_unit_kerja, max_keamanan_akses)
VALUES
    (
        1, 
        'Super Administrator SILOKA', 
        '197001011995031001', 
        'admin@unsil.ac.id', 
        '$2b$10$owXb7ruqi7srlbEmoCofRO71rPqDnI4x7kPvra6pO5LtRQRqpjxkO', 
        'UN58', 
        'Sangat Rahasia'
    ),
    (
        104, 
        'Ahmad Fauzi, A.Md.', 
        '198801122015041001', 
        'fauzi.keuangan@unsil.ac.id', 
        '$2b$10$owXb7ruqi7srlbEmoCofRO71rPqDnI4x7kPvra6pO5LtRQRqpjxkO', 
        'BKU', 
        'Terbatas'
    ),
    (
        105, 
        'Rina Marlina, S.AP.', 
        '199005202016042001', 
        'rina.kepegawaian@unsil.ac.id', 
        '$2b$10$owXb7ruqi7srlbEmoCofRO71rPqDnI4x7kPvra6pO5LtRQRqpjxkO', 
        'BKU', 
        'Rahasia'
    ),
    (
        106, 
        'Budi Santoso, S.Kom.', 
        '198503142010011002', 
        'budi.arsip@unsil.ac.id', 
        '$2b$10$owXb7ruqi7srlbEmoCofRO71rPqDnI4x7kPvra6pO5LtRQRqpjxkO', 
        'BAKPK', 
        'Terbatas'
    )
ON CONFLICT (id_user) DO UPDATE 
SET nama_lengkap = EXCLUDED.nama_lengkap,
    email = EXCLUDED.email,
    kode_unit_kerja = EXCLUDED.kode_unit_kerja,
    max_keamanan_akses = EXCLUDED.max_keamanan_akses;

SELECT setval('tbl_users_id_user_seq', (SELECT MAX(id_user) FROM tbl_users));

-- Binding User ke Role
INSERT INTO tbl_user_roles (id_user, id_role)
VALUES
    (1, 1),   -- Super Admin
    (104, 2), -- Ahmad Fauzi -> Staf Keuangan
    (105, 3), -- Rina Marlina -> Staf Kepegawaian
    (106, 6)  -- Budi Santoso -> Arsiparis / Pengendali Surat
ON CONFLICT (id_user, id_role) DO NOTHING;

COMMIT;
