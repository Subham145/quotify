import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import DataTable from '../components/shared/DataTable';
import PageHeader from '../components/shared/PageHeader';
import { api } from '../api/http';
import StatusBadge from '../components/shared/StatusBadge';
import { useAuth } from '../lib/AuthContext';
import { canAccess, isManager } from '../lib/permissions';

export default function InquiriesQuotations() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const canCreateInquiry = canAccess(user, 'inquiries', 'create');
  const canEditInquiry = canAccess(user, 'inquiries', 'edit');
  const canDeleteInquiry = canAccess(user, 'inquiries', 'delete');
  const canCreateQuotation = canAccess(user, 'quotations', 'create');
  const canEditQuotation = canAccess(user, 'quotations', 'edit');
  const canDeleteQuotation = canAccess(user, 'quotations', 'delete');
  const canAssignFollowUp = canAccess(user, 'follow_ups', 'create');

  const { data: inquiries = [] } = useQuery({ queryKey: ['inquiries'], queryFn: () => api('/inquiries') });
  const [selectedInquiry,setSelectedInquiry]=useState('');
  const inquiryData =inquiries.find(i=>String(i.id)===selectedInquiry);
  const { data: productsRaw } = useQuery({ queryKey: ['products'], queryFn: () => api('/products') });
  const products = Array.isArray(productsRaw) ? productsRaw : Array.isArray(productsRaw?.data)  ? productsRaw.data : [];
  const { data: quotations = [] } = useQuery({ queryKey: ['quotations'], queryFn: () => api('/quotations') });
  const { data: sources = [] } = useQuery({ queryKey: ['inquiry-sources'], queryFn: () => api('/inquiry-sources') });
  const { data: assignees = [] } = useQuery({
    queryKey: ['users-assignable'],
    queryFn: () => api('/users/assignable'),
    enabled: canAssignFollowUp,
  });

  const [followUpFor, setFollowUpFor] = useState(null);
  const [followUpForm, setFollowUpForm] = useState({ assigned_to: '', title: '', notes: '', due_date: '' });

  const [activeTab, setActiveTab] = useState('inquiries');
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [busyRowId, setBusyRowId] = useState(null);
  const [editingInquiry,setEditingInquiry]=useState(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedQuotationId, setSelectedQuotationId] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState('dewas');

  const [editInquiryForm,setEditInquiryForm]=useState({customer_name:'',company:'',mobile:'',product_interested:'',follow_up_date:'',status:'new'});
  const [inquiryForm, setInquiryForm] = useState({customer_name: '',company: '',mobile: '',source: 'WhatsApp',product_interested:'',status: 'new',follow_up_date: '',});
  const [showManualSource, setShowManualSource] = useState(false);
  const [manualSource, setManualSource] = useState('');

  const [parsingPdf, setParsingPdf] = useState(false);

  const [quotationForm, setQuotationForm] = useState({
    inquiry_id: '',
    customer_name: '',
    company_name: '',
    attention_person: '',
    subject: '',
    application: '',
    flow: '',
    head: '',
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

  const addItem = () => {
    setQuotationForm((prev) => ({
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
    if (quotationForm.items.length <= 1) return;
    setQuotationForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const updateItem = (index, field, value) => {
    setQuotationForm((prev) => {
      const items = [...prev.items];
      items[index] = { ...items[index], [field]: value };
      return { ...prev, items };
    });
  };

  const updateItemCustomField = (itemIndex, key, value) => {
    setQuotationForm((prev) => {
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
    setQuotationForm((prev) => {
      const items = [...prev.items];
      const custom_fields = { ...(items[itemIndex].custom_fields || {}) };
      delete custom_fields[key];
      items[itemIndex] = { ...items[itemIndex], custom_fields };
      return { ...prev, items };
    });
  };

  const handleSelectProduct = (itemIndex, productIdOrName) => {
    const prod = products.find(p => String(p.id) === String(productIdOrName) || p.product_name?.toLowerCase() === String(productIdOrName).toLowerCase());
    if (!prod) return;

    setQuotationForm(prev => {
      const items = [...prev.items];
      items[itemIndex] = {
        ...items[itemIndex],
        product_id: prod.id,
        description: prod.product_name,
        model: prod.product_name,
        hp: prod.hp || (prod.kw ? `${prod.kw} kW` : items[itemIndex].hp),
        head: prod.head || items[itemIndex].head,
        flow: prod.flow_rate || items[itemIndex].flow,
        size: prod.pipe_size || items[itemIndex].size,
        solid_size: prod.solid_size || items[itemIndex].solid_size,
        rate: Number(prod.price || 0) > 0 ? Number(prod.price) : items[itemIndex].rate,
        gst_pct: Number(prod.gst_rate || 18),
      };
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

          setQuotationForm((prev) => ({
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

  const createInquiryMutation = useMutation({
    mutationFn: (payload) => api('/inquiries', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => {
      setInquiryForm({ customer_name: '', company: '', mobile: '', source: 'WhatsApp', status: 'new', follow_up_date: '' });
      qc.invalidateQueries({ queryKey: ['inquiries'] });
      setActionMessage('Inquiry created successfully');
      setActionError('');
    },
    onError: (err) => {
      setActionError(err.message || 'Failed to create inquiry');
      setActionMessage('');
    },
  });

  const convertMutation = useMutation({
    mutationFn: (id) => api('/inquiries/' + id + '/convert-to-quotation', { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inquiries'] });
      qc.invalidateQueries({ queryKey: ['quotations'] });
      setActionMessage('Inquiry converted to quotation successfully');
      setActionError('');
    },
    onError: (err) => {
      setActionError(err.message || 'Failed to convert inquiry');
      setActionMessage('');
    },
  });

  const createQuotationMutation = useMutation({
    mutationFn: (payload) => api('/quotations', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => {
      setQuotationForm({ customer_name: '', company_name: '', status: 'draft', items: [{ description: '', qty: 1, rate: 0, discount_pct: 0, gst_pct: 18 }] });
      qc.invalidateQueries({ queryKey: ['quotations'] });
      setActionMessage('Quotation created successfully');
      setActionError('');
    },
    onError: (err) => {
      setActionError(err.message || 'Failed to create quotation');
      setActionMessage('');
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: (id) => api('/quotations/' + id + '/duplicate', { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quotations'] });
      setActionMessage('Quotation duplicated successfully');
      setActionError('');
    },
    onError: (err) => {
      setActionError(err.message || 'Failed to duplicate quotation');
      setActionMessage('');
    },
  });

  const actionMutation = useMutation({
    mutationFn: ({ id, action, body }) => api('/quotations/' + id + '/' + action, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quotations'] });
      setActionMessage('Action completed successfully');
      setActionError('');
    },
    onError: (err) => {
      setActionError(err.message || 'Action failed');
      setActionMessage('');
    },
  });
const updateInquiryMutation=useMutation({

mutationFn:(payload)=>

api(

`/inquiries/${editingInquiry.id}`,

{

method:'PATCH',

body:JSON.stringify(payload)

}

),

onSuccess:()=>{

qc.invalidateQueries({

queryKey:['inquiries']

});

setEditingInquiry(null);

setActionMessage(

'Inquiry updated successfully'

);

}

});
  const deleteQuotationMutation = useMutation({
    mutationFn: (id) => api('/quotations/' + id, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quotations'] });
      setActionMessage('Quotation deleted successfully');
      setActionError('');
    },
    onError: (err) => {
      setActionError(err.message || 'Failed to delete quotation');
      setActionMessage('');
    },
  });

  const followUpMutation = useMutation({
    mutationFn: (payload) => api('/follow-ups', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: (res) => {
      if (res?.message) {
        setActionError(res.message);
        return;
      }
      qc.invalidateQueries({ queryKey: ['follow-ups'] });
      qc.invalidateQueries({ queryKey: ['follow-ups-pending-count'] });
      setFollowUpFor(null);
      setFollowUpForm({ assigned_to: '', title: '', notes: '', due_date: '' });
      setActionMessage('Follow-up assigned successfully');
      setActionError('');
    },
    onError: (err) => {
      setActionError(err.message || 'Failed to assign follow-up');
      setActionMessage('');
    },
  });

  const inquiryColumns = useMemo(
    () => [
      { key: 'inquiry_number', label: 'Inquiry No' },
      { key: 'customer_name', label: 'Customer' },
      {key:'product_interested',label:'Product'},
      { key: 'source', label: 'Source' },
      { key: 'status', label: 'Status' },
      { key: 'assigned_name', label: 'Assigned To' },
      { key: 'actions', label: 'Actions' },
    ],
    []
  );

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, category }) => api(`/quotations/${id}`, { method: 'PATCH', body: JSON.stringify({ category }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quotations'] });
      setActionMessage('Category updated successfully');
      setActionError('');
    },
    onError: (err) => {
      setActionError(err.message || 'Failed to update category');
    },
  });

  const quotationColumns = useMemo(
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

  const inquiryRows = inquiries.map((i) => ({
    ...i,
    status: <StatusBadge value={i.status} />,
    actions: (
      <div className="flex gap-2 flex-wrap">
        {canEditInquiry ? (
          <button
            type="button"
            className="rounded border px-2 py-1 text-xs"
            onClick={() => {
              setEditingInquiry(i);
              setEditInquiryForm({
                customer_name: i.customer_name || '',
                company: i.company || '',
                mobile: i.mobile || '',
                product_interested: i.product_interested || '',
                follow_up_date: i.follow_up_date || '',
                status: i.status || 'new',
              });
            }}
          >
            Edit
          </button>
        ) : null}

        {canAssignFollowUp ? (
          <button
            type="button"
            className="rounded border border-brand-300 px-2 py-1 text-xs text-brand-700 hover:bg-brand-50"
            onClick={() => {
              setFollowUpFor(i);
              setFollowUpForm({
                assigned_to: i.assigned_to ? String(i.assigned_to) : '',
                title: `Follow up: ${i.customer_name || i.inquiry_number}`,
                notes: '',
                due_date: '',
              });
            }}
          >
            Assign Follow-up
          </button>
        ) : null}

        {canDeleteInquiry ? (
          <button
            type="button"
            className="rounded border border-rose-300 px-2 py-1 text-xs text-rose-700"
            onClick={async () => {
              if (!window.confirm('Delete inquiry?')) return;
              await api(`/inquiries/${i.id}`, { method: 'DELETE' });
              qc.invalidateQueries({ queryKey: ['inquiries'] });
            }}
          >
            Delete
          </button>
        ) : null}

        {canEditInquiry && i.status !== 'converted' ? (
          <button
            type="button"
            onClick={() => convertMutation.mutate(i.id)}
            className="rounded-lg border px-2 py-1 text-xs hover:bg-slate-50"
          >
            Convert to Quotation
          </button>
        ) : i.status === 'converted' ? (
          <span className="text-xs text-emerald-700">Converted</span>
        ) : null}
      </div>
    ),
  }));

  const quotationRows = quotations.map((q) => ({
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
        {canCreateQuotation ? (
          <button
            type="button"
            className="rounded border px-2 py-1 text-xs disabled:opacity-60"
            disabled={busyRowId === q.id}
            onClick={() => runRowAction(q.id, () => duplicateMutation.mutateAsync(q.id))}
          >
            Duplicate
          </button>
        ) : null}
        {canEditQuotation ? (
          <button
            type="button"
            className="rounded border px-2 py-1 text-xs disabled:opacity-60"
            disabled={busyRowId === q.id}
            onClick={() => runRowAction(q.id, () => actionMutation.mutateAsync({ id: q.id, action: 'convert-to-invoice' }))}
          >
            Invoice
          </button>
        ) : null}
        <button
          type="button"
          className="rounded border border-indigo-500 px-2 py-1 text-xs text-indigo-600"
          onClick={() => {
            setSelectedQuotationId(q.id);
            setSelectedTemplate('dewas');
            setShowTemplateModal(true);
          }}
        >
          Download PDF
        </button>

        {canDeleteQuotation ? (
          <button
            type="button"
            className="rounded border border-rose-300 px-2 py-1 text-xs text-rose-700 disabled:opacity-60"
            disabled={busyRowId === q.id}
            onClick={() => runRowAction(q.id, () => {
              const ok = window.confirm(`Delete quotation ${q.quotation_number}?`);
              if (!ok) return Promise.resolve();
              return deleteQuotationMutation.mutateAsync(q.id);
            })}
          >
            Delete
          </button>
        ) : null}
      </div>
    ),
  }));

  const quotationItem = quotationForm.items[0];
  const baseAmount = Number(quotationItem.qty || 0) * Number(quotationItem.rate || 0);
  const discountAmount = (baseAmount * Number(quotationItem.discount_pct || 0)) / 100;
  const amountAfterDiscount = baseAmount - discountAmount;
  const gstAmount = (amountAfterDiscount * Number(quotationItem.gst_pct || 0)) / 100;
  const estimatedTotal = amountAfterDiscount + gstAmount;

  return (
    <div className="space-y-4">
      <PageHeader title="Inquiries & Quotations" description="Manage leads and convert them to quotations." />

      {actionMessage ? <p className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{actionMessage}</p> : null}
      {actionError ? <p className="rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{actionError}</p> : null}

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('inquiries')}
          className={`px-4 py-2 font-medium ${activeTab === 'inquiries' ? 'border-b-2 border-brand-600 text-brand-600' : 'text-slate-600 hover:text-slate-900'}`}
        >
          Inquiries
        </button>
        <button
          onClick={() => setActiveTab('quotations')}
          className={`px-4 py-2 font-medium ${activeTab === 'quotations' ? 'border-b-2 border-brand-600 text-brand-600' : 'text-slate-600 hover:text-slate-900'}`}
        >
          Quotations
        </button>
      </div>

      {/* INQUIRIES TAB */}
      {activeTab === 'inquiries' && (
        <div className="space-y-4">
          {canCreateInquiry ? (
          <form onSubmit={(e) => { e.preventDefault(); createInquiryMutation.mutate(inquiryForm); }} className="card space-y-3">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Customer Name</label>
                <input className="w-full rounded-lg border p-2" placeholder="e.g., Rahul Sharma" value={inquiryForm.customer_name} onChange={(e) => setInquiryForm({ ...inquiryForm, customer_name: e.target.value })} required />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Company</label>
                <input className="w-full rounded-lg border p-2" placeholder="e.g., Sharma Enterprises" value={inquiryForm.company} onChange={(e) => setInquiryForm({ ...inquiryForm, company: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Mobile Number</label>
                <input className="w-full rounded-lg border p-2" placeholder="e.g., 9876543210" value={inquiryForm.mobile} onChange={(e) => setInquiryForm({ ...inquiryForm, mobile: e.target.value })} />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Inquiry Source</label>
                {showManualSource ? (
                  <div className="flex gap-2">
                    <input
                      className="w-full rounded-lg border p-2"
                      placeholder="Enter new source"
                      value={manualSource}
                      onChange={(e) => setManualSource(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (manualSource.trim()) {
                          setInquiryForm({ ...inquiryForm, source: manualSource });
                          setManualSource('');
                          setShowManualSource(false);
                        }
                      }}
                      className="rounded bg-emerald-600 px-2 py-2 text-sm text-white whitespace-nowrap"
                    >
                      Set
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowManualSource(false)}
                      className="rounded border px-2 py-2 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <select className="w-full rounded-lg border p-2" value={inquiryForm.source} onChange={(e) => setInquiryForm({ ...inquiryForm, source: e.target.value })}>
                      {sources.map((s) => (
                        <option key={s.id} value={s.source_name}>{s.source_name}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowManualSource(true)}
                      className="rounded border px-2 py-2 text-xs whitespace-nowrap"
                      title="Add custom source"
                    >
                      +
                    </button>
                  </div>
                )}
              </div>

<div className="space-y-1">

<label className="text-sm font-medium">

Product Interested

</label>

<select

className="
w-full
rounded-lg
border
p-2
"

value={
inquiryForm.product_interested
}

onChange={(e)=>

setInquiryForm({

...inquiryForm,

product_interested:
e.target.value

})

}

>

<option value="">

Select Product

</option>

{

products.map(
p=>

<option
key={p.id}
value={p.product_name}
>

{p.product_name}

</option>

)

}

</select>

</div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Status</label>
                <select className="w-full rounded-lg border p-2" value={inquiryForm.status} onChange={(e) => setInquiryForm({ ...inquiryForm, status: e.target.value })}>
                  <option value="new">new</option>
                  <option value="follow_up">follow_up</option>
                  <option value="converted">converted</option>
                  <option value="lost">lost</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Follow-up Date & Time</label>
                <input className="w-full rounded-lg border p-2" type="datetime-local" value={inquiryForm.follow_up_date} onChange={(e) => setInquiryForm({ ...inquiryForm, follow_up_date: e.target.value })} />
              </div>
            </div>

            <button type="submit" className="rounded-lg bg-brand-600 px-3 py-2 text-sm text-white">Add Inquiry</button>
          </form>
          ) : null}
          <DataTable columns={inquiryColumns} rows={inquiryRows} />
        </div>
      )}

{/* QUOTATIONS TAB */}

{activeTab === 'quotations' && (

<div className="space-y-4">

{canCreateQuotation ? (
<form
  onSubmit={(e) => {
    e.preventDefault();
    const selectedInquiryData = inquiries.find(
      (i) => String(i.id) === String(quotationForm.inquiry_id)
    );

    createQuotationMutation.mutate({
      customer_name: selectedInquiryData?.customer_name || quotationForm.customer_name,
      company_name: selectedInquiryData?.company || quotationForm.company_name,
      status: quotationForm.status,
      category: quotationForm.category || 'DEWAS',
      attention_person: quotationForm.attention_person,
      subject: quotationForm.subject,
      application: quotationForm.application,
      flow: quotationForm.flow,
      head: quotationForm.head,
      items: quotationForm.items.map((item) => ({
        description: item.description || item.model || '',
        model: item.model || '',
        motor_hp: item.hp || '',
        head: item.head || '',
        flow_rate: item.flow || '',
        size: item.size || '',
        solid_size: item.solid_size || '',
        qty: Number(item.qty || 0),
        rate: Number(item.rate || 0),
        discount_pct: Number(item.discount_pct || 0),
        gst_pct: Number(item.gst_pct || 18),
        custom_fields: {
          ...(item.custom_fields || {}),
          model: item.model || '',
          motor_hp: item.hp || '',
          head: item.head || '',
          flow_rate: item.flow || '',
          size: item.size || '',
          solid_size: item.solid_size || '',
        },
      })),
    });
  }}
  className="card space-y-4"
>
  <div className="grid gap-3 md:grid-cols-4">
    <div>
      <label className="text-sm font-medium">Select Customer Inquiry</label>
      <select
        className="w-full rounded border p-2"
        value={quotationForm.inquiry_id || ''}
        onChange={(e) => {
          const inquiry = inquiries.find((i) => String(i.id) === e.target.value);
          setQuotationForm({
            ...quotationForm,
            inquiry_id: e.target.value,
            customer_name: inquiry?.customer_name || '',
            company_name: inquiry?.company || '',
            items: [
              {
                ...quotationForm.items[0],
                description: inquiry?.product_interested || '',
              },
            ],
          });
        }}
      >
        <option value="">Select Customer</option>
        {inquiries.map((i) => (
          <option key={i.id} value={i.id}>
            {i.customer_name} - {i.company}
          </option>
        ))}
      </select>
    </div>

    <div>
      <label className="text-sm font-medium">Customer Name</label>
      <input
        className="w-full rounded border p-2"
        value={quotationForm.customer_name || ''}
        onChange={(e) =>
          setQuotationForm({
            ...quotationForm,
            customer_name: e.target.value,
          })
        }
      />
    </div>

    <div>
      <label className="text-sm font-medium">Company Name</label>
      <input
        className="w-full rounded border p-2"
        value={quotationForm.company_name || ''}
        onChange={(e) =>
          setQuotationForm({
            ...quotationForm,
            company_name: e.target.value,
          })
        }
      />
    </div>

    <div>
      <label className="text-sm font-medium">Attention Person</label>
      <input
        className="w-full rounded border p-2"
        value={quotationForm.attention_person}
        onChange={(e) =>
          setQuotationForm({
            ...quotationForm,
            attention_person: e.target.value,
          })
        }
      />
    </div>

    <div>
      <label className="text-sm font-medium">Subject</label>
      <input
        className="w-full rounded border p-2"
        value={quotationForm.subject}
        onChange={(e) =>
          setQuotationForm({
            ...quotationForm,
            subject: e.target.value,
          })
        }
      />
    </div>

    <div>
      <label className="text-sm font-medium">Application</label>
      <input
        className="w-full rounded border p-2"
        value={quotationForm.application}
        onChange={(e) =>
          setQuotationForm({
            ...quotationForm,
            application: e.target.value,
          })
        }
      />
    </div>

    <div>
      <label className="text-sm font-medium">Flow (m3/hr)</label>
      <input
        className="w-full rounded border p-2"
        value={quotationForm.flow}
        onChange={(e) =>
          setQuotationForm({
            ...quotationForm,
            flow: e.target.value,
          })
        }
      />
    </div>

    <div>
      <label className="text-sm font-medium">Head (m)</label>
      <input
        className="w-full rounded border p-2"
        value={quotationForm.head}
        onChange={(e) =>
          setQuotationForm({
            ...quotationForm,
            head: e.target.value,
          })
        }
      />
    </div>

    <div>
      <label className="text-sm font-medium">Status</label>
      <select
        className="w-full rounded border p-2"
        value={quotationForm.status}
        onChange={(e) =>
          setQuotationForm({
            ...quotationForm,
            status: e.target.value,
          })
        }
      >
        <option value="draft">draft</option>
        <option value="sent">sent</option>
        <option value="approved">approved</option>
        <option value="rejected">rejected</option>
      </select>
    </div>

    <div>
      <label className="text-sm font-semibold text-brand-700">Category</label>
      <select
        className="w-full rounded border border-brand-300 bg-brand-50 p-2 font-bold text-brand-800"
        value={quotationForm.category || 'DEWAS'}
        onChange={(e) =>
          setQuotationForm({
            ...quotationForm,
            category: e.target.value,
          })
        }
      >
        <option value="DIGISET">DIGISET</option>
        <option value="DEWAS">DEWAS</option>
        <option value="WADI">WADI</option>
      </select>
    </div>
  </div>

  {/* Line Item Details Section */}
  <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
      <div>
        <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <span>Line Item Details</span>
          <span className="rounded bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700">
            {quotationForm.category || 'DEWAS'} Category
          </span>
        </h4>
        <p className="text-xs text-slate-500">
          Configure line items and fields for {quotationForm.category || 'DEWAS'}. You can add, edit, or delete dynamic fields.
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
      {quotationForm.items.map((item, idx) => {
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

                {quotationForm.items.length > 1 && (
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

            {/* Quick Catalog Model Selector */}
            {products.length > 0 && (
              <div className="flex items-center gap-2 bg-slate-50 p-2 rounded border border-slate-200">
                <span className="text-xs font-semibold text-slate-700">Quick-Pick Model from Catalog:</span>
                <select
                  className="flex-1 rounded border border-slate-300 bg-white p-1 text-xs font-medium text-slate-800"
                  onChange={(e) => {
                    if (e.target.value) handleSelectProduct(idx, e.target.value);
                  }}
                  defaultValue=""
                >
                  <option value="">-- Choose saved pump model to auto-fill specs --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.product_name} {p.hp ? `(${p.hp})` : ''} {p.pipe_size ? `[${p.pipe_size}]` : ''} {p.head ? `[Head: ${p.head}]` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Category-Specific Fields Grid */}
            <div className="grid gap-2 md:grid-cols-6">
              {quotationForm.category === 'DEWAS' && (
                <>
                  <div>
                    <label className="text-xs font-medium text-slate-600">Pump Model</label>
                    <input
                      className="w-full rounded border p-2 text-xs font-bold text-slate-800"
                      placeholder="e.g. KSIL 1-13 / ETERNA 750"
                      value={item.model || ''}
                      onChange={(e) => updateItem(idx, 'model', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600">Motor HP / kW</label>
                    <input
                      className="w-full rounded border p-2 text-xs"
                      placeholder="e.g. 1.0 HP"
                      value={item.hp || ''}
                      onChange={(e) => updateItem(idx, 'hp', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600">Pump Head (m)</label>
                    <input
                      className="w-full rounded border p-2 text-xs"
                      placeholder="e.g. 10 - 78 m"
                      value={item.head || ''}
                      onChange={(e) => updateItem(idx, 'head', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600">Flow Rate</label>
                    <input
                      className="w-full rounded border p-2 text-xs"
                      placeholder="e.g. 120-312 LPM"
                      value={item.flow || ''}
                      onChange={(e) => updateItem(idx, 'flow', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600">SUC x DEL Size</label>
                    <input
                      className="w-full rounded border p-2 text-xs"
                      placeholder="e.g. 32 x 32 mm"
                      value={item.size || ''}
                      onChange={(e) => updateItem(idx, 'size', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600">Max Solid Size</label>
                    <input
                      className="w-full rounded border p-2 text-xs"
                      placeholder="e.g. 18 mm / 22 mm"
                      value={item.solid_size || ''}
                      onChange={(e) => updateItem(idx, 'solid_size', e.target.value)}
                    />
                  </div>
                </>
              )}

              {quotationForm.category === 'WADI' && (
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

              {quotationForm.category === 'DIGISET' && (
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
                <p className="text-xs font-bold text-amber-800">Dynamic Custom Fields ({quotationForm.category}):</p>
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
        <p className="text-xs text-slate-500 font-medium">Total Items: {quotationForm.items.length}</p>
      </div>
    </div>
  </div>

  <button type="submit" className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 shadow-md">
    Create Quotation
  </button>
</form>
) : null}

          <DataTable
            columns={quotationColumns}
            rows={quotationRows}
          />

        </div>
      )}
{

editingInquiry && (

<div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">

<div className="bg-white rounded-xl p-6 w-[600px]">

<h3 className="text-lg font-semibold mb-4">

Edit Inquiry

</h3>

<div className="grid gap-3">

<input

className="border rounded p-2"

placeholder="Customer Name"

value={editInquiryForm.customer_name}

onChange={(e)=>

setEditInquiryForm({

...editInquiryForm,

customer_name:e.target.value

})

}

/>

<input

className="border rounded p-2"

placeholder="Company"

value={editInquiryForm.company}

onChange={(e)=>

setEditInquiryForm({

...editInquiryForm,

company:e.target.value

})

}

/>

<input

className="border rounded p-2"

placeholder="Mobile"

value={editInquiryForm.mobile}

onChange={(e)=>

setEditInquiryForm({

...editInquiryForm,

mobile:e.target.value

})

}

/>

<div className="flex gap-2">

<button

className="bg-blue-600 text-white px-4 py-2 rounded"

onClick={()=>

updateInquiryMutation.mutate(

editInquiryForm

)

}

>

Save

</button>

<button

className="border px-4 py-2 rounded"

onClick={()=>

setEditingInquiry(

null

)

}

>

Cancel

</button>

</div>

</div>

</div>

</div>

)

}

{followUpFor && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
    <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
      <h3 className="mb-1 text-lg font-semibold">Assign Follow-up</h3>
      <p className="mb-4 text-sm text-slate-500">
        {followUpFor.inquiry_number} · {followUpFor.customer_name}
      </p>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!followUpForm.assigned_to) {
            setActionError('Please choose an employee to assign.');
            return;
          }
          followUpMutation.mutate({
            inquiry_id: followUpFor.id,
            assigned_to: Number(followUpForm.assigned_to),
            title: followUpForm.title,
            notes: followUpForm.notes,
            due_date: followUpForm.due_date || null,
          });
        }}
      >
        <div className="space-y-1">
          <label className="text-sm font-medium">Assign To *</label>
          <select
            className="w-full rounded border p-2"
            value={followUpForm.assigned_to}
            onChange={(e) => setFollowUpForm({ ...followUpForm, assigned_to: e.target.value })}
            required
          >
            <option value="">Select employee</option>
            {(Array.isArray(assignees) ? assignees : []).map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Title</label>
          <input
            className="w-full rounded border p-2"
            value={followUpForm.title}
            onChange={(e) => setFollowUpForm({ ...followUpForm, title: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Due Date</label>
          <input
            type="datetime-local"
            className="w-full rounded border p-2"
            value={followUpForm.due_date}
            onChange={(e) => setFollowUpForm({ ...followUpForm, due_date: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Notes</label>
          <textarea
            rows={2}
            className="w-full rounded border p-2"
            value={followUpForm.notes}
            onChange={(e) => setFollowUpForm({ ...followUpForm, notes: e.target.value })}
          />
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" className="rounded border px-4 py-2 text-sm" onClick={() => setFollowUpFor(null)}>
            Cancel
          </button>
          <button
            type="submit"
            className="rounded bg-brand-600 px-4 py-2 text-sm text-white"
            disabled={followUpMutation.isPending}
          >
            Assign
          </button>
        </div>
      </form>
    </div>
  </div>
)}

{showTemplateModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">

      <h2 className="mb-4 text-lg font-semibold">
        Select Template
      </h2>

      <select
        className="mb-4 w-full rounded border p-2"
        value={selectedTemplate}
        onChange={(e) => setSelectedTemplate(e.target.value)}
      >
        <option value="dewas">Dewas (Kirloskar Pumps / Commercial Offer)</option>
        <option value="baerlocher">Baerlocher (Techno-Commercial Offer)</option>
        <option value="choithram">Choithram School (Submersible Pump)</option>
        <option value="greaves">Greaves (DG Set / CRM 1-Page)</option>
      </select>

      <div className="flex justify-end gap-2">

        <button
          className="rounded border px-4 py-2"
          onClick={() => setShowTemplateModal(false)}
        >
          Cancel
        </button>

        <a
          href={`/api/quotations/${selectedQuotationId}/pdf?template=${selectedTemplate}`}
          target="_blank"
          rel="noreferrer"
          className="rounded bg-blue-600 px-4 py-2 text-white"
          onClick={() => setShowTemplateModal(false)}
        >
          Download
        </a>

      </div>

    </div>
  </div>
)}
</div>
  );
}
