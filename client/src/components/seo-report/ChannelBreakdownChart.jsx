import { useState, useRef, useEffect } from 'react';
import { themeColor } from './colorThemes';
import { useAnalyticsCountries } from '../../hooks/useAnalytics';
import Spinner from '../common/Spinner';
import CompareChannelsModal from './CompareChannelsModal';

function formatNumber(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export function CountryFilterDropdown({ siteId, dateRange, excluded, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const { countries, isLoading } = useAnalyticsCountries(siteId, open ? dateRange : null);

  useEffect(() => {
    if (!open) return undefined;
    const handle = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const handleEsc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', handle);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handle);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [open]);

  const toggle = (country) => {
    if (excluded.includes(country)) {
      onChange(excluded.filter((c) => c !== country));
    } else {
      onChange([...excluded, country]);
    }
  };

  const tooltip = excluded.length === 0
    ? 'Filter countries'
    : excluded.length === 1
      ? `Excluding ${excluded[0]}`
      : `Excluding ${excluded.length} countries`;

  const active = excluded.length > 0;

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title={tooltip}
        aria-label={tooltip}
        className={`relative w-7 h-7 flex items-center justify-center rounded-lg border transition-colors ${
          active
            ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
            : 'border-brand-outline-variant dark:border-brand-outline bg-brand-surface-container-lowest dark:bg-brand-on-surface text-brand-outline hover:border-brand-400'
        }`}
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {active && (
          <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-1 rounded-full bg-brand-primary text-white text-[9px] font-bold font-label flex items-center justify-center leading-none">
            {excluded.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-64 max-h-80 overflow-y-auto z-30 rounded-lg border border-brand-outline-variant dark:border-brand-outline bg-brand-surface-container-lowest dark:bg-brand-on-surface shadow-xl">
          <div className="flex items-center justify-between px-3 py-2 border-b border-brand-outline-variant dark:border-brand-outline">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-outline font-label">Exclude countries</span>
            {excluded.length > 0 && (
              <button type="button" onClick={() => onChange([])} className="text-[11px] text-brand-primary hover:underline font-label">
                Clear all
              </button>
            )}
          </div>
          {isLoading ? (
            <div className="px-3 py-4 text-xs text-brand-outline font-label">Loading…</div>
          ) : countries.length === 0 ? (
            <div className="px-3 py-4 text-xs text-brand-outline font-label">No countries with traffic.</div>
          ) : (
            <ul className="py-1">
              {countries.map((c) => {
                const checked = excluded.includes(c.country);
                return (
                  <li key={c.country}>
                    <button
                      type="button"
                      onClick={() => toggle(c.country)}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-brand-surface-container-low dark:hover:bg-brand-on-surface/50 transition-colors font-label"
                    >
                      <span className={`w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center ${checked ? 'bg-brand-primary border-brand-primary' : 'border-brand-outline'}`}>
                        {checked && (
                          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>
                      <span className="flex-1 truncate text-brand-on-surface dark:text-brand-outline-variant">{c.country}</span>
                      <span className="text-brand-outline tabular-nums">{formatNumber(c.sessions)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default function ChannelBreakdownChart({
  channels,
  themeKey,
  siteId,
  dateRange,
  excludedCountries = [],
  onExcludedCountriesChange,
  isRefreshing = false,
}) {
  const showFilter = !!siteId && typeof onExcludedCountriesChange === 'function';
  const [compareOpen, setCompareOpen] = useState(false);
  const canCompare = !!siteId && Array.isArray(channels) && channels.length > 0;

  const Header = () => (
    <div className="flex items-start justify-between gap-3 mb-4">
      {/* Traffic by Channel */}
      <h4 className="text-sm font-semibold text-brand-on-surface dark:text-brand-outline-variant flex items-center gap-2">
        <svg className="w-4 h-4 text-brand-outline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M3 8h18M3 12h12M3 16h8M3 20h4" />
        </svg>
        Traffic by Channel
      </h4>
      <div className="flex items-center gap-2">
        {canCompare && (
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
        )}
        {showFilter && (
          <CountryFilterDropdown
            siteId={siteId}
            dateRange={dateRange}
            excluded={excludedCountries}
            onChange={onExcludedCountriesChange}
          />
        )}
      </div>
    </div>
  );

  const Overlay = () => (
    isRefreshing ? (
      <div className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-brand-on-surface/60 backdrop-blur-[1px] rounded-lg z-10 transition-opacity">
        <Spinner size="sm" />
      </div>
    ) : null
  );

  if (!channels || channels.length === 0) {
    return (
      <div className="relative">
        <Header />
        <p className="text-sm text-brand-outline dark:text-brand-on-surface-variant text-center py-4">
          No channel data available{excludedCountries.length > 0 ? ' (all remaining countries are excluded)' : ''}.
        </p>
        <Overlay />
        {siteId && (
          <CompareChannelsModal
            isOpen={compareOpen}
            onClose={() => setCompareOpen(false)}
            siteId={siteId}
            currentChannels={channels || []}
            currentLabel="Current Period"
          />
        )}
      </div>
    );
  }

  const totalSessions = channels.reduce((sum, c) => sum + c.sessions, 0);
  const chartData = channels.map((c, i) => ({
    name: c.channel,
    sessions: c.sessions,
    pct: totalSessions > 0 ? ((c.sessions / totalSessions) * 100).toFixed(1) : '0',
    color: themeColor(themeKey, i % 6),
  }));

  return (
    <div className="relative">
      <Header />

      <div className="space-y-2.5">
        {chartData.map((c) => (
          <div key={c.name} className="flex items-center gap-3">
            <span className="text-xs text-brand-on-surface-variant dark:text-brand-outline w-28 flex-shrink-0 truncate font-label" title={c.name}>
              {c.name}
            </span>
            <div className="flex-1 h-6 bg-brand-surface-container-high dark:bg-brand-on-surface rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                style={{
                  width: `${Math.max(parseFloat(c.pct), 3)}%`,
                  backgroundColor: c.color,
                }}
              >
                {parseFloat(c.pct) > 15 && (
                  <span className="text-[10px] font-semibold font-label text-white">{c.pct}%</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-sm font-semibold font-label text-brand-on-surface dark:text-white tabular-nums w-16 text-right">
                {formatNumber(c.sessions)}
              </span>
              {parseFloat(c.pct) <= 15 && (
                <span className="text-xs text-brand-outline dark:text-brand-on-surface-variant tabular-nums w-12 text-right font-label">
                  {c.pct}%
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-brand-outline-variant dark:border-brand-outline flex justify-between text-xs text-brand-outline dark:text-brand-on-surface-variant font-label">
        <span>Total Sessions</span>
        <span className="font-semibold font-label text-brand-on-surface-variant dark:text-brand-outline">{formatNumber(totalSessions)}</span>
      </div>

      <Overlay />

      {siteId && (
        <CompareChannelsModal
          isOpen={compareOpen}
          onClose={() => setCompareOpen(false)}
          siteId={siteId}
          currentChannels={channels}
          currentLabel="Current Period"
        />
      )}
    </div>
  );
}
