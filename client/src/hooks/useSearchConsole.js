import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  getGoogleStatus,
  disconnectGoogle,
  getGscStatus,
  listGscProperties,
  linkGscProperty,
  unlinkGscProperty,
  getGscPerformance,
  getGscInsights,
} from '../api/searchConsole.api';

export const useGoogleStatus = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['googleStatus'],
    queryFn: getGoogleStatus,
    // staleTime 0 so invited admins always see the up-to-date delegated status
    // right after login, rather than a cached "disconnected" from a prior session.
    staleTime: 0,
    refetchOnMount: true,
  });
  return { googleStatus: data, isLoading };
};

export const useGoogleDisconnect = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: disconnectGoogle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['googleStatus'] });
      toast.success('Google account disconnected');
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Failed to disconnect'),
  });
};

export const useGscStatus = (siteId) => {
  const { data, isLoading } = useQuery({
    queryKey: ['gscStatus', siteId],
    queryFn: () => getGscStatus(siteId),
    enabled: !!siteId,
    staleTime: 30000,
  });
  return { gscStatus: data, isLoading };
};

export const useGscProperties = (siteId, enabled = false) => {
  const { data, isLoading } = useQuery({
    queryKey: ['gscProperties', siteId],
    queryFn: () => listGscProperties(siteId),
    enabled: !!siteId && enabled,
    staleTime: 60000,
  });
  return { properties: data || [], isLoading };
};

export const useGscLink = (siteId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (property) => linkGscProperty(siteId, property),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gscStatus', siteId] });
      toast.success('Search Console property linked');
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Failed to link property'),
  });
};

export const useGscUnlink = (siteId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => unlinkGscProperty(siteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gscStatus', siteId] });
      queryClient.invalidateQueries({ queryKey: ['gscPerformance', siteId] });
      toast.success('Search Console property unlinked');
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Failed to unlink'),
  });
};

export const useGscPerformance = (siteId, period = '28d') => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['gscPerformance', siteId, period],
    queryFn: () => getGscPerformance(siteId, period),
    enabled: !!siteId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  return { performance: data, isLoading, error };
};

export const useGscInsights = (siteId, period = '28d') => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['gscInsights', siteId, period],
    queryFn: () => getGscInsights(siteId, period),
    enabled: !!siteId,
    staleTime: 5 * 60 * 1000,
  });
  return { insights: data, isLoading, error };
};
