const PDFDocument = require("pdfkit");
const Check = require("../models/Check");
const Site = require("../models/Site");
const SSLCert = require("../models/SSLCert");
const SecurityAudit = require("../models/SecurityAudit");
const SeoAudit = require("../models/SeoAudit");
const seoService = require("./seo.service");
const logger = require("../utils/logger");

class ReportService {
  async generatePDF(siteId, dateRange = "30d") {
    const site = await Site.findById(siteId);
    if (!site) throw new Error("Site not found");

    const since = this._getDateFromRange(dateRange);

    const [checks, sslCert, securityAudit] = await Promise.all([
      Check.find({ siteId, timestamp: { $gte: since } })
        .sort({ timestamp: -1 })
        .lean(),
      SSLCert.findOne({ siteId }).sort({ checkedAt: -1 }).lean(),
      SecurityAudit.findOne({ siteId }).sort({ scannedAt: -1 }).lean(),
    ]);

    const stats = this._calculateStats(checks);

    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const buffers = [];

    doc.on("data", (chunk) => buffers.push(chunk));

    return new Promise((resolve, reject) => {
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", reject);

      // Cover Page
      doc
        .fontSize(28)
        .font("Helvetica-Bold")
        .text("WP Sentinel", { align: "center" });
      doc.moveDown(0.5);
      doc
        .fontSize(16)
        .font("Helvetica")
        .text("Monitoring Report", { align: "center" });
      doc.moveDown(2);
      doc.fontSize(12).text(`Site: ${site.name}`, { align: "center" });
      doc.text(`URL: ${site.url}`, { align: "center" });
      doc.text(`Report Period: ${dateRange}`, { align: "center" });
      doc.text(`Generated: ${new Date().toISOString()}`, { align: "center" });

      // Executive Summary
      doc.addPage();
      doc.fontSize(20).font("Helvetica-Bold").text("Executive Summary");
      doc.moveDown();
      doc.fontSize(12).font("Helvetica");
      doc.text(`Uptime: ${stats.uptimePercent}%`);
      doc.text(`Avg Response Time: ${stats.avgResponseTime}ms`);
      doc.text(`Total Checks: ${stats.totalChecks}`);
      doc.text(`Downtime Incidents: ${stats.downtimeCount}`);
      doc.text(`Current Status: ${site.currentStatus}`);

      // SSL Info
      if (sslCert) {
        doc.moveDown(2);
        doc.fontSize(16).font("Helvetica-Bold").text("SSL Certificate");
        doc.moveDown(0.5);
        doc.fontSize(12).font("Helvetica");
        doc.text(`Issuer: ${sslCert.issuer}`);
        doc.text(
          `Valid Until: ${sslCert.validTo ? new Date(sslCert.validTo).toLocaleDateString() : "N/A"}`,
        );
        doc.text(`Days Remaining: ${sslCert.daysRemaining}`);
        doc.text(`Protocol: ${sslCert.protocol || "N/A"}`);
        doc.text(`Status: ${sslCert.isValid ? "Valid" : "Invalid"}`);
      }

      // Security Audit
      if (securityAudit) {
        doc.moveDown(2);
        doc.fontSize(16).font("Helvetica-Bold").text("Security Audit");
        doc.moveDown(0.5);
        doc.fontSize(12).font("Helvetica");
        doc.text(`Score: ${securityAudit.score}/100`);
        doc.text(
          `Checks Passed: ${securityAudit.passedChecks}/${securityAudit.totalChecks}`,
        );
        doc.moveDown(0.5);
        for (const check of securityAudit.checks) {
          const icon =
            check.status === "pass"
              ? "[PASS]"
              : check.status === "fail"
                ? "[FAIL]"
                : "[WARN]";
          doc.text(`${icon} ${check.check}: ${check.message}`);
        }
      }

      doc.end();
    });
  }

  _calculateStats(checks) {
    if (!checks.length) {
      return {
        uptimePercent: 0,
        avgResponseTime: 0,
        totalChecks: 0,
        downtimeCount: 0,
      };
    }

    const upChecks = checks.filter(
      (c) => c.status === "up" || c.status === "degraded",
    ).length;
    const uptimePercent = ((upChecks / checks.length) * 100).toFixed(2);
    const avgResponseTime = Math.round(
      checks.reduce((sum, c) => sum + (c.responseTime || 0), 0) / checks.length,
    );
    const downtimeCount = checks.filter((c) => c.status === "down").length;

    return {
      uptimePercent,
      avgResponseTime,
      totalChecks: checks.length,
      downtimeCount,
    };
  }

