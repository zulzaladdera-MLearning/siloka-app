/**
 * Klien Layanan Persuratan & Klasifikasi Arsip (SILOKA UNSIL)
 * Menghubungkan antarmuka Frontend dengan API Backend:
 * - GET /api/klasifikasi-arsip (Daftar dinamis kode klasifikasi)
 * - POST /api/surat-keluar (Penerbitan nomor surat keluar otomatis terproteksi)
 */

import { getPejabatByUnit } from '../utils/pejabatHelper.js';
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
export const fetchAvailableLetterTypes = async (currentUser = null) => {
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

    const unitPejabatRaw = getPejabatByUnit(unitCode, currentUser);
    const leaderSigners = unitPejabatRaw.map((p) => ({
      id: p.id,
      nama: p.nama,
      gelar: p.gelar,
      nama_gelar: `${p.nama}, ${p.gelar}`,
      jabatan: p.jabatan,
      kode_unit: p.kode_unit,
      nip: p.nip,
      role_penandatangan: p.jabatan.toLowerCase().includes('dekan') ? 'DEKAN' : 'PEJABAT_FAKULTAS',
      scope: 'FAKULTAS_JURUSAN'
    }));

    const kajurSigner = {
      id: `kajur-${unitCode}`,
      nama: 'Dr. Ir. H. Budi Santoso',
      gelar: 'M.T.',
      nama_gelar: 'Dr. Ir. H. Budi Santoso, M.T.',
      jabatan: `Ketua Jurusan pada ${unitName}`,
      kode_unit: unitCode,
      nip: '197504122001121002',
      role_penandatangan: 'KETUA_JURUSAN',
      scope: 'FAKULTAS_JURUSAN'
    };

    const rektorSigner = {
      id: 'rektor-unsil',
      nama: 'Prof. Dr. Eng. Ir. Aripin',
      gelar: 'IPU., ASEAN Eng.',
      nama_gelar: 'Prof. Dr. Eng. Ir. Aripin, IPU., ASEAN Eng.',
      jabatan: 'Rektor Universitas Siliwangi',
      kode_unit: 'UN58',
      nip: '196708161996031001',
      role_penandatangan: 'REKTOR',
      scope: 'UNIVERSITAS'
    };

    const pimpinanOptions = [...leaderSigners, kajurSigner, rektorSigner];
    const defaultPimpinan = pimpinanOptions[0] || kajurSigner;

    const lecturerTypes = [
      // 1. Nota Dinas
      {
        kode_jenis_naskah: 'NOTA_DINAS',
        nama_jenis_naskah: 'Nota Dinas',
        allowed_roles: ['DOSEN_MANDIRI'],
        can_choose_signatory: false,
        catatan_kewenangan: 'Kategori 1 (Mandiri — Pasal 11): Digunakan dosen untuk menyampaikan usulan, laporan singkat, atau komunikasi internal dari bawahan kepada atasan langsung (Koorprodi, Kajur, atau Dekan).',
        badge_keterangan: 'Kategori 1: Ditandatangani Langsung oleh Dosen (Pasal 11)',
        workflow_preview: [`Pembuat & Penandatangan Langsung: ${dosenName} (${dosenJabatan})`],
        available_signatories: [dosenSelfSigner],
        default_signatory_id: dosenSelfSigner.id,
        default_signatory: dosenSelfSigner
      },
      // 2. Surat Pernyataan
      {
        kode_jenis_naskah: 'SURAT_PERNYATAAN',
        nama_jenis_naskah: 'Surat Pernyataan',
        allowed_roles: ['DOSEN_MANDIRI'],
        can_choose_signatory: false,
        catatan_kewenangan: 'Kategori 1 (Mandiri — Pasal 20): Digunakan dosen untuk menyatakan kebenaran suatu hal pribadi kedinasan beserta pertanggungjawabannya.',
        badge_keterangan: 'Kategori 1: Ditandatangani Langsung oleh Dosen (Pasal 20)',
        workflow_preview: [`Pembuat & Penandatangan Langsung: ${dosenName} (${dosenJabatan})`],
        available_signatories: [dosenSelfSigner],
        default_signatory_id: dosenSelfSigner.id,
        default_signatory: dosenSelfSigner
      },
      // 3. Laporan
      {
        kode_jenis_naskah: 'LAPORAN',
        nama_jenis_naskah: 'Laporan',
        allowed_roles: ['DOSEN_MANDIRI'],
        can_choose_signatory: false,
        catatan_kewenangan: 'Kategori 1 (Mandiri — Pasal 26): Digunakan dosen untuk memberikan pemberitahuan atau pertanggungjawaban pelaksanaan kegiatan pengajaran, penelitian, pengabdian masyarakat, atau tugas kedinasan.',
        badge_keterangan: 'Kategori 1: Ditandatangani Langsung oleh Dosen (Pasal 26)',
        workflow_preview: [`Pembuat & Penandatangan Langsung: ${dosenName} (${dosenJabatan})`],
        available_signatories: [dosenSelfSigner],
        default_signatory_id: dosenSelfSigner.id,
        default_signatory: dosenSelfSigner
      },
      // 4. Telaah Staf
      {
        kode_jenis_naskah: 'TELAAH_STAF',
        nama_jenis_naskah: 'Telaah Staf',
        allowed_roles: ['DOSEN_MANDIRI'],
        can_choose_signatory: false,
        catatan_kewenangan: 'Kategori 1 (Mandiri — Pasal 27): Digunakan dosen untuk menyampaikan analisis singkat mengenai suatu persoalan akademis/kedinasan beserta usulan solusi/rekomendasi kepada pimpinan.',
        badge_keterangan: 'Kategori 1: Ditandatangani Langsung oleh Dosen (Pasal 27)',
        workflow_preview: [`Pembuat & Penandatangan Langsung: ${dosenName} (${dosenJabatan})`],
        available_signatories: [dosenSelfSigner],
        default_signatory_id: dosenSelfSigner.id,
        default_signatory: dosenSelfSigner
      },
      // 5. Berita Acara
      {
        kode_jenis_naskah: 'BERITA_ACARA',
        nama_jenis_naskah: 'Berita Acara',
        allowed_roles: ['DOSEN_MANDIRI'],
        can_choose_signatory: false,
        catatan_kewenangan: 'Template Kondisional (Pasal 18): Muncul jika dosen terlibat dalam pelaksanaan suatu kejadian atau kegiatan kedinasan bersama para pihak.',
        badge_keterangan: 'Template Kondisional: Dosen Pelaksana Kegiatan Bersama Para Pihak (Pasal 18)',
        workflow_preview: [`Pihak Pelaksana: ${dosenName}`, `Mengetahui Pimpinan: ${defaultPimpinan.jabatan}`],
        available_signatories: [dosenSelfSigner],
        default_signatory_id: dosenSelfSigner.id,
        default_signatory: dosenSelfSigner
      },
      // 6. Notula
      {
        kode_jenis_naskah: 'NOTULA',
        nama_jenis_naskah: 'Notula',
        allowed_roles: ['DOSEN_MANDIRI'],
        can_choose_signatory: false,
        catatan_kewenangan: 'Template Kondisional (Pasal 25): Muncul jika dosen ditunjuk resmi sebagai pencatat/notulis rapat.',
        badge_keterangan: 'Template Kondisional: Dosen sebagai Pencatat/Notulis Rapat (Pasal 25)',
        workflow_preview: [`Notulis / Pencatat Rapat: ${dosenName}`, `Disahkan Pemimpin Rapat: ${defaultPimpinan.jabatan}`],
        available_signatories: [dosenSelfSigner],
        default_signatory_id: dosenSelfSigner.id,
        default_signatory: dosenSelfSigner
      },
      // 7. ST (Lembar)
      {
        kode_jenis_naskah: 'SURAT_TUGAS_LEMBAR',
        nama_jenis_naskah: 'ST (Lembar)',
        allowed_roles: ['KETUA_JURUSAN', 'DEKAN', 'REKTOR'],
        can_choose_signatory: true,
        catatan_kewenangan: 'Kategori 2 (Konsep / Drafting — Pasal 9): Digunakan dosen untuk menyusun draft usulan penugasan kegiatan perorangan (pemateri seminar, workshop, pengabdian masyarakat, atau penelitian) untuk diajukan kepada Ketua Jurusan / Dekan / Rektor.',
        badge_keterangan: 'Kategori 2: Konsep / Drafting — Diajukan untuk TTD Pimpinan (Pasal 9)',
        workflow_preview: [`Pembuat Konsep (Drafter): ${dosenName}`, 'Paraf Berjenjang: Koorprodi / Ketua Jurusan / Wakil Dekan', `TTE Pimpinan: ${defaultPimpinan.jabatan}`],
        available_signatories: pimpinanOptions,
        default_signatory_id: defaultPimpinan.id,
        default_signatory: defaultPimpinan
      },
      // 8. ST (Kolom)
      {
        kode_jenis_naskah: 'SURAT_TUGAS_KOLOM',
        nama_jenis_naskah: 'ST (Kolom)',
        allowed_roles: ['KETUA_JURUSAN', 'DEKAN', 'REKTOR'],
        can_choose_signatory: true,
        catatan_kewenangan: 'Kategori 2 (Konsep / Drafting — Pasal 9): Digunakan dosen untuk menyusun draft usulan penugasan kegiatan tim/kolektif untuk diajukan kepada Ketua Jurusan / Dekan / Rektor.',
        badge_keterangan: 'Kategori 2: Konsep / Drafting — Diajukan untuk TTD Pimpinan (Pasal 9)',
        workflow_preview: [`Pembuat Konsep (Drafter): ${dosenName}`, 'Paraf Berjenjang: Koorprodi / Ketua Jurusan / Wakil Dekan', `TTE Pimpinan: ${defaultPimpinan.jabatan}`],
        available_signatories: pimpinanOptions,
        default_signatory_id: defaultPimpinan.id,
        default_signatory: defaultPimpinan
      },
      // 9. Surat Dinas
      {
        kode_jenis_naskah: 'SURAT_DINAS',
        nama_jenis_naskah: 'Surat Dinas',
        allowed_roles: ['KETUA_JURUSAN', 'DEKAN', 'REKTOR'],
        can_choose_signatory: true,
        catatan_kewenangan: 'Kategori 2 (Konsep / Drafting — Pasal 12): Digunakan dosen untuk menyusun draft surat korespondensi resmi keluar instansi atau antar-unit (permohonan izin observasi riset, kerja sama kegiatan akademik, kunjungan ilmiah).',
        badge_keterangan: 'Kategori 2: Konsep / Drafting — Diajukan untuk TTD Pimpinan (Pasal 12)',
        workflow_preview: [`Pembuat Konsep (Drafter): ${dosenName}`, 'Paraf Berjenjang: Ketua Jurusan / Kasubbag Umum', `TTE Pimpinan: ${defaultPimpinan.jabatan}`],
        available_signatories: pimpinanOptions,
        default_signatory_id: defaultPimpinan.id,
        default_signatory: defaultPimpinan
      },
      // 10. Surat Keterangan
      {
        kode_jenis_naskah: 'SURAT_KETERANGAN',
        nama_jenis_naskah: 'Surat Keterangan',
        allowed_roles: ['KETUA_JURUSAN', 'DEKAN', 'REKTOR'],
        can_choose_signatory: true,
        catatan_kewenangan: 'Kategori 2 (Konsep / Drafting — Pasal 19): Digunakan dosen untuk menyusun draft pengajuan penerbitan surat keterangan resmi kedinasan/akademik dari pimpinan unit kerja.',
        badge_keterangan: 'Kategori 2: Konsep / Drafting — Diajukan untuk TTD Pimpinan (Pasal 19)',
        workflow_preview: [`Pembuat Konsep (Drafter): ${dosenName}`, 'Paraf Berjenjang: Ketua Jurusan / Wakil Dekan', `TTE Pimpinan: ${defaultPimpinan.jabatan}`],
        available_signatories: pimpinanOptions,
        default_signatory_id: defaultPimpinan.id,
        default_signatory: defaultPimpinan
      },
      // 11. Surat Pengantar
      {
        kode_jenis_naskah: 'SURAT_PENGANTAR',
        nama_jenis_naskah: 'Surat Pengantar',
        allowed_roles: ['KETUA_JURUSAN', 'DEKAN', 'REKTOR'],
        can_choose_signatory: true,
        catatan_kewenangan: 'Kategori 2 (Konsep / Drafting — Pasal 21): Digunakan dosen untuk menyusun draft pengantar pengiriman berkas atau dokumen (pengiriman berkas usulan kenaikan pangkat/jabatan fungsional atau laporan akhir penelitian).',
        badge_keterangan: 'Kategori 2: Konsep / Drafting — Diajukan untuk TTD Pimpinan (Pasal 21)',
        workflow_preview: [`Pembuat Konsep (Drafter): ${dosenName}`, 'Paraf Berjenjang: Ketua Jurusan / Kasubbag Umum', `TTE Pimpinan: ${defaultPimpinan.jabatan}`],
        available_signatories: pimpinanOptions,
        default_signatory_id: defaultPimpinan.id,
        default_signatory: defaultPimpinan
      }
    ];

    return {
      is_drafter_only: false,
      is_lecturer_sop_mode: true,
      user_scope: 'FAKULTAS_JURUSAN',
      user_unit_code: unitCode,
      user_unit_name: unitName,
      unit_pejabat_options: [dosenSelfSigner, ...pimpinanOptions],
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


