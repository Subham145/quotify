import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import DataTable from '../components/shared/DataTable';
import PageHeader from '../components/shared/PageHeader';
import { api } from '../api/http';
import { useAuth } from '../lib/AuthContext';
import { canAccess } from '../lib/permissions';

export default function ProductCategories() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const canManage = canAccess(user, 'products', 'create');

  const { data: categories = [] } = useQuery({
    queryKey: ['product-categories'],
    queryFn: () => api('/product-categories'),
  });

  const [form, setForm] = useState({ name: '' });

  const createMutation = useMutation({
    mutationFn: (payload) => api('/product-categories', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['product-categories'] });
      setForm({ name: '' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api('/product-categories/' + id, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['product-categories'] }),
  });

  const columns = useMemo(
    () => [
      { key: 'name', label: 'Category Name' },
      { key: 'is_active', label: 'Status' },
      { key: 'created_at', label: 'Created' },
      ...(canManage ? [{ key: 'actions', label: 'Actions' }] : []),
    ],
    [canManage]
  );

  const rows = (Array.isArray(categories) ? categories : []).map((c) => ({
    ...c,
    is_active: c.is_active ? 'Active' : 'Inactive',
    created_at: c.created_at ? new Date(c.created_at).toLocaleDateString() : '',
    actions: (
      <button
        type="button"
        className="rounded border border-rose-300 px-2 py-1 text-xs text-rose-700 hover:bg-rose-50"
        onClick={() => {
          if (window.confirm(`Delete category "${c.name}"?`)) deleteMutation.mutate(c.id);
        }}
      >
        Delete
      </button>
    ),
  }));

  return (
    <div className="space-y-4">
      <PageHeader title="Product Categories" description="Categories a product can belong to (e.g. Digiset, Kirloskar – Dewas)." />

      {canManage ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (form.name.trim()) createMutation.mutate(form);
          }}
          className="card grid gap-3 md:grid-cols-2"
        >
          <div className="space-y-1">
            <label className="text-sm font-medium">Category Name</label>
            <input
              className="w-full rounded border p-2"
              placeholder="e.g., Digiset"
              value={form.name}
              onChange={(e) => setForm({ name: e.target.value })}
              required
            />
          </div>
          <div className="flex items-end">
            <button type="submit" className="w-full rounded bg-brand-600 px-3 py-2 text-sm text-white">
              Add Category
            </button>
          </div>
        </form>
      ) : (
        <p className="text-sm text-slate-500">Only an admin can add or remove categories.</p>
      )}

      <DataTable columns={columns} rows={rows} />
    </div>
  );
}
