import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useSeoReportStore = create(
  persist(
    (set) => ({
      colorTheme: 'default',
      setColorTheme: (theme) => set({ colorTheme: theme }),
      viewMode: 'charts',
      setViewMode: (mode) => set({ viewMode: mode }),
      period: 'thisMonth',
      customFrom: null,
      customTo: null,
      setPeriod: (period) => set({ period }),
      setCustomFrom: (customFrom) => set({ customFrom }),
      setCustomTo: (customTo) => set({ customTo }),
    }),
    {
      name: 'wp-sentinel-seo-report',
      partialize: (state) => ({
        colorTheme: state.colorTheme,
        period: state.period,
        customFrom: state.customFrom,
        customTo: state.customTo,
      }),
    }
  )
);
