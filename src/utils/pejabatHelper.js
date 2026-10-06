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
import unitKerjaList from '../data/unitKerja.json' with { type: 'json' };
import { matchesOfficialDisposisiPosition } from './disposisiStandards.js';
import { isSuperAdminUser } from './authGuards.js';

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
 * Helper untuk mendapatkan nama resmi unit kerja dari kode unit
 */
const getUnitNameByCode = (code) => {
  const clean = String(code || '').trim().toUpperCase();
  const found = unitKerjaList.find((u) => u.kode_unit.toUpperCase() === clean);
  if (found) return found.nama_unit;
  return 'Universitas Siliwangi';
};

/**
 * Helper pengelompokan kategori tujuan pejabat naskah dinas
 */
const getKategoriByUnitAndPosition = (kodeUnit, jabatanStr = '') => {
  const code = String(kodeUnit || '').toUpperCase().trim();
  const jab = String(jabatanStr || '').toLowerCase();

  if (code === 'UN58' || code === 'UN58.SENAT' || code === 'UN58.SPI' || code === 'UN58.DP') {
    return 'Pimpinan Rektorat & Organ Universitas';
  }
  if (code === 'UN58.5' || code === 'UN58.6') {
    return 'Pimpinan Biro UNSIL';
  }
  if (code.startsWith('UN58.1') || code === 'UN58.PASCA') {
    if (
      jab.includes('jurusan') ||
      jab.includes('kajur') ||
      jab.includes('prodi') ||
      jab.includes('program studi') ||
      jab.includes('laboratorium') ||
      jab.includes('kalab')
    ) {
      return 'Ketua Jurusan & Koordinator Program Studi';
    }
    return 'Dekan Fakultas & Direktur Pascasarjana';
  }
  if (code.startsWith('UN58.2') || code.startsWith('UN58.3')) {
    return 'Kepala Lembaga & UPA';
  }
  return 'Pimpinan Satuan Kerja Lainnya';
};

/**
 * Memeriksa apakah suatu akun pengguna merupakan Pejabat Struktural sah UNSIL
 */
const isOfficialUserAccount = (u) => {
  if (!u) return false;
  // Super Admin adalah administrator sistem, bukan pejabat penerima surat dinas
  if (isSuperAdminUser(u)) return false;

  const role = String(u.role || '').toUpperCase();
  const roleSlug = String(u.role_slug || '').toLowerCase();
  const isPejabat = Boolean(u.is_pejabat);
  const jab = String(u.jabatan || u.roleLabel || u.role_label || '').trim();
  const posLower = jab.toLowerCase();

  // Kecualikan dosen biasa fungsional tanpa jabatan atau staf tata usaha murni
  if (
    posLower.includes('dosen fungsional') ||
    posLower.includes('dosen biasa') ||
    posLower.includes('tanpa jabatan') ||
    posLower.includes('pengadministrasi') ||
    posLower.includes('arsiparis')
  ) {
    return false;
  }

  return (
    isPejabat ||
    role === 'PEJABAT' ||
    roleSlug === 'pimpinan' ||
    matchesOfficialDisposisiPosition(jab)
  );
};

/**
 * Mendapatkan seluruh daftar pejabat struktural resmi UNSIL
 * yang TERINTEGRASI PENUH dengan modul Manajemen Pengguna (allUsers),
 * Peran & Wewenang Akun, Unit Kerja, dan Jabatan Struktural / Peran Institusi.
 * 
 * Data akun pengguna aktif dari Manajemen Pengguna dijadikan Single Source of Truth
 * untuk nama pejabat terkini, NIP, email, dan perutean disposisi otomatis (direct inbox routing).
 * 
 * @param {Array<object>} [customUsersList] - Daftar master user dari Manajemen Pengguna (opsional)
 * @returns {Array<object>}
 */
