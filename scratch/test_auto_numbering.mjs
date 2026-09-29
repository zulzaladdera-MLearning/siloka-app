/**
 * Skrip Pengujian Otomatis Fitur: Manajemen Nomor Surat Keluar Otomatis
 * SILOKA Universitas Siliwangi (UNSIL)
 */

import { getAllKlasifikasiArsip, createOutgoingLetter } from '../server/services/outgoingLetterService.js';
import { getKlasifikasiList, createOutgoing } from '../server/controllers/outgoingLetterController.js';

async function runTests() {
  console.log('================================================================');
  console.log(' PENGUJIAN OTOMATIS: MANAJEMEN NOMOR SURAT KELUAR OTOMATIS SILOKA');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, msg) => {
    if (condition) {
      console.log(`  ✓ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${msg}`);
      failed++;
    }
  };

  // -------------------------------------------------------------
  // TEST 1: Pengambilan Daftar Klasifikasi Arsip
  // -------------------------------------------------------------
  console.log('1. Pengujian API Master Klasifikasi Arsip (master_klasifikasi_arsip)');
  try {
    const klasList = await getAllKlasifikasiArsip();
    assert(Array.isArray(klasList) && klasList.length >= 6, 'Klasifikasi arsip mengembalikan array data aktif');
    
    const samplePP = klasList.find(k => k.kode_klasifikasi === 'PP.00.03');
    assert(!!samplePP, 'Kode klasifikasi PP.00.03 ditemukan dalam master data');
    assert(samplePP.keterangan_klasifikasi.includes('Kurikulum') || samplePP.keterangan_klasifikasi.includes('Pembelajaran'), 'Keterangan klasifikasi PP.00.03 valid');

    const sampleKU = klasList.find(k => k.kode_klasifikasi === 'KU.01.04');
    assert(!!sampleKU, 'Kode klasifikasi KU.01.04 ditemukan dalam master data');
  } catch (err) {
    assert(false, `Gagal memuat klasifikasi: ${err.message}`);
  }

  // -------------------------------------------------------------
  // TEST 2: Validasi Format Output Nomor Surat Keluar
  // -------------------------------------------------------------
  console.log('\n2. Pengujian Logika Format Nomor Surat Keluar');
  try {
    const singlePayload = {
      tingkat_keamanan: 'B',
      kode_klasifikasi: 'PP.00.03',
      perihal: 'Penyampaian Silabus Kurikulum Fakultas Teknik',
      tujuan: 'Wakil Rektor Bidang Akademik',
      tahun: 2026,
      unit_kerja_id: 'UN58.13'
    };

    const user = { id: 'usr-ft-01', unit_kerja_id: 'UN58.13' };
    const res = await createOutgoingLetter(singlePayload, user);

    assert(res.success === true, 'Penerbitan nomor surat keluar berhasil');
    assert(typeof res.data.nomor_urut === 'number', 'Nomor urut bertipe integer');
    
    // Format: [nomor_urut]/[kode_unit_kerja]/[tingkat_keamanan]/[kode_klasifikasi]/[tahun]
    const expectedRegex = /^\d+\/UN58\.13\/B\/PP\.00\.03\/2026$/;
    assert(expectedRegex.test(res.data.nomor_surat_lengkap), `Nomor lengkap memenuhi rumus format resmi: ${res.data.nomor_surat_lengkap}`);
  } catch (err) {
    assert(false, `Error pembuatan nomor surat: ${err.message}`);
  }

  // -------------------------------------------------------------
  // TEST 3: Validasi Penolakan Tingkat Keamanan Tidak Sah
  // -------------------------------------------------------------
  console.log('\n3. Pengujian Validasi Input & Tingkat Keamanan');
  try {
    let errorCaught = false;
    try {
      await createOutgoingLetter({
        tingkat_keamanan: 'X', // Invalid security level
        kode_klasifikasi: 'PP.00.03',
        perihal: 'Uji Validasi',
        tujuan: 'Rektor'
      });
    } catch (err) {
      errorCaught = true;
      assert(err.message.includes('Tingkat Keamanan tidak valid'), 'Penolakan kode keamanan selain B, R, SR berhasil');
    }
    assert(errorCaught, 'Payload dengan keamanan tidak valid berhasil diblokir');
  } catch (err) {
    assert(false, `Error validasi: ${err.message}`);
  }

  // -------------------------------------------------------------
  // TEST 4: Stress Test Konkurensi (15 Request Simultan di Milidetik yang Sama)
  // -------------------------------------------------------------
  console.log('\n4. Pengujian Konkurensi & Locking Database (Pencegahan Nomor Ganda)');
  try {
    const concurrentCount = 15;
    const testYear = 2026;
    const promises = [];

    for (let i = 0; i < concurrentCount; i++) {
      const p = createOutgoingLetter({
        tingkat_keamanan: i % 3 === 0 ? 'B' : (i % 3 === 1 ? 'R' : 'SR'),
        kode_klasifikasi: i % 2 === 0 ? 'KU.01.04' : 'PP.00.03',
        perihal: `Pengajuan Naskah Simultan Ke-${i + 1}`,
        tujuan: 'Biro Keuangan dan Umum',
        tahun: testYear,
        unit_kerja_id: 'UN58.10'
      }, { id: `usr-sim-${i}`, unit_kerja_id: 'UN58.10' });
      promises.push(p);
    }

    const results = await Promise.all(promises);
    const generatedNumbers = results.map(r => r.data.nomor_surat_lengkap);
    const generatedSeqs = results.map(r => r.data.nomor_urut);

    assert(results.length === concurrentCount, `Berhasil memproses seluruh ${concurrentCount} request simultan`);

    // Deteksi duplikasi nomor urut
    const uniqueSeqs = new Set(generatedSeqs);
    assert(uniqueSeqs.size === concurrentCount, `TIDAK ADA NOMOR GANDA! Seluruh ${concurrentCount} nomor urut unik (${[...uniqueSeqs].join(', ')})`);

    // Verifikasi monotonik berurutan
    const sortedSeqs = [...generatedSeqs].sort((a, b) => a - b);
    let isContiguous = true;
    for (let i = 1; i < sortedSeqs.length; i++) {
      if (sortedSeqs[i] !== sortedSeqs[i - 1] + 1) {
        isContiguous = false;
        break;
      }
    }
    assert(isContiguous, `Nomor urut terbit secara berurutan dan contiguous tanpa ada yang melompat: ${sortedSeqs[0]} s.d. ${sortedSeqs[sortedSeqs.length - 1]}`);
    console.log(`     Contoh sample nomor terbit: ${generatedNumbers[0]}`);
    console.log(`     Sample nomor terakhir:      ${generatedNumbers[generatedNumbers.length - 1]}`);
  } catch (err) {
    assert(false, `Error uji konkurensi: ${err.message}`);
  }

  // -------------------------------------------------------------
  // RINGKASAN HASIL
  // -------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`HASIL: ${passed}/${passed + failed} PENGUJIAN BERHASIL DILALUI!`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();

