-- =============================================================================
-- SISTEM PENOMORAN OTOMATIS NASKAH DINAS RESMI UNIVERSITAS SILIWANGI (UNSIL)
-- Format Standar: [NOMOR_URUT]/[KODE_UNIT_KERJA]/[KODE_KLASIFIKASI_JRA]/[TAHUN]
-- Contoh Hasil : 0842/UN58.13/PP.00.03/2026
-- =============================================================================
-- Fitur Kunci:
-- 1. Concurrency-Safe Counter dengan Row-Level Locking (SELECT ... FOR UPDATE)
-- 2. Reset nomor urut otomatis kembali ke 1 pada setiap pergantian tahun kalender
-- 3. Dynamic Zero-Padding 4 digit (misal: 1 -> '0001', 5 -> '0005', 842 -> '0842')
-- 4. Resolusi dinamis kode unit kerja (bisa menerima kode unit atau user_id pembuat)
-- 5. Trigger otomatis sebelum INSERT naskah dinas (tbl_surat)
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. TABEL COUNTER PERSURATAN: "tbl_counter_surat"
-- -----------------------------------------------------------------------------
-- Menyimpan status sequence / pencacah nomor surat per unit kerja per tahun.
-- Primary key gabungan (tahun, kode_unit_kerja) menjamin isolasi counter antar-unit
-- dan memfasilitasi reset otomatis di tahun baru.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tbl_counter_surat (
    tahun INT NOT NULL,
    kode_unit_kerja VARCHAR(50) NOT NULL,
    last_value INT NOT NULL DEFAULT 0 CHECK (last_value >= 0),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_counter_surat PRIMARY KEY (tahun, kode_unit_kerja)
);

COMMENT ON TABLE tbl_counter_surat IS 'Tabel Pencacah Nomor Urut Surat Berbasis Unit Kerja dan Tahun Kalender';
COMMENT ON COLUMN tbl_counter_surat.tahun IS 'Tahun kalender penerbitan naskah dinas (e.g. 2026)';
COMMENT ON COLUMN tbl_counter_surat.kode_unit_kerja IS 'Kode satuan kerja pemilik wewenang penomoran (e.g. UN58.13, UN58.6)';
COMMENT ON COLUMN tbl_counter_surat.last_value IS 'Nomor urut terakhir yang berhasil diterbitkan';
COMMENT ON COLUMN tbl_counter_surat.updated_at IS 'Timestamp pembaruan terakhir counter';

-- Indeks untuk pencarian cepat status counter
CREATE INDEX IF NOT EXISTS idx_counter_surat_unit_tahun 
    ON tbl_counter_surat(kode_unit_kerja, tahun);


-- -----------------------------------------------------------------------------
-- 2. PENYESUAIAN TABEL TRANSAKSIONAL: "tbl_surat"
-- -----------------------------------------------------------------------------
-- Menambahkan kolom kode_unit_kerja (jika belum ada) dan membuat nomor_surat
-- nullable saat INSERT awal agar dapat di-generate otomatis oleh trigger.
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tbl_surat' AND column_name = 'kode_unit_kerja'
    ) THEN
        ALTER TABLE tbl_surat ADD COLUMN kode_unit_kerja VARCHAR(50) DEFAULT 'UN58';
        COMMENT ON COLUMN tbl_surat.kode_unit_kerja IS 'Kode unit kerja pembuat/pengirim naskah dinas';
    END IF;

    -- Izinkan nomor_surat diisi otomatis jika dikosongkan pada query INSERT
    ALTER TABLE tbl_surat ALTER COLUMN nomor_surat DROP NOT NULL;
END $$;


-- -----------------------------------------------------------------------------
-- 3. STORED FUNCTION: "generate_nomor_surat_otomatis"
-- -----------------------------------------------------------------------------
-- Fungsi inti concurrency-safe penomoran surat.
-- Menggunakan SELECT ... FOR UPDATE untuk mengunci baris counter di level transaksi.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION generate_nomor_surat_otomatis(
    p_kode_unit_or_user_id VARCHAR,
    p_kode_jra VARCHAR,
    p_tanggal_surat DATE DEFAULT CURRENT_DATE
)
RETURNS VARCHAR
LANGUAGE plpgsql
AS $$
DECLARE
    v_tahun INT;
    v_kode_unit VARCHAR(50);
    v_kode_jra VARCHAR(15);
    v_current_val INT;
    v_next_val INT;
    v_nomor_urut_padded VARCHAR(10);
    v_nomor_surat_lengkap VARCHAR(100);
