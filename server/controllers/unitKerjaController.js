/**
 * Controller: Manajemen Unit Kerja Resmi SOTK (CRUD Super Admin)
 * Peraturan Rektor Universitas Siliwangi Nomor 3 Tahun 2023
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query, isDatabaseAvailable } from '../config/database.js';
import { sortUnitsByOtk } from '../../src/utils/unitKerjaHelper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Muat data awal unit kerja dari file JSON
let memoryUnits = [];
try {
  const jsonPath = path.resolve(__dirname, '../../src/data/unitKerja.json');
  if (fs.existsSync(jsonPath)) {
    const raw = fs.readFileSync(jsonPath, 'utf8');
    memoryUnits = JSON.parse(raw);
  }
} catch (e) {
  console.warn('[UnitKerjaController] Gagal membaca unitKerja.json:', e.message);
}

/**
 * 1. Ambil Seluruh Data Unit Kerja (GET /api/admin/unit-kerja)
 */
export const getAllUnits = async (req, res) => {
  try {
    if (isDatabaseAvailable()) {
      try {
        // Cek struktur kolom tbl_unit_kerja yang ada di database secara adaptif
        const dbRes = await query(
          `SELECT 
             kode_unit,
             nama_unit,
             COALESCE(singkatan, kode_unit) AS singkatan,
             COALESCE(tipe_unit, 'ORGAN') AS tipe_unit,
             COALESCE(parent_kode, 'UN58') AS parent_kode,
             COALESCE(is_active, true) AS is_active
           FROM tbl_unit_kerja
           ORDER BY kode_unit ASC`
        );
        if (dbRes && Array.isArray(dbRes.rows) && dbRes.rows.length > 0) {
          const mappedRows = dbRes.rows.map((r, idx) => ({
            id: idx + 1,
            ...r
          }));
          const sorted = sortUnitsByOtk(mappedRows);
          return res.status(200).json({
            status: 200,
            success: true,
            total: sorted.length,
            data: sorted
          });
        }
      } catch (err) {
        console.warn('[UnitKerjaController] Query database gagal, menggunakan fallback memori:', err.message);
      }
    }

    const sortedMemory = sortUnitsByOtk(memoryUnits);
    return res.status(200).json({
      status: 200,
      success: true,
      total: sortedMemory.length,
      data: sortedMemory
    });
  } catch (err) {
    return res.status(500).json({
      status: 500,
      success: false,
      error: 'InternalServerError',
      message: 'Gagal mengambil data unit kerja.'
    });
  }
};

/**
 * 2. Tambah Unit Kerja Baru (POST /api/admin/unit-kerja)
 */
export const createUnit = async (req, res) => {
  try {
    const { kode_unit, nama_unit, singkatan, tipe_unit, parent_kode, is_active } = req.body;

    if (!kode_unit || !nama_unit) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: 'Kode unit dan nama unit kerja wajib diisi.'
      });
    }

    const cleanKode = String(kode_unit).trim().toUpperCase();
    const cleanNama = String(nama_unit).trim();
    const cleanSingkatan = singkatan ? String(singkatan).trim().toUpperCase() : cleanKode;
    const cleanTipe = tipe_unit ? String(tipe_unit).trim().toUpperCase() : 'ORGAN';
    const cleanParent = parent_kode ? String(parent_kode).trim() : 'UN58';
    const cleanActive = is_active !== false;

    // Cek duplikasi kode
    const exists = memoryUnits.some((u) => String(u.kode_unit).toUpperCase() === cleanKode);
    if (exists) {
      return res.status(409).json({
        status: 409,
        success: false,
        message: `Unit kerja dengan kode "${cleanKode}" sudah terdaftar dalam sistem.`
      });
    }

    const newId = memoryUnits.length > 0 ? Math.max(...memoryUnits.map((u) => Number(u.id) || 0)) + 1 : 1;
    const newUnit = {
      id: newId,
      kode_unit: cleanKode,
      nama_unit: cleanNama,
      singkatan: cleanSingkatan,
      tipe_unit: cleanTipe,
      parent_kode: cleanParent,
      is_active: cleanActive
    };

    memoryUnits = sortUnitsByOtk([...memoryUnits, newUnit]);

    // Coba simpan ke database jika online
    if (isDatabaseAvailable()) {
      try {
        await query(
          `INSERT INTO tbl_unit_kerja (id, kode_unit, nama_unit, singkatan, tipe_unit, parent_kode, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (kode_unit) DO UPDATE
           SET nama_unit = EXCLUDED.nama_unit, singkatan = EXCLUDED.singkatan, tipe_unit = EXCLUDED.tipe_unit, parent_kode = EXCLUDED.parent_kode, is_active = EXCLUDED.is_active`,
          [newId, cleanKode, cleanNama, cleanSingkatan, cleanTipe, cleanParent, cleanActive]
        );
      } catch (dbErr) {
        console.warn('[UnitKerjaController] Gagal sinkronisasi INSERT ke database:', dbErr.message);
      }
    }

    return res.status(201).json({
      status: 201,
      success: true,
      message: `Unit kerja "${cleanNama}" (${cleanKode}) berhasil ditambahkan.`,
      data: newUnit
    });
  } catch (err) {
    return res.status(500).json({
      status: 500,
      success: false,
      error: 'InternalServerError',
      message: 'Gagal menambahkan unit kerja baru.'
    });
  }
};

