// Numbered rank badge with gold/silver/bronze for top-3, neutral chips after.
// Used for ranked lists (Top Keywords, Leaderboards, etc.).
//
//   <RankBadge rank={1} />  → gold
//   <RankBadge rank={5} />  → neutral chip
const STYLES = {
  1: 'bg-gradient-to-br from-amber-300 to-amber-500 text-white shadow-sm shadow-amber-500/30',
  2: 'bg-gradient-to-br from-slate-300 to-slate-400 text-white shadow-sm shadow-slate-400/30',
  3: 'bg-gradient-to-br from-orange-300 to-orange-500 text-white shadow-sm shadow-orange-500/30',
};

export default function RankBadge({ rank, className = '' }) {
  const cls = STYLES[rank] || 'bg-brand-surface-container-high dark:bg-brand-on-surface text-brand-on-surface-variant dark:text-brand-outline';
  return (
    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-[11px] font-bold font-headline tabular-nums ${cls} ${className}`}>
      {rank}
    </span>
  );
}
