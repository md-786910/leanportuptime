const PDFDocument = require('pdfkit');
const Check = require('../models/Check');
const Site = require('../models/Site');
const SSLCert = require('../models/SSLCert');
const SecurityAudit = require('../models/SecurityAudit');
const logger = require('../utils/logger');

class ReportService {
  async generatePDF(siteId, dateRange = '30d') {
    const site = await Site.findById(siteId);
    if (!site) throw new Error('Site not found');

    const since = this._getDateFromRange(dateRange);

    const [checks, sslCert, securityAudit] = await Promise.all([
      Check.find({ siteId, timestamp: { $gte: since } }).sort({ timestamp: -1 }).lean(),
      SSLCert.findOne({ siteId }).sort({ checkedAt: -1 }).lean(),
      SecurityAudit.findOne({ siteId }).sort({ scannedAt: -1 }).lean(),
    ]);

    const stats = this._calculateStats(checks);

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const buffers = [];

    doc.on('data', (chunk) => buffers.push(chunk));

    return new Promise((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Cover Page
      doc.fontSize(28).font('Helvetica-Bold').text('WP Sentinel', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(16).font('Helvetica').text('Monitoring Report', { align: 'center' });
      doc.moveDown(2);
      doc.fontSize(12).text(`Site: ${site.name}`, { align: 'center' });
      doc.text(`URL: ${site.url}`, { align: 'center' });
      doc.text(`Report Period: ${dateRange}`, { align: 'center' });
      doc.text(`Generated: ${new Date().toISOString()}`, { align: 'center' });

      // Executive Summary
      doc.addPage();
      doc.fontSize(20).font('Helvetica-Bold').text('Executive Summary');
      doc.moveDown();
      doc.fontSize(12).font('Helvetica');
      doc.text(`Uptime: ${stats.uptimePercent}%`);
      doc.text(`Avg Response Time: ${stats.avgResponseTime}ms`);
      doc.text(`Total Checks: ${stats.totalChecks}`);
      doc.text(`Downtime Incidents: ${stats.downtimeCount}`);
      doc.text(`Current Status: ${site.currentStatus}`);

      // SSL Info
      if (sslCert) {
        doc.moveDown(2);
        doc.fontSize(16).font('Helvetica-Bold').text('SSL Certificate');
        doc.moveDown(0.5);
        doc.fontSize(12).font('Helvetica');
        doc.text(`Issuer: ${sslCert.issuer}`);
        doc.text(`Valid Until: ${sslCert.validTo ? new Date(sslCert.validTo).toLocaleDateString() : 'N/A'}`);
        doc.text(`Days Remaining: ${sslCert.daysRemaining}`);
        doc.text(`Protocol: ${sslCert.protocol || 'N/A'}`);
        doc.text(`Status: ${sslCert.isValid ? 'Valid' : 'Invalid'}`);
      }

      // Security Audit
      if (securityAudit) {
        doc.moveDown(2);
        doc.fontSize(16).font('Helvetica-Bold').text('Security Audit');
        doc.moveDown(0.5);
        doc.fontSize(12).font('Helvetica');
        doc.text(`Score: ${securityAudit.score}/100`);
        doc.text(`Checks Passed: ${securityAudit.passedChecks}/${securityAudit.totalChecks}`);
        doc.moveDown(0.5);
        for (const check of securityAudit.checks) {
          const icon = check.status === 'pass' ? '[PASS]' : check.status === 'fail' ? '[FAIL]' : '[WARN]';
          doc.text(`${icon} ${check.check}: ${check.message}`);
        }
      }

      doc.end();
    });
  }

  _calculateStats(checks) {
    if (!checks.length) {
      return { uptimePercent: 0, avgResponseTime: 0, totalChecks: 0, downtimeCount: 0 };
    }

    const upChecks = checks.filter((c) => c.status === 'up' || c.status === 'degraded').length;
    const uptimePercent = ((upChecks / checks.length) * 100).toFixed(2);
    const avgResponseTime = Math.round(
      checks.reduce((sum, c) => sum + (c.responseTime || 0), 0) / checks.length
    );
    const downtimeCount = checks.filter((c) => c.status === 'down').length;

    return { uptimePercent, avgResponseTime, totalChecks: checks.length, downtimeCount };
  }

  _getDateFromRange(range) {
    const now = new Date();
    const map = {
      '24h': 1,
      '7d': 7,
      '30d': 30,
      '90d': 90,
    };
    const days = map[range] || 30;
    return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  }
}

module.exports = new ReportService();
