/**
 * Utilitas Sistem Hierarki Otomatis (Automated Hierarchy Routing) - SILOKA UNSIL
 * 
 * Aturan Bisnis Kaku:
 * 1. Mendeteksi 'kode_unit' dan 'jabatan' dari user login (Session User: Dosen/Staf).
 * 2. Menyaring master pejabat dengan kriteria kaku:
 *    "WHERE kode_unit = [unit_kerja_user_login] AND is_aktif = TRUE"
 * 3. Dropdown HANYA memuat pejabat struktural di dalam naungan unit kerja user tersebut
 *    (Contoh: Dosen FT hanya dapat memilih Dekan FT atau Wakil Dekan FT). Pilihan unit lain disembunyikan.
 * 4. Menyediakan nilai terpisah untuk "Nama Pejabat", "Gelar", dan "NIP" untuk auto-fill real-time & readonly.
 */

import masterPejabatList from '../data/masterPejabat.json' with { type: 'json' };
import usersData from '../data/users.json' with { type: 'json' };

/**
 * Mendapatkan daftar pejabat struktural yang HANYA berada di bawah unit kerja user login.
 * Pilihan dari unit kerja lain otomatis disembunyikan.
 * 
 * @param {string|object} unitOrUser - Kode unit pengguna atau objek session user
 * @param {object} [sessionUser] - Objek session user opsional
 * @returns {Array<object>} Daftar pejabat struktural dalam unit tersebut
 */
export const getPejabatByUnit = (unitOrUser, sessionUser = null) => {
  let targetUnit = '';

  if (typeof unitOrUser === 'string') {
    targetUnit = unitOrUser.trim().toUpperCase();
  } else if (unitOrUser && typeof unitOrUser === 'object') {
    targetUnit = (unitOrUser.unit_kerja_id || unitOrUser.kode_unit || '').trim().toUpperCase();
  }

  if (!targetUnit && sessionUser) {
    targetUnit = (sessionUser.unit_kerja_id || sessionUser.kode_unit || '').trim().toUpperCase();
  }

  // Jika tetap kosong, fallback aman ke unit default
  if (!targetUnit) {
    targetUnit = 'UN58.13';
  }

  // Implementasi kaku:
  // "SELECT * FROM master_pejabat WHERE kode_unit = [unit_kerja_user_login] AND is_aktif = TRUE"
  // Pilihan dari unit kerja lain otomatis disembunyikan oleh sistem!
  return masterPejabatList.filter(
    (p) =>
      p.kode_unit.toUpperCase() === targetUnit &&
      (p.is_aktif === true || p.is_active === true)
  );
};

/**
 * Cari objek pejabat berdasarkan NIP
 * @param {string} nip 
 * @returns {object|null}
 */
export const findPejabatByNip = (nip) => {
  if (!nip) return null;
  const cleanNip = String(nip).trim();
  return (
    masterPejabatList.find(
      (p) => p.nip === cleanNip && (p.is_aktif === true || p.is_active === true)
    ) || null
  );
};

/**
 * Cari objek pejabat berdasarkan ID
 * @param {number|string} id 
 * @returns {object|null}
 */
export const findPejabatById = (id) => {
  if (!id) return null;
  return (
    masterPejabatList.find(
      (p) => String(p.id) === String(id) && (p.is_aktif === true || p.is_active === true)
    ) || null
  );
};

/**
 * Format label pilihan dropdown penandatangan
 * @param {object} pejabat 
 * @returns {string}
 */
export const formatPejabatLabel = (pejabat) => {
  if (!pejabat) return '';
  return `${pejabat.jabatan} — ${pejabat.nama}, ${pejabat.gelar}`;
};

/**
 * Mendapatkan seluruh daftar pejabat struktural resmi UNSIL
 * lengkap dengan pemetaan user_id dari data akun pengguna
 * untuk kebutuhan perutean otomatis (direct inbox routing) Surat Masuk.
 * 
 * @returns {Array<object>}
 */
export const getAllOfficialsWithUserMapping = () => {
  return masterPejabatList.map((p) => {
    const userMatch = usersData.find(
      (u) =>
        u.nip_nik === p.nip ||
        u.nip === p.nip ||
        (u.jabatan && u.jabatan.toLowerCase() === p.jabatan.toLowerCase()) ||
        (u.roleLabel && u.roleLabel.toLowerCase() === p.jabatan.toLowerCase())
    );

    let kategori = 'Pimpinan Fakultas & Lembaga';
    if (p.kode_unit === 'UN58' || p.kode_unit === 'UN58.SENAT' || p.kode_unit === 'UN58.SPI' || p.kode_unit === 'UN58.DP') {
      kategori = 'Pimpinan Rektorat & Organ Universitas';
    } else if (p.kode_unit === 'UN58.5' || p.kode_unit === 'UN58.6') {
      kategori = 'Pimpinan Biro UNSIL';
    } else if (p.kode_unit.startsWith('UN58.1') && p.jabatan.toLowerCase().includes('dekan')) {
      kategori = 'Dekan Fakultas & Direktur Pascasarjana';
    } else if (p.kode_unit.startsWith('UN58.2') || p.kode_unit.startsWith('UN58.3')) {
      kategori = 'Kepala Lembaga & UPA';
    }

    return {
      id: p.id,
      jabatan: p.jabatan,
      nama: p.nama,
      gelar: p.gelar,
      nama_gelar: p.nama_gelar,
      nip: p.nip,
      kode_unit: p.kode_unit,
      kategori,
      user_id: userMatch?.id || null,
      user_email: userMatch?.email || null,
      user_name: userMatch?.nama_lengkap || userMatch?.name || p.nama_gelar,
      role: userMatch?.role || 'PEJABAT',
      label: `${p.jabatan} — ${p.nama_gelar}`
    };
  });
};

export default {
  getPejabatByUnit,
  findPejabatByNip,
  findPejabatById,
  formatPejabatLabel,
  getAllOfficialsWithUserMapping
};
