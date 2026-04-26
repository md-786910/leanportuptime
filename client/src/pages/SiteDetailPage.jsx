import { useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useSite } from "../hooks/useSites";
import { useSiteMutations } from "../hooks/useSiteMutations";
import { useCheckSummary, useCheckHistory } from "../hooks/useChecks";
import Badge from "../components/common/Badge";
import Spinner from "../components/common/Spinner";
import Card from "../components/common/Card";
import ConfirmDialog from "../components/common/ConfirmDialog";
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
import { formatResponseTime, formatRelative, formatDate } from "../utils/formatters";

const PERIODS = [
  { label: "Last 24 Hours", value: "24h" },
  { label: "Last 7 Days", value: "7d" },
  { label: "Last 30 Days", value: "30d" },
];

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
  const { checks = [] } = useCheckHistory(id, { limit: 100 });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Spinner size="lg" />
        <p className="text-sm font-bold text-brand-outline uppercase tracking-widest animate-pulse">Synchronizing Intelligence...</p>
      </div>
    );
  }

  if (!site) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <div className="p-4 bg-brand-error-container/10 rounded-full mb-4">
          <svg className="h-12 w-12 text-brand-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-black text-brand-on-surface font-headline uppercase tracking-tight">Intelligence Node Not Found</h2>
        <button onClick={() => navigate('/sites')} className="mt-6 text-brand-primary font-bold hover:underline">Return to Hub</button>
      </div>
    );
  }

  const handleDelete = () => {
    deleteSite.mutate(id, {
      onSuccess: () => {
        navigate("/sites");
      },
    });
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-2 text-xs font-bold text-brand-outline uppercase tracking-[0.2em] mb-2 px-1">
        <button onClick={() => navigate('/sites')} className="hover:text-brand-primary transition-colors">Infrastructure</button>
        <span>/</span>
        <span className="text-brand-on-surface-variant">Intelligence Node</span>
      </div>

      <SiteHeader
        site={site}
        onTriggerCheck={() => triggerCheck.mutate(id)}
        onTogglePause={() => togglePause.mutate(id)}
        onEdit={() => setShowEdit(true)}
        onDelete={() => setShowDelete(true)}
        isCheckLoading={triggerCheck.isPending}
      />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <SiteDetailTabs activeTab={activeTab} onTabChange={setActiveTab} />
        
        {activeTab === "overview" && (
          <div className="flex items-center p-1 bg-brand-surface-container-high/50 dark:bg-brand-on-surface/10 rounded-2xl border border-brand-outline-variant/30 backdrop-blur-sm mb-6 lg:mb-0">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${
                  period === p.value 
                    ? "bg-brand-surface-container-lowest text-brand-primary shadow-sm dark:bg-brand-primary dark:text-brand-on-primary" 
                    : "text-brand-outline hover:text-brand-on-surface"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        {activeTab === "overview" && (
          <SiteOverviewTab
            site={site}
            summary={summary}
            checks={checks}
            period={period}
          />
        )}

        {activeTab === "performance" && (
          <div className="space-y-8">
            <PerformanceMetrics summary={summary} />
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              <Card padding="none" className="overflow-hidden shadow-xl">
                <div className="p-5 border-b border-brand-outline-variant/30 bg-brand-surface-container-lowest/50">
                  <h3 className="text-sm font-black text-brand-on-surface-variant uppercase tracking-widest font-headline">Telemetry: Response Velocity</h3>
                </div>
                <div className="p-6">
                  <ResponseChart checks={checks} height={350} />
                </div>
              </Card>
              <TimingBreakdown checks={checks} />
            </div>
          </div>
        )}

        {activeTab === "ssl" && <SSLPanel siteId={id} />}
        {activeTab === "security" && <SecurityPanel siteId={id} />}
        {activeTab === "plugins" && <PluginPanel siteId={id} />}
        {activeTab === "sitescan" && <SiteScanPanel siteId={id} />}
        {activeTab === "seo" && <SeoPanel siteId={id} />}
        {activeTab === "seo-report" && <SeoReportPanel siteId={id} siteName={site.name} siteUrl={site.url} />}

        {activeTab === "history" && (
          <div className="space-y-6">
            <Card padding="none" className="overflow-hidden border-brand-outline-variant/30 shadow-2xl">
              <div className="p-6 border-b border-brand-outline-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-brand-surface-container-lowest/50">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-brand-primary/10 rounded-2xl text-brand-primary">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-brand-on-surface font-headline uppercase tracking-tight">Full Event telemetry</h3>
                    <p className="text-[10px] font-bold text-brand-outline uppercase tracking-[0.2em] mt-1">Archived intelligence logs</p>
                  </div>
                </div>
                <ExportButton siteId={id} siteName={site.name} />
              </div>
              
              <div className="p-6 bg-brand-surface-container-low/20">
                <UptimeBar
                  checks={checks}
                  days={period === "24h" ? 1 : period === "7d" ? 7 : 30}
                />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-brand-surface-container-low/30 border-b border-brand-outline-variant/20">
                      <th className="text-left py-4 px-6 font-black text-brand-outline text-[10px] uppercase tracking-[0.2em] font-label">Timestamp</th>
                      <th className="text-left py-4 px-6 font-black text-brand-outline text-[10px] uppercase tracking-[0.2em] font-label">Status</th>
                      <th className="text-left py-4 px-6 font-black text-brand-outline text-[10px] uppercase tracking-[0.2em] font-label">HTTP Code</th>
                      <th className="text-left py-4 px-6 font-black text-brand-outline text-[10px] uppercase tracking-[0.2em] font-label">Response</th>
                      <th className="text-left py-4 px-6 font-black text-brand-outline text-[10px] uppercase tracking-[0.2em] font-label">TTFB</th>
                      <th className="text-left py-4 px-6 font-black text-brand-outline text-[10px] uppercase tracking-[0.2em] font-label">Origin Node</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-outline-variant/10">
                    {checks.map((c) => (
                      <tr key={c._id} className="hover:bg-brand-surface-container-low/30 transition-colors group">
                        <td className="py-4 px-6 text-brand-on-surface dark:text-brand-outline text-xs font-bold font-label group-hover:text-brand-primary transition-colors">
                          {formatDate(c.timestamp)} <span className="ml-1 opacity-40 font-normal">{new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-tighter ${ 
                            c.status === "up" ? "text-emerald-600 bg-emerald-500/10" : 
                            c.status === "down" ? "text-red-600 bg-red-500/10" : 
                            "text-amber-600 bg-amber-500/10" 
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${
                              c.status === "up" ? "bg-emerald-500 shadow-sm shadow-emerald-500/50" : 
                              c.status === "down" ? "bg-red-500 shadow-sm shadow-red-500/50" : 
                              "bg-amber-500 shadow-sm shadow-amber-500/50"
                            }`} />
                            {c.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 font-mono text-xs font-black text-brand-on-surface dark:text-brand-outline-variant group-hover:scale-110 transition-transform origin-left">
                          {c.httpStatus || "—"}
                        </td>
                        <td className="py-4 px-6 font-bold text-xs text-brand-on-surface dark:text-brand-outline-variant tabular-nums">
                          {formatResponseTime(c.responseTime)}
                        </td>
                        <td className="py-4 px-6 font-bold text-xs text-brand-on-surface dark:text-brand-outline-variant tabular-nums">
                          {formatResponseTime(c.ttfb)}
                        </td>
                        <td className="py-4 px-6">
                          <Badge
                            variant={c.location && c.location !== "local" ? "brand" : "neutral"}
                            className="!text-[9px] !px-2 shadow-sm"
                          >
                            {c.location || "local"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                    {checks.length === 0 && (
                      <tr>
                        <td colSpan="6" className="py-12 text-center text-brand-outline font-bold uppercase tracking-widest text-xs">No telemetry records found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
      </div>

      <EditSiteModal
        isOpen={showEdit}
        onClose={() => setShowEdit(false)}
        site={site}
      />
      <ConfirmDialog
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title="Decommission Node"
        message={`Warning: You are about to decommission "${site.name}". All monitoring archives and historical telemetry will be permanently purged. This action is irreversible.`}
        confirmText="Execute Decommission"
        variant="danger"
        isLoading={deleteSite.isPending}
      />
    </div>
  );
}
