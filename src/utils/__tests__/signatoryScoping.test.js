/**
 * Automated Verification Test Suite: Signatory Authority Scoping Engine
 * Berdasarkan Tabel 1: Matriks Kewenangan Penandatanganan Naskah Dinas
 * (Peraturan Rektor Universitas Siliwangi No. 3 Tahun 2023)
 * 
 * Verifikasi End-to-End:
 * 1. Resolusi 13 Jenis Naskah Dinas Dekan & 7 Jenis Naskah Dinas Kajur
 * 2. Pemblokiran Total Dokumen Tingkat Universitas (KEPUTUSAN, PERATURAN, INSTRUKSI, SURAT_PERINTAH, MOU)
 * 3. Enforcing Status Draf: 'DRAFT_MENUNGGU_PARAF' & Penomoran Tertunda: nomor_surat === null
 * 4. Penolakan HTTP 422 jika Penandatangan atau Jenis Naskah Melanggar Tabel 1
 */

import http from 'http';
import app from '../../../server/app.js';
import {
  resolveAvailableLetterTypesForUser,
  validateDraftSubmission,
  DEKAN_ALLOWED_TYPES,
  KAJUR_ALLOWED_TYPES,
  UNIVERSITY_EXCLUSIVE_TYPES
} from '../../../server/services/signatoryResolutionService.js';
import {
  FALLBACK_SCOPED_LETTER_TYPES,
  fetchAvailableLetterTypes
} from '../../services/letterService.js';

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