/**
 * 3. Perbarui Unit Kerja (PUT /api/admin/unit-kerja/:id)
 */
export const updateUnit = async (req, res) => {
  try {
    const { id } = req.params;
    const { kode_unit, nama_unit, singkatan, tipe_unit, parent_kode, is_active } = req.body;

    const unitIdx = memoryUnits.findIndex(
      (u) => String(u.id) === String(id) || String(u.kode_unit) === String(id)
    );

    if (unitIdx === -1) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: 'Unit kerja tidak ditemukan.'
      });
    }

    const current = memoryUnits[unitIdx];
    const updated = {
      ...current,
      ...(nama_unit !== undefined ? { nama_unit: String(nama_unit).trim() } : {}),
      ...(singkatan !== undefined ? { singkatan: String(singkatan).trim().toUpperCase() } : {}),
      ...(tipe_unit !== undefined ? { tipe_unit: String(tipe_unit).trim().toUpperCase() } : {}),
      ...(parent_kode !== undefined ? { parent_kode: String(parent_kode).trim() } : {}),
      ...(is_active !== undefined ? { is_active: Boolean(is_active) } : {})
    };

    memoryUnits[unitIdx] = updated;

    if (isDatabaseAvailable()) {
      try {
        await query(
          `UPDATE tbl_unit_kerja
           SET nama_unit = $1, singkatan = $2, tipe_unit = $3, parent_kode = $4, is_active = $5
           WHERE id = $6 OR kode_unit = $7`,
          [updated.nama_unit, updated.singkatan, updated.tipe_unit, updated.parent_kode, updated.is_active, current.id, current.kode_unit]
        );
      } catch (dbErr) {
        console.warn('[UnitKerjaController] Gagal sinkronisasi UPDATE ke database:', dbErr.message);
      }
    }

    return res.status(200).json({
      status: 200,
      success: true,
      message: `Data unit kerja "${updated.nama_unit}" berhasil diperbarui.`,
      data: updated
    });
  } catch (err) {
    return res.status(500).json({
      status: 500,
      success: false,
      error: 'InternalServerError',
      message: 'Gagal memperbarui unit kerja.'
    });
  }
};

/**
 * 4. Hapus Unit Kerja (DELETE /api/admin/unit-kerja/:id)
 */
export const deleteUnit = async (req, res) => {
  try {
    const { id } = req.params;

    const unitIdx = memoryUnits.findIndex(
      (u) => String(u.id) === String(id) || String(u.kode_unit) === String(id)
    );

    if (unitIdx === -1) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: 'Unit kerja tidak ditemukan.'
      });
    }

    const removed = memoryUnits.splice(unitIdx, 1)[0];

    if (isDatabaseAvailable()) {
      try {
        await query(
          'DELETE FROM tbl_unit_kerja WHERE id = $1 OR kode_unit = $2',
          [removed.id, removed.kode_unit]
        );
      } catch (dbErr) {
        console.warn('[UnitKerjaController] Gagal sinkronisasi DELETE ke database:', dbErr.message);
      }
    }

    return res.status(200).json({
      status: 200,
      success: true,
      message: `Unit kerja "${removed.nama_unit}" (${removed.kode_unit}) berhasil dihapus.`
    });
  } catch (err) {
    return res.status(500).json({
      status: 500,
      success: false,
      error: 'InternalServerError',
      message: 'Gagal menghapus unit kerja.'
    });
  }
};
