// WADI Quotation Templates for Pareek Power & Pumps (P) Ltd.
// Supports 4 official Kirloskar WADI pump quotation formats:
// 1. wadi_split_case: Horizontal Split Case Pump Set (UP Series / Flow in LPS)
// 2. wadi_fire_fighting: Fire Fighting Pump Set (Greaves Engine & Scope of Supply)
// 3. wadi_end_suction: End Suction Pump Set (Single Page / Flow in m3/h)
// 4. wadi_fire_fighting_moc: Fire Fighting Pump Set (With MOC & Note)

function formatIndianNumber(val) {
  if (val === undefined || val === null || val === '') return '';
  const num = Number(val);
  if (isNaN(num)) return val;
  return num.toLocaleString('en-IN');
}

function formatDate(d) {
  if (!d) return '';
  try {
    const dateObj = new Date(d);
    if (isNaN(dateObj.getTime())) return d;
    return dateObj.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).replace(/ /g, '-');
  } catch {
    return d;
  }
}

function renderHeader(data) {
  return `
    <table class="header-table">
      <tr>
        <td class="logo-left" style="width: 130px; vertical-align: middle;">
          ${data.kirloskar_logo ? `<img src="${data.kirloskar_logo}" alt="Kirloskar" style="max-height: 48px; max-width: 120px; display: block;" />` : '<div style="font-weight: bold; font-size: 16px;">Kirloskar</div>'}
          <div style="font-size: 8.5px; font-family: Georgia, serif; font-style: italic; color: #222; margin-top: 2px;">Enriching Lives</div>
        </td>
        <td class="company-center" style="text-align: center; vertical-align: middle; padding: 0 10px;">
          <div style="font-size: 18.5px; font-weight: 800; font-family: 'Times New Roman', Times, serif; letter-spacing: 0.5px; color: #000;">PAREEK POWER &amp; PUMPS (P) LTD.</div>
          <div style="font-size: 11px; font-weight: bold; color: #111; margin-top: 1px;">(Formerly: Pareek Tractors (P) Ltd.)</div>
          <div style="font-size: 10px; font-weight: 800; letter-spacing: 0.6px; color: #000; margin-top: 2px;">AUTHORISED DEALER FOR KIRLOSKAR PUMPS &amp; MOTORS</div>
        </td>
        <td class="logo-right" style="width: 130px; text-align: right; vertical-align: middle;">
          ${data.pareek_logo ? `<img src="${data.pareek_logo}" alt="Pareek Group" style="max-height: 52px; max-width: 120px; display: inline-block;" />` : '<div style="font-weight: 900; font-size: 17px; color: #c00000;">PAREEK<br><span style="font-size: 11px; color: #666; font-weight: bold;">GROUP</span></div>'}
        </td>
      </tr>
    </table>
    <div class="red-line"></div>
  `;
}

function renderFooter() {
  return `
    <div class="footer-wrap">
      <div class="red-line" style="margin-bottom: 5px;"></div>
      <div class="footer-text">
        101, Block – A Radhakrishna Complex, 10/1 Manoramaganj, Geeta Bhawan Chouraha, A.B. Road , INDORE – 452001<br>
        Ph: 0731-4006381, 82 &nbsp;email:spb@pareekgroup.com, sales@pareekgroup.com &nbsp;Visit at : www.pareekgroup.com
      </div>
    </div>
  `;
}

