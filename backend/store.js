const fs = require('node:fs');
const path = require('node:path');
async function openStore() {
 let query, close;
 if (process.env.DATABASE_URL) {
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: true } : undefined });
  query = async (sql, args = []) => (await pool.query(sql, args)).rows;
  close = () => pool.end();
 } else {
  const { DatabaseSync } = require('node:sqlite');
  const file = process.env.SQLITE_PATH || path.join(__dirname, 'data/talent.sqlite');
  if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  query = async (sql, args = []) => { const s = db.prepare(sql.replace(/\$\d+/g, '?')); return /^\s*SELECT/i.test(sql) ? s.all(...args) : (s.run(...args), []); };
  close = () => db.close();
 }
 await query('CREATE TABLE IF NOT EXISTS records (kind TEXT NOT NULL, id TEXT NOT NULL, payload TEXT NOT NULL, PRIMARY KEY (kind,id))');
 await query('CREATE TABLE IF NOT EXISTS inquiries (id TEXT PRIMARY KEY, payload TEXT NOT NULL, created_at TEXT NOT NULL)');
 const list = async kind => (await query('SELECT payload FROM records WHERE kind=$1 ORDER BY id', [kind])).map(r => JSON.parse(r.payload));
 const importFixtures = async () => {
  await query('BEGIN');
  try {
   for (const kind of ['skills', 'students', 'projects']) {
    const records = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', kind + '.json'), 'utf8'));
    for (const r of records) await query('INSERT INTO records (kind,id,payload) VALUES ($1,$2,$3) ON CONFLICT (kind,id) DO UPDATE SET payload=excluded.payload', [kind, typeof r === 'string' ? r : r.id, JSON.stringify(r)]);
   }
   await query('COMMIT');
  } catch(e) { await query('ROLLBACK'); throw e; }
 };
 if (!(await list('students')).length) await importFixtures();
 return { list, query, close, importFixtures };
}
module.exports = { openStore };
