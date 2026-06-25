import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import DataTable from '../components/shared/DataTable';
import PageHeader from '../components/shared/PageHeader';
import { api } from '../api/http';
import StatusBadge from '../components/shared/StatusBadge';

export default function Inquiries() {
  const qc = useQueryClient();
  const { data: inquiries = [] } = useQuery({ queryKey: ['inquiries'], queryFn: () => api('/inquiries') });
  const { data: sources = [] } = useQuery({ queryKey: ['inquiry-sources'], queryFn: () => api('/inquiry-sources') });

  const [form, setForm] = useState({
    customer_name: '',
    company: '',
    mobile: '',
    source: 'WhatsApp',
    status: 'new',
    follow_up_date: '',
  });

  const createMutation = useMutation({
    mutationFn: (payload) => api('/inquiries', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => {
      setForm({ customer_name: '', company: '', mobile: '', source: 'WhatsApp', status: 'new', follow_up_date: '' });
      qc.invalidateQueries({ queryKey: ['inquiries'] });
      qc.invalidateQueries({ queryKey: ['inquiries-stats'] });
      qc.invalidateQueries({ queryKey: ['crm-leads'] });
    },
  });

  const convertMutation = useMutation({
    mutationFn: (id) => api('/inquiries/' + id + '/convert-to-quotation', { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inquiries'] });
      qc.invalidateQueries({ queryKey: ['quotations'] });
      qc.invalidateQueries({ queryKey: ['inquiries-stats'] });
    },
  });

  const columns = useMemo(
    () => [
      { key: 'inquiry_number', label: 'Inquiry No' },
      { key: 'customer_name', label: 'Customer' },
      { key: 'source', label: 'Source' },
      { key: 'status', label: 'Status' },
      { key: 'assigned_name', label: 'Assigned To' },
      { key: 'actions', label: 'Actions' },
    ],
    []
  );

  const rows = inquiries.map((i) => ({
    ...i,
    status: <StatusBadge value={i.status} />,
    actions:
      i.status !== 'converted' ? (
        <button
          type="button"
          onClick={() => convertMutation.mutate(i.id)}
          className="rounded-lg border px-2 py-1 text-xs hover:bg-slate-50"
        >
          Convert
        </button>
      ) : (
        <span className="text-xs text-emerald-700">Done</span>
      ),
  }));

  function onSubmit(e) {
    e.preventDefault();
    createMutation.mutate(form);
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Inquiries" description="Capture and convert leads to quotations." />

      <form onSubmit={onSubmit} className="card grid gap-3 md:grid-cols-3">
        <input className="rounded-lg border p-2" placeholder="Customer name" value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} required />
        <input className="rounded-lg border p-2" placeholder="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
        <input className="rounded-lg border p-2" placeholder="Mobile" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
        <select className="rounded-lg border p-2" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
          {sources.map((s) => (
            <option key={s.id} value={s.source_name}>{s.source_name}</option>
          ))}
        </select>
        <select className="rounded-lg border p-2" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
          <option value="new">new</option>
          <option value="follow_up">follow_up</option>
          <option value="converted">converted</option>
          <option value="lost">lost</option>
        </select>
        <input className="rounded-lg border p-2" type="datetime-local" value={form.follow_up_date} onChange={(e) => setForm({ ...form, follow_up_date: e.target.value })} />
        <button type="submit" className="rounded-lg bg-brand-600 px-3 py-2 text-sm text-white">Add Inquiry</button>
      </form>

      <DataTable columns={columns} rows={rows} />
    </div>
  );
}
