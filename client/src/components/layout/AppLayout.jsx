import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useUIStore } from '../../store/uiStore';

export default function AppLayout() {
  const initTheme = useUIStore((s) => s.initTheme);

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  return (
    <div className="flex h-screen overflow-hidden bg-brand-surface-container-low dark:bg-brand-on-surface">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-[#f9fafb] via-[#ffffff] to-[#f3f4f6] dark:from-brand-on-surface dark:via-brand-on-surface/95 dark:to-brand-on-surface p-6 md:p-8 lg:p-10">
          <div className="max-w-8xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
