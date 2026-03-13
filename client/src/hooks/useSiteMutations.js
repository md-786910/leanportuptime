import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import * as sitesApi from '../api/sites.api';

export const useSiteMutations = () => {
  const queryClient = useQueryClient();

  const invalidate = (siteId) => {
    queryClient.invalidateQueries({ queryKey: ['sites'] });
    if (siteId) queryClient.invalidateQueries({ queryKey: ['site', siteId] });
  };

  const createSite = useMutation({
    mutationFn: sitesApi.createSite,
    onSuccess: () => {
      invalidate();
      toast.success('Site added successfully');
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Failed to add site'),
  });

  const updateSite = useMutation({
    mutationFn: ({ id, data }) => sitesApi.updateSite(id, data),
    onSuccess: (_, { id }) => {
      invalidate(id);
      toast.success('Site updated');
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Failed to update site'),
  });

  const deleteSite = useMutation({
    mutationFn: sitesApi.deleteSite,
    onSuccess: () => {
      invalidate();
      toast.success('Site deleted');
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Failed to delete site'),
  });

  const triggerCheck = useMutation({
    mutationFn: sitesApi.triggerCheck,
    onSuccess: (_, id) => {
      invalidate(id);
      toast.success('Check triggered');
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Failed to trigger check'),
  });

  const togglePause = useMutation({
    mutationFn: sitesApi.togglePause,
    onSuccess: (data, id) => {
      invalidate(id);
      toast.success(data.paused ? 'Monitoring paused' : 'Monitoring resumed');
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Failed to toggle pause'),
  });

  return { createSite, updateSite, deleteSite, triggerCheck, togglePause };
};
