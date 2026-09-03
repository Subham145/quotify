import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import db, { initDb, nextDocNo } from './db.js';
import { buildSessionUser, login, requireAdmin, requireAuth, requirePermission, requireResource, requireSuperAdmin, signToken } from './auth.js';
import { getDefaultPermissions, normalizePermissions, sanitizeUser } from './permissions.js';
import { connectMongo, mongoState } from './mongo.js';
import { syncSqliteToMongo } from './mongoSync.js';
import { computeQuotationTotals, toCsv } from './utils.js';
import puppeteer from 'puppeteer';
import { quotationTemplate } from './templates/quotationTemplate.js';
import { pumpTemplate } from './templates/pumpTemplate.js';
import { motorTemplate } from './templates/motorTemplate.js';
import { industrialTemplate } from './templates/industrialTemplate.js';
import { serviceTemplate } from './templates/serviceTemplate.js';
import { baerlocherTemplate } from './templates/baerlocherTemplate.js';
import { choithramTemplate } from './templates/choithramTemplate.js';
import { greavesTemplate } from './templates/greavesTemplate.js';

initDb();

// Optional MongoDB Atlas integration (SQLite remains source of truth).
if (process.env.MONGODB_URI) {
  connectMongo()
    .then(() => syncSqliteToMongo())
    .catch((err) => {
      mongoState.lastSyncError = err.message || String(err);
      // eslint-disable-next-line no-console
      console.error('Mongo initialization failed:', mongoState.lastSyncError);
    });

  const intervalMs = Number(process.env.MONGO_SYNC_INTERVAL_MS || 120000);
  setInterval(() => {
    syncSqliteToMongo().catch(() => {});
  }, intervalMs);
}

const app = express();
const PORT = Number(process.env.API_PORT || 4000);

app.use(cors());
app.use(express.json());

app.use('/api/users', requireAuth, (req, res, next) => {
  if (req.path === '/assignable') return next();
  return requireSuperAdmin(req, res, next);
});
app.use('/api/roles', requireAuth, requireSuperAdmin);
app.use('/api/follow-ups', requireAuth, requireResource('follow_ups'));
app.use('/api/attendance', requireAuth, requireResource('attendance'));
app.use('/api/product-categories', requireAuth, requireResource('products'));
app.use('/api/inquiry-sources', requireAuth, requireResource('inquiries'));
app.use('/api/inquiries', requireAuth, requireResource('inquiries'));
app.use('/api/crm', requireAuth, requireResource('crm'));
app.use('/api/quotations',(req,res,next)=>{if(req.path.endsWith('/pdf')){return next();}requireAuth(req,res,()=>requireResource('quotations')(req,res,next));});
app.use('/api/customers', requireAuth, requireResource('customers'));
app.use('/api/product-groups', requireAuth, requireResource('product_groups'));
app.use('/api/product-subgroups',requireAuth,requireResource('product_groups'));
app.use('/api/products', requireAuth, requireResource('products'));
app.use('/api/reminders', requireAuth, requireResource('reminders'));
app.use('/api/reports', requireAuth, requirePermission('reports', 'view'));
app.use('/api/settings', requireAuth, requirePermission('settings', 'view'));
app.use('/api/mongo', requireAuth, requireSuperAdmin);

function list(table, orderBy = 'id DESC') {
  return db.prepare(`SELECT * FROM ${table} ORDER BY ${orderBy}`).all();
}

function getById(table, id) {
  return db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id);
}

function safeJson(raw, fallback = {}) {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/mongo/status', (_req, res) => {
  res.json({
    enabled: mongoState.enabled,
    connected: mongoState.connected,
    syncing: mongoState.syncing,
    lastSyncAt: mongoState.lastSyncAt,
    lastSyncError: mongoState.lastSyncError,
  });
});

app.post('/api/mongo/sync', async (_req, res) => {
  const result = await syncSqliteToMongo();
  if (!result.ok && !result.skipped) return res.status(500).json(result);
  return res.json(result);
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
  const user = login(email, password);
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  const token = signToken(user);
  return res.json({ token, user });
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  return res.json(buildSessionUser(user));
});

function roleRow(roleId) {
  if (!roleId) return null;
  return db.prepare('SELECT * FROM roles WHERE id = ?').get(Number(roleId));
}

// Lightweight roster for assignee pickers (any authenticated user).
app.get('/api/users/assignable', (_req, res) => {
  res.json(db.prepare('SELECT id, name, email FROM users WHERE is_active = 1 ORDER BY name ASC').all());
});

app.get('/api/users', (_req, res) => {
  const users = db
    .prepare(
      `SELECT u.*, r.name AS r_name, r.base_role AS r_base
       FROM users u LEFT JOIN roles r ON r.id = u.role_id
       ORDER BY u.id DESC`
    )
    .all()
    .map((u) => ({
      ...sanitizeUser(u),
      role_name: u.r_name || u.role,
      base_role: u.r_base || u.role,
    }));
  res.json(users);
});

app.post('/api/users/invite', (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email) return res.status(400).json({ message: 'Name and email required' });
  if (!password) return res.status(400).json({ message: 'Password is required' });

  let role = roleRow(req.body?.role_id);
  if (!role) role = db.prepare("SELECT * FROM roles WHERE name = 'User' AND is_system = 1").get();
  if (role.base_role === 'SuperAdmin') {
    return res.status(400).json({ message: 'Cannot assign a SuperAdmin role via invite' });
  }

  const hash = bcrypt.hashSync(password, 10);
  const perms = role.permissions || JSON.stringify(getDefaultPermissions(role.base_role));
  try {
    const result = db
      .prepare('INSERT INTO users (name, email, password_hash, role, role_id, permissions) VALUES (?, ?, ?, ?, ?, ?)')
      .run(name, email, hash, role.base_role, role.id, perms);
    const created = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    return res.json({ ...sanitizeUser(created), role_name: role.name });
  } catch (e) {
    return res.status(400).json({ message: e.message });
  }
});

app.patch('/api/users/:id', (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ message: 'User not found' });

  const { name, email, password, is_active } = req.body || {};

  const role = roleRow(req.body?.role_id);
  let nextRoleText = existing.role;
  let nextRoleId = existing.role_id;
  let nextPermissions = existing.permissions || JSON.stringify(getDefaultPermissions(existing.role));
  if (role) {
    nextRoleText = role.base_role;
    nextRoleId = role.id;
    nextPermissions = role.permissions || JSON.stringify(getDefaultPermissions(role.base_role));
  }

  let passwordHash = existing.password_hash;
  if (password) passwordHash = bcrypt.hashSync(password, 10);

  db.prepare(
    `UPDATE users SET
      name = COALESCE(?, name),
      email = COALESCE(?, email),
      role = ?,
      role_id = ?,
      permissions = ?,
      password_hash = ?,
      is_active = COALESCE(?, is_active)
    WHERE id = ?`
  ).run(
    name,
    email,
    nextRoleText,
    nextRoleId,
    nextPermissions,
    passwordHash,
    typeof is_active === 'number' ? is_active : null,
    id
  );

  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  const updatedRole = updated.role_id ? roleRow(updated.role_id) : null;
  return res.json({ ...sanitizeUser(updated), role_name: updatedRole?.name || updated.role });
});

app.delete('/api/users/:id', (req, res) => {
  const id = Number(req.params.id);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  
  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  return res.json({ message: 'User deleted successfully' });
});

