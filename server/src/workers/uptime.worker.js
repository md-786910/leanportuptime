const { Worker } = require('bullmq');
const config = require('../config');
const monitorService = require('../services/monitor.service');
const notificationService = require('../services/notification.service');
const Site = require('../models/Site');
const Check = require('../models/Check');
const logger = require('../utils/logger');

async function callProbe(probe, url, secret) {
  const res = await fetch(`${probe.url}/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, secret }),
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Probe ${probe.name} HTTP ${res.status}`);
  return res.json();
}

async function runProbeChecks(siteId, url) {
  if (!config.probes.length) return [];
  const settled = await Promise.allSettled(
    config.probes.map(async (probe) => {
      const result = await callProbe(probe, url, config.probeSecret);
      await Check.create({ siteId, timestamp: new Date(), ...result });
      logger.debug(`Probe [${probe.name}]: ${url} -> ${result.status}`);
      return result;
    })
  );
  return settled
    .filter((s) => s.status === 'fulfilled')
    .map((s) => s.value);
}

function aggregateStatus(localResult, probeResults) {
  const allStatuses = [localResult.status, ...probeResults.map((r) => r.status)];
  if (allStatuses.includes('up')) return 'up';
  if (allStatuses.includes('degraded')) return 'degraded';
  return 'down';
}

function createUptimeWorker(connection) {
  const worker = new Worker(
    'uptime-checks',
    async (job) => {
      const { siteId, url } = job.data;
      logger.debug(`Uptime check started: ${url}`);

      // Fetch site to get expectedKeywords
      const site = await Site.findById(siteId).populate('userId', 'email');
      if (!site) return;

      const result = await monitorService.performCheck(url, site.expectedKeywords || []);

      // Save local check result
      await Check.create({
        siteId,
        timestamp: new Date(),
        ...result,
      });

      // Run probe checks and collect results
      const probeResults = await runProbeChecks(siteId, url);

      // Determine aggregated status across all locations
      const aggregatedStatus = aggregateStatus(result, probeResults);

      // Update site status using aggregated result
      const previousStatus = site.currentStatus;
      site.currentStatus = aggregatedStatus;
      site.lastCheckedAt = new Date();

      if (aggregatedStatus === 'down') {
        site.consecutiveFailures += 1;
      } else {
        site.consecutiveFailures = 0;
      }

      await site.save();

      // Notify on status change
      if (previousStatus !== 'pending' && previousStatus !== aggregatedStatus) {
        const message =
          aggregatedStatus === 'down'
            ? `Site ${site.name} is DOWN from all locations. Error: ${result.error || `HTTP ${result.httpStatus}`}`
            : `Site ${site.name} is back UP. Response time: ${result.responseTime}ms`;

        await notificationService.notify(site.userId._id, site, aggregatedStatus, message);
      }

      // Notify on keyword mismatch
      if (result.keywordMatch === false && result.missingKeywords?.length > 0) {
        await notificationService.notify(
          site.userId._id,
          site,
          'degraded',
          `Content alert for ${site.name}: expected keywords missing — ${result.missingKeywords.join(', ')}`
        );
      }

      logger.debug(`Uptime check completed: ${url} -> ${aggregatedStatus}`);
      return result;
    },
    {
      connection,
      concurrency: 10,
      limiter: { max: 50, duration: 60000 },
    }
  );

  worker.on('failed', (job, err) => {
    logger.error(`Uptime job failed [${job?.data?.url}]: ${err.message}`);
  });

  return worker;
}

module.exports = createUptimeWorker;
