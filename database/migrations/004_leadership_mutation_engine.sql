-- =============================================================================
-- MIGRATION 004: LEADERSHIP MUTATION & DYNAMIC POSITION ASSIGNMENT ENGINE
-- Berdasarkan Peraturan Rektor UNSIL No. 3/2023 & SK Rektor No. 2803/2023
-- =============================================================================

BEGIN;

-- 0. Pastikan ekstensi pgcrypto tersedia untuk gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Enum Types: Status Penugasan Jabatan Struktural
DO $$ BEGIN
    CREATE TYPE assignment_status_enum AS ENUM ('DEFINITIF', 'PLT', 'PLH');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Pastikan tabel tbl_users memiliki kolom id UUID agar dapat direferensikan foreign key
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tbl_users' AND column_name = 'id'
    ) THEN
        ALTER TABLE tbl_users ADD COLUMN id UUID DEFAULT gen_random_uuid() UNIQUE;
        UPDATE tbl_users SET id = gen_random_uuid() WHERE id IS NULL;
    END IF;
END $$;

-- 2. Master Positions (Formasi SOTK Kampus)
CREATE TABLE IF NOT EXISTS tbl_positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    position_code VARCHAR(50) UNIQUE NOT NULL, -- e.g., 'REKTOR', 'DEKAN_FT', 'KASUBBAG_TU_FT'
    name VARCHAR(150) NOT NULL,
    unit_id VARCHAR(50) NOT NULL, -- e.g., 'FT', 'BKU', 'BAKPK', 'LPPM'
    default_role_key VARCHAR(50) NOT NULL, -- maps to document permission matrices
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Position Assignments (Tabel Mutasi & Kepemimpinan Dinamis)
CREATE TABLE IF NOT EXISTS tbl_position_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    position_id UUID NOT NULL REFERENCES tbl_positions(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES tbl_users(id) ON DELETE RESTRICT,
    status assignment_status_enum NOT NULL DEFAULT 'DEFINITIF',
    decree_number VARCHAR(120) NOT NULL, -- Nomor SK Rektor Pengangkatan
    start_date DATE NOT NULL,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_by UUID NOT NULL REFERENCES tbl_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure only ONE active occupant exists per position at any given timestamp
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_position_occupant 
ON tbl_position_assignments (position_id) 
WHERE (is_active = TRUE);

-- Index untuk mempercepat query user assignments aktif
CREATE INDEX IF NOT EXISTS idx_position_assignments_user_active 
ON tbl_position_assignments (user_id, is_active);

-- 4. Audit Log for Mutations
CREATE TABLE IF NOT EXISTS tbl_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action VARCHAR(50) NOT NULL,
    actor_id UUID NOT NULL REFERENCES tbl_users(id),
    target_user_id UUID REFERENCES tbl_users(id),
    details JSONB NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Seeding Data Formasi Master Positions (SOTK Universitas Siliwangi)
INSERT INTO tbl_positions (position_code, name, unit_id, default_role_key) VALUES
    ('REKTOR', 'Rektor Universitas Siliwangi', 'UN58', 'REKTOR'),
    ('WAREK_1', 'Wakil Rektor Bidang Akademik', 'UN58', 'WAREK'),
    ('WAREK_2', 'Wakil Rektor Bidang Keuangan dan Umum', 'UN58', 'WAREK'),
    ('WAREK_3', 'Wakil Rektor Bidang Kemahasiswaan dan Alumni', 'UN58', 'WAREK'),
    ('DEKAN_FT', 'Dekan Fakultas Teknik', 'FT', 'DEKAN'),
    ('WADEK_1_FT', 'Wakil Dekan Bidang Akademik FT', 'FT', 'WADEK'),
    ('WADEK_2_FT', 'Wakil Dekan Bidang Keuangan & Umum FT', 'FT', 'WADEK'),
    ('KAJUR_INFORMATIKA', 'Ketua Jurusan Informatika', 'FT', 'KAJUR_KAPRODI'),
    ('KAJUR_SIPIL', 'Ketua Jurusan Teknik Sipil', 'FT', 'KAJUR_KAPRODI'),
    ('KAJUR_ELEKTRO', 'Ketua Jurusan Teknik Elektro', 'FT', 'KAJUR_KAPRODI'),
    ('DEKAN_FKIP', 'Dekan Fakultas Keguruan dan Ilmu Pendidikan', 'FKIP', 'DEKAN'),
    ('DEKAN_FEB', 'Dekan Fakultas Ekonomi dan Bisnis', 'FEB', 'DEKAN'),
    ('DEKAN_FP', 'Dekan Fakultas Pertanian', 'FP', 'DEKAN'),
    ('DEKAN_FISIP', 'Dekan Fakultas Ilmu Sosial dan Ilmu Politik', 'FISIP', 'DEKAN'),
    ('DEKAN_FIK', 'Dekan Fakultas Ilmu Kesehatan', 'FIK', 'DEKAN'),
    ('DEKAN_FAI', 'Dekan Fakultas Agama Islam', 'FAI', 'DEKAN'),
    ('DIREKTUR_PASCA', 'Direktur Pascasarjana', 'PASCA', 'DEKAN'),
    ('KEPALA_BIRO_BKU', 'Kepala Biro Keuangan dan Umum', 'BKU', 'KEPALA_BIRO'),
    ('KEPALA_BIRO_BAKPK', 'Kepala Biro Akademik, Kemahasiswaan, Perencanaan, dan Kerjasama', 'BAKPK', 'KEPALA_BIRO'),
    ('KEPALA_LPPM', 'Kepala Lembaga Penelitian dan Pengabdian kepada Masyarakat', 'LPPM', 'KEPALA_LEMBAGA'),
    ('KEPALA_LP3M', 'Kepala Lembaga Pengembangan Pembelajaran & Penjaminan Mutu', 'LP3M', 'KEPALA_LEMBAGA'),
    ('KEPALA_SPI', 'Kepala Satuan Pengawas Internal', 'SPI', 'KEPALA_SPI')
ON CONFLICT (position_code) DO UPDATE SET
    name = EXCLUDED.name,
    unit_id = EXCLUDED.unit_id,
    default_role_key = EXCLUDED.default_role_key;

COMMIT;

