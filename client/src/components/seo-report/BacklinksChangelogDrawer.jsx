import Modal from '../common/Modal';
import Spinner from '../common/Spinner';
import { useBacklinksChangelog } from '../../hooks/useBacklinks';

const STAT_LABEL = {
  domainRank: 'DA',
  backlinksCount: 'Backlinks',
  referringDomains: 'Ref. Domains',
  newLinksLast30d: 'New Links',
  lostLinksLast30d: 'Lost Links',
};

function formatDateTime(d) {
  if (!d) return '';
  const dt = new Date(d);
  return dt.toLocaleString();
}

function SourceBadge({ source }) {
  const cls = source === 'manual'
    ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
    : 'bg-brand-surface-container-high text-brand-on-surface-variant dark:bg-brand-on-surface dark:text-brand-outline';
  return (
    <span className={`text-[9px] font-semibold font-label uppercase tracking-wider px-1.5 py-0.5 rounded ${cls}`}>
      {source === 'manual' ? 'Manual' : 'API'}
    </span>
  );
}

function StatsDiff({ before, after }) {
  const keys = Object.keys(STAT_LABEL).filter((k) => (before?.[k] ?? null) !== (after?.[k] ?? null));
  if (keys.length === 0) return <span className="text-[11px] text-brand-outline font-label">No field changes</span>;
  return (
    <ul className="text-[11px] text-brand-on-surface-variant dark:text-brand-outline font-label space-y-0.5">
      {keys.map((k) => (
        <li key={k} className="flex items-center gap-2">
          <span className="text-brand-outline">{STAT_LABEL[k]}:</span>
          <span className="tabular-nums">{before?.[k] ?? '—'} → {after?.[k] ?? '—'}</span>
        </li>
      ))}
    </ul>
  );
}

function ItemSummary({ entry }) {
  const label = entry.kind === 'item-added' ? 'added' : entry.kind === 'item-removed' ? 'removed' : 'updated';
  return (
    <div className="text-[11px] text-brand-on-surface-variant dark:text-brand-outline font-label">
      Backlink {label} — <span className="text-brand-on-surface dark:text-brand-outline-variant">{entry.itemSourceUrl || '(unknown source)'}</span>
    </div>
  );
}

export default function BacklinksChangelogDrawer({ isOpen, onClose, siteId }) {
  const { entries, isLoading } = useBacklinksChangelog(siteId, { enabled: isOpen });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Backlinks change history" size="lg">
      {isLoading ? (
        <div className="flex justify-center py-8"><Spinner size="sm" /></div>
      ) : entries.length === 0 ? (
        <p className="text-xs text-brand-outline text-center py-6 font-label">No changes recorded yet.</p>
      ) : (
        <ul className="divide-y divide-brand-outline-variant dark:divide-brand-outline">
          {entries.map((entry, idx) => (
            <li key={idx} className="py-3 space-y-1">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <SourceBadge source={entry.source} />
                  <span className="text-[11px] text-brand-outline font-label">
                    {formatDateTime(entry.changedAt)}
                  </span>
                  {entry.changedBy?.email && (
                    <span className="text-[11px] text-brand-on-surface-variant dark:text-brand-outline font-label">· {entry.changedBy.email}</span>
                  )}
                  {!entry.changedBy && entry.source === 'api' && (
                    <span className="text-[11px] text-brand-outline font-label">· Automated refresh</span>
                  )}
                </div>
                <span className="text-[10px] font-semibold font-label uppercase tracking-wider px-1.5 py-0.5 rounded bg-brand-surface-container-high text-brand-on-surface-variant dark:bg-brand-on-surface dark:text-brand-outline">
                  {entry.kind}
                </span>
              </div>
              {entry.kind === 'stats' ? (
                <StatsDiff before={entry.before} after={entry.after} />
              ) : (
                <ItemSummary entry={entry} />
              )}
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
