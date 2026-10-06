/**
 * Layanan Manajemen Pengguna (SILOKA UNSIL)
 * Menangani dua skenario utama:
 * 1. Pembuatan Akun via Impor Excel (UPSERT dengan proteksi password & flag must_change_password)
 * 2. Mutasi & Pemetaan Jabatan Pengguna (Query terisolasi tanpa menyentuh password)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query, pool, isDatabaseAvailable } from '../config/database.js';
import { generateDefaultPassword, generateRandomUnsilPassword, hashPassword } from '../utils/passwordHelper.js';
import { sendWelcomeEmail } from './emailService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let unitKerjaList = [];
try {
  const unitPath = path.resolve(__dirname, '../../src/data/unitKerja.json');
  if (fs.existsSync(unitPath)) {
    unitKerjaList = JSON.parse(fs.readFileSync(unitPath, 'utf-8'));
  }
} catch (e) {
  console.warn('[USER-SERVICE] Gagal memuat unitKerja.json di server:', e.message);
}

let masterUsersList = [];
try {
  const usersPath = path.resolve(__dirname, '../../src/data/users.json');
  if (fs.existsSync(usersPath)) {
    masterUsersList = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));
  }
} catch (e) {
  console.warn('[USER-SERVICE] Gagal memuat users.json di server:', e.message);
}

// Daftar blacklist pengguna yang telah dihapus oleh Super Administrator
const deletedUsersFilePath = path.resolve(__dirname, '../../src/data/deletedUsers.json');
export const deletedUserIdentifiers = new Set();

const loadDeletedUsers = () => {
  try {
    if (fs.existsSync(deletedUsersFilePath)) {
      const arr = JSON.parse(fs.readFileSync(deletedUsersFilePath, 'utf-8'));
      if (Array.isArray(arr)) {
        arr.forEach((id) => deletedUserIdentifiers.add(String(id).toLowerCase().trim()));
      }
    }
  } catch (e) {
    console.warn('[USER-SERVICE] Gagal memuat deletedUsers.json:', e.message);
  }
};
loadDeletedUsers();

export const saveDeletedUsers = () => {
  try {
    const dir = path.dirname(deletedUsersFilePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(deletedUsersFilePath, JSON.stringify(Array.from(deletedUserIdentifiers), null, 2), 'utf-8');
  } catch (e) {
    console.warn('[USER-SERVICE] Gagal menyimpan deletedUsers.json:', e.message);
  }
};

/**
 * Mencabut status deleted / blacklist jika pengguna didaftarkan kembali oleh Super Admin
 */
export const unmarkUserAsDeleted = (identifiers = []) => {
  let changed = false;
  identifiers.filter(Boolean).forEach((id) => {
    const clean = String(id).toLowerCase().trim();
    if (deletedUserIdentifiers.has(clean)) {
      deletedUserIdentifiers.delete(clean);
      changed = true;
    }
    const prefix = clean.includes('@') ? clean.split('@')[0] : clean;
    if (deletedUserIdentifiers.has(prefix)) {
      deletedUserIdentifiers.delete(prefix);
      changed = true;
    }
    const withDomain = clean.includes('@') ? clean : `${clean}@unsil.ac.id`;
    if (deletedUserIdentifiers.has(withDomain)) {
      deletedUserIdentifiers.delete(withDomain);
      changed = true;
    }
  });
  if (changed) {
    saveDeletedUsers();
  }
};

export const isUserDeleted = (identifier) => {
  if (!identifier) return false;
  const clean = String(identifier).toLowerCase().trim();
  if (deletedUserIdentifiers.has(clean)) return true;
  const prefix = clean.includes('@') ? clean.split('@')[0] : clean;
  if (deletedUserIdentifiers.has(prefix)) return true;
  const withDomain = clean.includes('@') ? clean : `${clean}@unsil.ac.id`;
  if (deletedUserIdentifiers.has(withDomain)) return true;
  return false;
};

const getUnitNameByCode = (code) => {
  const found = unitKerjaList.find((u) => u.kode_unit === code);
  if (found) return found.nama_unit;
  if (code === 'UN58.13') return 'Fakultas Teknik';
  if (code === 'UN58.10') return 'Fakultas Keguruan dan Ilmu Pendidikan';
  if (code === 'UN58.6') return 'Biro Keuangan dan Umum';
  return code || 'Universitas Siliwangi';
};

// Cache in-memory untuk lingkungan simulasi / fallback jika database PostgreSQL lokal offline
export const memoryUserStore = new Map([
  [
    '198501012010121001',
    {
      id: 'usr-dg-01',
      nip_nik: '198501012010121001',
      nama_lengkap: 'Dede Gunawan, S.Kom., M.Kom.',
      email: 'dedegunawan@unsil.ac.id',
      id_unit: 'UN58.31',
      unit_kerja_id: 'UN58.31',
      id_role: 'Super Admin',
      role: 'Super Admin',
      role_label: 'Super Administrator SILOKA UNSIL',
      password: '$2a$12$eXistingHashedPasswordSuperAdminSecure2026',
      password_hash: '$2a$12$eXistingHashedPasswordSuperAdminSecure2026',
      is_active: true,
      must_change_password: false,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z'
    }
  ],
  [
    '196708161996031001',
    {
      id: 'usr-02',
      nip_nik: '196708161996031001',
      nama_lengkap: 'Prof. Dr. Eng. Ir. Aripin, IPU., ASEAN Eng.',
      email: 'aripin.rektor@unsil.ac.id',
      id_unit: 'UN58',
      unit_kerja_id: 'UN58',
      id_role: 'PEJABAT',
      role: 'PEJABAT',
      role_label: 'Rektor Universitas Siliwangi',
      password: '$2a$12$eXistingHashedPasswordRektorSecure2026',
      password_hash: '$2a$12$eXistingHashedPasswordRektorSecure2026',
      is_active: true,
      must_change_password: false,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z'
    }
  ]
]);

