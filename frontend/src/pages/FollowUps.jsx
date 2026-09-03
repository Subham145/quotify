import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import DataTable from '../components/shared/DataTable';
import PageHeader from '../components/shared/PageHeader';
import { api } from '../api/http';
import { useAuth } from '../lib/AuthContext';
import { isManager } from '../lib/permissions';

const STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-700',
  done: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-slate-100 text-slate-500',
};

function fmtDate(value) {
  if (!value) return '-';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString();
}

// ISO / SQL timestamp -> value usable by <input type="datetime-local">
function toDatetimeLocal(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function isOverdue(f) {
  return f.status === 'pending' && f.due_date && new Date(f.due_date).getTime() < Date.now();
}

const blankForm = { inquiry_id: '', assigned_to: '', title: '', notes: '', due_date: '' };

export default function FollowUps() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const manager = isManager(user);
  const [form, setForm] = useState(blankForm);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ assigned_to: '', title: '', notes: '', due_date: '' });

  const { data: followUps = [] } = useQuery({
    queryKey: ['follow-ups'],
    queryFn: () => api('/follow-ups'),
  });

  const { data: assignees = [] } = useQuery({
    queryKey: ['users-assignable'],
    queryFn: () => api('/users/assignable'),
  });

  const { data: inquiries = [] } = useQuery({
    queryKey: ['inquiries'],
    queryFn: () => api('/inquiries'),
  });

  const createMutation = useMutation({
    mutationFn: (payload) => api('/follow-ups', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: (res) => {
      if (res?.message) {
        setError(res.message);
        return;
      }
      qc.invalidateQueries({ queryKey: ['follow-ups'] });
      qc.invalidateQueries({ queryKey: ['follow-ups-pending-count'] });
      setForm(blankForm);
      setError('');
    },
    onError: (e) => setError(e.message || 'Failed to create follow-up'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }) => api('/follow-ups/' + id, { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['follow-ups'] });
      qc.invalidateQueries({ queryKey: ['follow-ups-pending-count'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api('/follow-ups/' + id, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['follow-ups'] });
      qc.invalidateQueries({ queryKey: ['follow-ups-pending-count'] });
    },
  });

  const list = Array.isArray(followUps) ? followUps : [];
  const filtered = statusFilter === 'all' ? list : list.filter((f) => f.status === statusFilter);
  const overdueCount = list.filter(isOverdue).length;

  const columns = useMemo(
    () => [
      { key: 'about', label: 'Lead / Inquiry' },
      { key: 'title', label: 'Title' },
      { key: 'assigned_name', label: 'Assigned To' },
      { key: 'due', label: 'Due Date' },
      { key: 'status_badge', label: 'Status' },
      { key: 'actions', label: 'Actions' },
    ],
    []
  );

  const rows = filtered.map((f) => {
    const about = f.inquiry_number
      ? `${f.inquiry_number} · ${f.inquiry_customer || ''}`
      : f.lead_customer
        ? `Lead · ${f.lead_customer}`
        : '-';
    const canEdit = manager || f.assigned_to === user?.id;
    const overdue = isOverdue(f);
    return {
      ...f,
      about,
      title: f.title || '-',
      assigned_name: f.assigned_name || '-',
      due: (
        <span className={overdue ? 'font-semibold text-rose-700' : ''}>
          {fmtDate(f.due_date)}
          {overdue ? ' · overdue' : ''}
        </span>
      ),
      status_badge: (
        <span
          className={`rounded-full px-2 py-0.5 text-xs ${
            overdue ? 'bg-rose-100 text-rose-700' : STATUS_STYLES[f.status] || 'bg-slate-100 text-slate-600'
          }`}
        >
          {overdue ? 'overdue' : f.status}
        </span>
      ),
      actions: (
        <div className="flex flex-wrap gap-1">
          {canEdit && f.status === 'pending' ? (
            <>
              <button
                type="button"
                className="rounded border border-emerald-300 px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-50"
                onClick={() => {
                  const outcome = window.prompt('Outcome / result of this follow-up?', '') || '';
                  updateMutation.mutate({ id: f.id, body: { status: 'done', outcome } });
                }}
              >
                Mark Done
              </button>
              <button
                type="button"
                className="rounded border border-brand-300 px-2 py-1 text-xs text-brand-700 hover:bg-brand-50"
                onClick={() => {
                  setEditing(f);
                  setEditForm({
                    assigned_to: f.assigned_to ? String(f.assigned_to) : '',
                    title: f.title || '',
                    notes: f.notes || '',
                    due_date: toDatetimeLocal(f.due_date),
                  });
                }}
              >
                Edit
              </button>
              <button
                type="button"
                className="rounded border px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                onClick={() => updateMutation.mutate({ id: f.id, body: { status: 'cancelled' } })}
              >
                Cancel
              </button>
            </>
          ) : null}
          {manager ? (
            <button
              type="button"
              className="rounded border border-rose-300 px-2 py-1 text-xs text-rose-700 hover:bg-rose-50"
              onClick={() => {
                if (window.confirm('Delete this follow-up?')) deleteMutation.mutate(f.id);
              }}
            >
              Delete
            </button>
          ) : null}
        </div>
      ),
    };
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Follow-up Management"
        description={
          manager
            ? 'Assign follow-ups on leads / inquiries to your team and track their due dates.'
            : 'Follow-ups assigned to you, with their details and due dates.'
        }
      />

      {error ? (
        <p className="rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
      ) : null}

      {overdueCount > 0 ? (
        <button
          type="button"
          className="w-full rounded border border-rose-200 bg-rose-50 px-3 py-2 text-left text-sm font-medium text-rose-700"
          onClick={() => setStatusFilter('pending')}
        >
          ⚠ {overdueCount} follow-up{overdueCount > 1 ? 's are' : ' is'} overdue.
        </button>
      ) : null}

      {manager ? (
        <form
          className="card grid gap-3 md:grid-cols-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.assigned_to) {
              setError('Please choose an employee to assign.');
              return;
            }
            createMutation.mutate({
              ...form,
              inquiry_id: form.inquiry_id ? Number(form.inquiry_id) : null,
              assigned_to: Number(form.assigned_to),
              due_date: form.due_date || null,
            });
          }}
        >
          <div className="space-y-1">
            <label className="text-sm font-medium">Lead / Inquiry (optional)</label>
            <select
              className="w-full rounded border p-2"
              value={form.inquiry_id}
              onChange={(e) => setForm({ ...form, inquiry_id: e.target.value })}
            >
              <option value="">— none —</option>
              {(Array.isArray(inquiries) ? inquiries : []).map((i) => (
                <option key={i.id} value={i.id}>
                  {i.inquiry_number} · {i.customer_name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Assign To *</label>
            <select
              className="w-full rounded border p-2"
              value={form.assigned_to}
              onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
              required
            >
              <option value="">Select employee</option>
              {(Array.isArray(assignees) ? assignees : []).map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Due Date</label>
            <input
              className="w-full rounded border p-2"
              type="datetime-local"
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
            />
          </div>

          <div className="space-y-1 md:col-span-1">
            <label className="text-sm font-medium">Title</label>
            <input
              className="w-full rounded border p-2"
              placeholder="e.g., Call for pricing feedback"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="text-sm font-medium">Notes</label>
            <input
              className="w-full rounded border p-2"
              placeholder="Context for the assignee"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          <div className="md:col-span-3">
            <button
              type="submit"
              className="rounded bg-brand-600 px-4 py-2 text-sm text-white"
              disabled={createMutation.isPending}
            >
              Assign Follow-up
            </button>
          </div>
        </form>
      ) : null}

      <div className="flex items-center gap-2">
        <label className="text-sm text-slate-600">Status</label>
        <select
          className="rounded border p-2 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="pending">Pending</option>
          <option value="done">Done</option>
          <option value="cancelled">Cancelled</option>
          <option value="all">All</option>
        </select>
      </div>

      <DataTable columns={columns} rows={rows} />

      {rows.length === 0 ? (
        <p className="text-sm text-slate-500">No follow-ups for this filter.</p>
      ) : null}

      {editing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            className="w-full max-w-md space-y-3 rounded-xl bg-white p-6"
            onSubmit={(e) => {
              e.preventDefault();
              const body = {
                title: editForm.title,
                notes: editForm.notes,
                due_date: editForm.due_date || null,
              };
              if (manager && editForm.assigned_to) body.assigned_to = Number(editForm.assigned_to);
              updateMutation.mutate({ id: editing.id, body });
              setEditing(null);
            }}
          >
            <h3 className="text-lg font-semibold">Edit Follow-up</h3>

            {manager ? (
              <div className="space-y-1">
                <label className="text-sm font-medium">Assigned To</label>
                <select
                  className="w-full rounded border p-2"
                  value={editForm.assigned_to}
                  onChange={(e) => setEditForm({ ...editForm, assigned_to: e.target.value })}
                >
                  <option value="">Select employee</option>
                  {(Array.isArray(assignees) ? assignees : []).map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
            ) : null}

            <div className="space-y-1">
              <label className="text-sm font-medium">Title</label>
              <input
                className="w-full rounded border p-2"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Due Date</label>
              <input
                type="datetime-local"
                className="w-full rounded border p-2"
                value={editForm.due_date}
                onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Notes</label>
              <textarea
                rows={2}
                className="w-full rounded border p-2"
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2">
              <button type="button" className="rounded border px-4 py-2 text-sm" onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button type="submit" className="rounded bg-brand-600 px-4 py-2 text-sm text-white">
                Save Changes
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
