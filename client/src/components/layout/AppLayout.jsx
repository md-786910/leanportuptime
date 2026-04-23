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
        <main className="flex-1 overflow-y-auto bg-[#f8f9f9] dark:bg-brand-on-surface p-6 md:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