app.get('/api/inquiry-sources', requireAuth, (_req, res) => {
  res.json(list('inquiry_sources', 'source_name ASC'));
});

app.post('/api/inquiry-sources', requireAuth, (req, res) => {
  const { source_name } = req.body || {};
  if (!source_name) return res.status(400).json({ message: 'source_name required' });
  const result = db.prepare('INSERT INTO inquiry_sources (source_name, is_active) VALUES (?, 1)').run(source_name);
  return res.json(getById('inquiry_sources', result.lastInsertRowid));
});

app.delete('/api/inquiry-sources/:id', requireAuth, (req, res) => {
  db.prepare('DELETE FROM inquiry_sources WHERE id = ?').run(Number(req.params.id));
  res.json({ ok: true });
});

/* ----------------------------- Roles & permissions ----------------------------- */

app.get('/api/roles', (_req, res) => {
  const rows = db
    .prepare(
      `SELECT r.*, COUNT(u.id) AS user_count
       FROM roles r
       LEFT JOIN users u ON u.role_id = r.id
       GROUP BY r.id
       ORDER BY r.is_system DESC, r.name ASC`
    )
    .all()
    .map((r) => ({ ...r, permissions: normalizePermissions(safeJson(r.permissions), r.base_role) }));
  res.json(rows);
});

