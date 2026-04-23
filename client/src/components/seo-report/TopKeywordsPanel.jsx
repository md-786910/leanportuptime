import Spinner from '../common/Spinner';
import { useKeywordsStatus } from '../../hooks/useKeywords';
import { fmt, positionClass, DeltaCell } from './KeywordRankingsTable';

function sortByPosition(items) {
  return [...items].sort((a, b) => {
    const ap = a.position;
    const bp = b.position;
    if (ap == null && bp == null) return 0;
    if (ap == null) return 1;
    if (bp == null) return -1;
    return ap - bp;
  });
}

function Header() {
  return (
    <div className="flex items-baseline justify-between mb-3">
      <h4 className="text-xs font-semibold text-brand-on-surface dark:text-brand-outline uppercase tracking-wider font-label">
        Top 3 Keywords
      </h4>
      <span className="text-[10px] text-brand-outline font-label">Best SERP positions</span>
    </div>
  );
}

export default function TopKeywordsPanel({ siteId }) {
  const { status, isLoading } = useKeywordsStatus(siteId);
  const items = status?.items || [];
  const sorted = sortByPosition(items).slice(0, 3);
  const topHasRanked = sorted.some((it) => it.position != null);

  if (isLoading) {
    return (
      <div>
        <Header />
        <div className="flex justify-center py-4">
          <Spinner size="sm" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div>
        <Header />
        <p className="text-[11px] text-brand-outline text-center py-4 font-label">
          No keywords tracked yet. Add them in the details tab to track SERP positions.
        </p>
      </div>
    );
  }

  if (!topHasRanked) {
    return (
      <div>
        <Header />
        <p className="text-[11px] text-brand-outline text-center py-4 font-label">
          No ranked keywords yet. Run a refresh in the details tab.
        </p>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <table className="w-full text-xs font-label">
        <thead>
          <tr className="text-left text-brand-on-surface-variant dark:text-brand-outline border-b border-brand-outline-variant dark:border-brand-outline">
            <th className="py-2 px-2 font-medium">#</th>
            <th className="py-2 px-2 font-medium">Keyword</th>
            <th className="py-2 px-2 font-medium text-right">Position</th>
            <th className="py-2 px-2 font-medium text-right">Δ</th>
            <th className="py-2 px-2 font-medium text-right">Volume</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((it, idx) => (
            <tr
              key={it.keyword}
              className="border-b border-brand-outline-variant dark:border-brand-outline last:border-b-0 hover:bg-brand-surface-container-low dark:hover:bg-brand-on-surface/40"
            >
              <td className="py-2 px-2 text-brand-outline tabular-nums">{idx + 1}</td>
              <td className="py-2 px-2 font-medium text-brand-on-surface dark:text-brand-outline-variant">
                {it.keyword}
              </td>
              <td className="py-2 px-2 text-right tabular-nums">
                <span className={positionClass(it.position)}>
                  {it.position == null ? 'Not ranked' : it.position}
                </span>
              </td>
              <td className="py-2 px-2 text-right tabular-nums">
                <DeltaCell position={it.position} previousPosition={it.previousPosition} />
              </td>
              <td className="py-2 px-2 text-right text-brand-on-surface-variant dark:text-brand-outline tabular-nums">
                {fmt(it.searchVolume)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
