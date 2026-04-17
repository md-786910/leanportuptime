import { useState, useRef, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { fetchSeoAudit, triggerSeoScan, fetchPageSpeed, fetchSeoHistory } from '../api/seo.api';

export const useSeoAudit = (siteId) => {
  const [scanning, setScanning] = useState(false);
  const scanTriggeredAt = useRef(null);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['seo', siteId],
    queryFn: () => fetchSeoAudit(siteId),
    enabled: !!siteId,
    staleTime: 60000,
    refetchInterval: scanning ? 3000 : false,
  });

  // When polling brings fresh data, stop scanning + auto-fetch PageSpeed if missing
  useEffect(() => {
    if (scanning && data?.scannedAt && scanTriggeredAt.current) {
      if (new Date(data.scannedAt) > scanTriggeredAt.current) {
        setScanning(false);
        scanTriggeredAt.current = null;

        if (!data.pageSpeed) {
          fetchPageSpeed(siteId)
            .then(() => queryClient.invalidateQueries({ queryKey: ['seo', siteId] }))
            .catch(() => {});
        }
      }
    }
  }, [scanning, data?.scannedAt, data?.pageSpeed, siteId, queryClient]);

  const startScanning = useCallback(() => {
    scanTriggeredAt.current = new Date();
    setScanning(true);
  }, []);

  return { audit: data, isLoading, scanning, startScanning, error };
};

export const usePageSpeedFetch = (siteId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => fetchPageSpeed(siteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seo', siteId] });
      toast.success('PageSpeed data fetched successfully');
    },
    onError: (err) =>
      toast.error(err.response?.data?.error?.message || 'Failed to fetch PageSpeed data'),
  });
};

export const useSeoHistory = (siteId) => {
  const { data, isLoading } = useQuery({
    queryKey: ['seoHistory', siteId],
    queryFn: () => fetchSeoHistory(siteId),
    enabled: !!siteId,
    staleTime: 60000,
  });
  return { history: data || [], isLoading };
};

export const useSeoTrigger = (siteId, { onScanStart } = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => triggerSeoScan(siteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seo', siteId] });
      onScanStart?.();
      toast.success('SEO audit started — scanning your site…');
    },
    onError: (err) =>
      toast.error(err.response?.data?.error?.message || 'SEO scan failed'),
  });
};
