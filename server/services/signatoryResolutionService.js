/**
 * Service: Signatory Authority Scoping & Resolution Engine (SILOKA UNSIL)
 * Berdasarkan Tabel 1: Matriks Kewenangan Penandatanganan Naskah Dinas
 * (Peraturan Rektor Universitas Siliwangi No. 3 Tahun 2023)
 */

import { query } from '../config/database.js';

/**
 * Pemetaan Kode Unit Satker ke Unit Induk Fakultas & Universitas
 */
const FACULTY_MAPPINGS = {
  'FT': 'UN58.13',
  'UN58.13': 'UN58.13',
  'UN58.13.1': 'UN58.13', // Jurusan Informatika
  'UN58.13.2': 'UN58.13', // Jurusan Teknik Sipil
  'UN58.13.3': 'UN58.13', // Jurusan Teknik Elektro
  'FKIP': 'UN58.10',
  'UN58.10': 'UN58.10',
  'FEB': 'UN58.11',
  'UN58.11': 'UN58.11',
  'FP': 'UN58.12',
  'UN58.12': 'UN58.12',
  'FISIP': 'UN58.14',
  'UN58.14': 'UN58.14',
  'FIK': 'UN58.15',
  'UN58.15': 'UN58.15',
  'FAI': 'UN58.16',
  'UN58.16': 'UN58.16',
  'PASCA': 'UN58.17',
  'UN58.17': 'UN58.17',
  'BKU': 'UN58.6',
  'UN58.6': 'UN58.6',
  'BAKPK': 'UN58.5',
  'UN58.5': 'UN58.5'
};

/**
 * 7 Jenis Naskah Dinas yang Sah Ditandatangani oleh KETUA JURUSAN / KOORPRODI
 */
export const KAJUR_ALLOWED_TYPES = [
  'NOTA_DINAS',
  'SURAT_DINAS',
  'SURAT_UNDANGAN',
  'SURAT_KUASA',
  'SURAT_PERNYATAAN',
  'SURAT_PENGANTAR',
  'PENGUMUMAN'
];

/**
 * 13 Jenis Naskah Dinas yang Sah Ditandatangani oleh DEKAN
 */
export const DEKAN_ALLOWED_TYPES = [
  'POS',
  'SURAT_EDARAN',
  'SURAT_TUGAS',
  'NOTA_DINAS',
  'SURAT_DINAS',
  'SURAT_UNDANGAN',
  'PKS_DN',
  'SURAT_KUASA',
  'BERITA_ACARA',
  'SURAT_KETERANGAN',
  'SURAT_PERNYATAAN',
  'SURAT_PENGANTAR',
  'PENGUMUMAN'
];

/**
 * Dokumen Tingkat Universitas (Dilarang bagi Dosen/Staf Fakultas)
 */
export const UNIVERSITY_EXCLUSIVE_TYPES = [
  'PERATURAN',
  'KEPUTUSAN',
  'INSTRUKSI',
  'SURAT_PERINTAH',
  'MOU'
];

/**
 * Resolusi Pejabat Struktural Atasan Langsung berdasarkan Unit Kerja Pembuat
 * @param {string} userUnitCode - Kode unit kerja pembuat (misal: 'UN58.13.1' atau 'FT')
 */
export const resolveSuperiorOfficials = async (userUnitCode) => {
  const cleanCode = (userUnitCode || 'UN58.13').trim().toUpperCase();
  const facultyCode = FACULTY_MAPPINGS[cleanCode] || (cleanCode.startsWith('UN58.13') ? 'UN58.13' : cleanCode);

  // 1. Cari Dekan & Wakil Dekan Fakultas
  const dekanRes = await query(`
    SELECT id, nip, nama, gelar, nama_gelar, jabatan, kode_unit, 'DEKAN' as role_penandatangan
    FROM master_pejabat
    WHERE UPPER(kode_unit) = $1 AND UPPER(jabatan) LIKE '%DEKAN%' AND UPPER(jabatan) NOT LIKE '%WAKIL%'
      AND (is_aktif = TRUE OR is_active = TRUE)
    LIMIT 1;
  `, [facultyCode]);

  const dekanOfficial = dekanRes.rows[0] || {
    id: 14,
    nip: '197306282000031001',
    nama: 'Dr. Nurul Hiron',
    gelar: 'S.T., M.Eng.',
    nama_gelar: 'Dr. Nurul Hiron, S.T., M.Eng.',
    jabatan: 'Dekan Fakultas Teknik',
    kode_unit: facultyCode,
    role_penandatangan: 'DEKAN'
  };

  // 2. Cari Ketua Jurusan (Dept Level)
  // Cocokkan ke sub-satker spesifik (misal UN58.13.1) atau jurusan di bawah fakultas tersebut
  const kajurRes = await query(`
    SELECT id, nip, nama, gelar, nama_gelar, jabatan, kode_unit, 'KETUA_JURUSAN' as role_penandatangan
    FROM master_pejabat
    WHERE (UPPER(kode_unit) = $1 OR UPPER(kode_unit) LIKE $2)
      AND (UPPER(jabatan) LIKE '%KETUA JURUSAN%' OR UPPER(jabatan) LIKE '%KOORPRODI%')
      AND (is_aktif = TRUE OR is_active = TRUE)
    LIMIT 1;
  `, [cleanCode, `${facultyCode}%`]);

  const kajurOfficial = kajurRes.rows[0] || {
    id: 201,
    nip: '198704152014041002',
    nama: 'Fredi Ganda Putra',
    gelar: 'M.Kom.',
    nama_gelar: 'Fredi Ganda Putra, M.Kom.',
    jabatan: 'Ketua Jurusan Informatika',
    kode_unit: cleanCode.includes('.') ? cleanCode : `${facultyCode}.1`,
    role_penandatangan: 'KETUA_JURUSAN'
  };

  return {
    facultyCode,
    dekan: dekanOfficial,
    ketuaJurusan: kajurOfficial
  };
};

