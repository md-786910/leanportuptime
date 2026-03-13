import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="w-full max-w-md">
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="h-10 w-10 rounded-xl bg-brand-600 flex items-center justify-center">
              <span className="text-white font-bold">WP</span>
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">Sentinel</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">WordPress Monitoring Service</p>
        </div>

        {/* Auth card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
