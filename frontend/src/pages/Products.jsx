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
  category: 'DEWAS',
  hp: '',
  kw: '',
  head: '',
  flow_rate: '',
  pipe_size: '',
  solid_size: '',
  stages: '',
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
  const [actionSuccess, setActionSuccess] = useState('');

  // Catalog PDF Import state
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [catalogParsing, setCatalogParsing] = useState(false);
  const [parsedProducts, setParsedProducts] = useState([]);
  const [selectedIndices, setSelectedIndices] = useState(new Set());
  const [importing, setImporting] = useState(false);

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
      setActionSuccess('Product added successfully!');
      setTimeout(() => setActionSuccess(''), 4000);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => api('/products/' + id, { method: 'PATCH', body: JSON.stringify(payload) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      setEditing(null);
      setActionSuccess('Product updated successfully!');
      setTimeout(() => setActionSuccess(''), 4000);
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

  const handlePdfUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCatalogParsing(true);
    setActionError('');
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const file_base64 = reader.result;
          const res = await api('/products/parse-catalog-pdf', {
            method: 'POST',
            body: JSON.stringify({ file_base64 })
          });

          if (res.ok && Array.isArray(res.products) && res.products.length > 0) {
            setParsedProducts(res.products);
            setSelectedIndices(new Set(res.products.map((_, i) => i)));
          } else {
            setActionError('No pump products or performance tables recognized in the uploaded PDF.');
          }
        } catch (err) {
          setActionError(err.message || 'Failed to parse Catalog PDF');
        } finally {
          setCatalogParsing(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setActionError(err.message);
      setCatalogParsing(false);
    }
  };

  const handleBulkImport = async () => {
    const toImport = parsedProducts.filter((_, i) => selectedIndices.has(i));
    if (toImport.length === 0) {
      alert('Please select at least one product to import.');
      return;
    }

    setImporting(true);
    try {
      const res = await api('/products/bulk-create', {
        method: 'POST',
        body: JSON.stringify({ products: toImport })
      });

      if (res.ok) {
        qc.invalidateQueries({ queryKey: ['products'] });
        qc.invalidateQueries({ queryKey: ['product-groups'] });
        setShowCatalogModal(false);
        setParsedProducts([]);
        setSelectedIndices(new Set());
        setActionSuccess(`Successfully imported ${res.count} products into catalog!`);
        setTimeout(() => setActionSuccess(''), 5000);
      } else {
        setActionError(res.message || 'Failed to import products');
      }
    } catch (err) {
      setActionError(err.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIndices.size === parsedProducts.length) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(parsedProducts.map((_, i) => i)));
    }
  };

  const toggleSelectIndex = (idx) => {
    const next = new Set(selectedIndices);
    if (next.has(idx)) {
      next.delete(idx);
    } else {
      next.add(idx);
    }
    setSelectedIndices(next);
  };

  const updateParsedProductField = (idx, field, val) => {
    const updated = [...parsedProducts];
    updated[idx] = { ...updated[idx], [field]: val };
    setParsedProducts(updated);
  };

  const columns = useMemo(
    () => [
      { key: 'product_name', label: 'Product / Model' },
      { key: 'hp', label: 'HP / kW', render: (val, row) => row.hp || row.kw ? `${row.hp || ''} ${row.kw ? '(' + row.kw + ')' : ''}` : '-' },
      { key: 'pipe_size', label: 'SUC x DEL Size' },
      { key: 'head', label: 'Head (m)' },
      { key: 'flow_rate', label: 'Flow' },
      { key: 'solid_size', label: 'Max Solid' },
      { key: 'category', label: 'Category' },
      { key: 'group_name', label: 'Group' },
      { key: 'price', label: 'Price (₹)', render: (v) => v ? `₹ ${Number(v).toLocaleString('en-IN')}` : '-' },
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
                category: p.category || 'DEWAS',
                hp: p.hp || '',
                kw: p.kw || '',
                head: p.head || '',
                flow_rate: p.flow_rate || '',
                pipe_size: p.pipe_size || '',
                solid_size: p.solid_size || '',
                stages: p.stages || '',
                price: Number(p.price || 0),
                gst_rate: Number(p.gst_rate || 18),
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
      <div className="grid gap-3 md:grid-cols-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-700">Product / Model Name *</label>
          <input
            className="w-full rounded border p-2 text-xs"
            placeholder="e.g. KSIL 1-13 or ETERNA 750 CW+"
            value={value.product_name}
            onChange={(e) => onChange({ ...value, product_name: e.target.value })}
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-700">Product Code</label>
          <input
            className="w-full rounded border p-2 text-xs"
            placeholder="e.g. KBL-0113"
            value={value.code}
            onChange={(e) => onChange({ ...value, code: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-700">Category</label>
          <select
            className="w-full rounded border p-2 text-xs"
            value={value.category}
            onChange={(e) => onChange({ ...value, category: e.target.value })}
          >
            <option value="DEWAS">DEWAS (Kirloskar Pumps)</option>
            <option value="DIGISET">DIGISET</option>
            <option value="WADI">WADI</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-700">Product Group</label>
          <select
            className="w-full rounded border p-2 text-xs"
            value={value.group_id}
            onChange={(e) => onChange({ ...value, group_id: e.target.value, subgroup_id: '' })}
          >
            <option value="">Select Group</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.group_name}</option>
            ))}
          </select>
        </div>

        {/* Technical Specification Fields */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-700">Motor HP</label>
          <input
            className="w-full rounded border p-2 text-xs"
            placeholder="e.g. 1.0 HP / 0.75 kW"
            value={value.hp}
            onChange={(e) => onChange({ ...value, hp: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-700">Power (kW)</label>
          <input
            className="w-full rounded border p-2 text-xs"
            placeholder="e.g. 0.75 kW"
            value={value.kw}
            onChange={(e) => onChange({ ...value, kw: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-700">Total Head (m)</label>
          <input
            className="w-full rounded border p-2 text-xs"
            placeholder="e.g. 10 - 78 m"
            value={value.head}
            onChange={(e) => onChange({ ...value, head: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-700">Flow Rate / Discharge</label>
          <input
            className="w-full rounded border p-2 text-xs"
            placeholder="e.g. 120-312 LPM or 2 m3/hr"
            value={value.flow_rate}
            onChange={(e) => onChange({ ...value, flow_rate: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-700">SUC x DEL Size (mm)</label>
          <input
            className="w-full rounded border p-2 text-xs"
            placeholder="e.g. 32 x 32 mm or 50 mm"
            value={value.pipe_size}
            onChange={(e) => onChange({ ...value, pipe_size: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-700">Max Solid Size (mm)</label>
          <input
            className="w-full rounded border p-2 text-xs"
            placeholder="e.g. 18 mm / 22 mm"
            value={value.solid_size}
            onChange={(e) => onChange({ ...value, solid_size: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-700">Price (₹)</label>
          <input
            className="w-full rounded border p-2 text-xs"
            type="number"
            value={value.price}
            onChange={(e) => onChange({ ...value, price: Number(e.target.value) })}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-700">GST Rate (%)</label>
          <input
            className="w-full rounded border p-2 text-xs"
            type="number"
            value={value.gst_rate}
            onChange={(e) => onChange({ ...value, gst_rate: Number(e.target.value) })}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeader title="Products & Services" description="Manage pump models, technical specs, and bulk import from catalog PDFs." />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setShowCatalogModal(true);
              setActionError('');
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Upload / Import Catalog PDF
          </button>
        </div>
      </div>

      {actionError ? (
        <p className="rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{actionError}</p>
      ) : null}

      {actionSuccess ? (
        <p className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{actionSuccess}</p>
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
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-sm font-bold text-slate-800">Add New Product / Pump Model</h3>
          </div>
          {productFields(form, setForm)}
          <button type="submit" className="rounded bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-brand-700">
            Save Product
          </button>
        </form>
      ) : null}

      <div className="flex items-center justify-between">
        <select
          className="rounded border p-2 text-xs"
          value={groupFilter}
          onChange={(e) => setGroupFilter(e.target.value)}
        >
          <option value="">All Groups</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>{g.group_name}</option>
          ))}
        </select>

        <a className="rounded border px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50" href="/api/products/export/csv" target="_blank" rel="noreferrer">
          Export CSV
        </a>
      </div>

      <DataTable columns={columns} rows={rows} />

      {/* Edit Product Modal */}
      {editing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            className="max-h-[90vh] w-full max-w-3xl space-y-4 overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
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
            <h3 className="text-base font-bold text-slate-800">Edit Product / Model Specifications</h3>
            {productFields(editForm, setEditForm)}
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button type="button" className="rounded border px-4 py-2 text-xs" onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button type="submit" className="rounded bg-brand-600 px-4 py-2 text-xs font-semibold text-white" disabled={updateMutation.isPending}>
                Save Changes
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {/* Catalog PDF Upload & Bulk Import Modal */}
      {showCatalogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[92vh] w-full max-w-5xl flex flex-col rounded-xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b px-6 py-4 bg-slate-50">
              <div>
                <h3 className="text-base font-bold text-slate-800">Import Products from Catalog PDF</h3>
                <p className="text-xs text-slate-500">Upload Kirloskar pump catalogs, technical sheets, or performance charts to extract pump models automatically.</p>
              </div>
              <button
                type="button"
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
                onClick={() => {
                  setShowCatalogModal(false);
                  setParsedProducts([]);
                  setSelectedIndices(new Set());
                }}
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {/* File Upload Box */}
              <div className="rounded-lg border-2 border-dashed border-indigo-200 bg-indigo-50/50 p-6 text-center">
                <input
                  type="file"
                  accept="application/pdf"
                  id="catalog-pdf-input"
                  className="hidden"
                  onChange={handlePdfUpload}
                />
                <label htmlFor="catalog-pdf-input" className="cursor-pointer block space-y-2">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <div className="text-sm font-semibold text-indigo-900">
                    {catalogParsing ? 'Analyzing Catalog PDF...' : 'Click to select Catalog PDF'}
                  </div>
                  <p className="text-xs text-slate-500">Supports KVM, KSIL/KCIL, ETERNA CW+, and other technical specification tables</p>
                </label>
              </div>

              {catalogParsing && (
                <div className="flex items-center justify-center py-6 gap-2 text-sm text-indigo-700 font-medium">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
                  Extracting pump models, duty parameters, and pipe sizes...
                </div>
              )}

              {/* Parsed Products Table Preview */}
              {parsedProducts.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-slate-700">
                      Extracted Models: <span className="text-indigo-600 font-extrabold">{parsedProducts.length}</span> ({selectedIndices.size} selected for import)
                    </div>
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      className="text-xs font-semibold text-indigo-600 hover:underline"
                    >
                      {selectedIndices.size === parsedProducts.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>

                  <div className="max-h-80 overflow-y-auto border rounded-lg">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100 sticky top-0 border-b">
                        <tr>
                          <th className="p-2 w-8 text-center">
                            <input
                              type="checkbox"
                              checked={selectedIndices.size === parsedProducts.length && parsedProducts.length > 0}
                              onChange={toggleSelectAll}
                            />
                          </th>
                          <th className="p-2">Model / Name</th>
                          <th className="p-2">Group</th>
                          <th className="p-2">HP / kW</th>
                          <th className="p-2">SUC x DEL</th>
                          <th className="p-2">Head (m)</th>
                          <th className="p-2">Flow</th>
                          <th className="p-2">Max Solid</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {parsedProducts.map((p, idx) => (
                          <tr key={idx} className={selectedIndices.has(idx) ? 'bg-indigo-50/30' : 'opacity-60 bg-slate-50'}>
                            <td className="p-2 text-center">
                              <input
                                type="checkbox"
                                checked={selectedIndices.has(idx)}
                                onChange={() => toggleSelectIndex(idx)}
                              />
                            </td>
                            <td className="p-2">
                              <input
                                className="w-full rounded border px-1.5 py-1 text-xs font-bold"
                                value={p.product_name || ''}
                                onChange={(e) => updateParsedProductField(idx, 'product_name', e.target.value)}
                              />
                            </td>
                            <td className="p-2">
                              <input
                                className="w-full rounded border px-1.5 py-1 text-xs"
                                value={p.group_name || ''}
                                onChange={(e) => updateParsedProductField(idx, 'group_name', e.target.value)}
                              />
                            </td>
                            <td className="p-2">
                              <input
                                className="w-24 rounded border px-1.5 py-1 text-xs"
                                value={p.hp || ''}
                                onChange={(e) => updateParsedProductField(idx, 'hp', e.target.value)}
                              />
                            </td>
                            <td className="p-2">
                              <input
                                className="w-28 rounded border px-1.5 py-1 text-xs"
                                value={p.pipe_size || ''}
                                onChange={(e) => updateParsedProductField(idx, 'pipe_size', e.target.value)}
                              />
                            </td>
                            <td className="p-2">
                              <input
                                className="w-24 rounded border px-1.5 py-1 text-xs"
                                value={p.head || ''}
                                onChange={(e) => updateParsedProductField(idx, 'head', e.target.value)}
                              />
                            </td>
                            <td className="p-2">
                              <input
                                className="w-28 rounded border px-1.5 py-1 text-xs"
                                value={p.flow_rate || ''}
                                onChange={(e) => updateParsedProductField(idx, 'flow_rate', e.target.value)}
                              />
                            </td>
                            <td className="p-2">
                              <input
                                className="w-20 rounded border px-1.5 py-1 text-xs"
                                value={p.solid_size || ''}
                                onChange={(e) => updateParsedProductField(idx, 'solid_size', e.target.value)}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t px-6 py-4 bg-slate-50">
              <button
                type="button"
                className="rounded border px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
                onClick={() => {
                  setShowCatalogModal(false);
                  setParsedProducts([]);
                  setSelectedIndices(new Set());
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={selectedIndices.size === 0 || importing}
                onClick={handleBulkImport}
                className="rounded-lg bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
              >
                {importing ? 'Importing Products...' : `Import Selected (${selectedIndices.size}) Products`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
