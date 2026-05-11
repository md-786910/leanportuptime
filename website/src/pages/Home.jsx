import React, { useEffect } from 'react';

export default function Home() {
  const appUrl = import.meta.env.VITE_APP_URL || 'http://localhost:3000';

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <main className="flex-grow pt-20">
      {/* Hero Section */}
      <section className="relative pt-24 pb-32 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-30">
          <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-brand-primary-container/40 blur-[100px]"></div>
          <div className="absolute top-[30%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-400/20 blur-[100px]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-surface-container-lowest border border-brand-outline-variant/30 text-brand-on-surface-variant text-xs font-semibold mb-8 shadow-sm backdrop-blur-sm">
            <span className="relative flex w-2.5 h-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full w-2.5 h-2.5 bg-emerald-500"></span>
            </span>
            Sitelyze Platform 2.0 is Live
          </div>
          
          <h1 className="font-headline text-5xl md:text-7xl font-extrabold text-brand-on-surface tracking-tight mb-6 max-w-4xl mx-auto leading-[1.15]">
            Intelligent oversight for your <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-blue-500">entire web presence.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-brand-on-surface-variant mb-12 max-w-2xl mx-auto leading-relaxed">
            Consolidate uptime monitoring, SEO analytics, and continuous security auditing into a single, unified command center built for high-performance teams.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a 
              href={appUrl} 
              className="w-full sm:w-auto bg-brand-primary hover:bg-brand-on-primary-fixed-variant text-brand-on-primary px-8 py-4 rounded-full text-base font-semibold transition-all shadow-xl shadow-brand-primary/20 hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              Access Dashboard
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </a>
            <a 
              href={appUrl} 
              className="w-full sm:w-auto bg-brand-surface-container-lowest hover:bg-brand-surface-container-low text-brand-on-surface border border-brand-outline-variant px-8 py-4 rounded-full text-base font-semibold transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px] text-brand-on-surface-variant">lock</span>
              Admin Sign In
            </a>
          </div>

          <div className="mt-8 flex items-center justify-center gap-2 text-sm text-brand-on-surface-variant font-medium">
            <span className="material-symbols-outlined text-[18px] text-brand-error">admin_panel_settings</span>
            Account registration is managed strictly by workspace administrators.
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y border-brand-outline-variant/20 bg-brand-surface-container-lowest/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-brand-outline-variant/20">
            <div>
              <div className="text-3xl font-headline font-bold text-brand-on-surface mb-1">99.99%</div>
              <div className="text-sm text-brand-on-surface-variant font-medium">Uptime Guarantee</div>
            </div>
            <div>
              <div className="text-3xl font-headline font-bold text-brand-on-surface mb-1">24/7</div>
              <div className="text-sm text-brand-on-surface-variant font-medium">Active Monitoring</div>
            </div>
            <div>
              <div className="text-3xl font-headline font-bold text-brand-on-surface mb-1">&lt;50ms</div>
              <div className="text-sm text-brand-on-surface-variant font-medium">Alert Latency</div>
            </div>
            <div>
              <div className="text-3xl font-headline font-bold text-brand-on-surface mb-1">100+</div>
              <div className="text-sm text-brand-on-surface-variant font-medium">Security Checks</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-brand-background relative scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-headline text-3xl md:text-5xl font-extrabold text-brand-on-surface mb-4">Everything you need, nothing you don't.</h2>
            <p className="text-brand-on-surface-variant text-lg max-w-2xl mx-auto">Sitelyze replaces multiple disjointed tools with a cohesive platform designed for reliability and actionable insights.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-10 rounded-[2rem] bg-brand-surface-container-lowest border border-brand-outline-variant/30 hover:border-brand-primary/40 transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1 group">
              <div className="w-14 h-14 rounded-2xl bg-brand-primary-container/10 text-brand-primary flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300">
                <span className="material-symbols-outlined text-[28px]">speed</span>
              </div>
              <h3 className="text-2xl font-headline font-bold text-brand-on-surface mb-4">Real-time Uptime</h3>
              <p className="text-brand-on-surface-variant leading-relaxed">
                Continuous polling of your critical endpoints. Receive instantaneous alerts via email, Slack, or webhook the moment degradation is detected.
              </p>
            </div>
            
            <div className="p-10 rounded-[2rem] bg-brand-surface-container-lowest border border-brand-outline-variant/30 hover:border-blue-500/40 transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1 group">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300">
                <span className="material-symbols-outlined text-[28px]">query_stats</span>
              </div>
              <h3 className="text-2xl font-headline font-bold text-brand-on-surface mb-4">SEO Intelligence</h3>
              <p className="text-brand-on-surface-variant leading-relaxed">
                Track keyword positions, monitor backlink health, and seamlessly integrate with Google Search Console for deep visibility into organic performance.
              </p>
            </div>

            <div className="p-10 rounded-[2rem] bg-brand-surface-container-lowest border border-brand-outline-variant/30 hover:border-emerald-500/40 transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1 group">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300">
                <span className="material-symbols-outlined text-[28px]">shield_lock</span>
              </div>
              <h3 className="text-2xl font-headline font-bold text-brand-on-surface mb-4">Security Posture</h3>
              <p className="text-brand-on-surface-variant leading-relaxed">
                Automated SSL certificate validation and proactive vulnerability scanning. Stay compliant and secure against emerging digital threats.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-24 bg-brand-surface-container-lowest relative scroll-mt-20 border-t border-brand-outline-variant/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center gap-16">
            <div className="md:w-1/2">
              <h2 className="font-headline text-3xl md:text-5xl font-extrabold text-brand-on-surface mb-6">Built for scale, designed for speed.</h2>
              <p className="text-brand-on-surface-variant text-lg mb-8 leading-relaxed">
                Experience unparalleled visibility into your infrastructure without the noise. Our platform is engineered to surface what matters most, exactly when you need to know it.
              </p>
              
              <ul className="space-y-6">
                <li className="flex items-start gap-4">
                  <div className="mt-1 w-8 h-8 rounded-full bg-brand-primary-container/20 text-brand-primary flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-sm">bolt</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-brand-on-surface mb-1">Instant Notification Routing</h4>
                    <p className="text-brand-on-surface-variant text-sm">Configure multi-channel alerts to ensure the right team members are notified instantly, minimizing downtime and SLA breaches.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="mt-1 w-8 h-8 rounded-full bg-brand-primary-container/20 text-brand-primary flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-sm">analytics</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-brand-on-surface mb-1">Unified Reporting Dashboard</h4>
                    <p className="text-brand-on-surface-variant text-sm">Generate beautiful, white-labeled PDF reports encompassing SEO metrics, uptime statistics, and security audits with a single click.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="mt-1 w-8 h-8 rounded-full bg-brand-primary-container/20 text-brand-primary flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-sm">group</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-brand-on-surface mb-1">Enterprise Role Management</h4>
                    <p className="text-brand-on-surface-variant text-sm">Securely share access with stakeholders using granular permissions, ensuring team members only see the projects they are authorized to manage.</p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="md:w-1/2 w-full relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-brand-primary to-blue-500 rounded-3xl transform rotate-3 scale-105 opacity-20 blur-xl"></div>
              <div className="relative bg-brand-background border border-brand-outline-variant/30 rounded-3xl p-8 shadow-2xl overflow-hidden">
                 <div className="flex items-center justify-between mb-8 border-b border-brand-outline-variant/20 pb-4">
                   <div className="flex gap-2">
                     <div className="w-3 h-3 rounded-full bg-red-400"></div>
                     <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                     <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                   </div>
                   <div className="text-xs font-medium text-brand-outline">Dashboard Preview</div>
                 </div>
                 <div className="space-y-4">
                    <div className="h-10 bg-brand-surface-container rounded-xl w-full animate-pulse"></div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="h-24 bg-brand-surface-container rounded-xl animate-pulse delay-75"></div>
                      <div className="h-24 bg-brand-surface-container rounded-xl animate-pulse delay-100"></div>
                      <div className="h-24 bg-brand-surface-container rounded-xl animate-pulse delay-150"></div>
                    </div>
                    <div className="h-32 bg-brand-surface-container rounded-xl w-full animate-pulse delay-200"></div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Clean CTA Section */}
      <section className="py-24 bg-brand-on-surface text-brand-surface-container-lowest relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9IiNmZmZmZmYiLz48L3N2Zz4=')]"></div>
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="font-headline text-4xl md:text-5xl font-extrabold mb-6">Ready to secure your digital assets?</h2>
          <p className="text-brand-outline-variant text-lg mb-10 max-w-2xl mx-auto">
            Join the organizations trusting Sitelyze for uninterrupted performance and deep analytical insights.
          </p>
          <a 
            href={appUrl} 
            className="inline-flex items-center gap-2 bg-brand-primary hover:bg-brand-primary-container text-white px-8 py-4 rounded-full text-base font-bold transition-all shadow-xl hover:scale-105"
          >
            Sign In to Your Workspace
            <span className="material-symbols-outlined text-[20px]">login</span>
          </a>
        </div>
      </section>
    </main>
  );
}