const COMMON_CSS = `
  @page {
    size: A4;
    margin: 12mm 15mm;
  }
  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  body {
    font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
    font-size: 11px;
    line-height: 1.35;
    color: #000;
    margin: 0;
    padding: 0;
    background: #fff;
  }
  .page {
    width: 100%;
    min-height: 260mm;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .page-break {
    page-break-before: always;
  }
  .header-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 6px;
  }
  .red-line {
    height: 3.5px;
    background-color: #c00000;
    width: 100%;
    margin-top: 4px;
    margin-bottom: 10px;
  }
  .ref-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 8px;
    font-size: 11.5px;
    font-weight: bold;
  }
  .recipient-block {
    margin-bottom: 10px;
    font-size: 11.5px;
    line-height: 1.35;
  }
  .recipient-block p {
    margin: 1px 0;
  }
  .attn {
    font-weight: bold;
    margin: 5px 0;
  }
  .sub {
    font-weight: bold;
    margin: 5px 0;
  }
  .intro {
    margin: 6px 0 10px 0;
  }

  /* Table Design Matching Kirloskar Wadi Exact Style */
  .custom-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 8px;
    margin-bottom: 12px;
  }
  .custom-table th {
    background-color: #8fb6db;
    color: #000;
    border: 1px solid #333;
    padding: 6px 5px;
    font-size: 10.5px;
    font-weight: bold;
    text-align: center;
    vertical-align: middle;
  }
  .custom-table td {
    background-color: #a4d477;
    color: #000;
    border: 1px solid #333;
    padding: 6px 6px;
    font-size: 10.5px;
    vertical-align: middle;
  }
  .custom-table td.center {
    text-align: center;
  }
  .custom-table td.right {
    text-align: right;
    white-space: nowrap;
  }
  .custom-table td.desc {
    text-align: left;
    font-size: 10.5px;
    line-height: 1.3;
  }
  .custom-table tr.total-row td {
    font-weight: bold;
    font-size: 11px;
    border-top: 2px solid #000;
  }

  .highlight-note {
    background-color: #ffff00;
    color: #000;
    font-weight: bold;
    font-size: 10.5px;
    padding: 3.5px 8px;
    margin: 8px 0;
    display: inline-block;
  }

  .section-label {
    font-weight: bold;
    font-size: 11px;
    text-decoration: underline;
    margin-top: 10px;
    margin-bottom: 3px;
  }
  .section-content {
    font-size: 11px;
    line-height: 1.35;
    margin-bottom: 8px;
  }

  .terms-block {
    margin-top: 12px;
    font-size: 10.5px;
    line-height: 1.35;
  }
  .terms-title {
    font-weight: bold;
    margin-bottom: 5px;
  }
  .term-item {
    margin-bottom: 4px;
  }
  .term-name {
    font-weight: bold;
  }

  .sign-off {
    margin-top: 16px;
    font-size: 11px;
    line-height: 1.35;
  }
  .sign-off .yours {
    margin-bottom: 12px;
  }
  .sign-off .company {
    font-weight: bold;
  }
  .sign-off .name {
    font-weight: bold;
    margin-top: 10px;
  }

  .footer-wrap {
    margin-top: 16px;
    width: 100%;
  }
  .footer-text {
    text-align: center;
    font-size: 9px;
    color: #111;
    line-height: 1.35;
  }
`;

