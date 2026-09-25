import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import DataTable from '../components/shared/DataTable';
import PageHeader from '../components/shared/PageHeader';
import { api, getApiUrl } from '../api/http';
import StatusBadge from '../components/shared/StatusBadge';
import { useAuth } from '../lib/AuthContext';
import { canAccess, isManager } from '../lib/permissions';

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

const DIGISET_DEFAULT_TERMS = {
  panel_type: 'Both (Standard / Automatic)',
  sales_person_name: 'Pradeep Ghadge',
  sales_person_phone: '8269000495',
  taxes_terms: '-GST@18% shall be charged extra in the above price.',
  delivery_terms: 'Ex Godown',
  warranty_terms: '5 Years warranty / 5000 hours subject to warranty document attached.',
  insurance_terms: '-Freight & Transit Insurance up-to site at actual is INCLUDED in above price.',
  loading_terms: '– To be done by client.',
  installation_terms: '– In client’s scope, i.e. unloading of DG set, It’s Placement on platform, Preparation of platform, four numbers of dedicated earthing, cabling with its lugs etc. However, commissioning shall be done by us free of charge after you complete the installation work. Please note that the DG set must be commissioned within 6 months time from the date of our invoice otherwise DG Set will have to undergo a chargeable revalidation by service dealer prior to commissioning.',
  permission_terms: '– All necessary legal requirements / permissions should be obtained by the Buyer.',
  payment_terms: '-30% advance along with the order and balance 70% against Proforma Invoice prior to dispatch of set from principal’s plant.',
  validity_terms: '- The offer is valid for 30 Days.',
  statutory_terms: '- Presently the above taxes and duties are applicable. However, if there is any change in the taxes and duties or if any fresh taxes and duties are levied by central, state or local government the same shall be applicable at the time of invoicing to your account.',
  force_majeure_terms: '- The offer shall be subjected to force majeure clause.',
  arbitration_terms: '- The venue of arbitration shall be INDORE for any disputes or differences arising under the terms of contract placed on the company.',
  cancellation_terms: '- In case of order cancellation 10% of total value will be levied.',
};

