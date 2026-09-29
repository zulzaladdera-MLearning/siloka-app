/**
 * Test Otomatisasi Kop Surat Dinamis Berdasarkan Unit Kerja Pengguna
 * Sesuai Peraturan Rektor Universitas Siliwangi No. 03 Tahun 2023:
 * - Pasal 30 ayat (2): Rektor / Wakil Rektor / Biro -> Tingkat Universitas (tanpa nama fakultas/biro di baris ketiga)
 * - Pasal 31 ayat (1, 2, 6): Dekan / Dosen / Operator Fakultas / Lembaga / UPA -> Tingkat Unit Kerja (nama unit di baris ketiga dicetak paling tebal)
 */

import { determineKopSurat, findUnitKerja } from '../kopSuratHelper.js';

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

console.log('--- PENGUJIAN 1: Rektor / Rektorat [Pasal 30 ayat (2)] ---');
const rektorKop = determineKopSurat('UN58');
assert(rektorKop.level === 'UNIVERSITAS', 'Rektorat (UN58) adalah Tingkat Universitas');
assert(rektorKop.isTingkatUniversitas === true, 'isTingkatUniversitas bernilai true');
assert(rektorKop.namaUnitBarisTiga === null, 'Baris ketiga KOSONG (tanpa nama fakultas/biro)');
assert(rektorKop.regulasiPasal.includes('Pasal 30'), 'Merujuk pada Pasal 30 ayat (2)');

console.log('\n--- PENGUJIAN 2: Biro BKU & BAKPK [Pasal 30 ayat (2)] ---');
const bkuKop = determineKopSurat('UN58.6');
assert(bkuKop.level === 'UNIVERSITAS', 'Biro Keuangan dan Umum (UN58.6) adalah Tingkat Universitas');
assert(bkuKop.namaUnitBarisTiga === null, 'BKU tidak memunculkan nama unit di baris ketiga (Kop Universitas)');

const bakpkKop = determineKopSurat('UN58.5');
assert(bakpkKop.level === 'UNIVERSITAS', 'Biro BAKPK (UN58.5) adalah Tingkat Universitas');
assert(bakpkKop.namaUnitBarisTiga === null, 'BAKPK tidak memunculkan nama unit di baris ketiga (Kop Universitas)');

console.log('\n--- PENGUJIAN 3: Fakultas (Dekan/Dosen/Operator) [Pasal 31 ayat (1, 2, 6)] ---');
const ftKop = determineKopSurat('UN58.13');
assert(ftKop.level === 'UNIT_KERJA', 'Fakultas Teknik (UN58.13) adalah Tingkat Unit Kerja');
assert(ftKop.isTingkatUnitKerja === true, 'isTingkatUnitKerja bernilai true');
assert(ftKop.namaUnitBarisTiga === 'FAKULTAS TEKNIK', 'Baris ketiga memuat: FAKULTAS TEKNIK');
assert(ftKop.regulasiPasal.includes('Pasal 31'), 'Merujuk pada Pasal 31 ayat (1), (2), & (6)');

const fkipKop = determineKopSurat('UN58.10');
assert(fkipKop.namaUnitBarisTiga === 'FAKULTAS KEGURUAN DAN ILMU PENDIDIKAN', 'Baris ketiga memuat: FAKULTAS KEGURUAN DAN ILMU PENDIDIKAN');

const febKop = determineKopSurat('UN58.11');
assert(febKop.namaUnitBarisTiga === 'FAKULTAS EKONOMI DAN BISNIS', 'Baris ketiga memuat: FAKULTAS EKONOMI DAN BISNIS');

console.log('\n--- PENGUJIAN 4: Lembaga (LPPM & LPMPP) [Pasal 31 ayat (1, 2, 6)] ---');
const lppmKop = determineKopSurat('UN58.21');
assert(lppmKop.level === 'UNIT_KERJA', 'LPPM (UN58.21) adalah Tingkat Unit Kerja');
assert(lppmKop.namaUnitBarisTiga === 'LEMBAGA PENELITIAN DAN PENGABDIAN KEPADA MASYARAKAT', 'Baris ketiga memuat nama resmi LPPM');

