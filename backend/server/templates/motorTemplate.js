export function motorTemplate(data) {
return `
<!DOCTYPE html>

<html>

<head>

<meta charset="utf-8">

<style>

body{
font-family:Arial,sans-serif;
padding:20px;
font-size:13px;
}

.header{
text-align:center;
border-bottom:2px solid #000;
padding-bottom:10px;
margin-bottom:20px;
}

.company{
font-size:24px;
font-weight:bold;
}

table{
width:100%;
border-collapse:collapse;
margin-top:15px;
}

table th,
table td{
border:1px solid #000;
padding:8px;
}

.footer{
margin-top:30px;
}

</style>

</head>

<body>

<div style="
background:red;
color:white;
padding:15px;
font-size:30px;
font-weight:bold;
text-align:center;
">
MOTOR TEMPLATE
</div>
<div class="header">

<div class="company">

PAREEK POWER PRIVATE LIMITED

</div>

<div>

Indore, Madhya Pradesh

</div>

</div>

<p>

<b>Quotation No:</b>
${data.quotation_number}

</p>

<p>

<b>Customer:</b>
${data.customer_name}

</p>

<p>

<b>Company:</b>
${data.company_name}

</p>

<table>

<tr>
<th>S.No</th>
<th>Description</th>
<th>Qty</th>
<th>Rate</th>
<th>Total</th>
</tr>

${(data.items || [])
.map((item, index) => `
<tr>
<td>${index + 1}</td>
<td>${item.description || ''}</td>
<td>${item.qty || 0}</td>
<td>${item.rate || 0}</td>
<td>${item.line_total || 0}</td>
</tr>
`)
.join('')}

</table>

<div class="footer">

<p>

<b>Total Amount:</b>

₹ ${data.total_amount}

</p>

</div>

</body>

</html>
`;

}
