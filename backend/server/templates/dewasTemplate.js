export function dewasTemplate(data) {
  const formatCurrency = (val) => {
    if (val === undefined || val === null || val === '') return '';
    const num = Number(val);
    if (isNaN(num)) return val;
    return num.toLocaleString('en-IN');
  };

  const formatDate = (d) => {
    if (!d) return '';
    try {
      const dateObj = new Date(d);
      if (isNaN(dateObj.getTime())) return d;
      return dateObj.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return d;
    }
  };

  const itemsList = data.items && data.items.length > 0 ? data.items : [{}];

  const renderedRows = itemsList.map((item, index) => {
    const cf = item.custom_fields || {};
    const sno = String(index + 1).padStart(2, '0');
    const model = cf.model || cf.pump_model || item.product_name || item.description || item.model || '';
    const motorHp = cf.motor_hp || cf.hp || item.motor_hp || item.hp || '';
    const head = cf.head || item.head || data.head || '';
    const flowRate = cf.flow_rate || cf.flow || item.flow_rate || item.flow || '';
    const sucDelSize = cf.suc_del_size || cf.size || cf.delivery_size || item.size || '';
    const maxSolidSize = cf.max_solid_size || cf.solid_size || item.solid_size || '';
    const qty = item.qty !== undefined && item.qty !== null ? item.qty : '';
    const price = item.rate !== undefined && item.rate !== null ? formatCurrency(item.rate) : '';
    const lineTotal = item.line_total !== undefined && item.line_total !== null ? formatCurrency(item.line_total) : (item.qty && item.rate ? formatCurrency(item.qty * item.rate) : '');

    return `
      <tr>
        <td class="center font-bold">${sno}</td>
        <td class="center">${model}</td>
        <td class="center">${motorHp}</td>
        <td class="center">${head}</td>
        <td class="center">${flowRate}</td>
        <td class="center">${sucDelSize}</td>
        <td class="center">${maxSolidSize}</td>
        <td class="center font-bold">${qty}</td>
        <td class="right">${price ? price + '/-' : ''}</td>
        <td class="right font-bold">${lineTotal ? lineTotal + '/-' : ''}</td>
      </tr>
    `;
  }).join('');

  // Fallback / blank rows if fewer than 3 items for clean paper layout
  let placeholderRows = '';
  if (itemsList.length < 3) {
    for (let i = itemsList.length; i < 3; i++) {
      const sno = String(i + 1).padStart(2, '0');
      placeholderRows += `
        <tr>
          <td class="center font-bold">${sno}</td>
          <td>&nbsp;</td>
          <td>&nbsp;</td>
          <td>&nbsp;</td>
          <td>&nbsp;</td>
          <td>&nbsp;</td>
          <td>&nbsp;</td>
          <td>&nbsp;</td>
          <td>&nbsp;</td>
          <td>&nbsp;</td>
        </tr>
      `;
    }
  }

  // Parse terms & conditions
  let termsHtml = '';
  if (data.terms_conditions && typeof data.terms_conditions === 'string' && data.terms_conditions.trim()) {
    const lines = data.terms_conditions.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    termsHtml = lines.map((line, i) => `<div><span class="term-num">${i + 1}.</span> <span class="term-text">${line.replace(/^\d+[\.\)]\s*/, '')}</span></div>`).join('');
  } else {
    termsHtml = `
      <div><span class="term-num">1.</span> <span class="term-label">Availability –</span> ${data.availability || 'Ex-Stock / 2-3 Weeks'}</div>
      <div><span class="term-num">2.</span> <span class="term-label">Payment:</span> ${data.payment_terms || '100% Against PI / Advance'}</div>
      <div><span class="term-num">3.</span> <span class="term-label">Taxes -</span> ${data.taxes || 'GST 18% Extra'}</div>
      <div><span class="term-num">4.</span> <span class="term-label">This offer is valid till:</span> ${data.validity || '30 Days'}</div>
      <div><span class="term-num">5.</span> <span class="term-label">Local Freight:</span> ${data.freight || 'Extra at actual / To Pay'}</div>
      <div><span class="term-num">6.</span> <span class="term-label">Warranty –</span> 12 Months against manufacturing defects only.</div>
    `;
  }

  const grandTotal = data.total_amount ? formatCurrency(data.total_amount) : (data.subtotal ? formatCurrency(data.subtotal) : '0');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Quotation - Dewas Format</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 15mm 12mm 15mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
      font-size: 11.5px;
      line-height: 1.35;
      color: #000;
      background: #fff;
    }
    .page-container {
      width: 100%;
      min-height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    /* HEADER */
    .header-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
    }
    .header-table td {
      vertical-align: middle;
      border: none;
      padding: 0;
    }
    .logo-kirloskar {
      width: 130px;
      text-align: left;
    }
    .logo-kirloskar img {
      max-height: 52px;
      max-width: 120px;
      display: block;
    }
    .logo-kirloskar .tagline {
      font-size: 9px;
      font-family: Georgia, serif;
      font-style: italic;
      color: #111;
      margin-top: 2px;
      padding-left: 2px;
    }
    .company-center {
      text-align: center;
      padding: 0 10px;
    }
    .company-name {
      font-size: 18px;
      font-weight: 900;
      letter-spacing: 0.5px;
      color: #000;
      font-family: Arial, sans-serif;
    }
    .company-former {
      font-size: 12px;
      font-weight: bold;
      color: #111;
      margin-top: 2px;
    }
    .company-dealer {
      font-size: 10.5px;
      font-weight: bold;
      letter-spacing: 0.6px;
      color: #000;
      margin-top: 2px;
    }
    .logo-pareek {
      width: 130px;
      text-align: right;
    }
    .logo-pareek img {
      max-height: 58px;
      max-width: 125px;
      display: inline-block;
    }

    /* META ROW */
    .meta-row {
      width: 100%;
      margin-top: 8px;
      margin-bottom: 12px;
    }
    .meta-table {
      width: 100%;
      border-collapse: collapse;
    }
    .meta-table td {
      padding: 2px 0;
      font-size: 12px;
      font-weight: bold;
    }

    /* RECIPIENT & SUBJECT */
    .recipient-block {
      margin-bottom: 10px;
      font-size: 12px;
      line-height: 1.4;
    }
    .recipient-block p {
      margin-bottom: 2px;
    }
    .attn-line {
      margin-top: 8px;
      margin-bottom: 8px;
      font-weight: bold;
    }
    .sub-line {
      margin-top: 8px;
      margin-bottom: 8px;
      font-weight: bold;
    }
    .intro-line {
      margin-top: 6px;
      margin-bottom: 10px;
      font-size: 11.5px;
      line-height: 1.35;
    }

    /* MAIN ITEMS TABLE */
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 6px;
      margin-bottom: 12px;
      border: 1px solid #1f2937;
    }
    .items-table th, 
    .items-table td {
      border: 1px solid #374151;
      padding: 4px 4px;
      font-size: 10.5px;
      vertical-align: middle;
    }
    .items-table th {
      background-color: #e8ecf8;
      color: #000;
      font-weight: bold;
      text-align: center;
      line-height: 1.2;
    }
    .items-table tbody tr {
      background-color: #f6f8fd;
    }
    .items-table tbody tr:nth-child(even) {
      background-color: #ebf1fc;
    }
    .items-table td.center {
      text-align: center;
    }
    .items-table td.right {
      text-align: right;
      padding-right: 6px;
    }
    .items-table .total-row td {
      background-color: #e8ecf8;
      font-weight: bold;
      font-size: 11.5px;
      padding: 6px 4px;
    }
    .font-bold {
      font-weight: bold;
    }

    /* TERMS & CONDITIONS */
    .terms-section {
      margin-top: 10px;
      font-size: 11.5px;
      line-height: 1.45;
    }
    .terms-title {
      font-weight: bold;
      text-decoration: underline;
      margin-bottom: 4px;
    }
    .terms-section div {
      margin-bottom: 2px;
    }
    .term-num {
      font-style: italic;
      display: inline-block;
      width: 16px;
    }
    .term-label {
      font-weight: 500;
    }

    /* SIGNATURE SECTION */
    .signoff-section {
      margin-top: 12px;
      font-size: 11.5px;
      line-height: 1.4;
    }
    .signoff-section p {
      margin-bottom: 4px;
    }
    .sign-name {
      font-weight: bold;
      margin-top: 4px;
    }
    .sign-phone {
      font-weight: bold;
      margin-bottom: 8px;
    }
    .sign-company {
      font-weight: normal;
    }

    /* BOTTOM RED BAR & FOOTER */
    .footer-container {
      margin-top: 18px;
      width: 100%;
    }
    .red-bar {
      height: 6px;
      background-color: #d8232a;
      width: 100%;
      margin-bottom: 8px;
    }
    .footer-address {
      text-align: center;
      font-size: 10px;
      color: #000;
      line-height: 1.35;
    }
  </style>
