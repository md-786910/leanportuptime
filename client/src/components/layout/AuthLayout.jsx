import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export default function AuthLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-surface-container-low dark:bg-brand-on-surface px-4">
      <div className="w-full max-w-md">
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="h-10 w-10 rounded-xl bg-brand-primary flex items-center justify-center">
              <span className="text-white font-bold font-label">WP</span>
            </div>
            <span className="text-2xl font-bold font-label text-brand-on-surface dark:text-white">Sentinel</span>
          </div>
          <p className="text-sm text-brand-on-surface-variant dark:text-brand-outline">WordPress Monitoring Service</p>
        </div>

        {/* Auth card */}
        <div className="bg-brand-surface-container-lowest dark:bg-brand-on-surface rounded-xl shadow-sm border border-brand-outline-variant dark:border-brand-outline p-6 sm:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