const lpmppKop = determineKopSurat('UN58.22');
assert(lpmppKop.namaUnitBarisTiga === 'LEMBAGA PENJAMINAN MUTU DAN PENGEMBANGAN PEMBELAJARAN', 'Baris ketiga memuat nama resmi LPMPP');

console.log('\n--- PENGUJIAN 5: UPA (Unit Penunjang Akademik) [Pasal 31 ayat (1, 2, 6)] ---');
const upaTikKop = determineKopSurat('UN58.32');
assert(upaTikKop.level === 'UNIT_KERJA', 'UPA TIK (UN58.32) adalah Tingkat Unit Kerja');
assert(upaTikKop.namaUnitBarisTiga === 'UNIT PENUNJANG AKADEMIK TEKNOLOGI INFORMASI DAN KOMUNIKASI', 'Baris ketiga memuat nama UPA TIK');

const upaPerpusKop = determineKopSurat('UN58.31');
assert(upaPerpusKop.namaUnitBarisTiga === 'UNIT PENUNJANG AKADEMIK PERPUSTAKAAN', 'Baris ketiga memuat nama UPA Perpustakaan');

console.log('\n--- PENGUJIAN 6: Organ Khusus (Senat, SPI, DP) [Pasal 31 ayat (2)] ---');
const senatKop = determineKopSurat('UN58.SENAT');
assert(senatKop.level === 'UNIT_KERJA', 'Senat (UN58.SENAT) adalah Tingkat Unit Kerja');
assert(senatKop.namaUnitBarisTiga === 'SENAT', 'Baris ketiga memuat: SENAT');

const spiKop = determineKopSurat('UN58.SPI');
assert(spiKop.level === 'UNIT_KERJA', 'SPI (UN58.SPI) adalah Tingkat Unit Kerja');
assert(spiKop.namaUnitBarisTiga === 'SATUAN PENGAWAS INTERNAL', 'Baris ketiga memuat: SATUAN PENGAWAS INTERNAL');

console.log('\n--- PENGUJIAN 7: Input Objek Pengguna (currentUser) ---');
const userRektor = {
  id: 'usr-01',
  name: 'Prof. Dr. Aripin',
  role: 'PEJABAT',
  unit_kerja_id: 'UN58'
};
assert(determineKopSurat(userRektor).level === 'UNIVERSITAS', 'User Rektor menghasilkan Kop Tingkat Universitas');
assert(determineKopSurat(userRektor).namaUnitBarisTiga === null, 'User Rektor baris ketiga null');

const userBiro = {
  id: 'usr-06',
  name: 'Dr. Nana Sujana',
  role: 'PEJABAT',
  unit_kerja_id: 'UN58.6'
};
assert(determineKopSurat(userBiro).level === 'UNIVERSITAS', 'User Kepala Biro BKU menghasilkan Kop Tingkat Universitas');
assert(determineKopSurat(userBiro).namaUnitBarisTiga === null, 'User Kepala Biro BKU baris ketiga null');

const userDekanFT = {
  id: 'usr-10',
  name: 'Dekan Fakultas Teknik',
  role: 'PEJABAT',
  unit_kerja_id: 'UN58.13'
};
assert(determineKopSurat(userDekanFT).level === 'UNIT_KERJA', 'User Dekan FT menghasilkan Kop Tingkat Unit Kerja');
assert(determineKopSurat(userDekanFT).namaUnitBarisTiga === 'FAKULTAS TEKNIK', 'User Dekan FT baris ketiga FAKULTAS TEKNIK');

const userOperatorLPPM = {
  id: 'usr-15',
  name: 'Staf LPPM',
  role: 'OPERATOR_UNIT',
  unit_kerja_id: 'UN58.21'
};
assert(determineKopSurat(userOperatorLPPM).level === 'UNIT_KERJA', 'User Operator LPPM menghasilkan Kop Tingkat Unit Kerja');
assert(determineKopSurat(userOperatorLPPM).namaUnitBarisTiga === 'LEMBAGA PENELITIAN DAN PENGABDIAN KEPADA MASYARAKAT', 'User Operator LPPM baris ketiga LEMBAGA PENELITIAN...');

console.log(`\n========================================`);
console.log(`HASIL: ${passedCount} pengujian BERHASIL, ${failedCount} GAGAL`);
console.log(`========================================\n`);

if (failedCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}

