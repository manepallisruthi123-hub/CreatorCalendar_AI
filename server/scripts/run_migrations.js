const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { initDb, getDatabase, query } = require('../src/config/database');

async function main() {
  console.log('--- Connecting to database and running migrations ---');
  try {
    await initDb();
    console.log('🎉 Migrations successfully executed!');

    // Verify all public tables in PostgreSQL
    const res = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log('\n--- Tables present in database ---');
    res.rows.forEach(r => console.log('  - ' + r.table_name));

    const db = await getDatabase();
    if (db.end) await db.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

main();
