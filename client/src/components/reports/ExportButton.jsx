import { useState } from 'react';
import toast from 'react-hot-toast';
import Button from '../common/Button';
import { downloadReport } from '../../api/reports.api';

const ranges = [
  { label: 'Last 24h', value: '24h' },
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 90 days', value: '90d' },
];

export default function ExportButton({ siteId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleExport = async (range) => {
    setIsLoading(true);
    setIsOpen(false);
    try {
      await downloadReport(siteId, range);
      toast.success('Report downloaded');
    } catch {
      toast.error('Failed to download report');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      <Button variant="secondary" size="sm" onClick={() => setIsOpen(!isOpen)} isLoading={isLoading}>
        <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Export PDF
      </Button>
      {isOpen && (
        <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
          {ranges.map((r) => (
            <button
              key={r.value}
              onClick={() => handleExport(r.value)}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              {r.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
