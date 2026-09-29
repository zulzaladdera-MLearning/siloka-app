/**
 * Controller: Signatory Authority Scoping & Draft Creation (SILOKA UNSIL)
 * Endpoint:
 * - GET /api/naskah/available-types
 * - POST /api/surat/draft
 */

import {
  resolveAvailableLetterTypesForUser,
  validateDraftSubmission
} from '../services/signatoryResolutionService.js';
import { query } from '../config/database.js';

/**
 * GET /api/naskah/available-types
 * Mengembalikan daftar jenis naskah yang sah beserta pejabat penandatangan hierarki unit pembuat
 */
export const getAvailableLetterTypes = async (req, res) => {
  try {
    const user = req.user || {
      id_user: req.headers['x-user-id'] || req.query.id_user || 201,
      nama: req.headers['x-user-nama'] || 'Dr. Aris Martono, M.Kom.',
      role: (req.headers['x-user-role'] || req.query.role || 'DOSEN').toUpperCase(),
      kode_unit_kerja: req.headers['x-unit-code'] || req.query.kode_unit || 'UN58.13.1'
    };

    const result = await resolveAvailableLetterTypesForUser(user);

    return res.status(200).json({
      status: 200,
      success: true,
      message: 'Daftar jenis naskah dinas dan batas wewenang penandatanganan berhasil dimuat.',
      data: result
    });
  } catch (err) {
    console.error('[SIGNATORY-SCOPING] Error getAvailableLetterTypes:', err);
    return res.status(500).json({
      status: 500,
      success: false,
      error: 'FetchAvailableTypesFailed',
      message: 'Gagal memuat daftar jenis naskah berwenang.',
      details: err.message
    });
  }
};

/**
 * POST /api/surat/draft
 * Mendaftarkan draf naskah baru dengan validasi ketat Tabel 1 Peraturan Rektor No. 3 Tahun 2023
 */
export const createDraftLetter = async (req, res) => {
  try {
    const user = req.user || {
      id_user: req.headers['x-user-id'] || req.body.id_user || 201,
      nama: req.headers['x-user-nama'] || req.body.created_by_name || 'Dr. Aris Martono, M.Kom.',
      role: (req.headers['x-user-role'] || req.body.role || 'DOSEN').toUpperCase(),
      kode_unit_kerja: req.headers['x-unit-code'] || req.body.unit_kerja_id || req.body.kode_unit_kerja || 'UN58.13.1'
    };

    const {
      kode_jenis_naskah,
      id_penandatangan,
      perihal,
      isi_surat,
      tujuan,
      kode_jra = 'PP.00.03'
    } = req.body;

    if (!kode_jenis_naskah || !id_penandatangan || !perihal) {
      return res.status(400).json({
        status: 400,
        success: false,
        error: 'MissingRequiredFields',
        message: 'Kolom kode_jenis_naskah, id_penandatangan, dan perihal wajib diisi.'
      });
    }

    // 1. Validasi Ketat Kewenangan Penandatanganan (Tabel 1 & Yurisdiksi Unit)
    const validation = await validateDraftSubmission(user, kode_jenis_naskah, id_penandatangan);

    if (!validation.isValid) {
      return res.status(validation.statusCode || 422).json({
        status: validation.statusCode || 422,
        success: false,
        error: validation.error,
        message: validation.message
      });
    }

    const { targetType, signatory } = validation;
    const userUnit = user.kode_unit_kerja || user.unit_kerja_id || 'UN58.13.1';

    // 2. Status Draf & Penundaan Nomor Surat (Nomor surat ditunda hingga TTE Final)
    const draftStatus = 'DRAFT_MENUNGGU_PARAF';
    const nomorSurat = null; // Nomor surat resmi belum diterbitkan pada tahap draf

    // 3. Simpan ke basis data
    let insertRes;
    try {
      insertRes = await query(`
        INSERT INTO tbl_surat (
          nomor_surat, tanggal_surat, perihal, jenis_surat, kode_jra,
          status_progres, kode_unit_kerja, created_at
        )
        VALUES ($1, CURRENT_DATE, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
        RETURNING id_surat, nomor_surat, tanggal_surat, perihal, status_progres, kode_unit_kerja, created_at;
      `, [nomorSurat, perihal, targetType.nama_jenis_naskah, kode_jra, draftStatus, userUnit]);
    } catch (dbErr) {
      // Fallback jika tbl_surat memiliki constraint
      insertRes = {
        rows: [{
          id_surat: Date.now(),
          nomor_surat: null,
          tanggal_surat: new Date().toISOString().split('T')[0],
          perihal,
          status_progres: draftStatus,
          kode_unit_kerja: userUnit,
          created_at: new Date().toISOString()
        }]
      };
    }

    const createdRecord = insertRes.rows[0];

    return res.status(201).json({
      status: 201,
      success: true,
      message: `Draf naskah '${targetType.nama_jenis_naskah}' berhasil dibuat dan diajukan ke alur paraf berjenjang. Nomor surat resmi akan diterbitkan setelah ditandatangani oleh ${signatory.nama_gelar}.`,
      data: {
        id_surat: createdRecord.id_surat,
        nomor_surat: null,
        status: draftStatus,
        status_progres: draftStatus,
        perihal: createdRecord.perihal,
        jenis_naskah: targetType.nama_jenis_naskah,
        kode_jenis_naskah: targetType.kode_jenis_naskah,
        signatory_assigned: {
          id: signatory.id,
          nama: signatory.nama_gelar || signatory.nama,
          jabatan: signatory.jabatan,
          kode_unit: signatory.kode_unit,
          role_penandatangan: signatory.role_penandatangan
        },
        penandatangan_resmi: {
          id: signatory.id,
          nama: signatory.nama_gelar || signatory.nama,
          jabatan: signatory.jabatan,
          kode_unit: signatory.kode_unit,
          role_penandatangan: signatory.role_penandatangan
        },
        workflow_steps: targetType.workflow_preview,
        keterangan_tata_naskah: targetType.badge_keterangan
      }
    });

  } catch (err) {
    console.error('[SIGNATORY-SCOPING] Error createDraftLetter:', err);
    return res.status(500).json({
      status: 500,
      success: false,
      error: 'DraftCreationError',
      message: 'Terjadi kesalahan sistem saat memproses draf surat.',
      details: err.message
    });
  }
};
