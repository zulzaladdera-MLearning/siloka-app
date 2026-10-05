/**
 * Controller: Pemetaan User & Mutasi Jabatan
 * Endpoint (PUT/PATCH) untuk memperbarui relasi unit kerja (id_unit / unit_kerja_id)
 * dan role hak akses kedinasan pada record user di tabel tm_user.
 */

// Daftar 21 Kode Unit Kerja Resmi UNSIL
const VALID_UNSIL_UNITS = [
  'UN58', 'UN58.SENAT', 'UN58.SPI', 'UN58.DP', 'UN58.5', 'UN58.6',
  'UN58.10', 'UN58.11', 'UN58.12', 'UN58.13', 'UN58.14', 'UN58.15',
  'UN58.16', 'UN58.17', 'UN58.21', 'UN58.22', 'UN58.31', 'UN58.32',
  'UN58.33', 'UN58.34', 'UN58.35'
];

const VALID_ROLES = [
  'DOSEN',
  'Dosen',
  'PEJABAT',
  'OPERATOR_UNIT',
  'STAF_PERSURATAN',
  'PENGAWAS',
  'Super Admin',
  'SUPER_ADMIN',
  'STAF',
  'VERIFIKATOR'
];

import {
  mutateUserJobAssignment,
  storeNewUser,
  getAllUsersFromDatabase,
  deleteUserById
} from '../services/userManagementService.js';

export const mutateUserJob = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      unit_kerja_id,
      id_unit,
      kode_unit,
      role,
      role_label,
      jabatan,
      email,
      password_baru,
      new_password,
      reset_password,
      note,
      nama,
      nama_lengkap,
      name
    } = req.body;

    const targetUnit = kode_unit || unit_kerja_id || id_unit;
    const targetRole = role;
    const targetLabel = role_label || jabatan;
    const targetPassword = password_baru || new_password || reset_password;
    const targetName = nama || nama_lengkap || name;

    // 1. Validasi input
    if (!id) {
      return res.status(400).json({
        status: 400,
        success: false,
        error: 'MissingUserId',
        message: 'Parameter ID atau NIP user target tidak boleh kosong.'
      });
    }

    if (!targetUnit) {
      return res.status(400).json({
        status: 400,
        success: false,
        error: 'MissingUnitKerja',
        message: 'Kode unit kerja (id_unit / unit_kerja_id) tujuan mutasi wajib dipilih.'
      });
    }

    if (!targetRole) {
      return res.status(400).json({
        status: 400,
        success: false,
        error: 'MissingRole',
        message: 'Role kedinasan baru wajib ditentukan.'
      });
    }

    // 2. Validasi kesesuaian unit kerja dengan statuta UNSIL
    const isUnitValid =
      VALID_UNSIL_UNITS.includes(targetUnit) ||
      targetUnit.startsWith('UN58') ||
      ['BKU', 'BAKPK', 'FT', 'FKIP'].includes(targetUnit);
    if (!isUnitValid) {
      return res.status(422).json({
        status: 422,
        success: false,
        error: 'InvalidUnitCode',
        message: `Kode unit kerja '${targetUnit}' tidak terdaftar pada 21 Satuan Kerja resmi UNSIL.`
      });
    }

    // 3. Validasi role
    if (!VALID_ROLES.includes(targetRole)) {
      return res.status(422).json({
        status: 422,
        success: false,
        error: 'InvalidRole',
        message: `Role '${targetRole}' tidak valid. Pilihan yang diizinkan: ${VALID_ROLES.join(', ')}.`
      });
    }

    // 4. Eksekusi Mutasi & Manajemen Kredensial via Service
    const mutationResult = await mutateUserJobAssignment({
      userId: id,
      targetUnit,
      role: targetRole,
      role_label: targetLabel,
      email,
      password_baru: targetPassword,
      nama: targetName,
      nama_lengkap: targetName,
      mutated_by: req.user?.role || 'Super Admin'
    });

    // 5. Kembalikan response mutasi berhasil dengan Flash Message baku
    return res.status(200).json({
      status: 200,
      success: true,
      message: mutationResult.flashMessage,
      flashMessage: mutationResult.flashMessage,
      data: {
        ...mutationResult.user,
        mutation_note: note || 'Mutasi struktural/fungsional pegawai oleh Super Admin'
      },
      audit: mutationResult.audit
    });
  } catch (error) {
    console.error('[MUTATION-ERROR]', error);
    return res.status(500).json({
      status: 500,
      success: false,
      error: 'MutationFailed',
      message: 'Gagal melakukan pembaruan mutasi pegawai.',
      details: error.message
    });
  }
};

