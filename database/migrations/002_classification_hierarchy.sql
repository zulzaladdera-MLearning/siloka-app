-- =============================================================================
-- MIGRASI 002: RESTRUKTURISASI HIERARKI KLASIFIKASI ARSIP (SILOKA UNSIL)
-- =============================================================================
-- Deskripsi:
-- 1. Menambahkan parent_id dan level pada master_klasifikasi_arsip (Self-Referencing)
-- 2. Menghapus constraint UNIQUE pada kolom kode agar satu induk dapat memiliki banyak turunan
-- 3. Menyisipkan data klasifikasi hierarkis 3 tingkat (Pokok, Sub, Sub-sub)
-- 4. Menyelaraskan foreign key pada naskah_dinas agar merujuk ke kode_klasifikasi
-- 5. Menghubungkan jadwal_retensi_arsip (JRA) ke master_klasifikasi_arsip via FK
-- =============================================================================

BEGIN;

-- 1. Tambah Kolom parent_id dan level pada master_klasifikasi_arsip
ALTER TABLE master_klasifikasi_arsip
    ADD COLUMN IF NOT EXISTS parent_id INT NULL,
    ADD COLUMN IF NOT EXISTS level SMALLINT NOT NULL DEFAULT 1;

-- Tambah foreign key self-referencing untuk parent_id jika belum ada
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_klasifikasi_parent'
    ) THEN
        ALTER TABLE master_klasifikasi_arsip
            ADD CONSTRAINT fk_klasifikasi_parent 
            FOREIGN KEY (parent_id) 
            REFERENCES master_klasifikasi_arsip(id) 
            ON UPDATE CASCADE 
            ON DELETE RESTRICT;
    END IF;
END $$;

-- 2. Lepaskan Constraint Foreign Key Lama dari naskah_dinas ke master_klasifikasi_arsip(kode)
ALTER TABLE naskah_dinas 
    DROP CONSTRAINT IF EXISTS fk_surat_klasifikasi;

-- 3. Lepaskan Constraint UNIQUE pada kolom kode di master_klasifikasi_arsip
DO $$ 
DECLARE
    constraint_record RECORD;
BEGIN
    FOR constraint_record IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'master_klasifikasi_arsip'::regclass 
          AND contype = 'u' 
          AND conname LIKE '%kode%' 
          AND conname NOT LIKE '%kode_klasifikasi%'
    LOOP
        EXECUTE 'ALTER TABLE master_klasifikasi_arsip DROP CONSTRAINT IF EXISTS ' || quote_ident(constraint_record.conname);
    END LOOP;
END $$;

-- 4. Populate Data Klasifikasi Hierarkis ANRI & UNSIL (Level 1, 2, 3)

-- Level 1: Klasifikasi Pokok (Parent = NULL, Level = 1)
INSERT INTO master_klasifikasi_arsip (kode_klasifikasi, kode, nama_klasifikasi, keterangan_klasifikasi, parent_id, level, is_active)
VALUES
('PP', 'PP', 'Pendidikan & Pengajaran', 'Urusan pendidikan, pengajaran, kurikulum, dan kemahasiswaan', NULL, 1, TRUE),
('KU', 'KU', 'Keuangan & Anggaran', 'Urusan pengelolaan keuangan, anggaran, DIPA, dan perbendaharaan', NULL, 1, TRUE),
('KP', 'KP', 'Kepegawaian & SDM', 'Urusan formasi, pengangkatan, mutasi, dan pembinaan pegawai', NULL, 1, TRUE),
('PL', 'PL', 'Perlengkapan & BMN', 'Urusan pengadaan, inventarisasi, dan pengelolaan aset BMN', NULL, 1, TRUE),
('KR', 'KR', 'Kerumahtanggaan & Sarpras', 'Urusan pemeliharaan gedung, ruang kerja, dan sarana kampus', NULL, 1, TRUE),
('HM', 'HM', 'Humas & Protokoler', 'Urusan keprotokolan, hubungan masyarakat, dan publikasi kedinasan', NULL, 1, TRUE)
ON CONFLICT (kode_klasifikasi) DO UPDATE 
SET nama_klasifikasi = EXCLUDED.nama_klasifikasi,
    keterangan_klasifikasi = EXCLUDED.keterangan_klasifikasi,
    level = 1,
    parent_id = NULL;

