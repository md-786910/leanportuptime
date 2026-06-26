// Resolves a request's period / custom date range into concrete Date bounds for
// filtering on `createdAt`. Mirrors the period buckets used by the analytics
// controller (7d / 28d / 2m) but returns Date objects (inclusive end-of-day).

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * @param {object} query - express req.query
 * @returns {{ from: Date|null, to: Date|null, period: string }}
 *   from/to are null when no period/range is requested (caller treats as all-time).
 */
function resolvePeriodRange(query = {}) {
  const { startDate, endDate, period } = query;

  if (startDate && endDate) {
    return { from: startOfDay(startDate), to: endOfDay(endDate), period: 'custom' };
  }

  if (!period || period === 'all') {
    return { from: null, to: null, period: period || 'all' };
  }

  const to = endOfDay(new Date());
  const from = startOfDay(new Date());

  switch (period) {
    case '7d':
      from.setDate(from.getDate() - 6);
      break;
    case '2m':
      from.setDate(from.getDate() - 59);
      break;
    case '28d':
    default:
      from.setDate(from.getDate() - 27);
      break;
  }

  return { from, to, period };
}

module.exports = { resolvePeriodRange };
