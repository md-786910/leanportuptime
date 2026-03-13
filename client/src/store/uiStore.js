import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useUIStore = create(
  persist(
    (set, get) => ({
      sidebarOpen: true,
      theme: 'light',

      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      setTheme: (theme) => {
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        set({ theme });
      },

      toggleTheme: () => {
        const newTheme = get().theme === 'light' ? 'dark' : 'light';
        get().setTheme(newTheme);
      },

      initTheme: () => {
        const { theme } = get();
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        }
      },
    }),
    { name: 'wp-sentinel-ui' }
  )
);
