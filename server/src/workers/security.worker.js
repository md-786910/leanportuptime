const { Worker } = require('bullmq');
const securityService = require('../services/security.service');
const Site = require('../models/Site');
const SecurityAudit = require('../models/SecurityAudit');
const notificationService = require('../services/notification.service');
const logger = require('../utils/logger');

function createSecurityWorker(connection) {
  const worker = new Worker(
    'security-checks',
    async (job) => {
      const { siteId, url } = job.data;
      logger.debug(`Security audit started: ${url}`);

      const result = await securityService.runAudit(url);

      // Save audit result
      await SecurityAudit.create({
        siteId,
        ...result,
        scannedAt: new Date(),
      });

      // Update site's embedded security data
      const site = await Site.findById(siteId).populate('userId', 'email');
      if (!site) return;

      site.security = result.checks;
      site.securityScore = result.score;
      await site.save();

      // Alert if score is critically low
      if (result.score < 50) {
        await notificationService.notify(
          site.userId._id,
          site,
          'security_alert',
          `Security score for ${site.name} is ${result.score}/100. ${result.failedChecks} checks failed.`
        );
      }

      logger.debug(`Security audit completed: ${url} -> Score: ${result.score}`);
      return result;
    },
    { connection, concurrency: 3 }
  );

  worker.on('failed', (job, err) => {
    logger.error(`Security job failed [${job?.data?.url}]: ${err.message}`);
  });

  return worker;
}

module.exports = createSecurityWorker;