async function runSignatoryScopingTests() {
  console.log('=============================================================================');
  console.log('TEST SUITE: SIGNATORY AUTHORITY SCOPING ENGINE (TABEL 1 PERTOR UNSIL 3/2023)');
  console.log('=============================================================================\n');

  // Dummy Konseptor: Dosen Jurusan Informatika Fakultas Teknik
  const dosenInformatika = {
    id_user: 201,
    nama: 'Dr. Aris Martono, M.Kom.',
    nip: '197505102005011002',
    role: 'DOSEN',
    jabatan: 'Dosen Informatika',
    kode_unit_kerja: 'UN58.13.1'
  };

  // -------------------------------------------------------------------------
  // 1. UNIT TEST: RESOLUTION SERVICE (signatoryResolutionService.js)
  // -------------------------------------------------------------------------
  console.log('--- 1. Pengujian Resolusi Kewenangan Penandatanganan Konseptor Fakultas ---');
  
  const scopingData = await resolveAvailableLetterTypesForUser(dosenInformatika);
  assert(scopingData !== null && scopingData !== undefined, 'Service berhasil mengembalikan data scoping.');
  assert(scopingData.is_drafter_only === true, 'Pengguna teridentifikasi sebagai Konseptor/Drafter.');
  assert(scopingData.user_scope === 'FAKULTAS', 'Lingkup kewenangan terkunci pada tingkat FAKULTAS (UN58.13).');
  assert(scopingData.total_allowed === 13, `Tepat 13 jenis naskah dinas tersedia untuk Dekan (Ditemukan: ${scopingData.total_allowed}).`);

  // Pastikan tidak ada satupun instrumen tingkat universitas yang lolos
  const hasUniversityDoc = scopingData.types.some(t => UNIVERSITY_EXCLUSIVE_TYPES.includes(t.kode_jenis_naskah));
  assert(!hasUniversityDoc, 'Naskah eksklusif Universitas (KEPUTUSAN, PERATURAN, INSTRUKSI, SURAT_PERINTAH, MOU) tidak muncul.');

  // Verifikasi SURAT_TUGAS: Hanya Dekan yang sah, Kajur tidak diizinkan
  const suratTugas = scopingData.types.find(t => t.kode_jenis_naskah === 'SURAT_TUGAS');
  assert(suratTugas !== undefined, 'Jenis naskah SURAT_TUGAS terdaftar.');
  assert(suratTugas.can_choose_signatory === false, 'SURAT_TUGAS mengunci opsi penandatangan (can_choose_signatory: false).');
  assert(suratTugas.available_signatories.length === 1, 'SURAT_TUGAS hanya memiliki 1 pejabat penandatangan.');
  assert(suratTugas.available_signatories[0].role_penandatangan === 'DEKAN', 'SURAT_TUGAS mewajibkan Dekan sebagai penandatangan.');

  // Verifikasi NOTA_DINAS: Boleh dipilih antara Kajur atau Dekan
  const notaDinas = scopingData.types.find(t => t.kode_jenis_naskah === 'NOTA_DINAS');
  assert(notaDinas !== undefined, 'Jenis naskah NOTA_DINAS terdaftar.');
  assert(notaDinas.can_choose_signatory === true, 'NOTA_DINAS mengizinkan pemilihan penandatangan (can_choose_signatory: true).');
  assert(notaDinas.available_signatories.length === 2, 'NOTA_DINAS menyediakan 2 hierarki (Ketua Jurusan & Dekan).');

  // Verifikasi 7 Jenis Naskah Bersama (Kajur + Dekan)
  const multiSignerCount = scopingData.types.filter(t => t.can_choose_signatory).length;
  assert(multiSignerCount === 7, `Tepat 7 jenis naskah dinas dapat ditandatangani oleh Ketua Jurusan (Ditemukan: ${multiSignerCount}).`);

  // -------------------------------------------------------------------------
  // 2. UNIT TEST: SUBMISSION VALIDATION LOGIC (validateDraftSubmission)
  // -------------------------------------------------------------------------
  console.log('\n--- 2. Pengujian Validasi Integritas Penandatanganan (validateDraftSubmission) ---');

  // Dekan ID (14) dan Kajur ID (201)
  const dekanId = scopingData.superiors.dekan.id;
  const kajurId = scopingData.superiors.ketuaJurusan.id;

  // A. Lolos: Surat Tugas ditandatangani Dekan
  try {
    const validDraft = await validateDraftSubmission(dosenInformatika, 'SURAT_TUGAS', dekanId);
    assert(validDraft.isValid === true, 'SURAT_TUGAS dengan Dekan dinyatakan VALID.');
    assert(validDraft.signatory.role_penandatangan === 'DEKAN', 'Penandatangan terverifikasi sebagai Dekan.');
  } catch (err) {
    assert(false, `Gagal memvalidasi draft sah: ${err.message}`);
  }

  // B. Ditolak HTTP 422: Surat Tugas ditandatangani Kajur (Melanggar Tabel 1)
  const kajurSuratTugasRes = await validateDraftSubmission(dosenInformatika, 'SURAT_TUGAS', kajurId);
  const kajurSuratTugasBlocked = (kajurSuratTugasRes.isValid === false && kajurSuratTugasRes.statusCode === 422 && kajurSuratTugasRes.error === 'UnauthorizedSignatoryAssignment');
  assert(kajurSuratTugasBlocked, 'Kajur menandatangani SURAT_TUGAS berhasil dicegah (HTTP 422 UnauthorizedSignatoryAssignment).');

  // C. Ditolak HTTP 422: Naskah Universitas (KEPUTUSAN) dibuat oleh Dosen Fakultas
  const univDocRes = await validateDraftSubmission(dosenInformatika, 'KEPUTUSAN', dekanId);
  const univDocBlocked = (univDocRes.isValid === false && univDocRes.statusCode === 422 && univDocRes.error === 'UnauthorizedDocumentType');
  assert(univDocBlocked, 'Pembuatan KEPUTUSAN oleh Dosen berhasil dicegah (HTTP 422 UnauthorizedDocumentType).');

  // -------------------------------------------------------------------------
  // 3. INTEGRATION TEST: EXPRESS REST API ENDPOINTS (GET & POST)
  // -------------------------------------------------------------------------
  console.log('\n--- 3. Pengujian API Endpoint Backend (Express Integration) ---');

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  async function apiRequest(path, { method = 'GET', headers = {}, body = null } = {}) {
    const opts = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': '201',
        'x-user-role': 'DOSEN',
        'x-unit-code': 'UN58.13.1',
        ...headers
      }
    };
    if (body) {
      opts.body = JSON.stringify(body);
    }
    const res = await fetch(`${baseUrl}${path}`, opts);
    const json = await res.json().catch(() => ({}));
    return { status: res.status, body: json };
  }

  // A. GET /api/naskah/available-types
  const getTypesRes = await apiRequest('/api/naskah/available-types');
  assert(getTypesRes.status === 200, `GET /api/naskah/available-types mengembalikan HTTP 200 (Aktual: ${getTypesRes.status}).`);
  assert(getTypesRes.body.data?.total_allowed === 13, 'API mengembalikan tepat 13 jenis naskah terlingkup.');
  assert(getTypesRes.body.data?.superiors?.dekan !== undefined, 'API menyertakan identitas Dekan Fakultas Teknik.');
  assert(getTypesRes.body.data?.superiors?.ketuaJurusan !== undefined, 'API menyertakan identitas Ketua Jurusan Informatika.');

  // B. POST /api/surat/draft: Sah (Nota Dinas ditandatangani Ketua Jurusan)
  const validDraftPayload = {
    kode_jenis_naskah: 'NOTA_DINAS',
    id_penandatangan: kajurId,
    perihal: 'Permohonan Penggunaan Laboratorium Komputer Lanjut',
    isi_surat: 'Sehubungan dengan pelaksanaan praktikum kecerdasan buatan, kami mohon izin...',
    tujuan: 'Kepala Laboratorium Komputer',
    kode_jra: 'PP.00.03'
  };
  const postDraftRes = await apiRequest('/api/surat/draft', {
    method: 'POST',
    body: validDraftPayload
  });
  assert(postDraftRes.status === 201, `POST /api/surat/draft berhasil mengembalikan HTTP 201 (Aktual: ${postDraftRes.status}).`);
  assert(postDraftRes.body.data?.status === 'DRAFT_MENUNGGU_PARAF', `Status draft naskah tersimpan sebagai 'DRAFT_MENUNGGU_PARAF' (Aktual: ${postDraftRes.body.data?.status}).`);
  assert(postDraftRes.body.data?.nomor_surat === null, 'Nomor surat resmi tertunda (nomor_surat === null) sebelum penandatanganan final.');
  assert(postDraftRes.body.data?.signatory_assigned?.role_penandatangan === 'KETUA_JURUSAN', 'Penandatangan tercatat sebagai KETUA_JURUSAN.');

  // C. POST /api/surat/draft: Sah (Surat Tugas ditandatangani Dekan)
  const validStDraftPayload = {
    kode_jenis_naskah: 'SURAT_TUGAS',
    id_penandatangan: dekanId,
    perihal: 'Surat Tugas Pembimbingan Lomba Gemastik 2026',
    isi_surat: 'Memberikan tugas kepada dosen pembimbing lomba mahasiswa...',
    tujuan: 'Dosen Pembimbing',
    kode_jra: 'PP.00.03'
  };
  const postStRes = await apiRequest('/api/surat/draft', {
    method: 'POST',
    body: validStDraftPayload
  });
  assert(postStRes.status === 201, 'POST /api/surat/draft SURAT_TUGAS oleh Dekan berhasil disimpan (HTTP 201).');
  assert(postStRes.body.data?.signatory_assigned?.role_penandatangan === 'DEKAN', 'Penandatangan SURAT_TUGAS tercatat sebagai DEKAN.');
  assert(postStRes.body.data?.nomor_surat === null, 'Nomor surat SURAT_TUGAS tetap null pada tahap draf.');

  // D. POST /api/surat/draft: Gagal HTTP 422 jika Kajur dipaksa menandatangani Surat Tugas
  const invalidSignerPayload = {
    kode_jenis_naskah: 'SURAT_TUGAS',
    id_penandatangan: kajurId, // Ilegal: Kajur tidak boleh ttd Surat Tugas (hanya Dekan)
    perihal: 'Surat Tugas Ilegal',
    isi_surat: 'Uji coba penolakan kewenangan...',
    tujuan: 'Peserta',
    kode_jra: 'PP.00.03'
  };
  const postInvalidSignerRes = await apiRequest('/api/surat/draft', {
    method: 'POST',
    body: invalidSignerPayload
  });
  assert(postInvalidSignerRes.status === 422, `POST draf dengan penandatangan tidak berwenang mengembalikan HTTP 422 (Aktual: ${postInvalidSignerRes.status}).`);
  assert(postInvalidSignerRes.body.error === 'UnauthorizedSignatoryAssignment', 'Error code: UnauthorizedSignatoryAssignment.');

  // E. POST /api/surat/draft: Gagal HTTP 422 jika mencoba membuat instrumen universitas (PERATURAN)
  const invalidTypePayload = {
    kode_jenis_naskah: 'PERATURAN',
    id_penandatangan: dekanId,
    perihal: 'Rancangan Peraturan Fakultas',
    isi_surat: 'Peraturan fakultas tidak diperkenankan dibuat dari lingkup ini...',
    tujuan: 'Segenap Sivitas Akademika',
    kode_jra: 'HK.01.00'
  };
  const postInvalidTypeRes = await apiRequest('/api/surat/draft', {
    method: 'POST',
    body: invalidTypePayload
  });
  assert(postInvalidTypeRes.status === 422, `POST draf dokumen universitas mengembalikan HTTP 422 (Aktual: ${postInvalidTypeRes.status}).`);
  assert(postInvalidTypeRes.body.error === 'UnauthorizedDocumentType', 'Error code: UnauthorizedDocumentType.');

  // -------------------------------------------------------------------------
  // 4. FRONTEND CONFIGURATION & CLIENT INTEGRATION (letterService.js)
  // -------------------------------------------------------------------------
  console.log('\n--- 4. Pengujian Konfigurasi Frontend & Fallback Service (letterService.js) ---');
  assert(FALLBACK_SCOPED_LETTER_TYPES.length === 13, `FALLBACK_SCOPED_LETTER_TYPES memiliki tepat 13 jenis naskah (Aktual: ${FALLBACK_SCOPED_LETTER_TYPES.length}).`);
  const clientHasUnivType = FALLBACK_SCOPED_LETTER_TYPES.some(t => UNIVERSITY_EXCLUSIVE_TYPES.includes(t.kode_jenis_naskah));
  assert(!clientHasUnivType, 'FALLBACK_SCOPED_LETTER_TYPES tidak memuat dokumen eksklusif universitas.');

  // Tutup server
  await new Promise(resolve => server.close(resolve));

  console.log('\n=============================================================================');
  console.log(`HASIL AKHIR PENGUJIAN: ${passed} LULUS, ${failed} GAGAL`);
  console.log('=============================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runSignatoryScopingTests().catch(err => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
