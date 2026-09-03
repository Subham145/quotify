import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import DataTable from '../components/shared/DataTable';
import PageHeader from '../components/shared/PageHeader';
import { api } from '../api/http';
import { useAuth } from '../lib/AuthContext';
import { canAccess } from '../lib/permissions';

export default function Reminders() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const canCreate = canAccess(user, 'reminders', 'create');
  const canEdit = canAccess(user, 'reminders', 'edit');
  const canDelete = canAccess(user, 'reminders', 'delete');
  const [searchParams] = useSearchParams();
  const { data: reminders = [] } = useQuery({ queryKey: ['reminders'], queryFn: () => api('/reminders') });
  const openReminderId = Number(searchParams.get('open') || 0);
  const openedReminder = reminders.find((r) => Number(r.id) === openReminderId);
  const [form, setForm] = useState({ title: '', reminder_type: 'General', reminder_date: '', status: 'pending' });

  const createMutation = useMutation({
    mutationFn: (payload) => api('/reminders', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reminders'] });
      qc.invalidateQueries({ queryKey: ['pending-reminders-count'] });
      setForm({ title: '', reminder_type: 'General', reminder_date: '', status: 'pending' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => api('/reminders/' + id, { method: 'PATCH', body: JSON.stringify({ status }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reminders'] });
      qc.invalidateQueries({ queryKey: ['pending-reminders-count'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api('/reminders/' + id, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reminders'] });
      qc.invalidateQueries({ queryKey: ['pending-reminders-count'] });
    },
  });

  const columns = useMemo(() => [
    { key: 'title', label: 'Title' },
    { key: 'reminder_type', label: 'Type' },
    { key: 'reminder_date', label: 'Date' },
    { key: 'status', label: 'Status' },
    ...(canEdit || canDelete ? [{ key: 'actions', label: 'Actions' }] : []),
  ], [canEdit, canDelete]);

  const sortedReminders = [...reminders].sort((a, b) => {
    if (Number(a.id) === openReminderId) return -1;
    if (Number(b.id) === openReminderId) return 1;
    return Number(b.id) - Number(a.id);
  });

  const rows = sortedReminders.map((r) => ({
    ...r,
    title: Number(r.id) === openReminderId ? `Opened: ${r.title}` : r.title,
    actions: (
      <div className="flex gap-1">
        {canEdit ? (
          <>
            <button type="button" className="rounded border px-2 py-1 text-xs" onClick={() => updateMutation.mutate({ id: r.id, status: 'completed' })}>Complete</button>
            <button type="button" className="rounded border px-2 py-1 text-xs" onClick={() => updateMutation.mutate({ id: r.id, status: 'cancelled' })}>Cancel</button>
          </>
        ) : null}
        {canDelete ? (
          <button
            type="button"
            className="rounded border border-rose-300 px-2 py-1 text-xs text-rose-700 hover:bg-rose-50"
            onClick={() => {
              if (window.confirm(`Delete reminder "${r.title}"?`)) deleteMutation.mutate(r.id);
            }}
          >
            Delete
          </button>
        ) : null}
      </div>
    ),
  }));

  return (
    <div className="space-y-4">
      <PageHeader title="Reminders" description="Manage reminders and statuses." />
      {openedReminder ? (
        <div className="rounded-xl border border-brand-200 bg-gradient-to-r from-brand-50 to-white px-4 py-3 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Opened From Notification</p>
          <p className="mt-1 text-base font-semibold text-slate-800">{openedReminder.title}</p>
          <p className="text-sm text-slate-600">
            {openedReminder.reminder_type} • {openedReminder.status} • {openedReminder.reminder_date}
          </p>
        </div>
      ) : null}

      {canCreate ? (
      <form className="card grid gap-3 md:grid-cols-4" onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }}>
        <input className="rounded border p-2" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <select className="rounded border p-2" value={form.reminder_type} onChange={(e) => setForm({ ...form, reminder_type: e.target.value })}>
          <option>Quotation Follow-up</option>
          <option>Payment Reminder</option>
          <option>Delivery Reminder</option>
          <option>AMC Renewal</option>
          <option>Email Reminder</option>
          <option>General</option>
        </select>
        <input className="rounded border p-2" type="datetime-local" value={form.reminder_date} onChange={(e) => setForm({ ...form, reminder_date: e.target.value })} required />
        <button type="submit" className="rounded bg-brand-600 px-3 py-2 text-sm text-white">Add Reminder</button>
      </form>
      ) : null}

      <DataTable columns={columns} rows={rows} />
    </div>
  );
}
