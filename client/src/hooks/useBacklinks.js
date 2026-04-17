import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { getBacklinksStatus, refreshBacklinks } from '../api/backlinks.api';

export const useBacklinksStatus = (siteId) => {
  const { data, isLoading } = useQuery({
    queryKey: ['backlinksStatus', siteId],
    queryFn: () => getBacklinksStatus(siteId),
    enabled: !!siteId,
    staleTime: 60000,
  });
  return { status: data, isLoading };
};

export const useBacklinksRefresh = (siteId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => refreshBacklinks(siteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backlinksStatus', siteId] });
      toast.success('Backlinks data refreshed');
    },
    onError: (err) => {
      const errData = err.response?.data?.error;
      if (errData?.code === 'QUOTA_EXCEEDED') {
        toast.error(errData.message || 'Monthly limit reached. Increase in settings.');
      } else if (errData?.code === 'PROVIDER_NOT_CONFIGURED') {
        toast.error('Backlinks provider not configured');
      } else {
        toast.error(errData?.message || 'Failed to refresh backlinks');
      }
    },
  });
};
