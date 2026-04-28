function scoreTextColorClass(score) {
  if (score >= 90) return 'text-green-500';
  if (score >= 50) return 'text-[#a44100]';
  return 'text-[#ba1a1a]';
}

function Gauge({ score, label, icon, desc }) {
  const textColor = scoreTextColorClass(score);
  const circumference = 251.2;
  const offset = circumference - ((score || 0) / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="flex justify-between items-start mb-2 w-full px-2">
        <span className="text-sm font-bold font-headline text-brand-on-surface-variant">{label}</span>
        <span className={`material-symbols-outlined ${textColor}`} style={{ fontVariationSettings: "'FILL' 1" }}>{icon || 'speed'}</span>
      </div>
      <div className="flex items-center justify-center relative py-2">
        <svg className="w-24 h-24 transform -rotate-90">
          <circle className="text-brand-surface-container-high" cx="48" cy="48" fill="transparent" r="40" stroke="currentColor" strokeWidth="8"></circle>
          <circle className={`${textColor} transition-all duration-1000 ease-out`} cx="48" cy="48" fill="transparent" r="40" stroke="currentColor" strokeDasharray="251.2" strokeDashoffset={offset} strokeWidth="8" strokeLinecap="round"></circle>
        </svg>
        <span className={`absolute text-2xl font-headline font-extrabold ${textColor}`}>{score || 0}</span>
      </div>
      <p className="text-xs text-center mt-2 text-brand-on-surface-variant font-medium">{desc}</p>
    </div>
  );
}

export default function ScoreGaugesRow({ scores }) {
  if (!scores) return null;

  return (
    <div className="py-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <Gauge score={scores.performance} label="Performance" icon="speed" desc={scores.performance >= 90 ? 'Excellent loading speed' : 'Improvements needed for speed'} />
        <Gauge score={scores.accessibility} label="Accessibility" icon="accessibility_new" desc={scores.accessibility >= 90 ? 'Highly accessible' : 'Fix accessibility issues'} />
        <Gauge score={scores.bestPractices} label="Best Practices" icon="verified" desc={scores.bestPractices >= 90 ? 'Exceeding web standards' : 'Update modern practices'} />
        <Gauge score={scores.seo} label="SEO" icon="travel_explore" desc={scores.seo >= 90 ? 'Optimization is within targets' : 'SEO improvements required'} />
      </div>
    </div>
  );
}