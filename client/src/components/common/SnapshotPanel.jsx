// Purple accent panel from the reference (image 2 "Snapshot" card).
// 2x2 stat grid on a primary-container background with a soft blurred orb decoration.
export default function SnapshotPanel({ title = 'Snapshot', icon = 'insights', items = [], className = '' }) {
  return (
    <div className={`bg-brand-primary-container text-brand-on-primary rounded-3xl p-6 shadow-sm relative overflow-hidden ${className}`}>
      <div className="flex items-center justify-between mb-5 relative z-10">
        <h3 className="font-headline text-base font-bold">{title}</h3>
        {icon && <span className="material-symbols-outlined opacity-80">{icon}</span>}
      </div>
      <div className="grid grid-cols-2 gap-3 relative z-10">
        {items.map((it) => (
          <div key={it.label} className="bg-white/10 rounded-xl p-3">
            <div className="text-[10px] font-label uppercase tracking-wider opacity-80">{it.label}</div>
            <div className="font-headline text-xl font-extrabold mt-1 tabular-nums">{it.value}</div>
          </div>
        ))}
      </div>
      <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none" />
    </div>
  );
}
