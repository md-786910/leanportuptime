const { Queue } = require('bullmq');
const config = require('./index');

const parsedRedis = new URL(config.redisUrl);
const connection = {
  host: parsedRedis.hostname || 'localhost',
  port: parseInt(parsedRedis.port, 10) || 6379,
  ...(parsedRedis.password && { password: decodeURIComponent(parsedRedis.password) }),
};

const uptimeQueue = new Queue('uptime-checks', { connection });
const sslQueue = new Queue('ssl-checks', { connection });
const securityQueue = new Queue('security-checks', { connection });
const pluginQueue = new Queue('plugin-checks', { connection });
const siteScanQueue = new Queue('sitescan-checks', { connection });
const seoQueue = new Queue('seo-checks', { connection });
const notificationQueue = new Queue('notifications', { connection });

module.exports = {
  uptimeQueue,
  sslQueue,
  securityQueue,
  pluginQueue,
  siteScanQueue,
  seoQueue,
  notificationQueue,
  connection,
};
