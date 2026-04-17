import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { getAppSettings, updateAppSettings } from '../api/appSettings.api';

export const useAppSettings = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['appSettings'],
    queryFn: getAppSettings,
    staleTime: 60000,
  });
  return { settings: data, isLoading };
};

export const useUpdateAppSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateAppSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appSettings'] });
      queryClient.invalidateQueries({ queryKey: ['backlinksStatus'] });
      toast.success('Settings updated');
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Failed to update settings'),
  });
};
