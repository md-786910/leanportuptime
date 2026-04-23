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
    <header className="w-full h-18 sticky top-0 z-40 bg-[#f2f4f6] p-4">
      <div className="flex items-center justify-between gap-6">
        {/* Left: Hamburger & Search */}
        <div className="flex items-center gap-4 flex-1">
          <button
            onClick={toggleSidebar}
            className="p-2.5 rounded-xl text-brand-on-surface-variant hover:bg-brand-surface-container-lowest dark:hover:bg-brand-on-surface transition-all duration-200 md:hidden active:scale-95"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="hidden sm:block max-w-md w-full">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <svg className="h-4.5 w-4.5 text-brand-outline group-focus-within:text-brand-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search analytics..."
                className="block w-full pl-11 pr-4 py-2 bg-brand-surface-container-lowest/50 dark:bg-brand-on-surface/50 border-transparent focus:border-transparent rounded-xl text-[13px] placeholder-slate-500 text-brand-on-surface dark:text-brand-outline-variant focus:outline-none focus:ring-2 ring-1 ring-brand-primary-container/50 focus:ring-brand-primary-container/20 focus:bg-brand-surface-container-lowest dark:focus:bg-brand-on-surface transition-all duration-200"
              />
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 md:gap-4">
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl text-brand-on-surface-variant hover:bg-brand-surface-container-lowest dark:hover:bg-brand-on-surface transition-all duration-200"
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
          </button>

          <button
            className="p-2.5 rounded-xl text-brand-on-surface-variant hover:bg-[#f8f9f9] dark:hover:bg-brand-on-surface transition-all duration-200 relative group"
            title="Notifications"
          >
            <svg className="h-5 w-5 group-hover:rotate-12 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute top-2.5 right-2.5 h-2 w-2 bg-rose-500 rounded-full border-2 border-white dark:border-brand-outline"></span>
          </button>

          <div className="w-px h-6 bg-brand-surface-container-high dark:bg-brand-on-surface hidden sm:block"></div>

          {/* User Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#f8f9f9] dark:hover:bg-brand-on-surface transition-all duration-200"
            >
              <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-brand-primary to-brand-primary-container flex items-center justify-center shadow-md ring-2 ring-white dark:ring-slate-900">
                <span className="text-sm font-bold font-label text-white uppercase">
                  {user?.name?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-[13px] font-bold text-brand-on-surface dark:text-white leading-none mb-0.5">
                  {user?.name?.split(' ')[0] || 'User'}
                </p>
                <p className="text-[10px] font-bold text-brand-outline dark:text-brand-on-surface-variant uppercase tracking-wider leading-none font-label">
                  {user?.role || 'Member'}
                </p>
              </div>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-3 w-64 bg-brand-surface-container-lowest dark:bg-brand-on-surface rounded-xl shadow-2xl border border-brand-outline-variant dark:border-brand-outline py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                <div className="px-5 py-4 border-b border-brand-outline-variant dark:border-brand-outline/60 mb-1">
                  <p className="text-sm font-bold text-brand-on-surface dark:text-white">{user?.name}</p>
                  <p className="text-[11px] text-brand-on-surface-variant dark:text-brand-outline font-medium truncate mt-0.5 font-label">{user?.email}</p>
                </div>
                <div className="px-2 py-1">
                  <button
                    onClick={() => { setDropdownOpen(false); logout(); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
