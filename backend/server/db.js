import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { getDefaultPermissions } from './permissions.js';

const db = new Database('quotify.db');
db.pragma('journal_mode = WAL');

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('SuperAdmin','Admin','User')),
      permissions TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS inquiry_sources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_name TEXT UNIQUE NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_name TEXT NOT NULL,
      company_name TEXT,
      mobile TEXT,
      email TEXT,
      gst_number TEXT,
      customer_type TEXT DEFAULT 'retail',
      address TEXT,
      city TEXT,
      state TEXT,
      pin TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS product_groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_name TEXT UNIQUE NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_name TEXT NOT NULL,
      code TEXT,
      group_id INTEGER,
      category TEXT,
      hsn_code TEXT,
      price REAL NOT NULL DEFAULT 0,
      gst_rate REAL NOT NULL DEFAULT 0,
      unit TEXT NOT NULL DEFAULT 'piece',
      stock_quantity REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(group_id) REFERENCES product_groups(id)
    );

    CREATE TABLE IF NOT EXISTS inquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      inquiry_number TEXT UNIQUE NOT NULL,
      customer_name TEXT NOT NULL,
      company TEXT,
      mobile TEXT,
      email TEXT,
      address TEXT,
      city TEXT,
      state TEXT,
      pincode TEXT,
      product_interested TEXT,
      estimated_quantity REAL,
      budget REAL,
      source TEXT,
      status TEXT NOT NULL DEFAULT 'new',
      assigned_to INTEGER,
      follow_up_date TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(assigned_to) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS crm_leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      inquiry_id INTEGER,
      customer_name TEXT NOT NULL,
      company TEXT,
      mobile TEXT,
      email TEXT,
      stage TEXT NOT NULL DEFAULT 'New Lead',
      estimated_value REAL DEFAULT 0,
      lead_source TEXT,
      next_follow_up TEXT,
      assigned_to INTEGER,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(inquiry_id) REFERENCES inquiries(id),
      FOREIGN KEY(assigned_to) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS crm_activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER NOT NULL,
      activity_type TEXT NOT NULL,
      activity_date TEXT NOT NULL,
      description TEXT,
      outcome TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(lead_id) REFERENCES crm_leads(id)
    );

    CREATE TABLE IF NOT EXISTS quotations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quotation_number TEXT UNIQUE NOT NULL,
      customer_id INTEGER,
      customer_name TEXT,
      company_name TEXT,
      assigned_to INTEGER,
      status TEXT NOT NULL DEFAULT 'draft',
      subtotal REAL NOT NULL DEFAULT 0,
      total_discount REAL NOT NULL DEFAULT 0,
      total_gst REAL NOT NULL DEFAULT 0,
      total_amount REAL NOT NULL DEFAULT 0,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(customer_id) REFERENCES customers(id),
      FOREIGN KEY(assigned_to) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS quotation_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quotation_id INTEGER NOT NULL,
      product_id INTEGER,
      description TEXT,
      qty REAL NOT NULL,
      rate REAL NOT NULL,
      discount_pct REAL NOT NULL DEFAULT 0,
      gst_pct REAL NOT NULL DEFAULT 0,
      line_total REAL NOT NULL,
      FOREIGN KEY(quotation_id) REFERENCES quotations(id),
      FOREIGN KEY(product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      reminder_type TEXT NOT NULL,
      reminder_date TEXT NOT NULL,
      assigned_to INTEGER,
      related_quotation_id INTEGER,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(assigned_to) REFERENCES users(id),
      FOREIGN KEY(related_quotation_id) REFERENCES quotations(id)
    );

    CREATE TABLE IF NOT EXISTS company_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      company_name TEXT,
      logo TEXT,
      address TEXT,
      gst_number TEXT,
      email TEXT,
      mobile TEXT,
      quotation_prefix TEXT DEFAULT 'QT-',
      challan_prefix TEXT DEFAULT 'DC-',
      invoice_prefix TEXT DEFAULT 'INV-',
      currency TEXT DEFAULT 'INR',
      default_tax_rate REAL DEFAULT 18,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS challans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      challan_number TEXT UNIQUE NOT NULL,
      quotation_id INTEGER,
      customer_name TEXT,
      status TEXT NOT NULL DEFAULT 'open',
      vehicle_number TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(quotation_id) REFERENCES quotations(id)
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number TEXT UNIQUE NOT NULL,
      quotation_id INTEGER,
      customer_name TEXT,
      total_amount REAL NOT NULL DEFAULT 0,
      amount_paid REAL NOT NULL DEFAULT 0,
      payment_status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(quotation_id) REFERENCES quotations(id)
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      payment_mode TEXT,
      paid_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(invoice_id) REFERENCES invoices(id)
    );

    CREATE TABLE IF NOT EXISTS counters (
      counter_key TEXT PRIMARY KEY,
      counter_value INTEGER NOT NULL DEFAULT 0
    );
  `);

  const userColumns = db.prepare('PRAGMA table_info(users)').all();
  const hasPermissionsCol = userColumns.some((c) => c.name === 'permissions');
  if (!hasPermissionsCol) {
    db.exec('ALTER TABLE users ADD COLUMN permissions TEXT');
  }

  const usersSqlRow = db
    .prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'users'")
    .get();
  const usersSql = String(usersSqlRow?.sql || '');
  const hasSuperAdminRole = usersSql.includes("'SuperAdmin'");
  if (!hasSuperAdminRole) {
    db.exec(`
      PRAGMA foreign_keys = OFF;
      BEGIN TRANSACTION;
      ALTER TABLE users RENAME TO users_old;
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('SuperAdmin','Admin','User')),
        permissions TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      INSERT INTO users (id, name, email, password_hash, role, permissions, is_active, created_at)
      SELECT id, name, email, password_hash, role, permissions, is_active, created_at FROM users_old;
      DROP TABLE users_old;
      COMMIT;
      PRAGMA foreign_keys = ON;
    `);
  }

  const superAdminExists = db.prepare('SELECT id FROM users WHERE email = ?').get('superadmin@quotify.local');
  if (!superAdminExists) {
    const hash = bcrypt.hashSync('superadmin123', 10);
    db.prepare('INSERT INTO users (name, email, password_hash, role, permissions) VALUES (?, ?, ?, ?, ?)')
      .run('Super Admin', 'superadmin@quotify.local', hash, 'SuperAdmin', JSON.stringify(getDefaultPermissions('SuperAdmin')));
  } else {
    // Ensure SuperAdmin is active
    db.prepare('UPDATE users SET is_active = 1 WHERE email = ?').run('superadmin@quotify.local');
  }

  const adminExists = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@quotify.local');
  if (!adminExists) {
    const hash = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO users (name, email, password_hash, role, permissions) VALUES (?, ?, ?, ?, ?)')
      .run('Admin User', 'admin@quotify.local', hash, 'Admin', JSON.stringify(getDefaultPermissions('Admin')));
  }

  const userExists = db.prepare('SELECT id FROM users WHERE email = ?').get('user@quotify.local');
  if (!userExists) {
    const hash = bcrypt.hashSync('user123', 10);
    db.prepare('INSERT INTO users (name, email, password_hash, role, permissions) VALUES (?, ?, ?, ?, ?)')
      .run('Sales User', 'user@quotify.local', hash, 'User', JSON.stringify(getDefaultPermissions('User')));
  }

  const usersWithoutPermissions = db.prepare("SELECT id, role FROM users WHERE permissions IS NULL OR permissions = ''").all();
  const setPermissions = db.prepare('UPDATE users SET permissions = ? WHERE id = ?');
  usersWithoutPermissions.forEach((u) => {
    setPermissions.run(JSON.stringify(getDefaultPermissions(u.role || 'User')), u.id);
  });

  const settings = db.prepare('SELECT id FROM company_settings WHERE id = 1').get();
  if (!settings) {
    db.prepare(
      `INSERT INTO company_settings (
        id, company_name, address, gst_number, email, mobile, quotation_prefix, challan_prefix, invoice_prefix, currency, default_tax_rate
      ) VALUES (1, ?, ?, ?, ?, ?, 'QT-', 'DC-', 'INV-', 'INR', 18)`
    ).run('Quotify Pvt Ltd', '', '', 'admin@quotify.local', '');
  }

  const defaultSources = ['WhatsApp', 'Facebook', 'Exhibition', 'Referral', 'Email'];
  const insertSource = db.prepare('INSERT OR IGNORE INTO inquiry_sources (source_name, is_active) VALUES (?, 1)');
  defaultSources.forEach((source) => insertSource.run(source));
}

export function nextCounter(counterKey) {
  const tx = db.transaction(() => {
    db.prepare('INSERT OR IGNORE INTO counters (counter_key, counter_value) VALUES (?, 0)').run(counterKey);
    db.prepare('UPDATE counters SET counter_value = counter_value + 1 WHERE counter_key = ?').run(counterKey);
    return db.prepare('SELECT counter_value FROM counters WHERE counter_key = ?').get(counterKey).counter_value;
  });

  return tx();
}

export function nextDocNo(prefix, counterKey) {
  const next = nextCounter(counterKey);
  return `${prefix}${String(next).padStart(4, '0')}`;
}

export default db;
