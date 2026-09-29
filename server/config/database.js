/**
 * Konfigurasi Basis Data PostgreSQL (SILOKA UNSIL)
 * Memuat kredensial dari .env (dengan auto-loader bawaan yang tangguh).
 * Dilengkapi dengan Circuit Breaker & Smart Offline Detection agar aplikasi tetap berjalan mulus
 * dalam Hybrid Fallback Mode saat PostgreSQL lokal belum berjalan atau sedang gangguan autentikasi.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';
const { Pool } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Muat variabel lingkungan dari file .env di root proyek jika belum terdefinisi
const loadEnvConfig = () => {
  try {
    const envPath = path.resolve(__dirname, '../../.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      for (const line of content.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          // Hapus tanda kutip jika ada ("val" atau 'val')
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  } catch (err) {
    console.warn('[DATABASE-CONFIG] Gagal membaca file .env secara otomatis:', err.message);
  }
};

loadEnvConfig();

const poolConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_DATABASE || 'siloka_db',
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'siloka123#',
  max: 20, // Maksimum koneksi simultan
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 3000, // Waktu tunggu koneksi
};

// Jika URL koneksi terpadu didefinisikan di .env
if (process.env.DATABASE_URL) {
  poolConfig.connectionString = process.env.DATABASE_URL;
}

export const pool = new Pool(poolConfig);

// Status Koneksi Database & Circuit Breaker State
let isDbOnline = true;
let lastFailureTime = 0;
const COOLDOWN_PERIOD_MS = 20000; // 20 detik sebelum mencoba menyambung kembali jika offline
let hasLoggedOfflineWarning = false;

// Helper untuk mendeteksi error koneksi socket / network / credential auth failure
export const isConnectionError = (err) => {
  if (!err) return false;
  const msg = (err.message || '') + (err.code || '');
  return (
    msg.includes('ECONNREFUSED') ||
    msg.includes('ENOTFOUND') ||
    msg.includes('ETIMEDOUT') ||
    msg.includes('EHOSTUNREACH') ||
    msg.includes('Connection terminated') ||
    msg.includes('password authentication failed') ||
    msg.includes('no pg_hba.conf entry') ||
    err.code === 'ECONNREFUSED' ||
    err.code === 'ETIMEDOUT' ||
    err.code === '28P01' || // INVALID_PASSWORD
    err.code === '28000'    // INVALID_AUTHORIZATION_SPECIFICATION
  );
};

// Cek apakah database saat ini tersedia
export const isDatabaseAvailable = () => {
  if (!isDbOnline) {
    if (Date.now() - lastFailureTime < COOLDOWN_PERIOD_MS) {
      return false;
    }
  }
  return true;
};

// Helper query dengan penanganan error terpusat dan circuit breaker
export const query = async (text, params) => {
  // Jika circuit breaker aktif (DB diketahui offline atau gagal otentikasi)
  if (!isDatabaseAvailable()) {
    const offlineErr = new Error(`PostgreSQL offline/tidak dapat diakses di ${poolConfig.host}:${poolConfig.port} (Circuit Breaker Aktif).`);
    offlineErr.code = 'ECONNREFUSED';
    offlineErr.isConnectionError = true;
    throw offlineErr;
  }

  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;

    // Reset status koneksi menjadi online jika berhasil
    if (!isDbOnline) {
      isDbOnline = true;
      hasLoggedOfflineWarning = false;
      console.log(`[DATABASE] Koneksi PostgreSQL pulih kembali di ${poolConfig.host}:${poolConfig.port}`);
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`[SQL-QUERY] Executed: ${text.slice(0, 80).replace(/\s+/g, ' ')}... | Duration: ${duration}ms | Rows: ${res.rowCount}`);
    }
    return res;
  } catch (err) {
    if (isConnectionError(err)) {
      isDbOnline = false;
      lastFailureTime = Date.now();
      err.isConnectionError = true;

      if (!hasLoggedOfflineWarning) {
        console.warn(`[DATABASE] PostgreSQL offline / otentikasi gagal di ${poolConfig.host}:${poolConfig.port} (${err.message}). Sistem SILOKA otomatis beralih ke Hybrid Fallback Mode (In-Memory & Master Dataset).`);
        hasLoggedOfflineWarning = true;
      }
    } else {
      // Hanya log error jika ini adalah kegagalan query SQL sesungguhnya (syntax, constraint, dll)
      console.error(`[SQL-ERROR] Gagal mengeksekusi query: ${text}`, err.message);
    }
    throw err;
  }
};
