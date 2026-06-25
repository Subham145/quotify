import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import DataTable from '../components/shared/DataTable';
import PageHeader from '../components/shared/PageHeader';
import { api } from '../api/http';
import { useAuth } from '../lib/AuthContext';

export default function Users() {

const { user } = useAuth();

const qc = useQueryClient();

const { data: users = [] } = useQuery({

queryKey:['users'],

queryFn:()=>api('/users'),

enabled:user?.role==='SuperAdmin'

});

const [form,setForm]=useState({

name:'',

email:'',

role:'User',

password:''

});

const [showPassword,setShowPassword]=useState(false);

const [editingUser,setEditingUser]=useState(null);

const [editForm,setEditForm]=useState({

name:'',

email:'',

role:'User',

password:''

});

const inviteMutation=useMutation({

mutationFn:(payload)=>

api(

'/users/invite',

{

method:'POST',

body:JSON.stringify(payload)

}

),

onSuccess:()=>{

qc.invalidateQueries({

queryKey:['users']

});

setForm({

name:'',

email:'',

role:'User',

password:''

});

}

});

const deleteMutation=useMutation({

mutationFn:(id)=>

api(

`/users/${id}`,

{

method:'DELETE'

}

),

onSuccess:()=>{

qc.invalidateQueries({

queryKey:['users']

});

}

});

const updateMutation=useMutation({

mutationFn:(payload)=>

api(

`/users/${editingUser.id}`,

{

method:'PATCH',

body:JSON.stringify(payload)

}

),

onSuccess:()=>{

qc.invalidateQueries({

queryKey:['users']

});

setEditingUser(null);

}

});

const columns=useMemo(

()=>

[

{

key:'name',

label:'Name'

},

{

key:'email',

label:'Email'

},

{

key:'role',

label:'Role'

},

{

key:'is_active',

label:'Active'

},

{

key:'actions',

label:'Actions'

}

],

[]

);

if(

user?.role!=='SuperAdmin'

){

return(

<div>

<PageHeader

title="User Management"

description="SuperAdmin only."

/>

<div className="card">

Only SuperAdmin can manage users

</div>

</div>

);

}

return(

<div className="space-y-4">

<PageHeader

title="User Management"

description="Invite users with role assignment."

/>

<form

className="card grid gap-3 md:grid-cols-5"

onSubmit={(e)=>{

e.preventDefault();

inviteMutation.mutate(

form

);

}}

>

<input

className="rounded border p-2"

placeholder="Name"

value={form.name}

onChange={(e)=>

setForm({

...form,

name:e.target.value

})

}

required

/>

<input

className="rounded border p-2"

placeholder="Email"

value={form.email}

onChange={(e)=>

setForm({

...form,

email:e.target.value

})

}

required

/>

<select

className="rounded border p-2"

value={form.role}

onChange={(e)=>

setForm({

...form,

role:e.target.value

})

}

>

<option>

User

</option>

<option>

Admin

</option>

</select>

<div className="relative">

<input

className="w-full rounded border p-2 pr-10"

placeholder="Password"

type={

showPassword

?

'text'

:

'password'

}

value={form.password}

onChange={(e)=>

setForm({

...form,

password:e.target.value

})

}

required

/>

<button

type="button"

className="absolute right-3 top-1/2 -translate-y-1/2"

onClick={()=>

setShowPassword(

!showPassword

)

}

>

👁️

</button>

</div>

<button

type="submit"

className="rounded bg-brand-600 px-3 py-2 text-white"

>

Invite

</button>

</form>

<DataTable

columns={columns}

rows={

users.map(

u=>({

...u,

is_active:

u.is_active

?

'Yes'

:

'No',

actions:

<div className="flex gap-2">

<button

type="button"

className="rounded border px-2 py-1 text-xs"

onClick={()=>{

setEditingUser(

u

);

setEditForm({

name:

u.name||'',

email:

u.email||'',

role:

u.role||'User',

password:''

});

}}

>

Edit

</button>

<button

type="button"

className="rounded border px-2 py-1 text-xs text-rose-600"

onClick={()=>{

if(

window.confirm(

'Delete this user?'

)

){

deleteMutation.mutate(

u.id

);

}

}}

>

Delete

</button>

</div>

})

)

}

/>

{

editingUser && (

<div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">

<div className="bg-white p-6 rounded-xl w-[500px]">

<h3 className="text-lg font-semibold mb-4">

Edit User

</h3>

<div className="space-y-3">

<input

className="w-full border rounded p-2"

placeholder="Name"

value={editForm.name}

onChange={(e)=>

setEditForm({

...editForm,

name:e.target.value

})

}

/>

<input

className="w-full border rounded p-2"

placeholder="Email"

value={editForm.email}

onChange={(e)=>

setEditForm({

...editForm,

email:e.target.value

})

}

/>

<select

className="w-full border rounded p-2"

value={editForm.role}

onChange={(e)=>

setEditForm({

...editForm,

role:e.target.value

})

}

>

<option>

SuperAdmin

</option>

<option>

Admin

</option>

<option>

User

</option>

</select>

<input

type="password"

className="w-full border rounded p-2"

placeholder="New Password"

value={editForm.password}

onChange={(e)=>

setEditForm({

...editForm,

password:e.target.value

})

}

/>

<div className="flex gap-2">

<button

className="bg-blue-600 text-white px-4 py-2 rounded"

onClick={()=>

updateMutation.mutate(

editForm

)

}

>

Save

</button>

<button

className="border px-4 py-2 rounded"

onClick={()=>

setEditingUser(

null

)

}

>

Cancel

</button>

</div>

</div>

</div>

</div>

)

}

</div>

);

}
