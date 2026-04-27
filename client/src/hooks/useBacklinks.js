import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  getBacklinksStatus,
  refreshBacklinks,
  manualOverrideBacklinks,
  getBacklinksChangelog,
  addBacklinkItem,
  updateBacklinkItem,
  removeBacklinkItem,
} from '../api/backlinks.api';

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
      queryClient.invalidateQueries({ queryKey: ['backlinksChangelog', siteId] });
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

export const useBacklinksManualOverride = (siteId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => manualOverrideBacklinks(siteId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backlinksStatus', siteId] });
      queryClient.invalidateQueries({ queryKey: ['backlinksChangelog', siteId] });
      toast.success('Domain Authority stats updated');
    },
    onError: (err) => {
      const errData = err.response?.data?.error;
      toast.error(errData?.message || 'Failed to update stats');
    },
  });
};

export const useBacklinksChangelog = (siteId, { enabled = true } = {}) => {
  const { data, isLoading } = useQuery({
    queryKey: ['backlinksChangelog', siteId],
    queryFn: () => getBacklinksChangelog(siteId),
    enabled: !!siteId && enabled,
    staleTime: 60000,
  });
  return { entries: data?.entries || [], isLoading };
};

export const useAddBacklinkItem = (siteId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => addBacklinkItem(siteId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backlinksStatus', siteId] });
      queryClient.invalidateQueries({ queryKey: ['backlinksChangelog', siteId] });
      toast.success('Backlink added');
    },
    onError: (err) => {
      const errData = err.response?.data?.error;
      toast.error(errData?.message || 'Failed to add backlink');
    },
  });
};

export const useUpdateBacklinkItem = (siteId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, payload }) => updateBacklinkItem(siteId, itemId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backlinksStatus', siteId] });
      queryClient.invalidateQueries({ queryKey: ['backlinksChangelog', siteId] });
      toast.success('Backlink updated');
    },
    onError: (err) => {
      const errData = err.response?.data?.error;
      toast.error(errData?.message || 'Failed to update backlink');
    },
  });
};

export const useRemoveBacklinkItem = (siteId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId) => removeBacklinkItem(siteId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backlinksStatus', siteId] });
      queryClient.invalidateQueries({ queryKey: ['backlinksChangelog', siteId] });
      toast.success('Backlink removed');
    },
    onError: (err) => {
      const errData = err.response?.data?.error;
      toast.error(errData?.message || 'Failed to remove backlink');
    },
  });
};