// ==========================================
// 1. WADI TEMPLATE 1: Split Case Pump Set (UP Series / LPS)
// ==========================================
export function wadiSplitCaseTemplate(data) {
  const items = data.items && data.items.length > 0 ? data.items : [];
  let totalAmount = 0;

  const itemRows = items.map((item, idx) => {
    const cf = item.custom_fields || {};
    const sno = idx + 1;
    const head = item.head || cf.head || data.head || '';
    const flow = item.flow_rate || cf.flow || cf.flow_rate || data.flow || '';
    const model = item.model || cf.pump_model || cf.model || item.product_name || item.description || '';
    const qty = item.qty || '01';
    const rate = Number(item.rate || item.discounted_price || 0);
    const lineTotal = item.line_total ? Number(item.line_total) : (rate * (Number(qty) || 1));
    totalAmount += lineTotal;

    return `
      <tr>
        <td class="center" style="font-weight: bold;">${sno}</td>
        <td class="center">${head}</td>
        <td class="center">${flow}</td>
        <td class="desc">${model}</td>
        <td class="center font-bold">${qty}</td>
        <td class="right">${rate ? formatIndianNumber(rate) + '/-' : ''}</td>
        <td class="right font-bold">${lineTotal ? formatIndianNumber(lineTotal) + '/-' : ''}</td>
      </tr>
    `;
  }).join('');

  const displayTotal = totalAmount > 0 ? totalAmount : (Number(data.total_amount) || 0);
  const moc = data.material_construction || 'UP Pump (01 MOC) – CI–Casing / CI-Impeller / Shaft – 40C8 With Gland Packed';
  const personName = data.sales_person_name || 'G S Sayan';
  const personPhone = data.sales_person_phone || '9893276018';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Quotation - ${data.quotation_number || 'WADI Split Case'}</title>
  <style>
    ${COMMON_CSS}
  </style>
</head>
<body>
  <!-- PAGE 1: Letter, Table, MOC, Terms -->
  <div class="page">
    <div>
      ${renderHeader(data)}

      <table class="ref-table">
        <tr>
          <td style="text-align: left; width: 60%;">4PL/W.PUMP/${data.quotation_number || '202611'}</td>
          <td style="text-align: right; width: 40%;">Date- ${formatDate(data.date) || '16-Oct-2026'}</td>
        </tr>
      </table>

      <div class="recipient-block">
        <p><strong>To,</strong></p>
        <p><strong>${data.customer_name || data.company_name || 'M/s. M. P. AgriTech'}</strong></p>
        <p>${data.customer_address || data.address || data.city || 'Indore'}</p>
        <div class="attn">Kind Attn:- ${data.attention_person || 'Mr. Anil Raina Ji'}</div>
        <div class="sub">Sub: ${data.subject || 'Kirloskar make Horizontal Split Case Pump set.'}</div>
        <div class="intro">
          Dear Sir,<br>
          With reference to the above subject, we are submitting our best suitable Techno-Commercial offer for Horizontal Split Case pump set as below.
        </div>
      </div>

      <!-- MAIN TABLE -->
      <table class="custom-table">
        <thead>
          <tr>
            <th style="width: 5%;">S.No</th>
            <th style="width: 8%;">Head<br>(m)</th>
            <th style="width: 9%;">Flow<br>LPS</th>
            <th style="width: 48%;">Pump<br>Model</th>
            <th style="width: 7%;">Qty</th>
            <th style="width: 11%;">Unit<br>Price(Rs.)</th>
            <th style="width: 12%;">Total<br>Amount<br>(Rs.)</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows || `
            <tr>
              <td class="center">1</td>
              <td class="center">45</td>
              <td class="center">160</td>
              <td class="desc">Kirloskar make Horizontal Split Case Pump Model UP 250/38 (01 MOC) Bare Shaft Pump with Gland Pack</td>
              <td class="center">01</td>
              <td class="right">1,88,980/-</td>
              <td class="right">1,88,980/-</td>
            </tr>
            <tr>
              <td class="center"></td>
              <td class="center"></td>
              <td class="center"></td>
              <td class="desc">Base Frame MS Fabricated channel size 150×75 m.m + MS Coupling Guard + Coupling RB 198 Pin Bush Type</td>
              <td class="center">01 Set</td>
              <td class="right">34,320/-</td>
              <td class="right">34,320/-</td>
            </tr>
          `}
          <tr class="total-row">
            <td colspan="6" style="text-align: right; font-weight: bold; background-color: #a4d477;">Total</td>
            <td class="right font-bold" style="background-color: #a4d477;">${formatIndianNumber(displayTotal || 223300)}/-</td>
          </tr>
        </tbody>
      </table>

      <!-- MOC -->
      <div class="section-label">Material of Constructions:</div>
      <div class="section-content">${moc}</div>

      <!-- TERMS -->
      <div class="terms-block">
        <div class="terms-title">Terms &amp; Conditions of supply will be as under:-</div>
        <div class="term-item"><span class="term-name">Prices –</span> ${data.delivery_terms || 'Quoted prices net and FOR our Dewas Naka Godown Delivery.'}</div>
        <div class="term-item"><span class="term-name">Taxes:</span> ${data.taxes_terms || '18 % GST will be charged extra as applicable on pump'}</div>
        <div class="term-item"><span class="term-name">Payment terms:</span> ${data.payment_terms || '100% payment advance along with PO against Proforma Invoice before dispatch of Material.'}</div>
        <div class="term-item"><span class="term-name">Delivery Period:</span> ${data.availability_terms || '10 Days after receipt of your PO.'}</div>
        <div class="term-item"><span class="term-name">Warranty:</span> ${data.warranty_terms || '12 months from the date of commissioning whichever is earlier as a special case related to any manufacturing or quality issues under standard operation as per the warranty clause.'}</div>
        <div class="term-item"><span class="term-name">Test Certificates:</span> We will submit test certificates for duty points only along with dispatch documents.</div>
        <div class="term-item"><span class="term-name">Validity of offer:</span> ${data.validity_terms || 'Our will be valid for 15 days only.'}</div>
      </div>
    </div>

    ${renderFooter()}
  </div>

  <!-- PAGE 2: Closing & Sign-off -->
  <div class="page page-break">
    <div>
      <div class="sign-off" style="margin-top: 40px;">
        <p>We hope, this is in line with your requirement.</p>
        <p class="yours">Yours truly,</p>
        <p class="company">For Pareek Power &amp; Pumps Pvt. Ltd.</p>
        <p class="name">
          ${personName}<br>
          ${personPhone}
        </p>
      </div>
    </div>

    ${renderFooter()}
  </div>
