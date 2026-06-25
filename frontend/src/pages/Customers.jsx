import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import DataTable from '../components/shared/DataTable';
import PageHeader from '../components/shared/PageHeader';
import { api } from '../api/http';

export default function Customers() {
  const qc = useQueryClient();
  const { data: customers = [] } = useQuery({ queryKey: ['customers'], queryFn: () => api('/customers') });
  const [form, setForm] = useState({ customer_name: '', company_name: '', mobile: '', email: '', customer_type: 'retail' });

  const createMutation = useMutation({
    mutationFn: (payload) => api('/customers', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      setForm({ customer_name: '', company_name: '', mobile: '', email: '', customer_type: 'retail' });
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
      { key: 'actions', label: 'Actions' },
    ],
    []
  );

  const rows = customers.map((c) => ({
    ...c,
    actions: <button type="button" className="rounded border px-2 py-1 text-xs" onClick={() => deleteMutation.mutate(c.id)}>Delete</button>,
  }));

  return (
    <div className="space-y-4">
      <PageHeader title="Customers" description="Customer master with CRUD." />

      <form className="card grid gap-3 md:grid-cols-3" onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }}>
        <input className="rounded border p-2" placeholder="Customer name" value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} required />
        <input className="rounded border p-2" placeholder="Company" value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
        <input className="rounded border p-2" placeholder="Mobile" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
        <input className="rounded border p-2" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <select className="rounded border p-2" value={form.customer_type} onChange={(e) => setForm({ ...form, customer_type: e.target.value })}>
          <option value="retail">retail</option>
          <option value="wholesale">wholesale</option>
          <option value="corporate">corporate</option>
          <option value="government">government</option>
        </select>
        <button type="submit" className="rounded bg-brand-600 px-3 py-2 text-sm text-white">Add Customer</button>
      </form>

      <DataTable columns={columns} rows={rows} />
    </div>
  );
}
