/**
 * Rute API: Mutasi Kepemimpinan & Formasi Jabatan SOTK (SILOKA UNSIL)
 */

import express from 'express';
import {
  getPositionsHandler,
  mutateLeadershipHandler,
  getLeadershipHistoryHandler
} from '../controllers/leadershipController.js';
import { SuperAdminGuard } from '../../src/modules/admin/leadership.guard.ts';

const router = express.Router();

// 1. Rute Publik/Internal: Ambil formasi jabatan SOTK untuk dropdown formulir
router.get('/positions', getPositionsHandler);

// 2. Rute Khusus Super Admin: Eksekusi mutasi kepemimpinan & audit log
router.post('/admin/leadership/mutate', SuperAdminGuard, mutateLeadershipHandler);
router.get('/admin/leadership/history', SuperAdminGuard, getLeadershipHistoryHandler);

export default router;

