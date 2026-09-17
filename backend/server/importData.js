import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db, { initDb } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const inputFile = path.resolve(__dirname, '../seedData.json');

export function importSeedData() {
  if (!fs.existsSync(inputFile)) {
    console.log('[Import] No seedData.json found to import.');
    return false;
  }

  // Ensure tables are created first
  initDb();

  console.log('[Import] Importing records from seedData.json...');
  const data = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));
  const tables = Object.keys(data);
  let totalImported = 0;

  const importTx = db.transaction(() => {
    // Temporarily turn off foreign keys to prevent order issues during bulk import
    db.pragma('foreign_keys = OFF');

    for (const table of tables) {
      const rows = data[table];
      if (!Array.isArray(rows) || rows.length === 0) continue;

      let count = 0;
      for (const row of rows) {
        const keys = Object.keys(row);
        const placeholders = keys.map(() => '?').join(', ');
        const columns = keys.map((k) => `"${k}"`).join(', ');
        const values = keys.map((k) => row[k]);

        try {
          const stmt = db.prepare(`INSERT OR REPLACE INTO "${table}" (${columns}) VALUES (${placeholders})`);
          stmt.run(...values);
          count++;
        } catch (err) {
          console.warn(`  Warning in table ${table}:`, err.message);
        }
      }
      totalImported += count;
      console.log(`- ${table}: restored ${count} rows`);
    }

    db.pragma('foreign_keys = ON');
  });

  importTx();
  console.log(`\n[Import] Successfully imported ${totalImported} records into database!`);
  return true;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  importSeedData();
}
