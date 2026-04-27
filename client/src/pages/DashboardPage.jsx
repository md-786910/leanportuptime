import { useSearchParams } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { useAuthStore } from '../store/authStore';
import { useSites } from '../hooks/useSites';
import DashboardAnalytics from '../components/dashboard/DashboardAnalytics';
import SiteListToolbar from '../components/dashboard/SiteListToolbar';
import SitesTable from '../components/dashboard/SitesTable';
import Pagination from '../components/common/Pagination';
import AddSiteModal from '../components/sites/AddSiteModal';
import KPICards from '../components/dashboard/KPICards';
import AlertsFeed from '../components/dashboard/AlertsFeed';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = searchParams.get('filter') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const [showAddModal, setShowAddModal] = useState(false);

  const updateParams = (updates) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([k, v]) => {
      if (v === '' || v == null) next.delete(k);
      else next.set(k, String(v));
    });
    setSearchParams(next, { replace: true });
  };

  const setPage = (p) => updateParams({ page: p === 1 ? '' : p });
  const setStatusFilter = (v) => updateParams({ filter: v, page: '' });

  const params = { page, limit: 12 };
  if (statusFilter && statusFilter !== 'favorites') params.status = statusFilter;

  const { sites, meta, isLoading } = useSites(params);
  const visibleSites = statusFilter === 'favorites' ? sites.filter((s) => s.isFavorite) : sites;

  // --- LOGIC ENGINE: Determine Fleet State ---
  const fleetLogic = useMemo(() => {
    if (!sites.length) return { state: 'empty', score: 0 };
    
    const downCount = sites.filter(s => s.currentStatus === 'down').length;
    const degradedCount = sites.filter(s => s.currentStatus === 'degraded').length;
    const securityIssues = sites.reduce((acc, s) => acc + (s.plugins?.issueCount || 0), 0);
    const avgSecurityScore = sites.length ? sites.reduce((acc, s) => acc + (s.securityScore || 0), 0) / sites.length : 0;
    
    let state = 'operational'; 
    if (downCount > 0) state = 'critical'; 
    else if (securityIssues > 0 || avgSecurityScore < 80) state = 'maintenance'; 
    
    const healthScore = Math.max(0, 100 - (downCount * 40) - (degradedCount * 15) - (securityIssues * 2));

    return { state, score: Math.round(healthScore), downCount, securityIssues };
  }, [sites]);

  if (isLoading) {
    return (
      <div className="w-full h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin" />
        <p className="text-[10px] font-black text-brand-outline uppercase tracking-[0.3em] animate-pulse">Running Fleet Diagnostics...</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-10 animate-in fade-in duration-700">
      
      {/* DYNAMIC HEADER */}
      <div className={`relative overflow-hidden rounded-[3rem] p-8 transition-all duration-500 border-2 ${
        fleetLogic.state === 'critical' ? 'bg-rose-500/[0.03] border-rose-500/20 shadow-rose-500/5' :
        fleetLogic.state === 'maintenance' ? 'bg-amber-500/[0.03] border-amber-500/20 shadow-amber-500/5' :
        'bg-brand-primary/[0.03] border-brand-primary/10 shadow-brand-primary/5'
      }`}>
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic">
                {fleetLogic.state === 'critical' ? 'EMERGENCY' : fleetLogic.state === 'maintenance' ? 'STRIKE' : 'COMMAND'} 
                <span className="text-brand-primary not-italic ml-2">CENTER</span>
              </h1>
              <div className={`px-4 py-1.5 rounded-2xl border flex items-center gap-3 ${
                fleetLogic.state === 'critical' ? 'bg-rose-500/10 border-rose-500/20 text-rose-600' :
                fleetLogic.state === 'maintenance' ? 'bg-amber-500/10 border-amber-500/20 text-amber-600' :
                'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'
              }`}>
                <div className={`w-2 h-2 rounded-full animate-pulse ${
                  fleetLogic.state === 'critical' ? 'bg-rose-500 shadow-[0_0_8px_red]' :
                  fleetLogic.state === 'maintenance' ? 'bg-amber-500 shadow-[0_0_8px_orange]' :
                  'bg-emerald-500 shadow-[0_0_8px_green]'
                }`} />
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">
                  {fleetLogic.state === 'critical' ? 'System Breach' : fleetLogic.state === 'maintenance' ? 'Attention Required' : 'Optimal state'}
                </span>
              </div>
            </div>
            
            <p className="text-sm text-brand-outline font-bold uppercase tracking-[0.2em] opacity-60">
               {fleetLogic.state === 'critical' ? `Immediate intervention required for ${fleetLogic.downCount} offline assets` :
                fleetLogic.state === 'maintenance' ? `${fleetLogic.securityIssues} Security vulnerabilities detected across infrastructure` :
                'Fleet synchronized. Proactive performance monitoring in progress.'}
            </p>
          </div>

          <div className="flex items-center gap-8 px-8 py-4 bg-white dark:bg-brand-surface-container-low rounded-3xl border border-brand-outline-variant/30 shadow-sm">
             <div className="relative w-20 h-20 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-brand-surface-container" />
                  <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="6" fill="transparent" 
                    strokeDasharray={213.6} strokeDashoffset={213.6 - (213.6 * fleetLogic.score) / 100}
                    className={`transition-all duration-1000 ${
                      fleetLogic.score < 50 ? 'text-rose-500' : fleetLogic.score < 85 ? 'text-amber-500' : 'text-emerald-500'
                    }`} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-black">{fleetLogic.score}</span>
                  <span className="text-[8px] font-bold text-brand-outline uppercase">Index</span>
                </div>
             </div>
             <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-brand-outline uppercase tracking-widest opacity-60">Fleet Integrity</span>
                <span className={`text-sm font-black uppercase ${
                   fleetLogic.score < 50 ? 'text-rose-500' : fleetLogic.score < 85 ? 'text-amber-500' : 'text-emerald-500'
                }`}>
                   {fleetLogic.score < 50 ? 'Critical' : fleetLogic.score < 85 ? 'Compromised' : 'Secured'}
                </span>
             </div>
          </div>
        </div>
      </div>

      <div className={`grid grid-cols-1 xl:grid-cols-4 gap-8 ${fleetLogic.state === 'critical' ? 'flex-col-reverse' : ''}`}>
        <div className="xl:col-span-3 space-y-8">
          {fleetLogic.state === 'critical' ? (
            <div className="space-y-6 animate-in slide-in-from-top-10 duration-700">
               <div className="flex items-center justify-between border-b border-rose-500/20 pb-4">
                  <h2 className="text-xl font-black text-rose-600 dark:text-rose-400 uppercase tracking-tight italic">
                    Asset <span className="not-italic">Containment</span>
                  </h2>
                  <span className="text-[10px] font-black bg-rose-500/10 text-rose-500 px-3 py-1 rounded-lg border border-rose-500/20">Action Required</span>
               </div>
               <SitesTable sites={sites.filter(s => s.currentStatus === 'down')} isLoading={false} />
            </div>
          ) : (
            <KPICards sites={sites} />
          )}

          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-brand-outline-variant/20 pb-4">
              <h2 className="text-xl font-black text-brand-on-surface dark:text-white tracking-tight uppercase italic">
                {fleetLogic.state === 'operational' ? 'Heuristic' : 'Diagnostic'} <span className="text-brand-primary not-italic">Intelligence</span>
              </h2>
            </div>
            <DashboardAnalytics sites={sites} isLoading={isLoading} />
          </div>
        </div>

        <div className="xl:col-span-1 space-y-8">
          <div className="sticky top-8 space-y-8">
            <AlertsFeed sites={sites} />
            
            <div className="bg-brand-primary p-6 rounded-[2rem] text-white shadow-xl shadow-brand-primary/20 relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
               <h4 className="text-xs font-black uppercase tracking-[0.2em] mb-4 relative z-10">Smart Suggestion</h4>
               <p className="text-sm font-bold leading-relaxed mb-6 opacity-90 relative z-10">
                 {fleetLogic.state === 'critical' ? 'Immediate: Check connectivity logs for offline assets to prevent sustained downtime.' :
                  fleetLogic.state === 'maintenance' ? 'Security Notice: Batch update plugins across flagged assets to improve security posture.' :
                  'Optimization: Your average performance is high. Focus on mobile SEO for a perfect 100.'}
               </p>
               <button className="w-full py-3 bg-white text-brand-primary rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-opacity-90 transition-all relative z-10">
                 Execute Logic
               </button>
            </div>
          </div>
        </div>
      </div>

      {/* ASSET INVENTORY */}
      <div className="space-y-8 pt-10 border-t border-brand-outline-variant/10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8 bg-white dark:bg-brand-surface-container-low p-8 rounded-[2.5rem] border border-brand-outline-variant/20 shadow-sm transition-all duration-300">
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-brand-on-surface dark:text-white tracking-tighter uppercase italic">
              Fleet <span className="text-brand-primary not-italic">Inventory</span>
            </h2>
            <p className="text-[10px] font-black text-brand-outline uppercase tracking-[0.2em]">
              Surveillance Grid: {visibleSites.length} Active Endpoints
            </p>
          </div>

          <div className="p-2 bg-brand-surface-container-low dark:bg-brand-on-surface/10 rounded-2xl border border-brand-outline-variant/20 shadow-inner">
            <SiteListToolbar
              onAddSite={isAdmin ? () => setShowAddModal(true) : null}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
            />
          </div>
        </div>

        <div className="min-h-[400px]">
          <SitesTable
            sites={visibleSites}
            isLoading={isLoading}
            onAddSite={() => setShowAddModal(true)}
          />
        </div>

        {meta.total > 12 && (
          <div className="pt-8 flex justify-center">
            <Pagination
              page={page}
              total={meta.total || 0}
              limit={12}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      <AddSiteModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
    </div>
  );
}
