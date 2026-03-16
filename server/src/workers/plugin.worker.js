const { Worker } = require('bullmq');
const pluginService = require('../services/plugin.service');
const Site = require('../models/Site');
const PluginAudit = require('../models/PluginAudit');
const Notification = require('../models/Notification');
const notificationService = require('../services/notification.service');
const logger = require('../utils/logger');

function createPluginWorker(connection) {
  const worker = new Worker(
    'plugin-checks',
    async (job) => {
      const { siteId, url } = job.data;
      logger.debug(`Plugin scan started: ${url}`);

      const result = await pluginService.scanPlugins(url);

      // Save audit result
      await PluginAudit.create({
        siteId,
        ...result,
        scannedAt: new Date(),
      });

      // Update site's embedded plugin data
      const site = await Site.findById(siteId).populate('userId', 'email');
      if (!site) return;

      site.plugins.lastScannedAt = new Date();
      site.plugins.totalPlugins = result.totalPlugins;
      site.plugins.issueCount = result.issueCount;
      await site.save();

      // Send notification if issues found
      if (result.issueCount > 0) {
        // Check for duplicate notification today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const existing = await Notification.findOne({
          siteId,
          type: 'plugin_alert',
          createdAt: { $gte: today },
        });

        if (!existing) {
          const criticalPlugins = result.plugins
            .filter((p) => p.status === 'critical')
            .map((p) => p.name);
          const warnPlugins = result.plugins
            .filter((p) => p.status === 'warn')
            .map((p) => p.name);

          // Check for flagged plugins
          const flaggedFound = result.plugins
            .filter((p) => site.plugins.flaggedPlugins.includes(p.slug))
            .map((p) => p.name);

          const parts = [];
          if (criticalPlugins.length > 0) {
            parts.push(`Critical: ${criticalPlugins.join(', ')} (closed/deprecated)`);
          }
          if (warnPlugins.length > 0) {
            parts.push(`Warning: ${warnPlugins.join(', ')} (outdated/abandoned)`);
          }
          if (flaggedFound.length > 0) {
            parts.push(`Flagged plugins detected: ${flaggedFound.join(', ')}`);
          }

          const message = `Plugin scan for ${site.name}: ${result.issueCount} issue(s) found. ${parts.join('. ')}`;

          await notificationService.notify(
            site.userId._id,
            site,
            'plugin_alert',
            message
          );
        }
      }

      logger.debug(`Plugin scan completed: ${url} -> ${result.totalPlugins} plugins, ${result.issueCount} issues`);
      return result;
    },
    { connection, concurrency: 3 }
  );

  worker.on('failed', (job, err) => {
    logger.error(`Plugin job failed [${job?.data?.url}]: ${err.message}`);
  });

  return worker;
}

module.exports = createPluginWorker;
