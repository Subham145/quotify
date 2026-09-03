import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import DataTable from '../components/shared/DataTable';
import PageHeader from '../components/shared/PageHeader';
import { api } from '../api/http';
import { useAuth } from '../lib/AuthContext';
import { canAccess } from '../lib/permissions';

const CUSTOMER_TYPES = ['retail', 'wholesale', 'corporate', 'government'];

const emptyForm = {
  customer_name: '',
  company_name: '',
  mobile: '',
  email: '',
  gst_number: '',
  customer_type: 'retail',
  address: '',
  city: '',
  state: '',
  pin: '',
};

export default function Customers() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const canCreate = canAccess(user, 'customers', 'create');
  const canEdit = canAccess(user, 'customers', 'edit');
  const canDelete = canAccess(user, 'customers', 'delete');

  const { data: customers = [] } = useQuery({ queryKey: ['customers'], queryFn: () => api('/customers') });
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm);

  const createMutation = useMutation({
    mutationFn: (payload) => api('/customers', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      setForm(emptyForm);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => api('/customers/' + id, { method: 'PATCH', body: JSON.stringify(payload) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      setEditing(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api('/customers/' + id, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  });

  const columns = useMemo(
    () => [
      { key: 'customer_name', label: 'Customer' },
      { key: 'company_name', label: 'Company' },
      { key: 'mobile', label: 'Mobile' },
      { key: 'email', label: 'Email' },
      { key: 'customer_type', label: 'Type' },
      ...(canEdit || canDelete ? [{ key: 'actions', label: 'Actions' }] : []),
    ],
    [canEdit, canDelete]
  );

  const rows = customers.map((c) => ({
    ...c,
    actions: (
      <div className="flex gap-1">
        {canEdit ? (
          <button
            type="button"
            className="rounded border px-2 py-1 text-xs hover:bg-slate-50"
            onClick={() => {
              setEditing(c);
              setEditForm({
                customer_name: c.customer_name || '',
                company_name: c.company_name || '',
                mobile: c.mobile || '',
                email: c.email || '',
                gst_number: c.gst_number || '',
                customer_type: c.customer_type || 'retail',
                address: c.address || '',
                city: c.city || '',
                state: c.state || '',
                pin: c.pin || '',
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
              if (window.confirm(`Delete customer "${c.customer_name}"? Linked CRM leads are also removed.`))
                deleteMutation.mutate(c.id);
            }}
          >
            Delete
          </button>
        ) : null}
      </div>
    ),
  }));

  function customerFields(value, onChange) {
    return (
      <div className="grid gap-3 md:grid-cols-3">
        <input className="rounded border p-2" placeholder="Customer name" value={value.customer_name} onChange={(e) => onChange({ ...value, customer_name: e.target.value })} required />
        <input className="rounded border p-2" placeholder="Company" value={value.company_name} onChange={(e) => onChange({ ...value, company_name: e.target.value })} />
        <input className="rounded border p-2" placeholder="Mobile" value={value.mobile} onChange={(e) => onChange({ ...value, mobile: e.target.value })} />
        <input className="rounded border p-2" placeholder="Email" value={value.email} onChange={(e) => onChange({ ...value, email: e.target.value })} />
        <input className="rounded border p-2" placeholder="GST number" value={value.gst_number} onChange={(e) => onChange({ ...value, gst_number: e.target.value })} />
        <select className="rounded border p-2" value={value.customer_type} onChange={(e) => onChange({ ...value, customer_type: e.target.value })}>
          {CUSTOMER_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <input className="rounded border p-2 md:col-span-3" placeholder="Address" value={value.address} onChange={(e) => onChange({ ...value, address: e.target.value })} />
        <input className="rounded border p-2" placeholder="City" value={value.city} onChange={(e) => onChange({ ...value, city: e.target.value })} />
        <input className="rounded border p-2" placeholder="State" value={value.state} onChange={(e) => onChange({ ...value, state: e.target.value })} />
        <input className="rounded border p-2" placeholder="PIN" value={value.pin} onChange={(e) => onChange({ ...value, pin: e.target.value })} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Customers" description="Customer master with CRUD." />

      {canCreate ? (
        <form className="card space-y-3" onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }}>
          {customerFields(form, setForm)}
          <button type="submit" className="rounded bg-brand-600 px-3 py-2 text-sm text-white">Add Customer</button>
        </form>
      ) : null}

      <DataTable columns={columns} rows={rows} />

      {editing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            className="max-h-[90vh] w-full max-w-2xl space-y-4 overflow-y-auto rounded-xl bg-white p-6"
            onSubmit={(e) => {
              e.preventDefault();
              updateMutation.mutate({ id: editing.id, payload: editForm });
            }}
          >
            <h3 className="text-lg font-semibold">Edit Customer</h3>
            {customerFields(editForm, setEditForm)}
            <div className="flex justify-end gap-2">
              <button type="button" className="rounded border px-4 py-2 text-sm" onClick={() => setEditing(null)}>Cancel</button>
              <button type="submit" className="rounded bg-brand-600 px-4 py-2 text-sm text-white" disabled={updateMutation.isPending}>Save Changes</button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
