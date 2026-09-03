import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import DataTable from '../components/shared/DataTable';
import PageHeader from '../components/shared/PageHeader';
import { api } from '../api/http';
import { useAuth } from '../lib/AuthContext';
import { isManager } from '../lib/permissions';

const STATUS_STYLES = {
  present: 'bg-emerald-100 text-emerald-700',
  absent: 'bg-rose-100 text-rose-700',
  half_day: 'bg-amber-100 text-amber-700',
  leave: 'bg-slate-100 text-slate-600',
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function fmtTime(value) {
  if (!value) return '-';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function StatusBadge({ value }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_STYLES[value] || 'bg-slate-100 text-slate-600'}`}>
      {String(value || '').replace('_', ' ')}
    </span>
  );
}

export default function Attendance() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const manager = isManager(user);
  const [tab, setTab] = useState('me');

  return (
    <div className="space-y-4">
      <PageHeader title="Attendance" description="Daily attendance, login / logout time and history." />

      {manager ? (
        <div className="flex gap-2">
          <button
            type="button"
            className={`rounded px-3 py-1.5 text-sm ${tab === 'me' ? 'bg-brand-600 text-white' : 'border text-slate-600'}`}
            onClick={() => setTab('me')}
          >
            My Attendance
          </button>
          <button
            type="button"
            className={`rounded px-3 py-1.5 text-sm ${tab === 'team' ? 'bg-brand-600 text-white' : 'border text-slate-600'}`}
            onClick={() => setTab('team')}
          >
            Team Attendance
          </button>
        </div>
      ) : null}

      {tab === 'me' || !manager ? <MyAttendance qc={qc} /> : <TeamAttendance qc={qc} />}
    </div>
  );
}

function MyAttendance({ qc }) {
  const [range, setRange] = useState({ from: '', to: '' });

  const { data: today } = useQuery({
    queryKey: ['attendance-today'],
    queryFn: () => api('/attendance/today'),
  });

  const { data: history = [] } = useQuery({
    queryKey: ['attendance-me', range],
    queryFn: () => {
      const params = new URLSearchParams();
      if (range.from) params.set('from', range.from);
      if (range.to) params.set('to', range.to);
      const qs = params.toString();
      return api('/attendance/me' + (qs ? '?' + qs : ''));
    },
  });

  const checkIn = useMutation({
    mutationFn: () => api('/attendance/check-in', { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendance-today'] });
      qc.invalidateQueries({ queryKey: ['attendance-me'] });
    },
  });

  const checkOut = useMutation({
    mutationFn: () => api('/attendance/check-out', { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendance-today'] });
      qc.invalidateQueries({ queryKey: ['attendance-me'] });
    },
  });

  const columns = useMemo(
    () => [
      { key: 'date', label: 'Date' },
      { key: 'status_badge', label: 'Status' },
      { key: 'in', label: 'Login' },
      { key: 'out', label: 'Logout' },
      { key: 'notes', label: 'Notes' },
    ],
    []
  );

  const rows = (Array.isArray(history) ? history : []).map((a) => ({
    ...a,
    status_badge: <StatusBadge value={a.status} />,
    in: fmtTime(a.check_in),
    out: fmtTime(a.check_out),
    notes: a.notes || '-',
  }));

  return (
    <div className="space-y-4">
      <div className="card flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">Today · {todayStr()}</p>
          <div className="mt-1 flex items-center gap-3">
            <StatusBadge value={today?.status || 'absent'} />
            <span className="text-sm text-slate-600">Login: {fmtTime(today?.check_in)}</span>
            <span className="text-sm text-slate-600">Logout: {fmtTime(today?.check_out)}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded bg-brand-600 px-4 py-2 text-sm text-white disabled:opacity-50"
            onClick={() => checkIn.mutate()}
            disabled={Boolean(today?.check_in) || checkIn.isPending}
          >
            {today?.check_in ? 'Checked In' : 'Check In'}
          </button>
          <button
            type="button"
            className="rounded border px-4 py-2 text-sm text-slate-700 disabled:opacity-50"
            onClick={() => checkOut.mutate()}
            disabled={!today?.check_in || checkOut.isPending}
          >
            Check Out
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label className="text-xs text-slate-500">From</label>
          <input
            type="date"
            className="rounded border p-2 text-sm"
            value={range.from}
            onChange={(e) => setRange({ ...range, from: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-slate-500">To</label>
          <input
            type="date"
            className="rounded border p-2 text-sm"
            value={range.to}
            onChange={(e) => setRange({ ...range, to: e.target.value })}
          />
        </div>
        {range.from || range.to ? (
          <button
            type="button"
            className="rounded border px-3 py-2 text-sm text-slate-600"
            onClick={() => setRange({ from: '', to: '' })}
          >
            Clear
          </button>
        ) : null}
      </div>

      <DataTable columns={columns} rows={rows} />
      {rows.length === 0 ? <p className="text-sm text-slate-500">No attendance records yet.</p> : null}
    </div>
  );
}

function TeamAttendance({ qc }) {
  const [filters, setFilters] = useState({ date: todayStr(), user_id: '' });
  const [markForm, setMarkForm] = useState({ user_id: '', date: todayStr(), status: 'present', notes: '' });

  const { data: users = [] } = useQuery({
    queryKey: ['users-assignable'],
    queryFn: () => api('/users/assignable'),
  });

  const { data: records = [] } = useQuery({
    queryKey: ['attendance-team', filters],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters.date) params.set('date', filters.date);
      if (filters.user_id) params.set('user_id', filters.user_id);
      const qs = params.toString();
      return api('/attendance' + (qs ? '?' + qs : ''));
    },
  });

  const markMutation = useMutation({
    mutationFn: (payload) => api('/attendance', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendance-team'] });
      setMarkForm((f) => ({ ...f, notes: '' }));
    },
  });

  const patchMutation = useMutation({
    mutationFn: ({ id, body }) => api('/attendance/' + id, { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['attendance-team'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api('/attendance/' + id, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['attendance-team'] }),
  });

  const columns = useMemo(
    () => [
      { key: 'user_name', label: 'Employee' },
      { key: 'date', label: 'Date' },
      { key: 'status_cell', label: 'Status' },
      { key: 'in', label: 'Login' },
      { key: 'out', label: 'Logout' },
      { key: 'notes', label: 'Notes' },
      { key: 'actions', label: 'Actions' },
    ],
    []
  );

  const rows = (Array.isArray(records) ? records : []).map((a) => ({
    ...a,
    user_name: a.user_name || '-',
    in: fmtTime(a.check_in),
    out: fmtTime(a.check_out),
    notes: a.notes || '-',
    status_cell: (
      <select
        className="rounded border p-1 text-xs"
        value={a.status}
        onChange={(e) => patchMutation.mutate({ id: a.id, body: { status: e.target.value } })}
      >
        <option value="present">present</option>
        <option value="absent">absent</option>
        <option value="half_day">half_day</option>
        <option value="leave">leave</option>
      </select>
    ),
    actions: (
      <button
        type="button"
        className="rounded border border-rose-300 px-2 py-1 text-xs text-rose-700 hover:bg-rose-50"
        onClick={() => {
          if (window.confirm(`Delete ${a.user_name}'s attendance for ${a.date}?`)) deleteMutation.mutate(a.id);
        }}
      >
        Delete
      </button>
    ),
  }));

  return (
    <div className="space-y-4">
      <form
        className="card grid gap-3 md:grid-cols-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!markForm.user_id) return;
          markMutation.mutate({ ...markForm, user_id: Number(markForm.user_id) });
        }}
      >
        <div className="space-y-1">
          <label className="text-sm font-medium">Employee</label>
          <select
            className="w-full rounded border p-2"
            value={markForm.user_id}
            onChange={(e) => setMarkForm({ ...markForm, user_id: e.target.value })}
            required
          >
            <option value="">Select</option>
            {(Array.isArray(users) ? users : []).map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Date</label>
          <input
            type="date"
            className="w-full rounded border p-2"
            value={markForm.date}
            onChange={(e) => setMarkForm({ ...markForm, date: e.target.value })}
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Status</label>
          <select
            className="w-full rounded border p-2"
            value={markForm.status}
            onChange={(e) => setMarkForm({ ...markForm, status: e.target.value })}
          >
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="half_day">Half day</option>
            <option value="leave">Leave</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Notes</label>
          <input
            className="w-full rounded border p-2"
            value={markForm.notes}
            onChange={(e) => setMarkForm({ ...markForm, notes: e.target.value })}
          />
        </div>
        <div className="md:col-span-4">
          <button type="submit" className="rounded bg-brand-600 px-4 py-2 text-sm text-white">
            Mark / Update Attendance
          </button>
        </div>
      </form>

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label className="text-xs text-slate-500">Date</label>
          <input
            type="date"
            className="rounded border p-2 text-sm"
            value={filters.date}
            onChange={(e) => setFilters({ ...filters, date: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-slate-500">Employee</label>
          <select
            className="rounded border p-2 text-sm"
            value={filters.user_id}
            onChange={(e) => setFilters({ ...filters, user_id: e.target.value })}
          >
            <option value="">All</option>
            {(Array.isArray(users) ? users : []).map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
        {filters.date || filters.user_id ? (
          <button
            type="button"
            className="rounded border px-3 py-2 text-sm text-slate-600"
            onClick={() => setFilters({ date: '', user_id: '' })}
          >
            Clear
          </button>
        ) : null}
      </div>

      <DataTable columns={columns} rows={rows} />
      {rows.length === 0 ? <p className="text-sm text-slate-500">No attendance records for this filter.</p> : null}
    </div>
  );
}
