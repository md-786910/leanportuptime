import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  getAnalyticsStatus,
  listAnalyticsProperties,
  linkAnalyticsProperty,
  unlinkAnalyticsProperty,
  getAnalyticsOverview,
  getAnalyticsInsights,
  getWebsiteAnalytics,
  getAnalyticsCountries,
  updateAnalyticsFilters,
} from '../api/analytics.api';

export const useAnalyticsStatus = (siteId) => {
  const { data, isLoading } = useQuery({
    queryKey: ['analyticsStatus', siteId],
    queryFn: () => getAnalyticsStatus(siteId),
    enabled: !!siteId,
    staleTime: 30000,
  });
  return { analyticsStatus: data, isLoading };
};

export const useAnalyticsProperties = (siteId, enabled = false) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['analyticsProperties', siteId],
    queryFn: () => listAnalyticsProperties(siteId),
    enabled: !!siteId && enabled,
    staleTime: 60000,
  });
  return { properties: data || [], isLoading, error };
};

export const useAnalyticsLink = (siteId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ propertyId, propertyName }) => linkAnalyticsProperty(siteId, propertyId, propertyName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analyticsStatus', siteId] });
      toast.success('Analytics property linked');
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Failed to link property'),
  });
};

export const useAnalyticsUnlink = (siteId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => unlinkAnalyticsProperty(siteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analyticsStatus', siteId] });
      queryClient.invalidateQueries({ queryKey: ['analyticsOverview', siteId] });
      queryClient.invalidateQueries({ queryKey: ['analyticsInsights', siteId] });
      queryClient.invalidateQueries({ queryKey: ['websiteAnalytics', siteId] });
      toast.success('Analytics property unlinked');
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Failed to unlink'),
  });
};

export const useAnalyticsOverview = (siteId, period = '28d', dateRange = null) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['analyticsOverview', siteId, period, dateRange],
    queryFn: () => getAnalyticsOverview(siteId, period, dateRange),
    enabled: !!siteId && (period !== 'custom' || !!dateRange),
    staleTime: 5 * 60 * 1000,
  });
  return { data, isLoading, error };
};

export const useAnalyticsInsights = (siteId, period = '28d', dateRange = null) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['analyticsInsights', siteId, period, dateRange],
    queryFn: () => getAnalyticsInsights(siteId, period, dateRange),
    enabled: !!siteId && (period !== 'custom' || !!dateRange),
    staleTime: 5 * 60 * 1000,
  });
  return { insights: data, isLoading, error };
};

export const useWebsiteAnalytics = (siteId, period = '28d', dateRange = null) => {
  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ['websiteAnalytics', siteId, period, dateRange],
    queryFn: () => getWebsiteAnalytics(siteId, period, dateRange),
    enabled: !!siteId && (period !== 'custom' || !!dateRange),
    staleTime: 5 * 60 * 1000,
  });
  return { data, isLoading, isFetching, error };
};

export const useAnalyticsCountries = (siteId, dateRange = null) => {
  const { data, isLoading } = useQuery({
    queryKey: ['analyticsCountries', siteId, dateRange],
    queryFn: () => getAnalyticsCountries(siteId, dateRange),
    enabled: !!siteId,
    staleTime: 5 * 60 * 1000,
  });
  return { countries: data || [], isLoading };
};

export const useAnalyticsFilters = (siteId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (filters) => updateAnalyticsFilters(siteId, filters),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analyticsStatus', siteId] });
      queryClient.invalidateQueries({ queryKey: ['websiteAnalytics', siteId] });
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Failed to save filter'),
  });
};
