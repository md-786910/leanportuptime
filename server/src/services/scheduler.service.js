const cron = require('node-cron');
const Site = require('../models/Site');
const { uptimeQueue, sslQueue, securityQueue } = require('../config/queue');
const logger = require('../utils/logger');

class SchedulerService {
  start() {
    // Run every minute — check which sites are due for monitoring
    cron.schedule('* * * * *', () => this.scheduleUptimeChecks());

    // SSL checks every hour (use '0 */6 * * *' for production)
    cron.schedule('0 * * * *', () => this.scheduleSSLChecks());

    // Security audits once daily at 3 AM
    cron.schedule('0 3 * * *', () => this.scheduleSecurityChecks());

    logger.info('Scheduler started');
  }

  async scheduleUptimeChecks() {
    try {
      const now = Date.now();
      const sites = await Site.find({ paused: false }).lean();

      for (const site of sites) {
        const lastCheck = site.lastCheckedAt ? new Date(site.lastCheckedAt).getTime() : 0;
        const interval = site.interval || 5 * 60 * 1000;

        if (now - lastCheck >= interval) {
          await uptimeQueue.add(
            'uptime-check',
            { siteId: site._id.toString(), url: site.url },
            {
              removeOnComplete: 100,
              removeOnFail: 50,
              attempts: 2,
              backoff: { type: 'exponential', delay: 5000 },
            }
          );
        }
      }
    } catch (error) {
      logger.error(`Scheduler uptime error: ${error.message}`);
    }
  }

  async scheduleSSLChecks() {
    try {
      const sites = await Site.find({ paused: false }).lean();
      for (const site of sites) {
        if (site.url.startsWith('https://')) {
          await sslQueue.add(
            'ssl-check',
            { siteId: site._id.toString(), url: site.url },
            { removeOnComplete: 50, removeOnFail: 20 }
          );
        }
      }
      logger.info(`Scheduled SSL checks for ${sites.length} sites`);
    } catch (error) {
      logger.error(`Scheduler SSL error: ${error.message}`);
    }
  }

  async scheduleSecurityChecks() {
    try {
      const sites = await Site.find({ paused: false }).lean();
      for (const site of sites) {
        await securityQueue.add(
          'security-check',
          { siteId: site._id.toString(), url: site.url },
          { removeOnComplete: 50, removeOnFail: 20 }
        );
      }
      logger.info(`Scheduled security checks for ${sites.length} sites`);
    } catch (error) {
      logger.error(`Scheduler security error: ${error.message}`);
    }
  }
}

module.exports = new SchedulerService();
