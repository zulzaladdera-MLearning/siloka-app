/**
 * Klien Layanan Persuratan & Klasifikasi Arsip (SILOKA UNSIL)
 * Menghubungkan antarmuka Frontend dengan API Backend:
 * - GET /api/klasifikasi-arsip (Daftar dinamis kode klasifikasi)
 * - POST /api/surat-keluar (Penerbitan nomor surat keluar otomatis terproteksi)
 */

import { getPejabatByUnit, getAllOfficialsWithUserMapping } from '../utils/pejabatHelper.js';
import { JRA_MASTER_ITEMS } from '../config/jraMasterCatalog.js';
import seedLetters from '../data/letters.json' with { type: 'json' };
import {
  getRektoratOfficialSopProfile,
  getAuthorizedTemplates,
  normalizeUserRole
} from '../config/documentFormats.js';

const API_BASE =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) ||
  (typeof process !== 'undefined' && process.env && process.env.VITE_API_URL) ||
  'http://localhost:3000/api';

// Dataset cadangan resmi UNSIL (SK Rektor No. 2803/2023)
const FALLBACK_KLASIFIKASI = JRA_MASTER_ITEMS;

let localSequenceCounter = 1;

const _lastAssignedPerUnitYear = new Map();

export const resetSequenceSession = () => _lastAssignedPerUnitYear.clear();

export const incrementSequenceSession = (unitCode, year, assignedSeq) => {
  const key = `${(unitCode || '').toUpperCase()}_${year || new Date().getFullYear()}`;
  const currentMax = _lastAssignedPerUnitYear.get(key) || 0;
  const nextVal = typeof assignedSeq === 'number' && assignedSeq > 0 ? assignedSeq : currentMax + 1;
  if (nextVal > currentMax) {
    _lastAssignedPerUnitYear.set(key, nextVal);
  }
};

/**
 * Menghitung nomor urut persuratan berikutnya secara dinamis berdasarkan unit kerja dan tahun kalender aktif
 * Sesuai ketentuan Pasal 39 Peraturan Rektor No. 3/2023 (Penomoran berkesinambungan tanpa ganda)
 * 
 * @param {string} unitCode - Kode unit kerja penerbit (misal: 'UN58.32' atau 'UN58.10')
 * @param {number} [year] - Tahun kalender (default: tahun berjalan)
 * @param {Array} [existingLetters] - Daftar surat yang sudah tersimpan
 * @returns {number} Nomor urut berikutnya (max + 1)
 */
export const getNextSequenceForUnit = (unitCode, year = new Date().getFullYear(), existingLetters = []) => {
  let list = Array.isArray(existingLetters) && existingLetters.length > 0 ? existingLetters : [];
  if (list.length === 0) {
    if (typeof localStorage !== 'undefined') {
      try {
        const stored = localStorage.getItem('siloka_letters_data');
        if (stored) {
          list = JSON.parse(stored);
        }
      } catch {
        // ignore
      }
    }
    if (!list || list.length === 0) {
      list = seedLetters || [];
    }
  }

  let maxSeq = 0;
  const targetUnit = (unitCode || '').trim().toUpperCase();
  const targetYear = Number(year) || new Date().getFullYear();

  for (const l of list) {
    if (!l) continue;
    const letterNum = String(l.nomorSurat || l.nomor_surat || '');
    const numUnitMatch = letterNum.match(/\/(UN58(?:\.[A-Za-z0-9]+)?)\//i);
    const lUnit = (
      l.unit_kerja_id ||
      (l.templateData && l.templateData.unit_kerja_id) ||
      (numUnitMatch ? numUnitMatch[1] : '')
    ).trim().toUpperCase();

    if (targetUnit && lUnit && lUnit !== targetUnit) {
      continue;
    }

    const lYear = Number(l.tahun) || (l.tanggal ? new Date(l.tanggal).getFullYear() : null);
    const isSameYear = lYear === targetYear || letterNum.endsWith(`/${targetYear}`);
    if (!isSameYear && letterNum && !letterNum.includes(`/${targetYear}`)) {
      continue;
    }

    if (typeof l.nomor_urut === 'number' && !isNaN(l.nomor_urut)) {
      if (l.nomor_urut > maxSeq) maxSeq = l.nomor_urut;
    }

    const match = letterNum.match(/^0*([1-9]\d*)\//);
    if (match) {
      const val = parseInt(match[1], 10);
      if (!isNaN(val) && val > maxSeq) maxSeq = val;
    }
  }

  const sessionKey = `${targetUnit}_${targetYear}`;
  const lastAssigned = _lastAssignedPerUnitYear.get(sessionKey) || 0;
  const effectiveMax = Math.max(maxSeq, lastAssigned);

  return effectiveMax + 1;
};

/**
 * Fetch daftar klasifikasi arsip aktif dari Backend API
 */
export const fetchKlasifikasiArsip = async () => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);
  if (timeoutId.unref) timeoutId.unref();

  try {
    const response = await fetch(`${API_BASE}/klasifikasi-arsip`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      signal: controller.signal
    });

    if (response.ok) {
      const result = await response.json();
      if (Array.isArray(result.data) && result.data.length > 0) {
        return result.data;
      }
    }
  } catch (err) {
    console.warn('[LETTER-SERVICE] Menggunakan klasifikasi lokal (Backend offline / timeout):', err.message);
  } finally {
    clearTimeout(timeoutId);
  }

  return FALLBACK_KLASIFIKASI;
};

/**
 * Simpan surat keluar ke backend dan dapatkan Nomor Surat Otomatis resmi:
 * [nomor_urut_baru]/[kode_unit_kerja]/[tingkat_keamanan]/[kode_klasifikasi]/[tahun]
 */