</body>
</html>
  `;
}

// ==========================================
// 2. WADI TEMPLATE 2: Fire Fighting Pump Set (Greaves Engine & Scope)
// ==========================================
export function wadiFireFightingTemplate(data) {
  const items = data.items && data.items.length > 0 ? data.items : [];
  let totalAmount = 0;

  const itemRows = items.map((item) => {
    const cf = item.custom_fields || {};
    const app = item.application || cf.application || '';
    const head = item.head || cf.head || data.head || '';
    const flow = item.flow_rate || cf.flow || cf.flow_rate || data.flow || '';
    const model = item.model || cf.pump_model || cf.model || item.product_name || item.description || '';
    const qty = item.qty || '01';
    const rate = Number(item.rate || item.discounted_price || 0);
    const lineTotal = item.line_total ? Number(item.line_total) : (rate * (Number(qty) || 1));
    totalAmount += lineTotal;

    return `
      <tr>
        <td class="center" style="font-weight: bold;">${app}</td>
        <td class="center">${flow}</td>
        <td class="center">${head}</td>
        <td class="desc">${model}</td>
        <td class="center font-bold">${qty}</td>
        <td class="right">${rate ? formatIndianNumber(rate) + '/-' : ''}</td>
        <td class="right font-bold">${lineTotal ? formatIndianNumber(lineTotal) + '/-' : ''}</td>
      </tr>
    `;
  }).join('');

  const displayTotal = totalAmount > 0 ? totalAmount : (Number(data.total_amount) || 0);
  const moc = data.material_construction || 'Diesel Engine Pump set – with Complete Pump set without accessories.';
  const scope = data.scope_of_supply || 'Diesel Engine Pump Set Engine + Pump + Coupling + Coupling Guard Fitted on Suitable MS Base Frame.';
  const personName = data.sales_person_name || 'Pradeep Ghadge';
  const personPhone = data.sales_person_phone || '82690-00495';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Quotation - ${data.quotation_number || 'WADI Fire Fighting'}</title>
  <style>
    ${COMMON_CSS}
  </style>
</head>
<body>
  <!-- PAGE 1: Intro, Table, MOC, Scope -->
  <div class="page">
    <div>
      ${renderHeader(data)}

      <table class="ref-table">
        <tr>
          <td style="text-align: left; width: 60%;">4PL/W.PUMP/${data.quotation_number || '202607'}</td>
          <td style="text-align: right; width: 40%;">Date: ${formatDate(data.date) || '12-10-2026'}</td>
        </tr>
      </table>

      <div class="recipient-block">
        <p><strong>To,</strong></p>
        <p><strong>${data.customer_name || data.company_name || 'M/s. VE Commercial Vehicles Ltd.,'}</strong></p>
        <p>${data.customer_address || data.address || data.city || 'Narwar Dist- Ujjain'}</p>
        <div class="attn">Attention: ${data.attention_person || 'Mr. Dinesh Bisla'}</div>
        <div class="sub">Sub: ${data.subject || 'Kirloskar make Fire Fighting Pump Set.'}</div>
        <div class="intro">
          Dear Sir,<br>
          With reference to the above subject, we are submitting our best suitable Techno-Commercial offer for Fire Fighting Pump Set as below.
        </div>
      </div>

      <!-- MAIN TABLE -->
      <table class="custom-table">
        <thead>
          <tr>
            <th style="width: 14%;">Application</th>
            <th style="width: 9%;">Flow<br>m3/hr</th>
            <th style="width: 8%;">Head<br>(m)</th>
            <th style="width: 44%;">Pump<br>Model</th>
            <th style="width: 6%;">Qty</th>
            <th style="width: 10%;">Unit Price<br>Net (Rs.)</th>
            <th style="width: 11%;">Total<br>Amount Rs.</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows || `
            <tr>
              <td class="center">Main<br>Pump</td>
              <td class="center">273</td>
              <td class="center">100</td>
              <td class="desc">Kirloskar make End Suction Pump CPHM 125/32_2900 (43 MOC) coupled with BBL/Kirloskar Make Fire Fighting 170 HP 3000 RPM motor on coupling and coupling guard with Gland Pack</td>
              <td class="center">01</td>
              <td class="right">7,91,280/-</td>
              <td class="right">7,91,280/-</td>
            </tr>
            <tr>
              <td class="center">Diesel<br>Engine<br>Pump</td>
              <td class="center">273</td>
              <td class="center">100</td>
              <td class="desc">Diesel Engine Fire Fighting Set comprising of Greaves make Diesel Engine (CPHM 125/32) 167 HP, 1800 RPM on base frame with coupling, Coupling guard &amp; Gland Pack (43 MOC)</td>
              <td class="center">01</td>
              <td class="right">7,99,680/-</td>
              <td class="right">7,99,680/-</td>
            </tr>
            <tr>
              <td class="center">Jockey<br>Pump</td>
              <td class="center">10.8</td>
              <td class="center">100</td>
              <td class="desc">Kirloskar make Vertical Inline Pump KCIL 10-14 (A MOC) coupled with BBL/Kirloskar Make Fire Fighting 5.5 KW 7.5 HP 3000 RPM motor on coupling and coupling guard with Mechanical Seal</td>
              <td class="center">01</td>
              <td class="right">1,19,880/-</td>
              <td class="right">1,19,880/-</td>
            </tr>
            <tr>
              <td class="desc" colspan="4">Fuel Tank &amp; Battery and Battery Lead with Coolent</td>
              <td class="center">01</td>
              <td class="right">45,000/-</td>
              <td class="right">45,000/-</td>
            </tr>
          `}
          <tr class="total-row">
            <td colspan="6" style="text-align: right; font-weight: bold; background-color: #a4d477;">TOTAL</td>
            <td class="right font-bold" style="background-color: #a4d477;">${formatIndianNumber(displayTotal || 1755840)}/-</td>
          </tr>
        </tbody>
      </table>

      <!-- MOC & SCOPE -->
      <div class="section-label">Material of Construction:</div>
      <div class="section-content">${moc}</div>

      <div class="section-label">Scope of Supply:</div>
      <div class="section-content">${scope}</div>
    </div>

    ${renderFooter()}
  </div>

  <!-- PAGE 2: Terms & Sign-off -->
  <div class="page page-break">
    <div>
      <div class="terms-block" style="margin-top: 30px;">
        <div class="terms-title">Terms &amp; Conditions of supply will be as under:-</div>
        <div class="term-item"><span class="term-name">Prices –</span> ${data.delivery_terms || 'Quoted prices net and FOR Dewas Naka Indore Godown.'}</div>
        <div class="term-item"><span class="term-name">Taxes:</span> ${data.taxes_terms || '18 % GST will be charged extra as applicable on pump'}</div>
        <div class="term-item"><span class="term-name">Payment terms:</span> ${data.payment_terms || '30% payment advance along with PO and balance 70% payment against PI before dispatch of material.'}</div>
        <div class="term-item"><span class="term-name">Delivery Period:</span> ${data.availability_terms || '14-16 weeks after receipt of your PO.'}</div>
        <div class="term-item"><span class="term-name">Warranty:</span> ${data.warranty_terms || 'We offer the warranty of 12 months from the date of Invoice or against manufacturing or quality issues under standard operation as per the warranty clause.'}</div>
        <div class="term-item"><span class="term-name">Test Certificates:</span> We will submit test certificates for duty points only along with dispatch documents.</div>
        <div class="term-item"><span class="term-name">Installation &amp; Commissioning of Pump Set:</span> ${data.installation_terms || 'Installation of the pump set will be in your Scope and super vision of commissioning will be done by us free of charge for 1 day only.'}</div>
        <div class="term-item"><span class="term-name">Validity of offer:</span> ${data.validity_terms || 'Our will be valid for 30 days only.'}</div>
      </div>

      <div class="sign-off" style="margin-top: 40px;">
        <p>We hope, this is in line with your requirement.</p>
        <p class="yours">Yours truly,</p>
        <p class="company">For Pareek Power &amp; Pumps Pvt. Ltd.</p>
        <p class="name">
          ${personName}<br>
          ${personPhone}
        </p>
      </div>
    </div>

    ${renderFooter()}
  </div>
</body>
</html>
  `;
}

