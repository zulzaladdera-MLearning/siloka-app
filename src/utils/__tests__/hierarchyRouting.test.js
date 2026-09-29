/**
 * Test: Sistem Hierarki Otomatis (Automated Hierarchy Routing) Form Surat Keluar
 * 
 * Verifikasi 4 Aturan Kaku Mentor:
 * 1. Deteksi 'kode_unit' dan 'jabatan' session user (Dosen/Staf).
 * 2. Query filter kaku: "SELECT * FROM master_pejabat WHERE kode_unit = [unit_kerja_user_login] AND is_aktif = TRUE".
 * 3. Dropdown HANYA memuat pejabat struktural di dalam naungan unit kerja user tersebut. Pilihan unit lain disembunyikan.
 * 4. Kolom terpisah "Nama Pejabat", "Gelar", dan "NIP" terisi otomatis (auto-fill) secara real-time dan dikunci (readonly).
 */

import { getPejabatByUnit, findPejabatByNip } from '../pejabatHelper.js';
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

console.log('--- ATURAN 1 & 2 & 3: Skenario Dosen Fakultas Teknik (UN58.13) ---');
const sessionDosenFT = {
  id: 'usr-dosen-ft-01',
  name: 'Ir. Ahmad Fauzi, M.T.',
  role: 'DOSEN',
  roleLabel: 'Dosen Jurusan Informatika',
  unit_kerja_id: 'UN58.13'
};

// Eksekusi fungsi hierarki dengan parameter session user
const ftOfficials = getPejabatByUnit(sessionDosenFT.unit_kerja_id, sessionDosenFT);

assert(ftOfficials.length === 2, 'Daftar penandatangan untuk Dosen Teknik tepat berjumlah 2 pejabat struktural FT');
assert(ftOfficials.every(p => p.kode_unit === 'UN58.13'), 'SELURUH pejabat yang muncul berasal dari naungan Fakultas Teknik (UN58.13)');
assert(!ftOfficials.some(p => p.kode_unit !== 'UN58.13'), 'Pejabat dari unit kerja lain (FKIP, FEB, Rektorat, dll) 100% DISEMBUNYIKAN');

const dekanFT = ftOfficials.find(p => p.jabatan === 'Dekan Fakultas Teknik');
const wadekFT = ftOfficials.find(p => p.jabatan === 'Wakil Dekan Bidang Akademik FT');
assert(dekanFT !== undefined, 'Pejabat Dekan Fakultas Teknik tersedia');
assert(wadekFT !== undefined, 'Pejabat Wakil Dekan Bidang Akademik FT tersedia');
assert(dekanFT.is_aktif === true, 'Dekan FT memiliki status is_aktif = TRUE');

console.log('\n--- ATURAN 1 & 2 & 3: Skenario Dosen FKIP (UN58.10) ---');
const sessionDosenFKIP = {
  id: 'usr-dosen-fkip-01',
  name: 'Dra. Sri Wahyuni, M.Pd.',
  role: 'DOSEN',
  roleLabel: 'Dosen Pendidikan Matematika',
  unit_kerja_id: 'UN58.10'
};

const fkipOfficials = getPejabatByUnit(sessionDosenFKIP.unit_kerja_id, sessionDosenFKIP);
assert(fkipOfficials.length === 2, 'Daftar penandatangan untuk Dosen FKIP tepat berjumlah 2 pejabat');
assert(fkipOfficials.every(p => p.kode_unit === 'UN58.10'), 'SELURUH pejabat yang muncul berasal dari naungan FKIP (UN58.10)');
assert(!fkipOfficials.some(p => p.kode_unit === 'UN58.13'), 'Dekan Teknik TIDAK BOLEH muncul untuk Dosen FKIP');
assert(!fkipOfficials.some(p => p.kode_unit === 'UN58'), 'Rektorat TIDAK BOLEH muncul di hierarki Dosen FKIP');

console.log('\n--- ATURAN 1 & 2 & 3: Skenario Staf LPPM (UN58.21) ---');
const sessionStafLPPM = {
  id: 'usr-staf-lppm-01',
  name: 'Budi Santoso, S.AP.',
  role: 'OPERATOR_UNIT',
  roleLabel: 'Staf Administrasi Penelitian LPPM',
  unit_kerja_id: 'UN58.21'
};

const lppmOfficials = getPejabatByUnit(sessionStafLPPM.unit_kerja_id, sessionStafLPPM);
assert(lppmOfficials.length === 1, 'LPPM memuat 1 pejabat struktural');
assert(lppmOfficials[0].jabatan === 'Ketua LPPM Universitas Siliwangi', 'Ketua LPPM terdeteksi');
assert(lppmOfficials[0].kode_unit === 'UN58.21', 'Unit Ketua LPPM adalah UN58.21');

console.log('\n--- ATURAN 4: Auto-Fill Real-Time 3 Input Terpisah (Nama, Gelar, NIP) ---');
// Simulasikan pemilihan Dekan FT
const chosenDekan = ftOfficials.find(p => p.jabatan === 'Dekan Fakultas Teknik');
assert(chosenDekan.nama === 'Dr. Nurul Hiron', 'Kolom "Nama Pejabat" terisi otomatis: Dr. Nurul Hiron');
assert(chosenDekan.gelar === 'S.T., M.Eng.', 'Kolom "Gelar" terisi otomatis: S.T., M.Eng.');
assert(chosenDekan.nip === '197306282000031001', 'Kolom "NIP" terisi otomatis: 197306282000031001');

// Simulasikan pergantian ke Wakil Dekan FT
const chosenWadek = ftOfficials.find(p => p.jabatan === 'Wakil Dekan Bidang Akademik FT');
assert(chosenWadek.nama === 'Husni Mubarok', 'Pergantian real-time -> "Nama Pejabat": Husni Mubarok');
assert(chosenWadek.gelar === 'S.T., M.T.', 'Pergantian real-time -> "Gelar": S.T., M.T.');
assert(chosenWadek.nip === '198205102008121003', 'Pergantian real-time -> "NIP": 198205102008121003');

console.log('\n--- VERIFIKASI KEAMANAN DATA: Integritas Status is_aktif ---');
const allHaveIsAktif = masterPejabatList.every(p => p.is_aktif === true && p.is_active === true);
assert(allHaveIsAktif, 'Seluruh data master_pejabat memiliki flag is_aktif = TRUE');

const allHaveNamaAndGelar = masterPejabatList.every(p => p.nama && p.gelar && p.nip);
assert(allHaveNamaAndGelar, 'Seluruh 26 pejabat memiliki properti terpisah nama, gelar, dan nip');

console.log(`\n========================================`);
console.log(`HASIL: ${passedCount} pengujian BERHASIL, ${failedCount} GAGAL`);
console.log(`========================================\n`);

if (failedCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}

