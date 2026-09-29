/**
 * Unit Test: Role-Based FormatBarSelector & Dynamic Template Scoping
 * Berdasarkan Peraturan Rektor Universitas Siliwangi No. 3/2023 Bab III & IV
 * dan "Tabel 1: Matriks Kewenangan Penandatanganan Naskah Dinas"
 * 
 * Target Verifikasi:
 * 1. Normalisasi Peran (Role Normalization): Least Privilege Principle
 * 2. Scoping Ketat DOSEN_NON_JABATAN (Hanya Tepat 6 Naskah Tridharma & Internal)
 * 3. Penomoran Dinamis Urut Mulai Nomor 1 (Sequential Numbering 1..6 tanpa loncatan)
 * 4. Pemblokiran Total Seluruh Template Kebijakan/Institusi dari DOM (POS, SE, SD, SK, Undangan, dll)
 * 5. Scoping Pejabat Dekan & Rektor (Tabel 1)
 * 6. Proteksi Tampering & Fallback Otomatis
 */

import {
  DOCUMENT_TEMPLATES,
  LECTURER_ALLOWED_TEMPLATE_IDS,
  normalizeUserRole,
  getAuthorizedTemplates,
  getAuthorizedTemplatesWithNumbering,
  isTemplateAllowedForUser,
  getDefaultTemplateForUser
} from '../../config/documentFormats.ts';

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
  console.log('=============================================================================');
  console.log('TEST SUITE: FORMAT BAR SELECTOR & ROLE-BASED SCOPING (PERTOR UNSIL 3/2023)');
  console.log('=============================================================================\n');

  // Dummy Users
  const dosenNonJabatan = {
    id_user: 101,
    nama: 'Dr. Aris Martono, M.Kom.',
    nip: '197505102005011002',
    role: 'DOSEN',
    jabatan: 'Dosen Informatika',
    is_pejabat: false,
    kode_unit_kerja: 'UN58.13.1'
  };

  const dosenExplicitRole = {
    id_user: 102,
    nama: 'Husni Mubarok, S.T., M.T.',
    nip: '198406122010121004',
    role: 'DOSEN_NON_JABATAN',
    jabatan: 'Dosen Biasa / Tanpa Jabatan',
    is_pejabat: false,
    kode_unit_kerja: 'UN58.13'
  };

  const dekanFT = {
    id_user: 14,
    nama: 'Prof. Dr. Ir. H. Ahmad Zaki, M.T.',
    nip: '196504101990031003',
    role: 'PEJABAT',
    jabatan: 'Dekan Fakultas Teknik',
    is_pejabat: true,
    kode_unit_kerja: 'UN58.13'
  };

  const rektor = {
    id_user: 1,
    nama: 'Prof. Dr. Nundang Busaeri, Ir., M.T., IPU., ASEAN Eng.',
    nip: '196408181989031003',
    role: 'PEJABAT',
    jabatan: 'Rektor Universitas Siliwangi',
    is_pejabat: true,
    kode_unit_kerja: 'UN58'
  };

  const superAdmin = {
    id_user: 999,
    nama: 'Administrator Pusat TIK',
    role: 'SUPER_ADMIN',
    jabatan: 'Super Administrator SILOKA',
    is_pejabat: false
  };

  // -------------------------------------------------------------------------
  // 1. PENGUJIAN NORMALISASI PERAN (ROLE NORMALIZATION)
  // -------------------------------------------------------------------------
  console.log('--- 1. Pengujian Normalisasi Peran (normalizeUserRole) ---');
  assert(
    normalizeUserRole(dosenNonJabatan) === 'DOSEN_NON_JABATAN',
    'Dosen biasa dengan role: "DOSEN" & is_pejabat: false dinormalisasi ke DOSEN_NON_JABATAN'
  );
  assert(
    normalizeUserRole(dosenExplicitRole) === 'DOSEN_NON_JABATAN',
    'Pengguna dengan role eksplisit "DOSEN_NON_JABATAN" dinormalisasi ke DOSEN_NON_JABATAN'
  );
  assert(
    normalizeUserRole(dekanFT) === 'DEKAN',
    'Pengguna dengan jabatan "Dekan Fakultas Teknik" dinormalisasi ke DEKAN'
  );
  assert(
    normalizeUserRole(rektor) === 'REKTOR',
    'Pengguna dengan jabatan "Rektor Universitas Siliwangi" dinormalisasi ke REKTOR'
  );
  assert(
    normalizeUserRole(superAdmin) === 'SUPER_ADMIN',
    'Pengguna dengan role "SUPER_ADMIN" dinormalisasi ke SUPER_ADMIN'
  );
  assert(
    normalizeUserRole(null) === 'DOSEN_NON_JABATAN',
    'Pengguna null secara aman (least privilege) dinormalisasi ke DOSEN_NON_JABATAN'
  );

  // -------------------------------------------------------------------------
  // 2. PENGUJIAN SCOPING FORMAT DOSEN_NON_JABATAN (TEPAT 6 FORMAT)
  // -------------------------------------------------------------------------
  console.log('\n--- 2. Pengujian Scoping Format DOSEN_NON_JABATAN (Tepat 6 Naskah) ---');
  const allowedDosen = getAuthorizedTemplates(dosenNonJabatan);

  assert(
    allowedDosen.length === 6,
    `DOSEN_NON_JABATAN hanya memperoleh tepat 6 template (Ditemukan: ${allowedDosen.length})`
  );

  const dosenIds = allowedDosen.map((t) => t.id);
  assert(
    dosenIds.includes('st_lembar'),
    'Template 1: ST (Lembar) diizinkan untuk Dosen'
  );
  assert(
    dosenIds.includes('st_kolom'),
    'Template 2: ST (Kolom) diizinkan untuk Dosen'
  );
  assert(
    dosenIds.includes('nd'),
    'Template 3: Nota Dinas diizinkan untuk Dosen'
  );
  assert(
    dosenIds.includes('sket'),
    'Template 4: Surat Keterangan diizinkan untuk Dosen'
  );
  assert(
    dosenIds.includes('lap'),
    'Template 5: Laporan diizinkan untuk Dosen'
  );
  assert(
    dosenIds.includes('ts'),
    'Template 6: Telaah Staf diizinkan untuk Dosen'
  );

  // Verifikasi pemblokiran naskah terlarang
  const forbiddenIds = [
    'pos',
    'se',
    'sk',
    'sp',
    'sd',
    'undangan_lembar',
    'undangan_kartu',
    'mou',
    'pks',
    'skua',
    'ba',
    'sper',
    'speng',
    'peng',
    'notula',
    'disp_rektor',
    'tte_doc'
  ];
  const leakedForbidden = forbiddenIds.filter((fid) => dosenIds.includes(fid));
  assert(
    leakedForbidden.length === 0,
    `Tidak ada naskah terlarang/kebijakan institusi yang bocor ke Dosen (Bocor: ${leakedForbidden.length})`
  );

  // -------------------------------------------------------------------------
  // 3. PENGUJIAN PENOMORAN DINAMIS URUT 1..6 (SEQUENTIAL NUMBERING)
  // -------------------------------------------------------------------------
  console.log('\n--- 3. Pengujian Penomoran Dinamis Urut Mulai Nomor 1 (Sequential Numbering) ---');
  const numberedDosen = getAuthorizedTemplatesWithNumbering(dosenNonJabatan);

  assert(
    numberedDosen[0].displayNumber === 1 && numberedDosen[0].displayLabel === '1. ST (Lembar)',
    `Item 1 berlabel urut "1. ST (Lembar)" (Ditemukan: "${numberedDosen[0]?.displayLabel}")`
  );
  assert(
    numberedDosen[1].displayNumber === 2 && numberedDosen[1].displayLabel === '2. ST (Kolom)',
    `Item 2 berlabel urut "2. ST (Kolom)" (Ditemukan: "${numberedDosen[1]?.displayLabel}")`
  );
  assert(
    numberedDosen[2].displayNumber === 3 && numberedDosen[2].displayLabel === '3. Nota Dinas',
    `Item 3 berlabel urut "3. Nota Dinas" (Ditemukan: "${numberedDosen[2]?.displayLabel}")`
  );
  assert(
    numberedDosen[3].displayNumber === 4 && numberedDosen[3].displayLabel === '4. Surat Keterangan',
    `Item 4 berlabel urut "4. Surat Keterangan" (Ditemukan: "${numberedDosen[3]?.displayLabel}")`
  );
  assert(
    numberedDosen[4].displayNumber === 5 && numberedDosen[4].displayLabel === '5. Laporan',
    `Item 5 berlabel urut "5. Laporan" (Ditemukan: "${numberedDosen[4]?.displayLabel}")`
  );
  assert(
    numberedDosen[5].displayNumber === 6 && numberedDosen[5].displayLabel === '6. Telaah Staf',
    `Item 6 berlabel urut "6. Telaah Staf" (Ditemukan: "${numberedDosen[5]?.displayLabel}")`
  );

  // Pastikan tidak ada label yang memakai nomor statis lama yang melompat
  const hasStaticOldNumbers = numberedDosen.some(
    (t) =>
      t.displayLabel.startsWith('5. ST') ||
      t.displayLabel.startsWith('7. Nota') ||
      t.displayLabel.startsWith('15. Surat') ||
      t.displayLabel.startsWith('20. Lap') ||
      t.displayLabel.startsWith('21. Tel')
  );
  assert(
    !hasStaticOldNumbers,
    'Seluruh nomor urut bersih dan tidak memakai indeks statis lama (5, 7, 15, 20, 21)'
  );

  // -------------------------------------------------------------------------
  // 4. PENGUJIAN SCOPING ROLE LAIN (DEKAN & REKTOR)
  // -------------------------------------------------------------------------
  console.log('\n--- 4. Pengujian Scoping Role Pejabat (Dekan & Rektor) ---');
  const allowedDekan = getAuthorizedTemplates(dekanFT);
  const dekanIds = allowedDekan.map((t) => t.id);

  // Dekan tidak boleh membuat dokumen universitas (SK Rektor, SP Rektor, MoU, Disposisi Rektor)
  assert(!dekanIds.includes('sk'), 'Dekan tidak dapat mengakses Keputusan Rektor (sk)');
  assert(!dekanIds.includes('sp'), 'Dekan tidak dapat mengakses Surat Perintah Rektor (sp)');
  assert(!dekanIds.includes('mou'), 'Dekan tidak dapat mengakses Nota Kesepahaman (mou)');
  assert(!dekanIds.includes('disp_rektor'), 'Dekan tidak dapat mengakses Disposisi Rektor (disp_rektor)');

  // Dekan boleh membuat POS, Surat Edaran, Surat Dinas, dll
  assert(dekanIds.includes('pos'), 'Dekan dapat mengakses POS/SOP');
  assert(dekanIds.includes('se'), 'Dekan dapat mengakses Surat Edaran');
  assert(dekanIds.includes('sd'), 'Dekan dapat mengakses Surat Dinas');
  assert(dekanIds.includes('pks'), 'Dekan dapat mengakses PKS Dalam Negeri');

  // Penomoran untuk Dekan juga harus urut mulai dari 1
  const numberedDekan = getAuthorizedTemplatesWithNumbering(dekanFT);
  assert(
    numberedDekan[0].displayNumber === 1 && numberedDekan[0].displayLabel.startsWith('1.'),
    `Penomoran Dekan juga dimulai dari 1 (Item 1: "${numberedDekan[0]?.displayLabel}")`
  );

  // Super Admin mendapatkan semua 23 template
  const allowedAdmin = getAuthorizedTemplates(superAdmin);
  assert(
    allowedAdmin.length === DOCUMENT_TEMPLATES.length,
    `Super Admin mendapatkan seluruh ${DOCUMENT_TEMPLATES.length} template naskah dinas`
  );

  // -------------------------------------------------------------------------
  // 5. PENGUJIAN VALIDASI & TAMPER-PROTECTION FALLBACK
  // -------------------------------------------------------------------------
  console.log('\n--- 5. Pengujian Validasi & Proteksi Tampering Fallback ---');
  assert(
    isTemplateAllowedForUser('st_lembar', dosenNonJabatan) === true,
    'isTemplateAllowedForUser("st_lembar") mengembalikan TRUE untuk Dosen'
  );
  assert(
    isTemplateAllowedForUser('pos', dosenNonJabatan) === false,
    'isTemplateAllowedForUser("pos") mengembalikan FALSE untuk Dosen'
  );
  assert(
    isTemplateAllowedForUser('sd', dosenNonJabatan) === false,
    'isTemplateAllowedForUser("sd") mengembalikan FALSE untuk Dosen'
  );
  assert(
    isTemplateAllowedForUser('sk', dosenNonJabatan) === false,
    'isTemplateAllowedForUser("sk") mengembalikan FALSE untuk Dosen'
  );

  assert(
    getDefaultTemplateForUser(dosenNonJabatan) === 'st_lembar',
    'getDefaultTemplateForUser untuk Dosen adalah "st_lembar"'
  );
  assert(
    getDefaultTemplateForUser(superAdmin) === 'pos',
    'getDefaultTemplateForUser untuk Super Admin adalah "pos"'
  );

  // -------------------------------------------------------------------------
  // REKAPITULASI HASIL
  // -------------------------------------------------------------------------
  console.log('\n=============================================================================');
  console.log(`HASIL AKHIR: ${passed} pengujian BERHASIL, ${failed} GAGAL`);
  console.log('=============================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();

