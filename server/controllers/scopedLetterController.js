/**
 * Controller: Pengendalian Surat Terkunci RBAC (SILOKA UNSIL)
 * Menerapkan Dynamic Query Scoping berbasis Tupoksi & Klasifikasi Keamanan
 */

import { query } from '../config/database.js';
import { buildScopedSuratFilter, resolveAllowedSecurityLevels } from '../middleware/rbacMiddleware.js';

/**
 * GET /api/surat
 * Mengambil daftar surat yang disaring secara ketat berdasarkan wewenang klaster JRA
 * dan batas maksimum klasifikasi keamanan (Pasal 66 & SK Rektor No. 2803)
 */
export const getScopedLetters = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        status: 401,
        success: false,
        error: 'Unauthorized',
        message: 'Akses ditolak. Sesi otentikasi tidak ditemukan.'
      });
    }

    // Bangun filter dinamis berdasarkan wewenang pengguna
    const filter = buildScopedSuratFilter(user, 1);

    const sql = `
      SELECT 
        s.id_surat,
        s.nomor_surat,
        s.tanggal_surat,
        s.perihal,
        s.jenis_surat,
        s.kode_jra,
        s.status_progres,
        s.file_path,
        s.kode_unit_kerja,
        s.created_at,
        j.series_arsip,
        j.klasifikasi_keamanan,
        j.retensi_aktif_tahun,
        j.retensi_inaktif_tahun,
        j.keterangan_akhir,
        j.unit_pengolah_default
      FROM tbl_surat s
      JOIN tbl_master_jra j ON s.kode_jra = j.kode_jra
      ${filter.whereClause}
      ORDER BY s.tanggal_surat DESC, s.id_surat DESC;
    `;

    const result = await query(sql, filter.params);

    return res.status(200).json({
      status: 200,
      success: true,
      userScope: {
        role: user.role,
        kode_unit_kerja: user.kode_unit_kerja,
        max_keamanan: user.max_keamanan,
        allowed_prefixes: user.allowed_prefixes
      },
      total: result.rows.length,
      data: result.rows
    });
  } catch (err) {
    console.error('[SCOPED-SURAT] Error getScopedLetters:', err);
    return res.status(500).json({
      status: 500,
      success: false,
      error: 'QueryFailed',
      message: 'Gagal mengambil data surat terfilter.',
      details: err.message
    });
  }
};

/**
 * GET /api/surat/:id
 * Mengambil satu naskah dinas dengan verifikasi ketat klaster JRA dan tingkat kerahasiaan
 */
export const getScopedLetterById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        status: 401,
        success: false,
        error: 'Unauthorized',
        message: 'Akses ditolak. Sesi otentikasi tidak ditemukan.'
      });
    }

    const sql = `
      SELECT 
        s.id_surat,
        s.nomor_surat,
        s.tanggal_surat,
        s.perihal,
        s.jenis_surat,
        s.kode_jra,
        s.status_progres,
        s.file_path,
        s.kode_unit_kerja,
        s.created_at,
        j.series_arsip,
        j.klasifikasi_keamanan,
        j.retensi_aktif_tahun,
        j.retensi_inaktif_tahun,
        j.keterangan_akhir,
        j.unit_pengolah_default
      FROM tbl_surat s
      JOIN tbl_master_jra j ON s.kode_jra = j.kode_jra
      WHERE s.id_surat::text = $1::text OR s.nomor_surat = $1::text;
    `;

    const result = await query(sql, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 404,
        success: false,
        error: 'NotFound',
        message: `Surat dengan identitas '${id}' tidak ditemukan dalam basis data.`
      });
    }

    const letter = result.rows[0];
    const isSuperAdmin = user.role === 'Super Admin' || user.role === 'SUPER_ADMIN';

    // 1. Verifikasi Klaster Prefix JRA
    const allowedPrefixes = Array.isArray(user.allowed_prefixes) ? user.allowed_prefixes : [];
    const isPrefixAllowed = isSuperAdmin || allowedPrefixes.includes('*') || 
      allowedPrefixes.some(prefix => letter.kode_jra.startsWith(prefix));

    if (!isPrefixAllowed) {
      return res.status(403).json({
        status: 403,
        success: false,
        error: 'Forbidden',
        message: `Akses ditolak. Naskah ini berkategori '${letter.kode_jra}' yang berada di luar klaster wewenang tupoksi Anda: [${allowedPrefixes.join(', ')}].`,
        requiredPrefix: letter.kode_jra,
        userAllowedPrefixes: allowedPrefixes
      });
    }

    // 2. Verifikasi Tingkat Keamanan Dokumen (Pasal 66 & SK Rektor No. 2803)
    const allowedSecurityLevels = resolveAllowedSecurityLevels(user.max_keamanan || 'Biasa/Terbuka');
    const isSecurityAllowed = isSuperAdmin || allowedSecurityLevels.includes(letter.klasifikasi_keamanan);

    if (!isSecurityAllowed) {
      return res.status(403).json({
        status: 403,
        success: false,
        error: 'Forbidden',
        message: `Akses ditolak. Naskah ini berderajat '${letter.klasifikasi_keamanan}', melampaui hak akses maksimum akun Anda ('${user.max_keamanan}').`,
        documentSecurity: letter.klasifikasi_keamanan,
        userMaxSecurity: user.max_keamanan
      });
    }

    // Lolos seluruh pemeriksaan otorisasi
    return res.status(200).json({
      status: 200,
      success: true,
      data: letter
    });
  } catch (err) {
    console.error('[SCOPED-SURAT] Error getScopedLetterById:', err);
    return res.status(500).json({
      status: 500,
      success: false,
      error: 'QueryFailed',
      message: 'Gagal memeriksa dan mengambil detail surat.',
      details: err.message
    });
  }
};

