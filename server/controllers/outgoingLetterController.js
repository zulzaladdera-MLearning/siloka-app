/**
 * Controller: Manajemen Nomor Surat Keluar Otomatis
 * Endpoint REST API untuk daftar klasifikasi arsip dan pembuatan surat keluar.
 */

import {
  getAllKlasifikasiArsip,
  createOutgoingLetter,
  getOutgoingLetters
} from '../services/outgoingLetterService.js';

/**
 * GET /api/klasifikasi-arsip
 * Mengembalikan daftar seluruh kategori klasifikasi arsip aktif
 */
export const getKlasifikasiList = async (req, res) => {
  try {
    const list = await getAllKlasifikasiArsip();
    return res.status(200).json({
      status: 200,
      success: true,
      message: 'Daftar klasifikasi arsip berhasil dimuat.',
      total: list.length,
      data: list
    });
  } catch (err) {
    console.error('[GET-KLASIFIKASI-ERROR]', err);
    return res.status(500).json({
      status: 500,
      success: false,
      error: 'FetchKlasifikasiFailed',
      message: 'Gagal memuat daftar klasifikasi arsip.',
      details: err.message
    });
  }
};

/**
 * POST /api/surat-keluar
 * Membuat surat keluar baru dengan nomor surat tergenerasi otomatis (terproteksi transaksi dan concurrency lock)
 */
export const createOutgoing = async (req, res) => {
  try {
    const payload = req.body || {};
    const currentUser = req.user || {
      id: 'usr-02',
      unit_kerja_id: payload.unit_kerja_id || 'UN58.10',
      nama_lengkap: 'Staf Pelaksana Persuratan',
      role: 'OPERATOR_UNIT'
    };

    const result = await createOutgoingLetter(payload, currentUser);

    return res.status(201).json({
      status: 201,
      success: true,
      message: `Surat keluar berhasil didaftarkan dengan nomor resmi: ${result.data.nomor_surat_lengkap}`,
      data: result.data,
      meta: {
        db_executed: result.db_executed,
        concurrency_locked: true,
        format_formula: '[nomor_urut]/[unit_kerja]/[tingkat_keamanan]/[kode_klasifikasi]/[tahun]'
      }
    });
  } catch (err) {
    console.error('[CREATE-SURAT-KELUAR-ERROR]', err);
    return res.status(400).json({
      status: 400,
      success: false,
      error: 'CreateOutgoingLetterFailed',
      message: err.message || 'Gagal membuat nomor surat keluar otomatis.'
    });
  }
};

/**
 * GET /api/surat-keluar
 * Mengambil daftar surat keluar yang telah terbit
 */
export const getOutgoingList = async (req, res) => {
  try {
    const { tahun } = req.query;
    const list = await getOutgoingLetters(tahun);
    return res.status(200).json({
      status: 200,
      success: true,
      message: 'Daftar surat keluar berhasil dimuat.',
      total: list.length,
      data: list
    });
  } catch (err) {
    console.error('[GET-SURAT-KELUAR-ERROR]', err);
    return res.status(500).json({
      status: 500,
      success: false,
      error: 'FetchOutgoingLettersFailed',
      message: 'Gagal memuat riwayat surat keluar.',
      details: err.message
    });
  }
};

export default {
  getKlasifikasiList,
  createOutgoing,
  getOutgoingList
};