function ControlPanelSelector({ value, onChange }) {
  const selected = value || 'Both (Standard / Automatic)';
  const options = [
    { id: 'Standard Control Panel', label: 'Standard Control Panel', icon: '⚙️', desc: 'Standard key-start with RMU unit' },
    { id: 'Automatic Control Panel', label: 'Automatic Control Panel', icon: '⚡', desc: 'AMF automatic mains failure panel' },
    { id: 'Both (Standard / Automatic)', label: 'Both (Standard / Automatic)', icon: '🔄', desc: 'Dual Standard & AMF offer' },
  ];

  return (
    <div className="rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50/70 to-blue-50/50 p-4 space-y-2.5 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <label className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
            <span className="text-base">⚡</span> Control Panel Configuration (DIGISET)
          </label>
          <p className="text-[11px] text-slate-500">
            Select Standard Control Panel, Automatic AMF Panel, or Both options for this quotation:
          </p>
        </div>
        <span className="rounded-full bg-indigo-100 border border-indigo-300 px-3 py-1 text-xs font-bold text-indigo-800">
          Selected: {selected}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
        {options.map((opt) => {
          const isSelected = selected === opt.id;
          return (
            <button
              type="button"
              key={opt.id}
              onClick={() => onChange(opt.id)}
              className={`flex flex-col items-start p-3 rounded-lg border text-left transition-all ${
                isSelected
                  ? 'border-indigo-600 bg-white ring-2 ring-indigo-500/30 text-indigo-950 shadow-sm'
                  : 'border-slate-200 bg-white/70 hover:bg-white text-slate-700'
              }`}
            >
              <span className="text-xs font-bold flex items-center gap-1.5">
                <span>{opt.icon}</span> {opt.label}
              </span>
              <span className="text-[10px] text-slate-500 mt-1">{opt.desc}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CommercialTermsEditor({ values, onChange, isDigiset }) {
  if (!isDigiset) {
    return (
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
              value={values.sales_person_name || ''}
              onChange={(e) => onChange('sales_person_name', e.target.value)}
              placeholder="e.g. Puneet Choudhary"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700">Contact Number</label>
            <input
              className="w-full rounded-lg border p-2 text-xs font-medium focus:border-brand-500 focus:outline-none"
              value={values.sales_person_phone || ''}
              onChange={(e) => onChange('sales_person_phone', e.target.value)}
              placeholder="e.g. 91790-76660"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700">Delivery Terms</label>
            <input
              className="w-full rounded-lg border p-2 text-xs font-medium focus:border-brand-500 focus:outline-none"
              value={values.delivery_terms || ''}
              onChange={(e) => onChange('delivery_terms', e.target.value)}
              placeholder="e.g. Ex Godown"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700">Payment Terms</label>
            <input
              className="w-full rounded-lg border p-2 text-xs font-medium focus:border-brand-500 focus:outline-none"
              value={values.payment_terms || ''}
              onChange={(e) => onChange('payment_terms', e.target.value)}
              placeholder="e.g. 100% advance"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700">Freight Terms</label>
            <input
              className="w-full rounded-lg border p-2 text-xs font-medium focus:border-brand-500 focus:outline-none"
              value={values.freight_terms || ''}
              onChange={(e) => onChange('freight_terms', e.target.value)}
              placeholder="e.g. To Pay"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4 shadow-xs">
      <div className="border-b border-slate-100 pb-2.5 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <span>📜 Commercial Terms &amp; Conditions (DIGISET)</span>
            <span className="rounded bg-brand-50 border border-brand-200 px-2 py-0.5 text-[11px] font-bold text-brand-700">
              13 Terms - All Editable
            </span>
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            All 13 official commercial terms below are pre-filled and completely editable for this quotation &amp; PDF:
          </p>
        </div>
      </div>

      {/* Sign-off Details */}
      <div className="grid gap-3 sm:grid-cols-2 bg-slate-50/70 p-3 rounded-lg border border-slate-200/80">
        <div>
          <label className="text-xs font-bold text-slate-700">Yours truly (Contact Person)</label>
          <input
            className="w-full rounded-lg border bg-white p-2 text-xs font-medium focus:border-brand-500 focus:outline-none"
            value={values.sales_person_name || ''}
            onChange={(e) => onChange('sales_person_name', e.target.value)}
            placeholder="e.g. Pradeep Ghadge"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-700">Contact Number</label>
          <input
            className="w-full rounded-lg border bg-white p-2 text-xs font-medium focus:border-brand-500 focus:outline-none"
            value={values.sales_person_phone || ''}
            onChange={(e) => onChange('sales_person_phone', e.target.value)}
            placeholder="e.g. 8269000495"
          />
        </div>
      </div>

      {/* 13 Commercial Terms */}
      <div className="grid gap-3.5 sm:grid-cols-2">
        <div>
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
            <span>➢</span> 1. GST Clause
          </label>
          <input
            className="w-full rounded-lg border p-2 text-xs font-medium focus:border-brand-500 focus:outline-none"
            value={values.taxes_terms !== undefined ? values.taxes_terms : DIGISET_DEFAULT_TERMS.taxes_terms}
            onChange={(e) => onChange('taxes_terms', e.target.value)}
            placeholder="-GST@18% shall be charged extra in the above price."
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
            <span>➢</span> 2. DELIVERY
          </label>
          <input
            className="w-full rounded-lg border p-2 text-xs font-medium focus:border-brand-500 focus:outline-none"
            value={values.delivery_terms !== undefined ? values.delivery_terms : DIGISET_DEFAULT_TERMS.delivery_terms}
            onChange={(e) => onChange('delivery_terms', e.target.value)}
            placeholder="Ex Godown"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
            <span>➢</span> 3. WARRANTY
          </label>
          <input
            className="w-full rounded-lg border p-2 text-xs font-medium focus:border-brand-500 focus:outline-none"
            value={values.warranty_terms !== undefined ? values.warranty_terms : DIGISET_DEFAULT_TERMS.warranty_terms}
            onChange={(e) => onChange('warranty_terms', e.target.value)}
            placeholder="5 Years warranty / 5000 hours subject to warranty document attached."
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
            <span>➢</span> 4. FREIGHT &amp; TRANSIT INSURANCE
          </label>
          <input
            className="w-full rounded-lg border p-2 text-xs font-medium focus:border-brand-500 focus:outline-none"
            value={values.insurance_terms !== undefined ? values.insurance_terms : DIGISET_DEFAULT_TERMS.insurance_terms}
            onChange={(e) => onChange('insurance_terms', e.target.value)}
            placeholder="-Freight & Transit Insurance up-to site at actual is INCLUDED in above price."
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
            <span>➢</span> 5. LOADING / UNLOADING / POSITIONING OF SET AT SITE
          </label>
          <input
            className="w-full rounded-lg border p-2 text-xs font-medium focus:border-brand-500 focus:outline-none"
            value={values.loading_terms !== undefined ? values.loading_terms : DIGISET_DEFAULT_TERMS.loading_terms}
            onChange={(e) => onChange('loading_terms', e.target.value)}
            placeholder="– To be done by client."
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
            <span>➢</span> 7. PERMISSION FOR THE GENERATOR SET
          </label>
          <input
            className="w-full rounded-lg border p-2 text-xs font-medium focus:border-brand-500 focus:outline-none"
            value={values.permission_terms !== undefined ? values.permission_terms : DIGISET_DEFAULT_TERMS.permission_terms}
            onChange={(e) => onChange('permission_terms', e.target.value)}
            placeholder="– All necessary legal requirements / permissions should be obtained by the Buyer."
          />
        </div>

        <div className="sm:col-span-2">
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
            <span>➢</span> 6. INSTALLATION &amp; COMMISSIONING
          </label>
          <textarea
            rows={2}
            className="w-full rounded-lg border p-2 text-xs font-medium focus:border-brand-500 focus:outline-none"
            value={values.installation_terms !== undefined ? values.installation_terms : DIGISET_DEFAULT_TERMS.installation_terms}
            onChange={(e) => onChange('installation_terms', e.target.value)}
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
            <span>➢</span> 8. TERMS OF PAYMENT
          </label>
          <input
            className="w-full rounded-lg border p-2 text-xs font-medium focus:border-brand-500 focus:outline-none"
            value={values.payment_terms !== undefined ? values.payment_terms : DIGISET_DEFAULT_TERMS.payment_terms}
            onChange={(e) => onChange('payment_terms', e.target.value)}
            placeholder="-30% advance along with the order..."
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
            <span>➢</span> 9. VALIDITY
          </label>
          <input
            className="w-full rounded-lg border p-2 text-xs font-medium focus:border-brand-500 focus:outline-none"
            value={values.validity_terms !== undefined ? values.validity_terms : DIGISET_DEFAULT_TERMS.validity_terms}
            onChange={(e) => onChange('validity_terms', e.target.value)}
            placeholder="- The offer is valid for 30 Days."
          />
        </div>

        <div className="sm:col-span-2">
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
            <span>➢</span> 10. STATUTORY VARIATIONS
          </label>
          <textarea
            rows={2}
            className="w-full rounded-lg border p-2 text-xs font-medium focus:border-brand-500 focus:outline-none"
            value={values.statutory_terms !== undefined ? values.statutory_terms : DIGISET_DEFAULT_TERMS.statutory_terms}
            onChange={(e) => onChange('statutory_terms', e.target.value)}
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
            <span>➢</span> 11. FORCE MAJEURE CLAUSE
          </label>
          <input
            className="w-full rounded-lg border p-2 text-xs font-medium focus:border-brand-500 focus:outline-none"
            value={values.force_majeure_terms !== undefined ? values.force_majeure_terms : DIGISET_DEFAULT_TERMS.force_majeure_terms}
            onChange={(e) => onChange('force_majeure_terms', e.target.value)}
            placeholder="- The offer shall be subjected to force majeure clause."
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
            <span>➢</span> 12. ARBITRATION
          </label>
          <input
            className="w-full rounded-lg border p-2 text-xs font-medium focus:border-brand-500 focus:outline-none"
            value={values.arbitration_terms !== undefined ? values.arbitration_terms : DIGISET_DEFAULT_TERMS.arbitration_terms}
            onChange={(e) => onChange('arbitration_terms', e.target.value)}
            placeholder="- The venue of arbitration shall be INDORE..."
          />
        </div>

        <div className="sm:col-span-2">
          <label className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
            <span>➢</span> 13. CANCELLATION OF ORDER
            <span className="text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded font-semibold">Editable</span>
          </label>
          <input
            className="w-full rounded-lg border-2 border-rose-300 bg-rose-50/30 p-2 text-xs font-medium text-rose-950 focus:border-rose-500 focus:outline-none"
            value={values.cancellation_terms !== undefined ? values.cancellation_terms : DIGISET_DEFAULT_TERMS.cancellation_terms}
            onChange={(e) => onChange('cancellation_terms', e.target.value)}
            placeholder="- In case of order cancellation 10% of total value will be levied."
          />
        </div>
      </div>
    </div>
  );
}

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
  const { data: productCategories = [] } = useQuery({ queryKey: ['product-categories'], queryFn: () => api('/product-categories') });
  const categoryOptions = useMemo(() => {
    const canonical = ['DEWAS', 'WADI', 'DIGISET'];
    const custom = (Array.isArray(productCategories) ? productCategories : [])
      .map((c) => {
        const raw = typeof c === 'string' ? c : c?.name || '';
        const norm = raw.trim().toUpperCase();
        if (norm === 'DIGISET') return 'DIGISET';
        if (norm.includes('DEWAS')) return 'DEWAS';
        if (norm.includes('WADI')) return 'WADI';
        return norm;
      })
      .filter((name) => name && !canonical.includes(name));
    return [...canonical, ...Array.from(new Set(custom))];
  }, [productCategories]);
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
          discounted_price: 0,
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
      const pPrice = Number(prod.price || 0);
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
        rate: pPrice > 0 ? pPrice : items[itemIndex].rate,
        discounted_price: pPrice > 0 ? pPrice : items[itemIndex].rate,
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
          body: JSON.stringify({
            file_base64: base64,
            category: quotationForm.category || 'DEWAS',
          }),
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

          setQuotationForm((prev) => ({
            ...prev,
            category: res.category || prev.category || 'DEWAS',
            items,
          }));

          setActionMessage(`Extracted ${res.items.length} line items from PDF for ${res.category || quotationForm.category || 'DEWAS'} successfully!`);
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

  const [savedQuotationInfo, setSavedQuotationInfo] = useState(null);

  const createQuotationMutation = useMutation({
    mutationFn: (payload) => api('/quotations', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: (res) => {
      const createdQ = {
        id: res?.id || res?.quotation?.id || res?.data?.id,
        quotation_number: res?.quotation_number || res?.quotation?.quotation_number || res?.data?.quotation_number || 'QT-NEW',
        customer_name: res?.customer_name || res?.quotation?.customer_name || quotationForm.customer_name || 'Customer',
        company_name: res?.company_name || res?.quotation?.company_name || quotationForm.company_name || '',
        category: res?.category || res?.quotation?.category || quotationForm.category || 'DEWAS',
        total_amount: res?.total_amount || res?.totalAmount || res?.quotation?.total_amount || 0,
        subtotal: res?.subtotal || res?.quotation?.subtotal || 0,
        sales_person_name: quotationForm.sales_person_name || '',
        sales_person_phone: quotationForm.sales_person_phone || '',
      };
      setSavedQuotationInfo(createdQ);
      setQuotationForm((prev) => ({
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
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    onError: (err) => {
      setActionError(err.message || 'Failed to create quotation');
      setActionMessage('');
    },
  });

  const [editingQuotation, setEditingQuotation] = useState(null);
  const [loadingQuotationId, setLoadingQuotationId] = useState(null);

  const updateQuotationMutation = useMutation({
    mutationFn: ({ id, payload }) => api(`/quotations/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quotations'] });
      setActionMessage('Quotation updated successfully');
      setActionError('');
      setEditingQuotation(null);
    },
    onError: (err) => {
      setActionError(err.message || 'Failed to update quotation');
      setActionMessage('');
    },
  });

  const handleOpenEditQuotation = async (id) => {
    setLoadingQuotationId(id);
    setActionError('');
    try {
      const qData = await api(`/quotations/${id}`);
      if (qData) {
        setEditingQuotation({
          ...qData,
          sales_person_name: qData.sales_person_name !== undefined && qData.sales_person_name !== null && qData.sales_person_name !== '' ? qData.sales_person_name : (qData.category === 'DIGISET' ? 'Pradeep Ghadge' : 'Puneet Choudhary'),
          sales_person_phone: qData.sales_person_phone !== undefined && qData.sales_person_phone !== null && qData.sales_person_phone !== '' ? qData.sales_person_phone : (qData.category === 'DIGISET' ? '8269000495' : '9179076660'),
          panel_type: qData.panel_type || (qData.category === 'DIGISET' ? 'Both (Standard / Automatic)' : ''),
          delivery_terms: qData.delivery_terms || 'Ex Godown',
          payment_terms: qData.payment_terms || (qData.category === 'DIGISET' ? DIGISET_DEFAULT_TERMS.payment_terms : '100% advance'),
          freight_terms: qData.freight_terms || (qData.category === 'DIGISET' ? DIGISET_DEFAULT_TERMS.insurance_terms : 'To Pay'),
          taxes_terms: qData.taxes_terms !== undefined ? qData.taxes_terms : (qData.category === 'DIGISET' ? DIGISET_DEFAULT_TERMS.taxes_terms : 'GST 18% Extra'),
          validity_terms: qData.validity_terms !== undefined ? qData.validity_terms : (qData.category === 'DIGISET' ? DIGISET_DEFAULT_TERMS.validity_terms : '30 Days'),
          warranty_terms: qData.warranty_terms !== undefined ? qData.warranty_terms : (qData.category === 'DIGISET' ? DIGISET_DEFAULT_TERMS.warranty_terms : ''),
          insurance_terms: qData.insurance_terms !== undefined ? qData.insurance_terms : (qData.category === 'DIGISET' ? DIGISET_DEFAULT_TERMS.insurance_terms : ''),
          loading_terms: qData.loading_terms !== undefined ? qData.loading_terms : (qData.category === 'DIGISET' ? DIGISET_DEFAULT_TERMS.loading_terms : ''),
          installation_terms: qData.installation_terms !== undefined ? qData.installation_terms : (qData.category === 'DIGISET' ? DIGISET_DEFAULT_TERMS.installation_terms : ''),
          permission_terms: qData.permission_terms !== undefined ? qData.permission_terms : (qData.category === 'DIGISET' ? DIGISET_DEFAULT_TERMS.permission_terms : ''),
          statutory_terms: qData.statutory_terms !== undefined ? qData.statutory_terms : (qData.category === 'DIGISET' ? DIGISET_DEFAULT_TERMS.statutory_terms : ''),
          force_majeure_terms: qData.force_majeure_terms !== undefined ? qData.force_majeure_terms : (qData.category === 'DIGISET' ? DIGISET_DEFAULT_TERMS.force_majeure_terms : ''),
          arbitration_terms: qData.arbitration_terms !== undefined ? qData.arbitration_terms : (qData.category === 'DIGISET' ? DIGISET_DEFAULT_TERMS.arbitration_terms : ''),
          cancellation_terms: qData.cancellation_terms !== undefined ? qData.cancellation_terms : (qData.category === 'DIGISET' ? DIGISET_DEFAULT_TERMS.cancellation_terms : ''),
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

  const handleSelectQuotationProduct = (idx, prod, isEdit = false) => {
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
      setQuotationForm((prev) => {
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

  const addEditQuotationItem = () => {
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

  const removeEditQuotationItem = (index) => {
    if ((editingQuotation?.items || []).length <= 1) return;
    setEditingQuotation((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const updateEditQuotationItem = (index, field, value) => {
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
        <button
          type="button"
          className="rounded border border-indigo-600 bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-60"
          disabled={busyRowId === q.id || loadingQuotationId === q.id}
          onClick={() => handleOpenEditQuotation(q.id)}
        >
          {loadingQuotationId === q.id ? 'Loading...' : 'View / Edit'}
        </button>
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

  const grandSummary = useMemo(() => {
    let totalQty = 0;
    let subtotal = 0;
    let totalDiscount = 0;
    let totalGst = 0;

    (quotationForm.items || []).forEach((item) => {
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
  }, [quotationForm.items, quotationForm.category]);

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
      sales_person_name: quotationForm.sales_person_name,
      sales_person_phone: quotationForm.sales_person_phone,
      panel_type: quotationForm.panel_type || ((quotationForm.category || '').toUpperCase().includes('DIGISET') ? 'Both (Standard / Automatic)' : ''),
      delivery_terms: quotationForm.delivery_terms,
      payment_terms: quotationForm.payment_terms,
      freight_terms: quotationForm.freight_terms,
      availability_terms: quotationForm.availability_terms,
      taxes_terms: quotationForm.taxes_terms,
      validity_terms: quotationForm.validity_terms,
      warranty_terms: quotationForm.warranty_terms,
      insurance_terms: quotationForm.insurance_terms,
      loading_terms: quotationForm.loading_terms,
      installation_terms: quotationForm.installation_terms,
      permission_terms: quotationForm.permission_terms,
      statutory_terms: quotationForm.statutory_terms,
      force_majeure_terms: quotationForm.force_majeure_terms,
      arbitration_terms: quotationForm.arbitration_terms,
      cancellation_terms: quotationForm.cancellation_terms,
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
        discounted_price: item.discounted_price !== undefined && item.discounted_price !== null && item.discounted_price !== '' ? Number(item.discounted_price) : undefined,
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
          discounted_price: item.discounted_price !== undefined && item.discounted_price !== null && item.discounted_price !== '' ? Number(item.discounted_price) : undefined,
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
        onChange={(e) => {
          const cat = e.target.value;
          setQuotationForm((prev) => ({
            ...prev,
            category: cat,
            ...(cat === 'DIGISET' ? {
              panel_type: prev.panel_type || DIGISET_DEFAULT_TERMS.panel_type,
              sales_person_name: prev.sales_person_name === 'Puneet Choudhary' ? DIGISET_DEFAULT_TERMS.sales_person_name : (prev.sales_person_name || DIGISET_DEFAULT_TERMS.sales_person_name),
              sales_person_phone: prev.sales_person_phone === '9179076660' ? DIGISET_DEFAULT_TERMS.sales_person_phone : (prev.sales_person_phone || DIGISET_DEFAULT_TERMS.sales_person_phone),
              taxes_terms: prev.taxes_terms || DIGISET_DEFAULT_TERMS.taxes_terms,
              delivery_terms: prev.delivery_terms || DIGISET_DEFAULT_TERMS.delivery_terms,
              warranty_terms: prev.warranty_terms || DIGISET_DEFAULT_TERMS.warranty_terms,
              insurance_terms: prev.insurance_terms || DIGISET_DEFAULT_TERMS.insurance_terms,
              loading_terms: prev.loading_terms || DIGISET_DEFAULT_TERMS.loading_terms,
              installation_terms: prev.installation_terms || DIGISET_DEFAULT_TERMS.installation_terms,
              permission_terms: prev.permission_terms || DIGISET_DEFAULT_TERMS.permission_terms,
              payment_terms: prev.payment_terms === '100% advance' ? DIGISET_DEFAULT_TERMS.payment_terms : (prev.payment_terms || DIGISET_DEFAULT_TERMS.payment_terms),
              validity_terms: prev.validity_terms || DIGISET_DEFAULT_TERMS.validity_terms,
              statutory_terms: prev.statutory_terms || DIGISET_DEFAULT_TERMS.statutory_terms,
              force_majeure_terms: prev.force_majeure_terms || DIGISET_DEFAULT_TERMS.force_majeure_terms,
              arbitration_terms: prev.arbitration_terms || DIGISET_DEFAULT_TERMS.arbitration_terms,
              cancellation_terms: prev.cancellation_terms || DIGISET_DEFAULT_TERMS.cancellation_terms,
              freight_terms: prev.freight_terms === 'To Pay' ? DIGISET_DEFAULT_TERMS.insurance_terms : (prev.freight_terms || DIGISET_DEFAULT_TERMS.insurance_terms),
            } : {})
          }));
        }}
      >
        {categoryOptions.map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>
    </div>
  </div>

  {/* DIGISET Control Panel Selection (Standard, Automatic, Both) */}
  {quotationForm.category === 'DIGISET' && (
    <ControlPanelSelector
      value={quotationForm.panel_type}
      onChange={(val) => setQuotationForm({ ...quotationForm, panel_type: val })}
    />
  )}

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
          Configure line items and specifications for {quotationForm.category || 'DEWAS'}.
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
      {quotationForm.items.map((item, idx) => {
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
                onSelect={(prod) => handleSelectQuotationProduct(idx, prod, false)}
              />
            </div>

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
                  className="w-full rounded-lg border-2 border-emerald-400 bg-white p-2 text-xs font-bold text-emerald-900 shadow-xs focus:border-indigo-600 focus:outline-none"
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
          <p className="text-xs text-slate-500 font-medium">Total Items: {quotationForm.items.length}</p>
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
  <CommercialTermsEditor
    values={quotationForm}
    onChange={(field, val) => setQuotationForm((prev) => ({ ...prev, [field]: val }))}
    isDigiset={quotationForm.category === 'DIGISET'}
  />

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
          href={getApiUrl(`/quotations/${selectedQuotationId}/pdf?template=${selectedTemplate}`)}
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
            onChange={(e) => {
              const cat = e.target.value;
              setEditingQuotation((prev) => ({
                ...prev,
                category: cat,
                ...(cat === 'DIGISET' ? {
                  panel_type: prev.panel_type || DIGISET_DEFAULT_TERMS.panel_type,
                  sales_person_name: prev.sales_person_name === 'Puneet Choudhary' ? DIGISET_DEFAULT_TERMS.sales_person_name : (prev.sales_person_name || DIGISET_DEFAULT_TERMS.sales_person_name),
                  sales_person_phone: prev.sales_person_phone === '9179076660' ? DIGISET_DEFAULT_TERMS.sales_person_phone : (prev.sales_person_phone || DIGISET_DEFAULT_TERMS.sales_person_phone),
                  taxes_terms: prev.taxes_terms || DIGISET_DEFAULT_TERMS.taxes_terms,
                  delivery_terms: prev.delivery_terms || DIGISET_DEFAULT_TERMS.delivery_terms,
                  warranty_terms: prev.warranty_terms || DIGISET_DEFAULT_TERMS.warranty_terms,
                  insurance_terms: prev.insurance_terms || DIGISET_DEFAULT_TERMS.insurance_terms,
                  loading_terms: prev.loading_terms || DIGISET_DEFAULT_TERMS.loading_terms,
                  installation_terms: prev.installation_terms || DIGISET_DEFAULT_TERMS.installation_terms,
                  permission_terms: prev.permission_terms || DIGISET_DEFAULT_TERMS.permission_terms,
                  payment_terms: prev.payment_terms === '100% advance' ? DIGISET_DEFAULT_TERMS.payment_terms : (prev.payment_terms || DIGISET_DEFAULT_TERMS.payment_terms),
                  validity_terms: prev.validity_terms || DIGISET_DEFAULT_TERMS.validity_terms,
                  statutory_terms: prev.statutory_terms || DIGISET_DEFAULT_TERMS.statutory_terms,
                  force_majeure_terms: prev.force_majeure_terms || DIGISET_DEFAULT_TERMS.force_majeure_terms,
                  arbitration_terms: prev.arbitration_terms || DIGISET_DEFAULT_TERMS.arbitration_terms,
                  cancellation_terms: prev.cancellation_terms || DIGISET_DEFAULT_TERMS.cancellation_terms,
                  freight_terms: prev.freight_terms === 'To Pay' ? DIGISET_DEFAULT_TERMS.insurance_terms : (prev.freight_terms || DIGISET_DEFAULT_TERMS.insurance_terms),
                } : {})
              }));
            }}
          >
            {categoryOptions.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
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

      {/* DIGISET Control Panel Selection (Standard, Automatic, Both) */}
      {(editingQuotation.category || '').toUpperCase().includes('DIGISET') && (
        <ControlPanelSelector
          value={editingQuotation.panel_type || 'Both (Standard / Automatic)'}
          onChange={(val) => setEditingQuotation({ ...editingQuotation, panel_type: val })}
        />
      )}

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
            onClick={addEditQuotationItem}
            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 shadow-sm transition-colors"
          >
            <span>+</span>
            <span>Add Line Item</span>
          </button>
        </div>

        {/* Items List */}
        <div className="space-y-3">
          {(editingQuotation.items || []).map((item, idx) => {
            const isDewas = (editingQuotation.category || '').toUpperCase() === 'DEWAS';
            const lineBase = Number(item.qty || 0) * Number(item.rate || 0);
            const lineDiscount = isDewas ? 0 : (lineBase * Number(item.discount_pct || 0)) / 100;
            const lineNet = lineBase - lineDiscount;
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
                      onClick={() => removeEditQuotationItem(idx)}
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
                    onSelect={(prod) => handleSelectQuotationProduct(idx, prod, true)}
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
                          onChange={(e) => updateEditQuotationItem(idx, 'model', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-600">Motor HP / kW</label>
                        <input
                          className="w-full rounded border p-2 text-xs"
                          placeholder="e.g. 5 HP"
                          value={item.hp || ''}
                          onChange={(e) => updateEditQuotationItem(idx, 'hp', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-600">Pump Head (m)</label>
                        <input
                          className="w-full rounded border p-2 text-xs"
                          placeholder="e.g. 24 m"
                          value={item.head || ''}
                          onChange={(e) => updateEditQuotationItem(idx, 'head', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-600">Flow Rate</label>
                        <input
                          className="w-full rounded border p-2 text-xs"
                          placeholder="e.g. 15 m3/hr"
                          value={item.flow || ''}
                          onChange={(e) => updateEditQuotationItem(idx, 'flow', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-600">SUC x DEL Size</label>
                        <input
                          className="w-full rounded border p-2 text-xs"
                          placeholder="e.g. 65 x 50 mm"
                          value={item.size || ''}
                          onChange={(e) => updateEditQuotationItem(idx, 'size', e.target.value)}
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
                          onChange={(e) => updateEditQuotationItem(idx, 'model', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-600">Delivery Size</label>
                        <input
                          className="w-full rounded border p-2 text-xs"
                          placeholder="Size"
                          value={item.size || ''}
                          onChange={(e) => updateEditQuotationItem(idx, 'size', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-600">Pump Head</label>
                        <input
                          className="w-full rounded border p-2 text-xs"
                          placeholder="Head"
                          value={item.head || ''}
                          onChange={(e) => updateEditQuotationItem(idx, 'head', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-600">Discharge / Flow</label>
                        <input
                          className="w-full rounded border p-2 text-xs"
                          placeholder="Flow"
                          value={item.flow || ''}
                          onChange={(e) => updateEditQuotationItem(idx, 'flow', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-600">Material (MOC)</label>
                        <input
                          className="w-full rounded border p-2 text-xs"
                          placeholder="MOC"
                          value={item.hp || ''}
                          onChange={(e) => updateEditQuotationItem(idx, 'hp', e.target.value)}
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
                          onChange={(e) => updateEditQuotationItem(idx, 'model', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-600">KVA Rating</label>
                        <input
                          className="w-full rounded border p-2 text-xs"
                          placeholder="KVA"
                          value={item.hp || ''}
                          onChange={(e) => updateEditQuotationItem(idx, 'hp', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-600">Phase / Voltage</label>
                        <input
                          className="w-full rounded border p-2 text-xs"
                          placeholder="Phase"
                          value={item.size || ''}
                          onChange={(e) => updateEditQuotationItem(idx, 'size', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-600">Fuel / Cooling</label>
                        <input
                          className="w-full rounded border p-2 text-xs"
                          placeholder="Cooling"
                          value={item.head || ''}
                          onChange={(e) => updateEditQuotationItem(idx, 'head', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-600">Frequency</label>
                        <input
                          className="w-full rounded border p-2 text-xs"
                          placeholder="Frequency"
                          value={item.flow || ''}
                          onChange={(e) => updateEditQuotationItem(idx, 'flow', e.target.value)}
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
                      onChange={(e) => updateEditQuotationItem(idx, 'description', e.target.value)}
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
                      onChange={(e) => updateEditQuotationItem(idx, 'qty', e.target.value === '' ? '' : Number(e.target.value))}
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
                      onChange={(e) => updateEditQuotationItem(idx, 'rate', e.target.value === '' ? '' : Number(e.target.value))}
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
                      onChange={(e) => updateEditQuotationItem(idx, 'discounted_price', e.target.value === '' ? '' : Number(e.target.value))}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700">GST %</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full rounded border p-2 text-xs bg-white"
                      value={item.gst_pct}
                      onChange={(e) => updateEditQuotationItem(idx, 'gst_pct', Number(e.target.value))}
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
        <CommercialTermsEditor
          values={editingQuotation}
          onChange={(field, val) => setEditingQuotation((prev) => ({ ...prev, [field]: val }))}
          isDigiset={editingQuotation.category === 'DIGISET'}
        />
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
                panel_type: editingQuotation.panel_type,
                delivery_terms: editingQuotation.delivery_terms,
                payment_terms: editingQuotation.payment_terms,
                freight_terms: editingQuotation.freight_terms,
                taxes_terms: editingQuotation.taxes_terms,
                validity_terms: editingQuotation.validity_terms,
                warranty_terms: editingQuotation.warranty_terms,
                insurance_terms: editingQuotation.insurance_terms,
                loading_terms: editingQuotation.loading_terms,
                installation_terms: editingQuotation.installation_terms,
                permission_terms: editingQuotation.permission_terms,
                statutory_terms: editingQuotation.statutory_terms,
                force_majeure_terms: editingQuotation.force_majeure_terms,
                arbitration_terms: editingQuotation.arbitration_terms,
                cancellation_terms: editingQuotation.cancellation_terms,
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
