import { NavLink } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import { canAccess } from '../../lib/permissions';
import {
  LayoutDashboard,
  BarChart3,
  FileSpreadsheet,
  TrendingUp,
  CalendarCheck,
  Users,
  Megaphone,
  Package,
  Boxes,
  Tags,
  Clock,
  Bell,
  UserCog,
  ShieldCheck,
  Settings,
  Sparkles,
} from 'lucide-react';

const navSections = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', path: '/', module: 'dashboard', icon: LayoutDashboard },
      { label: 'Reports', path: '/reports', module: 'reports', icon: BarChart3 },
    ],
  },
  {
    title: 'Sales & CRM',
    items: [
      { label: 'Inquiries & Quotations', path: '/inquiries', module: 'inquiries', icon: FileSpreadsheet },
      { label: 'CRM Leads', path: '/crm', module: 'crm', icon: TrendingUp },
      { label: 'Follow-ups', path: '/follow-ups', module: 'follow_ups', icon: CalendarCheck },
      { label: 'Customers', path: '/customers', module: 'customers', icon: Users },
      { label: 'Inquiry Sources', path: '/inquiry-sources', module: 'inquiries', icon: Megaphone },
    ],
  },
  {
    title: 'Products & Catalog',
    items: [
      { label: 'Products', path: '/products', module: 'products', icon: Package },
      { label: 'Product Groups', path: '/product-groups', module: 'product_groups', icon: Boxes },
      { label: 'Categories', path: '/product-categories', module: 'products', icon: Tags },
    ],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Attendance', path: '/attendance', module: 'attendance', icon: Clock },
      { label: 'Reminders', path: '/reminders', module: 'reminders', icon: Bell },
    ],
  },
  {
    title: 'Administration',
    items: [
      { label: 'Users', path: '/users', superAdminOnly: true, icon: UserCog },
      { label: 'Roles & Permissions', path: '/roles', superAdminOnly: true, icon: ShieldCheck },
      { label: 'Settings', path: '/settings', module: 'settings', icon: Settings },
    ],
  },
];

export default function Sidebar() {
  const { user } = useAuth();

  const filterItem = (item) => {
    if (item.superAdminOnly) return user?.role === 'SuperAdmin';
    if (item.module && item.module !== 'dashboard') return canAccess(user, item.module, 'view');
    return true;
  };

  return (
    <aside className="sticky top-0 h-screen w-64 shrink-0 flex flex-col justify-between border-r border-slate-200 bg-white shadow-xs select-none">
      {/* Top Brand Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-slate-50/50">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-700 to-brand-500 text-white shadow-md shadow-brand-500/20">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h2 className="text-base font-bold tracking-tight text-slate-900">Quotify</h2>
            <span className="rounded-full bg-brand-100 px-1.5 py-0.2 text-[9px] font-bold text-brand-700 uppercase">
              PRO
            </span>
          </div>
          <p className="text-[11px] font-medium text-slate-400">Pumps &amp; Sales CRM</p>
        </div>
      </div>

      {/* Categorized Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {navSections.map((section) => {
          const visibleItems = section.items.filter(filterItem);
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title} className="space-y-0.5">
              <div className="px-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {section.title}
              </div>

              {visibleItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/'}
                    className={({ isActive }) =>
                      `group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-semibold transition-all duration-150 ${
                        isActive
                          ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/20'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          className={`h-4 w-4 shrink-0 transition-colors ${
                            isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* User Profile Footer */}
      <div className="border-t border-slate-100 bg-slate-50/60 p-3">
        <div className="flex items-center gap-2.5 rounded-lg p-1.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
            {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-slate-800">{user?.name || 'User'}</p>
            <p className="truncate text-[10px] text-slate-400 font-medium">{user?.role || 'Staff'}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
