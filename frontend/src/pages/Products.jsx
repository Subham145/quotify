import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import DataTable from '../components/shared/DataTable';
import PageHeader from '../components/shared/PageHeader';
import { api } from '../api/http';

export default function Products() {
  const qc = useQueryClient();
  const [groupFilter, setGroupFilter] = useState('');

  // ✅ GROUPS (SAFE)
  const { data: groupsRaw } = useQuery({
    queryKey: ['product-groups'],
    queryFn: () => api('/product-groups'),
  });

const { data: subGroupsRaw } = useQuery({
  queryKey: ['product-subgroups'],
  queryFn: () => api('/product-subgroups'),
});

const subGroups = Array.isArray(subGroupsRaw)
  ? subGroupsRaw
  : Array.isArray(subGroupsRaw?.data)
  ? subGroupsRaw.data
  : [];

  const groups = Array.isArray(groupsRaw)
    ? groupsRaw
    : Array.isArray(groupsRaw?.data)
    ? groupsRaw.data
    : [];

  // ✅ PRODUCTS (SAFE)
  const { data: productsRaw } = useQuery({
    queryKey: ['products', groupFilter],
    queryFn: () =>
      api(groupFilter ? '/products?group_id=' + groupFilter : '/products'),
  });

  const products = Array.isArray(productsRaw)
    ? productsRaw
    : Array.isArray(productsRaw?.data)
    ? productsRaw.data
    : [];

const [form, setForm] = useState({
  product_name: '',
  code: '',
  group_id: '',
  subgroup_id: '',
  price: 0,
  gst_rate: 18,
  unit: 'piece',
});
  const createMutation = useMutation({
    mutationFn: (payload) =>
      api('/products', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      setForm({
        product_name: '',
        code: '',
        group_id: '',
        price: 0,
        gst_rate: 18,
        unit: 'piece',
      });
    },
  });

  const columns = useMemo(
    () => [
      { key: 'product_name', label: 'Product' },
      { key: 'code', label: 'Code' },
      { key: 'group_name', label: 'Group' },
      { key: 'subgroup_name', label: 'Sub Group' },
      { key: 'price', label: 'Price' },
      { key: 'gst_rate', label: 'GST %' },
      { key: 'unit', label: 'Unit' },
    ],
    []
  );

  // ✅ SAFE ROWS
  const rows = (Array.isArray(products) ? products : []).map((p) => ({
    ...p,
  }));

  return (
    <div className="space-y-4">
      <PageHeader
        title="Products & Services"
        description="Catalog, group filter and CSV export."
      />

      <form
        className="card space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
createMutation.mutate({
  ...form,
  group_id: form.group_id ? Number(form.group_id) : null,
  subgroup_id: form.subgroup_id ? Number(form.subgroup_id) : null,
});
        }}
      >
        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">Product Name</label>
            <input
              className="w-full rounded border p-2"
              placeholder="e.g., Cotton T-Shirt"
              value={form.product_name}
              onChange={(e) =>
                setForm({ ...form, product_name: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Product Code</label>
            <input
              className="w-full rounded border p-2"
              placeholder="e.g., CT-001"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Price (Rs.)</label>
            <input
              className="w-full rounded border p-2"
              type="number"
              placeholder="e.g., 500"
              value={form.price}
              onChange={(e) =>
                setForm({ ...form, price: Number(e.target.value) })
              }
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">GST Rate (%)</label>
            <input
              className="w-full rounded border p-2"
              type="number"
              placeholder="e.g., 18"
              value={form.gst_rate}
              onChange={(e) =>
                setForm({ ...form, gst_rate: Number(e.target.value) })
              }
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Product Group</label>
            <select
              className="w-full rounded border p-2"
              value={form.group_id}
              onChange={(e) =>
                setForm({ ...form, group_id: e.target.value })
              }
            >
              <option value="">Select Group</option>
              {(Array.isArray(groups) ? groups : []).map((g) => (
                <option key={g.id} value={g.id}>
                  {g.group_name}
                </option>
              ))}
            </select>
          </div>
            
           <div className="space-y-1">
  <label className="text-sm font-medium">
    Product SubGroup
  </label>

  <select
    className="w-full rounded border p-2"
    value={form.subgroup_id}
    onChange={(e)=>
      setForm({
        ...form,
        subgroup_id:e.target.value
      })
    }
  >

    <option value="">
      Select SubGroup
    </option>

    {subGroups
      .filter(
        s =>
          Number(s.group_id) ===
          Number(form.group_id)
      )
      .map(s => (

      <option
        key={s.id}
        value={s.id}
      >

        {s.subgroup_name}

      </option>

    ))}

  </select>

</div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Unit</label>
            <select
              className="w-full rounded border p-2"
              value={form.unit}
              onChange={(e) =>
                setForm({ ...form, unit: e.target.value })
              }
            >
              <option>piece</option>
              <option>kg</option>
              <option>liter</option>
              <option>meter</option>
              <option>box</option>
              <option>set</option>
              <option>hour</option>
              <option>service</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="rounded bg-brand-600 px-3 py-2 text-sm text-white"
        >
          Add Product
        </button>
      </form>

      <div className="flex items-center justify-between">
        <select
          className="rounded border p-2"
          value={groupFilter}
          onChange={(e) => setGroupFilter(e.target.value)}
        >
          <option value="">All Groups</option>
          {(Array.isArray(groups) ? groups : []).map((g) => (
            <option key={g.id} value={g.id}>
              {g.group_name}
            </option>
          ))}
        </select>

        {/* ✅ FIXED CSV URL */}
        <a
          className="rounded border px-3 py-2 text-sm"
          href="/api/products/export/csv"
          target="_blank"
          rel="noreferrer"
        >
          Export CSV
        </a>
      </div>

      <DataTable columns={columns} rows={rows} />
    </div>
  );
}
