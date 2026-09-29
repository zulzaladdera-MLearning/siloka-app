/**
 * Definisi Aplikasi Express Backend SILOKA (UNSIL)
 * Terpisah dari app.listen agar dapat dimount sebagai middleware di Vite dev server
 * maupun dijalankan sebagai standalone server di production.
 */

import express from 'express';
import cors from 'cors';
import adminRoutes from './routes/adminRoutes.js';
import letterRoutes from './routes/letterRoutes.js';
import authRoutes from './routes/authRoutes.js';
import leadershipRoutes from './routes/leadershipRoutes.js';
import { loginUser } from './controllers/authController.js';
import { authenticateUser } from './middleware/rbacMiddleware.js';
import {
  getAvailablePositionsByUnit,
  executeUnitMutationOrAssignment
} from './controllers/unitMutationController.js';

const app = express();

// Middleware Global
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-role', 'x-user-data']
}));

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(authenticateUser);

// Health Check Root
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ONLINE',
    app: 'SILOKA Backend Server - Universitas Siliwangi',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Endpoint API v1 Dependent Dropdown Jabatan SOTK per Unit Kerja
app.get('/api/v1/unit-kerja/:unit_id/jabatan-tersedia', getAvailablePositionsByUnit);
app.post('/api/v1/pegawai/mutasi-unit', executeUnitMutationOrAssignment);

// Daftarkan Rute Otentikasi Login (/api/auth/login dan /api/login)
app.use('/api/auth', authRoutes);
app.post('/api/login', loginUser);

// Daftarkan Rute Operasional Persuratan (/api/klasifikasi-arsip, /api/surat-keluar, dll)
app.use('/api', letterRoutes);

// Daftarkan Rute Mutasi Kepemimpinan & Formasi Jabatan SOTK (/api/positions, /api/admin/leadership/*)
app.use('/api', leadershipRoutes);

// Daftarkan Rute Admin Berbasis RBAC (/api/admin/*)
app.use('/api/admin', adminRoutes);

export default app;