/**
 * Helper Backend: Menentukan apakah user aktif adalah Dosen Tanpa Jabatan (DOSEN_NON_JABATAN)
 * yang wajib dikenakan Strict Personal Isolation (SK Rektor UNSIL No. 2803 Tahun 2023)
 */
const isBackendDosenNonJabatan = (user) => {
  if (!user) return true;
  const roleStr = String(user.role || user.role_key || user.nama_role || '').toUpperCase();
  const posStr = String(user.jabatan || user.roleLabel || '').toLowerCase();

  if (roleStr === 'SUPER ADMIN' || roleStr === 'SUPER_ADMIN' || Number(user.id_role) === 1) {
    return false;
  }

  const hasStructuralKeyword =
    /\b(rektor|wakil\s+rektor|warek|dekan|wakil\s+dekan|wadek|direktur|ketua|kepala|kajur|kaprodi|koorprodi|sekretaris)\b/i.test(
      posStr
    );

  if (hasStructuralKeyword || user.is_pejabat === true || roleStr === 'PEJABAT') {
    return false;
  }

  return (
    Number(user.id_role) === 7 ||
    roleStr === 'DOSEN_NON_JABATAN' ||
    roleStr === 'DOSEN_TANPA_JABATAN' ||
    roleStr === 'DOSEN' ||
    roleStr.includes('DOSEN')
  );
};

/**
 * GET /api/e-paraf/queue & GET /api/drafts/queue
 * Mengimplementasikan Strict Personal Isolation (SKKAAD SK Rektor No. 2803/2023)
 * untuk role DOSEN_NON_JABATAN serta 3 Entitas Pengecualian Akses Massal:
 * 1. Pimpinan Unit Struktural (Rektor/Dekan/Ketua Jurusan) - Target Penandatangan Akhir (TTE)
 * 2. Staf Ketatausahaan / Arsiparis TU Fakultas - Otorisasi Penomoran Resmi Naskah Dinas
 * 3. Super Admin - Kontrol Sistem Global
 */
