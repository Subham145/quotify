export default function QuotationDetail() {
  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-slate-900">Quotation Detail Actions</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        <button className="rounded-lg border px-3 py-2 text-sm" type="button">Duplicate</button>
        <button className="rounded-lg border px-3 py-2 text-sm" type="button">Convert to Challan</button>
        <button className="rounded-lg border px-3 py-2 text-sm" type="button">Convert to Invoice</button>
        <button className="rounded-lg border px-3 py-2 text-sm" type="button">Set Reminder</button>
      </div>
    </div>
  );
}
