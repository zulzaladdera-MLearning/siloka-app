import { query } from '../config/database.js';

async function syncOfficialPejabat() {
  console.log('--- 1. Membersihkan Pejabat Fiktif dari Database master_pejabat ---');
  
  // Hapus Alam Rahmatulloh dan akun-akun yang tidak memiliki akun sah di tabel users / master_user
  const deleteResult = await query(`
    DELETE FROM master_pejabat 
    WHERE nama ILIKE '%Alam Rahmatulloh%'
       OR jabatan ILIKE '%Kepala UPA TIK%'
       OR id = 23;
  `);
  console.log('Jumlah akun fiktif Alam Rahmatulloh yang dihapus:', deleteResult.rowCount);

  // Ambil daftar user resmi yang memiliki peran pimpinan/pejabat dari tabel users
  const officialUsers = await query(`
    SELECT id, nip, nama, jabatan, kode_unit, is_active
    FROM users
    WHERE (is_pejabat = TRUE OR role = 'PEJABAT')
      AND role != 'Super Admin'
      AND is_active = TRUE
    ORDER BY id ASC;
  `);
  console.log('Pejabat resmi di tabel users:', officialUsers.rows.map(u => ({ nip: u.nip, nama: u.nama, jabatan: u.jabatan })));

  // Hapus seluruh pejabat fiktif lain dari master_pejabat yang NIP-nya tidak terdaftar di users resmi
  const cleanupOtherFakes = await query(`
    DELETE FROM master_pejabat
    WHERE nip NOT IN (
      SELECT nip FROM users WHERE (is_pejabat = TRUE OR role = 'PEJABAT') AND role != 'Super Admin'
      UNION
      SELECT nip_nik FROM master_user WHERE role = 'PEJABAT'
    );
  `);
  console.log('Jumlah pejabat mock/fiktif lain yang dibersihkan dari master_pejabat:', cleanupOtherFakes.rowCount);

  // Sinkronkan pejabat resmi ke master_pejabat
  for (const u of officialUsers.rows) {
    await query(`
      INSERT INTO master_pejabat (nip, nama, gelar, nama_gelar, jabatan, kode_unit, is_aktif, is_active)
      VALUES ($1, $2, '', $2, $3, $4, TRUE, TRUE)
      ON CONFLICT (nip) DO UPDATE
      SET nama = EXCLUDED.nama,
          nama_gelar = EXCLUDED.nama_gelar,
          jabatan = EXCLUDED.jabatan,
          kode_unit = EXCLUDED.kode_unit,
          is_aktif = TRUE,
          is_active = TRUE;
    `, [u.nip, u.nama, u.jabatan, u.kode_unit]);
  }

  // Tambahkan juga Ketua Dewan Penyantun jika ada di master_user
  const dpUser = await query(`
    SELECT nip_nik as nip, nama_lengkap as nama, role_label as jabatan, unit_kerja_id as kode_unit
    FROM master_user
    WHERE role = 'PEJABAT' AND unit_kerja_id = 'UN58.DP'
    LIMIT 1;
  `);
  if (dpUser.rows.length > 0) {
    const dp = dpUser.rows[0];
    await query(`
      INSERT INTO master_pejabat (nip, nama, gelar, nama_gelar, jabatan, kode_unit, is_aktif, is_active)
      VALUES ($1, $2, '', $2, $3, $4, TRUE, TRUE)
      ON CONFLICT (nip) DO UPDATE
      SET nama = EXCLUDED.nama,
          nama_gelar = EXCLUDED.nama_gelar,
          jabatan = EXCLUDED.jabatan,
          kode_unit = EXCLUDED.kode_unit,
          is_aktif = TRUE,
          is_active = TRUE;
    `, [dp.nip, dp.nama, dp.jabatan, dp.kode_unit]);
  }

  const finalCheck = await query(`
    SELECT id, nip, nama_gelar, jabatan, kode_unit, is_aktif 
    FROM master_pejabat 
    ORDER BY id ASC;
  `);
  console.log('--- HASIL AKHIR TABEL master_pejabat di PostgreSQL (HANYA PEJABAT RESMI): ---');
  console.log(finalCheck.rows);

  process.exit(0);
}

syncOfficialPejabat().catch((err) => {
  console.error('Error saat sinkronisasi pejabat:', err);
  process.exit(1);
});
