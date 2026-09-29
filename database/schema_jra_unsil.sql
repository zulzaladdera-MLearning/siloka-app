-- =============================================================================
-- BASIS DATA RESMI SILOKA - UNIVERSITAS SILIWANGI (UNSIL)
-- SK Rektor No. 2803: Pedoman Jadwal Retensi Arsip (JRA) & Tata Naskah Dinas
-- =============================================================================
-- Arsitektur : 3-Tier Hierarchical Archival Master Data & Transactional Control
-- Target DBMS: PostgreSQL 15+ (Production Ready DDL)
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. POSTGRESQL TYPE ENUM DEFINITIONS (Strict Data Integrity)
-- -----------------------------------------------------------------------------
-- Menggunakan native PostgreSQL ENUM untuk menjamin konsistensi data di level engine
-- serta mengeliminasi potensi anomali teks bebas pada atribut-atribut regulatori.
-- -----------------------------------------------------------------------------

DO $$ 
BEGIN
    -- Klasifikasi Urusan: Substantif (Fungsi Pokok PT/Tridharma) vs Fasilitatif (Penunjang Operasional)
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'klasifikasi_type') THEN
        CREATE TYPE klasifikasi_type AS ENUM ('Substantif', 'Fasilitatif');
    END IF;

    -- Keterangan Nasib Akhir Berkas setelah melewati masa retensi inaktif
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'keterangan_akhir_type') THEN
        CREATE TYPE keterangan_akhir_type AS ENUM ('Musnah', 'Permanen', 'Dinilai Kembali');
    END IF;

    -- Tingkat Keamanan dan Aksesibilitas Arsip (Kaidah Kearsipan ANRI & Rahasia Negara)
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'keamanan_type') THEN
        CREATE TYPE keamanan_type AS ENUM ('Biasa/Terbuka', 'Terbatas', 'Rahasia', 'Sangat Rahasia');
    END IF;

    -- Taksonomi Jenis Naskah Dinas Resmi Lingkungan Universitas Siliwangi
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'jenis_surat_type') THEN
        CREATE TYPE jenis_surat_type AS ENUM ('Surat Masuk', 'Surat Keluar', 'Nota Dinas', 'Surat Tugas');
    END IF;

    -- Siklus Status Progres Surat Dinamis (5 Tahap Persuratan SILOKA)
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'progres_type') THEN
        CREATE TYPE progres_type AS ENUM ('Dikirim', 'Dibaca', 'Diparaf', 'Disetujui', 'Diarsipkan');
    END IF;
END $$;


-- -----------------------------------------------------------------------------
-- 2. HIERARCHICAL MASTER DATA TABLES (Normalized 3-Tier JRA)
-- -----------------------------------------------------------------------------

