const styleMap = {
  new: 'bg-blue-100 text-blue-700',
  follow_up: 'bg-amber-100 text-amber-700',
  converted: 'bg-emerald-100 text-emerald-700',
  approved: 'bg-emerald-100 text-emerald-700',
  lost: 'bg-rose-100 text-rose-700',
  rejected: 'bg-rose-100 text-rose-700',
  sent: 'bg-indigo-100 text-indigo-700',
  pending: 'bg-amber-100 text-amber-700',
  overdue: 'bg-rose-100 text-rose-700',
  completed: 'bg-emerald-100 text-emerald-700',
};

export default function StatusBadge({ value }) {
  return (
    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${styleMap[value] || 'bg-slate-100 text-slate-700'}`}>
      {String(value).replace('_', ' ')}
    </span>
  );
}
