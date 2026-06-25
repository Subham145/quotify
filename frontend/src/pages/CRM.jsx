import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import PageHeader from '../components/shared/PageHeader';
import { api } from '../api/http';

const stages = ['New Lead', 'Contacted', 'Follow-up', 'Negotiation', 'Won', 'Lost'];

export default function CRM() {
  const qc = useQueryClient();
  const { data: leads = [] } = useQuery({ queryKey: ['crm-leads'], queryFn: () => api('/crm/leads') });
  const [selectedLead, setSelectedLead] = useState(null);
  const [activity, setActivity] = useState({ activity_type: 'Call', activity_date: '', description: '', outcome: '' });
  const { data: activities = [] } = useQuery({
    queryKey: ['crm-activities', selectedLead],
    queryFn: () => api('/crm/leads/' + selectedLead + '/activities'),
    enabled: Boolean(selectedLead),
  });

  const stageMutation = useMutation({
    mutationFn: ({ id, stage }) => api('/crm/leads/' + id + '/stage', { method: 'PATCH', body: JSON.stringify({ stage }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-leads'] }),
  });

  const activityMutation = useMutation({
    mutationFn: ({ id, payload }) => api('/crm/leads/' + id + '/activities', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm-activities', selectedLead] });
      setActivity({ activity_type: 'Call', activity_date: '', description: '', outcome: '' });
    },
  });

  return (
    <div className="space-y-4">
      <PageHeader title="CRM Pipeline" description="Update stage and maintain lead activity log." />
      <div className="grid gap-3 lg:grid-cols-6">
        {stages.map((stage) => (
          <div key={stage} className="card min-h-40">
            <h3 className="mb-2 text-sm font-semibold text-slate-700">{stage}</h3>
            <div className="space-y-2">
              {leads
                .filter((l) => l.stage === stage)
                .map((lead) => (
                  <div key={lead.id} className="rounded-lg border p-2 text-xs">
                    <p className="font-medium">{lead.customer_name}</p>
                    <p className="text-slate-500">{lead.company}</p>
                    <div className="mt-2 flex gap-1">
                      <select className="w-full rounded border p-1" value={lead.stage} onChange={(e) => stageMutation.mutate({ id: lead.id, stage: e.target.value })}>
                        {stages.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <button type="button" className="rounded border px-2" onClick={() => setSelectedLead(lead.id)}>Log</button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>

      {selectedLead ? (
        <div className="card">
          <h3 className="text-sm font-semibold">Activity Log for Lead #{selectedLead}</h3>
          <form
            className="mt-3 grid gap-2 md:grid-cols-4"
            onSubmit={(e) => {
              e.preventDefault();
              activityMutation.mutate({ id: selectedLead, payload: activity });
            }}
          >
            <select className="rounded border p-2" value={activity.activity_type} onChange={(e) => setActivity({ ...activity, activity_type: e.target.value })}>
              <option>Call</option>
              <option>Email</option>
              <option>Meeting</option>
              <option>WhatsApp</option>
              <option>Note</option>
              <option>Follow-up</option>
            </select>
            <input className="rounded border p-2" type="datetime-local" value={activity.activity_date} onChange={(e) => setActivity({ ...activity, activity_date: e.target.value })} />
            <input className="rounded border p-2" placeholder="Description" value={activity.description} onChange={(e) => setActivity({ ...activity, description: e.target.value })} />
            <input className="rounded border p-2" placeholder="Outcome" value={activity.outcome} onChange={(e) => setActivity({ ...activity, outcome: e.target.value })} />
            <button type="submit" className="rounded bg-brand-600 px-3 py-2 text-white md:col-span-4">Add Activity</button>
          </form>
          <div className="mt-3 space-y-1 text-sm">
            {activities.map((a) => (
              <p key={a.id}>{a.activity_type} - {a.description || '-'} ({a.activity_date})</p>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
