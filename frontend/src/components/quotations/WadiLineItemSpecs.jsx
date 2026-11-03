import React from 'react';
import { Layers, Zap, Disc, Info, Droplets, Sparkles, CheckCircle2 } from 'lucide-react';

export const PUMP_TYPES = [
  'Horizontal Split Casing',
  'End Suction',
  'Multistage Centrifugal',
  'Monobloc',
  'Submersible',
  'Vertical Inline',
  'Vertical Turbine',
  'Fire Fighting Pump Set',
  'Solid Handling Pump',
  'Sump Pump',
  'Other'
];

export const MOC_CASING_OPTIONS = [
  'CI',
  'SGI',
  'CF8',
  'CF8M / SS316',
  'Bronze',
  'WCB',
  'Cast Steel'
];

export const MOC_IMPELLER_OPTIONS = [
  'CI',
  'Bronze',
  'CF8',
  'CF8M / SS316',
  'SGI',
  'Gunmetal'
];

export const MOC_SHAFT_OPTIONS = [
  '40C8',
  'CS 45C8',
  'SS410',
  'SS304',
  'SS316',
  'EN8'
];

export const SEAL_TYPES = ['Single', 'Double', 'Cartridge', 'Component'];
export const SEAL_MATERIALS = ['SiC / SiC', 'Carbon / SiC', 'TC / TC', 'Carbon / Ceramic', 'SiC / TC'];
export const SEAL_MAKES = ['As Per Standard', 'Burgmann', 'Eagle', 'Flex-A-Seal', 'Other'];
export const GLAND_PACKING_MATERIALS = [
  'Standard PTFE / Graphited Cotton',
  'Pure Flexible Graphite',
  'Non-Asbestos PTFE Yarn',
  'Braided Carbon Yarn'
];

export const PIPE_SIZES = ['350', '300', '250', '200', '150', '125', '100', '80', '65', '50', '40', '32', '25'];

export function generateWadiDescription(cf = {}, fallbackModel = '') {
  const parts = [];
  const pumpType = cf.pump_type || 'Horizontal Split Casing';
  const model = cf.pump_model || fallbackModel || '';
  const head = cf.head_m || '';
  const flowM3 = cf.flow_m3_hr || '';
  const flowLps = cf.flow_lps || '';
  const casing = cf.casing_moc || 'CI';
  const impeller = cf.impeller_moc || 'CI';
  const shaft = cf.shaft_moc || '40C8';
  const motorMake = (cf.motor_make || '').trim();
  const kw = cf.motor_kw || '';
  const hp = cf.motor_hp || '';
  const rpm = cf.motor_rpm || '';
  const eff = cf.motor_efficiency || '';
  const sealing = cf.sealing_arrangement || 'Mechanical Seal';
  const sealType = cf.seal_type || 'Single';
  const sealMat = cf.seal_material || '';
  const glandMat = cf.gland_packing_material || '';

  let title = pumpType.toLowerCase().includes('pump') ? pumpType : `${pumpType} Pump`;
  if (model) {
    title += ` – ${model}`;
  }
  parts.push(title);

  if (head) parts.push(`Head ${head} m`);
  if (flowM3) {
    parts.push(`Flow ${flowM3} m³/hr${flowLps ? ` (${flowLps} LPS)` : ''}`);
  } else if (flowLps) {
    parts.push(`Flow ${flowLps} LPS`);
  }

  if (casing && impeller && casing === impeller) {
    parts.push(`${casing} Casing & Impeller`);
  } else if (casing || impeller) {
    parts.push(`${casing || ''} Casing, ${impeller || ''} Impeller`);
  }

  if (shaft) parts.push(`${shaft} Shaft`);

  // Motor specs - only include motorMake if explicitly provided by user
  let motorStr = '';
  if (kw && hp) {
    motorStr = `${motorMake ? `${motorMake} ` : ''}${kw} kW (${hp} HP)`;
  } else if (kw) {
    motorStr = `${motorMake ? `${motorMake} ` : ''}${kw} kW`;
  } else if (hp) {
    motorStr = `${motorMake ? `${motorMake} ` : ''}${hp} HP`;
  } else if (motorMake) {
    motorStr = `${motorMake} Motor`;
  }
  if (motorStr) parts.push(motorStr);

  if (rpm) parts.push(`${rpm} RPM`);
  if (eff) parts.push(`Eff. ${eff}%`);

  if (sealing === 'Mechanical Seal') {
    const sealDetails = [sealType !== 'Single' ? sealType : '', sealMat && sealMat !== 'SiC / SiC' ? sealMat : ''].filter(Boolean).join(' ');
    parts.push(sealDetails ? `Mechanical Seal (${sealDetails})` : 'Mechanical Seal');
  } else if (sealing === 'Gland Packed') {
    parts.push(glandMat && glandMat !== 'Standard PTFE / Graphited Cotton' ? `Gland Packed (${glandMat})` : 'Gland Packed');
  }

  return parts.filter(Boolean).join(', ') + '.';
}

