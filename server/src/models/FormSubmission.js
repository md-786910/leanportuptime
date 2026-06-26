const mongoose = require('mongoose');

const formSubmissionSchema = new mongoose.Schema(
  {
    siteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Site',
      required: true,
    },
    // Raw inbound project_id, kept for audit even though it resolves to siteId.
    projectId: { type: String, index: true },

    firstName: { type: String, trim: true, default: '' },
    lastName: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, lowercase: true, default: '', index: true },
    telephone: { type: String, trim: true, default: '' },
    description: { type: String, trim: true, default: '' },
    websiteLink: { type: String, trim: true, default: '' },

    // Type of website/form. May be blank.
    websiteType: { type: String, trim: true, default: '', index: true },

    // Distinguishes test/demo submissions from real ones. The KPI card counts
    // `live` only so demo data never pollutes the headline number.
    submitFrom: {
      type: String,
      enum: ['demo', 'live'],
      default: 'live',
      index: true,
    },

    // Display timestamp — uses inbound `date` when provided, else now.
    submittedAt: { type: Date, default: Date.now },

    // Full raw payload so no extra WordPress field is ever lost.
    payload: { type: mongoose.Schema.Types.Mixed },
  },
  {
    timestamps: true,
  }
);

// Primary count/list path: per site, filtered by source, newest first.
// `submittedAt` is the canonical time for period filtering/sorting — it holds the
// real submission date for both live webhook posts (date provided) and imported
// historical rows, so filtering by it works for backfilled data too.
formSubmissionSchema.index({ siteId: 1, submitFrom: 1, submittedAt: -1 });
formSubmissionSchema.index({ siteId: 1, websiteType: 1, submittedAt: -1 });

module.exports = mongoose.model('FormSubmission', formSubmissionSchema);
