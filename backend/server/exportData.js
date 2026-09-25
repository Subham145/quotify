import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputFile = path.resolve(__dirname, '../seedData.json');

const TABLES = [
  'roles',
  'users',
  'inquiry_sources',
  'product_categories',
  'product_groups',
  'product_subgroups',
  'products',
  'customers',
  'company_settings',
  'counters',
  'inquiries',
  'crm_leads',
  'crm_activities',
  'follow_ups',
  'attendance',
  'quotations',
  'quotation_items',
  'reminders',
  'challans',
  'invoices',
  'payments'
];

export function exportData() {
  console.log('Exporting database tables to seedData.json...');
  const data = {};
  let totalRows = 0;

  for (const table of TABLES) {
    try {
      const rows = db.prepare(`SELECT * FROM "${table}"`).all();
      data[table] = rows;
      totalRows += rows.length;
      console.log(`- ${table}: ${rows.length} rows`);
    } catch (err) {
      console.warn(`- ${table}: skipped (${err.message})`);
    }
  }

  fs.writeFileSync(outputFile, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`\nSuccessfully exported ${totalRows} total records to: ${outputFile}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  exportData();
}