/**
 * WadiLineItemSpecs Component
 * 1. Pump Details
 * 2. Material of Construction (MOC)
 * 3. Motor Specifications (Open editable input, no forced KPL dropdown)
 * 4. Sealing Arrangement (Interactive tactile buttons for Mechanical Seal vs Gland Packed, fully editable seal & packing details)
 */
export default function WadiLineItemSpecs({
  item = {},
  idx = 0,
  onUpdateField,
  onUpdateCustomField,
  onBatchUpdate
}) {
  const cf = item.custom_fields || {};

  // Field values with clean defaults
  const pumpType = cf.pump_type || 'Horizontal Split Casing';
  const pumpModel = cf.pump_model ?? (item.model || 'UP 250/38');
  const headM = cf.head_m ?? (item.head ? String(item.head).replace(/[^0-9.]/g, '') : '45');
  const flowM3 = cf.flow_m3_hr ?? (item.flow ? String(item.flow).split(/[\s(]/)[0].replace(/[^0-9.]/g, '') : '150');
  const flowLps = cf.flow_lps ?? (flowM3 ? (Number(flowM3) / 3.6).toFixed(2) : '41.67');
  const suctionSize = cf.suction_size || '250';
  const deliverySize = cf.delivery_size || '200';
  const pumpOrientation = cf.pump_orientation || 'Horizontal';

  const casingMoc = cf.casing_moc || 'CI';
  const impellerMoc = cf.impeller_moc || 'CI';
  const shaftMoc = cf.shaft_moc || '40C8';
  const wettedParts = cf.wetted_parts || 'As Per Standard';
  const construction = cf.construction || 'Split Casing';
  const installationType = cf.installation_type || 'Horizontal';

  // Motor: Open text input, no forced default of 'KPL'
  const motorMake = cf.motor_make !== undefined ? cf.motor_make : '';
  const motorKw = cf.motor_kw || '30.00';
  const motorHp = cf.motor_hp || (motorKw ? (Number(motorKw) * 1.341).toFixed(2) : '40.00');
  const motorRpm = cf.motor_rpm || '1450';
  const motorEff = cf.motor_efficiency || '92.0';
  const motorPhase = cf.motor_phase || '3 Phase';
  const motorVoltage = cf.motor_voltage || '415';
  const motorFreq = cf.motor_frequency || '50';

  // Sealing Arrangement
  const sealingArrangement = cf.sealing_arrangement || 'Mechanical Seal';
  const sealType = cf.seal_type || 'Single';
  const sealMaterial = cf.seal_material || 'SiC / SiC';
  const sealMake = cf.seal_make || 'As Per Standard';
  const glandPackingMat = cf.gland_packing_material || 'Standard PTFE / Graphited Cotton';
  const glandLanternRing = cf.gland_lantern_ring || 'SS304';

  // Robust handler that works with onBatchUpdate, onUpdateCustomField, or onUpdateField
  const handleCfChange = (key, val, extraCfUpdates = {}) => {
    const updatedCf = {
      ...cf,
      [key]: val,
      ...extraCfUpdates
    };

    // Keep top-level item attributes in sync
    const topLevelUpdates = {};
    if (key === 'pump_model') topLevelUpdates.model = val;
    if (key === 'head_m') topLevelUpdates.head = `${val} m`;
    if (key === 'flow_m3_hr') topLevelUpdates.flow = `${val} m³/hr (${updatedCf.flow_lps || ''} LPS)`;
    if (key === 'suction_size' || key === 'delivery_size') {
      topLevelUpdates.size = `${updatedCf.suction_size || suctionSize}x${updatedCf.delivery_size || deliverySize} mm`;
    }
    if (key === 'motor_kw' || key === 'motor_hp') {
      topLevelUpdates.hp = `${updatedCf.motor_kw || motorKw} kW (${updatedCf.motor_hp || motorHp} HP)`;
    }

    // Auto-refresh description if user has not heavily customized it or if empty
    const currentDesc = item.description || '';
    const shouldRegenerateDesc = !currentDesc || currentDesc.includes('Pump') || currentDesc.includes('UP ') || currentDesc.includes('DBxe') || currentDesc.length < 15;
    if (shouldRegenerateDesc) {
      topLevelUpdates.description = generateWadiDescription(updatedCf, updatedCf.pump_model || pumpModel);
    }

    // Call onBatchUpdate if available
    let batchCalled = false;
    if (typeof onBatchUpdate === 'function') {
      try {
        onBatchUpdate(idx, topLevelUpdates, updatedCf);
        batchCalled = true;
      } catch (err) {
        console.warn('onBatchUpdate error, falling back to field updates', err);
      }
    }

    // Fallback if onBatchUpdate not provided
    if (!batchCalled) {
      if (typeof onUpdateCustomField === 'function') {
        Object.entries({ [key]: val, ...extraCfUpdates }).forEach(([k, v]) => {
          onUpdateCustomField(idx, k, v);
        });
      }
      if (typeof onUpdateField === 'function') {
        Object.entries(topLevelUpdates).forEach(([k, v]) => {
          onUpdateField(idx, k, v);
        });
      }
    }
  };

  // Flow rate m3/hr -> LPS auto-calc
  const handleFlowM3Change = (val) => {
    const num = Number(val);
    const calculatedLps = (!isNaN(num) && num > 0) ? (num / 3.6).toFixed(2) : '';
    handleCfChange('flow_m3_hr', val, { flow_lps: calculatedLps });
  };

  // Flow rate LPS -> m3/hr auto-calc
  const handleFlowLpsChange = (val) => {
    const num = Number(val);
    const calculatedM3 = (!isNaN(num) && num > 0) ? (num * 3.6).toFixed(2) : '';
    handleCfChange('flow_lps', val, { flow_m3_hr: calculatedM3 });
  };

  // Motor kW -> HP auto-calc
  const handleMotorKwChange = (val) => {
    const num = Number(val);
    const calculatedHp = (!isNaN(num) && num > 0) ? (num * 1.341).toFixed(2) : '';
    handleCfChange('motor_kw', val, { motor_hp: calculatedHp });
  };

  // Motor HP -> kW auto-calc
  const handleMotorHpChange = (val) => {
    const num = Number(val);
    const calculatedKw = (!isNaN(num) && num > 0) ? (num / 1.341).toFixed(2) : '';
    handleCfChange('motor_hp', val, { motor_kw: calculatedKw });
  };

  return (
    <div className="space-y-2.5">
      {/* 1. Pump Details */}
      <div className="rounded-xl border border-sky-200/90 bg-sky-50/50 p-2.5 space-y-2 transition-all">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-sky-950">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-sky-600 text-white text-[11px]">
              🚰
            </span>
            <span>Pump Details</span>
          </div>
          <span className="text-[10px] text-sky-700 font-medium">Split Casing / End Suction Specs</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
          {/* Pump Type */}
          <div>
            <label className="block text-[10px] font-bold text-slate-700 uppercase mb-0.5">
              Pump Type <span className="text-rose-500">*</span>
            </label>
            <select
              className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              value={pumpType}
              onChange={(e) => handleCfChange('pump_type', e.target.value)}
            >
              {PUMP_TYPES.map((pt) => (
                <option key={pt} value={pt}>{pt}</option>
              ))}
            </select>
          </div>

          {/* Pump Model */}
          <div>
            <label className="block text-[10px] font-bold text-slate-700 uppercase mb-0.5">
              Pump Model <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              placeholder="e.g. UP 250/38 or DBxe 65/20"
              value={pumpModel}
              onChange={(e) => handleCfChange('pump_model', e.target.value)}
            />
          </div>

          {/* Head (M) */}
          <div>
            <label className="block text-[10px] font-bold text-slate-700 uppercase mb-0.5">
              Head (M) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              step="any"
              className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              placeholder="45"
              value={headM}
              onChange={(e) => handleCfChange('head_m', e.target.value)}
            />
          </div>

          {/* Flow Rate (m3/hr) */}
          <div>
            <label className="block text-[10px] font-bold text-slate-700 uppercase mb-0.5">
              Flow (m³/hr) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              step="any"
              className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              placeholder="150"
              value={flowM3}
              onChange={(e) => handleFlowM3Change(e.target.value)}
            />
          </div>

          {/* Flow Rate (LPS) - Auto-calculated with info icon */}
          <div>
            <label className="flex items-center gap-1 text-[10px] font-bold text-slate-700 uppercase mb-0.5">
              <span>Flow (LPS)</span>
              <span className="text-sky-600 cursor-help" title="Auto calculated from m³/hr ÷ 3.6">ⓘ</span>
            </label>
            <input
              type="number"
              step="any"
              className="w-full rounded border border-sky-300 bg-sky-50/60 px-2 py-1.5 text-xs font-bold text-sky-900 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              placeholder="41.67"
              value={flowLps}
              onChange={(e) => handleFlowLpsChange(e.target.value)}
              title="Auto-calculated (Flow m³/hr ÷ 3.6)"
            />
          </div>

          {/* Suction Size (mm) */}
          <div>
            <label className="block text-[10px] font-bold text-slate-700 uppercase mb-0.5">
              Suction Size (mm)
            </label>
            <select
              className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-800 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              value={suctionSize}
              onChange={(e) => handleCfChange('suction_size', e.target.value)}
            >
              {PIPE_SIZES.map((sz) => (
                <option key={sz} value={sz}>{sz}</option>
              ))}
            </select>
          </div>

          {/* Delivery Size (mm) */}
          <div>
            <label className="block text-[10px] font-bold text-slate-700 uppercase mb-0.5">
              Delivery Size (mm)
            </label>
            <select
              className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-800 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              value={deliverySize}
              onChange={(e) => handleCfChange('delivery_size', e.target.value)}
            >
              {PIPE_SIZES.map((sz) => (
                <option key={sz} value={sz}>{sz}</option>
              ))}
            </select>
          </div>

          {/* Pump Orientation */}
          <div>
            <label className="block text-[10px] font-bold text-slate-700 uppercase mb-0.5">
              Pump Orientation
            </label>
            <select
              className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-800 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              value={pumpOrientation}
              onChange={(e) => handleCfChange('pump_orientation', e.target.value)}
            >
              <option value="Horizontal">Horizontal</option>
              <option value="Vertical">Vertical</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Material of Construction (MOC) */}
      <div className="rounded-xl border border-emerald-200/90 bg-emerald-50/50 p-2.5 space-y-2 transition-all">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-950">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-600 text-white text-[11px]">
              🥞
            </span>
            <span>Material of Construction (MOC)</span>
          </div>
          <span className="text-[10px] text-emerald-700 font-medium">Standard Metallurgy</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {/* Casing MOC */}
          <div>
            <label className="block text-[10px] font-bold text-slate-700 uppercase mb-0.5">
              Casing (MOC) <span className="text-rose-500">*</span>
            </label>
            <select
              className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              value={casingMoc}
              onChange={(e) => handleCfChange('casing_moc', e.target.value)}
            >
              {MOC_CASING_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Impeller MOC */}
          <div>
            <label className="block text-[10px] font-bold text-slate-700 uppercase mb-0.5">
              Impeller (MOC) <span className="text-rose-500">*</span>
            </label>
            <select
              className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              value={impellerMoc}
              onChange={(e) => handleCfChange('impeller_moc', e.target.value)}
            >
              {MOC_IMPELLER_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Shaft MOC */}
          <div>
            <label className="block text-[10px] font-bold text-slate-700 uppercase mb-0.5">
              Shaft (MOC) <span className="text-rose-500">*</span>
            </label>
            <select
              className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              value={shaftMoc}
              onChange={(e) => handleCfChange('shaft_moc', e.target.value)}
            >
              {MOC_SHAFT_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Other Wetted Parts */}
          <div>
            <label className="block text-[10px] font-bold text-slate-700 uppercase mb-0.5">
              Other Wetted Parts
            </label>
            <input
              type="text"
              className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-800 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              placeholder="As Per Standard"
              value={wettedParts}
              onChange={(e) => handleCfChange('wetted_parts', e.target.value)}
            />
          </div>

          {/* Construction */}
          <div>
            <label className="block text-[10px] font-bold text-slate-700 uppercase mb-0.5">
              Construction
            </label>
            <select
              className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-800 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              value={construction}
              onChange={(e) => handleCfChange('construction', e.target.value)}
            >
              <option value="Split Casing">Split Casing</option>
              <option value="End Suction">End Suction</option>
              <option value="Monobloc">Monobloc</option>
              <option value="Multistage">Multistage</option>
            </select>
          </div>

          {/* Installation Type */}
          <div>
            <label className="block text-[10px] font-bold text-slate-700 uppercase mb-0.5">
              Installation Type
            </label>
            <select
              className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-800 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              value={installationType}
              onChange={(e) => handleCfChange('installation_type', e.target.value)}
            >
              <option value="Horizontal">Horizontal</option>
              <option value="Vertical">Vertical</option>
              <option value="Submerged">Submerged</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Motor Specifications - Motor make is now an editable open text input, no forced KPL dropdown */}
      <div className="rounded-xl border border-indigo-200/90 bg-indigo-50/50 p-2.5 space-y-2 transition-all">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-indigo-600 text-white text-[11px]">
              ⚡
            </span>
            <span>Motor Specifications</span>
          </div>
          <span className="text-[10px] text-indigo-700 font-medium">Electric Drive & Ratings</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
          {/* Motor Make / Brand - Open editable text input, no forced KPL dropdown */}
          <div>
            <label className="block text-[10px] font-bold text-slate-700 uppercase mb-0.5">
              Motor Make / Brand
            </label>
            <input
              type="text"
              className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              placeholder="e.g. KBL, ABB, Siemens, etc."
              value={motorMake}
              onChange={(e) => handleCfChange('motor_make', e.target.value)}
            />
          </div>

          {/* Motor Rating kW */}
          <div>
            <label className="block text-[10px] font-bold text-slate-700 uppercase mb-0.5">
              Motor Rating (kW) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              step="any"
              className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              placeholder="30.00"
              value={motorKw}
              onChange={(e) => handleMotorKwChange(e.target.value)}
            />
          </div>

          {/* Motor Rating HP */}
          <div>
            <label className="flex items-center gap-1 text-[10px] font-bold text-slate-700 uppercase mb-0.5">
              <span>Motor Rating (HP)</span>
              <span className="text-indigo-600 cursor-help" title="Auto calculated from kW × 1.341">ⓘ</span>
            </label>
            <input
              type="number"
              step="any"
              className="w-full rounded border border-indigo-300 bg-indigo-50/60 px-2 py-1.5 text-xs font-bold text-indigo-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              placeholder="40.00"
              value={motorHp}
              onChange={(e) => handleMotorHpChange(e.target.value)}
            />
          </div>

          {/* Motor RPM */}
          <div>
            <label className="block text-[10px] font-bold text-slate-700 uppercase mb-0.5">
              Motor RPM <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              placeholder="1450"
              value={motorRpm}
              onChange={(e) => handleCfChange('motor_rpm', e.target.value)}
            />
          </div>

          {/* Motor Efficiency */}
          <div>
            <label className="block text-[10px] font-bold text-slate-700 uppercase mb-0.5">
              Motor Efficiency (%) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              step="any"
              className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              placeholder="92.0"
              value={motorEff}
              onChange={(e) => handleCfChange('motor_efficiency', e.target.value)}
            />
          </div>

          {/* Phase */}
          <div>
            <label className="block text-[10px] font-bold text-slate-700 uppercase mb-0.5">
              Phase
            </label>
            <select
              className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              value={motorPhase}
              onChange={(e) => handleCfChange('motor_phase', e.target.value)}
            >
              <option value="3 Phase">3 Phase</option>
              <option value="1 Phase">1 Phase</option>
            </select>
          </div>

          {/* Voltage */}
          <div>
            <label className="block text-[10px] font-bold text-slate-700 uppercase mb-0.5">
              Voltage (V)
            </label>
            <input
              type="number"
              className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              placeholder="415"
              value={motorVoltage}
              onChange={(e) => handleCfChange('motor_voltage', e.target.value)}
            />
          </div>

          {/* Frequency */}
          <div>
            <label className="block text-[10px] font-bold text-slate-700 uppercase mb-0.5">
              Frequency (Hz)
            </label>
            <input
              type="number"
              className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              placeholder="50"
              value={motorFreq}
              onChange={(e) => handleCfChange('motor_frequency', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* 4. Sealing Arrangement - Highly tactile, 100% clickable segmented buttons & full details */}
      <div className="rounded-xl border border-purple-200/90 bg-purple-50/50 p-2.5 space-y-2 transition-all">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-purple-950">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-purple-600 text-white text-[11px]">
              🎯
            </span>
            <span>Sealing Arrangement</span>
          </div>
          <span className="text-[10px] text-purple-700 font-medium">Click option below to toggle</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center gap-3">
          {/* Tactile Toggle Buttons - 100% clickable anywhere on the card */}
          <div className="flex items-center gap-2 bg-white/90 border border-purple-200 rounded-xl p-1.5 shrink-0 shadow-xs">
            <button
              type="button"
              onClick={() => handleCfChange('sealing_arrangement', 'Mechanical Seal')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                sealingArrangement === 'Mechanical Seal'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-transparent text-slate-700 hover:bg-purple-50'
              }`}
            >
              <span className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                sealingArrangement === 'Mechanical Seal' ? 'border-white bg-purple-600' : 'border-slate-400 bg-white'
              }`}>
                {sealingArrangement === 'Mechanical Seal' && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
              </span>
              <span>Mechanical Seal</span>
            </button>

            <button
              type="button"
              onClick={() => handleCfChange('sealing_arrangement', 'Gland Packed')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                sealingArrangement === 'Gland Packed'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-transparent text-slate-700 hover:bg-purple-50'
              }`}
            >
              <span className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                sealingArrangement === 'Gland Packed' ? 'border-white bg-purple-600' : 'border-slate-400 bg-white'
              }`}>
                {sealingArrangement === 'Gland Packed' && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
              </span>
              <span>Gland Packed</span>
            </button>
          </div>

          {/* Conditional Details Box */}
          {sealingArrangement === 'Mechanical Seal' ? (
            <div className="flex-1 rounded-xl border border-purple-200 bg-white p-2.5 space-y-1.5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="rounded-md bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-900 border border-purple-200 uppercase tracking-wide">
                  Mechanical Seal Details
                </span>
                <span className="text-[10px] text-slate-500">Cartridge / Single Face Metallurgy</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-0.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                    Seal Type
                  </label>
                  <select
                    className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 cursor-pointer"
                    value={sealType}
                    onChange={(e) => handleCfChange('seal_type', e.target.value)}
                  >
                    {SEAL_TYPES.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                    Seal Material
                  </label>
                  <select
                    className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 cursor-pointer"
                    value={sealMaterial}
                    onChange={(e) => handleCfChange('seal_material', e.target.value)}
                  >
                    {SEAL_MATERIALS.map((sm) => (
                      <option key={sm} value={sm}>{sm}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                    Seal Make
                  </label>
                  <select
                    className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 cursor-pointer"
                    value={sealMake}
                    onChange={(e) => handleCfChange('seal_make', e.target.value)}
                  >
                    {SEAL_MAKES.map((mk) => (
                      <option key={mk} value={mk}>{mk}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 rounded-xl border border-purple-200 bg-white p-2.5 space-y-1.5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="rounded-md bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-900 border border-purple-200 uppercase tracking-wide">
                  Gland Packing Details
                </span>
                <span className="text-[10px] text-slate-500">Stuffing Box &amp; Packing Spec</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                    Packing Material
                  </label>
                  <select
                    className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 cursor-pointer"
                    value={glandPackingMat}
                    onChange={(e) => handleCfChange('gland_packing_material', e.target.value)}
                  >
                    {GLAND_PACKING_MATERIALS.map((gm) => (
                      <option key={gm} value={gm}>{gm}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                    Lantern Ring Material
                  </label>
                  <select
                    className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 cursor-pointer"
                    value={glandLanternRing}
                    onChange={(e) => handleCfChange('gland_lantern_ring', e.target.value)}
                  >
                    <option value="SS304">SS304</option>
                    <option value="Bronze">Bronze</option>
                    <option value="Cast Iron">Cast Iron</option>
                    <option value="As Per Standard">As Per Standard</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
