/**
 * Test Otomatisasi Deteksi Ukuran Kertas PDF (F4 vs A4) SILOKA
 * Berdasarkan Kaidah Tata Naskah Dinas Resmi
 */

import { detectPaperSize, getPaperSizeInfo, PAPER_SIZES } from '../paperSize.js';

let passedCount = 0;
let failedCount = 0;

function assert(condition, message) {
  if (condition) {
    passedCount++;
    console.log(`  ✓ ${message}`);
  } else {
    failedCount++;
    console.error(`  ✗ GAGAL: ${message}`);
  }
}

console.log('--- PENGUJIAN 1: Verifikasi Dimensi Standar Kertas ---');
assert(PAPER_SIZES.F4.width === '210mm' && PAPER_SIZES.F4.height === '330mm', 'F4 berdimensi 210mm x 330mm');
assert(PAPER_SIZES.A4.width === '210mm' && PAPER_SIZES.A4.height === '297mm', 'A4 berdimensi 210mm x 297mm');
assert(PAPER_SIZES.F4.cssPageSize === '210mm 330mm portrait', 'F4 CSS Page Size diset 210mm 330mm portrait');
assert(PAPER_SIZES.A4.cssPageSize === '210mm 297mm portrait', 'A4 CSS Page Size diset 210mm 297mm portrait');

console.log('\n--- PENGUJIAN 2: Verifikasi 23 Template Standar Naskah Dinas UNSIL ---');
const arahanTemplates = ['pos', 'sop', 'se', 'sk', 'sp', 'st_lembar', 'st_kolom'];
arahanTemplates.forEach((t) => {
  assert(detectPaperSize(t) === 'F4', `Template Arahan '${t}' otomatis dideteksi F4`);
});

const nonArahanTemplates = [
  // Korespondensi
  'nd', 'sd', 'undangan_lembar', 'undangan_kartu',
  // Khusus
  'mou', 'pks', 'skua', 'ba', 'sket', 'sper',
  // Lainnya
  'speng', 'peng', 'notula', 'lap', 'ts', 'disp_rektor', 'tte_doc'
];
nonArahanTemplates.forEach((t) => {
  assert(detectPaperSize(t) === 'A4', `Template Korespondensi/Khusus/Lainnya '${t}' otomatis dideteksi A4`);
});

console.log('\n--- PENGUJIAN 3: Template Pembuatan Surat Cepat (CreateLetterModal) ---');
assert(detectPaperSize('tugas') === 'F4', "Template 'tugas' (Surat Tugas Pelaksana) otomatis F4");
assert(detectPaperSize('surat-dinas') === 'A4', "Template 'surat-dinas' otomatis A4");
assert(detectPaperSize('nota-dinas') === 'A4', "Template 'nota-dinas' otomatis A4");
assert(detectPaperSize('undangan') === 'A4', "Template 'undangan' otomatis A4");
assert(detectPaperSize('keterangan') === 'A4', "Template 'keterangan' otomatis A4");
assert(detectPaperSize('pengantar') === 'A4', "Template 'pengantar' otomatis A4");

console.log('\n--- PENGUJIAN 4: Analisis Kata Kunci Perihal & Judul Surat ---');
assert(
  detectPaperSize('Surat Tugas Pelaksanaan Bimbingan Teknis Kearsipan') === 'F4',
  "Perihal memuat 'Surat Tugas' terdeteksi F4"
);
assert(
  detectPaperSize('Surat Edaran Rektor tentang Jam Kerja ASN') === 'F4',
  "Perihal memuat 'Surat Edaran' terdeteksi F4"
);
assert(
  detectPaperSize('Keputusan Rektor tentang Penetapan Panitia') === 'F4',
  "Perihal memuat 'Keputusan Rektor' terdeteksi F4"
);
assert(
  detectPaperSize('Prosedur Operasional Standar Pengelolaan SPJ') === 'F4',
  "Perihal memuat 'Prosedur Operasional Standar' terdeteksi F4"
);
assert(
  detectPaperSize('Surat Perintah Melaksanakan Tugas Dinas Luar') === 'F4',
  "Perihal memuat 'Surat Perintah' terdeteksi F4"
);
assert(
  detectPaperSize('Undangan Rapat Koordinasi Anggaran Semester Ganjil') === 'A4',
  "Perihal 'Undangan' terdeteksi A4"
);
assert(
  detectPaperSize('Nota Dinas Pengajuan Pembelian Perlengkapan Kantor') === 'A4',
  "Perihal 'Nota Dinas' terdeteksi A4"
);
assert(
  detectPaperSize('Penyampaian Berkas Usulan Pencairan Dana') === 'A4',
  "Perihal berkas pengantar umum terdeteksi A4"
);

console.log('\n--- PENGUJIAN 5: Deteksi Objek Surat (Database / State Lengkap) ---');
assert(
  detectPaperSize({
    id: 'SRT-01',
    kategori: 'Surat Tugas',
    perihal: 'Penugasan Pelatihan AI',
    nomorSurat: '0012/UN58.6/ST/KP.02.01/2026'
  }) === 'F4',
  'Objek surat berkategori Surat Tugas terdeteksi F4'
);

assert(
  detectPaperSize({
    id: 'SRT-02',
    kategori: 'Surat Keputusan',
    perihal: 'Penetapan Dosen Pembimbing',
    nomorSurat: '0034/UN58.1/SK/HK.01.02/2026'
  }) === 'F4',
  'Objek surat berkategori Surat Keputusan terdeteksi F4'
);

assert(
  detectPaperSize({
    id: 'SRT-03',
    templateType: 'pos',
    nomorSurat: 'POS/UN58/BKU/KU/01/2026'
  }) === 'F4',
  'Objek POS terdeteksi F4'
);

assert(
  detectPaperSize({
    id: 'SRT-04',
    kategori: 'Nota Dinas',
    perihal: 'Laporan Realisasi Anggaran',
    nomorSurat: '0055/UN58.6/ND/KU.01.04/2026'
  }) === 'A4',
  'Objek surat Nota Dinas terdeteksi A4'
);

assert(
  detectPaperSize({
    id: 'SRT-05',
    kategori: 'Surat Keluar',
    perihal: 'Undangan Workshop Penulisan Proposal Riset',
    nomorSurat: '0089/UN58.9/B/HM.00.01/2026'
  }) === 'A4',
  'Objek surat Undangan terdeteksi A4'
);

console.log('\n--- PENGUJIAN 6: Metadata getPaperSizeInfo ---');
const f4Info = getPaperSizeInfo('tugas');
assert(f4Info.isF4 === true && f4Info.isA4 === false, 'getPaperSizeInfo tugas menandai isF4: true');
assert(f4Info.height === '330mm', 'getPaperSizeInfo tugas tinggi 330mm');

const a4Info = getPaperSizeInfo('surat-dinas');
assert(a4Info.isA4 === true && a4Info.isF4 === false, 'getPaperSizeInfo surat-dinas menandai isA4: true');
assert(a4Info.height === '297mm', 'getPaperSizeInfo surat-dinas tinggi 297mm');

console.log(`\n========================================`);
console.log(`HASIL: ${passedCount} pengujian BERHASIL, ${failedCount} GAGAL`);
console.log(`========================================\n`);

if (failedCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}

