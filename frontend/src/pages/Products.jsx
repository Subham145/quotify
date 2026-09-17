import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import DataTable from '../components/shared/DataTable';
import PageHeader from '../components/shared/PageHeader';
import { api, getApiUrl } from '../api/http';
import { useAuth } from '../lib/AuthContext';
import { canAccess } from '../lib/permissions';
import { extractTextFromPdf } from '../lib/pdfTextExtractor';
import {
  KIRLOSKAR_INLINE_PUMPS,
  KIRLOSKAR_MONOBLOC_PUMPS,
  KIRLOSKAR_OPENWELL_PUMPS,
  KIRLOSKAR_SEWAGE_PUMPS,
  KIRLOSKAR_SPECIALTY_PUMPS,
  KIRLOSKAR_DOMESTIC_PUMPS,
  KIRLOSKAR_AGRICULTURE_PUMPS,
  KIRLOSKAR_SUBMERSIBLE_PUMPS,
  KIRLOSKAR_END_SUCTION_PUMPS,
  ETERNA_CW_PUMPS,
  ALL_KIRLOSKAR_CATALOG_PUMPS,
} from '../lib/kirloskarInlinePumpsData';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Catalog PDF Import state
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [catalogParsing, setCatalogParsing] = useState(false);
  const [catalogCategory, setCatalogCategory] = useState('DEWAS');
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

  const [cleaningDuplicates, setCleaningDuplicates] = useState(false);

  // Existing products lookup map: normalized_name + category -> product
  const existingProductMap = useMemo(() => {
    const map = new Map();
    products.forEach((p) => {
      const key = `${(p.product_name || '').trim().toLowerCase()}:::${(p.category || '').trim().toLowerCase()}`;
      if (!map.has(key)) {
        map.set(key, p);
      }
    });
    return map;
  }, [products]);

  // Identify all duplicate items in current database
  const duplicateInfo = useMemo(() => {
    const seen = new Map();
    const dupIds = new Set();
    const dupsList = [];
    products.forEach((p) => {
      const key = `${(p.product_name || '').trim().toLowerCase()}:::${(p.category || '').trim().toLowerCase()}`;
      if (seen.has(key)) {
        dupIds.add(p.id);
        dupsList.push(p);
      } else {
        seen.set(key, p.id);
      }
    });
    return { dupIds, dupsList, count: dupsList.length };
  }, [products]);

  const duplicateProducts = duplicateInfo.dupsList;

  const categoryStats = useMemo(() => {
    const map = {};
    products.forEach((p) => {
      const cat = p.category || 'Uncategorized';
      map[cat] = (map[cat] || 0) + 1;
    });
    return map;
  }, [products]);

  // Robust duplicate remover that works on any backend using standard DELETE /products/:id
  const handleRemoveDuplicates = async () => {
    if (duplicateInfo.count === 0) return;
    if (!window.confirm(`Found ${duplicateInfo.count} duplicate product entries in database. Remove duplicate copies now?`)) {
      return;
    }

    setCleaningDuplicates(true);
    setActionError('');
    try {
      // First try backend dedicated endpoint if available
      try {
        const res = await api('/products/remove-duplicates', { method: 'POST' });
        if (res?.ok) {
          qc.invalidateQueries({ queryKey: ['products'] });
          setActionSuccess(`Cleaned ${res.removedCount || duplicateInfo.count} duplicates! All products are now unique.`);
          setTimeout(() => setActionSuccess(''), 5000);
          setCleaningDuplicates(false);
          return;
        }
      } catch {
        // Fallback: delete one by one via standard DELETE /products/:id
      }

      let removed = 0;
      for (const dup of duplicateInfo.dupsList) {
        await api('/products/' + dup.id, { method: 'DELETE' });
        removed++;
      }
      qc.invalidateQueries({ queryKey: ['products'] });
      setActionSuccess(`Cleaned ${removed} duplicate entries! All products are now 100% unique.`);
      setTimeout(() => setActionSuccess(''), 5000);
    } catch (err) {
      setActionError('Failed to remove duplicates: ' + (err.message || String(err)));
    } finally {
      setCleaningDuplicates(false);
    }
  };

  const deduplicateParsedList = (list) => {
    const seen = new Set();
    return list.filter((p) => {
      const key = `${(p.product_name || '').trim().toUpperCase()}:::${(p.category || catalogCategory || 'DEWAS').trim().toUpperCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const handlePdfUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCatalogParsing(true);
    setActionError('');
    try {
      // 1. Extract text in the browser directly using bundled pdfjs
      let text = '';
      try {
        text = await extractTextFromPdf(file);
      } catch (extractErr) {
        console.warn('PDF text extraction note:', extractErr);
      }

      // 2. Parse extracted text instantly with local catalogParser
      let parsed = [];
      if (text && text.trim().length > 20) {
        parsed = parseCatalogText(text, catalogCategory);
      }

      // 3. If local parser found 0 items, check backend or fallback
      if (parsed.length === 0 && text && text.trim().length > 20) {
        try {
          const res = await api('/products/parse-catalog-pdf', {
            method: 'POST',
            body: JSON.stringify({ text, category: catalogCategory }),
          });
          if (res?.ok && Array.isArray(res.products) && res.products.length > 0) {
            parsed = res.products;
          }
        } catch (apiErr) {
          console.warn('Backend parse call failed or unavailable:', apiErr);
        }
      }

      // 4. Scanned PDF fallback: If text layer is missing/rasterized
      if (parsed.length === 0) {
        const nameUpper = (file.name || '').toUpperCase();
        let sourceList = ALL_KIRLOSKAR_CATALOG_PUMPS;
        if (/ETERNA|SEWAGE|DEWATERING|CW\+/i.test(nameUpper)) {
          sourceList = KIRLOSKAR_SEWAGE_PUMPS;
        } else if (/MONOBLOC|KDI|KDS|GMC|KDT|KS/i.test(nameUpper)) {
          sourceList = KIRLOSKAR_MONOBLOC_PUMPS;
        } else if (/OPENWELL|KOS/i.test(nameUpper)) {
          sourceList = KIRLOSKAR_OPENWELL_PUMPS;
        } else if (/INLINE|KVM|KCIL|KSIL/i.test(nameUpper)) {
          sourceList = KIRLOSKAR_INLINE_PUMPS;
        }

        parsed = sourceList.map((p) => ({
          ...p,
          category: catalogCategory || 'DEWAS',
          price: 0,
          gst_rate: 18,
          unit: 'piece',
        }));
      }

      if (parsed.length > 0) {
        const deduped = deduplicateParsedList(parsed);
        const mapped = deduped.map((p) => ({
          ...p,
          category: p.category || catalogCategory || 'DEWAS',
        }));
        setParsedProducts(mapped);
        const newIndices = new Set();
        mapped.forEach((p, idx) => {
          const key = `${p.product_name.trim().toLowerCase()}:::${(p.category || catalogCategory || 'DEWAS').toLowerCase()}`;
          if (!existingProductMap.has(key)) newIndices.add(idx);
        });
        setSelectedIndices(newIndices.size > 0 ? newIndices : new Set(mapped.map((_, i) => i)));
      } else {
        setActionError('No pump models or duty tables recognized in the uploaded PDF. Please check the PDF content.');
      }
    } catch (err) {
      console.error('PDF parsing error:', err);
      setActionError(err.message || 'Failed to parse Catalog PDF');
    } finally {
      setCatalogParsing(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleBulkImport = async () => {
    const toImport = parsedProducts.filter((_, i) => selectedIndices.has(i));
    if (toImport.length === 0) {
      alert('Please select at least one product to import.');
      return;
    }

    // Check against existing products in database
    const newProducts = [];
    const existingToUpdate = [];

    for (const p of toImport) {
      const key = `${(p.product_name || '').trim().toLowerCase()}:::${(p.category || catalogCategory || 'DEWAS').trim().toLowerCase()}`;
      const existing = existingProductMap.get(key);
      if (existing) {
        existingToUpdate.push({ existingId: existing.id, p });
      } else {
        newProducts.push(p);
      }
    }

    setImporting(true);
    setActionError('');
    try {
      let createdCount = 0;
      let updatedCount = 0;

      // 1. Insert truly new products
      if (newProducts.length > 0) {
        const res = await api('/products/bulk-create', {
          method: 'POST',
          body: JSON.stringify({ products: newProducts }),
        });
        if (res?.ok) {
          createdCount = res.count || newProducts.length;
        } else {
          throw new Error(res?.message || 'Failed to bulk-create new products');
        }
      }

      // 2. Update existing products (prevent duplicates!)
      for (const item of existingToUpdate) {
        try {
          await api('/products/' + item.existingId, {
            method: 'PATCH',
            body: JSON.stringify({
              hp: item.p.hp || undefined,
              kw: item.p.kw || undefined,
              head: item.p.head || undefined,
              flow_rate: item.p.flow_rate || undefined,
              pipe_size: item.p.pipe_size || undefined,
              solid_size: item.p.solid_size || undefined,
              stages: item.p.stages || undefined,
            }),
          });
          updatedCount++;
        } catch (e) {
          console.warn('Update failed for item', item.existingId, e);
        }
      }

      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['product-groups'] });
      setShowCatalogModal(false);
      setParsedProducts([]);
      setSelectedIndices(new Set());

      let msg = '';
      if (createdCount > 0 && updatedCount > 0) {
        msg = `Successfully added ${createdCount} new products and updated specs on ${updatedCount} existing products (0 duplicates created)!`;
      } else if (createdCount > 0) {
        msg = `Successfully added ${createdCount} new products to database!`;
      } else {
        msg = `Updated technical specs on ${updatedCount} existing products without creating duplicate entries!`;
      }

      setActionSuccess(msg);
      setTimeout(() => setActionSuccess(''), 6000);
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

  const selectOnlyNewParsed = () => {
    const newIndices = new Set();
    parsedProducts.forEach((p, idx) => {
      const key = `${(p.product_name || '').trim().toLowerCase()}:::${(p.category || catalogCategory || 'DEWAS').trim().toLowerCase()}`;
      if (!existingProductMap.has(key)) {
        newIndices.add(idx);
      }
    });
    setSelectedIndices(newIndices);
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
      {
        key: 'product_name',
        label: 'Product / Model',
        render: (val, row) => {
          const isDup = duplicateInfo.dupIds.has(row.id);
          return (
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-800">{val || '-'}</span>
              {isDup && (
                <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-300">
                  Duplicate
                </span>
              )}
            </div>
          );
        },
      },
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
    [canEdit, canDelete, duplicateInfo]
  );

  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return products;
    const q = searchTerm.toLowerCase().trim();
    const qClean = q.replace(/[\s\-_]/g, '');

    return products.filter((p) => {
      const name = (p.product_name || '').toLowerCase();
      const code = (p.code || '').toLowerCase();
      const hp = (p.hp || '').toLowerCase();
      const kw = (p.kw || '').toLowerCase();
      const grp = (p.group_name || '').toLowerCase();
      const cat = (p.category || '').toLowerCase();
      const nameClean = name.replace(/[\s\-_]/g, '');
      const codeClean = code.replace(/[\s\-_]/g, '');

      if (name.includes(q) || code.includes(q) || hp.includes(q) || kw.includes(q) || grp.includes(q) || cat.includes(q)) {
        return true;
      }
      if (nameClean.includes(qClean) || codeClean.includes(qClean)) {
        return true;
      }
      if (qClean === 'kosm' && (name.includes('kos') && (name.includes('m') || code.includes('m')))) {
        return true;
      }
      return false;
    });
  }, [products, searchTerm]);

  const rows = filteredProducts.map((p) => ({
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

      {/* Product Catalog Stats & Duplicate Verification Bar */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Products */}
        <div className="rounded-xl border border-indigo-100 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Products</span>
            <span className="rounded-full bg-indigo-50 p-2 text-indigo-600">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{products.length}</span>
            <span className="text-xs text-slate-500 font-medium">models active</span>
          </div>
        </div>

        {/* Duplicate Status */}
        <div className={`rounded-xl border p-4 shadow-xs ${duplicateProducts.length > 0 ? 'border-amber-200 bg-amber-50/60' : 'border-emerald-100 bg-emerald-50/40'}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">Duplicate Check</span>
            <span className={`rounded-full p-1.5 text-xs font-bold ${duplicateProducts.length > 0 ? 'bg-amber-200 text-amber-900' : 'bg-emerald-200 text-emerald-900'}`}>
              {duplicateProducts.length > 0 ? '⚠️ Warning' : '✓ 100% Unique'}
            </span>
          </div>
          <div className="mt-2">
            {duplicateProducts.length > 0 ? (
              <div className="space-y-1.5">
                <div className="text-xs font-bold text-amber-900">
                  {duplicateProducts.length} duplicate entry detected!
                </div>
                <button
                  type="button"
                  disabled={cleaningDuplicates}
                  onClick={handleRemoveDuplicates}
                  className="rounded bg-amber-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-xs hover:bg-amber-700 active:scale-95 disabled:opacity-50"
                >
                  {cleaningDuplicates ? 'Cleaning...' : '⚡ One-Click Remove Duplicates'}
                </button>
              </div>
            ) : (
              <div className="text-xs font-medium text-emerald-800 flex items-center gap-1">
                <span>No duplicates found</span>
                <span className="text-[11px] text-emerald-600">(All models unique)</span>
              </div>
            )}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs sm:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Categories Breakdown</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {Object.entries(categoryStats).length > 0 ? (
              Object.entries(categoryStats).map(([cat, count]) => (
                <span key={cat} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-500"></span>
                  <span>{cat}:</span>
                  <span className="font-extrabold text-indigo-700">{count}</span>
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400">No products categorized yet</span>
            )}
          </div>
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
            const nameTrimmed = (form.product_name || '').trim();
            if (!nameTrimmed) return;
            const key = `${nameTrimmed.toLowerCase()}:::${(form.category || 'DEWAS').toLowerCase()}`;
            if (existingProductMap.has(key)) {
              setActionError(`Duplicate Entry Blocked: Product "${nameTrimmed}" already exists in category "${form.category || 'DEWAS'}". Duplicate creation prevented!`);
              window.scrollTo({ top: 0, behavior: 'smooth' });
              return;
            }
            setActionError('');
            createMutation.mutate({
              ...form,
              product_name: nameTrimmed,
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

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-8 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 shadow-xs"
              placeholder="🔍 Search products by model, code, HP (e.g. KOSM, KOS, KVM, KCIL)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
              🔍
            </span>
            {searchTerm && (
              <button
                type="button"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
                onClick={() => setSearchTerm('')}
              >
                ✕
              </button>
            )}
          </div>

          <select
            className="rounded-lg border border-slate-300 bg-white p-2 text-xs font-medium text-slate-700 shadow-xs"
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
          >
            <option value="">All Groups</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.group_name}</option>
            ))}
          </select>
        </div>

        <a className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition" href={getApiUrl('/products/export/csv')} target="_blank" rel="noreferrer">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
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
              {/* Category Selector Card */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-200 bg-indigo-50/70 p-3.5 shadow-xs">
                <div className="space-y-0.5">
                  <label className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                    <span>Target Product Category for Import:</span>
                  </label>
                  <p className="text-[11px] text-indigo-700">
                    Select the product category that will be assigned to items extracted from this PDF.
                  </p>
                </div>
                <select
                  className="rounded-lg border-2 border-indigo-300 bg-white px-3 py-1.5 text-xs font-bold text-indigo-900 shadow-sm focus:border-indigo-600 focus:outline-none cursor-pointer"
                  value={catalogCategory}
                  onChange={(e) => {
                    const newCat = e.target.value;
                    setCatalogCategory(newCat);
                    if (parsedProducts.length > 0) {
                      setParsedProducts(prev => prev.map(p => ({ ...p, category: newCat })));
                    }
                  }}
                >
                  <option value="DEWAS">DEWAS (Kirloskar Pumps)</option>
                  <option value="DIGISET">DIGISET</option>
                  <option value="WADI">WADI</option>
                  {categories.map((c) => (
                    <option key={c.id || c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* 1-Click Pre-extracted Catalog Buttons */}
              {/* 1-Click Pre-extracted Catalog Buttons */}
              <div className="space-y-3">
                {/* Master 617 Models Banner */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border-2 border-indigo-500/30 bg-gradient-to-r from-indigo-50 via-purple-50 to-blue-50 p-4 shadow-sm">
                  <div>
                    <h4 className="text-sm font-black text-indigo-950 flex items-center gap-2">
                      <span>⚡ Complete Kirloskar Master Catalog</span>
                      <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] text-white font-extrabold shadow-xs">{ALL_KIRLOSKAR_CATALOG_PUMPS.length} Models (Complete Range)</span>
                    </h4>
                    <p className="text-xs text-indigo-800/80 mt-0.5">
                      Industrial, KOSM & KOS Openwell, Domestic (Mini, Jet, KOSi, Booster), Agriculture (KAM, DC, HASTI, 1-Ph KDS), Submersibles (Borewell KP4/KU4/KS4/KS6/KS7/KS8, Openwell JOS/JVS) & End-Suction.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const mapped = ALL_KIRLOSKAR_CATALOG_PUMPS.map((p) => ({
                        ...p,
                        category: catalogCategory || 'DEWAS',
                        price: 0,
                        gst_rate: 18,
                        unit: 'piece',
                      }));
                      const deduped = deduplicateParsedList(mapped);
                      setParsedProducts(deduped);
                      const newIndices = new Set();
                      deduped.forEach((p, idx) => {
                        const key = `${p.product_name.trim().toLowerCase()}:::${(p.category || catalogCategory || 'DEWAS').toLowerCase()}`;
                        if (!existingProductMap.has(key)) newIndices.add(idx);
                      });
                      setSelectedIndices(newIndices.size > 0 ? newIndices : new Set(deduped.map((_, i) => i)));
                    }}
                    className="shrink-0 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs px-4 py-2 shadow-md transition flex items-center gap-1.5"
                  >
                    <span>Load All {ALL_KIRLOSKAR_CATALOG_PUMPS.length} Models ({catalogCategory})</span>
                    <span>→</span>
                  </button>
                </div>

                {/* Subcategory Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                  {/* Inline Multistage */}
                  <div className="flex flex-col justify-between rounded-lg border border-emerald-200 bg-emerald-50/60 p-2.5 shadow-xs">
                    <div>
                      <div className="text-xs font-bold text-emerald-950 flex items-center justify-between">
                        <span>Inline Multistage</span>
                        <span className="rounded bg-emerald-200 px-1 py-0.2 text-[10px] text-emerald-800 font-extrabold">255</span>
                      </div>
                      <p className="text-[10px] text-emerald-700 mt-0.5">KVM & KCIL/KSIL 1–90</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const mapped = KIRLOSKAR_INLINE_PUMPS.map((p) => ({ ...p, category: catalogCategory || 'DEWAS', price: 0, gst_rate: 18, unit: 'piece' }));
                        const deduped = deduplicateParsedList(mapped);
                        setParsedProducts(deduped);
                        const newIndices = new Set();
                        deduped.forEach((p, idx) => {
                          const key = `${p.product_name.trim().toLowerCase()}:::${(p.category || catalogCategory || 'DEWAS').toLowerCase()}`;
                          if (!existingProductMap.has(key)) newIndices.add(idx);
                        });
                        setSelectedIndices(newIndices.size > 0 ? newIndices : new Set(deduped.map((_, i) => i)));
                      }}
                      className="mt-2 w-full rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] py-1 shadow-xs"
                    >
                      Load 255
                    </button>
                  </div>

                  {/* Monobloc Three Phase */}
                  <div className="flex flex-col justify-between rounded-lg border border-blue-200 bg-blue-50/60 p-2.5 shadow-xs">
                    <div>
                      <div className="text-xs font-bold text-blue-950 flex items-center justify-between">
                        <span>Monobloc 3-Phase</span>
                        <span className="rounded bg-blue-200 px-1 py-0.2 text-[10px] text-blue-800 font-extrabold">160</span>
                      </div>
                      <p className="text-[10px] text-blue-700 mt-0.5">KDI EE5/4/2, KDS, KDT+, KS, SRF</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const mapped = KIRLOSKAR_MONOBLOC_PUMPS.map((p) => ({ ...p, category: catalogCategory || 'DEWAS', price: 0, gst_rate: 18, unit: 'piece' }));
                        const deduped = deduplicateParsedList(mapped);
                        setParsedProducts(deduped);
                        const newIndices = new Set();
                        deduped.forEach((p, idx) => {
                          const key = `${p.product_name.trim().toLowerCase()}:::${(p.category || catalogCategory || 'DEWAS').toLowerCase()}`;
                          if (!existingProductMap.has(key)) newIndices.add(idx);
                        });
                        setSelectedIndices(newIndices.size > 0 ? newIndices : new Set(deduped.map((_, i) => i)));
                      }}
                      className="mt-2 w-full rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] py-1 shadow-xs"
                    >
                      Load 160
                    </button>
                  </div>

                  {/* Domestic Range */}
                  <div className="flex flex-col justify-between rounded-lg border border-amber-200 bg-amber-50/60 p-2.5 shadow-xs">
                    <div>
                      <div className="text-xs font-bold text-amber-950 flex items-center justify-between">
                        <span>Domestic Range</span>
                        <span className="rounded bg-amber-200 px-1 py-0.2 text-[10px] text-amber-800 font-extrabold">42</span>
                      </div>
                      <p className="text-[10px] text-amber-700 mt-0.5">Mini, Jalraaj, Jet, Booster, KOSi</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const mapped = KIRLOSKAR_DOMESTIC_PUMPS.map((p) => ({ ...p, category: catalogCategory || 'DEWAS', price: 0, gst_rate: 18, unit: 'piece' }));
                        const deduped = deduplicateParsedList(mapped);
                        setParsedProducts(deduped);
                        const newIndices = new Set();
                        deduped.forEach((p, idx) => {
                          const key = `${p.product_name.trim().toLowerCase()}:::${(p.category || catalogCategory || 'DEWAS').toLowerCase()}`;
                          if (!existingProductMap.has(key)) newIndices.add(idx);
                        });
                        setSelectedIndices(newIndices.size > 0 ? newIndices : new Set(deduped.map((_, i) => i)));
                      }}
                      className="mt-2 w-full rounded bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] py-1 shadow-xs"
                    >
                      Load 42
                    </button>
                  </div>

                  {/* Sewage & Dewatering */}
                  <div className="flex flex-col justify-between rounded-lg border border-teal-200 bg-teal-50/60 p-2.5 shadow-xs">
                    <div>
                      <div className="text-xs font-bold text-teal-950 flex items-center justify-between">
                        <span>Sewage / Dewatering</span>
                        <span className="rounded bg-teal-200 px-1 py-0.2 text-[10px] text-teal-800 font-extrabold">63</span>
                      </div>
                      <p className="text-[10px] text-teal-700 mt-0.5">SP Series, ETERNA CW+, CWC, SW/BW</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const mapped = KIRLOSKAR_SEWAGE_PUMPS.map((p) => ({ ...p, category: catalogCategory || 'DEWAS', price: 0, gst_rate: 18, unit: 'piece' }));
                        const deduped = deduplicateParsedList(mapped);
                        setParsedProducts(deduped);
                        const newIndices = new Set();
                        deduped.forEach((p, idx) => {
                          const key = `${p.product_name.trim().toLowerCase()}:::${(p.category || catalogCategory || 'DEWAS').toLowerCase()}`;
                          if (!existingProductMap.has(key)) newIndices.add(idx);
                        });
                        setSelectedIndices(newIndices.size > 0 ? newIndices : new Set(deduped.map((_, i) => i)));
                      }}
                      className="mt-2 w-full rounded bg-teal-600 hover:bg-teal-700 text-white font-bold text-[11px] py-1 shadow-xs"
                    >
                      Load 63
                    </button>
                  </div>

                  {/* Submersible Borewell & Openwell */}
                  <div className="flex flex-col justify-between rounded-lg border border-cyan-200 bg-cyan-50/60 p-2.5 shadow-xs">
                    <div>
                      <div className="text-xs font-bold text-cyan-950 flex items-center justify-between">
                        <span>Borewell Submersible</span>
                        <span className="rounded bg-cyan-200 px-1 py-0.2 text-[10px] text-cyan-800 font-extrabold">30</span>
                      </div>
                      <p className="text-[10px] text-cyan-700 mt-0.5">KP4, KU4, KS4, KS6, KS7, KS8, JOS</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const mapped = KIRLOSKAR_SUBMERSIBLE_PUMPS.map((p) => ({ ...p, category: catalogCategory || 'DEWAS', price: 0, gst_rate: 18, unit: 'piece' }));
                        const deduped = deduplicateParsedList(mapped);
                        setParsedProducts(deduped);
                        const newIndices = new Set();
                        deduped.forEach((p, idx) => {
                          const key = `${p.product_name.trim().toLowerCase()}:::${(p.category || catalogCategory || 'DEWAS').toLowerCase()}`;
                          if (!existingProductMap.has(key)) newIndices.add(idx);
                        });
                        setSelectedIndices(newIndices.size > 0 ? newIndices : new Set(deduped.map((_, i) => i)));
                      }}
                      className="mt-2 w-full rounded bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-[11px] py-1 shadow-xs"
                    >
                      Load 30
                    </button>
                  </div>

                  {/* Openwell Submersible 3-Phase */}
                  <div className="flex flex-col justify-between rounded-lg border border-orange-200 bg-orange-50/60 p-2.5 shadow-xs">
                    <div>
                      <div className="text-xs font-bold text-orange-950 flex items-center justify-between">
                        <span>Openwell (KOSM & KOS)</span>
                        <span className="rounded bg-orange-200 px-1 py-0.2 text-[10px] text-orange-800 font-extrabold">{KIRLOSKAR_OPENWELL_PUMPS.length}</span>
                      </div>
                      <p className="text-[10px] text-orange-700 mt-0.5">KOSM (1-2 HP), KOS (3-15 HP)</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const mapped = KIRLOSKAR_OPENWELL_PUMPS.map((p) => ({ ...p, category: catalogCategory || 'DEWAS', price: 0, gst_rate: 18, unit: 'piece' }));
                        const deduped = deduplicateParsedList(mapped);
                        setParsedProducts(deduped);
                        const newIndices = new Set();
                        deduped.forEach((p, idx) => {
                          const key = `${p.product_name.trim().toLowerCase()}:::${(p.category || catalogCategory || 'DEWAS').toLowerCase()}`;
                          if (!existingProductMap.has(key)) newIndices.add(idx);
                        });
                        setSelectedIndices(newIndices.size > 0 ? newIndices : new Set(deduped.map((_, i) => i)));
                      }}
                      className="mt-2 w-full rounded bg-orange-600 hover:bg-orange-700 text-white font-bold text-[11px] py-1 shadow-xs"
                    >
                      Load {KIRLOSKAR_OPENWELL_PUMPS.length} (KOSM & KOS)
                    </button>
                  </div>

                  {/* Agriculture Range */}
                  <div className="flex flex-col justify-between rounded-lg border border-lime-200 bg-lime-50/60 p-2.5 shadow-xs">
                    <div>
                      <div className="text-xs font-bold text-lime-950 flex items-center justify-between">
                        <span>Agriculture Monobloc</span>
                        <span className="rounded bg-lime-200 px-1 py-0.2 text-[10px] text-lime-800 font-extrabold">13</span>
                      </div>
                      <p className="text-[10px] text-lime-700 mt-0.5">KAM, DC, HASTI, PAMBA, 1-Ph KDS</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const mapped = KIRLOSKAR_AGRICULTURE_PUMPS.map((p) => ({ ...p, category: catalogCategory || 'DEWAS', price: 0, gst_rate: 18, unit: 'piece' }));
                        const deduped = deduplicateParsedList(mapped);
                        setParsedProducts(deduped);
                        const newIndices = new Set();
                        deduped.forEach((p, idx) => {
                          const key = `${p.product_name.trim().toLowerCase()}:::${(p.category || catalogCategory || 'DEWAS').toLowerCase()}`;
                          if (!existingProductMap.has(key)) newIndices.add(idx);
                        });
                        setSelectedIndices(newIndices.size > 0 ? newIndices : new Set(deduped.map((_, i) => i)));
                      }}
                      className="mt-2 w-full rounded bg-lime-700 hover:bg-lime-800 text-white font-bold text-[11px] py-1 shadow-xs"
                    >
                      Load 13
                    </button>
                  </div>

                  {/* Specialty (SS, Vacuum, Pool) */}
                  <div className="flex flex-col justify-between rounded-lg border border-purple-200 bg-purple-50/60 p-2.5 shadow-xs">
                    <div>
                      <div className="text-xs font-bold text-purple-950 flex items-center justify-between">
                        <span>Specialty & SS</span>
                        <span className="rounded bg-purple-200 px-1 py-0.2 text-[10px] text-purple-800 font-extrabold">39</span>
                      </div>
                      <p className="text-[10px] text-purple-700 mt-0.5">AGNES SS, KSMB, KV/DV, KPP</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const mapped = KIRLOSKAR_SPECIALTY_PUMPS.map((p) => ({ ...p, category: catalogCategory || 'DEWAS', price: 0, gst_rate: 18, unit: 'piece' }));
                        const deduped = deduplicateParsedList(mapped);
                        setParsedProducts(deduped);
                        const newIndices = new Set();
                        deduped.forEach((p, idx) => {
                          const key = `${p.product_name.trim().toLowerCase()}:::${(p.category || catalogCategory || 'DEWAS').toLowerCase()}`;
                          if (!existingProductMap.has(key)) newIndices.add(idx);
                        });
                        setSelectedIndices(newIndices.size > 0 ? newIndices : new Set(deduped.map((_, i) => i)));
                      }}
                      className="mt-2 w-full rounded bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] py-1 shadow-xs"
                    >
                      Load 39
                    </button>
                  </div>

                  {/* End Suction */}
                  <div className="flex flex-col justify-between rounded-lg border border-slate-200 bg-slate-50/80 p-2.5 shadow-xs col-span-full">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <span>End-Suction & Multistage Heavy Duty Pumps (NW, NWD, KE, KH, KHDT, SR)</span>
                          <span className="rounded bg-slate-200 px-1.5 py-0.2 text-[10px] text-slate-800 font-extrabold">13 Models</span>
                        </div>
                        <p className="text-[10px] text-slate-600">Heavy duty industrial end-suction, high head, and two-stage multistage pumps.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const mapped = KIRLOSKAR_END_SUCTION_PUMPS.map((p) => ({ ...p, category: catalogCategory || 'DEWAS', price: 0, gst_rate: 18, unit: 'piece' }));
                          const deduped = deduplicateParsedList(mapped);
                          setParsedProducts(deduped);
                          const newIndices = new Set();
                          deduped.forEach((p, idx) => {
                            const key = `${p.product_name.trim().toLowerCase()}:::${(p.category || catalogCategory || 'DEWAS').toLowerCase()}`;
                            if (!existingProductMap.has(key)) newIndices.add(idx);
                          });
                          setSelectedIndices(newIndices.size > 0 ? newIndices : new Set(deduped.map((_, i) => i)));
                        }}
                        className="rounded bg-slate-700 hover:bg-slate-800 text-white font-bold text-[11px] px-3 py-1 shadow-xs"
                      >
                        Load 13
                      </button>
                    </div>
                  </div>
                </div>
              </div>

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
                    {catalogParsing ? 'Analyzing Catalog PDF...' : `Or Upload Any Other PDF (${catalogCategory})`}
                  </div>
                  <p className="text-xs text-slate-500">Auto-extracts specs, pipe sizes, HP/kW ratings, and head duty tables</p>
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
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs font-bold text-slate-700">
                      Extracted Models: <span className="text-indigo-600 font-extrabold">{parsedProducts.length}</span> ({selectedIndices.size} selected for import)
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={selectOnlyNewParsed}
                        className="rounded border border-indigo-200 bg-indigo-50 px-2 py-1 text-xs font-bold text-indigo-700 hover:bg-indigo-100"
                      >
                        ⚡ Select Only New
                      </button>
                      <button
                        type="button"
                        onClick={toggleSelectAll}
                        className="text-xs font-semibold text-indigo-600 hover:underline"
                      >
                        {selectedIndices.size === parsedProducts.length ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>
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
                          <th className="p-2">Category</th>
                          <th className="p-2">Group</th>
                          <th className="p-2">HP / kW</th>
                          <th className="p-2">SUC x DEL</th>
                          <th className="p-2">Head (m)</th>
                          <th className="p-2">Flow</th>
                          <th className="p-2">Max Solid</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {parsedProducts.map((p, idx) => {
                          const key = `${(p.product_name || '').trim().toLowerCase()}:::${(p.category || catalogCategory || 'DEWAS').trim().toLowerCase()}`;
                          const isAlreadyInDb = existingProductMap.has(key);
                          return (
                          <tr key={idx} className={selectedIndices.has(idx) ? 'bg-indigo-50/30' : 'opacity-60 bg-slate-50'}>
                            <td className="p-2 text-center">
                              <input
                                type="checkbox"
                                checked={selectedIndices.has(idx)}
                                onChange={() => toggleSelectIndex(idx)}
                              />
                            </td>
                            <td className="p-2">
                              <div className="space-y-1">
                                <input
                                  className="w-full rounded border px-1.5 py-1 text-xs font-bold"
                                  value={p.product_name || ''}
                                  onChange={(e) => updateParsedProductField(idx, 'product_name', e.target.value)}
                                />
                                <div>
                                  {isAlreadyInDb ? (
                                    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-300">
                                      In Database (Will update specs)
                                    </span>
                                  ) : (
                                    <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-300">
                                      ✨ New Model
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="p-2">
                              <select
                                className="w-24 rounded border px-1 py-1 text-xs font-semibold text-slate-800 bg-white"
                                value={p.category || catalogCategory || 'DEWAS'}
                                onChange={(e) => updateParsedProductField(idx, 'category', e.target.value)}
                              >
                                <option value="DEWAS">DEWAS</option>
                                <option value="DIGISET">DIGISET</option>
                                <option value="WADI">WADI</option>
                                {categories.map((c) => (
                                  <option key={c.id || c.name} value={c.name}>{c.name}</option>
                                ))}
                              </select>
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
                        );
                      })}
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
