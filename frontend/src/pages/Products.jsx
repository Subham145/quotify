import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import DataTable from '../components/shared/DataTable';
import PageHeader from '../components/shared/PageHeader';
import { api } from '../api/http';
import { useAuth } from '../lib/AuthContext';
import { canAccess } from '../lib/permissions';

const UNITS = ['piece', 'kg', 'liter', 'meter', 'box', 'set', 'hour', 'service'];

const emptyForm = {
  product_name: '',
  code: '',
  group_id: '',
  subgroup_id: '',
  category: '',
  price: 0,
  gst_rate: 18,
  unit: 'piece',
};

function toArray(raw) {
  return Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
}

export default function Products() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const canCreate = canAccess(user, 'products', 'create');
  const canEdit = canAccess(user, 'products', 'edit');
  const canDelete = canAccess(user, 'products', 'delete');
  const [groupFilter, setGroupFilter] = useState('');
  const [actionError, setActionError] = useState('');

  const { data: groupsRaw } = useQuery({ queryKey: ['product-groups'], queryFn: () => api('/product-groups') });
  const { data: subGroupsRaw } = useQuery({ queryKey: ['product-subgroups'], queryFn: () => api('/product-subgroups') });
  const { data: categoriesRaw } = useQuery({ queryKey: ['product-categories'], queryFn: () => api('/product-categories') });
  const { data: productsRaw } = useQuery({
    queryKey: ['products', groupFilter],
    queryFn: () => api(groupFilter ? '/products?group_id=' + groupFilter : '/products'),
  });

  const groups = toArray(groupsRaw);
  const subGroups = toArray(subGroupsRaw);
  const categories = toArray(categoriesRaw);
  const products = toArray(productsRaw);

  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm);

  const createMutation = useMutation({
    mutationFn: (payload) => api('/products', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      setForm(emptyForm);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => api('/products/' + id, { method: 'PATCH', body: JSON.stringify(payload) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      setEditing(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api('/products/' + id, { method: 'DELETE' }),
    onSuccess: (res) => {
      if (res?.message) {
        setActionError(res.message);
        return;
      }
      setActionError('');
      qc.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const columns = useMemo(
    () => [
      { key: 'product_name', label: 'Product' },
      { key: 'code', label: 'Code' },
      { key: 'category', label: 'Category' },
      { key: 'group_name', label: 'Group' },
      { key: 'subgroup_name', label: 'Sub Group' },
      { key: 'price', label: 'Price' },
      { key: 'gst_rate', label: 'GST %' },
      { key: 'unit', label: 'Unit' },
      ...(canEdit || canDelete ? [{ key: 'actions', label: 'Actions' }] : []),
    ],
    [canEdit, canDelete]
  );

  const rows = products.map((p) => ({
    ...p,
    actions: (
      <div className="flex gap-1">
        {canEdit ? (
          <button
            type="button"
            className="rounded border px-2 py-1 text-xs hover:bg-slate-50"
            onClick={() => {
              setEditing(p);
              setEditForm({
                product_name: p.product_name || '',
                code: p.code || '',
                group_id: p.group_id ? String(p.group_id) : '',
                subgroup_id: p.subgroup_id ? String(p.subgroup_id) : '',
                category: p.category || '',
                price: Number(p.price || 0),
                gst_rate: Number(p.gst_rate || 0),
                unit: p.unit || 'piece',
              });
            }}
          >
            Edit
          </button>
        ) : null}
        {canDelete ? (
          <button
            type="button"
            className="rounded border border-rose-300 px-2 py-1 text-xs text-rose-700 hover:bg-rose-50"
            onClick={() => {
              setActionError('');
              if (window.confirm(`Delete product "${p.product_name}"?`)) deleteMutation.mutate(p.id);
            }}
          >
            Delete
          </button>
        ) : null}
      </div>
    ),
  }));

  function productFields(value, onChange) {
    return (
      <div className="grid gap-3 md:grid-cols-3">
        <div className="space-y-1">
          <label className="text-sm font-medium">Product Name</label>
          <input
            className="w-full rounded border p-2"
            value={value.product_name}
            onChange={(e) => onChange({ ...value, product_name: e.target.value })}
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Product Code</label>
          <input
            className="w-full rounded border p-2"
            value={value.code}
            onChange={(e) => onChange({ ...value, code: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Category</label>
          <select
            className="w-full rounded border p-2"
            value={value.category}
            onChange={(e) => onChange({ ...value, category: e.target.value })}
          >
            <option value="">Select Category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Price (Rs.)</label>
          <input
            className="w-full rounded border p-2"
            type="number"
            value={value.price}
            onChange={(e) => onChange({ ...value, price: Number(e.target.value) })}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">GST Rate (%)</label>
          <input
            className="w-full rounded border p-2"
            type="number"
            value={value.gst_rate}
            onChange={(e) => onChange({ ...value, gst_rate: Number(e.target.value) })}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Product Group</label>
          <select
            className="w-full rounded border p-2"
            value={value.group_id}
            onChange={(e) => onChange({ ...value, group_id: e.target.value, subgroup_id: '' })}
          >
            <option value="">Select Group</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.group_name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Product SubGroup</label>
          <select
            className="w-full rounded border p-2"
            value={value.subgroup_id}
            onChange={(e) => onChange({ ...value, subgroup_id: e.target.value })}
          >
            <option value="">Select SubGroup</option>
            {subGroups
              .filter((s) => Number(s.group_id) === Number(value.group_id))
              .map((s) => (
                <option key={s.id} value={s.id}>{s.subgroup_name}</option>
              ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Unit</label>
          <select
            className="w-full rounded border p-2"
            value={value.unit}
            onChange={(e) => onChange({ ...value, unit: e.target.value })}
          >
            {UNITS.map((u) => (
              <option key={u}>{u}</option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Products & Services" description="Catalog, group filter and CSV export." />

      {actionError ? (
        <p className="rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{actionError}</p>
      ) : null}

      {canCreate ? (
        <form
          className="card space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate({
              ...form,
              group_id: form.group_id ? Number(form.group_id) : null,
              subgroup_id: form.subgroup_id ? Number(form.subgroup_id) : null,
            });
          }}
        >
          {productFields(form, setForm)}
          <button type="submit" className="rounded bg-brand-600 px-3 py-2 text-sm text-white">
            Add Product
          </button>
        </form>
      ) : null}

      <div className="flex items-center justify-between">
        <select
          className="rounded border p-2"
          value={groupFilter}
          onChange={(e) => setGroupFilter(e.target.value)}
        >
          <option value="">All Groups</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>{g.group_name}</option>
          ))}
        </select>

        <a className="rounded border px-3 py-2 text-sm" href="/api/products/export/csv" target="_blank" rel="noreferrer">
          Export CSV
        </a>
      </div>

      <DataTable columns={columns} rows={rows} />

      {editing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            className="max-h-[90vh] w-full max-w-2xl space-y-4 overflow-y-auto rounded-xl bg-white p-6"
            onSubmit={(e) => {
              e.preventDefault();
              updateMutation.mutate({
                id: editing.id,
                payload: {
                  ...editForm,
                  group_id: editForm.group_id ? Number(editForm.group_id) : null,
                  subgroup_id: editForm.subgroup_id ? Number(editForm.subgroup_id) : null,
                },
              });
            }}
          >
            <h3 className="text-lg font-semibold">Edit Product</h3>
            {productFields(editForm, setEditForm)}
            <div className="flex justify-end gap-2">
              <button type="button" className="rounded border px-4 py-2 text-sm" onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button type="submit" className="rounded bg-brand-600 px-4 py-2 text-sm text-white" disabled={updateMutation.isPending}>
                Save Changes
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
