export default function EmptyState({ title, description }) {
  return (
    <div className="card text-center">
      <p className="text-base font-medium text-slate-800">{title}</p>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
    </div>
  );
}
