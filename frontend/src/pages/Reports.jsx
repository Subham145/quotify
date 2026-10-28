import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  BadgeCheck,
  Boxes,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  Layers,
  Package,
  RefreshCw,
  Search,
  Send,
  TrendingDown,
  TrendingUp,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import PageHeader from '../components/shared/PageHeader';
import { api } from '../api/http';
import { useAuth } from '../lib/AuthContext';

const STATUS_COLORS = {
  Draft: { text: '#d97706', bg: '#fef3c7', border: '#fcd34d', fill: '#f59e0b', ring: 'ring-amber-200' },
  Sent: { text: '#2563eb', bg: '#dbeafe', border: '#93c5fd', fill: '#3b82f6', ring: 'ring-blue-200' },
  Won: { text: '#059669', bg: '#d1fae5', border: '#6ee7b7', fill: '#10b981', ring: 'ring-emerald-200' },
  Lost: { text: '#e11d48', bg: '#ffe4e6', border: '#fda4af', fill: '#f43f5e', ring: 'ring-rose-200' },
};

const CATEGORY_COLORS = {
  DEWAS: { bg: 'bg-sky-50 text-sky-800 border-sky-300' },
  GREAVES: { bg: 'bg-amber-50 text-amber-800 border-amber-300' },
  KIRLOSKAR: { bg: 'bg-teal-50 text-teal-800 border-teal-300' },
  DIGISET: { bg: 'bg-purple-50 text-purple-800 border-purple-300' },
  PUMP: { bg: 'bg-cyan-50 text-cyan-800 border-cyan-300' },
  PUMPS: { bg: 'bg-cyan-50 text-cyan-800 border-cyan-300' },
  MOTOR: { bg: 'bg-indigo-50 text-indigo-800 border-indigo-300' },
  MOTORS: { bg: 'bg-indigo-50 text-indigo-800 border-indigo-300' },
  SERVICE: { bg: 'bg-pink-50 text-pink-800 border-pink-300' },
  WADI: { bg: 'bg-emerald-50 text-emerald-800 border-emerald-300' },
};

const CURRENCY_FORMAT = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
const number = (value) => Number(value || 0);
const money = (value) => `\u20B9${CURRENCY_FORMAT.format(number(value))}`;

function normalizeStatus(value) {
  const status = String(value || 'draft').toLowerCase();
  if (['won', 'approved', 'converted'].includes(status)) return 'won';
  if (['lost', 'rejected'].includes(status)) return 'lost';
  if (status === 'sent') return 'sent';
  return 'draft';
}

function getStatusBadgeClass(status) {
  const normalized = normalizeStatus(status);
  switch (normalized) {
    case 'won':
      return 'bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold';
    case 'sent':
      return 'bg-blue-100 text-blue-800 border-blue-300 font-semibold';
    case 'lost':
      return 'bg-rose-100 text-rose-800 border-rose-300 font-semibold';
    case 'draft':
    default:
      return 'bg-amber-100 text-amber-800 border-amber-300 font-semibold';
  }
}

function getStatusSelectClass(status) {
  const normalized = normalizeStatus(status);
  switch (normalized) {
    case 'won':
      return 'border-emerald-300 bg-emerald-50 text-emerald-800 focus:ring-emerald-200';
    case 'sent':
      return 'border-blue-300 bg-blue-50 text-blue-800 focus:ring-blue-200';
    case 'lost':
      return 'border-rose-300 bg-rose-50 text-rose-800 focus:ring-rose-200';
    case 'draft':
    default:
      return 'border-amber-300 bg-amber-50 text-amber-800 focus:ring-amber-200';
  }
}

function getCategoryBadgeClass(category) {
  const key = String(category || '').trim().toUpperCase();
  return CATEGORY_COLORS[key]?.bg || 'bg-slate-100 text-slate-700 border-slate-300';
}

