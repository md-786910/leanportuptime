export default function ScoreBar({ score, totalChecks, passedChecks, failedChecks }) {
  let color = 'text-red-600 dark:text-red-400';
  let barColor = 'bg-red-500';
  if (score >= 80) {
    color = 'text-emerald-600 dark:text-emerald-400';
    barColor = 'bg-emerald-500';
  } else if (score >= 50) {
    color = 'text-amber-600 dark:text-amber-400';
    barColor = 'bg-amber-500';
  }

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-2">
        <span className={`text-4xl font-bold ${color} font-headline`}>{score}</span>
        <span className="text-sm text-brand-on-surface-variant dark:text-brand-outline mb-1">/ 100</span>
      </div>
      <div className="w-full h-3 bg-brand-surface-container-high dark:bg-brand-on-surface rounded-full overflow-hidden">
        <div className={`h-full ${barColor} rounded-full transition-all duration-500`} style={{ width: `${score}%` }} />
      </div>
      <div className="flex gap-4 text-xs text-brand-on-surface-variant dark:text-brand-outline font-label">
        <span>{passedChecks} passed</span>
        <span>{failedChecks} failed</span>
        <span>{totalChecks} total</span>
      </div>
    </div>
  );
}
