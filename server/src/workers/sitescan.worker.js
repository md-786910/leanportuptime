const { Worker } = require('bullmq');
const siteScanService = require('../services/sitescan.service');
const Site = require('../models/Site');
const SiteScan = require('../models/SiteScan');
const Notification = require('../models/Notification');
const notificationService = require('../services/notification.service');
const logger = require('../utils/logger');

function createSiteScanWorker(connection) {
  const worker = new Worker(
    'sitescan-checks',
    async (job) => {
      const { siteId, url } = job.data;
      logger.debug(`Site scan started: ${url}`);

      const result = await siteScanService.runScan(url);

      // Save scan result
      await SiteScan.create({
        siteId,
        ...result,
        scannedAt: new Date(),
      });

      // Update site's embedded siteScan data
      const site = await Site.findById(siteId).populate('userId', 'email');
      if (!site) return;

      site.siteScan = {
        lastScannedAt: new Date(),
        score: result.score,
        performanceScore: result.performanceScore,
        bugsScore: result.bugsScore,
        malwareScore: result.malwareScore,
      };
      await site.save();

      // Send notification if score is low or malware detected
      const hasMalwareFail = result.checks.some(
        (c) => c.category === 'malware' && c.status === 'fail'
      );

      if (result.score < 50 || hasMalwareFail) {
        // Deduplicate: one notification per site per day
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const existing = await Notification.findOne({
          siteId,
          type: 'site_scan_alert',
          createdAt: { $gte: today },
        });

        if (!existing) {
          const parts = [];
          if (hasMalwareFail) parts.push(`Malware indicators detected (malware score: ${result.malwareScore}/100)`);
          if (result.performanceScore < 50) parts.push(`Poor performance (score: ${result.performanceScore}/100)`);
          if (result.bugsScore < 50) parts.push(`Multiple issues found (score: ${result.bugsScore}/100)`);

          const message = `Full site scan for ${site.name}: Overall score ${result.score}/100. ${parts.join('. ')}`;

          await notificationService.notify(
            site.userId._id,
            site,
            'site_scan_alert',
            message
          );
        }
      }

      logger.debug(`Site scan completed: ${url} -> Score: ${result.score}`);
      return result;
    },
    { connection, concurrency: 2 }
  );

  worker.on('failed', (job, err) => {
    logger.error(`Site scan job failed [${job?.data?.url}]: ${err.message}`);
  });

  return worker;
}

module.exports = createSiteScanWorker;