app.post('/api/roles', (req, res) => {
  const { name, description, base_role, permissions } = req.body || {};
  if (!name || !name.trim()) return res.status(400).json({ message: 'Role name required' });
  const baseRole = ['Admin', 'User'].includes(base_role) ? base_role : 'User';
  const perms = JSON.stringify(normalizePermissions(permissions || {}, baseRole));
  try {
    const r = db
      .prepare('INSERT INTO roles (name, description, base_role, permissions, is_system) VALUES (?, ?, ?, ?, 0)')
      .run(name.trim(), description || '', baseRole, perms);
    res.json(getById('roles', r.lastInsertRowid));
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

app.patch('/api/roles/:id', (req, res) => {
  const id = Number(req.params.id);
  const role = getById('roles', id);
  if (!role) return res.status(404).json({ message: 'Role not found' });

  const { name, description, base_role, permissions } = req.body || {};
  // System roles: only description + permission matrix are editable.
  const nextName = role.is_system ? role.name : (name?.trim() || role.name);
  const nextBase = role.is_system
    ? role.base_role
    : (['Admin', 'User'].includes(base_role) ? base_role : role.base_role);
  const nextPerms = permissions
    ? JSON.stringify(normalizePermissions(permissions, nextBase))
    : role.permissions;

  db.prepare('UPDATE roles SET name = ?, description = COALESCE(?, description), base_role = ?, permissions = ? WHERE id = ?')
    .run(nextName, description, nextBase, nextPerms, id);

  // Push refreshed permissions/base_role onto users holding this role.
  db.prepare('UPDATE users SET role = ?, permissions = ? WHERE role_id = ?').run(nextBase, nextPerms, id);

  res.json(getById('roles', id));
});

app.delete('/api/roles/:id', (req, res) => {
  const id = Number(req.params.id);
  const role = getById('roles', id);
  if (!role) return res.status(404).json({ message: 'Role not found' });
  if (role.is_system) return res.status(400).json({ message: 'System roles cannot be deleted' });

  const fallback = db.prepare("SELECT * FROM roles WHERE name = 'User' AND is_system = 1").get();
  const tx = db.transaction(() => {
    db.prepare('UPDATE users SET role_id = ?, role = ?, permissions = ? WHERE role_id = ?')
      .run(fallback.id, fallback.base_role, fallback.permissions, id);
    db.prepare('DELETE FROM roles WHERE id = ?').run(id);
  });
  tx();
  res.json({ ok: true });
});

/* ----------------------------- Product categories ----------------------------- */

app.get('/api/product-categories', (_req, res) => {
  res.json(list('product_categories', 'name ASC'));
});

app.post('/api/product-categories', (req, res) => {
  const { name } = req.body || {};
  if (!name || !name.trim()) return res.status(400).json({ message: 'name required' });
  try {
    const r = db.prepare('INSERT INTO product_categories (name, is_active) VALUES (?, 1)').run(name.trim());
    res.json(getById('product_categories', r.lastInsertRowid));
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

app.patch('/api/product-categories/:id', (req, res) => {
  const id = Number(req.params.id);
  const { name, is_active } = req.body || {};
  db.prepare('UPDATE product_categories SET name = COALESCE(?, name), is_active = COALESCE(?, is_active) WHERE id = ?')
    .run(name, typeof is_active === 'number' ? is_active : null, id);
  res.json(getById('product_categories', id));
});

app.delete('/api/product-categories/:id', (req, res) => {
  db.prepare('DELETE FROM product_categories WHERE id = ?').run(Number(req.params.id));
  res.json({ ok: true });
});

/* --------------------------------- Follow-ups --------------------------------- */

function isManager(user) {
  return user?.role === 'Admin' || user?.role === 'SuperAdmin';
}

app.get('/api/follow-ups', (req, res) => {
  const base = `
    SELECT f.*, u.name AS assigned_name, cu.name AS created_by_name,
           i.inquiry_number, i.customer_name AS inquiry_customer,
           l.customer_name AS lead_customer
    FROM follow_ups f
    LEFT JOIN users u ON u.id = f.assigned_to
    LEFT JOIN users cu ON cu.id = f.created_by
    LEFT JOIN inquiries i ON i.id = f.inquiry_id
    LEFT JOIN crm_leads l ON l.id = f.lead_id
  `;
  const rows = isManager(req.user)
    ? db.prepare(`${base} ORDER BY (f.status = 'pending') DESC, f.due_date ASC, f.id DESC`).all()
    : db.prepare(`${base} WHERE f.assigned_to = ? ORDER BY (f.status = 'pending') DESC, f.due_date ASC, f.id DESC`).all(req.user.id);
  res.json(rows);
});

app.get('/api/follow-ups/pending-count', (req, res) => {
  const row = isManager(req.user)
    ? db.prepare("SELECT COUNT(*) AS count FROM follow_ups WHERE status = 'pending'").get()
    : db.prepare("SELECT COUNT(*) AS count FROM follow_ups WHERE status = 'pending' AND assigned_to = ?").get(req.user.id);
  res.json({ count: row.count });
});

app.post('/api/follow-ups', (req, res) => {
  const p = req.body || {};
  if (!p.assigned_to) return res.status(400).json({ message: 'assigned_to required' });
  const r = db
    .prepare(
      `INSERT INTO follow_ups (inquiry_id, lead_id, assigned_to, created_by, title, notes, due_date, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`
    )
    .run(
      p.inquiry_id || null,
      p.lead_id || null,
      Number(p.assigned_to),
      req.user.id,
      p.title || '',
      p.notes || '',
      p.due_date || null
    );
  res.json(getById('follow_ups', r.lastInsertRowid));
});

app.patch('/api/follow-ups/:id', (req, res) => {
  const id = Number(req.params.id);
  const row = getById('follow_ups', id);
  if (!row) return res.status(404).json({ message: 'Follow-up not found' });
  if (!isManager(req.user) && row.assigned_to !== req.user.id) {
    return res.status(403).json({ message: 'You can only update follow-ups assigned to you' });
  }

  const p = req.body || {};
  // Non-managers may not reassign a follow-up.
  const nextAssigned = isManager(req.user) && p.assigned_to ? Number(p.assigned_to) : row.assigned_to;
  const nextStatus = p.status || row.status;
  const completedAt = nextStatus === 'done' ? (row.completed_at || new Date().toISOString()) : null;

  db.prepare(
    `UPDATE follow_ups SET
      title = COALESCE(?, title),
      notes = COALESCE(?, notes),
      due_date = COALESCE(?, due_date),
      status = ?,
      outcome = COALESCE(?, outcome),
      assigned_to = ?,
      completed_at = ?
    WHERE id = ?`
  ).run(p.title, p.notes, p.due_date, nextStatus, p.outcome, nextAssigned, completedAt, id);

  res.json(getById('follow_ups', id));
});

app.delete('/api/follow-ups/:id', (req, res) => {
  db.prepare('DELETE FROM follow_ups WHERE id = ?').run(Number(req.params.id));
  res.json({ ok: true });
});

/* --------------------------------- Attendance --------------------------------- */

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function ensureAttendanceRow(userId, date) {
  db.prepare('INSERT OR IGNORE INTO attendance (user_id, date, status) VALUES (?, ?, ?)').run(userId, date, 'present');
  return db.prepare('SELECT * FROM attendance WHERE user_id = ? AND date = ?').get(userId, date);
}

app.post('/api/attendance/check-in', (req, res) => {
  const date = todayStr();
  const row = ensureAttendanceRow(req.user.id, date);
  const now = new Date().toISOString();
  if (!row.check_in) {
    db.prepare("UPDATE attendance SET check_in = ?, status = 'present' WHERE id = ?").run(now, row.id);
  }
  res.json(db.prepare('SELECT * FROM attendance WHERE id = ?').get(row.id));
});

app.post('/api/attendance/check-out', (req, res) => {
  const date = todayStr();
  const row = ensureAttendanceRow(req.user.id, date);
  const now = new Date().toISOString();
  db.prepare('UPDATE attendance SET check_out = ? WHERE id = ?').run(now, row.id);
  res.json(db.prepare('SELECT * FROM attendance WHERE id = ?').get(row.id));
});

app.get('/api/attendance/today', (req, res) => {
  res.json(db.prepare('SELECT * FROM attendance WHERE user_id = ? AND date = ?').get(req.user.id, todayStr()) || null);
});

app.get('/api/attendance/me', (req, res) => {
  const { from, to } = req.query;
  let sql = 'SELECT * FROM attendance WHERE user_id = ?';
  const params = [req.user.id];
  if (from) { sql += ' AND date >= ?'; params.push(from); }
  if (to) { sql += ' AND date <= ?'; params.push(to); }
  sql += ' ORDER BY date DESC';
  res.json(db.prepare(sql).all(...params));
});

app.get('/api/attendance', (req, res) => {
  if (!isManager(req.user)) return res.status(403).json({ message: 'Admin access required' });
  const { date, user_id, from, to } = req.query;
  let sql = `
    SELECT a.*, u.name AS user_name, u.email AS user_email
    FROM attendance a
    LEFT JOIN users u ON u.id = a.user_id
    WHERE 1 = 1
  `;
  const params = [];
  if (date) { sql += ' AND a.date = ?'; params.push(date); }
  if (user_id) { sql += ' AND a.user_id = ?'; params.push(Number(user_id)); }
  if (from) { sql += ' AND a.date >= ?'; params.push(from); }
  if (to) { sql += ' AND a.date <= ?'; params.push(to); }
  sql += ' ORDER BY a.date DESC, u.name ASC';
  res.json(db.prepare(sql).all(...params));
});

app.post('/api/attendance', (req, res) => {
  if (!isManager(req.user)) return res.status(403).json({ message: 'Admin access required' });
  const p = req.body || {};
  if (!p.user_id || !p.date) return res.status(400).json({ message: 'user_id and date required' });
  const status = ['present', 'absent', 'half_day', 'leave'].includes(p.status) ? p.status : 'present';
  db.prepare(
    `INSERT INTO attendance (user_id, date, status, check_in, check_out, notes, marked_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id, date) DO UPDATE SET
       status = excluded.status,
       check_in = COALESCE(excluded.check_in, attendance.check_in),
       check_out = COALESCE(excluded.check_out, attendance.check_out),
       notes = COALESCE(excluded.notes, attendance.notes),
       marked_by = excluded.marked_by`
  ).run(Number(p.user_id), p.date, status, p.check_in || null, p.check_out || null, p.notes || null, req.user.id);
  res.json(db.prepare('SELECT * FROM attendance WHERE user_id = ? AND date = ?').get(Number(p.user_id), p.date));
});

app.patch('/api/attendance/:id', (req, res) => {
  if (!isManager(req.user)) return res.status(403).json({ message: 'Admin access required' });
  const id = Number(req.params.id);
  const row = getById('attendance', id);
  if (!row) return res.status(404).json({ message: 'Attendance not found' });
  const p = req.body || {};
  const status = ['present', 'absent', 'half_day', 'leave'].includes(p.status) ? p.status : null;
  db.prepare(
    `UPDATE attendance SET
      status = COALESCE(?, status),
      check_in = COALESCE(?, check_in),
      check_out = COALESCE(?, check_out),
      notes = COALESCE(?, notes),
      marked_by = ?
    WHERE id = ?`
  ).run(status, p.check_in, p.check_out, p.notes, req.user.id, id);
  res.json(getById('attendance', id));
});

app.delete('/api/attendance/:id', (req, res) => {
  if (!isManager(req.user)) return res.status(403).json({ message: 'Admin access required' });
  const id = Number(req.params.id);
  const row = getById('attendance', id);
  if (!row) return res.status(404).json({ message: 'Attendance not found' });
  db.prepare('DELETE FROM attendance WHERE id = ?').run(id);
  res.json({ ok: true });
});

app.get('/api/customers', requireAuth, (req, res) => {
  const q = req.query.q ? `%${String(req.query.q).trim()}%` : null;
  if (!q) return res.json(list('customers', 'id DESC'));
  const rows = db
    .prepare(
      `SELECT * FROM customers
       WHERE customer_name LIKE ? OR company_name LIKE ? OR mobile LIKE ?
       ORDER BY id DESC`
    )
    .all(q, q, q);
  res.json(rows);
});

app.post('/api/customers', requireAuth, (req, res) => {
  const p = req.body || {};
  const r = db
    .prepare(
      `INSERT INTO customers (customer_name, company_name, mobile, email, gst_number, customer_type, address, city, state, pin)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      p.customer_name,
      p.company_name || '',
      p.mobile || '',
      p.email || '',
      p.gst_number || '',
      p.customer_type || 'retail',
      p.address || '',
      p.city || '',
      p.state || '',
      p.pin || ''
    );
  res.json(getById('customers', r.lastInsertRowid));
});

app.patch('/api/customers/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const p = req.body || {};
  db.prepare(
    `UPDATE customers SET
      customer_name = COALESCE(?, customer_name),
      company_name = COALESCE(?, company_name),
      mobile = COALESCE(?, mobile),
      email = COALESCE(?, email),
      gst_number = COALESCE(?, gst_number),
      customer_type = COALESCE(?, customer_type),
      address = COALESCE(?, address),
      city = COALESCE(?, city),
      state = COALESCE(?, state),
      pin = COALESCE(?, pin)
    WHERE id = ?`
  ).run(
    p.customer_name,
    p.company_name,
    p.mobile,
    p.email,
    p.gst_number,
    p.customer_type,
    p.address,
    p.city,
    p.state,
    p.pin,
    id
  );
  res.json(getById('customers', id));
});

app.delete('/api/customers/:id', requireAuth, (req,res)=>{

const id = Number(req.params.id);

db.prepare(`
UPDATE quotations
SET customer_id = NULL
WHERE customer_id = ?
`).run(id);

db.prepare(`
DELETE FROM crm_leads
WHERE customer_name IN (
SELECT customer_name
FROM customers
WHERE id = ?
)
`).run(id);

db.prepare(`
DELETE FROM customers
WHERE id = ?
`).run(id);

res.json({
ok:true
});

});


app.get('/api/product-groups', requireAuth, (_req, res) => {
  const rows = db
    .prepare(
      `SELECT g.*, COUNT(p.id) AS product_count
       FROM product_groups g
       LEFT JOIN products p ON p.group_id = g.id
       GROUP BY g.id
       ORDER BY g.group_name ASC`
    )
    .all();
  res.json(rows);
});
  // PRODUCT SUBGROUPS

app.get('/api/product-subgroups',
requireAuth,
(req,res)=>{

const rows =
db.prepare(
`
SELECT
s.*,
g.group_name

FROM product_subgroups s

LEFT JOIN product_groups g
ON g.id=s.group_id

ORDER BY s.id DESC
`
).all();

res.json(rows);

});


app.post(
'/api/product-subgroups',
requireAuth,
(req,res)=>{

const {
subgroup_name,
group_id
}=req.body;

const r=
db.prepare(
`
INSERT INTO
product_subgroups
(
subgroup_name,
group_id,
is_active
)

VALUES
(?,?,1)
`
)

.run(
subgroup_name,
group_id
);

res.json({

id:r.lastInsertRowid

});

});


app.delete(
'/api/product-subgroups/:id',
requireAuth,
(req,res)=>{
  const id = Number(req.params.id);
  const tx = db.transaction(() => {
    db.prepare('UPDATE products SET subgroup_id = NULL WHERE subgroup_id = ?').run(id);
    db.prepare('DELETE FROM product_subgroups WHERE id = ?').run(id);
  });
  tx();
  res.json({ ok: true });
});

app.post('/api/product-groups', requireAuth, (req, res) => {
  const { group_name } = req.body || {};
  if (!group_name) return res.status(400).json({ message: 'group_name required' });
  const r = db.prepare('INSERT INTO product_groups (group_name, is_active) VALUES (?, 1)').run(group_name);
  res.json(getById('product_groups', r.lastInsertRowid));
});

app.patch('/api/product-groups/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const { group_name, is_active } = req.body || {};
  db.prepare('UPDATE product_groups SET group_name = COALESCE(?, group_name), is_active = COALESCE(?, is_active) WHERE id = ?')
    .run(group_name, typeof is_active === 'number' ? is_active : null, id);
  res.json(getById('product_groups', id));
});

app.delete('/api/product-groups/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const tx = db.transaction(() => {
    db.prepare('UPDATE products SET group_id = NULL WHERE group_id = ?').run(id);
    db.prepare('DELETE FROM product_subgroups WHERE group_id = ?').run(id);
    db.prepare('DELETE FROM product_groups WHERE id = ?').run(id);
  });
  tx();
  res.json({ ok: true });
});

app.get('/api/products', requireAuth, (req, res) => {
  const groupId = req.query.group_id ? Number(req.query.group_id) : null;
  const rows = groupId
    ? db
        .prepare(
          `SELECT p.*, g.group_name
           FROM products p LEFT JOIN product_groups g ON g.id = p.group_id
           WHERE p.group_id = ?
           ORDER BY p.id DESC`
        )
        .all(groupId)
    : db
        .prepare(
          `SELECT p.*, g.group_name
           FROM products p LEFT JOIN product_groups g ON g.id = p.group_id
           ORDER BY p.id DESC`
        )
        .all();
  res.json(rows);
});

app.get('/api/products/export/csv', requireAuth, (_req, res) => {
  const rows = db
    .prepare('SELECT product_name, code, category, hsn_code, price, gst_rate, unit, stock_quantity FROM products ORDER BY id DESC')
    .all();
  res.header('Content-Type', 'text/csv');
  res.header('Content-Disposition', 'attachment; filename="products.csv"');
  res.send(toCsv(rows));
});

app.post('/api/products', requireAuth, (req, res) => {

  const p = req.body || {};

  const r = db.prepare(

`
INSERT INTO products (

product_name,
code,
group_id,
subgroup_id,
category,
hsn_code,
price,
gst_rate,
unit,
stock_quantity

)

VALUES (

?,
?,
?,
?,
?,
?,
?,
?,
?,
?

)

`

)

.run(

p.product_name,

p.code || '',

p.group_id || null,

p.subgroup_id || null,

p.category || '',

p.hsn_code || '',

Number(
p.price || 0
),

Number(
p.gst_rate || 0
),

p.unit || 'piece',

Number(
p.stock_quantity || 0
)

);

res.json(

getById(
'products',
r.lastInsertRowid
)

);

});
app.patch('/api/products/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const p = req.body || {};
  db.prepare(
    `UPDATE products SET
product_name = COALESCE(?, product_name),
code = COALESCE(?, code),
group_id = COALESCE(?, group_id),
subgroup_id = COALESCE(?, subgroup_id),
category = COALESCE(?, category),
hsn_code = COALESCE(?, hsn_code),
price = COALESCE(?, price),
gst_rate = COALESCE(?, gst_rate),
unit = COALESCE(?, unit),
stock_quantity = COALESCE(?, stock_quantity)
    WHERE id = ?`
  ).run(
    p.product_name,
    p.code,
    p.group_id,
    p.subgroup_id,
    p.category,
    p.hsn_code,
    p.price,
    p.gst_rate,
    p.unit,
    p.stock_quantity,
    id
  );
  res.json(getById('products', id));
});

app.delete('/api/products/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const used = db.prepare('SELECT COUNT(*) AS c FROM quotation_items WHERE product_id = ?').get(id).c;
  if (used > 0) {
    return res.status(409).json({
      message: `This product is used in ${used} quotation item(s). Remove it from those quotations first.`,
      code: 'PRODUCT_IN_USE',
    });
  }
  db.prepare('DELETE FROM products WHERE id = ?').run(id);
  res.json({ ok: true });
});

app.get('/api/inquiries/stats', requireAuth, (_req, res) => {
  const rows = db
    .prepare('SELECT status, COUNT(*) AS count FROM inquiries GROUP BY status')
    .all();
  const out = { total: 0, new: 0, follow_up: 0, converted: 0, lost: 0 };
  rows.forEach((r) => {
    out.total += r.count;
    out[r.status] = r.count;
  });
  res.json(out);
});

app.get('/api/inquiries', requireAuth, (req, res) => {
  const where = req.user.role === 'Admin' ? '' : 'WHERE i.assigned_to = ?';
  const query = `
    SELECT i.*, u.name AS assigned_name
    FROM inquiries i
    LEFT JOIN users u ON u.id = i.assigned_to
    ${where}
    ORDER BY i.id DESC
  `;
  const rows = req.user.role === 'Admin' ? db.prepare(query).all() : db.prepare(query).all(req.user.id);
  res.json(rows);
});

app.post('/api/inquiries', requireAuth, (req, res) => {
  const p = req.body || {};
  const inqNo = nextDocNo('INQ-', 'inquiry_no');
  const assigned = p.assigned_to || req.user.id;

  const tx = db.transaction(() => {
    const result = db
      .prepare(
        `INSERT INTO inquiries (
          inquiry_number, customer_name, company, mobile, email, address, city, state, pincode,
          product_interested, estimated_quantity, budget, source, status, assigned_to, follow_up_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        inqNo,
        p.customer_name,
        p.company || '',
        p.mobile || '',
        p.email || '',
        p.address || '',
        p.city || '',
        p.state || '',
        p.pincode || '',
        p.product_interested || '',
        Number(p.estimated_quantity || 0),
        Number(p.budget || 0),
        p.source || '',
        p.status || 'new',
        assigned,
        p.follow_up_date || null
      );

       const existingCustomer = db.prepare(

`SELECT id
FROM customers
WHERE lower(customer_name)=lower(?)
LIMIT 1`

).get(
p.customer_name
);

if(

p.customer_name
&&
!existingCustomer

){

db.prepare(

`INSERT INTO customers(

customer_name,
company_name,
mobile,
email,
customer_type

)

VALUES(

?,
?,
?,
?,
?

)`

).run(

p.customer_name,

p.company || '',

p.mobile || '',

p.email || '',

'retail'

);

}
   db.prepare(
      `INSERT INTO crm_leads (inquiry_id, customer_name, company, mobile, email, stage, estimated_value, lead_source, next_follow_up, assigned_to)
       VALUES (?, ?, ?, ?, ?, 'New Lead', ?, ?, ?, ?)`
    ).run(
      result.lastInsertRowid,
      p.customer_name,
      p.company || '',
      p.mobile || '',
      p.email || '',
      Number(p.budget || 0),
      p.source || '',
      p.follow_up_date || null,
      assigned
    );

    return result.lastInsertRowid;
  });

  const id = tx();
  res.json(getById('inquiries', id));
});

app.patch('/api/inquiries/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const p = req.body || {};
  db.prepare(
    `UPDATE inquiries SET
      customer_name = COALESCE(?, customer_name),
      company = COALESCE(?, company),
      mobile = COALESCE(?, mobile),
      email = COALESCE(?, email),
      address = COALESCE(?, address),
      city = COALESCE(?, city),
      state = COALESCE(?, state),
      pincode = COALESCE(?, pincode),
      product_interested = COALESCE(?, product_interested),
      estimated_quantity = COALESCE(?, estimated_quantity),
      budget = COALESCE(?, budget),
      source = COALESCE(?, source),
      status = COALESCE(?, status),
      assigned_to = COALESCE(?, assigned_to),
      follow_up_date = COALESCE(?, follow_up_date)
    WHERE id = ?`
  ).run(
    p.customer_name,
    p.company,
    p.mobile,
    p.email,
    p.address,
    p.city,
    p.state,
    p.pincode,
    p.product_interested,
    p.estimated_quantity,
    p.budget,
    p.source,
    p.status,
    p.assigned_to,
    p.follow_up_date,
    id
  );
  res.json({ ok:true });

});

app.delete('/api/inquiries/:id', requireAuth, (req,res)=>{

const id = Number(req.params.id);

db.prepare(`
DELETE FROM crm_leads
WHERE inquiry_id = ?
`).run(id);

db.prepare(`
DELETE FROM inquiries
WHERE id = ?
`).run(id);

res.json({
ok:true
});

});
app.post('/api/inquiries/:id/convert-to-quotation', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const inquiry = getById('inquiries', id);
  if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });

  const settings = db.prepare('SELECT * FROM company_settings WHERE id = 1').get();
  const prefix = settings?.quotation_prefix || 'QT-';
  const quotationNumber = nextDocNo(prefix, 'quotation_no');

  const existingCustomer = db
    .prepare('SELECT * FROM customers WHERE lower(company_name) = lower(?) LIMIT 1')
    .get(inquiry.company || '');

  const tx = db.transaction(() => {
    let customerId = existingCustomer?.id || null;
    if (!customerId) {
      const c = db
        .prepare(
          `INSERT INTO customers (customer_name, company_name, mobile, email, address, city, state, pin)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          inquiry.customer_name,
          inquiry.company || '',
          inquiry.mobile || '',
          inquiry.email || '',
          inquiry.address || '',
          inquiry.city || '',
          inquiry.state || '',
          inquiry.pincode || ''
        );
      customerId = c.lastInsertRowid;
    }

    const q = db
      .prepare(
        `INSERT INTO quotations (
quotation_number,
customer_id,
customer_name,
company_name,
assigned_to,
status,
subtotal,
total_discount,
total_gst,
total_amount,
template_type
)
VALUES (?, ?, ?, ?, ?, 'draft', 0, 0, 0, 0, 'pump')`
      )
      .run(
  quotationNumber,
  customerId,
  inquiry.customer_name,
  inquiry.company || '',
  inquiry.assigned_to || req.user.id
);

    db.prepare("UPDATE inquiries SET status = 'converted' WHERE id = ?").run(id);
    return q.lastInsertRowid;
  });

  const quotationId = tx();
  res.json({ quotation: getById('quotations', quotationId) });
});

app.get('/api/crm/leads', requireAuth, (req, res) => {
  const where = req.user.role === 'Admin' ? '' : 'WHERE assigned_to = ?';
  const query = `SELECT * FROM crm_leads ${where} ORDER BY id DESC`;
  const rows = req.user.role === 'Admin' ? db.prepare(query).all() : db.prepare(query).all(req.user.id);
  res.json(rows);
});

app.patch('/api/crm/leads/:id/stage', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const { stage } = req.body || {};
  db.prepare('UPDATE crm_leads SET stage = ? WHERE id = ?').run(stage, id);
  res.json(getById('crm_leads', id));
});

app.delete('/api/crm/leads/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const lead = getById('crm_leads', id);
  if (!lead) return res.status(404).json({ message: 'Lead not found' });
  const tx = db.transaction(() => {
    db.prepare('DELETE FROM crm_activities WHERE lead_id = ?').run(id);
    db.prepare('DELETE FROM follow_ups WHERE lead_id = ?').run(id);
    db.prepare('DELETE FROM crm_leads WHERE id = ?').run(id);
  });
  tx();
  res.json({ ok: true });
});

app.get('/api/crm/leads/:id/activities', requireAuth, (req, res) => {
  const rows = db
    .prepare('SELECT * FROM crm_activities WHERE lead_id = ? ORDER BY activity_date DESC, id DESC')
    .all(Number(req.params.id));
  res.json(rows);
});

app.post('/api/crm/leads/:id/activities', requireAuth, (req, res) => {
  const leadId = Number(req.params.id);
  const p = req.body || {};
  const r = db
    .prepare(
      'INSERT INTO crm_activities (lead_id, activity_type, activity_date, description, outcome) VALUES (?, ?, ?, ?, ?)'
    )
    .run(leadId, p.activity_type || 'Note', p.activity_date || new Date().toISOString(), p.description || '', p.outcome || '');
  res.json(getById('crm_activities', r.lastInsertRowid));
});

app.get('/api/quotations', requireAuth, (req, res) => {
  const where = req.user.role === 'Admin' ? '' : 'WHERE q.assigned_to = ?';
  const query = `
    SELECT q.*, u.name AS assigned_name
    FROM quotations q
    LEFT JOIN users u ON u.id = q.assigned_to
    ${where}
    ORDER BY q.id DESC
  `;
  const rows = req.user.role === 'Admin' ? db.prepare(query).all() : db.prepare(query).all(req.user.id);
  res.json(rows);
});

app.get('/api/quotations/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const quotation = getById('quotations', id);
  if (!quotation) return res.status(404).json({ message: 'Not found' });
  const items = db.prepare('SELECT * FROM quotation_items WHERE quotation_id = ? ORDER BY id ASC').all(id);
  res.json({ ...quotation, items });
});

app.post('/api/quotations', requireAuth, (req, res) => {
  const p = req.body || {};
console.log('QUOTATION PAYLOAD =>');
console.log(JSON.stringify(req.body, null, 2));
  const settings = db.prepare('SELECT * FROM company_settings WHERE id = 1').get();
  const prefix = settings?.quotation_prefix || 'QT-';
  const quotationNumber = p.quotation_number || nextDocNo(prefix, 'quotation_no');
  const templateType = p.template_type || 'pump';
  if (p.company_name && !p.allow_duplicate_company) {
    const dup = db
      .prepare('SELECT id, quotation_number FROM quotations WHERE lower(company_name) = lower(?) LIMIT 1')
      .get(p.company_name);
    if (dup) {
      return res.status(409).json({
        message: 'Duplicate company detected',
        duplicate: dup,
        code: 'DUPLICATE_COMPANY',
      });
    }
  }

  const totals = computeQuotationTotals(p.items || []);

  const tx = db.transaction(() => {
    const q = db
      .prepare(
`INSERT INTO quotations (
  quotation_number,
  customer_id,
  customer_name,
  company_name,
  assigned_to,
  status,
  subtotal,
  total_discount,
  total_gst,
  total_amount,
  notes,
  template_type,
attention_person,
subject,
application,
flow,
head
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

)
.run(
  quotationNumber,
  p.customer_id || null,
  p.customer_name || '',
  p.company_name || '',
  p.assigned_to || req.user.id,
  p.status || 'draft',
  totals.subtotal,
  totals.totalDiscount,
  totals.totalGst,
  totals.totalAmount,
  p.notes || '',
templateType,
p.attention_person || '',
p.subject || '',
p.application || '',
p.flow || '',
p.head || ''
);
const insertItem = db.prepare(
  `INSERT INTO quotation_items (
    quotation_id,
    product_id,
    description,
    qty,
    rate,
    discount_pct,
    gst_pct,
    line_total,
    model,
    motor_hp,
    head,
    flow_rate,
    size
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
);

totals.items.forEach((item) => {
  insertItem.run(
    q.lastInsertRowid,
    item.product_id,
    item.description,
    item.qty,
    item.rate,
    item.discount_pct,
    item.gst_pct,
    item.line_total,
    item.model || '',
    item.motor_hp || '',
    item.head || '',
    item.flow_rate || '',
    item.size || ''
  );
});
    return q.lastInsertRowid;
  });

  const id = tx();
  res.json({ id, quotation_number: quotationNumber, ...totals });
});

app.patch('/api/quotations/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const p = req.body || {};
  const hasItems = Array.isArray(p.items);

  const tx = db.transaction(() => {
    if (hasItems) {
      const totals = computeQuotationTotals(p.items);
      db.prepare(
        `UPDATE quotations SET
          customer_id = COALESCE(?, customer_id),
          customer_name = COALESCE(?, customer_name),
          company_name = COALESCE(?, company_name),
          assigned_to = COALESCE(?, assigned_to),
          status = COALESCE(?, status),
          notes = COALESCE(?, notes),
          subtotal = ?,
          total_discount = ?,
          total_gst = ?,
          total_amount = ?
        WHERE id = ?`
      ).run(
        p.customer_id,
        p.customer_name,
        p.company_name,
        p.assigned_to,
        p.status,
        p.notes,
        totals.subtotal,
        totals.totalDiscount,
        totals.totalGst,
        totals.totalAmount,
        id
      );

      db.prepare('DELETE FROM quotation_items WHERE quotation_id = ?').run(id);
const insertItem = db.prepare(
  `INSERT INTO quotation_items (
    quotation_id,
    product_id,
    description,
    qty,
    rate,
    discount_pct,
    gst_pct,
    line_total,
    model,
    motor_hp,
    head,
    flow_rate,
    size
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
);

totals.items.forEach((item) => {
  insertItem.run(
    id,
    item.product_id,
    item.description,
    item.qty,
    item.rate,
    item.discount_pct,
    item.gst_pct,
    item.line_total,
    item.model || '',
    item.motor_hp || '',
    item.head || '',
    item.flow_rate || '',
    item.size || ''
  );
});

    } else {
      db.prepare(
        `UPDATE quotations SET
          customer_id = COALESCE(?, customer_id),
          customer_name = COALESCE(?, customer_name),
          company_name = COALESCE(?, company_name),
          assigned_to = COALESCE(?, assigned_to),
          status = COALESCE(?, status),
          notes = COALESCE(?, notes)
        WHERE id = ?`
      ).run(p.customer_id, p.customer_name, p.company_name, p.assigned_to, p.status, p.notes, id);
    }
  });

  tx();
  res.json(getById('quotations', id));
});

app.delete('/api/quotations/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const tx = db.transaction(() => {

db.prepare(
'DELETE FROM quotation_items WHERE quotation_id = ?'
).run(id);

db.prepare(
'DELETE FROM reminders WHERE related_quotation_id = ?'
).run(id);

db.prepare(
'DELETE FROM invoices WHERE quotation_id = ?'
).run(id);

db.prepare(
'DELETE FROM challans WHERE quotation_id = ?'
).run(id);

db.prepare(
'DELETE FROM quotations WHERE id = ?'
).run(id);

});
  tx();
  res.json({ ok: true });
});

