const PDFDocument = require('pdfkit');
const Check = require('../models/Check');
const Site = require('../models/Site');
const SSLCert = require('../models/SSLCert');
const SecurityAudit = require('../models/SecurityAudit');
const SeoAudit = require('../models/SeoAudit');
const seoService = require('./seo.service');
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

  // ==================== SEO PDF REPORT ====================

  async generateSEOPDF(siteId) {
    const site = await Site.findById(siteId);
    if (!site) throw new Error('Site not found');

    let audit = await SeoAudit.findOne({ siteId }).sort({ scannedAt: -1 }).lean();

    // No audit exists → run fresh SEO audit inline
    if (!audit) {
      logger.info(`SEO PDF: no audit found for ${site.name}, running inline audit`);
      const result = await seoService.runAudit(site.url, null);
      const saved = await SeoAudit.create({ siteId, ...result, scannedAt: new Date() });
      audit = saved.toObject();
    }

    // Audit exists but no PageSpeed → fetch it inline
    if (!audit.pageSpeed || (!audit.pageSpeed.mobile && !audit.pageSpeed.desktop)) {
      try {
        logger.info(`SEO PDF: no PageSpeed data for ${site.name}, fetching inline`);
        const pageSpeed = await seoService.fetchPageSpeed(site.url);
        if (pageSpeed) {
          const lhPerf = pageSpeed.mobile?.performance ?? pageSpeed.desktop?.performance;
          const updated = await SeoAudit.findByIdAndUpdate(
            audit._id,
            { $set: { pageSpeed, pageSpeedError: null, ...(lhPerf != null && { performanceScore: lhPerf }) } },
            { new: true }
          ).lean();
          if (updated) audit = updated;
        }
      } catch (err) {
        logger.warn(`PageSpeed fetch for report failed: ${err.message}`);
      }
    }

    const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true, autoFirstPage: true });
    const buffers = [];
    doc.on('data', (chunk) => buffers.push(chunk));

    const C = { primary: '#0F172A', accent: '#2563EB', ok: '#16A34A', warn: '#D97706', bad: '#DC2626', muted: '#64748B', light: '#F1F5F9', white: '#FFFFFF', border: '#CBD5E1' };
    const M = 50;
    const PW = 595.28;
    const CW = PW - M * 2;
    const MAX_Y = 775;

    const generatedAt = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const scanDate = audit.scannedAt ? new Date(audit.scannedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A';

    const sc = (s) => (s >= 80 ? C.ok : s >= 50 ? C.warn : C.bad);
    const stC = (s) => (s === 'pass' ? C.ok : s === 'fail' ? C.bad : C.warn);
    const stI = (s) => (s === 'pass' ? 'PASS' : s === 'fail' ? 'FAIL' : 'WARN');
    const sev = (s) => (s || 'low').toUpperCase();
    const cut = (s, n = 120) => { if (!s) return ''; return s.length > n ? s.slice(0, n) + '...' : s; };

    // All text uses lineBreak:false for positioned calls to prevent auto-paging
    const txt = (str, x, y, opts = {}) => {
      doc.text(str || '', x, y, { lineBreak: false, ...opts });
    };

    // Flowing text — uses lineBreak but we pre-measure and ensureSpace
    const flow = (str, x, w) => {
      const s = cut(str, 180);
      const h = doc.heightOfString(s, { width: w });
      if (doc.y + h > MAX_Y) { newPage(); }
      doc.text(s, x, doc.y, { width: w });
    };

    const hdr = () => {
      doc.save();
      doc.fontSize(8).font('Helvetica-Bold').fillColor(C.accent);
      txt('LEANPORT', M, 20);
      doc.fontSize(7).font('Helvetica').fillColor(C.muted);
      txt(site.name, M, 20, { width: CW, align: 'right' });
      doc.moveTo(M, 35).lineTo(PW - M, 35).lineWidth(0.5).strokeColor(C.border).stroke();
      doc.restore();
    };

    const ftr = (n) => {
      doc.save();
      doc.moveTo(M, 800).lineTo(PW - M, 800).lineWidth(0.5).strokeColor(C.border).stroke();
      doc.fontSize(7).font('Helvetica').fillColor(C.muted);
      txt(generatedAt, M, 805);
      txt(`Page ${n}`, M, 805, { width: CW, align: 'center' });
      txt('Confidential', M, 805, { width: CW, align: 'right' });
      doc.restore();
    };

    const newPage = () => { doc.addPage(); hdr(); doc.y = 50; };

    const ensureSpace = (h) => { if (doc.y + h > MAX_Y) newPage(); };

    const bar = (x, y, w, score, h = 8) => {
      doc.save();
      doc.roundedRect(x, y, w, h, 4).fillColor(C.light).fill();
      const fw = Math.max(0, (score / 100) * w);
      if (fw > 0) doc.roundedRect(x, y, fw, h, 4).fillColor(sc(score)).fill();
      doc.restore();
    };

    const scoreBox = (x, y, w, label, score, passed, total) => {
      doc.save();
      doc.roundedRect(x, y, w, 70, 6).lineWidth(1).strokeColor(C.border).stroke();
      doc.fontSize(9).font('Helvetica').fillColor(C.muted); txt(label, x + 10, y + 8);
      doc.fontSize(22).font('Helvetica-Bold').fillColor(sc(score)); txt(`${score}`, x + 10, y + 22);
      doc.fontSize(9).font('Helvetica').fillColor(C.muted); txt(`/ 100`, x + 45, y + 30);
      bar(x + 10, y + 50, w - 20, score);
      doc.fontSize(7).font('Helvetica').fillColor(C.muted); txt(`${passed}/${total} passed`, x + 10, y + 60);
      doc.restore();
    };

    // ── Categorize checks ──
    const byCategory = { 'meta-tags': [], content: [], links: [], performance: [] };
    for (const c of audit.checks || []) { if (byCategory[c.category]) byCategory[c.category].push(c); }
    const issues = (audit.checks || []).filter((c) => c.status !== 'pass').sort((a, b) => {
      const o = { critical: 0, high: 1, medium: 2, low: 3 };
      return (o[a.severity] ?? 3) - (o[b.severity] ?? 3);
    });

    return new Promise((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // ═══ PAGE 1: COVER ═══
      doc.moveDown(6);
      doc.fontSize(36).font('Helvetica-Bold').fillColor(C.accent).text('LEANPORT', { align: 'center' });
      doc.moveDown(0.3);
      doc.fontSize(10).font('Helvetica').fillColor(C.muted).text('www.leanport.com', { align: 'center' });
      doc.moveDown(3);
      doc.moveTo(PW / 2 - 80, doc.y).lineTo(PW / 2 + 80, doc.y).lineWidth(2).strokeColor(C.accent).stroke();
      doc.moveDown(1.5);
      doc.fontSize(24).font('Helvetica-Bold').fillColor(C.primary).text('SEO Audit Report', { align: 'center' });
      doc.moveDown(2);
      doc.fontSize(14).font('Helvetica').fillColor(C.primary).text(site.name, { align: 'center' });
      doc.moveDown(0.3);
      doc.fontSize(11).fillColor(C.accent).text(site.url, { align: 'center' });
      doc.moveDown(3);

      // Score circle
      const cx = PW / 2, cy = doc.y + 50, r = 45;
      doc.save();
      doc.circle(cx, cy, r + 3).lineWidth(4).strokeColor(sc(audit.score || 0)).stroke();
      doc.circle(cx, cy, r).fillColor(C.white).fill();
      doc.fontSize(32).font('Helvetica-Bold').fillColor(sc(audit.score || 0));
      txt(`${audit.score || 0}`, cx - 30, cy - 18, { width: 60, align: 'center' });
      doc.fontSize(9).font('Helvetica').fillColor(C.muted);
      txt('/ 100', cx - 25, cy + 16, { width: 50, align: 'center' });
      doc.restore();
      doc.y = cy + r + 20;
      doc.fontSize(10).font('Helvetica').fillColor(C.muted).text('Overall SEO Score', { align: 'center' });
      doc.moveDown(3);
      doc.fontSize(9).fillColor(C.muted).text(`Scan Date: ${scanDate}`, { align: 'center' });
      doc.moveDown(0.3);
      doc.text(`Report Generated: ${generatedAt}`, { align: 'center' });
      doc.moveDown(3);
      doc.fontSize(8).fillColor(C.border).text('CONFIDENTIAL', { align: 'center' });

      // ═══ PAGE 2: EXECUTIVE SUMMARY ═══
      newPage();
      doc.fontSize(18).font('Helvetica-Bold').fillColor(C.primary).text('Executive Summary');
      doc.moveDown(0.5);
      doc.fontSize(11).font('Helvetica').fillColor(C.primary).text('Overall SEO Score');
      doc.moveDown(0.3);
      const barY = doc.y;
      bar(M, barY, CW, audit.score || 0, 12);
      doc.y = barY + 16;
      doc.fontSize(11).font('Helvetica-Bold').fillColor(sc(audit.score || 0)).text(`${audit.score || 0} / 100`);
      doc.moveDown(1.5);

      // 4 score boxes
      const bw = (CW - 30) / 4;
      const bY = doc.y;
      [
        { l: 'Meta Tags', s: audit.metaTagsScore || 0, k: 'meta-tags' },
        { l: 'Content', s: audit.contentScore || 0, k: 'content' },
        { l: 'Links', s: audit.linksScore || 0, k: 'links' },
        { l: 'Performance', s: audit.performanceScore || 0, k: 'performance' },
      ].forEach((c, i) => {
        const cc = byCategory[c.k] || [];
        scoreBox(M + i * (bw + 10), bY, bw, c.l, c.s, cc.filter((x) => x.status === 'pass').length, cc.length);
      });
      doc.y = bY + 85;

      doc.fontSize(11).font('Helvetica-Bold').fillColor(C.primary).text('Audit Statistics');
      doc.moveDown(0.3);
      doc.fontSize(10).font('Helvetica').fillColor(C.primary);
      doc.text(`Total: ${audit.totalChecks || 0}    Passed: ${audit.passedChecks || 0}    Failed: ${audit.failedChecks || 0}    Warnings: ${audit.warnChecks || 0}`);
      doc.moveDown(1.5);

      if (issues.length > 0) {
        doc.fontSize(11).font('Helvetica-Bold').fillColor(C.bad).text('Top Critical Issues');
        doc.moveDown(0.5);
        for (const iss of issues.slice(0, 5)) {
          doc.fontSize(9).font('Helvetica-Bold').fillColor(stC(iss.status));
          doc.text(`[${stI(iss.status)}] ${iss.check} — ${sev(iss.severity)}`);
          doc.fontSize(8).font('Helvetica').fillColor(C.primary);
          doc.text(cut(iss.message, 100));
          doc.moveDown(0.3);
        }
      }

      // ═══ PAGE 3: PAGESPEED ═══
      newPage();
      doc.fontSize(18).font('Helvetica-Bold').fillColor(C.primary).text('PageSpeed Insights');
      doc.moveDown(0.5);

      const ps = audit.pageSpeed;
      if (ps && (ps.mobile || ps.desktop)) {
        doc.fontSize(12).font('Helvetica-Bold').fillColor(C.accent).text('Lighthouse Scores');
        doc.moveDown(0.5);
        let ty = doc.y;
        doc.fontSize(8).font('Helvetica-Bold').fillColor(C.muted);
        txt('CATEGORY', M, ty); txt('MOBILE', M + 160, ty, { width: 50, align: 'center' }); txt('DESKTOP', M + 300, ty, { width: 50, align: 'center' });
        doc.y = ty + 14;
        doc.moveTo(M, doc.y).lineTo(M + 380, doc.y).lineWidth(0.5).strokeColor(C.border).stroke();
        doc.y += 6;

        const lhRow = (label, mob, desk) => {
          const y = doc.y;
          doc.fontSize(9).font('Helvetica').fillColor(C.primary); txt(label, M, y);
          doc.fontSize(10).font('Helvetica-Bold').fillColor(mob != null ? sc(mob) : C.muted); txt(mob != null ? `${mob}` : '—', M + 160, y, { width: 50, align: 'center' });
          doc.fontSize(10).font('Helvetica-Bold').fillColor(desk != null ? sc(desk) : C.muted); txt(desk != null ? `${desk}` : '—', M + 300, y, { width: 50, align: 'center' });
          doc.y = y + 18;
        };
        lhRow('Performance', ps.mobile?.performance, ps.desktop?.performance);
        lhRow('Accessibility', ps.mobile?.accessibility, ps.desktop?.accessibility);
        lhRow('Best Practices', ps.mobile?.bestPractices, ps.desktop?.bestPractices);
        lhRow('SEO', ps.mobile?.seo, ps.desktop?.seo);
        doc.moveDown(2);

        doc.fontSize(12).font('Helvetica-Bold').fillColor(C.accent).text('Core Web Vitals');
        doc.moveDown(0.5);
        ty = doc.y;
        doc.fontSize(8).font('Helvetica-Bold').fillColor(C.muted);
        txt('METRIC', M, ty); txt('MOBILE', M + 220, ty, { width: 60, align: 'center' }); txt('DESKTOP', M + 300, ty, { width: 60, align: 'center' }); txt('GOOD', M + 380, ty, { width: 40, align: 'center' }); txt('POOR', M + 430, ty, { width: 40, align: 'center' });
        doc.y = ty + 14;
        doc.moveTo(M, doc.y).lineTo(M + 470, doc.y).lineWidth(0.5).strokeColor(C.border).stroke();
        doc.y += 6;

        const cwvs = [
          { l: 'First Contentful Paint (FCP)', k: 'fcp', u: 'ms', g: 1800, p: 3000 },
          { l: 'Largest Contentful Paint (LCP)', k: 'lcp', u: 'ms', g: 2500, p: 4000 },
          { l: 'Total Blocking Time (TBT)', k: 'tbt', u: 'ms', g: 200, p: 600 },
          { l: 'Cumulative Layout Shift (CLS)', k: 'cls', u: '', g: 0.1, p: 0.25 },
          { l: 'Speed Index', k: 'si', u: 'ms', g: 3400, p: 5800 },
          { l: 'Interaction to Next Paint (INP)', k: 'inp', u: 'ms', g: 200, p: 500 },
          { l: 'Time to First Byte (TTFB)', k: 'ttfb', u: 'ms', g: 800, p: 1800 },
        ];
        for (const m of cwvs) {
          const y = doc.y;
          const mv = ps.mobile?.[m.k], dv = ps.desktop?.[m.k];
          const fmt = (v) => { if (v == null) return '—'; if (m.k === 'cls') return v.toFixed(3); if (m.u === 'ms' && v >= 1000) return `${(v / 1000).toFixed(1)}s`; return `${v}${m.u}`; };
          const mc = (v) => (v == null ? C.muted : v <= m.g ? C.ok : v <= m.p ? C.warn : C.bad);
          doc.fontSize(9).font('Helvetica').fillColor(C.primary); txt(m.l, M, y);
          doc.fontSize(9).font('Helvetica-Bold').fillColor(mc(mv)); txt(fmt(mv), M + 220, y, { width: 60, align: 'center' });
          doc.fontSize(9).font('Helvetica-Bold').fillColor(mc(dv)); txt(fmt(dv), M + 300, y, { width: 60, align: 'center' });
          doc.fontSize(8).font('Helvetica').fillColor(C.ok); txt(`≤${m.g}`, M + 380, y, { width: 40, align: 'center' });
          doc.fontSize(8).font('Helvetica').fillColor(C.bad); txt(`>${m.p}`, M + 430, y, { width: 40, align: 'center' });
          doc.y = y + 18;
        }
      } else {
        doc.fontSize(11).font('Helvetica').fillColor(C.muted).text('PageSpeed data not available.');
      }

      // ═══ PAGES 4-7: CATEGORY DETAILS ═══
      const catPages = [
        { k: 'meta-tags', t: 'Meta Tags Analysis', s: audit.metaTagsScore },
        { k: 'content', t: 'Content Analysis', s: audit.contentScore },
        { k: 'links', t: 'Links Analysis', s: audit.linksScore },
        { k: 'performance', t: 'Performance Analysis', s: audit.performanceScore },
      ];

      for (const cat of catPages) {
        newPage();
        doc.fontSize(18).font('Helvetica-Bold').fillColor(C.primary).text(cat.t);
        doc.moveDown(0.3);
        doc.fontSize(11).font('Helvetica').fillColor(C.primary).text('Category Score');
        const bry = doc.y + 2;
        bar(M, bry, 200, cat.s || 0, 10);
        doc.fontSize(11).font('Helvetica-Bold').fillColor(sc(cat.s || 0));
        txt(`${cat.s || 0} / 100`, M + 210, bry);
        doc.y = bry + 20;

        const checks = byCategory[cat.k] || [];
        if (checks.length === 0) { doc.fontSize(10).font('Helvetica').fillColor(C.muted).text('No checks.'); continue; }

        // Table header
        ensureSpace(22);
        const thy = doc.y;
        doc.roundedRect(M, thy, CW, 16, 3).fillColor(C.light).fill();
        doc.fontSize(7).font('Helvetica-Bold').fillColor(C.muted);
        txt('STATUS', M + 6, thy + 4); txt('CHECK', M + 55, thy + 4); txt('SEVERITY', M + 240, thy + 4); txt('MESSAGE', M + 310, thy + 4);
        doc.y = thy + 20;

        for (const chk of checks) {
          // Each check: 1 line for main row + optional impact/fix lines
          const hasExtra = chk.status !== 'pass' && (chk.impact || chk.fix);
          const rowH = hasExtra ? 50 : 16;
          ensureSpace(rowH);

          const y = doc.y;
          doc.fontSize(7).font('Helvetica-Bold').fillColor(stC(chk.status)); txt(stI(chk.status), M + 6, y);
          doc.fontSize(8).font('Helvetica-Bold').fillColor(C.primary); txt(cut(chk.check, 35), M + 55, y);
          doc.fontSize(7).font('Helvetica').fillColor(C.muted); txt(sev(chk.severity), M + 240, y);
          doc.fontSize(7).font('Helvetica').fillColor(C.primary); txt(cut(chk.message, 60), M + 310, y);
          doc.y = y + 14;

          if (chk.status !== 'pass' && chk.impact) {
            doc.fontSize(7).font('Helvetica-Bold').fillColor(C.warn); txt('Impact:', M + 55, doc.y);
            doc.fontSize(7).font('Helvetica').fillColor(C.primary); txt(cut(chk.impact, 90), M + 95, doc.y);
            doc.y += 11;
          }
          if (chk.status !== 'pass' && chk.fix) {
            doc.fontSize(7).font('Helvetica-Bold').fillColor(C.ok); txt('Fix:', M + 55, doc.y);
            doc.fontSize(7).font('Helvetica').fillColor(C.primary); txt(cut(chk.fix, 90), M + 80, doc.y);
            doc.y += 11;
          }

          doc.y += 2;
          doc.moveTo(M, doc.y).lineTo(PW - M, doc.y).lineWidth(0.3).strokeColor(C.light).stroke();
          doc.y += 3;
        }
      }

      // ═══ PAGE 8: RECOMMENDATIONS ═══
      newPage();
      doc.fontSize(18).font('Helvetica-Bold').fillColor(C.primary).text('Recommendations');
      doc.moveDown(0.3);
      doc.fontSize(10).font('Helvetica').fillColor(C.muted).text('Prioritized by severity.');
      doc.moveDown(1);

      if (issues.length === 0) {
        doc.fontSize(12).font('Helvetica').fillColor(C.ok).text('All checks passed!');
      } else {
        let num = 1;
        for (const iss of issues) {
          ensureSpace(55);

          const y = doc.y;
          doc.roundedRect(M, y, 20, 16, 3).fillColor(stC(iss.status)).fill();
          doc.fontSize(8).font('Helvetica-Bold').fillColor(C.white); txt(`${num}`, M + 2, y + 3, { width: 16, align: 'center' });

          doc.fontSize(10).font('Helvetica-Bold').fillColor(C.primary); txt(iss.check, M + 28, y);
          doc.fontSize(7).font('Helvetica-Bold').fillColor(stC(iss.status)); txt(`${stI(iss.status)} · ${sev(iss.severity)}`, PW - M - 80, y + 2, { width: 80, align: 'right' });
          doc.y = y + 18;

          doc.fontSize(8).font('Helvetica').fillColor(C.primary); txt(cut(iss.message, 110), M + 28, doc.y);
          doc.y += 12;

          if (iss.impact) {
            doc.fontSize(7).font('Helvetica-Bold').fillColor(C.warn); txt('Impact:', M + 28, doc.y);
            doc.fontSize(7).font('Helvetica').fillColor(C.primary); txt(cut(iss.impact, 100), M + 68, doc.y);
            doc.y += 11;
          }
          if (iss.fix) {
            doc.fontSize(7).font('Helvetica-Bold').fillColor(C.accent); txt('Fix:', M + 28, doc.y);
            doc.fontSize(7).font('Helvetica').fillColor(C.primary); txt(cut(iss.fix, 100), M + 50, doc.y);
            doc.y += 11;
          }

          doc.y += 3;
          doc.moveTo(M, doc.y).lineTo(PW - M, doc.y).lineWidth(0.3).strokeColor(C.border).stroke();
          doc.y += 6;
          num++;
        }
      }

      // ── Footers ──
      const tp = doc.bufferedPageRange().count;
      for (let i = 0; i < tp; i++) { doc.switchToPage(i); if (i > 0) ftr(i); }

      doc.end();
    });
  }
}

module.exports = new ReportService();
