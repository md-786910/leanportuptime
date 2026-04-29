import { useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useSite } from "../hooks/useSites";
import { useSiteMutations } from "../hooks/useSiteMutations";
import { useCheckSummary, useCheckHistory } from "../hooks/useChecks";
import Badge from "../components/common/Badge";
import Spinner from "../components/common/Spinner";
import ConfirmDialog from "../components/common/ConfirmDialog";
import DataTable from "../components/common/DataTable";
import PositionPill from "../components/common/PositionPill";
import SiteHeader from "../components/sites/SiteHeader";
import SiteDetailTabs from "../components/sites/SiteDetailTabs";
import SiteOverviewTab from "../components/sites/SiteOverviewTab";
import EditSiteModal from "../components/sites/EditSiteModal";
import ExportButton from "../components/reports/ExportButton";
import ResponseChart from "../components/monitoring/ResponseChart";
import UptimeBar from "../components/monitoring/UptimeBar";
import PerformanceMetrics from "../components/monitoring/PerformanceMetrics";
import TimingBreakdown from "../components/monitoring/TimingBreakdown";
import SSLPanel from "../components/ssl/SSLPanel";
import SecurityPanel from "../components/security/SecurityPanel";
import PluginPanel from "../components/plugins/PluginPanel";
import SiteScanPanel from "../components/sitescan/SiteScanPanel";
import SeoPanel from "../components/seo/SeoPanel";
import SeoReportPanel from "../components/seo-report/SeoReportPanel";

export default function SiteDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { site, isLoading } = useSite(id);
  const { triggerCheck, togglePause, deleteSite } = useSiteMutations();

  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";
  const setActiveTab = (tab) => setSearchParams({ tab }, { replace: true });
  const [period, setPeriod] = useState("24h");
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const { summary } = useCheckSummary(id, period);
  const { checks } = useCheckHistory(id, { limit: 100 });

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!site) {
    return <p className="text-center py-16 text-brand-on-surface-variant">Site not found</p>;
  }

  const handleDelete = async () => {
    await deleteSite.mutateAsync(id);
    navigate("/");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <SiteHeader
          site={site}
          onTriggerCheck={() => triggerCheck.mutate(id)}
          onTogglePause={() => togglePause.mutate(id)}
          onEdit={() => setShowEdit(true)}
          onDelete={() => setShowDelete(true)}
          isCheckLoading={triggerCheck.isPending}
        />
        {!["seo", "seo-report"].includes(activeTab) && <ExportButton siteId={id} />}
      </div>

      <SiteDetailTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Period selector for applicable tabs */}
      {["overview", "performance", "history"].includes(activeTab) && (
        <div className="flex gap-2">
          {["24h", "7d", "30d"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${ period === p ? "bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400" : "text-brand-on-surface-variant hover:bg-brand-surface-container-high dark:hover:bg-brand-on-surface" } font-label`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Tab content */}
      {activeTab === "overview" && (
        <SiteOverviewTab
          site={site}
          summary={summary}
          checks={checks}
          period={period}
        />
      )}

      {activeTab === "performance" && (
        <div className="space-y-6">
          <PerformanceMetrics summary={summary} />
          <ResponseChart checks={checks} />
          <TimingBreakdown checks={checks} />
        </div>
      )}

      {activeTab === "ssl" && <SSLPanel siteId={id} />}
      {activeTab === "seo" && <SeoPanel siteId={id} />}
      {activeTab === "seo-report" && <SeoReportPanel siteId={id} siteName={site.name} siteUrl={site.url} />}
      {activeTab === "security" && <SecurityPanel siteId={id} />}

      {activeTab === "plugins" && <PluginPanel siteId={id} />}

      {activeTab === "sitescan" && <SiteScanPanel siteId={id} />}

      {activeTab === "history" && (
        <div className="space-y-6">
          <UptimeBar
            checks={checks}
            days={period === "24h" ? 1 : period === "7d" ? 7 : 30}
          />
          <DataTable
            keyField="_id"
            rows={checks}
            columns={[
              {
                key: 'timestamp',
                label: 'Time',
                width: '24%',
                render: (c) => (
                  <span className="text-brand-on-surface dark:text-brand-outline-variant">
                    {new Date(c.timestamp).toLocaleString()}
                  </span>
                ),
              },
              {
                key: 'status',
                label: 'Status',
                width: '12%',
                render: (c) => (
                  <PositionPill
                    tier={c.status === 'up' ? 'good' : c.status === 'down' ? 'critical' : 'warn'}
                    value={c.status ? c.status.charAt(0).toUpperCase() + c.status.slice(1) : '—'}
                  />
                ),
              },
              { key: 'httpStatus', label: 'HTTP', align: 'right', width: '10%', render: (c) => c.httpStatus || '—' },
              { key: 'responseTime', label: 'Response', align: 'right', width: '14%', render: (c) => (c.responseTime ? `${c.responseTime} ms` : '—') },
              { key: 'ttfb', label: 'TTFB', align: 'right', width: '14%', render: (c) => (c.ttfb ? `${c.ttfb} ms` : '—') },
              {
                key: 'location',
                label: 'Location',
                width: '26%',
                render: (c) => (
                  <Badge variant={c.location && c.location !== 'local' ? 'info' : 'neutral'}>
                    {c.location || 'local'}
                  </Badge>
                ),
              },
            ]}
          />
        </div>
      )}

      <EditSiteModal
        isOpen={showEdit}
        onClose={() => setShowEdit(false)}
        site={site}
      />
      <ConfirmDialog
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title="Delete Site"
        message={`Are you sure you want to delete "${site.name}"? All monitoring data will be permanently removed.`}
        confirmText="Delete"
        variant="danger"
        isLoading={deleteSite.isPending}
      />
    </div>
  );
}
