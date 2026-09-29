/**
 * Unit Test: Modul Mutasi Penugasan Pegawai & Manajemen Kredensial Akun Dinamis
 * Aplikasi SILOKA - Universitas Siliwangi
 * 
 * Menguji seluruh aturan spesifikasi:
 * 1. Pembaruan 'kode_unit' baru dan 'email' pada proses mutasi.
 * 2. Conditional check password:
 *    - Jika password baru diisi: dienkripsi menggunakan bcrypt (12 rounds) & tersimpan.
 *    - Jika password baru kosong: dibypass dan password lama tetap utuh.
 * 3. Format baku notifikasi Flash Message:
 *    "Mutasi Berhasil! Pegawai [Nama] telah dipindahkan ke [Unit_Baru]. Email Aktif: [Email]. Password Baru: [Tampilkan Password_Acak_Jika_Ada / Tampilkan 'Tidak Berubah' Jika Kosong]"
 */

import { mutateUserJobAssignment, storeNewUser } from '../../../server/services/userManagementService.js';
import { comparePassword } from '../../../server/utils/passwordHelper.js';

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

async function runTests() {
  console.log('=== TEST SETUP: Buat Akun Pegawai Awal (Fakultas Teknik) ===');
  const initialEmployee = {
    nip: '198904122018031002',
    nama: 'Ir. Fajar Nugraha, M.T.',
    email: 'fajar.nugraha@ft.unsil.ac.id',
    kode_unit: 'UN58.13', // Fakultas Teknik
    jabatan: 'Dosen Biasa / Tanpa Jabatan'
  };

  const createdResult = await storeNewUser(initialEmployee);
  const originalUser = createdResult.user;
  const originalHashedPassword = originalUser.password;
  console.log(`  Akun awal dibuat dengan NIP: ${originalUser.nip}, Unit: ${originalUser.kode_unit}, Password Hash: ${originalHashedPassword.slice(0, 15)}...`);

  console.log('\n=== TEST 1: Mutasi DENGAN Reset Password Baru ===');
  const mutationPayloadWithPassword = {
    userId: originalUser.nip,
    targetUnit: 'UN58.10', // FKIP
    kode_unit: 'UN58.10',
    role: 'PEJABAT',
    role_label: 'Wakil Dekan Bidang Akademik FKIP',
    email: 'fajar.akademik@unsil.ac.id',
    password_baru: 'Unsil9988'
  };

  const resMutasi1 = await mutateUserJobAssignment(mutationPayloadWithPassword);
  const userAfterMutasi1 = resMutasi1.user;

  // 1. Verifikasi Unit Kerja & Email Berubah
  assert(userAfterMutasi1.kode_unit === 'UN58.10', 'kode_unit berhasil dimutasi ke UN58.10 (FKIP)');
  assert(userAfterMutasi1.email === 'fajar.akademik@unsil.ac.id', 'Email aktif diperbarui menjadi fajar.akademik@unsil.ac.id');
  assert(userAfterMutasi1.role === 'PEJABAT', 'Role diperbarui ke PEJABAT');

  // 2. Verifikasi Password Baru Berhasil Di-hash dan Berbeda dari Password Lama
  assert(resMutasi1.password_changed === true, 'Flag password_changed bernilai TRUE');
  assert(userAfterMutasi1.password_status === 'Unsil9988', 'password_status mengembalikan password baru Unsil9988');
  assert(userAfterMutasi1.raw_password === 'Unsil9988', 'raw_password tersimpan untuk keperluan notifikasi aman');
  
  const isNewPasswordValid = await comparePassword('Unsil9988', userAfterMutasi1.password || userAfterMutasi1.password_hash);
  assert(isNewPasswordValid === true, 'Password baru Unsil9988 berhasil diverifikasi kecocokannya dengan bcrypt hash di database');

  // 3. Verifikasi Format Baku Flash Message dengan Password Baru
  const expectedFlash1 = `Mutasi Berhasil! Pegawai Ir. Fajar Nugraha, M.T. telah dipindahkan ke Fakultas Keguruan dan Ilmu Pendidikan. Email Aktif: fajar.akademik@unsil.ac.id. Password Baru: Unsil9988`;
  assert(resMutasi1.flashMessage === expectedFlash1, `Flash Message 1 tepat:\n    "${resMutasi1.flashMessage}"`);


  console.log('\n=== TEST 2: Mutasi TANPA Reset Password (Bypass Password Lama) ===');
  const passwordBeforeMutasi2 = userAfterMutasi1.password || userAfterMutasi1.password_hash;

  const mutationPayloadWithoutPassword = {
    userId: originalUser.nip,
    targetUnit: 'UN58.6', // Biro Keuangan dan Umum
    kode_unit: 'UN58.6',
    role: 'STAF_PERSURATAN',
    role_label: 'Pengelola Tata Persuratan Biro',
    email: 'fajar.biro@unsil.ac.id',
    password_baru: '' // Dikosongkan!
  };

  const resMutasi2 = await mutateUserJobAssignment(mutationPayloadWithoutPassword);
  const userAfterMutasi2 = resMutasi2.user;

  // 1. Verifikasi Unit & Email Berubah
  assert(userAfterMutasi2.kode_unit === 'UN58.6', 'kode_unit berhasil dimutasi ke UN58.6 (Biro Keuangan dan Umum)');
  assert(userAfterMutasi2.email === 'fajar.biro@unsil.ac.id', 'Email aktif diperbarui menjadi fajar.biro@unsil.ac.id');

  // 2. Verifikasi Password Lama TIDAK BERUBAH (Bypass)
  assert(resMutasi2.password_changed === false, 'Flag password_changed bernilai FALSE');
  assert(userAfterMutasi2.password_status === 'Tidak Berubah', 'password_status bernilai "Tidak Berubah"');
  
  const isOldPasswordStillValid = await comparePassword('Unsil9988', userAfterMutasi2.password || userAfterMutasi2.password_hash);
  assert(isOldPasswordStillValid === true, 'Password sebelumnya tetap aktif dan tidak tertimpa/hilang');

  // 3. Verifikasi Format Baku Flash Message saat Password Kosong
  const expectedFlash2 = `Mutasi Berhasil! Pegawai Ir. Fajar Nugraha, M.T. telah dipindahkan ke Biro Keuangan dan Umum. Email Aktif: fajar.biro@unsil.ac.id. Password Baru: Tidak Berubah`;
  assert(resMutasi2.flashMessage === expectedFlash2, `Flash Message 2 tepat:\n    "${resMutasi2.flashMessage}"`);

  console.log('\n=== TEST 3: Mutasi ke Role "DOSEN" (Dosen / Tenaga Pendidik) ===');
  const mutationPayloadDosen = {
    userId: originalUser.nip,
    targetUnit: 'UN58.13', // Fakultas Teknik
    kode_unit: 'UN58.13',
    role: 'DOSEN',
    role_label: 'Dosen Informatika FT',
    email: 'fajar.dosen@unsil.ac.id'
  };

  const resMutasi3 = await mutateUserJobAssignment(mutationPayloadDosen);
  const userAfterMutasi3 = resMutasi3.user;

  assert(userAfterMutasi3.role === 'DOSEN', 'Role berhasil dimutasi ke DOSEN');
  assert(userAfterMutasi3.is_pejabat === false, 'is_pejabat bernilai FALSE untuk role DOSEN');
  assert(userAfterMutasi3.roleLevel === 'Level 2: Fungsional Dosen', 'roleLevel bernilai "Level 2: Fungsional Dosen"');
  assert(userAfterMutasi3.kode_unit === 'UN58.13', 'kode_unit kembali ke Fakultas Teknik (UN58.13)');
  assert(resMutasi3.flashMessage.includes('Fakultas Teknik'), 'Flash message memuat unit baru Fakultas Teknik');

  console.log('\n========================================');
  console.log(`HASIL AKHIR: ${passed} pengujian BERHASIL, ${failed} GAGAL`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Unhandled error in tests:', err);
  process.exit(1);
});

