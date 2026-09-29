/**
 * TEST SUITE: SOTK BIDIRECTIONAL SYNC & PROGRAM STUDI / JURUSAN SOTK UNSIL
 * 
 * Verifikasi:
 * 1. Seluruh program studi dari dokumen resmi "Program Studi di Unsil.pdf"
 *    terpetakan ke Ketua Jurusan & Sekretaris Jurusan (Bebas total dari Kaprodi).
 * 2. Sinkronisasi 2 arah antara Unit Kerja Struktural (OTK) dan Filter Induk (Tier 1).
 * 3. Scoping formasi jabatan (Tier 2) strictly sesuai dengan fakultas yang dipilih.
 * 4. Pemilihan Ketua Jurusan / Sekjur tidak pernah mereset Tier 1 ke ALL atau membuat OTK blank.
 */

import { pool } from '../../../server/config/database.js';
import {
  MASTER_FACULTIES,
  MASTER_POSITIONS,
  OTK_UNSIL_UNITS,
  UNSIL_REKTORAT_ALLOWED_CODES,
  LPPM_ALLOWED_CODES,
  LPMPP_ALLOWED_CODES
} from '../../modules/admin/sotkMasterData.ts';
import { getAllPositions } from '../../modules/admin/leadership.service.ts';

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failedTests++;
  }
}

