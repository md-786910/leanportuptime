import { useQuery } from '@tanstack/react-query';
import {
  fetchSharedSite,
  fetchSharedChecks,
  fetchSharedCheckSummary,
  fetchSharedSSL,
  fetchSharedSecurity,
  fetchSharedSeo,
  fetchSharedPlugins,
  fetchSharedSiteScan,
} from '../api/public.api';

export const useSharedSite = (token) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['sharedSite', token],
    queryFn: () => fetchSharedSite(token),
    enabled: !!token,
    staleTime: 30000,
    retry: false,
  });

  return {
    site: data?.site,
    visibleSections: data?.visibleSections,
    label: data?.label,
    isLoading,
    error,
  };
};

export const useSharedCheckSummary = (token, period = '24h') => {
  const { data, isLoading } = useQuery({
    queryKey: ['sharedCheckSummary', token, period],
    queryFn: () => fetchSharedCheckSummary(token, period),
    enabled: !!token,
    staleTime: 30000,
    retry: false,
  });

  return { summary: data || null, isLoading };
};

export const useSharedChecks = (token, params = {}) => {
  const { data, isLoading } = useQuery({
    queryKey: ['sharedChecks', token, params],
    queryFn: () => fetchSharedChecks(token, params),
    enabled: !!token,
    staleTime: 30000,
    retry: false,
  });

  return { checks: data?.checks || [], meta: data?.meta, isLoading };
};

export const useSharedSSL = (token) => {
  const { data, isLoading } = useQuery({
    queryKey: ['sharedSSL', token],
    queryFn: () => fetchSharedSSL(token),
    enabled: !!token,
    staleTime: 30000,
    retry: false,
  });

  return { ssl: data?.current || {}, history: data?.history || [], isLoading };
};

export const useSharedSecurity = (token) => {
  const { data, isLoading } = useQuery({
    queryKey: ['sharedSecurity', token],
    queryFn: () => fetchSharedSecurity(token),
    enabled: !!token,
    staleTime: 30000,
    retry: false,
  });

  return { audit: data || null, isLoading };
};

export const useSharedSeo = (token) => {
  const { data, isLoading } = useQuery({
    queryKey: ['sharedSeo', token],
    queryFn: () => fetchSharedSeo(token),
    enabled: !!token,
    staleTime: 30000,
    retry: false,
  });

  return { audit: data || null, isLoading };
};

export const useSharedPlugins = (token) => {
  const { data, isLoading } = useQuery({
    queryKey: ['sharedPlugins', token],
    queryFn: () => fetchSharedPlugins(token),
    enabled: !!token,
    staleTime: 30000,
    retry: false,
  });

  return { audit: data || null, isLoading };
};

export const useSharedSiteScan = (token) => {
  const { data, isLoading } = useQuery({
    queryKey: ['sharedSiteScan', token],
    queryFn: () => fetchSharedSiteScan(token),
    enabled: !!token,
    staleTime: 30000,
    retry: false,
  });

  return { scan: data || null, isLoading };
};
