/**
 * Unit Test: Otentikasi & Login Controller SILOKA UNSIL
 * 
 * Menguji:
 * 1. SANITISASI INPUT USERNAME (Trim & Lowercase)
 * 2. REVISI QUERY OTENTIKASI (Flexible Column Check: username OR email)
 * 3. NOTIFIKASI ERROR YANG AMAN (Tanpa membocorkan kredensial master)
 * 4. VALIDASI KATA SANDI (bcrypt.compare / password_verify)
 */

import { loginUser } from '../../../server/controllers/authController.js';
import { storeNewUser, mutateUserJobAssignment } from '../../../server/services/userManagementService.js';

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

// Mock Express req & res objects
function createMockReqRes(body) {
  const req = { body };
  let statusCode = 200;
  let responseData = null;

  const res = {
    status(code) {
      statusCode = code;
      return res;
    },
    json(data) {
      responseData = data;
      return res;
    },
    getStatusCode() {
      return statusCode;
    },
    getResponse() {
      return responseData;
    }
  };

  return { req, res };
}

async function runTests() {
  console.log('=== TEST SETUP: Buat Akun Dosen Baru di Database / Memory Store ===');
  const newUser = await storeNewUser({
    nip: '199105202020121005',
    nama: 'Dr. Hendra Gunawan, M.T.',
    email: 'hendra.gunawan@unsil.ac.id',
    kode_unit: 'UN58.13',
    jabatan: 'Dosen Biasa / Tanpa Jabatan'
  });
  console.log(`  Akun dibuat: NIP ${newUser.user.nip}, Email: ${newUser.user.email}, Password Acak: ${newUser.user.raw_password}`);

  console.log('\n=== TEST 1: Sanitisasi Username (Spasi Spontan & Huruf Besar) via EMAIL ===');
  // Input dengan spasi berlebih dan huruf besar acak: "   HENDRA.GUNAWAN@UNSIL.AC.ID   "
  const { req: req1, res: res1 } = createMockReqRes({
    username: '   HENDRA.GUNAWAN@UNSIL.AC.ID   ',
    password: newUser.user.raw_password
  });

  await loginUser(req1, res1);
  const status1 = res1.getStatusCode();
  const data1 = res1.getResponse();

  assert(status1 === 200, `Status HTTP 200 OK (didapat: ${status1})`);
  assert(data1.success === true, 'Login berhasil dengan email yang disanitisasi trim & lowercase');
  assert(data1.user.email === 'hendra.gunawan@unsil.ac.id', 'Data pengguna yang login cocok: hendra.gunawan@unsil.ac.id');
  assert(data1.user.password === undefined, 'Password hash TIDAK bocor ke client');


  console.log('\n=== TEST 2: Flexible Column Check: Login Menggunakan USERNAME (NIP) ===');
  // Input dengan username NIP dan spasi: " 199105202020121005 "
  const { req: req2, res: res2 } = createMockReqRes({
    username: ' 199105202020121005 ',
    password: newUser.user.raw_password
  });

  await loginUser(req2, res2);
  const status2 = res2.getStatusCode();
  const data2 = res2.getResponse();

  assert(status2 === 200, `Status HTTP 200 OK menggunakan username NIP (didapat: ${status2})`);
  assert(data2.user.nip === '199105202020121005', 'NIP cocok dengan user di database');


  console.log('\n=== TEST 3: Notifikasi Error yang Aman untuk User TIDAK Terdaftar ===');
  const nonExistentEmail = 'tidak.terdaftar999@unsil.ac.id';
  const { req: req3, res: res3 } = createMockReqRes({
    username: nonExistentEmail,
    password: 'PasswordBebas123'
  });

  await loginUser(req3, res3);
  const status3 = res3.getStatusCode();
  const data3 = res3.getResponse();

  assert(status3 === 404, `Status HTTP 404 Not Found (didapat: ${status3})`);
  assert(data3.success === false, 'success bernilai false');
  
  const expectedSafeError = "Gagal Masuk: Username atau Email '@unsil.ac.id' tidak terdaftar dalam sistem SILOKA. Silakan hubungi Super Admin.";
  assert(data3.message === expectedSafeError, `Pesan error aman tepat 100%:\n    "${data3.message}"`);
  assert(!data3.message.includes('Siloka2026!'), 'Pesan error TIDAK MEMBOCORKAN master password apa pun!');


  console.log('\n=== TEST 4: Kata Sandi Salah (Verifikasi Bcrypt Gagal) ===');
  const { req: req4, res: res4 } = createMockReqRes({
    username: 'hendra.gunawan@unsil.ac.id',
    password: 'KataSandiSalahTotal'
  });

  await loginUser(req4, res4);
  const status4 = res4.getStatusCode();
  const data4 = res4.getResponse();

  assert(status4 === 401, `Status HTTP 401 Unauthorized saat password salah (didapat: ${status4})`);
  assert(data4.message.includes('Kata sandi yang Anda masukkan salah'), 'Pesan kesalahan kata sandi tampil dengan tepat');


  console.log('\n=== TEST 5: Login Pegawai Setelah Dimutasi & Reset Password ===');
  // Mutasi pegawai ke FKIP dengan password baru 'Unsil7788'
  await mutateUserJobAssignment({
    userId: '199105202020121005',
    targetUnit: 'UN58.10',
    role: 'PEJABAT',
    role_label: 'Wakil Dekan FKIP',
    email: 'hendra.fkip@unsil.ac.id',
    password_baru: 'Unsil7788'
  });

  // Login dengan email baru dan password baru
  const { req: req5, res: res5 } = createMockReqRes({
    username: '  HENDRA.FKIP@UNSIL.AC.ID  ',
    password: 'Unsil7788'
  });

  await loginUser(req5, res5);
  const status5 = res5.getStatusCode();
  const data5 = res5.getResponse();

  assert(status5 === 200, 'Login berhasil dengan kredensial baru hasil mutasi');
  assert(data5.user.kode_unit === 'UN58.10', 'Unit kerja login terbarui ke UN58.10');
  assert(data5.user.email === 'hendra.fkip@unsil.ac.id', 'Email aktif login terbarui ke hendra.fkip@unsil.ac.id');


  console.log('\n=== TEST 6: Login User "nana.sujana@unsil.ac.id" (Kepala Biro BKU) ===');
  // Pengujian khusus user yang dilaporkan: nana.sujana@unsil.ac.id
  const { req: req6, res: res6 } = createMockReqRes({
    username: 'nana.sujana@unsil.ac.id',
    password: 'Siloka2026!'
  });

  await loginUser(req6, res6);
  const status6 = res6.getStatusCode();
  const data6 = res6.getResponse();

  assert(status6 === 200, `Status HTTP 200 OK untuk nana.sujana@unsil.ac.id (didapat: ${status6})`);
  assert(data6.success === true, 'Login nana.sujana@unsil.ac.id berhasil');
  assert(data6.user.email === 'nana.sujana@unsil.ac.id', 'Email pengguna terotentikasi: nana.sujana@unsil.ac.id');
  assert(data6.user.role === 'PEJABAT', 'Role pengguna sesuai: PEJABAT');
  assert(data6.user.kode_unit === 'UN58.6', 'Satker pengguna sesuai: UN58.6 (Biro Keuangan dan Umum)');


  console.log('\n=== TEST 7: Bypass Case-Sensitivity: "  NANA.SUJANA@UNSIL.AC.ID  " ===');
  const { req: req7, res: res7 } = createMockReqRes({
    username: '   NANA.SUJANA@UNSIL.AC.ID   ',
    password: 'Siloka2026!'
  });

  await loginUser(req7, res7);
  const status7 = res7.getStatusCode();
  const data7 = res7.getResponse();

  assert(status7 === 200, `Status HTTP 200 OK untuk huruf besar & spasi liar (didapat: ${status7})`);
  assert(data7.user.email === 'nana.sujana@unsil.ac.id', 'Sanitisasi berhasil mengenali email nana.sujana@unsil.ac.id');


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

