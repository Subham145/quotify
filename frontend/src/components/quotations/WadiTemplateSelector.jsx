import React from 'react';
import { WADI_TEMPLATES } from '../../constants/wadiTemplates';
import { AlertTriangle } from 'lucide-react';

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

  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-2.5 space-y-2 shadow-2xs">
      {/* Compact Dropdown Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="flex h-5 w-5 items-center justify-center rounded bg-emerald-600 text-white text-[10px] font-bold">
            W
          </span>
          <label className="text-xs font-bold text-slate-800">
            WADI Template:
          </label>
        </div>

        <div className="flex flex-1 items-center gap-2">
          <select
            className="w-full rounded-md border border-emerald-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-800 shadow-2xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            value={selectedTemplateId}
            onChange={(e) => {
              const tmpl = WADI_TEMPLATES.find((t) => t.id === e.target.value);
              if (tmpl) handleSelect(tmpl);
            }}
          >
            {WADI_TEMPLATES.map((tmpl) => (
              <option key={tmpl.id} value={tmpl.id}>
                Template {tmpl.number}: {tmpl.name.replace(/WADI \d - /, '')} ({tmpl.badge})
              </option>
            ))}
          </select>

          <span className={`shrink-0 rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wider border ${currentTemplate.badgeColor}`}>
            {currentTemplate.badge}
          </span>
        </div>
      </div>

      {/* 1-Line Info Snippet */}
      <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-600 bg-white/70 rounded px-2 py-1 border border-emerald-100">
        <span className="truncate mr-2">
          <span className="font-bold text-slate-800">{currentTemplate.subTitle}</span>
          <span className="text-slate-500 hidden sm:inline"> — {currentTemplate.description}</span>
        </span>
        <span className="shrink-0 text-emerald-800 font-bold bg-emerald-100/80 px-1.5 py-0.2 rounded text-[10px]">
          Flow: {currentTemplate.flowUnit}
        </span>
      </div>

      {/* Compact Conditional Fields (Only shown if current template needs MOC, Scope, or Note) */}
      {(currentTemplate.hasMoc || currentTemplate.hasScope || currentTemplate.hasNote) && (
        <div className="pt-1.5 border-t border-emerald-200/50 grid gap-2 sm:grid-cols-2">
          {/* MOC (Material of Construction) */}
          {currentTemplate.hasMoc && (
            <div className={currentTemplate.hasScope ? 'sm:col-span-1' : 'sm:col-span-2'}>
              <label className="text-[10px] font-bold text-slate-600 block mb-0.5 uppercase">
                Material of Construction (MOC):
              </label>
              <input
                type="text"
                className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-800 focus:border-emerald-500 focus:outline-none"
                value={values.material_construction !== undefined ? values.material_construction : currentTemplate.defaultMoc}
                onChange={(e) => onChangeField && onChangeField('material_construction', e.target.value)}
                placeholder="Enter MOC details..."
              />
            </div>
          )}

          {/* Scope of Supply */}
          {currentTemplate.hasScope && (
            <div className={currentTemplate.hasMoc ? 'sm:col-span-1' : 'sm:col-span-2'}>
              <label className="text-[10px] font-bold text-slate-600 block mb-0.5 uppercase">
                Scope of Supply:
              </label>
              <input
                type="text"
                className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-800 focus:border-emerald-500 focus:outline-none"
                value={values.scope_of_supply !== undefined ? values.scope_of_supply : currentTemplate.defaultScopeOfSupply}
                onChange={(e) => onChangeField && onChangeField('scope_of_supply', e.target.value)}
                placeholder="Enter Scope of supply..."
              />
            </div>
          )}

          {/* Yellow Scope Note */}
          {currentTemplate.hasNote && (
            <div className="sm:col-span-2">
              <label className="text-[10px] font-bold text-amber-800 flex items-center gap-1 mb-0.5 uppercase">
                <AlertTriangle className="h-3 w-3 text-amber-600" />
                <span>Installation Note (Yellow Highlight Banner in PDF):</span>
              </label>
              <input
                type="text"
                className="w-full rounded border border-amber-300 bg-amber-50/70 px-2 py-1 text-xs font-bold text-amber-900 focus:border-amber-500 focus:outline-none"
                value={values.installation_note !== undefined ? values.installation_note : currentTemplate.defaultInstallationNote}
                onChange={(e) => onChangeField && onChangeField('installation_note', e.target.value)}
                placeholder="Note – Installation is not in our scope..."
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