// ==========================================
// 3. WADI TEMPLATE 3: End Suction Pump Set (Single Page / m3/h)
// ==========================================
export function wadiEndSuctionTemplate(data) {
  const items = data.items && data.items.length > 0 ? data.items : [];
  let totalAmount = 0;

  const itemRows = items.map((item, idx) => {
    const cf = item.custom_fields || {};
    const sno = idx + 1;
    const head = item.head || cf.head || data.head || '';
    const flow = item.flow_rate || cf.flow || cf.flow_rate || data.flow || '';
    const model = item.model || cf.pump_model || cf.model || item.product_name || item.description || '';
    const qty = item.qty || '01';
    const rate = Number(item.rate || item.discounted_price || 0);
    const lineTotal = item.line_total ? Number(item.line_total) : (rate * (Number(qty) || 1));
    totalAmount += lineTotal;

    return `
      <tr>
        <td class="center" style="font-weight: bold;">${sno}</td>
        <td class="center">${head}</td>
        <td class="center">${flow}</td>
        <td class="desc">${model}</td>
        <td class="center font-bold">${qty}</td>
        <td class="right">${rate ? formatIndianNumber(rate) + '/-' : ''}</td>
        <td class="right font-bold">${lineTotal ? formatIndianNumber(lineTotal) + '/-' : ''}</td>
      </tr>
    `;
  }).join('');

  const displayTotal = totalAmount > 0 ? totalAmount : (Number(data.total_amount) || 0);
  const note = data.installation_note || 'Installation is not in our scope and accessories should be extra at actual';
  const personName = data.sales_person_name || 'Puneet Choudhary';
  const personPhone = data.sales_person_phone || '91790-76660';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Quotation - ${data.quotation_number || 'WADI End Suction'}</title>
  <style>
    ${COMMON_CSS}
    /* Compact single page adjustments */
    body { font-size: 10.5px; }
    .page { min-height: 250mm; }
    .custom-table th, .custom-table td { padding: 4.5px 5px; font-size: 10px; }
    .term-item { margin-bottom: 2.5px; }
  </style>
</head>
<body>
  <div class="page">
    <div>
      ${renderHeader(data)}

      <table class="ref-table">
        <tr>
          <td style="text-align: left; width: 60%;">4PL/W.PUMP/${data.quotation_number || '202606'}</td>
          <td style="text-align: right; width: 40%;">Date-${formatDate(data.date) || '12-10-2026'}</td>
        </tr>
      </table>

      <div class="recipient-block">
        <p><strong>To,</strong></p>
        <p><strong>${data.customer_name || data.company_name || 'M/S Syncom Formulation (India) Ltd.'}</strong></p>
        <p>${data.customer_address || data.address || data.city || 'Pithampur,'}</p>
        <div class="attn">Attention: ${data.attention_person || 'Mr. Sumit Batham'}</div>
        <div class="sub">Sub: ${data.subject || 'Kirloskar make End Suction Pump set.'}</div>
        <div class="intro">
          Dear Sir,<br>
          With reference to the above subject, we are submitting our best suitable Techno-Commercial offer for End Suction pump set as below.
        </div>
      </div>

      <!-- MAIN TABLE -->
      <table class="custom-table">
        <thead>
          <tr>
            <th style="width: 5%;">S.No</th>
            <th style="width: 8%;">Head<br>(m)</th>
            <th style="width: 9%;">Flow<br>(m3/h)</th>
            <th style="width: 48%;">Pump<br>Model</th>
            <th style="width: 7%;">Qty</th>
            <th style="width: 11%;">Unit<br>Price(Rs.)</th>
            <th style="width: 12%;">Total<br>Amount<br>(Rs.)</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows || `
            <tr>
              <td class="center">1</td>
              <td class="center">55</td>
              <td class="center">130</td>
              <td class="desc">Kirloskar make End Suction Pump Model DB 65/20xe (86 MOC) coupled with BBL make 30 KW/40 HP/3000 RPM motor, (IE2 Efficiency) on Base Frame, Coupling &amp; Coupling Guard With Mechanical Seal</td>
              <td class="center">01</td>
              <td class="right">1,84,690/-</td>
              <td class="right">1,84,690/-</td>
            </tr>
          `}
          <tr class="total-row">
            <td colspan="6" style="text-align: right; font-weight: bold; background-color: #a4d477;">Total</td>
            <td class="right font-bold" style="background-color: #a4d477;">${formatIndianNumber(displayTotal || 184690)}/-</td>
          </tr>
        </tbody>
      </table>

      <!-- YELLOW NOTE -->
      <div class="highlight-note">
        Note – ${note}
      </div>

      <!-- 6-POINT TERMS -->
      <div class="terms-block">
        <div class="terms-title">Terms &amp;Condition:-</div>
        <div class="term-item"><span class="term-name">1. Availability–</span> ${data.availability_terms || '1 week after receipt of Your PO.'}</div>
        <div class="term-item"><span class="term-name">2. Payment-</span> ${data.payment_terms || '30% advance along with PO and balance 70% against PI before dispatch of material.'}</div>
        <div class="term-item"><span class="term-name">3. Taxes -</span> ${data.taxes_terms || 'GST18% extra at actual.'}</div>
        <div class="term-item"><span class="term-name">4. This offer is valid till</span> ${data.validity_terms || '18-Oct-2026.'}</div>
        <div class="term-item"><span class="term-name">5. Delivery–</span> ${data.delivery_terms || 'Ex Our Godown, Dewas Naka Indore.'}</div>
        <div class="term-item"><span class="term-name">6. Freight –</span> ${data.freight_terms || 'To Pay.'}</div>
      </div>

      <!-- SIGN-OFF -->
      <div class="sign-off">
        <p>We hope, this is in line with your requirement.</p>
        <p class="yours">Yours truly,</p>
        <p class="name">
          ${personName}<br>
          ${personPhone}
        </p>
        <p class="company" style="margin-top: 4px;">
          For Pareek Power &amp; Pumps Pvt. Ltd.<br>
          <span style="font-weight: normal;">Indore (M.P.)</span>
        </p>
      </div>
    </div>

    ${renderFooter()}
  </div>