export const getEParafQueue = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        status: 401,
        success: false,
        error: 'Unauthorized',
        message: 'Akses ditolak. Token sesi JWT tidak ditemukan.'
      });
    }

    const activeUserId = String(user.id_user || user.id);
    const activeUnitCode = String(user.kode_unit_kerja || user.unit_kerja_id || 'UN58.13');
    const isDosenIsolated = isBackendDosenNonJabatan(user);

    // 1. STRICT PERSONAL ISOLATION: Khusus Role DOSEN_NON_JABATAN / Dosen Tanpa Jabatan
    if (isDosenIsolated) {
      const strictPersonalIsolationSql = `
        -- Query di antrean E-Paraf khusus untuk role DOSEN_NON_JABATAN
        SELECT * FROM tbl_document_drafts 
        WHERE creator_id = $1             -- Mengunci ID Dosen yang sedang login
          AND status IN ('DRAFT', 'DIPARAF', 'SIAP_TTE')
        ORDER BY created_at DESC;
      `;

      let rows = [];
      try {
        const dbRes = await query(strictPersonalIsolationSql, [activeUserId]);
        rows = dbRes.rows || [];
      } catch {
        rows = [];
      }

      return res.status(200).json({
        status: 200,
        success: true,
        isolationMode: 'STRICT_PERSONAL_ISOLATION',
        regulation: 'SK Rektor UNSIL No. 2803 Tahun 2023 (SKKAAD - Isolasi Data Pribadi)',
        boundCreatorId: activeUserId,
        executedQuery: "SELECT * FROM tbl_document_drafts WHERE creator_id = $1 AND status IN ('DRAFT', 'DIPARAF', 'SIAP_TTE') ORDER BY created_at DESC;",
        total: rows.length,
        data: rows
      });
    }

    // 2. PENGGUNA PENGECUALIAN AKSES MASSAL (3 Entitas: Super Admin, Pimpinan Unit Struktural, Staf TU/Arsiparis)
    const isSuperAdmin = user.role === 'Super Admin' || user.role === 'SUPER_ADMIN' || Number(user.id_role) === 1;
    let massQueueSql;
    let massParams = [];

    if (isSuperAdmin) {
      massQueueSql = `
        SELECT * FROM tbl_document_drafts
        WHERE status IN ('DRAFT', 'DIPARAF', 'SIAP_TTE')
        ORDER BY created_at DESC;
      `;
    } else {
      // Pimpinan Unit Struktural (Rektor/Dekan/Kajur) atau Staf Ketatausahaan / Arsiparis TU Fakultas
      massQueueSql = `
        SELECT * FROM tbl_document_drafts
        WHERE (kode_unit_kerja = $1 OR kode_unit_kerja LIKE $2)
          AND status IN ('DRAFT', 'DIPARAF', 'SIAP_TTE')
        ORDER BY created_at DESC;
      `;
      massParams = [activeUnitCode, `${activeUnitCode}%`];
    }

    let rows = [];
    try {
      const dbRes = await query(massQueueSql, massParams);
      rows = dbRes.rows || [];
    } catch {
      rows = [];
    }

    return res.status(200).json({
      status: 200,
      success: true,
      isolationMode: isSuperAdmin
        ? 'MASS_QUEUE_SUPER_ADMIN'
        : user.is_pejabat
          ? 'MASS_QUEUE_PIMPINAN_STRUKTURAL'
          : 'MASS_QUEUE_TU_ARSIPARIS',
      unitScope: activeUnitCode,
      total: rows.length,
      data: rows
    });
  } catch (err) {
    console.error('[E-PARAF-QUEUE] Error:', err);
    return res.status(500).json({
      status: 500,
      success: false,
      error: 'QueueFetchError',
      message: 'Gagal mengambil antrean E-Paraf & TTE.',
      details: err.message
    });
  }
};

/**
 * GET /api/drafts/:id
 * Mencegah manipulasi parameter URL/ID lintas akun oleh Dosen B terhadap draf milik Dosen A
 */
export const getDraftByIdIsolated = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;

    if (!user) {
      return res.status(401).json({
        status: 401,
        success: false,
        error: 'Unauthorized',
        message: 'Akses ditolak. Sesi login tidak ditemukan.'
      });
    }

    const activeUserId = String(user.id_user || user.id);
    const isDosenIsolated = isBackendDosenNonJabatan(user);

    const dbRes = await query(`SELECT * FROM tbl_document_drafts WHERE id_draft::text = $1::text LIMIT 1;`, [id]);
    if (!dbRes.rows || dbRes.rows.length === 0) {
      return res.status(404).json({
        status: 404,
        success: false,
        error: 'DraftNotFound',
        message: 'Draf naskah dinas tidak ditemukan.'
      });
    }

    const draft = dbRes.rows[0];

    // Proteksi Absolut: Jika Dosen Tanpa Jabatan mencoba mengakses ID draf milik Dosen lain (creator_id != req.user.id)
    if (isDosenIsolated && String(draft.creator_id) !== activeUserId) {
      return res.status(403).json({
        status: 403,
        success: false,
        error: 'SKKAADPersonalIsolationViolation',
        message: 'Akses Ditolak (Strict Personal Isolation - SK Rektor No. 2803/2023): Anda dilarang mengakses draf naskah dinas milik dosen lain.'
      });
    }

    return res.status(200).json({
      status: 200,
      success: true,
      data: draft
    });
  } catch (err) {
    return res.status(500).json({
      status: 500,
      success: false,
      error: 'DraftDetailError',
      message: 'Gagal memeriksa otorisasi draf naskah dinas.',
      details: err.message
    });
  }
};


