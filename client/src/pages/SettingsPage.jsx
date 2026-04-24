import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { PLANS } from '../utils/constants';
import { useAppSettings, useUpdateAppSettings } from '../hooks/useAppSettings';
import { useIsAdmin, useIsViewer } from '../hooks/useRole';

function BacklinksLimitCard() {
  const { settings, isLoading } = useAppSettings();
  const update = useUpdateAppSettings();
  const [value, setValue] = useState('');

  useEffect(() => {
    if (settings?.backlinksMonthlyLimit != null) {
      setValue(String(settings.backlinksMonthlyLimit));
    }
  }, [settings?.backlinksMonthlyLimit]);

  const handleSave = () => {
    const n = parseInt(value, 10);
    if (isNaN(n) || n < 1 || n > 1000) return;
    update.mutate({ backlinksMonthlyLimit: n });
  };

  const unchanged = settings && String(settings.backlinksMonthlyLimit) === value;

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col gap-0.5">
        <h3 className="text-lg font-black text-brand-on-surface dark:text-white font-headline tracking-tight uppercase italic">Engine Core</h3>
        <p className="text-xs text-brand-on-surface-variant dark:text-brand-outline font-label max-w-xl">
          Global application orchestration parameters defining the operational boundaries.
        </p>
      </div>
      
      <Card className="border-brand-outline-variant/30 shadow-lg shadow-brand-on-surface/5 bg-white/50 backdrop-blur-sm overflow-hidden p-4 md:p-6">
        <div className="space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <label className="text-[10px] font-black text-brand-on-surface uppercase tracking-[0.2em] font-label">
                  Backlinks Threshold
                </label>
              </div>
              <p className="text-[11px] text-brand-on-surface-variant dark:text-brand-outline font-label leading-relaxed max-w-sm">
                Maximum permissible manual backlink audit triggers per site.
              </p>
            </div>
            
            <div className="flex items-center gap-2 bg-brand-surface-container-low p-1 rounded-xl border border-brand-outline-variant/20">
              <Input
                type="number"
                min={1}
                max={1000}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                disabled={isLoading}
                className="!py-1 font-black text-center w-20 bg-transparent border-none focus:ring-0 text-base"
              />
              <Button
                onClick={handleSave}
                isLoading={update.isPending}
                disabled={unchanged || update.isPending || isLoading || !value}
                size="sm"
                className="font-black px-6 py-2 rounded-lg shadow shadow-brand-primary/25"
              >
                Sync
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 rounded-xl bg-brand-inverse-surface text-white">
            <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
              <svg className="h-4 w-4 text-brand-primary-fixed" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-[9px] font-black uppercase tracking-[0.15em] opacity-50 mb-0.5">System Lifecycle</p>
              <p className="text-[11px] font-bold font-label leading-tight opacity-90">Operational quotas reset on the 1st of every month at 00:00 UTC.</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const plan = PLANS[user?.plan || 'free'];
  const isViewer = useIsViewer();
  const isAdmin = useIsAdmin();
  const [activeSection, setActiveSection] = useState('profile');

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
    : user?.email?.substring(0, 2).toUpperCase() || '??';

  const sections = [
    { id: 'profile', label: 'Identity', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /> },
    { id: 'subscription', label: 'Provisioning', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /> },
    { id: 'security', label: 'Security', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /> },
    ...(isAdmin ? [{ id: 'system', label: 'Engine', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /> }] : []),
  ];

  return (
    <div className="max-w-8xl mx-auto px-4 py-4 space-y-8">
      {/* Page Header - More compact */}
      <div className="text-center space-y-1">
        <h1 className="text-3xl font-black text-brand-on-surface dark:text-white font-headline tracking-tighter uppercase italic">Control Center</h1>
        <p className="text-[10px] font-black text-brand-outline uppercase tracking-[0.4em] opacity-40">System & Identity</p>
      </div>

      {/* Tabs Navigation - Thinner pill */}
      <div className="flex flex-wrap justify-center gap-1.5 p-1.5 bg-brand-surface-container-low rounded-2xl border border-brand-outline-variant/20 sticky top-4 z-20 backdrop-blur-md">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-[11px] font-black font-label transition-all duration-300 uppercase tracking-widest ${
              activeSection === section.id
                ? 'bg-brand-primary text-white shadow shadow-brand-primary/40'
                : 'text-brand-on-surface-variant hover:bg-brand-surface-container-high hover:text-brand-on-surface'
            }`}
          >
            <svg className={`h-3.5 w-3.4 transition-transform duration-500 ${activeSection === section.id ? 'rotate-12 scale-110' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {section.icon}
            </svg>
            {section.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <main className="min-h-[400px]">
        
        {/* Identity Section */}
        {activeSection === 'profile' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="relative group">
              <Card className="relative p-6 md:p-8 border-brand-outline-variant/30 shadow-lg shadow-brand-on-surface/5 flex flex-col md:flex-row items-center gap-8 overflow-hidden bg-white/40 backdrop-blur-sm">
                <div className="relative flex-shrink-0">
                  <div className="h-28 w-28 rounded-2xl bg-brand-inverse-surface flex items-center justify-center text-white text-4xl font-black shadow-xl">
                    {initials}
                  </div>
                  <div className="absolute -bottom-2 -right-2 h-10 w-10 rounded-xl bg-brand-primary flex items-center justify-center text-white shadow-lg border-2 border-white">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>

                <div className="flex-1 space-y-6 text-center md:text-left">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                      <h2 className="text-2xl font-black text-brand-on-surface dark:text-white font-headline tracking-tight uppercase italic">{user?.name || 'Workspace Member'}</h2>
                      <Badge variant={user?.role === 'admin' ? 'success' : 'neutral'} className="px-3 py-1 text-[8px] font-black tracking-[0.2em] bg-brand-primary text-white border-none">
                        {user?.role || 'Operator'}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium text-brand-on-surface-variant dark:text-brand-outline font-label opacity-60 tracking-tight">{user?.email}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 border-y border-brand-outline-variant/10">
                    <div className="space-y-0.5">
                      <p className="text-[9px] font-black text-brand-outline uppercase tracking-[0.2em] font-label">Legal Handle</p>
                      <p className="text-base font-bold text-brand-on-surface dark:text-brand-outline-variant font-headline">{user?.name || '—'}</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[9px] font-black text-brand-outline uppercase tracking-[0.2em] font-label">Electronic Auth</p>
                      <p className="text-base font-bold text-brand-on-surface dark:text-brand-outline-variant font-headline truncate">{user?.email || '—'}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap justify-center md:justify-start gap-3 pt-2">
                    <Button size="sm" className="font-black px-8 py-2 rounded-xl shadow-md">Edit Identity</Button>
                    <Button variant="outline" size="sm" className="font-black px-8 py-2 rounded-xl border-2">Export Data</Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Provisioning Section */}
        {activeSection === 'subscription' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="space-y-0.5 text-center md:text-left">
                <h3 className="text-2xl font-black text-brand-on-surface dark:text-white font-headline tracking-tight uppercase italic">Active Tier</h3>
                <p className="text-xs font-medium text-brand-on-surface-variant dark:text-brand-outline font-label max-w-lg">Entitlement and processing limits for the monitoring network.</p>
              </div>
              <div className="px-8 py-4 rounded-2xl bg-brand-inverse-surface text-white text-center shadow-lg transform hover:scale-105 transition-transform duration-500">
                <p className="text-[8px] font-black uppercase tracking-[0.4em] opacity-40 mb-0.5">Provisioned</p>
                <p className="text-2xl font-black font-headline uppercase italic tracking-tighter">{user?.plan || 'Free'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'Network Nodes', val: plan.maxSites === Infinity ? '∞' : plan.maxSites, desc: 'Concurrent sites' },
                { label: 'Sync Latency', val: plan.checkInterval / 1000 + 's', desc: 'Refresh frequency' },
                { label: 'Persistence', val: plan.retention === Infinity ? '∞' : plan.retention + 'd', desc: 'History retention' }
              ].map((item, i) => (
                <Card key={i} className="group flex flex-col items-center justify-center text-center p-6 border-brand-outline-variant/20 hover:border-brand-primary/40 transition-all duration-700 shadow-md hover:shadow-lg bg-white/50 backdrop-blur-sm">
                  <span className="text-4xl font-black text-brand-on-surface dark:text-white font-headline tracking-tighter mb-2 italic transition-transform duration-700 group-hover:scale-110">
                    {item.val}
                  </span>
                  <p className="text-[10px] font-black text-brand-outline uppercase tracking-[0.2em] mb-1 font-label">
                    {item.label}
                  </p>
                  <p className="text-[8px] font-bold text-brand-on-surface-variant dark:text-brand-outline opacity-40 font-label uppercase tracking-widest leading-tight">
                    {item.desc}
                  </p>
                </Card>
              ))}
            </div>

            <Card className="p-1 rounded-3xl bg-gradient-to-r from-brand-primary to-brand-primary-container shadow-xl overflow-hidden group">
              <div className="bg-brand-inverse-surface rounded-[1.4rem] p-6 md:p-10 relative overflow-hidden">
                <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
                  <div className="space-y-2 text-center lg:text-left">
                    <h4 className="text-xl md:text-2xl font-black text-white font-headline uppercase italic tracking-tight leading-none">Scale Infrastructure</h4>
                    <p className="text-white/60 text-xs font-medium font-label max-w-md">Industrial-grade nodes, sub-60s latency, and extended persistence.</p>
                  </div>
                  <Button className="bg-white text-brand-inverse-surface hover:bg-brand-primary hover:text-white font-black px-10 py-3 rounded-xl shadow-lg transition-all w-full lg:w-auto text-sm hover:scale-105">
                    Upgrade Infrastructure
                  </Button>
                </div>
                <div className="absolute top-0 right-0 h-full w-1/3 bg-white/5 skew-x-12 transform translate-x-1/2" />
              </div>
            </Card>
          </div>
        )}

        {/* Security Section */}
        {activeSection === 'security' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex flex-col gap-1 text-center md:text-left">
              <h3 className="text-2xl font-black text-brand-on-surface dark:text-white font-headline tracking-tight uppercase italic">Security Protocol</h3>
              <p className="text-xs font-medium text-brand-on-surface-variant dark:text-brand-outline font-label max-w-xl">Authentication layers and rotational credentials.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <button className="relative group overflow-hidden p-6 rounded-2xl bg-white border border-brand-outline-variant/30 hover:border-brand-primary/40 transition-all text-left shadow-lg">
                  <div className="relative z-10 flex flex-col gap-6">
                    <div className="h-12 w-12 rounded-xl bg-brand-surface-container-high flex items-center justify-center text-brand-outline group-hover:bg-brand-primary group-hover:text-white transition-all duration-500 shadow-inner">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                    </div>
                    <div className="space-y-0.5">
                      <h5 className="text-xl font-black text-brand-on-surface dark:text-brand-outline-variant font-headline uppercase italic tracking-tight leading-tight">Update Password</h5>
                      <p className="text-[9px] font-black text-brand-outline uppercase tracking-[0.2em] opacity-60">Authentication Rotation</p>
                    </div>
                    <div className="flex items-center gap-2 text-brand-primary font-black text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      Configure Now
                      <svg className="h-3 w-3 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </div>
                  </div>
               </button>

               <div className="relative p-6 rounded-2xl bg-brand-surface-container-low/50 border border-dashed border-brand-outline-variant/50 flex flex-col gap-6 grayscale opacity-50 cursor-not-allowed group overflow-hidden">
                  <div className="h-12 w-12 rounded-xl bg-brand-surface-container-high flex items-center justify-center text-brand-outline shadow-inner">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-xl font-black text-brand-on-surface dark:text-brand-outline-variant font-headline uppercase italic tracking-tight leading-tight">Two-Factor Auth</h5>
                    <Badge variant="neutral" className="px-3 py-0.5 text-[7px] font-black uppercase tracking-[0.2em] bg-brand-outline text-white border-none">Production Pipeline</Badge>
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* Engine Section */}
        {activeSection === 'system' && isAdmin && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            {!isViewer && <BacklinksLimitCard />}
          </div>
        )}

      </main>
    </div>
  );
}
