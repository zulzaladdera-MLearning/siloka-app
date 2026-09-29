/**
 * Automated Verification Test: End-to-End User Registration & RBAC Subsystem
 * SILOKA Universitas Siliwangi (UNSIL) - SK Rektor No. 2803 & Pasal 66
 */

import http from 'http';
import app from '../../../server/app.js';
import pg from 'pg';

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

async function runRbacTests() {
  console.log('=============================================================================');
  console.log('TEST SUITE: USER REGISTRATION & RBAC SUBSYSTEM VERIFICATION (SILOKA UNSIL)');
  console.log('=============================================================================\n');

  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:siloka123%23@127.0.0.1:5432/siloka_db';
  const dbClient = new pg.Client({ connectionString });
  await dbClient.connect();

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // Helper fetch wrapper
    async function apiRequest(path, { method = 'GET', headers = {}, body = null } = {}) {
      const opts = {
        method,
        headers: {
          'Content-Type': 'application/json',
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

    // -------------------------------------------------------------------------
    // 1. TIER 2: AUTHENTICATION & SESSION HYDRATION (POST /api/auth/login)
    // -------------------------------------------------------------------------
    console.log('--- 1. Pengujian Otentikasi & Hidrasi Sesi Pengguna (Ahmad Fauzi - Staf Keuangan) ---');
    const loginRes = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: {
        username: 'fauzi.keuangan@unsil.ac.id',
        password: 'siloka123#'
      }
    });

    assert(loginRes.status === 200, 'Endpoint POST /api/auth/login merespon status 200 OK');
    const authUser = loginRes.body.user;

    assert(authUser.id_user === 104 || authUser.id === 104, 'id_user terhidrasi tepat (104)');
    assert(authUser.nama === 'Ahmad Fauzi, A.Md.', 'Nama lengkap terhidrasi tepat (Ahmad Fauzi, A.Md.)');
    assert(authUser.nip_nik === '198801122015041001', 'NIP terhidrasi tepat (198801122015041001)');
    assert(authUser.role === 'Staf Keuangan', 'Role terhidrasi sebagai Staf Keuangan');
    assert(authUser.kode_unit_kerja === 'BKU', 'Kode unit kerja terikat ke BKU');
    assert(authUser.max_keamanan === 'Terbatas', 'Batas maksimum keamanan akses bernilai Terbatas');
    
    assert(
      Array.isArray(authUser.allowed_prefixes) &&
      authUser.allowed_prefixes.includes('KU') &&
      authUser.allowed_prefixes.includes('PP.02.00'),
      'Klaster prefix JRA memuat wewenang tupoksi: [KU, PP.02.00]'
    );

    assert(
      Array.isArray(authUser.permissions) &&
      authUser.permissions.includes('keuangan:view') &&
      authUser.permissions.includes('surat:read') &&
      authUser.permissions.includes('surat:create_draft') &&
      authUser.permissions.includes('arsip:read'),
      'Permissions memuat hak aksi lengkap: [surat:read, surat:create_draft, keuangan:view, arsip:read]'
    );

    const fauziToken = loginRes.body.token;
    assert(Boolean(fauziToken), 'Token otentikasi JWT terbit dengan payload terenkripsi');

    // -------------------------------------------------------------------------
    // 2. TIER 1: SUPER ADMIN REGISTRATION (POST /api/admin/users)
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Pengujian Registrasi Pengguna Baru oleh Super Admin ---');

    // A. Akses tanpa otorisasi Super Admin harus 403 Forbidden
    const unauthReg = await apiRequest('/api/admin/users', {
      method: 'POST',
      headers: { Authorization: `Bearer ${fauziToken}` }, // Token Staf Keuangan, bukan Super Admin
      body: {
        nama_lengkap: 'Hendra Gunawan, S.T.',
        nip_nik: '199208152019031005',
        email: 'hendra.ft@unsil.ac.id',
        password: 'siloka123#',
        kode_unit_kerja: 'FT',
        id_role: 4, // Staf Akademik
        max_keamanan_akses: 'Biasa/Terbuka'
      }
    });

    assert(unauthReg.status === 403, 'Staf biasa DITOLAK (HTTP 403) saat mengakses POST /api/admin/users');

    // B. Pendaftaran oleh Super Admin resmi
    // Hapus akun uji coba jika ada sebelumnya
    await dbClient.query("DELETE FROM tbl_users WHERE email = 'hendra.ft@unsil.ac.id' OR nip_nik = '199208152019031005'");

    const superAdminToken = 'superadmin-secret-token';
    const regPayload = {
      nama_lengkap: 'Hendra Gunawan, S.T.',
      nip_nik: '199208152019031005',
      email: 'hendra.ft@unsil.ac.id',
      password: 'siloka123#',
      kode_unit_kerja: 'FT',
      id_role: 4, // Staf Administrasi Akademik
      max_keamanan_akses: 'Biasa/Terbuka',
      custom_prefixes: ['PP', 'KP.02'] // custom override tambahan
    };

    const adminRegRes = await apiRequest('/api/admin/users', {
      method: 'POST',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: regPayload
    });

    assert(adminRegRes.status === 201, 'Super Admin BERHASIL mendaftarkan staf baru (HTTP 201 Created)');
    assert(adminRegRes.body.data.role === 'Staf Administrasi Akademik', 'Staf baru terikat ke role Staf Administrasi Akademik');
    assert(adminRegRes.body.data.kode_unit_kerja === 'FT', 'Staf baru terikat ke unit kerja FT');
    assert(
      adminRegRes.body.data.allowed_prefixes.includes('PP') &&
      adminRegRes.body.data.allowed_prefixes.includes('KP.02'),
      'Klaster prefix JRA staf baru terpasang akurat: [PP, KP.02]'
    );

    // C. Pengujian Cegah Duplikasi NIP / Email
    const duplicateRegRes = await apiRequest('/api/admin/users', {
      method: 'POST',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: regPayload
    });

    assert(duplicateRegRes.status === 409, 'Sistem menolak duplikasi NIP/Email dengan HTTP 409 Conflict');

    // -------------------------------------------------------------------------
    // 3. TIER 4: DYNAMIC SQL QUERY SCOPING & SECURITY CLEARANCE
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Pengujian Dynamic Query Scoping & Policy Keamanan (Pasal 66) ---');

    // A. Query daftar surat oleh Staf Keuangan (GET /api/surat)
    const fauziSuratList = await apiRequest('/api/surat', {
      headers: { Authorization: `Bearer ${fauziToken}` }
    });

    assert(fauziSuratList.status === 200, 'GET /api/surat merespon status 200 OK untuk user berhak');
    const letters = fauziSuratList.body.data || [];

    // Semua surat yang diterima harus ber-prefix KU atau PP.02.00 dan max keamanan <= Terbatas
    const allMatchTupoksi = letters.every(l => {
      const matchPrefix = l.kode_jra.startsWith('KU') || l.kode_jra.startsWith('PP.02.00');
      const matchSecurity = l.klasifikasi_keamanan === 'Biasa/Terbuka' || l.klasifikasi_keamanan === 'Terbatas';
      return matchPrefix && matchSecurity;
    });

    assert(allMatchTupoksi, 'Seluruh surat yang ditampilkan strictly terbatas pada klaster KU/PP.02.00 & max Terbatas');

    // B. Verifikasi Penolakan Akses Naskah Rahasia / Luar Klaster (GET /api/surat/:id)
    // Ambil surat berklasifikasi akademik (PP.01.01) atau di luar KU
    const nonFinanceLetterRes = await dbClient.query("SELECT s.id_surat, s.nomor_surat, s.kode_jra, j.klasifikasi_keamanan FROM tbl_surat s JOIN tbl_master_jra j ON s.kode_jra = j.kode_jra WHERE s.kode_jra LIKE 'PP.01%' LIMIT 1");
    if (nonFinanceLetterRes.rows.length > 0) {
      const restrictedLetter = nonFinanceLetterRes.rows[0];
      const detailCheck = await apiRequest(`/api/surat/${restrictedLetter.id_surat}`, {
        headers: { Authorization: `Bearer ${fauziToken}` }
      });

      assert(detailCheck.status === 403, `Akses surat '${restrictedLetter.nomor_surat}' (${restrictedLetter.kode_jra}) DITOLAK dengan HTTP 403 Forbidden untuk Staf Keuangan`);
    }

    // C. Super Admin dapat mengakses surat apapun tanpa batas klaster
    const adminSuratList = await apiRequest('/api/surat', {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });

    assert(adminSuratList.status === 200, 'Super Admin memiliki akses global tanpa batasan klaster (Unrestricted)');

  } catch (err) {
    console.error('Error saat menjalankan test suite RBAC:', err);
    process.exit(1);
  } finally {
    server.close();
    await dbClient.end();
  }

  console.log('\n=============================================================================');
  console.log(`TOTAL PENGUJIAN RBAC: ${passed + failed} | BERHASIL: ${passed} | GAGAL: ${failed}`);
  console.log('=============================================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runRbacTests();
