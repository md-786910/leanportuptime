import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart } from 'recharts';
import { useState, useEffect, useMemo } from 'react';
import Spinner from '../common/Spinner';
import AlertsFeed from './AlertsFeed';

export default function DashboardAnalytics({ sites, isLoading }) {
  const [selectedPeriod, setSelectedPeriod] = useState('7d');

  // Aggregate real data from sites
  const aggregates = useMemo(() => {
    if (!sites.length) return null;

    const totalSites = sites.length;
    const avgSecurityScore = Math.round(sites.reduce((acc, s) => acc + (s.securityScore || 0), 0) / totalSites);
    const avgSeoScore = Math.round(sites.reduce((acc, s) => acc + (s.seo?.score || 0), 0) / totalSites);
    const totalPluginIssues = sites.reduce((acc, s) => acc + (s.plugins?.issueCount || 0), 0);
    const sslExpiringSoon = sites.filter(s => s.ssl?.daysRemaining !== undefined && s.ssl.daysRemaining < 30).length;
    
    // Performance aggregation
    const avgPerformance = Math.round(sites.reduce((acc, s) => acc + (s.siteScan?.performanceScore || 0), 0) / totalSites);

    return {
      avgSecurityScore,
      avgSeoScore,
      totalPluginIssues,
      sslExpiringSoon,
      avgPerformance
    };
  }, [sites]);

  // Generate mock traffic data (since we don't have historical aggregate traffic in the sites array)
  // In a real production app, this would come from a dedicated analytics-aggregate API endpoint
  const trafficData = useMemo(() => {
    const days = selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : 90;
    return Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - i - 1));
      
      // Base traffic on number of sites to make it feel "real"
      const multiplier = sites.length || 1;
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        sessions: Math.floor((Math.random() * 1000 + 500) * multiplier),
        views: Math.floor((Math.random() * 2000 + 1000) * multiplier),
        users: Math.floor((Math.random() * 400 + 200) * multiplier),
      };
    });
  }, [sites.length, selectedPeriod]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-sm font-medium text-brand-outline dark:text-brand-on-surface-variant animate-pulse">Analyzing infrastructure...</p>
        </div>
      </div>
    );
  }

  const COLORS = ['#3525cd', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-8">
      {/* Fleet Health Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { 
            label: 'Security Posture', 
            value: aggregates?.avgSecurityScore || 0, 
            unit: '%',
            color: 'text-blue-600', 
            bg: 'bg-blue-50/50 dark:bg-blue-500/5',
            border: 'border-blue-100 dark:border-blue-500/20',
            desc: 'Average across fleet'
          },
          { 
            label: 'SEO Visibility', 
            value: aggregates?.avgSeoScore || 0, 
            unit: '%',
            color: 'text-emerald-600', 
            bg: 'bg-emerald-50/50 dark:bg-emerald-500/5',
            border: 'border-emerald-100 dark:border-emerald-500/20',
            desc: 'Search health index'
          },
          { 
            label: 'Vulnerabilities', 
            value: aggregates?.totalPluginIssues || 0, 
            unit: '',
            color: 'text-rose-600', 
            bg: 'bg-rose-50/50 dark:bg-rose-500/5',
            border: 'border-rose-100 dark:border-rose-500/20',
            desc: 'Critical plugin updates'
          },
          { 
            label: 'SSL Compliance', 
            value: sites.length - (aggregates?.sslExpiringSoon || 0), 
            total: sites.length,
            unit: 'Valid',
            color: 'text-amber-600', 
            bg: 'bg-amber-50/50 dark:bg-amber-500/5',
            border: 'border-amber-100 dark:border-amber-500/20',
            desc: aggregates?.sslExpiringSoon > 0 ? `${aggregates.sslExpiringSoon} expiring soon` : 'All certificates healthy'
          },
        ].map((stat, idx) => (
          <div key={idx} className={`py-2 px-4 rounded-xl border ${stat.border} ${stat.bg} space-y-2 relative overflow-hidden group`}>
             <div className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 bg-current opacity-[0.03] rounded-full group-hover:scale-110 transition-transform duration-500" />
            <p className="text-[12px] font-bold text-brand-outline dark:text-brand-on-surface-variant uppercase tracking-[0.2em]">
              {stat.label}
            </p>
            <div className="flex items-baseline gap-1">
              <h3 className={`text-3xl font-bold ${stat.color} dark:text-white tracking-tight`}>
                {stat.value}
              </h3>
              {stat.total !== undefined ? (
                <span className="text-sm font-bold text-brand-outline">/ {stat.total}</span>
              ) : (
                <span className="text-sm font-bold text-brand-outline">{stat.unit}</span>
              )}
            </div>
            <p className="text-[11px] font-medium text-brand-outline dark:text-brand-on-surface-variant">
              {stat.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Period Selector & Quick Actions */}
      {/* <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-brand-outline dark:text-brand-on-surface-variant uppercase tracking-widest">Timeframe</span>
          <div className="flex p-1 bg-brand-surface-container-low dark:bg-brand-on-surface/10 rounded-xl border border-brand-outline-variant dark:border-brand-outline/20">
            {['7d', '30d', '90d'].map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedPeriod === period
                    ? 'bg-white dark:bg-brand-primary text-brand-primary dark:text-white shadow-sm'
                    : 'text-brand-outline hover:text-brand-on-surface hover:bg-white dark:hover:text-white'
                }`}
              >
                {period === '7d' ? '7 Days' : period === '30d' ? '30 Days' : '90 Days'}
              </button>
            ))}
          </div>
        </div>
      </div> */}

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* <div className="lg:col-span-3 bg-white dark:bg-brand-surface-container-low border border-brand-outline-variant dark:border-brand-outline/20 rounded-3xl p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-brand-on-surface dark:text-white">Traffic Intelligence</h3>
              <p className="text-xs text-brand-outline dark:text-brand-on-surface-variant mt-1 font-medium">Aggregated fleet sessions & views</p>
            </div>
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full bg-brand-primary" />
                 <span className="text-[10px] font-bold text-brand-outline uppercase tracking-wider">Sessions</span>
               </div>
               <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full bg-emerald-500" />
                 <span className="text-[10px] font-bold text-brand-outline uppercase tracking-wider">Views</span>
               </div>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trafficData}>
                <defs>
                  <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3525cd" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3525cd" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#777587', fontSize: 10, fontWeight: 600 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#777587', fontSize: 10, fontWeight: 600 }}
                  tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(1)}k` : v}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: 'none',
                    borderRadius: '16px',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                    padding: '12px'
                  }}
                  labelStyle={{ fontWeight: 'bold', marginBottom: '4px', fontSize: '12px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="sessions" 
                  stroke="#3525cd" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorSessions)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="views" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorViews)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div> */}
        <div className="lg:col-span-3 bg-white dark:bg-brand-surface-container-low border border-brand-outline-variant dark:border-brand-outline/20 rounded-xl py-4 px-6 shadow-sm">
           <div className="mb-6">
            <h3 className="text-xl font-bold text-brand-on-surface dark:text-white">Performance Benchmarks</h3>
            <p className="text-xs text-brand-outline dark:text-brand-on-surface-variant mt-1 font-medium">Top 5 sites by PageSpeed score</p>
          </div>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[...sites].sort((a,b) => (b.siteScan?.performanceScore || 0) - (a.siteScan?.performanceScore || 0)).slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#777587', fontSize: 10, fontWeight: 600 }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#777587', fontSize: 10, fontWeight: 600 }}
                  domain={[0, 100]}
                />
                <Tooltip
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                />
                <Bar 
                  dataKey="siteScan.performanceScore" 
                  name="Performance Score"
                  fill="#8b5cf6" 
                  radius={[6, 6, 0, 0]}
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fleet Distribution */}
        <div className='flex flex-col gap-4'>
          <AlertsFeed sites={sites} />
          <div className="bg-white dark:bg-brand-surface-container-low border border-brand-outline-variant dark:border-brand-outline/20 rounded-lg p-3 shadow-sm flex flex-col">
            {/* Header */}
            <div className="mb-4">
              <h3 className="text-sm font-bold text-brand-on-surface dark:text-white">
                Status Distribution
              </h3>
              <p className="text-[9px] text-brand-outline dark:text-brand-on-surface-variant mt-0.5 font-medium">
                Infrastructure availability breakdown
              </p>
            </div>

            {/* Chart Section */}
            <div className="flex flex-col items-center justify-center">
              <div className="h-[100px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        {
                          name: "Healthy",
                          value: sites.filter((s) => s.currentStatus === "up").length,
                        },
                        {
                          name: "Degraded",
                          value: sites.filter((s) => s.currentStatus === "degraded").length,
                        },
                        {
                          name: "Down",
                          value: sites.filter((s) => s.currentStatus === "down").length,
                        },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={32}
                      outerRadius={48}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      <Cell fill="#10b981" />
                      <Cell fill="#f59e0b" />
                      <Cell fill="#ef4444" />
                    </Pie>

                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend */}
              <div className="grid grid-cols-3 gap-2 w-full mt-4">
                {[
                  { label: "LIVE", color: "bg-emerald-500" },
                  { label: "DEGRADED", color: "bg-amber-500" },
                  { label: "CRITICAL", color: "bg-rose-500" },
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div
                      className={`h-[3px] w-7 rounded-full ${item.color}`}
                    />
                    <p className="text-[8px] font-medium text-brand-outline uppercase mt-1 tracking-wide">
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Engagement Insights */}
      {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-brand-surface-container-low border border-brand-outline-variant dark:border-brand-outline/20 rounded-3xl p-8 shadow-sm">
           <div className="mb-6">
            <h3 className="text-xl font-bold text-brand-on-surface dark:text-white">Performance Benchmarks</h3>
            <p className="text-xs text-brand-outline dark:text-brand-on-surface-variant mt-1 font-medium">Top 5 sites by PageSpeed score</p>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[...sites].sort((a,b) => (b.siteScan?.performanceScore || 0) - (a.siteScan?.performanceScore || 0)).slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#777587', fontSize: 10, fontWeight: 600 }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#777587', fontSize: 10, fontWeight: 600 }}
                  domain={[0, 100]}
                />
                <Tooltip
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                />
                <Bar 
                  dataKey="siteScan.performanceScore" 
                  name="Performance Score"
                  fill="#8b5cf6" 
                  radius={[6, 6, 0, 0]}
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-brand-surface-container-low border border-brand-outline-variant dark:border-brand-outline/20 rounded-3xl p-8 shadow-sm">
           <div className="mb-6">
            <h3 className="text-xl font-bold text-brand-on-surface dark:text-white">Active Users Trend</h3>
            <p className="text-xs text-brand-outline dark:text-brand-on-surface-variant mt-1 font-medium">Simulated daily active users across ecosystem</p>
          </div>
          <div className="h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trafficData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#777587', fontSize: 10, fontWeight: 600 }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#777587', fontSize: 10, fontWeight: 600 }}
                />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                />
                <Line
                  type="monotone"
                  dataKey="users"
                  stroke="#3525cd"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#3525cd', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div> */}
    </div>
  );
}
