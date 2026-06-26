import { useState, useEffect, useMemo } from 'react';
import Drawer from '../common/Drawer';
import DataTable from '../common/DataTable';
import EmptyState from '../common/EmptyState';
import { Sk } from '../common/Skeleton';
import SectionDateFilter, { computeDateRange } from '../common/SectionDateFilter';
import Tooltip from '../common/Tooltip';
import { useFormSubmissions } from '../../hooks/useFormSubmissions';

const LIMIT = 20;

// Matches GLOBAL_PERIODS in SeoReportPanel.jsx so the drawer's date filter
// behaves identically to every other SEO-report section.
const PERIODS = [
  { key: '7d', label: '7 days' },
  { key: '28d', label: '28 days' },
  { key: 'thisMonth', label: 'This Month' },
  { key: '2m', label: '2 months' },
  { key: 'all', label: 'All time' },
  { key: 'custom', label: 'Custom' },
];

const PERIOD_LABELS = PERIODS.reduce((acc, p) => ({ ...acc, [p.key]: p.label }), {});

const SOURCE_OPTIONS = [
  { key: 'live', label: 'Live' },
  { key: 'demo', label: 'Demo' },
  { key: 'all', label: 'All' },
];

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function SourceBadge({ value }) {
  const isDemo = value === 'demo';
  return (
    <span
      className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold font-label uppercase tracking-wide ${
        isDemo
          ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
          : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
      }`}
    >
      {value || 'live'}
    </span>
  );
}

// CF7 [select] submits the raw option value, often wrapped in braces and in the
// site's source language. Strip the braces (durable for any value) and prettify
// the known legacy German tokens into readable English labels.
const TYPE_LABELS = {
  '{Allgemein}': 'General',
  '{Antriebssysteme}': 'Drive systems',
  '{Systemelektronik}': 'System electronics',
  '{Fahrzeugvernetzung}': 'Vehicle networking',
  '{Wasserstofftechnologie}': 'Hydrogen technology',
  '{Prüftechnik}': 'Test technology',
  '{Messtechnik}': 'Measurement technology',
  '{Entwicklung und Prototyping}': 'Development and prototyping',
  '{Fertigung und Montage}': 'Manufacturing and assembly',
  '{Sytemintegration und Testing}': 'System integration and testing',
  '{Sonder- und Behördenfahrzeuge}': 'Special and government vehicles',
  '{Arbeitnehmerüberlassung}': 'Temporary employment',
};

function formatWebsiteType(value) {
  if (!value) return '—';
  if (TYPE_LABELS[value]) return TYPE_LABELS[value];
  return String(value).replace(/^\{|\}$/g, '').trim() || '—';
}

const MessageIcon = ({ className = '' }) => (
  <svg
    className={`w-3.5 h-3.5 ${className}`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
    aria-hidden
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8M8 14h5m-9 7l3.5-2H18a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v13z" />
  </svg>
);

// Truncated message text with a visible icon that reveals the full description
// in a hover/focus popover (reuses the portal-based Tooltip so it escapes the
// table's overflow container).
function MessageCell({ text }) {
  if (!text) return <span className="text-brand-outline">—</span>;
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <span className="block truncate max-w-[200px]" title={text}>
        {text}
      </span>
      <Tooltip content={text} placement="left">
        <button
          type="button"
          aria-label="Show full message"
          className="shrink-0 text-brand-outline hover:text-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary-container rounded"
        >
          <MessageIcon />
        </button>
      </Tooltip>
    </div>
  );
}

const columns = [
  {
    key: 'submittedAt',
    label: 'Date',
    width: '17%',
    render: (r) => formatDate(r.submittedAt || r.createdAt),
  },
  {
    key: 'name',
    label: 'Name',
    width: '15%',
    render: (r) => `${r.firstName || ''} ${r.lastName || ''}`.trim() || '—',
  },
  {
    key: 'email',
    label: 'Email',
    width: '20%',
    truncate: true,
    render: (r) =>
      r.email ? (
        <a href={`mailto:${r.email}`} className="text-brand-primary hover:underline">
          {r.email}
        </a>
      ) : (
        '—'
      ),
  },
  { key: 'telephone', label: 'Phone', width: '14%', render: (r) => r.telephone || '—' },
  { key: 'websiteType', label: 'Type', width: '12%', render: (r) => formatWebsiteType(r.websiteType) },
  { key: 'submitFrom', label: 'Source', width: '10%', render: (r) => <SourceBadge value={r.submitFrom} /> },
  { key: 'description', label: 'Message', render: (r) => <MessageCell text={r.description} /> },
];

export default function FormSubmissionsDrawer({
  isOpen,
  onClose,
  siteId,
  initialPeriod = '28d',
  initialCustomFrom = null,
  initialCustomTo = null,
}) {
  const [page, setPage] = useState(1);
  const [submitFrom, setSubmitFrom] = useState('live');
  const [websiteType, setWebsiteType] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  // The drawer owns its own date filter, seeded from the page's active period so
  // the drawer total matches the card on open, then independently adjustable.
  const [period, setPeriod] = useState(initialPeriod);
  const [customFrom, setCustomFrom] = useState(initialCustomFrom);
  const [customTo, setCustomTo] = useState(initialCustomTo);
  const dateRange = computeDateRange(period, customFrom, customTo);

  // Debounce the search input.
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Reset to page 1 whenever any filter or the active period changes.
  useEffect(() => {
    setPage(1);
  }, [submitFrom, websiteType, search, period, customFrom, customTo]);

  const { rows, meta, isLoading, isFetching } = useFormSubmissions(
    siteId,
    {
      page,
      limit: LIMIT,
      submitFrom: submitFrom === 'all' ? undefined : submitFrom,
      websiteType: websiteType || undefined,
      search: search || undefined,
      period,
      dateRange,
    },
    { enabled: isOpen }
  );

  // Distinct website types from the loaded rows, for the quick filter dropdown.
  // Keep the raw value (matches stored data for the API filter) but show a
  // readable label.
  const typeOptions = useMemo(() => {
    const set = new Set(rows.map((r) => r.websiteType).filter(Boolean));
    if (websiteType) set.add(websiteType);
    return Array.from(set)
      .map((value) => ({ value, label: formatWebsiteType(value) }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [rows, websiteType]);

  const total = meta?.total || 0;
  const totalPages = Math.max(Math.ceil(total / LIMIT), 1);
  const canPrev = page > 1;
  const canNext = page < totalPages;

  const rangeLabel = dateRange ? `${dateRange.from} → ${dateRange.to}` : PERIOD_LABELS[period] || '';

  const footer = (
    <div className="flex items-center justify-between">
      <span className="text-xs text-brand-outline font-label">
        {total > 0
          ? `${(page - 1) * LIMIT + 1}–${Math.min(page * LIMIT, total)} of ${total}`
          : 'No submissions'}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => canPrev && setPage((p) => p - 1)}
          disabled={!canPrev}
          className="px-3 py-1.5 text-xs font-medium rounded-md border border-brand-outline-variant dark:border-brand-outline text-brand-on-surface-variant dark:text-brand-outline disabled:opacity-40 hover:bg-brand-surface-container-low dark:hover:bg-brand-on-surface transition-colors font-label"
        >
          Prev
        </button>
        <button
          type="button"
          onClick={() => canNext && setPage((p) => p + 1)}
          disabled={!canNext}
          className="px-3 py-1.5 text-xs font-medium rounded-md border border-brand-outline-variant dark:border-brand-outline text-brand-on-surface-variant dark:text-brand-outline disabled:opacity-40 hover:bg-brand-surface-container-low dark:hover:bg-brand-on-surface transition-colors font-label"
        >
          Next
        </button>
      </div>
    </div>
  );

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Form Submissions" width="4xl" footer={footer}>
      {/* Date filter — own row, matches every other SEO-report section */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <SectionDateFilter
          periods={PERIODS}
          period={period}
          setPeriod={setPeriod}
          customFrom={customFrom}
          setCustomFrom={setCustomFrom}
          customTo={customTo}
          setCustomTo={setCustomTo}
          defaultPeriod="28d"
        />
        {!isLoading && (
          <span className="text-xs text-brand-outline font-label whitespace-nowrap">
            {total} submission{total === 1 ? '' : 's'}
            {rangeLabel ? ` · ${rangeLabel}` : ''}
          </span>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        {/* Source segmented toggle */}
        <div className="inline-flex rounded-lg border border-brand-outline-variant dark:border-brand-outline overflow-hidden">
          {SOURCE_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setSubmitFrom(opt.key)}
              className={`px-3 py-1.5 text-xs font-medium font-label transition-colors ${
                submitFrom === opt.key
                  ? 'bg-brand-primary text-white'
                  : 'bg-brand-surface-container-lowest dark:bg-brand-on-surface text-brand-on-surface-variant dark:text-brand-outline hover:bg-brand-surface-container-low dark:hover:bg-brand-on-surface/70'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Website type filter */}
        {typeOptions.length > 0 && (
          <select
            value={websiteType}
            onChange={(e) => setWebsiteType(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-label rounded-lg border border-brand-outline-variant dark:border-brand-outline bg-brand-surface-container-lowest dark:bg-brand-on-surface text-brand-on-surface dark:text-brand-outline-variant"
          >
            <option value="">All types</option>
            {typeOptions.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        )}

        {/* Search */}
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search name, email, phone…"
          className="flex-1 min-w-0 px-3 py-1.5 text-xs font-label rounded-lg border border-brand-outline-variant dark:border-brand-outline bg-brand-surface-container-lowest dark:bg-brand-on-surface text-brand-on-surface dark:text-brand-outline-variant placeholder:text-brand-outline"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Sk key={i} className="h-9 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <div className={isFetching ? 'opacity-60 transition-opacity' : ''}>
          <DataTable
            keyField="_id"
            columns={columns}
            rows={rows}
            dense
            emptyState={
              <EmptyState
                title="No submissions in this range"
                description="Try a wider date range or switch the source filter to All."
              />
            }
          />
        </div>
      )}
    </Drawer>
  );
}
