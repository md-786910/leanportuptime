import { useState, useRef, useEffect } from 'react';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { useAuth } from '../../hooks/useAuth';

export default function Header() {
  const { toggleSidebar, toggleTheme, theme } = useUIStore();
  const { user } = useAuthStore();
  const { logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <header className="h-16 flex-shrink-0 sticky top-0 z-40 bg-[#f2f4f6] dark:bg-brand-inverse-surface border-b border-brand-outline-variant/50 dark:border-white/10 px-4 sm:px-6 lg:px-8">
      <div className="h-full flex items-center justify-between gap-4">
        {/* Left: Hamburger & Search */}
        <div className="flex items-center gap-3 flex-1">
          <button
            onClick={toggleSidebar}
            aria-label="Toggle menu"
            className="p-2 -ml-2 rounded-lg text-slate-500 hover:bg-white dark:hover:bg-white/5 md:hidden"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="hidden sm:block max-w-sm w-full">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search…"
                className="block w-full h-9 pl-9 pr-3 bg-brand-surface-container-lowest dark:bg-white/5 border border-brand-outline-variant/60 rounded-lg text-[13px] text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-brand-primary/40 dark:focus:border-white/20 focus:ring-4 focus:ring-brand-primary/10 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-slate-500 hover:bg-white dark:hover:bg-white/5"
            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {theme === 'light' ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            )}
          </button> */}

          <button
            className="h-9 w-9 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/5"
            title="Notifications"
            aria-label="Notifications"
          >
            <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>

          <div className="w-px h-5 bg-slate-200 dark:bg-white/10 mx-1 hidden sm:block" />

          {/* User Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2.5 pl-1 pr-2 py-1 rounded-lg hover:bg-white dark:hover:bg-white/5"
            >
              <div className="h-8 w-8 rounded-full bg-brand-50 dark:bg-brand-primary/20 flex items-center justify-center">
                <span className="text-[13px] font-semibold font-label text-brand-primary dark:text-brand-400 uppercase">
                  {user?.name?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-[13px] font-semibold text-slate-900 dark:text-white leading-tight">
                  {user?.name?.split(' ')[0] || 'User'}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 capitalize leading-tight font-label">
                  {user?.role || 'Member'}
                </p>
              </div>
              <svg className={`hidden sm:block h-4 w-4 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-60 max-w-[calc(100vw-2rem)] bg-white dark:bg-brand-inverse-surface rounded-xl shadow-soft border border-slate-200/80 dark:border-white/10 p-1.5 z-50">
                <div className="px-3 py-2.5 mb-1 border-b border-slate-100 dark:border-white/5">
                  <p className="text-[13px] font-semibold text-slate-900 dark:text-white truncate">{user?.name}</p>
                  <p className="text-[12px] text-slate-500 dark:text-slate-400 truncate font-label">{user?.email}</p>
                </div>
                <button
                  onClick={() => { setDropdownOpen(false); logout(); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
