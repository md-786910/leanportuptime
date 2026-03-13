const Site = require('../models/Site');
const reportService = require('../services/report.service');

exports.generatePDF = async (req, res, next) => {
  try {
    const site = await Site.findOne({ _id: req.params.id, userId: req.user._id });
    if (!site) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Site not found' },
      });
    }

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
