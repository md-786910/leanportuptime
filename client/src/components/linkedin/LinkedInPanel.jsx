import { useState } from 'react';
import KpiCard from '../common/KpiCard';
import Spinner from '../common/Spinner';
import SectionDateFilter, { computeDateRange } from '../common/SectionDateFilter';
import { useLinkedInMetrics } from '../../hooks/useLinkedIn';

const PERIODS = [
  { key: '7d', label: '7 days' },
  { key: '28d', label: '28 days' },
  { key: 'thisMonth', label: 'This Month' },
  { key: '2m', label: '2 months' },
  { key: 'custom', label: 'Custom' },
];

const num = (v) => (v == null ? '—' : v.toLocaleString('de-DE'));
const pct = (v) => (v == null ? '—' : `${(v * 100).toLocaleString('de-DE', { maximumFractionDigits: 2 })} %`);
const money = (v, currency) =>
  v == null
    ? '—'
    : currency
      ? v.toLocaleString('de-DE', { style: 'currency', currency })
      : v.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function LinkedInPanel({ siteId }) {
  const [period, setPeriod] = useState('thisMonth');
  const [customFrom, setCustomFrom] = useState(null);
  const [customTo, setCustomTo] = useState(null);
  const dateRange = computeDateRange(period, customFrom, customTo);

  const { metrics: m, isLoading, error } = useLinkedInMetrics(siteId, period, dateRange);

  const cards = m
    ? [
        { label: 'Costs', value: money(m.cost, m.currency), accent: 'rose' },
        { label: 'Leads', value: num(m.leads), accent: 'emerald', hint: 'Lead Gen Forms + website conversions' },
        { label: 'Cost per Lead', value: money(m.costPerLead, m.currency), accent: 'amber' },
        { label: 'Clicks', value: num(m.clicks), accent: 'blue' },
        { label: 'Impressions', value: num(m.impressions), accent: 'indigo' },
        { label: 'CTR', value: pct(m.ctr), accent: 'sky', hint: 'Clicks / Impressions' },
        { label: 'Cost per Click', value: money(m.costPerClick, m.currency), accent: 'violet' },
        { label: 'Conversion Rate', value: pct(m.conversionRate), accent: 'emerald', hint: 'Leads / Clicks' },
      ]
    : [];

  return (
    <div className="space-y-4 mt-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-headline font-bold text-brand-on-surface dark:text-white">LinkedIn Ads</h2>
        <SectionDateFilter
          periods={PERIODS}
          period={period}
          setPeriod={setPeriod}
          customFrom={customFrom}
          setCustomFrom={setCustomFrom}
          customTo={customTo}
          setCustomTo={setCustomTo}
        />
      </div>

      {isLoading && (
        <div className="flex justify-center py-12"><Spinner /></div>
      )}

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {error.response?.data?.error?.message || 'Could not load LinkedIn data.'}
        </p>
      )}

      {m && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {cards.map((c) => (
            <KpiCard key={c.label} {...c} />
          ))}
        </div>
      )}
    </div>
  );
}
