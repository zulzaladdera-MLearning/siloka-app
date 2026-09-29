/**
 * Controller: Master Pejabat Penandatangan Resmi (Automated Hierarchy Routing)
 * Endpoint REST API untuk menyaring penandatangan kedinasan berdasarkan unit kerja dan jabatan session user.
 */

import {
  getPejabatByUnit as fetchPejabatByUnit,
  getAllPejabat as fetchAllPejabat,
  getPejabatByNip as fetchPejabatByNip
} from '../services/pejabatService.js';

/**
 * GET /api/pejabat
 * Query parameters:
 *  - kode_unit: Unit kerja pengguna (Session User)
 *  - jabatan: Jabatan pengguna (Dosen / Staf)
 *  - role: Peran pengguna
 */
export const getPejabatList = async (req, res) => {
  try {
    const sessionUser = req.user || {};
    const kodeUnit = req.query.kode_unit || sessionUser.unit_kerja_id || sessionUser.kode_unit;
    const jabatan = req.query.jabatan || sessionUser.jabatan || sessionUser.roleLabel;
    const role = req.query.role || sessionUser.role;

    let data;
    if (kodeUnit) {
      data = await fetchPejabatByUnit(kodeUnit, { jabatan, role });
    } else {
      data = await fetchAllPejabat();
    }

    return res.status(200).json({
      status: 200,
      success: true,
      message: 'Daftar pejabat struktural penandatangan berhasil dimuat sesuai hierarki unit.',
      total: data.length,
      hierarchy: {
        unit_kerja_user_login: kodeUnit || 'ALL',
        jabatan_user: jabatan || 'Dosen Biasa',
        routing_mode: 'AUTOMATED_HIERARCHY_STRICT'
      },
      data
    });
  } catch (err) {
    console.error('[GET-PEJABAT-ERROR]', err);
    return res.status(500).json({
      status: 500,
      success: false,
      error: 'FetchPejabatHierarchyFailed',
      message: 'Gagal memuat daftar pejabat penandatangan hierarki unit.',
      details: err.message
    });
  }
};

/**
 * GET /api/pejabat/unit/:kode_unit
 * Mengambil pejabat struktural dalam satu unit kerja spesifik
 */
export const getPejabatByUnitCode = async (req, res) => {
  try {
    const { kode_unit } = req.params;
    const data = await fetchPejabatByUnit(kode_unit);

    return res.status(200).json({
      status: 200,
      success: true,
      message: `Daftar pejabat struktural unit ${kode_unit} berhasil dimuat.`,
      total: data.length,
      unit_kerja: kode_unit,
      data
    });
  } catch (err) {
    console.error('[GET-PEJABAT-BY-UNIT-ERROR]', err);
    return res.status(500).json({
      status: 500,
      success: false,
      error: 'FetchPejabatByUnitFailed',
      message: `Gagal memuat pejabat untuk unit ${req.params.kode_unit}.`,
      details: err.message
    });
  }
};

/**
 * GET /api/pejabat/:nip
 * Mengambil detail pejabat berdasarkan NIP
 */
export const getPejabatDetail = async (req, res) => {
  try {
    const { nip } = req.params;
    const pejabat = await fetchPejabatByNip(nip);

    if (!pejabat) {
      return res.status(404).json({
        status: 404,
        success: false,
        error: 'PejabatNotFound',
        message: `Pejabat struktural dengan NIP ${nip} tidak ditemukan.`
      });
    }

    return res.status(200).json({
      status: 200,
      success: true,
      message: 'Detail pejabat struktural berhasil dimuat.',
      data: pejabat
    });
  } catch (err) {
    console.error('[GET-PEJABAT-DETAIL-ERROR]', err);
    return res.status(500).json({
      status: 500,
      success: false,
      error: 'FetchPejabatDetailFailed',
      message: 'Gagal memuat rincian pejabat.',
      details: err.message
    });
  }
};

export default {
  getPejabatList,
  getPejabatByUnitCode,
  getPejabatDetail
};
