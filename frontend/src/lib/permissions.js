export const PERMISSION_MODULES = [
  'dashboard',
  'inquiries',
  'crm',
  'quotations',
  'customers',
  'products',
  'product_groups',
  'reminders',
  'reports',
  'users',
  'settings',
];

export const PERMISSION_ACTIONS = ['view', 'create', 'edit', 'delete', 'manage'];

export function canAccess(user, module, action = 'view') {
  if (!user) return false;
  if (user.role === 'Admin') return true;
  return Boolean(user.permissions?.[module]?.[action]);
}
