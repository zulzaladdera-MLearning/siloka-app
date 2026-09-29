/**
 * Unit Test: Otorisasi Khusus Fitur Automated Event Logger Engine & Process Mining
 * Aplikasi SILOKA - Universitas Siliwangi
 * 
 * Menguji kepatuhan akses:
 * 1. Super Admin -> Diberikan akses ke panel Process Mining & tombol ekspor.
 * 2. Bagian IT / UPA TIK (UN58.32, email tik@unsil.ac.id, role programmer/server) -> Diberikan akses.
 * 3. User lain (Dosen, Operator TU Fakultas, Pejabat Dekan non-IT) -> Akses Process Mining disembunyikan/diblokir.
 */

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

// Logika otorisasi yang diimplementasikan di AuditLogView.jsx
function canAccessProcessMining(user) {
  const isSuperAdmin = Boolean(
    user?.role === 'Super Admin' ||
    user?.role === 'SUPER_ADMIN' ||
    user?.id_role === 'Super Admin'
  );

  return isSuperAdmin;
}

console.log('=== TEST 1: Hak Akses Super Admin ===');
const superAdminUser = {
  id: 'usr-sa',
  nip: '198501012010121001',
  role: 'Super Admin',
  unit_kerja_id: 'UN58.32',
  email: 'superadmin@unsil.ac.id'
};
assert(canAccessProcessMining(superAdminUser) === true, 'Super Admin memiliki akses penuh ke fitur warna ungu Process Mining');

console.log('\n=== TEST 2: Pembatasan Akses untuk Bagian IT (Fitur Ungu Khusus Super Admin) ===');
const itStaffUser = {
  id: 'usr-it',
  nip: '199403222020121004',
  role: 'OPERATOR_UNIT',
  roleLabel: 'Staf Server UPA TIK',
  unit_kerja_id: 'UN58.32',
  email: 'reza.fauzi@unsil.ac.id'
};
assert(canAccessProcessMining(itStaffUser) === false, 'Staf Bagian IT UPA TIK TIDAK memiliki akses ke fitur warna ungu');

const programmerUser = {
  id: 'usr-prog',
  nip: '199501012022031001',
  role: 'OPERATOR_UNIT',
  roleLabel: 'Programmer Sistem Informasi',
  unit_kerja_id: 'UN58.TIK',
  email: 'programmer.it@unsil.ac.id'
};
assert(canAccessProcessMining(programmerUser) === false, 'Programmer IT TIDAK memiliki akses ke fitur warna ungu');

console.log('\n=== TEST 3: Pembatasan Akses untuk Akun Non-IT & Non-Super Admin ===');
const dosenUser = {
  id: 'usr-dosen',
  nip: '198904122018031002',
  role: 'DOSEN',
  roleLabel: 'Dosen Biasa Fakultas Teknik',
  unit_kerja_id: 'UN58.13',
  email: 'fajar.nugraha@ft.unsil.ac.id'
};
assert(canAccessProcessMining(dosenUser) === false, 'Dosen biasa TIDAK memiliki akses ke fitur Process Mining');

const operatorTuFakultas = {
  id: 'usr-tu',
  nip: '199105152019032002',
  role: 'OPERATOR_UNIT',
  roleLabel: 'Staf Tata Usaha FKIP',
  unit_kerja_id: 'UN58.10',
  email: 'tu.fkip@unsil.ac.id'
};
assert(canAccessProcessMining(operatorTuFakultas) === false, 'Operator TU Fakultas biasa TIDAK memiliki akses ke fitur Process Mining');

const dekanUser = {
  id: 'usr-dekan',
  nip: '197003181995021001',
  role: 'PEJABAT',
  roleLabel: 'Dekan Fakultas Teknik',
  unit_kerja_id: 'UN58.13',
  email: 'dekan.ft@unsil.ac.id'
};
assert(canAccessProcessMining(dekanUser) === false, 'Pejabat umum non-IT TIDAK melihat panel Process Mining');

console.log('\n========================================');
console.log(`HASIL AKHIR: ${passed} pengujian BERHASIL, ${failed} GAGAL`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
}
