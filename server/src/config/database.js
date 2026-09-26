const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

let client = null;
let isPgPool = false;

async function getDatabase() {
  if (client) return client;

  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl && databaseUrl.trim().length > 0 && !databaseUrl.includes('USER:PASSWORD')) {
    try {
      const { Pool } = require('pg');
      const pool = new Pool({
        connectionString: databaseUrl,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      });
      // Test connection
      await pool.query('SELECT 1');
      console.log('✅ Connected to external PostgreSQL via DATABASE_URL');
      client = pool;
      isPgPool = true;
      return client;
    } catch (err) {
      console.warn('⚠️ Could not connect to DATABASE_URL, falling back to persistent local PostgreSQL (PGlite):', err.message);
    }
  }

  // Use embedded PostgreSQL (PGlite) with disk persistence
  const { PGlite } = require('@electric-sql/pglite');
  const dataDir = path.join(__dirname, '../../data/pgdata');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const pglite = new PGlite(dataDir);
  console.log('✅ Connected to persistent PostgreSQL (PGlite engine) at', dataDir);
  client = pglite;
  isPgPool = false;
  return client;
}

async function query(text, params = []) {
  const db = await getDatabase();
  try {
    const start = Date.now();
    const res = await db.query(text, params);
    const duration = Date.now() - start;
    if (process.env.DEBUG_SQL === 'true') {
      console.log('Executed query', { text: text.substring(0, 80), duration, rows: res.rowCount || res.rows?.length });
    }
    return {
      rows: res.rows || [],
      rowCount: res.rowCount !== undefined ? res.rowCount : (res.rows ? res.rows.length : 0),
      fields: res.fields || []
    };
  } catch (error) {
    console.error('Database query error:', error.message, '\nQuery:', text, '\nParams:', params);
    throw error;
  }
}

async function initDb() {
  const db = await getDatabase();
  try {
    const migrationsDir = path.join(__dirname, '../db/migrations');
    if (fs.existsSync(migrationsDir)) {
      const files = fs.readdirSync(migrationsDir)
        .filter(f => f.endsWith('.sql'))
        .sort();

      for (const file of files) {
        const filePath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filePath, 'utf8');
        if (isPgPool) {
          await db.query(sql);
        } else {
          await db.exec(sql);
        }
        console.log(`✅ Migration applied: ${file}`);
      }
    }
  } catch (error) {
    console.error('❌ Failed to run database migrations:', error);
    throw error;
  }
}

module.exports = {
  getDatabase,
  query,
  initDb
};