-- Level 2: Sub-Klasifikasi
INSERT INTO master_klasifikasi_arsip (kode_klasifikasi, kode, nama_klasifikasi, keterangan_klasifikasi, parent_id, level, is_active)
VALUES
('PP.00', 'PP', 'Kurikulum dan Pembelajaran', 'Penyusunan kurikulum, silabus, dan program akademik', (SELECT id FROM master_klasifikasi_arsip WHERE kode_klasifikasi = 'PP'), 2, TRUE),
('PP.01', 'PP', 'Penerimaan dan Registrasi Mahasiswa', 'Proses seleksi dan pendaftaran mahasiswa baru', (SELECT id FROM master_klasifikasi_arsip WHERE kode_klasifikasi = 'PP'), 2, TRUE),
('PP.02', 'PP', 'Administrasi Kelulusan dan Wisuda', 'Yudisium, kelulusan, dan administrasi perkuliahan', (SELECT id FROM master_klasifikasi_arsip WHERE kode_klasifikasi = 'PP'), 2, TRUE),
('KU.01', 'KU', 'Penyusunan dan Pelaksanaan Anggaran', 'Rencana kerja anggaran kementerian/lembaga dan DIPA', (SELECT id FROM master_klasifikasi_arsip WHERE kode_klasifikasi = 'KU'), 2, TRUE),
('KU.02', 'KU', 'Perbendaharaan dan Pembukuan', 'Kuitansi belanja, SPJ operasional, dan bukti transaksi keuangan', (SELECT id FROM master_klasifikasi_arsip WHERE kode_klasifikasi = 'KU'), 2, TRUE),
('KP.01', 'KP', 'Formasi dan Pengadaan Pegawai', 'Analisis jabatan, formasi ASN, dan seleksi pegawai', (SELECT id FROM master_klasifikasi_arsip WHERE kode_klasifikasi = 'KP'), 2, TRUE),
('KP.02', 'KP', 'Mutasi dan Penempatan Kerja', 'Surat keputusan pengangkatan, penempatan, dan alih tugas', (SELECT id FROM master_klasifikasi_arsip WHERE kode_klasifikasi = 'KP'), 2, TRUE),
('PL.01', 'PL', 'Pengadaan Barang Milik Negara', 'Pengadaan perlengkapan dan barang dinas', (SELECT id FROM master_klasifikasi_arsip WHERE kode_klasifikasi = 'PL'), 2, TRUE),
('PL.02', 'PL', 'Pencatatan dan Inventarisasi Aset', 'Sertifikat kepemilikan tanah, gedung, dan aset BMN', (SELECT id FROM master_klasifikasi_arsip WHERE kode_klasifikasi = 'PL'), 2, TRUE),
('KR.03', 'KR', 'Pemeliharaan Gedung dan Fasilitas', 'Perawatan bangunan kuliah dan prasarana umum', (SELECT id FROM master_klasifikasi_arsip WHERE kode_klasifikasi = 'KR'), 2, TRUE),
('KR.07', 'KR', 'Dokumentasi Teknis dan Gambar Bangunan', 'Gambar as-built drawing fisik gedung kampus', (SELECT id FROM master_klasifikasi_arsip WHERE kode_klasifikasi = 'KR'), 2, TRUE),
('HM.00', 'HM', 'Keprotokolan dan Acara Kedinasan', 'Pengaturan tamu, upacara, dan undangan resmi pimpinan', (SELECT id FROM master_klasifikasi_arsip WHERE kode_klasifikasi = 'HM'), 2, TRUE)
ON CONFLICT (kode_klasifikasi) DO UPDATE 
SET nama_klasifikasi = EXCLUDED.nama_klasifikasi,
    keterangan_klasifikasi = EXCLUDED.keterangan_klasifikasi,
    parent_id = EXCLUDED.parent_id,
    level = 2;

