import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import DataTable from '../components/shared/DataTable';
import PageHeader from '../components/shared/PageHeader';
import { api, getApiUrl } from '../api/http';

function ProductSearchInput({ products = [], onSelect, currentModel = '' }) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
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

      if (name.includes(q) || code.includes(q) || hp.includes(q) || kw.includes(q) || grp.includes(q) || cat.includes(q)) return true;
      if (nameClean.includes(qClean) || codeClean.includes(qClean)) return true;
      if (qClean === 'kosm' && (name.includes('kos') && (name.includes('m') || code.includes('m')))) return true;
      return false;
    }).slice(0, 15);
  }, [products, query]);

  return (
    <div className="relative w-full">
      <div className="relative">
        <input
          type="text"
          className="w-full rounded-lg border border-brand-300 bg-brand-50/40 px-3 py-1.5 pl-8 text-xs font-semibold text-brand-900 placeholder:text-brand-400 focus:border-brand-500 focus:bg-white focus:outline-none"
          placeholder={currentModel ? `Selected: ${currentModel} (Type to search & replace)` : "🔍 Search product by model, name, code or HP..."}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 250)}
        />
        <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-brand-600">
          🔍
        </span>
        {query && (
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold"
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
          >
            ✕
          </button>
        )}
      </div>

      {isOpen && filtered.length > 0 && (
        <div className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 shadow-xl">
          <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b">
            Matching Products ({filtered.length})
          </div>
          {filtered.map((prod) => (
            <button
              key={prod.id}
              type="button"
              className="w-full text-left rounded-md px-2.5 py-1.5 hover:bg-brand-50 flex items-center justify-between transition-colors border-b last:border-0 border-slate-100"
              onMouseDown={() => {
                onSelect(prod);
                setQuery('');
                setIsOpen(false);
              }}
            >
              <div>
                <div className="text-xs font-bold text-slate-800">
                  {prod.code || prod.product_name}
                  {prod.product_name && prod.code && prod.product_name !== prod.code && (
                    <span className="ml-1 text-[11px] font-normal text-slate-500">({prod.product_name})</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-slate-500 mt-0.5">
                  {prod.hp && <span><b>HP:</b> {prod.hp}</span>}
                  {prod.head && <span><b>Head:</b> {prod.head}m</span>}
                  {prod.flow_rate && <span><b>Flow:</b> {prod.flow_rate}</span>}
                  {prod.pipe_size && <span><b>Size:</b> {prod.pipe_size}</span>}
                  {prod.category && <span className="text-brand-600 font-semibold">{prod.category}</span>}
                </div>
              </div>
              <div className="text-right pl-2 shrink-0">
                <div className="text-xs font-extrabold text-emerald-700">
                  ₹{Number(prod.price || 0).toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-slate-400">Click to autofill</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Quotations() {
  const qc = useQueryClient();
  const { data: quotations = [] } = useQuery({ queryKey: ['quotations'], queryFn: () => api('/quotations') });
  const { data: customers = [] } = useQuery({ queryKey: ['customers'], queryFn: () => api('/customers') });
  const { data: productCategories = [] } = useQuery({ queryKey: ['product-categories'], queryFn: () => api('/product-categories') });
  const { data: productsRaw = [] } = useQuery({ queryKey: ['products'], queryFn: () => api('/products') });
  const products = Array.isArray(productsRaw) ? productsRaw : (Array.isArray(productsRaw?.data) ? productsRaw.data : []);

  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [busyRowId, setBusyRowId] = useState(null);
  const [parsingPdf, setParsingPdf] = useState(false);

  const [form, setForm] = useState({
    customer_name: '',
    company_name: '',
    status: 'draft',
    category: 'DEWAS',
    sales_person_name: 'Puneet Choudhary',
    sales_person_phone: '9179076660',
    delivery_terms: 'Ex Godown',
    payment_terms: '100% advance',
    freight_terms: 'To Pay',
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
        discounted_price: 0,
        discount_pct: 0,
        gst_pct: 18,
        custom_fields: {},
      },
    ],
  });

  const createMutation = useMutation({
    mutationFn: (payload) => api('/quotations', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: (res) => {
      const createdQ = {
        id: res?.id || res?.quotation?.id || res?.data?.id,
        quotation_number: res?.quotation_number || res?.quotation?.quotation_number || res?.data?.quotation_number || 'QT-NEW',
        customer_name: res?.customer_name || res?.quotation?.customer_name || form.customer_name || 'Customer',
        company_name: res?.company_name || res?.quotation?.company_name || form.company_name || '',
        category: res?.category || res?.quotation?.category || form.category || 'DEWAS',
        total_amount: res?.totalAmount || res?.total_amount || res?.quotation?.total_amount || 0,
        subtotal: res?.subtotal || res?.quotation?.subtotal || 0,
        sales_person_name: form.sales_person_name || '',
        sales_person_phone: form.sales_person_phone || '',
      };
      setSavedQuotationInfo(createdQ);
      setForm((prev) => ({
        customer_name: '',
        company_name: '',
        status: 'draft',
        category: 'DEWAS',
        sales_person_name: prev.sales_person_name || '',
        sales_person_phone: prev.sales_person_phone || '',
        delivery_terms: prev.delivery_terms || 'Ex Godown',
        payment_terms: prev.payment_terms || '100% advance',
        freight_terms: prev.freight_terms || 'To Pay',
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
            discounted_price: 0,
            discount_pct: 0,
            gst_pct: 18,
            custom_fields: {},
          },
        ],
      }));
      qc.invalidateQueries({ queryKey: ['quotations'] });
      setActionMessage(`Quotation ${res?.quotation_number || ''} created successfully!`);
      setActionError('');
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

  const [editingQuotation, setEditingQuotation] = useState(null);
  const [loadingQuotationId, setLoadingQuotationId] = useState(null);

  const updateQuotationMutation = useMutation({
    mutationFn: ({ id, payload }) => api(`/quotations/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quotations'] });
      setActionMessage('Quotation updated successfully.');
      setActionError('');
      setEditingQuotation(null);
    },
    onError: (err) => setActionError(err.message || 'Failed to update quotation'),
  });

  const handleOpenEdit = async (id) => {
    try {
      setLoadingQuotationId(id);
      setActionError('');
      const qData = await api(`/quotations/${id}`);
      if (qData) {
        setEditingQuotation({
          ...qData,
          sales_person_name: qData.sales_person_name !== undefined && qData.sales_person_name !== null ? qData.sales_person_name : '',
          sales_person_phone: qData.sales_person_phone !== undefined && qData.sales_person_phone !== null ? qData.sales_person_phone : '',
          delivery_terms: qData.delivery_terms || 'Ex Godown',
          payment_terms: qData.payment_terms || '100% advance',
          freight_terms: qData.freight_terms || 'To Pay',
          items: (qData.items && qData.items.length > 0 ? qData.items : [{}]).map((it) => {
            const cf = it.custom_fields ? (typeof it.custom_fields === 'string' ? JSON.parse(it.custom_fields) : it.custom_fields) : {};
            const r = it.rate !== undefined && it.rate !== null ? it.rate : 0;
            const dp = it.discounted_price !== undefined && it.discounted_price !== null && it.discounted_price !== ''
              ? it.discounted_price
              : (cf.discounted_price !== undefined && cf.discounted_price !== null && cf.discounted_price !== ''
                  ? cf.discounted_price
                  : (it.discount_pct ? Number(r) * (1 - Number(it.discount_pct)/100) : r));

            return {
              description: it.description || '',
              model: it.model || cf.model || '',
              hp: it.motor_hp || it.hp || cf.motor_hp || cf.hp || '',
              head: it.head || cf.head || '',
              flow: it.flow_rate || it.flow || cf.flow_rate || cf.flow || '',
              size: it.size || cf.size || '',
              solid_size: it.solid_size || cf.solid_size || '',
              qty: it.qty !== undefined && it.qty !== null ? it.qty : 1,
              rate: r,
              discounted_price: dp,
              discount_pct: it.discount_pct || 0,
              gst_pct: it.gst_pct !== undefined && it.gst_pct !== null ? it.gst_pct : 18,
              custom_fields: cf,
            };
          }),
        });
      }
    } catch (err) {
      setActionError(err.message || 'Failed to fetch quotation details');
    } finally {
      setLoadingQuotationId(null);
    }
  };

  const handleSelectProduct = (idx, prod, isEdit = false) => {
    const modelVal = prod.code || prod.product_name || '';
    const hpVal = prod.hp || prod.kw || '';
    const headVal = prod.head || '';
    const flowVal = prod.flow_rate || '';
    const sizeVal = prod.pipe_size || '';
    const solidVal = prod.solid_size || '';
    const rateVal = Number(prod.price || 0);
    const descVal = prod.product_name || prod.code || '';
    const gstVal = Number(prod.gst_rate || 18);

    if (isEdit) {
      setEditingQuotation((prev) => {
        const items = [...(prev.items || [])];
        items[idx] = {
          ...items[idx],
          model: modelVal,
          hp: hpVal,
          head: headVal,
          flow: flowVal,
          size: sizeVal,
          solid_size: solidVal,
          rate: rateVal,
          discounted_price: rateVal,
          description: descVal,
          gst_pct: gstVal,
          product_id: prod.id,
        };
        return { ...prev, items };
      });
    } else {
      setForm((prev) => {
        const items = [...prev.items];
        items[idx] = {
          ...items[idx],
          model: modelVal,
          hp: hpVal,
          head: headVal,
          flow: flowVal,
          size: sizeVal,
          solid_size: solidVal,
          rate: rateVal,
          discounted_price: rateVal,
          description: descVal,
          gst_pct: gstVal,
          product_id: prod.id,
        };
        return { ...prev, items };
      });
    }
  };

  const addEditItem = () => {
    setEditingQuotation((prev) => ({
      ...prev,
      items: [
        ...(prev.items || []),
        {
          description: '',
          model: '',
          hp: '',
          head: '',
          flow: '',
          size: '',
          solid_size: '',
          qty: 1,
          rate: 0,
          discounted_price: 0,
          discount_pct: 0,
          gst_pct: 18,
          custom_fields: {},
        },
      ],
    }));
  };

  const removeEditItem = (index) => {
    if ((editingQuotation?.items || []).length <= 1) return;
    setEditingQuotation((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const updateEditItem = (index, field, value) => {
    setEditingQuotation((prev) => {
      const items = [...(prev.items || [])];
      const cur = { ...items[index], [field]: value };
      if (field === 'rate') {
        if (cur.discount_pct > 0 && value !== '') {
          cur.discounted_price = Number((Number(value) * (1 - Number(cur.discount_pct) / 100)).toFixed(2));
        } else if (cur.discounted_price === '' || cur.discounted_price === undefined || cur.discounted_price === 0) {
          cur.discounted_price = value;
        }
      } else if (field === 'discounted_price') {
        if (Number(cur.rate) > 0 && value !== '') {
          const dp = Number(value);
          const r = Number(cur.rate);
          cur.discount_pct = r > dp ? Number((((r - dp) / r) * 100).toFixed(2)) : 0;
        }
      } else if (field === 'discount_pct') {
        if (Number(cur.rate) > 0 && value !== '') {
          cur.discounted_price = Number((Number(cur.rate) * (1 - Number(value) / 100)).toFixed(2));
        }
      }
      items[index] = cur;
      return { ...prev, items };
    });
  };

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
          discounted_price: 0,
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
      const cur = { ...items[index], [field]: value };
      if (field === 'rate') {
        if (cur.discount_pct > 0 && value !== '') {
          cur.discounted_price = Number((Number(value) * (1 - Number(cur.discount_pct) / 100)).toFixed(2));
        } else if (cur.discounted_price === '' || cur.discounted_price === undefined || cur.discounted_price === 0) {
          cur.discounted_price = value;
        }
      } else if (field === 'discounted_price') {
        if (Number(cur.rate) > 0 && value !== '') {
          const dp = Number(value);
          const r = Number(cur.rate);
          cur.discount_pct = r > dp ? Number((((r - dp) / r) * 100).toFixed(2)) : 0;
        }
      } else if (field === 'discount_pct') {
        if (Number(cur.rate) > 0 && value !== '') {
          cur.discounted_price = Number((Number(cur.rate) * (1 - Number(value) / 100)).toFixed(2));
        }
      }
      items[index] = cur;
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
    setActionMessage(`Parsing PDF for ${form.category || 'DEWAS'} category...`);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const base64 = evt.target.result;
        const res = await api('/quotations/parse-pdf', {
          method: 'POST',
          body: JSON.stringify({ file_base64: base64, category: form.category || 'DEWAS' }),
        });

        if (res?.items && res.items.length > 0) {
          const items = res.items.map((it) => ({
            description: it.description || '',
            model: it.model || '',
            hp: it.motor_hp || it.hp || '',
            head: it.head || '',
            flow: it.flow_rate || it.flow || '',
            size: it.size || '',
            solid_size: it.solid_size || '',
            qty: Number(it.qty || 1),
            rate: Number(it.rate || 0),
            discounted_price: Number(it.discounted_price !== undefined ? it.discounted_price : it.rate || 0),
            discount_pct: Number(it.discount_pct || 0),
            gst_pct: Number(it.gst_pct || 18),
            custom_fields: it.custom_fields || {},
          }));

          setForm((prev) => ({
            ...prev,
            category: res.category || prev.category || 'DEWAS',
            items,
          }));

          setActionMessage(`Extracted ${res.items.length} line items for ${res.category || form.category || 'DEWAS'} category from PDF successfully!`);
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

  const grandSummary = useMemo(() => {
    let totalQty = 0;
    let subtotal = 0;
    let totalDiscount = 0;
    let totalGst = 0;

    (form.items || []).forEach((item) => {
      const qty = Number(item.qty || 0);
      const rate = Number(item.rate || 0);
      const rawDiscPrice = item.discounted_price !== undefined && item.discounted_price !== null && item.discounted_price !== ''
        ? Number(item.discounted_price)
        : null;
      const unitPrice = rawDiscPrice !== null ? rawDiscPrice : (rate * (1 - (Number(item.discount_pct) || 0) / 100));
      const base = qty * (rate > 0 ? rate : unitPrice);
      const net = qty * unitPrice;
      const discount = (base - net) > 0 ? (base - net) : 0;
      const gst = (net * Number(item.gst_pct || 0)) / 100;

      totalQty += qty;
      subtotal += (base > 0 ? base : net);
      totalDiscount += discount;
      totalGst += gst;
    });

    const grandTotal = subtotal - totalDiscount + totalGst;

    return {
      totalQty,
      subtotal,
      totalDiscount,
      totalGst,
      grandTotal,
    };
  }, [form.items, form.category]);

  const editGrandSummary = useMemo(() => {
    if (!editingQuotation) return { totalQty: 0, subtotal: 0, totalDiscount: 0, totalGst: 0, grandTotal: 0 };
    let totalQty = 0;
    let subtotal = 0;
    let totalDiscount = 0;
    let totalGst = 0;

    (editingQuotation.items || []).forEach((item) => {
      const qty = Number(item.qty || 0);
      const rate = Number(item.rate || 0);
      const rawDiscPrice = item.discounted_price !== undefined && item.discounted_price !== null && item.discounted_price !== ''
        ? Number(item.discounted_price)
        : null;
      const unitPrice = rawDiscPrice !== null ? rawDiscPrice : (rate * (1 - (Number(item.discount_pct) || 0) / 100));
      const base = qty * (rate > 0 ? rate : unitPrice);
      const net = qty * unitPrice;
      const discount = (base - net) > 0 ? (base - net) : 0;
      const gst = (net * Number(item.gst_pct || 0)) / 100;

      totalQty += qty;
      subtotal += (base > 0 ? base : net);
      totalDiscount += discount;
      totalGst += gst;
    });

    const grandTotal = subtotal - totalDiscount + totalGst;

    return {
      totalQty,
      subtotal,
      totalDiscount,
      totalGst,
      grandTotal,
    };
  }, [editingQuotation]);

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
          className="rounded border border-indigo-600 bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-60"
          disabled={busyRowId === q.id || loadingQuotationId === q.id}
          onClick={() => handleOpenEdit(q.id)}
        >
          {loadingQuotationId === q.id ? 'Loading...' : 'View / Edit'}
        </button>
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
          href={getApiUrl(`/quotations/${q.id}/pdf`)}
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
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Category</label>
            <select
              className="w-full rounded border border-brand-300 bg-brand-50 p-2 text-xs font-bold text-brand-800"
              value={form.category || 'DEWAS'}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              <option value="DEWAS">DEWAS (Kirloskar Pumps)</option>
              <option value="DIGISET">DIGISET</option>
              <option value="WADI">WADI</option>
              {productCategories.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Line Item Details Section */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div>
              <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <span>Line Item Details</span>
                <span className="rounded bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700">
                  {form.category || 'DEWAS'} Category
                </span>
              </h4>
              <p className="text-xs text-slate-500">
                Configure line items and specifications for {form.category || 'DEWAS'}.
              </p>
            </div>

            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 shadow-sm"
            >
              <span>+</span>
              <span>Add Line Item</span>
            </button>
          </div>

          {/* Line Item Cards */}
          <div className="space-y-4">
            {form.items.map((item, idx) => {
              const qty = Number(item.qty || 0);
              const rate = Number(item.rate || 0);
              const rawDiscPrice = item.discounted_price !== undefined && item.discounted_price !== null && item.discounted_price !== ''
                ? Number(item.discounted_price)
                : null;
              const unitPrice = rawDiscPrice !== null ? rawDiscPrice : (rate * (1 - (Number(item.discount_pct) || 0) / 100));
              const lineNet = qty * unitPrice;
              const lineGst = (lineNet * Number(item.gst_pct || 0)) / 100;
              const lineTotal = lineNet + lineGst;

              return (
                <div key={idx} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
                      Line Item #{idx + 1}
                    </span>
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

                  {/* Search Product from Catalog */}
                  <div className="rounded-lg border border-brand-200 bg-brand-50/40 p-2.5 space-y-1">
                    <label className="text-xs font-bold text-brand-900 flex items-center gap-1.5">
                      <span>🔍</span>
                      <span>Search & Select Product from Catalog</span>
                      <span className="text-[11px] font-normal text-slate-500">(Auto-fills model, specs & price)</span>
                    </label>
                    <ProductSearchInput
                      products={products}
                      currentModel={item.model || ''}
                      onSelect={(prod) => handleSelectProduct(idx, prod, false)}
                    />
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
                      <label className="text-xs font-bold text-slate-800">
                        Rate / Base Price (Rs.) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        placeholder="Rate (Rs.)"
                        className="w-full rounded-lg border-2 border-indigo-300 bg-white p-2 text-xs font-bold text-indigo-900 shadow-xs focus:border-indigo-600 focus:outline-none"
                        value={item.rate !== undefined ? item.rate : ''}
                        onChange={(e) => updateItem(idx, 'rate', e.target.value === '' ? '' : Number(e.target.value))}
                        required
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-emerald-800">
                        Each Disc. Price (Rs.)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        placeholder="Discounted Price (Rs.)"
                        className="w-full rounded-lg border-2 border-emerald-400 bg-white p-2 text-xs font-bold text-emerald-900 shadow-xs focus:border-emerald-600 focus:outline-none"
                        value={item.discounted_price !== undefined ? item.discounted_price : ''}
                        onChange={(e) => updateItem(idx, 'discounted_price', e.target.value === '' ? '' : Number(e.target.value))}
                      />
                    </div>

                    <div>
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

                  <div className="flex justify-end text-xs font-bold text-slate-700 pt-1">
                    Line Total: Rs. {lineTotal.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Section Summary & Grand Total */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={addItem}
                className="rounded-lg border border-dashed border-emerald-400 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-colors"
              >
                + Add Another Item
              </button>

              <div className="text-right">
                <p className="text-xs text-slate-500 font-medium">Total Items: {form.items.length}</p>
              </div>
            </div>

            {/* Grand Total Summary Box */}
            <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-600">
                  <div>
                    <span className="font-semibold text-slate-700">Total Qty:</span>{' '}
                    <span className="font-bold text-slate-900">{grandSummary.totalQty}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">Subtotal:</span>{' '}
                    <span className="font-bold text-slate-900">₹{grandSummary.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  {grandSummary.totalDiscount > 0 && (
                    <div>
                      <span className="font-semibold text-slate-700">Discount:</span>{' '}
                      <span className="font-bold text-rose-600">-₹{grandSummary.totalDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <div>
                    <span className="font-semibold text-slate-700">GST:</span>{' '}
                    <span className="font-bold text-slate-900">₹{grandSummary.totalGst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 px-4 py-2 rounded-lg self-end sm:self-auto">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">Grand Total:</span>
                  <span className="text-base font-extrabold text-indigo-950">
                    ₹{grandSummary.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Terms & Sign-off Details */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs">
          <div className="border-b border-slate-100 pb-2">
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span>📝 Quotation Terms &amp; Sign-off Details</span>
            </h4>
            <p className="text-xs text-slate-500">Edit sign-off contact person and commercial terms for the quotation PDF.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            <div>
              <label className="text-xs font-semibold text-slate-700">Yours truly (Contact Person)</label>
              <input
                className="w-full rounded-lg border p-2 text-xs font-medium focus:border-brand-500 focus:outline-none"
                value={form.sales_person_name || ''}
                onChange={(e) => setForm({ ...form, sales_person_name: e.target.value })}
                placeholder="e.g. Puneet Choudhary"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Contact Number</label>
              <input
                className="w-full rounded-lg border p-2 text-xs font-medium focus:border-brand-500 focus:outline-none"
                value={form.sales_person_phone || ''}
                onChange={(e) => setForm({ ...form, sales_person_phone: e.target.value })}
                placeholder="e.g. 91790-76660"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Delivery Terms</label>
              <input
                className="w-full rounded-lg border p-2 text-xs font-medium focus:border-brand-500 focus:outline-none"
                value={form.delivery_terms || ''}
                onChange={(e) => setForm({ ...form, delivery_terms: e.target.value })}
                placeholder="e.g. Ex Godown"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Payment Terms</label>
              <input
                className="w-full rounded-lg border p-2 text-xs font-medium focus:border-brand-500 focus:outline-none"
                value={form.payment_terms || ''}
                onChange={(e) => setForm({ ...form, payment_terms: e.target.value })}
                placeholder="e.g. 100% advance"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Freight Terms</label>
              <input
                className="w-full rounded-lg border p-2 text-xs font-medium focus:border-brand-500 focus:outline-none"
                value={form.freight_terms || ''}
                onChange={(e) => setForm({ ...form, freight_terms: e.target.value })}
                placeholder="e.g. To Pay"
              />
            </div>
          </div>
        </div>

        <button type="submit" className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 shadow-md">
          Create Quotation
        </button>
      </form>

      <DataTable columns={columns} rows={rows} />

      {customers.length ? <p className="text-xs text-slate-500">Customers available: {customers.length}</p> : null}

      {/* VIEW & EDIT QUOTATION MODAL */}
      {editingQuotation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl space-y-5 border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900">
                    Quotation #{editingQuotation.quotation_number}
                  </h3>
                  <span className="rounded bg-brand-100 px-2.5 py-0.5 text-xs font-bold text-brand-700">
                    {editingQuotation.category || 'DEWAS'}
                  </span>
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 uppercase">
                    {editingQuotation.status || 'draft'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  View and edit quotation details, line item rates, duty parameters, and grand total.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={getApiUrl(`/quotations/${editingQuotation.id}/pdf`)}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-indigo-500 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
                >
                  📄 Download PDF
                </a>
                <button
                  type="button"
                  onClick={() => setEditingQuotation(null)}
                  className="rounded-lg border p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 text-lg leading-none font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* General Information Grid */}
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <label className="text-xs font-semibold text-slate-700">Customer Name</label>
                <input
                  className="w-full rounded border p-2 text-xs bg-white"
                  value={editingQuotation.customer_name || ''}
                  onChange={(e) => setEditingQuotation({ ...editingQuotation, customer_name: e.target.value })}
                  placeholder="Customer Name"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Company Name</label>
                <input
                  className="w-full rounded border p-2 text-xs bg-white"
                  value={editingQuotation.company_name || ''}
                  onChange={(e) => setEditingQuotation({ ...editingQuotation, company_name: e.target.value })}
                  placeholder="Company Name"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Category</label>
                <select
                  className="w-full rounded border p-2 text-xs font-bold bg-white text-slate-800"
                  value={editingQuotation.category || 'DEWAS'}
                  onChange={(e) => setEditingQuotation({ ...editingQuotation, category: e.target.value })}
                >
                  <option value="DEWAS">DEWAS (Kirloskar Pumps)</option>
                  <option value="DIGISET">DIGISET</option>
                  <option value="WADI">WADI</option>
                  {productCategories.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Status</label>
                <select
                  className="w-full rounded border p-2 text-xs font-semibold bg-white text-slate-800"
                  value={editingQuotation.status || 'draft'}
                  onChange={(e) => setEditingQuotation({ ...editingQuotation, status: e.target.value })}
                >
                  <option value="draft">draft</option>
                  <option value="sent">sent</option>
                  <option value="approved">approved</option>
                  <option value="rejected">rejected</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Attention Person</label>
                <input
                  className="w-full rounded border p-2 text-xs bg-white"
                  value={editingQuotation.attention_person || ''}
                  onChange={(e) => setEditingQuotation({ ...editingQuotation, attention_person: e.target.value })}
                  placeholder="Attention Person"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-slate-700">Subject</label>
                <input
                  className="w-full rounded border p-2 text-xs bg-white"
                  value={editingQuotation.subject || ''}
                  onChange={(e) => setEditingQuotation({ ...editingQuotation, subject: e.target.value })}
                  placeholder="Quotation Subject"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Notes</label>
                <input
                  className="w-full rounded border p-2 text-xs bg-white"
                  value={editingQuotation.notes || ''}
                  onChange={(e) => setEditingQuotation({ ...editingQuotation, notes: e.target.value })}
                  placeholder="Special Notes"
                />
              </div>
            </div>

            {/* Editable Line Items Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <span>Line Items & Rates</span>
                  <span className="rounded bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-700">
                    {(editingQuotation.items || []).length} items
                  </span>
                </h4>

                <button
                  type="button"
                  onClick={addEditItem}
                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 shadow-sm transition-colors"
                >
                  <span>+</span>
                  <span>Add Line Item</span>
                </button>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                {(editingQuotation.items || []).map((item, idx) => {
                  const qty = Number(item.qty || 0);
                  const rate = Number(item.rate || 0);
                  const rawDiscPrice = item.discounted_price !== undefined && item.discounted_price !== null && item.discounted_price !== ''
                    ? Number(item.discounted_price)
                    : null;
                  const unitPrice = rawDiscPrice !== null ? rawDiscPrice : (rate * (1 - (Number(item.discount_pct) || 0) / 100));
                  const lineNet = qty * unitPrice;
                  const lineGst = (lineNet * Number(item.gst_pct || 0)) / 100;
                  const lineTotal = lineNet + lineGst;

                  return (
                    <div key={idx} className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs space-y-3">
                      <div className="flex items-center justify-between border-b pb-2">
                        <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
                          Item #{idx + 1}
                        </span>
                        {(editingQuotation.items || []).length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeEditItem(idx)}
                            className="rounded border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                          >
                            Delete Item
                          </button>
                        )}
                      </div>

                      {/* Search Product from Catalog */}
                      <div className="rounded-lg border border-brand-200 bg-brand-50/40 p-2.5 space-y-1">
                        <label className="text-xs font-bold text-brand-900 flex items-center gap-1.5">
                          <span>🔍</span>
                          <span>Search & Select Product from Catalog</span>
                          <span className="text-[11px] font-normal text-slate-500">(Auto-fills model, specs & price)</span>
                        </label>
                        <ProductSearchInput
                          products={products}
                          currentModel={item.model || ''}
                          onSelect={(prod) => handleSelectProduct(idx, prod, true)}
                        />
                      </div>

                      {/* Category Specific Duty Parameters */}
                      <div className="grid gap-2 md:grid-cols-5">
                        {editingQuotation.category === 'DEWAS' && (
                          <>
                            <div>
                              <label className="text-xs font-medium text-slate-600">Pump Model</label>
                              <input
                                className="w-full rounded border p-2 text-xs font-bold text-slate-800"
                                placeholder="Pump Model"
                                value={item.model || ''}
                                onChange={(e) => updateEditItem(idx, 'model', e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-slate-600">Motor HP / kW</label>
                              <input
                                className="w-full rounded border p-2 text-xs"
                                placeholder="e.g. 5 HP"
                                value={item.hp || ''}
                                onChange={(e) => updateEditItem(idx, 'hp', e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-slate-600">Pump Head (m)</label>
                              <input
                                className="w-full rounded border p-2 text-xs"
                                placeholder="e.g. 24 m"
                                value={item.head || ''}
                                onChange={(e) => updateEditItem(idx, 'head', e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-slate-600">Flow Rate</label>
                              <input
                                className="w-full rounded border p-2 text-xs"
                                placeholder="e.g. 15 m3/hr"
                                value={item.flow || ''}
                                onChange={(e) => updateEditItem(idx, 'flow', e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-slate-600">SUC x DEL Size</label>
                              <input
                                className="w-full rounded border p-2 text-xs"
                                placeholder="e.g. 65 x 50 mm"
                                value={item.size || ''}
                                onChange={(e) => updateEditItem(idx, 'size', e.target.value)}
                              />
                            </div>
                          </>
                        )}

                        {editingQuotation.category === 'WADI' && (
                          <>
                            <div>
                              <label className="text-xs font-medium text-slate-600">Pump Model</label>
                              <input
                                className="w-full rounded border p-2 text-xs"
                                placeholder="Model"
                                value={item.model || ''}
                                onChange={(e) => updateEditItem(idx, 'model', e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-slate-600">Delivery Size</label>
                              <input
                                className="w-full rounded border p-2 text-xs"
                                placeholder="Size"
                                value={item.size || ''}
                                onChange={(e) => updateEditItem(idx, 'size', e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-slate-600">Pump Head</label>
                              <input
                                className="w-full rounded border p-2 text-xs"
                                placeholder="Head"
                                value={item.head || ''}
                                onChange={(e) => updateEditItem(idx, 'head', e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-slate-600">Discharge / Flow</label>
                              <input
                                className="w-full rounded border p-2 text-xs"
                                placeholder="Flow"
                                value={item.flow || ''}
                                onChange={(e) => updateEditItem(idx, 'flow', e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-slate-600">Material (MOC)</label>
                              <input
                                className="w-full rounded border p-2 text-xs"
                                placeholder="MOC"
                                value={item.hp || ''}
                                onChange={(e) => updateEditItem(idx, 'hp', e.target.value)}
                              />
                            </div>
                          </>
                        )}

                        {editingQuotation.category === 'DIGISET' && (
                          <>
                            <div>
                              <label className="text-xs font-medium text-slate-600">Engine/Set Model</label>
                              <input
                                className="w-full rounded border p-2 text-xs"
                                placeholder="Model"
                                value={item.model || ''}
                                onChange={(e) => updateEditItem(idx, 'model', e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-slate-600">KVA Rating</label>
                              <input
                                className="w-full rounded border p-2 text-xs"
                                placeholder="KVA"
                                value={item.hp || ''}
                                onChange={(e) => updateEditItem(idx, 'hp', e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-slate-600">Phase / Voltage</label>
                              <input
                                className="w-full rounded border p-2 text-xs"
                                placeholder="Phase"
                                value={item.size || ''}
                                onChange={(e) => updateEditItem(idx, 'size', e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-slate-600">Fuel / Cooling</label>
                              <input
                                className="w-full rounded border p-2 text-xs"
                                placeholder="Cooling"
                                value={item.head || ''}
                                onChange={(e) => updateEditItem(idx, 'head', e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-slate-600">Frequency</label>
                              <input
                                className="w-full rounded border p-2 text-xs"
                                placeholder="Frequency"
                                value={item.flow || ''}
                                onChange={(e) => updateEditItem(idx, 'flow', e.target.value)}
                              />
                            </div>
                          </>
                        )}
                      </div>

                      {/* Commercial Details: Description, Quantity, Rate, Each Discounted Price, GST */}
                      <div className="grid gap-2 md:grid-cols-6 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <div className="md:col-span-2">
                          <label className="text-xs font-semibold text-slate-700">Product / Item Description *</label>
                          <input
                            className="w-full rounded border p-2 text-xs font-medium bg-white"
                            placeholder="Enter description"
                            value={item.description || ''}
                            onChange={(e) => updateEditItem(idx, 'description', e.target.value)}
                            required
                          />
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-slate-700">Quantity</label>
                          <input
                            type="number"
                            min="1"
                            className="w-full rounded border p-2 text-xs bg-white"
                            value={item.qty}
                            onChange={(e) => updateEditItem(idx, 'qty', e.target.value === '' ? '' : Number(e.target.value))}
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-800">
                            Rate / Base Price (Rs.) *
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            placeholder="Rate (Rs.)"
                            className="w-full rounded-lg border-2 border-indigo-300 bg-white p-2 text-xs font-bold text-indigo-900 shadow-xs focus:border-indigo-600 focus:outline-none"
                            value={item.rate !== undefined ? item.rate : ''}
                            onChange={(e) => updateEditItem(idx, 'rate', e.target.value === '' ? '' : Number(e.target.value))}
                            required
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-emerald-800">
                            Each Disc. Price (Rs.)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            placeholder="Discounted Price (Rs.)"
                            className="w-full rounded-lg border-2 border-emerald-400 bg-white p-2 text-xs font-bold text-emerald-900 shadow-xs focus:border-emerald-600 focus:outline-none"
                            value={item.discounted_price !== undefined ? item.discounted_price : ''}
                            onChange={(e) => updateEditItem(idx, 'discounted_price', e.target.value === '' ? '' : Number(e.target.value))}
                          />
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-slate-700">GST %</label>
                          <input
                            type="number"
                            min="0"
                            className="w-full rounded border p-2 text-xs bg-white"
                            value={item.gst_pct}
                            onChange={(e) => updateEditItem(idx, 'gst_pct', e.target.value === '' ? '' : Number(e.target.value))}
                          />
                        </div>
                      </div>

                      <div className="flex justify-end text-xs font-bold text-slate-700 pt-0.5">
                        Item Total: Rs. {lineTotal.toFixed(2)}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Grand Total Box Inside Modal */}
              <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-600">
                    <div>
                      <span className="font-semibold text-slate-700">Total Qty:</span>{' '}
                      <span className="font-bold text-slate-900">{editGrandSummary.totalQty}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700">Subtotal:</span>{' '}
                      <span className="font-bold text-slate-900">₹{editGrandSummary.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    {editGrandSummary.totalDiscount > 0 && (
                      <div>
                        <span className="font-semibold text-slate-700">Discount:</span>{' '}
                        <span className="font-bold text-rose-600">-₹{editGrandSummary.totalDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    <div>
                      <span className="font-semibold text-slate-700">GST:</span>{' '}
                      <span className="font-bold text-slate-900">₹{editGrandSummary.totalGst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 px-4 py-2 rounded-lg self-end sm:self-auto">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">Grand Total:</span>
                    <span className="text-base font-extrabold text-indigo-950">
                      ₹{editGrandSummary.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
              {/* Terms & Sign-off Details Inside Modal */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs">
                <div className="border-b border-slate-100 pb-2">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <span>📝 Quotation Terms &amp; Sign-off Details</span>
                  </h4>
                  <p className="text-xs text-slate-500">Edit sign-off contact person and commercial terms for the quotation PDF.</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Yours truly (Contact Person)</label>
                    <input
                      className="w-full rounded-lg border p-2 text-xs font-medium focus:border-brand-500 focus:outline-none"
                      value={editingQuotation.sales_person_name || ''}
                      onChange={(e) => setEditingQuotation({ ...editingQuotation, sales_person_name: e.target.value })}
                      placeholder="e.g. Puneet Choudhary"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Contact Number</label>
                    <input
                      className="w-full rounded-lg border p-2 text-xs font-medium focus:border-brand-500 focus:outline-none"
                      value={editingQuotation.sales_person_phone || ''}
                      onChange={(e) => setEditingQuotation({ ...editingQuotation, sales_person_phone: e.target.value })}
                      placeholder="e.g. 91790-76660"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Delivery Terms</label>
                    <input
                      className="w-full rounded-lg border p-2 text-xs font-medium focus:border-brand-500 focus:outline-none"
                      value={editingQuotation.delivery_terms || ''}
                      onChange={(e) => setEditingQuotation({ ...editingQuotation, delivery_terms: e.target.value })}
                      placeholder="e.g. Ex Godown"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Payment Terms</label>
                    <input
                      className="w-full rounded-lg border p-2 text-xs font-medium focus:border-brand-500 focus:outline-none"
                      value={editingQuotation.payment_terms || ''}
                      onChange={(e) => setEditingQuotation({ ...editingQuotation, payment_terms: e.target.value })}
                      placeholder="e.g. 100% advance"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Freight Terms</label>
                    <input
                      className="w-full rounded-lg border p-2 text-xs font-medium focus:border-brand-500 focus:outline-none"
                      value={editingQuotation.freight_terms || ''}
                      onChange={(e) => setEditingQuotation({ ...editingQuotation, freight_terms: e.target.value })}
                      placeholder="e.g. To Pay"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-between pt-3 border-t">
              <button
                type="button"
                onClick={() => setEditingQuotation(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={updateQuotationMutation.isPending}
                onClick={() => {
                  updateQuotationMutation.mutate({
                    id: editingQuotation.id,
                    payload: {
                      customer_name: editingQuotation.customer_name,
                      company_name: editingQuotation.company_name,
                      category: editingQuotation.category,
                      status: editingQuotation.status,
                      notes: editingQuotation.notes,
                      attention_person: editingQuotation.attention_person,
                      subject: editingQuotation.subject,
                      application: editingQuotation.application,
                      flow: editingQuotation.flow,
                      head: editingQuotation.head,
                      sales_person_name: editingQuotation.sales_person_name,
                      sales_person_phone: editingQuotation.sales_person_phone,
                      delivery_terms: editingQuotation.delivery_terms,
                      payment_terms: editingQuotation.payment_terms,
                      freight_terms: editingQuotation.freight_terms,
                      items: (editingQuotation.items || []).map((it) => ({
                        description: it.description || it.model || '',
                        model: it.model || '',
                        motor_hp: it.hp || '',
                        head: it.head || '',
                        flow_rate: it.flow || '',
                        size: it.size || '',
                        solid_size: it.solid_size || '',
                        qty: Number(it.qty || 0),
                        rate: Number(it.rate || 0),
                        discounted_price: it.discounted_price !== undefined && it.discounted_price !== null && it.discounted_price !== '' ? Number(it.discounted_price) : undefined,
                        discount_pct: Number(it.discount_pct || 0),
                        gst_pct: Number(it.gst_pct || 18),
                      })),
                    },
                  });
                }}
                className="rounded-lg bg-brand-600 px-5 py-2 text-xs font-bold text-white hover:bg-brand-700 shadow-md transition-colors disabled:opacity-60"
              >
                {updateQuotationMutation.isPending ? 'Saving Changes...' : 'Save & Update Quotation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS MODAL POPUP FOR SAVED QUOTATION */}
      {savedQuotationInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 text-center space-y-5">
            {/* Green Success Icon */}
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-inner">
              <svg className="h-9 w-9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-900">Quotation Created &amp; Saved Successfully!</h3>
              <p className="text-xs text-slate-500 mt-1">
                Your quotation has been generated and saved. You can view, print, or download the PDF now.
              </p>
            </div>

            {/* Details Box */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-left space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-xs font-semibold text-slate-500">Quotation No.</span>
                <span className="rounded-md bg-brand-100 px-2.5 py-1 text-xs font-bold text-brand-800 tracking-wide">
                  {savedQuotationInfo.quotation_number}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-500">Customer / Company</span>
                <span className="font-bold text-slate-800 text-right max-w-[240px] truncate">
                  {savedQuotationInfo.customer_name} {savedQuotationInfo.company_name ? `(${savedQuotationInfo.company_name})` : ''}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-500">Category</span>
                <span className="font-medium text-slate-700">{savedQuotationInfo.category || 'DEWAS'}</span>
              </div>

              {savedQuotationInfo.sales_person_name ? (
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-500">Yours Truly (Signatory)</span>
                  <span className="font-semibold text-slate-800">
                    {savedQuotationInfo.sales_person_name}
                    {savedQuotationInfo.sales_person_phone ? ` (${savedQuotationInfo.sales_person_phone})` : ''}
                  </span>
                </div>
              ) : null}

              <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-xs">
                <span className="font-bold text-slate-700">Total Amount</span>
                <span className="text-base font-extrabold text-emerald-700">
                  ₹{Number(savedQuotationInfo.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
              {savedQuotationInfo.id ? (
                <a
                  href={getApiUrl(`/quotations/${savedQuotationInfo.id}/pdf`)}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-brand-700 transition-all"
                >
                  <span>📄 View &amp; Download PDF</span>
                </a>
              ) : null}
              <button
                type="button"
                onClick={() => setSavedQuotationInfo(null)}
                className="w-full sm:w-auto rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
