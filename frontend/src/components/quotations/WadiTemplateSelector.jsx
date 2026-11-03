import React from 'react';
import { WADI_TEMPLATES } from '../../constants/wadiTemplates';
import { AlertTriangle, ChevronDown } from 'lucide-react';

export default function WadiTemplateSelector({
  selectedTemplateId = 'wadi_split_case',
  onSelectTemplate,
  values = {},
  onChangeField
}) {
  const currentTemplate = WADI_TEMPLATES.find((t) => t.id === selectedTemplateId) || WADI_TEMPLATES[0];

  const handleSelect = (tmplId) => {
    const tmpl = WADI_TEMPLATES.find((t) => t.id === tmplId);
    if (!tmpl) return;
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
    <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2.5 shadow-xs transition-all">
      {/* Header & Dropdown Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 shrink-0">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold shrink-0">
            📑
          </span>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Quotation Template Format
            </label>
            <div className="text-xs font-extrabold text-slate-800">
              Kirloskar WADI Format
            </div>
          </div>
        </div>

        <div className="flex flex-1 sm:max-w-xl items-center gap-2">
          <div className="relative flex-1">
            <select
              className="w-full appearance-none rounded-lg border border-slate-300 bg-slate-50/60 py-2 pl-3 pr-8 text-xs font-bold text-slate-800 shadow-xs transition-colors hover:border-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
              value={selectedTemplateId}
              onChange={(e) => handleSelect(e.target.value)}
            >
              {WADI_TEMPLATES.map((tmpl) => (
                <option key={tmpl.id} value={tmpl.id}>
                  Template {tmpl.number}: {tmpl.name.replace(/WADI \d - /, '')} ({tmpl.badge})
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-bold ${currentTemplate.badgeColor}`}>
              <span>{currentTemplate.badge}</span>
            </span>
            <span className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700">
              Flow: <b className="ml-1 text-slate-900">{currentTemplate.flowUnit}</b>
            </span>
          </div>
        </div>
      </div>

      {/* Template Features & Pre-filled Defaults Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-1.5 border border-slate-100 text-[11px]">
        <div className="flex items-center gap-2 text-slate-600 truncate">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-500 shrink-0" />
          <span className="font-bold text-slate-800">{currentTemplate.subTitle}</span>
          <span className="text-slate-400 hidden md:inline">•</span>
          <span className="text-slate-500 hidden md:inline truncate">{currentTemplate.description}</span>
        </div>
        <div className="text-[11px] text-slate-500 shrink-0">
          Signatory: <b className="text-slate-700">{values.sales_person_name || currentTemplate.defaultSalesPerson}</b>
        </div>
      </div>

      {/* Conditional Template Specific Fields (MOC, Scope of Supply, Installation Note) */}
      {(currentTemplate.hasMoc || currentTemplate.hasScope || currentTemplate.hasNote) && (
        <div className="grid gap-2.5 sm:grid-cols-2 pt-1 border-t border-slate-100">
          {/* MOC */}
          {currentTemplate.hasMoc && (
            <div className={currentTemplate.hasScope ? 'sm:col-span-1' : 'sm:col-span-2'}>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Material of Construction (MOC Header)
              </label>
              <input
                type="text"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-xs focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                value={values.material_construction !== undefined ? values.material_construction : currentTemplate.defaultMoc}
                onChange={(e) => onChangeField && onChangeField('material_construction', e.target.value)}
                placeholder="e.g. UP Pump (01 MOC) – CI–Casing / CI-Impeller / Shaft – 40C8 With Gland Packed"
              />
            </div>
          )}

          {/* Scope of Supply */}
          {currentTemplate.hasScope && (
            <div className={currentTemplate.hasMoc ? 'sm:col-span-1' : 'sm:col-span-2'}>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Scope of Supply
              </label>
              <input
                type="text"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-xs focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                value={values.scope_of_supply !== undefined ? values.scope_of_supply : currentTemplate.defaultScopeOfSupply}
                onChange={(e) => onChangeField && onChangeField('scope_of_supply', e.target.value)}
                placeholder="e.g. Diesel Engine Pump Set Engine + Pump + Coupling + Base Frame"
              />
            </div>
          )}

          {/* Installation Note (Yellow Banner in PDF) */}
          {currentTemplate.hasNote && (
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1 mb-1">
                <AlertTriangle className="h-3 w-3 text-amber-600 shrink-0" />
                <span>Installation Note (Yellow Highlight Banner in PDF)</span>
              </label>
              <input
                type="text"
                className="w-full rounded-lg border border-amber-300 bg-amber-50/50 px-3 py-1.5 text-xs font-bold text-amber-900 shadow-xs focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                value={values.installation_note !== undefined ? values.installation_note : currentTemplate.defaultInstallationNote}
                onChange={(e) => onChangeField && onChangeField('installation_note', e.target.value)}
                placeholder="Note – Installation is not in our scope and accessories should be extra at actual"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
