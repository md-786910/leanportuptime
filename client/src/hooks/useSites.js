import { useQuery } from '@tanstack/react-query';
import { fetchSites, fetchSite, fetchPerformanceDashboardTrends } from '../api/sites.api';

export const useSites = (params = {}) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['sites', params],
    queryFn: () => fetchSites(params),
    staleTime: 30000,
    refetchInterval: 30000,
  });

  return {
    sites: data?.sites || [],
    meta: data?.meta || {},
    isLoading,
    error,
    refetch,
  };
};

export const useSite = (id) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['site', id],
    queryFn: () => fetchSite(id),
    enabled: !!id,
    staleTime: 30000,
  });

  return { site: data, isLoading, error, refetch };
};

export const usePerformanceDashboardTrends = (days = 30) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['performanceDashboardTrends', days],
    queryFn: () => fetchPerformanceDashboardTrends(days),
    staleTime: 60000,
    refetchInterval: 120000,
  });

  return {
    trends: data?.trends || [],
    dateRange: data?.dateRange || {},
    totalSites: data?.totalSites || 0,
    isLoading,
    error,
    refetch,
  };
};
