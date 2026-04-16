const reportService = require('../services/report.service');

exports.generatePDF = async (req, res, next) => {
  try {
    const site = req.site;
    const { range = '30d' } = req.query;
    const pdfBuffer = await reportService.generatePDF(site._id, range);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="wp-sentinel-${site.name}-${range}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

exports.generateSEOPDF = async (req, res, next) => {
  try {
    const site = req.site;
    const pdfBuffer = await reportService.generateSEOPDF(site._id);
    const safeName = site.name.replace(/[^a-zA-Z0-9-_]/g, '_');

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="leanport-seo-report-${safeName}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};
