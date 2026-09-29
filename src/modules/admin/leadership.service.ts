/**
 * Leadership Mutation & Structural Position Service (SILOKA UNSIL)
 * 
 * Mengimplementasikan alur transaksional mutasi jabatan pimpinan:
 * - Decoupling akun individu dari formasi jabatan SOTK kampus
 * - Mutasi dinamis status DEFINITIF, PLT, dan PLH (Peraturan Rektor No. 3/2023 & SK Rektor No. 2803)
 * - Elevasi dan demosi RBAC real-time dengan Row-Level Locking (SELECT ... FOR UPDATE)
 * - Pencatatan histori audit mutasi yang tidak dapat diubah (immutable audit log)
 * - Invalidasi sesi & token cache
 */

import { pool } from '../../../server/config/database.js';
import type {
  AssignmentStatus,
  Position,
  PositionAssignment,
  MutationPayload,
  MutationResult,
  AuditLogEntry
} from './leadership.types.ts';

// Pemetaan kode singkatan ke kode resmi master_unit_kerja (OTK UNSIL)
const UNIT_MAPPING: Record<string, string> = {
  FT: 'UN58.13',
  'UN58.13': 'UN58.13',
  'UN58.13.1': 'UN58.13.1',
  FKIP: 'UN58.10',
  'UN58.10': 'UN58.10',
  FEB: 'UN58.11',
  'UN58.11': 'UN58.11',
  FP: 'UN58.12',
  'UN58.12': 'UN58.12',
  FISIP: 'UN58.14',
  'UN58.14': 'UN58.14',
  FIK: 'UN58.15',
  'UN58.15': 'UN58.15',
  FAI: 'UN58.16',
  'UN58.16': 'UN58.16',
  PASCA: 'UN58.17',
  'UN58.17': 'UN58.17',
  BKU: 'UN58.6',
  'UN58.6': 'UN58.6',
  BAKPK: 'UN58.5',
  'UN58.5': 'UN58.5',
  LPPM: 'UN58.21',
  'UN58.21': 'UN58.21',
  LP3M: 'UN58.22',
  'UN58.22': 'UN58.22',
  LPMPP: 'UN58.22',
  SPI: 'UN58.SPI',
  'UN58.SPI': 'UN58.SPI',
  UN58: 'UN58'
};

export function resolveOfficialUnitCode(unitId: string): string {
  if (!unitId) return 'UN58';
  return UNIT_MAPPING[unitId] || (unitId.startsWith('UN58') ? unitId : 'UN58');
}

// In-memory cache fallback untuk session / token invalidation
export const tokenInvalidationCache = new Set<string>();

/**
 * Invalidate Redis token cache and in-memory session cache
 */
export async function invalidateUserSession(userId: string): Promise<void> {
  tokenInvalidationCache.add(userId);
  try {
    // Check if global Redis client is connected
    const redis = (globalThis as any).redisClient;
    if (redis && typeof redis.del === 'function') {
      await redis.del(`session:${userId}`);
      await redis.del(`rbac:${userId}`);
      await redis.del(`user:${userId}`);
    }
  } catch (err: any) {
    console.warn('[REDIS-CACHE] Fallback to memory session invalidation:', err.message);
  }
}

/**
 * Eksekusi mutasi kepemimpinan secara transaksional
 */
