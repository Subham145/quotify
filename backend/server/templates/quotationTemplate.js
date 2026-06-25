export function quotationTemplate(data){

const items=(data.items||[])
.map((x,i)=>`

<tr>

<td>${i+1}</td>

<td>${x.model||''}</td>

<td>${x.hp||''}</td>

<td>${x.head||''}</td>

<td>${x.flow||''}</td>

<td>${x.size||''}</td>

<td>${x.qty||''}</td>

<td>${Number(x.price||0).toLocaleString()}</td>

<td>${Number(
(Number(x.qty)||0)*
(Number(x.price)||0)
).toLocaleString()}</td>

</tr>

`).join('');

return `

<!DOCTYPE html>

<html>

<head>

<style>

body{

font-family:Arial;
margin:0;
padding:40px;
font-size:13px;
line-height:1.5;

}

.header{

text-align:center;

}

.header h1{

margin:0;
font-size:28px;

}

.header p{

margin:2px 0;

}

.meta{

display:flex;
justify-content:space-between;
margin-top:30px;

}

table{

width:100%;
border-collapse:collapse;
margin-top:25px;

}

th,td{

border:1px solid black;
padding:8px;
text-align:center;

}

.footer{

margin-top:60px;

}

.address{

margin-top:40px;
border-top:1px solid black;
padding-top:10px;
text-align:center;
font-size:11px;

}

</style>

</head>

<body>

<div class="header">

<h1>

PAREEK POWER & PUMPS (P) LTD.

</h1>

<p>

(Formerly: Pareek Tractors (P) Ltd.)

</p>

<p>

AUTHORISED DEALER FOR KIRLOSKAR PUMPS & MOTORS

</p>

</div>

<div class="meta">

<div>

4PL/DPUMP/${data.quotation_number}

</div>

<div>

Date :
${data.date}

</div>

</div>

<br>

To,

<br>

${data.customer_name}

<br>

${data.company_name}

<br><br>

Attention :
${data.attention||''}

<br><br>

Sub :

${data.subject||''}

<br><br>

Dear Sir,

<br>

With reference to the above subject we are submitting our best suitable commercial offer.

<table>

<thead>

<tr>

<th>SNo</th>

<th>Model</th>

<th>Motor HP</th>

<th>Head in mtr</th>

<th>Flow Rate</th>

<th>SUC x DEL</th>

<th>Qty</th>

<th>Price</th>

<th>Total</th>

</tr>

</thead>

<tbody>

${items}

</tbody>

</table>

<div class="footer">

<b>

Terms & Conditions

</b>

<ol>

<li>
Availability – 1 week
</li>

<li>
Payment – 100% advance
</li>

<li>
Taxes – 18% GST Extra
</li>

<li>
Delivery – Ex Godown
</li>

<li>
Freight – To Pay
</li>

</ol>

<br><br>

Yours truly,

<br><br>

Rishabh Nigam

<br>

91790-76660

<br><br>

Pareek Power & Pumps Pvt Ltd

</div>

<div class="address">

101 Block-A Radhakrishna Complex,
Manoramaganj,
Indore-452001

<br>

sales@pareekgroup.com

</div>

</body>

</html>

`;

}