</head>
<body>
  <div class="page-container">
    <div>
      <!-- HEADER -->
      <table class="header-table">
        <tr>
          <td class="logo-kirloskar">
            ${data.kirloskar_logo ? `<img src="${data.kirloskar_logo}" alt="Kirloskar" />` : '<div style="font-weight:bold;font-size:16px;">Kirloskar</div>'}
            <div class="tagline">Enriching Lives</div>
          </td>
          <td class="company-center">
            <div class="company-name">PAREEK POWER &amp; PUMPS (P) LTD.</div>
            <div class="company-former">(Formerly: Pareek Tractors (P) Ltd.)</div>
            <div class="company-dealer">AUTHORISED DEALER FOR KIRLOSKAR PUMPS &amp; MOTORS</div>
          </td>
          <td class="logo-pareek">
            ${data.pareek_logo ? `<img src="${data.pareek_logo}" alt="Pareek Group" />` : '<div style="font-weight:bold;font-size:16px;color:#d8232a;">PAREEK</div>'}
          </td>
        </tr>
      </table>

      <!-- QUOTATION REF & DATE -->
      <div class="meta-row">
        <table class="meta-table">
          <tr>
            <td style="text-align: left; width: 60%;">
              4PL/DPUMP/${data.quotation_number || '……'}
            </td>
            <td style="text-align: right; width: 40%;">
              Date:- ${formatDate(data.date) || '…..'}
            </td>
          </tr>
        </table>
      </div>

      <!-- RECIPIENT DETAILS -->
      <div class="recipient-block">
        <p><strong>To,</strong></p>
        <p><strong>M/s ${data.company_name || data.customer_name || '……'}</strong></p>
        <p>${data.customer_address || data.address || data.city || '……'}</p>
        
        <div class="attn-line">
          Attention:- ${data.attention_person || '……'}
        </div>

        <div class="sub-line">
          Sub: Kirloskar Make ${data.subject || '…. pump -'}
        </div>

        <div class="intro-line">
          Dear Sir,<br>
          With reference to the above subject, we are submitting our best suitable Commercial offer for ${data.offer_for || data.subject || '….. Pump'} as below.
        </div>
      </div>

      <!-- LINE ITEMS TABLE -->
      <table class="items-table">
        <thead>
          <tr>
            <th rowspan="3" style="width: 5%;">Sn<br>o.</th>
            <th rowspan="3" style="width: 20%;">Model</th>
            <th rowspan="3" style="width: 8%;">Moto<br>r<br>(HP)</th>
            <th colspan="4" style="width: 36%;">Duty Parameter</th>
            <th rowspan="3" style="width: 7%;">QTY</th>
            <th rowspan="3" style="width: 12%;">Each<br>Discounted<br>Price (Rs.)</th>
            <th rowspan="3" style="width: 12%;">Total<br>Amount Rs.</th>
          </tr>
          <tr>
            <th colspan="4">Offered</th>
          </tr>
          <tr>
            <th style="width: 9%;">Head<br>(m)</th>
            <th style="width: 9%;">Flow<br>Rate in<br>LPM</th>
            <th style="width: 9%;">SUC<br>x<br>DEL<br>Size<br>(mm)</th>
            <th style="width: 9%;">Max.<br>Solid<br>Size<br>(mm)</th>
          </tr>
        </thead>
        <tbody>
          ${renderedRows}
          ${placeholderRows}
          <tr class="total-row">
            <td colspan="9" style="text-align: right; padding-right: 15px;">TOTAL -</td>
            <td class="right">${grandTotal ? grandTotal + '/-' : '0/-'}</td>
          </tr>
        </tbody>
      </table>

      <!-- TERMS & CONDITIONS -->
      <div class="terms-section">
        <div class="terms-title">Terms &amp;Condition:-</div>
        ${termsHtml}
      </div>

      <!-- SIGNATURE / CLOSING -->
      <div class="signoff-section">
        <p>We hope, this is in line with your requirement.</p>
        <p>Yours truly,</p>
        <div class="sign-name">${data.sales_person_name || 'Puneet Choudhary'}</div>
        <div class="sign-phone">${data.sales_person_phone || '9179076660'}</div>
        <div class="sign-company">
          Pareek Power &amp; Pumps Pvt.Ltd.<br>
          Indore(M.P.)
        </div>
      </div>
    </div>

    <!-- FOOTER ADDRESS -->
    <div class="footer-container">
      <div class="red-bar"></div>
      <div class="footer-address">
        101, Block – A Radhakrishna Complex, 10/1 Manoramaganj, Geeta Bhawan Chouraha, A.B. Road ,INDORE – 452001<br>
        Ph: 249061,62,4006381,82 email:grpareek@pareekgroup.com, sales@pareekgroup.com Visit at : www.pareekgroup.com
      </div>
    </div>
  </div>
</body>
</html>`;
}
