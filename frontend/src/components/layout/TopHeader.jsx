import { Bell, CalendarClock, FileText, LogOut, Search, User } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api/http';
import { useAuth } from '../../lib/AuthContext';

export default function TopHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);
  const searchRef = useRef(null);

  const trimmedSearch = search.trim();

  const { data: customers = [] } = useQuery({
    queryKey: ['header-search-customers', trimmedSearch],
    queryFn: () => api('/customers?q=' + encodeURIComponent(trimmedSearch)),
    enabled: trimmedSearch.length >= 2,
  });

  const { data: quotations = [] } = useQuery({
    queryKey: ['header-search-quotations'],
    queryFn: () => api('/quotations'),
  });

  const { data: reminders = [] } = useQuery({
    queryKey: ['header-search-reminders'],
    queryFn: () => api('/reminders'),
  });

  const { data } = useQuery({
    queryKey: ['pending-reminders-count'],
    queryFn: () => api('/reminders/pending-count'),
  });

  const { data: followUpCount } = useQuery({
    queryKey: ['follow-ups-pending-count'],
    queryFn: () => api('/follow-ups/pending-count'),
  });

  const filteredQuotations = useMemo(() => {
    if (trimmedSearch.length < 2) return [];
    const q = trimmedSearch.toLowerCase();
    return quotations.filter((x) =>
      String(x.quotation_number || '').toLowerCase().includes(q) ||
      String(x.customer_name || '').toLowerCase().includes(q) ||
      String(x.company_name || '').toLowerCase().includes(q)
    );
  }, [quotations, trimmedSearch]);

  const filteredReminders = useMemo(() => {
    if (trimmedSearch.length < 2) return [];
    const q = trimmedSearch.toLowerCase();
    return reminders.filter((x) =>
      String(x.title || '').toLowerCase().includes(q) ||
      String(x.reminder_type || '').toLowerCase().includes(q)
    );
  }, [reminders, trimmedSearch]);

  const visibleNotifications = useMemo(
    () => reminders.filter((r) => r.status === 'pending' || r.status === 'overdue').slice(0, 8),
    [reminders]
  );

  useEffect(() => {
    function onDocClick(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false);
    }
    function onEsc(e) {
      if (e.key === 'Escape') {
        setNotifOpen(false);
        setSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, []);

  function openResult(path) {
    setSearchOpen(false);
    setSearch('');
    navigate(path);
  }

  return (
    <header className="mb-5 flex items-center justify-between gap-3 rounded-xl border bg-white p-3 shadow-sm">
      <div ref={searchRef} className="relative w-full max-w-xl">
        <div className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm text-slate-500">
        <Search size={16} />
          <input
            className="w-full bg-transparent text-slate-700 outline-none placeholder:text-slate-400"
            placeholder="Search customers, quotations, reminders..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSearchOpen(true);
            }}
            onFocus={() => setSearchOpen(true)}
          />
        </div>
        {searchOpen && trimmedSearch.length >= 2 ? (
          <div className="absolute z-20 mt-1 max-h-80 w-full overflow-auto rounded-lg border bg-white p-2 shadow-lg">
            <p className="px-2 py-1 text-xs font-semibold text-slate-500">Customers</p>
            {customers.slice(0, 5).map((c) => (
              <button
                key={'c-' + c.id}
                type="button"
                className="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-sm hover:bg-slate-50"
                onClick={() => openResult('/customers')}
              >
                <User size={14} />
                <span>{c.customer_name}</span>
              </button>
            ))}

            <p className="mt-1 px-2 py-1 text-xs font-semibold text-slate-500">Quotations</p>
            {filteredQuotations.slice(0, 5).map((q) => (
              <button
                key={'q-' + q.id}
                type="button"
                className="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-sm hover:bg-slate-50"
                onClick={() => openResult('/quotations')}
              >
                <FileText size={14} />
                <span>{q.quotation_number} - {q.customer_name}</span>
              </button>
            ))}

            <p className="mt-1 px-2 py-1 text-xs font-semibold text-slate-500">Reminders</p>
            {filteredReminders.slice(0, 5).map((r) => (
              <button
                key={'r-' + r.id}
                type="button"
                className="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-sm hover:bg-slate-50"
                onClick={() => openResult('/reminders?open=' + r.id)}
              >
                <Bell size={14} />
                <span>{r.title}</span>
              </button>
            ))}

            {customers.length === 0 && filteredQuotations.length === 0 && filteredReminders.length === 0 ? (
              <p className="px-2 py-2 text-sm text-slate-500">No results found</p>
            ) : null}
          </div>
        ) : null}
      </div>
      <div className="flex items-center gap-3">
        <Link
          to="/follow-ups"
          className="relative rounded-xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-2 text-slate-700 shadow-sm hover:border-brand-200 hover:from-brand-50/60 hover:to-white"
          title="Pending follow-ups"
        >
          <CalendarClock size={18} />
          {followUpCount?.count ? (
            <span className="absolute -right-1 -top-1 rounded-full bg-amber-500 px-1.5 text-[10px] font-semibold text-white">
              {followUpCount.count}
            </span>
          ) : null}
        </Link>
        <div ref={notifRef} className="relative">
          <button
            className="relative rounded-xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-2 text-slate-700 shadow-sm hover:border-brand-200 hover:from-brand-50/60 hover:to-white"
            type="button"
            onClick={() => setNotifOpen((x) => !x)}
          >
            <Bell size={18} />
            <span className="absolute -right-1 -top-1 rounded-full bg-rose-500 px-1.5 text-[10px] font-semibold text-white">{data?.count || 0}</span>
          </button>
          {notifOpen ? (
            <div className="absolute right-0 z-20 mt-2 w-96 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
              <div className="mb-2 flex items-center justify-between rounded-xl bg-gradient-to-r from-brand-50 to-slate-50 px-3 py-2">
                <p className="text-sm font-semibold text-slate-700">Notifications</p>
                <Link to="/reminders" className="text-xs text-brand-700 hover:underline" onClick={() => setNotifOpen(false)}>
                  View all
                </Link>
              </div>
              {visibleNotifications.length ? (
                visibleNotifications.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    className="mb-1 block w-full rounded-xl border border-transparent px-3 py-2 text-left hover:border-brand-100 hover:bg-brand-50/40"
                    onClick={() => {
                      setNotifOpen(false);
                      navigate('/reminders?open=' + r.id);
                    }}
                  >
                    <p className="text-sm font-semibold text-slate-800">{r.title}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">{r.reminder_type}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] ${r.status === 'overdue' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>{r.status}</span>
                    </div>
                  </button>
                ))
              ) : (
                <p className="px-2 py-2 text-sm text-slate-500">No pending notifications</p>
              )}
            </div>
          ) : null}
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-slate-900">{user?.name}</p>
          <p className="text-xs text-slate-500">{user?.role}</p>
        </div>
        <button type="button" onClick={logout} className="rounded-lg border p-2 text-slate-600 hover:bg-slate-50">
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
