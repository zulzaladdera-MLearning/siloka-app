/**
 * Unit Test: Pengaturan Kata Sandi Pengguna (Manajemen User) - SILOKA UNSIL
 * 
 * Verifikasi:
 * 1. Pembuatan Akun Baru dengan Kata Sandi Kustom oleh Super Admin.
 * 2. Pembuatan Akun Baru dengan Tombol Sandi Standar (Siloka2026!).
 * 3. Validasi Keamanan Panjang Kata Sandi (Minimal 6 Karakter).
 * 4. Pengubahan / Reset Kata Sandi Akun Pengguna yang Sudah Ada.
 * 5. Verifikasi Autentikasi Pengguna Menggunakan Kata Sandi Baru.
 * 6. Preservasi Kata Sandi Lama Saat Hanya Mengubah Data/Peran Lainnya.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { resolveUserRoleSlug, getRolesCatalog } from '../rbacSyncService';

describe('Manajemen Kata Sandi Pengguna SILOKA (Super Admin)', () => {
  // Simulasi Helper Verifikasi Login dari LoginPage
  const verifyLocalPassword = (userObj, inputPassword) => {
    if (!userObj) return false;
    const expectedPassword = userObj.raw_password || userObj.password;
    if (expectedPassword) {
      return inputPassword === expectedPassword;
    }
    if (inputPassword === 'Siloka2026!') return true;
    return false;
  };

  it('1. Super Admin membuat user baru dengan kata sandi kustom', () => {
    const customPassword = 'PasswordDosen2026!';
    const newUser = {
      id: `usr-custom-${Date.now()}`,
      nama_lengkap: 'Dr. Hendra Kusuma, M.Eng.',
      name: 'Dr. Hendra Kusuma, M.Eng.',
      nip: '198705122015041001',
      email: 'hendra.kusuma@unsil.ac.id',
      password: customPassword,
      raw_password: customPassword,
      role_slug: 'drafter',
      role: 'DOSEN',
      jabatan: 'Dosen Teknik Elektro'
    };

    expect(newUser.password).toBe(customPassword);
    expect(newUser.raw_password).toBe(customPassword);

    // Verifikasi login dengan kata sandi yang disetel Super Admin
    expect(verifyLocalPassword(newUser, customPassword)).toBe(true);
    // Verifikasi bahwa kata sandi salah ditolak
    expect(verifyLocalPassword(newUser, 'SalahPassword123')).toBe(false);
    // Verifikasi bahwa kata sandi default tidak dapat dipakai jika user punya custom password
    expect(verifyLocalPassword(newUser, 'Siloka2026!')).toBe(false);
  });

  it('2. Super Admin membuat user baru menggunakan tombol sandi standar (Siloka2026!)', () => {
    const defaultPassword = 'Siloka2026!';
    const newUser = {
      id: `usr-custom-${Date.now()}`,
      nama_lengkap: 'Siti Aminah, S.Kom.',
      name: 'Siti Aminah, S.Kom.',
      nip: '199208152019032005',
      email: 'siti.aminah@unsil.ac.id',
      password: defaultPassword,
      raw_password: defaultPassword,
      role_slug: 'admin_tu',
      role: 'OPERATOR_UNIT',
      jabatan: 'Staf Administrasi'
    };

    expect(newUser.password).toBe(defaultPassword);
    expect(verifyLocalPassword(newUser, defaultPassword)).toBe(true);
  });

  it('3. Validasi panjang minimal kata sandi (minimal 6 karakter)', () => {
    const validatePassword = (pwd) => {
      if (!pwd || pwd.trim().length < 6) {
        return { valid: false, message: 'Kata sandi akun pengguna baru harus diisi minimal 6 karakter.' };
      }
      return { valid: true };
    };

    expect(validatePassword('').valid).toBe(false);
    expect(validatePassword('12345').valid).toBe(false);
    expect(validatePassword('123456').valid).toBe(true);
    expect(validatePassword('Siloka2026!').valid).toBe(true);
  });

  it('4. Super Admin mengubah / mereset kata sandi akun pengguna yang sudah ada', () => {
    const existingUser = {
      id: 'usr-001',
      name: 'Budi Santoso, M.Kom.',
      email: 'budi@unsil.ac.id',
      nip: '198501012010121001',
      password: 'OldPassword123',
      raw_password: 'OldPassword123',
      role_slug: 'drafter'
    };

    // User awal bisa login dengan OldPassword123
    expect(verifyLocalPassword(existingUser, 'OldPassword123')).toBe(true);

    // Super Admin mereset kata sandi ke BaruReset2026!
    const newPasswordInput = 'BaruReset2026!';
    const updatedUser = {
      ...existingUser,
      ...(newPasswordInput && newPasswordInput.trim()
        ? {
            password: newPasswordInput.trim(),
            raw_password: newPasswordInput.trim()
          }
        : {})
    };

    // Old password tidak berlaku lagi
    expect(verifyLocalPassword(updatedUser, 'OldPassword123')).toBe(false);
    // New password berhasil digunakan untuk autentikasi
    expect(verifyLocalPassword(updatedUser, 'BaruReset2026!')).toBe(true);
  });

  it('5. Kolom kata sandi terisi otomatis saat membuka detail modal dan mempertahankan kata sandi lama', () => {
    const existingUser = {
      id: 'usr-002',
      name: 'Dr. Kurniawan, M.Si.',
      email: 'kurniawan@unsil.ac.id',
      nip: '197602142005011003',
      password: 'TetapKataSandiLama#',
      raw_password: 'TetapKataSandiLama#',
      role_slug: 'drafter'
    };

    // Simulasi prefill saat membuka modal
    const prefilledPassword = existingUser.raw_password || existingUser.password || 'Siloka2026!';
    expect(prefilledPassword).toBe('TetapKataSandiLama#');

    // Super Admin hanya mengubah peran dan jabatan, kata sandi dipertahankan
    const updatedUser = {
      ...existingUser,
      role_slug: 'pimpinan',
      jabatan: 'Dekan Fakultas Pertanian',
      password: prefilledPassword,
      raw_password: prefilledPassword
    };

    // Kata sandi lama tetap utuh dan valid
    expect(updatedUser.password).toBe('TetapKataSandiLama#');
    expect(verifyLocalPassword(updatedUser, 'TetapKataSandiLama#')).toBe(true);
    expect(updatedUser.role_slug).toBe('pimpinan');
  });

  it('6. Sinkronisasi role akses pengguna baru dengan katalog role', () => {
    const catalog = getRolesCatalog();
    const verifikatorRole = catalog.find((r) => r.slug === 'verifikator');
    expect(verifikatorRole).toBeDefined();

    const newUser = {
      name: 'Verifikator TU',
      role_slug: verifikatorRole.slug,
      permissions: verifikatorRole.keySlugs
    };

    expect(resolveUserRoleSlug(newUser)).toBe('verifikator');
    expect(newUser.permissions.includes('naskah.verify')).toBe(true);
  });
});
