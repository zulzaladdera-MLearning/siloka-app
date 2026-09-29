import pg from 'pg';

async function main() {
  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:siloka123%23@127.0.0.1:5432/siloka_db';
  const client = new pg.Client({ connectionString });
  await client.connect();

  for (const table of ['tbl_role_permissions', 'riwayat_paraf_tte', 'disposisi']) {
    const colRes = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position
    `, [table]);
    console.log(`\nTable ${table}:`);
    console.log(colRes.rows.map(c => `  ${c.column_name} (${c.data_type})`).join('\n'));
  }

  const roleRes = await client.query('SELECT * FROM tbl_roles');
  console.log('\ntbl_roles:', roleRes.rows);

  const permRes = await client.query('SELECT * FROM tbl_role_permissions LIMIT 15');
  console.log('\ntbl_role_permissions sample:', permRes.rows);

  await client.end();
}

main().catch(console.error);

