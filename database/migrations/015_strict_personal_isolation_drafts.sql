-- =================================================================================
-- MIGRATION 015: STRICT PERSONAL ISOLATION (SKKAAD SK REKTOR UNSIL NO. 2803/2023)
-- Tabel & Indeks Antrean E-Paraf / Draf Naskah Dinas (tbl_document_drafts)
-- =================================================================================

CREATE TABLE IF NOT EXISTS tbl_document_drafts (
    id_draft SERIAL PRIMARY KEY,
    creator_id VARCHAR(64) NOT NULL,               -- Mengunci ID Dosen / Pembuat yang sedang login (req.user.id)
    creator_nip VARCHAR(32),
    creator_email VARCHAR(150),
    creator_name VARCHAR(180) NOT NULL,
    kode_unit_kerja VARCHAR(32) NOT NULL,
    jenis_naskah VARCHAR(64) NOT NULL,             -- Contoh: NOTA_DINAS, LAPORAN, SURAT_TUGAS, SURAT_KETERANGAN
    kategori_akses VARCHAR(32) DEFAULT 'MANDIRI_DOSEN', -- MANDIRI_DOSEN vs KONSEP_PIMPINAN
    nomor_surat VARCHAR(100),
    perihal TEXT NOT NULL,
    tujuan VARCHAR(255),
    kode_jra VARCHAR(32) DEFAULT 'PP.00.03',
    klasifikasi_keamanan VARCHAR(32) DEFAULT 'Terbatas',
    status VARCHAR(32) NOT NULL DEFAULT 'DRAFT'
        CHECK (status IN ('DRAFT', 'DIPARAF', 'SIAP_TTE', 'DITANDATANGANI', 'DITOLAK')),
    target_signer_role VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indeks Komposit untuk Optimasi Query Strict Personal Isolation (Dosen Tanpa Jabatan)
CREATE INDEX IF NOT EXISTS idx_document_drafts_strict_isolation
    ON tbl_document_drafts (creator_id, status, created_at DESC);

-- Indeks untuk 3 Entitas Pengecualian (Pimpinan Struktural, Staf TU/Arsiparis, Super Admin)
CREATE INDEX IF NOT EXISTS idx_document_drafts_unit_queue
    ON tbl_document_drafts (kode_unit_kerja, status, created_at DESC);

-- =================================================================================
-- CONTOH QUERY ANTREAN E-PARAF KHUSUS ROLE DOSEN_NON_JABATAN (STRICT ISOLATION):
-- SELECT * FROM tbl_document_drafts 
-- WHERE creator_id = $1
--   AND status IN ('DRAFT', 'DIPARAF', 'SIAP_TTE')
-- ORDER BY created_at DESC;
-- =================================================================================
