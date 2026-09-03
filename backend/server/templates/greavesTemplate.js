export function greavesTemplate(data) {
  const items = (data.items || [])
    .map(
      (item, i) => `
<tr>
<td>${String(i + 1).padStart(2, '0')}</td>
<td>${item.qty || ''}</td>
<td style="text-align:left">${item.description || ''}</td>
<td>${Number(item.rate || 0).toLocaleString('en-IN')}/-</td>
<td>${Number(item.line_total || 0).toLocaleString('en-IN')}/-</td>
</tr>`
    )
    .join('');

  const defaultTerms =
    'GST: GST@18% is EXTRA in the above price. DELIVERY: Within 3-4 weeks after 100% payment. ' +
    'WARRANTY: 5 Years warranty / 5000 hours subject to warranty document attached. ' +
    'FREIGHT & TRANSIT INSURANCE: Freight & Transit Insurance up-to site at actual is INCLUDED in above price. ' +
    'LOADING / UNLOADING / POSITIONING OF SET AT SITE: To be done by client. ' +
    'INSTALLATION: In client’s scope, i.e. unloading of the set, its placement on platform, preparation of platform, dedicated earthing, cabling with lugs etc. Commissioning shall be done by us free of charge after you complete the installation work. ' +
    'PERMISSION: All necessary legal requirements/permissions should be obtained by the Buyer. ' +
    'TERMS OF PAYMENT: 30% advance along with the order and balance 70% against Proforma Invoice prior to dispatch. ' +
    'VALIDITY: Offer is valid for 30 days. ' +
    'STATUTORY VARIATIONS: Applicable taxes/duties may change and shall apply at the time of invoicing. ' +
    'FORCE MAJEURE: The offer is subject to force majeure clause. ' +
    'ARBITRATION: The venue of arbitration shall be Indore. ' +
    'CANCELLATION OF ORDER: In case of order cancellation 10% of total value will be levied.';

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
body{
  font-family: Arial, sans-serif;
  font-size:11.5px;
  padding:20px;
  color:#000;
}
.logo-row{ width:100%; margin-bottom:15px; }
.logo-row td{ border:none; vertical-align:middle; }
.logo-left img{ height:65px; }
.logo-right img{ height:55px; }
.logo-center{ text-align:center; }
.company-title{ font-size:19px; font-weight:bold; }
.company-sub{ font-size:12px; font-weight:bold; }
.ref-table{ width:100%; border-collapse:collapse; margin-top:10px; margin-bottom:10px; }
.ref-table td{ border:1px solid #000; padding:5px; }
.quote-title{
  text-align:center;
  font-weight:bold;
  margin-top:15px;
  font-size:13px;
}
.description{ margin-top:10px; text-align:justify; }
.main-table{ width:100%; border-collapse:collapse; margin-top:15px; }
.main-table th, .main-table td{ border:1px solid #000; padding:6px; font-size:10.5px; text-align:center; }
.main-table th{ background:#f2f2f2; }
.terms{
  margin-top:15px;
  border:1px solid #000;
  padding:8px;
  text-align:justify;
  font-size:10px;
}
.terms b{ display:block; text-align:center; margin-bottom:6px; }
.bank-row{ width:100%; margin-top:15px; }
.bank-row td{ vertical-align:top; padding:5px; font-size:10.5px; }
.signature{ margin-top:10px; }
</style>
</head>
<body>

<table class="logo-row">
<tr>
<td class="logo-left" width="20%">
<img src="${data.greaves_logo || ''}" />
</td>
<td class="logo-center" width="60%">
<div class="company-title">PAREEK POWER &amp; PUMPS (P) LTD.</div>
<div class="company-sub">(Formerly: Pareek Tractors (P) Ltd.)</div>
<div class="company-sub">AUTHORISED DEALER GREAVES COTTON SILENT DIESEL GENERATOR SETS</div>
</td>
<td class="logo-right" width="20%" align="right">
<img src="${data.pareek_logo || ''}" />
</td>
</tr>
</table>

<table class="ref-table">
<tr>
<td rowspan="3">
<b>Company's Name:</b> ${data.company_name || ''}<br>
<b>Attention:</b> ${data.attention_person || ''}
</td>
<td><b>Our Ref</b></td>
<td>4PL/DG/${data.quotation_number || ''}</td>
</tr>
<tr>
<td><b>Date</b></td>
<td>${data.date || ''}</td>
</tr>
<tr>
<td><b>Enquiry Ref.</b></td>
<td>${data.enquiry_ref || 'On Call'}</td>
</tr>
</table>

<p class="quote-title">${data.subject || 'QUOTATION'}</p>

<p class="description">${data.notes || ''}</p>

<table class="main-table">
<tr>
<th>S. No</th>
<th>Qty</th>
<th>Description / Rating</th>
<th>Price (Each)</th>
<th>Price (Total)</th>
</tr>
${items}
</table>

<div class="terms">
<b>COMMERCIAL TERMS AND CONDITIONS</b>
${data.terms_conditions || defaultTerms}
</div>

<table class="bank-row">
<tr>
<td width="60%">
<b>Company Bank Details:</b> Kotak Mahindra Bank, 205-The Grace, Kibe Compound, Shreemaya Square, Indore – 452001.
Account No.: 9893375656, IFSC Code: KKBK0005951
</td>
<td width="40%">
<div class="signature">
Yours Sincerely,
<br><br>
<b>For Pareek Power &amp; Pumps Pvt. Ltd.</b>
</div>
</td>
</tr>
</table>

</body>
</html>
`;
}
