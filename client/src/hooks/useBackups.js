import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { getBackups, createBackup } from '../api/backups.api';

export const useBackups = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['backups'],
    queryFn: getBackups,
    // 404 = this API server doesn't have the backup feature deployed; don't retry.
    retry: (count, err) => err?.response?.status !== 404 && count < 2,
    // Poll while a backup is queued or running so the card updates by itself.
    refetchInterval: (query) => {
      const d = query.state.data;
      return d && ((d.pending && !d.stale) || d.running) ? 3000 : false;
    },
  });
  return { data, isLoading, unavailable: error?.response?.status === 404 };
};

export const useCreateBackup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createBackup,
    onSuccess: (data) => {
      queryClient.setQueryData(['backups'], data);
      toast.success('Backup started');
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Failed to start backup'),
  });
};
