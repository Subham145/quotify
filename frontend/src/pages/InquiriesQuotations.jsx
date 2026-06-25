import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import DataTable from '../components/shared/DataTable';
import PageHeader from '../components/shared/PageHeader';
import { api } from '../api/http';
import StatusBadge from '../components/shared/StatusBadge';

export default function InquiriesQuotations() {
  const qc = useQueryClient();
  const { data: inquiries = [] } = useQuery({ queryKey: ['inquiries'], queryFn: () => api('/inquiries') });
  const [selectedInquiry,setSelectedInquiry]=useState('');
  const inquiryData =inquiries.find(i=>String(i.id)===selectedInquiry); 
  const { data: productsRaw } = useQuery({ queryKey: ['products'], queryFn: () => api('/products') });
  const products = Array.isArray(productsRaw) ? productsRaw : Array.isArray(productsRaw?.data)  ? productsRaw.data : [];
  const { data: quotations = [] } = useQuery({ queryKey: ['quotations'], queryFn: () => api('/quotations') });
  const { data: sources = [] } = useQuery({ queryKey: ['inquiry-sources'], queryFn: () => api('/inquiry-sources') });

  const [activeTab, setActiveTab] = useState('inquiries');
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [busyRowId, setBusyRowId] = useState(null);
  const [editingInquiry,setEditingInquiry]=useState(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedQuotationId, setSelectedQuotationId] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState('pump');

  const [editInquiryForm,setEditInquiryForm]=useState({customer_name:'',company:'',mobile:'',product_interested:'',follow_up_date:'',status:'new'});
  const [inquiryForm, setInquiryForm] = useState({customer_name: '',company: '',mobile: '',source: 'WhatsApp',product_interested:'',status: 'new',follow_up_date: '',});
  const [showManualSource, setShowManualSource] = useState(false);
  const [manualSource, setManualSource] = useState('');

  const [quotationForm,setQuotationForm]=useState({

inquiry_id:'',

customer_name:'',

company_name:'',

attention_person:'',

subject:'',

application:'',

flow:'',

head:'',

status:'draft',

items:[{

description:'',

model:'',

hp:'',

head:'',

flow:'',

size:'',

qty:1,

rate:0,

discount_pct:0,

gst_pct:18

}]
});

const addItem = () => {
  setQuotationForm({
    ...quotationForm,
    items: [
      ...quotationForm.items,
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
        gst_pct: 18
      }
    ]
  });
};

const removeItem = (index) => {
  setQuotationForm({
    ...quotationForm,
    items: quotationForm.items.filter((_, i) => i !== index)
  });
};

