/**
 * Automated Verification Test: 3-Tier Hierarchical JRA Database Schema & Retention Engine
 * SILOKA Universitas Siliwangi (UNSIL) - SK Rektor No. 2803
 */

import pg from 'pg';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    console.error(`  ✗ GAGAL: ${message}`);
  }
}

async function runJraSchemaTests() {
  console.log('=============================================================================');
  console.log('TEST SUITE: POSTGRESQL HIERARCHICAL JRA SCHEMA & RETENTION AUTOMATION (UNSIL)');
  console.log('=============================================================================\n');

  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:siloka123%23@127.0.0.1:5432/siloka_db';
  const client = new pg.Client({ connectionString });

  try {
    await client.connect();
    assert(true, 'Koneksi ke basis data PostgreSQL terverifikasi aktif');

    // -------------------------------------------------------------------------
    // 1. PENGUJIAN 5 NATIVE POSTGRESQL ENUM TYPES
    // -------------------------------------------------------------------------
    console.log('\n--- 1. Pengujian Definisi Native ENUM Types ---');
    const enumQuery = `
      SELECT t.typname, array_agg(e.enumlabel ORDER BY e.enumsortorder) AS labels
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      WHERE t.typname IN ('klasifikasi_type', 'keterangan_akhir_type', 'keamanan_type', 'jenis_surat_type', 'progres_type')
      GROUP BY t.typname;
    `;
    const enumRes = await client.query(enumQuery);
    const enums = {};
    enumRes.rows.forEach(r => { enums[r.typname] = r.labels; });

    assert(enums.klasifikasi_type && enums.klasifikasi_type.includes('Substantif') && enums.klasifikasi_type.includes('Fasilitatif'),
      'ENUM klasifikasi_type memuat: Substantif, Fasilitatif');

    assert(enums.keterangan_akhir_type && enums.keterangan_akhir_type.includes('Musnah') && enums.keterangan_akhir_type.includes('Permanen') && enums.keterangan_akhir_type.includes('Dinilai Kembali'),
      'ENUM keterangan_akhir_type memuat: Musnah, Permanen, Dinilai Kembali');

    assert(enums.keamanan_type && enums.keamanan_type.includes('Biasa/Terbuka') && enums.keamanan_type.includes('Terbatas') && enums.keamanan_type.includes('Rahasia') && enums.keamanan_type.includes('Sangat Rahasia'),
      'ENUM keamanan_type memuat: Biasa/Terbuka, Terbatas, Rahasia, Sangat Rahasia');

    assert(enums.jenis_surat_type && enums.jenis_surat_type.includes('Surat Masuk') && enums.jenis_surat_type.includes('Surat Keluar') && enums.jenis_surat_type.includes('Nota Dinas') && enums.jenis_surat_type.includes('Surat Tugas'),
      'ENUM jenis_surat_type memuat: Surat Masuk, Surat Keluar, Nota Dinas, Surat Tugas');

    assert(enums.progres_type && enums.progres_type.includes('Dikirim') && enums.progres_type.includes('Dibaca') && enums.progres_type.includes('Diparaf') && enums.progres_type.includes('Disetujui') && enums.progres_type.includes('Diarsipkan'),
      'ENUM progres_type memuat: Dikirim, Dibaca, Diparaf, Disetujui, Diarsipkan');

    // -------------------------------------------------------------------------
    // 2. PENGUJIAN HIERARKI TABEL MASTER (3-TIER JRA NORMALIZATION)
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Pengujian Tabel Master Hierarkis 3-Tingkat ---');
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('tbl_master_klasifikasi_utama', 'tbl_master_sub_klasifikasi', 'tbl_master_jra', 'tbl_surat');
    `;
    const tablesRes = await client.query(tablesQuery);
    const existingTables = tablesRes.rows.map(r => r.table_name);

    assert(existingTables.includes('tbl_master_klasifikasi_utama'), 'Tabel Tier 1: tbl_master_klasifikasi_utama eksis');
    assert(existingTables.includes('tbl_master_sub_klasifikasi'), 'Tabel Tier 2: tbl_master_sub_klasifikasi eksis');
    assert(existingTables.includes('tbl_master_jra'), 'Tabel Tier 3: tbl_master_jra eksis');
    assert(existingTables.includes('tbl_surat'), 'Tabel Transaksional: tbl_surat eksis');

    // Cek Foreign Key Cascade pada Sub-Klasifikasi & JRA
    const fkQuery = `
      SELECT
        tc.table_name, kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        rc.delete_rule, rc.update_rule
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.referential_constraints AS rc
        ON tc.constraint_name = rc.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.table_name IN ('tbl_master_sub_klasifikasi', 'tbl_master_jra', 'tbl_surat');
    `;
    const fkRes = await client.query(fkQuery);
    const fks = fkRes.rows;

    const subToUtama = fks.find(f => f.table_name === 'tbl_master_sub_klasifikasi' && f.foreign_table_name === 'tbl_master_klasifikasi_utama');
    assert(subToUtama && subToUtama.delete_rule === 'CASCADE', 'FK tbl_master_sub_klasifikasi -> tbl_master_klasifikasi_utama ON DELETE CASCADE aktif');

    const jraToSub = fks.find(f => f.table_name === 'tbl_master_jra' && f.foreign_table_name === 'tbl_master_sub_klasifikasi');
    assert(jraToSub && jraToSub.delete_rule === 'CASCADE', 'FK tbl_master_jra -> tbl_master_sub_klasifikasi ON DELETE CASCADE aktif');

    const suratToJra = fks.find(f => f.table_name === 'tbl_surat' && f.foreign_table_name === 'tbl_master_jra');
    assert(suratToJra && suratToJra.delete_rule === 'RESTRICT', 'FK tbl_surat -> tbl_master_jra ON DELETE RESTRICT aktif (Audit Preservation)');

    // -------------------------------------------------------------------------
    // 3. PENGUJIAN DATABASE PERFORMANCE INDEXES
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Pengujian Keberadaan Indeks Performa ---');
    const indexQuery = `
      SELECT indexname, tablename 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
        AND indexname IN (
          'idx_sub_klasifikasi_kode_utama',
          'idx_jra_kode_sub',
          'idx_surat_kode_jra',
          'idx_surat_tanggal_surat',
          'idx_surat_status_progres',
          'idx_surat_jenis_surat',
          'idx_surat_jra_tanggal'
        );
    `;
    const indexRes = await client.query(indexQuery);
    const existingIndexes = indexRes.rows.map(r => r.indexname);

    assert(existingIndexes.includes('idx_sub_klasifikasi_kode_utama'), 'Indeks FK idx_sub_klasifikasi_kode_utama terpasang');
    assert(existingIndexes.includes('idx_jra_kode_sub'), 'Indeks FK idx_jra_kode_sub terpasang');
    assert(existingIndexes.includes('idx_surat_kode_jra'), 'Indeks FK idx_surat_kode_jra terpasang');
    assert(existingIndexes.includes('idx_surat_tanggal_surat'), 'Indeks Filter idx_surat_tanggal_surat terpasang');
    assert(existingIndexes.includes('idx_surat_jra_tanggal'), 'Indeks Komposit idx_surat_jra_tanggal terpasang');

    // -------------------------------------------------------------------------
    // 4. PENGUJIAN PERHITUNGAN RETENSI OTOMATIS & VIEW NOTIFIKASI
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Pengujian Otomasi Retensi & View Notifikasi Dashboard ---');
    const retensiRes = await client.query(`
      SELECT nomor_surat, kode_jra, tanggal_surat, tanggal_akhir_aktif, sisa_hari_aktif, status_retensi_siklus, is_aktif_expired
      FROM v_surat_retensi_lengkap
      WHERE nomor_surat = '0842/UN58.13/PP.01.01/2026';
    `);
    const activeDoc = retensiRes.rows[0];
    assert(activeDoc !== undefined, 'Dokumen 0842/UN58.13/PP.01.01/2026 ditemukan pada View v_surat_retensi_lengkap');
    assert(activeDoc.status_retensi_siklus === 'AKTIF', 'Dokumen terbitan 2026 berstatus siklus AKTIF');
    assert(activeDoc.is_aktif_expired === false, 'Indikator is_aktif_expired bernilai FALSE untuk dokumen aktif');

    // Pengujian View Notifikasi Expiring
    const notifRes = await client.query(`
      SELECT nomor_surat, tingkat_urgensi, sisa_hari_aktif, pesan_notifikasi 
      FROM v_arsip_expiring_notifications;
    `);
    assert(notifRes.rows.length > 0, 'View v_arsip_expiring_notifications menghasilkan data notifikasi');
    
    const expiredItem = notifRes.rows.find(n => n.tingkat_urgensi === 'EXPIRED');
    assert(expiredItem !== undefined, 'Terdapat deteksi arsip berstatus EXPIRED (Masa aktif terlampaui)');
    assert(expiredItem.pesan_notifikasi.includes('Record Center'), 'Pesan notifikasi expired mengarahkan ke Record Center');

    const expiringSoonItem = notifRes.rows.find(n => n.tingkat_urgensi === 'EXPIRING_CRITICAL');
    assert(expiringSoonItem !== undefined, 'Terdapat deteksi arsip peringatan dini (EXPIRING_CRITICAL)');

    // Pengujian Stored Function Summary
    const summaryRes = await client.query('SELECT * FROM fn_get_surat_retensi_summary();');
    const summary = summaryRes.rows[0];
    assert(parseInt(summary.total_arsip_terdata, 10) >= 5, 'Fungsi summary menghitung total naskah secara akurat');
    assert(parseInt(summary.total_peringatan_kadaluarsa, 10) >= 2, 'Fungsi summary menghitung total peringatan kadaluarsa');

    await client.end();
  } catch (err) {
    console.error('Error saat menjalankan test suite JRA:', err);
    if (client) await client.end();
    process.exit(1);
  }

  console.log('\n=============================================================================');
  console.log(`TOTAL PENGUJIAN JRA: ${passed + failed} | BERHASIL: ${passed} | GAGAL: ${failed}`);
  console.log('=============================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runJraSchemaTests();