BEGIN
    -- -------------------------------------------------------------------------
    -- TAHAP 1: VALIDASI & RESOLUSI PARAMETER DINAMIS
    -- -------------------------------------------------------------------------
    IF p_kode_unit_or_user_id IS NULL OR TRIM(p_kode_unit_or_user_id) = '' THEN
        RAISE EXCEPTION 'Parameter kode_unit atau user_id wajib diisi!';
    END IF;

    IF p_kode_jra IS NULL OR TRIM(p_kode_jra) = '' THEN
        RAISE EXCEPTION 'Parameter kode_jra wajib diisi!';
    END IF;

    -- A. Resolusi Kode Klasifikasi JRA (validasi eksistensi di master JRA)
    SELECT kode_jra INTO v_kode_jra
    FROM tbl_master_jra
    WHERE kode_jra = TRIM(p_kode_jra);

    IF NOT FOUND THEN
        -- Fallback cek ke master_klasifikasi_arsip jika integrasi dengan skema lama
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'master_klasifikasi_arsip') THEN
            SELECT kode_klasifikasi INTO v_kode_jra
            FROM master_klasifikasi_arsip
            WHERE kode_klasifikasi = TRIM(p_kode_jra)
            LIMIT 1;
        END IF;

        IF v_kode_jra IS NULL THEN
            RAISE EXCEPTION 'Kode Klasifikasi JRA "%" tidak ditemukan di basis data!', p_kode_jra;
        END IF;
    END IF;

    -- B. Resolusi Dinamis Kode Unit Kerja Pengirim
    -- Prioritas 1: Jika p_kode_unit_or_user_id cocok dengan master_user.id atau nip_nik, ambil unit_kerja_id
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'master_user') THEN
        SELECT unit_kerja_id INTO v_kode_unit
        FROM master_user
        WHERE id = TRIM(p_kode_unit_or_user_id) 
           OR nip_nik = TRIM(p_kode_unit_or_user_id)
        LIMIT 1;
    END IF;

    -- Prioritas 2: Jika bukan user ID, gunakan nilai input langsung sebagai kode unit kerja
    IF v_kode_unit IS NULL OR TRIM(v_kode_unit) = '' THEN
        v_kode_unit := TRIM(p_kode_unit_or_user_id);
    END IF;

    -- C. Resolusi Tahun Kalender dari tanggal surat / transaction timestamp
    v_tahun := EXTRACT(YEAR FROM COALESCE(p_tanggal_surat, CURRENT_DATE))::INT;

    -- -------------------------------------------------------------------------
    -- TAHAP 2: CONCURRENCY-SAFE ROW LOCKING (SELECT ... FOR UPDATE)
    -- -------------------------------------------------------------------------
    -- Pastikan baris counter untuk (tahun, kode_unit_kerja) sudah ada di tabel.
    -- ON CONFLICT DO NOTHING menjamin tidak terjadi tabrakan saat inisialisasi awal.
    INSERT INTO tbl_counter_surat (tahun, kode_unit_kerja, last_value, updated_at)
    VALUES (v_tahun, v_kode_unit, 0, CURRENT_TIMESTAMP)
    ON CONFLICT (tahun, kode_unit_kerja) DO NOTHING;

    -- Dapatkan nomor urut saat ini dan KUNCI BARIS SECARA EKSKLUSIF (FOR UPDATE)
    -- Transaksi konkuren lain yang mencoba membaca/mengubah counter unit ini
    -- akan menunggu (block) sampai transaksi saat ini selesai (COMMIT / ROLLBACK).
    SELECT last_value
    INTO v_current_val
    FROM tbl_counter_surat
    WHERE tahun = v_tahun AND kode_unit_kerja = v_kode_unit
    FOR UPDATE;

    -- -------------------------------------------------------------------------
    -- TAHAP 3: INCREMENT NOMOR URUT & UPDATE COUNTER
    -- -------------------------------------------------------------------------
    v_next_val := v_current_val + 1;

    UPDATE tbl_counter_surat
    SET last_value = v_next_val,
        updated_at = CURRENT_TIMESTAMP
    WHERE tahun = v_tahun AND kode_unit_kerja = v_kode_unit;

    -- -------------------------------------------------------------------------
    -- TAHAP 4: DYNAMIC PADDING (4 DIGIT ZERO PADDING)
    -- -------------------------------------------------------------------------
    -- Contoh: 1 -> '0001', 5 -> '0005', 842 -> '0842', 1250 -> '1250'
    v_nomor_urut_padded := LPAD(v_next_val::TEXT, 4, '0');

    -- -------------------------------------------------------------------------
    -- TAHAP 5: FORMAT AKHIR RESMI UNSIL
    -- [NOMOR_URUT]/[KODE_UNIT_KERJA]/[KODE_KLASIFIKASI_JRA]/[TAHUN]
    -- -------------------------------------------------------------------------
    v_nomor_surat_lengkap := v_nomor_urut_padded || '/' || v_kode_unit || '/' || v_kode_jra || '/' || v_tahun::TEXT;

    RETURN v_nomor_surat_lengkap;
END;
$$;

COMMENT ON FUNCTION generate_nomor_surat_otomatis IS 'Menghasilkan Nomor Surat Keluar Resmi UNSIL Format [No]/[Unit]/[JRA]/[Tahun] secara Concurrency-Safe (Row-Level Locking)';


-- -----------------------------------------------------------------------------
-- 4. TRIGGER OTOMATIS PADA TABEL "tbl_surat"
-- -----------------------------------------------------------------------------
-- Jika nomor_surat tidak disertakan atau diset bernilai NULL / 'AUTO' saat INSERT,
-- trigger ini memanggil generate_nomor_surat_otomatis secara otomatis.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trg_fn_generate_nomor_surat()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Hanya generate jika nomor_surat belum ditentukan secara manual
    IF NEW.nomor_surat IS NULL OR TRIM(NEW.nomor_surat) = '' OR UPPER(TRIM(NEW.nomor_surat)) = 'AUTO' THEN
        NEW.nomor_surat := generate_nomor_surat_otomatis(
            COALESCE(NEW.kode_unit_kerja, 'UN58'),
            NEW.kode_jra,
            COALESCE(NEW.tanggal_surat, CURRENT_DATE)
        );
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_surat_nomor_otomatis ON tbl_surat;

CREATE TRIGGER trg_surat_nomor_otomatis
BEFORE INSERT ON tbl_surat
FOR EACH ROW
EXECUTE FUNCTION trg_fn_generate_nomor_surat();

COMMENT ON TRIGGER trg_surat_nomor_otomatis ON tbl_surat IS 'Trigger Otomasi Penomoran Surat Keluar Resmi UNSIL sebelum baris disimpan';

COMMIT;

