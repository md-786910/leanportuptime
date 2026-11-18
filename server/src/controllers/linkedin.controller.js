const linkedinService = require('../services/linkedin.service');
const { resolvePeriodRange } = require('../utils/periodRange');

// Local-date YYYY-MM-DD (resolvePeriodRange returns local day bounds)
const ymd = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

exports.getMetrics = async (req, res, next) => {
  try {
    if (!linkedinService.isEnabled(req.params.id)) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_ENABLED', message: 'LinkedIn is not enabled for this project' },
      });
    }
    const { from, to } = resolvePeriodRange({ period: '28d', ...req.query });
    const data = await linkedinService.getMetrics(req.params.id, ymd(from), ymd(to));
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
