/**
 * Service: Manajemen Data Master Pejabat Penandatangan (SILOKA UNSIL)
 * 
 * Mengimplementasikan Sistem Hierarki Otomatis (Automated Hierarchy Routing):
 * 1. Mendeteksi kode_unit dan jabatan dari pengguna yang login (Session User: Dosen/Staf).
 * 2. Menjalankan query kaku:
 *    "SELECT * FROM master_pejabat WHERE kode_unit = [unit_kerja_user_login] AND is_aktif = TRUE"
 * 3. Menyaring hasil sehingga HANYA pejabat struktural di bawah unit kerja user yang ditampilkan,
 *    dan menyembunyikan seluruh pejabat dari unit kerja lain.
 * 4. Menyediakan kolom nama, gelar, dan nip untuk auto-fill real-time.
 */

import { query } from '../config/database.js';
import masterPejabatData from '../../src/data/masterPejabat.json' with { type: 'json' };

const FALLBACK_PEJABAT = masterPejabatData || [];

/**
 * 1. Ambil daftar pejabat struktural berdasarkan unit kerja user login (Automated Hierarchy Routing)
 * 
 * @param {string} kodeUnit - Unit kerja user (misal: 'UN58.13' untuk Fakultas Teknik)
 * @param {object} sessionUserInfo - Metadata akun login (jabatan, role)
 * @returns {Promise<Array>} Daftar pejabat struktural dalam unit tersebut
 */
export const getPejabatByUnit = async (kodeUnit, sessionUserInfo = null) => {
  const targetUnit = (kodeUnit || '').trim().toUpperCase();

  // Query kaku sesuai spesifikasi nomor 2:
  // SELECT * FROM master_pejabat WHERE kode_unit = [unit_kerja_user_login] AND is_aktif = TRUE
  const sql = `
    SELECT id, nip, nama, gelar, nama_gelar, jabatan, kode_unit, is_aktif, is_active
    FROM master_pejabat
    WHERE UPPER(kode_unit) = $1
      AND (is_aktif = TRUE OR is_active = TRUE)
    ORDER BY id ASC;
  `;

  try {
    const res = await query(sql, [targetUnit]);
    if (res && res.rows && res.rows.length > 0) {
      return res.rows;
    }
  } catch (err) {
    console.warn('[PEJABAT-SERVICE] Database tidak merespons, menggunakan dataset memori:', err.message);
  }

  // Fallback memori dengan aturan kaku: HANYA menampilkan pejabat dalam naungan unit kerja user
  if (!targetUnit) {
    return FALLBACK_PEJABAT.filter((p) => p.is_aktif || p.is_active);
  }

  // Saring kaku: pilihan dari unit kerja lain otomatis disembunyikan
  const unitOfficials = FALLBACK_PEJABAT.filter(
    (p) => (p.is_aktif || p.is_active) && p.kode_unit.toUpperCase() === targetUnit
  );

  return unitOfficials;
};

/**
 * 2. Ambil seluruh daftar pejabat penandatangan aktif (khusus Administrator)
 */
export const getAllPejabat = async () => {
  const sql = `
    SELECT id, nip, nama, gelar, nama_gelar, jabatan, kode_unit, is_aktif, is_active
    FROM master_pejabat
    WHERE (is_aktif = TRUE OR is_active = TRUE)
    ORDER BY kode_unit ASC, id ASC;
  `;

  try {
    const res = await query(sql);
    if (res && res.rows && res.rows.length > 0) {
      return res.rows;
    }
  } catch (err) {
    console.warn('[PEJABAT-SERVICE] Gagal mengambil seluruh pejabat dari DB, fallback ke memori:', err.message);
  }

  return FALLBACK_PEJABAT.filter((p) => p.is_aktif || p.is_active);
};

/**
 * 3. Cari detail pejabat berdasarkan NIP
 */
export const getPejabatByNip = async (nip) => {
  if (!nip) return null;
  const cleanNip = String(nip).trim();

  const sql = `
    SELECT id, nip, nama, gelar, nama_gelar, jabatan, kode_unit, is_aktif, is_active
    FROM master_pejabat
    WHERE nip = $1 AND (is_aktif = TRUE OR is_active = TRUE)
    LIMIT 1;
  `;

  try {
    const res = await query(sql, [cleanNip]);
    if (res && res.rows && res.rows.length > 0) {
      return res.rows[0];
    }
  } catch (err) {
    console.warn('[PEJABAT-SERVICE] Gagal mencari pejabat by NIP dari DB, fallback ke memori:', err.message);
  }

  return FALLBACK_PEJABAT.find((p) => p.nip === cleanNip && (p.is_aktif || p.is_active)) || null;
};

export default {
  getPejabatByUnit,
  getAllPejabat,
  getPejabatByNip
};
