import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart } from 'recharts';
import { useState, useEffect } from 'react';
import Spinner from '../common/Spinner';

export default function DashboardAnalytics({ sites, isLoading }) {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');

  // Generate mock analytics data based on sites
  useEffect(() => {
    if (!sites.length) {
      setAnalyticsData(null);
      return;
    }

    const generateMockData = () => {
      const days = selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : 90;
      const trafficData = Array.from({ length: days }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (days - i - 1));
        return {
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          sessions: Math.floor(Math.random() * 5000) + 2000,
          views: Math.floor(Math.random() * 8000) + 3000,
          users: Math.floor(Math.random() * 2000) + 800,
        };
      });

      const eventData = [
        { name: 'Page Views', value: Math.floor(Math.random() * 45000) + 20000 },
        { name: 'Clicks', value: Math.floor(Math.random() * 30000) + 10000 },
        { name: 'Form Submissions', value: Math.floor(Math.random() * 5000) + 1000 },
        { name: 'Downloads', value: Math.floor(Math.random() * 3000) + 500 },
        { name: 'Signups', value: Math.floor(Math.random() * 2000) + 200 },
      ];

      const topPages = [
        { page: '/home', views: Math.floor(Math.random() * 15000) + 5000, bounce: Math.floor(Math.random() * 100) },
        { page: '/products', views: Math.floor(Math.random() * 12000) + 4000, bounce: Math.floor(Math.random() * 100) },
        { page: '/pricing', views: Math.floor(Math.random() * 10000) + 3000, bounce: Math.floor(Math.random() * 100) },
        { page: '/about', views: Math.floor(Math.random() * 8000) + 2000, bounce: Math.floor(Math.random() * 100) },
        { page: '/contact', views: Math.floor(Math.random() * 6000) + 1000, bounce: Math.floor(Math.random() * 100) },
      ];

      return { trafficData, eventData, topPages };
    };

    setAnalyticsData(generateMockData());
  }, [sites, selectedPeriod]);

  if (isLoading || !analyticsData) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-sm font-medium text-brand-outline dark:text-brand-on-surface-variant">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const COLORS = ['#3525cd', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
  const upColor = '#10b981';
  const downColor = '#ef4444';

  const siteStats = {
    totalSites: sites.length,
    upSites: sites.filter((s) => s.currentStatus === 'up').length,
    downSites: sites.filter((s) => s.currentStatus === 'down').length,
    uptime: sites.length ? (((sites.filter((s) => s.currentStatus === 'up').length / sites.length) * 100).toFixed(1)) : 0,
  };

  return (
    <div className="space-y-8">
      {/* Period Selector */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-brand-on-surface dark:text-white">Time Period:</span>
        <div className="flex gap-2">
          {['7d', '30d', '90d'].map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedPeriod === period
                  ? 'bg-brand-primary text-white'
                  : 'bg-brand-surface-container-low dark:bg-brand-on-surface/20 text-brand-on-surface dark:text-white hover:bg-brand-surface-container dark:hover:bg-brand-on-surface/30'
              }`}
            >
              {period === '7d' ? 'Last 7 Days' : period === '30d' ? 'Last 30 Days' : 'Last 90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Infrastructure Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Sites', value: siteStats.totalSites, color: 'border-l-blue-500 bg-blue-50 dark:bg-blue-500/5' },
          { label: 'Operational', value: siteStats.upSites, color: 'border-l-emerald-500 bg-emerald-50 dark:bg-emerald-500/5' },
          { label: 'Critical', value: siteStats.downSites, color: 'border-l-rose-500 bg-rose-50 dark:bg-rose-500/5' },
          { label: 'Uptime %', value: `${siteStats.uptime}%`, color: 'border-l-amber-500 bg-amber-50 dark:bg-amber-500/5' },
        ].map((stat, idx) => (
          <div key={idx} className={`border-l-4 ${stat.color} p-5 rounded-lg`}>
            <p className="text-xs font-bold text-brand-outline-variant dark:text-brand-on-surface-variant uppercase tracking-widest">
              {stat.label}
            </p>
            <h3 className="text-4xl font-bold text-brand-on-surface dark:text-white tracking-tight font-headline mt-2">
              {stat.value}
            </h3>
          </div>
        ))}
      </div>

      {/* Traffic Overview Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sessions & Views Line Chart */}
        <div className="bg-brand-surface-container-lowest dark:bg-brand-on-surface/40 border border-brand-outline-variant dark:border-brand-outline/40 rounded-lg p-6">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-brand-on-surface dark:text-white">Traffic Overview</h3>
            <p className="text-xs text-brand-outline dark:text-brand-on-surface-variant mt-1">Sessions & Page Views</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analyticsData.trafficData}>
              <defs>
                <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3525cd" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3525cd" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e3e5" dark="true" />
              <XAxis dataKey="date" stroke="#777587" style={{ fontSize: '12px' }} />
              <YAxis stroke="#777587" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e0e3e5',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#191c1e', fontWeight: 'bold' }}
              />
              <Legend />
              <Area type="monotone" dataKey="sessions" stroke="#3525cd" fillOpacity={1} fill="url(#colorSessions)" />
              <Area type="monotone" dataKey="views" stroke="#10b981" fillOpacity={1} fill="url(#colorViews)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Events Distribution Pie Chart */}
        <div className="bg-brand-surface-container-lowest dark:bg-brand-on-surface/40 border border-brand-outline-variant dark:border-brand-outline/40 rounded-lg p-6">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-brand-on-surface dark:text-white">Event Distribution</h3>
            <p className="text-xs text-brand-outline dark:text-brand-on-surface-variant mt-1">Total events by type</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analyticsData.eventData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value.toLocaleString()}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {analyticsData.eventData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => value.toLocaleString()} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Pages & User Engagement */}
      <div className="bg-brand-surface-container-lowest dark:bg-brand-on-surface/40 border border-brand-outline-variant dark:border-brand-outline/40 rounded-lg p-6">
        <div className="mb-6">
          <h3 className="text-lg font-bold text-brand-on-surface dark:text-white">Top Pages by Views</h3>
          <p className="text-xs text-brand-outline dark:text-brand-on-surface-variant mt-1">Most visited pages with bounce rate</p>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={analyticsData.topPages}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e3e5" />
            <XAxis dataKey="page" stroke="#777587" style={{ fontSize: '12px' }} />
            <YAxis stroke="#777587" style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e0e3e5',
                borderRadius: '8px',
              }}
              labelStyle={{ color: '#191c1e', fontWeight: 'bold' }}
            />
            <Legend />
            <Bar dataKey="views" fill="#3525cd" name="Page Views" radius={[8, 8, 0, 0]} />
            <Bar dataKey="bounce" fill="#f59e0b" name="Bounce Rate %" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Daily Users Trend */}
      <div className="bg-brand-surface-container-lowest dark:bg-brand-on-surface/40 border border-brand-outline-variant dark:border-brand-outline/40 rounded-lg p-6">
        <div className="mb-6">
          <h3 className="text-lg font-bold text-brand-on-surface dark:text-white">User Engagement Trend</h3>
          <p className="text-xs text-brand-outline dark:text-brand-on-surface-variant mt-1">Unique users over time</p>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={analyticsData.trafficData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e3e5" />
            <XAxis dataKey="date" stroke="#777587" style={{ fontSize: '12px' }} />
            <YAxis stroke="#777587" style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e0e3e5',
                borderRadius: '8px',
              }}
              labelStyle={{ color: '#191c1e', fontWeight: 'bold' }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="users"
              stroke="#8b5cf6"
              name="Unique Users"
              strokeWidth={2}
              dot={{ fill: '#8b5cf6', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
