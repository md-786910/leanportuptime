import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { fetchPlugins, triggerPluginScan } from '../api/plugins.api';

export const usePlugins = (siteId) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['plugins', siteId],
    queryFn: () => fetchPlugins(siteId),
    enabled: !!siteId,
    staleTime: 60000,
  });

  return { audit: data, isLoading, error };
};

export const usePluginScan = (siteId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => triggerPluginScan(siteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plugins', siteId] });
      toast.success('Plugin scan triggered');
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Scan failed'),
  });
};
