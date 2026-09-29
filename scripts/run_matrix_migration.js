import fs from 'fs';
import pg from 'pg';

async function main() {
  const client = new pg.Client({
    connectionString: 'postgresql://postgres:siloka123%23@127.0.0.1:5432/siloka_db'
  });
  await client.connect();

  // Add enum values one by one outside transaction
  try {
    await client.query("ALTER TYPE role_user_enum ADD VALUE IF NOT EXISTS 'DOSEN'");
    console.log('Added DOSEN to role_user_enum');
  } catch (e) {
    console.log('DOSEN enum error/exists:', e.message);
  }

  try {
    await client.query("ALTER TYPE role_user_enum ADD VALUE IF NOT EXISTS 'SUPER_ADMIN'");
    console.log('Added SUPER_ADMIN to role_user_enum');
  } catch (e) {
    console.log('SUPER_ADMIN enum error/exists:', e.message);
  }

  try {
    await client.query("ALTER TYPE tipe_unit_enum ADD VALUE IF NOT EXISTS 'JURUSAN'");
    console.log('Added JURUSAN to tipe_unit_enum');
  } catch (e) {
    console.log('JURUSAN enum error/exists:', e.message);
  }

  // Now read and execute the SQL file
  const sql = fs.readFileSync('database/signatory_matrix_subsystem.sql', 'utf8');
  await client.query(sql);
  console.log('Successfully applied database/signatory_matrix_subsystem.sql');

  const count = await client.query(`
    SELECT role_penandatangan, COUNT(*) as total 
    FROM tbl_matrix_kewenangan 
    GROUP BY role_penandatangan 
    ORDER BY role_penandatangan
  `);
  console.log('Matrix count per role:', count.rows);

  const dekanTypes = await client.query(`
    SELECT kode_jenis_naskah, nama_jenis_naskah 
    FROM tbl_matrix_kewenangan 
    WHERE role_penandatangan = 'DEKAN' 
    ORDER BY kode_jenis_naskah
  `);
  console.log('Dekan allowed types (' + dekanTypes.rows.length + '):', dekanTypes.rows.map(r => r.kode_jenis_naskah));

  const kajurTypes = await client.query(`
    SELECT kode_jenis_naskah, nama_jenis_naskah 
    FROM tbl_matrix_kewenangan 
    WHERE role_penandatangan = 'KETUA_JURUSAN' 
    ORDER BY kode_jenis_naskah
  `);
  console.log('Ketua Jurusan allowed types (' + kajurTypes.rows.length + '):', kajurTypes.rows.map(r => r.kode_jenis_naskah));

  await client.end();
}

main().catch(console.error);

