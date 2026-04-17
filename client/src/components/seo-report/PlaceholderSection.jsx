import Card from '../common/Card';
import Badge from '../common/Badge';

export default function PlaceholderSection() {
  return (
    <Card>
      <div className="flex items-start gap-3 opacity-60">
        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
          <span className="text-lg">📈</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Google Analytics</h4>
            <Badge variant="neutral">Coming Soon</Badge>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Connect to view sessions, goal completions, bounce rate, and traffic sources.
          </p>
        </div>
        <svg className="w-5 h-5 text-gray-300 dark:text-gray-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
    </Card>
  );
}
