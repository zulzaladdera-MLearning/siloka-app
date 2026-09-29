/**
 * Unit Test: Modul Tambah User (Super Admin) - SILOKA UNSIL
 * 
 * Verifikasi Logika Bisnis:
 * 1. Pilihan "Dosen Biasa / Tanpa Jabatan" pada dropdown:
 *    - Menyimpan status 'is_pejabat = false'.
 *    - Mengikat 'kode_unit' sesuai unit kerja yang dipilih (misal: 'UN58.13' / Fakultas Teknik).
 *    - Menyimpan jabatan sebagai 'Dosen Biasa'.
 * 2. Kredensial Otomatis (Tanpa Input Password Manual):
 *    - Username = Diambil dari NIP.
 *    - Password = String acak format 'Unsil' + 4 angka acak (misal: 'Unsil4819').
 *    - Password di-hash menggunakan bcrypt sebelum disimpan.
 * 3. Format Baku Flash Message / Notifikasi Sukses:
 *    "User Berhasil Dibuat! Nama: [Nama] | Unit: [Unit] | Jabatan: Dosen Biasa | Username: [NIP] | Password: [Password_Acak]"
 * 4. Pilihan Jabatan Struktural (misal: "Dekan"):
 *    - Menyimpan status 'is_pejabat = true'.
 */

import { generateRandomUnsilPassword, hashPassword, comparePassword } from '../../../server/utils/passwordHelper.js';
import { storeNewUser } from '../../../server/services/userManagementService.js';

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
  console.log('=== TEST 1: Pembuatan User "Dosen Biasa / Tanpa Jabatan" di Fakultas Teknik ===');
  const payloadDosenFT = {
    nip: '198904122018031002',
    nama: 'Ir. Fajar Nugraha, M.T.',
    email: 'fajar.nugraha@unsil.ac.id',
    kode_unit: 'UN58.13', // Fakultas Teknik
    jabatan: 'Dosen Biasa / Tanpa Jabatan'
  };

  const resultDosen = await storeNewUser(payloadDosenFT);
  const user = resultDosen.user;

  // 1. Verifikasi status is_pejabat = FALSE
  assert(user.is_pejabat === false, 'Status is_pejabat adalah FALSE untuk Dosen Biasa');
  assert(user.kode_unit === 'UN58.13', 'kode_unit terikat sesuai pilihan: UN58.13');
  assert(user.unit === 'Fakultas Teknik', 'Nama unit terikat: Fakultas Teknik');
  assert(user.jabatan === 'Dosen Biasa', 'Jabatan dinormalisasi menjadi "Dosen Biasa"');
  assert(user.role === 'DOSEN', 'Role akun diset ke "DOSEN"');

  // 2. Verifikasi Username diambil dari NIP
  assert(user.username === payloadDosenFT.nip, 'Username diambil otomatis dari NIP (198904122018031002)');

  // 3. Verifikasi Password Acak format 'Unsil' + 4 angka acak
  assert(/^Unsil\d{4}$/.test(user.raw_password), `Password acak '${user.raw_password}' berformat 'Unsil' + 4 digit angka`);
  
  // 4. Verifikasi Hashing Password bcrypt
  const isHashValid = await comparePassword(user.raw_password, user.password);
  assert(isHashValid === true, 'Password terenkripsi bcrypt secara valid dan cocok dengan hash yang tersimpan');

  // 5. Verifikasi Flash Message persis sesuai format yang diminta user:
  // "Akun Berhasil Dibuat! Username: [NIP] | Password: [Password_Acak]"
  const expectedFlashMessage = `Akun Berhasil Dibuat! Username: ${payloadDosenFT.nip} | Password: ${user.raw_password}`;
  assert(resultDosen.flashMessage === expectedFlashMessage, `Flash Message tepat: "${resultDosen.flashMessage}"`);


  console.log('\n=== TEST 2: Pembuatan User Jabatan Struktural ("Dekan" di FKIP) ===');
  const payloadDekanFKIP = {
    nip: '197204151998021001',
    nama: 'Dr. H. Cucu Suherman, M.Pd.',
    email: 'cucu.suherman@unsil.ac.id',
    kode_unit: 'UN58.10', // FKIP
    jabatan: 'Dekan'
  };

  const resultDekan = await storeNewUser(payloadDekanFKIP);
  const userDekan = resultDekan.user;

  assert(userDekan.is_pejabat === true, 'Status is_pejabat adalah TRUE untuk Dekan (Struktural)');
  assert(userDekan.kode_unit === 'UN58.10', 'kode_unit terikat: UN58.10');
  assert(userDekan.unit === 'Fakultas Keguruan dan Ilmu Pendidikan', 'Nama unit: Fakultas Keguruan dan Ilmu Pendidikan');
  assert(userDekan.jabatan === 'Dekan', 'Jabatan tersimpan: Dekan');
  assert(userDekan.role === 'PEJABAT', 'Role diset ke "PEJABAT"');
  assert(userDekan.username === payloadDekanFKIP.nip, 'Username didefinisikan dari NIP Dekan');
  assert(/^Unsil\d{4}$/.test(userDekan.raw_password), `Password acak Dekan '${userDekan.raw_password}' valid`);


  console.log('\n=== TEST 3: Generator Random Password Helper ===');
  for (let i = 0; i < 5; i++) {
    const pwd = generateRandomUnsilPassword();
    assert(/^Unsil\d{4}$/.test(pwd), `Iterasi ${i + 1}: Password acak '${pwd}' lolos regex ^Unsil\\d{4}$`);
  }

  console.log(`\n========================================`);
  console.log(`HASIL AKHIR: ${passed} pengujian BERHASIL, ${failed} GAGAL`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();

