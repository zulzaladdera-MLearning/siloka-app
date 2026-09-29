-- =================================================================================
-- MIGRATION 016: MUTASI UNIT KERJA & PENUGASAN TAMBAHAN (SEKUNDER) PEGAWAI SILOKA
-- Dasar Hukum: Permendikbudristek No. 19 Tahun 2023 (OTK Universitas Siliwangi)
-- =================================================================================

-- 1. TABEL MASTER UNIT KERJA OTK UNSIL (tbl_unit_kerja)
CREATE TABLE IF NOT EXISTS tbl_unit_kerja (
    kode_unit VARCHAR(32) PRIMARY KEY,            -- Kode singkat unit (misal: 'FT', 'LPPM', 'BKU', 'UPA_TIK')
    kode_otk_persuratan VARCHAR(32) NOT NULL,     -- Kode indeks penomoran tata naskah (misal: 'UN58.13', 'UN58.08')
    nama_unit VARCHAR(200) NOT NULL,              -- Nama resmi unit kerja sesuai OTK UNSIL
    kategori_struktur VARCHAR(40) NOT NULL CHECK (
        kategori_struktur IN (
            'PIMPINAN_ORGAN',
            'BIRO',
            'FAKULTAS_PASCASARJANA',
            'LEMBAGA',
            'UPA'
        )
    ),
    label_kategori VARCHAR(100) NOT NULL,
    urutan_tampil INT DEFAULT 100,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed Master Data OTK UNSIL (Permendikbudristek No. 19/2023)
INSERT INTO tbl_unit_kerja (kode_unit, kode_otk_persuratan, nama_unit, kategori_struktur, label_kategori, urutan_tampil)
VALUES
    -- 1. Unsur Pimpinan & Organ Penunjang
    ('REKTORAT', 'UN58', 'Rektorat (Rektor & Wakil Rektor 1–3)', 'PIMPINAN_ORGAN', '1. Unsur Pimpinan & Organ Penunjang', 1),
    ('SENAT', 'UN58.SENAT', 'Senat Universitas Siliwangi', 'PIMPINAN_ORGAN', '1. Unsur Pimpinan & Organ Penunjang', 2),
    ('SPI', 'UN58.19', 'Satuan Pengawas Internal (SPI)', 'PIMPINAN_ORGAN', '1. Unsur Pimpinan & Organ Penunjang', 3),
    ('DEWAN_PENYANTUN', 'UN58.DP', 'Dewan Penyantun Universitas Siliwangi', 'PIMPINAN_ORGAN', '1. Unsur Pimpinan & Organ Penunjang', 4),

    -- 2. Unsur Pelaksana Administrasi (Biro)
    ('BAKPK', 'UN58.06', 'Biro Akademik, Kemahasiswaan, Perencanaan, dan Kerja Sama (BAKPK)', 'BIRO', '2. Unsur Pelaksana Administrasi (Biro)', 10),
    ('BKU', 'UN58.07', 'Biro Keuangan dan Umum (BKU)', 'BIRO', '2. Unsur Pelaksana Administrasi (Biro)', 11),

    -- 3. Unsur Pelaksana Akademik (7 Fakultas & Program Pascasarjana)
    ('FKIP', 'UN58.10', 'Fakultas Keguruan dan Ilmu Pendidikan (FKIP)', 'FAKULTAS_PASCASARJANA', '3. Unsur Pelaksana Akademik (Fakultas & Pascasarjana)', 20),
    ('FEB', 'UN58.11', 'Fakultas Ekonomi dan Bisnis (FEB)', 'FAKULTAS_PASCASARJANA', '3. Unsur Pelaksana Akademik (Fakultas & Pascasarjana)', 21),
    ('FP', 'UN58.12', 'Fakultas Pertanian (FP)', 'FAKULTAS_PASCASARJANA', '3. Unsur Pelaksana Akademik (Fakultas & Pascasarjana)', 22),
    ('FT', 'UN58.13', 'Fakultas Teknik (FT)', 'FAKULTAS_PASCASARJANA', '3. Unsur Pelaksana Akademik (Fakultas & Pascasarjana)', 23),
    ('FISIP', 'UN58.14', 'Fakultas Ilmu Sosial dan Ilmu Politik (FISIP)', 'FAKULTAS_PASCASARJANA', '3. Unsur Pelaksana Akademik (Fakultas & Pascasarjana)', 24),
    ('FIK', 'UN58.15', 'Fakultas Ilmu Kesehatan (FIK)', 'FAKULTAS_PASCASARJANA', '3. Unsur Pelaksana Akademik (Fakultas & Pascasarjana)', 25),
    ('FAI', 'UN58.16', 'Fakultas Agama Islam (FAI)', 'FAKULTAS_PASCASARJANA', '3. Unsur Pelaksana Akademik (Fakultas & Pascasarjana)', 26),
    ('PASCA', 'UN58.17', 'Program Pascasarjana', 'FAKULTAS_PASCASARJANA', '3. Unsur Pelaksana Akademik (Fakultas & Pascasarjana)', 27),

    -- 4. Unsur Pelaksana Akademik & Mutu (Lembaga)
    ('LPPM', 'UN58.08', 'Lembaga Penelitian dan Pengabdian kepada Masyarakat (LPPM)', 'LEMBAGA', '4. Unsur Pelaksana Akademik & Mutu (Lembaga)', 30),
    ('LPMPP', 'UN58.09', 'Lembaga Penjaminan Mutu dan Pengembangan Pembelajaran (LPMPP)', 'LEMBAGA', '4. Unsur Pelaksana Akademik & Mutu (Lembaga)', 31),

    -- 5. Unsur Penunjang Akademik (UPA)
    ('UPA_PERPUS', 'UN58.20', 'UPA Perpustakaan', 'UPA', '5. Unsur Penunjang Akademik (UPA)', 40),
    ('UPA_TIK', 'UN58.21', 'UPA Teknologi Informasi dan Komunikasi (TIK)', 'UPA', '5. Unsur Penunjang Akademik (UPA)', 41),
    ('UPA_BAHASA', 'UN58.22', 'UPA Bahasa', 'UPA', '5. Unsur Penunjang Akademik (UPA)', 42),
    ('UPA_PKKM', 'UN58.23', 'UPA Pengembangan Karier dan Kewirausahaan Mahasiswa', 'UPA', '5. Unsur Penunjang Akademik (UPA)', 43),
    ('UPA_LUK', 'UN58.24', 'UPA Layanan Uji Kompetensi', 'UPA', '5. Unsur Penunjang Akademik (UPA)', 44)
ON CONFLICT (kode_unit) DO UPDATE SET
    kode_otk_persuratan = EXCLUDED.kode_otk_persuratan,
    nama_unit = EXCLUDED.nama_unit,
    kategori_struktur = EXCLUDED.kategori_struktur,
    label_kategori = EXCLUDED.label_kategori,
    urutan_tampil = EXCLUDED.urutan_tampil;

-- 2. TABEL PENUGASAN UNIT SEKUNDER / TUGAS TAMBAHAN AKTIF (tbl_penugasan_sekunder)
-- Memungkinkan dosen tetap memiliki homebase utama di Fakultas (misal: 'FT')
-- sekaligus memiliki hak akses & disposisi aktif pada Lembaga/UPA (misal: 'LPPM').
CREATE TABLE IF NOT EXISTS tbl_penugasan_sekunder (
    id_penugasan SERIAL PRIMARY KEY,
    id_pegawai VARCHAR(64) NOT NULL,
    unit_utama_id VARCHAR(32) NOT NULL REFERENCES tbl_unit_kerja(kode_unit) ON UPDATE CASCADE,
    unit_sekunder_id VARCHAR(32) NOT NULL REFERENCES tbl_unit_kerja(kode_unit) ON UPDATE CASCADE,
    jabatan_sekunder VARCHAR(150) DEFAULT 'Penugasan Tambahan / Fungsional',
    nomor_sk VARCHAR(120) NOT NULL,
    tanggal_mulai DATE NOT NULL,
    tanggal_selesai DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_by_admin VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_unit_sekunder_berbeda CHECK (unit_utama_id <> unit_sekunder_id)
);

CREATE INDEX IF NOT EXISTS idx_penugasan_sekunder_pegawai
    ON tbl_penugasan_sekunder (id_pegawai, is_active);

-- 3. TABEL RIWAYAT MUTASI & TUGAS TAMBAHAN AUDIT LEDGER (tbl_riwayat_mutasi)
CREATE TABLE IF NOT EXISTS tbl_riwayat_mutasi (
    id_mutasi SERIAL PRIMARY KEY,
    id_pegawai VARCHAR(64) NOT NULL,
    nama_pegawai VARCHAR(180) NOT NULL,
    nip_pegawai VARCHAR(64) NOT NULL,
    unit_asal_id VARCHAR(32) NOT NULL REFERENCES tbl_unit_kerja(kode_unit) ON UPDATE CASCADE,
    unit_tujuan_id VARCHAR(32) NOT NULL REFERENCES tbl_unit_kerja(kode_unit) ON UPDATE CASCADE,
    jenis_perubahan VARCHAR(40) NOT NULL CHECK (
        jenis_perubahan IN ('Mutasi Unit Penuh', 'Tugas Tambahan / Sekunder')
    ),
    jabatan_penugasan VARCHAR(150),
    nomor_sk VARCHAR(120) NOT NULL,
    tanggal_mulai DATE NOT NULL,
    tanggal_selesai DATE,
    id_admin VARCHAR(64) NOT NULL,
    nama_admin VARCHAR(180),
    catatan_mutasi TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_mutasi_unit_berbeda CHECK (unit_asal_id <> unit_tujuan_id)
);

CREATE INDEX IF NOT EXISTS idx_riwayat_mutasi_pegawai
    ON tbl_riwayat_mutasi (id_pegawai, created_at DESC);