export const saveOutgoingLetter = async (payload, currentUser = null) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);
  if (timeoutId.unref) timeoutId.unref();

  try {
    const response = await fetch(`${API_BASE}/surat-keluar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-user-role': currentUser?.role || 'OPERATOR_UNIT'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    if (response.ok) {
      const result = await response.json();
      return result;
    }
  } catch (err) {
    console.warn('[LETTER-SERVICE] Backend offline, menjalankan generator nomor otomatis mandiri:', err.message);
  } finally {
    clearTimeout(timeoutId);
  }

  // Fallback simulator mandiri (jika backend tidak aktif saat demonstrasi klien)
  const currentYear = payload.tahun || new Date().getFullYear();
  const unitCode = currentUser?.unit_kerja_id || payload.unit_kerja_id || 'UN58.10';
  const seq = getNextSequenceForUnit(unitCode, currentYear);
  const nomorLengkap = `${seq}/${unitCode}/${payload.tingkat_keamanan || 'B'}/${payload.kode_klasifikasi || 'PP.00.03'}/${currentYear}`;

  return {
    status: 201,
    success: true,
    message: `Surat keluar berhasil didaftarkan dengan nomor resmi: ${nomorLengkap}`,
    data: {
      id_surat: Date.now(),
      nomor_urut: seq,
      nomor_surat_lengkap: nomorLengkap,
      tingkat_keamanan: payload.tingkat_keamanan || 'B',
      kode_klasifikasi: payload.kode_klasifikasi || 'PP.00.03',
      perihal: payload.perihal,
      tujuan: payload.tujuan,
      tahun: currentYear,
      unit_kerja_id: unitCode,
      created_at: new Date().toISOString()
    }
  };
};

/**
 * Fetch daftar pejabat penandatangan berdasarkan unit kerja pengguna login (Automated Hierarchy Routing)
 * Query kaku: SELECT * FROM master_pejabat WHERE kode_unit = [unit_kerja_user_login] AND is_aktif = TRUE
 * 
 * @param {string} kodeUnit - Kode unit kerja pengguna (misal: 'UN58.13')
 * @param {object} sessionUser - Informasi pengguna aktif (Dosen/Staf)
 * @returns {Promise<Array>}
 */
export const fetchPejabatByUnit = async (kodeUnit, sessionUser = null) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    if (timeoutId.unref) timeoutId.unref();

    const userJabatan = sessionUser?.roleLabel || sessionUser?.jabatan || 'Dosen Biasa';
    const queryParams = new URLSearchParams({
      kode_unit: kodeUnit || '',
      jabatan: userJabatan
    });

    try {
      const response = await fetch(`${API_BASE}/pejabat?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        signal: controller.signal
      });

      if (response.ok) {
        const result = await response.json();
        if (Array.isArray(result.data) && result.data.length > 0) {
          return result.data;
        }
      }
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (err) {
    console.warn('[LETTER-SERVICE] Backend pejabat offline, menggunakan dataset lokal hierarki:', err.message);
  }

  // Fallback lokal ke modul pejabatHelper (strictly unit-scoped)
  return getPejabatByUnit(kodeUnit, sessionUser);
};

/**
 * Registrasi surat masuk eksternal lengkap dengan nomor agenda otomatis
 */