export const getAllOfficialsWithUserMapping = (customUsersList = null) => {
  // Jika caller memberikan customUsersList (dari Manajemen Pengguna / allUsers)
  const isExplicitUserManagement = Array.isArray(customUsersList);

  let currentUsers = [];
  if (isExplicitUserManagement) {
    currentUsers = customUsersList;
  } else if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('siloka_users_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          currentUsers = parsed;
        }
      }
    } catch (e) {
      // ignore
    }
  }

  // JIKA BERSUMBER EKSPLISIT DARI MANAJEMEN PENGGUNA (allUsers):
  // HANYA ambil akun-akun pejabat yang sah dan aktif dari Manajemen Pengguna!
  if (isExplicitUserManagement) {
    const officials = [];
    const seenUserIds = new Set();
    const seenNips = new Set();

    currentUsers.forEach((u) => {
      if (!u) return;
      if (!isOfficialUserAccount(u)) return; // Jangan masukkan staf/dosen non-pejabat atau super admin

      const uId = String(u.id || '').trim();
      const uNip = String(u.nip || u.nip_nik || '').trim();

      if (uId && seenUserIds.has(uId)) return;
      if (uNip && uNip !== '-' && seenNips.has(uNip)) return;

      // Cari referensi masterPejabat untuk memperkaya data gelar atau SOTK
      const masterRef = masterPejabatList.find((p) => {
        const pNip = String(p.nip || '').trim();
        if (uNip && pNip && uNip === pNip) return true;
        const uJab = String(u.jabatan || u.roleLabel || u.role_label || '').trim().toLowerCase();
        const pJab = String(p.jabatan || '').trim().toLowerCase();
        if (uJab && pJab && (uJab === pJab || uJab.includes(pJab) || pJab.includes(uJab))) return true;
        return false;
      });

      const kodeUnit = u.unit_kerja_id || u.kode_unit || masterRef?.kode_unit || 'UN58';
      const finalJabatan = u.jabatan || u.roleLabel || u.role_label || masterRef?.jabatan || 'Pejabat Struktural';
      const finalNama = u.nama_lengkap || u.name || masterRef?.nama_gelar || 'Pejabat UNSIL';
      const finalNip = uNip || masterRef?.nip || '-';
      const finalUnitName = u.unit || getUnitNameByCode(kodeUnit);
      const kategori = getKategoriByUnitAndPosition(kodeUnit, finalJabatan);

      if (uId) seenUserIds.add(uId);
      if (finalNip && finalNip !== '-') seenNips.add(finalNip);

      officials.push({
        id: u.id || masterRef?.id,
        jabatan: finalJabatan,
        nama: u.nama_lengkap || u.name || masterRef?.nama,
        gelar: masterRef?.gelar || '',
        nama_gelar: finalNama,
        nip: finalNip,
        kode_unit: kodeUnit,
        unit_nama: finalUnitName,
        kategori,
        user_id: u.id,
        user_email: u.email || null,
        user_name: finalNama,
        role: u.role || 'PEJABAT',
        role_slug: u.role_slug || 'pimpinan',
        roleLevel: u.roleLevel || 'Level 1: Pimpinan',
        permissions: u.permissions || ['disposisi.create', 'disposisi.forward'],
        label: finalJabatan,
        is_from_user_management: true,
        has_active_account: true,
        is_pejabat: true
      });
    });

    const kategoriOrder = {
      'Pimpinan Rektorat & Organ Universitas': 1,
      'Pimpinan Biro UNSIL': 2,
      'Dekan Fakultas & Direktur Pascasarjana': 3,
      'Ketua Jurusan & Koordinator Program Studi': 4,
      'Kepala Lembaga & UPA': 5,
      'Pimpinan Satuan Kerja Lainnya': 6
    };

    return officials.sort((a, b) => {
      const orderA = kategoriOrder[a.kategori] || 99;
      const orderB = kategoriOrder[b.kategori] || 99;
      if (orderA !== orderB) return orderA - orderB;

      // Utamakan Rektor di puncak
      const isRektorA = a.jabatan.toLowerCase().includes('rektor universitas');
      const isRektorB = b.jabatan.toLowerCase().includes('rektor universitas');
      if (isRektorA && !isRektorB) return -1;
      if (!isRektorA && isRektorB) return 1;

      // Utamakan Wakil Rektor
      const isWarekA = a.jabatan.toLowerCase().includes('wakil rektor');
      const isWarekB = b.jabatan.toLowerCase().includes('wakil rektor');
      if (isWarekA && !isWarekB) return -1;
      if (!isWarekA && isWarekB) return 1;

      // Utamakan Dekan di atas Wakil Dekan
      const isDekanA = a.jabatan.toLowerCase().startsWith('dekan');
      const isDekanB = b.jabatan.toLowerCase().startsWith('dekan');
      if (isDekanA && !isDekanB) return -1;
      if (!isDekanA && isDekanB) return 1;

      return a.jabatan.localeCompare(b.jabatan);
    });
  }

  // JIKA TANPA ARGUMEN (Fallback Default SOTK Master):
  if (!currentUsers || currentUsers.length === 0) {
    currentUsers = usersData;
  }

  const officials = [];
  const matchedUserIds = new Set();
  const matchedNips = new Set();

  masterPejabatList.forEach((p) => {
    const userMatch = currentUsers.find((u) => {
      if (!u) return false;
      const uNip = String(u.nip || u.nip_nik || '').trim();
      const pNip = String(p.nip || '').trim();
      if (uNip && pNip && uNip === pNip) return true;

      const uUnit = String(u.unit_kerja_id || u.kode_unit || '').trim().toUpperCase();
      const pUnit = String(p.kode_unit || '').trim().toUpperCase();
      const uJab = String(u.jabatan || u.roleLabel || u.role_label || '').trim().toLowerCase();
      const pJab = String(p.jabatan || '').trim().toLowerCase();

      if (uUnit && pUnit && uUnit === pUnit && uJab && pJab && (uJab === pJab || uJab.includes(pJab) || pJab.includes(uJab))) {
        return true;
      }
      return false;
    });

    const kodeUnit = userMatch?.unit_kerja_id || userMatch?.kode_unit || p.kode_unit;
    const finalJabatan = userMatch?.jabatan || userMatch?.roleLabel || p.jabatan;
    const finalNama = userMatch?.nama_lengkap || userMatch?.name || p.nama_gelar;
    const finalNip = userMatch?.nip || userMatch?.nip_nik || p.nip;
    const finalUnitName = userMatch?.unit || getUnitNameByCode(kodeUnit);
    const kategori = getKategoriByUnitAndPosition(kodeUnit, finalJabatan);

    if (userMatch) {
      matchedUserIds.add(userMatch.id);
      if (finalNip) matchedNips.add(finalNip);
    }

    officials.push({
      id: p.id,
      jabatan: finalJabatan,
      nama: userMatch?.nama_lengkap || userMatch?.name || p.nama,
      gelar: p.gelar || '',
      nama_gelar: finalNama,
      nip: finalNip,
      kode_unit: kodeUnit,
      unit_nama: finalUnitName,
      kategori,
      user_id: userMatch?.id || null,
      user_email: userMatch?.email || null,
      user_name: finalNama,
      role: userMatch?.role || 'PEJABAT',
      role_slug: userMatch?.role_slug || 'pimpinan',
      roleLevel: userMatch?.roleLevel || 'Level 1: Pimpinan',
      permissions: userMatch?.permissions || ['disposisi.create', 'disposisi.forward'],
      label: finalJabatan,
      is_from_user_management: Boolean(userMatch),
      has_active_account: Boolean(userMatch?.email || userMatch?.id)
    });
  });

  const kategoriOrder = {
    'Pimpinan Rektorat & Organ Universitas': 1,
    'Pimpinan Biro UNSIL': 2,
    'Dekan Fakultas & Direktur Pascasarjana': 3,
    'Ketua Jurusan & Koordinator Program Studi': 4,
    'Kepala Lembaga & UPA': 5,
    'Pimpinan Satuan Kerja Lainnya': 6
  };

  return officials.sort((a, b) => {
    const orderA = kategoriOrder[a.kategori] || 99;
    const orderB = kategoriOrder[b.kategori] || 99;
    if (orderA !== orderB) return orderA - orderB;

    const isRektorA = a.jabatan.toLowerCase().includes('rektor universitas');
    const isRektorB = b.jabatan.toLowerCase().includes('rektor universitas');
    if (isRektorA && !isRektorB) return -1;
    if (!isRektorA && isRektorB) return 1;

    const isWarekA = a.jabatan.toLowerCase().includes('wakil rektor');
    const isWarekB = b.jabatan.toLowerCase().includes('wakil rektor');
    if (isWarekA && !isWarekB) return -1;
    if (!isWarekA && isWarekB) return 1;

    const isDekanA = a.jabatan.toLowerCase().startsWith('dekan');
    const isDekanB = b.jabatan.toLowerCase().startsWith('dekan');
    if (isDekanA && !isDekanB) return -1;
    if (!isDekanA && isDekanB) return 1;

    return a.jabatan.localeCompare(b.jabatan);
  });
};

export default {
  getPejabatByUnit,
  findPejabatByNip,
  findPejabatById,
  formatPejabatLabel,
  getAllOfficialsWithUserMapping
};
