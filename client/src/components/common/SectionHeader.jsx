// Section header used by the SEO Report layout: colored numbered/icon badge +
// title + horizontal accent gradient line + optional actions slot.
//
//   <SectionHeader number={3} title="Organic Traffic" accent="emerald" />
//   <SectionHeader icon={<UsersIcon />} title="Team" accent="indigo"
//                  description="Manage members and roles"
//                  actions={<Button>Invite</Button>} />

const ACCENT_SOLID = {
  indigo:  '#6366F1',
  emerald: '#10B981',
  amber:   '#F59E0B',
  violet:  '#8B5CF6',
  blue:    '#3B82F6',
  rose:    '#F43F5E',
  sky:     '#0EA5E9',
};

export default function SectionHeader({
  number,
  icon,
  title,
  description,
  accent = 'indigo',
  actions,
  className = '',
}) {
  const color = ACCENT_SOLID[accent] || ACCENT_SOLID.indigo;
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center gap-3 mb-4 ${className}`}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-[12px] font-headline flex-shrink-0"
          style={{ background: color, boxShadow: `0 2px 4px ${color}40` }}
        >
          {number != null ? number : icon}
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-brand-on-surface dark:text-brand-outline-variant tracking-tight font-headline truncate">
            {title}
          </h3>
          {description && (
            <p className="text-[11px] text-brand-outline dark:text-brand-on-surface-variant font-label mt-0.5 truncate">
              {description}
            </p>
          )}
        </div>
        <div
          className="hidden sm:block flex-1 h-[2px] rounded-sm ml-2"
          style={{ background: `linear-gradient(to right, ${color}, ${color}00)` }}
        />
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  );
}
