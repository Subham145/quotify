// Official 4 Kirloskar WADI Quotation Templates Definitions
// Used across Quotations, Inquiries & Templates modules

export const WADI_TEMPLATES = [
  {
    id: 'wadi_split_case',
    number: 1,
    name: 'WADI 1 - Horizontal Split Case Pump Set',
    subTitle: 'UP Series (Flow in LPS)',
    badge: '2 Pages / LPS',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    description: 'Techno-Commercial offer for Horizontal Split Case Pump (UP Series) with Head & Flow in LPS, Material of Construction (UP Pump 01 MOC), and G S Sayan sign-off.',
    defaultSubject: 'Kirloskar make Horizontal Split Case Pump set.',
    defaultSalesPerson: 'G S Sayan',
    defaultPhone: '9893276018',
    defaultMoc: 'UP Pump (01 MOC) – CI–Casing / CI-Impeller / Shaft – 40C8 With Gland Packed',
    defaultDeliveryTerms: 'Quoted prices net and FOR our Dewas Naka Godown Delivery.',
    defaultPaymentTerms: '100% payment advance along with PO against Proforma Invoice before dispatch of Material.',
    defaultAvailabilityTerms: '10 Days after receipt of your PO.',
    defaultWarrantyTerms: '12 months from the date of commissioning whichever is earlier as a special case related to any manufacturing or quality issues under standard operation as per the warranty clause.',
    defaultTaxesTerms: '18 % GST will be charged extra as applicable on pump',
    defaultValidityTerms: 'Our will be valid for 15 days only.',
    hasMoc: true,
    hasScope: false,
    hasNote: false,
    flowUnit: 'LPS',
    tableType: 'split_case', // Columns: S.No | Head (m) | Flow LPS | Pump Model | Qty | Unit Price | Total Amount
    sampleItems: [
      {
        head: '45',
        flow_rate: '160',
        model: 'Kirloskar make Horizontal Split Case Pump Model UP 250/38 (01 MOC) Bare Shaft Pump with Gland Pack',
        qty: '01',
        rate: 188980
      },
      {
        head: '',
        flow_rate: '',
        model: 'Base Frame MS Fabricated channel size 150×75 m.m + MS Coupling Guard + Coupling RB 198 Pin Bush Type',
        qty: '01 Set',
        rate: 34320
      }
    ],
    sections: [
      'Official Kirloskar & Pareek Power Header with Red Separator Bar',
      'Customer Details, Kind Attn & Subject',
      'Split Case Duty Parameters Table (S.No, Head in m, Flow in LPS, Model, Qty, Price, Amount)',
      'Material of Constructions: UP Pump (01 MOC) – CI–Casing / CI-Impeller / Shaft – 40C8',
      '7 Official Terms & Conditions (FOR Dewas Naka Godown Delivery, 100% Advance Against PI)',
      'Closing & Sign-off by G S Sayan (9893276018)',
      'Indore Head Office Address Bar'
    ]
  },
  {
    id: 'wadi_fire_fighting',
    number: 2,
    name: 'WADI 2 - Fire Fighting Pump Set (Greaves Engine & Scope)',
    subTitle: 'Complete Engine Set & Scope of Supply',
    badge: '2 Pages / m3/hr',
    badgeColor: 'bg-red-100 text-red-800 border-red-300',
    description: 'Techno-Commercial offer for Fire Fighting Pump Set (Main Pump, Diesel Engine Pump, Jockey Pump, Fuel Tank) with Greaves Engine, Scope of Supply, Commissioning terms, and Pradeep Ghadge sign-off.',
    defaultSubject: 'Kirloskar make Fire Fighting Pump Set.',
    defaultSalesPerson: 'Pradeep Ghadge',
    defaultPhone: '82690-00495',
    defaultMoc: 'Diesel Engine Pump set – with Complete Pump set without accessories.',
    defaultScopeOfSupply: 'Diesel Engine Pump Set Engine + Pump + Coupling + Coupling Guard Fitted on Suitable MS Base Frame.',
    defaultDeliveryTerms: 'Quoted prices net and FOR Dewas Naka Indore Godown.',
    defaultPaymentTerms: '30% payment advance along with PO and balance 70% payment against PI before dispatch of material.',
    defaultAvailabilityTerms: '14-16 weeks after receipt of your PO.',
    defaultWarrantyTerms: 'We offer the warranty of 12 months from the date of Invoice or against manufacturing or quality issues under standard operation as per the warranty clause.',
    defaultInstallationTerms: 'Installation of the pump set will be in your Scope and super vision of commissioning will be done by us free of charge for 1 day only.',
    defaultTaxesTerms: '18 % GST will be charged extra as applicable on pump',
    defaultValidityTerms: 'Our will be valid for 30 days only.',
    hasMoc: true,
    hasScope: true,
    hasNote: false,
    flowUnit: 'm3/hr',
    tableType: 'fire_fighting', // Columns: Application | Flow m3/hr | Head (m) | Pump Model | Qty | Unit Price Net | Total Amount
    sampleItems: [
      {
        application: 'Main Pump',
        flow_rate: '273',
        head: '100',
        model: 'Kirloskar make End Suction Pump CPHM 125/32_2900 (43 MOC) coupled with BBL/Kirloskar Make Fire Fighting 170 HP 3000 RPM motor on coupling and coupling guard with Gland Pack',
        qty: '01',
        rate: 791280
      },
      {
        application: 'Diesel Engine Pump',
        flow_rate: '273',
        head: '100',
        model: 'Diesel Engine Fire Fighting Set comprising of Greaves make Diesel Engine (CPHM 125/32) 167 HP, 1800 RPM on base frame with coupling, Coupling guard & Gland Pack (43 MOC)',
        qty: '01',
        rate: 799680
      },
      {
        application: 'Jockey Pump',
        flow_rate: '10.8',
        head: '100',
        model: 'Kirloskar make Vertical Inline Pump KCIL 10-14 (A MOC) coupled with BBL/Kirloskar Make Fire Fighting 5.5 KW 7.5 HP 3000 RPM motor on coupling and coupling guard with Mechanical Seal',
        qty: '01',
        rate: 119880
      },
      {
        application: 'Fuel Tank & Battery',
        flow_rate: '',
        head: '',
        model: 'Fuel Tank & Battery and Battery Lead with Coolent',
        qty: '01',
        rate: 45000
      }
    ],
    sections: [
      'Official Dual Header & Reference Details (4PL/W.PUMP/...)',
      'Addressed to Customer & Attention Person',
      'Multi-Pump Application Table (Main Pump, Diesel Engine Pump, Jockey Pump, Fuel Tank)',
      'Duty Parameters: Flow (m3/hr), Head (m), Model Specs, Net Rates',
      'Material of Construction & Detailed Scope of Supply',
      'Commercial Terms with 1-Day Free Supervision of Commissioning',
      'Authorized Signatory: Pradeep Ghadge (82690-00495)'
    ]
  },
  {
    id: 'wadi_end_suction',
    number: 3,
    name: 'WADI 3 - End Suction Pump Set',
    subTitle: 'Single Page Standard (Flow in m3/h)',
    badge: '1 Page / m3/h',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
    description: 'Compact 1-Page Techno-Commercial offer for End Suction Pump with Flow in m3/h, Head in m, Installation Warning Note, 6 numbered commercial terms, and Puneet Choudhary sign-off.',
    defaultSubject: 'Kirloskar make End Suction Pump set.',
    defaultSalesPerson: 'Puneet Choudhary',
    defaultPhone: '91790-76660',
    defaultInstallationNote: 'Installation is not in our scope and accessories should be extra at actual',
    defaultAvailabilityTerms: '1 week after receipt of Your PO.',
    defaultPaymentTerms: '30% advance along with PO and balance 70% against PI before dispatch of material.',
    defaultTaxesTerms: 'GST18% extra at actual.',
    defaultValidityTerms: '18-Oct-2026.',
    defaultDeliveryTerms: 'Ex Our Godown, Dewas Naka Indore.',
    defaultFreightTerms: 'To Pay.',
    hasMoc: false,
    hasScope: false,
    hasNote: true,
    flowUnit: 'm3/h',
    tableType: 'end_suction', // Columns: S.No | Head (m) | Flow (m3/h) | Pump Model | Qty | Unit Price | Total Amount
    sampleItems: [
      {
        head: '55',
        flow_rate: '130',
        model: 'Kirloskar make End Suction Pump Model DB 65/20xe (86 MOC) coupled with BBL make 30 KW/40 HP/3000 RPM motor, (IE2 Efficiency) on Base Frame, Coupling & Coupling Guard With Mechanical Seal',
        qty: '01',
        rate: 184690
      }
    ],
    sections: [
      'Crisp Single-Page Layout Designed for Fast Industrial Quotes',
      'End Suction Table (Head, Flow m3/h, DB Series Pump Model, Qty, Rate, Total)',
      'Yellow Highlight Box: "Note – Installation is not in our scope and accessories extra"',
      '6 Numbered Commercial & Availability Terms',
      'Sign-off: Puneet Choudhary (91790-76660) & Indore Seal',
      'Bottom Red Line & Full Address Footer'
    ]
  },
  {
    id: 'wadi_fire_fighting_moc',
    number: 4,
    name: 'WADI 4 - Fire Fighting Pump Set (With MOC & Note)',
    subTitle: 'DB Series MOC + Warning Banner',
    badge: '2 Pages / MOC',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
    description: 'Techno-Commercial offer for Fire Fighting Pump Set with Material of Construction header (DB Pump 86-MOC), Scope Warning Note, and itemized Main/Diesel/Jockey pumps.',
    defaultSubject: 'Kirloskar make Fire Fighting Pump Set.',
    defaultSalesPerson: 'Puneet Choudhary',
    defaultPhone: '91790-76660',
    defaultMoc: 'DB Pump (86-MOC) - CI-Body / BR–Impeller / Shaft & Sleeve- 45C8 with Mechanical Seal\nDiesel Engine Pump set (86 MOC) – with Complete Pump set',
    defaultInstallationNote: 'Installation is not in our scope and accessories should be extra at actual',
    defaultDeliveryTerms: 'Quoted prices net and FOR Dewas Naka Indore Godown.',
    defaultPaymentTerms: '30% payment advance along with PO and balance 70% payment against PI before dispatch of material.',
    defaultAvailabilityTerms: '3-4 weeks after receipt of your PO.',
    defaultWarrantyTerms: 'We offer the warranty of 12 months from the date of Invoice or against manufacturing or quality issues under standard operation as per the warranty clause.',
    defaultInstallationTerms: 'Installation of the pump set will be in your Scope and super vision of commissioning will be done by us free of charge for 1 day only.',
    defaultTaxesTerms: '18 % GST will be charged extra as applicable on pump',
    defaultValidityTerms: 'Our will be valid for 30 days only.',
    hasMoc: true,
    hasScope: false,
    hasNote: true,
    flowUnit: 'm3/hr',
    tableType: 'fire_fighting', // Columns: Application | Flow m3/hr | Head (m) | Pump Model | Qty | Unit Price Net | Total Amount
    sampleItems: [
      {
        application: 'Main Pump',
        flow_rate: '137',
        head: '50',
        model: 'Kirloskar make End Suction Pump DB 80/20xe (86 MOC) coupled with BBL/Kirloskar Make Fire Fighting Pump 40 HP 3000 RPM motor on coupling and coupling guard with Mechanical Seal',
        qty: '02',
        rate: 196168
      },
      {
        application: 'Diesel Engine Pump',
        flow_rate: '137',
        head: '50',
        model: 'Diesel Engine Fire Fighting Set comprising of Diesel Engine Model (KFE-E2659R-M86B) 45 HP, 2500 RPM on base frame with coupling, Coupling guard & Mechanical Seal (86 MOC)',
        qty: '01',
        rate: 326690
      },
      {
        application: 'Jockey Pump',
        flow_rate: '10.8',
        head: '100',
        model: 'Kirloskar make Vertical Inline Pump KSIL 15-4 (C MOC) With 4 KW 5.5 HP 3000 RPM with Mechanical Seal (4 Stage) (65x65)',
        qty: '02',
        rate: 74016
      },
      {
        application: 'Fuel Tank & Battery',
        flow_rate: '',
        head: '',
        model: 'Fuel Tank & Battery and Battery Lead with Coolant',
        qty: '01',
        rate: 30000
      }
    ],
    sections: [
      'Official Dual Branding & Reference Number',
      'Prominent MOC Specs (DB Pump 86-MOC CI-Body / BR-Impeller / 45C8 Shaft)',
      'Yellow Scope Note prominently placed above table',
      'Application Matrix (Main Pump, Diesel Engine Pump, Jockey Pump, Fuel Tank & Coolant)',
      'Standard Fire Fighting Terms with 1-Day Free Supervision of Commissioning',
      'Puneet Choudhary Sign-off (91790-76660)',
      'Full Address Footer'
    ]
  }
];

export function getWadiTemplate(id) {
  return WADI_TEMPLATES.find((t) => t.id === id) || WADI_TEMPLATES[0];
}
