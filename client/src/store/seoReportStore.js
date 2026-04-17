import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useSeoReportStore = create(
  persist(
    (set) => ({
      colorTheme: 'default',
      setColorTheme: (theme) => set({ colorTheme: theme }),
      viewMode: 'charts',
      setViewMode: (mode) => set({ viewMode: mode }),
    }),
    { name: 'wp-sentinel-seo-report' }
  )
);
