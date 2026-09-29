/**
 * Helper Kriptografi Kata Sandi (SILOKA UNSIL)
 * Meng-generate password default akun baru dan melakukan hashing menggunakan bcrypt.
 */

import bcrypt from 'bcryptjs';

const BCRYPT_SALT_ROUNDS = 12;

/**
 * Generate password default akun baru:
 * Format: 'Unsil@' diikuti 4 digit terakhir NIP (atau 'Unsil@2026' jika NIP < 4 digit)
 * Contoh: NIP 198802102014041001 -> 'Unsil@1001'
 */
export const generateDefaultPassword = (nip) => {
  const cleanNip = String(nip || '').replace(/\D/g, '');
  if (cleanNip.length >= 4) {
    const last4 = cleanNip.slice(-4);
    return `Unsil@${last4}`;
  }
  return 'Unsil@2026';
};

/**
 * Generate password acak format: 'Unsil' + 4 angka acak (misal: 'Unsil7392')
 * Sesuai aturan modul Tambah User Super Admin
 */
export const generateRandomUnsilPassword = () => {
  const random4Digits = Math.floor(1000 + Math.random() * 9000);
  return `Unsil${random4Digits}`;
};

/**
 * Hash plain text password menggunakan bcrypt (Salt Rounds: 12)
 */
export const hashPassword = async (plainPassword) => {
  const salt = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS);
  return await bcrypt.hash(plainPassword, salt);
};

/**
 * Komparasi password plain text dengan hash tersimpan di basis data
 */
export const comparePassword = async (plainPassword, hashedPassword) => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

