import { useState } from "react";

export default function QuotationForm() {

const [rows,setRows]=useState([
{
model:"KOS 335+",
hp:"3",
head:"18-36",
flow:"4.6-2.0",
size:"50x40",
qty:"02",
price:"22820"
}
]);

return(

<div className="bg-slate-200 p-8 overflow-auto">

<div
className="
mx-auto
bg-white
shadow-lg
w-[210mm]
min-h-[297mm]
p-10
text-[13px]
leading-5
"
>

<div className="text-center">

<h1 className="text-3xl font-bold">

PAREEK POWER & PUMPS (P) LTD.

</h1>

<p>

(Formerly: Pareek Tractors (P) Ltd.)

</p>

<p className="font-medium">

AUTHORISED DEALER FOR KIRLOSKAR PUMPS & MOTORS

</p>

</div>

<div className="flex justify-between mt-10">

<div>

<p>

4PL/DPUMP/203601

</p>

</div>

<div>

Date :

<input
type="date"
className="
border-b
outline-none
ml-2
"
/>

</div>

</div>

<div className="mt-8">

<p>

To,

</p>

<input
className="
w-full
border-b
outline-none
py-1
"
placeholder="
Customer Name
"
/>

<input
className="
w-full
border-b
outline-none
py-1
mt-2
"
placeholder="
Company
"
/>

</div>

<div className="mt-5">

Attention :

<input
className="
border-b
ml-2
outline-none
w-[300px]
"
/>

</div>

<div className="mt-5">

Sub :

<input
className="
border-b
outline-none
w-full
py-1
"
placeholder="
Kirloskar Make Single Phase Open Well Submersible Pump"
/>

</div>

<p className="mt-8">

Dear Sir,

</p>

<p className="mt-2">

With reference to above subject we are submitting our best suitable commercial offer.

</p>

<table className="
w-full
border
mt-8
text-center
">

<thead>

<tr>

<th className="border p-2">
Sno
</th>

<th className="border p-2">
Model
</th>

<th className="border p-2">
Motor HP
</th>

<th className="border p-2">
Head in mtr
</th>

<th className="border p-2">
Flow Rate
</th>

<th className="border p-2">
SUC x DEL
</th>

<th className="border p-2">
Qty
</th>

<th className="border p-2">
Price
</th>

<th className="border p-2">
Total
</th>

</tr>

</thead>

<tbody>

{rows.map((r,i)=>(

<tr key={i}>

<td className="border p-2">
{i+1}
</td>

<td className="border">

<input
className="w-full p-2"
value={r.model}
/>

</td>

<td className="border">

<input
className="w-full p-2"
value={r.hp}
/>

</td>

<td className="border">

<input
className="w-full p-2"
value={r.head}
/>

</td>

<td className="border">

<input
className="w-full p-2"
value={r.flow}
/>

</td>

<td className="border">

<input
className="w-full p-2"
value={r.size}
/>

</td>

<td className="border">

<input
className="w-full p-2"
value={r.qty}
/>

</td>

<td className="border">

₹ {Number(r.price).toLocaleString()}

</td>

<td className="border">

₹ {(r.qty*r.price).toLocaleString()}

</td>

</tr>

))}

</tbody>

</table>

<div className="mt-10">

<h3 className="font-bold">

Terms & Condition:-

</h3>

<ol className="list-decimal ml-6 mt-3 space-y-1">

<li>
Availability – 1 week from PO
</li>

<li>
Payment – 100% advance
</li>

<li>
Taxes – 18% GST Extra
</li>

<li>
Offer validity – 15 days
</li>

<li>
Delivery – Ex Godown
</li>

<li>
Freight – To Pay
</li>

</ol>

</div>

<div className="mt-12">

<p>

We hope this is in line with your requirement.

</p>

<p className="mt-8">

Yours truly,

</p>

<p className="font-bold mt-4">

Rishabh Nigam

</p>

<p>

91790-76660

</p>

<p className="mt-4 font-semibold">

Pareek Power & Pumps Pvt Ltd

</p>

</div>

<div className="
border-t
mt-12
pt-4
text-center
text-xs
">

101 Block-A Radhakrishna Complex,
Manoramaganj,
Indore – 452001

<br/>

sales@pareekgroup.com

</div>

</div>

</div>

);

}
