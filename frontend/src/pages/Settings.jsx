import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import PageHeader from '../components/shared/PageHeader';
import { api } from '../api/http';
import { useAuth } from '../lib/AuthContext';

export default function Settings() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['company-settings'], queryFn: () => api('/settings/company') });
  const [form, setForm] = useState(null);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: (payload) => api('/settings/company', { method: 'PUT', body: JSON.stringify(payload) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['company-settings'] }),
  });

  if (!form) return <div className="p-6">Loading settings...</div>;

  return (
    <div className="space-y-4">
      <PageHeader title="Settings" description="Company profile and document prefixes." />

      <form className="card grid gap-3 md:grid-cols-3" onSubmit={(e) => { e.preventDefault(); updateMutation.mutate(form); }}>
        <input className="rounded border p-2" placeholder="Company name" value={form.company_name || ''} onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
        <input className="rounded border p-2" placeholder="GST" value={form.gst_number || ''} onChange={(e) => setForm({ ...form, gst_number: e.target.value })} />
        <input className="rounded border p-2" placeholder="Email" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="rounded border p-2" placeholder="Quotation prefix" value={form.quotation_prefix || ''} onChange={(e) => setForm({ ...form, quotation_prefix: e.target.value })} />
        <input className="rounded border p-2" placeholder="Challan prefix" value={form.challan_prefix || ''} onChange={(e) => setForm({ ...form, challan_prefix: e.target.value })} />
        <input className="rounded border p-2" placeholder="Invoice prefix" value={form.invoice_prefix || ''} onChange={(e) => setForm({ ...form, invoice_prefix: e.target.value })} />
        <input className="rounded border p-2" placeholder="Currency" value={form.currency || ''} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
        <input className="rounded border p-2" type="number" placeholder="Default tax rate" value={form.default_tax_rate || 0} onChange={(e) => setForm({ ...form, default_tax_rate: Number(e.target.value) })} />
        <button type="submit" className="rounded bg-brand-600 px-3 py-2 text-sm text-white" disabled={user?.role !== 'Admin' && user?.role !== 'SuperAdmin'}>
          Save Settings
        </button>
      </form>

      {user?.role !== 'Admin' && user?.role !== 'SuperAdmin' ? <p className="text-sm text-slate-500">Only Admin or SuperAdmin can update settings.</p> : null}
    </div>
  );
}
