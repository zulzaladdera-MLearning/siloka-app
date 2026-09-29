/**
 * Router: Otentikasi & Login (SILOKA UNSIL)
 */

import { Router } from 'express';
import { loginUser } from '../controllers/authController.js';

const router = Router();

// Endpoint Login: POST /api/auth/login & POST /api/auth
router.post('/login', loginUser);
router.post('/', loginUser);

export default router;