-- Level 3: Sub-sub Klasifikasi (Klasifikasi Terinci)
INSERT INTO master_klasifikasi_arsip (kode_klasifikasi, kode, nama_klasifikasi, keterangan_klasifikasi, parent_id, level, is_active)
VALUES
('PP.00.03', 'PP', 'Penyelenggaraan Kurikulum, Silabus, dan Program Pembelajaran Akademik', 'Dokumen pelaksanaan silabus dan kurikulum program studi', (SELECT id FROM master_klasifikasi_arsip WHERE kode_klasifikasi = 'PP.00'), 3, TRUE),
('PP.02.00', 'PP', 'Bukti Pembayaran Kuliah UKT Mahasiswa', 'Kuitansi dan verifikasi pelunasan uang kuliah tunggal', (SELECT id FROM master_klasifikasi_arsip WHERE kode_klasifikasi = 'PP.02'), 3, TRUE),
('KU.01.00', 'KU', 'Penyusunan Rencana Anggaran Belanja', 'Rancangan anggaran biaya operasional tahun berjalan', (SELECT id FROM master_klasifikasi_arsip WHERE kode_klasifikasi = 'KU.01'), 3, TRUE),
('KU.01.04', 'KU', 'Pengelolaan Anggaran Belanja Operasional, DIPA, dan SPJ Keuangan', 'Pertanggungjawaban belanja dinas dan surat permohonan UP', (SELECT id FROM master_klasifikasi_arsip WHERE kode_klasifikasi = 'KU.01'), 3, TRUE),
('KU.02.01', 'KU', 'Kuitansi Belanja Operasional & Pajak', 'Bukti pengeluaran kas operasional dan pemotongan pajak', (SELECT id FROM master_klasifikasi_arsip WHERE kode_klasifikasi = 'KU.02'), 3, TRUE),
('KU.02.01.h', 'KU', 'Laporan Keuangan Tahunan (Audited)', 'Laporan keuangan akhir tahun hasil audit eksternal BPK', (SELECT id FROM master_klasifikasi_arsip WHERE kode_klasifikasi = 'KU.02'), 3, TRUE),
('KP.02.01', 'KP', 'Pengangkatan, Penempatan Tugas, dan Formasi Jabatan Pegawai ASN/PPPK', 'SK Rektor tentang mutasi dan penugasan pejabat/pegawai', (SELECT id FROM master_klasifikasi_arsip WHERE kode_klasifikasi = 'KP.02'), 3, TRUE),
('PL.01.02', 'PL', 'Pengadaan, Pendataan Aset Tanah, dan Inventaris Barang Milik Negara (BMN)', 'Berkas pengadaan dan penatausahaan BMN', (SELECT id FROM master_klasifikasi_arsip WHERE kode_klasifikasi = 'PL.01'), 3, TRUE),
('PL.02.04', 'PL', 'Sertifikat Kepemilikan Tanah & Aset BMN', 'Dokumen legal kepemilikan tanah dan aset vital universitas', (SELECT id FROM master_klasifikasi_arsip WHERE kode_klasifikasi = 'PL.02'), 3, TRUE),
('KR.03.01', 'KR', 'Pemeliharaan Bangunan Gedung, Ruang Kuliah, dan Sarana Prasarana Kampus', 'Usulan perbaikan atap, instalasi listrik, dan lab', (SELECT id FROM master_klasifikasi_arsip WHERE kode_klasifikasi = 'KR.03'), 3, TRUE),
('KR.07.00', 'KR', 'Gambar As-Built Drawing Gedung Kampus', 'Gambar arsitektur dan denah instalasi teknis gedung kampus', (SELECT id FROM master_klasifikasi_arsip WHERE kode_klasifikasi = 'KR.07'), 3, TRUE),
('HM.00.01', 'HM', 'Keprotokolan, Undangan Rapat Kedinasan, dan Hubungan Lembaga Eksternal', 'Surat undangan resmi dan agenda keprotokolan pimpinan', (SELECT id FROM master_klasifikasi_arsip WHERE kode_klasifikasi = 'HM.00'), 3, TRUE)
ON CONFLICT (kode_klasifikasi) DO UPDATE 
SET nama_klasifikasi = EXCLUDED.nama_klasifikasi,
    keterangan_klasifikasi = EXCLUDED.keterangan_klasifikasi,
    parent_id = EXCLUDED.parent_id,
    level = 3;

-- 5. Ubah naskah_dinas agar Merujuk ke master_klasifikasi_arsip(kode_klasifikasi)
-- Kolom kode_klasifikasi di naskah_dinas diubah ukurannya jika perlu
ALTER TABLE naskah_dinas 
    ALTER COLUMN kode_klasifikasi TYPE VARCHAR(50);

-- Hubungkan FK naskah_dinas ke master_klasifikasi_arsip(kode_klasifikasi)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_surat_klasifikasi_v2'
    ) THEN
        ALTER TABLE naskah_dinas
            ADD CONSTRAINT fk_surat_klasifikasi_v2
            FOREIGN KEY (kode_klasifikasi)
            REFERENCES master_klasifikasi_arsip (kode_klasifikasi)
            ON UPDATE CASCADE
            ON DELETE RESTRICT;
    END IF;
END $$;

-- 6. Hubungkan jadwal_retensi_arsip (JRA) ke master_klasifikasi_arsip
ALTER TABLE jadwal_retensi_arsip
    ADD COLUMN IF NOT EXISTS klasifikasi_id INT NULL;

-- Isi relasi klasifikasi_id berdasarkan kecocokan kode_seri dengan kode_klasifikasi
UPDATE jadwal_retensi_arsip j
SET klasifikasi_id = m.id
FROM master_klasifikasi_arsip m
WHERE j.kode_seri = m.kode_klasifikasi;

-- Tambah foreign key JRA ke master_klasifikasi_arsip jika belum ada
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_jra_klasifikasi'
    ) THEN
        ALTER TABLE jadwal_retensi_arsip
            ADD CONSTRAINT fk_jra_klasifikasi
            FOREIGN KEY (klasifikasi_id)
            REFERENCES master_klasifikasi_arsip (id)
            ON UPDATE CASCADE
            ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_klasifikasi_parent ON master_klasifikasi_arsip(parent_id);
CREATE INDEX IF NOT EXISTS idx_klasifikasi_level ON master_klasifikasi_arsip(level);
CREATE INDEX IF NOT EXISTS idx_jra_klasifikasi ON jadwal_retensi_arsip(klasifikasi_id);

COMMIT;

