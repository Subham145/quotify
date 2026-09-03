import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import DataTable from '../components/shared/DataTable';
import PageHeader from '../components/shared/PageHeader';
import { api } from '../api/http';
import { useAuth } from '../lib/AuthContext';
import { canAccess } from '../lib/permissions';

export default function ProductGroups() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const canCreate = canAccess(user, 'product_groups', 'create');
  const canDelete = canAccess(user, 'product_groups', 'delete');

  const { data: groups = [] } = useQuery({
    queryKey: ['product-groups'],
    queryFn: () => api('/product-groups'),
  });

  const { data: subgroups = [] } = useQuery({
    queryKey: ['product-subgroups'],
    queryFn: () => api('/product-subgroups'),
  });

  const [groupName, setGroupName] = useState('');
  const [subgroupName, setSubgroupName] = useState('');
  const [parentGroup, setParentGroup] = useState('');

  const createGroup = useMutation({
    mutationFn: (name) =>
      api('/product-groups', { method: 'POST', body: JSON.stringify({ group_name: name }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['product-groups'] });
      setGroupName('');
    },
  });

  const createSubgroup = useMutation({
    mutationFn: () =>
      api('/product-subgroups', {
        method: 'POST',
        body: JSON.stringify({ subgroup_name: subgroupName, group_id: Number(parentGroup) }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['product-subgroups'] });
      setSubgroupName('');
    },
  });

  const deleteGroup = useMutation({
    mutationFn: (id) => api('/product-groups/' + id, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['product-groups'] });
      qc.invalidateQueries({ queryKey: ['product-subgroups'] });
    },
  });

  const deleteSubgroup = useMutation({
    mutationFn: (id) => api('/product-subgroups/' + id, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['product-subgroups'] }),
  });

  const columns = useMemo(
    () => [
      { key: 'group_name', label: 'Group' },
      { key: 'product_count', label: 'Products' },
      ...(canDelete ? [{ key: 'actions', label: 'Actions' }] : []),
    ],
    [canDelete]
  );

  const subgroupColumns = useMemo(
    () => [
      { key: 'subgroup_name', label: 'SubGroup' },
      { key: 'group_name', label: 'Parent Group' },
      ...(canDelete ? [{ key: 'actions', label: 'Actions' }] : []),
    ],
    [canDelete]
  );

  const groupRows = (Array.isArray(groups) ? groups : []).map((g) => ({
    ...g,
    actions: (
      <button
        type="button"
        className="rounded border border-rose-300 px-2 py-1 text-xs text-rose-700 hover:bg-rose-50"
        onClick={() => {
          if (window.confirm(`Delete group "${g.group_name}"? Products keep their data but lose this group.`))
            deleteGroup.mutate(g.id);
        }}
      >
        Delete
      </button>
    ),
  }));

  const subgroupRows = (Array.isArray(subgroups) ? subgroups : []).map((s) => ({
    ...s,
    actions: (
      <button
        type="button"
        className="rounded border border-rose-300 px-2 py-1 text-xs text-rose-700 hover:bg-rose-50"
        onClick={() => {
          if (window.confirm(`Delete subgroup "${s.subgroup_name}"?`)) deleteSubgroup.mutate(s.id);
        }}
      >
        Delete
      </button>
    ),
  }));

  return (
    <div className="space-y-4">
      <PageHeader title="Product Groups" description="Create Groups & SubGroups" />

      {canCreate ? (
        <>
          <form
            className="card flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (groupName) createGroup.mutate(groupName);
            }}
          >
            <input
              className="w-full rounded border p-2"
              placeholder="Group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
            <button className="rounded bg-brand-600 px-3 text-white">Add Group</button>
          </form>

          <form
            className="card grid grid-cols-3 gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (subgroupName && parentGroup) createSubgroup.mutate();
            }}
          >
            <input
              className="rounded border p-2"
              placeholder="SubGroup name"
              value={subgroupName}
              onChange={(e) => setSubgroupName(e.target.value)}
            />
            <select
              className="rounded border p-2"
              value={parentGroup}
              onChange={(e) => setParentGroup(e.target.value)}
            >
              <option value="">Select Group</option>
              {(Array.isArray(groups) ? groups : []).map((g) => (
                <option key={g.id} value={g.id}>
                  {g.group_name}
                </option>
              ))}
            </select>
            <button className="rounded bg-brand-600 text-white">Add SubGroup</button>
          </form>
        </>
      ) : null}

      <DataTable columns={columns} rows={groupRows} />
      <DataTable columns={subgroupColumns} rows={subgroupRows} />
    </div>
  );
}
