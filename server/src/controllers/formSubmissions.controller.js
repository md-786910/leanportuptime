const crypto = require('crypto');
const Joi = require('joi');
const mongoose = require('mongoose');
const FormSubmission = require('../models/FormSubmission');
const Site = require('../models/Site');
const config = require('../config');
const { resolvePeriodRange } = require('../utils/periodRange');

// Inbound WordPress payload. Unknown keys are kept (stored in `payload`), so we
// validate with allowUnknown and never strip.
const webhookSchema = Joi.object({
  project_id: Joi.alternatives(Joi.string(), Joi.number()).required(),
  first_name: Joi.string().allow('').optional(),
  last_name: Joi.string().allow('').optional(),
  email: Joi.string().email({ tlds: false }).allow('').optional(),
  telephone: Joi.string().allow('').optional(),
  description: Joi.string().allow('').optional(),
  website_type: Joi.string().allow('').optional(),
  submit_from: Joi.string().valid('demo', 'live').default('live'),
  // Accept either spelling for the website link.
  'website link': Joi.string().allow('').optional(),
  website_link: Joi.string().allow('').optional(),
  date: Joi.date().optional(),
}).unknown(true);

// Escape user input before using it inside a regex.
function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Constant-time secret comparison that doesn't leak length via timingSafeEqual
// throwing on unequal buffer lengths.
function secretMatches(provided, expected) {
  if (!expected) return false; // fail closed when no secret configured
  const a = Buffer.from(String(provided || ''));
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    // Run a dummy compare so timing doesn't reveal the length mismatch.
    crypto.timingSafeEqual(b, b);
    return false;
  }
  return crypto.timingSafeEqual(a, b);
}

const unauthorized = (res) =>
  res.status(401).json({
    success: false,
    error: { code: 'UNAUTHORIZED', message: 'Invalid or missing webhook secret' },
  });

// POST /api/form-submissions/webhook  (PUBLIC — secured by shared secret)
exports.createFromWebhook = async (req, res, next) => {
  try {
    const provided = req.headers[config.formWebhook.headerName];
    if (!provided || !secretMatches(provided, config.formWebhook.secret)) {
      return unauthorized(res);
    }

    const { error, value } = webhookSchema.validate(req.body, {
      abortEarly: false,
      allowUnknown: true,
      stripUnknown: false,
    });
    if (error) {
      const details = error.details.map((d) => ({
        field: d.path.join('.'),
        message: d.message,
      }));
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid request data', details },
      });
    }

    const projectId = String(value.project_id);

    // Allowlist gate (checked before any DB lookup so we never reveal whether a
    // non-enabled project id exists). Empty list => no project enabled.
    if (!config.formWebhook.projectIds.includes(projectId)) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Form submissions are not enabled for this project' },
      });
    }

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(404).json({
        success: false,
        error: { code: 'SITE_NOT_FOUND', message: 'No project found for the provided project_id' },
      });
    }

    const site = await Site.findById(projectId).select('_id').lean();
    if (!site) {
      return res.status(404).json({
        success: false,
        error: { code: 'SITE_NOT_FOUND', message: 'No project found for the provided project_id' },
      });
    }

    const submittedAt = value.date ? new Date(value.date) : new Date();
    // Bulk imports (parseFormExcel.js tags rows with imported:true) carry a
    // historical date — backdate createdAt/updatedAt to it so every time field
    // reflects the real submission. Live site posts keep auto timestamps (now).
    const isImport = req.body.imported === true || req.body.imported === 'true';

    const doc = new FormSubmission({
      siteId: site._id,
      projectId,
      firstName: value.first_name || '',
      lastName: value.last_name || '',
      email: value.email || '',
      telephone: value.telephone || '',
      description: value.description || '',
      websiteLink: value.website_link || value['website link'] || '',
      websiteType: value.website_type || '',
      submitFrom: value.submit_from || 'live',
      submittedAt,
      payload: req.body,
    });

    if (isImport) {
      doc.createdAt = submittedAt;
      doc.updatedAt = submittedAt;
    }
    // `timestamps: false` on this save preserves the manual createdAt/updatedAt
    // for imports; live posts (no override) get auto now timestamps.
    const submission = await doc.save(isImport ? { timestamps: false } : undefined);

    // Minimal response — never echo internal data to an unauthenticated caller.
    res.status(201).json({ success: true, data: { id: submission._id, received: true } });
  } catch (err) {
    next(err);
  }
};

// GET /api/sites/:id/form-submissions  (AUTHED)
exports.list = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);

    const filter = { siteId: req.site._id };
    const { submitFrom, websiteType, email, search } = req.query;
    if (submitFrom === 'demo' || submitFrom === 'live') filter.submitFrom = submitFrom;
    if (websiteType) filter.websiteType = websiteType;
    if (email) filter.email = email.toLowerCase();
    if (search) {
      const rx = new RegExp(escapeRegex(search), 'i');
      filter.$or = [
        { firstName: rx },
        { lastName: rx },
        { email: rx },
        { telephone: rx },
        { description: rx },
      ];
    }

    const { from, to } = resolvePeriodRange(req.query);
    if (from || to) {
      filter.submittedAt = {};
      if (from) filter.submittedAt.$gte = from;
      if (to) filter.submittedAt.$lte = to;
    }

    const [rows, total] = await Promise.all([
      FormSubmission.find(filter)
        .sort({ submittedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      FormSubmission.countDocuments(filter),
    ]);

    res.json({ success: true, data: rows, meta: { page, limit, total } });
  } catch (err) {
    next(err);
  }
};

// GET /api/sites/:id/form-submissions/count  (AUTHED) — KPI feed
exports.count = async (req, res, next) => {
  try {
    const filter = { siteId: req.site._id };
    // Default to live so demo submissions never inflate the headline number.
    const submitFrom = req.query.submitFrom === 'all' ? null : req.query.submitFrom || 'live';
    if (submitFrom) filter.submitFrom = submitFrom;
    if (req.query.websiteType) filter.websiteType = req.query.websiteType;

    const { from, to, period } = resolvePeriodRange(req.query);
    if (from || to) {
      filter.submittedAt = {};
      if (from) filter.submittedAt.$gte = from;
      if (to) filter.submittedAt.$lte = to;
    }

    const count = await FormSubmission.countDocuments(filter);
    res.json({ success: true, data: { count }, meta: { period, from, to, submitFrom } });
  } catch (err) {
    next(err);
  }
};
