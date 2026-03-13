import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { fetchSSL, fetchSSLHistory, triggerSSLCheck } from '../api/ssl.api';

export const useSSL = (siteId) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['ssl', siteId],
    queryFn: () => fetchSSL(siteId),
    enabled: !!siteId,
    staleTime: 60000,
  });

  return { ssl: data, isLoading, error };
};

export const useSSLHistory = (siteId) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['sslHistory', siteId],
    queryFn: () => fetchSSLHistory(siteId),
    enabled: !!siteId,
    staleTime: 60000,
  });

  return { history: data || [], isLoading, error };
};

export const useSSLCheck = (siteId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => triggerSSLCheck(siteId),
    onSuccess: () => {
      toast.success('SSL check queued — results will appear shortly');
      // Refetch SSL data after a short delay to allow worker to process
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['ssl', siteId] });
        queryClient.invalidateQueries({ queryKey: ['sslHistory', siteId] });
      }, 5000);
    },
    onError: () => {
      toast.error('Failed to trigger SSL check');
    },
  });
};
