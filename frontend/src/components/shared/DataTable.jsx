import React from 'react';
import StatusBadge from './StatusBadge';

export default function DataTable({ columns, rows = [] }) {
  return (
    <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3 text-left font-medium text-slate-600">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-slate-50/80">
              {columns.map((col) => {
                const value = row[col.key];
                return (
                  <td key={col.key} className="px-4 py-3 text-slate-700">
                    {React.isValidElement(value)
                      ? value
                      : col.key === 'status'
                        ? <StatusBadge value={value} />
                        : value}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
