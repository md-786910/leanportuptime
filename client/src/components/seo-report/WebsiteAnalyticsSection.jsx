import { useState } from 'react';
import Card from '../common/Card';
import Spinner from '../common/Spinner';
import { useAnalyticsStatus, useWebsiteAnalytics } from '../../hooks/useAnalytics';
import { themeColor } from './colorThemes';
import ChannelBreakdownChart from './ChannelBreakdownChart';
import TopPagesVisitedTable from './TopPagesVisitedTable';

const PERIODS = [
  { key: '7d', label: '7 days' },
  { key: '28d', label: '28 days' },
  { key: '2m', label: '2 months' },
];

function formatNumber(n) {
  if (n == null) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return '0s';
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function KpiCard({ label, value, subtitle, color }) {
  return (
    <div className="rounded-xl border border-gray-100 dark:border-gray-800 p-4 flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {label}
        </span>
      </div>
      <span className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">{value}</span>
      {subtitle && (
        <span className="text-[10px] text-gray-400 dark:text-gray-500">{subtitle}</span>
      )}
    </div>
  );
}

function WebsiteDashboard({ siteId, themeKey, viewMode }) {
  const [period, setPeriod] = useState('28d');
  const { data, isLoading, error } = useWebsiteAnalytics(siteId, period);

  if (isLoading) {
    return (
      <Card>
        <div className="flex justify-center py-12">
          <Spinner size="md" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="text-center py-8">
          <p className="text-sm text-red-500 dark:text-red-400">
            {error.response?.data?.error?.message || 'Failed to load website analytics'}
          </p>
        </div>
      </Card>
    );
  }

  const overview = data?.overview || {};
  const details = data?.details || {};
  const events = details.events || { fileDownloads: 0, formRequests: 0 };

  return (
    <div className="space-y-4">
      <Card>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Website Analytics
            </h3>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium uppercase">
              All Traffic
            </span>
          </div>
        </div>

        {/* Period pills */}
        <div className="flex gap-1.5 mb-5">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                period === p.key
                  ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400'
                  : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <KpiCard
            label="Unique Visitors"
            value={formatNumber(overview.uniqueVisitors)}
            color={themeColor(themeKey, 0)}
          />
          <KpiCard
            label="Bounce Rate"
            value={overview.bounceRate != null ? `${(overview.bounceRate * 100).toFixed(1)}%` : '—'}
            color={themeColor(themeKey, 1)}
          />
          <KpiCard
            label="Avg. Time on Page"
            value={formatDuration(overview.avgTimeOnPage)}
            color={themeColor(themeKey, 2)}
          />
          <KpiCard
            label="File Downloads"
            value={formatNumber(events.fileDownloads)}
            color={themeColor(themeKey, 3)}
          />
          <KpiCard
            label="Form Requests"
            value={formatNumber(events.formRequests)}
            subtitle={events.formRequests === 0 ? 'Requires GA4 event setup' : undefined}
            color={themeColor(themeKey, 4)}
          />
        </div>
      </Card>

      {/* Traffic by Channel + Top Pages */}
      {viewMode === 'charts' ? (
        <Card>
          <ChannelBreakdownChart channels={details.channels} themeKey={themeKey} />
        </Card>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <Card>
            <ChannelBreakdownChart channels={details.channels} themeKey={themeKey} />
          </Card>
          <Card>
            <TopPagesVisitedTable pages={details.topPages} themeKey={themeKey} />
          </Card>
        </div>
      )}
    </div>
  );
}

export default function WebsiteAnalyticsSection({ siteId, themeKey, viewMode }) {
  const { analyticsStatus, isLoading } = useAnalyticsStatus(siteId);

  // Don't show anything while loading or if GA4 is not linked
  // (user connects GA4 via the AnalyticsSection below)
  if (isLoading || !analyticsStatus?.linked) {
    return null;
  }

  return <WebsiteDashboard siteId={siteId} themeKey={themeKey} viewMode={viewMode} />;
}
