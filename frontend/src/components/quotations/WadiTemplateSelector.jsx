import React from 'react';
import { WADI_TEMPLATES } from '../../constants/wadiTemplates';
import { CheckCircle2, ShieldCheck, FileText, Flame, Layers, AlertTriangle } from 'lucide-react';

export default function WadiTemplateSelector({
  selectedTemplateId = 'wadi_split_case',
  onSelectTemplate,
  values = {},
  onChangeField
}) {
  const currentTemplate = WADI_TEMPLATES.find((t) => t.id === selectedTemplateId) || WADI_TEMPLATES[0];

  const handleSelect = (tmpl) => {
    if (onSelectTemplate) {
      onSelectTemplate(tmpl.id, {
        template_type: tmpl.id,
        subject: tmpl.defaultSubject,
        sales_person_name: tmpl.defaultSalesPerson,
        sales_person_phone: tmpl.defaultPhone,
        material_construction: tmpl.defaultMoc || '',
        scope_of_supply: tmpl.defaultScopeOfSupply || '',
        installation_note: tmpl.defaultInstallationNote || '',
        delivery_terms: tmpl.defaultDeliveryTerms || values.delivery_terms,
        payment_terms: tmpl.defaultPaymentTerms || values.payment_terms,
        availability_terms: tmpl.defaultAvailabilityTerms || values.availability_terms,
        warranty_terms: tmpl.defaultWarrantyTerms || values.warranty_terms,
        installation_terms: tmpl.defaultInstallationTerms || values.installation_terms,
        taxes_terms: tmpl.defaultTaxesTerms || values.taxes_terms,
        validity_terms: tmpl.defaultValidityTerms || values.validity_terms
      });
    }
  };

  const getTemplateIcon = (id) => {
    switch (id) {
      case 'wadi_split_case':
        return Layers;
      case 'wadi_fire_fighting':
      case 'wadi_fire_fighting_moc':
        return Flame;
      case 'wadi_end_suction':
      default:
        return FileText;
    }
  };

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200/60 pb-3">
        <div>
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-600 text-white text-xs font-bold">
              4
            </span>
            <span>Select WADI Quotation Template (4 Official Formats)</span>
          </h4>
          <p className="text-xs text-slate-600 mt-0.5">
            Choose the official Kirloskar WADI format for this quotation. The table layout, duty units, MOC, and terms will adapt automatically:
          </p>
        </div>
        <span className="rounded-full bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
          Selected: {currentTemplate.name}
        </span>
      </div>

      {/* 4 Template Cards Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {WADI_TEMPLATES.map((tmpl) => {
          const isSelected = selectedTemplateId === tmpl.id;
          const Icon = getTemplateIcon(tmpl.id);

          return (
            <div
              key={tmpl.id}
              onClick={() => handleSelect(tmpl)}
              className={`cursor-pointer rounded-xl border p-3.5 transition-all duration-200 relative flex flex-col justify-between ${
                isSelected
                  ? 'border-emerald-600 bg-white shadow-md ring-2 ring-emerald-500/25'
                  : 'border-slate-200 bg-white/80 hover:border-emerald-300 hover:bg-white'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-1.5">
                  <span
                    className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${tmpl.badgeColor}`}
                  >
                    {tmpl.badge}
                  </span>
                  {isSelected ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border border-slate-300 shrink-0" />
                  )}
                </div>

                <div className="mt-2.5 flex items-center gap-2">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                      isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <h5 className="text-xs font-bold text-slate-900 leading-snug">
                    Template {tmpl.number}
                  </h5>
                </div>

                <p className="mt-1 text-xs font-semibold text-slate-800">{tmpl.name.replace(/WADI \d - /, '')}</p>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">{tmpl.subTitle}</p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="font-semibold text-slate-600">Flow Unit: <b>{tmpl.flowUnit}</b></span>
                <span
                  className={`font-bold ${
                    isSelected ? 'text-emerald-700' : 'text-slate-400 group-hover:text-slate-700'
                  }`}
                >
                  {isSelected ? 'Active ✓' : 'Select'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dynamic Template Details & Additional Fields (MOC, Scope, Note) */}
      <div className="rounded-lg border border-slate-200 bg-white p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Template Specifications &amp; Pre-filled Terms
          </span>
          <span className="text-[11px] text-slate-500 font-medium">
            Sign-off: <b>{values.sales_person_name || currentTemplate.defaultSalesPerson}</b> ({values.sales_person_phone || currentTemplate.defaultPhone})
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {/* MOC (Material of Construction) if template has it */}
          {currentTemplate.hasMoc && (
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span>Material of Construction (MOC):</span>
              </label>
              <textarea
                rows={2}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 p-2 text-xs font-medium focus:border-emerald-500 focus:bg-white focus:outline-none"
                value={values.material_construction !== undefined ? values.material_construction : currentTemplate.defaultMoc}
                onChange={(e) => onChangeField && onChangeField('material_construction', e.target.value)}
                placeholder="Enter MOC details..."
              />
            </div>
          )}

          {/* Scope of Supply for Template 2 */}
          {currentTemplate.hasScope && (
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span>Scope of Supply:</span>
              </label>
              <textarea
                rows={2}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 p-2 text-xs font-medium focus:border-emerald-500 focus:bg-white focus:outline-none"
                value={values.scope_of_supply !== undefined ? values.scope_of_supply : currentTemplate.defaultScopeOfSupply}
                onChange={(e) => onChangeField && onChangeField('scope_of_supply', e.target.value)}
                placeholder="Enter Scope of supply..."
              />
            </div>
          )}

          {/* Yellow Scope Note for Template 3 and Template 4 */}
          {currentTemplate.hasNote && (
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                <span>Installation Note (Yellow Banner in PDF):</span>
              </label>
              <input
                className="w-full rounded-lg border border-amber-300 bg-amber-50/50 p-2 text-xs font-bold text-amber-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                value={values.installation_note !== undefined ? values.installation_note : currentTemplate.defaultInstallationNote}
                onChange={(e) => onChangeField && onChangeField('installation_note', e.target.value)}
                placeholder="Note – Installation is not in our scope..."
              />
            </div>
          )}

          {/* Signatory Contact */}
          <div>
            <label className="text-xs font-semibold text-slate-700">Yours truly (Signatory Person)</label>
            <input
              className="w-full rounded-lg border border-slate-200 p-2 text-xs font-medium focus:border-emerald-500 focus:outline-none"
              value={values.sales_person_name !== undefined ? values.sales_person_name : currentTemplate.defaultSalesPerson}
              onChange={(e) => onChangeField && onChangeField('sales_person_name', e.target.value)}
              placeholder="e.g. Puneet Choudhary"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700">Contact Number</label>
            <input
              className="w-full rounded-lg border border-slate-200 p-2 text-xs font-medium focus:border-emerald-500 focus:outline-none"
              value={values.sales_person_phone !== undefined ? values.sales_person_phone : currentTemplate.defaultPhone}
              onChange={(e) => onChangeField && onChangeField('sales_person_phone', e.target.value)}
              placeholder="e.g. 91790-76660"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