async function runTests() {
  console.log('=============================================================================');
  console.log('TEST SUITE: SOTK BIDIRECTIONAL SYNC & JURUSAN PER "PROGRAM STUDI DI UNSIL.PDF"');
  console.log('=============================================================================\n');

  try {
    // -------------------------------------------------------------------------
    // 1. Verifikasi Data Program Studi Sesuai "Program Studi di Unsil.pdf"
    // -------------------------------------------------------------------------
    console.log('--- 1. Pengujian Pemetaan Dokumen Resmi "Program Studi di Unsil.pdf" ---');
    const positionsInDb = await getAllPositions();
    assert(positionsInDb.length >= 100, `Jumlah formasi di basis data memadai (Ditemukan: ${positionsInDb.length})`);

    // Pastikan bebas total dari 'KAPRODI_%'
    const kaprodiPos = positionsInDb.filter((p) => p.position_code.startsWith('KAPRODI_'));
    assert(kaprodiPos.length === 0, `Tidak ada jabatan Koordinator Program Studi / Kaprodi (Ditemukan: ${kaprodiPos.length})`);

    // FT (Dekanat 4 + 5 Jurusan x 2 = 14)
    const ftPositions = positionsInDb.filter((p) => p.faculty_id === 'FT');
    assert(ftPositions.length === 14, `Fakultas Teknik memiliki tepat 14 formasi (Dekan, Wadek 1, Wadek 2, Kasubbag TU + 5 Jurusan x 2) (Ditemukan: ${ftPositions.length})`);
    assert(ftPositions.some((p) => p.position_code === 'DEKAN_FT'), 'Dekan FT terdaftar');
    assert(ftPositions.some((p) => p.position_code === 'WADEK_FT_1'), 'Wakil Dekan 1 FT terdaftar');
    assert(ftPositions.some((p) => p.position_code === 'WADEK_FT_2'), 'Wakil Dekan 2 FT terdaftar');
    assert(ftPositions.some((p) => p.position_code === 'KASUBBAG_TU_FT'), 'Kasubbag TU FT terdaftar');
    assert(ftPositions.some((p) => p.position_code === 'KAJUR_SIPIL_FT'), 'Ketua Jurusan Teknik Sipil terdaftar di FT');
    assert(ftPositions.some((p) => p.position_code === 'SEKJUR_SIPIL_FT'), 'Sekretaris Jurusan Teknik Sipil terdaftar di FT');
    assert(ftPositions.some((p) => p.position_code === 'KAJUR_ELEKTRO_FT'), 'Ketua Jurusan Teknik Elektro terdaftar di FT');
    assert(ftPositions.some((p) => p.position_code === 'SEKJUR_ELEKTRO_FT'), 'Sekretaris Jurusan Teknik Elektro terdaftar di FT');
    assert(ftPositions.some((p) => p.position_code === 'KAJUR_INFORMATIKA_FT'), 'Ketua Jurusan Informatika terdaftar di FT');
    assert(ftPositions.some((p) => p.position_code === 'SEKJUR_INFORMATIKA_FT'), 'Sekretaris Jurusan Informatika terdaftar di FT');
    assert(ftPositions.some((p) => p.position_code === 'KAJUR_SI_FT'), 'Ketua Jurusan Sistem Informasi terdaftar di FT');
    assert(ftPositions.some((p) => p.position_code === 'SEKJUR_SI_FT'), 'Sekretaris Jurusan Sistem Informasi terdaftar di FT');
    assert(ftPositions.some((p) => p.position_code === 'KAJUR_SAINSDATA_FT'), 'Ketua Jurusan Sains Data terdaftar di FT');
    assert(ftPositions.some((p) => p.position_code === 'SEKJUR_SAINSDATA_FT'), 'Sekretaris Jurusan Sains Data terdaftar di FT');

    // FAI (Dekanat 4 + 2 Jurusan x 2 = 8)
    const faiPositions = positionsInDb.filter((p) => p.faculty_id === 'FAI');
    assert(faiPositions.length === 8, `FAI memiliki tepat 8 formasi (Ditemukan: ${faiPositions.length})`);
    assert(faiPositions.some((p) => p.position_code === 'DEKAN_FAI'), 'Dekan FAI terdaftar');
    assert(faiPositions.some((p) => p.position_code === 'WADEK_FAI_1'), 'Wakil Dekan 1 FAI terdaftar');
    assert(faiPositions.some((p) => p.position_code === 'WADEK_FAI_2'), 'Wakil Dekan 2 FAI terdaftar');
    assert(faiPositions.some((p) => p.position_code === 'KASUBBAG_TU_FAI'), 'Kasubbag TU FAI terdaftar');
    assert(faiPositions.some((p) => p.position_code === 'KAJUR_EKSYAR_FAI'), 'Ketua Jurusan Ekonomi Syariah terdaftar di FAI');
    assert(faiPositions.some((p) => p.position_code === 'KAJUR_MMH_FAI'), 'Ketua Jurusan Manajemen Mutu Halal terdaftar di FAI');

    // FEB (Dekanat 4 + 5 Jurusan x 2 = 14)
    const febPositions = positionsInDb.filter((p) => p.faculty_id === 'FEB');
    assert(febPositions.length === 14, `FEB memiliki tepat 14 formasi (Ditemukan: ${febPositions.length})`);
    assert(febPositions.some((p) => p.position_code === 'DEKAN_FEB'), 'Dekan FEB terdaftar');
    assert(febPositions.some((p) => p.position_code === 'WADEK_FEB_1'), 'Wakil Dekan 1 FEB terdaftar');
    assert(febPositions.some((p) => p.position_code === 'WADEK_FEB_2'), 'Wakil Dekan 2 FEB terdaftar');
    assert(febPositions.some((p) => p.position_code === 'KASUBBAG_TU_FEB'), 'Kasubbag TU FEB terdaftar');
    assert(febPositions.some((p) => p.position_code === 'KAJUR_PERBANKAN_D3_FEB'), 'Ketua Jurusan Perbankan D3 terdaftar di FEB');
    assert(febPositions.some((p) => p.position_code === 'KAJUR_PERBANKAN_D4_FEB'), 'Ketua Jurusan Perbankan D4 terdaftar di FEB');

    // FP (Dekanat 4 + 3 Jurusan x 2 = 10)
    const fpPositions = positionsInDb.filter((p) => p.faculty_id === 'FP');
    assert(fpPositions.length === 10, `FP memiliki tepat 10 formasi (Ditemukan: ${fpPositions.length})`);
    assert(fpPositions.some((p) => p.position_code === 'DEKAN_FP'), 'Dekan FP terdaftar');
    assert(fpPositions.some((p) => p.position_code === 'WADEK_FP_1'), 'Wakil Dekan 1 FP terdaftar');
    assert(fpPositions.some((p) => p.position_code === 'WADEK_FP_2'), 'Wakil Dekan 2 FP terdaftar');
    assert(fpPositions.some((p) => p.position_code === 'KASUBBAG_TU_FP'), 'Kasubbag TU FP terdaftar');
    assert(fpPositions.some((p) => p.position_code === 'KAJUR_TEKPANGAN_FP'), 'Ketua Jurusan Teknologi Pangan terdaftar di FP');

    // FIK (Dekanat 4 + 2 Jurusan x 2 = 8)
    const fikPositions = positionsInDb.filter((p) => p.faculty_id === 'FIK');
    assert(fikPositions.length === 8, `FIK memiliki tepat 8 formasi (Ditemukan: ${fikPositions.length})`);
    assert(fikPositions.some((p) => p.position_code === 'DEKAN_FIK'), 'Dekan FIK terdaftar');
    assert(fikPositions.some((p) => p.position_code === 'WADEK_FIK_1'), 'Wakil Dekan 1 FIK terdaftar');
    assert(fikPositions.some((p) => p.position_code === 'WADEK_FIK_2'), 'Wakil Dekan 2 FIK terdaftar');
    assert(fikPositions.some((p) => p.position_code === 'KASUBBAG_TU_FIK'), 'Kasubbag TU FIK terdaftar');
    assert(fikPositions.some((p) => p.position_code === 'KAJUR_GIZI_FIK'), 'Ketua Jurusan Gizi terdaftar di FIK');

    // FISIP (Dekanat 4 + 2 Jurusan x 2 = 8)
    const fisipPositions = positionsInDb.filter((p) => p.faculty_id === 'FISIP');
    assert(fisipPositions.length === 8, `FISIP memiliki tepat 8 formasi (Ditemukan: ${fisipPositions.length})`);
    assert(fisipPositions.some((p) => p.position_code === 'DEKAN_FISIP'), 'Dekan FISIP terdaftar');
    assert(fisipPositions.some((p) => p.position_code === 'WADEK_FISIP_1'), 'Wakil Dekan 1 FISIP terdaftar');
    assert(fisipPositions.some((p) => p.position_code === 'WADEK_FISIP_2'), 'Wakil Dekan 2 FISIP terdaftar');
    assert(fisipPositions.some((p) => p.position_code === 'KASUBBAG_TU_FISIP'), 'Kasubbag TU FISIP terdaftar');
    assert(fisipPositions.some((p) => p.position_code === 'KAJUR_HUKUMBISNIS_FISIP'), 'Ketua Jurusan Hukum Bisnis terdaftar di FISIP');

    // FKIP (Dekanat 4 + 13 Jurusan x 2 = 30)
    const fkipPositions = positionsInDb.filter((p) => p.faculty_id === 'FKIP');
    assert(fkipPositions.length === 30, `FKIP memiliki tepat 30 formasi (Dekan, Wadek 1, Wadek 2, Kasubbag TU + 13 Jurusan x 2) (Ditemukan: ${fkipPositions.length})`);
    assert(fkipPositions.some((p) => p.position_code === 'DEKAN_FKIP'), 'Dekan FKIP terdaftar');
    assert(fkipPositions.some((p) => p.position_code === 'WADEK_FKIP_1'), 'Wakil Dekan 1 FKIP terdaftar');
    assert(fkipPositions.some((p) => p.position_code === 'WADEK_FKIP_2'), 'Wakil Dekan 2 FKIP terdaftar');
    assert(fkipPositions.some((p) => p.position_code === 'KASUBBAG_TU_FKIP'), 'Kasubbag TU FKIP terdaftar');

    // PASCA (Pimpinan 4 + 10 Jurusan x 2 = 24)
    const pascaPositions = positionsInDb.filter((p) => p.faculty_id === 'PASCA');
    assert(pascaPositions.length === 24, `Pascasarjana memiliki tepat 24 formasi (Direktur, Wadir 1, Wadir 2, Kasubbag TU + 10 Jurusan x 2) (Ditemukan: ${pascaPositions.length})`);
    assert(pascaPositions.some((p) => p.position_code === 'DIREKTUR_PASCA'), 'Direktur Pascasarjana terdaftar');
    assert(pascaPositions.some((p) => p.position_code === 'WADIR_PASCA' || p.position_code === 'WADIR_PASCA_1'), 'Wadir 1 Pascasarjana terdaftar');
    assert(pascaPositions.some((p) => p.position_code === 'WADIR_PASCA_2'), 'Wadir 2 Pascasarjana terdaftar');
    assert(pascaPositions.some((p) => p.position_code === 'KASUBBAG_TU_PASCA'), 'Kasubbag TU Pascasarjana terdaftar');

    // -------------------------------------------------------------------------
    // 2. Pengujian Sinkronisasi Ketat 2-Arah UI State
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Pengujian Sinkronisasi Ketat 2-Arah (OTK ↔ Tier 1 ↔ Tier 2) ---');

    // Pastikan kode fakultas di OTK_UNSIL_UNITS dan MASTER_FACULTIES selaras
    const otkCodes = OTK_UNSIL_UNITS.map((u) => u.kode);
    const tier1Codes = MASTER_FACULTIES.map((f) => f.id);
    for (const fac of ['FT', 'FKIP', 'FEB', 'FP', 'FAI', 'FIK', 'FISIP', 'PASCA', 'UNSIL']) {
      assert(otkCodes.includes(fac), `OTK_UNSIL_UNITS memuat kode '${fac}'`);
      assert(tier1Codes.includes(fac), `MASTER_FACULTIES memuat kode '${fac}'`);
    }
    assert(!otkCodes.includes('BKU'), 'OTK_UNSIL_UNITS tidak memuat BKU (karena sudah masuk Rektorat)');
    assert(!otkCodes.includes('BAKPK'), 'OTK_UNSIL_UNITS tidak memuat BAKPK (karena sudah masuk Rektorat)');
    assert(!tier1Codes.includes('BKU'), 'MASTER_FACULTIES tidak memuat BKU');
    assert(!tier1Codes.includes('BAKPK'), 'MASTER_FACULTIES tidak memuat BAKPK');

    // Resolusi Parent Faculty saat memilih Kajur di Tier 2
    const testCases = [
      { code: 'KAJUR_INFORMATIKA_FT', expectedFaculty: 'FT', name: 'Ketua Jurusan Informatika' },
      { code: 'SEKJUR_SIPIL_FT', expectedFaculty: 'FT', name: 'Sekretaris Jurusan Teknik Sipil' },
      { code: 'KAJUR_EKSYAR_FAI', expectedFaculty: 'FAI', name: 'Ketua Jurusan Ekonomi Syariah' },
      { code: 'KAJUR_PERBANKAN_D3_FEB', expectedFaculty: 'FEB', name: 'Ketua Jurusan Perbankan D3' },
      { code: 'KAJUR_TEKPANGAN_FP', expectedFaculty: 'FP', name: 'Ketua Jurusan Teknologi Pangan' },
      { code: 'KAJUR_GIZI_FIK', expectedFaculty: 'FIK', name: 'Ketua Jurusan Gizi' },
      { code: 'KAJUR_HUKUMBISNIS_FISIP', expectedFaculty: 'FISIP', name: 'Ketua Jurusan Hukum Bisnis' }
    ];

    for (const tc of testCases) {
      const posObj = MASTER_POSITIONS.find((p) => p.code === tc.code);
      assert(posObj !== undefined, `Posisi ${tc.name} (${tc.code}) terdaftar di MASTER_POSITIONS`);
      assert(posObj?.facultyId === tc.expectedFaculty, `facultyId untuk ${tc.name} tepat '${tc.expectedFaculty}'`);
    }

    // Pastikan Tier 1 TIDAK mengandung '-- Seluruh Unit Kerja --'
    assert(
      !MASTER_FACULTIES.some((f) => f.id === 'ALL'),
      'MASTER_FACULTIES tidak memuat opsi ALL (mencegah reset ke Seluruh Unit Kerja)'
    );

    // -------------------------------------------------------------------------
    // 3. Pengujian Eksklusif Formasi Rektorat & Pejabat Struktural Biro (UNSIL)
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Pengujian Formasi Eksklusif Rektorat & Pejabat Biro (Permintaan Pengguna) ---');

    // Pastikan UNSIL_REKTORAT_ALLOWED_CODES memuat tepat 8 posisi
    assert(
      UNSIL_REKTORAT_ALLOWED_CODES.length === 8,
      `UNSIL_REKTORAT_ALLOWED_CODES memuat tepat 8 jabatan (Ditemukan: ${UNSIL_REKTORAT_ALLOWED_CODES.length})`
    );

    const expectedCodes = [
      'REKTOR',
      'WAREK_1',
      'WAREK_2',
      'WAREK_3',
      'KEPALA_BIRO_BKU',
      'KEPALA_BIRO_BAKPK',
      'KABAG_UMUM_BKU',
      'KABAG_AKADEMIK_BAKPK'
    ];

    for (const code of expectedCodes) {
      assert(UNSIL_REKTORAT_ALLOWED_CODES.includes(code), `Kode '${code}' terdaftar dalam UNSIL_REKTORAT_ALLOWED_CODES`);
      const posObj = MASTER_POSITIONS.find((p) => p.code === code);
      assert(posObj !== undefined, `Jabatan '${code}' terdaftar di MASTER_POSITIONS (${posObj?.name})`);
    }

    // Pastikan WAREK_4 tidak ada di MASTER_POSITIONS maupun UNSIL_REKTORAT_ALLOWED_CODES
    assert(!UNSIL_REKTORAT_ALLOWED_CODES.includes('WAREK_4'), 'WAREK_4 tidak ada dalam formasi resmi Rektorat');
    assert(!MASTER_POSITIONS.some((p) => p.code === 'WAREK_4'), 'WAREK_4 telah dihapus dari MASTER_POSITIONS');

    // Simulasi filter UI LeadershipMutationPanel saat unit UNSIL dipilih
    const filteredForUnsil = MASTER_POSITIONS.filter((p) => UNSIL_REKTORAT_ALLOWED_CODES.includes(p.code));
    assert(filteredForUnsil.length === 8, `Filter UI untuk unit UNSIL menghasilkan tepat 8 formasi (Ditemukan: ${filteredForUnsil.length})`);

    // Pastikan TIDAK ADA Dekan apapun yang bocor ke pilihan unit UNSIL
    const dekanInUnsil = filteredForUnsil.filter((p) => p.code.startsWith('DEKAN_'));
    assert(dekanInUnsil.length === 0, `Tidak ada Dekan yang bocor saat unit UNSIL dipilih (Ditemukan: ${dekanInUnsil.length})`);

    // Verifikasi nama resmi di basis data
    const warek2Db = positionsInDb.find((p) => p.position_code === 'WAREK_2');
    assert(warek2Db?.name === 'Wakil Rektor Bidang Keuangan dan Umum', `Nama WAREK_2 di DB: '${warek2Db?.name}'`);

    const kabagUmumDb = positionsInDb.find((p) => p.position_code === 'KABAG_UMUM_BKU');
    assert(kabagUmumDb !== undefined, `KABAG_UMUM_BKU terdaftar di basis data ('${kabagUmumDb?.name}')`);

    const kabagAkademikDb = positionsInDb.find((p) => p.position_code === 'KABAG_AKADEMIK_BAKPK');
    assert(kabagAkademikDb !== undefined, `KABAG_AKADEMIK_BAKPK terdaftar di basis data ('${kabagAkademikDb?.name}')`);

    const warek4Db = positionsInDb.find((p) => p.position_code === 'WAREK_4');
    assert(warek4Db === undefined, 'WAREK_4 tidak ada dalam database');

    // -------------------------------------------------------------------------
    // 4. Pengujian Formasi Struktural LPPM & LPMPP (Permintaan Pengguna)
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Pengujian Formasi Struktural LPPM & LPMPP ---');

    // Verifikasi LPPM (8 Formasi)
    assert(LPPM_ALLOWED_CODES.length === 8, `LPPM_ALLOWED_CODES memuat tepat 8 jabatan (Ditemukan: ${LPPM_ALLOWED_CODES.length})`);
    const lppmExpected = [
      'KEPALA_LPPM',
      'SEKRETARIS_LPPM',
      'KASUBBAG_TU_LPPM',
      'KAPUS_PENELITIAN_LPPM',
      'KAPUS_PENGABDIAN_LPPM',
      'KAPUS_PUBLIKASI_HAKI_LPPM',
      'KAPUS_INOVASI_BISNIS_LPPM',
      'KAPUS_STUDI_HALAL_LPPM'
    ];
    for (const code of lppmExpected) {
      assert(LPPM_ALLOWED_CODES.includes(code), `Kode '${code}' terdaftar dalam LPPM_ALLOWED_CODES`);
      const posObj = MASTER_POSITIONS.find((p) => p.code === code);
      assert(posObj !== undefined, `Jabatan '${code}' terdaftar di MASTER_POSITIONS (${posObj?.name})`);
      assert(posObj?.facultyId === 'LPPM', `facultyId '${code}' tepat 'LPPM'`);
      const inDb = positionsInDb.find((p) => p.position_code === code);
      assert(inDb !== undefined, `Jabatan '${code}' terdaftar di basis data ('${inDb?.name}')`);
    }

    // Verifikasi LPMPP (7 Formasi)
    assert(LPMPP_ALLOWED_CODES.length === 7, `LPMPP_ALLOWED_CODES memuat tepat 7 jabatan (Ditemukan: ${LPMPP_ALLOWED_CODES.length})`);
    const lpmppExpected = [
      'KEPALA_LPMPP',
      'SEKRETARIS_LPMPP',
      'KASUBBAG_TU_LPMPP',
      'KAPUS_MUTU_AUDIT_LPMPP',
      'KAPUS_KURIKULUM_LPMPP',
      'KAPUS_PEMBELAJARAN_MBKM_LPMPP',
      'KAPUS_KARAKTER_KONSELING_LPMPP'
    ];
    for (const code of lpmppExpected) {
      assert(LPMPP_ALLOWED_CODES.includes(code), `Kode '${code}' terdaftar dalam LPMPP_ALLOWED_CODES`);
      const posObj = MASTER_POSITIONS.find((p) => p.code === code);
      assert(posObj !== undefined, `Jabatan '${code}' terdaftar di MASTER_POSITIONS (${posObj?.name})`);
      assert(posObj?.facultyId === 'LPMPP', `facultyId '${code}' tepat 'LPMPP'`);
      const inDb = positionsInDb.find((p) => p.position_code === code);
      assert(inDb !== undefined, `Jabatan '${code}' terdaftar di basis data ('${inDb?.name}')`);
    }

    // Simulasi filter UI LeadershipMutationPanel saat unit LPPM dipilih
    const filteredForLppm = MASTER_POSITIONS.filter((p) => LPPM_ALLOWED_CODES.includes(p.code));
    assert(filteredForLppm.length === 8, `Filter UI untuk unit LPPM menghasilkan tepat 8 formasi (Ditemukan: ${filteredForLppm.length})`);

    // Simulasi filter UI LeadershipMutationPanel saat unit LPMPP dipilih
    const filteredForLpmpp = MASTER_POSITIONS.filter((p) => LPMPP_ALLOWED_CODES.includes(p.code));
    assert(filteredForLpmpp.length === 7, `Filter UI untuk unit LPMPP menghasilkan tepat 7 formasi (Ditemukan: ${filteredForLpmpp.length})`);

    // Pastikan OTK_UNSIL_UNITS & MASTER_FACULTIES memuat LPPM dan LPMPP
    assert(otkCodes.includes('LPPM'), "OTK_UNSIL_UNITS memuat unit 'LPPM'");
    assert(otkCodes.includes('LPMPP'), "OTK_UNSIL_UNITS memuat unit 'LPMPP'");
    assert(tier1Codes.includes('LPPM'), "MASTER_FACULTIES memuat unit 'LPPM'");
    assert(tier1Codes.includes('LPMPP'), "MASTER_FACULTIES memuat unit 'LPMPP'");

    // -------------------------------------------------------------------------
    // 5. Pengujian Tukar Posisi Field & Peran Staf / Tupoksi Dinamis per Unit
    // -------------------------------------------------------------------------
    console.log('\n--- 5. Pengujian Tukar Posisi Field & Peran Staf / Tupoksi Dinamis per Unit ---');
    const fs = await import('fs');
    const modalSource = fs.readFileSync('src/components/admin/UserRegistrationModal.tsx', 'utf8');

    const unitFieldIdx = modalSource.indexOf('Unit Kerja Struktural (OTK) *');
    const roleFieldIdx = modalSource.indexOf('Peran Staf / Tupoksi *');
    assert(
      unitFieldIdx > 0 && roleFieldIdx > unitFieldIdx,
      `Unit Kerja Struktural (OTK) berada DI ATAS Peran Staf / Tupoksi (idx ${unitFieldIdx} < ${roleFieldIdx})`
    );

    const dbRolesRes = await pool.query('SELECT id_role, nama_role FROM tbl_roles ORDER BY id_role');
    const dbRoles = dbRolesRes.rows;

    const expectedStaffRolesByUnit = [
      // Rektorat UNSIL - BAKPK
      { id_role: 101, nama: 'Staf / Pelaksana Administrasi Tim Bidang Akademik' },
      { id_role: 102, nama: 'Staf / Pelaksana Administrasi Tim Bidang Kemahasiswaan dan Alumni' },
      { id_role: 103, nama: 'Staf / Pelaksana Administrasi Tim Bidang Perencanaan' },
      { id_role: 104, nama: 'Staf / Pelaksana Administrasi Tim Bidang Kerja Sama' },
      // Rektorat UNSIL - BKU & HKOK
      { id_role: 105, nama: 'Staf / Pelaksana Administrasi Tim Bidang Keuangan' },
      { id_role: 106, nama: 'Staf / Pelaksana Administrasi Tim Bidang Kepegawaian' },
      { id_role: 107, nama: 'Staf / Pelaksana Administrasi Tim Bidang Hukum, Ketatausahaan, Organisasi, dan Ketatalaksanaan (HKOK)' },
      { id_role: 108, nama: 'Analis Hukum & Organisasi' },
      { id_role: 109, nama: 'Arsiparis / Pengendali Surat' },
      { id_role: 110, nama: 'Staf / Pelaksana Administrasi Tim Bidang Kerumahtanggaan dan BMN' },
      { id_role: 111, nama: 'Staf / Pelaksana Administrasi Tim Bidang Keprotokolan dan Humas' },
      // Tingkat Fakultas (Koordinasi Kasubbag Umum)
      { id_role: 201, nama: 'Staf Layanan Akademik, Kemahasiswaan, dan Alumni' },
      { id_role: 202, nama: 'Staf Perencanaan dan Keuangan' },
      { id_role: 203, nama: 'Staf Kepegawaian' },
      { id_role: 204, nama: 'Staf Ketatausahaan, Kerumahtanggaan, dan BMN' },
      { id_role: 205, nama: 'Staf Kerja Sama dan Hubungan Masyarakat' },
      // Tingkat LPPM (Koordinasi Kasubbag Umum LPPM)
      { id_role: 301, nama: 'Staf Layanan Teknis Penelitian dan Pengabdian' },
      { id_role: 302, nama: 'Staf Perencanaan dan Keuangan LPPM' },
      { id_role: 303, nama: 'Staf Kepegawaian, Ketatausahaan, dan BMN' },
      { id_role: 304, nama: 'Staf Kerja Sama dan Kehumasan LPPM' },
      // Tingkat LPMPP (Koordinasi Kasubbag Umum LPMPP)
      { id_role: 401, nama: 'Staf Layanan Teknis Penjaminan Mutu dan Pembelajaran' },
      { id_role: 402, nama: 'Staf Perencanaan dan Keuangan LPMPP' },
      { id_role: 403, nama: 'Staf Kepegawaian, Ketatausahaan, dan BMN' },
      { id_role: 404, nama: 'Staf Kerja Sama LPMPP' }
    ];

    for (const item of expectedStaffRolesByUnit) {
      assert(
        modalSource.includes(`id_role: ${item.id_role}`) && modalSource.includes(item.nama),
        `Role UI terdaftar: [${item.id_role}] ${item.nama}`
      );
      const foundDb = dbRoles.find((r) => Number(r.id_role) === item.id_role);
      assert(
        foundDb !== undefined && foundDb.nama_role === item.nama,
        `Role DB tbl_roles terdaftar: [${item.id_role}] '${foundDb?.nama_role}'`
      );
    }

    console.log('\n=============================================================================');
    console.log(`HASIL AKHIR: ${passedTests} pengujian BERHASIL, ${failedTests} GAGAL`);
    console.log('=============================================================================');

    if (failedTests > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runTests();

