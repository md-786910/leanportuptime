import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  getKeywordsStatus,
  addKeyword,
  addKeywordsBulk,
  removeKeyword,
  refreshKeywords,
  manualOverrideKeyword,
} from '../api/keywords.api';

export const useKeywordsStatus = (siteId) => {
  const { data, isLoading } = useQuery({
    queryKey: ['keywordsStatus', siteId],
    queryFn: () => getKeywordsStatus(siteId),
    enabled: !!siteId,
    staleTime: 60000,
  });
  return { status: data, isLoading };
};

export const useAddKeyword = (siteId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (keyword) => addKeyword(siteId, keyword),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keywordsStatus', siteId] });
      toast.success('Keyword added');
    },
    onError: (err) => {
      const errData = err.response?.data?.error;
      toast.error(errData?.message || 'Failed to add keyword');
    },
  });
};

export const useAddKeywordsBulk = (siteId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (keywords) => addKeywordsBulk(siteId, keywords),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['keywordsStatus', siteId] });
      const { addedCount = 0, skippedCount = 0 } = data?.summary || {};
      if (addedCount > 0 && skippedCount > 0) {
        toast.success(`Added ${addedCount}; skipped ${skippedCount}`);
      } else if (addedCount > 0) {
        toast.success(`Added ${addedCount} keyword${addedCount === 1 ? '' : 's'}`);
      } else if (skippedCount > 0) {
        toast.error(`No keywords added — ${skippedCount} skipped`);
      }
    },
    onError: (err) => {
      const errData = err.response?.data?.error;
      toast.error(errData?.message || 'Failed to add keywords');
    },
  });
};

export const useRemoveKeyword = (siteId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (keyword) => removeKeyword(siteId, keyword),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keywordsStatus', siteId] });
      toast.success('Keyword removed');
    },
    onError: (err) => {
      const errData = err.response?.data?.error;
      toast.error(errData?.message || 'Failed to remove keyword');
    },
  });
};

export const useKeywordManualOverride = (siteId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ keyword, payload }) => manualOverrideKeyword(siteId, keyword, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keywordsStatus', siteId] });
      toast.success('Keyword updated');
    },
    onError: (err) => {
      const errData = err.response?.data?.error;
      toast.error(errData?.message || 'Failed to update keyword');
    },
  });
};

export const useRefreshKeywords = (siteId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => refreshKeywords(siteId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['keywordsStatus', siteId] });
      const { successCount = 0, failCount = 0 } = data?.summary || {};
      if (failCount > 0) {
        toast.success(`Updated ${successCount} keyword${successCount === 1 ? '' : 's'}; ${failCount} failed`);
      } else {
        toast.success(`Refreshed ${successCount} keyword${successCount === 1 ? '' : 's'}`);
      }
    },
    onError: (err) => {
      const errData = err.response?.data?.error;
      if (errData?.code === 'QUOTA_EXCEEDED') {
        toast.error(errData.message || 'Monthly limit reached. Increase in settings.');
      } else if (errData?.code === 'PROVIDER_NOT_CONFIGURED') {
        toast.error('Keywords provider not configured');
      } else if (errData?.code === 'NO_KEYWORDS') {
        toast.error('Add at least one keyword before refreshing');
      } else {
        toast.error(errData?.message || 'Failed to refresh keywords');
      }
    },
  });
};
