export function baerlocherTemplate(data) {
  const items = (data.items || [])
    .map(
      (item) => `
<tr>
<td>${data.application || ''}</td>
<td>${data.flow || ''}</td>
<td>${item.head || data.head || ''}</td>
<td style="text-align:left">${item.description || ''}</td>
<td>${item.qty || ''}</td>
<td>${Number(item.rate || 0).toLocaleString('en-IN')}/-</td>
<td>${Number(item.line_total || 0).toLocaleString('en-IN')}/-</td>
</tr>`
    )
    .join('');

  const terms = (data.terms_conditions || '')
    .split('\n')
    .filter(Boolean);

  const termsList = (terms.length
    ? terms
    : [
        'Availability – 6-8 weeks from the receipt of PO.',
        'Payment- 30% advance along with PO, balance 70% along with PI before dispatch.',
        'Taxes - GST 18% extra at actual.',
        'Delivery– Ex Our Godown, Indore.',
        'Freight – To Pay.'
      ]
  )
    .map((t) => `<li>${t}</li>`)
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
body{
  font-family: Arial, sans-serif;
  font-size:12px;
  padding:20px;
  color:#000;
}
.logo-row{
  width:100%;
  margin-bottom:15px;
}
.logo-row td{
  border:none;
  vertical-align:middle;
}
.logo-left img{ height:60px; }
.logo-right img{ height:70px; }
.logo-center{ text-align:center; }
.company-title{ font-size:20px; font-weight:bold; }
.company-sub{ font-size:13px; font-weight:bold; }
.ref-table{ width:100%; margin-top:10px; margin-bottom:10px; }
.ref-table td{ padding:4px; }
.main-table{ width:100%; border-collapse:collapse; margin-top:15px; }
.main-table th, .main-table td{ border:1px solid #000; padding:6px; font-size:10.5px; text-align:center; }
.main-table th{ background:#f2f2f2; }
.terms{ margin-top:20px; }
.terms ol{ margin-top:8px; padding-left:20px; }
.terms li{ margin-bottom:4px; }
.footer{ margin-top:25px; }
.signature{ margin-top:30px; }
.address{
  margin-top:30px;
  border-top:1px solid black;
  padding-top:8px;
  text-align:center;
  font-size:10.5px;
}
.small{ font-size:11px; }
</style>
</head>
<body>

<table class="logo-row">
<tr>
<td class="logo-left" width="20%">
<img src="${data.kirloskar_logo || ''}" />
</td>
<td class="logo-center" width="60%">
<div class="company-title">PAREEK POWER &amp; PUMPS (P) LTD.</div>
<div class="company-sub">(Formerly: Pareek Tractors (P) Ltd.)</div>
<div class="company-sub">AUTHORISED DEALER FOR KIRLOSKAR PUMPS &amp; MOTORS</div>
</td>
<td class="logo-right" width="20%" align="right">
<img src="${data.pareek_logo || ''}" />
</td>
</tr>
</table>

<table class="ref-table">
<tr>
<td><b>Quotation No:</b> 4PL/W.PUMP/${data.quotation_number || ''}</td>
<td align="right"><b>Date:</b> ${data.date || ''}</td>
</tr>
</table>

<p>
To,<br>
<b>${data.customer_name || ''}</b><br>
${data.company_name || ''}
</p>

<p><b>Attention:</b> ${data.attention_person || ''}</p>

<p><b>Sub:</b> ${data.subject || 'Kirloskar make End Suction Pump.'}</p>

<p>
Dear Sir,<br>
With reference to the above subject, we are submitting our best suitable Techno-Commercial offer for Kirloskar make End Suction Pump Model as below.
</p>

<table class="main-table">
<tr>
<th>Application</th>
<th>Flow m3/hr</th>
<th>Head (m)</th>
<th>Pump Model</th>
<th>Qty</th>
<th>Each Discounted Price (Rs.)</th>
<th>Total Amount (Rs.)</th>
</tr>
${items}
</table>

<p class="small">
<b>Note</b> – Installation is not in our scope and accessories should be extra at actual.
</p>

<div class="terms">
<b>Terms &amp; Condition:-</b>
<ol>
${termsList}
</ol>
</div>

<div class="footer">
<p>We hope, this is in line with your requirement.</p>
<div class="signature">
Yours truly,
<br><br>
<b>For Pareek Power &amp; Pumps Pvt. Ltd.</b>
<br>
Indore (M.P.)
</div>
</div>

<div class="address">
101, Block-A Radhakrishna Complex, 10/1 Manoramaganj, Geeta Bhawan Chouraha, A.B. Road, Indore – 452001
<br>
Ph: 0731-4006381, 82 &nbsp;|&nbsp; Email: sales@pareekgroup.com &nbsp;|&nbsp; www.pareekgroup.com
</div>

</body>
</html>
`;
}
