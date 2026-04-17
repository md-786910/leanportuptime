import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import Card from '../common/Card';
import Button from '../common/Button';
import Spinner from '../common/Spinner';
import Badge from '../common/Badge';
import { getGoogleAuthUrl } from '../../api/searchConsole.api';
import {
  useGoogleStatus,
  useGoogleDisconnect,
  useGscStatus,
  useGscProperties,
  useGscLink,
  useGscUnlink,
  useGscPerformance,
  useGscInsights,
} from '../../hooks/useSearchConsole';
import { themeColor } from './colorThemes';
import TopQueriesTable from './TopQueriesTable';
import TopPagesTable from './TopPagesTable';
import DeviceBreakdown from './DeviceBreakdown';
import CountryBreakdown from './CountryBreakdown';

const PERIODS = [
  { key: '24h', label: '24h' },
  { key: '7d', label: '7 days' },
  { key: '28d', label: '28 days' },
  { key: '2m', label: '2 months' },
  { key: 'daily', label: 'Daily' },
];

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

function formatNumber(n) {
  if (n == null) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function KpiCard({ label, value, color, icon }) {
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

// ========== Not connected state ==========
function ConnectState({ siteId }) {
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
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
          <svg className="w-7 h-7 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">
          Connect Google Search Console
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 max-w-sm mx-auto">
          Sign in with your Google account to view clicks, impressions, CTR, and average position for your site.
        </p>
        <Button onClick={handleConnect} isLoading={loading} disabled={loading}>
          {loading ? 'Redirecting to Google...' : 'Connect Google Account'}
        </Button>
      </div>
    </Card>
  );
}

// ========== Property selector state ==========
function PropertySelector({ siteId }) {
  const { properties, isLoading } = useGscProperties(siteId, true);
  const linkMutation = useGscLink(siteId);
  const disconnectMutation = useGoogleDisconnect();
  const [selected, setSelected] = useState('');

  useEffect(() => {
    if (properties.length > 0 && !selected) {
      setSelected(properties[0].siteUrl);
    }
  }, [properties, selected]);

  return (
    <Card>
      <div className="py-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Select Search Console Property
          </h3>
          <button
            onClick={() => disconnectMutation.mutate()}
            disabled={disconnectMutation.isPending}
            className="text-xs text-red-500 hover:text-red-600 hover:underline"
          >
            Disconnect Google
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-4">
            <Spinner size="sm" />
          </div>
        ) : properties.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
            No properties found in your Google Search Console. Make sure your site is added to Search Console.
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
                  <option key={p.siteUrl} value={p.siteUrl}>
                    {p.siteUrl} ({p.permissionLevel})
                  </option>
                ))}
              </select>
            </div>
            <Button
              onClick={() => linkMutation.mutate(selected)}
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

// ========== Performance dashboard ==========
function PerformanceDashboard({ siteId, themeKey, viewMode }) {
  const [period, setPeriod] = useState('28d');
  const { performance, isLoading, error } = useGscPerformance(siteId, period);
  const { insights, isLoading: insightsLoading } = useGscInsights(siteId, period);
  const unlinkMutation = useGscUnlink(siteId);

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
            {error.response?.data?.error?.message || 'Failed to load Search Console data'}
          </p>
        </div>
      </Card>
    );
  }

  const totals = performance?.totals || { clicks: 0, impressions: 0, ctr: 0, position: 0 };
  const daily = performance?.daily || [];

  return (
    <div className="space-y-4">
      <Card>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Google Search Console
            </h3>
            {performance?.fetchedAt && (
              <span className="text-[11px] text-gray-400 dark:text-gray-500">
                Last update: {timeAgo(performance.fetchedAt)}
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
            label="Total Clicks"
            value={formatNumber(totals.clicks)}
            color={themeColor(themeKey, 0)}
          />
          <KpiCard
            label="Total Impressions"
            value={formatNumber(totals.impressions)}
            color={themeColor(themeKey, 1)}
          />
          <KpiCard
            label="Average CTR"
            value={`${(totals.ctr * 100).toFixed(2)}%`}
            color={themeColor(themeKey, 2)}
          />
          <KpiCard
            label="Average Position"
            value={totals.position ? totals.position.toFixed(1) : '—'}
            color={themeColor(themeKey, 3)}
          />
        </div>
      </Card>

      {/* Daily trend chart */}
      {viewMode === 'charts' && daily.length > 1 && (
        <Card>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Daily Trends
          </h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={daily} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                <defs>
                  <linearGradient id="gscClicksGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={themeColor(themeKey, 0)} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={themeColor(themeKey, 0)} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gscImpressionsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={themeColor(themeKey, 1)} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={themeColor(themeKey, 1)} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  tickFormatter={(d) => {
                    const date = new Date(d);
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255,255,255,0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                  }}
                  formatter={(value, name) => {
                    if (name === 'clicks') return [formatNumber(value), 'Clicks'];
                    if (name === 'impressions') return [formatNumber(value), 'Impressions'];
                    return [value, name];
                  }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="clicks"
                  stroke={themeColor(themeKey, 0)}
                  strokeWidth={2}
                  fill="url(#gscClicksGrad)"
                  name="Clicks"
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="impressions"
                  stroke={themeColor(themeKey, 1)}
                  strokeWidth={2}
                  fill="url(#gscImpressionsGrad)"
                  name="Impressions"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* SEO Insights: Queries, Pages, Devices, Countries */}
      {insightsLoading ? (
        <Card>
          <div className="flex justify-center py-8">
            <Spinner size="sm" />
          </div>
        </Card>
      ) : insights ? (
        <>
          {viewMode === 'details' && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <Card>
                <TopQueriesTable queries={insights.queries} themeKey={themeKey} />
              </Card>
              <Card>
                <TopPagesTable pages={insights.pages} themeKey={themeKey} />
              </Card>
            </div>
          )}

          {viewMode === 'charts' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <DeviceBreakdown devices={insights.devices} themeKey={themeKey} />
              </Card>
              <Card>
                <CountryBreakdown countries={insights.countries} themeKey={themeKey} />
              </Card>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}

// ========== Main export ==========
export default function SearchConsoleSection({ siteId, themeKey, viewMode }) {
  const { googleStatus, isLoading: googleLoading } = useGoogleStatus();
  const { gscStatus, isLoading: gscLoading } = useGscStatus(siteId);

  // Handle Google OAuth callback redirect
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    const authResult = searchParams.get('google_auth');
    if (authResult) {
      // Clean up the URL param
      searchParams.delete('google_auth');
      searchParams.delete('reason');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  if (googleLoading || gscLoading) {
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
    return <ConnectState siteId={siteId} />;
  }

  // State 2: Connected but no property linked
  if (!gscStatus?.linked) {
    return <PropertySelector siteId={siteId} />;
  }

  // State 3: Fully connected — show dashboard
  return <PerformanceDashboard siteId={siteId} themeKey={themeKey} viewMode={viewMode} />;
}
