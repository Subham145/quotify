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

export const MODULE_LABELS = {
  dashboard: 'Dashboard',
  inquiries: 'Inquiries',
  crm: 'CRM',
  quotations: 'Quotations',
  customers: 'Customers',
  products: 'Products',
  product_groups: 'Product Groups',
  follow_ups: 'Follow-ups',
  attendance: 'Attendance',
  reminders: 'Reminders',
  reports: 'Reports',
  users: 'Users',
  settings: 'Settings',
};

export function canAccess(user, module, action = 'view') {
  if (!user) return false;
  if (user.role === 'Admin' || user.role === 'SuperAdmin') return true;
  return Boolean(user.permissions?.[module]?.[action]);
}

export function isManager(user) {
  return user?.role === 'Admin' || user?.role === 'SuperAdmin';
}
