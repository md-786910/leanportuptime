import { useQuery } from '@tanstack/react-query';
import { getFormSubmissionsCount, getFormSubmissions } from '../api/formSubmissions.api';

// Dedicated count hook for the "Form Submitted" KPI. Independent of GA4 so it
// works even when no Analytics property is linked.
export const useFormSubmissionsCount = (siteId, period = '28d', dateRange = null) => {
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['formSubmissionsCount', siteId, period, dateRange],
    queryFn: () => getFormSubmissionsCount(siteId, period, dateRange),
    enabled: !!siteId && (period !== 'custom' || !!dateRange),
    staleTime: 5 * 60 * 1000,
  });
  return { count: data?.count ?? 0, isLoading, isFetching };
};

// List hook for the drawer — only fetches once the drawer is open.
export const useFormSubmissions = (siteId, params = {}, { enabled = true } = {}) => {
  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ['formSubmissions', siteId, params],
    queryFn: () => getFormSubmissions(siteId, params),
    enabled: !!siteId && enabled && (params.period !== 'custom' || !!params.dateRange),
    staleTime: 5 * 60 * 1000,
    keepPreviousData: true,
  });
  return {
    rows: data?.rows || [],
    meta: data?.meta || { page: 1, limit: params.limit || 20, total: 0 },
    isLoading,
    isFetching,
    error,
  };
};
