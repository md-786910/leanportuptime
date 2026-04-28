import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { themeColor } from './colorThemes';
import CompareNewVsReturningModal from './CompareNewVsReturningModal';

function formatNumber(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export default function NewVsReturningChart({ newUsers, returningUsers, themeKey, siteId }) {
  const [compareOpen, setCompareOpen] = useState(false);
  const total = newUsers + returningUsers;
  if (total === 0) {
    return (
      <p className="text-sm text-brand-outline dark:text-brand-on-surface-variant text-center py-4">
        No user data available.
      </p>
    );
  }

  const chartData = [
    { name: 'New Users', value: newUsers, color: themeColor(themeKey, 0) },
    { name: 'Returning Users', value: returningUsers, color: themeColor(themeKey, 2) },
  ];

  return (
    <div>
      {/* New vs Returning (Organic) */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <h4 className="text-sm font-semibold text-brand-on-surface dark:text-brand-outline-variant flex items-center gap-2">
          <svg className="w-4 h-4 text-brand-outline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          New vs Returning (Organic)
        </h4>
        {siteId && (
          <button
            type="button"
            onClick={() => setCompareOpen(true)}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-brand-outline-variant dark:border-brand-outline text-brand-on-surface-variant dark:text-brand-outline hover:bg-brand-surface-container-low dark:hover:bg-brand-on-surface transition-colors flex items-center gap-1.5 font-label flex-shrink-0"
            title="Compare against a past period"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
            </svg>
            Compare
          </button>
        )}
      </div>
      <div className="flex items-center gap-6">
        <div className="w-32 h-32 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={55}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [formatNumber(value), name]}
                contentStyle={{
                  backgroundColor: 'rgba(255,255,255,0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 space-y-2.5">
          {chartData.map((d) => {
            const pct = total > 0 ? ((d.value / total) * 100).toFixed(1) : '0';
            return (
              <div key={d.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: d.color }} />
                  <span className="text-sm text-brand-on-surface dark:text-brand-outline">
                    {d.name}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold font-label text-brand-on-surface dark:text-white tabular-nums">
                    {formatNumber(d.value)}
                  </span>
                  <span className="text-xs text-brand-outline dark:text-brand-on-surface-variant tabular-nums w-12 text-right font-label">
                    {pct}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {siteId && (
        <CompareNewVsReturningModal
          isOpen={compareOpen}
          onClose={() => setCompareOpen(false)}
          siteId={siteId}
          currentNewUsers={newUsers}
          currentReturningUsers={returningUsers}
          currentLabel="Current Period"
        />
      )}
    </div>
  );
}
