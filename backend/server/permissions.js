export const PERMISSION_MODULES = [
  'dashboard',
  'inquiries',
  'crm',
  'quotations',
  'customers',
  'products',
  'product_groups',
  'follow_ups',
  'attendance',
  'reminders',
  'reports',
  'users',
  'settings',
];

export const PERMISSION_ACTIONS = ['view', 'create', 'edit', 'delete', 'manage'];

export function getDefaultPermissions(role = 'User') {
  const out = {};
  PERMISSION_MODULES.forEach((m) => {
    out[m] = {
      view: role === 'Admin' || role === 'SuperAdmin',
      create: role === 'Admin' || role === 'SuperAdmin',
      edit: role === 'Admin' || role === 'SuperAdmin',
      delete: role === 'Admin' || role === 'SuperAdmin',
      manage: role === 'Admin' || role === 'SuperAdmin',
    };
  });

  if (role === 'User') {
    // Normal users are view-only on core data; they can act on follow-ups
    // assigned to them and record their own attendance.
    out.dashboard.view = true;
    out.inquiries = { view: true, create: false, edit: false, delete: false, manage: false };
    out.crm = { view: true, create: false, edit: false, delete: false, manage: false };
    out.quotations = { view: true, create: false, edit: false, delete: false, manage: false };
    out.customers = { view: true, create: false, edit: false, delete: false, manage: false };
    out.products = { view: true, create: false, edit: false, delete: false, manage: false };
    out.product_groups = { view: true, create: false, edit: false, delete: false, manage: false };
    out.follow_ups = { view: true, create: false, edit: true, delete: false, manage: false };
    out.attendance = { view: true, create: true, edit: false, delete: false, manage: false };
    out.reminders = { view: true, create: false, edit: false, delete: false, manage: false };
    out.reports = { view: true, create: false, edit: false, delete: false, manage: false };
    out.users = { view: false, create: false, edit: false, delete: false, manage: false };
    out.settings = { view: false, create: false, edit: false, delete: false, manage: false };
  }

  return out;
}

export function normalizePermissions(input, role = 'User') {
  const defaults = getDefaultPermissions(role);
  if (!input || typeof input !== 'object') return defaults;

  const normalized = {};
  PERMISSION_MODULES.forEach((m) => {
    normalized[m] = {};
    PERMISSION_ACTIONS.forEach((a) => {
      normalized[m][a] = Boolean(input?.[m]?.[a] ?? defaults[m][a]);
    });
  });

  return normalized;
}

export function parsePermissions(raw, role = 'User') {
  try {
    if (!raw) return getDefaultPermissions(role);
    const obj = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return normalizePermissions(obj, role);
  } catch {
    return getDefaultPermissions(role);
  }
}

export function hasPermission(user, module, action = 'view') {
  if (!user) return false;
  if (user.role === 'Admin' || user.role === 'SuperAdmin') return true;
  return Boolean(user.permissions?.[module]?.[action]);
}

export function sanitizeUser(userRow) {
  if (!userRow) return null;
  return {
    id: userRow.id,
    name: userRow.name,
    email: userRow.email,
    role: userRow.role,
    role_id: userRow.role_id ?? null,
    is_active: userRow.is_active,
    created_at: userRow.created_at,
    permissions: parsePermissions(userRow.permissions, userRow.role),
  };
}
