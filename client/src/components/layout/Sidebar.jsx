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
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-30 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          md:relative md:z-auto md:translate-x-0 md:inset-y-auto md:left-auto
          h-screen w-64 md:w-60 flex-shrink-0
          bg-gradient-to-b from-[#f7f9fb] to-[#f2f4f6] dark:from-brand-inverse-surface dark:to-brand-inverse-surface
          border-r border-brand-outline-variant/50 dark:border-white/10
          flex flex-col
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="h-16 flex items-center gap-2.5 px-5 border-b border-brand-outline-variant/40 dark:border-white/5">
          <div className="h-8 w-8 rounded-lg bg-brand-primary flex items-center justify-center">
            <svg className="h-[18px] w-[18px] text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.25} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <span className="text-[17px] font-bold font-headline tracking-tight text-slate-900 dark:text-white">Sitelyze</span>
          <span className="ml-auto text-[10px] font-semibold font-label text-brand-on-surface-variant dark:text-slate-400 bg-brand-surface-container dark:bg-white/5 px-1.5 py-0.5 rounded-md">
            Enterprise
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-5 space-y-6 overflow-y-auto">
          {menuGroups.map((group) => {
            const visibleItems = group.items.filter(item => !item.adminOnly || user?.role === 'admin');
            if (visibleItems.length === 0) return null;

            return (
              <div key={group.title} className="space-y-0.5">
                <h3 className="px-3 mb-2 text-[11px] font-medium font-label text-brand-outline dark:text-slate-500">
                  {group.title}
                </h3>
                {visibleItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium font-label transition-colors group ${
                        isActive
                          ? 'bg-brand-primary-container text-white shadow-sm shadow-brand-primary/20'
                          : 'text-brand-on-surface-variant dark:text-slate-400 hover:bg-brand-surface-container dark:hover:bg-white/5 hover:text-brand-on-surface dark:hover:text-white'
                      }`
                    }
                    onClick={() => {
                      if (window.innerWidth < 768) toggleSidebar();
                    }}
                  >
                    {({ isActive }) => (
                      <>
                        <span className={`flex-shrink-0 [&>svg]:h-[18px] [&>svg]:w-[18px] ${isActive ? 'text-white' : 'text-brand-outline group-hover:text-brand-on-surface dark:group-hover:text-slate-300'}`}>
                          {item.icon}
                        </span>
                        <span className="flex-1">{item.label}</span>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>

        {/* Support */}
        <div className="p-3 border-t border-brand-outline-variant/40 dark:border-white/5">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-brand-surface-container dark:hover:bg-white/5 transition-colors group">
            <span className="h-8 w-8 rounded-lg bg-brand-surface-container-lowest dark:bg-white/5 border border-brand-outline-variant/50 flex items-center justify-center text-brand-outline group-hover:text-brand-primary transition-colors">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            <span className="min-w-0">
              <span className="block text-[13px] font-medium font-label text-slate-700 dark:text-slate-200">Need help?</span>
              <span className="block text-[11px] font-label text-slate-400">Contact support · 24/7</span>
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
