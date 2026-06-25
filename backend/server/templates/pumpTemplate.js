export function pumpTemplate(data) {
return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">

<style>
body{
  font-family: Arial,sans-serif;
  font-size:12px;
  padding:20px;
  color:#000;
}

.header{
  text-align:center;
  margin-bottom:15px;
}

.company-title{
  font-size:20px;
  font-weight:bold;
}

.company-sub{
  font-size:13px;
  font-weight:bold;
}
.logo-row{
  width:100%;
  margin-bottom:15px;
}

.logo-row td{
  border:none;
  vertical-align:middle;
}

.logo-left img{
  height:60px;
}

.logo-right img{
  height:70px;
}

.logo-center{
  text-align:center;
}

.ref-table{
  width:100%;
  margin-top:10px;
  margin-bottom:10px;
}

.ref-table td{
  padding:4px;
}

.main-table{
  width:100%;
  border-collapse:collapse;
  margin-top:15px;
}

.main-table th,
.main-table td{
  border:1px solid #000;
  padding:6px;
  font-size:10px;
  text-align:center;
}

.main-table th{
  background:#f2f2f2;
}

.terms{
  margin-top:20px;
}

.terms ol{
  margin-top:8px;
  padding-left:20px;
}

.terms li{
  margin-bottom:4px;
}

.footer{
  margin-top:25px;
}

.signature{
  margin-top:30px;
}

.small{
  font-size:11px;
}
</style>

</head>
<body>

<table class="logo-row">
<tr>

<td class="logo-left" width="20%">
<img src="${data.kirloskar_logo}" />
</td>

<td class="logo-center" width="60%">

<div class="company-title">
PAREEK POWER & PUMPS (P) LTD.
</div>

<div class="company-sub">
(Formerly: Pareek Tractors Pvt. Ltd.)
</div>

<div class="company-sub">
AUTHORISED DEALER FOR KIRLOSKAR PUMPS & MOTORS
</div>

</td>

<td class="logo-right" width="20%" align="right">
<img src="${data.pareek_logo}" />
</td>

</tr>
</table>

<table class="ref-table">
<tr>
<td>
<b>Quotation No:</b>
${data.quotation_number}
</td>

<td align="right">
<b>Date:</b>
${data.date || ''}
</td>
</tr>
</table>

<p>
To,<br>
<b>${data.customer_name || ''}</b><br>
${data.company_name || ''}
</p>

<p>
<b>Attention:</b>
${data.attention_person || ''}
</p>

<p>
<b>Sub:</b>
${data.subject || 'Kirloskar Make Pump'}
</p>

<p>
Dear Sir,<br>
With reference to the above subject, we are pleased to submit our techno-commercial offer.
</p>

<table class="main-table">

<tr>
<th>Application</th>
<th>Flow</th>
<th>Head</th>
<th>Pump Model</th>
<th>Motor HP</th>
<th>Flow Rate</th>
<th>SUC x DEL</th>
<th>Description</th>
<th>Qty</th>
<th>Price</th>
<th>Total</th>
</tr>

${(data.items || []).map(item => `
<tr>

<td>
${data.application || ''}
</td>

<td>
${data.flow || ''}
</td>

<td>
${item.head || data.head || ''}
</td>

<td>
${item.model || ''}
</td>

<td>
${item.motor_hp || ''}
</td>

<td>
${item.flow_rate || ''}
</td>

<td>
${item.size || ''}
</td>

<td>
${item.description || ''}
</td>

<td>
${item.qty || ''}
</td>

<td>
₹ ${Number(item.rate || 0).toLocaleString('en-IN')}
</td>

<td>
₹ ${Number(item.line_total || 0).toLocaleString('en-IN')}
</td>

</tr>
`).join('')}

</table>

<br>

<table class="ref-table">

<tr>
<td align="right">
<b>Subtotal :</b>
</td>

<td width="150">
₹ ${Number(data.subtotal || 0).toLocaleString('en-IN')}
</td>
</tr>

<tr>
<td align="right">
<b>GST :</b>
</td>

<td>
₹ ${Number(data.total_gst || 0).toLocaleString('en-IN')}
</td>
</tr>

<tr>
<td align="right">
<b>Grand Total :</b>
</td>

<td>
<b>
₹ ${Number(data.total_amount || 0).toLocaleString('en-IN')}
</b>
</td>
</tr>

</table>

<p class="small">
<b>Note:</b>
Installation is not in our scope and accessories will be charged extra if applicable.
</p>

<div class="terms">

<b>Terms & Conditions</b>

<ol>
${
(data.terms_conditions || '')
.split('\n')
.filter(Boolean)
.map(term => `<li>${term}</li>`)
.join('')
}
</ol>

</div>

<div class="footer">

<p>
We hope this offer meets your requirement.
</p>

<div class="signature">

Yours truly,

<br><br>

<b>Pareek Power & Pumps Pvt. Ltd.</b>

<br>

Indore (M.P.)

</div>

</div>

</body>
</html>
`;
}
