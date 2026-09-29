/**
 * Unit Test: Fitur Penandatangan Otomatis & Master Pejabat (SILOKA UNSIL)
 * 
 * Menguji:
 * 1. Penyaringan unit-scoped (terfilter berdasarkan unit kerja login: FKIP, FT, BKU, Rektorat, LPPM, UPA TIK)
 * 2. Pemetaan auto-fill Nama (+ Gelar resmi) dan NIP
 * 3. Ketersediaan master data pejabat penandatangan resmi
 * 4. Fungsi lookup findPejabatByNip, findPejabatById, dan formatPejabatLabel
 */

import {
  getPejabatByUnit,
  findPejabatByNip,
  findPejabatById,
  formatPejabatLabel
} from '../pejabatHelper.js';
import masterPejabatList from '../../data/masterPejabat.json' with { type: 'json' };

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

console.log('--- PENGUJIAN 1: Kelengkapan Dataset Master Pejabat ---');
assert(Array.isArray(masterPejabatList) && masterPejabatList.length >= 20, `Terdapat ${masterPejabatList.length} data master pejabat aktif`);
const hasDuplicateNip = new Set(masterPejabatList.map(p => p.nip)).size !== masterPejabatList.length;
assert(!hasDuplicateNip, 'Seluruh NIP pada master_pejabat bersifat unik (tanpa duplikasi)');

console.log('\n--- PENGUJIAN 2: Filter Unit Scoped - FKIP (UN58.10) ---');
const fkipList = getPejabatByUnit('UN58.10', true);
const fkipPrimary = fkipList.filter(p => p.kode_unit === 'UN58.10');
const fkipUni = fkipList.filter(p => p.kode_unit === 'UN58');

assert(fkipList.length > 0, 'Daftar pejabat FKIP berhasil dimuat');
assert(fkipPrimary.length >= 2, 'Pejabat utama FKIP memuat Dekan dan Wakil Dekan');
assert(fkipPrimary[0].jabatan.includes('Dekan Fakultas Keguruan dan Ilmu Pendidikan'), 'Pejabat pertama adalah Dekan FKIP');
assert(fkipPrimary[0].nama_gelar === 'Dr. H. Cucu Suherman, M.Pd.', 'Nama Dekan FKIP sesuai standar');
assert(fkipPrimary[0].nip === '197204151998021001', 'NIP Dekan FKIP valid');
assert(fkipUni.length === 0, 'Pejabat unit lain (Rektorat) otomatis disembunyikan untuk Dosen/Staf FKIP');

console.log('\n--- PENGUJIAN 3: Filter Unit Scoped - Fakultas Teknik (UN58.13) ---');
const ftList = getPejabatByUnit('UN58.13', true);
const ftPrimary = ftList.filter(p => p.kode_unit === 'UN58.13');

assert(ftPrimary.length >= 2, 'Pejabat utama FT memuat Dekan dan Wakil Dekan');
assert(ftPrimary[0].jabatan.includes('Dekan Fakultas Teknik'), 'Pejabat pertama adalah Dekan Fakultas Teknik');
assert(ftPrimary[0].nama_gelar === 'Dr. Nurul Hiron, S.T., M.Eng.', 'Nama Dekan FT presisi dengan gelar');
assert(ftPrimary[0].nip === '197306282000031001', 'NIP Dekan FT presisi (18 digit)');

console.log('\n--- PENGUJIAN 4: Filter Unit Scoped - Biro BKU (UN58.6) ---');
const bkuList = getPejabatByUnit('UN58.6', false);
assert(bkuList.length === 1, 'Biro BKU memuat tepat 1 kepala biro jika tanpa universitas');
assert(bkuList[0].jabatan === 'Kepala Biro Keuangan dan Umum', 'Jabatan Kepala BKU presisi');
assert(bkuList[0].nama_gelar === 'Dr. Nana Sujana, Drs., M.Si.', 'Nama Kepala BKU presisi');
assert(bkuList[0].nip === '196808301989031004', 'NIP Kepala BKU presisi');

console.log('\n--- PENGUJIAN 5: Filter Unit Scoped - Rektorat (UN58) ---');
const rektoratList = getPejabatByUnit('UN58', true);
assert(rektoratList.every(p => p.kode_unit === 'UN58'), 'Pejabat Rektorat hanya beranggotakan unit UN58');
const rektor = rektoratList.find(p => p.jabatan === 'Rektor Universitas Siliwangi');
assert(rektor !== undefined, 'Rektor Universitas Siliwangi ditemukan');
assert(rektor.nama_gelar === 'Prof. Dr. Eng. Ir. Aripin, IPU., ASEAN Eng.', 'Gelar resmi Rektor presisi');
assert(rektor.nip === '196708161996031001', 'NIP Rektor presisi');

console.log('\n--- PENGUJIAN 6: Filter Unit Scoped - UPA TIK (UN58.32) & LPPM (UN58.21) ---');
const tikList = getPejabatByUnit('UN58.32', false);
assert(tikList[0].jabatan === 'Kepala UPA TIK', 'Pejabat UPA TIK teridentifikasi');
assert(tikList[0].nama_gelar === 'Alam Rahmatulloh, S.T., M.T.', 'Nama Kepala UPA TIK presisi');

const lppmList = getPejabatByUnit('UN58.21', false);
assert(lppmList[0].jabatan === 'Ketua LPPM Universitas Siliwangi', 'Pejabat LPPM teridentifikasi');
assert(lppmList[0].nama_gelar === 'Dr. Gumilar Mulya, M.Pd.', 'Nama Ketua LPPM presisi');

console.log('\n--- PENGUJIAN 7: Lookup Berdasarkan NIP & ID ---');
const pejabatByNip = findPejabatByNip('197306282000031001');
assert(pejabatByNip !== null && pejabatByNip.jabatan === 'Dekan Fakultas Teknik', 'findPejabatByNip berhasil');

const pejabatById = findPejabatById(1);
assert(pejabatById !== null && pejabatById.nip === '196708161996031001', 'findPejabatById berhasil');

const formattedLabel = formatPejabatLabel(pejabatByNip);
assert(formattedLabel.includes('Dekan Fakultas Teknik') && formattedLabel.includes('Dr. Nurul Hiron'), 'formatPejabatLabel menghasilkan string representatif');

console.log(`\n========================================`);
console.log(`HASIL: ${passedCount} pengujian BERHASIL, ${failedCount} GAGAL`);
console.log(`========================================\n`);

if (failedCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}

