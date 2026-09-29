/**
 * Server Backend Utama SILOKA (UNSIL)
 * Menyediakan API backend untuk modul administrasi persuratan,
 * integrasi SIMPEG, parsing impor Excel, mutasi user, dan manajemen TTE BSrE.
 */

import app from './app.js';

const PORT = process.env.PORT || 5000;

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    status: 404,
    error: 'NotFound',
    message: `Endpoint ${req.method} ${req.originalUrl} tidak ditemukan pada server SILOKA.`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[SERVER-ERROR]', err);
  res.status(err.status || 500).json({
    status: err.status || 500,
    error: err.name || 'InternalServerError',
    message: err.message || 'Terjadi kesalahan sistem internal pada server SILOKA.'
  });
});

// Jalankan server jika dipanggil sebagai entrypoint
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[SILOKA-SERVER] Server backend berjalan di http://localhost:${PORT}`);
    console.log(`[SILOKA-SERVER] Endpoint RBAC Admin aktif di /api/admin/*`);
    console.log(`[SILOKA-SERVER] Endpoint Login aktif di /api/auth/login`);
  });
}

export default app;