/**
 * 2. Resolusi Jenis Naskah Dinas yang Boleh Dibuat oleh Dosen / Staf Fakultas
 * (GET /api/naskah/available-types)
 * 
 * @param {object} user - Objek session pengguna aktif
 */
export const resolveAvailableLetterTypesForUser = async (user) => {
  const userRole = (user?.role || '').toUpperCase();
  const userUnit = user?.kode_unit_kerja || user?.unit_kerja_id || user?.kode_unit || 'UN58.13';
  const roleLabel = (user?.roleLabel || user?.jabatan || '').toLowerCase();

  const isSuperAdmin = userRole === 'SUPER_ADMIN' || userRole === 'SUPER ADMIN';
  const isPimpinanUniv = userUnit === 'UN58' || userRole === 'PEJABAT' && userUnit === 'UN58';

  // Jika Super Admin atau Rektorat, tampilkan seluruh jenis naskah termasuk instrumen universitas
  if (isSuperAdmin || isPimpinanUniv) {
    const allRes = await query(`
      SELECT DISTINCT kode_jenis_naskah, nama_jenis_naskah, catatan_kewenangan
      FROM tbl_matrix_kewenangan
      WHERE is_allowed = TRUE
      ORDER BY kode_jenis_naskah;
    `);
    return {
      is_drafter_only: false,
      user_scope: 'UNIVERSITAS',
      total_allowed: allRes.rows.length,
      types: allRes.rows
    };
  }

  // Pengguna adalah DOSEN atau STAF Fakultas (Bertindak sebagai Konseptor / Drafter)
  const { dekan, ketuaJurusan, facultyCode } = await resolveSuperiorOfficials(userUnit);

  // Ambil jenis naskah yang sah untuk Dekan dan Ketua Jurusan dari tbl_matrix_kewenangan
  const matrixRes = await query(`
    SELECT kode_jenis_naskah, nama_jenis_naskah, role_penandatangan, catatan_kewenangan
    FROM tbl_matrix_kewenangan
    WHERE role_penandatangan IN ('DEKAN', 'KETUA_JURUSAN')
      AND is_allowed = TRUE
    ORDER BY nama_jenis_naskah ASC;
  `);

  // Kelompokkan per jenis naskah
  const typesMap = new Map();

  for (const row of matrixRes.rows) {
    // Pastikan tidak ada dokumen universitas yang lolos ke konseptor fakultas
    if (UNIVERSITY_EXCLUSIVE_TYPES.includes(row.kode_jenis_naskah)) {
      continue;
    }

    if (!typesMap.has(row.kode_jenis_naskah)) {
      typesMap.set(row.kode_jenis_naskah, {
        kode_jenis_naskah: row.kode_jenis_naskah,
        nama_jenis_naskah: row.nama_jenis_naskah,
        allowed_roles: [],
        available_signatories: [],
        catatan_kewenangan: row.catatan_kewenangan
      });
    }

    const item = typesMap.get(row.kode_jenis_naskah);
    if (!item.allowed_roles.includes(row.role_penandatangan)) {
      item.allowed_roles.push(row.role_penandatangan);
    }
  }

  // Format response dengan signatories aktual dan alur verifikasi
  const scopedTypes = Array.from(typesMap.values()).map((item) => {
    const isKajurAllowed = item.allowed_roles.includes('KETUA_JURUSAN');
    const isDekanAllowed = item.allowed_roles.includes('DEKAN');

    const signatories = [];
    if (isKajurAllowed && ketuaJurusan) {
      signatories.push({
        id: ketuaJurusan.id,
        nama: ketuaJurusan.nama,
        gelar: ketuaJurusan.gelar,
        nama_gelar: ketuaJurusan.nama_gelar,
        jabatan: ketuaJurusan.jabatan,
        kode_unit: ketuaJurusan.kode_unit,
        role_penandatangan: 'KETUA_JURUSAN',
        scope: 'JURUSAN'
      });
    }
    if (isDekanAllowed && dekan) {
      signatories.push({
        id: dekan.id,
        nama: dekan.nama,
        gelar: dekan.gelar,
        nama_gelar: dekan.nama_gelar,
        jabatan: dekan.jabatan,
        kode_unit: dekan.kode_unit,
        role_penandatangan: 'DEKAN',
        scope: 'FAKULTAS'
      });
    }

    // Default: jika Kajur berwenang, default ke Kajur; jika tidak, default ke Dekan
    const defaultSignatory = isKajurAllowed ? signatories[0] : (signatories.find(s => s.role_penandatangan === 'DEKAN') || signatories[0]);
    const canChooseSignatory = signatories.length > 1;

    // Alur verifikasi berjenjang sesuai Peraturan Rektor Pasal 58 & 59
    const workflowSteps = isKajurAllowed
      ? ['Drafter: Anda (Dosen/Staf)', 'TTE Final: Ketua Jurusan']
      : ['Drafter: Anda (Dosen/Staf)', 'Paraf: Ketua Jurusan', 'Paraf: Wakil Dekan', 'TTE Final: Dekan'];

    return {
      kode_jenis_naskah: item.kode_jenis_naskah,
      nama_jenis_naskah: item.nama_jenis_naskah,
      allowed_roles: item.allowed_roles,
      can_choose_signatory: canChooseSignatory,
      default_signatory_id: defaultSignatory?.id || null,
      default_signatory: defaultSignatory,
      available_signatories: signatories,
      catatan_kewenangan: item.catatan_kewenangan,
      badge_keterangan: isKajurAllowed && isDekanAllowed
        ? 'Kewenangan Penandatanganan Sesuai Tabel 1: Ketua Jurusan / Dekan'
        : 'Kewenangan Penandatanganan Sesuai Tabel 1: Dekan',
      workflow_preview: workflowSteps
    };
  });

  return {
    is_drafter_only: true,
    user_scope: 'FAKULTAS',
    faculty_code: facultyCode,
    superiors: {
      dekan,
      ketuaJurusan
    },
    total_allowed: scopedTypes.length,
    types: scopedTypes
  };
};

