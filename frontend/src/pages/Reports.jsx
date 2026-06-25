import { useQuery } from '@tanstack/react-query';
import PageHeader from '../components/shared/PageHeader';
import { api } from '../api/http';
import { useAuth } from '../lib/AuthContext';

export default function Reports() {
  const { user } = useAuth();
  const { data: inquiry = {} } = useQuery({ queryKey: ['report-inquiry'], queryFn: () => api('/reports/inquiries') });
  const { data: quotation = {} } = useQuery({ queryKey: ['report-quotation'], queryFn: () => api('/reports/quotations') });
  const { data: users = [] } = useQuery({ queryKey: ['report-users'], queryFn: () => api('/reports/users') });
  const { data: products = [] } = useQuery({ queryKey: ['report-products'], queryFn: () => api('/reports/products') });
  const { data: groups = [] } = useQuery({ queryKey: ['report-groups'], queryFn: () => api('/reports/groups') });

  return (
    <div className="space-y-4">
      <PageHeader title="Reports" description={user?.role === 'Admin' ? "Live inquiry, quotation, user, product, and group reports." : "Your reports - Inquiries, Quotations, Products, and Groups."} />

      <div className="grid gap-3 md:grid-cols-2">
        <div className="card">
          <h3 className="font-semibold">Inquiry Report</h3>
          <p className="mt-1 text-sm">Conversion rate: {inquiry.conversionRate || 0}%</p>
          {(inquiry.status || []).map((s) => <p key={s.status} className="text-sm">{s.status}: {s.count}</p>)}
        </div>
        <div className="card">
          <h3 className="font-semibold">Quotation Report</h3>
          <p className="mt-1 text-sm">Total value: Rs. {quotation.totals?.total_value || 0}</p>
          <p className="text-sm">Approved value: Rs. {quotation.totals?.approved_value || 0}</p>
          {(quotation.status || []).map((s) => <p key={s.status} className="text-sm">{s.status}: {s.count}</p>)}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="card">
          <h3 className="font-semibold">{user?.role === 'Admin' ? 'User-wise' : 'Your Performance'}</h3>
          {users.map((u) => <p key={u.id} className="text-sm">{u.name}: {u.quotation_count} ({u.conversion_rate}%)</p>)}
        </div>
        <div className="card">
          <h3 className="font-semibold">Product-wise</h3>
          {products.map((p) => <p key={p.product} className="text-sm">{p.product}: {p.quantity} / Rs. {p.revenue}</p>)}
        </div>
        <div className="card">
          <h3 className="font-semibold">Group-wise</h3>
          {groups.map((g) => <p key={g.group_name} className="text-sm">{g.group_name}: {g.quantity} / Rs. {g.revenue}</p>)}
        </div>
      </div>
    </div>
  );
}
