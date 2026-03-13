import { useQuery } from '@tanstack/react-query';
import { fetchNotifications } from '../api/notifications.api';

export const useNotifications = (params = {}) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['notifications', params],
    queryFn: () => fetchNotifications(params),
    staleTime: 30000,
  });

  return {
    notifications: data?.notifications || [],
    meta: data?.meta || {},
    isLoading,
    error,
  };
};
