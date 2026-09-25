import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getAssetBase64 = (filePath) => {
  try {
    const p = path.join(__dirname, '..', 'assets', filePath);
    if (fs.existsSync(p)) {
      const ext = path.extname(p).toLowerCase();
      let mime = 'image/jpeg';
      if (ext === '.png') mime = 'image/png';
      else if (ext === '.svg') mime = 'image/svg+xml';
      return `data:${mime};base64,` + fs.readFileSync(p, 'base64');
    }
  } catch (e) {
    console.error('Failed to load asset base64:', filePath, e.message);
  }
  return '';
};

export function digisetTemplate(data) {
  const formatCurrency = (val) => {
    if (val === undefined || val === null || val === '') return '';
    const num = Number(val);
    if (isNaN(num)) return val;
    return num.toLocaleString('en-IN');
  };

  const formatDate = (d) => {
    if (!d) return '……';
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

  // Pre-load all DG Set Assets
  const greavesLogo = getAssetBase64('dgset/p1_img1_350x123.png') || getAssetBase64('greaves-logo.jpg');
  const pareekLogo = getAssetBase64('dgset/p1_img2_194x79.png') || getAssetBase64('pareek-logo.jpg');
  
  const imgPoweringLives = getAssetBase64('dgset/p4_img9_167x132.jpeg');
  const imgDrivingBusiness = getAssetBase64('dgset/p4_img10_167x133.jpeg');
  const imgEnhancingProd = getAssetBase64('dgset/p4_img11_169x133.jpeg');
  const imgEnginesOfGrowth = getAssetBase64('dgset/p4_img12_169x132.jpeg');

  const imgCanopyDg = getAssetBase64('dgset/p5_img3_640x417.jpeg');
  const imgDseController = getAssetBase64('dgset/p7_img1_500x331.jpeg');

  const imgJehanNuma = getAssetBase64('dgset/p11_img2_225x225.jpeg');
  const imgChirayu = getAssetBase64('dgset/p11_img3_200x200.jpeg');
  const imgMalvi = getAssetBase64('dgset/p11_img4_243x208.png');

  const imgPosterP12 = getAssetBase64('dgset/p12_img1_812x1000.jpeg');
  const imgPosterP13 = getAssetBase64('dgset/p13_img1_812x1000.jpeg');

  const itemsList = data.items && data.items.length > 0 ? data.items : [];

  // Generate dynamic item rows for DG set pricing table
  const renderedItems = itemsList.map((item) => {
    const cf = item.custom_fields || {};
    const model = cf.model || item.model || item.product_name || item.description || 'Greaves Silent DG Set';
    const kva = cf.hp || item.hp || cf.kva || item.kva || '';
    const phase = cf.size || item.size || '3 Phase';
    const ratingStr = kva ? `${kva} ${phase}` : (item.description || 'DG Set');
    const qty = String(item.qty || 1).padStart(2, '0');

    const discountedPrice = (item.discounted_price !== undefined && item.discounted_price !== null && item.discounted_price !== '')
      ? Number(item.discounted_price)
      : (cf.discounted_price !== undefined && cf.discounted_price !== null && cf.discounted_price !== ''
          ? Number(cf.discounted_price)
          : (item.rate !== undefined && item.rate !== null && item.rate !== ''
              ? (item.discount_pct ? Number(item.rate) * (1 - Number(item.discount_pct) / 100) : Number(item.rate))
              : 0));

    const priceFormatted = discountedPrice > 0 ? formatCurrency(discountedPrice) + '/-' : (item.rate ? formatCurrency(item.rate) + '/-' : 'Call for Price');

    return `
      <tr>
        <td class="rating-cell font-bold bg-highlight">${ratingStr}</td>
        <td class="center font-bold bg-highlight">${qty}</td>
        <td class="right font-bold bg-highlight">${priceFormatted}</td>
      </tr>
    `;
  }).join('');

  // Extract KVA summary for subject/cover text
  const kvaList = itemsList.map(it => it.hp || it.custom_fields?.hp || it.model || '').filter(Boolean).join(' / ');
  const displayKva = kvaList || '....';

  // Determine Control Panel wording based on panel_type selection
  const rawPanel = (data.panel_type || '').toLowerCase();
  let panelSubject = 'STANDERD/AUTOMATIC CONTROL PANEL';
  let panelBody = 'STANDERD / AUTOMATIC CONTROL PANEL';
  let panelPriceHeader = 'STANDERD / AUTOMATIC Panel';
  let panelUnitDesc = 'STANDERD / AUTOMATIC CONTROL PANEL WITH RMU UNIT';

  if (rawPanel.includes('auto') && !rawPanel.includes('standard') && !rawPanel.includes('both')) {
    panelSubject = 'AUTOMATIC CONTROL PANEL';
    panelBody = 'AUTOMATIC CONTROL PANEL';
    panelPriceHeader = 'AUTOMATIC Panel';
    panelUnitDesc = 'AUTOMATIC CONTROL PANEL (AMF PANEL) WITH RMU UNIT';
  } else if (rawPanel.includes('standard') && !rawPanel.includes('auto') && !rawPanel.includes('both')) {
    panelSubject = 'STANDERD CONTROL PANEL';
    panelBody = 'STANDERD CONTROL PANEL';
    panelPriceHeader = 'STANDERD Panel';
    panelUnitDesc = 'STANDERD CONTROL PANEL WITH RMU UNIT';
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>DG Set Quotation - Pareek Power &amp; Pumps</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 15mm 10mm 15mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: Calibri, Arial, sans-serif;
      font-size: 13px;
      line-height: 1.4;
      color: #000;
      background: #fff;
    }
    .page {
      width: 100%;
      min-height: 275mm;
      position: relative;
      page-break-after: always;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .page:last-child {
      page-break-after: auto;
    }

    /* Common Header & Footer */
    .top-header {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
      padding-bottom: 10px;
    }
    .header-logo-left img {
      max-height: 55px;
      display: block;
    }
    .header-logo-right img {
      max-height: 50px;
      display: block;
    }
    .header-title-box {
      text-align: center;
      flex: 1;
      padding: 0 10px;
    }
    .company-name {
      font-size: 20px;
      font-weight: bold;
      color: #000;
      font-family: Arial, sans-serif;
    }
    .company-subtitle {
      font-size: 12px;
      font-weight: bold;
      color: #111;
      margin-top: 2px;
    }
    .top-brand-right {
      text-align: right;
    }
    .top-brand-right img {
      max-height: 48px;
    }

    .page-footer {
      width: 100%;
      margin-top: auto;
      padding-top: 10px;
      border-top: 1px solid #d1d5db;
      font-size: 11px;
      color: #222;
      text-align: center;
      line-height: 1.35;
    }
    .page-num {
      text-align: right;
      font-size: 11px;
      color: #008080;
      font-style: italic;
      margin-top: 5px;
    }

    /* Page 1 Specific */
    .meta-ref-date {
      margin-bottom: 15px;
      font-size: 13.5px;
    }
    .meta-ref-date .bold-line {
      font-weight: bold;
      margin-bottom: 8px;
    }
    .recipient-info {
      margin-bottom: 15px;
      font-size: 13.5px;
      line-height: 1.5;
    }
    .subject-box {
      font-weight: bold;
      text-decoration: underline;
      font-size: 13.5px;
      margin: 15px 0;
      line-height: 1.4;
    }
    .subject-box .highlight {
      background-color: #ffff00;
      text-decoration: underline;
    }
    .letter-body {
      font-size: 13.5px;
      line-height: 1.6;
      margin-bottom: 25px;
    }
    .letter-body p {
      margin-bottom: 14px;
      text-align: justify;
    }
    .sign-off-block {
      margin-top: 20px;
      font-size: 13px;
      line-height: 1.4;
    }

    /* Table Styles */
    .section-title {
      font-size: 16px;
      font-weight: bold;
      text-decoration: underline;
      margin-bottom: 15px;
    }
    .dg-price-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      border: 1px solid #000;
    }
    .dg-price-table th, .dg-price-table td {
      border: 1px solid #000;
      padding: 8px;
      font-size: 12.5px;
      vertical-align: middle;
    }
    .dg-price-table th {
      background: #f8fafc;
      font-weight: bold;
      text-align: center;
    }
    .spec-desc-box {
      font-size: 12px;
      line-height: 1.45;
      text-align: justify;
    }
    .highlight-yellow {
      background-color: #ffff66;
    }
    .bg-highlight {
      background-color: #ffff66;
    }
    .center { text-align: center; }
    .right { text-align: right; }
    .font-bold { font-weight: bold; }

    /* Terms List */
    .terms-list {
      list-style: none;
      font-size: 12px;
      line-height: 1.45;
    }
    .terms-list li {
      margin-bottom: 10px;
      padding-left: 24px;
      position: relative;
      text-align: justify;
    }
    .terms-list li::before {
      content: "➢";
      position: absolute;
      left: 0;
      color: #0284c7;
      font-size: 14px;
      font-weight: bold;
    }
    .term-title {
      font-weight: bold;
      text-decoration: underline;
    }

    /* Bank Details & Features */
    .bank-table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0 25px 0;
      border: 1px solid #000;
    }
    .bank-table td {
      border: 1px solid #000;
      padding: 7px 12px;
      font-size: 13px;
      font-weight: bold;
    }
    .bank-table td.label-col {
      width: 35%;
    }

    .feature-bullets {
      list-style: disc;
      padding-left: 20px;
      font-size: 12.5px;
      line-height: 1.5;
    }
    .feature-bullets li {
      margin-bottom: 6px;
    }

    .four-cards-grid {
      display: flex;
      gap: 12px;
      justify-content: space-between;
      margin-top: 25px;
    }
    .feature-card {
      flex: 1;
      text-align: center;
    }
    .feature-card img {
      width: 100%;
      height: 90px;
      object-fit: cover;
      border-radius: 4px;
      border: 1px solid #cbd5e1;
    }
    .feature-card-label {
      font-size: 11px;
      font-weight: bold;
      color: #0369a1;
      margin-top: 4px;
    }

    /* Parameters table for controller */
    .param-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    .param-table th {
      background: #0284c7;
      color: #fff;
      font-weight: bold;
      padding: 8px 10px;
      border: 1px solid #0284c7;
      font-size: 12px;
      text-align: left;
    }
    .param-table td {
      border: 1px solid #cbd5e1;
      padding: 8px 10px;
      font-size: 11.5px;
      vertical-align: top;
      line-height: 1.4;
      background: #f8fafc;
    }

    /* Customers List */
    .customer-list-grid {
      list-style: none;
      font-size: 12.5px;
      line-height: 1.5;
    }
    .customer-list-grid li {
      margin-bottom: 8px;
      padding-left: 22px;
      position: relative;
    }
    .customer-list-grid li::before {
      content: "➢";
      position: absolute;
      left: 0;
      color: #0284c7;
      font-size: 13px;
      font-weight: bold;
    }

    /* Posters full width */
    .poster-img {
      width: 100%;
      height: auto;
      max-height: 255mm;
      object-fit: contain;
      display: block;
      margin: 0 auto;
    }
  </style>
</head>
<body>

  <!-- ================= PAGE 1: COVER LETTER ================= -->
  <div class="page">
    <div>
      <div class="top-header">
        <div class="header-logo-left">
          ${pareekLogo ? `<img src="${pareekLogo}" alt="Pareek Group" />` : ''}
          ${greavesLogo ? `<img src="${greavesLogo}" alt="Greaves Power" style="margin-top: 5px; height: 38px;" />` : ''}
        </div>
        <div class="header-title-box">
          <div class="company-name">PAREEK POWER AND PUMPS PVT.LTD</div>
          <div class="company-subtitle">Authorized Sales Dealer - GREAVES COTTON LIMITED, PUNE</div>
        </div>
      </div>

      <div class="meta-ref-date">
        <div class="bold-line">Ref.: -4PL/DG/${data.quotation_number || '……/…'}</div>
        <div class="bold-line">Date: - ${formatDate(data.date)}</div>
      </div>

      <div class="recipient-info">
        <div><b>To,</b></div>
        <div><b>M/s ${data.company_name || data.customer_name || '……………………'}</b></div>
        <div>${data.customer_address || ''}</div>
        <div style="margin-top: 6px;"><b>Attention-Mr.- ${data.attention_person || '…………'}</b></div>
      </div>

      <div class="subject-box">
        SUB: QUOTATION FOR <span class="highlight">${displayKva} KVA 3 PHASE GREAVES COTTON ${panelSubject} SILENT D.G. SET</span>
      </div>

      <div class="letter-body">
        <p>Dear Sir,</p>
        <p>
          As discussed and desired by you, we are pleased to submit our quotation for 
          <span class="highlight" style="font-weight: bold;">${displayKva} KVA 3 Phase Greaves Cotton ${panelBody} Silent D.G. Set</span> for your favorable consideration.
        </p>
        <p>
          We believe that you will find our offer as quite attractive and cost effective to your needs.
        </p>
        <p>
          For any further clarification or details in technical or commercial, please feel free to contact us.
        </p>
        <p>
          Looking forward to receive your valuable order and serve you in all regards.
        </p>
        <p>
          Thanking you and assuring of our best services.
        </p>
      </div>

      <div class="sign-off-block">
        <div>Yours Faithfully,</div>
        <div style="margin-top: 8px;"><b>For- PAREEK POWER AND PUMPS P. LTD.</b></div>
        <div style="margin-top: 25px;"><b>(${data.sales_person_name || 'Pradeep Ghadge'})</b></div>
        <div>${data.sales_person_designation || 'Head- DG Division'}</div>
        ${data.sales_person_phone ? `<div>Mobile: ${data.sales_person_phone}</div>` : ''}
      </div>
    </div>

    <div class="page-footer">
      <div>101-A, Radhakrishna Complex, 10/1, Manoramaganj, A.B.Road, Geeta Bhawan Square, Indore- 452001</div>
      <div>Email: sales@pareekgroup.com | Phones- 0731- 4006381-82 | Mobile- 8269000495 / 9630087601</div>
    </div>
  </div>


  <!-- ================= PAGE 2: QUOTATION PRICE & SPECS ================= -->
  <div class="page">
    <div>
      <div class="top-brand-right">
        ${greavesLogo ? `<img src="${greavesLogo}" alt="Greaves Power" />` : ''}
      </div>

      <div class="section-title">Quotation Price:</div>

      <table class="dg-price-table">
        <thead>
          <tr>
            <th width="65%">Description of DG</th>
            <th width="10%">Qty</th>
            <th width="25%">Basic price<br>with ${panelPriceHeader}<br>(in Rs.) (Each)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="spec-desc-box">
              <div class="highlight-yellow" style="font-weight: bold; margin-bottom: 6px;">
                Supply of Greaves Make Silent D.G. Set (${displayKva} KVA / 3 Phase, Canopied Diesel Generator)
              </div>
              <p style="margin-bottom: 6px;">
                Set powered with Greaves Make 4/6 Cylinder inline, Bore Stroke matching rating, Radiator Cooled Greaves Engine Model, TCAC WITH Mech/G2** CLASS GOVERNOR at 0.8 power factor, at NTP Conditions, 415V, 50 Hz, coupled with 3 Phase Alternator (Leroy-Somer / Crompton Greaves / Stamford), Battery with Cables, Fuel tank, AVM Pads &amp; other Standard Accessories mentioned in our Annexure enclosed. The Silent D.G. Set will be installed with –
              </p>
              <div style="font-weight: bold; margin-top: 6px;">${panelUnitDesc}</div>
              <div style="font-weight: bold; color: #b91c1c; margin-top: 2px;">5 YEAR WARRANTY ON COMPLETE DG.</div>
            </td>
            <td></td>
            <td></td>
          </tr>
          ${renderedItems || `
            <tr>
              <td class="bg-highlight font-bold">125 KVA (4G11TAG26) 3Phase</td>
              <td class="center font-bold bg-highlight">01</td>
              <td class="right font-bold bg-highlight">10,50,000/-</td>
            </tr>
          `}
          <tr>
            <td colspan="3" class="right font-bold" style="border: none; padding-top: 10px; color: #000;">
              <span class="highlight-yellow" style="padding: 2px 6px;">(GST@18% Extra)</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="page-num">age 02</div>
  </div>


  <!-- ================= PAGE 3: TERMS & CONDITIONS ================= -->
  <div class="page">
    <div>
      <div class="top-brand-right">
        ${greavesLogo ? `<img src="${greavesLogo}" alt="Greaves Power" />` : ''}
      </div>

      <div class="section-title">COMMERCIAL TERMS AND CONDITIONS</div>

      <ul class="terms-list">
        <li>
          <span class="term-title">GST:</span> ${data.taxes_terms || '-GST@18% shall be charged extra in the above price.'}
        </li>
        <li>
          <span class="term-title">DELIVERY:</span> ${data.delivery_terms || 'Ex Godown'}
        </li>
        <li>
          <span class="term-title">WARRANTY:</span> ${data.warranty_terms || '5 Years warranty / 5000 hours subject to warranty document attached.'}
        </li>
        <li>
          <span class="term-title">FREIGHT &amp; TRANSIT INSURANCE:</span> ${data.insurance_terms || '-Freight & Transit Insurance up-to site at actual is INCLUDED in above price.'}
        </li>
        <li>
          <span class="term-title">LOADING / UNLOADING / POSITIONING OF SET AT SITE:</span> ${data.loading_terms || '– To be done by client.'}
        </li>
        <li>
          <span class="term-title">INSTALLATION:</span> ${data.installation_terms || '– In client’s scope, i.e. unloading of DG set, It’s Placement on platform, Preparation of platform, four numbers of dedicated earthing, cabling with its lugs etc. However, commissioning shall be done by us free of charge after you complete the installation work. Please note that the DG set must be commissioned within 6 months time from the date of our invoice otherwise DG Set will have to undergo a chargeable revalidation by service dealer prior to commissioning.'}
        </li>
        <li>
          <span class="term-title">PERMISSION FOR THE GENERATOR SET:</span> ${data.permission_terms || '– All necessary legal requirements / permissions should be obtained by the Buyer.'}
        </li>
        <li>
          <span class="term-title">TERMS OF PAYMENT:</span> ${data.payment_terms || '-30% advance along with the order and balance 70% against Proforma Invoice prior to dispatch of set from principal’s plant.'}
        </li>
        <li>
          <span class="term-title">VALIDITY:</span> ${data.validity_terms || '- The offer is valid for 30 Days.'}
        </li>
        <li>
          <span class="term-title">STATUTORY VARIATIONS:</span> ${data.statutory_terms || '- Presently the above taxes and duties are applicable. However, if there is any change in the taxes and duties or if any fresh taxes and duties are levied by central, state or local government the same shall be applicable at the time of invoicing to your account.'}
        </li>
        <li>
          <span class="term-title">FORCE MAJEURE CLAUSE:</span> ${data.force_majeure_terms || '- The offer shall be subjected to force majeure clause.'}
        </li>
        <li>
          <span class="term-title">ARBITRATION:</span> ${data.arbitration_terms || '- The venue of arbitration shall be INDORE for any disputes or differences arising under the terms of contract placed on the company.'}
        </li>
        <li>
          <span class="term-title">CANCELLATION OF ORDER:</span> ${data.cancellation_terms || '- In case of order cancellation 10% of total value will be levied.'}
        </li>
      </ul>
    </div>

    <div class="page-num">age 03</div>
  </div>


  <!-- ================= PAGE 4: BANK DETAILS & PROFILE ================= -->
  <div class="page">
    <div>
      <div class="top-brand-right">
        ${greavesLogo ? `<img src="${greavesLogo}" alt="Greaves Power" />` : ''}
      </div>

      <div class="section-title">OUR BANK DETAILS FOR RTGS / NEFT PAYMENT</div>

      <table class="bank-table">
        <tr>
          <td class="label-col">BANK NAME</td>
          <td>ICICI BANK</td>
        </tr>
        <tr>
          <td class="label-col">COMPANY NAME</td>
          <td>PAREEK POWER AND PUMPS P. LTD.</td>
        </tr>
        <tr>
          <td class="label-col">A/C NO.</td>
          <td>725005500236</td>
        </tr>
        <tr>
          <td class="label-col">BANK ADD.</td>
          <td>INDORE (MADHYA PRADESH)</td>
        </tr>
        <tr>
          <td class="label-col">IFSC CODE</td>
          <td>ICIC0007250</td>
        </tr>
        <tr>
          <td class="label-col">GSTIN NO.</td>
          <td>23AACCP0309E1Z5</td>
        </tr>
      </table>

      <ul class="feature-bullets">
        <li>India’s leading Engineering company with over 160 years of rich legacy</li>
        <li>Core Competencies: Generator Sets, Pump Sets, Diesel / Petrol Engines, Farm Equipments, Electric Two &amp; Three wheelers</li>
        <li>Manufacturing 5 lakh engines annually</li>
        <li>More than 85% of Diesel 3-wheelers in India run on Greaves Engines</li>
        <li>5 State-of-the-art Manufacturing Facilities spread across the country, and excellent infrastructure for R&amp;D</li>
        <li>Significant Strengths: Technology, Value, Reach</li>
        <li>Strong Team of more than 300 R&amp;D professionals</li>
        <li>Global footprint, with local presence in SAARC, Africa and Middle East</li>
      </ul>

      <div class="four-cards-grid">
        <div class="feature-card">
          ${imgPoweringLives ? `<img src="${imgPoweringLives}" alt="Powering Lives" />` : ''}
          <div class="feature-card-label">Powering Lives</div>
        </div>
        <div class="feature-card">
          ${imgDrivingBusiness ? `<img src="${imgDrivingBusiness}" alt="Driving Business" />` : ''}
          <div class="feature-card-label">Driving Business</div>
        </div>
        <div class="feature-card">
          ${imgEnhancingProd ? `<img src="${imgEnhancingProd}" alt="Enhancing Productivity" />` : ''}
          <div class="feature-card-label">Enhancing Productivity</div>
        </div>
        <div class="feature-card">
          ${imgEnginesOfGrowth ? `<img src="${imgEnginesOfGrowth}" alt="Engines of Growth" />` : ''}
          <div class="feature-card-label">Engines of Growth</div>
        </div>
      </div>
    </div>

    <div class="page-num">age 04</div>
  </div>


  <!-- ================= PAGE 5: POWER GEN BUSINESS & ENGINE FEATURES ================= -->
  <div class="page">
    <div>
      <div class="top-brand-right">
        ${greavesLogo ? `<img src="${greavesLogo}" alt="Greaves Power" />` : ''}
      </div>

      <div style="font-size: 15px; font-weight: bold; margin-bottom: 8px;">Power Gen Business</div>
      <ul class="customer-list-grid" style="font-size: 12px; margin-bottom: 15px;">
        <li>Over 5 decades of experience in generator sets</li>
        <li>Over 2 lakh plus Gensets population in operations</li>
        <li>Total solutions by single point of contact for sales, service, &amp; spare parts: anytime, anywhere</li>
        <li>Fuel efficient, Rugged and Reliable</li>
        <li>Testing facility equipped with sophisticated equipment is among the best in the Industry</li>
        <li>Testing facility to test DG sets upto 2 MW</li>
        <li>Manufacture complete DG sets, only company in India to manufacture the wide range</li>
        <li>State of the art manufacturing facilities at Chakan and Chinchwad, Pune for multicylinder higher HP engines and Gensets</li>
        <li>Segment we Serve: Real Estate, Malls, Hospitals, Hotels, Industries, Manufacturing, Engineering, Petrol Pumps, Telecom, Dairy, Food Processing, Data Centres, Textile, etc.</li>
      </ul>

      <div style="font-size: 15px; font-weight: bold; margin-bottom: 8px;">Engine Features &amp; Benefits:</div>
      <ul class="customer-list-grid" style="font-size: 12px; margin-bottom: 15px;">
        <li>Very low basic engine noise level. Contributes to bettering the statutory MoEF stipulated noise level of 75 dB(A) for the DG set</li>
        <li>Deep skirt crankcase design – High degree of rigidity and ruggedness</li>
        <li>Individual cylinder head design (45 kva onwards). Savings on maintenance, cost and time.</li>
        <li>Modular design – High degree of commonality of hardware and components over the entire range</li>
        <li>Easy accessibility to all maintenance parts</li>
        <li>Hassle free operation in low and high ambient temperature range from 0 degree to 50 degree celcius</li>
        <li>Wet liner construction eliminates time consuming and expensive block reboring during overhauls</li>
      </ul>

      ${imgCanopyDg ? `
        <div style="text-align: center; margin-top: 10px;">
          <img src="${imgCanopyDg}" alt="DG Set Canopy" style="max-width: 90%; max-height: 140px; border-radius: 4px;" />
        </div>
      ` : ''}
    </div>

    <div class="page-num">age 05</div>
  </div>


  <!-- ================= PAGE 6: ACOUSTIC ENCLOSURES & CONTROLLER ================= -->
  <div class="page">
    <div>
      <div class="top-brand-right">
        ${greavesLogo ? `<img src="${greavesLogo}" alt="Greaves Power" />` : ''}
      </div>

      <div style="font-size: 15px; font-weight: bold; margin-bottom: 8px;">DG Sets – State-of-the-Art Acoustic Enclosures:</div>
      <ul class="customer-list-grid" style="font-size: 12.5px; line-height: 1.6; margin-bottom: 25px;">
        <li>Smallest Footprint – Most compact acoustic enclosures</li>
        <li>Lowest vibrations – most suitable for Roof Top Installations</li>
        <li>CRCA sheet material processed with CNC punching / laser cutting machines to ensure precision</li>
        <li>Surface treatment with 11 tanks process to give high retention of surface finish</li>
        <li>Fully automatic Pure Polyester and UV resistance Powder Coating – Best suitable for outdoor installation and corrosive environments</li>
        <li>Water and Lube oil drain outlets located on the outer surface – Leading to ease of maintenance and cleanliness</li>
        <li>Toughened glass inspection window for clear view of control panel</li>
        <li>Silencer inside in most of the range lowering the height of gensets</li>
        <li>Acoustic enclosures with fire retardant Foam / Rock wool material conforming to IS 7888 / IS 8183</li>
      </ul>

      <div style="font-size: 15px; font-weight: bold; margin-bottom: 8px;">Integrated DG Set Controller:</div>
      <ul class="customer-list-grid" style="font-size: 12.5px; line-height: 1.6;">
        <li>Deepsea, made in UK, integrated DG set controller incorporates both engine and alternator parameters in one console.</li>
        <li>The microprocessor based controller provides the most exhaustive display of critical engine and alternator performance parameters with reliable alarm and safety features</li>
      </ul>
    </div>

    <div class="page-num">age 06</div>
  </div>


  <!-- ================= PAGE 7: CONTROLLER PARAMETERS ================= -->
  <div class="page">
    <div>
      <div class="top-brand-right">
        ${greavesLogo ? `<img src="${greavesLogo}" alt="Greaves Power" />` : ''}
      </div>

      <table class="param-table">
        <thead>
          <tr>
            <th width="33%">Display Parameters</th>
            <th width="33%">Audio-Visual Warning</th>
            <th width="34%">Shut-down with<br>Audio-Visual Annunciation</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <b>Engine:</b> RPM, Oil Pressure, Coolant Temp, Fuel level %, Battery Voltage.<br><br>
              <b>DG set:</b> Hours run, Gen. volts (L-N, L-L) Gen. Current (Amps), kW, PF &amp; kWHr
            </td>
            <td>
              Low oil pressure,<br>
              High coolant temperature,<br>
              Low battery voltage,<br>
              Low fuel level
            </td>
            <td>
              Low oil pressure, High coolant temperature, Engine over speed, Engine under speed, Under voltage, Over voltage, Over frequency, Under frequency, Low water level*, High canopy temp*
            </td>
          </tr>
        </tbody>
      </table>

      ${imgDseController ? `
        <div style="text-align: center; margin-top: 30px;">
          <img src="${imgDseController}" alt="Deep Sea Electronics Controller" style="max-width: 85%; max-height: 220px; border-radius: 6px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);" />
        </div>
      ` : ''}
    </div>

    <div class="page-num">age 07</div>
  </div>


  <!-- ================= PAGE 8: CUSTOMERS LIST 1 ================= -->
  <div class="page">
    <div>
      <div class="top-brand-right">
        ${greavesLogo ? `<img src="${greavesLogo}" alt="Greaves Power" />` : ''}
      </div>

      <div class="section-title">LIST OF ESTEEMED CUSTOMERS IN MP</div>

      <ul class="customer-list-grid" style="font-size: 13px; line-height: 1.7;">
        <li>PD Agrawal Infra P. Ltd, Indore – 500 KVA (Allen Coaching Institute)</li>
        <li>Empire House (D &amp; D Venture), Indore – 320 KVA</li>
        <li>Tata Croma Showroom Sapna Sangeeta Road, Indore – 200 &amp; 160 KVA</li>
        <li>Mittal Corp Limited (Krishaangi Agro Foods), Indore – 200 KVA</li>
        <li>Capital Constructions Pvt Ltd. Indore – 82.5 and 40 KVA</li>
        <li>Siddhivinayak Hospital, Jhabua – 62.5 KVA</li>
        <li>Satguru Milk Products, Indore – 62.5 KVA</li>
        <li>Mann Holiday Resorts, Burhanpur – 400 KVA</li>
        <li>Sunder Maa Saraf Hospital, Khargone – 200 KVA</li>
        <li>B.L. Jain, Indore- 200 KVA</li>
        <li>Patel Motors (Indore) Pvt. Ltd, Indore - 200 KVA</li>
        <li>Agnimitra, Indore – 125 KVA</li>
        <li>Ankur Rehab Center, Dharampuri- 100 KVA</li>
        <li>Medioint Life Sciences P Ltd, Indore – 125 KVA</li>
        <li>Astron Hotel, Indore – 82.5 KVA</li>
      </ul>
    </div>

    <div class="page-num">age 08</div>
  </div>


  <!-- ================= PAGE 9: CUSTOMERS LIST 2 ================= -->
  <div class="page">
    <div>
      <div class="top-brand-right">
        ${greavesLogo ? `<img src="${greavesLogo}" alt="Greaves Power" />` : ''}
      </div>

      <ul class="customer-list-grid" style="font-size: 13px; line-height: 1.7; margin-top: 10px;">
        <li>Hotel Step Inn, Khandwa – 125 KVA</li>
        <li>Nandanagar Bima Hospital, - 320 KVA</li>
        <li>Candytoy Corporate P Ltd, Indore – 62.5 KVA ( At MD’s Bunglow)</li>
        <li>Sanghvi Foods P. Ltd, Dewas- 82.5 KVA ( At MD’s Bunglow in Indore)</li>
        <li>Mountain High Restaurant, Pune – 82.5 KVA</li>
        <li>Hotel President Park – 125 kva</li>
        <li>Utsav Resort, Indore – 125 kva</li>
        <li>Pushapkunj Hospital, Indore – 25 KVA</li>
        <li>Sendhwa Public School, Sendhwa – 30 KVA</li>
        <li>Jain Petroleum, Khandwa – 15 KVA</li>
        <li>Red Cross Hospital, Dewas – 20 KVA</li>
        <li>Sairaj Hotel, Jaora – 30 KVA</li>
        <li>Tirupati Construction, Khandwa – 30 KVA X 2 Nos.</li>
        <li>Chandrakamal Milk &amp; Milk Products, Dewas – 30 KVA</li>
        <li>Choksi Jewellers, Barwani – 40 KVA</li>
        <li>Gopal Milk Products, Tarana – 40 KVA</li>
        <li>Sahil Kisan Sewa Kendra, Meghnagar – 15 KVA</li>
        <li>Narmada Kiran Hospital, Indore – 62.5 KVA</li>
        <li>Shree Bharat Enterprises, Jhabua – 40 KVA</li>
      </ul>
    </div>

    <div class="page-num">age 09</div>
  </div>


  <!-- ================= PAGE 10: CUSTOMERS LIST 3 ================= -->
  <div class="page">
    <div>
      <div class="top-brand-right">
        ${greavesLogo ? `<img src="${greavesLogo}" alt="Greaves Power" />` : ''}
      </div>

      <ul class="customer-list-grid" style="font-size: 13px; line-height: 1.7; margin-top: 10px;">
        <li>Murti Radio &amp; Electric Service , Indore – 20 KVA</li>
        <li>Hotel Ginger – 400 kva</li>
        <li>Sienna Simmcha – x2 units; 160 &amp; 62.5 KVA</li>
        <li>Railway Station, Indore – 250 kva AMF</li>
        <li>Tiagra Water Treatment Plant – 500 kva</li>
        <li>Index Medical College, Ujjain – 500 KVA</li>
        <li>BSNL – Meghdoot Garden Indore – 400 kva</li>
        <li>BSF TSU – Tekanpur – 250 kva</li>
        <li>Raj Express, printing unit – 500 kva</li>
        <li>IOCL Depot &amp; Gas Station, Indore – 250 kva &amp; F.E.</li>
        <li>HPCL Depot &amp; Gas Station, Indore – 400, 250 kva &amp; F.E.</li>
        <li>DRDO – 500 &amp; 320 kva</li>
        <li>Air force School – 200 &amp; 250 kva</li>
        <li>Datia Medical College – 1010 kva</li>
        <li>Vedant Diagnostic Center, Ujjain – 30 KVA</li>
        <li>Darsh Hospital, Indore – 40 KVA</li>
        <li>Sarvam Hospital, Indore – 40 KVA</li>
        <li>Aarogyam Hospital, Khargone – 125 KVA</li>
      </ul>
    </div>

    <div class="page-num">age 10</div>
  </div>


  <!-- ================= PAGE 11: CUSTOMERS LIST 4 & CLIENT LOGOS ================= -->
  <div class="page">
    <div>
      <div class="top-brand-right">
        ${greavesLogo ? `<img src="${greavesLogo}" alt="Greaves Power" />` : ''}
      </div>

      <div style="display: flex; justify-content: space-around; align-items: center; margin: 15px 0 25px 0;">
        ${imgJehanNuma ? `<img src="${imgJehanNuma}" alt="Jehan Numa" style="height: 60px;" />` : ''}
        ${imgChirayu ? `<img src="${imgChirayu}" alt="Chirayu Medical College" style="height: 60px;" />` : ''}
        ${imgMalvi ? `<img src="${imgMalvi}" alt="Malvi Hospital" style="height: 55px;" />` : ''}
      </div>

      <ul class="customer-list-grid" style="font-size: 13px; line-height: 1.8;">
        <li>Somanipuram, Khandwa Road, Indore – 62.5 kva</li>
        <li>9th Mile Resort, Khandwa Road, Indore – x2 UNITS 125 kva</li>
        <li>Jehan Numa Hotel – 10 DG sets of different ratings</li>
        <li>Clark’s Resort, Sehore – 2x 200 &amp; 125 kva</li>
        <li>Malviya Hospital, Hoshangabad – 125 kva &amp; 200 kva</li>
        <li>NHDC Omkaleshwar – 2 x 500 kva</li>
        <li>HPCL Bhitoni - 500 kva; 250 kva; 200 kva</li>
        <li>Reliance Petrol Pumps – 28 DG sets at different locations in M.P.</li>
        <li>Reliance Smart / Trends – 14 DG sets at different locations in M.P.</li>
        <li>Datial Medical College – 1010 kva</li>
        <li>MP Tourism – 10 DG sets at different locations in M.P.</li>
      </ul>
    </div>

    <div class="page-num">age 11</div>
  </div>


  <!-- ================= PAGE 12: POSTER BROCHURE 1 ================= -->
  <div class="page" style="justify-content: center; align-items: center;">
    ${imgPosterP12 ? `
      <img src="${imgPosterP12}" class="poster-img" alt="Greaves Powering Progress" />
    ` : `
      <div style="text-align: center; padding: 40px;">
        <h2 style="font-size: 24px; color: #0284c7;">Smart Cities Smarter Solutions</h2>
        <h1 style="font-size: 32px; font-weight: bold; margin: 15px 0;">Powering Progress</h1>
        <p style="font-size: 16px;">Portable &amp; Industrial Generator Sets (5kVA - 1250kVA)</p>
      </div>
    `}
    <div class="page-num" style="width: 100%;">age 12</div>
  </div>


  <!-- ================= PAGE 13: POSTER BROCHURE 2 ================= -->
  <div class="page" style="justify-content: center; align-items: center;">
    ${imgPosterP13 ? `
      <img src="${imgPosterP13}" class="poster-img" alt="Greaves Do More Get More Live More" />
    ` : `
      <div style="text-align: center; padding: 40px;">
        <h1 style="font-size: 40px; font-weight: 900; color: #0369a1; letter-spacing: 2px;">GREAVES</h1>
        <h2 style="font-size: 28px; font-weight: bold; margin: 20px 0;">DO MORE. GET MORE. LIVE MORE.</h2>
        <h3 style="font-size: 22px; color: #64748b;">MORE TO LIFE</h3>
      </div>
    `}
    <div class="page-num" style="width: 100%;">age 13</div>
  </div>

</body>
</html>
`;
}
