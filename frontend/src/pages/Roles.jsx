import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import PageHeader from '../components/shared/PageHeader';
import { api } from '../api/http';
import { useAuth } from '../lib/AuthContext';
import { PERMISSION_ACTIONS, PERMISSION_MODULES, MODULE_LABELS } from '../lib/permissions';

function emptyMatrix(allowed = false) {
  const out = {};
  PERMISSION_MODULES.forEach((m) => {
    out[m] = {};
    PERMISSION_ACTIONS.forEach((a) => {
      out[m][a] = allowed;
    });
  });
  return out;
}

const blankForm = { name: '', description: '', base_role: 'User', permissions: emptyMatrix(false) };

export default function Roles() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [form, setForm] = useState(blankForm);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: () => api('/roles'),
    enabled: user?.role === 'SuperAdmin',
  });

  const saveMutation = useMutation({
    mutationFn: (payload) =>
      editingId
        ? api('/roles/' + editingId, { method: 'PATCH', body: JSON.stringify(payload) })
        : api('/roles', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: (res) => {
      if (res?.message) {
        setError(res.message);
        return;
      }
      qc.invalidateQueries({ queryKey: ['roles'] });
      setForm(blankForm);
      setEditingId(null);
      setMessage(editingId ? 'Role updated' : 'Role created');
      setError('');
    },
    onError: (e) => setError(e.message || 'Failed to save role'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api('/roles/' + id, { method: 'DELETE' }),
    onSuccess: (res) => {
      if (res?.message) {
        setError(res.message);
        return;
      }
      qc.invalidateQueries({ queryKey: ['roles'] });
      setMessage('Role deleted');
    },
  });

  const editingRole = useMemo(
    () => (Array.isArray(roles) ? roles.find((r) => r.id === editingId) : null),
    [roles, editingId]
  );
  const systemLocked = Boolean(editingRole?.is_system);

  function startEdit(role) {
    setEditingId(role.id);
    setForm({
      name: role.name,
      description: role.description || '',
      base_role: role.base_role,
      permissions: { ...emptyMatrix(false), ...role.permissions },
    });
    setMessage('');
    setError('');
  }

  function toggle(module, action) {
    setForm((f) => ({
      ...f,
      permissions: {
        ...f.permissions,
        [module]: { ...f.permissions[module], [action]: !f.permissions[module]?.[action] },
      },
    }));
  }

  if (user?.role !== 'SuperAdmin') {
    return (
      <div className="space-y-4">
        <PageHeader title="Roles & Permissions" description="SuperAdmin only." />
        <div className="card">Only a SuperAdmin can manage roles.</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Roles & Permissions" description="Create roles, describe responsibilities and set module permissions." />

      {message ? <p className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

      <div className="card overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-3 py-2">Role</th>
              <th className="px-3 py-2">Base</th>
              <th className="px-3 py-2">Responsibilities</th>
              <th className="px-3 py-2">Users</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(Array.isArray(roles) ? roles : []).map((r) => (
              <tr key={r.id}>
                <td className="px-3 py-2 font-medium">
                  {r.name}
                  {r.is_system ? <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">system</span> : null}
                </td>
                <td className="px-3 py-2">{r.base_role}</td>
                <td className="px-3 py-2 text-slate-500">{r.description || '-'}</td>
                <td className="px-3 py-2">{r.user_count ?? 0}</td>
                <td className="px-3 py-2">
                  <div className="flex gap-2">
                    <button type="button" className="rounded border px-2 py-1 text-xs" onClick={() => startEdit(r)}>
                      Edit
                    </button>
                    {!r.is_system ? (
                      <button
                        type="button"
                        className="rounded border border-rose-300 px-2 py-1 text-xs text-rose-700"
                        onClick={() => {
                          if (window.confirm(`Delete role "${r.name}"? Its users move to the User role.`)) deleteMutation.mutate(r.id);
                        }}
                      >
                        Delete
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form
        className="card space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          saveMutation.mutate(form);
        }}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">{editingId ? `Edit role: ${form.name}` : 'Create new role'}</h3>
          {editingId ? (
            <button
              type="button"
              className="text-xs text-slate-500 underline"
              onClick={() => {
                setEditingId(null);
                setForm(blankForm);
              }}
            >
              Cancel edit
            </button>
          ) : null}
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">Role Name</label>
            <input
              className="w-full rounded border p-2 disabled:bg-slate-100"
              value={form.name}
              disabled={systemLocked}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Base Behaviour</label>
            <select
              className="w-full rounded border p-2 disabled:bg-slate-100"
              value={form.base_role}
              disabled={systemLocked}
              onChange={(e) => setForm({ ...form, base_role: e.target.value })}
            >
              <option value="User">User (sees own records only)</option>
              <option value="Admin">Admin (sees all records)</option>
            </select>
          </div>
          <div className="space-y-1 md:col-span-3">
            <label className="text-sm font-medium">Roles &amp; Responsibilities</label>
            <textarea
              className="w-full rounded border p-2"
              rows={2}
              placeholder="What is this role responsible for?"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded border">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-3 py-2">Module</th>
                {PERMISSION_ACTIONS.map((a) => (
                  <th key={a} className="px-3 py-2 capitalize">{a}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {PERMISSION_MODULES.map((m) => (
                <tr key={m}>
                  <td className="px-3 py-2 font-medium">{MODULE_LABELS[m] || m}</td>
                  {PERMISSION_ACTIONS.map((a) => (
                    <td key={a} className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={Boolean(form.permissions[m]?.[a])}
                        onChange={() => toggle(m, a)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button type="submit" className="rounded bg-brand-600 px-4 py-2 text-sm text-white" disabled={saveMutation.isPending}>
          {editingId ? 'Save Changes' : 'Create Role'}
        </button>
      </form>
    </div>
  );
}