const updateItem = (index, field, value) => {
  const items = [...quotationForm.items];
  items[index] = {
    ...items[index],
    [field]: value
  };

  setQuotationForm({
    ...quotationForm,
    items
  });
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

  const quotationColumns = useMemo(
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

  const inquiryRows = inquiries.map((i) => ({
    ...i,
    status: <StatusBadge value={i.status} />,
    actions:

<div className="flex gap-2 flex-wrap">

<button

type="button"

className="rounded border px-2 py-1 text-xs"

onClick={()=>{

setEditingInquiry(i);

setEditInquiryForm({

customer_name:i.customer_name||'',

company:i.company||'',

mobile:i.mobile||'',

product_interested:i.product_interested||'',

follow_up_date:i.follow_up_date||'',

status:i.status||'new'

});

}}

>

Edit

</button>

<button

type="button"

className="rounded border border-rose-300 px-2 py-1 text-xs text-rose-700"

onClick={async()=>{

const ok=

window.confirm(

'Delete inquiry?'

);

if(!ok)return;

await api(

`/inquiries/${i.id}`,

{

method:'DELETE'

}

);

qc.invalidateQueries({

queryKey:['inquiries']

});

}}

>

Delete

</button>

{

i.status !== 'converted'

?

(

<button

type="button"

onClick={() =>

convertMutation.mutate(

i.id

)

}

className="rounded-lg border px-2 py-1 text-xs hover:bg-slate-50"

>

Convert to Quotation

</button>

)

:

(

<span className="text-xs text-emerald-700">

Converted

</span>

)

}

</div>,
  }));

  const quotationRows = quotations.map((q) => ({
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
<button
  type="button"
  className="rounded border border-indigo-500 px-2 py-1 text-xs text-indigo-600"
  onClick={() => {
    setSelectedQuotationId(q.id);
    setSelectedTemplate('pump');
    setShowTemplateModal(true);
  }}
>
  Download PDF
</button>



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
          <DataTable columns={inquiryColumns} rows={inquiryRows} />
        </div>
      )}

{/* QUOTATIONS TAB */}

{activeTab === 'quotations' && (

<div className="space-y-4">

<form

onSubmit={(e)=>{

e.preventDefault();

const selectedInquiryData=

inquiries.find(

i=>

String(i.id)

===

String(

quotationForm.inquiry_id

)

);

createQuotationMutation.mutate({

customer_name:

selectedInquiryData?.customer_name
||

quotationForm.customer_name,

company_name:

selectedInquiryData?.company
||

quotationForm.company_name,

status: quotationForm.status,
attention_person:
quotationForm.attention_person,

subject:
quotationForm.subject,

application:
quotationForm.application,

flow:
quotationForm.flow,

head:
quotationForm.head,
items: quotationForm.items.map(item => ({
  description: item.description || '',
  model: item.model || '',
  motor_hp: item.hp || '',
  head: item.head || '',
  flow_rate: item.flow || '',
  size: item.size || '',
  qty: item.qty || 0,
  rate: item.rate || 0,
  discount_pct: item.discount_pct || 0,
  gst_pct: item.gst_pct || 18
}))


});

}}

className="card space-y-3"

>

<div className="grid gap-3 md:grid-cols-4">

<div>

<label className="text-sm font-medium">

Select Customer Inquiry

</label>

<select

className="w-full rounded border p-2"

value={
quotationForm.inquiry_id || ''
}

onChange={(e) => {

const inquiry = inquiries.find(
  i => String(i.id) === e.target.value
);

setQuotationForm({
  ...quotationForm,
  inquiry_id: e.target.value,
  customer_name: inquiry?.customer_name || '',
  company_name: inquiry?.company || '',
  items: [{
    ...quotationForm.items[0],
    description: inquiry?.product_interested || ''
  }]
});

}}

>

<option value="">

Select Customer

</option>

{

inquiries.map(i=>(

<option

key={i.id}

value={i.id}

>

{i.customer_name}

-

{i.company}

</option>

))

}

</select>

</div>

<div>

<label className="text-sm font-medium">

Customer Name

</label>

<input
className="w-full rounded border p-2"
value={quotationForm.customer_name || ''}
onChange={(e) =>
  setQuotationForm({
    ...quotationForm,
    customer_name: e.target.value
  })
}
/>
</div>

<div>

<label className="text-sm font-medium">

Company Name

</label>

<input
className="w-full rounded border p-2"
value={quotationForm.company_name || ''}
onChange={(e) =>
  setQuotationForm({
    ...quotationForm,
    company_name: e.target.value
  })
}
/>

</div>
<div>
  <label className="text-sm font-medium">
    Attention Person
  </label>

  <input
    className="w-full rounded border p-2"
    value={quotationForm.attention_person}
    onChange={(e) =>
      setQuotationForm({
        ...quotationForm,
        attention_person: e.target.value
      })
    }
  />
</div>

<div>
  <label className="text-sm font-medium">
    Subject
  </label>

  <input
    className="w-full rounded border p-2"
    value={quotationForm.subject}
    onChange={(e) =>
      setQuotationForm({
        ...quotationForm,
        subject: e.target.value
      })
    }
  />
</div>
<div>
  <label className="text-sm font-medium">
    Application
  </label>

  <input
    className="w-full rounded border p-2"
    value={quotationForm.application}
    onChange={(e)=>
      setQuotationForm({
        ...quotationForm,
        application:e.target.value
      })
    }
  />
</div>

<div>
  <label className="text-sm font-medium">
    Flow (m3/hr)
  </label>

  <input
    className="w-full rounded border p-2"
    value={quotationForm.flow}
    onChange={(e)=>
      setQuotationForm({
        ...quotationForm,
        flow:e.target.value
      })
    }
  />
</div>

<div>
  <label className="text-sm font-medium">
    Head (m)
  </label>

  <input
    className="w-full rounded border p-2"
    value={quotationForm.head}
    onChange={(e)=>
      setQuotationForm({
        ...quotationForm,
        head:e.target.value
      })
    }
  />
</div>
<div>

<label className="text-sm font-medium">

Status

</label>

<select

className="w-full rounded border p-2"

value={
quotationForm.status
}

onChange={(e) => {

const inquiry = inquiries.find(
  i => String(i.id) === e.target.value
);

setQuotationForm({
  ...quotationForm,
  inquiry_id: e.target.value,
  customer_name: inquiry?.customer_name || '',
  company_name: inquiry?.company || ''
});

}}

>

<option value="draft">

draft

</option>

<option value="sent">

sent

</option>

<option value="approved">

approved

</option>

</select>

</div>

</div>

<div className="rounded border p-3">

<p className="mb-2 text-sm font-medium">

Line Item Details

</p>

<div className="grid gap-2 md:grid-cols-5">
<div>
  <label className="text-xs">Pump Model</label>
  <input
    className="w-full rounded border p-2"
    value={quotationForm.items[0].model || ''}
    onChange={(e)=>
      setQuotationForm({
        ...quotationForm,
        items:[{
          ...quotationForm.items[0],
          model:e.target.value
        }]
      })
    }
  />
</div>

<div>
  <label className="text-xs">Motor HP</label>
  <input
    className="w-full rounded border p-2"
    value={quotationForm.items[0].hp || ''}
    onChange={(e)=>
      setQuotationForm({
        ...quotationForm,
        items:[{
          ...quotationForm.items[0],
          hp:e.target.value
        }]
      })
    }
  />
</div>
<div>
  <label className="text-xs">
    Pump Head
  </label>

  <input
    className="w-full rounded border p-2"
    value={quotationForm.items[0].head || ''}
    onChange={(e)=>
      setQuotationForm({
        ...quotationForm,
        items:[{
          ...quotationForm.items[0],
          head:e.target.value
        }]
      })
    }
  />
</div>
<div>
  <label className="text-xs">Flow Rate</label>
  <input
    className="w-full rounded border p-2"
    value={quotationForm.items[0].flow || ''}
    onChange={(e)=>
      setQuotationForm({
        ...quotationForm,
        items:[{
          ...quotationForm.items[0],
          flow:e.target.value
        }]
      })
    }
  />
</div>

<div>
  <label className="text-xs">SUC x DEL</label>
  <input
    className="w-full rounded border p-2"
    value={quotationForm.items[0].size || ''}
    onChange={(e)=>
      setQuotationForm({
        ...quotationForm,
        items:[{
          ...quotationForm.items[0],
          size:e.target.value
        }]
      })
    }
  />
</div>
<div>

<label className="text-xs">

Product

</label>

<input
className="w-full rounded border p-2"
value={quotationForm.items[0].description || ''}
onChange={(e)=>
setQuotationForm({
  ...quotationForm,
  items:[{
    ...quotationForm.items[0],
    description:e.target.value
  }]
})
}
/>
</div>

<div>

<label className="text-xs">

Qty

</label>

<input

type="number"

className="w-full rounded border p-2"

value={
quotationForm.items[0].qty
}

onChange={(e)=>

setQuotationForm({

...quotationForm,

items:[{

...quotationForm.items[0],

qty:Number(e.target.value)

}]

})

}

/>

</div>

<div>

<label className="text-xs">

Rate

</label>

<input

type="number"

className="w-full rounded border p-2"

value={
quotationForm.items[0].rate
}

onChange={(e)=>

setQuotationForm({

...quotationForm,

items:[{

...quotationForm.items[0],

rate:

Number(

e.target.value

)

}]

})

}

/>

</div>

<div>

<label className="text-xs">

Discount %

</label>

<input

type="number"

className="w-full rounded border p-2"

value={
quotationForm.items[0].discount_pct
}

onChange={(e)=>

setQuotationForm({

...quotationForm,

items:[{

...quotationForm.items[0],

discount_pct:

Number(

e.target.value

)

}]

})

}

/>

</div>

<div>

<label className="text-xs">

GST %

</label>

<input

type="number"

className="w-full rounded border p-2"

value={
quotationForm.items[0].gst_pct
}

onChange={(e)=>

setQuotationForm({

...quotationForm,

items:[{

...quotationForm.items[0],

gst_pct:

Number(

e.target.value

)

}]

})

}

/>

</div>

</div>

</div>

<button

type="submit"

className="rounded bg-brand-600 px-3 py-2 text-white"

>

Create Quotation

</button>

</form>

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
        <option value="pump">Pump Template</option>
        <option value="motor">Motor Template</option>
        <option value="industrial">Industrial Template</option>
        <option value="service">Service Template</option>
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
