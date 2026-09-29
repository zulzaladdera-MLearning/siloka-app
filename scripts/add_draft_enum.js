import pg from 'pg';

async function addDraftEnum() {
  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:siloka123%23@127.0.0.1:5432/siloka_db';
  const client = new pg.Client({ connectionString });
  await client.connect();

  try {
    await client.query("ALTER TYPE progres_type ADD VALUE IF NOT EXISTS 'DRAFT_MENUNGGU_PARAF';");
    console.log("Successfully added 'DRAFT_MENUNGGU_PARAF' to progres_type enum.");
  } catch (err) {
    console.error("Error adding value to progres_type:", err.message);
  } finally {
    await client.end();
  }
}

addDraftEnum();