export const saveInboundLetter = async (payload, currentUser = null) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 1200);
  if (timeoutId.unref) timeoutId.unref();

  try {
    const response = await fetch(`${API_BASE}/surat-masuk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-user-role': currentUser?.role || 'OPERATOR_UNIT'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    if (response.ok) {
      const result = await response.json();
      return result;
    }
  } catch (err) {
    console.warn('[LETTER-SERVICE] Backend offline/timeout, menggunakan generator agenda surat masuk mandiri:', err.message);
  } finally {
    clearTimeout(timeoutId);
  }

  const currentYear = Number(payload.tahun) || new Date().getFullYear();
  const unitCode = payload.target_unit_id || payload.unit_kerja_id || currentUser?.unit_kerja_id || 'UN58';
  const seq = localSequenceCounter++;
  const agendaNumber = `AGD-${currentYear}/${unitCode}/${String(seq).padStart(4, '0')}`;

  return {
    status: 201,
    success: true,
    message: `Surat masuk berhasil dicatat dengan nomor agenda: ${agendaNumber}`,
    data: {
      id_surat: Date.now(),
      nomor_urut: seq,
      nomor_agenda: agendaNumber,
      nomorAgenda: agendaNumber,
      nomorSurat: agendaNumber,
      nomor_surat_asal: payload.nomor_surat_asal || '-',
      nomorSuratAsal: payload.nomor_surat_asal || '-',
      tingkat_keamanan: payload.tingkat_keamanan || 'B',
      kode_klasifikasi: payload.kode_klasifikasi || 'KP',
      perihal: payload.perihal,
      pengirim: payload.pengirim,
      tujuan: payload.tujuan,
      target_unit_id: payload.target_unit_id || unitCode,
      tujuan_aksi: payload.tujuan_aksi || 'DISPOSISI',
      tahun: currentYear,
      unit_kerja_id: unitCode,
      created_at: new Date().toISOString()
    }
  };
};

/**
 * 13 Jenis Naskah Dinas yang Sah Ditandatangani oleh Dekan (Tabel 1 Peraturan Rektor No. 3/2023)
 */
export const FALLBACK_SCOPED_LETTER_TYPES = [
  {
    kode_jenis_naskah: 'SURAT_DINAS',
    nama_jenis_naskah: 'Surat Dinas',
    allowed_roles: ['KETUA_JURUSAN', 'DEKAN'],
    can_choose_signatory: true,
    catatan_kewenangan: 'Sah ditandatangani oleh Dekan atau Ketua Jurusan untuk keperluan kedinasan.',
    badge_keterangan: 'Kewenangan Penandatanganan Sesuai Tabel 1: Ketua Jurusan / Dekan',
    workflow_preview: ['Drafter: Anda (Dosen/Staf)', 'TTE Final: Ketua Jurusan']
  },
  {
    kode_jenis_naskah: 'NOTA_DINAS',
    nama_jenis_naskah: 'Nota Dinas',
    allowed_roles: ['KETUA_JURUSAN', 'DEKAN'],
    can_choose_signatory: true,
    catatan_kewenangan: 'Komunikasi internal antar pejabat di lingkungan fakultas/jurusan.',
    badge_keterangan: 'Kewenangan Penandatanganan Sesuai Tabel 1: Ketua Jurusan / Dekan',
    workflow_preview: ['Drafter: Anda (Dosen/Staf)', 'TTE Final: Ketua Jurusan']
  },
  {
    kode_jenis_naskah: 'SURAT_UNDANGAN',
    nama_jenis_naskah: 'Surat Undangan',
    allowed_roles: ['KETUA_JURUSAN', 'DEKAN'],
    can_choose_signatory: true,
    catatan_kewenangan: 'Undangan rapat dinas internal jurusan atau fakultas.',
    badge_keterangan: 'Kewenangan Penandatanganan Sesuai Tabel 1: Ketua Jurusan / Dekan',
    workflow_preview: ['Drafter: Anda (Dosen/Staf)', 'TTE Final: Ketua Jurusan']
  },
  {
    kode_jenis_naskah: 'SURAT_TUGAS',
    nama_jenis_naskah: 'Surat Tugas',
    allowed_roles: ['DEKAN'],
    can_choose_signatory: false,
    catatan_kewenangan: 'Penugasan dinas staf/dosen di lingkungan fakultas wajib ditandatangani Dekan.',
    badge_keterangan: 'Kewenangan Penandatanganan Sesuai Tabel 1: Dekan',
    workflow_preview: ['Drafter: Anda (Dosen/Staf)', 'Paraf: Ketua Jurusan', 'Paraf: Wakil Dekan', 'TTE Final: Dekan']
  },
  {
    kode_jenis_naskah: 'SURAT_EDARAN',
    nama_jenis_naskah: 'Surat Edaran',
    allowed_roles: ['DEKAN'],
    can_choose_signatory: false,
    catatan_kewenangan: 'Petunjuk pelaksanaan kebijakan internal fakultas (Dekan).',
    badge_keterangan: 'Kewenangan Penandatanganan Sesuai Tabel 1: Dekan',
    workflow_preview: ['Drafter: Anda (Dosen/Staf)', 'Paraf: Ketua Jurusan', 'Paraf: Wakil Dekan', 'TTE Final: Dekan']
  },
  {
    kode_jenis_naskah: 'SURAT_KETERANGAN',
    nama_jenis_naskah: 'Surat Keterangan',
    allowed_roles: ['DEKAN'],
    can_choose_signatory: false,
    catatan_kewenangan: 'Surat keterangan resmi fakultas wajib ditandatangani Dekan.',
    badge_keterangan: 'Kewenangan Penandatanganan Sesuai Tabel 1: Dekan',
    workflow_preview: ['Drafter: Anda (Dosen/Staf)', 'Paraf: Ketua Jurusan', 'Paraf: Wakil Dekan', 'TTE Final: Dekan']
  },
  {
    kode_jenis_naskah: 'SURAT_PENGANTAR',
    nama_jenis_naskah: 'Surat Pengantar',
    allowed_roles: ['KETUA_JURUSAN', 'DEKAN'],
    can_choose_signatory: true,
    catatan_kewenangan: 'Pengantar berkas/naskah resmi dinas.',
    badge_keterangan: 'Kewenangan Penandatanganan Sesuai Tabel 1: Ketua Jurusan / Dekan',
    workflow_preview: ['Drafter: Anda (Dosen/Staf)', 'TTE Final: Ketua Jurusan']
  },
  {
    kode_jenis_naskah: 'SURAT_PERNYATAAN',
    nama_jenis_naskah: 'Surat Pernyataan',
    allowed_roles: ['KETUA_JURUSAN', 'DEKAN'],
    can_choose_signatory: true,
    catatan_kewenangan: 'Pernyataan kedinasan atau kebenaran administratif.',
    badge_keterangan: 'Kewenangan Penandatanganan Sesuai Tabel 1: Ketua Jurusan / Dekan',
    workflow_preview: ['Drafter: Anda (Dosen/Staf)', 'TTE Final: Ketua Jurusan']
  },
  {
    kode_jenis_naskah: 'SURAT_KUASA',
    nama_jenis_naskah: 'Surat Kuasa',
    allowed_roles: ['KETUA_JURUSAN', 'DEKAN'],
    can_choose_signatory: true,
    catatan_kewenangan: 'Pelimpahan kewenangan tertentu dalam batas wewenang jabatan.',
    badge_keterangan: 'Kewenangan Penandatanganan Sesuai Tabel 1: Ketua Jurusan / Dekan',
    workflow_preview: ['Drafter: Anda (Dosen/Staf)', 'TTE Final: Ketua Jurusan']
  },
  {
    kode_jenis_naskah: 'PENGUMUMAN',
    nama_jenis_naskah: 'Pengumuman',
    allowed_roles: ['KETUA_JURUSAN', 'DEKAN'],
    can_choose_signatory: true,
    catatan_kewenangan: 'Pengumuman internal lingkup fakultas atau jurusan.',
    badge_keterangan: 'Kewenangan Penandatanganan Sesuai Tabel 1: Ketua Jurusan / Dekan',
    workflow_preview: ['Drafter: Anda (Dosen/Staf)', 'TTE Final: Ketua Jurusan']
  },
  {
    kode_jenis_naskah: 'BERITA_ACARA',
    nama_jenis_naskah: 'Berita Acara',
    allowed_roles: ['DEKAN'],
    can_choose_signatory: false,
    catatan_kewenangan: 'Catatan resmi pelaksanaan kegiatan atau serah terima tingkat fakultas.',
    badge_keterangan: 'Kewenangan Penandatanganan Sesuai Tabel 1: Dekan',
    workflow_preview: ['Drafter: Anda (Dosen/Staf)', 'Paraf: Ketua Jurusan', 'Paraf: Wakil Dekan', 'TTE Final: Dekan']
  },
  {
    kode_jenis_naskah: 'POS',
    nama_jenis_naskah: 'Prosedur Operasional Standar (POS)',
    allowed_roles: ['DEKAN'],
    can_choose_signatory: false,
    catatan_kewenangan: 'Standar operasional prosedur lingkup fakultas ditetapkan oleh Dekan.',
    badge_keterangan: 'Kewenangan Penandatanganan Sesuai Tabel 1: Dekan',
    workflow_preview: ['Drafter: Anda (Dosen/Staf)', 'Paraf: Ketua Jurusan', 'Paraf: Wakil Dekan', 'TTE Final: Dekan']
  },
  {
    kode_jenis_naskah: 'PKS_DN',
    nama_jenis_naskah: 'Perjanjian Kerja Sama (PKS) Dalam Negeri',
    allowed_roles: ['DEKAN'],
    can_choose_signatory: false,
    catatan_kewenangan: 'PKS tingkat fakultas dengan mitra dalam negeri ditandatangani Dekan.',
    badge_keterangan: 'Kewenangan Penandatanganan Sesuai Tabel 1: Dekan',
    workflow_preview: ['Drafter: Anda (Dosen/Staf)', 'Paraf: Ketua Jurusan', 'Paraf: Wakil Dekan', 'TTE Final: Dekan']
  }
];

/**
 * Fetch jenis naskah yang boleh dibuat oleh user (Drafter/Konseptor) berdasarkan Tabel 1
 * GET /api/naskah/available-types
 * 
 * @param {object} currentUser - Data session pengguna
 */
export const fetchAvailableLetterTypes = async (currentUser = null, availableUsers = null) => {
  // Jika pengguna adalah Rektor atau Wakil Rektor (Warek I, II, III), kembalikan matriks kewenangan resmi Tabel 1 Kolom 3 / Kolom 7
  const rektoratSop = getRektoratOfficialSopProfile(currentUser);
  if (rektoratSop) {
    const authorizedTemplates = getAuthorizedTemplates(currentUser);
    const officialSigner = {
      id: rektoratSop.subRoleKey === 'REKTOR' ? 1 : rektoratSop.subRoleKey === 'WAREK_1' ? 2 : rektoratSop.subRoleKey === 'WAREK_2' ? 3 : 4,
      nama: rektoratSop.officialName.split(',')[0].trim(),
      gelar: rektoratSop.officialName.includes(',') ? rektoratSop.officialName.split(',').slice(1).join(',').trim() : '',
      nama_gelar: rektoratSop.officialName,
      jabatan: rektoratSop.officialTitle,
      kode_unit: 'UN58',
      nip: rektoratSop.officialNip,
      role_penandatangan: rektoratSop.canonicalRole,
      scope: 'UNIVERSITAS'
    };

    // Map kode_jenis_naskah unik dari daftar template yang berwenang (23 untuk Rektor, 16 untuk Wakil Rektor)
    const seenCodes = new Set();
    const types = [];

    authorizedTemplates.forEach((tpl) => {
      const normalizedCode =
        tpl.code === 'SURAT_TUGAS_LEMBAR' || tpl.code === 'SURAT_TUGAS_KOLOM'
          ? 'SURAT_TUGAS'
          : tpl.code === 'SURAT_UNDANGAN_LEMBAR' || tpl.code === 'SURAT_UNDANGAN_KARTU'
          ? 'SURAT_UNDANGAN'
          : tpl.code;

      if (!seenCodes.has(normalizedCode)) {
        seenCodes.add(normalizedCode);
        types.push({
          kode_jenis_naskah: normalizedCode,
          nama_jenis_naskah: tpl.baseLabel,
          allowed_roles: [rektoratSop.canonicalRole],
          can_choose_signatory: false,
          catatan_kewenangan: `${tpl.description || tpl.baseLabel} (${rektoratSop.sopLegalReference})`,
          badge_keterangan: `Kewenangan Penandatanganan Sesuai Tabel 1: ${rektoratSop.officialTitle} (${authorizedTemplates.length} Format SOP)`,
          workflow_preview: [`Pejabat Penandatangan: ${rektoratSop.officialTitle} (${rektoratSop.officialName})`],
          available_signatories: [officialSigner],
          default_signatory_id: officialSigner.id,
          default_signatory: officialSigner
        });
      }
    });

    return {
      is_drafter_only: false,
      user_scope: 'UNIVERSITAS',
      total_allowed: authorizedTemplates.length,
      types
    };
  }

  // Jika pengguna adalah Dosen Biasa (Tanpa Jabatan Struktural / Tugas Tambahan), sediakan 8 Template Utama + 2 Template Kondisional (2 Kategori Akses/Fungsi)
  if (normalizeUserRole(currentUser) === 'DOSEN_NON_JABATAN') {
    const unitCode = (currentUser?.unit_kerja_id || currentUser?.kode_unit || 'UN58.13').toUpperCase();
    const unitName = currentUser?.unit_kerja_nama || 'Fakultas Teknik';
    const dosenName = currentUser?.nama_lengkap || currentUser?.name || 'Dr. Aris Martono, S.T., M.Kom.';
    const dosenNip = currentUser?.nip || '198805212015041002';
    const dosenJabatan = currentUser?.roleLabel || `Dosen ${unitName}`;

    const dosenSelfSigner = {
      id: `dosen-self-${currentUser?.id || '01'}`,
      nama: dosenName.split(',')[0].trim(),
      gelar: dosenName.includes(',') ? dosenName.split(',').slice(1).join(',').trim() : '',
      nama_gelar: dosenName,
      jabatan: `${dosenJabatan} (TTD Mandiri Dosen)`,
      kode_unit: unitCode,
      nip: dosenNip,
      role_penandatangan: 'DOSEN_MANDIRI',
      scope: 'FAKULTAS_JURUSAN'
    };

    // Resolusi Pejabat Berwenang berbasis Single Source of Truth (SSOT) Manajemen Pengguna Super Admin
    const allOfficials = getAllOfficialsWithUserMapping(availableUsers);

    // Dapatkan kode unit fakultas induk jika dosen bertugas di jurusan (misal UN58.13.1 -> UN58.13)
    const unitCodeStr = String(unitCode || '').toUpperCase();
    const unitNameStr = String(currentUser?.unit_kerja_nama || currentUser?.unit || '').toLowerCase();
    const isPasca =
      unitCodeStr.includes('17') ||
      unitCodeStr.startsWith('UN58.17') ||
      unitNameStr.includes('pascasarjana');

    let facultyCode = unitCodeStr.startsWith('UN58.') 
      ? unitCodeStr.split('.').slice(0, 2).join('.') 
      : unitCodeStr;
    if (isPasca) {
      facultyCode = 'UN58.17';
    }

    // Nama fakultas / unit kerja untuk label fallback jika belum terdaftar
    const facultyName = isPasca
      ? 'Program Pascasarjana'
      : facultyCode === 'UN58.10'
      ? 'Fakultas Keguruan dan Ilmu Pendidikan'
      : facultyCode === 'UN58.11'
      ? 'Fakultas Ekonomi dan Bisnis'
      : facultyCode === 'UN58.12'
      ? 'Fakultas Pertanian'
      : facultyCode === 'UN58.13'
      ? 'Fakultas Teknik'
      : facultyCode === 'UN58.14'
      ? 'Fakultas Ilmu Sosial dan Ilmu Politik'
      : facultyCode === 'UN58.15'
      ? 'Fakultas Ilmu Kesehatan'
      : facultyCode === 'UN58.16'
      ? 'Fakultas Agama Islam'
      : 'Fakultas';

    // 1. Resolusi Ketua Jurusan (Kajur) atau Koordinator Program Studi (Koorprodi) dari SSOT
    const kajurOfficial = allOfficials.find((o) => {
      const oUnit = (o.kode_unit || '').toUpperCase();
      const oJab = (o.jabatan || '').toLowerCase();
      if (isPasca) {
        return (
          (oUnit === unitCodeStr || oUnit.startsWith(unitCodeStr) || unitCodeStr.startsWith(oUnit) || oUnit === 'UN58.17') &&
          (oJab.includes('koordinator') || oJab.includes('koorprodi') || oJab.includes('kaprodi') || oJab.includes('program studi'))
        );
      }
      return (
        (oUnit === unitCodeStr || oUnit.startsWith(unitCodeStr) || unitCodeStr.startsWith(oUnit)) &&
        (oJab.includes('ketua jurusan') || oJab.includes('kajur') || oJab.includes('kaprodi') || oJab.includes('koordinator'))
      );
    });

    const kajurSignatory = kajurOfficial
      ? {
          id: kajurOfficial.id || kajurOfficial.user_id,
          nama: kajurOfficial.nama,
          gelar: kajurOfficial.gelar,
          nama_gelar: kajurOfficial.nama_gelar || kajurOfficial.nama,
          jabatan: kajurOfficial.jabatan,
          kode_unit: kajurOfficial.kode_unit,
          nip: kajurOfficial.nip,
          role_penandatangan: 'KETUA_JURUSAN',
          display_role_label: isPasca ? 'Koordinator Program Studi (Koorprodi)' : 'Ketua Jurusan (Kajur)',
          nama_opsi: `${isPasca ? 'Koordinator Program Studi (Koorprodi)' : 'Ketua Jurusan (Kajur)'}: ${kajurOfficial.nama_gelar || kajurOfficial.nama} (Tingkat Jurusan/Prodi)`,
          scope: isPasca ? 'PRODI' : 'JURUSAN'
        }
      : null;

    // 2. Resolusi Wakil Dekan 1 (Akademik & Kemahasiswaan) atau Wakil Direktur Pascasarjana dari SSOT
    const wadek1Official = allOfficials.find((o) => {
      const oUnit = (o.kode_unit || '').toUpperCase();
      const oJab = (o.jabatan || '').toLowerCase();
      if (isPasca) {
        return (
          (oUnit === 'UN58.17' || oUnit.startsWith('UN58.17')) &&
          (oJab.includes('wakil direktur') || oJab.includes('wadir'))
        );
      }
      return (
        (oUnit === facultyCode || oUnit === unitCodeStr) &&
        (oJab.includes('wakil dekan') || oJab.includes('wadek')) &&
        (oJab.includes('akademik') || oJab.includes('kemahasiswaan') || oJab.includes(' 1') || oJab.includes(' i ') || oJab.endsWith(' i') || oJab.endsWith(' 1')) &&
        !oJab.includes('keuangan') && !oJab.includes('umum')
      );
    });

    const wadek1Signatory = wadek1Official
      ? {
          id: wadek1Official.id || wadek1Official.user_id,
          nama: wadek1Official.nama,
          gelar: wadek1Official.gelar,
          nama_gelar: wadek1Official.nama_gelar || wadek1Official.nama,
          jabatan: wadek1Official.jabatan,
          kode_unit: wadek1Official.kode_unit,
          nip: wadek1Official.nip,
          role_penandatangan: 'WAKIL_DEKAN_1',
          display_role_label: isPasca ? 'Wakil Direktur Pascasarjana' : 'Wakil Dekan Bidang Akademik & Kemahasiswaan (Wadek I)',
          nama_opsi: `${isPasca ? 'Wakil Direktur Pascasarjana' : 'Wakil Dekan Bidang Akademik & Kemahasiswaan (Wadek I)'}: ${wadek1Official.nama_gelar || wadek1Official.nama}`,
          format_an: isPasca 
            ? 'a.n. Direktur,\nWakil Direktur Pascasarjana' 
            : 'a.n. Dekan,\nWakil Dekan Bidang Akademik dan Kemahasiswaan',
          scope: isPasca ? 'PASCASARJANA' : 'FAKULTAS'
        }
      : null;

    // 3. Resolusi Wakil Dekan 2 (Keuangan & Umum) atau Wakil Direktur II dari SSOT
    const wadek2Official = allOfficials.find((o) => {
      const oUnit = (o.kode_unit || '').toUpperCase();
      const oJab = (o.jabatan || '').toLowerCase();
      if (isPasca) {
        return (
          (oUnit === 'UN58.17' || oUnit.startsWith('UN58.17')) &&
          (oJab.includes('wakil direktur') || oJab.includes('wadir')) &&
          (oJab.includes('keuangan') || oJab.includes('umum') || oJab.includes(' 2') || oJab.includes(' ii ') || oJab.endsWith(' ii') || oJab.endsWith(' 2'))
        );
      }
      return (
        (oUnit === facultyCode || oUnit === unitCodeStr) &&
        (oJab.includes('wakil dekan') || oJab.includes('wadek')) &&
        (oJab.includes('keuangan') || oJab.includes('umum') || oJab.includes('perencanaan') || oJab.includes(' 2') || oJab.includes(' ii ') || oJab.endsWith(' ii') || oJab.endsWith(' 2')) &&
        !oJab.includes('akademik')
      );
    });

    const wadek2Signatory = wadek2Official
      ? {
          id: wadek2Official.id || wadek2Official.user_id,
          nama: wadek2Official.nama,
          gelar: wadek2Official.gelar,
          nama_gelar: wadek2Official.nama_gelar || wadek2Official.nama,
          jabatan: wadek2Official.jabatan,
          kode_unit: wadek2Official.kode_unit,
          nip: wadek2Official.nip,
          role_penandatangan: 'WAKIL_DEKAN_2',
          display_role_label: isPasca ? 'Wakil Direktur Bidang Keuangan & Umum' : 'Wakil Dekan Bidang Keuangan & Umum (Wadek II)',
          nama_opsi: `${isPasca ? 'Wakil Direktur Bidang Keuangan & Umum' : 'Wakil Dekan Bidang Keuangan & Umum (Wadek II)'}: ${wadek2Official.nama_gelar || wadek2Official.nama}`,
          format_an: isPasca 
            ? 'a.n. Direktur,\nWakil Direktur Bidang Umum dan Keuangan' 
            : 'a.n. Dekan,\nWakil Dekan Bidang Keuangan dan Umum',
          scope: isPasca ? 'PASCASARJANA' : 'FAKULTAS'
        }
      : null;

    // 4. Resolusi Dekan Fakultas atau Direktur Pascasarjana dari SSOT
    const dekanOfficial = allOfficials.find((o) => {
      const oUnit = (o.kode_unit || '').toUpperCase();
      const oJab = (o.jabatan || '').toLowerCase();
      if (isPasca) {
        return (oUnit === 'UN58.17' || oUnit.startsWith('UN58.17')) && oJab.includes('direktur') && !oJab.includes('wakil') && !oJab.includes('wadir');
      }
      return (oUnit === facultyCode || oUnit === unitCodeStr) && oJab.includes('dekan') && !oJab.includes('wakil') && !oJab.includes('wadek');
    });

    const dekanSignatory = dekanOfficial
      ? {
          id: dekanOfficial.id || dekanOfficial.user_id,
          nama: dekanOfficial.nama,
          gelar: dekanOfficial.gelar,
          nama_gelar: dekanOfficial.nama_gelar || dekanOfficial.nama,
          jabatan: dekanOfficial.jabatan,
          kode_unit: dekanOfficial.kode_unit,
          nip: dekanOfficial.nip,
          role_penandatangan: 'DEKAN',
          display_role_label: isPasca ? 'Direktur Program Pascasarjana' : 'Dekan Fakultas',
          nama_opsi: `${isPasca ? 'Direktur Program Pascasarjana' : 'Dekan Fakultas'}: ${dekanOfficial.nama_gelar || dekanOfficial.nama} (Pimpinan Satuan Kerja)`,
          format_an: dekanOfficial.jabatan,
          scope: isPasca ? 'PASCASARJANA' : 'FAKULTAS'
        }
      : null;

    // 5. Resolusi Rektor (Tingkat Universitas) dari SSOT
    const rektorOfficial = allOfficials.find((o) => {
      const oJab = (o.jabatan || '').toLowerCase();
      return oJab.includes('rektor') && !oJab.includes('wakil') && !oJab.includes('warek');
    });

    const rektorSignatory = rektorOfficial
      ? {
          id: rektorOfficial.id || rektorOfficial.user_id,
          nama: rektorOfficial.nama,
          gelar: rektorOfficial.gelar,
          nama_gelar: rektorOfficial.nama_gelar || rektorOfficial.nama,
          jabatan: rektorOfficial.jabatan,
          kode_unit: rektorOfficial.kode_unit,
          nip: rektorOfficial.nip,
          role_penandatangan: 'REKTOR',
          display_role_label: 'Rektor Universitas Siliwangi',
          nama_opsi: `Rektor Universitas Siliwangi: ${rektorOfficial.nama_gelar || rektorOfficial.nama} (Tingkat Universitas)`,
          format_an: rektorOfficial.jabatan,
          scope: 'UNIVERSITAS'
        }
      : null;

    // Struktur Penandatangan Naskah Mandiri (Default: Diri Sendiri, Opsi: Pejabat Terkait yang AKTIF di SSOT)
    const mandiriSignatories = [
      {
        ...dosenSelfSigner,
        display_role_label: 'Dosen Pembuat (Mandiri)',
        nama_opsi: `Diri Sendiri (Dosen Pembuat) — ${dosenName}`
      },
      kajurSignatory ? {
        ...kajurSignatory,
        nama_opsi: `${kajurSignatory.display_role_label}: ${kajurSignatory.nama_gelar} (Pejabat Terkait / Atasan Langsung)`
      } : null,
      dekanSignatory ? {
        ...dekanSignatory,
        nama_opsi: `${dekanSignatory.display_role_label}: ${dekanSignatory.nama_gelar} (Pimpinan Satuan Kerja Induk)`
      } : null
    ].filter(Boolean);

    // Struktur Penandatangan Naskah Konsep / Draf Usulan (HANYA pejabat yang BENAR-BENAR TERDAFTAR di SSOT)
    const pimpinanSignatories = [
      kajurSignatory,
      wadek1Signatory,
      wadek2Signatory,
      dekanSignatory,
      rektorSignatory
    ].filter(Boolean);

    const defaultPimpinan = dekanSignatory || kajurSignatory || pimpinanSignatories[0] || null;

    const lecturerTypes = [
      // 1. Nota Dinas
      {
        kode_jenis_naskah: 'NOTA_DINAS',
        nama_jenis_naskah: 'Nota Dinas',
        is_mandiri: true,
        allowed_roles: ['DOSEN_MANDIRI', 'KETUA_JURUSAN', 'DEKAN'],
        can_choose_signatory: true,
        catatan_kewenangan: 'Digunakan dosen untuk menyampaikan usulan, laporan singkat, atau komunikasi internal kepada atasan langsung (Kajur/Koorprodi atau Dekan/Direktur) atau ditandatangani mandiri.',
        badge_keterangan: 'Naskah Mandiri: TTD Dosen atau Pejabat Terkait (Pasal 11)',
        workflow_preview: [`Pembuat & Penandatangan: ${dosenName} (${dosenJabatan})`],
        available_signatories: mandiriSignatories,
        default_signatory_id: dosenSelfSigner.id,
        default_signatory: mandiriSignatories[0]
      },
      // 2. Surat Pernyataan
      {
        kode_jenis_naskah: 'SURAT_PERNYATAAN',
        nama_jenis_naskah: 'Surat Pernyataan',
        is_mandiri: true,
        allowed_roles: ['DOSEN_MANDIRI', 'KETUA_JURUSAN', 'DEKAN'],
        can_choose_signatory: true,
        catatan_kewenangan: 'Digunakan dosen untuk menyatakan kebenaran suatu hal pribadi kedinasan beserta pertanggungjawabannya atau diketahui oleh pejabat terkait.',
        badge_keterangan: 'Naskah Mandiri: TTD Dosen atau Pejabat Terkait (Pasal 20)',
        workflow_preview: [`Pembuat & Penandatangan: ${dosenName} (${dosenJabatan})`],
        available_signatories: mandiriSignatories,
        default_signatory_id: dosenSelfSigner.id,
        default_signatory: mandiriSignatories[0]
      },
      // 3. Laporan
      {
        kode_jenis_naskah: 'LAPORAN',
        nama_jenis_naskah: 'Laporan',
        is_mandiri: true,
        allowed_roles: ['DOSEN_MANDIRI', 'KETUA_JURUSAN', 'DEKAN'],
        can_choose_signatory: true,
        catatan_kewenangan: 'Digunakan dosen untuk pertanggungjawaban pelaksanaan kegiatan tridharma/tugas kedinasan secara mandiri atau disahkan atasan.',
        badge_keterangan: 'Naskah Mandiri: TTD Dosen atau Pejabat Terkait (Pasal 26)',
        workflow_preview: [`Pembuat & Penandatangan: ${dosenName} (${dosenJabatan})`],
        available_signatories: mandiriSignatories,
        default_signatory_id: dosenSelfSigner.id,
        default_signatory: mandiriSignatories[0]
      },
      // 4. Telaah Staf
      {
        kode_jenis_naskah: 'TELAAH_STAF',
        nama_jenis_naskah: 'Telaah Staf',
        is_mandiri: true,
        allowed_roles: ['DOSEN_MANDIRI', 'KETUA_JURUSAN', 'DEKAN'],
        can_choose_signatory: true,
        catatan_kewenangan: 'Digunakan dosen untuk menyampaikan analisis singkat mengenai suatu persoalan akademis/kedinasan beserta rekomendasi kepada pimpinan.',
        badge_keterangan: 'Naskah Mandiri: TTD Dosen atau Pejabat Terkait (Pasal 27)',
        workflow_preview: [`Pembuat & Penandatangan: ${dosenName} (${dosenJabatan})`],
        available_signatories: mandiriSignatories,
        default_signatory_id: dosenSelfSigner.id,
        default_signatory: mandiriSignatories[0]
      },
      // 5. Berita Acara
      {
        kode_jenis_naskah: 'BERITA_ACARA',
        nama_jenis_naskah: 'Berita Acara',
        is_mandiri: true,
        allowed_roles: ['DOSEN_MANDIRI', 'KETUA_JURUSAN', 'DEKAN'],
        can_choose_signatory: true,
        catatan_kewenangan: 'Digunakan saat dosen terlibat dalam pelaksanaan suatu kejadian atau kegiatan kedinasan bersama para pihak atau disahkan pimpinan.',
        badge_keterangan: 'Naskah Mandiri: Dosen Pelaksana / Pihak Terkait (Pasal 18)',
        workflow_preview: [`Pihak Pelaksana / Penguji: ${dosenName}`],
        available_signatories: mandiriSignatories,
        default_signatory_id: dosenSelfSigner.id,
        default_signatory: mandiriSignatories[0]
      },
      // 6. Notula
      {
        kode_jenis_naskah: 'NOTULA',
        nama_jenis_naskah: 'Notula Rapat',
        is_mandiri: true,
        allowed_roles: ['DOSEN_MANDIRI', 'KETUA_JURUSAN', 'DEKAN'],
        can_choose_signatory: true,
        catatan_kewenangan: 'Digunakan jika dosen bertindak sebagai pencatat/notulis rapat akademik atau kedinasan yang dapat disahkan pimpinan.',
        badge_keterangan: 'Naskah Mandiri: Dosen sebagai Notulis Rapat (Pasal 25)',
        workflow_preview: [`Notulis / Pencatat Rapat: ${dosenName}`],
        available_signatories: mandiriSignatories,
        default_signatory_id: dosenSelfSigner.id,
        default_signatory: mandiriSignatories[0]
      },
      // 7. ST (Lembar)
      {
        kode_jenis_naskah: 'SURAT_TUGAS_LEMBAR',
        nama_jenis_naskah: 'ST (Lembar)',
        is_mandiri: false,
        allowed_roles: ['KETUA_JURUSAN', 'WAKIL_DEKAN_1', 'WAKIL_DEKAN_2', 'DEKAN', 'REKTOR'],
        can_choose_signatory: pimpinanSignatories.length > 0,
        catatan_kewenangan: 'Digunakan dosen untuk menyusun draf usulan penugasan perorangan (pemateri seminar, riset, pengabdian) yang diajukan ke pimpinan.',
        badge_keterangan: 'Draf Usulan: Diajukan untuk TTD Pimpinan (Pasal 9)',
        workflow_preview: [
          `Pembuat Konsep: ${dosenName}`,
          'Paraf Berjenjang',
          defaultPimpinan ? `TTE Pimpinan: ${defaultPimpinan.jabatan}` : 'Menunggu Penetapan Pejabat'
        ],
        available_signatories: pimpinanSignatories,
        default_signatory_id: defaultPimpinan ? defaultPimpinan.id : '',
        default_signatory: defaultPimpinan || null
      },
      // 8. ST (Kolom)
      {
        kode_jenis_naskah: 'SURAT_TUGAS_KOLOM',
        nama_jenis_naskah: 'ST (Kolom)',
        is_mandiri: false,
        allowed_roles: ['KETUA_JURUSAN', 'WAKIL_DEKAN_1', 'WAKIL_DEKAN_2', 'DEKAN', 'REKTOR'],
        can_choose_signatory: pimpinanSignatories.length > 0,
        catatan_kewenangan: 'Digunakan dosen untuk menyusun draf usulan penugasan tim/kolektif untuk diajukan kepada pimpinan berwenang.',
        badge_keterangan: 'Draf Usulan: Diajukan untuk TTD Pimpinan (Pasal 9)',
        workflow_preview: [
          `Pembuat Konsep: ${dosenName}`,
          'Paraf Berjenjang',
          defaultPimpinan ? `TTE Pimpinan: ${defaultPimpinan.jabatan}` : 'Menunggu Penetapan Pejabat'
        ],
        available_signatories: pimpinanSignatories,
        default_signatory_id: defaultPimpinan ? defaultPimpinan.id : '',
        default_signatory: defaultPimpinan || null
      },
      // 9. Surat Dinas
      {
        kode_jenis_naskah: 'SURAT_DINAS',
        nama_jenis_naskah: 'Surat Dinas',
        is_mandiri: false,
        allowed_roles: ['KETUA_JURUSAN', 'WAKIL_DEKAN_1', 'WAKIL_DEKAN_2', 'DEKAN', 'REKTOR'],
        can_choose_signatory: pimpinanSignatories.length > 0,
        catatan_kewenangan: 'Digunakan dosen untuk menyusun draf surat korespondensi resmi keluar instansi atau antar-unit kerja.',
        badge_keterangan: 'Draf Usulan: Diajukan untuk TTD Pimpinan (Pasal 12)',
        workflow_preview: [
          `Pembuat Konsep: ${dosenName}`,
          'Paraf Berjenjang',
          defaultPimpinan ? `TTE Pimpinan: ${defaultPimpinan.jabatan}` : 'Menunggu Penetapan Pejabat'
        ],
        available_signatories: pimpinanSignatories,
        default_signatory_id: defaultPimpinan ? defaultPimpinan.id : '',
        default_signatory: defaultPimpinan || null
      },
      // 10. Surat Keterangan
      {
        kode_jenis_naskah: 'SURAT_KETERANGAN',
        nama_jenis_naskah: 'Surat Keterangan',
        is_mandiri: false,
        allowed_roles: ['KETUA_JURUSAN', 'WAKIL_DEKAN_1', 'WAKIL_DEKAN_2', 'DEKAN', 'REKTOR'],
        can_choose_signatory: pimpinanSignatories.length > 0,
        catatan_kewenangan: 'Digunakan dosen untuk menyusun draf pengajuan penerbitan surat keterangan kedinasan/akademik dari pimpinan unit kerja.',
        badge_keterangan: 'Draf Usulan: Diajukan untuk TTD Pimpinan (Pasal 19)',
        workflow_preview: [
          `Pembuat Konsep: ${dosenName}`,
          'Paraf Berjenjang',
          defaultPimpinan ? `TTE Pimpinan: ${defaultPimpinan.jabatan}` : 'Menunggu Penetapan Pejabat'
        ],
        available_signatories: pimpinanSignatories,
        default_signatory_id: defaultPimpinan ? defaultPimpinan.id : '',
        default_signatory: defaultPimpinan || null
      },
      // 11. Surat Pengantar
      {
        kode_jenis_naskah: 'SURAT_PENGANTAR',
        nama_jenis_naskah: 'Surat Pengantar',
        is_mandiri: false,
        allowed_roles: ['KETUA_JURUSAN', 'WAKIL_DEKAN_1', 'WAKIL_DEKAN_2', 'DEKAN', 'REKTOR'],
        can_choose_signatory: pimpinanSignatories.length > 0,
        catatan_kewenangan: 'Digunakan dosen untuk menyusun draf pengantar pengiriman berkas atau dokumen dinas kepada pimpinan.',
        badge_keterangan: 'Draf Usulan: Diajukan untuk TTD Pimpinan (Pasal 21)',
        workflow_preview: [
          `Pembuat Konsep: ${dosenName}`,
          'Paraf Berjenjang',
          defaultPimpinan ? `TTE Pimpinan: ${defaultPimpinan.jabatan}` : 'Menunggu Penetapan Pejabat'
        ],
        available_signatories: pimpinanSignatories,
        default_signatory_id: defaultPimpinan ? defaultPimpinan.id : '',
        default_signatory: defaultPimpinan || null
      }
    ];

    return {
      is_drafter_only: false,
      is_lecturer_sop_mode: true,
      user_scope: 'FAKULTAS_JURUSAN',
      user_unit_code: unitCode,
      user_unit_name: unitName,
      unit_pejabat_options: [dosenSelfSigner, ...pimpinanSignatories],
      types: lecturerTypes
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);
  if (timeoutId.unref) timeoutId.unref();

  const userUnit = currentUser?.unit_kerja_id || currentUser?.kode_unit || 'UN58.13.1';
  const userRole = currentUser?.role || 'DOSEN';

  try {
    const queryParams = new URLSearchParams({
      kode_unit: userUnit,
      role: userRole
    });

    const response = await fetch(`${API_BASE}/naskah/available-types?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'x-unit-code': userUnit,
        'x-user-role': userRole,
        'x-user-id': String(currentUser?.id || 201)
      },
      signal: controller.signal
    });

    if (response.ok) {
      const result = await response.json();
      if (result.data && Array.isArray(result.data.types) && result.data.types.length > 0) {
        return result.data;
      }
    }
  } catch (err) {
    console.warn('[LETTER-SERVICE] Backend available-types offline, menggunakan fallback Tabel 1:', err.message);
  } finally {
    clearTimeout(timeoutId);
  }

  // Fallback offline generator
  const isJurusan = userUnit.startsWith('UN58.13') || userUnit === 'FT';
  const dekan = {
    id: 14,
    nama: 'Dr. Nurul Hiron',
    gelar: 'S.T., M.Eng.',
    nama_gelar: 'Dr. Nurul Hiron, S.T., M.Eng.',
    jabatan: 'Dekan Fakultas Teknik',
    kode_unit: 'UN58.13',
    role_penandatangan: 'DEKAN',
    scope: 'FAKULTAS'
  };
  const kajur = {
    id: 201,
    nama: 'Fredi Ganda Putra',
    gelar: 'M.Kom.',
    nama_gelar: 'Fredi Ganda Putra, M.Kom.',
    jabatan: 'Ketua Jurusan Informatika',
    kode_unit: 'UN58.13.1',
    role_penandatangan: 'KETUA_JURUSAN',
    scope: 'JURUSAN'
  };

  const types = FALLBACK_SCOPED_LETTER_TYPES.map((t) => {
    const isKajurAllowed = t.allowed_roles.includes('KETUA_JURUSAN');
    const signatories = [];
    if (isKajurAllowed) signatories.push(kajur);
    signatories.push(dekan);

    return {
      ...t,
      available_signatories: signatories,
      default_signatory_id: isKajurAllowed ? kajur.id : dekan.id,
      default_signatory: isKajurAllowed ? kajur : dekan
    };
  });

  return {
    is_drafter_only: true,
    user_scope: 'FAKULTAS',
    total_allowed: types.length,
    types
  };
};

