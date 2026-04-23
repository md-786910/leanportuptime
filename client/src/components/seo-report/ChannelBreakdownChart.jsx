import { themeColor } from './colorThemes';

function formatNumber(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export default function ChannelBreakdownChart({ channels, themeKey }) {
  if (!channels || channels.length === 0) {
    return (
      <p className="text-sm text-brand-outline dark:text-brand-on-surface-variant text-center py-4">
        No channel data available.
      </p>
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
    <div>
      <h4 className="text-sm font-semibold text-brand-on-surface dark:text-brand-outline-variant mb-4 flex items-center gap-2">
        <svg className="w-4 h-4 text-brand-outline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M3 8h18M3 12h12M3 16h8M3 20h4" />
        </svg>
        Traffic by Channel
      </h4>

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
    </div>
  );
}
