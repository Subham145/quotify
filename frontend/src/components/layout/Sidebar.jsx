import { NavLink } from 'react-router-dom';
import { navItems } from '../../lib/mockData';
import { useAuth } from '../../lib/AuthContext';

export default function Sidebar() {
  const { user } = useAuth();
  const items = navItems.filter((item) => {
    if (item.path === '/users') return user?.role === 'SuperAdmin';
    return true;
  });

  return (
    <aside className="sticky top-0 h-screen w-60 border-r bg-white p-4">
      <div className="mb-6 px-2">
        <h2 className="text-lg font-semibold text-brand-700">Quotify</h2>
        <p className="text-xs text-slate-500">Sales CRM Suite</p>
      </div>
      <nav className="space-y-1">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `block rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-100'}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
