const fs = require('fs');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:siloka123%23@127.0.0.1:5432/siloka_db?sslmode=disable'
});

(async () => {
  try {
    const sql = fs.readFileSync('database/migrations/013_seed_rektor_dan_wakil_rektor_accounts.sql', 'utf8');
    await pool.query(sql);
    const res = await pool.query(
      "SELECT id, nama_lengkap, email, role, role_label FROM master_user WHERE unit_kerja_id = 'UN58' ORDER BY id"
    );
    console.table(res.rows);
  } catch (err) {
    console.error('Migration error:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
