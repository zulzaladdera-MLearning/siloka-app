-- =============================================================================
-- MIGRASI 001: UNIFIKASI TABEL PENGGUNA (SILOKA UNSIL)
-- =============================================================================
-- Deskripsi:
-- 1. Menambahkan nilai 'DOSEN' dan 'SUPER_ADMIN' ke enum role_user_enum
-- 2. Menyelaraskan struktur master_user (menambah kolom username, pemetaan role_level & role_label)
-- 3. Memindahkan seluruh data dari tabel 'users' ke 'master_user'
-- 4. Mengubah tabel 'tm_user' menjadi staging table 'stg_user_simpeg' untuk impor SIMPEG/Excel
-- 5. Menghapus tabel 'users' yang redundan (status pejabat diturunkan secara dinamis)
-- =============================================================================

BEGIN;

-- 1. Penambahan Nilai Enum Role Pengguna
DO $$ 
BEGIN
    ALTER TYPE role_user_enum ADD VALUE IF NOT EXISTS 'DOSEN';
    ALTER TYPE role_user_enum ADD VALUE IF NOT EXISTS 'SUPER_ADMIN';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

COMMIT;

-- Transaksi baru setelah penambahan ENUM (PostgreSQL mensyaratkan commit sebelum menggunakan enum baru di DDL/DML)
BEGIN;

-- 2. Memastikan Kolom username Ada pada master_user
ALTER TABLE master_user 
    ADD COLUMN IF NOT EXISTS username VARCHAR(50);

-- Isi username default dari nip_nik jika masih kosong
UPDATE master_user 
SET username = nip_nik 
WHERE username IS NULL;

-- Beri constraint UNIQUE pada username jika belum ada
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_master_user_username'
    ) THEN
        ALTER TABLE master_user ADD CONSTRAINT uq_master_user_username UNIQUE (username);
    END IF;
END $$;

-- 3. Migrasi Data dari Tabel 'users' ke 'master_user' (jika tabel users ada)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'users'
    ) THEN
        -- Insert atau Update data dari users ke master_user
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
            is_active,
            must_change_password,
            created_at,
            updated_at
        )
        SELECT 
            u.id,
            u.nip,
            COALESCE(u.username, u.nip),
            u.nama,
            u.email,
            u.password,
            u.kode_unit,
            CASE 
                WHEN UPPER(u.role) = 'PEJABAT' THEN 'PEJABAT'::role_user_enum
                WHEN UPPER(u.role) = 'OPERATOR_UNIT' THEN 'OPERATOR_UNIT'::role_user_enum
                WHEN UPPER(u.role) = 'PENGAWAS' THEN 'PENGAWAS'::role_user_enum
                WHEN UPPER(u.role) = 'STAF_PERSURATAN' THEN 'STAF_PERSURATAN'::role_user_enum
                WHEN UPPER(u.role) = 'SUPER ADMIN' OR UPPER(u.role) = 'SUPER_ADMIN' THEN 'SUPER_ADMIN'::role_user_enum
                ELSE 'DOSEN'::role_user_enum
            END,
            CASE 
                WHEN UPPER(u.role) = 'PEJABAT' THEN 'Level 1: Pimpinan'
                WHEN UPPER(u.role) = 'PENGAWAS' THEN 'Level 3: Pengawas'
                WHEN UPPER(u.role) = 'DOSEN' OR u.role IS NULL THEN 'Level 2: Fungsional Dosen'
                ELSE 'Level 2: Pelaksana (Staf)'
            END,
            -- Kolom jabatan dari users dipetakan ke role_label di master_user
            COALESCE(NULLIF(TRIM(u.jabatan), ''), 'Dosen'),
            COALESCE(u.is_active, TRUE),
            COALESCE(u.must_change_password, FALSE),
            COALESCE(u.created_at, CURRENT_TIMESTAMP),
            COALESCE(u.updated_at, CURRENT_TIMESTAMP)
        FROM users u
        ON CONFLICT (nip_nik) DO UPDATE 
        SET 
            username = EXCLUDED.username,
            nama_lengkap = EXCLUDED.nama_lengkap,
            email = EXCLUDED.email,
            unit_kerja_id = EXCLUDED.unit_kerja_id,
            role = EXCLUDED.role,
            role_level = EXCLUDED.role_level,
            role_label = EXCLUDED.role_label,
            is_active = EXCLUDED.is_active,
            updated_at = CURRENT_TIMESTAMP;

        RAISE NOTICE 'Migrasi data dari tabel users ke master_user berhasil.';
    END IF;
