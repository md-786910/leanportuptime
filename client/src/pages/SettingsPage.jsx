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
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-bold text-brand-on-surface dark:text-white font-headline tracking-tight uppercase">System Configuration</h3>
        <p className="text-sm text-brand-on-surface-variant dark:text-brand-outline font-label leading-relaxed">
          Manage global application thresholds and resource allocation for the monitoring engine.
        </p>
      </div>
      
      <Card className="border-brand-outline-variant/20 shadow-xl shadow-brand-on-surface/5 bg-brand-surface-container-low/40">
        <div className="p-2 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="space-y-2 flex-1">
              <label className="text-[10px] font-black text-brand-outline uppercase tracking-[0.2em] font-label ml-0.5">
                Monthly Backlinks Refresh Limit
              </label>
              <p className="text-xs text-brand-on-surface-variant dark:text-brand-outline font-label leading-relaxed max-w-sm">
                Limits the number of times sites can trigger manual backlink analysis per calendar month.
              </p>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <Input
                type="number"
                min={1}
                max={1000}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                disabled={isLoading}
                className="!py-2 font-bold text-center w-24"
              />
              <Button
                onClick={handleSave}
                isLoading={update.isPending}
                disabled={unchanged || update.isPending || isLoading || !value}
                size="sm"
                className="font-black px-8"
              >
                Save
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-4 rounded-xl bg-brand-primary/5 border border-brand-primary/10 text-brand-primary">
            <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs font-bold font-label uppercase tracking-wider leading-none">Usage quotas automatically reset on the 1st of each month</p>
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

  const menuItems = [
    { id: 'profile', label: 'Identity', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /> },
    { id: 'subscription', label: 'Provisioning', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /> },
    { id: 'security', label: 'Security', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /> },
    ...(isAdmin ? [{ id: 'system', label: 'Engine', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /> }] : []),
  ];

  return (
    <div className="max-w-8xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-12">
        {/* Navigation Sidebar */}
        <aside className="w-full lg:w-64 flex-shrink-0 space-y-8">
          <div>
            <h1 className="text-3xl font-black text-brand-on-surface dark:text-white font-headline">Settings</h1>
            <p className="text-brand-on-surface-variant dark:text-brand-outline font-label text-xs font-bold mt-1 opacity-60">Workspace Control</p>
          </div>
          
          <nav className="space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-black font-label transition-all duration-300 ${
                  activeSection === item.id
                    ? 'bg-brand-primary text-white shadow-md'
                    : 'text-brand-on-surface-variant hover:bg-brand-surface-container-low hover:text-brand-on-surface'
                }`}
              >
                <svg className={`h-5 w-5 transition-transform duration-500 ${activeSection === item.id ? 'rotate-12' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {item.icon}
                </svg>
                <span className="tracking-wider">{item.label}</span>
              </button>
            ))}
          </nav>

          <Card className="p-6 bg-brand-primary/5 border-brand-primary/10 hidden lg:block">
            <p className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em] mb-2 leading-tight">Need Assistance?</p>
            <p className="text-[11px] text-brand-on-surface-variant font-medium leading-relaxed mb-4 italic">Access our documentation or connect with support.</p>
            <Button variant="outline" size="sm" className="w-full font-black text-[10px] border-2 uppercase">Help Center</Button>
          </Card>
        </aside>

        {/* Content Area */}
        <main className="flex-1 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          
          {/* Identity Section */}
          {activeSection === 'profile' && (
            <section className="space-y-8">
              <div className="flex items-center gap-6 p-4 rounded-[2.5rem] bg-gradient-to-br from-brand-surface-container-low to-white dark:from-brand-inverse-surface border border-brand-outline-variant/10 shadow-2xl shadow-brand-on-surface/5">
                <div className="h-20 w-20 rounded-2xl bg-brand-primary flex items-center justify-center text-white text-4xl font-black shadow-xl shadow-brand-primary/30 relative group overflow-hidden">
                  <div className="absolute inset-0 bg-white/20 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500 skew-x-12" />
                  {initials}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-black text-brand-on-surface dark:text-white font-headline">{user?.name || 'User Profile'}</h2>
                    <Badge variant={user?.role === 'admin' ? 'success' : 'neutral'} className="px-4 py-1 text-[9px] font-black tracking-[0.2em]">
                      {user?.role || 'User'}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium text-brand-on-surface-variant dark:text-brand-outline font-label tracking-wide opacity-80">{user?.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-1.5 group">
                  <p className="text-[10px] font-black text-brand-outline tracking-[0.2em] font-label ml-4">Full Legal Name</p>
                  <div className="p-4 rounded-2xl bg-brand-surface-container-lowest border border-brand-outline-variant/20 group-hover:border-brand-primary/40 transition-colors shadow-sm">
                    <p className="text-lg font-bold text-brand-on-surface dark:text-brand-outline-variant font-headline tracking-tight">{user?.name || '—'}</p>
                  </div>
                </div>
                <div className="space-y-1.5 group">
                  <p className="text-[10px] font-black text-brand-outline tracking-[0.2em] font-label ml-4">Electronic Identity</p>
                  <div className="p-4 rounded-2xl bg-brand-surface-container-lowest border border-brand-outline-variant/20 group-hover:border-brand-primary/40 transition-colors shadow-sm">
                    <p className="text-lg font-bold text-brand-on-surface dark:text-brand-outline-variant font-headline tracking-tight truncate">{user?.email || '—'}</p>
                  </div>
                </div>
              </div>
              
              <div className="pt-2">
                <Button className="font-black px-10 rounded-2xl shadow-xl shadow-brand-primary/20">Edit Workspace Identity</Button>
              </div>
            </section>
          )}

          {/* Provisioning Section */}
          {activeSection === 'subscription' && (
            <section className="space-y-10">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-brand-on-surface dark:text-white font-headline">Active Provisioning</h3>
                  <p className="text-sm text-brand-on-surface-variant dark:text-brand-outline font-label">Your current resource allocation and tier limits.</p>
                </div>
                <Badge variant="brand" className="px-4 py-3 text-sm font-black tracking-[0.3em] bg-brand-inverse-surface text-white border-none shadow-xl">
                  {user?.plan || 'Free'}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: 'Max Sites', val: plan.maxSites === Infinity ? '∞' : plan.maxSites, desc: 'Concurrent monitoring nodes' },
                  { label: 'Latency', val: plan.checkInterval / 1000 + 's', desc: 'Refresh frequency threshold' },
                  { label: 'Retention', val: plan.retention === Infinity ? '∞' : plan.retention + 'd', desc: 'Historical data persistence' }
                ].map((item, i) => (
                  <Card key={i} className="flex flex-col items-center justify-center text-center p-4 border-brand-outline-variant/20 hover:border-brand-primary/40 transition-all duration-500 group shadow-lg shadow-brand-on-surface/5">
                    <span className="text-3xl font-black text-brand-on-surface dark:text-white font-headline tracking-tighter mb-4 italic group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500">
                      {item.val}
                    </span>
                    <p className="text-[11px] font-black text-brand-outline uppercase tracking-widest mb-2 font-label">
                      {item.label}
                    </p>
                    <p className="text-[10px] font-medium text-brand-on-surface-variant dark:text-brand-outline opacity-60 font-label leading-tight max-w-[120px]">
                      {item.desc}
                    </p>
                  </Card>
                ))}
              </div>

              <Card className="p-6 bg-brand-inverse-surface border-none shadow-2xl shadow-brand-on-surface/10 overflow-hidden group">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                  <div className="space-y-2 text-center md:text-left">
                    <h4 className="text-2xl font-black text-black font-headline">Expand Your Infrastructure</h4>
                    <p className="text-black/60 text-sm font-medium font-label max-w-md">Upgrade to a higher tier for increased monitoring nodes, lower latency, and extended retention.</p>
                  </div>
                  <Button className="bg-brand-primary hover:bg-brand-primarytext-white font-black px-10 py-4 rounded-2xl shadow-xl transition-all w-full md:w-auto">
                    View Enterprise Tiers
                  </Button>
                </div>
                <div className="absolute top-0 right-0 h-full w-1/3 bg-white/5 skew-x-12 transform translate-x-1/2 group-hover:translate-x-1/3 transition-transform duration-700" />
              </Card>
            </section>
          )}

          {/* Security Section */}
          {activeSection === 'security' && (
            <section className="space-y-8">
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-brand-on-surface dark:text-white font-headline">Credential Security</h3>
                <p className="text-sm text-brand-on-surface-variant dark:text-brand-outline font-label">Maintain the integrity of your workspace access.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <button className="flex items-center justify-between p-4 rounded-xl bg-white border border-brand-primary/40 hover:shadow-brand-on-surface/5 transition-all group text-left shadow-sm">
                    <div className="flex items-center gap-6">
                      <div className="h-12 w-12 rounded-3xl bg-brand-surface-container-high flex items-center justify-center text-brand-outline group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-all duration-500">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                      </div>
                      <div className="space-y-1">
                        <h5 className="text-lg font-black text-brand-on-surface dark:text-brand-outline-variant font-headline">Access Credentials</h5>
                        <p className="text-xs font-medium text-brand-on-surface-variant font-label tracking-widest opacity-60">Update Password</p>
                      </div>
                    </div>
                    <div className="h-10 w-10 rounded-full border border-brand-outline-variant/20 flex items-center justify-center text-brand-outline group-hover:text-brand-primary group-hover:border-brand-primary/40 transition-all">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                 </button>

                 <div className="p-4 rounded-xl bg-brand-surface-container-low/50 border border-dashed border-brand-outline-variant/40 flex items-center justify-between group grayscale opacity-60 pointer-events-none">
                    <div className="flex items-center gap-6">
                      <div className="h-16 w-16 rounded-3xl bg-brand-surface-container-high flex items-center justify-center text-brand-outline">
                        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <div className="space-y-1">
                        <h5 className="text-lg font-black text-brand-on-surface dark:text-brand-outline-variant font-headline uppercase tracking-tight italic">Multi-Factor</h5>
                        <Badge variant="neutral" className="px-3 py-1 text-[8px] font-black uppercase tracking-widest">Available Soon</Badge>
                      </div>
                    </div>
                 </div>
              </div>
            </section>
          )}

          {/* Engine Section */}
          {activeSection === 'system' && isAdmin && (
            <section className="animate-in fade-in slide-in-from-right-4 duration-500">
              {!isViewer && <BacklinksLimitCard />}
            </section>
          )}

        </main>
      </div>
    </div>
  );
}
