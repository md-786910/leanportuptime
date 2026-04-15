import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  fetchShareLinks,
  createShareLink,
  updateShareLink,
  revokeShareLink,
  regenerateShareLink,
} from '../api/sharelinks.api';

export const useShareLinks = (siteId) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['shareLinks', siteId],
    queryFn: () => fetchShareLinks(siteId),
    enabled: !!siteId,
  });

  return { links: data || [], isLoading, error };
};

export const useShareLinkMutations = (siteId) => {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['shareLinks', siteId] });

  const create = useMutation({
    mutationFn: (linkData) => createShareLink(siteId, linkData),
    onSuccess: () => {
      toast.success('Share link created');
      invalidate();
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Failed to create share link'),
  });

  const update = useMutation({
    mutationFn: ({ linkId, data }) => updateShareLink(siteId, linkId, data),
    onSuccess: () => {
      toast.success('Share link updated');
      invalidate();
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Failed to update share link'),
  });

  const revoke = useMutation({
    mutationFn: (linkId) => revokeShareLink(siteId, linkId),
    onSuccess: () => {
      toast.success('Share link revoked');
      invalidate();
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Failed to revoke share link'),
  });

  const regenerate = useMutation({
    mutationFn: (linkId) => regenerateShareLink(siteId, linkId),
    onSuccess: () => {
      toast.success('Share link regenerated — old URL no longer works');
      invalidate();
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Failed to regenerate share link'),
  });

  return { create, update, revoke, regenerate };
};
