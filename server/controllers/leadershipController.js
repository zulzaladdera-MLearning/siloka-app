/**
 * Controller: Mutasi Kepemimpinan & Formasi Jabatan SOTK (SILOKA UNSIL)
 */

import {
  executeLeadershipMutation,
  getAllPositions,
  getLeadershipAuditLogs
} from '../../src/modules/admin/leadership.service.ts';

/**
 * GET /api/positions
 * Mendapatkan daftar seluruh formasi jabatan SOTK beserta pemangku aktifnya
 */
export async function getPositionsHandler(req, res) {
  try {
    const positions = await getAllPositions();
    return res.status(200).json({
      status: 200,
      success: true,
      data: positions,
      total: positions.length
    });
  } catch (err) {
    console.error('[LEADERSHIP-CTRL] Error fetching positions:', err);
    return res.status(500).json({
      status: 500,
      success: false,
      error: 'InternalServerError',
      message: 'Gagal mengambil daftar formasi jabatan SOTK.',
      details: err.message
    });
  }
}

/**
 * POST /api/admin/leadership/mutate
 * Menjalankan mutasi jabatan pimpinan (Definitif, Plt, Plh) secara transaksional
 */
export async function mutateLeadershipHandler(req, res) {
  try {
    const user = req.user;
    const actorId = user?.id || user?.id_user || user?.nip_nik || 'admin';

    const {
      targetUserId,
      positionId,
      status,
      decreeNumber,
      startDate,
      notes
    } = req.body;

    if (!targetUserId || !positionId || !decreeNumber || !startDate) {
      return res.status(400).json({
        status: 400,
        success: false,
        error: 'BadRequest',
        message: 'Parameter mutasi wajib diisi: targetUserId, positionId, decreeNumber, startDate.'
      });
    }

    const ipAddress = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'SILOKA-Client';

    const result = await executeLeadershipMutation(actorId, {
      targetUserId,
      positionId,
      status: status || 'DEFINITIF',
      decreeNumber,
      startDate,
      notes: notes || '',
      ipAddress,
      userAgent
    });

    return res.status(200).json({
      status: 200,
      success: true,
      message: result.message,
      data: result.mutation
    });
  } catch (err) {
    console.error('[LEADERSHIP-CTRL] Mutation error:', err);
    return res.status(422).json({
      status: 422,
      success: false,
      error: 'UnprocessableEntity',
      message: err.message || 'Gagal mengeksekusi mutasi kepemimpinan.'
    });
  }
}

/**
 * GET /api/admin/leadership/history
 * Mengambil rekam jejak audit mutasi kepemimpinan
 */
export async function getLeadershipHistoryHandler(req, res) {
  try {
    const limit = parseInt(req.query.limit || '50', 10);
    const logs = await getLeadershipAuditLogs(limit);

    return res.status(200).json({
      status: 200,
      success: true,
      data: logs,
      total: logs.length
    });
  } catch (err) {
    console.error('[LEADERSHIP-CTRL] Error fetching audit logs:', err);
    return res.status(500).json({
      status: 500,
      success: false,
      error: 'InternalServerError',
      message: 'Gagal mengambil riwayat mutasi kepemimpinan.',
      details: err.message
    });
  }
}

