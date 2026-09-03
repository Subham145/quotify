import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import DataTable from '../components/shared/DataTable';
import PageHeader from '../components/shared/PageHeader';
import { api } from '../api/http';
import { useAuth } from '../lib/AuthContext';

export default function Users() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const isSuperAdmin = user?.role === 'SuperAdmin';

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => api('/users'),
    enabled: isSuperAdmin,
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: () => api('/roles'),
    enabled: isSuperAdmin,
  });

  const roleList = Array.isArray(roles) ? roles : [];
  const inviteRoles = roleList.filter((r) => r.base_role !== 'SuperAdmin');
  const defaultRoleId = String(inviteRoles.find((r) => r.name === 'User')?.id || inviteRoles[0]?.id || '');

  const [form, setForm] = useState({ name: '', email: '', role_id: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', role_id: '', password: '' });

  const inviteMutation = useMutation({
    mutationFn: (payload) => api('/users/invite', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      setForm({ name: '', email: '', role_id: defaultRoleId, password: '' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api(`/users/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });

  const updateMutation = useMutation({
    mutationFn: (payload) => api(`/users/${editingUser.id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      setEditingUser(null);
    },
  });

  const columns = useMemo(
    () => [
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'role_name', label: 'Role' },
      { key: 'is_active', label: 'Active' },
      { key: 'actions', label: 'Actions' },
    ],
    []
  );

  if (!isSuperAdmin) {
    return (
      <div>
        <PageHeader title="User Management" description="SuperAdmin only." />
        <div className="card">Only SuperAdmin can manage users</div>
      </div>
    );
  }

  const rows = (Array.isArray(users) ? users : []).map((u) => ({
    ...u,
    role_name: u.role_name || u.role,
    is_active: u.is_active ? 'Yes' : 'No',
    actions: (
      <div className="flex gap-2">
        <button
          type="button"
          className="rounded border px-2 py-1 text-xs"
          onClick={() => {
            setEditingUser(u);
            setEditForm({
              name: u.name || '',
              email: u.email || '',
              role_id: String(u.role_id || ''),
              password: '',
            });
          }}
        >
          Edit
        </button>
        <button
          type="button"
          className="rounded border px-2 py-1 text-xs text-rose-600"
          onClick={() => {
            if (window.confirm('Delete this user?')) deleteMutation.mutate(u.id);
          }}
        >
          Delete
        </button>
      </div>
    ),
  }));

  return (
    <div className="space-y-4">
      <PageHeader title="User Management" description="Invite users and assign a role." />

      <form
        className="card grid gap-3 md:grid-cols-5"
        onSubmit={(e) => {
          e.preventDefault();
          inviteMutation.mutate({ ...form, role_id: Number(form.role_id || defaultRoleId) });
        }}
      >
        <input
          className="rounded border p-2"
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          className="rounded border p-2"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <select
          className="rounded border p-2"
          value={form.role_id || defaultRoleId}
          onChange={(e) => setForm({ ...form, role_id: e.target.value })}
        >
          {inviteRoles.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
        <div className="relative">
          <input
            className="w-full rounded border p-2 pr-10"
            placeholder="Password"
            type={showPassword ? 'text' : 'password'}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2"
            onClick={() => setShowPassword(!showPassword)}
          >
            👁️
          </button>
        </div>
        <button type="submit" className="rounded bg-brand-600 px-3 py-2 text-white">
          Invite
        </button>
      </form>

      <DataTable columns={columns} rows={rows} />

      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-[500px] rounded-xl bg-white p-6">
            <h3 className="mb-4 text-lg font-semibold">Edit User</h3>
            <div className="space-y-3">
              <input
                className="w-full rounded border p-2"
                placeholder="Name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
              <input
                className="w-full rounded border p-2"
                placeholder="Email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
              <select
                className="w-full rounded border p-2"
                value={editForm.role_id}
                onChange={(e) => setEditForm({ ...editForm, role_id: e.target.value })}
              >
                <option value="">Keep current role</option>
                {roleList.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
              <input
                type="password"
                className="w-full rounded border p-2"
                placeholder="New Password"
                value={editForm.password}
                onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
              />
              <div className="flex gap-2">
                <button
                  className="rounded bg-blue-600 px-4 py-2 text-white"
                  onClick={() => {
                    const payload = { name: editForm.name, email: editForm.email };
                    if (editForm.role_id) payload.role_id = Number(editForm.role_id);
                    if (editForm.password) payload.password = editForm.password;
                    updateMutation.mutate(payload);
                  }}
                >
                  Save
                </button>
                <button className="rounded border px-4 py-2" onClick={() => setEditingUser(null)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
