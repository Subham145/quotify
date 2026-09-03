import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import db from './db.js';
import { hasPermission, parsePermissions, sanitizeUser } from './permissions.js';

const SECRET = process.env.JWT_SECRET || 'quotify-local-secret';

// Resolve a DB user row into the session object placed on `req.user`.
// Effective permissions come from the user's assigned role; `role` is set to the
// role's base_role so the existing Admin/SuperAdmin/User checks keep working.
export function buildSessionUser(userRow) {
  const base = sanitizeUser(userRow);
  if (!base) return null;

  let role = userRow.role_id
    ? db.prepare('SELECT * FROM roles WHERE id = ?').get(userRow.role_id)
    : null;
  if (!role) {
    role = db.prepare('SELECT * FROM roles WHERE name = ? AND is_system = 1').get(userRow.role);
  }

  if (role) {
    base.role = role.base_role;
    base.role_id = role.id;
    base.role_name = role.name;
    base.permissions = parsePermissions(role.permissions, role.base_role);
  } else {
    base.role_name = userRow.role;
  }

  return base;
}

export function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, SECRET, {
    expiresIn: '7d',
  });
}

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const payload = jwt.verify(token, SECRET);
    const dbUser = db.prepare('SELECT * FROM users WHERE id = ? AND is_active = 1').get(payload.id);
    if (!dbUser) return res.status(401).json({ message: 'User not found or inactive' });
    req.user = buildSessionUser(dbUser);
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user || (req.user.role !== 'Admin' && req.user.role !== 'SuperAdmin')) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  return next();
}

export function requireSuperAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'SuperAdmin') {
    return res.status(403).json({ message: 'SuperAdmin access required' });
  }
  return next();
}

export function login(email, password) {
  const user = db.prepare('SELECT * FROM users WHERE email = ? AND is_active = 1').get(email);
  if (!user) return null;
  if (!bcrypt.compareSync(password, user.password_hash)) return null;
  return buildSessionUser(user);
}

export function requirePermission(module, action = 'view') {
  return (req, res, next) => {
    if (!hasPermission(req.user, module, action)) {
      return res.status(403).json({ message: `Permission denied for ${module}:${action}` });
    }
    return next();
  };
}

export function requireResource(module) {
  return (req, res, next) => {
    const method = String(req.method || 'GET').toUpperCase();
    const action = method === 'GET'
      ? 'view'
      : method === 'POST'
        ? 'create'
        : method === 'DELETE'
          ? 'delete'
          : 'edit';

    if (!hasPermission(req.user, module, action)) {
      return res.status(403).json({ message: `Permission denied for ${module}:${action}` });
    }
    return next();
  };
}