app.post('/api/quotations/:id/duplicate', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const quotation = getById('quotations', id);
  if (!quotation) return res.status(404).json({ message: 'Not found' });

  const items = db.prepare('SELECT * FROM quotation_items WHERE quotation_id = ?').all(id);
  const settings = db.prepare('SELECT * FROM company_settings WHERE id = 1').get();
  const newNumber = nextDocNo(settings?.quotation_prefix || 'QT-', 'quotation_no');

  const tx = db.transaction(() => {
    const q = db
      .prepare(
        `INSERT INTO quotations (
          quotation_number, customer_id, customer_name, company_name, assigned_to, status,
          subtotal, total_discount, total_gst, total_amount, notes
        ) VALUES (?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?)`
      )
      .run(
        newNumber,
        quotation.customer_id,
        quotation.customer_name,
        quotation.company_name,
        quotation.assigned_to,
        quotation.subtotal,
        quotation.total_discount,
        quotation.total_gst,
        quotation.total_amount,
        quotation.notes || ''
      );

const ins = db.prepare(
  `INSERT INTO quotation_items (
    quotation_id,
    product_id,
    description,
    qty,
    rate,
    discount_pct,
    gst_pct,
    line_total,
    model,
    motor_hp,
    head,
    flow_rate,
    size
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
);

items.forEach((item) => {
  ins.run(
    q.lastInsertRowid,
    item.product_id,
    item.description,
    item.qty,
    item.rate,
    item.discount_pct,
    item.gst_pct,
    item.line_total,
    item.model || '',
    item.motor_hp || '',
    item.head || '',
    item.flow_rate || '',
    item.size || ''
  );
});
    return q.lastInsertRowid;
  });

  const newId = tx();
  res.json(getById('quotations', newId));
});

app.post('/api/quotations/:id/convert-to-invoice', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const quotation = getById('quotations', id);
  if (!quotation) return res.status(404).json({ message: 'Not found' });

  const settings = db.prepare('SELECT * FROM company_settings WHERE id = 1').get();
  const invoiceNo = nextDocNo(settings?.invoice_prefix || 'INV-', 'invoice_no');

  const r = db
    .prepare(
      `INSERT INTO invoices (invoice_number, quotation_id, customer_name, total_amount, amount_paid, payment_status)
       VALUES (?, ?, ?, ?, 0, 'pending')`
    )
    .run(invoiceNo, id, quotation.customer_name || quotation.company_name || '', quotation.total_amount);

  db.prepare("UPDATE quotations SET status = 'converted' WHERE id = ?").run(id);
  res.json(getById('invoices', r.lastInsertRowid));
});

app.post('/api/quotations/:id/convert-to-challan', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const quotation = getById('quotations', id);
  if (!quotation) return res.status(404).json({ message: 'Not found' });

  const settings = db.prepare('SELECT * FROM company_settings WHERE id = 1').get();
  const challanNo = nextDocNo(settings?.challan_prefix || 'DC-', 'challan_no');

  const r = db
    .prepare('INSERT INTO challans (challan_number, quotation_id, customer_name, status, vehicle_number) VALUES (?, ?, ?, ?, ?)')
    .run(challanNo, id, quotation.customer_name || quotation.company_name || '', 'open', req.body?.vehicle_number || '');

  res.json(getById('challans', r.lastInsertRowid));
});

app.post('/api/quotations/:id/set-reminder', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const quotation = getById('quotations', id);
  if (!quotation) return res.status(404).json({ message: 'Not found' });

  const reminderDate = req.body?.reminder_date;
  if (!reminderDate) return res.status(400).json({ message: 'reminder_date required' });

  const r = db
    .prepare(
      `INSERT INTO reminders (title, reminder_type, reminder_date, assigned_to, related_quotation_id, status)
       VALUES (?, 'Quotation Follow-up', ?, ?, ?, 'pending')`
    )
    .run(`Follow-up ${quotation.quotation_number}`, reminderDate, quotation.assigned_to || req.user.id, id);

  res.json(getById('reminders', r.lastInsertRowid));
});

app.get('/api/reminders', requireAuth, (req, res) => {
  const where = req.user.role === 'Admin' ? '' : 'WHERE r.assigned_to = ?';
  const rows = (req.user.role === 'Admin'
    ? db
        .prepare(
          `SELECT r.*, u.name as assigned_name
           FROM reminders r
           LEFT JOIN users u ON u.id = r.assigned_to
           ORDER BY r.reminder_date ASC`
        )
        .all()
    : db
        .prepare(
          `SELECT r.*, u.name as assigned_name
           FROM reminders r
           LEFT JOIN users u ON u.id = r.assigned_to
           WHERE r.assigned_to = ?
           ORDER BY r.reminder_date ASC`
        )
        .all(req.user.id)
  ).map((r) => {
    if (r.status === 'pending' && new Date(r.reminder_date) < new Date()) {
      return { ...r, status: 'overdue' };
    }
    return r;
  });

  res.json(rows);
});

app.get('/api/reminders/pending-count', requireAuth, (req, res) => {
  const row = req.user.role === 'Admin'
    ? db.prepare("SELECT COUNT(*) as count FROM reminders WHERE status = 'pending'").get()
    : db.prepare("SELECT COUNT(*) as count FROM reminders WHERE status = 'pending' AND assigned_to = ?").get(req.user.id);
  res.json({ count: row.count });
});

app.post('/api/reminders', requireAuth, (req, res) => {
  const p = req.body || {};
  const r = db
    .prepare(
      `INSERT INTO reminders (title, reminder_type, reminder_date, assigned_to, related_quotation_id, status)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(
      p.title,
      p.reminder_type || 'General',
      p.reminder_date,
      p.assigned_to || req.user.id,
      p.related_quotation_id || null,
      p.status || 'pending'
    );
  res.json(getById('reminders', r.lastInsertRowid));
});

app.patch('/api/reminders/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const p = req.body || {};
  db.prepare(
    `UPDATE reminders SET
      title = COALESCE(?, title),
      reminder_type = COALESCE(?, reminder_type),
      reminder_date = COALESCE(?, reminder_date),
      assigned_to = COALESCE(?, assigned_to),
      status = COALESCE(?, status)
    WHERE id = ?`
  ).run(p.title, p.reminder_type, p.reminder_date, p.assigned_to, p.status, id);
  res.json(getById('reminders', id));
});

app.delete('/api/reminders/:id', requireAuth, (req, res) => {
  db.prepare('DELETE FROM reminders WHERE id = ?').run(Number(req.params.id));
  res.json({ ok: true });
});

app.get('/api/settings/company', requireAuth, (_req, res) => {
  res.json(db.prepare('SELECT * FROM company_settings WHERE id = 1').get());
});

app.put('/api/settings/company', requireAuth, requireAdmin, (req, res) => {
  const p = req.body || {};
  db.prepare(
    `UPDATE company_settings SET
      company_name = COALESCE(?, company_name),
      logo = COALESCE(?, logo),
      address = COALESCE(?, address),
      gst_number = COALESCE(?, gst_number),
      email = COALESCE(?, email),
      mobile = COALESCE(?, mobile),
      quotation_prefix = COALESCE(?, quotation_prefix),
      challan_prefix = COALESCE(?, challan_prefix),
      invoice_prefix = COALESCE(?, invoice_prefix),
      currency = COALESCE(?, currency),
      default_tax_rate = COALESCE(?, default_tax_rate),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = 1`
  ).run(
    p.company_name,
    p.logo,
    p.address,
    p.gst_number,
    p.email,
    p.mobile,
    p.quotation_prefix,
    p.challan_prefix,
    p.invoice_prefix,
    p.currency,
    p.default_tax_rate
  );
  res.json(db.prepare('SELECT * FROM company_settings WHERE id = 1').get());
});

app.get('/api/reports/inquiries', requireAuth, (req, res) => {
  const userFilter = req.user.role === 'Admin' ? '' : ' WHERE assigned_to = ?';
  const params = req.user.role === 'Admin' ? [] : [req.user.id];
  
  const status = db.prepare(`SELECT status, COUNT(*) as count FROM inquiries${userFilter} GROUP BY status`).all(...params);
  const sources = db.prepare(`SELECT source, COUNT(*) as count FROM inquiries${userFilter} GROUP BY source`).all(...params);
  const total = db.prepare(`SELECT COUNT(*) as count FROM inquiries${userFilter}`).get(...params).count;
  const converted = req.user.role === 'Admin' 
    ? db.prepare("SELECT COUNT(*) as count FROM inquiries WHERE status = 'converted'").get().count 
    : db.prepare("SELECT COUNT(*) as count FROM inquiries WHERE status = 'converted' AND assigned_to = ?").get(req.user.id).count;
  
  const conversionRate = total ? Number(((converted / total) * 100).toFixed(2)) : 0;
  res.json({ status, sources, conversionRate });
});

app.get('/api/reports/quotations', requireAuth, (req, res) => {
  const userFilter = req.user.role === 'Admin' ? '' : ' WHERE assigned_to = ?';
  const params = req.user.role === 'Admin' ? [] : [req.user.id];
  
  const status = db.prepare(`SELECT status, COUNT(*) as count FROM quotations${userFilter} GROUP BY status`).all(...params);
  const totals = db.prepare(`SELECT SUM(total_amount) as total_value, SUM(CASE WHEN status = 'approved' THEN total_amount ELSE 0 END) as approved_value FROM quotations${userFilter}`).get(...params);
  const details = db.prepare(`SELECT quotation_number, customer_name, company_name, status, total_amount, created_at FROM quotations${userFilter} ORDER BY id DESC`).all(...params);
  
  res.json({ status, totals, details });
});

app.get('/api/reports/users', requireAuth, (req, res) => {
  const userFilter = req.user.role === 'Admin' ? '' : ` WHERE u.id = ${req.user.id}`;
  const rows = db
    .prepare(
      `SELECT
        u.id,
        u.name,
        COUNT(q.id) as quotation_count,
        SUM(q.total_amount) as total_value,
        SUM(CASE WHEN q.status IN ('approved','converted') THEN 1 ELSE 0 END) as won_count
      FROM users u
      LEFT JOIN quotations q ON q.assigned_to = u.id
      ${userFilter}
      GROUP BY u.id
      ORDER BY u.name ASC`
    )
    .all();

  const data = rows.map((r) => ({
    ...r,
    conversion_rate: r.quotation_count ? Number(((r.won_count / r.quotation_count) * 100).toFixed(2)) : 0,
  }));
  res.json(data);
});

app.get('/api/reports/products', requireAuth, (req, res) => {
  const userFilter = req.user.role === 'Admin' ? '' : ' WHERE q.assigned_to = ?';
  const params = req.user.role === 'Admin' ? [] : [req.user.id];
  
  const rows = db
    .prepare(
      `SELECT
        COALESCE(p.product_name, qi.description) as product,
        SUM(qi.qty) as quantity,
        SUM(qi.line_total) as revenue
      FROM quotation_items qi
      LEFT JOIN products p ON p.id = qi.product_id
      LEFT JOIN quotations q ON q.id = qi.quotation_id
      ${userFilter}
      GROUP BY COALESCE(p.product_name, qi.description)
      ORDER BY revenue DESC`
    )
    .all(...params);
  res.json(rows);
});

app.get('/api/reports/groups', requireAuth, (req, res) => {
  const userFilter = req.user.role === 'Admin' ? '' : ' WHERE q.assigned_to = ?';
  const params = req.user.role === 'Admin' ? [] : [req.user.id];
  
  const rows = db
    .prepare(
      `SELECT
        COALESCE(g.group_name, 'Ungrouped') as group_name,
        SUM(qi.qty) as quantity,
        SUM(qi.line_total) as revenue
      FROM quotation_items qi
      LEFT JOIN products p ON p.id = qi.product_id
      LEFT JOIN product_groups g ON g.id = p.group_id
      LEFT JOIN quotations q ON q.id = qi.quotation_id
      ${userFilter}
      GROUP BY COALESCE(g.group_name, 'Ungrouped')
      ORDER BY revenue DESC`
    )
    .all(...params);
  res.json(rows);
});

app.post('/api/invoices/:id/payments', requireAuth, (req, res) => {
  const invoiceId = Number(req.params.id);
  const amount = Number(req.body?.amount || 0);
  const paymentMode = req.body?.payment_mode || 'cash';

  if (amount <= 0) return res.status(400).json({ message: 'amount should be greater than 0' });

  const tx = db.transaction(() => {
    db.prepare('INSERT INTO payments (invoice_id, amount, payment_mode) VALUES (?, ?, ?)').run(invoiceId, amount, paymentMode);
    const invoice = getById('invoices', invoiceId);
    if (!invoice) throw new Error('Invoice not found');

    const newPaid = Number(invoice.amount_paid || 0) + amount;
    const status = newPaid >= Number(invoice.total_amount || 0) ? 'paid' : 'partial';
    db.prepare('UPDATE invoices SET amount_paid = ?, payment_status = ? WHERE id = ?').run(newPaid, status, invoiceId);
    return getById('invoices', invoiceId);
  });

  try {
    res.json(tx());
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

app.get('/api/quotations/:id/pdf', async (req,res)=>{

const id=Number(req.params.id);

const quotation=db
.prepare(
'SELECT * FROM quotations WHERE id=?'
)
.get(id);

if(!quotation){
return res.status(404).json({
message:'Quotation not found'
});
}

const items=db
.prepare(
'SELECT * FROM quotation_items WHERE quotation_id=?'
)
.all(id);

const settings = db
  .prepare('SELECT * FROM company_settings WHERE id = 1')
  .get();

const templateData = {
  quotation_number: quotation.quotation_number,
  date: quotation.created_at,
  customer_name: quotation.customer_name,
  company_name: quotation.company_name,
kirloskar_logo:
  'data:image/jpeg;base64,' +
  fs.readFileSync(
    '/var/www/quotify/backend/server/assets/kirloskar-logo.jpg',
    'base64'
  ),

pareek_logo:
  'data:image/jpeg;base64,' +
  fs.readFileSync(
    '/var/www/quotify/backend/server/assets/pareek-logo.jpg',
    'base64'
  ),
greaves_logo:
  'data:image/jpeg;base64,' +
  fs.readFileSync(
    '/var/www/quotify/backend/server/assets/greaves-logo.jpg',
    'base64'
  ),
  attention_person: quotation.attention_person || '',
  subject: quotation.subject || '',
  application: quotation.application || '',
  flow: quotation.flow || '',
  head: quotation.head || '',

  items,

  subtotal: quotation.subtotal || 0,
  total_discount: quotation.total_discount || 0,
  total_gst: quotation.total_gst || 0,
  total_amount: quotation.total_amount || 0,

  notes: quotation.notes || '',
terms_conditions:
quotation.terms_conditions ||
settings?.quotation_terms ||
'',
  from_company_name: settings?.company_name || '',
  from_address: settings?.address || '',
  from_email: settings?.email || '',
  from_phone: settings?.mobile || ''
};
let html;

const template = req.query.template || 'baerlocher';

switch (template) {
  case 'pump':
    html = pumpTemplate(templateData);
    break;

  case 'motor':
    html = motorTemplate(templateData);
    break;

  case 'industrial':
    html = industrialTemplate(templateData);
    break;

  case 'service':
    html = serviceTemplate(templateData);
    break;

  case 'baerlocher':
    html = baerlocherTemplate(templateData);
    break;

  case 'choithram':
    html = choithramTemplate(templateData);
    break;

  case 'greaves':
    html = greavesTemplate(templateData);
    break;

  default:
    html = baerlocherTemplate(templateData);
}

const browser=
await puppeteer.launch({

headless:true,

args:[
'--no-sandbox',
'--disable-setuid-sandbox'
]

});

const page=
await browser.newPage();

await page.setContent(
html,
{
waitUntil:'networkidle0'
}
);

const pdf=
await page.pdf({

format:'A4',

printBackground:true,

margin:{
top:'10mm',
bottom:'10mm',
left:'10mm',
right:'10mm'
}

});

await browser.close();

res.setHeader(
'Content-Type',
'application/pdf'
);

res.setHeader(
'Content-Disposition',
`attachment; filename=${quotation.quotation_number}.pdf`
);

res.setHeader(
'Content-Length',
pdf.length
);

res.end(pdf,'binary');

});


app.listen(PORT, () => {
  console.log(`API running at http://localhost:${PORT}`);
});
