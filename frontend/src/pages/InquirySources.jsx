import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import DataTable from '../components/shared/DataTable';
import PageHeader from '../components/shared/PageHeader';
import { api } from '../api/http';

export default function InquirySources() {
  const qc = useQueryClient();
  const { data: sources = [] } = useQuery({
    queryKey: ['inquiry-sources'],
    queryFn: () => api('/inquiry-sources'),
  });

  const [form, setForm] = useState({ source_name: '' });

  const createMutation = useMutation({
    mutationFn: (payload) => api('/inquiry-sources', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inquiry-sources'] });
      setForm({ source_name: '' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api('/inquiry-sources/' + id, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inquiry-sources'] }),
  });

  const columns = useMemo(
    () => [
      { key: 'source_name', label: 'Source Name' },
      { key: 'is_active', label: 'Status' },
      { key: 'created_at', label: 'Created' },
      { key: 'actions', label: 'Actions' },
    ],
    []
  );

  const rows = sources.map((s) => ({
    ...s,
    is_active: s.is_active ? 'Active' : 'Inactive',
    created_at: new Date(s.created_at).toLocaleDateString(),
    actions: (
      <button
        type="button"
        className="rounded border border-rose-300 px-2 py-1 text-xs text-rose-700 hover:bg-rose-50"
        onClick={() => deleteMutation.mutate(s.id)}
      >
        Delete
      </button>
    ),
  }));

  return (
    <div className="space-y-4">
      <PageHeader title="Inquiry Sources" description="Manage inquiry sources - WhatsApp, Email, Phone, etc." />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          createMutation.mutate(form);
        }}
        className="card grid gap-3 md:grid-cols-2"
      >
        <div className="space-y-1">
          <label className="text-sm font-medium">Source Name</label>
          <input
            className="w-full rounded border p-2"
            placeholder="e.g., WhatsApp, Email, Phone, Facebook"
            value={form.source_name}
            onChange={(e) => setForm({ ...form, source_name: e.target.value })}
            required
          />
        </div>
        <div className="flex items-end">
          <button type="submit" className="w-full rounded bg-brand-600 px-3 py-2 text-sm text-white">
            Add Source
          </button>
        </div>
      </form>

      <DataTable columns={columns} rows={rows} />
    </div>
  );
}
