import { useState, useEffect } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import Spinner from '../common/Spinner';
import { getGoogleAuthUrl } from '../../api/searchConsole.api';
import { useGoogleStatus } from '../../hooks/useSearchConsole';
import {
  useAnalyticsStatus,
  useAnalyticsProperties,
  useAnalyticsLink,
  useAnalyticsUnlink,
  useAnalyticsOverview,
  useAnalyticsInsights,
} from '../../hooks/useAnalytics';
import { themeColor } from './colorThemes';
import OrganicTrendChart from './OrganicTrendChart';
import OrganicLandingPagesTable from './OrganicLandingPagesTable';
import NewVsReturningChart from './NewVsReturningChart';
import OrganicDeviceBreakdown from './OrganicDeviceBreakdown';
import OrganicCountryBreakdown from './OrganicCountryBreakdown';

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

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

function KpiCard({ label, value, color }) {
  return (
    <div className="rounded-xl border border-gray-100 dark:border-gray-800 p-4 flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {label}
        </span>
      </div>
      <span className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">{value}</span>
    </div>
  );
}

// ========== Connect / Reconnect state ==========
function ConnectState({ needsReconnect }) {
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    setLoading(true);
    try {
      const { authUrl } = await getGoogleAuthUrl();
      window.location.href = authUrl;
    } catch {
      setLoading(false);
    }
  };

  return (
    <Card>
      <div className="text-center py-8">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
          <svg className="w-7 h-7 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">
          {needsReconnect ? 'Reconnect Google for Analytics' : 'Connect Google Analytics'}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 max-w-sm mx-auto">
          {needsReconnect
            ? 'Your Google account needs additional permissions for Analytics. Reconnect to grant access.'
            : 'Sign in with your Google account to view organic traffic, engagement, and conversion data from GA4.'}
        </p>
        <Button onClick={handleConnect} isLoading={loading} disabled={loading}>
          {loading ? 'Redirecting to Google...' : needsReconnect ? 'Reconnect Google Account' : 'Connect Google Account'}
        </Button>
      </div>
    </Card>
  );
}

// ========== Property selector ==========
function PropertySelector({ siteId }) {
  const { properties, isLoading, error } = useAnalyticsProperties(siteId, true);
  const linkMutation = useAnalyticsLink(siteId);
  const [selected, setSelected] = useState('');

  // Detect insufficient scope
  const insufficientScope = error?.response?.status === 403 &&
    error?.response?.data?.error?.code === 'INSUFFICIENT_SCOPE';

  useEffect(() => {
    if (properties.length > 0 && !selected) {
      setSelected(properties[0].propertyId);
    }
  }, [properties, selected]);

  if (insufficientScope) {
    return <ConnectState needsReconnect />;
  }

  const selectedProp = properties.find((p) => p.propertyId === selected);

  return (
    <Card>
      <div className="py-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Select Google Analytics Property
        </h3>

        {isLoading ? (
          <div className="flex justify-center py-4">
            <Spinner size="sm" />
          </div>
        ) : properties.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
            No GA4 properties found. Make sure you have Google Analytics 4 set up for your site.
          </p>
        ) : (
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Property</label>
              <select
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              >
                {properties.map((p) => (
                  <option key={p.propertyId} value={p.propertyId}>
                    {p.displayName} ({p.accountName})
                  </option>
                ))}
              </select>
            </div>
            <Button
              onClick={() => linkMutation.mutate({ propertyId: selected, propertyName: selectedProp?.displayName })}
              isLoading={linkMutation.isPending}
              disabled={!selected || linkMutation.isPending}
            >
              Link Property
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

// ========== Analytics Dashboard ==========
function AnalyticsDashboard({ siteId, themeKey, viewMode }) {
  const [period, setPeriod] = useState('28d');
  const { data: overviewData, isLoading, error } = useAnalyticsOverview(siteId, period);
  const { insights, isLoading: insightsLoading } = useAnalyticsInsights(siteId, period);
  const unlinkMutation = useAnalyticsUnlink(siteId);

  // Detect insufficient scope from overview fetch
  const insufficientScope = error?.response?.status === 403 &&
    error?.response?.data?.error?.code === 'INSUFFICIENT_SCOPE';

  if (insufficientScope) {
    return <ConnectState needsReconnect />;
  }

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
            {error.response?.data?.error?.message || 'Failed to load Analytics data'}
          </p>
        </div>
      </Card>
    );
  }

  const overview = overviewData?.overview || {};
  const trend = overviewData?.trend || [];

  return (
    <div className="space-y-4">
      <Card>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Google Analytics (Organic)
            </h3>
            {overviewData?.fetchedAt && (
              <span className="text-[11px] text-gray-400 dark:text-gray-500">
                Last update: {timeAgo(overviewData.fetchedAt)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => unlinkMutation.mutate()}
              disabled={unlinkMutation.isPending}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors"
              title="Unlink property"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </button>
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard
            label="Organic Sessions"
            value={formatNumber(overview.sessions)}
            color={themeColor(themeKey, 0)}
          />
          <KpiCard
            label="Engagement Rate"
            value={overview.engagementRate != null ? `${(overview.engagementRate * 100).toFixed(1)}%` : '—'}
            color={themeColor(themeKey, 1)}
          />
          <KpiCard
            label="Avg. Engagement Time"
            value={formatDuration(overview.avgEngagementTime)}
            color={themeColor(themeKey, 2)}
          />
          <KpiCard
            label="Organic Conversions"
            value={formatNumber(overview.conversions)}
            color={themeColor(themeKey, 3)}
          />
        </div>
      </Card>

      {/* Organic Traffic Trend */}
      {viewMode === 'charts' && trend.length > 1 && (
        <Card>
          <OrganicTrendChart trend={trend} themeKey={themeKey} />
        </Card>
      )}

      {/* Insights section */}
      {insightsLoading ? (
        <Card>
          <div className="flex justify-center py-8">
            <Spinner size="sm" />
          </div>
        </Card>
      ) : insights ? (
        <>
          {viewMode === 'details' && (
            <Card>
              <OrganicLandingPagesTable pages={insights.landingPages} themeKey={themeKey} />
            </Card>
          )}

          {viewMode === 'charts' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <NewVsReturningChart
                    newUsers={overview.newUsers || 0}
                    returningUsers={overview.returningUsers || 0}
                    themeKey={themeKey}
                  />
                </Card>
                <Card>
                  <OrganicDeviceBreakdown devices={insights.devices} themeKey={themeKey} />
                </Card>
              </div>
              <Card>
                <OrganicCountryBreakdown countries={insights.countries} themeKey={themeKey} />
              </Card>
            </>
          )}
        </>
      ) : null}
    </div>
  );
}

// ========== Main export ==========
export default function AnalyticsSection({ siteId, themeKey, viewMode }) {
  const { googleStatus, isLoading: googleLoading } = useGoogleStatus();
  const { analyticsStatus, isLoading: analyticsLoading } = useAnalyticsStatus(siteId);

  if (googleLoading || analyticsLoading) {
    return (
      <Card>
        <div className="flex justify-center py-8">
          <Spinner size="sm" />
        </div>
      </Card>
    );
  }

  // State 1: Google not connected
  if (!googleStatus?.connected) {
    return <ConnectState needsReconnect={false} />;
  }

  // State 2: Connected but no analytics property linked
  if (!analyticsStatus?.linked) {
    return <PropertySelector siteId={siteId} />;
  }

  // State 3: Fully connected — show dashboard
  return <AnalyticsDashboard siteId={siteId} themeKey={themeKey} viewMode={viewMode} />;
}