</body>
</html>
  `;
}

// ==========================================
// 4. WADI TEMPLATE 4: Fire Fighting Pump Set (With MOC & Note)
// ==========================================
export function wadiFireFightingMocTemplate(data) {
  const items = data.items && data.items.length > 0 ? data.items : [];
  let totalAmount = 0;

  const itemRows = items.map((item) => {
    const cf = item.custom_fields || {};
    const app = item.application || cf.application || '';
    const head = item.head || cf.head || data.head || '';
    const flow = item.flow_rate || cf.flow || cf.flow_rate || data.flow || '';
    const model = item.model || cf.pump_model || cf.model || item.product_name || item.description || '';
    const qty = item.qty || '01';
    const rate = Number(item.rate || item.discounted_price || 0);
    const lineTotal = item.line_total ? Number(item.line_total) : (rate * (Number(qty) || 1));
    totalAmount += lineTotal;

    return `
      <tr>
        <td class="center" style="font-weight: bold;">${app}</td>
        <td class="center">${flow}</td>
        <td class="center">${head}</td>
        <td class="desc">${model}</td>
        <td class="center font-bold">${qty}</td>
        <td class="right">${rate ? formatIndianNumber(rate) + '/-' : ''}</td>
        <td class="right font-bold">${lineTotal ? formatIndianNumber(lineTotal) + '/-' : ''}</td>
      </tr>
    `;
  }).join('');

  const displayTotal = totalAmount > 0 ? totalAmount : (Number(data.total_amount) || 0);
  const moc = data.material_construction || 'DB Pump (86-MOC) - CI-Body / BR–Impeller / Shaft & Sleeve- 45C8 with Mechanical Seal<br>Diesel Engine Pump set (86 MOC) – with Complete Pump set';
  const note = data.installation_note || 'Installation is not in our scope and accessories should be extra at actual';
  const personName = data.sales_person_name || 'Puneet Choudhary';
  const personPhone = data.sales_person_phone || '91790-76660';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Quotation - ${data.quotation_number || 'WADI Fire Fighting MOC'}</title>
  <style>
    ${COMMON_CSS}
  </style>
</head>
<body>
  <!-- PAGE 1: Intro, MOC, Note, Table -->
  <div class="page">
    <div>
      ${renderHeader(data)}

      <table class="ref-table">
        <tr>
          <td style="text-align: left; width: 60%;">4PL/W.PUMP/${data.quotation_number || '202608'}</td>
          <td style="text-align: right; width: 40%;">Date: ${formatDate(data.date) || '12-10-2026'}</td>
        </tr>
      </table>

      <div class="recipient-block">
        <p><strong>To,</strong></p>
        <p><strong>${data.customer_name || data.company_name || 'M/s. CONVENIENT FIRETECH.,'}</strong></p>
        <p>${data.customer_address || data.address || data.city || 'Indore'}</p>
        <div class="attn">Attention: ${data.attention_person || 'Mr. Ishaan'}</div>
        <div class="sub">Sub: ${data.subject || 'Kirloskar make Fire Fighting Pump Set.'}</div>
        <div class="intro">
          Dear Sir,<br>
          With reference to the above subject, we are submitting our best suitable Techno-Commercial offer for Fire Fighting Pump Set as below.
        </div>
      </div>

      <!-- MOC BEFORE TABLE -->
      <div class="section-label">Material of Construction:</div>
      <div class="section-content">${moc}</div>

      <!-- YELLOW NOTE -->
      <div class="highlight-note">
        Note – ${note}
      </div>

      <!-- MAIN TABLE -->
      <table class="custom-table">
        <thead>
          <tr>
            <th style="width: 14%;">Application</th>
            <th style="width: 9%;">Flow<br>m3/hr</th>
            <th style="width: 8%;">Head<br>(m)</th>
            <th style="width: 44%;">Pump<br>Model</th>
            <th style="width: 6%;">Qty</th>
            <th style="width: 10%;">Unit Price<br>Net (Rs.)</th>
            <th style="width: 11%;">Total<br>Amount Rs.</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows || `
            <tr>
              <td class="center">Main<br>Pump</td>
              <td class="center">137</td>
              <td class="center">50</td>
              <td class="desc">Kirloskar make End Suction Pump DB 80/20xe (86 MOC) coupled with BBL/Kirloskar Make Fire Fighting Pump 40 HP 3000 RPM motor on coupling and coupling guard with Mechanical Seal</td>
              <td class="center">02</td>
              <td class="right">1,96,168/-</td>
              <td class="right">3,92,336/-</td>
            </tr>
            <tr>
              <td class="center">Diesel<br>Engine<br>Pump</td>
              <td class="center">137</td>
              <td class="center">50</td>
              <td class="desc">Diesel Engine Fire Fighting Set comprising of Diesel Engine Model (KFE-E2659R-M86B) 45 HP, 2500 RPM on base frame with coupling, Coupling guard &amp; Mechanical Seal (86 MOC)</td>
              <td class="center">01</td>
              <td class="right">3,26,690/-</td>
              <td class="right">3,26,690/-</td>
            </tr>
            <tr>
              <td class="center">Jockey<br>Pump</td>
              <td class="center">10.8</td>
              <td class="center">100</td>
              <td class="desc">Kirloskar make Vertical Inline Pump KSIL 15-4 (C MOC) With 4 KW 5.5 HP 3000 RPM with Mechanical Seal (4 Stage) (65x65)</td>
              <td class="center">02</td>
              <td class="right">74,016/-</td>
              <td class="right">1,48,032/-</td>
            </tr>
            <tr>
              <td class="desc" colspan="4">Fuel Tank &amp; Battery and Battery Lead with Coolant</td>
              <td class="center">01</td>
              <td class="right">30,000/-</td>
              <td class="right">30,000/-</td>
            </tr>
          `}
          <tr class="total-row">
            <td colspan="6" style="text-align: right; font-weight: bold; background-color: #a4d477;">TOTAL</td>
            <td class="right font-bold" style="background-color: #a4d477;">${formatIndianNumber(displayTotal || 897058)}/-</td>
          </tr>
        </tbody>
      </table>
    </div>

    ${renderFooter()}
  </div>

  <!-- PAGE 2: Terms & Sign-off -->
  <div class="page page-break">
    <div>
      <div class="terms-block" style="margin-top: 30px;">
        <div class="terms-title">Terms &amp; Conditions of supply will be as under:-</div>
        <div class="term-item"><span class="term-name">Prices –</span> ${data.delivery_terms || 'Quoted prices net and FOR Dewas Naka Indore Godown.'}</div>
        <div class="term-item"><span class="term-name">Taxes:</span> ${data.taxes_terms || '18 % GST will be charged extra as applicable on pump'}</div>
        <div class="term-item"><span class="term-name">Payment terms:</span> ${data.payment_terms || '30% payment advance along with PO and balance 70% payment against PI before dispatch of material.'}</div>
        <div class="term-item"><span class="term-name">Delivery Period:</span> ${data.availability_terms || '3-4 weeks after receipt of your PO.'}</div>
        <div class="term-item"><span class="term-name">Warranty:</span> ${data.warranty_terms || 'We offer the warranty of 12 months from the date of Invoice or against manufacturing or quality issues under standard operation as per the warranty clause.'}</div>
        <div class="term-item"><span class="term-name">Test Certificates:</span> We will submit test certificates for duty points only along with dispatch documents.</div>
        <div class="term-item"><span class="term-name">Installation &amp; Commissioning of Pump Set:</span> ${data.installation_terms || 'Installation of the pump set will be in your Scope and super vision of commissioning will be done by us free of charge for 1 day only.'}</div>
        <div class="term-item"><span class="term-name">Validity of offer:</span> ${data.validity_terms || 'Our will be valid for 30 days only.'}</div>
      </div>

      <div class="sign-off" style="margin-top: 40px;">
        <p>We hope, this is in line with your requirement.</p>
        <p class="yours">Yours truly,</p>
        <p class="company">For Pareek Power &amp; Pumps Pvt. Ltd.</p>
        <p class="name">
          ${personName}<br>
          ${personPhone}
        </p>
      </div>
    </div>

    ${renderFooter()}
  </div>
</body>
</html>
  `;
}

// Master dispatcher for WADI category
export function wadiTemplate(data, subTemplate = 'wadi_split_case') {
  const t = (subTemplate || data.template_type || 'wadi_split_case').toLowerCase();
  if (t === 'wadi_fire_fighting' || t === 'wadi_2' || t === 'fire_fighting') {
    return wadiFireFightingTemplate(data);
  }
  if (t === 'wadi_end_suction' || t === 'wadi_3' || t === 'end_suction') {
    return wadiEndSuctionTemplate(data);
  }
  if (t === 'wadi_fire_fighting_moc' || t === 'wadi_4' || t === 'fire_fighting_moc') {
    return wadiFireFightingMocTemplate(data);
  }
  return wadiSplitCaseTemplate(data);
}