  _getDateFromRange(range) {
    const now = new Date();
    const map = {
      "24h": 1,
      "7d": 7,
      "30d": 30,
      "90d": 90,
    };
    const days = map[range] || 30;
    return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  }

  // ==================== SEO PDF REPORT ====================

  async generateSEOPDF(siteId) {
    const site = await Site.findById(siteId);
    if (!site) throw new Error("Site not found");

    let audit = await SeoAudit.findOne({ siteId })
      .sort({ scannedAt: -1 })
      .lean();

    // No audit exists → run fresh SEO audit inline
    if (!audit) {
      logger.info(
        `SEO PDF: no audit found for ${site.name}, running inline audit`,
      );
      const result = await seoService.runAudit(site.url, null);
      const saved = await SeoAudit.create({
        siteId,
        ...result,
        scannedAt: new Date(),
      });
      audit = saved.toObject();
    }

    // Audit exists but no PageSpeed → fetch it inline
    if (
      !audit.pageSpeed ||
      (!audit.pageSpeed.mobile && !audit.pageSpeed.desktop)
    ) {
      try {
        logger.info(
          `SEO PDF: no PageSpeed data for ${site.name}, fetching inline`,
        );
        const pageSpeed = await seoService.fetchPageSpeed(site.url);
        if (pageSpeed) {
          const lhPerf =
            pageSpeed.mobile?.performance ?? pageSpeed.desktop?.performance;
          const updated = await SeoAudit.findByIdAndUpdate(
            audit._id,
            {
              $set: {
                pageSpeed,
                pageSpeedError: null,
                ...(lhPerf != null && { performanceScore: lhPerf }),
              },
            },
            { new: true },
          ).lean();
          if (updated) audit = updated;
        }
      } catch (err) {
        logger.warn(`PageSpeed fetch for report failed: ${err.message}`);
      }
    }

    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
      bufferPages: true,
      autoFirstPage: true,
    });
    const buffers = [];
    doc.on("data", (chunk) => buffers.push(chunk));

    // ── Design tokens ──
    const C = {
      primary: "#0F172A",
      accent: "#2563EB",
      accentDark: "#1E40AF",
      ok: "#16A34A",
      warn: "#D97706",
      bad: "#DC2626",
      muted: "#64748B",
      light: "#F1F5F9",
      white: "#FFFFFF",
      border: "#CBD5E1",
      rowAlt: "#F8FAFC",
      headerBg: "#E2E8F0",
      okBg: "#F0FDF4",
      warnBg: "#FFFBEB",
      badBg: "#FEF2F2",
    };
    const M = 50;
    const PW = 595.28;
    const CW = PW - M * 2;
    const CONTENT_TOP = 55;
    const MAX_Y = 768;

    const generatedAt = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const scanDate = audit.scannedAt
      ? new Date(audit.scannedAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "N/A";

    // ── Color helpers ──
    const sc = (s) => (s >= 80 ? C.ok : s >= 50 ? C.warn : C.bad);
    const scBg = (s) => (s >= 80 ? C.okBg : s >= 50 ? C.warnBg : C.badBg);
    const stC = (s) => (s === "pass" ? C.ok : s === "fail" ? C.bad : C.warn);
    const stI = (s) => (s === "pass" ? "PASS" : s === "fail" ? "FAIL" : "WARN");
    const sevColors = {
      critical: "#DC2626",
      high: "#EA580C",
      medium: "#D97706",
      low: "#64748B",
    };

    // ── Text helper: always lineBreak:false to prevent auto-paging ──
    const txt = (str, x, y, opts = {}) => {
      doc.text(String(str || ""), x, y, { lineBreak: false, ...opts });
    };

    // ── Width-aware text truncation ──
    const fitText = (str, maxW, sz, fnt = "Helvetica") => {
      if (!str) return "";
      doc.font(fnt).fontSize(sz);
      if (doc.widthOfString(str) <= maxW) return str;
      let s = str;
      while (s.length > 0 && doc.widthOfString(s + "...") > maxW)
        s = s.slice(0, -1);
      return s + "...";
    };

    // ── Page infrastructure ──
    const hdr = () => {
      doc.save();
      doc.fontSize(9).font("Helvetica-Bold").fillColor(C.accent);
      txt("BRIGHT GROUP", M, 18);
      doc.fontSize(8).font("Helvetica").fillColor(C.muted);
      txt(site.name, M, 19, { width: CW, align: "right" });
      doc
        .moveTo(M, 40)
        .lineTo(PW - M, 40)
        .lineWidth(0.75)
        .strokeColor(C.border)
        .stroke();
      doc.restore();
    };

    const ftr = (n) => {
      doc.save();
      doc
        .moveTo(M, 790)
        .lineTo(PW - M, 790)
        .lineWidth(0.5)
        .strokeColor(C.border)
        .stroke();
      doc.fontSize(7.5).font("Helvetica").fillColor(C.muted);
      txt(generatedAt, M, 796);
      txt(`Page ${n}`, M, 796, { width: CW, align: "center" });
      txt("Confidential", M, 796, { width: CW, align: "right" });
      doc.restore();
    };

    const newPage = () => {
      doc.addPage();
      hdr();
      doc.y = CONTENT_TOP;
    };
    const ensureSpace = (h) => {
      if (doc.y + h > MAX_Y) newPage();
    };

    // ── Visual components ──
    const bar = (x, y, w, score, h = 10) => {
      doc.save();
      doc
        .roundedRect(x, y, w, h, h / 2)
        .fillColor(C.light)
        .fill();
      const fw = Math.max(0, (score / 100) * w);
      if (fw > 0)
        doc
          .roundedRect(x, y, fw, h, h / 2)
          .fillColor(sc(score))
          .fill();
      doc.restore();
    };

    const badge = (label, x, y, color) => {
      doc.save();
      doc.roundedRect(x, y, 38, 15, 3).fillColor(color).fill();
      doc.fontSize(7.5).font("Helvetica-Bold").fillColor(C.white);
      txt(label, x, y + 3.5, { width: 38, align: "center" });
      doc.restore();
    };

    const sevBadge = (level, x, y) => {
      const lbl = (level || "low").toUpperCase();
      const col = sevColors[level] || sevColors.low;
      doc.save();
      doc.roundedRect(x, y, 50, 15, 3).fillColor(col).fill();
      doc.fontSize(7).font("Helvetica-Bold").fillColor(C.white);
      txt(lbl, x, y + 4, { width: 50, align: "center" });
      doc.restore();
    };

    const sectionTitle = (title) => {
      doc.save();
      doc.roundedRect(M, doc.y, CW, 30, 5).fillColor(C.primary).fill();
      doc.fontSize(15).font("Helvetica-Bold").fillColor(C.white);
      txt(title, M + 14, doc.y + 8);
      doc.restore();
      doc.y += 40;
    };

    const scoreBox = (x, y, w, label, score, passed, total) => {
      doc.save();
      // Card fill + border
      doc.roundedRect(x, y, w, 82, 6).fillColor(C.white).fill();
      doc
        .roundedRect(x, y, w, 82, 6)
        .lineWidth(0.75)
        .strokeColor(C.border)
        .stroke();
      // Left accent stripe
      doc
        .roundedRect(x, y + 4, 4, 74, 2)
        .fillColor(sc(score))
        .fill();
      // Label
      doc.fontSize(8.5).font("Helvetica").fillColor(C.muted);
      txt(label, x + 14, y + 10);
      // Score — dynamically positioned
      doc.fontSize(24).font("Helvetica-Bold").fillColor(sc(score));
      const ss = `${score}`;
      txt(ss, x + 14, y + 26);
      const sw = doc.widthOfString(ss);
      doc.fontSize(9).font("Helvetica").fillColor(C.muted);
      txt("/ 100", x + 14 + sw + 4, y + 35);
      // Progress bar
      bar(x + 14, y + 56, w - 28, score, 8);
      // Passed count
      doc.fontSize(7.5).font("Helvetica").fillColor(C.muted);
      txt(`${passed}/${total} passed`, x + 14, y + 68);
      doc.restore();
    };

    // ── Categorize checks ──
    const byCategory = {
      "meta-tags": [],
      content: [],
      links: [],
      performance: [],
    };
    for (const c of audit.checks || []) {
      if (byCategory[c.category]) byCategory[c.category].push(c);
    }
    const issues = (audit.checks || [])
      .filter((c) => c.status !== "pass")
      .sort((a, b) => {
        const o = { critical: 0, high: 1, medium: 2, low: 3 };
        return (o[a.severity] ?? 3) - (o[b.severity] ?? 3);
      });

    return new Promise((resolve, reject) => {
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", reject);

      // ═══════════════════════════════════════════
      // PAGE 1: COVER
      // ═══════════════════════════════════════════

      // Top accent band
      doc.save();
      doc.rect(0, 0, PW, 6).fillColor(C.accent).fill();
      doc.restore();

      // Brand
      doc.fontSize(38).font("Helvetica-Bold").fillColor(C.accent);
      txt("BRIGHT GROUP", M, 160, { width: CW, align: "center" });
      doc.fontSize(10).font("Helvetica").fillColor(C.muted);
      txt("https://www.bright-group.com", M, 205, {
        width: CW,
        align: "center",
      });

      // Divider
      doc.save();
      doc
        .roundedRect(PW / 2 - 60, 245, 120, 3, 1.5)
        .fillColor(C.accent)
        .fill();
      doc.restore();

      // Title
      doc.fontSize(26).font("Helvetica-Bold").fillColor(C.primary);
      txt("SEO Audit Report", M, 275, { width: CW, align: "center" });

      // Site info
      doc.fontSize(16).font("Helvetica").fillColor(C.primary);
      txt(site.name, M, 320, { width: CW, align: "center" });
      doc.fontSize(12).font("Helvetica").fillColor(C.accent);
      txt(site.url, M, 345, { width: CW, align: "center" });

      // Score circle
      const cx = PW / 2,
        cy = 430,
        cr = 50;
      doc.save();
      doc
        .circle(cx, cy, cr + 4)
        .lineWidth(5)
        .strokeColor(sc(audit.score || 0))
        .stroke();
      doc.circle(cx, cy, cr).fillColor("#FAFBFC").fill();
      // Dynamically center score text
      const scoreStr = `${audit.score || 0}`;
      doc
        .fontSize(36)
        .font("Helvetica-Bold")
        .fillColor(sc(audit.score || 0));
      const scoreW = doc.widthOfString(scoreStr);
      txt(scoreStr, cx - scoreW / 2, cy - 18);
      doc.fontSize(10).font("Helvetica").fillColor(C.muted);
      const subW = doc.widthOfString("/ 100");
      txt("/ 100", cx - subW / 2, cy + 18);
      doc.restore();

      doc.fontSize(11).font("Helvetica").fillColor(C.muted);
      txt("Overall SEO Score", M, cy + cr + 20, { width: CW, align: "center" });

      // Date info card
      doc.save();
      doc
        .roundedRect(PW / 2 - 130, 570, 260, 50, 6)
        .fillColor(C.light)
        .fill();
      doc.fontSize(9).font("Helvetica").fillColor(C.muted);
      txt(`Scan Date: ${scanDate}`, PW / 2 - 130, 582, {
        width: 260,
        align: "center",
      });
      txt(`Report Generated: ${generatedAt}`, PW / 2 - 130, 598, {
        width: 260,
        align: "center",
      });
      doc.restore();

      // Confidential
      doc.fontSize(8).font("Helvetica").fillColor(C.border);
      txt("CONFIDENTIAL", M, 720, { width: CW, align: "center" });

      // Bottom accent band
      doc.save();
      doc
        .rect(0, 841.89 - 6, PW, 6)
        .fillColor(C.accent)
        .fill();
      doc.restore();

      // ═══════════════════════════════════════════
      // PAGE 2: EXECUTIVE SUMMARY
      // ═══════════════════════════════════════════
      newPage();
      sectionTitle("Executive Summary");

      // Overall score bar
      doc.fontSize(11).font("Helvetica-Bold").fillColor(C.primary);
      txt("Overall SEO Score", M, doc.y);
      doc.y += 18;
      const barY2 = doc.y;
      bar(M, barY2, CW - 80, audit.score || 0, 14);
      doc
        .fontSize(13)
        .font("Helvetica-Bold")
        .fillColor(sc(audit.score || 0));
      txt(`${audit.score || 0} / 100`, M + CW - 70, barY2);
      doc.y = barY2 + 28;

      // 4 score boxes
      const gap = 12;
      const bw = (CW - gap * 3) / 4;
      const bY = doc.y;
      [
        { l: "Meta Tags", s: audit.metaTagsScore || 0, k: "meta-tags" },
        { l: "Content", s: audit.contentScore || 0, k: "content" },
        { l: "Links", s: audit.linksScore || 0, k: "links" },
        { l: "Performance", s: audit.performanceScore || 0, k: "performance" },
      ].forEach((c, i) => {
        const cc = byCategory[c.k] || [];
        scoreBox(
          M + i * (bw + gap),
          bY,
          bw,
          c.l,
          c.s,
          cc.filter((x) => x.status === "pass").length,
          cc.length,
        );
      });
      doc.y = bY + 96;

      // Stats card
      doc.save();
      doc.roundedRect(M, doc.y, CW, 44, 6).fillColor(C.light).fill();
      const statsY = doc.y + 6;
      const sw2 = CW / 4;
      [
        { l: "Total Checks", v: audit.totalChecks || 0, c: C.primary },
        { l: "Passed", v: audit.passedChecks || 0, c: C.ok },
        { l: "Failed", v: audit.failedChecks || 0, c: C.bad },
        { l: "Warnings", v: audit.warnChecks || 0, c: C.warn },
      ].forEach((s, i) => {
        const sx = M + i * sw2;
        doc.fontSize(14).font("Helvetica-Bold").fillColor(s.c);
        txt(`${s.v}`, sx, statsY, { width: sw2, align: "center" });
        doc.fontSize(8).font("Helvetica").fillColor(C.muted);
        txt(s.l, sx, statsY + 18, { width: sw2, align: "center" });
      });
      doc.restore();
      doc.y += 58;

      // Top critical issues
      if (issues.length > 0) {
        doc.fontSize(12).font("Helvetica-Bold").fillColor(C.primary);
        txt("Top Critical Issues", M, doc.y);
        doc.y += 22;

        for (const iss of issues.slice(0, 5)) {
          ensureSpace(36);
          const iy = doc.y;
          // Row background
          doc.save();
          doc
            .roundedRect(M, iy, CW, 30, 4)
            .fillColor(iss.status === "fail" ? C.badBg : C.warnBg)
            .fill();
          doc.restore();
          // Status badge
          badge(stI(iss.status), M + 8, iy + 8, stC(iss.status));
          // Check name
          doc.fontSize(9.5).font("Helvetica-Bold").fillColor(C.primary);
          txt(fitText(iss.check, 200, 9.5, "Helvetica-Bold"), M + 54, iy + 4);
          // Severity badge
          sevBadge(iss.severity, PW - M - 58, iy + 8);
          // Message
          doc.fontSize(8.5).font("Helvetica").fillColor(C.muted);
          txt(fitText(iss.message, CW - 64, 8.5), M + 54, iy + 18);
          doc.y = iy + 34;
        }
      }

      // ═══════════════════════════════════════════
      // PAGE 3: PAGESPEED INSIGHTS
      // ═══════════════════════════════════════════
      newPage();
      sectionTitle("PageSpeed Insights");

      const ps = audit.pageSpeed;
      if (ps && (ps.mobile || ps.desktop)) {
        // ── Lighthouse Scores ──
        doc.save();
        doc.roundedRect(M, doc.y, 4, 16, 2).fillColor(C.accent).fill();
        doc.restore();
        doc.fontSize(12).font("Helvetica-Bold").fillColor(C.accentDark);
        txt("Lighthouse Scores", M + 12, doc.y + 1);
        doc.y += 26;

        // Table header
        const lhColCat = M;
        const lhColMob = M + Math.round(CW * 0.5);
        const lhColDesk = M + Math.round(CW * 0.75);
        let ty = doc.y;
        doc.save();
        doc.roundedRect(M, ty, CW, 22, 4).fillColor(C.headerBg).fill();
        doc.fontSize(8).font("Helvetica-Bold").fillColor(C.muted);
        txt("CATEGORY", lhColCat + 12, ty + 6);
        txt("MOBILE", lhColMob, ty + 6, {
          width: Math.round(CW * 0.25),
          align: "center",
        });
        txt("DESKTOP", lhColDesk, ty + 6, {
          width: Math.round(CW * 0.25),
          align: "center",
        });
        doc.restore();
        doc.y = ty + 24;

        const lhRow = (label, mob, desk, idx) => {
          const y = doc.y;
          if (idx % 2 === 1) {
            doc.save();
            doc.rect(M, y, CW, 24).fillColor(C.rowAlt).fill();
            doc.restore();
          }
          doc.fontSize(10).font("Helvetica").fillColor(C.primary);
          txt(label, lhColCat + 12, y + 5);
          // Mobile score
          doc
            .fontSize(12)
            .font("Helvetica-Bold")
            .fillColor(mob != null ? sc(mob) : C.muted);
          txt(mob != null ? `${mob}` : "—", lhColMob, y + 4, {
            width: Math.round(CW * 0.25),
            align: "center",
          });
          // Desktop score
          doc
            .fontSize(12)
            .font("Helvetica-Bold")
            .fillColor(desk != null ? sc(desk) : C.muted);
          txt(desk != null ? `${desk}` : "—", lhColDesk, y + 4, {
            width: Math.round(CW * 0.25),
            align: "center",
          });
          doc.y = y + 24;
        };
        lhRow(
          "Performance",
          ps.mobile?.performance,
          ps.desktop?.performance,
          0,
        );
        lhRow(
          "Accessibility",
          ps.mobile?.accessibility,
          ps.desktop?.accessibility,
          1,
        );
        lhRow(
          "Best Practices",
          ps.mobile?.bestPractices,
          ps.desktop?.bestPractices,
          2,
        );
        lhRow("SEO", ps.mobile?.seo, ps.desktop?.seo, 3);

        // Bottom border
        doc
          .moveTo(M, doc.y)
          .lineTo(PW - M, doc.y)
          .lineWidth(0.5)
          .strokeColor(C.border)
          .stroke();
        doc.y += 24;

        // ── Core Web Vitals ──
        doc.save();
        doc.roundedRect(M, doc.y, 4, 16, 2).fillColor(C.accent).fill();
        doc.restore();
        doc.fontSize(12).font("Helvetica-Bold").fillColor(C.accentDark);
        txt("Core Web Vitals", M + 12, doc.y + 1);
        doc.y += 26;

        // CWV columns — proportional to full CW
        const cwvX = {
          metric: M,
          mob: M + Math.round(CW * 0.42),
          desk: M + Math.round(CW * 0.6),
          good: M + Math.round(CW * 0.78),
          poor: M + Math.round(CW * 0.89),
        };
        const cwvW = {
          mob: Math.round(CW * 0.18),
          desk: Math.round(CW * 0.18),
          good: Math.round(CW * 0.11),
          poor: Math.round(CW * 0.11),
        };

        ty = doc.y;
        doc.save();
        doc.roundedRect(M, ty, CW, 22, 4).fillColor(C.headerBg).fill();
        doc.fontSize(8).font("Helvetica-Bold").fillColor(C.muted);
        txt("METRIC", cwvX.metric + 12, ty + 6);
        txt("MOBILE", cwvX.mob, ty + 6, { width: cwvW.mob, align: "center" });
        txt("DESKTOP", cwvX.desk, ty + 6, {
          width: cwvW.desk,
          align: "center",
        });
        txt("GOOD", cwvX.good, ty + 6, { width: cwvW.good, align: "center" });
        txt("POOR", cwvX.poor, ty + 6, { width: cwvW.poor, align: "center" });
        doc.restore();
        doc.y = ty + 24;

        const cwvs = [
          {
            l: "First Contentful Paint (FCP)",
            k: "fcp",
            u: "ms",
            g: 1800,
            p: 3000,
          },
          {
            l: "Largest Contentful Paint (LCP)",
            k: "lcp",
            u: "ms",
            g: 2500,
            p: 4000,
          },
          { l: "Total Blocking Time (TBT)", k: "tbt", u: "ms", g: 200, p: 600 },
          {
            l: "Cumulative Layout Shift (CLS)",
            k: "cls",
            u: "",
            g: 0.1,
            p: 0.25,
          },
          { l: "Speed Index", k: "si", u: "ms", g: 3400, p: 5800 },
          {
            l: "Interaction to Next Paint (INP)",
            k: "inp",
            u: "ms",
            g: 200,
            p: 500,
          },
          {
            l: "Time to First Byte (TTFB)",
            k: "ttfb",
            u: "ms",
            g: 800,
            p: 1800,
          },
        ];
        const fmtVal = (v, m) => {
          if (v == null) return "—";
          if (m.k === "cls") return v.toFixed(3);
          if (m.u === "ms" && v >= 1000) return `${(v / 1000).toFixed(1)}s`;
          return `${v}${m.u}`;
        };
        const valColor = (v, m) =>
          v == null ? C.muted : v <= m.g ? C.ok : v <= m.p ? C.warn : C.bad;

        cwvs.forEach((m, idx) => {
          const y = doc.y;
          if (idx % 2 === 1) {
            doc.save();
            doc.rect(M, y, CW, 22).fillColor(C.rowAlt).fill();
            doc.restore();
          }
          const mv = ps.mobile?.[m.k],
            dv = ps.desktop?.[m.k];
          doc.fontSize(9).font("Helvetica").fillColor(C.primary);
          txt(m.l, cwvX.metric + 12, y + 5);
          doc.fontSize(9.5).font("Helvetica-Bold").fillColor(valColor(mv, m));
          txt(fmtVal(mv, m), cwvX.mob, y + 5, {
            width: cwvW.mob,
            align: "center",
          });
          doc.fontSize(9.5).font("Helvetica-Bold").fillColor(valColor(dv, m));
          txt(fmtVal(dv, m), cwvX.desk, y + 5, {
            width: cwvW.desk,
            align: "center",
          });
          doc.fontSize(8).font("Helvetica").fillColor(C.ok);
          txt(`\u2264${m.g}`, cwvX.good, y + 5, {
            width: cwvW.good,
            align: "center",
          });
          doc.fontSize(8).font("Helvetica").fillColor(C.bad);
          txt(`>${m.p}`, cwvX.poor, y + 5, {
            width: cwvW.poor,
            align: "center",
          });
          doc.y = y + 22;
        });
        doc
          .moveTo(M, doc.y)
          .lineTo(PW - M, doc.y)
          .lineWidth(0.5)
          .strokeColor(C.border)
          .stroke();
      } else {
        doc.save();
        doc.roundedRect(M, doc.y, CW, 50, 6).fillColor(C.light).fill();
        doc.fontSize(11).font("Helvetica").fillColor(C.muted);
        txt(
          "PageSpeed data not available. Run a new audit to fetch Lighthouse scores.",
          M,
          doc.y + 18,
          { width: CW, align: "center" },
        );
        doc.restore();
      }

      // ═══════════════════════════════════════════
      // PAGES 4-7: CATEGORY DETAILS
      // ═══════════════════════════════════════════
      const catPages = [
        { k: "meta-tags", t: "Meta Tags Analysis", s: audit.metaTagsScore },
        { k: "content", t: "Content Analysis", s: audit.contentScore },
        { k: "links", t: "Links Analysis", s: audit.linksScore },
        {
          k: "performance",
          t: "Performance Analysis",
          s: audit.performanceScore,
        },
      ];

      // Column layout for check tables
      const col = {
        status: { x: M, w: 44 },
        check: { x: M + 44, w: 139 },
        sev: { x: M + 183, w: 59 },
        msg: { x: M + 242, w: CW - 242 },
      };

      for (const cat of catPages) {
        newPage();
        sectionTitle(cat.t);

        // Category score row
        doc.fontSize(11).font("Helvetica-Bold").fillColor(C.primary);
        txt("Category Score", M, doc.y);
        doc.y += 18;
        const bry = doc.y;
        bar(M, bry, 250, cat.s || 0, 12);
        doc
          .fontSize(13)
          .font("Helvetica-Bold")
          .fillColor(sc(cat.s || 0));
        txt(`${cat.s || 0} / 100`, M + 262, bry - 1);
        const catChecks = byCategory[cat.k] || [];
        const catPassed = catChecks.filter((x) => x.status === "pass").length;
        doc.fontSize(9).font("Helvetica").fillColor(C.muted);
        txt(`${catPassed}/${catChecks.length} checks passed`, M + 330, bry + 1);
        doc.y = bry + 24;

        if (catChecks.length === 0) {
          doc.fontSize(10).font("Helvetica").fillColor(C.muted);
          txt("No checks in this category.", M, doc.y);
          continue;
        }

        // Table header
        ensureSpace(26);
        const thy = doc.y;
        doc.save();
        doc.roundedRect(M, thy, CW, 22, 4).fillColor(C.headerBg).fill();
        doc.fontSize(8).font("Helvetica-Bold").fillColor(C.muted);
        txt("STATUS", col.status.x + 4, thy + 6);
        txt("CHECK", col.check.x + 4, thy + 6);
        txt("SEVERITY", col.sev.x + 2, thy + 6);
        txt("MESSAGE", col.msg.x + 4, thy + 6);
        doc.restore();
        doc.y = thy + 24;

        let rowIdx = 0;
        for (const chk of catChecks) {
          const hasExtra = chk.status !== "pass" && (chk.impact || chk.fix);
          const rowH = hasExtra ? 52 : 22;
          ensureSpace(rowH);

          const y = doc.y;

          // Zebra row background
          if (rowIdx % 2 === 1) {
            doc.save();
            doc.rect(M, y, CW, rowH).fillColor(C.rowAlt).fill();
            doc.restore();
          }

          // Status badge
          badge(stI(chk.status), col.status.x + 3, y + 3, stC(chk.status));

          // Check name
          doc.fontSize(8.5).font("Helvetica-Bold").fillColor(C.primary);
          txt(
            fitText(chk.check, col.check.w - 8, 8.5, "Helvetica-Bold"),
            col.check.x + 4,
            y + 4,
          );

          // Severity badge
          sevBadge(chk.severity, col.sev.x + 2, y + 3);

          // Message
          doc.fontSize(8.5).font("Helvetica").fillColor(C.primary);
          txt(fitText(chk.message, col.msg.w - 8, 8.5), col.msg.x + 4, y + 4);

          doc.y = y + 20;

          // Impact / Fix sub-rows
          if (chk.status !== "pass" && chk.impact) {
            doc.fontSize(8).font("Helvetica-Bold").fillColor(C.warn);
            txt("Impact:", M + 52, doc.y);
            doc.fontSize(8).font("Helvetica").fillColor(C.primary);
            txt(fitText(chk.impact, CW - 100, 8), M + 94, doc.y);
            doc.y += 14;
          }
          if (chk.status !== "pass" && chk.fix) {
            doc.fontSize(8).font("Helvetica-Bold").fillColor(C.accent);
            txt("Fix:", M + 52, doc.y);
            doc.fontSize(8).font("Helvetica").fillColor(C.primary);
            txt(fitText(chk.fix, CW - 82, 8), M + 72, doc.y);
            doc.y += 14;
          }

          // Row separator
          doc
            .moveTo(M, doc.y)
            .lineTo(PW - M, doc.y)
            .lineWidth(0.3)
            .strokeColor(C.border)
            .stroke();
          doc.y += 2;
          rowIdx++;
        }
      }

      // ═══════════════════════════════════════════
      // PAGE 8: RECOMMENDATIONS
      // ═══════════════════════════════════════════
      newPage();
      sectionTitle("Recommendations");
      doc.fontSize(9).font("Helvetica").fillColor(C.muted);
      txt(
        "Prioritized by severity. Address critical and high-severity issues first.",
        M,
        doc.y,
      );
      doc.y += 20;

      if (issues.length === 0) {
        doc.save();
        doc
          .roundedRect(M, doc.y + 20, CW, 60, 8)
          .fillColor(C.okBg)
          .fill();
        doc
          .roundedRect(M, doc.y + 20, CW, 60, 8)
          .lineWidth(1)
          .strokeColor(C.ok)
          .stroke();
        doc.fontSize(16).font("Helvetica-Bold").fillColor(C.ok);
        txt("All checks passed!", M, doc.y + 40, {
          width: CW,
          align: "center",
        });
        doc.restore();
      } else {
        let num = 1;
        for (const iss of issues) {
          const hasImpact = !!iss.impact;
          const hasFix = !!iss.fix;
          const cardH = 32 + 16 + (hasImpact ? 14 : 0) + (hasFix ? 14 : 0) + 8;
          ensureSpace(cardH + 12);

          const y = doc.y;

          // Card background + border
          doc.save();
          doc.roundedRect(M, y, CW, cardH, 6).fillColor(C.white).fill();
          doc
            .roundedRect(M, y, CW, cardH, 6)
            .lineWidth(0.75)
            .strokeColor(C.border)
            .stroke();
          // Left accent stripe
          doc
            .roundedRect(M + 1, y + 4, 4, cardH - 8, 2)
            .fillColor(stC(iss.status))
            .fill();
          doc.restore();

          // Number circle
          doc.save();
          doc
            .circle(M + 24, y + 16, 11)
            .fillColor(stC(iss.status))
            .fill();
          doc.fontSize(9).font("Helvetica-Bold").fillColor(C.white);
          const numStr = `${num}`;
          const numW = doc.widthOfString(numStr);
          txt(numStr, M + 24 - numW / 2, y + 12);
          doc.restore();

          // Check name
          doc.fontSize(11).font("Helvetica-Bold").fillColor(C.primary);
          txt(
            fitText(iss.check, CW - 160, 11, "Helvetica-Bold"),
            M + 42,
            y + 9,
          );

          // Status + severity badges
          badge(stI(iss.status), PW - M - 98, y + 9, stC(iss.status));
          sevBadge(iss.severity, PW - M - 56, y + 9);

          // Message
          let cy2 = y + 32;
          doc.fontSize(9).font("Helvetica").fillColor(C.primary);
          txt(fitText(iss.message, CW - 30, 9), M + 16, cy2);
          cy2 += 16;

          // Impact
          if (hasImpact) {
            doc.fontSize(8).font("Helvetica-Bold").fillColor(C.warn);
            txt("Impact:", M + 16, cy2);
            doc.fontSize(8).font("Helvetica").fillColor(C.primary);
            txt(fitText(iss.impact, CW - 72, 8), M + 58, cy2);
            cy2 += 14;
          }

          // Fix
          if (hasFix) {
            doc.fontSize(8).font("Helvetica-Bold").fillColor(C.accent);
            txt("Fix:", M + 16, cy2);
            doc.fontSize(8).font("Helvetica").fillColor(C.primary);
            txt(fitText(iss.fix, CW - 54, 8), M + 38, cy2);
            cy2 += 14;
          }

          doc.y = y + cardH + 10;
          num++;
        }
      }

      // ── Footers on all pages (except cover) ──
      const tp = doc.bufferedPageRange().count;
      for (let i = 0; i < tp; i++) {
        doc.switchToPage(i);
        if (i > 0) ftr(i);
      }

      doc.end();
    });
  }
}

module.exports = new ReportService();