/**
 * 3. Validasi Integritas Penandatanganan Surat Baru / Draf
 * Memastikan jenis naskah dan penandatangan sah menurut Tabel 1 dan berada dalam yurisdiksi unit pembuat.
 * 
 * @param {object} user - Objek pengguna pembuat
 * @param {string} kodeJenisNaskah - Kode jenis naskah yang dipilih
 * @param {number|string} idPenandatangan - ID pejabat penandatangan yang dipilih
 */
export const validateDraftSubmission = async (user, kodeJenisNaskah, idPenandatangan) => {
  const userUnit = user?.kode_unit_kerja || user?.unit_kerja_id || user?.kode_unit || 'UN58.13';
  const cleanJenis = String(kodeJenisNaskah || '').trim().toUpperCase();
  const signerId = Number(idPenandatangan);

  // 1. Dosen/Staf Fakultas DILARANG KERAS membuat naskah tingkat universitas
  if (UNIVERSITY_EXCLUSIVE_TYPES.includes(cleanJenis)) {
    return {
      isValid: false,
      statusCode: 422,
      error: 'UnauthorizedDocumentType',
      message: `Jenis naskah '${cleanJenis}' merupakan instrumen tingkat universitas dan dilarang diajukan oleh staf/dosen fakultas.`
    };
  }

  // 2. Ambil seluruh jenis naskah dan pejabat yang diizinkan untuk pembuat ini
  const scopedResult = await resolveAvailableLetterTypesForUser(user);
  const targetType = scopedResult.types?.find((t) => t.kode_jenis_naskah === cleanJenis);

  if (!targetType) {
    return {
      isValid: false,
      statusCode: 422,
      error: 'InvalidDocumentTypeForDrafter',
      message: `Jenis naskah '${cleanJenis}' tidak termasuk dalam daftar naskah yang sah diajukan untuk unit Anda sesuai Tabel 1 Peraturan Rektor No. 3 Tahun 2023.`
    };
  }

  // 3. Verifikasi apakah idPenandatangan sah dalam available_signatories
  const isSignerValid = targetType.available_signatories?.some((s) => Number(s.id) === signerId);

  if (!isSignerValid) {
    // Cari detail pejabat yang coba dipilih untuk pesan error yang informatif
    const illegalSignerRes = await query(`SELECT nama_gelar, jabatan, kode_unit FROM master_pejabat WHERE id = $1`, [signerId]);
    const illegalSigner = illegalSignerRes.rows[0];

    return {
      isValid: false,
      statusCode: 422,
      error: 'UnauthorizedSignatoryAssignment',
      message: illegalSigner
        ? `Pejabat '${illegalSigner.nama_gelar}' (${illegalSigner.jabatan} - Unit: ${illegalSigner.kode_unit}) tidak berwenang menandatangani naskah '${cleanJenis}' untuk unit Anda. Penandatangan wajib berada dalam hierarki unit kerja Anda sesuai Tabel 1.`
        : `Pejabat penandatangan (ID: ${idPenandatangan}) tidak sah atau tidak ditemukan.`
    };
  }

  return {
    isValid: true,
    targetType,
    signatory: targetType.available_signatories.find((s) => Number(s.id) === signerId)
  };
};
