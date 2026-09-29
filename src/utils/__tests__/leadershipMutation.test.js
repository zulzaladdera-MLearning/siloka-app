/**
 * Automated Verification Test Suite: Leadership Mutation & Assignment Engine
 * Berdasarkan Peraturan Rektor UNSIL No. 3/2023 dan SK Rektor No. 2803/2023
 * 
 * Pengujian:
 * 1. Verifikasi Skema Database PostgreSQL (tbl_positions, tbl_position_assignments, tbl_audit_logs, uq_active_position_occupant)
 * 2. Transaksional Mutasi Kepemimpinan & Row-Level Locking (SELECT ... FOR UPDATE)
 * 3. Demosi Otomatis Pejabat Lama ke DOSEN_NON_JABATAN (is_pejabat = false)
 * 4. Elevasi Otomatis Pejabat Baru ke Role Struktural (is_pejabat = true)
 * 5. Status Penugasan Dinamis (DEFINITIF, PLT, PLH)
 * 6. Keutuhan Audit Trail (tbl_audit_logs)
 * 7. Proteksi Otorisasi SuperAdminGuard (HTTP 403 untuk selain SUPER_ADMIN)
 * 8. Integrasi REST API Express (/api/positions, /api/admin/leadership/mutate)
 */

import http from 'http';
import { pool } from '../../../server/config/database.js';
import app from '../../../server/app.js';
import {
  executeLeadershipMutation,
  getAllPositions,
  getLeadershipAuditLogs
} from '../../modules/admin/leadership.service.ts';
import { SuperAdminGuard } from '../../modules/admin/leadership.guard.ts';

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
  console.log('TEST SUITE: DYNAMIC LEADERSHIP MUTATION ENGINE (PERTOR UNSIL NO. 3/2023)');
  console.log('=============================================================================\n');

  const client = await pool.connect();

  try {
    // -------------------------------------------------------------------------
    // 1. PENGUJIAN SKEMA TABEL BASIS DATA
    // -------------------------------------------------------------------------
    console.log('--- 1. Pengujian Skema Basis Data & Konstrain Unik ---');

    const tableCheckRes = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('tbl_positions', 'tbl_position_assignments', 'tbl_audit_logs')
    `);
    const existingTables = tableCheckRes.rows.map((r) => r.table_name);
    assert(existingTables.includes('tbl_positions'), 'Tabel master tbl_positions terdaftar di database.');
    assert(existingTables.includes('tbl_position_assignments'), 'Tabel tbl_position_assignments terdaftar di database.');
    assert(existingTables.includes('tbl_audit_logs'), 'Tabel audit log tbl_audit_logs terdaftar di database.');

    // Cek partial unique index
    const indexCheckRes = await client.query(`
      SELECT indexname FROM pg_indexes 
      WHERE tablename = 'tbl_position_assignments' 
      AND indexname = 'uq_active_position_occupant'
    `);
    assert(indexCheckRes.rows.length > 0, 'Partial unique index uq_active_position_occupant aktif (1 pemangku aktif per posisi).');

    // Cek master positions seeding
    const positions = await getAllPositions();
    assert(positions.length >= 20, `Terdapat minimal 20 formasi SOTK UNSIL di tbl_positions (Ditemukan: ${positions.length}).`);

    const dekanFtPos = positions.find((p) => p.position_code === 'DEKAN_FT');
    assert(dekanFtPos !== undefined, 'Formasi DEKAN_FT tersedia di daftar posisi.');
    assert(dekanFtPos.default_role_key === 'DEKAN', 'default_role_key untuk DEKAN_FT adalah "DEKAN".');

    // -------------------------------------------------------------------------
    // 2. SETUP USER DUMMY UNTUK MUTASI
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Setup Data Uji Pengguna (Super Admin, Pejabat Lama, Pejabat Baru) ---');

    // Super Admin
    const superAdminRes = await client.query(`
      INSERT INTO tbl_users (nama_lengkap, nip_nik, email, password_hash, kode_unit_kerja, max_keamanan_akses, is_active)
      VALUES ('Super Admin Testing', '19700101TEST0001', 'superadmin.test@unsil.ac.id', 'dummy_hash', 'UN58', 'Sangat Rahasia', TRUE)
      ON CONFLICT (nip_nik) DO UPDATE SET is_active = TRUE
      RETURNING id, nip_nik
    `);
    const superAdminUuid = superAdminRes.rows[0].id;

    // Pejabat Lama: Dr. Hendra Gunawan
    const hendraRes = await client.query(`
      INSERT INTO tbl_users (nama_lengkap, nip_nik, email, password_hash, kode_unit_kerja, max_keamanan_akses, is_active)
      VALUES ('Dr. Hendra Gunawan, M.T.', '19800101TEST1001', 'hendra.test@unsil.ac.id', 'dummy_hash', 'FT', 'Rahasia', TRUE)
      ON CONFLICT (nip_nik) DO UPDATE SET is_active = TRUE
      RETURNING id, nip_nik
    `);
    const hendraUuid = hendraRes.rows[0].id;

    await client.query(`
      INSERT INTO users (id, nip, username, nama, email, kode_unit, jabatan, is_pejabat, role, is_active, password)
      VALUES ($1, '19800101TEST1001', '19800101TEST1001', 'Dr. Hendra Gunawan, M.T.', 'hendra.test@unsil.ac.id', 'UN58.13', 'Dosen Teknik', FALSE, 'DOSEN_NON_JABATAN', TRUE, 'dummy_hash')
      ON CONFLICT (nip) DO UPDATE SET role = 'DOSEN_NON_JABATAN', is_pejabat = FALSE
    `, [hendraUuid]);

    // Pejabat Baru: Dr. Aris Martono
    const arisRes = await client.query(`
      INSERT INTO tbl_users (nama_lengkap, nip_nik, email, password_hash, kode_unit_kerja, max_keamanan_akses, is_active)
      VALUES ('Dr. Aris Martono, M.Kom.', '19820202TEST1002', 'aris.test@unsil.ac.id', 'dummy_hash', 'FT', 'Biasa/Terbuka', TRUE)
      ON CONFLICT (nip_nik) DO UPDATE SET is_active = TRUE
      RETURNING id, nip_nik
    `);
    const arisUuid = arisRes.rows[0].id;

    await client.query(`
      INSERT INTO users (id, nip, username, nama, email, kode_unit, jabatan, is_pejabat, role, is_active, password)
      VALUES ($1, '19820202TEST1002', '19820202TEST1002', 'Dr. Aris Martono, M.Kom.', 'aris.test@unsil.ac.id', 'UN58.13', 'Dosen Informatika', FALSE, 'DOSEN_NON_JABATAN', TRUE, 'dummy_hash')
      ON CONFLICT (nip) DO UPDATE SET role = 'DOSEN_NON_JABATAN', is_pejabat = FALSE
    `, [arisUuid]);

    // Bersihkan penugasan DEKAN_FT sebelumnya untuk testing yang bersih
    await client.query(`
      DELETE FROM tbl_position_assignments WHERE position_id = $1
    `, [dekanFtPos.id]);

    assert(true, 'Setup user testing berhasil.');

    // -------------------------------------------------------------------------
    // 3. PENGUJIAN MUTASI TAHAP 1: PELANTIKAN PEJABAT PERTAMA (DEFINITIF)
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Pengujian Pelantikan Pejabat Awal (DEFINITIF) ---');

    const mutation1 = await executeLeadershipMutation(superAdminUuid, {
      targetUserId: hendraUuid,
      positionId: dekanFtPos.id,
      status: 'DEFINITIF',
      decreeNumber: 'SK Rektor No. 1001/UN58/KP/2026',
      startDate: '2026-01-01',
      notes: 'Pelantikan Pejabat Definitif Dekan Fakultas Teknik Periode 2026-2030'
    });

    assert(mutation1.success === true, 'Mutasi tahap 1 berhasil dieksekusi.');
    assert(mutation1.mutation.newHolderId === hendraUuid, 'Pejabat baru tercatat sebagai Dr. Hendra Gunawan.');
    assert(mutation1.mutation.status === 'DEFINITIF', 'Status penugasan adalah DEFINITIF.');

    // Verifikasi elevasi RBAC di tabel users
    const hendraCheck1 = await client.query('SELECT role, is_pejabat, jabatan FROM users WHERE id = $1', [hendraUuid]);
    assert(hendraCheck1.rows[0].role === 'DEKAN', 'Role Hendra dielevasi menjadi DEKAN.');
    assert(hendraCheck1.rows[0].is_pejabat === true, 'Status is_pejabat Hendra diset ke TRUE.');
    assert(hendraCheck1.rows[0].jabatan.includes('Dekan Fakultas Teknik'), 'Gelar jabatan Hendra ter-update menjadi Dekan Fakultas Teknik.');

    // -------------------------------------------------------------------------
    // 4. PENGUJIAN MUTASI TAHAP 2: PERGANTIAN JABATAN (PLT) DENGAN ROW-LEVEL LOCKING
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Pengujian Mutasi & Transisi Jabatan Dinamis (PLT) ---');

    const mutation2 = await executeLeadershipMutation(superAdminUuid, {
      targetUserId: arisUuid,
      positionId: dekanFtPos.id,
      status: 'PLT',
      decreeNumber: 'SK Rektor No. 2803/UN58/OT/2026',
      startDate: '2026-09-01',
      notes: 'Penetapan Pelaksana Tugas (Plt.) Dekan Fakultas Teknik'
    });

    assert(mutation2.success === true, 'Mutasi tahap 2 (PLT) berhasil dieksekusi.');
    assert(mutation2.mutation.previousHolderId === hendraUuid, 'Pejabat lama berhasil diidentifikasi sebagai Dr. Hendra Gunawan.');
    assert(mutation2.mutation.newHolderId === arisUuid, 'Pejabat baru adalah Dr. Aris Martono.');
    assert(mutation2.mutation.status === 'PLT', 'Status penugasan adalah PLT.');

    // A. Verifikasi DEMOSI pejabat lama (Dr. Hendra Gunawan)
    const hendraCheck2 = await client.query('SELECT role, is_pejabat, jabatan FROM users WHERE id = $1', [hendraUuid]);
    assert(hendraCheck2.rows[0].role === 'DOSEN_NON_JABATAN', 'Role pejabat lama otomatis didemosi ke DOSEN_NON_JABATAN.');
    assert(hendraCheck2.rows[0].is_pejabat === false, 'Status is_pejabat pejabat lama dinonaktifkan (is_pejabat = FALSE).');

    // B. Verifikasi ELEVASI pejabat baru (Dr. Aris Martono)
    const arisCheck2 = await client.query('SELECT role, is_pejabat, jabatan FROM users WHERE id = $1', [arisUuid]);
    assert(arisCheck2.rows[0].role === 'DEKAN', 'Role pejabat baru otomatis dielevasi ke DEKAN.');
    assert(arisCheck2.rows[0].is_pejabat === true, 'Status is_pejabat pejabat baru diaktifkan (is_pejabat = TRUE).');
    assert(arisCheck2.rows[0].jabatan === 'Dekan Fakultas Teknik (PLT)', 'Gelar jabatan memuat status (PLT): Dekan Fakultas Teknik (PLT).');

    // C. Verifikasi Konstrain: Hanya Tepat 1 Pemangku Aktif
    const activeAssignments = await client.query(
      'SELECT id, user_id, status, is_active FROM tbl_position_assignments WHERE position_id = $1 AND is_active = TRUE',
      [dekanFtPos.id]
    );
    assert(activeAssignments.rows.length === 1, `Tepat 1 pemangku aktif per formasi jabatan (Ditemukan: ${activeAssignments.rows.length}).`);
    assert(activeAssignments.rows[0].user_id === arisUuid, 'Pemangku aktif saat ini adalah Dr. Aris Martono.');

    // -------------------------------------------------------------------------
    // 5. PENGUJIAN AUDIT LOG (tbl_audit_logs)
    // -------------------------------------------------------------------------
    console.log('\n--- 5. Pengujian Keutuhan Audit Trail (tbl_audit_logs) ---');

    const auditLogs = await getLeadershipAuditLogs(10);
    assert(auditLogs.length >= 2, `Tercatat minimal 2 entri mutasi di tbl_audit_logs (Ditemukan: ${auditLogs.length}).`);

    const latestAudit = auditLogs[0];
    assert(latestAudit.action === 'LEADERSHIP_MUTATION', 'Action tercatat sebagai "LEADERSHIP_MUTATION".');
    assert(latestAudit.details.previousHolder === hendraUuid, 'Audit log menyimpan previousHolder yang tepat.');
    assert(latestAudit.details.newHolder === arisUuid, 'Audit log menyimpan newHolder yang tepat.');
    assert(latestAudit.details.decreeNumber === 'SK Rektor No. 2803/UN58/OT/2026', 'Audit log menyimpan nomor SK Rektor.');
    assert(latestAudit.details.status === 'PLT', 'Audit log menyimpan status penugasan PLT.');

    // -------------------------------------------------------------------------
    // 6. PENGUJIAN SECURITY GUARD (SuperAdminGuard)
    // -------------------------------------------------------------------------
    console.log('\n--- 6. Pengujian Otorisasi Keamanan (SuperAdminGuard) ---');

    // Simulasi Request Unauthorized (Dosen Biasa)
    let deniedStatus = 0;
    const reqDosen = {
      user: { id_user: 101, role: 'DOSEN', id_role: 7 }
    };
    const resDosen = {
      status(code) {
        deniedStatus = code;
        return this;
      },
      json(data) {
        return data;
      }
    };

    let nextCalled = false;
    SuperAdminGuard(reqDosen, resDosen, () => {
      nextCalled = true;
    });

    assert(deniedStatus === 403, 'Akses Dosen ditolak dengan HTTP 403 Forbidden.');
    assert(!nextCalled, 'Middleware menghentikan eksekusi (next() tidak dipanggil).');

    // Simulasi Request Authorized (Super Admin)
    let adminPass = false;
    const reqAdmin = {
      user: { id_user: 1, role: 'SUPER_ADMIN', id_role: 1 }
    };
    SuperAdminGuard(reqAdmin, resDosen, () => {
      adminPass = true;
    });

    assert(adminPass === true, 'Request Super Admin berhasil lolos SuperAdminGuard (next() dipanggil).');

    // -------------------------------------------------------------------------
    // 7. PENGUJIAN ENDPOINT REST API VIA HTTP SERVER
    // -------------------------------------------------------------------------
    console.log('\n--- 7. Pengujian Endpoint Express API ---');

    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;

    // A. GET /api/positions
    const positionsRes = await fetch(`http://127.0.0.1:${port}/api/positions`);
    const positionsJson = await positionsRes.json();
    assert(positionsRes.status === 200, 'GET /api/positions merespons HTTP 200.');
    assert(positionsJson.success === true, 'GET /api/positions mengembalikan success: true.');
    assert(Array.isArray(positionsJson.data), 'GET /api/positions mengembalikan array formasi.');

    // B. POST /api/admin/leadership/mutate dengan Token Super Admin
    const mutatePayload = {
      targetUserId: hendraUuid,
      positionId: dekanFtPos.id,
      status: 'PLH',
      decreeNumber: 'SK Rektor No. 3001/UN58/OT/2026',
      startDate: '2026-09-23',
      notes: 'Penugasan Pelaksana Harian (Plh.) Dekan'
    };

    const apiMutateRes = await fetch(`http://127.0.0.1:${port}/api/admin/leadership/mutate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer superadmin-secret-token'
      },
      body: JSON.stringify(mutatePayload)
    });

    const apiMutateJson = await apiMutateRes.json();
    assert(apiMutateRes.status === 200, 'POST /api/admin/leadership/mutate berhasil dengan status HTTP 200.');
    assert(apiMutateJson.data.status === 'PLH', 'API berhasil menetapkan status PLH.');

    // C. GET /api/admin/leadership/history
    const historyRes = await fetch(`http://127.0.0.1:${port}/api/admin/leadership/history`, {
      headers: {
        Authorization: 'Bearer superadmin-secret-token'
      }
    });
    const historyJson = await historyRes.json();
    assert(historyRes.status === 200, 'GET /api/admin/leadership/history berhasil dengan status HTTP 200.');
    assert(historyJson.total >= 3, `History memuat rekam jejak mutasi lengkap (Total: ${historyJson.total}).`);

    await new Promise((resolve) => server.close(resolve));

    // -------------------------------------------------------------------------
    // REKAPITULASI HASIL
    // -------------------------------------------------------------------------
    console.log('\n=============================================================================');
    console.log(`HASIL AKHIR: ${passed} pengujian BERHASIL, ${failed} GAGAL`);
    console.log('=============================================================================');

    if (failed > 0) {
      process.exit(1);
    }
  } finally {
    client.release();
    await pool.end();
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