/**
 * Simpan Draf Naskah Dinas Baru dengan Validasi Tabel 1 (POST /api/surat/draft)
 * Status: 'DRAFT_MENUNGGU_PARAF', nomor_surat: null
 */
export const saveDraftLetter = async (payload, currentUser = null) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);
  if (timeoutId.unref) timeoutId.unref();

  const userUnit = currentUser?.unit_kerja_id || currentUser?.kode_unit || payload.kode_unit_kerja || 'UN58.13.1';
  const userRole = currentUser?.role || 'DOSEN';

  try {
    const response = await fetch(`${API_BASE}/surat/draft`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-unit-code': userUnit,
        'x-user-role': userRole,
        'x-user-id': String(currentUser?.id || 201),
        'x-user-nama': currentUser?.nama_lengkap || currentUser?.name || 'Dr. Aris Martono, M.Kom.'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Gagal menyimpan draf surat');
    }
    return result;
  } catch (err) {
    if (err.message && err.message.includes('tidak berwenang') || err.message.includes('Unauthorized')) {
      throw err;
    }
    console.warn('[LETTER-SERVICE] Backend draft offline/fallback:', err.message);
  } finally {
    clearTimeout(timeoutId);
  }

  // Fallback offline simulator
  return {
    status: 201,
    success: true,
    message: 'Draf naskah berhasil disimpan dengan status DRAFT_MENUNGGU_PARAF (Nomor resmi ditunda hingga TTE final).',
    data: {
      id_surat: Date.now(),
      nomor_surat: null,
      status_progres: 'DRAFT_MENUNGGU_PARAF',
      perihal: payload.perihal,
      kode_jenis_naskah: payload.kode_jenis_naskah,
      unit_kerja_id: userUnit,
      created_at: new Date().toISOString()
    }
  };
};

export default {
  fetchKlasifikasiArsip,
  saveOutgoingLetter,
  saveInboundLetter,
  fetchPejabatByUnit,
  fetchAvailableLetterTypes,
  saveDraftLetter,
  DEKAN_ALLOWED_TYPES: FALLBACK_SCOPED_LETTER_TYPES
};


