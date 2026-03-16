module.exports = {
  PLANS: {
    free: { maxSites: 5, checkInterval: 5 * 60 * 1000, retention: 30 },
    pro: { maxSites: 25, checkInterval: 60 * 1000, retention: 90 },
    agency: { maxSites: 100, checkInterval: 60 * 1000, retention: 365 },
    enterprise: { maxSites: Infinity, checkInterval: 60 * 1000, retention: Infinity },
  },
  SITE_STATUS: {
    UP: 'up',
    DOWN: 'down',
    DEGRADED: 'degraded',
    PENDING: 'pending',
  },
  NOTIFICATION_TYPES: {
    DOWN: 'down',
    UP: 'up',
    SSL_EXPIRY: 'ssl_expiry',
    SECURITY_ALERT: 'security_alert',
    DEGRADED: 'degraded',
    PLUGIN_ALERT: 'plugin_alert',
    SITE_SCAN_ALERT: 'site_scan_alert',
  },
  CHANNELS: ['email', 'slack', 'discord', 'webhook'],
  CHECK_INTERVALS: [
    { label: '1 minute', value: 60000 },
    { label: '5 minutes', value: 300000 },
    { label: '15 minutes', value: 900000 },
    { label: '30 minutes', value: 1800000 },
    { label: '1 hour', value: 3600000 },
    { label: '6 hours', value: 21600000 },
    { label: '12 hours', value: 43200000 },
    { label: '24 hours', value: 86400000 },
  ],
};
