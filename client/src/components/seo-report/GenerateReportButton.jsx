import { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import Button from '../common/Button';
import ReportPrintLayout from './ReportPrintLayout';
import { useGscPerformance, useGscInsights, useGscStatus } from '../../hooks/useSearchConsole';
import { useAnalyticsStatus, useWebsiteAnalytics, useAnalyticsOverview, useAnalyticsInsights } from '../../hooks/useAnalytics';
import { useBacklinksStatus } from '../../hooks/useBacklinks';

export default function GenerateReportButton({ siteId, siteName, siteUrl, scores, strategy, history, themeKey = 'default' }) {
  const [generating, setGenerating] = useState(false);
  const [showLayout, setShowLayout] = useState(false);
  const printRef = useRef(null);

  // Pre-fetch all data via hooks (they cache via React Query so no extra requests)
  const { gscStatus } = useGscStatus(siteId);
  const { performance: gscPerformance } = useGscPerformance(siteId, '28d');
  const { insights: gscInsights } = useGscInsights(siteId, '28d');
  const { analyticsStatus } = useAnalyticsStatus(siteId);
  const { data: websiteData } = useWebsiteAnalytics(siteId, '28d');
  const { data: organicOverview } = useAnalyticsOverview(siteId, '28d');
  const { insights: organicInsights } = useAnalyticsInsights(siteId, '28d');
  const { status: backlinksStatus } = useBacklinksStatus(siteId);

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    setShowLayout(true);

    // Wait for the layout to render + recharts to paint
    await new Promise((resolve) => setTimeout(resolve, 1500));

    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const element = printRef.current;
      if (!element) throw new Error('Report layout not ready');

      const safeName = (siteName || 'site').replace(/[^a-zA-Z0-9-_]/g, '_');

      await html2pdf()
        .set({
          margin: [8, 8, 8, 8],
          filename: `${safeName}-seo-report.pdf`,
          image: { type: 'jpeg', quality: 0.95 },
          html2canvas: { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: ['css', 'legacy'], avoid: 'tr' },
        })
        .from(element)
        .save();

      toast.success('Report downloaded');
    } catch (err) {
      console.error('PDF generation failed:', err);
      toast.error('Failed to generate report');
    } finally {
      setGenerating(false);
      setShowLayout(false);
    }
  }, [siteName, siteId, scores, strategy, history]);

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        onClick={handleGenerate}
        isLoading={generating}
        disabled={generating}
      >
        <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        {generating ? 'Generating...' : 'Generate Report'}
      </Button>

      {/* Hidden print layout rendered off-screen for PDF capture */}
      {showLayout && createPortal(
        <div style={{ position: 'fixed', left: '-9999px', top: 0, zIndex: -1 }}>
          <ReportPrintLayout
            ref={printRef}
            siteName={siteName}
            siteUrl={siteUrl}
            scores={scores}
            strategy={strategy}
            history={history}
            themeKey={themeKey}
            gscPerformance={gscPerformance}
            gscInsights={gscInsights}
            websiteData={websiteData}
            organicOverview={organicOverview}
            organicInsights={organicInsights}
            backlinks={backlinksStatus?.backlinks}
          />
        </div>,
        document.body
      )}
    </>
  );
}
