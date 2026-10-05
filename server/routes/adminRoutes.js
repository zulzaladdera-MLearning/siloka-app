/**
 * Router: Modul Pengaturan Sistem (RBAC Super Admin)
 * Seluruh endpoint di bawah /api/admin/* dilindungi oleh middleware `requireSuperAdmin`.
 */

import { Router } from 'express';
import { requireSuperAdmin } from '../middleware/authMiddleware.js';
import { importUsersFromExcel, downloadTemplateExcel } from '../controllers/excelImportController.js';
import {
  mutateUserJob,
  storeUser,
  getAllStaffUsers,
  deleteStaffUser
} from '../controllers/userMutationController.js';
import { registerNewStaffUser } from '../controllers/userRegistrationController.js';
import { configureTteCertificate } from '../controllers/tteCertificateController.js';
import {
  getMasterOtkUnitsAndHistory,
  executeUnitMutationOrAssignment,
  getAvailablePositionsByUnit
} from '../controllers/unitMutationController.js';
import {
  getAllUnits,
  createUnit,
  updateUnit,
  deleteUnit
} from '../controllers/unitKerjaController.js';

const router = Router();

// Terapkan middleware otorisasi RBAC Super Admin untuk SELURUH route admin
router.use(requireSuperAdmin);

// 1. Health check & Verifikasi Hak Akses Super Admin
router.get('/verify-access', (req, res) => {
  res.status(200).json({
    status: 200,
    success: true,
    message: 'Otorisasi Super Admin terverifikasi.',
    user: req.user
  });
});

// 3. Ambil Seluruh Data Pengguna Kepegawaian (GET /api/admin/users)
router.get('/users', getAllStaffUsers);

// 4. Input Massal Impor Excel (.xlsx) & Unduh Format Template
router.get('/users/template', downloadTemplateExcel);
router.post('/users/import-excel', importUsersFromExcel);

// 5. Manajemen Akun Pengguna: Registrasi RBAC & Tupoksi Pengguna Baru (POST /api/admin/users)
router.post('/users', (req, res, next) => {
  if (req.body.id_role || req.body.kode_unit_kerja || req.body.nip_nik) {
    return registerNewStaffUser(req, res, next);
  }
  return storeUser(req, res, next);
});
router.post('/users/register', registerNewStaffUser);
router.post('/users/store', (req, res, next) => {
  if (req.body.id_role || req.body.kode_unit_kerja) {
    return registerNewStaffUser(req, res, next);
  }
  return storeUser(req, res, next);
});

// Pemetaan User & Mutasi Jabatan
router.put('/users/:id/mutation', mutateUserJob);
router.patch('/users/:id/mutation', mutateUserJob);
router.patch('/users/:id', mutateUserJob);
router.put('/users/:id', mutateUserJob);

// Hapus Akun Pengguna (DELETE /api/admin/users/:id)
router.delete('/users/:id', deleteStaffUser);

// Manajemen Unit Kerja Resmi SOTK (CRUD Super Admin)
router.get('/unit-kerja', getAllUnits);
router.post('/unit-kerja', createUnit);
router.put('/unit-kerja/:id', updateUnit);
router.delete('/unit-kerja/:id', deleteUnit);

// 4.b. Mutasi Unit Kerja & Penugasan Tambahan (Sekunder) OTK UNSIL (Permendikbudristek No. 19/2023)
router.get('/pegawai/unit-kerja-otk', getMasterOtkUnitsAndHistory);
router.get('/pegawai/mutasi-riwayat', getMasterOtkUnitsAndHistory);
router.get('/unit-kerja/:unit_id/jabatan-tersedia', getAvailablePositionsByUnit);
router.post('/pegawai/mutasi-unit', executeUnitMutationOrAssignment);

// 5. Tugas 5: Konfigurasi Sertifikat Digital BSrE untuk TTE
router.post('/tte/configure', configureTteCertificate);
router.put('/users/:id/tte', configureTteCertificate);

export default router;

