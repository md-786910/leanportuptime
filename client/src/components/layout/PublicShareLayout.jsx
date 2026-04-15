import Badge from '../common/Badge';

export default function PublicShareLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-brand-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">WP</span>
          </div>
          <span className="text-lg font-bold text-gray-900 dark:text-white">Sentinel</span>
          <Badge variant="neutral">Shared Report</Badge>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 md:px-6 py-6">{children}</main>
    </div>
  );
}
