const { Queue } = require('bullmq');
const config = require('./index');

const connection = {
  host: new URL(config.redisUrl).hostname || 'localhost',
  port: parseInt(new URL(config.redisUrl).port, 10) || 6379,
};

const uptimeQueue = new Queue('uptime-checks', { connection });
const sslQueue = new Queue('ssl-checks', { connection });
const securityQueue = new Queue('security-checks', { connection });
const notificationQueue = new Queue('notifications', { connection });

module.exports = {
  uptimeQueue,
  sslQueue,
  securityQueue,
  notificationQueue,
  connection,
};
