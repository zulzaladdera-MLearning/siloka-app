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
        'PENGAWAS'           -- Level 3: Satuan Pengawas Internal (SPI) / Auditor
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
-- 4. TABEL MASTER USER (Seluruh Akun Pegawai & Operator Multi-Tenancy)
-- =============================================================================
CREATE TABLE IF NOT EXISTS master_user (
    id VARCHAR(50) PRIMARY KEY,                 -- ID unik (misal: 'usr-01' atau UUID)
    nip_nik VARCHAR(25) NOT NULL UNIQUE,         -- NIP ASN atau NIK Pegawai
    nama_lengkap VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,          -- Email kedinasan @unsil.ac.id
    password_hash VARCHAR(255) NOT NULL,
    unit_kerja_id VARCHAR(20) NOT NULL,          -- Relasi ke master_unit_kerja.kode_unit
    role role_user_enum NOT NULL,                -- Tingkat otoritas kedinasan
    role_level VARCHAR(50) NOT NULL,             -- Level teks (misal: 'Level 1: Pimpinan')
    role_label VARCHAR(100) NOT NULL,            -- Jabatan fungsional (misal: 'Dekan FKIP')
    avatar_url VARCHAR(255) NULL,
    is_signature_ready BOOLEAN DEFAULT FALSE,    -- Kesiapan sertifikat TTE BSrE
    is_active BOOLEAN DEFAULT TRUE,
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


-- =============================================================================
-- 5. TABEL MASTER KLASIFIKASI ARSIP (Kaidah Tata Naskah Dinas ANRI)
-- =============================================================================
CREATE TABLE IF NOT EXISTS master_klasifikasi_arsip (
    kode VARCHAR(10) PRIMARY KEY,                -- 'KU', 'PL', 'KR', 'PP', 'KP', 'HM'
    nama_klasifikasi VARCHAR(100) NOT NULL,
    keterangan TEXT NULL,
    is_active BOOLEAN DEFAULT TRUE
);


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
    kode_klasifikasi VARCHAR(10) NOT NULL,
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
        REFERENCES master_klasifikasi_arsip (kode) 
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
    kode_seri VARCHAR(50) NOT NULL UNIQUE,       -- Misal: 'KU.02.01', 'PP.02.00', 'KU.02.01.h'
    nama_seri VARCHAR(150) NOT NULL,
    retensi_aktif_tahun INT NOT NULL,            -- Jumlah tahun aktif
    retensi_inaktif_tahun INT NOT NULL,          -- Jumlah tahun inaktif
    status_akhir status_akhir_arsip_enum NOT NULL,
    is_safeguard_locked BOOLEAN DEFAULT FALSE,   -- TRUE jika berkas permanen (tidak boleh dihapus staf)
    jumlah_berkas INT DEFAULT 0,
    keterangan TEXT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);


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

