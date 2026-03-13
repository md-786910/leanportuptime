import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { fetchSecurity, triggerSecurityScan } from '../api/security.api';

export const useSecurity = (siteId) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['security', siteId],
    queryFn: () => fetchSecurity(siteId),
    enabled: !!siteId,
    staleTime: 60000,
  });

  return { audit: data, isLoading, error };
};

export const useSecurityScan = (siteId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => triggerSecurityScan(siteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security', siteId] });
      toast.success('Security scan triggered');
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Scan failed'),
  });
};