function MetricCard({ label, value, note, icon: Icon, tone = 'blue', subLabel }) {
  const tones = {
    blue: {
      card: 'border-blue-200/80 bg-gradient-to-br from-white via-white to-blue-50/40',
      iconWrap: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
      tag: 'bg-blue-100 text-blue-800',
      borderTop: 'border-t-4 border-t-blue-500',
    },
    green: {
      card: 'border-emerald-200/80 bg-gradient-to-br from-white via-white to-emerald-50/40',
      iconWrap: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
      tag: 'bg-emerald-100 text-emerald-800',
      borderTop: 'border-t-4 border-t-emerald-500',
    },
    rose: {
      card: 'border-rose-200/80 bg-gradient-to-br from-white via-white to-rose-50/40',
      iconWrap: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
      tag: 'bg-rose-100 text-rose-800',
      borderTop: 'border-t-4 border-t-rose-500',
    },
    amber: {
      card: 'border-amber-200/80 bg-gradient-to-br from-white via-white to-amber-50/40',
      iconWrap: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
      tag: 'bg-amber-100 text-amber-800',
      borderTop: 'border-t-4 border-t-amber-500',
    },
    violet: {
      card: 'border-purple-200/80 bg-gradient-to-br from-white via-white to-purple-50/40',
      iconWrap: 'bg-purple-50 text-purple-700 ring-1 ring-purple-200',
      tag: 'bg-purple-100 text-purple-800',
      borderTop: 'border-t-4 border-t-purple-500',
    },
  };

  const style = tones[tone] || tones.blue;

  return (
    <div className={`rounded-xl border bg-white p-3.5 shadow-sm transition-all hover:shadow-md ${style.card} ${style.borderTop}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
            {subLabel && (
              <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${style.tag}`}>{subLabel}</span>
            )}
          </div>
          <p className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">{value}</p>
          <p className="mt-1 truncate text-xs font-medium text-slate-600">{note}</p>
        </div>
        <div className={`shrink-0 rounded-xl p-2.5 shadow-sm ${style.iconWrap}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

function Panel({ title, subtitle, icon: Icon, headerColor = 'blue', children, className = '', rightContent }) {
  const headerColors = {
    blue: 'border-blue-500 text-blue-700 bg-blue-50/80',
    emerald: 'border-emerald-500 text-emerald-700 bg-emerald-50/80',
    amber: 'border-amber-500 text-amber-800 bg-amber-50/80',
    purple: 'border-purple-500 text-purple-700 bg-purple-50/80',
    slate: 'border-slate-500 text-slate-700 bg-slate-100',
  };

  return (
    <section className={`rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50/70 px-4 py-3">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div className={`rounded-lg p-1.5 ring-1 ${headerColors[headerColor] || headerColors.blue}`}>
              <Icon size={16} />
            </div>
          )}
          <div>
            <h2 className="text-sm font-bold text-slate-900">{title}</h2>
            {subtitle && <p className="text-[11px] font-medium text-slate-500">{subtitle}</p>}
          </div>
        </div>
        {rightContent && <div>{rightContent}</div>}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function RankedList({ rows, nameKey, primaryKey, secondaryKey, emptyText, barColor = 'bg-blue-500', badgeColor = 'bg-blue-100 text-blue-800', formatPrimary = (v) => v, formatSecondary = (v) => v }) {
  const items = rows.slice(0, 6);
  const max = Math.max(1, ...items.map((row) => number(row[primaryKey])));
  if (!items.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-8 text-center text-xs text-slate-500">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((row, index) => {
        const amount = number(row[primaryKey]);
        const percent = Math.max(amount ? 6 : 0, Math.round((amount / max) * 100));
        return (
          <div key={`${row[nameKey]}-${index}`} className="group rounded-lg border border-slate-100 bg-slate-50/40 p-2.5 transition-colors hover:border-slate-200 hover:bg-slate-50">
            <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
              <div className="flex min-w-0 items-center gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-700">
                  {index + 1}
                </span>
                <span className="truncate font-semibold text-slate-800" title={row[nameKey]}>
                  {row[nameKey] || 'Unspecified'}
                </span>
              </div>
              <span className={`shrink-0 rounded px-2 py-0.5 font-mono text-xs font-bold ${badgeColor}`}>
                {formatPrimary(amount)}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/70">
              <div
                className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                style={{ width: `${percent}%` }}
              />
            </div>
            {secondaryKey && (
              <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                <span>Volume Quoted</span>
                <span className="font-semibold text-slate-700">{formatSecondary(number(row[secondaryKey]))}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Quotation Detail Modal
function QuotationDetailModal({ quotation, onClose, onStatusChange, isUpdating }) {
  if (!quotation) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Modal Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-slate-900 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-500/20 p-2 text-emerald-400 ring-1 ring-emerald-500/30">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-mono text-lg font-bold tracking-tight text-white">{quotation.quotation_number}</h3>
                <span className={`rounded-full border px-2.5 py-0.5 text-xs uppercase ${getStatusBadgeClass(quotation.status)}`}>
                  {normalizeStatus(quotation.status)}
                </span>
              </div>
              <p className="text-xs text-slate-400">Created on {quotation.created_at ? new Date(quotation.created_at).toLocaleString('en-IN') : '—'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
            title="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Status Change Control */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50/60 p-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-blue-900">Update Quotation Outcome</p>
              <p className="text-xs text-blue-700">Quickly set whether this quotation is Draft, Sent, Won, or Lost</p>
            </div>
            <select
              className={`rounded-lg border px-3 py-1.5 text-xs font-bold outline-none shadow-xs transition-all ${getStatusSelectClass(quotation.status)}`}
              value={normalizeStatus(quotation.status)}
              disabled={isUpdating}
              onChange={(e) => onStatusChange(quotation.id, e.target.value)}
            >
              <option value="draft">Draft (🟡 In Progress)</option>
              <option value="sent">Sent (🔵 Delivered to Client)</option>
              <option value="won">Won (🟢 Approved / Order Won)</option>
              <option value="lost">Lost (🔴 Rejected / Closed)</option>
            </select>
          </div>

          {/* Customer & Category Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Customer Details</span>
              <p className="mt-1 text-base font-bold text-slate-900">{quotation.customer_name || '—'}</p>
              {quotation.company_name && (
                <p className="text-xs font-medium text-slate-600 mt-0.5">{quotation.company_name}</p>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Category & Type</span>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className={`inline-block rounded-md border px-2.5 py-1 text-xs font-bold ${getCategoryBadgeClass(quotation.category)}`}>
                  {quotation.category || 'DEWAS'}
                </span>
                {quotation.template_type && (
                  <span className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700">
                    Type: {quotation.template_type}
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Sales Owner: <span className="font-semibold text-slate-700">{quotation.sales_person_name || quotation.assigned_user_name || 'Admin'}</span>
              </p>
            </div>
          </div>

          {/* Financial Breakdown Table */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 bg-slate-100/80 px-4 py-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Commercial Summary</h4>
            </div>
            <div className="divide-y divide-slate-100 text-xs">
              <div className="flex justify-between px-4 py-2.5">
                <span className="text-slate-600">Subtotal (Excl. Tax)</span>
                <span className="font-mono font-semibold text-slate-800">{money(quotation.subtotal)}</span>
              </div>
              <div className="flex justify-between px-4 py-2.5">
                <span className="text-slate-600">Total Discount</span>
                <span className="font-mono font-semibold text-rose-600">
                  {number(quotation.total_discount) > 0 ? `-${money(quotation.total_discount)}` : '₹0'}
                </span>
              </div>
              <div className="flex justify-between px-4 py-2.5">
                <span className="text-slate-600">GST / Tax Amount</span>
                <span className="font-mono font-semibold text-slate-700">{money(quotation.total_gst)}</span>
              </div>
              <div className="flex justify-between bg-emerald-50/60 px-4 py-3 text-sm font-bold">
                <span className="text-emerald-900">Grand Total Value</span>
                <span className="font-mono text-base text-emerald-800">{money(quotation.total_amount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Reports() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Filters & UI States
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [sortField, setSortField] = useState('id');
  const [sortOrder, setSortOrder] = useState('desc');
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [tableDensity, setTableDensity] = useState('standard'); // 'standard' | 'compact'

  // Data Queries
  const { data: inquiry = {} } = useQuery({
    queryKey: ['report-inquiry'],
    queryFn: () => api('/reports/inquiries'),
  });

  const {
    data: quotationReport = {},
    isLoading: quotationsLoading,
    isError: quotationsError,
    refetch: refetchQuotations,
    isFetching: quotationsFetching,
  } = useQuery({
    queryKey: ['report-quotation'],
    queryFn: () => api('/reports/quotations'),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['report-users'],
    queryFn: () => api('/reports/users'),
  });

  const { data: products = [] } = useQuery({
    queryKey: ['report-products'],
    queryFn: () => api('/reports/products'),
  });

  const { data: groups = [] } = useQuery({
    queryKey: ['report-groups'],
    queryFn: () => api('/reports/groups'),
  });

  const quotation = quotationReport;
  const quotationList = quotationReport.details || [];

  // Status Mutation
  const statusMutation = useMutation({
    mutationFn: ({ id, status }) =>
      api(`/quotations/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['report-quotation'] });
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['report-users'] });
      if (selectedQuotation && selectedQuotation.id === variables.id) {
        setSelectedQuotation((prev) => (prev ? { ...prev, status: variables.status } : null));
      }
    },
  });

  // Date Range Filtering
  const filterByDate = (itemDate) => {
    if (dateRange === 'all' || !itemDate) return true;
    const date = new Date(itemDate);
    const now = new Date();
    if (dateRange === 'today') {
      return date.toDateString() === now.toDateString();
    }
    if (dateRange === '7days') {
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    }
    if (dateRange === '30days') {
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 30;
    }
    if (dateRange === 'this_month') {
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }
    if (dateRange === 'this_year') {
      return date.getFullYear() === now.getFullYear();
    }
    return true;
  };

  // Filtered & Sorted Quotations
  const filteredQuotations = useMemo(() => {
    return quotationList.filter((row) => {
      const normalized = normalizeStatus(row.status);
      const matchesStatus = statusFilter === 'all' || normalized === statusFilter;
      const matchesCategory =
        categoryFilter === 'all' || String(row.category || '').toLowerCase() === categoryFilter.toLowerCase();
      const matchesDate = filterByDate(row.created_at);

      const needle = search.trim().toLowerCase();
      const matchesSearch =
        !needle ||
        [
          row.quotation_number,
          row.customer_name,
          row.company_name,
          row.category,
          row.sales_person_name,
          row.assigned_user_name,
        ].some((value) => String(value || '').toLowerCase().includes(needle));

      return matchesStatus && matchesCategory && matchesDate && matchesSearch;
    });
  }, [quotationList, statusFilter, categoryFilter, dateRange, search]);

  const sortedQuotations = useMemo(() => {
    return [...filteredQuotations].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (['total_amount', 'subtotal', 'total_discount', 'total_gst', 'id'].includes(sortField)) {
        valA = number(valA);
        valB = number(valB);
      } else if (sortField === 'created_at') {
        valA = new Date(valA || 0).getTime();
        valB = new Date(valB || 0).getTime();
      } else {
        valA = String(valA || '').toLowerCase();
        valB = String(valB || '').toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredQuotations, sortField, sortOrder]);

  // Pagination calculations
  const totalPages = pageSize === 'all' ? 1 : Math.ceil(sortedQuotations.length / Number(pageSize)) || 1;
  const paginatedRows = useMemo(() => {
    if (pageSize === 'all') return sortedQuotations;
    const start = (currentPage - 1) * Number(pageSize);
    return sortedQuotations.slice(start, start + Number(pageSize));
  }, [sortedQuotations, currentPage, pageSize]);

  // Aggregated totals for the current filtered view
  const currentViewStats = useMemo(() => {
    let sumTotal = 0;
    let sumWon = 0;
    let wonCount = 0;
    let sentCount = 0;
    let draftCount = 0;
    let lostCount = 0;

    for (const row of filteredQuotations) {
      const amt = number(row.total_amount);
      const st = normalizeStatus(row.status);
      sumTotal += amt;
      if (st === 'won') {
        sumWon += amt;
        wonCount++;
      } else if (st === 'sent') {
        sentCount++;
      } else if (st === 'draft') {
        draftCount++;
      } else if (st === 'lost') {
        lostCount++;
      }
    }

    const count = filteredQuotations.length;
    const avg = count > 0 ? Math.round(sumTotal / count) : 0;
    const winRate = sentCount + wonCount + lostCount > 0
      ? Math.round((wonCount / (sentCount + wonCount + lostCount)) * 100)
      : 0;

    return { sumTotal, sumWon, wonCount, sentCount, draftCount, lostCount, count, avg, winRate };
  }, [filteredQuotations]);

  // Available unique categories
  const availableCategories = useMemo(() => {
    const set = new Set();
    quotationList.forEach((q) => {
      if (q.category) set.add(q.category);
    });
    return Array.from(set).sort();
  }, [quotationList]);

  // Status distribution values
  const statusValues = { Draft: 0, Sent: 0, Won: 0, Lost: 0 };
  (quotation.status || []).forEach((entry) => {
    const status = String(entry.status).toLowerCase();
    const formatted = status.charAt(0).toUpperCase() + status.slice(1);
    if (statusValues[formatted] !== undefined) {
      statusValues[formatted] += number(entry.count);
    }
  });

  const statusChart = Object.entries(statusValues).map(([name, value]) => ({
    name,
    value,
    ...STATUS_COLORS[name],
  }));

  const categoryRows = quotation.categories || [];
  const wonRate = number(quotation.totals?.sent_count)
    ? Math.round((number(quotation.totals?.won_count) / number(quotation.totals?.sent_count)) * 100)
    : 0;
  const inquiryStatuses = inquiry.status || [];
  const inquiryCount = inquiryStatuses.reduce((total, row) => total + number(row.count), 0);
  const wonCount = number(quotation.totals?.won_count);
  const lostCount = number(quotation.totals?.lost_count);

  // Sorting helper
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return <ArrowUpDown size={12} className="opacity-40" />;
    return sortOrder === 'asc' ? <ArrowUp size={12} className="text-emerald-700" /> : <ArrowDown size={12} className="text-emerald-700" />;
  };

  // CSV Export function (XL Spreadsheet Export)
  const exportToExcelCSV = () => {
    if (!filteredQuotations.length) {
      alert('No data to export with the current filters.');
      return;
    }

    const headers = [
      'Index',
      'Quotation Number',
      'Date',
      'Customer Name',
      'Company Name',
      'Category',
      'Template Type',
      'Subtotal',
      'Discount',
      'GST',
      'Grand Total',
      'Sales Person',
      'Status',
    ];

    const csvRows = [headers.join(',')];

    filteredQuotations.forEach((row, idx) => {
      const dateStr = row.created_at ? new Date(row.created_at).toLocaleDateString('en-IN') : '';
      const values = [
        idx + 1,
        `"${row.quotation_number || ''}"`,
        `"${dateStr}"`,
        `"${(row.customer_name || '').replace(/"/g, '""')}"`,
        `"${(row.company_name || '').replace(/"/g, '""')}"`,
        `"${row.category || ''}"`,
        `"${row.template_type || ''}"`,
        number(row.subtotal),
        number(row.total_discount),
        number(row.total_gst),
        number(row.total_amount),
        `"${(row.sales_person_name || row.assigned_user_name || '').replace(/"/g, '""')}"`,
        `"${normalizeStatus(row.status).toUpperCase()}"`,
      ];
      csvRows.push(values.join(','));
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csvRows.join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    const dateStamp = new Date().toISOString().slice(0, 10);
    link.setAttribute('download', `Quotations_Master_Report_${dateStamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 pb-8">
      {/* Top Header & Filter Controls Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Executive Reports & Analytics"
          description={
            user?.role === 'Admin' || user?.role === 'SuperAdmin'
              ? 'Complete multi-dimensional overview of quotation pipeline, financial outcomes, category metrics, and sales velocity.'
              : 'Your personal sales performance, quotations ledger, and revenue metrics.'
          }
        />

        {/* Global Date Range Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-xs text-xs font-semibold text-slate-700">
            <Calendar size={14} className="text-blue-600" />
            <span>Scope:</span>
            <select
              className="bg-transparent font-bold text-slate-900 outline-none cursor-pointer"
              value={dateRange}
              onChange={(e) => {
                setDateRange(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="7days">Last 7 Days</option>
              <option value="this_month">This Month</option>
              <option value="30days">Last 30 Days</option>
              <option value="this_year">This Year</option>
            </select>
          </div>

          <button
            onClick={() => refetchQuotations()}
            disabled={quotationsFetching}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
            title="Refresh analytics data"
          >
            <RefreshCw size={13} className={`${quotationsFetching ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Top Metric Cards - Colored by Category/Role */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total Quotations"
          value={number(quotation.totals?.total_count)}
          note={`Total Value: ${money(quotation.totals?.total_value)}`}
          icon={FileText}
          tone="blue"
          subLabel="Portfolio"
        />
        <MetricCard
          label="Sent Quotations"
          value={number(quotation.totals?.sent_count)}
          note="Active client proposals"
          icon={Send}
          tone="amber"
          subLabel="In Market"
        />
        <MetricCard
          label="Won Quotations"
          value={wonCount}
          note={`${wonRate}% Win Ratio · ${money(quotation.totals?.won_value)} Won`}
          icon={BadgeCheck}
          tone="green"
          subLabel="Won Deals"
        />
        <MetricCard
          label="Lost Quotations"
          value={lostCount}
          note={`${money(quotation.totals?.lost_value)} Closed Without Sale`}
          icon={TrendingDown}
          tone="rose"
          subLabel="Lost / Rejected"
        />
      </div>

      {/* Analytics Visualizers Row: Status Distribution & Category Performance */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Status Distribution Panel */}
        <Panel
          title="Quotation Outcomes & Pipeline Funnel"
          subtitle="Breakdown of proposal stages by status and volume"
          icon={Activity}
          headerColor="blue"
        >
          <div className="space-y-4">
            {/* Visual Multi-Segment Bar */}
            <div
              className="flex h-4 overflow-hidden rounded-full bg-slate-100 p-0.5 shadow-inner"
              role="img"
              aria-label={`Status chart: ${statusChart.map((s) => `${s.name} ${s.value}`).join(', ')}`}
            >
              {statusChart.map((entry) => {
                const total = number(quotation.totals?.total_count) || 1;
                const pct = Math.max(0, (entry.value / total) * 100);
                if (!entry.value) return null;
                return (
                  <div
                    key={entry.name}
                    className="h-full rounded-xs transition-all duration-300 first:rounded-l-full last:rounded-r-full"
                    title={`${entry.name}: ${entry.value} (${Math.round(pct)}%)`}
                    style={{ width: `${pct}%`, backgroundColor: entry.fill }}
                  />
                );
              })}
            </div>

            {/* Status Metric Cards Grid */}
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {statusChart.map((entry) => {
                const total = number(quotation.totals?.total_count) || 1;
                const pct = total > 0 ? Math.round((entry.value / total) * 100) : 0;
                return (
                  <div
                    key={entry.name}
                    className="rounded-xl border p-2.5 transition-shadow hover:shadow-xs"
                    style={{
                      backgroundColor: `${entry.bg}50`,
                      borderColor: entry.border,
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.fill }} />
                      <span className="text-xs font-bold" style={{ color: entry.text }}>
                        {entry.name}
                      </span>
                    </div>
                    <div className="mt-1 flex items-baseline justify-between">
                      <span className="text-lg font-black text-slate-900">{entry.value}</span>
                      <span className="text-[11px] font-bold text-slate-500">{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-2.5 text-xs text-slate-600 flex items-center justify-between">
              <span>Overall Sent-to-Won Conversion Efficiency:</span>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 font-bold text-emerald-800">
                {wonRate}% Win Rate
              </span>
            </div>
          </div>
        </Panel>

        {/* Category Performance Panel */}
        <Panel
          title="Category Performance Matrix"
          subtitle="Quotations distribution and win rates across product categories"
          icon={Layers}
          headerColor="amber"
        >
          {categoryRows.length ? (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-2 text-center">Total</th>
                    <th className="py-2.5 px-2 text-center text-blue-700">Sent</th>
                    <th className="py-2.5 px-2 text-center text-emerald-700">Won</th>
                    <th className="py-2.5 px-2 text-center text-rose-700">Lost</th>
                    <th className="py-2.5 px-3 text-right">Win Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {categoryRows.map((row) => {
                    const total = number(row.total_count);
                    const sent = number(row.sent_count);
                    const won = number(row.won_count);
                    const lost = number(row.lost_count);
                    const rate = sent ? Math.round((won / sent) * 100) : 0;
                    return (
                      <tr key={row.category} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2 px-3">
                          <span className={`inline-block rounded-md border px-2 py-0.5 text-xs font-bold ${getCategoryBadgeClass(row.category)}`}>
                            {row.category}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-center font-bold text-slate-800">{total}</td>
                        <td className="py-2 px-2 text-center font-semibold text-blue-700 bg-blue-50/30">{sent}</td>
                        <td className="py-2 px-2 text-center font-bold text-emerald-700 bg-emerald-50/30">{won}</td>
                        <td className="py-2 px-2 text-center font-semibold text-rose-700 bg-rose-50/30">{lost}</td>
                        <td className="py-2 px-3 text-right">
                          <span
                            className={`rounded px-1.5 py-0.5 font-bold ${
                              rate >= 50
                                ? 'bg-emerald-100 text-emerald-800'
                                : rate > 0
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {rate}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-xs text-slate-500">
              No category metrics recorded yet.
            </p>
          )}
        </Panel>
      </div>

      {/* 
        ========================================================================
        EXCEL-STYLE QUOTATIONS MASTER SHEET TABLE
        Spreadsheet Ribbon, Gridlines, Column Letters, Row Numbers, Formula Bar
        ========================================================================
      */}
      <div className="rounded-2xl border-2 border-emerald-800/40 bg-white shadow-xl overflow-hidden">
        {/* Excel Title Ribbon / Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 px-4 py-3 text-white">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-emerald-800 shadow-md">
                <FileSpreadsheet size={24} className="stroke-[2.2]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-mono text-base font-bold tracking-tight text-white">
                    QUOTATIONS_MASTER_SHEET.XLSX
                  </h3>
                  <span className="rounded bg-emerald-950/40 px-2 py-0.5 text-[11px] font-mono font-semibold text-emerald-200 border border-emerald-500/30">
                    Live Excel Grid
                  </span>
                </div>
                <p className="text-xs text-emerald-100/80">
                  Interactive spreadsheet ledger with real-time status updates, multi-column sorting, and instant export.
                </p>
              </div>
            </div>

            {/* Excel Quick Toolbar Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={exportToExcelCSV}
                className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-emerald-900 shadow-sm transition-all hover:bg-emerald-50 active:scale-95"
                title="Download table data as CSV / Excel spreadsheet"
              >
                <Download size={15} className="text-emerald-700" />
                <span>Export to Excel (.CSV)</span>
              </button>

              {/* Table Density Switcher */}
              <div className="flex rounded-lg bg-emerald-900/60 p-0.5 border border-emerald-600/40 text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setTableDensity('standard')}
                  className={`rounded px-2 py-1 transition-colors ${
                    tableDensity === 'standard' ? 'bg-white text-emerald-900 font-bold shadow-xs' : 'text-emerald-200 hover:text-white'
                  }`}
                >
                  Standard
                </button>
                <button
                  type="button"
                  onClick={() => setTableDensity('compact')}
                  className={`rounded px-2 py-1 transition-colors ${
                    tableDensity === 'compact' ? 'bg-white text-emerald-900 font-bold shadow-xs' : 'text-emerald-200 hover:text-white'
                  }`}
                >
                  Compact XL
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Excel Formula / Filter Ribbon Bar */}
        <div className="border-b border-slate-200 bg-slate-50 p-3">
          <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
            {/* Status Filter Chips / Tabs */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mr-1 flex items-center gap-1">
                <Filter size={12} /> Status:
              </span>
              {[
                { id: 'all', label: 'All Quotations', count: quotationList.length, color: 'border-slate-300' },
                { id: 'won', label: 'Won', count: statusValues.Won, color: 'bg-emerald-50 text-emerald-800 border-emerald-300' },
                { id: 'sent', label: 'Sent', count: statusValues.Sent, color: 'bg-blue-50 text-blue-800 border-blue-300' },
                { id: 'draft', label: 'Draft', count: statusValues.Draft, color: 'bg-amber-50 text-amber-800 border-amber-300' },
                { id: 'lost', label: 'Lost', count: statusValues.Lost, color: 'bg-rose-50 text-rose-800 border-rose-300' },
              ].map((tab) => {
                const isActive = statusFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setStatusFilter(tab.id);
                      setCurrentPage(1);
                    }}
                    className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold transition-all ${
                      isActive
                        ? 'border-emerald-600 bg-emerald-700 text-white shadow-xs'
                        : `${tab.color || 'bg-white text-slate-700 hover:bg-slate-100'}`
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                        isActive ? 'bg-white text-emerald-800' : 'bg-slate-200/80 text-slate-700'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search & Category Select Bar */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Category Dropdown Filter */}
              <div className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs">
                <span className="text-slate-400 font-semibold">Category:</span>
                <select
                  className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer"
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="all">All Categories ({availableCategories.length})</option>
                  {availableCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  className="w-full rounded-lg border border-slate-300 bg-white py-1.5 pl-8 pr-7 text-xs text-slate-800 outline-none placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search in sheet... [No., Client, Type]"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Rows per page selector */}
              <div className="flex items-center gap-1 text-xs text-slate-600">
                <span>Rows:</span>
                <select
                  className="rounded border border-slate-300 bg-white px-1.5 py-1 text-xs font-bold text-slate-800 outline-none"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(e.target.value === 'all' ? 'all' : Number(e.target.value));
                    setCurrentPage(1);
                  }}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value="all">All</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Excel Spreadsheet Table Container */}
        {quotationsError ? (
          <div className="p-8 text-center">
            <p className="rounded-xl bg-rose-50 p-4 text-sm font-semibold text-rose-700">
              Could not load quotations data. Please check connection and refresh.
            </p>
          </div>
        ) : quotationsLoading ? (
          <div className="p-12 text-center">
            <RefreshCw size={24} className="mx-auto animate-spin text-emerald-600" />
            <p className="mt-2 text-xs font-bold text-slate-600">Loading Excel Spreadsheet Data…</p>
          </div>
        ) : !paginatedRows.length ? (
          <div className="p-10 text-center">
            <FileSpreadsheet size={36} className="mx-auto text-slate-300" />
            <p className="mt-2 text-sm font-bold text-slate-700">No quotations match the active criteria</p>
            <p className="text-xs text-slate-500">Try adjusting your search query, status tab, or category filter.</p>
            {(search || statusFilter !== 'all' || categoryFilter !== 'all' || dateRange !== 'all') && (
              <button
                onClick={() => {
                  setSearch('');
                  setStatusFilter('all');
                  setCategoryFilter('all');
                  setDateRange('all');
                }}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100"
              >
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[600px] border-b border-slate-300">
            <table className="min-w-full border-collapse text-left font-sans text-xs">
              {/* Excel Column Letters Row (A, B, C, D...) */}
              <thead className="sticky top-0 z-20 bg-slate-200/90 text-[10px] text-slate-500 font-mono font-bold select-none border-b border-slate-300">
                <tr>
                  <th className="w-10 px-2 py-0.5 text-center border-r border-slate-300 bg-slate-300/80">#</th>
                  <th className="px-3 py-0.5 border-r border-slate-300">A</th>
                  <th className="px-3 py-0.5 border-r border-slate-300">B</th>
                  <th className="px-3 py-0.5 border-r border-slate-300">C</th>
                  <th className="px-3 py-0.5 border-r border-slate-300">D</th>
                  <th className="px-3 py-0.5 border-r border-slate-300 text-right">E</th>
                  <th className="px-3 py-0.5 border-r border-slate-300 text-right">F</th>
                  <th className="px-3 py-0.5 border-r border-slate-300 text-right">G</th>
                  <th className="px-3 py-0.5 border-r border-slate-300 text-right bg-emerald-100/60 text-emerald-900">H</th>
                  <th className="px-3 py-0.5 border-r border-slate-300">I</th>
                  <th className="px-3 py-0.5 border-r border-slate-300 text-center">J</th>
                  <th className="px-2 py-0.5 text-center">K</th>
                </tr>
              </thead>

              {/* Excel Column Headers with Sort Actions */}
              <thead className="sticky top-[21px] z-20 bg-slate-100 font-bold text-slate-700 border-b-2 border-slate-300 shadow-xs">
                <tr>
                  {/* Row Index Header */}
                  <th className="w-10 px-2 py-2 text-center border-r border-slate-300 bg-slate-200/60 font-mono text-slate-600">
                    Row
                  </th>

                  {/* Quotation No [A] */}
                  <th
                    onClick={() => handleSort('quotation_number')}
                    className="cursor-pointer px-3 py-2 border-r border-slate-300 hover:bg-slate-200/60 transition-colors whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Quotation No.</span>
                      {getSortIcon('quotation_number')}
                    </div>
                  </th>

                  {/* Date [B] */}
                  <th
                    onClick={() => handleSort('created_at')}
                    className="cursor-pointer px-3 py-2 border-r border-slate-300 hover:bg-slate-200/60 transition-colors whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Date</span>
                      {getSortIcon('created_at')}
                    </div>
                  </th>

                  {/* Customer & Client [C] */}
                  <th
                    onClick={() => handleSort('customer_name')}
                    className="cursor-pointer px-3 py-2 border-r border-slate-300 hover:bg-slate-200/60 transition-colors min-w-[180px]"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Customer / Company</span>
                      {getSortIcon('customer_name')}
                    </div>
                  </th>

                  {/* Category [D] */}
                  <th
                    onClick={() => handleSort('category')}
                    className="cursor-pointer px-3 py-2 border-r border-slate-300 hover:bg-slate-200/60 transition-colors whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Category</span>
                      {getSortIcon('category')}
                    </div>
                  </th>

                  {/* Subtotal [E] */}
                  <th
                    onClick={() => handleSort('subtotal')}
                    className="cursor-pointer px-3 py-2 text-right border-r border-slate-300 hover:bg-slate-200/60 transition-colors whitespace-nowrap"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Subtotal</span>
                      {getSortIcon('subtotal')}
                    </div>
                  </th>

                  {/* GST Tax [F] */}
                  <th
                    onClick={() => handleSort('total_gst')}
                    className="cursor-pointer px-3 py-2 text-right border-r border-slate-300 hover:bg-slate-200/60 transition-colors whitespace-nowrap"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Total GST</span>
                      {getSortIcon('total_gst')}
                    </div>
                  </th>

                  {/* Discount [G] */}
                  <th
                    onClick={() => handleSort('total_discount')}
                    className="cursor-pointer px-3 py-2 text-right border-r border-slate-300 hover:bg-slate-200/60 transition-colors whitespace-nowrap"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Discount</span>
                      {getSortIcon('total_discount')}
                    </div>
                  </th>

                  {/* Grand Total [H] - Highlighted Excel Style */}
                  <th
                    onClick={() => handleSort('total_amount')}
                    className="cursor-pointer px-3 py-2 text-right border-r border-slate-300 bg-emerald-100/70 text-emerald-950 font-black hover:bg-emerald-200/70 transition-colors whitespace-nowrap"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Grand Total (₹)</span>
                      {getSortIcon('total_amount')}
                    </div>
                  </th>

                  {/* Sales Person [I] */}
                  <th
                    onClick={() => handleSort('sales_person_name')}
                    className="cursor-pointer px-3 py-2 border-r border-slate-300 hover:bg-slate-200/60 transition-colors whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Sales Rep</span>
                      {getSortIcon('sales_person_name')}
                    </div>
                  </th>

                  {/* Status / Outcome [J] */}
                  <th
                    onClick={() => handleSort('status')}
                    className="cursor-pointer px-3 py-2 text-center border-r border-slate-300 hover:bg-slate-200/60 transition-colors whitespace-nowrap"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span>Outcome / Status</span>
                      {getSortIcon('status')}
                    </div>
                  </th>

                  {/* Actions [K] */}
                  <th className="px-2 py-2 text-center whitespace-nowrap font-semibold text-slate-600">
                    View
                  </th>
                </tr>
              </thead>

              {/* Excel Table Body Rows */}
              <tbody className="divide-y divide-slate-200 bg-white">
                {paginatedRows.map((row, index) => {
                  const globalRowIndex =
                    pageSize === 'all'
                      ? index + 1
                      : (currentPage - 1) * Number(pageSize) + index + 1;
                  const rowNormalizedStatus = normalizeStatus(row.status);
                  const isWon = rowNormalizedStatus === 'won';
                  const isLost = rowNormalizedStatus === 'lost';
                  const isDraft = rowNormalizedStatus === 'draft';
                  const isSent = rowNormalizedStatus === 'sent';

                  const cellPadding = tableDensity === 'compact' ? 'py-1 px-2.5' : 'py-2 px-3';

                  return (
                    <tr
                      key={row.id}
                      className={`group transition-colors border-b border-slate-200 ${
                        isWon
                          ? 'hover:bg-emerald-50/60 even:bg-emerald-50/20'
                          : isLost
                          ? 'hover:bg-rose-50/60 even:bg-rose-50/20'
                          : isSent
                          ? 'hover:bg-blue-50/60 even:bg-blue-50/20'
                          : 'hover:bg-amber-50/50 even:bg-slate-50/70'
                      }`}
                    >
                      {/* Row Number (Excel Style Index Column) */}
                      <td className="w-10 px-2 py-1.5 text-center font-mono font-bold text-slate-500 border-r border-slate-300 bg-slate-100 select-none text-[11px]">
                        {globalRowIndex}
                      </td>

                      {/* Quotation No. */}
                      <td className={`${cellPadding} font-mono font-bold text-blue-900 border-r border-slate-200 whitespace-nowrap`}>
                        <button
                          type="button"
                          onClick={() => setSelectedQuotation(row)}
                          className="hover:underline flex items-center gap-1 text-blue-700 hover:text-blue-900"
                          title="Click to view quotation details"
                        >
                          <span>{row.quotation_number}</span>
                        </button>
                      </td>

                      {/* Date */}
                      <td className={`${cellPadding} text-slate-600 border-r border-slate-200 whitespace-nowrap font-mono text-[11px]`}>
                        {row.created_at ? new Date(row.created_at).toLocaleDateString('en-IN') : '—'}
                      </td>

                      {/* Customer & Company */}
                      <td className={`${cellPadding} border-r border-slate-200`}>
                        <div className="font-bold text-slate-900 leading-tight">
                          {row.customer_name || '—'}
                        </div>
                        {row.company_name && (
                          <div className="text-[11px] font-medium text-slate-500 truncate max-w-xs">
                            {row.company_name}
                          </div>
                        )}
                      </td>

                      {/* Category */}
                      <td className={`${cellPadding} border-r border-slate-200 whitespace-nowrap`}>
                        <span className={`inline-block rounded border px-2 py-0.5 text-[11px] font-bold ${getCategoryBadgeClass(row.category)}`}>
                          {row.category || 'DEWAS'}
                        </span>
                      </td>

                      {/* Subtotal */}
                      <td className={`${cellPadding} text-right font-mono text-slate-700 border-r border-slate-200 whitespace-nowrap`}>
                        {money(row.subtotal)}
                      </td>

                      {/* GST */}
                      <td className={`${cellPadding} text-right font-mono text-slate-600 border-r border-slate-200 whitespace-nowrap`}>
                        {money(row.total_gst)}
                      </td>

                      {/* Discount */}
                      <td className={`${cellPadding} text-right font-mono border-r border-slate-200 whitespace-nowrap ${number(row.total_discount) > 0 ? 'text-rose-600 font-bold bg-rose-50/40' : 'text-slate-400'}`}>
                        {number(row.total_discount) > 0 ? `-${money(row.total_discount)}` : '₹0'}
                      </td>

                      {/* Grand Total (Excel Highlighted Column) */}
                      <td className={`${cellPadding} text-right font-mono font-black text-emerald-900 bg-emerald-50/60 border-r border-slate-300 whitespace-nowrap`}>
                        <span className="rounded bg-emerald-100/80 px-2 py-0.5 text-xs text-emerald-900 border border-emerald-300">
                          {money(row.total_amount)}
                        </span>
                      </td>

                      {/* Sales Person */}
                      <td className={`${cellPadding} border-r border-slate-200 whitespace-nowrap text-slate-700 font-medium`}>
                        <span className="truncate max-w-[130px] inline-block" title={row.sales_person_name || row.assigned_user_name}>
                          {row.sales_person_name || row.assigned_user_name || 'Admin'}
                        </span>
                      </td>

                      {/* Status / Outcome Selector (Interactive Cell) */}
                      <td className={`${cellPadding} text-center border-r border-slate-200 whitespace-nowrap`}>
                        <select
                          className={`rounded-md border px-2 py-1 text-xs font-bold outline-none cursor-pointer shadow-xs transition-colors ${getStatusSelectClass(
                            row.status
                          )}`}
                          value={rowNormalizedStatus}
                          disabled={statusMutation.isPending}
                          onChange={(e) =>
                            statusMutation.mutate({ id: row.id, status: e.target.value })
                          }
                          aria-label={`Change status for ${row.quotation_number}`}
                        >
                          <option value="draft">🟡 Draft</option>
                          <option value="sent">🔵 Sent</option>
                          <option value="won">🟢 Won</option>
                          <option value="lost">🔴 Lost</option>
                        </select>
                      </td>

                      {/* View Action */}
                      <td className={`${cellPadding} text-center whitespace-nowrap`}>
                        <button
                          type="button"
                          onClick={() => setSelectedQuotation(row)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors"
                          title="Open quotation card"
                        >
                          <Eye size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 
          ========================================================================
          EXCEL STATUS BAR / FORMULA SUMMARY FOOTER
          Live stats modeled after Microsoft Excel's bottom calculation bar
          ========================================================================
        */}
        <div className="bg-slate-800 px-4 py-2 text-white">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between text-xs">
            {/* Left: Excel Ready Indicator & Row Counts */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1.5 font-bold tracking-wider text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>EXCEL READY</span>
              </div>
              <div className="text-slate-300 font-mono">
                Showing: <b className="text-white">{filteredQuotations.length}</b> of {quotationList.length} Rows
              </div>
              {statusFilter !== 'all' && (
                <span className="rounded bg-slate-700 px-2 py-0.5 text-[11px] font-semibold text-slate-200">
                  Filter: {statusFilter.toUpperCase()}
                </span>
              )}
            </div>

            {/* Middle: Excel Aggregation Stats (SUM, AVG, WON) */}
            <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
              <div className="rounded bg-slate-900/80 px-2.5 py-1 border border-slate-700">
                <span className="text-slate-400 text-[11px] uppercase mr-1">SUM Total:</span>
                <span className="font-bold text-emerald-300">{money(currentViewStats.sumTotal)}</span>
              </div>
              <div className="rounded bg-slate-900/80 px-2.5 py-1 border border-slate-700">
                <span className="text-slate-400 text-[11px] uppercase mr-1">SUM Won:</span>
                <span className="font-bold text-green-400">{money(currentViewStats.sumWon)}</span>
              </div>
              <div className="rounded bg-slate-900/80 px-2.5 py-1 border border-slate-700">
                <span className="text-slate-400 text-[11px] uppercase mr-1">AVG Quote:</span>
                <span className="font-bold text-blue-300">{money(currentViewStats.avg)}</span>
              </div>
            </div>

            {/* Right: Pagination Controls */}
            {pageSize !== 'all' && totalPages > 1 && (
              <div className="flex items-center gap-1.5 font-sans">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="rounded bg-slate-700 p-1 text-slate-200 hover:bg-slate-600 disabled:opacity-40 disabled:hover:bg-slate-700"
                  title="Previous page"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="font-mono text-xs px-1 text-slate-300">
                  Page <b className="text-white">{currentPage}</b> / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded bg-slate-700 p-1 text-slate-200 hover:bg-slate-600 disabled:opacity-40 disabled:hover:bg-slate-700"
                  title="Next page"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 
        ========================================================================
        ADDITIONAL OPERATIONAL ANALYTICS PANELS (Inquiry, Team, Top Products)
        ========================================================================
      */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Inquiry Pipeline Activity */}
        <Panel
          title="Inquiry Pipeline Activity"
          subtitle={`${inquiryCount} incoming leads tracked across channels`}
          icon={Activity}
          headerColor="blue"
        >
          <div className="mb-3 flex items-center justify-between rounded-xl bg-blue-50/80 p-3.5 border border-blue-200 text-blue-900">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-600 p-2 text-white shadow-sm">
                <TrendingUp size={20} />
              </div>
              <div>
                <p className="text-xs font-semibold text-blue-800">Lead Conversion Ratio</p>
                <p className="text-xl font-extrabold text-blue-950">{number(inquiry.conversionRate)}%</p>
              </div>
            </div>
            <span className="rounded-full bg-blue-200/80 px-2.5 py-1 text-xs font-bold text-blue-900">
              {inquiryCount} Inquiries
            </span>
          </div>

          <div className="space-y-2">
            {inquiryStatuses.map((row) => {
              const statusName = String(row.status).toLowerCase();
              let badgeColor = 'bg-slate-100 text-slate-700';
              if (['converted', 'won'].includes(statusName)) badgeColor = 'bg-emerald-100 text-emerald-800 font-bold';
              else if (['follow_up', 'in_progress'].includes(statusName)) badgeColor = 'bg-amber-100 text-amber-800 font-bold';
              else if (['lost', 'rejected'].includes(statusName)) badgeColor = 'bg-rose-100 text-rose-800 font-bold';
              else if (statusName === 'new') badgeColor = 'bg-blue-100 text-blue-800 font-bold';

              return (
                <div
                  key={row.status}
                  className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-2 text-xs"
                >
                  <span className={`rounded-md px-2 py-0.5 capitalize ${badgeColor}`}>
                    {String(row.status).replaceAll('_', ' ')}
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-800">{number(row.count)} leads</span>
                </div>
              );
            })}
            {!inquiryStatuses.length && (
              <p className="py-4 text-center text-xs text-slate-500">No inquiry movements recorded yet.</p>
            )}
          </div>
        </Panel>

        {/* Team Sales Leaderboard */}
        <Panel
          title={user?.role === 'Admin' || user?.role === 'SuperAdmin' ? 'Team Performance & Ownership' : 'Your Ownership Performance'}
          subtitle="Quotations issued and win conversions per sales executive"
          icon={Users}
          headerColor="purple"
        >
          {users.length ? (
            <div className="space-y-2.5">
              {users.slice(0, 6).map((row, idx) => {
                const convRate = number(row.conversion_rate);
                return (
                  <div
                    key={row.id || idx}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3 transition-colors hover:border-slate-200 hover:bg-slate-50"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 text-xs font-bold text-white shadow-xs">
                        {(row.name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-slate-800">{row.name}</p>
                        <p className="text-[11px] text-slate-500">{number(row.quotation_count)} total quotes issued</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-xs font-bold ${
                          convRate >= 50
                            ? 'bg-emerald-100 text-emerald-800'
                            : convRate > 0
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {convRate}% Won
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="py-6 text-center text-xs text-slate-500">No team metrics available yet.</p>
          )}
        </Panel>

        {/* Top Quoted Products */}
        <Panel
          title="Top Quoted Products"
          subtitle="Top product models ranked by quoted revenue and volume"
          icon={Package}
          headerColor="purple"
        >
          <RankedList
            rows={products}
            nameKey="product"
            primaryKey="revenue"
            secondaryKey="quantity"
            emptyText="No product line items quoted yet"
            barColor="bg-purple-600"
            badgeColor="bg-purple-100 text-purple-800"
            formatPrimary={money}
            formatSecondary={(qty) => `${qty} units quoted`}
          />
        </Panel>

        {/* Top Product Groups */}
        <Panel
          title="Top Product Groups"
          subtitle="Top performing item clusters by overall pipeline revenue"
          icon={Boxes}
          headerColor="emerald"
        >
          <RankedList
            rows={groups}
            nameKey="group_name"
            primaryKey="revenue"
            secondaryKey="quantity"
            emptyText="No product groups recorded yet"
            barColor="bg-emerald-600"
            badgeColor="bg-emerald-100 text-emerald-800"
            formatPrimary={money}
            formatSecondary={(qty) => `${qty} units quoted`}
          />
        </Panel>
      </div>

      {/* Quotation Detail Modal Dialog */}
      {selectedQuotation && (
        <QuotationDetailModal
          quotation={selectedQuotation}
          onClose={() => setSelectedQuotation(null)}
          onStatusChange={(id, status) => statusMutation.mutate({ id, status })}
          isUpdating={statusMutation.isPending}
        />
      )}
    </div>
  );
}