END $$;

-- 4. Restrukturisasi Tabel Staging: tm_user -> stg_user_simpeg
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'tm_user'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'stg_user_simpeg'
    ) THEN
        ALTER TABLE tm_user RENAME TO stg_user_simpeg;
        RAISE NOTICE 'Tabel tm_user berhasil diubah namanya menjadi stg_user_simpeg.';
    END IF;
END $$;

-- Pastikan tabel stg_user_simpeg memiliki atribut pelacak impor
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'stg_user_simpeg'
    ) THEN
        ALTER TABLE stg_user_simpeg 
            ADD COLUMN IF NOT EXISTS imported_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            ADD COLUMN IF NOT EXISTS merged_to_master BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- 5. Hapus Tabel users Fisik dan Ganti dengan Compatibility VIEW ke master_user
DROP TABLE IF EXISTS users CASCADE;

CREATE OR REPLACE VIEW users AS
SELECT 
    id,
    nip_nik AS nip,
    username,
    nama_lengkap AS nama,
    nama_lengkap,
    email,
    unit_kerja_id AS kode_unit,
    unit_kerja_id,
    role_label AS jabatan,
    (role = 'PEJABAT') AS is_pejabat,
    password_hash AS password,
    password_hash,
    role::text AS role,
    role_level AS "roleLevel",
    role_label AS "roleLabel",
    is_signature_ready AS "signatureReady",
    is_active,
    must_change_password,
    created_at,
    updated_at
FROM master_user;

-- INSTEAD OF UPDATE trigger pada VIEW users untuk memetakan update ke master_user
CREATE OR REPLACE FUNCTION trg_instead_of_users_update()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE master_user
    SET 
        unit_kerja_id = COALESCE(NEW.kode_unit, NEW.unit_kerja_id, unit_kerja_id),
        email = COALESCE(NEW.email, email),
        role = COALESCE(NEW.role::role_user_enum, role),
        role_label = COALESCE(NEW.jabatan, role_label),
        password_hash = COALESCE(NEW.password, NEW.password_hash, password_hash),
        is_active = COALESCE(NEW.is_active, is_active),
        updated_at = NOW()
    WHERE id = OLD.id OR nip_nik = OLD.nip OR username = OLD.username;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_update ON users;
CREATE TRIGGER trg_users_update
INSTEAD OF UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION trg_instead_of_users_update();

-- INSTEAD OF INSERT trigger pada VIEW users untuk memetakan insert ke master_user
CREATE OR REPLACE FUNCTION trg_instead_of_users_insert()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO master_user (
        id, nip_nik, username, nama_lengkap, email, password_hash,
        unit_kerja_id, role, role_level, role_label, is_active, must_change_password
    )
    VALUES (
        NEW.id,
        NEW.nip,
        COALESCE(NEW.username, NEW.nip),
        COALESCE(NEW.nama, NEW.nama_lengkap),
        NEW.email,
        COALESCE(NEW.password, NEW.password_hash),
        COALESCE(NEW.kode_unit, NEW.unit_kerja_id),
        COALESCE(NEW.role::role_user_enum, 'DOSEN'::role_user_enum),
        CASE 
            WHEN NEW.role = 'PEJABAT' THEN 'Level 1: Pimpinan'
            WHEN NEW.role = 'PENGAWAS' THEN 'Level 3: Pengawas'
            WHEN NEW.role = 'DOSEN' THEN 'Level 2: Fungsional Dosen'
            ELSE 'Level 2: Pelaksana (Staf)'
        END,
        COALESCE(NEW.jabatan, 'Pegawai'),
        COALESCE(NEW.is_active, TRUE),
        COALESCE(NEW.must_change_password, TRUE)
    )
    ON CONFLICT (nip_nik) DO UPDATE 
    SET 
        nama_lengkap = EXCLUDED.nama_lengkap,
        email = EXCLUDED.email,
        unit_kerja_id = EXCLUDED.unit_kerja_id,
        role = EXCLUDED.role,
        role_label = EXCLUDED.role_label,
        is_active = EXCLUDED.is_active,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_insert ON users;
CREATE TRIGGER trg_users_insert
INSTEAD OF INSERT ON users
FOR EACH ROW EXECUTE FUNCTION trg_instead_of_users_insert();

COMMIT;
