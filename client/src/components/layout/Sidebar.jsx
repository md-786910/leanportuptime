import { NavLink } from 'react-router-dom';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';

const menuGroups = [
  {
    title: 'Overview',
    items: [
      {
        to: '/',
        label: 'Dashboard',
        icon: (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        ),
      },
    ]
  },
  {
    title: 'Management',
    items: [
      {
        to: '/notifications',
        label: 'Notifications',
        adminOnly: true,
        icon: (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        ),
      },
      {
        to: '/team',
        label: 'Team Members',
        adminOnly: true,
        icon: (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        ),
      },
    ]
  },
  {
    title: 'System',
    items: [
      {
        to: '/settings',
        label: 'Settings',
        icon: (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        ),
      },
    ]
  }
];

export default function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const user = useAuthStore((s) => s.user);

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-brand-inverse-surface/60 backdrop-blur-sm z-30 md:hidden transition-opacity duration-300"
          onClick={toggleSidebar}
        />
      )}

      <aside
        className={`h-screen w-60 rounded-r-lg bg-gradient-to-b from-[#f7f9fb] to-[#f2f4f6] shadow-xl shadow-slate-200/50 flex flex-col gap-2 z-50`}
      >
        {/* Logo Section */}
        <div className="flex items-center gap-3.5 px-4 py-4">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-brand-primary to-brand-primary-container flex items-center justify-center shadow-md shadow-brand-primary/20 transform hover:rotate-3 transition-transform">
            <svg className="h-6 w-6 text-brand-on-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <span className="text-xl font-bold font-label tracking-tight text-brand-on-surface">Sentinel</span>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-secondary animate-pulse"></span>
              <p className="text-[10px] font-bold font-label text-brand-on-surface-variant uppercase tracking-widest">Enterprise</p>
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 px-4 py-4 space-y-8 overflow-y-auto scrollbar-hide">
          {menuGroups.map((group) => {
            const visibleItems = group.items.filter(item => !item.adminOnly || user?.role === 'admin');
            if (visibleItems.length === 0) return null;

            return (
              <div key={group.title} className="space-y-1">
                <h3 className="px-4 text-[11px] font-bold font-label text-brand-outline uppercase tracking-[0.15em] mb-3">
                  {group.title}
                </h3>
                {visibleItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                      `flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-[13px] font-semibold font-label transition-all duration-200 group relative ${
                        isActive
                          ? 'bg-brand-primary-container text-brand-on-primary-container'
                          : 'text-brand-on-surface-variant hover:bg-brand-surface-container-low hover:text-brand-on-surface'
                      }`
                    }
                    onClick={() => {
                      if (window.innerWidth < 768) toggleSidebar();
                    }}
                  >
                    {({ isActive }) => (
                      <>
                        <span className={`flex-shrink-0 transition-colors duration-200 ${isActive ? 'text-brand-on-primary-container' : 'text-brand-outline group-hover:text-brand-on-surface'}`}>
                          {item.icon}
                        </span>
                        <span className="flex-1">{item.label}</span>
                        {isActive && (
                          <span className="absolute left-0 w-1 h-5 bg-brand-primary rounded-r-full shadow-[2px_0_8px_rgba(51,102,255,0.3)]" />
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>

        {/* Premium Support Card / Footer */}
        <div className="p-4 mt-auto border-t border-brand-outline-variant dark:border-brand-outline/20">
          <div className="relative overflow-hidden px-4 py-4 rounded-lg bg-gradient-to-br from-brand-primary/10 to-brand-primary/5 dark:from-brand-primary/20 dark:to-brand-primary/10 border border-brand-primary/20 shadow-sm">
            {/* Background Decoration */}
            <div className="absolute -right-3 -top-3 h-12 w-12 bg-brand-primary/10 dark:bg-brand-primary/20 rounded-full blur-xl" />
            
            <div className="relative z-10 space-y-2">
              <p className="text-xs font-bold font-label text-brand-on-surface dark:text-white">Need assistance?</p>
              <p className="text-[11px] font-label text-brand-outline dark:text-brand-on-surface-variant leading-relaxed">Our dedicated support team is available 24/7.</p>
              <button className="w-full py-2 mt-3 bg-brand-primary hover:opacity-90 text-white text-xs font-bold font-label rounded-lg shadow-md shadow-brand-primary/20 transition-all duration-200 hover:scale-105 active:scale-95">
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
