import { useState, useEffect } from 'react';
import { computeDateRange } from '../common/SectionDateFilter';
import { useSeoReportStore } from '../../store/seoReportStore';
import Card from '../common/Card';
import BentoCard from '../common/BentoCard';
import Button from '../common/Button';
import Spinner from '../common/Spinner';
import { Sk } from '../common/Skeleton';
import { getGoogleAuthUrl } from '../../api/searchConsole.api';
import { useGoogleStatus, useGoogleDisconnect } from '../../hooks/useSearchConsole';
import {
  useAnalyticsStatus,
  useAnalyticsProperties,
  useAnalyticsLink,
  useAnalyticsUnlink,
  useAnalyticsOverview,
  useAnalyticsInsights,
} from '../../hooks/useAnalytics';
import { themeColor } from './colorThemes';
import { useIsViewer, useIsAdmin } from '../../hooks/useRole';
import OrganicTrendChart from './OrganicTrendChart';
import OrganicLandingPagesTable from './OrganicLandingPagesTable';
import NewVsReturningChart from './NewVsReturningChart';
import OrganicDeviceBreakdown from './OrganicDeviceBreakdown';
import OrganicCountryBreakdown from './OrganicCountryBreakdown';
import CompareOrganicModal from './CompareOrganicModal';

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
    <div className="rounded-xl border border-brand-outline-variant dark:border-brand-outline p-4 flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
        <span className="text-xs font-medium font-label text-brand-on-surface-variant dark:text-brand-outline uppercase tracking-wider">
          {label}
        </span>
      </div>
      <span className="text-2xl font-bold font-label text-brand-on-surface dark:text-white tabular-nums">{value}</span>
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
        <h3 className="text-base font-semibold text-brand-on-surface dark:text-brand-outline-variant mb-1">
          {needsReconnect ? 'Reconnect Google for Analytics' : 'Connect Google Analytics'}
        </h3>
        <p className="text-sm text-brand-on-surface-variant dark:text-brand-outline mb-5 max-w-sm mx-auto">
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
        <h3 className="text-sm font-semibold text-brand-on-surface dark:text-brand-outline-variant mb-4">
          Select Google Analytics Property
        </h3>

        {isLoading ? (
          <div className="flex justify-center py-4">
            <Spinner size="sm" />
          </div>
        ) : properties.length === 0 ? (
          <p className="text-sm text-brand-outline dark:text-brand-on-surface-variant text-center py-4">
            No GA4 properties found. Make sure you have Google Analytics 4 set up for your site.
          </p>
        ) : (
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-xs text-brand-on-surface-variant dark:text-brand-outline mb-1 font-label">Property</label>
              <select
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-brand-outline-variant dark:border-brand-outline bg-brand-surface-container-lowest dark:bg-brand-on-surface text-brand-on-surface dark:text-brand-outline-variant focus:ring-2 focus:ring-brand-primary-container focus:border-brand-500"
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
  const period = useSeoReportStore((s) => s.period);
  const customFrom = useSeoReportStore((s) => s.customFrom);
  const customTo = useSeoReportStore((s) => s.customTo);
  const dateRange = computeDateRange(period, customFrom, customTo);
  const { data: overviewData, isLoading, error } = useAnalyticsOverview(siteId, period, dateRange);
  const { insights, isLoading: insightsLoading } = useAnalyticsInsights(siteId, period, dateRange);
  const unlinkMutation = useAnalyticsUnlink(siteId);
  const disconnectMutation = useGoogleDisconnect();
  const isViewer = useIsViewer();
  const [compareOpen, setCompareOpen] = useState(false);

  // Detect insufficient scope from overview fetch
  const insufficientScope = error?.response?.status === 403 &&
    error?.response?.data?.error?.code === 'INSUFFICIENT_SCOPE';

  if (insufficientScope) {
    return <ConnectState needsReconnect />;
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <BentoCard>
          <Sk className="h-4 w-24 mb-5 rounded-full" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border border-brand-outline-variant dark:border-brand-outline p-4 flex flex-col gap-3">
                <Sk className="h-2.5 w-14 rounded-full" />
                <Sk className="h-6 w-20" />
              </div>
            ))}
          </div>
        </BentoCard>
        <div className="grid grid-cols-12 gap-6">
          <BentoCard className="col-span-12 lg:col-span-8"><Sk className="h-44 w-full rounded-xl" /></BentoCard>
          <BentoCard className="col-span-12 lg:col-span-4"><Sk className="h-44 w-full rounded-xl" /></BentoCard>
        </div>
      </div>
    );
  }

  if (error) {
    const errMsg = error.response?.data?.error?.message || 'Failed to load Analytics data';
    const busy = unlinkMutation.isPending || disconnectMutation.isPending;
    return (
      <Card>
        <div className="text-center py-8">
          <p className="text-sm text-red-500 dark:text-red-400 mb-4">{errMsg}</p>
          {!isViewer && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="secondary"
                onClick={() => unlinkMutation.mutate()}
                isLoading={unlinkMutation.isPending}
                disabled={busy}
              >
                Change Property
              </Button>
              <Button
                onClick={() => disconnectMutation.mutate()}
                isLoading={disconnectMutation.isPending}
                disabled={busy}
              >
                Reconnect Google
              </Button>
            </div>
          )}
        </div>
      </Card>
    );
  }

  const overview = overviewData?.overview || {};
  const trend = overviewData?.trend || [];

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <BentoCard>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          {/* organic Search */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium font-label uppercase">
              Organic Search
            </span>
            {overviewData?.fetchedAt && (
              <span className="text-[11px] text-brand-outline dark:text-brand-on-surface-variant font-label">
                Last update: {timeAgo(overviewData.fetchedAt)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCompareOpen(true)}
              className="text-xs font-medium px-3 py-1.5 rounded-lg border border-brand-outline-variant dark:border-brand-outline text-brand-on-surface-variant dark:text-brand-outline hover:bg-brand-surface-container-low dark:hover:bg-brand-on-surface transition-colors flex items-center gap-1.5 font-label"
              title="Compare against a past period"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
              </svg>
              Compare
            </button>
            {!isViewer && (
              <button
                onClick={() => unlinkMutation.mutate()}
                disabled={unlinkMutation.isPending}
                className="text-xs text-brand-outline hover:text-red-500 transition-colors font-label"
                title="Unlink property"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard label="Organic Sessions" value={formatNumber(overview.sessions)} color={themeColor(themeKey, 0)} />
          <KpiCard label="Engagement Rate" value={overview.engagementRate != null ? `${(overview.engagementRate * 100).toFixed(1)}%` : '—'} color={themeColor(themeKey, 1)} />
          <KpiCard label="Avg. Engagement Time" value={formatDuration(overview.avgEngagementTime)} color={themeColor(themeKey, 2)} />
          <KpiCard label="Organic Conversions" value={formatNumber(overview.conversions)} color={themeColor(themeKey, 3)} />
        </div>
      </BentoCard>

      {/* 12-col bento: Trend (8) + breakdown sidebar (4) */}
      {(trend.length > 1 || insights) && (
        <div className="grid grid-cols-12 gap-6">
          {trend.length > 1 && (
            <BentoCard className="col-span-12 lg:col-span-8">
              <OrganicTrendChart trend={trend} themeKey={themeKey} siteId={siteId} />
            </BentoCard>
          )}
          {insightsLoading ? (
            <BentoCard className={trend.length > 1 ? 'col-span-12 lg:col-span-4' : 'col-span-12'}>
              <Sk className="h-48 w-full rounded-xl" />
            </BentoCard>
          ) : insights && viewMode === 'charts' ? (
            <BentoCard className={trend.length > 1 ? 'col-span-12 lg:col-span-4' : 'col-span-12'}>
              <NewVsReturningChart
                newUsers={overview.newUsers || 0}
                returningUsers={overview.returningUsers || 0}
                themeKey={themeKey}
                siteId={siteId}
              />
            </BentoCard>
          ) : insights && viewMode === 'details' ? (
            <BentoCard className={trend.length > 1 ? 'col-span-12 lg:col-span-4' : 'col-span-12'}>
              <NewVsReturningChart
                newUsers={overview.newUsers || 0}
                returningUsers={overview.returningUsers || 0}
                themeKey={themeKey}
                siteId={siteId}
              />
            </BentoCard>
          ) : null}
        </div>
      )}

      <CompareOrganicModal
        isOpen={compareOpen}
        onClose={() => setCompareOpen(false)}
        siteId={siteId}
        currentOverview={overview}
        currentLabel="Current Period"
      />

      {/* Full-width insights below */}
      {!insightsLoading && insights ? (
        <>
          {viewMode === 'details' && (
            <BentoCard>
              <OrganicLandingPagesTable pages={insights.landingPages} themeKey={themeKey} siteId={siteId} />
            </BentoCard>
          )}

          {viewMode === 'charts' && (
            <div className="grid grid-cols-12 gap-6">
              <BentoCard className="col-span-12 lg:col-span-6">
                <OrganicDeviceBreakdown devices={insights.devices} themeKey={themeKey} />
              </BentoCard>
              <BentoCard className="col-span-12 lg:col-span-6">
                <OrganicCountryBreakdown countries={insights.countries} themeKey={themeKey} />
              </BentoCard>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}

// ========== Viewer-only read-only notice ==========
function ViewerNotConfigured({ message }) {
  return (
    <Card>
      <div className="text-center py-8">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-brand-surface-container-high dark:bg-brand-on-surface flex items-center justify-center">
          <svg className="w-6 h-6 text-brand-outline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-sm font-semibold text-brand-on-surface dark:text-brand-outline mb-1">Google Analytics Not Configured</h3>
        <p className="text-xs text-brand-on-surface-variant dark:text-brand-outline max-w-sm mx-auto font-label">{message}</p>
      </div>
    </Card>
  );
}

// ========== Main export ==========
export default function AnalyticsSection({ siteId, themeKey, viewMode }) {
  const { googleStatus, isLoading: googleLoading } = useGoogleStatus();
  const { analyticsStatus, isLoading: analyticsLoading } = useAnalyticsStatus(siteId);
  const isViewer = useIsViewer();
  const isAdmin = useIsAdmin();

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
    if (!isAdmin) {
      return <ViewerNotConfigured message="Google account not connected. Contact a workspace admin to connect Google Analytics." />;
    }
    return <ConnectState needsReconnect={false} />;
  }

  // State 2: Connected but no analytics property linked
  if (!analyticsStatus?.linked) {
    if (isViewer) {
      return <ViewerNotConfigured message="No Google Analytics property linked to this site. Contact the site owner to link a property." />;
    }
    return <PropertySelector siteId={siteId} />;
  }

  // State 3: Fully connected — show dashboard
  return <AnalyticsDashboard siteId={siteId} themeKey={themeKey} viewMode={viewMode} />;
}
