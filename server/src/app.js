const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const config = require("./config");
const { apiLimiter } = require("./middleware/rateLimiter");
const errorHandler = require("./middleware/errorHandler");
const auth = require("./middleware/auth");
const siteAccess = require("./middleware/siteAccess");

// Route imports

const authRoutes = require("./routes/auth.routes");
const sitesRoutes = require("./routes/sites.routes");
const checksRoutes = require("./routes/checks.routes");
const sslRoutes = require("./routes/ssl.routes");
const securityRoutes = require("./routes/security.routes");
const reportsRoutes = require("./routes/reports.routes");
const pluginRoutes = require("./routes/plugin.routes");
const siteScanRoutes = require("./routes/sitescan.routes");
const seoRoutes = require("./routes/seo.routes");
const notificationsRoutes = require("./routes/notifications.routes");
const invitationRoutes = require("./routes/invitation.routes");
const teamRoutes = require("./routes/team.routes");
const googleRoutes = require("./routes/google.routes");
const searchConsoleRoutes = require("./routes/searchConsole.routes");
const analyticsRoutes = require("./routes/analytics.routes");
const backlinksRoutes = require("./routes/backlinks.routes");
const appSettingsRoutes = require("./routes/appSettings.routes");

const app = express();

// Security & parsing middleware
app.use(helmet());
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());
app.use(morgan("combined"));
app.use(apiLimiter);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    data: { status: "ok", timestamp: new Date().toISOString() },
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/sites", sitesRoutes);
app.use("/api/sites/:id/checks", auth, siteAccess, checksRoutes);
app.use("/api/sites/:id/ssl", auth, siteAccess, sslRoutes);
app.use("/api/sites/:id/security", auth, siteAccess, securityRoutes);
app.use("/api/sites/:id/plugins", auth, siteAccess, pluginRoutes);
app.use("/api/sites/:id/sitescan", auth, siteAccess, siteScanRoutes);
app.use("/api/sites/:id/seo", auth, siteAccess, seoRoutes);
app.use("/api/sites/:id/reports", auth, siteAccess, reportsRoutes);
app.use("/api/google", googleRoutes);
app.use("/api/sites/:id/search-console", auth, siteAccess, searchConsoleRoutes);
app.use("/api/sites/:id/analytics", auth, siteAccess, analyticsRoutes);
app.use("/api/sites/:id/backlinks", auth, siteAccess, backlinksRoutes);
app.use("/api/settings", auth, appSettingsRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/invitations", invitationRoutes);
app.use("/api/users/team", teamRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { code: "NOT_FOUND", message: `Route ${req.originalUrl} not found` },
  });
});

// Global error handler
app.use(errorHandler);

module.exports = app;
