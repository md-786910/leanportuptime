import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { fetchSiteScan, triggerSiteScan } from '../api/sitescan.api';

export const useSiteScan = (siteId) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['sitescan', siteId],
    queryFn: () => fetchSiteScan(siteId),
    enabled: !!siteId,
    staleTime: 60000,
  });

  return { scan: data, isLoading, error };
};

export const useSiteScanTrigger = (siteId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => triggerSiteScan(siteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sitescan', siteId] });
      toast.success('Full site scan triggered');
    },
    onError: (err) =>
      toast.error(err.response?.data?.error?.message || 'Scan failed'),
  });
};