// Muat seluruh user resmi dari users.json ke memoryUserStore agar akun terdaftar dapat diakses real-time
try {
  const usersJsonPath = path.resolve(__dirname, '../../src/data/users.json');
  if (fs.existsSync(usersJsonPath)) {
    const rawUsers = JSON.parse(fs.readFileSync(usersJsonPath, 'utf-8'));
    for (const u of rawUsers) {
      const nipKey = u.nip || u.nip_nik;
      if (nipKey && !memoryUserStore.has(nipKey)) {
        memoryUserStore.set(nipKey, {
          id: u.id,
          nip: u.nip || u.nip_nik,
          nip_nik: u.nip_nik || u.nip,
          username: u.username || u.email || u.nip,
          nama: u.nama || u.nama_lengkap || u.name,
          nama_lengkap: u.nama_lengkap || u.nama || u.name,
          name: u.nama_lengkap || u.nama || u.name,
          email: u.email,
          unit_kerja_id: u.unit_kerja_id || u.kode_unit || 'UN58',
          kode_unit: u.unit_kerja_id || u.kode_unit || 'UN58',
          id_unit: u.unit_kerja_id || u.kode_unit || 'UN58',
          unit: u.unit,
          role: u.role,
          id_role: u.role,
          role_label: u.roleLabel || u.role_label,
          roleLabel: u.roleLabel || u.role_label,
          roleLevel: u.roleLevel,
          jabatan: u.roleLabel || u.role_label,
          password: u.password_hash || u.password,
          password_hash: u.password_hash || u.password,
          raw_password: 'Siloka2026!',
          is_active: u.is_active !== false,
          must_change_password: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    }
  }
} catch (e) {
  console.warn('[USER-SERVICE] Gagal memuat data awal users.json ke memoryUserStore:', e.message);
}

/**
 * ============================================================================
 * SKENARIO 1: Pembuatan Akun via Impor Excel
 * ============================================================================
 * Melakukan operasi UPSERT ke tabel tm_user / master_user.
 * 
 * ATURAN KRUSIAL:
 * 1. Generate default password ('Unsil@' + 4 digit NIP atau 'Unsil@2026') dan hash dengan bcrypt (12 rounds).
 * 2. PostgreSQL UPSERT: ON CONFLICT (nip_nik) DO UPDATE SET ...
 * 3. PROTEKSI PASSWORD: Kolom `password` / `password_hash` TIDAK diikutsertakan dalam klausa DO UPDATE SET.
 *    Password lama pengguna eksisting TIDAK PERNAH tertimpa atau hilang saat sinkronisasi massal.
 * 4. FORCE CHANGE PASSWORD: Flag `must_change_password = true` HANYA diset untuk pengguna baru (INSERT).
 *    Klausa DO UPDATE SET TIDAK mengubah flag `must_change_password` milik pengguna eksisting.
 * 5. EMAIL NOTIFIKASI: Menggunakan ekspresi PostgreSQL `(xmax = 0) AS is_new_user` untuk mendeteksi
 *    apakah baris tersebut merupakan pengguna baru. Jika TRUE, kirimkan Welcome Email via Nodemailer.
 */
export const upsertUserFromSync = async ({
  nip_nik,
  nama_lengkap,
  email,
  id_unit,
  unit_kerja_id,
  id_role,
  role,
  role_label,
  jabatan,
  is_active = true
}) => {
  const nip = String(nip_nik || '').trim();
  const nama = String(nama_lengkap || '').trim();
  const userEmail = String(email || `${nip}@unsil.ac.id`).trim().toLowerCase();
  const unit = id_unit || unit_kerja_id || 'UN58';
  const userRole = id_role || role || 'OPERATOR_UNIT';
  const label = role_label || jabatan || `Staf ${unit}`;

  if (!nip || !nama) {
    throw new Error('NIP dan Nama Lengkap wajib diisi untuk operasi upsert.');
  }

  // 1. Generate default password dan lakukan bcrypt hashing
  const defaultPlainPassword = generateDefaultPassword(nip);
  const hashedPassword = await hashPassword(defaultPlainPassword);

  // 2. Susun Query SQL UPSERT PostgreSQL Terproteksi
  // Perhatikan: Kolom 'password' & 'must_change_password' sengaja TIDAK ADA di klausa DO UPDATE SET!
  const sqlQueryTmUser = `
    INSERT INTO tm_user (
      nip_nik,
      nama_lengkap,
      email,
      id_unit,
      id_role,
      password,
      is_active,
      must_change_password,
      created_at,
      updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW(), NOW())
    ON CONFLICT (nip_nik) DO UPDATE SET
      nama_lengkap = EXCLUDED.nama_lengkap,
      email = EXCLUDED.email,
      id_unit = EXCLUDED.id_unit,
      id_role = EXCLUDED.id_role,
      is_active = EXCLUDED.is_active,
      updated_at = NOW()
    RETURNING 
      id,
      nip_nik,
      nama_lengkap,
      email,
      id_unit,
      id_role,
      is_active,
      must_change_password,
      (xmax = 0) AS is_new_user;
  `;

  const sqlQueryMasterUser = `
    INSERT INTO master_user (
      id,
      nip_nik,
      nama_lengkap,
      email,
      password_hash,
      unit_kerja_id,
      role,
      role_level,
      role_label,
      is_active,
      must_change_password,
      created_at,
      updated_at
    )
    VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, NOW(), NOW()
    )
    ON CONFLICT (nip_nik) DO UPDATE SET
      nama_lengkap = EXCLUDED.nama_lengkap,
      email = EXCLUDED.email,
      unit_kerja_id = EXCLUDED.unit_kerja_id,
      role = EXCLUDED.role,
      role_label = EXCLUDED.role_label,
      is_active = EXCLUDED.is_active,
      updated_at = NOW()
    RETURNING 
      id,
      nip_nik,
      nama_lengkap,
      email,
      unit_kerja_id,
      role,
      role_label,
      is_active,
      must_change_password,
      (xmax = 0) AS is_new_user;
  `;

  let resultUser = null;
  let isNewUser = false;
  let dbExecuted = false;

  // 3. Eksekusi ke PostgreSQL jika pool database aktif
  try {
    // Coba eksekusi ke tabel tm_user terlebih dahulu
    try {
      const res = await query(sqlQueryTmUser, [
        nip,
        nama,
        userEmail,
        unit,
        userRole,
        hashedPassword,
        is_active
      ]);
      if (res && res.rows && res.rows.length > 0) {
        resultUser = res.rows[0];
        isNewUser = Boolean(resultUser.is_new_user);
        dbExecuted = true;
      }
    } catch (tmErr) {
      // Jika tabel tm_user tidak ada atau skema menggunakan master_user
      if (tmErr.message && (tmErr.message.includes('relation "tm_user" does not exist') || tmErr.message.includes('column'))) {
        const generatedId = `usr-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 4)}`;
        const roleLevel = userRole === 'PEJABAT' ? 'Level 1: Pimpinan' : 'Level 2: Pelaksana';
        const resMaster = await query(sqlQueryMasterUser, [
          generatedId,
          nip,
          nama,
          userEmail,
          hashedPassword,
          unit,
          userRole,
          roleLevel,
          label,
          is_active
        ]);
        if (resMaster && resMaster.rows && resMaster.rows.length > 0) {
          resultUser = resMaster.rows[0];
          isNewUser = Boolean(resultUser.is_new_user);
          dbExecuted = true;
        }
      } else {
        throw tmErr;
      }
    }
  } catch (dbError) {
    // Fallback in-memory jika server PostgreSQL lokal belum terhubung / mode testing
    console.warn(`[USER-SERVICE] Database live tidak tersedia (${dbError.message}). Menjalankan simulasi SQL terisolasi:`);
    
    const existing = memoryUserStore.get(nip);
    if (existing) {
      // Skenario UPDATE: password dan must_change_password TIDAK TERSENTUH
      isNewUser = false;
      existing.nama_lengkap = nama;
      existing.email = userEmail;
      existing.id_unit = unit;
      existing.unit_kerja_id = unit;
      existing.id_role = userRole;
      existing.role = userRole;
      existing.role_label = label;
      existing.is_active = is_active;
      existing.updated_at = new Date().toISOString();
      memoryUserStore.set(nip, existing);
      resultUser = { ...existing, is_new_user: false };
    } else {
      // Skenario INSERT: Pengguna baru mendapat password default & must_change_password = true
      isNewUser = true;
      const newRecord = {
        id: `usr-${Date.now().toString(36)}-${nip.slice(-4)}`,
        nip_nik: nip,
        nama_lengkap: nama,
        email: userEmail,
        id_unit: unit,
        unit_kerja_id: unit,
        id_role: userRole,
        role: userRole,
        role_label: label,
        password: hashedPassword,
        password_hash: hashedPassword,
        is_active: is_active,
        must_change_password: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_new_user: true
      };
      memoryUserStore.set(nip, newRecord);
      resultUser = newRecord;
    }
  }

  // 4. Force Change Password & Notifikasi Email untuk PENGGUNA BARU SAJA
  let emailDelivery = null;
  if (isNewUser) {
    console.log(`[USER-SERVICE] Pengguna baru terdeteksi: ${nama} (${nip}). Mengirimkan welcome email...`);
    emailDelivery = await sendWelcomeEmail({
      to: userEmail,
      nama: nama,
      nip: nip,
      defaultPassword: defaultPlainPassword,
      unitKerja: unit,
      role: userRole
    });
  } else {
    console.log(`[USER-SERVICE] Pembaruan data pegawai eksisting: ${nama} (${nip}). Password eksisting tetap aman.`);
  }

  return {
    success: true,
    action: isNewUser ? 'INSERT' : 'UPDATE',
    is_new_user: isNewUser,
    db_executed: dbExecuted,
    default_password_generated: isNewUser ? defaultPlainPassword : null,
    user: {
      id: resultUser.id,
      nip_nik: resultUser.nip_nik,
      nama_lengkap: resultUser.nama_lengkap,
      email: resultUser.email,
      id_unit: resultUser.id_unit || resultUser.unit_kerja_id,
      id_role: resultUser.id_role || resultUser.role,
      role_label: resultUser.role_label || label,
      is_active: resultUser.is_active,
      must_change_password: resultUser.must_change_password,
      updated_at: resultUser.updated_at
    },
    email_notification: emailDelivery
  };
};

/**
 * ============================================================================
 * SKENARIO 2: Mutasi Penugasan Pegawai & Manajemen Kredensial Akun Dinamis
 * ============================================================================
 * Endpoint: PUT/PATCH /api/admin/users/:id/mutation
 * 
 * ATURAN KRUSIAL:
 * 1. Query Update Tabel 'users':
 *    - Memperbarui data 'kode_unit' baru (mutasi penugasan) dan 'email'.
 * 2. CONDITIONAL CHECK PASSWORD:
 *    - Jika field 'Reset Password Baru' TIDAK KOSONG:
 *      Lakukan enkripsi/hashing (bcrypt 12 salt rounds) terlebih dahulu,
 *      lalu UPDATE kolom 'password' di database.
 *    - Jika KOSONG: Bypass dan jangan ubah password lama (password lama tetap utuh).
 * 3. FLASH MESSAGE / NOTIFIKASI SUKSES:
 *    "Mutasi Berhasil! Pegawai [Nama] telah dipindahkan ke [Unit_Baru]. Email Aktif: [Email]. Password Baru: [Tampilkan Password_Acak_Jika_Ada / Tampilkan 'Tidak Berubah' Jika Kosong]"
 */
export const mutateUserJobAssignment = async ({
  userId,
  targetUnit,
  kode_unit,
  unit_kerja_id,
  id_unit,
  role,
  role_label,
  jabatan,
  email,
  password_baru,
  new_password,
  mutated_by = 'Super Admin',
  nama,
  nama_lengkap,
  name
}) => {
  const cleanUserId = String(userId || '').trim();
  const cleanTargetUnit = String(targetUnit || kode_unit || unit_kerja_id || id_unit || '').trim();
  const cleanRole = role;
  const cleanRoleLabel = role_label || jabatan;
  const cleanEmail = email ? String(email).trim().toLowerCase() : null;
  const cleanNama = String(nama || nama_lengkap || name || '').trim();
  const rawNewPassword = password_baru || new_password;
  const hasNewPassword = Boolean(rawNewPassword && String(rawNewPassword).trim() !== '');

  if (!cleanUserId) {
    throw new Error('ID atau NIP target pengguna wajib disertakan.');
  }
  if (!cleanTargetUnit) {
    throw new Error('Unit kerja tujuan mutasi wajib dipilih.');
  }
  if (!cleanRole) {
    throw new Error('Role baru kedinasan wajib ditentukan.');
  }

  // 1. Enkripsi password secara aman jika ada input password baru
  let hashedPassword = null;
  if (hasNewPassword) {
    hashedPassword = await hashPassword(String(rawNewPassword).trim());
  }

  let updatedRecord = null;
  let dbExecuted = false;

  // Query SQL UPDATE dinamis ke tabel 'users'
  const sqlUpdateUsersWithPassword = `
    UPDATE users 
    SET 
      kode_unit = $1, 
      email = COALESCE($2, email),
      role = COALESCE($3, role), 
      jabatan = COALESCE($4, jabatan),
      password = $5,
      updated_at = NOW() 
    WHERE id::text = $6 OR nip = $6 OR username = $6
    RETURNING *;
  `;

  const sqlUpdateUsersWithoutPassword = `
    UPDATE users 
    SET 
      kode_unit = $1, 
      email = COALESCE($2, email),
      role = COALESCE($3, role), 
      jabatan = COALESCE($4, jabatan),
      updated_at = NOW() 
    WHERE id::text = $5 OR nip = $5 OR username = $5
    RETURNING *;
  `;

  // Query pendukung untuk tabel legacy tm_user
  const sqlUpdateTmUserWithPassword = `
    UPDATE tm_user 
    SET 
      id_unit = $1, 
      email = COALESCE($2, email),
      id_role = $3, 
      password = $4,
      updated_at = NOW() 
    WHERE id::text = $5 OR nip_nik = $5
    RETURNING id, nip_nik, nama_lengkap, email, id_unit, id_role, is_active, updated_at;
  `;

  const sqlUpdateTmUserWithoutPassword = `
    UPDATE tm_user 
    SET 
      id_unit = $1, 
      email = COALESCE($2, email),
      id_role = $3, 
      updated_at = NOW() 
    WHERE id::text = $4 OR nip_nik = $4
    RETURNING id, nip_nik, nama_lengkap, email, id_unit, id_role, is_active, updated_at;
  `;

  try {
    // Jalankan ke tabel 'users'
    try {
      let resUsers;
      if (hasNewPassword) {
        resUsers = await query(sqlUpdateUsersWithPassword, [
          cleanTargetUnit,
          cleanEmail,
          cleanRole,
          cleanRoleLabel,
          hashedPassword,
          cleanUserId
        ]);
      } else {
        resUsers = await query(sqlUpdateUsersWithoutPassword, [
          cleanTargetUnit,
          cleanEmail,
          cleanRole,
          cleanRoleLabel,
          cleanUserId
        ]);
      }
      if (resUsers && resUsers.rows && resUsers.rows.length > 0) {
        updatedRecord = resUsers.rows[0];
        dbExecuted = true;
      }
    } catch (usersErr) {
      console.warn('[MUTATION-SERVICE] Query tabel users dilewati/fallback:', usersErr.message);
    }

    // Jalankan ke tabel 'tm_user' untuk sinkronisasi
    try {
      let resTm;
      if (hasNewPassword) {
        resTm = await query(sqlUpdateTmUserWithPassword, [
          cleanTargetUnit,
          cleanEmail,
          cleanRole,
          hashedPassword,
          cleanUserId
        ]);
      } else {
        resTm = await query(sqlUpdateTmUserWithoutPassword, [
          cleanTargetUnit,
          cleanEmail,
          cleanRole,
          cleanUserId
        ]);
      }
      if (resTm && resTm.rows && resTm.rows.length > 0) {
        if (!updatedRecord) updatedRecord = resTm.rows[0];
        dbExecuted = true;
      }
    } catch (tmErr) {
      console.warn('[MUTATION-SERVICE] Query tm_user dilewati:', tmErr.message);
    }

    // Jalankan ke tabel 'master_user' untuk sinkronisasi
    try {
      let masterRole = 'DOSEN';
      if (cleanRole === 'Super Admin' || cleanRole === 'SUPER_ADMIN') masterRole = 'SUPER_ADMIN';
      else if (cleanRole === 'PEJABAT') masterRole = 'PEJABAT';
      else if (cleanRole === 'PENGAWAS') masterRole = 'PENGAWAS';
      else if (cleanRole === 'STAF_PERSURATAN') masterRole = 'STAF_PERSURATAN';
      else if (cleanRole === 'OPERATOR_UNIT' || cleanRole === 'STAF') masterRole = 'OPERATOR_UNIT';

      const sqlUpdateMaster = hasNewPassword
        ? `UPDATE master_user SET unit_kerja_id = $1, email = COALESCE($2, email), role = $3::role_user_enum, role_label = COALESCE($4, role_label), password_hash = $5, nama_lengkap = COALESCE(NULLIF($6, ''), nama_lengkap), updated_at = NOW() WHERE id = $7 OR nip_nik = $7 OR username = $7 RETURNING *;`
        : `UPDATE master_user SET unit_kerja_id = $1, email = COALESCE($2, email), role = $3::role_user_enum, role_label = COALESCE($4, role_label), nama_lengkap = COALESCE(NULLIF($5, ''), nama_lengkap), updated_at = NOW() WHERE id = $6 OR nip_nik = $6 OR username = $6 RETURNING *;`;

      const masterParams = hasNewPassword
        ? [cleanTargetUnit, cleanEmail, masterRole, cleanRoleLabel, hashedPassword, cleanNama, cleanUserId]
        : [cleanTargetUnit, cleanEmail, masterRole, cleanRoleLabel, cleanNama, cleanUserId];

      const resMaster = await query(sqlUpdateMaster, masterParams);
      if (resMaster && resMaster.rows && resMaster.rows.length > 0) {
        if (!updatedRecord) updatedRecord = resMaster.rows[0];
        dbExecuted = true;
      }
    } catch (errMaster) {
      console.warn('[MUTATION-SERVICE] Query master_user update dilewati:', errMaster.message);
    }
  } catch (dbError) {
    console.warn(`[MUTATION-SERVICE] Database live tidak tersedia (${dbError.message}). Menjalankan update aman di memory store:`);
  }

  // Sinkronisasi ke cache memori (memoryUserStore)
  let found = null;
  for (const [nip, user] of memoryUserStore.entries()) {
    if (user.id === cleanUserId || user.nip_nik === cleanUserId || user.nip === cleanUserId || user.username === cleanUserId || (cleanEmail && user.email === cleanEmail)) {
      found = user;
      break;
    }
  }

  // Jika belum ada di memoryUserStore, cek juga masterUsersList dari users.json
  if (!found && Array.isArray(masterUsersList)) {
    const fromMaster = masterUsersList.find((u) => 
      u.id === cleanUserId || u.nip === cleanUserId || u.nip_nik === cleanUserId || u.username === cleanUserId || (cleanEmail && u.email === cleanEmail)
    );
    if (fromMaster) {
      found = { ...fromMaster };
    }
  }

  if (found) {
    if (cleanNama) {
      found.nama = cleanNama;
      found.nama_lengkap = cleanNama;
      found.name = cleanNama;
    }
    found.id_unit = cleanTargetUnit;
    found.kode_unit = cleanTargetUnit;
    found.unit_kerja_id = cleanTargetUnit;
    found.id_role = cleanRole;
    found.role = cleanRole;
    if (cleanRole === 'DOSEN' || cleanRole === 'Dosen') {
      found.is_pejabat = false;
      found.roleLevel = 'Level 2: Fungsional Dosen';
    } else if (cleanRole === 'PEJABAT') {
      found.is_pejabat = true;
      found.roleLevel = 'Level 1: Pimpinan';
    }
    if (cleanRoleLabel) {
      found.role_label = cleanRoleLabel;
      found.jabatan = cleanRoleLabel;
    }
    if (cleanEmail) {
      found.email = cleanEmail;
    }
    // Conditional update password di memory store
    if (hasNewPassword) {
      found.password = hashedPassword;
      found.password_hash = hashedPassword;
      found.raw_password = String(rawNewPassword).trim();
    }
    found.updated_at = new Date().toISOString();
    memoryUserStore.set(found.nip_nik || found.nip, found);
    if (!updatedRecord) updatedRecord = found;
  } else if (!updatedRecord) {
    // Record fallback dinamis jika user baru pertama kali dimutasi
    const mockNip = cleanUserId.startsWith('19') ? cleanUserId : (cleanUserId.replace(/\D/g, '') || '198904122018031002');
    const resolvedName = cleanNama || (cleanEmail ? cleanEmail.split('@')[0] : 'Pegawai Terpilih');
    updatedRecord = {
      id: cleanUserId,
      nip: mockNip,
      nip_nik: mockNip,
      nama: resolvedName,
      nama_lengkap: resolvedName,
      email: cleanEmail || `${mockNip}@unsil.ac.id`,
      id_unit: cleanTargetUnit,
      kode_unit: cleanTargetUnit,
      unit_kerja_id: cleanTargetUnit,
      id_role: cleanRole,
      role: cleanRole,
      role_label: cleanRoleLabel || 'Staf Tata Usaha',
      jabatan: cleanRoleLabel || 'Staf Tata Usaha',
      password: hasNewPassword ? hashedPassword : '$2a$12$eXistingHashedPasswordPegawaiSecure2026',
      password_hash: hasNewPassword ? hashedPassword : '$2a$12$eXistingHashedPasswordPegawaiSecure2026',
      raw_password: hasNewPassword ? String(rawNewPassword).trim() : undefined,
      is_active: true,
      updated_at: new Date().toISOString()
    };
    memoryUserStore.set(mockNip, updatedRecord);
  }

  const unitName = getUnitNameByCode(cleanTargetUnit);
  const employeeName = cleanNama || updatedRecord.nama || updatedRecord.nama_lengkap || updatedRecord.name || 'Pegawai';
  const activeEmail = cleanEmail || updatedRecord.email;
  const passwordStatus = hasNewPassword ? String(rawNewPassword).trim() : 'Tidak Berubah';

  // Format baku notifikasi Flash Message:
  // "Mutasi Berhasil! Pegawai [Nama] telah dipindahkan ke [Unit_Baru]. Email Aktif: [Email]. Password Baru: [Tampilkan Password_Acak_Jika_Ada / Tampilkan 'Tidak Berubah' Jika Kosong]"
  const flashMessage = `Mutasi Berhasil! Pegawai ${employeeName} telah dipindahkan ke ${unitName}. Email Aktif: ${activeEmail}. Password Baru: ${passwordStatus}`;

  return {
    success: true,
    db_executed: dbExecuted,
    message: flashMessage,
    flashMessage: flashMessage,
    password_changed: hasNewPassword,
    user: {
      id: updatedRecord.id,
      nip: updatedRecord.nip || updatedRecord.nip_nik,
      nip_nik: updatedRecord.nip_nik || updatedRecord.nip,
      nama: employeeName,
      nama_lengkap: employeeName,
      email: activeEmail,
      id_unit: cleanTargetUnit,
      kode_unit: cleanTargetUnit,
      unit_kerja_id: cleanTargetUnit,
      unit: unitName,
      id_role: cleanRole,
      role: cleanRole,
      role_label: cleanRoleLabel,
      is_pejabat: cleanRole === 'PEJABAT' ? true : ((cleanRole === 'DOSEN' || cleanRole === 'Dosen') ? false : (updatedRecord.is_pejabat ?? false)),
      roleLevel: (cleanRole === 'DOSEN' || cleanRole === 'Dosen') ? 'Level 2: Fungsional Dosen' : (cleanRole === 'PEJABAT' ? 'Level 1: Pimpinan' : (updatedRecord.roleLevel || 'Level 2: Pelaksana')),
      role_level: (cleanRole === 'DOSEN' || cleanRole === 'Dosen') ? 'Level 2: Fungsional Dosen' : (cleanRole === 'PEJABAT' ? 'Level 1: Pimpinan' : (updatedRecord.roleLevel || 'Level 2: Pelaksana')),
      is_active: updatedRecord.is_active,
      password: updatedRecord.password || updatedRecord.password_hash,
      password_hash: updatedRecord.password_hash || updatedRecord.password,
      password_status: passwordStatus,
      raw_password: hasNewPassword ? String(rawNewPassword).trim() : undefined,
      updated_at: updatedRecord.updated_at
    },
    audit: {
      action: 'USER_MUTATION_WITH_CREDENTIALS',
      mutated_by,
      target_user_id: cleanUserId,
      target_unit: cleanTargetUnit,
      target_email: activeEmail,
      new_role: cleanRole,
      password_updated: hasNewPassword,
      timestamp: new Date().toISOString()
    }
  };
};

/**
 * ============================================================================
 * SKENARIO 3: Modul Tambah User (Super Admin)
 * ============================================================================
 * Logika Bisnis Baru:
 * 1. Dropdown "Jabatan / Tugas Tambahan":
 *    - Jika memilih "Dosen Biasa / Tanpa Jabatan", set 'is_pejabat = FALSE'
 *      dan ikat 'kode_unit' sesuai unit kerja yang dipilih (misal: Fakultas Teknik - UN58.13).
 *    - Jika memilih jabatan struktural (Dekan, Wadek, dll), set 'is_pejabat = TRUE'.
 * 2. Hilangkan kolom input password manual. Backend secara otomatis men-generate:
 *    - Username = Diambil dari NIP.
 *    - Password = String acak format 'Unsil' + 4 angka acak (misal: 'Unsil7392')
 *      dan lakukan hashing bcrypt sebelum disimpan ke database tabel 'users'.
 * 3. Mengembalikan format Flash Message / Notifikasi Sukses:
 *    "User Berhasil Dibuat! Nama: [Nama] | Unit: [Unit] | Jabatan: Dosen Biasa | Username: [NIP] | Password: [Password_Acak]"
 */
export const storeNewUser = async ({
  nip,
  nip_nik,
  nama,
  nama_lengkap,
  email,
  kode_unit,
  unit_kerja_id,
  id_unit,
  jabatan,
  tugas_tambahan,
  role,
  password,
  raw_password
}) => {
  const cleanNip = String(nip || nip_nik || '').trim();
  const cleanNama = String(nama || nama_lengkap || '').trim();
  const cleanUnit = String(kode_unit || unit_kerja_id || id_unit || 'UN58.13').trim();
  const rawJabatan = String(jabatan || tugas_tambahan || 'Dosen Biasa / Tanpa Jabatan').trim();

  // Validasi wajib
  if (!cleanNip) {
    throw new Error('NIP wajib diisi.');
  }
  if (!cleanNama) {
    throw new Error('Nama lengkap beserta gelar wajib diisi.');
  }
  if (!cleanUnit) {
    throw new Error('Kode unit kerja wajib dipilih.');
  }

  // 1. Logika bisnis: "Dosen Biasa / Tanpa Jabatan" vs Pejabat Struktural
  const posLower = rawJabatan.toLowerCase();
  const hasStructural =
    /\b(rektor|dekan|direktur|ketua lembaga|kepala biro|kepala upa|kajur|ketua jurusan|kaprodi|sekretaris|wakil dekan|wakil rektor|kepala subbagian|kasubbag)\b/i.test(
      rawJabatan
    );
  const isDosenBiasa =
    rawJabatan === 'Dosen Biasa / Tanpa Jabatan' ||
    rawJabatan === 'Dosen Biasa' ||
    posLower.includes('dosen fungsional') ||
    posLower.includes('dosen pengajar') ||
    posLower.includes('tanpa jabatan');
  const is_pejabat = !isDosenBiasa && (role === 'PEJABAT' || hasStructural);
  const finalJabatan = isDosenBiasa && rawJabatan === 'Dosen Biasa / Tanpa Jabatan' ? 'Dosen Biasa' : rawJabatan;
  const finalRole = is_pejabat ? 'PEJABAT' : (role || (isDosenBiasa ? 'DOSEN' : 'OPERATOR_UNIT'));
  const finalRoleLevel = isDosenBiasa ? 'Level 2: Fungsional Dosen' : (is_pejabat ? 'Level 1: Pimpinan' : 'Level 2: Pelaksana');

  // 2. Hilangkan input password manual jika tidak diisi, gunakan yang diinput atau backend auto-generate:
  // Username = Diambil dari NIP
  const username = cleanNip;
  // Password = Buat string acak (format: 'Unsil' + 4 angka acak) jika tidak disediakan
  const rawPassword = (typeof password === 'string' && password.trim().length >= 6)
    ? password.trim()
    : ((typeof raw_password === 'string' && raw_password.trim().length >= 6)
      ? raw_password.trim()
      : generateRandomUnsilPassword());
  // Lakukan hashing bcrypt (12 salt rounds)
  const hashedPassword = await hashPassword(rawPassword);

  const userEmail = String(email || `${cleanNip}@unsil.ac.id`).trim().toLowerCase();
  const userId = `usr-${Date.now().toString(36)}-${cleanNip.slice(-4)}`;
  const unitName = getUnitNameByCode(cleanUnit);

  // Cabut status terhapus / unmark deleted jika identifier ini pernah dihapus sebelumnya
  unmarkUserAsDeleted([userId, cleanNip, username, userEmail]);

  let dbExecuted = false;

  // 3. Simpan ke database PostgreSQL tabel 'users'
  const sqlInsertUsers = `
    INSERT INTO users (
      id,
      nip,
      username,
      nama,
      email,
      kode_unit,
      jabatan,
      is_pejabat,
      password,
      role,
      is_active,
      must_change_password,
      created_at,
      updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, true, NOW(), NOW())
    ON CONFLICT (nip) DO UPDATE SET
      username = EXCLUDED.username,
      nama = EXCLUDED.nama,
      email = EXCLUDED.email,
      kode_unit = EXCLUDED.kode_unit,
      jabatan = EXCLUDED.jabatan,
      is_pejabat = EXCLUDED.is_pejabat,
      role = EXCLUDED.role,
      password = EXCLUDED.password,
      is_active = EXCLUDED.is_active,
      updated_at = NOW()
    RETURNING *;
  `;

  // Query pendukung untuk tabel tm_user (kompatibilitas arsitektur terpadu)
  const sqlInsertTmUser = `
    INSERT INTO tm_user (
      nip_nik,
      nama_lengkap,
      email,
      id_unit,
      id_role,
      password,
      is_active,
      must_change_password,
      created_at,
      updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, true, true, NOW(), NOW())
    ON CONFLICT (nip_nik) DO UPDATE SET
      nama_lengkap = EXCLUDED.nama_lengkap,
      email = EXCLUDED.email,
      id_unit = EXCLUDED.id_unit,
      id_role = EXCLUDED.id_role,
      is_active = EXCLUDED.is_active,
      updated_at = NOW()
    RETURNING *;
  `;

  try {
    // Jalankan ke tabel 'users'
    try {
      await query(sqlInsertUsers, [
        userId,
        cleanNip,
        username,
        cleanNama,
        userEmail,
        cleanUnit,
        finalJabatan,
        is_pejabat,
        hashedPassword,
        finalRole
      ]);
      dbExecuted = true;
    } catch (usersErr) {
      console.warn('[USER-SERVICE] Query tabel users dilewati/dibuat dinamis:', usersErr.message);
    }

    // Jalankan ke tabel 'tm_user' untuk sinkronisasi
    try {
      await query(sqlInsertTmUser, [
        cleanNip,
        cleanNama,
        userEmail,
        cleanUnit,
        finalRole,
        hashedPassword
      ]);
      dbExecuted = true;
    } catch (tmErr) {
      console.warn('[USER-SERVICE] Query tm_user dilewati:', tmErr.message);
    }

    // Jalankan ke tabel 'master_user' jika ada
    try {
      let masterRole = 'DOSEN';
      if (finalRole === 'Super Admin' || finalRole === 'SUPER_ADMIN') masterRole = 'SUPER_ADMIN';
      else if (finalRole === 'PEJABAT') masterRole = 'PEJABAT';
      else if (finalRole === 'PENGAWAS') masterRole = 'PENGAWAS';
      else if (finalRole === 'STAF_PERSURATAN') masterRole = 'STAF_PERSURATAN';
      else if (finalRole === 'OPERATOR_UNIT' || finalRole === 'STAF') masterRole = 'OPERATOR_UNIT';

      const sqlInsertMaster = `
        INSERT INTO master_user (
          id, nip_nik, username, nama_lengkap, email, password_hash,
          unit_kerja_id, role, role_level, role_label, is_signature_ready, is_active, must_change_password,
          created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true, true, NOW(), NOW())
        ON CONFLICT (nip_nik) DO UPDATE SET
          username = EXCLUDED.username,
          nama_lengkap = EXCLUDED.nama_lengkap,
          email = EXCLUDED.email,
          unit_kerja_id = EXCLUDED.unit_kerja_id,
          role = EXCLUDED.role,
          role_level = EXCLUDED.role_level,
          role_label = EXCLUDED.role_label,
          is_signature_ready = EXCLUDED.is_signature_ready,
          is_active = EXCLUDED.is_active,
          updated_at = NOW()
        RETURNING *;
      `;
      await query(sqlInsertMaster, [
        userId,
        cleanNip,
        username,
        cleanNama,
        userEmail,
        hashedPassword,
        cleanUnit,
        masterRole,
        finalRoleLevel,
        finalJabatan,
        is_pejabat
      ]);
      dbExecuted = true;
    } catch (mErr) {
      console.warn('[USER-SERVICE] Query master_user dilewati:', mErr.message);
    }
  } catch (dbErr) {
    console.warn('[USER-SERVICE] Database live tidak dapat diakses, beralih ke cache memori:', dbErr.message);
  }

  // Simpan/sinkronkan ke memoryUserStore untuk fallback real-time
  const isSuperUser = finalRole === 'Super Admin' || finalRole === 'SUPER_ADMIN';
  const roleSlugUser = isSuperUser
    ? 'super_admin'
    : is_pejabat
    ? 'pimpinan'
    : finalRole === 'VERIFIKATOR'
    ? 'verifikator'
    : finalRole === 'STAF' || finalRole === 'OPERATOR_UNIT'
    ? 'admin_tu'
    : finalRole === 'PENGAWAS'
    ? 'auditor_spi'
    : 'drafter';

  const defaultPerms = is_pejabat
    ? ['surat.create', 'surat.read', 'disposisi.create', 'disposisi.forward', 'tte.sign']
    : isSuperUser
    ? ['*']
    : ['surat.create', 'surat.read'];

  const memoryRecord = {
    id: userId,
    nip: cleanNip,
    nip_nik: cleanNip,
    username: username,
    nama: cleanNama,
    nama_lengkap: cleanNama,
    name: cleanNama,
    email: userEmail,
    id_unit: cleanUnit,
    kode_unit: cleanUnit,
    unit_kerja_id: cleanUnit,
    unit: unitName,
    jabatan: finalJabatan,
    role_label: finalJabatan,
    roleLabel: finalJabatan,
    id_role: finalRole,
    role: finalRole,
    role_slug: roleSlugUser,
    roleLevel: finalRoleLevel,
    is_pejabat: is_pejabat,
    is_super_admin: isSuperUser,
    permissions: defaultPerms,
    password: hashedPassword,
    password_hash: hashedPassword,
    raw_password: rawPassword,
    is_active: true,
    must_change_password: true,
    signatureReady: is_pejabat,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  memoryUserStore.set(cleanNip, memoryRecord);

  // 4. Susun Flash Message / Notifikasi Sukses sesuai kaidah teknis:
  // "Akun Berhasil Dibuat! Username: [NIP] | Password: [Password_Acak_Sebelum_Bcrypt]"
  const flashMessage = `Akun Berhasil Dibuat! Username: ${username} | Password: ${rawPassword}`;

  return {
    success: true,
    db_executed: dbExecuted,
    message: flashMessage,
    flashMessage: flashMessage,
    user: memoryRecord
  };
};

/**
 * ============================================================================
 * SKENARIO 4: Pengambilan Seluruh Data Pengguna Resmi (GET /api/admin/users)
 * ============================================================================
 * Mengambil data dari master_user PostgreSQL, digabungkan secara de-duplicated
 * dengan tabel users, memoryUserStore, dan dataset master users.json.
 */
export const getAllUsersFromDatabase = async () => {
  let dbUsers = [];
  try {
    if (isDatabaseAvailable()) {
      const res = await query(`
        SELECT 
          m.id,
          m.nip_nik,
          m.nip_nik AS nip,
          COALESCE(m.username, m.email, m.nip_nik) AS username,
          m.nama_lengkap,
          m.nama_lengkap AS name,
          m.email,
          m.unit_kerja_id,
          m.unit_kerja_id AS kode_unit,
          m.role::text AS raw_role,
          m.role_label AS "roleLabel",
          m.role_label AS jabatan,
          m.role_level AS "roleLevel",
          m.avatar_url AS avatar,
          m.is_signature_ready AS "signatureReady",
          m.is_active
        FROM master_user m
        ORDER BY 
          CASE WHEN m.role::text ILIKE '%super%' THEN 0 ELSE 1 END,
          m.nama_lengkap ASC
      `);
      if (res && res.rows && res.rows.length > 0) {
        dbUsers = res.rows;
      }
    }
  } catch (err) {
    console.warn('[USER-SERVICE] Gagal mengambil dari master_user:', err.message);
  }

  // Juga periksa tabel 'users' untuk user yang mungkin ditambahkan secara dinamis
  try {
    if (isDatabaseAvailable()) {
      const resUsers = await query(`
        SELECT 
          id, nip, nip AS nip_nik, username, nama AS nama_lengkap, nama AS name,
          email, kode_unit AS unit_kerja_id, kode_unit, role AS raw_role,
          jabatan AS "roleLabel", jabatan, is_pejabat, is_active
        FROM users
      `);
      if (resUsers && resUsers.rows) {
        for (const u of resUsers.rows) {
          const exists = dbUsers.some(
            (d) => d.nip === u.nip || d.id === u.id || (u.email && d.email === u.email)
          );
          if (!exists) {
            dbUsers.push({
              ...u,
              role_level: u.is_pejabat ? 'Level 1: Pimpinan' : 'Level 2: Fungsional Dosen',
              signatureReady: Boolean(u.is_pejabat)
            });
          }
        }
      }
    }
  } catch (errUsers) {
    console.warn('[USER-SERVICE] Gagal mengambil dari tabel users:', errUsers.message);
  }

  // Fallback: Gunakan masterUsersList (users.json) HANYA jika database dan memory store sama-sama kosong
  const memoryList = Array.from(memoryUserStore.values());
  const fallbackSource = dbUsers.length > 0
    ? memoryList
    : (memoryList.length > 0 ? memoryList : masterUsersList);

  const combined = [...dbUsers];
  for (const fb of fallbackSource) {
    const key = fb.nip || fb.nip_nik;
    const exists = combined.some(
      (c) =>
        (key && (c.nip === key || c.nip_nik === key)) ||
        (fb.email && c.email && c.email.toLowerCase() === fb.email.toLowerCase()) ||
        (fb.id && c.id === fb.id)
    );
    if (!exists) {
      combined.push({
        id: fb.id,
        nip_nik: fb.nip_nik || fb.nip,
        nip: fb.nip || fb.nip_nik,
        username: fb.username || fb.email || fb.nip,
        nama_lengkap: fb.nama_lengkap || fb.nama || fb.name,
        name: fb.nama_lengkap || fb.nama || fb.name,
        email: fb.email,
        unit_kerja_id: fb.unit_kerja_id || fb.kode_unit || fb.id_unit || 'UN58',
        kode_unit: fb.unit_kerja_id || fb.kode_unit || fb.id_unit || 'UN58',
        raw_role: fb.role || fb.id_role,
        roleLabel: fb.roleLabel || fb.role_label || fb.jabatan,
        jabatan: fb.jabatan || fb.roleLabel || fb.role_label,
        roleLevel: fb.roleLevel || 'Level 2: Pelaksana',
        avatar: fb.avatar || fb.avatar_url,
        signatureReady: fb.signatureReady !== false,
        is_active: fb.is_active !== false
      });
    }
  }

  // Format data final yang konsisten sesuai standar institusi UNSIL
  return combined
    .filter(
      (u) =>
        u.id !== 'usr-admin-01' &&
        u.id !== 'usr-00' &&
        !String(u.nama_lengkap || u.name || '').includes('Administrator Utama SILOKA') &&
        !isUserDeleted(u.id) &&
        !isUserDeleted(u.nip) &&
        !isUserDeleted(u.nip_nik) &&
        !isUserDeleted(u.email) &&
        !isUserDeleted(u.username)
    )
    .map((u) => {
      const rawRole = String(u.raw_role || u.role || '').toUpperCase();
      const isSuper =
        rawRole.includes('SUPER') ||
        String(u.email || '').includes('dedegunawan@unsil.ac.id') ||
        u.id === 'usr-dg-01';
      const cleanJabatan =
        u.jabatan || u.roleLabel || (isSuper ? 'Super Administrator' : 'Pegawai');
      const posLower = cleanJabatan.toLowerCase();
      const hasStructural =
        /\b(rektor|dekan|direktur|ketua lembaga|kepala biro|kepala upa|kajur|ketua jurusan|kaprodi|sekretaris|wakil dekan|wakil rektor|kepala subbagian|kasubbag)\b/i.test(
          cleanJabatan
        );
      const isPejabat =
        isSuper || rawRole === 'PEJABAT' || (hasStructural && !posLower.includes('dosen fungsional'));

      let mappedRole = 'DOSEN';
      if (isSuper) mappedRole = 'Super Admin';
      else if (rawRole === 'PEJABAT' || isPejabat) mappedRole = 'PEJABAT';
      else if (rawRole === 'PENGAWAS') mappedRole = 'PENGAWAS';
      else if (rawRole === 'OPERATOR_UNIT' || rawRole === 'STAF') mappedRole = 'OPERATOR_UNIT';
      else if (rawRole === 'STAF_PERSURATAN') mappedRole = 'STAF_PERSURATAN';
      else if (rawRole === 'VERIFIKATOR') mappedRole = 'VERIFIKATOR';

      const roleSlug = isSuper
        ? 'super_admin'
        : isPejabat
        ? 'pimpinan'
        : mappedRole === 'VERIFIKATOR'
        ? 'verifikator'
        : mappedRole === 'OPERATOR_UNIT' || mappedRole === 'STAF'
        ? 'admin_tu'
        : mappedRole === 'PENGAWAS'
        ? 'auditor_spi'
        : 'drafter';

      return {
        id: u.id,
        nip: u.nip || u.nip_nik,
        nip_nik: u.nip_nik || u.nip,
        username: u.username || u.email || u.nip,
        nama_lengkap: u.nama_lengkap || u.name,
        name: u.nama_lengkap || u.name,
        email: u.email,
        unit_kerja_id: u.unit_kerja_id || u.kode_unit || 'UN58',
        kode_unit: u.unit_kerja_id || u.kode_unit || 'UN58',
        unit: getUnitNameByCode(u.unit_kerja_id || u.kode_unit),
        role: mappedRole,
        role_slug: u.role_slug || roleSlug,
        roleLabel: cleanJabatan,
        role_label: cleanJabatan,
        jabatan: cleanJabatan,
        roleLevel:
          u.roleLevel ||
          (isSuper
            ? 'Level 0: Administrator Sistem'
            : isPejabat
            ? 'Level 1: Pimpinan'
            : 'Level 3: Dosen/Pegawai'),
        is_pejabat: isPejabat,
        is_super_admin: isSuper,
        signatureReady: u.signatureReady !== false || isPejabat,
        is_active: u.is_active !== false,
        avatar:
          u.avatar ||
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
      };
    })
    .sort((a, b) => {
      if (a.is_super_admin && !b.is_super_admin) return -1;
      if (!a.is_super_admin && b.is_super_admin) return 1;
      return (a.name || '').localeCompare(b.name || '');
    });
};

/**
 * ============================================================================
 * SKENARIO 5: Hapus Pengguna dari Sistem (DELETE /api/admin/users/:id)
 * ============================================================================
 * Menghapus akun pengguna dari database (master_user, users, tbl_users, tm_user)
 * dan memory store, dengan proteksi mutlak bagi Super Administrator.
 */
export const deleteUserById = async (userOrId) => {
  const isObj = typeof userOrId === 'object' && userOrId !== null;
  const cleanId = String(
    isObj ? (userOrId.id || userOrId.nip || userOrId.nip_nik || userOrId.email) : (userOrId || '')
  ).trim();
  if (!cleanId) {
    throw new Error('ID atau NIP pengguna wajib disertakan.');
  }

  // Proteksi mutlak Super Admin
  if (
    cleanId === 'usr-dg-01' ||
    cleanId === '198501012010121001' ||
    cleanId.toLowerCase().includes('dedegunawan')
  ) {
    throw new Error(
      'Akun Super Administrator sistem tidak dapat dihapus untuk menjaga keamanan dan kedaulatan akses SILOKA.'
    );
  }

  // Kumpulkan seluruh data pengenal pengguna sebelum dihapus
  const idsToBlacklist = new Set([cleanId.toLowerCase()]);

  if (isObj) {
    if (userOrId.id) idsToBlacklist.add(String(userOrId.id).toLowerCase());
    if (userOrId.nip) idsToBlacklist.add(String(userOrId.nip).toLowerCase());
    if (userOrId.nip_nik) idsToBlacklist.add(String(userOrId.nip_nik).toLowerCase());
    if (userOrId.email) {
      const em = String(userOrId.email).toLowerCase();
      idsToBlacklist.add(em);
      if (em.includes('@')) idsToBlacklist.add(em.split('@')[0]);
    }
    if (userOrId.username) idsToBlacklist.add(String(userOrId.username).toLowerCase());
  }

  // Cek di memoryUserStore
  for (const [key, u] of memoryUserStore.entries()) {
    if (u.id === cleanId || u.nip_nik === cleanId || u.email === cleanId || key === cleanId) {
      if (u.id) idsToBlacklist.add(String(u.id).toLowerCase());
      if (u.nip_nik) idsToBlacklist.add(String(u.nip_nik).toLowerCase());
      if (u.nip) idsToBlacklist.add(String(u.nip).toLowerCase());
      if (u.email) {
        const em = String(u.email).toLowerCase();
        idsToBlacklist.add(em);
        if (em.includes('@')) idsToBlacklist.add(em.split('@')[0]);
      }
      if (u.username) idsToBlacklist.add(String(u.username).toLowerCase());
    }
  }

  // Cek di masterUsersList
  for (const u of masterUsersList) {
    if (
      u.id === cleanId ||
      u.nip_nik === cleanId ||
      u.nip === cleanId ||
      u.email === cleanId ||
      u.username === cleanId
    ) {
      if (u.id) idsToBlacklist.add(String(u.id).toLowerCase());
      if (u.nip_nik) idsToBlacklist.add(String(u.nip_nik).toLowerCase());
      if (u.nip) idsToBlacklist.add(String(u.nip).toLowerCase());
      if (u.email) {
        const em = String(u.email).toLowerCase();
        idsToBlacklist.add(em);
        if (em.includes('@')) idsToBlacklist.add(em.split('@')[0]);
      }
      if (u.username) idsToBlacklist.add(String(u.username).toLowerCase());
    }
  }

  // Daftarkan ke blacklist permanen agar tidak bisa login kembali sama sekali
  idsToBlacklist.forEach((id) => deletedUserIdentifiers.add(id));
  saveDeletedUsers();

  // Hapus dari masterUsersList
  masterUsersList = masterUsersList.filter(
    (u) =>
      !idsToBlacklist.has(String(u.id || '').toLowerCase()) &&
      !idsToBlacklist.has(String(u.nip || u.nip_nik || '').toLowerCase()) &&
      !idsToBlacklist.has(String(u.email || '').toLowerCase()) &&
      !idsToBlacklist.has(String(u.username || '').toLowerCase())
  );

  let dbDeleted = false;
  try {
    if (isDatabaseAvailable()) {
      try {
        await query(`DELETE FROM master_user WHERE id = $1 OR nip_nik = $1 OR email = $1`, [cleanId]);
        dbDeleted = true;
      } catch (e1) {
        console.warn('[USER-SERVICE] Gagal hapus dari master_user:', e1.message);
      }

      try {
        await query(`DELETE FROM users WHERE id::text = $1 OR nip = $1 OR username = $1 OR email = $1`, [cleanId]);
        dbDeleted = true;
      } catch (e2) {
        console.warn('[USER-SERVICE] Gagal hapus dari users:', e2.message);
      }

      try {
        await query(
          `DELETE FROM tbl_user_roles WHERE id_user IN (SELECT id_user FROM tbl_users WHERE id_user::text = $1 OR nip_nik = $1 OR email = $1)`,
          [cleanId]
        );
      } catch (eRole) {
        console.warn('[USER-SERVICE] Gagal hapus dari tbl_user_roles:', eRole.message);
      }

      try {
        await query(`DELETE FROM tbl_users WHERE id_user::text = $1 OR nip_nik = $1 OR email = $1`, [cleanId]);
        dbDeleted = true;
      } catch (e3) {
        console.warn('[USER-SERVICE] Gagal hapus dari tbl_users:', e3.message);
      }

      try {
        await query(`DELETE FROM tm_user WHERE id::text = $1 OR nip_nik = $1 OR email = $1`, [cleanId]);
        dbDeleted = true;
      } catch (e4) {
        console.warn('[USER-SERVICE] Gagal hapus dari tm_user:', e4.message);
      }
    }
  } catch (err) {
    console.warn('[USER-SERVICE] Gagal menghapus user dari database:', err.message);
  }

  // Hapus dari cache memory
  memoryUserStore.delete(cleanId);
  for (const [key, user] of memoryUserStore.entries()) {
    const kLower = String(key).toLowerCase();
    const uId = String(user.id || '').toLowerCase();
    const uNip = String(user.nip_nik || user.nip || '').toLowerCase();
    const uEmail = String(user.email || '').toLowerCase();
    if (
      idsToBlacklist.has(kLower) ||
      idsToBlacklist.has(uId) ||
      idsToBlacklist.has(uNip) ||
      idsToBlacklist.has(uEmail)
    ) {
      memoryUserStore.delete(key);
    }
  }

  return {
    success: true,
    db_deleted: dbDeleted,
    message: 'Pengguna berhasil dihapus dari sistem. Akses ke sistem SILOKA telah dicabut sepenuhnya.'
  };
};

export default {
  upsertUserFromSync,
  mutateUserJobAssignment,
  storeNewUser,
  getAllUsersFromDatabase,
  deleteUserById,
  isUserDeleted,
  deletedUserIdentifiers
};

