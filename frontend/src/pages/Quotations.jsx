import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import DataTable from '../components/shared/DataTable';
import PageHeader from '../components/shared/PageHeader';
import { api } from '../api/http';

export default function Quotations() {
  const qc = useQueryClient();
  const { data: quotations = [] } = useQuery({ queryKey: ['quotations'], queryFn: () => api('/quotations') });
  const { data: customers = [] } = useQuery({ queryKey: ['customers'], queryFn: () => api('/customers') });
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [busyRowId, setBusyRowId] = useState(null);

  const [form, setForm] = useState({
    customer_name: '',
    company_name: '',
    status: 'draft',
    items: [{ description: '', qty: 1, rate: 0, discount_pct: 0, gst_pct: 18 }],
  });

  const createMutation = useMutation({
    mutationFn: (payload) => api('/quotations', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => {
      setForm({ customer_name: '', company_name: '', status: 'draft', items: [{ description: '', qty: 1, rate: 0, discount_pct: 0, gst_pct: 18 }] });
      qc.invalidateQueries({ queryKey: ['quotations'] });
      setActionError('');
      setActionMessage('Quotation created successfully.');
    },
    onError: (err) => setActionError(err.message || 'Failed to create quotation'),
  });

  const duplicateMutation = useMutation({
    mutationFn: (id) => api('/quotations/' + id + '/duplicate', { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quotations'] });
      setActionError('');
      setActionMessage('Quotation duplicated successfully.');
    },
    onError: (err) => setActionError(err.message || 'Failed to duplicate quotation'),
  });

  const actionMutation = useMutation({
    mutationFn: ({ id, action, body }) => api('/quotations/' + id + '/' + action, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quotations'] });
      qc.invalidateQueries({ queryKey: ['reminders'] });
      setActionError('');
      setActionMessage('Action completed successfully.');
    },
    onError: (err) => setActionError(err.message || 'Action failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api('/quotations/' + id, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quotations'] });
      setActionError('');
      setActionMessage('Quotation deleted successfully.');
    },
    onError: (err) => setActionError(err.message || 'Failed to delete quotation'),
  });

  const columns = useMemo(
    () => [
      { key: 'quotation_number', label: 'Quotation No' },
      { key: 'customer_name', label: 'Customer' },
      { key: 'total_amount', label: 'Amount' },
      { key: 'status', label: 'Status' },
      { key: 'assigned_name', label: 'Assigned To' },
      { key: 'actions', label: 'Actions' },
    ],
    []
  );

  async function runRowAction(rowId, fn) {
    setActionError('');
    setActionMessage('');
    setBusyRowId(rowId);
    try {
      await fn();
    } finally {
      setBusyRowId(null);
    }
  }

  const rows = quotations.map((q) => ({
    ...q,
    actions: (
      <div className="flex flex-wrap gap-1">
        <button
          type="button"
          className="rounded border px-2 py-1 text-xs disabled:opacity-60"
          disabled={busyRowId === q.id}
          onClick={() => runRowAction(q.id, () => duplicateMutation.mutateAsync(q.id))}
        >
          Duplicate
        </button>
        <button
          type="button"
          className="rounded border px-2 py-1 text-xs disabled:opacity-60"
          disabled={busyRowId === q.id}
          onClick={() => runRowAction(q.id, () => actionMutation.mutateAsync({ id: q.id, action: 'convert-to-invoice' }))}
        >
          Invoice
        </button>
<a

href={`/api/quotations/${q.id}/pdf`}

target="_blank"

rel="noreferrer"

className="rounded border border-indigo-500 px-2 py-1 text-xs text-indigo-600"

>

Download PDF

</a>

        <button
          type="button"
          className="rounded border border-rose-300 px-2 py-1 text-xs text-rose-700 disabled:opacity-60"
          disabled={busyRowId === q.id}
          onClick={() => runRowAction(q.id, () => {
            const ok = window.confirm(`Delete quotation ${q.quotation_number}?`);
            if (!ok) return Promise.resolve();
            return deleteMutation.mutateAsync(q.id);
          })}
        >
          Delete
        </button>
      </div>
    ),
  }));

  const item = form.items[0];
  const baseAmount = Number(item.qty || 0) * Number(item.rate || 0);
  const discountAmount = (baseAmount * Number(item.discount_pct || 0)) / 100;
  const amountAfterDiscount = baseAmount - discountAmount;
  const gstAmount = (amountAfterDiscount * Number(item.gst_pct || 0)) / 100;
  const estimatedTotal = amountAfterDiscount + gstAmount;

  function submitQuotation(e) {
    e.preventDefault();
    createMutation.mutate(form);
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Quotations" description="Create and manage quotations with duplicate and convert actions." />
      {actionMessage ? <p className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{actionMessage}</p> : null}
      {actionError ? <p className="rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{actionError}</p> : null}

      <form className="card space-y-3" onSubmit={submitQuotation}>
        <div className="grid gap-3 md:grid-cols-3">
          <input className="rounded border p-2" placeholder="Customer name" value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} required />
          <input className="rounded border p-2" placeholder="Company" value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
          <select className="rounded border p-2" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="draft">draft</option>
            <option value="sent">sent</option>
            <option value="approved">approved</option>
            <option value="rejected">rejected</option>
            <option value="converted">converted</option>
          </select>
        </div>

        <div className="rounded border p-3">
          <p className="mb-2 text-sm font-medium">Line Item</p>
          <p className="mb-3 text-xs text-slate-500">
            Fill one product/service line. Total is calculated as: (Qty x Rate) - Discount + GST
          </p>
          <div className="grid gap-2 md:grid-cols-5">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Item Description</label>
              <input className="w-full rounded border p-2" placeholder="e.g. Cotton Shirt - Bulk" value={form.items[0].description} onChange={(e) => setForm({ ...form, items: [{ ...form.items[0], description: e.target.value }] })} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Quantity</label>
              <input className="w-full rounded border p-2" type="number" placeholder="e.g. 100" value={form.items[0].qty} onChange={(e) => setForm({ ...form, items: [{ ...form.items[0], qty: Number(e.target.value) }] })} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Rate (per unit)</label>
              <input className="w-full rounded border p-2" type="number" placeholder="e.g. 250" value={form.items[0].rate} onChange={(e) => setForm({ ...form, items: [{ ...form.items[0], rate: Number(e.target.value) }] })} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Discount %</label>
              <input className="w-full rounded border p-2" type="number" placeholder="e.g. 5" value={form.items[0].discount_pct} onChange={(e) => setForm({ ...form, items: [{ ...form.items[0], discount_pct: Number(e.target.value) }] })} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">GST %</label>
              <input className="w-full rounded border p-2" type="number" placeholder="e.g. 18" value={form.items[0].gst_pct} onChange={(e) => setForm({ ...form, items: [{ ...form.items[0], gst_pct: Number(e.target.value) }] })} />
            </div>
          </div>
          <p className="mt-3 text-sm font-medium text-slate-700">
            Estimated Line Total: Rs. {estimatedTotal.toFixed(2)}
          </p>
        </div>

        <button type="submit" className="rounded bg-brand-600 px-3 py-2 text-sm text-white">Create Quotation</button>
      </form>

      <DataTable columns={columns} rows={rows} />

      {customers.length ? <p className="text-xs text-slate-500">Customers available: {customers.length}</p> : null}
    </div>
  );
}
