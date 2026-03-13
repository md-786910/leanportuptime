import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { fetchCheckHistory, fetchCheckSummary } from '../api/checks.api';

export const useCheckSummary = (siteId, period = '24h') => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['checkSummary', siteId, period],
    queryFn: () => fetchCheckSummary(siteId, period),
    enabled: !!siteId,
    staleTime: 30000,
  });

  return { summary: data, isLoading, error };
};

export const useCheckHistory = (siteId, params = {}) => {
  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['checkHistory', siteId, params],
    queryFn: ({ pageParam }) =>
      fetchCheckHistory(siteId, { ...params, cursor: pageParam, limit: params.limit || 50 }),
    enabled: !!siteId,
    getNextPageParam: (lastPage) => lastPage.meta?.nextCursor || undefined,
    staleTime: 30000,
  });

  const checks = data?.pages?.flatMap((page) => page.checks) || [];

  return { checks, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage };
};
