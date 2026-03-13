const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const config = require("./config");
const { apiLimiter } = require("./middleware/rateLimiter");
const errorHandler = require("./middleware/errorHandler");

// Route imports

const authRoutes = require("./routes/auth.routes");
const sitesRoutes = require("./routes/sites.routes");
const checksRoutes = require("./routes/checks.routes");
const sslRoutes = require("./routes/ssl.routes");
const securityRoutes = require("./routes/security.routes");
const reportsRoutes = require("./routes/reports.routes");
const notificationsRoutes = require("./routes/notifications.routes");

const app = express();

// Security & parsing middleware
app.use(helmet());
app.use(
  cors({
    origin: config.clientUrl,
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
app.use("/api/sites/:id/checks", checksRoutes);
app.use("/api/sites/:id/ssl", sslRoutes);
app.use("/api/sites/:id/security", securityRoutes);
app.use("/api/sites/:id/reports", reportsRoutes);
app.use("/api/notifications", notificationsRoutes);

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
