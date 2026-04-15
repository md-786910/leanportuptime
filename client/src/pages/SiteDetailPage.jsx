import { useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useSite } from "../hooks/useSites";
import { useSiteMutations } from "../hooks/useSiteMutations";
import { useCheckSummary, useCheckHistory } from "../hooks/useChecks";
import Badge from "../components/common/Badge";
import Spinner from "../components/common/Spinner";
import ConfirmDialog from "../components/common/ConfirmDialog";
import SiteHeader from "../components/sites/SiteHeader";
import SiteDetailTabs from "../components/sites/SiteDetailTabs";
import SiteOverviewTab from "../components/sites/SiteOverviewTab";
import EditSiteModal from "../components/sites/EditSiteModal";
import ShareLinkModal from "../components/sites/ShareLinkModal";
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
  const [showShare, setShowShare] = useState(false);

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
    return <p className="text-center py-16 text-gray-500">Site not found</p>;
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
          onShare={() => setShowShare(true)}
          onEdit={() => setShowEdit(true)}
          onDelete={() => setShowDelete(true)}
          isCheckLoading={triggerCheck.isPending}
        />
        <ExportButton siteId={id} />
      </div>

      <SiteDetailTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Period selector for applicable tabs */}
      {["overview", "performance", "history"].includes(activeTab) && (
        <div className="flex gap-2">
          {["24h", "7d", "30d"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                period === p
                  ? "bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400"
                  : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
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
      {activeTab === "security" && <SecurityPanel siteId={id} />}

      {activeTab === "plugins" && <PluginPanel siteId={id} />}

      {activeTab === "sitescan" && <SiteScanPanel siteId={id} />}

      {activeTab === "history" && (
        <div className="space-y-6">
          <UptimeBar
            checks={checks}
            days={period === "24h" ? 1 : period === "7d" ? 7 : 30}
          />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 px-3 font-medium text-gray-500">
                    Time
                  </th>
                  <th className="text-left py-2 px-3 font-medium text-gray-500">
                    Status
                  </th>
                  <th className="text-left py-2 px-3 font-medium text-gray-500">
                    HTTP
                  </th>
                  <th className="text-left py-2 px-3 font-medium text-gray-500">
                    Response
                  </th>
                  <th className="text-left py-2 px-3 font-medium text-gray-500">
                    TTFB
                  </th>
                  <th className="text-left py-2 px-3 font-medium text-gray-500">
                    Location
                  </th>
                </tr>
              </thead>
              <tbody>
                {checks.map((c) => (
                  <tr
                    key={c._id}
                    className="border-b border-gray-100 dark:border-gray-800"
                  >
                    <td className="py-2 px-3 text-gray-700 dark:text-gray-300 text-xs">
                      {new Date(c.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2 px-3">
                      <span
                        className={`text-xs font-medium ${
                          c.status === "up"
                            ? "text-emerald-600"
                            : c.status === "down"
                              ? "text-red-600"
                              : "text-amber-600"
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-gray-700 dark:text-gray-300">
                      {c.httpStatus || "—"}
                    </td>
                    <td className="py-2 px-3 text-gray-700 dark:text-gray-300">
                      {c.responseTime ? `${c.responseTime}ms` : "—"}
                    </td>
                    <td className="py-2 px-3 text-gray-700 dark:text-gray-300">
                      {c.ttfb ? `${c.ttfb}ms` : "—"}
                    </td>
                    <td className="py-2 px-3">
                      <Badge
                        variant={
                          c.location && c.location !== "local"
                            ? "info"
                            : "neutral"
                        }
                      >
                        {c.location || "local"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ShareLinkModal
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        siteId={id}
      />
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
