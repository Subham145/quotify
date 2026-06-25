import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import db from './db.js';
import { hasPermission, sanitizeUser } from './permissions.js';

const SECRET = process.env.JWT_SECRET || 'quotify-local-secret';

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
    req.user = sanitizeUser(dbUser);
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
  return sanitizeUser(user);
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