/**
 * Controller: Tambah User Baru (Super Admin)
 * Endpoint: POST /api/admin/users atau POST /api/admin/users/register
 * 
 * Aturan Bisnis Wajib:
 * 1. Dropdown "Jabatan / Tugas Tambahan":
 *    - Jika memilih "Dosen Biasa / Tanpa Jabatan", set 'is_pejabat = FALSE'
 *      dan ikat 'kode_unit' sesuai unit kerja yang dipilih (Contoh: Fakultas Teknik).
 *    - Jika memilih jabatan struktural, set 'is_pejabat = TRUE'.
 * 2. Hilangkan kolom input password manual. Backend secara otomatis men-generate:
 *    - Username = Diambil dari NIP.
 *    - Password = String acak format 'Unsil' + 4 angka acak (misal: 'Unsil7392')
 *      dan lakukan hashing/enkripsi sebelum disimpan ke database tabel 'users'.
 * 3. Mengembalikan Flash Message / Notifikasi sukses di layar Super Admin:
 *    "User Berhasil Dibuat! Nama: [Nama] | Unit: [Unit] | Jabatan: Dosen Biasa | Username: [NIP] | Password: [Password_Acak]"
 */
export const storeUser = async (req, res) => {
  try {
    const {
      nip,
      nip_nik,
      nama,
      nama_lengkap,
      email,
      kode_unit,
      unit_kerja_id,
      id_unit,
      jabatan,
      tugas_tambahan,
      role,
      password,
      raw_password
    } = req.body;

    const targetNip = String(nip || nip_nik || '').trim();
    const targetNama = String(nama || nama_lengkap || '').trim();
    const targetUnit = String(kode_unit || unit_kerja_id || id_unit || 'UN58.13').trim();
    const targetJabatan = String(jabatan || tugas_tambahan || 'Dosen Biasa / Tanpa Jabatan').trim();

    // 1. Validasi field wajib
    if (!targetNip) {
      return res.status(400).json({
        status: 400,
        success: false,
        error: 'MissingNIP',
        message: 'NIP wajib diisi untuk pembuatan akun pengguna.'
      });
    }

    if (!targetNama) {
      return res.status(400).json({
        status: 400,
        success: false,
        error: 'MissingNama',
        message: 'Nama lengkap beserta gelar wajib diisi.'
      });
    }

    if (!targetUnit) {
      return res.status(400).json({
        status: 400,
        success: false,
        error: 'MissingUnitKerja',
        message: 'Satuan kerja (kode_unit) wajib dipilih.'
      });
    }

    // 2. Validasi kesesuaian unit kerja dengan 21 satker resmi
    if (!VALID_UNSIL_UNITS.includes(targetUnit)) {
      return res.status(422).json({
        status: 422,
        success: false,
        error: 'InvalidUnitCode',
        message: `Kode unit kerja '${targetUnit}' tidak terdaftar pada 21 Satuan Kerja resmi UNSIL.`
      });
    }

    // 3. Eksekusi pembuatan akun melalui service (termasuk auto-generate username dari NIP dan password acak)
    const result = await storeNewUser({
      nip: targetNip,
      nama: targetNama,
      email,
      kode_unit: targetUnit,
      jabatan: targetJabatan,
      role,
      password,
      raw_password
    });

    // 4. Kembalikan respons 201 Created dengan flash message spesifik
    return res.status(201).json({
      status: 201,
      success: true,
      message: result.flashMessage,
      flashMessage: result.flashMessage,
      data: result.user
    });
  } catch (error) {
    console.error('[STORE-USER-ERROR]', error);
    return res.status(500).json({
      status: 500,
      success: false,
      error: 'CreateUserFailed',
      message: 'Gagal membuat akun pengguna baru.',
      details: error.message
    });
  }
};

/**
 * Controller: Ambil Seluruh Data Pengguna Resmi (GET /api/admin/users)
 */
export const getAllStaffUsers = async (req, res) => {
  try {
    const users = await getAllUsersFromDatabase();
    return res.status(200).json({
      status: 200,
      success: true,
      message: 'Daftar seluruh data pengguna kepegawaian resmi berhasil dimuat.',
      total: users.length,
      data: users
    });
  } catch (error) {
    console.error('[GET-USERS-ERROR]', error);
    return res.status(500).json({
      status: 500,
      success: false,
      error: 'FetchUsersFailed',
      message: 'Gagal memuat data pengguna dari basis data.',
      details: error.message
    });
  }
};

/**
 * Controller: Hapus Pengguna dari Sistem (DELETE /api/admin/users/:id)
 */
export const deleteStaffUser = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteUserById(id);
    return res.status(200).json({
      status: 200,
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('[DELETE-USER-ERROR]', error);
    return res.status(400).json({
      status: 400,
      success: false,
      error: 'DeleteUserFailed',
      message: error.message || 'Gagal menghapus pengguna dari sistem.'
    });
  }
};


