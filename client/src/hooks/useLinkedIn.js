import { useQuery } from '@tanstack/react-query';
import { getLinkedInMetrics } from '../api/linkedin.api';

export const useLinkedInMetrics = (siteId, period = '28d', dateRange = null) => {
  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ['linkedinMetrics', siteId, period, dateRange],
    queryFn: () => getLinkedInMetrics(siteId, period, dateRange),
    enabled: !!siteId && (period !== 'custom' || !!dateRange),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  return { metrics: data, isLoading, isFetching, error };
};
