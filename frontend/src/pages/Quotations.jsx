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
  const [parsingPdf, setParsingPdf] = useState(false);

  const [form, setForm] = useState({
    customer_name: '',
    company_name: '',
    status: 'draft',
    category: 'DEWAS',
    items: [
      {
        description: '',
        model: '',
        hp: '',
        head: '',
        flow: '',
        size: '',
        qty: 1,
        rate: 0,
        discount_pct: 0,
        gst_pct: 18,
        custom_fields: {},
      },
    ],
  });

  const createMutation = useMutation({
    mutationFn: (payload) => api('/quotations', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => {
      setForm({
        customer_name: '',
        company_name: '',
        status: 'draft',
        category: 'DEWAS',
        items: [
          {
            description: '',
            model: '',
            hp: '',
            head: '',
            flow: '',
            size: '',
            qty: 1,
            rate: 0,
            discount_pct: 0,
            gst_pct: 18,
            custom_fields: {},
          },
        ],
      });
      qc.invalidateQueries({ queryKey: ['quotations'] });
      setActionError('');
      setActionMessage('Quotation created successfully.');
    },
    onError: (err) => setActionError(err.message || 'Failed to create quotation'),
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, category }) => api(`/quotations/${id}`, { method: 'PATCH', body: JSON.stringify({ category }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quotations'] });
      setActionMessage('Category updated successfully.');
      setActionError('');
    },
    onError: (err) => setActionError(err.message || 'Failed to update category'),
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

  const addItem = () => {
    setForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          description: '',
          model: '',
          hp: '',
          head: '',
          flow: '',
          size: '',
          qty: 1,
          rate: 0,
          discount_pct: 0,
          gst_pct: 18,
          custom_fields: {},
        },
      ],
    }));
  };

  const removeItem = (index) => {
    if (form.items.length <= 1) return;
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const updateItem = (index, field, value) => {
    setForm((prev) => {
      const items = [...prev.items];
      items[index] = { ...items[index], [field]: value };
      return { ...prev, items };
    });
  };

  const updateItemCustomField = (itemIndex, key, value) => {
    setForm((prev) => {
      const items = [...prev.items];
      const custom_fields = { ...(items[itemIndex].custom_fields || {}), [key]: value };
      items[itemIndex] = { ...items[itemIndex], custom_fields };
      return { ...prev, items };
    });
  };

  const addCustomFieldToItem = (itemIndex) => {
    const name = window.prompt('Enter field name (e.g. Impeller Dia, MOC, Phase):');
    if (!name || !name.trim()) return;
    updateItemCustomField(itemIndex, name.trim(), '');
  };

  const deleteCustomFieldFromItem = (itemIndex, key) => {
    setForm((prev) => {
      const items = [...prev.items];
      const custom_fields = { ...(items[itemIndex].custom_fields || {}) };
      delete custom_fields[key];
      items[itemIndex] = { ...items[itemIndex], custom_fields };
      return { ...prev, items };
    });
  };

  const handlePdfUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setParsingPdf(true);
    setActionError('');
    setActionMessage('Parsing PDF file...');

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const base64 = evt.target.result;
        const res = await api('/quotations/parse-pdf', {
          method: 'POST',
          body: JSON.stringify({ file_base64: base64 }),
        });

        if (res?.items && res.items.length > 0) {
          const items = res.items.map((it) => ({
            description: it.description || '',
            model: it.model || '',
            hp: it.motor_hp || '',
            head: it.head || '',
            flow: it.flow_rate || '',
            size: it.size || '',
            qty: Number(it.qty || 1),
            rate: Number(it.rate || 0),
            discount_pct: Number(it.discount_pct || 0),
            gst_pct: Number(it.gst_pct || 18),
            custom_fields: it.custom_fields || {},
          }));

          setForm((prev) => ({
            ...prev,
            items,
          }));

          setActionMessage(`Extracted ${res.items.length} line items from PDF successfully!`);
        } else {
          setActionError('No line items could be parsed from the PDF.');
        }
      } catch (err) {
        setActionError(err.message || 'PDF parse failed');
      } finally {
        setParsingPdf(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const columns = useMemo(
    () => [
      { key: 'quotation_number', label: 'Quotation No' },
      { key: 'customer_name', label: 'Customer' },
      { key: 'total_amount', label: 'Amount' },
      { key: 'status', label: 'Status' },
      { key: 'category', label: 'Category' },
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
    category: (
      <select
        className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-800 shadow-sm focus:border-brand-500 focus:outline-none"
        value={q.category || 'DEWAS'}
        onChange={(e) => updateCategoryMutation.mutate({ id: q.id, category: e.target.value })}
      >
        <option value="DIGISET">DIGISET</option>
        <option value="DEWAS">DEWAS</option>
        <option value="WADI">WADI</option>
      </select>
    ),
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
          onClick={() =>
            runRowAction(q.id, () => {
              const ok = window.confirm(`Delete quotation ${q.quotation_number}?`);
              if (!ok) return Promise.resolve();
              return deleteMutation.mutateAsync(q.id);
            })
          }
        >
          Delete
        </button>
      </div>
    ),
  }));

  function submitQuotation(e) {
    e.preventDefault();
    createMutation.mutate(form);
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Quotations" description="Create and manage quotations with duplicate and convert actions." />
      {actionMessage ? <p className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{actionMessage}</p> : null}
      {actionError ? <p className="rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{actionError}</p> : null}

      <form className="card space-y-4" onSubmit={submitQuotation}>
        <div className="grid gap-3 md:grid-cols-4">
          <input className="rounded border p-2" placeholder="Customer name" value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} required />
          <input className="rounded border p-2" placeholder="Company" value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
          <select className="rounded border p-2" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="draft">draft</option>
            <option value="sent">sent</option>
            <option value="approved">approved</option>
            <option value="rejected">rejected</option>
            <option value="converted">converted</option>
          </select>
          <select
            className="rounded border border-brand-300 bg-brand-50 p-2 font-bold text-brand-800"
            value={form.category || 'DEWAS'}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            <option value="DIGISET">DIGISET</option>
            <option value="DEWAS">DEWAS</option>
            <option value="WADI">WADI</option>
          </select>
        </div>

        {/* Line Item Details Section */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <div>
              <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <span>Line Item Details</span>
                <span className="rounded bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700">
                  {form.category || 'DEWAS'} Category
                </span>
              </h4>
              <p className="text-xs text-slate-500">
                Configure line items and fields for {form.category || 'DEWAS'}. You can add, edit, or delete dynamic fields.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition-colors">
                <span>📄</span>
                <span>{parsingPdf ? 'Parsing PDF...' : 'Upload PDF to Auto-Fill'}</span>
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  disabled={parsingPdf}
                  onChange={handlePdfUpload}
                />
              </label>

              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 shadow-sm"
              >
                <span>+</span>
                <span>Add Line Item</span>
              </button>
            </div>
          </div>

          {/* Line Item Cards */}
          <div className="space-y-4">
            {form.items.map((item, idx) => {
              const lineBase = Number(item.qty || 0) * Number(item.rate || 0);
              const lineDiscount = (lineBase * Number(item.discount_pct || 0)) / 100;
              const lineNet = lineBase - lineDiscount;
              const lineGst = (lineNet * Number(item.gst_pct || 0)) / 100;
              const lineTotal = lineNet + lineGst;

              return (
                <div key={idx} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
                      Line Item #{idx + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => addCustomFieldToItem(idx)}
                        className="rounded border border-indigo-200 bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
                      >
                        + Add Custom Field
                      </button>

                      {form.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          className="rounded border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100"
                        >
                          Delete Item
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Category-Specific Fields Grid */}
                  <div className="grid gap-2 md:grid-cols-5">
                    {form.category === 'DEWAS' && (
                      <>
                        <div>
                          <label className="text-xs font-medium text-slate-600">Pump Model</label>
                          <input
                            className="w-full rounded border p-2 text-xs"
                            placeholder="e.g. Kirloskar KDS-512"
                            value={item.model || ''}
                            onChange={(e) => updateItem(idx, 'model', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-600">Motor HP</label>
                          <input
                            className="w-full rounded border p-2 text-xs"
                            placeholder="e.g. 5 HP / 3.7 kW"
                            value={item.hp || ''}
                            onChange={(e) => updateItem(idx, 'hp', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-600">Pump Head</label>
                          <input
                            className="w-full rounded border p-2 text-xs"
                            placeholder="e.g. 24 m"
                            value={item.head || ''}
                            onChange={(e) => updateItem(idx, 'head', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-600">Flow Rate</label>
                          <input
                            className="w-full rounded border p-2 text-xs"
                            placeholder="e.g. 15 m3/hr"
                            value={item.flow || ''}
                            onChange={(e) => updateItem(idx, 'flow', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-600">SUC x DEL Size</label>
                          <input
                            className="w-full rounded border p-2 text-xs"
                            placeholder="e.g. 65 x 50 mm"
                            value={item.size || ''}
                            onChange={(e) => updateItem(idx, 'size', e.target.value)}
                          />
                        </div>
                      </>
                    )}

                    {form.category === 'WADI' && (
                      <>
                        <div>
                          <label className="text-xs font-medium text-slate-600">Pump Model</label>
                          <input
                            className="w-full rounded border p-2 text-xs"
                            placeholder="e.g. DB 100/26"
                            value={item.model || ''}
                            onChange={(e) => updateItem(idx, 'model', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-600">Delivery Size</label>
                          <input
                            className="w-full rounded border p-2 text-xs"
                            placeholder="e.g. 100 mm"
                            value={item.size || ''}
                            onChange={(e) => updateItem(idx, 'size', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-600">Pump Head</label>
                          <input
                            className="w-full rounded border p-2 text-xs"
                            placeholder="e.g. 35 m"
                            value={item.head || ''}
                            onChange={(e) => updateItem(idx, 'head', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-600">Discharge / Flow</label>
                          <input
                            className="w-full rounded border p-2 text-xs"
                            placeholder="e.g. 40 lps"
                            value={item.flow || ''}
                            onChange={(e) => updateItem(idx, 'flow', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-600">Material (MOC)</label>
                          <input
                            className="w-full rounded border p-2 text-xs"
                            placeholder="e.g. CI / Bronze"
                            value={item.hp || ''}
                            onChange={(e) => updateItem(idx, 'hp', e.target.value)}
                          />
                        </div>
                      </>
                    )}

                    {form.category === 'DIGISET' && (
                      <>
                        <div>
                          <label className="text-xs font-medium text-slate-600">Engine/Set Model</label>
                          <input
                            className="w-full rounded border p-2 text-xs"
                            placeholder="e.g. Greaves G-125"
                            value={item.model || ''}
                            onChange={(e) => updateItem(idx, 'model', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-600">KVA Rating</label>
                          <input
                            className="w-full rounded border p-2 text-xs"
                            placeholder="e.g. 62.5 KVA"
                            value={item.hp || ''}
                            onChange={(e) => updateItem(idx, 'hp', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-600">Phase / Voltage</label>
                          <input
                            className="w-full rounded border p-2 text-xs"
                            placeholder="e.g. 3 Phase 415V"
                            value={item.size || ''}
                            onChange={(e) => updateItem(idx, 'size', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-600">Fuel / Cooling</label>
                          <input
                            className="w-full rounded border p-2 text-xs"
                            placeholder="e.g. Diesel / Water Cooled"
                            value={item.head || ''}
                            onChange={(e) => updateItem(idx, 'head', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-600">Frequency</label>
                          <input
                            className="w-full rounded border p-2 text-xs"
                            placeholder="e.g. 50 Hz"
                            value={item.flow || ''}
                            onChange={(e) => updateItem(idx, 'flow', e.target.value)}
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Standard Commercial Fields */}
                  <div className="grid gap-2 md:grid-cols-5 bg-slate-50 p-2.5 rounded border border-slate-100">
                    <div className="md:col-span-2">
                      <label className="text-xs font-semibold text-slate-700">Product / Item Description *</label>
                      <input
                        className="w-full rounded border p-2 text-xs font-medium"
                        placeholder="Enter detailed description"
                        value={item.description || ''}
                        onChange={(e) => updateItem(idx, 'description', e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700">Quantity</label>
                      <input
                        type="number"
                        min="1"
                        className="w-full rounded border p-2 text-xs"
                        value={item.qty}
                        onChange={(e) => updateItem(idx, 'qty', Number(e.target.value))}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700">Unit Rate (Rs.)</label>
                      <input
                        type="number"
                        min="0"
                        className="w-full rounded border p-2 text-xs"
                        value={item.rate}
                        onChange={(e) => updateItem(idx, 'rate', Number(e.target.value))}
                      />
                    </div>

                    <div className="flex gap-1">
                      <div className="w-1/2">
                        <label className="text-xs font-semibold text-slate-700">Disc %</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          className="w-full rounded border p-2 text-xs"
                          value={item.discount_pct}
                          onChange={(e) => updateItem(idx, 'discount_pct', Number(e.target.value))}
                        />
                      </div>
                      <div className="w-1/2">
                        <label className="text-xs font-semibold text-slate-700">GST %</label>
                        <input
                          type="number"
                          min="0"
                          className="w-full rounded border p-2 text-xs"
                          value={item.gst_pct}
                          onChange={(e) => updateItem(idx, 'gst_pct', Number(e.target.value))}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Custom Fields Rendering */}
                  {item.custom_fields && Object.keys(item.custom_fields).length > 0 && (
                    <div className="rounded border border-amber-200 bg-amber-50/50 p-2.5 space-y-2">
                      <p className="text-xs font-bold text-amber-800">Dynamic Custom Fields ({form.category}):</p>
                      <div className="grid gap-2 md:grid-cols-3">
                        {Object.entries(item.custom_fields).map(([k, val]) => (
                          <div key={k} className="flex items-center gap-1 bg-white p-1.5 rounded border border-amber-200 shadow-xs">
                            <span className="text-xs font-medium text-amber-900 truncate max-w-[100px]">{k}:</span>
                            <input
                              className="w-full rounded border p-1 text-xs"
                              value={val || ''}
                              placeholder={`Value for ${k}`}
                              onChange={(e) => updateItemCustomField(idx, k, e.target.value)}
                            />
                            <button
                              type="button"
                              onClick={() => deleteCustomFieldFromItem(idx, k)}
                              className="text-rose-600 hover:text-rose-800 text-xs px-1 font-bold"
                              title="Delete custom field"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end text-xs font-bold text-slate-700 pt-1">
                    Line Total: Rs. {lineTotal.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Section Summary */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={addItem}
              className="rounded-lg border border-dashed border-emerald-400 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100"
            >
              + Add Another Item
            </button>

            <div className="text-right">
              <p className="text-xs text-slate-500 font-medium">Total Items: {form.items.length}</p>
            </div>
          </div>
        </div>

        <button type="submit" className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 shadow-md">
          Create Quotation
        </button>
      </form>

      <DataTable columns={columns} rows={rows} />

      {customers.length ? <p className="text-xs text-slate-500">Customers available: {customers.length}</p> : null}
    </div>
  );
}
