import { RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';
import { gaugeColor } from './colorThemes';

function ScoreGauge({ label, score, themeKey, index }) {
  if (score == null) return null;

  const color = gaugeColor(score, themeKey, index);
  const data = [{ value: score, fill: color }];

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <RadialBarChart
          width={140}
          height={140}
          cx={70}
          cy={70}
          innerRadius={52}
          outerRadius={66}
          barSize={14}
          data={data}
          startAngle={90}
          endAngle={-270}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
          <RadialBar
            background={{ fill: '#e5e7eb', className: 'dark:fill-gray-700' }}
            dataKey="value"
            angleAxisId={0}
            cornerRadius={7}
          />
        </RadialBarChart>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold" style={{ color }}>{score}</span>
        </div>
      </div>
      <span className="text-xs font-medium text-gray-600 dark:text-gray-400 text-center">{label}</span>
    </div>
  );
}

function ScoreLegend({ themeKey }) {
  if (themeKey !== 'default') return null;

  return (
    <div className="flex items-center justify-center gap-4 text-xs text-gray-500 dark:text-gray-400 mt-2">
      <div className="flex items-center gap-1.5">
        <span className="inline-block w-0 h-0 border-l-[5px] border-r-[5px] border-b-[8px] border-transparent border-b-red-500" />
        <span>0–49</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="inline-block w-2.5 h-2.5 bg-amber-500" />
        <span>50–89</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500" />
        <span>90–100</span>
      </div>
    </div>
  );
}

export default function ScoreGaugesRow({ scores, themeKey }) {
  if (!scores) return null;

  const categories = [
    { key: 'performance', label: 'Performance' },
    { key: 'accessibility', label: 'Accessibility' },
    { key: 'bestPractices', label: 'Best Practices' },
    { key: 'seo', label: 'SEO' },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 place-items-center">
        {categories.map((cat, i) => (
          <ScoreGauge
            key={cat.key}
            label={cat.label}
            score={scores[cat.key]}
            themeKey={themeKey}
            index={i}
          />
        ))}
      </div>
      <ScoreLegend themeKey={themeKey} />
    </div>
  );
}
