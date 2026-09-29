-- =============================================================================
-- MIGRASI 003: PENGUATAN TABEL MASTER PEJABAT (SILOKA UNSIL)
-- =============================================================================
-- Deskripsi:
-- 1. Menghubungkan master_pejabat ke master_user melalui foreign key user_id
-- 2. Menambahkan atribut masa jabatan (tanggal_mulai, tanggal_selesai)
-- 3. Menambahkan status kepemimpinan (status_plt_plh: 'DEFINITIF', 'PLT', 'PLH')
-- 4. Menambahkan penanda penandatangan utama satuan kerja (is_penandatangan_default)
-- 5. Menghilangkan redundansi kolom (drop is_aktif, pertahankan is_active)
-- 6. Mempertahankan constraint UNIQUE(nip) sesuai keputusan arsitektur
-- =============================================================================

BEGIN;

-- 1. Tambah Kolom Baru pada master_pejabat
ALTER TABLE master_pejabat
    ADD COLUMN IF NOT EXISTS user_id VARCHAR(50) NULL,
    ADD COLUMN IF NOT EXISTS status_plt_plh VARCHAR(10) NOT NULL DEFAULT 'DEFINITIF',
    ADD COLUMN IF NOT EXISTS is_penandatangan_default BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS tanggal_mulai DATE NULL DEFAULT '2024-01-01',
    ADD COLUMN IF NOT EXISTS tanggal_selesai DATE NULL;

-- Tambah foreign key ke master_user(id) jika belum ada
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_pejabat_user'
    ) THEN
        ALTER TABLE master_pejabat
            ADD CONSTRAINT fk_pejabat_user
            FOREIGN KEY (user_id)
            REFERENCES master_user (id)
            ON UPDATE CASCADE
            ON DELETE SET NULL;
    END IF;
END $$;

-- 2. Sinkronisasi Data user_id Berdasarkan NIP yang Cocok dengan master_user
UPDATE master_pejabat p
SET user_id = u.id
FROM master_user u
WHERE p.nip = u.nip_nik;

-- 3. Tetapkan Penandatangan Utama (is_penandatangan_default = TRUE) untuk Pimpinan Tertinggi Setiap Unit
UPDATE master_pejabat
SET is_penandatangan_default = TRUE
WHERE jabatan ILIKE 'Rektor%'
   OR jabatan ILIKE 'Ketua Senat%'
   OR jabatan ILIKE 'Ketua Satuan Pengawas%'
   OR jabatan ILIKE 'Ketua Dewan Penyantun%'
   OR jabatan ILIKE 'Kepala Biro%'
   OR jabatan ILIKE 'Dekan%'
   OR jabatan ILIKE 'Direktur Program%'
   OR jabatan ILIKE 'Ketua LPPM%'
   OR jabatan ILIKE 'Ketua LPMPP%'
   OR jabatan ILIKE 'Kepala UPA%';

-- 4. Sinkronisasi dan Pembersihan Kolom Redundan (is_aktif vs is_active)
UPDATE master_pejabat
SET is_active = COALESCE(is_active, is_aktif, TRUE)
WHERE is_active IS NULL;

-- Hapus kolom is_aktif (kolom standar sistem adalah is_active)
ALTER TABLE master_pejabat
    DROP COLUMN IF EXISTS is_aktif;

-- 5. Buat Indeks Pendukung
CREATE INDEX IF NOT EXISTS idx_pejabat_user ON master_pejabat(user_id);
CREATE INDEX IF NOT EXISTS idx_pejabat_status_plt ON master_pejabat(status_plt_plh);
CREATE INDEX IF NOT EXISTS idx_pejabat_default ON master_pejabat(is_penandatangan_default);

COMMIT;