export async function executeLeadershipMutation(
  actorId: string,
  payload: MutationPayload
): Promise<MutationResult> {
  const {
    targetUserId,
    positionId,
    status = 'DEFINITIF',
    decreeNumber,
    startDate,
    notes = '',
    ipAddress = '127.0.0.1',
    userAgent = 'SILOKA-SuperAdmin-Client'
  } = payload;

  if (!targetUserId || !positionId || !decreeNumber || !startDate) {
    throw new Error('Data mutasi tidak lengkap. targetUserId, positionId, decreeNumber, dan startDate wajib diisi.');
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Resolve Actor UUID
    let actorUuid: string;
    const actorRes = await client.query(
      `SELECT id FROM tbl_users WHERE id::text = $1 OR id_user::text = $1 OR nip_nik = $1 LIMIT 1`,
      [actorId]
    );
    if (actorRes.rows.length > 0) {
      actorUuid = actorRes.rows[0].id;
    } else {
      // Fallback ke Super Admin default id
      const defaultAdminRes = await client.query(
        `SELECT id FROM tbl_users ORDER BY id_user ASC LIMIT 1`
      );
      actorUuid = defaultAdminRes.rows[0]?.id;
    }

    // 2. Resolve Target User
    const targetUserRes = await client.query(
      `SELECT id, id_user, nip_nik, nama_lengkap, kode_unit_kerja FROM tbl_users 
       WHERE id::text = $1 OR id_user::text = $1 OR nip_nik = $1 LIMIT 1`,
      [targetUserId]
    );

    if (targetUserRes.rows.length === 0) {
      throw new Error(`Pengguna tujuan dengan ID '${targetUserId}' tidak ditemukan di tbl_users.`);
    }

    const targetUser = targetUserRes.rows[0];
    const targetUuid: string = targetUser.id;
    const targetNip: string = targetUser.nip_nik;

    // 3. Resolve Target Position
    const positionRes = await client.query(
      `SELECT id, position_code, name, unit_id, default_role_key FROM tbl_positions 
       WHERE id::text = $1 OR position_code = $1 LIMIT 1`,
      [positionId]
    );

    if (positionRes.rows.length === 0) {
      throw new Error(`Formasi jabatan '${positionId}' tidak ditemukan di tbl_positions.`);
    }

    const position = positionRes.rows[0];
    const posUuid: string = position.id;

    // 4. Concurrency-Safe Check: Kunci baris pemangku aktif saat ini (Row-Level Locking)
    const activeOccupantRes = await client.query(
      `SELECT id, user_id, status FROM tbl_position_assignments 
       WHERE position_id::text = $1::text AND is_active = TRUE 
       FOR UPDATE`,
      [posUuid]
    );

    let oldUserId: string | null = null;

    if (activeOccupantRes.rows.length > 0) {
      const activeAssignment = activeOccupantRes.rows[0];
      oldUserId = activeAssignment.user_id;

      // Jika pejabat lama sama dengan pejabat baru yang ingin dilantik pada status yang sama
      if (oldUserId === targetUuid && activeAssignment.status === status) {
        throw new Error(
          `Pengguna ${targetUser.nama_lengkap} sudah menjabat sebagai ${position.name} dengan status ${status}.`
        );
      }

      // A. Nonaktifkan penugasan lama
      await client.query(
        `UPDATE tbl_position_assignments 
         SET is_active = FALSE, end_date = $1, updated_at = NOW() 
         WHERE id::text = $2::text`,
        [startDate, activeAssignment.id]
      );

      // B. Periksa apakah oldUserId masih memegang jabatan struktural aktif lainnya
      const otherRolesRes = await client.query(
        `SELECT COUNT(*) as active_count FROM tbl_position_assignments 
         WHERE user_id::text = $1::text AND is_active = TRUE`,
        [oldUserId]
      );

      const remainingActive = parseInt(otherRolesRes.rows[0].active_count, 10);

      // Jika tidak ada jabatan struktural lain, kembalikan role ke Dosen Non-Jabatan
      if (remainingActive === 0) {
        await client.query(
          `UPDATE users 
           SET role = 'DOSEN_NON_JABATAN', is_pejabat = FALSE, jabatan = 'Dosen Biasa / Tanpa Jabatan', updated_at = NOW() 
           WHERE id::text = $1::text OR nip = (SELECT nip_nik FROM tbl_users WHERE id::text = $1::text LIMIT 1)`,
          [oldUserId]
        );
      }

      // Invalidate cache sesi untuk pejabat lama
      await invalidateUserSession(oldUserId);
    }

    // 5. Masukkan rekor mutasi baru ke tbl_position_assignments
    const newAssignmentRes = await client.query(
      `INSERT INTO tbl_position_assignments (
        position_id, user_id, status, decree_number, start_date, is_active, notes, created_by, created_at, updated_at
       ) VALUES ($1, $2, $3, $4, $5, TRUE, $6, $7, NOW(), NOW())
       RETURNING id, status, decree_number, start_date`,
      [posUuid, targetUuid, status, decreeNumber, startDate, notes, actorUuid]
    );

    const newAssignment = newAssignmentRes.rows[0];

    // 6. Elevasi Hak Akses RBAC Pengguna Baru (users & tbl_users)
    const newRoleKey = position.default_role_key; // e.g. 'DEKAN', 'REKTOR', 'WADEK', 'KAJUR_KAPRODI'
    const newJabatanTitle = `${position.name}${status !== 'DEFINITIF' ? ` (${status})` : ''}`;
    const officialUnitCode = resolveOfficialUnitCode(position.unit_id);

    await client.query(
      `UPDATE users 
       SET role = $1, is_pejabat = TRUE, jabatan = $2, kode_unit = $3, updated_at = NOW() 
       WHERE id::text = $4::text OR nip = $5`,
      [newRoleKey, newJabatanTitle, officialUnitCode, targetUuid, targetNip]
    );

    await client.query(
      `UPDATE tbl_users 
       SET kode_unit_kerja = $1 
       WHERE id::text = $2::text`,
      [position.unit_id, targetUuid]
    );

    // Invalidate cache sesi pengguna baru agar claim RBAC langsung tersinkronisasi
    await invalidateUserSession(targetUuid);

    // 7. Catat Entri Audit Log yang Tidak Dapat Dihapus (tbl_audit_logs)
    const auditDetails = {
      previousHolder: oldUserId,
      newHolder: targetUuid,
      newHolderName: targetUser.nama_lengkap,
      newHolderNip: targetNip,
      positionCode: position.position_code,
      positionName: position.name,
      unitId: position.unit_id,
      decreeNumber,
      status,
      startDate,
      notes
    };

    await client.query(
      `INSERT INTO tbl_audit_logs (
        action, actor_id, target_user_id, details, ip_address, user_agent, created_at
       ) VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      ['LEADERSHIP_MUTATION', actorUuid, targetUuid, JSON.stringify(auditDetails), ipAddress, userAgent]
    );

    await client.query('COMMIT');

    return {
      success: true,
      message: `Mutasi jabatan pimpinan '${position.name}' berhasil diterapkan kepada ${targetUser.nama_lengkap} (${status}).`,
      mutation: {
        assignmentId: newAssignment.id,
        positionCode: position.position_code,
        positionName: position.name,
        newHolderId: targetUuid,
        previousHolderId: oldUserId,
        status: newAssignment.status,
        decreeNumber: newAssignment.decree_number,
        startDate: newAssignment.start_date
      }
    };
  } catch (err: any) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Dapatkan semua formasi jabatan berserta pemangku jabatan aktif saat ini
 */
export async function getAllPositions(): Promise<Position[]> {
  const res = await pool.query(`
    SELECT 
      p.id,
      p.position_code,
      p.name,
      p.unit_id,
      p.level,
      p.can_sign_policy,
      p.default_role_key,
      p.created_at,
      un.name as unit_name,
      un.parent_unit_id as parent_unit_id,
      CASE 
        WHEN un.category = 'FAKULTAS' THEN un.id
        WHEN un.category IN ('PROGRAM_STUDI', 'JURUSAN') THEN un.parent_unit_id
        ELSE un.id
      END as faculty_id,
      pa.id as assignment_id,
      pa.user_id,
      pa.status,
      pa.decree_number,
      pa.start_date,
      u.nama_lengkap,
      u.nip_nik as nip
    FROM tbl_positions p
    LEFT JOIN tbl_units un ON un.id = p.unit_id
    LEFT JOIN tbl_position_assignments pa ON pa.position_id = p.id AND pa.is_active = TRUE
    LEFT JOIN tbl_users u ON u.id = pa.user_id
    ORDER BY p.name ASC
  `);

  return res.rows.map((row: any) => ({
    id: row.id,
    position_code: row.position_code,
    name: row.name,
    unit_id: row.unit_id,
    unit_name: row.unit_name || row.unit_id,
    parent_unit_id: row.parent_unit_id || null,
    faculty_id: row.faculty_id || row.parent_unit_id || null,
    level: row.level || 'FAKULTAS',
    can_sign_policy: Boolean(row.can_sign_policy),
    default_role_key: row.default_role_key,
    created_at: row.created_at,
    current_occupant: row.user_id
      ? {
          assignment_id: row.assignment_id,
          user_id: row.user_id,
          nama_lengkap: row.nama_lengkap,
          nip: row.nip,
          status: row.status,
          decree_number: row.decree_number,
          start_date: row.start_date
        }
      : null
  }));
}

/**
 * Dapatkan riwayat mutasi kepemimpinan dari tbl_audit_logs
 */
export async function getLeadershipAuditLogs(limit = 50): Promise<AuditLogEntry[]> {
  const res = await pool.query(
    `SELECT 
       id, action, actor_id, target_user_id, details, ip_address, user_agent, created_at 
     FROM tbl_audit_logs 
     WHERE action = 'LEADERSHIP_MUTATION' 
     ORDER BY created_at DESC 
     LIMIT $1`,
    [limit]
  );

  return res.rows;
}
