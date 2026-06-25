import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../api/http';
import PageHeader from '../components/shared/PageHeader';
import StatCard from '../components/shared/StatCard';

const COLORS = ['#2374e1', '#22c55e', '#f59e0b', '#ef4444', '#7c3aed'];

function greetingByTime() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export default function Dashboard() {
  const { data: inquiryStats } = useQuery({ queryKey: ['inquiries-stats'], queryFn: () => api('/inquiries/stats') });
  const { data: quotations = [] } = useQuery({ queryKey: ['quotations'], queryFn: () => api('/quotations') });
  const { data: customers = [] } = useQuery({ queryKey: ['customers'], queryFn: () => api('/customers') });
  const { data: reminders = [] } = useQuery({ queryKey: ['reminders'], queryFn: () => api('/reminders') });

  const pendingTasks = reminders.filter((r) => r.status === 'pending' || r.status === 'overdue').length;
  const converted = Number(inquiryStats?.converted || 0);
  const totalInquiries = Number(inquiryStats?.total || 0);
  const conversionRate = totalInquiries ? `${((converted / totalInquiries) * 100).toFixed(1)}%` : '0%';

  const stats = [
    { label: 'Total Inquiries', value: totalInquiries },
    { label: 'Quotations', value: quotations.length },
    { label: 'Customers', value: customers.length },
    { label: "Today's Tasks", value: pendingTasks },
    { label: 'Conversion Rate', value: conversionRate },
  ];

  const inquiryPipeline = [
    { name: 'New', value: Number(inquiryStats?.new || 0) },
    { name: 'Follow-up', value: Number(inquiryStats?.follow_up || 0) },
    { name: 'Converted', value: Number(inquiryStats?.converted || 0) },
    { name: 'Lost', value: Number(inquiryStats?.lost || 0) },
  ];

  const quotationStatusMap = quotations.reduce((acc, q) => {
    acc[q.status] = (acc[q.status] || 0) + 1;
    return acc;
  }, {});

  const quotationStatus = Object.entries(quotationStatusMap).map(([name, value]) => ({ name, value }));
  const safePieData = quotationStatus.length ? quotationStatus : [{ name: 'draft', value: 1 }];

  return (
    <div className="space-y-5">
      <PageHeader title={`${greetingByTime()}, Welcome back`} description={`Today is ${format(new Date(), 'EEEE, dd MMM yyyy')}`} />

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        {stats.map((item) => (
          <StatCard key={item.label} label={item.label} value={item.value} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card h-80">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Inquiry Pipeline</h3>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={inquiryPipeline}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#2374e1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card h-80">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Quotation Status</h3>
          <ResponsiveContainer width="100%" height="90%">
            <PieChart>
              <Pie data={safePieData} dataKey="value" nameKey="name" outerRadius={110} label>
                {safePieData.map((entry, i) => (
                  <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="card">
          <h3 className="mb-2 font-semibold">Recent Inquiries</h3>
          {inquiryPipeline.map((x) => (
            <p key={x.name} className="text-sm text-slate-700">{x.name}: {x.value}</p>
          ))}
        </div>
        <div className="card">
          <h3 className="mb-2 font-semibold">Recent Quotations</h3>
          {quotations.slice(0, 5).map((q) => (
            <p key={q.id} className="text-sm text-slate-700">{q.quotation_number} - Rs. {q.total_amount}</p>
          ))}
        </div>
        <div className="card border-rose-200 bg-rose-50">
          <h3 className="mb-2 font-semibold text-rose-800">Overdue Alerts</h3>
          <p className="text-sm text-rose-700">{reminders.filter((r) => r.status === 'overdue').length} overdue tasks.</p>
        </div>
      </div>
    </div>
  );
}
