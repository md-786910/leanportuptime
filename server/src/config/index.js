const dotenv = require("dotenv");
dotenv.config({ override: true });

function parseProbes(raw) {
  return (raw || "")
    .split(",")
    .filter(Boolean)
    .map((entry) => {
      const [name, url] = entry.split("|");
      return { name: name.trim(), url: url.trim() };
    });
}

function parseTrustProxy(raw) {
  const value = (raw || "loopback, linklocal, uniquelocal").trim();

  if (value === "true") return true;
  if (value === "false") return false;
  if (/^\d+$/.test(value)) return parseInt(value, 10);

  return value;
}

module.exports = {
  env: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT, 10) || 5000,
  trustProxy: parseTrustProxy(process.env.TRUST_PROXY),
  mongoUri: process.env.MONGODB_URI || "mongodb://localhost:27017/sitelyze",
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
  jwt: {
    secret: process.env.JWT_SECRET || "dev-jwt-secret",
    refreshSecret: process.env.JWT_REFRESH_SECRET || "dev-refresh-secret",
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || "15m",
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || "7d",
  },
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM || "noreply@sitelyze.com",
  },
  sslEmailListToSend: (process.env.SSL_EMAIL_LIST_TO_SEND || "")
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean),
  clientUrl: process.env.CLIENT_URL || "http://localhost:3000",
  invitationExpiryMinutes: parseInt(process.env.INVITATION_EXPIRY_MINUTES, 10) || 24 * 60,
  probes: parseProbes(process.env.PROBE_URLS),
  probeSecret: process.env.PROBE_SECRET || "",
  formWebhook: {
    secret: process.env.FORM_WEBHOOK_SECRET || "",
    headerName: (process.env.FORM_WEBHOOK_HEADER || "x-form-secret").toLowerCase(),
    rateMax: parseInt(process.env.FORM_WEBHOOK_RATE_MAX || "30", 10),
  },
  pageSpeedApiKey: process.env.PAGESPEED_API_KEY || "",
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    redirectUri:
      process.env.GOOGLE_REDIRECT_URI ||
      "http://localhost:5000/api/google/callback",
  },
  backlinks: {
    provider: process.env.BACKLINKS_PROVIDER || "dataforseo",
    cacheDays: parseInt(process.env.BACKLINKS_CACHE_DAYS || "7", 10),
    defaultMonthlyLimit: parseInt(process.env.BACKLINKS_MONTHLY_LIMIT || "4", 10),
    providers: {
      dataforseo: {
        email: process.env.DATAFORSEO_EMAIL || "",
        password: process.env.DATAFORSEO_PASSWORD || "",
      },
      moz: {
        accessId: process.env.MOZ_ACCESS_ID || "",
        secretKey: process.env.MOZ_SECRET_KEY || "",
      },
      ahrefs: {
        apiToken: process.env.AHREFS_API_TOKEN || "",
      },
    },
  },
  keywords: {
    provider: process.env.KEYWORDS_PROVIDER || "dataforseo",
    defaultLocationCode: parseInt(process.env.KEYWORDS_LOCATION_CODE || "2276", 10),
    defaultLanguageCode: process.env.KEYWORDS_LANGUAGE_CODE || "de",
    defaultMonthlyLimit: parseInt(process.env.KEYWORDS_MONTHLY_LIMIT || "4", 10),
    historyMaxEntries: parseInt(process.env.KEYWORDS_HISTORY_MAX || "30", 10),
    providers: {
      dataforseo: {
        email: process.env.DATAFORSEO_EMAIL || "",
        password: process.env.DATAFORSEO_PASSWORD || "",
      },
    },
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === "development" ? 1000 : 100,
  },
  authRateLimit: {
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === "development" ? 100 : 5,
  },
};
