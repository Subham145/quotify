import db from './db.js';
import { connectMongo, getCollection, mongoState } from './mongo.js';

const TABLES = [
  'users',
  'inquiry_sources',
  'customers',
  'product_groups',
  'products',
  'inquiries',
  'crm_leads',
  'crm_activities',
  'quotations',
  'quotation_items',
  'reminders',
  'company_settings',
  'challans',
  'invoices',
  'payments',
  'counters',
];

function readAll(table) {
  return db.prepare(`SELECT * FROM ${table}`).all();
}

export async function syncSqliteToMongo() {
  if (!mongoState.enabled) {
    return { ok: false, skipped: true, reason: 'MONGODB_URI not configured' };
  }

  if (mongoState.syncing) {
    return { ok: false, skipped: true, reason: 'sync already running' };
  }

  mongoState.syncing = true;
  try {
    await connectMongo();

    const counts = {};
    for (const table of TABLES) {
      const rows = readAll(table);
      const collection = getCollection(table);

      await collection.deleteMany({});
      if (rows.length) {
        await collection.insertMany(
          rows.map((r) => ({ ...r, sqlite_id: r.id ?? null, synced_at: new Date() })),
          { ordered: false }
        );
      }

      counts[table] = rows.length;
    }

    mongoState.lastSyncAt = new Date().toISOString();
    mongoState.lastSyncError = null;

    return {
      ok: true,
      syncedAt: mongoState.lastSyncAt,
      counts,
    };
  } catch (err) {
    mongoState.lastSyncError = err.message || String(err);
    return {
      ok: false,
      error: mongoState.lastSyncError,
    };
  } finally {
    mongoState.syncing = false;
  }
}
