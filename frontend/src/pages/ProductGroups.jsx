import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import DataTable from '../components/shared/DataTable';
import PageHeader from '../components/shared/PageHeader';
import { api } from '../api/http';

export default function ProductGroups() {

const qc = useQueryClient();

const { data: groups=[] } = useQuery({
  queryKey:['product-groups'],
  queryFn:()=>api('/product-groups')
});

const { data: subgroups=[] } = useQuery({
  queryKey:['product-subgroups'],
  queryFn:()=>api('/product-subgroups')
});

const [groupName,setGroupName]=useState('');

const [subgroupName,setSubgroupName]=useState('');

const [parentGroup,setParentGroup]=useState('');

const createGroup=useMutation({
mutationFn:(name)=>
api(
'/product-groups',
{
method:'POST',
body:JSON.stringify({
group_name:name
})
}
),

onSuccess:()=>{
qc.invalidateQueries({
queryKey:['product-groups']
});

setGroupName('');
}
});

const createSubgroup=useMutation({
mutationFn:()=>
api(
'/product-subgroups',
{
method:'POST',

body:JSON.stringify({

subgroup_name:
subgroupName,

group_id:
Number(
parentGroup
)

})
}
),

onSuccess:()=>{

qc.invalidateQueries({
queryKey:[
'product-subgroups'
]
});

setSubgroupName('');

}
});

const columns=useMemo(
()=>[
{
key:'group_name',
label:'Group'
},

{
key:'product_count',
label:'Products'
}
],
[]
);

const subgroupColumns=useMemo(
()=>[
{
key:'subgroup_name',
label:'SubGroup'
},

{
key:'group_name',
label:'Parent Group'
}
],
[]
);

return(

<div className="space-y-4">

<PageHeader
title="Product Groups"
description="
Create Groups &
SubGroups
"
/>

<form

className="
card
flex
gap-2
"

onSubmit={e=>{

e.preventDefault();

if(groupName)

createGroup
.mutate(
groupName
);

}}

>

<input

className="
w-full
rounded
border
p-2
"

placeholder="
Group name
"

value={
groupName
}

onChange={e=>

setGroupName(
e.target.value
)

}

/>

<button
className="
rounded
bg-brand-600
px-3
text-white
"
>

Add Group

</button>

</form>


<form

className="
card
grid
grid-cols-3
gap-2
"

onSubmit={e=>{

e.preventDefault();

if(
subgroupName
&&
parentGroup
)

createSubgroup
.mutate();

}}

>

<input

className="
rounded
border
p-2
"

placeholder="
SubGroup name
"

value={
subgroupName
}

onChange={e=>

setSubgroupName(
e.target.value
)

}

/>

<select

className="
rounded
border
p-2
"

value={
parentGroup
}

onChange={e=>

setParentGroup(
e.target.value
)

}

>

<option value="">
Select Group
</option>

{

groups.map(
g=>

<option
key={g.id}
value={g.id}
>

{g.group_name}

</option>

)

}

</select>

<button

className="
rounded
bg-brand-600
text-white
"

>

Add SubGroup

</button>

</form>

<DataTable
columns={columns}
rows={groups}
/>

<DataTable
columns={subgroupColumns}
rows={subgroups}
/>

</div>

);

}