-- =============================================================================
-- TIER 1: "tbl_master_klasifikasi_utama"
-- Tabel master induk urusan primer universitas (2 karakter alfabetis).
-- Contoh: 'PP' (Pendidikan dan Pengajaran), 'KU' (Keuangan), 'KP' (Kepegawaian).
-- =============================================================================
CREATE TABLE IF NOT EXISTS tbl_master_klasifikasi_utama (
    kode_utama VARCHAR(5) PRIMARY KEY,
    nama_urusan VARCHAR(150) NOT NULL,
    jenis_klasifikasi klasifikasi_type NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE tbl_master_klasifikasi_utama IS 'Master Tier-1: Klasifikasi Induk Urusan (Substantif/Fasilitatif) SK Rektor UNSIL No. 2803';
COMMENT ON COLUMN tbl_master_klasifikasi_utama.kode_utama IS 'Kode primer 2 huruf (e.g. PP, KU, KP, KR, HM)';
COMMENT ON COLUMN tbl_master_klasifikasi_utama.nama_urusan IS 'Deskripsi urusan induk universitas';
COMMENT ON COLUMN tbl_master_klasifikasi_utama.jenis_klasifikasi IS 'Sifat urusan: Substantif (Akademik/Tridharma) atau Fasilitatif (Administratif/SDM/Aset)';


-- =============================================================================
-- TIER 2: "tbl_master_sub_klasifikasi"
-- Tabel turunan tingkat kedua yang memerinci urusan menjadi fungsi/sub-urusan spesifik.
-- Contoh: 'PP.00' (Penerimaan Mahasiswa), 'KU.01' (Pelaksanaan Anggaran / DIPA).
-- =============================================================================
CREATE TABLE IF NOT EXISTS tbl_master_sub_klasifikasi (
    kode_sub VARCHAR(10) PRIMARY KEY,
    kode_utama VARCHAR(5) NOT NULL,
    nama_sub_urusan VARCHAR(200) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sub_klasifikasi_utama 
        FOREIGN KEY (kode_utama) 
        REFERENCES tbl_master_klasifikasi_utama(kode_utama) 
        ON UPDATE CASCADE 
        ON DELETE CASCADE
);

COMMENT ON TABLE tbl_master_sub_klasifikasi IS 'Master Tier-2: Sub-Klasifikasi Urusan Spesifik (Relasi FK ke Urusan Utama)';
COMMENT ON COLUMN tbl_master_sub_klasifikasi.kode_sub IS 'Kode sub-klasifikasi terstandardisasi (e.g. PP.00, KU.01, KP.02)';
COMMENT ON COLUMN tbl_master_sub_klasifikasi.kode_utama IS 'Foreign key merujuk ke tbl_master_klasifikasi_utama';
COMMENT ON COLUMN tbl_master_sub_klasifikasi.nama_sub_urusan IS 'Uraian sub-fungsi teknis';


-- =============================================================================
-- TIER 3: "tbl_master_jra" (The Core JRA Rules Matrix)
-- Matriks inti penentuan aturan retensi arsip, masa simpan aktif/inaktif, nasib akhir,
-- serta unit pengolah yang bertanggung jawab mengelola berkas.
-- Contoh: 'PP.00.03' (Penetapan Kelulusan Mahasiswa: Aktif 5 thn, Inaktif 10 thn, Permanen).
-- =============================================================================
CREATE TABLE IF NOT EXISTS tbl_master_jra (
    kode_jra VARCHAR(15) PRIMARY KEY,
    kode_sub VARCHAR(10) NOT NULL,
    series_arsip TEXT NOT NULL,
    retensi_aktif_tahun INT NOT NULL CHECK (retensi_aktif_tahun >= 0),
    retensi_inaktif_tahun INT NOT NULL CHECK (retensi_inaktif_tahun >= 0),
    keterangan_akhir keterangan_akhir_type NOT NULL,
    klasifikasi_keamanan keamanan_type NOT NULL DEFAULT 'Biasa/Terbuka',
    unit_pengolah_default VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_jra_sub_klasifikasi 
        FOREIGN KEY (kode_sub) 
        REFERENCES tbl_master_sub_klasifikasi(kode_sub) 
        ON UPDATE CASCADE 
        ON DELETE CASCADE
);

COMMENT ON TABLE tbl_master_jra IS 'Master Tier-3: Matriks Regulasi Jadwal Retensi Arsip (JRA) SK Rektor No. 2803';
COMMENT ON COLUMN tbl_master_jra.kode_jra IS 'Kode klasifikasi lengkap arsip (e.g. PP.00.03, KU.01.04, KP.02.01)';
COMMENT ON COLUMN tbl_master_jra.kode_sub IS 'Foreign key merujuk ke tbl_master_sub_klasifikasi';
COMMENT ON COLUMN tbl_master_jra.series_arsip IS 'Uraian jenis/seri dokumen atau berkas dinas';
COMMENT ON COLUMN tbl_master_jra.retensi_aktif_tahun IS 'Masa retensi aktif di unit kerja pengolah (dalam satuan tahun)';
COMMENT ON COLUMN tbl_master_jra.retensi_inaktif_tahun IS 'Masa retensi inaktif di record center / pusat arsip universitas (tahun)';
COMMENT ON COLUMN tbl_master_jra.keterangan_akhir IS 'Nasib akhir arsip: Musnah, Permanen (Statis ke ANRI/Arsip UNSIL), atau Dinilai Kembali';
COMMENT ON COLUMN tbl_master_jra.klasifikasi_keamanan IS 'Derajat kerahasiaan dokumen (Biasa/Terbuka, Terbatas, Rahasia, Sangat Rahasia)';
COMMENT ON COLUMN tbl_master_jra.unit_pengolah_default IS 'Unit kerja penanggung jawab utama (e.g. BAKPK, BKU, LPPM, FAKULTAS)';


-- -----------------------------------------------------------------------------
-- 3. TRANSACTIONAL TABLE: PENGENDALIAN SURAT ("tbl_surat")
-- -----------------------------------------------------------------------------
-- Tabel operasional persuratan dinas universitas. Setiap naskah dinas wajib
-- terikat ke salah satu kode matriks JRA (kode_jra) agar kepatuhan retensi
-- dan tata naskah dinas terhitung otomatis sejak tanggal penerbitan surat.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tbl_surat (
    id_surat BIGSERIAL PRIMARY KEY,
    nomor_surat VARCHAR(100) UNIQUE NOT NULL,
    tanggal_surat DATE NOT NULL,
    perihal TEXT NOT NULL,
    jenis_surat jenis_surat_type NOT NULL,
    kode_jra VARCHAR(15) NOT NULL,
    status_progres progres_type NOT NULL DEFAULT 'Dikirim',
    file_path VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_surat_jra 
        FOREIGN KEY (kode_jra) 
        REFERENCES tbl_master_jra(kode_jra) 
        ON UPDATE CASCADE 
        ON DELETE RESTRICT
);

COMMENT ON TABLE tbl_surat IS 'Tabel Transaksional Pengendalian Naskah Dinas Terintegrasi JRA SILOKA UNSIL';
COMMENT ON COLUMN tbl_surat.id_surat IS 'Identifier unik naskah dinas (BIGSERIAL 64-bit auto-increment)';
COMMENT ON COLUMN tbl_surat.nomor_surat IS 'Nomor naskah dinas terformat unik (e.g. 0842/UN58.13/KR.07/2026)';
COMMENT ON COLUMN tbl_surat.tanggal_surat IS 'Tanggal resmi surat (menjadi basis penanggalan siklus retensi aktif JRA)';
COMMENT ON COLUMN tbl_surat.perihal IS 'Isi ringkas perihal naskah dinas';
COMMENT ON COLUMN tbl_surat.jenis_surat IS 'Kategori dokumen: Surat Masuk, Surat Keluar, Nota Dinas, atau Surat Tugas';
COMMENT ON COLUMN tbl_surat.kode_jra IS 'Foreign key aturan retensi arsip (tbl_master_jra). Dibatasi ON DELETE RESTRICT agar audit tidak terputus';
COMMENT ON COLUMN tbl_surat.status_progres IS 'Status tahapan siklus surat: Dikirim -> Dibaca -> Diparaf -> Disetujui -> Diarsipkan';
COMMENT ON COLUMN tbl_surat.file_path IS 'Path penyimpanan berkas digital (PDF) terenkripsi';


-- -----------------------------------------------------------------------------
-- 4. PERFORMANCE OPTIMIZATION INDEXES
-- -----------------------------------------------------------------------------
-- Memastikan efisiensi tinggi pada eksekusi query JOIN antar-tingkat hierarki,
-- filter pencarian surat, serta kalkulasi masa retensi pada dashboard.
-- -----------------------------------------------------------------------------

-- A. Indeks Relasional Kunci Asing (Foreign Key Joins)
CREATE INDEX IF NOT EXISTS idx_sub_klasifikasi_kode_utama 
    ON tbl_master_sub_klasifikasi(kode_utama);

CREATE INDEX IF NOT EXISTS idx_jra_kode_sub 
    ON tbl_master_jra(kode_sub);

CREATE INDEX IF NOT EXISTS idx_surat_kode_jra 
    ON tbl_surat(kode_jra);

-- B. Indeks Filter Transaksional Sering Dipakai
CREATE INDEX IF NOT EXISTS idx_surat_tanggal_surat 
    ON tbl_surat(tanggal_surat DESC);

CREATE INDEX IF NOT EXISTS idx_surat_status_progres 
    ON tbl_surat(status_progres);

CREATE INDEX IF NOT EXISTS idx_surat_jenis_surat 
    ON tbl_surat(jenis_surat);

-- C. Composite Index untuk Optimasi Perhitungan Retensi & Audit Dashboard
CREATE INDEX IF NOT EXISTS idx_surat_jra_tanggal 
    ON tbl_surat(kode_jra, tanggal_surat);


-- -----------------------------------------------------------------------------
-- 5. RETENTION AUTOMATION: VIEWS & EXPIRATION NOTIFICATION ENGINE
-- -----------------------------------------------------------------------------

-- =============================================================================
-- VIEW: "v_surat_retensi_lengkap"
-- Menghitung secara dinamis tanggal batas retensi aktif, retensi inaktif,
-- sisa hari masa aktif, status lifecycle berkas, serta label urgensi notifikasi.
-- =============================================================================
CREATE OR REPLACE VIEW v_surat_retensi_lengkap AS
SELECT 
    -- Data Identitas Surat
    s.id_surat,
    s.nomor_surat,
    s.tanggal_surat,
    s.perihal,
    s.jenis_surat,
    s.status_progres,
    s.file_path,
    s.created_at AS waktu_registrasi,

    -- Data Hierarki Master Klasifikasi & JRA
    j.kode_jra,
    j.series_arsip,
    sub.kode_sub,
    sub.nama_sub_urusan,
    u.kode_utama,
    u.nama_urusan,
    u.jenis_klasifikasi,
    j.retensi_aktif_tahun,
    j.retensi_inaktif_tahun,
    j.keterangan_akhir,
    j.klasifikasi_keamanan,
    COALESCE(j.unit_pengolah_default, 'Unit Pengolah Terkait') AS unit_pengolah,

    -- Perhitungan Batas Penanggalan Retensi (Berdasarkan SK Rektor No. 2803)
    (s.tanggal_surat + (j.retensi_aktif_tahun || ' years')::INTERVAL)::DATE AS tanggal_akhir_aktif,
    (s.tanggal_surat + ((j.retensi_aktif_tahun + j.retensi_inaktif_tahun) || ' years')::INTERVAL)::DATE AS tanggal_akhir_inaktif,

    -- Sisa Hari Masa Aktif (Positif = Berjalan, Negatif = Melewati Batas)
    ((s.tanggal_surat + (j.retensi_aktif_tahun || ' years')::INTERVAL)::DATE - CURRENT_DATE) AS sisa_hari_aktif,

    -- Indikator Boolean Status Kedaluwarsa Retensi Aktif
    (CURRENT_DATE >= (s.tanggal_surat + (j.retensi_aktif_tahun || ' years')::INTERVAL)::DATE) AS is_aktif_expired,

    -- Lifecycle Status Komprehensif
    CASE 
        WHEN CURRENT_DATE < (s.tanggal_surat + (j.retensi_aktif_tahun || ' years')::INTERVAL)::DATE 
            THEN 'AKTIF'
        WHEN CURRENT_DATE < (s.tanggal_surat + ((j.retensi_aktif_tahun + j.retensi_inaktif_tahun) || ' years')::INTERVAL)::DATE 
            THEN 'INAKTIF'
        ELSE 'SIAP_TINDAK_LANJUT_AKHIR'
    END AS status_retensi_siklus,

    -- Rekomendasi Tindakan Arsip
    CASE 
        WHEN CURRENT_DATE < (s.tanggal_surat + (j.retensi_aktif_tahun || ' years')::INTERVAL)::DATE 
            THEN 'Disimpan & Digunakan di Unit Pengolah'
        WHEN CURRENT_DATE < (s.tanggal_surat + ((j.retensi_aktif_tahun + j.retensi_inaktif_tahun) || ' years')::INTERVAL)::DATE 
            THEN 'Pindahkan dari Unit Pengolah ke Record Center / Unit Kearsipan'
        ELSE 
            CASE j.keterangan_akhir
                WHEN 'Musnah' THEN 'Usulkan Pemusnahan Berkas (Sesuai Prosedur ANRI)'
                WHEN 'Permanen' THEN 'Serahkan ke Arsip Statis Universitas Siliwangi / ANRI'
                WHEN 'Dinilai Kembali' THEN 'Lakukan Penilaian Kembali oleh Tim Arsiparis'
            END
    END AS rekomendasi_tindakan

FROM tbl_surat s
INNER JOIN tbl_master_jra j ON s.kode_jra = j.kode_jra
INNER JOIN tbl_master_sub_klasifikasi sub ON j.kode_sub = sub.kode_sub
INNER JOIN tbl_master_klasifikasi_utama u ON sub.kode_utama = u.kode_utama;

COMMENT ON VIEW v_surat_retensi_lengkap IS 'View Komputasi Otomatis Siklus Retensi Arsip (Masa Aktif, Inaktif, dan Nasib Akhir)';


-- =============================================================================
-- VIEW: "v_arsip_expiring_notifications" (Dashboard Widget Helper)
-- View khusus yang difilter untuk menyajikan daftar surat yang:
-- 1. Masa aktifnya telah terlampaui (EXPIRED) -> Segera pindah ke Inaktif.
-- 2. Masa aktifnya akan habis dalam 90 hari ke depan (EXPIRING_SOON) -> Peringatan dini.
-- =============================================================================
CREATE OR REPLACE VIEW v_arsip_expiring_notifications AS
SELECT 
    id_surat,
    nomor_surat,
    tanggal_surat,
    perihal,
    jenis_surat,
    status_progres,
    kode_jra,
    series_arsip,
    unit_pengolah,
    retensi_aktif_tahun,
    tanggal_akhir_aktif,
    sisa_hari_aktif,
    CASE 
        WHEN sisa_hari_aktif < 0 THEN 'EXPIRED'
        WHEN sisa_hari_aktif <= 30 THEN 'EXPIRING_CRITICAL'
        ELSE 'EXPIRING_WARNING'
    END AS tingkat_urgensi,
    CASE 
        WHEN sisa_hari_aktif < 0 THEN 
            CONCAT('Masa retensi aktif telah berakhir sejak ', ABS(sisa_hari_aktif), ' hari yang lalu. Harap segera lakukan pemindahan berkas ke Record Center.')
        WHEN sisa_hari_aktif = 0 THEN 
            'Hari ini merupakan batas akhir masa retensi aktif berkas.'
        ELSE 
            CONCAT('Masa retensi aktif tersisa ', sisa_hari_aktif, ' hari lagi sebelum dialihkan menjadi berkas inaktif.')
    END AS pesan_notifikasi
FROM v_surat_retensi_lengkap
WHERE sisa_hari_aktif <= 90 -- Threshold peringatan dini: 90 hari sebelum habis masa aktif atau sudah lewat
ORDER BY sisa_hari_aktif ASC;

COMMENT ON VIEW v_arsip_expiring_notifications IS 'View Penyedia Notifikasi Dashboard: Arsip Mendekati atau Melewati Batas Retensi Aktif';


-- =============================================================================
-- 6. STORED FUNCTION: "fn_get_surat_retensi_summary"
-- Fungsi bantuan backend untuk mengambil metrik ringkasan retensi arsip
-- =============================================================================
CREATE OR REPLACE FUNCTION fn_get_surat_retensi_summary()
RETURNS TABLE (
    total_arsip_terdata BIGINT,
    total_arsip_aktif BIGINT,
    total_arsip_inaktif BIGINT,
    total_siap_nasib_akhir BIGINT,
    total_peringatan_kadaluarsa BIGINT
) 
LANGUAGE sql
STABLE
AS $$
    SELECT 
        COUNT(*) AS total_arsip_terdata,
        COUNT(*) FILTER (WHERE status_retensi_siklus = 'AKTIF') AS total_arsip_aktif,
        COUNT(*) FILTER (WHERE status_retensi_siklus = 'INAKTIF') AS total_arsip_inaktif,
        COUNT(*) FILTER (WHERE status_retensi_siklus = 'SIAP_TINDAK_LANJUT_AKHIR') AS total_siap_nasib_akhir,
        COUNT(*) FILTER (WHERE sisa_hari_aktif <= 90) AS total_peringatan_kadaluarsa
    FROM v_surat_retensi_lengkap;
$$;

COMMENT ON FUNCTION fn_get_surat_retensi_summary() IS 'Fungsi KPI Dashboard: Menghitung agregasi status retensi seluruh arsip dinas';

COMMIT;

