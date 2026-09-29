-- =============================================================================
-- SISTEM INFORMASI LAYANAN ORGANISASI, KEARSIPAN, DAN ADMINISTRASI (SILOKA)
-- UNIVERSITAS SILIWANGI (UNSIL) - BIRO KEUANGAN DAN UMUM
-- =============================================================================
-- DATABASE ENGINE : PostgreSQL 15+
-- ENCODING        : UTF-8
-- STANDAR         : Tata Naskah Dinas Elektronik, BSrE BSSN, dan Kaidah ANRI
-- =============================================================================

-- 1. EXTENSIONS & EKSTENSI
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 2. TIPE DATA KHUSUS (ENUM TYPES)
-- =============================================================================

-- Tipe Unit Kerja berdasarkan Statuta UNSIL
DO $$ BEGIN
    CREATE TYPE tipe_unit_enum AS ENUM (
        'UNIVERSITAS',
        'ORGAN',
        'BIRO',
        'FAKULTAS',
        'LEMBAGA',
        'UPA'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Role Pengguna Terpadu (Master User)
DO $$ BEGIN
    CREATE TYPE role_user_enum AS ENUM (
        'PEJABAT',           -- Level 1: Pimpinan (Rektor, Dekan, Kepala Biro)
        'STAF_PERSURATAN',   -- Level 2: Pelaksana Administrasi Persuratan Biro/Unit
        'OPERATOR_UNIT',     -- Level 2: Operator Tata Usaha Unit Kerja / Fakultas
        'PENGAWAS',          -- Level 3: Satuan Pengawas Internal (SPI) / Auditor
        'DOSEN',             -- Level 2: Tenaga Pendidik / Fungsional Dosen
        'SUPER_ADMIN'        -- Level 0: Administrator Sistem Terpusat
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Kategori Keamanan Dokumen Kedinasan
DO $$ BEGIN
    CREATE TYPE kategori_keamanan_enum AS ENUM (
        'Biasa/Terbuka',
        'Terbatas',
        'Rahasia',
        'Sangat Rahasia'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Sifat Pengiriman Surat
DO $$ BEGIN
    CREATE TYPE sifat_surat_enum AS ENUM (
        'Biasa',
        'Penting',
        'Segera',
        'Amat Segera'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Kategori Naskah Dinas
DO $$ BEGIN
    CREATE TYPE kategori_surat_enum AS ENUM (
        'Surat Masuk',
        'Surat Keluar',
        'Nota Dinas'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Status Siklus Hidup Surat
DO $$ BEGIN
    CREATE TYPE status_surat_enum AS ENUM (
        'Draft',
        'Dikirim',
        'Dibaca',
        'Diparaf',
        'Disetujui',
        'Diarsipkan',
        'Ditolak'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Sifat Instruksi E-Disposisi
DO $$ BEGIN
    CREATE TYPE sifat_instruksi_enum AS ENUM (
        'Sangat Segera',
        'Segera',
        'Biasa',
        'Rahasia Internal'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Status Lembar Disposisi
DO $$ BEGIN
    CREATE TYPE status_disposisi_enum AS ENUM (
        'Menunggu Telaah',
        'Dalam Proses',
        'Selesai'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Status Jadwal Retensi Arsip (JRA)
DO $$ BEGIN
    CREATE TYPE status_arsip_enum AS ENUM (
        'Aktif',
        'Inaktif'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Status Akhir Nasib Berkas Arsip
DO $$ BEGIN
    CREATE TYPE status_akhir_arsip_enum AS ENUM (
        'Permanen',
        'Musnah',
        'Dinilai Kembali'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Jenis Tindakan Paraf Berjenjang & TTE
DO $$ BEGIN
    CREATE TYPE tindakan_paraf_enum AS ENUM (
        'Drafting',
        'Paraf',
        'Disetujui TTE',
        'Penolakan',
        'Revisi'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;


-- =============================================================================
-- 3. TABEL MASTER UNIT KERJA (21 Satuan Kerja Resmi UNSIL)
-- =============================================================================
CREATE TABLE IF NOT EXISTS master_unit_kerja (
    id SERIAL PRIMARY KEY,
    kode_unit VARCHAR(20) NOT NULL UNIQUE,       -- Digunakan pada rumus penomoran surat (misal: 'UN58.10')
    nama_unit VARCHAR(150) NOT NULL,
    singkatan VARCHAR(30) NOT NULL,
    tipe_unit tipe_unit_enum NOT NULL,
    parent_kode VARCHAR(20) NULL,                -- Relasi hierarkis ke unit induk ('UN58' atau NULL untuk root)
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_parent_unit FOREIGN KEY (parent_kode) 
        REFERENCES master_unit_kerja (kode_unit) 
        ON UPDATE CASCADE 
        ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_unit_tipe ON master_unit_kerja(tipe_unit);
CREATE INDEX IF NOT EXISTS idx_unit_parent ON master_unit_kerja(parent_kode);


-- =============================================================================
-- 4. TABEL MASTER USER KANONIK (Seluruh Akun Pegawai, Dosen, & Pejabat)
-- =============================================================================
CREATE TABLE IF NOT EXISTS master_user (
    id VARCHAR(50) PRIMARY KEY,                  -- ID unik akun (misal: 'usr-01' atau UUID)
    nip_nik VARCHAR(25) NOT NULL UNIQUE,          -- NIP ASN (18 digit) atau NIK Pegawai
    username VARCHAR(50) NOT NULL UNIQUE,        -- Username autentikasi (default: NIP)
    nama_lengkap VARCHAR(150) NOT NULL,          -- Nama lengkap beserta gelar resmi
    email VARCHAR(150) NOT NULL UNIQUE,           -- Email kedinasan @unsil.ac.id
    password_hash VARCHAR(255) NOT NULL,         -- Bcrypt hash password
    unit_kerja_id VARCHAR(20) NOT NULL,           -- Relasi ke master_unit_kerja.kode_unit
    role role_user_enum NOT NULL,                 -- PEJABAT, DOSEN, STAF_PERSURATAN, OPERATOR_UNIT, PENGAWAS, SUPER_ADMIN
    role_level VARCHAR(50) NOT NULL,              -- Level teks (misal: 'Level 1: Pimpinan', 'Level 2: Fungsional Dosen')
    role_label VARCHAR(150) NOT NULL,             -- Jabatan fungsional / struktural (misal: 'Dekan FKIP', 'Dosen Biasa')
    avatar_url VARCHAR(255) NULL,
    is_signature_ready BOOLEAN DEFAULT FALSE,     -- Kesiapan sertifikat TTE BSrE
    is_active BOOLEAN DEFAULT TRUE,
    must_change_password BOOLEAN DEFAULT FALSE,   -- Kewajiban ganti password saat login pertama
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_unit_kerja FOREIGN KEY (unit_kerja_id) 
        REFERENCES master_unit_kerja (kode_unit) 
        ON UPDATE CASCADE 
        ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_user_unit ON master_user(unit_kerja_id);
CREATE INDEX IF NOT EXISTS idx_user_role ON master_user(role);
CREATE INDEX IF NOT EXISTS idx_user_nip ON master_user(nip_nik);
CREATE INDEX IF NOT EXISTS idx_user_username ON master_user(username);

-- =============================================================================
-- 4B. TABEL STAGING SIMPEG (Impor Data Masif dari SIMPEG & Excel)
-- =============================================================================
CREATE TABLE IF NOT EXISTS stg_user_simpeg (
    id SERIAL PRIMARY KEY,
    nip_nik VARCHAR(25) NOT NULL UNIQUE,
    nama_lengkap VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    id_unit VARCHAR(20) NOT NULL,
    id_role VARCHAR(50) NOT NULL,
    password VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    must_change_password BOOLEAN DEFAULT TRUE,
    imported_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    merged_to_master BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_stg_simpeg_nip ON stg_user_simpeg(nip_nik);
CREATE INDEX IF NOT EXISTS idx_stg_simpeg_unit ON stg_user_simpeg(id_unit);

-- =============================================================================
-- 4C. VIEW KOMPATIBILITAS: USERS (Menjamin Kompatibilitas Query Modul Lama)
-- =============================================================================
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


-- =============================================================================
-- 4D. TABEL MASTER PEJABAT PENANDATANGAN (Automated Hierarchy Routing & TTE)
-- =============================================================================
CREATE TABLE IF NOT EXISTS master_pejabat (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) NULL,                            -- Relasi Foreign Key ke master_user(id)
    nip VARCHAR(30) NOT NULL UNIQUE,                     -- NIP resmi ASN pejabat penandatangan (18 digit)
    nama VARCHAR(100) NOT NULL,                          -- Nama pejabat tanpa gelar (misal: 'Dr. Nurul Hiron')
    gelar VARCHAR(50) NOT NULL,                          -- Gelar akademik/profesi (misal: 'S.T., M.Eng.')
    nama_gelar VARCHAR(150) NOT NULL,                    -- Nama lengkap beserta gelar resmi
    jabatan VARCHAR(150) NOT NULL,                       -- Jabatan struktural (misal: 'Dekan Fakultas Teknik')
    kode_unit VARCHAR(20) NOT NULL,                      -- Relasi ke master_unit_kerja.kode_unit
    status_plt_plh VARCHAR(10) NOT NULL DEFAULT 'DEFINITIF', -- 'DEFINITIF', 'PLT', 'PLH'
    is_penandatangan_default BOOLEAN DEFAULT FALSE,      -- TRUE untuk pimpinan utama satuan kerja
    tanggal_mulai DATE NULL DEFAULT '2024-01-01',        -- Tanggal awal masa jabatan
    tanggal_selesai DATE NULL,                           -- Tanggal akhir masa jabatan (NULL = masih menjabat)
    is_active BOOLEAN DEFAULT TRUE,                      -- Status keaktifan menjabat
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pejabat_unit FOREIGN KEY (kode_unit) 
        REFERENCES master_unit_kerja (kode_unit) 
        ON UPDATE CASCADE 
        ON DELETE RESTRICT,
    CONSTRAINT fk_pejabat_user FOREIGN KEY (user_id) 
        REFERENCES master_user (id) 
        ON UPDATE CASCADE 
        ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_pejabat_unit ON master_pejabat(kode_unit);
CREATE INDEX IF NOT EXISTS idx_pejabat_nip ON master_pejabat(nip);
CREATE INDEX IF NOT EXISTS idx_pejabat_user ON master_pejabat(user_id);
CREATE INDEX IF NOT EXISTS idx_pejabat_active ON master_pejabat(is_active);
CREATE INDEX IF NOT EXISTS idx_pejabat_status ON master_pejabat(status_plt_plh);


-- =============================================================================
-- 5. TABEL MASTER KLASIFIKASI ARSIP (Hierarkis 3 Level ANRI & UNSIL)
-- =============================================================================
CREATE TABLE IF NOT EXISTS master_klasifikasi_arsip (
    id SERIAL PRIMARY KEY,
    kode_klasifikasi VARCHAR(50) NOT NULL UNIQUE,        -- Contoh: 'PP', 'PP.00', 'PP.00.03'
    nama_klasifikasi VARCHAR(150) NOT NULL,              -- Label kategori
    keterangan_klasifikasi TEXT NOT NULL,                -- Rincian substansi urusan
    parent_id INT NULL,                                  -- Relasi hierarki ke id induk (Self-Referencing)
    level SMALLINT NOT NULL DEFAULT 1,                   -- 1: Pokok, 2: Sub-Klasifikasi, 3: Sub-sub Klasifikasi
    kode VARCHAR(10) NULL,                               -- Rujukan singkatan (misal: 'PP', 'KU')
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_klasifikasi_parent FOREIGN KEY (parent_id) 
        REFERENCES master_klasifikasi_arsip (id) 
        ON UPDATE CASCADE 
        ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_klasifikasi_kode ON master_klasifikasi_arsip(kode_klasifikasi);
CREATE INDEX IF NOT EXISTS idx_klasifikasi_parent ON master_klasifikasi_arsip(parent_id);
CREATE INDEX IF NOT EXISTS idx_klasifikasi_level ON master_klasifikasi_arsip(level);


-- =============================================================================
-- 5B. TABEL TRANSAKSI SURAT KELUAR (Manajemen Nomor Surat Otomatis & Concurrency)
-- =============================================================================
CREATE TABLE IF NOT EXISTS trx_surat_keluar (
    id_surat SERIAL PRIMARY KEY,
    nomor_urut INT NOT NULL,                             -- Nomor urut berurutan per tahun (misal: 1, 2, 3)
    nomor_surat_lengkap VARCHAR(150) NOT NULL UNIQUE,   -- [nomor_urut]/[unit]/[keamanan]/[klasifikasi]/[tahun]
    tingkat_keamanan VARCHAR(10) NOT NULL,               -- 'B' (Biasa), 'R' (Rahasia), 'SR' (Sangat Rahasia)
    kode_klasifikasi VARCHAR(50) NOT NULL,               -- Kode klasifikasi arsip (misal: 'PP.00.03')
    perihal TEXT NOT NULL,
    tujuan VARCHAR(255) NOT NULL,
    tahun INT NOT NULL,                                  -- Tahun anggaran berjalan (misal: 2026)
    unit_kerja_id VARCHAR(20) NOT NULL DEFAULT 'UN58',   -- Kode unit kerja penerbit (misal: 'UN58.10')
    created_by_user_id VARCHAR(50) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tahun_nomor_urut UNIQUE (tahun, nomor_urut)
);

CREATE INDEX IF NOT EXISTS idx_surat_keluar_tahun_nomor ON trx_surat_keluar(tahun, nomor_urut);
CREATE INDEX IF NOT EXISTS idx_surat_keluar_unit ON trx_surat_keluar(unit_kerja_id);


-- =============================================================================
-- 6. TABEL UTAMA: NASKAH DINAS (SURAT MASUK, KELUAR, DAN NOTA DINAS)
-- =============================================================================
CREATE TABLE IF NOT EXISTS naskah_dinas (
    id VARCHAR(50) PRIMARY KEY,                  -- Misal: 'SRT-2026-0871'
    nomor_surat VARCHAR(120) NOT NULL UNIQUE,    -- Rumus: [No]/[kode_unit]/[Klasifikasi]/[Tahun]
    nomor_surat_asal VARCHAR(120) DEFAULT '-',   -- Rujukan surat nomor asal dari pihak eksternal
    nomor_urut_seq VARCHAR(10) NOT NULL,         -- Nomor urut pendaftaran (misal: '0871')
    tanggal DATE NOT NULL,
    perihal VARCHAR(255) NOT NULL,
    kategori kategori_surat_enum NOT NULL DEFAULT 'Surat Keluar',
    sifat sifat_surat_enum NOT NULL DEFAULT 'Biasa',
    kategori_keamanan kategori_keamanan_enum NOT NULL DEFAULT 'Biasa/Terbuka',
    kode_klasifikasi VARCHAR(50) NOT NULL,
    sub_klasifikasi VARCHAR(50) NOT NULL,        -- Misal: 'KU.01.00'
    asal_pengirim VARCHAR(150) NOT NULL,
    tujuan_penerima VARCHAR(150) NOT NULL,
    alamat_tujuan VARCHAR(150) DEFAULT 'Di Tempat',
    status status_surat_enum NOT NULL DEFAULT 'Dikirim',
    status_timestamp VARCHAR(100) DEFAULT 'Baru saja diinput staf',
    
    -- Konten Naskah Dinas
    kalimat_pembuka TEXT NULL,
    isi_pokok TEXT NULL,
    kalimat_penutup TEXT NULL,
    ringkasan TEXT NOT NULL,
    lampiran VARCHAR(255) DEFAULT '1 (satu) Berkas',
    
    -- Validasi Tanda Tangan Elektronik (TTE) BSrE BSSN
    tte_verified BOOLEAN DEFAULT FALSE,
    tte_sign_date TIMESTAMPTZ NULL,
    tte_signed_by_user_id VARCHAR(50) NULL,
    tembusan TEXT NULL,                          -- Daftar tembusan naskah
    
    -- Berkas Lampiran Pindaian PDF
    file_path VARCHAR(255) NULL,
    file_size_mb NUMERIC(6,2) DEFAULT 2.40,
    file_hash_sha256 VARCHAR(64) NULL,
    
    -- Multi-Tenancy Scoping & Audit
    unit_kerja_id VARCHAR(20) NOT NULL,
    created_by_user_id VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_surat_unit FOREIGN KEY (unit_kerja_id) 
        REFERENCES master_unit_kerja (kode_unit) 
        ON UPDATE CASCADE 
        ON DELETE RESTRICT,
    CONSTRAINT fk_surat_creator FOREIGN KEY (created_by_user_id) 
        REFERENCES master_user (id) 
        ON UPDATE CASCADE 
        ON DELETE RESTRICT,
    CONSTRAINT fk_surat_signer FOREIGN KEY (tte_signed_by_user_id) 
        REFERENCES master_user (id) 
        ON UPDATE CASCADE 
        ON DELETE SET NULL,
    CONSTRAINT fk_surat_klasifikasi FOREIGN KEY (kode_klasifikasi) 
        REFERENCES master_klasifikasi_arsip (kode_klasifikasi) 
        ON UPDATE CASCADE 
        ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_naskah_unit ON naskah_dinas(unit_kerja_id);
CREATE INDEX IF NOT EXISTS idx_naskah_klasifikasi ON naskah_dinas(kode_klasifikasi);
CREATE INDEX IF NOT EXISTS idx_naskah_keamanan ON naskah_dinas(kategori_keamanan);
CREATE INDEX IF NOT EXISTS idx_naskah_status ON naskah_dinas(status);
CREATE INDEX IF NOT EXISTS idx_naskah_tanggal ON naskah_dinas(tanggal);


-- =============================================================================
-- 7. TABEL E-DISPOSISI (Pengendalian Instruksi Pimpinan)
-- =============================================================================
CREATE TABLE IF NOT EXISTS disposisi (
    id VARCHAR(50) PRIMARY KEY,                  -- Misal: 'DSP-2026-001'
    surat_id VARCHAR(50) NOT NULL,
    nomor_agenda VARCHAR(50) NOT NULL UNIQUE,    -- Misal: 'AGD/2026/0142'
    pemberi_user_id VARCHAR(50) NOT NULL,
    pemberi_nama VARCHAR(150) NOT NULL,
    penerima_tujuan VARCHAR(150) NOT NULL,       -- Unit atau nama pejabat penerima
    sifat_instruksi sifat_instruksi_enum NOT NULL DEFAULT 'Biasa',
    instruksi TEXT NOT NULL,                     -- Tindak lanjut instruksi pimpinan
    catatan_khusus TEXT NULL,
    tanggal_disposisi DATE NOT NULL,
    batas_waktu DATE NOT NULL,
    status status_disposisi_enum NOT NULL DEFAULT 'Dalam Proses',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_disposisi_surat FOREIGN KEY (surat_id) 
        REFERENCES naskah_dinas (id) 
        ON UPDATE CASCADE 
        ON DELETE CASCADE,
    CONSTRAINT fk_disposisi_pemberi FOREIGN KEY (pemberi_user_id) 
        REFERENCES master_user (id) 
        ON UPDATE CASCADE 
        ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_disp_surat ON disposisi(surat_id);
CREATE INDEX IF NOT EXISTS idx_disp_status ON disposisi(status);


-- =============================================================================
-- 8. TABEL RIWAYAT PARAF BERJENJANG & PENGAWASAN
-- =============================================================================
CREATE TABLE IF NOT EXISTS riwayat_paraf_tte (
    id SERIAL PRIMARY KEY,
    surat_id VARCHAR(50) NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    tahap_ke INT NOT NULL DEFAULT 1,
    jenis_tindakan tindakan_paraf_enum NOT NULL DEFAULT 'Paraf',
    nama_petugas VARCHAR(150) NOT NULL,
    jabatan_petugas VARCHAR(100) NOT NULL,
    catatan_telaah TEXT NULL,
    stempel_waktu TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_paraf_surat FOREIGN KEY (surat_id) 
        REFERENCES naskah_dinas (id) 
        ON UPDATE CASCADE 
        ON DELETE CASCADE,
    CONSTRAINT fk_paraf_user FOREIGN KEY (user_id) 
        REFERENCES master_user (id) 
        ON UPDATE CASCADE 
        ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_paraf_surat ON riwayat_paraf_tte(surat_id);


-- =============================================================================
-- 9. TABEL LOG AUDIT & JEJAK KEAMANAN (BSSN & SPI Compliance)
-- =============================================================================
CREATE TABLE IF NOT EXISTS log_audit_keamanan (
    id VARCHAR(50) PRIMARY KEY,                  -- Misal: 'LOG-001'
    timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_id VARCHAR(50) NOT NULL,
    nama_user VARCHAR(150) NOT NULL,
    role VARCHAR(50) NOT NULL,
    unit_kerja_id VARCHAR(20) NOT NULL,
    unit_kerja_name VARCHAR(150) NOT NULL,
    action VARCHAR(100) NOT NULL,                -- 'LOGIN', 'CREATE_LETTER', 'TTE_SIGN', dll.
    target_id VARCHAR(100) NOT NULL,             -- Nomor surat atau ID dokumen
    details TEXT NOT NULL,
    ip_address VARCHAR(45) NOT NULL DEFAULT '10.58.12.44',
    metadata JSONB NULL,                         -- Metadata fleksibel tambahan
    CONSTRAINT fk_audit_unit FOREIGN KEY (unit_kerja_id) 
        REFERENCES master_unit_kerja (kode_unit) 
        ON UPDATE CASCADE 
        ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_audit_unit ON log_audit_keamanan(unit_kerja_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON log_audit_keamanan(action);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON log_audit_keamanan(timestamp DESC);


-- =============================================================================
-- 10. TABEL JADWAL RETENSI ARSIP (JRA) DAN FOLDER KUNCI SAFEGUARD
-- =============================================================================
CREATE TABLE IF NOT EXISTS jadwal_retensi_arsip (
    id SERIAL PRIMARY KEY,
    klasifikasi_id INT NULL,                     -- Relasi Foreign Key ke master_klasifikasi_arsip(id)
    kode_seri VARCHAR(50) NOT NULL UNIQUE,       -- Misal: 'KU.02.01', 'PP.02.00', 'KU.02.01.h'
    nama_seri VARCHAR(150) NOT NULL,
    retensi_aktif_tahun INT NOT NULL,            -- Jumlah tahun aktif
    retensi_inaktif_tahun INT NOT NULL,          -- Jumlah tahun inaktif
    status_akhir status_akhir_arsip_enum NOT NULL,
    is_safeguard_locked BOOLEAN DEFAULT FALSE,   -- TRUE jika berkas permanen (tidak boleh dihapus staf)
    jumlah_berkas INT DEFAULT 0,
    keterangan TEXT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_jra_klasifikasi FOREIGN KEY (klasifikasi_id)
        REFERENCES master_klasifikasi_arsip (id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_jra_klasifikasi ON jadwal_retensi_arsip(klasifikasi_id);


-- =============================================================================
-- 11. TABEL BRANKAS DIGITAL KEARSIPAN VITAL (ENKRIPSI AES-256)
-- =============================================================================
CREATE TABLE IF NOT EXISTS brankas_digital_vital (
    id SERIAL PRIMARY KEY,
    nama_dokumen VARCHAR(255) NOT NULL,
    kategori VARCHAR(100) NOT NULL,              -- 'Aset Vital BMN', 'Perjanjian Hukum', 'Regulasi'
    file_path VARCHAR(255) NOT NULL,
    ukuran_mb NUMERIC(8,2) NOT NULL,
    kriptografi VARCHAR(50) DEFAULT 'AES-256',
    hash_sha256 VARCHAR(64) NOT NULL,
    tingkat_akses VARCHAR(100) NOT NULL,         -- 'Kepala Biro Only', 'Pimpinan & Tim Hukum'
    is_verified BOOLEAN DEFAULT TRUE,
    uploaded_by_user_id VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_brankas_uploader FOREIGN KEY (uploaded_by_user_id) 
        REFERENCES master_user (id) 
        ON UPDATE CASCADE 
        ON DELETE RESTRICT
);


-- =============================================================================
-- 12. FUNGSI DAN TRIGGER OTOMATISASI TIMESTAMP (PostgreSQL Function)
-- =============================================================================
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp_master_unit_kerja ON master_unit_kerja;
CREATE TRIGGER set_timestamp_master_unit_kerja
BEFORE UPDATE ON master_unit_kerja
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_master_user ON master_user;
CREATE TRIGGER set_timestamp_master_user
BEFORE UPDATE ON master_user
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_master_pejabat ON master_pejabat;
CREATE TRIGGER set_timestamp_master_pejabat
BEFORE UPDATE ON master_pejabat
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_naskah_dinas ON naskah_dinas;
CREATE TRIGGER set_timestamp_naskah_dinas
BEFORE UPDATE ON naskah_dinas
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_disposisi ON disposisi;
CREATE TRIGGER set_timestamp_disposisi
BEFORE UPDATE ON disposisi
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();


-- =============================================================================
-- 13. VIEW: RINGKASAN SURAT LENGKAP DENGAN DATA SATKER & PEMBUAT
-- =============================================================================
CREATE OR REPLACE VIEW v_surat_lengkap AS
SELECT 
    n.id,
    n.nomor_surat,
    n.nomor_surat_asal,
    n.tanggal,
    n.perihal,
    n.kategori,
    n.sifat,
    n.kategori_keamanan,
    n.kode_klasifikasi,
    n.sub_klasifikasi,
    n.asal_pengirim,
    n.tujuan_penerima,
    n.status,
    n.tte_verified,
    n.lampiran,
    n.unit_kerja_id,
    u.nama_unit AS nama_unit_kerja,
    u.singkatan AS singkatan_unit_kerja,
    u.tipe_unit,
    usr.nama_lengkap AS pembuat_surat,
    usr.nip_nik AS nip_pembuat,
    usr.role AS role_pembuat,
    n.created_at
FROM naskah_dinas n
JOIN master_unit_kerja u ON n.unit_kerja_id = u.kode_unit
JOIN master_user usr ON n.created_by_user_id = usr.id;


-- =============================================================================
-- 14. TABEL EVENT LOG PROCESS MINING (Data Science & Bottleneck Detection)
-- Standar: IEEE XES (Extensible Event Stream) / PM4Py / Disco / Celonis
-- Dikelola Khusus oleh Unit Penunjang Akademik Teknologi Informasi & Komunikasi (UPA TIK)
-- =============================================================================
CREATE TABLE IF NOT EXISTS trx_process_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id VARCHAR(100) NOT NULL,               -- Trace ID: Pengikat siklus naskah dinas (misal: 'SRT-2026-0871')
    activity_name VARCHAR(150) NOT NULL,        -- Nama aktivitas baku terstandar (misal: 'Pengajuan Draf Surat')
    timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, -- Waktu eksekusi aksi (presisi detik/milidetik ISO 8601)
    resource_name VARCHAR(255) NOT NULL,        -- Aktor pengeksekusi: Nama Lengkap & Jabatan Kedinasan
    resource_group VARCHAR(150) NOT NULL,       -- Kelompok sumber daya: Kode & Nama Unit Kerja (misal: 'UN58.10 - FKIP')
    lifecycle_transition VARCHAR(50) NOT NULL DEFAULT 'COMPLETE', -- 'START', 'COMPLETE', 'SCHEDULE', 'SUSPEND', 'RESUME', 'ABORT'
    metadata JSONB NULL,                         -- Atribut kontekstual (SLA, sifat, keamanan, tujuan, nomor agenda, TTE)
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_process_log_case_id ON trx_process_log(case_id);
CREATE INDEX IF NOT EXISTS idx_process_log_activity ON trx_process_log(activity_name);
CREATE INDEX IF NOT EXISTS idx_process_log_timestamp ON trx_process_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_process_log_resource_group ON trx_process_log(resource_group);
CREATE INDEX IF NOT EXISTS idx_process_log_metadata_gin ON trx_process_log USING gin(metadata);
