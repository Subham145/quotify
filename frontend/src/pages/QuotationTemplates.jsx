import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '../components/shared/PageHeader';
import { api, getApiUrl } from '../api/http';
import { FileText, Eye, CheckCircle2, ExternalLink, Layers, ShieldCheck, Building2, Zap, RefreshCw } from 'lucide-react';

export default function QuotationTemplates() {
  const [selectedCategory, setSelectedCategory] = useState('DIGISET');
  const [panelType, setPanelType] = useState('Both (Standard / Automatic)');
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['quotation-templates'],
    queryFn: () => api('/templates'),
  });

  const categories = [
    {
      id: 'DIGISET',
      name: 'DIGISET (Greaves Power)',
      badge: '13 Pages Format',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
      brand: 'Greaves Cotton / Pareek Power',
      icon: Zap,
      summary: 'Complete multi-page official quotation format for Silent Diesel Generator sets with deep technical specs and marketing brochures.',
      sections: [
        'Page 1: Formal Cover Letter & DG Set Division Sign-off',
        'Page 2: Itemized Quotation Price & Comprehensive Technical Specs',
        'Page 3: Commercial Terms & Conditions (Indore Jurisdiction)',
        'Page 4: Bank RTGS/NEFT Details & 160-Yr Corporate Legacy Profile',
        'Page 5: Power Gen Business Profile & Engine Features (75 dB(A))',
        'Page 6: State-of-the-Art Acoustic Enclosures & UK Deepsea Controller',
        'Page 7: Controller Display Parameters, Warnings & Shutdown Matrix',
        'Pages 8-11: Esteemed MP Clients List (Hospitals, Industries, Hotels)',
        'Pages 12-13: Full High-Resolution Greaves Powering Progress Posters'
      ]
    },
    {
      id: 'DEWAS',
      name: 'DEWAS (Kirloskar Pumps)',
      badge: '1 Page Standard',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
      brand: 'Kirloskar Brothers Limited',
      icon: Building2,
      summary: 'Standard single-page professional pump quotation format with duty parameters, model numbers, delivery sizes, and dealer seal.',
      sections: [
        'Official Kirloskar & Pareek Power Dual Logo Header',
        'Customer & Attention Person Details Table',
        'Technical Duty Parameters: Head, Flow, HP, Suction/Delivery Size, Solid Size',
        'Itemized Rates, Discounts, GST & Grand Total with En-IN Formatting',
        'Standard 7-point Commercial & Availability Terms',
        'Authorized Signatory Sign-off'
      ]
    },
    {
      id: 'WADI',
      name: 'WADI (Kirloskar Industrial)',
      badge: '1 Page Industrial',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      brand: 'Kirloskar Industrial Division',
      icon: Layers,
      summary: 'Industrial pumping quotation format designed for heavy-duty, sewage, and high-discharge applications.',
      sections: [
        'Kirloskar Industrial Pumps Dual Branding',
        'Suction/Delivery Size & Impeller Material Specifics',
        'Commercial Terms & Advance Delivery Schedules',
        'Authorized Dealer Stamp & Bank Account Reference'
      ]
    }
  ];

  const currentCategoryInfo = categories.find((c) => c.id === selectedCategory) || categories[0];
  const previewUrl = getApiUrl(`/templates/${selectedCategory}/preview?t=${refreshKey}${selectedCategory === 'DIGISET' ? `&panel_type=${encodeURIComponent(panelType)}` : ''}`);

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Quotation Templates"
        description="View and verify active PDF quotation templates across all 3 product categories (DEWAS, WADI, DIGISET)."
      />

      {/* Category Cards Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;

          return (
            <div
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`cursor-pointer rounded-xl border p-4 transition-all duration-200 ${
                isSelected
                  ? 'border-brand-500 bg-white shadow-md ring-2 ring-brand-500/20'
                  : 'border-slate-200 bg-slate-50/70 hover:border-slate-300 hover:bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                      isSelected ? 'bg-brand-600 text-white shadow-sm' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{cat.name}</h3>
                    <p className="text-[11px] text-slate-500 font-medium">{cat.brand}</p>
                  </div>
                </div>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${cat.badgeColor}`}
                >
                  {cat.badge}
                </span>
              </div>

              <p className="mt-3 text-xs text-slate-600 line-clamp-2">{cat.summary}</p>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Template Active</span>
                </div>
                <button
                  type="button"
                  className={`font-bold transition-colors ${
                    isSelected ? 'text-brand-600' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {isSelected ? 'Viewing Live Preview ↓' : 'Click to Preview'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Preview & Details Panel */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Top Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/70 px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 text-brand-700 font-bold text-xs">
              <Eye className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-slate-900">
                  Live Template Preview: <span className="text-brand-600">{currentCategoryInfo.name}</span>
                </h4>
                <span className="rounded bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                  {currentCategoryInfo.badge}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                This exact format is generated whenever a quotation is created under {selectedCategory} category.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {selectedCategory === 'DIGISET' && (
              <div className="flex items-center rounded-lg border border-slate-200 bg-white p-1 shadow-xs">
                <span className="text-[11px] font-bold text-slate-500 px-2">Panel:</span>
                {[
                  { id: 'Standard Control Panel', label: 'Standard' },
                  { id: 'Automatic Control Panel', label: 'Automatic (AMF)' },
                  { id: 'Both (Standard / Automatic)', label: 'Both' }
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setPanelType(p.id);
                      setRefreshKey((k) => k + 1);
                    }}
                    className={`rounded-md px-2.5 py-1 text-xs font-bold transition-all ${
                      panelType === p.id
                        ? 'bg-brand-600 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => setRefreshKey((k) => k + 1)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs"
              title="Refresh Preview"
            >
              <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
              <span>Refresh</span>
            </button>

            <a
              href={previewUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 shadow-sm"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Open Full Screen / Print</span>
            </a>
          </div>
        </div>

        {/* Two-Column Layout: Sidebar Specs & Live IFRAME */}
        <div className="grid lg:grid-cols-12 min-h-[750px]">
          {/* Left Column: Template Structure & Inclusions */}
          <div className="lg:col-span-4 border-r border-slate-200 bg-slate-50/40 p-5 space-y-5">
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">Template Overview</h5>
              <p className="mt-1 text-xs text-slate-700 font-medium leading-relaxed">
                {currentCategoryInfo.summary}
              </p>
            </div>

            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Included Sections</h5>
              <div className="space-y-2">
                {currentCategoryInfo.sections.map((section, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 rounded-lg border border-slate-200/80 bg-white p-2.5 text-xs text-slate-800 shadow-2xs"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[10px] font-bold text-brand-700 border border-brand-200">
                      {idx + 1}
                    </span>
                    <span className="leading-snug">{section}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-brand-200 bg-brand-50/60 p-3.5 text-xs text-brand-900 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-brand-800">
                <ShieldCheck className="h-4 w-4 text-brand-600" />
                <span>Automatic Category Binding</span>
              </div>
              <p className="text-[11px] text-brand-700">
                When you create or edit an inquiry/quotation and choose <b>{selectedCategory}</b>, the backend PDF engine automatically renders this format.
              </p>
            </div>
          </div>

          {/* Right Column: Live IFRAME Preview */}
          <div className="lg:col-span-8 bg-slate-100 flex flex-col items-center justify-center p-4">
            <div className="w-full h-full min-h-[720px] rounded-xl border border-slate-300 bg-white shadow-md overflow-hidden flex flex-col">
              <div className="bg-slate-800 text-slate-200 px-4 py-2 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500 inline-block"></span>
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500 inline-block"></span>
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block"></span>
                  </div>
                  <span className="font-mono text-[11px] text-slate-300 ml-2">
                    Template: {selectedCategory.toLowerCase()}-format.html
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">Puppeteer A4 Ready</span>
              </div>

              <iframe
                title="Quotation Template Preview"
                src={previewUrl}
                className="w-full flex-1 border-0"
                style={{ minHeight: '680px' }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
