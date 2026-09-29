/**
 * Controller: Registrasi Pengguna & Pengikatan Tugas Pokok (Super Admin)
 * Endpoint: POST /api/admin/users
 */

import bcrypt from 'bcryptjs';
import { query } from '../config/database.js';
import { memoryUserStore } from '../services/userManagementService.js';

export const registerNewStaffUser = async (req, res) => {
  try {
    const {
      nama_lengkap,
      nip_nik,
      email,
      password,
      kode_unit_kerja,
      id_role,
      max_keamanan_akses = 'Biasa/Terbuka',
      custom_prefixes = []
    } = req.body;

    // 1. Validasi Input Mandatori
    if (!nama_lengkap || !nip_nik || !email || !password || !kode_unit_kerja || !id_role) {
      return res.status(400).json({
        status: 400,
        success: false,
        error: 'ValidationError',
        message: 'Kolom nama_lengkap, nip_nik, email, password, kode_unit_kerja, dan id_role wajib diisi!'
      });
    }

    // Sanitisasi email & nip
    const sanitizedEmail = String(email).trim().toLowerCase();
    const sanitizedNip = String(nip_nik).trim();
    const sanitizedUnit = String(kode_unit_kerja).trim().toUpperCase();

    // 2. Periksa Duplikasi NIP atau Email
    const checkDuplicateSql = `
      SELECT id_user, email, nip_nik 
      FROM tbl_users 
      WHERE LOWER(email) = $1 OR nip_nik = $2
      LIMIT 1;
    `;
    const duplicateCheck = await query(checkDuplicateSql, [sanitizedEmail, sanitizedNip]);
    if (duplicateCheck.rows.length > 0) {
      const existing = duplicateCheck.rows[0];
      const conflictField = existing.nip_nik === sanitizedNip ? 'NIP/NIK' : 'Email';
      return res.status(409).json({
        status: 409,
        success: false,
        error: 'DuplicateResource',
        message: `${conflictField} '${existing.nip_nik === sanitizedNip ? sanitizedNip : sanitizedEmail}' sudah terdaftar dalam sistem SILOKA!`
      });
    }

    // 3. Verifikasi Keberadaan Role
    const roleRes = await query(`SELECT id_role, nama_role, deskripsi FROM tbl_roles WHERE id_role = $1 AND is_active = TRUE`, [id_role]);
    if (roleRes.rows.length === 0) {
      return res.status(404).json({
        status: 404,
        success: false,
        error: 'RoleNotFound',
        message: `Role ID ${id_role} tidak ditemukan dalam daftar master roles!`
      });
    }
    const roleRecord = roleRes.rows[0];

    // 4. Hash Password Menggunakan Bcrypt
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 5. Simpan ke tbl_users
    const insertUserSql = `
      INSERT INTO tbl_users (
        nama_lengkap, nip_nik, email, password_hash, 
        kode_unit_kerja, max_keamanan_akses, is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, TRUE)
      RETURNING id_user, nama_lengkap, nip_nik, email, kode_unit_kerja, max_keamanan_akses, created_at;
    `;
    const userRes = await query(insertUserSql, [
      nama_lengkap.trim(),
      sanitizedNip,
      sanitizedEmail,
      passwordHash,
      sanitizedUnit,
      max_keamanan_akses
    ]);
    const newUser = userRes.rows[0];

    // 6. Ikat Pengguna ke Role (tbl_user_roles)
    await query(`INSERT INTO tbl_user_roles (id_user, id_role) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [
      newUser.id_user,
      id_role
    ]);

    // 7. Simpan Custom Prefix JRA jika diberikan
    if (Array.isArray(custom_prefixes) && custom_prefixes.length > 0) {
      for (const prefix of custom_prefixes) {
        if (prefix && prefix.trim()) {
          await query(
            `INSERT INTO tbl_user_custom_klasifikasi_access (id_user, prefix_jra) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [newUser.id_user, prefix.trim().toUpperCase()]
          );
        }
      }
    }

    // 8. Ambil Rekapitulasi Hak Akses Efektif Pengguna Baru
    const accessRes = await query(`
      SELECT 
        COALESCE(
          (SELECT ARRAY_AGG(DISTINCT uca.prefix_jra) FROM tbl_user_custom_klasifikasi_access uca WHERE uca.id_user = $1),
          (SELECT ARRAY_AGG(DISTINCT rka.prefix_jra) FROM tbl_role_klasifikasi_access rka WHERE rka.id_role = $2)
        ) AS allowed_prefixes,
        (SELECT ARRAY_AGG(DISTINCT rp.permission_key) FROM tbl_role_permissions rp WHERE rp.id_role = $2) AS permissions;
    `, [newUser.id_user, id_role]);

    const effectiveAccess = accessRes.rows[0] || {};

    const OTK_UNIT_ID_MAP = {
      UNSIL: 'UN58',
      BAKPK: 'UN58.06',
      BKU: 'UN58.07',
      LPPM: 'UN58.08',
      LPMPP: 'UN58.09',
      FKIP: 'UN58.10',
      FEB: 'UN58.11',
      FP: 'UN58.12',
      FT: 'UN58.13',
      FISIP: 'UN58.14',
      FIK: 'UN58.15',
      FAI: 'UN58.16',
      PASCA: 'UN58.17',
      SPI: 'UN58.19',
      TI: 'UN58.13.02'
    };
    const mappedUnitId = OTK_UNIT_ID_MAP[newUser.kode_unit_kerja] || newUser.kode_unit_kerja;
    const rawRoleUpper = String(roleRecord.nama_role || '').toUpperCase();
    const isPejabatRole = rawRoleUpper.includes('REKTOR') || rawRoleUpper.includes('DEKAN') || rawRoleUpper.includes('KEPALA') || rawRoleUpper.includes('KETUA');
    const normalizedRole = isPejabatRole ? 'PEJABAT' : rawRoleUpper.includes('DOSEN') ? 'DOSEN' : roleRecord.nama_role;

    const responseUser = {
      id: newUser.id_user,
      id_user: newUser.id_user,
      nama: newUser.nama_lengkap,
      nama_lengkap: newUser.nama_lengkap,
      nip: newUser.nip_nik,
      nip_nik: newUser.nip_nik,
      email: newUser.email,
      raw_password: password,
      password_hash: passwordHash,
      role: normalizedRole,
      roleLabel: roleRecord.nama_role,
      jabatan: roleRecord.nama_role,
      is_pejabat: isPejabatRole,
      kode_unit_kerja: newUser.kode_unit_kerja,
      unit_kerja_id: mappedUnitId,
      max_keamanan: newUser.max_keamanan_akses,
      allowed_prefixes: effectiveAccess.allowed_prefixes || [],
      permissions: effectiveAccess.permissions || []
    };

    try {
      if (Array.isArray(memoryUserStore)) {
        const idx = memoryUserStore.findIndex((u) => String(u.email || '').toLowerCase() === sanitizedEmail);
        if (idx >= 0) memoryUserStore[idx] = { ...memoryUserStore[idx], ...responseUser };
        else memoryUserStore.unshift(responseUser);
      }
    } catch (syncErr) {
      console.warn('[USER-REGISTRATION] Sync warning:', syncErr.message);
    }

    return res.status(201).json({
      status: 201,
      success: true,
      message: `Pengguna '${newUser.nama_lengkap}' berhasil didaftarkan dengan role '${roleRecord.nama_role}' di unit '${newUser.kode_unit_kerja}'.`,
      data: responseUser
    });
  } catch (err) {
    console.error('[USER-REGISTRATION] Error:', err);
    return res.status(500).json({
      status: 500,
      success: false,
      error: 'RegistrationFailed',
      message: 'Gagal memproses pendaftaran pengguna baru.',
      details: err.message
    });
  }
};

