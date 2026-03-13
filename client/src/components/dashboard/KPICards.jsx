import Card from '../common/Card';

export default function KPICards({ sites }) {
  const total = sites.length;
  const up = sites.filter((s) => s.currentStatus === 'up').length;
  const down = sites.filter((s) => s.currentStatus === 'down').length;
  const degraded = sites.filter((s) => s.currentStatus === 'degraded').length;

  const cards = [
    { label: 'Total Sites', value: total, color: 'text-brand-600', bg: 'bg-brand-50 dark:bg-brand-900/20' },
    { label: 'Up', value: up, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { label: 'Down', value: down, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
    { label: 'Degraded', value: degraded, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.label} padding="sm">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-lg ${card.bg} flex items-center justify-center`}>
              <span className={`text-lg font-bold ${card.color}`}>{card.value}</span>
            </div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{card.label}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}
