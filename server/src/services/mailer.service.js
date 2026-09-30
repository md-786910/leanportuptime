const nodemailer = require("nodemailer");
const config = require("../config");
const logger = require("../utils/logger");

// Microsoft Graph (OAuth2 client-credentials) is used when all GRAPH_* vars
// are set. Otherwise falls back to SMTP with zero extra config.
// Mirrors /mnt/leanport/stemotics server/src/config/mailer.js pattern.
//
// App registration needs Mail.Send *application* permission + admin consent,
// and smtp.from must be a mailbox the app may send as.

let transporter = null;
if (config.smtp.host) {
  transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.port === 465,
    auth:
      config.smtp.user || config.smtp.pass
        ? { user: config.smtp.user, pass: config.smtp.pass }
        : undefined,
  });
}

const isGraphEnabled = () =>
  Boolean(
    config.graph.tenantId && config.graph.clientId && config.graph.clientSecret
  );

// Graph /users/{id}/sendMail needs a plain mailbox UPN, but SMTP_FROM is
// often display-name formatted ("Sitelyze <no-reply@sitelyze.io>"). Extract
// the bare email so a display-name FROM doesn't produce a 400/404 URL.
// GRAPH_SENDER overrides this when the Graph mailbox differs from SMTP_FROM
// (e.g. SMTP_FROM is unlicensed/on-prem and Graph must send as another user).
const getGraphSender = () => {
  if ((config.graph.sender || "").trim()) return config.graph.sender.trim();
  const from = (config.smtp.from || "").trim();
  const match = from.match(/<([^>]+)>/);
  return (match ? match[1] : from).trim();
};

const mailPath =
  config.env === "test" ? "test" : isGraphEnabled() ? "graph" : "smtp";
logger.info(
  `Mailer initialized [path=${mailPath}] from=${config.smtp.from}` +
    (isGraphEnabled() ? "" : ` smtpHost=${config.smtp.host || "none"}`)
);

let graphTokenCache = { token: null, expiresAt: 0 };

const getGraphToken = async () => {
  if (graphTokenCache.token && Date.now() < graphTokenCache.expiresAt) {
    return graphTokenCache.token;
  }
  const params = new URLSearchParams({
    client_id: config.graph.clientId,
    client_secret: config.graph.clientSecret,
    scope: "https://graph.microsoft.com/.default",
    grant_type: "client_credentials",
  });
  const res = await fetch(
    `https://login.microsoftonline.com/${config.graph.tenantId}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params,
    }
  );
  if (!res.ok) {
    throw new Error(`Graph token request failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  // Refresh a minute early so an expiring token is never sent.
  graphTokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
  return graphTokenCache.token;
};

const toGraphRecipients = (to) => {
  const list = Array.isArray(to) ? to : [to];
  return list
    .flatMap((entry) =>
      typeof entry === "string" ? entry.split(",") : [entry]
    )
    .map((address) => (typeof address === "string" ? address.trim() : ""))
    .filter(Boolean)
    .map((address) => ({ emailAddress: { address } }));
};

const sendViaGraph = async ({ to, subject, html, text }) => {
  const token = await getGraphToken();
  const recipients = toGraphRecipients(to);
  if (recipients.length === 0) {
    throw new Error("Graph sendMail: no recipients");
  }
  const message = {
    subject,
    body: { contentType: html ? "HTML" : "Text", content: html || text || "" },
    toRecipients: recipients,
  };
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(
      getGraphSender()
    )}/sendMail`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message, saveToSentItems: true }),
    }
  );
  if (!res.ok) {
    const body = await res.text();
    if (res.status === 404 && body.includes("MailboxNotEnabledForRESTAPI")) {
      throw new Error(
        `Graph sendMail failed: 404 MailboxNotEnabledForRESTAPI — sender '${getGraphSender()}' is not an active Exchange Online mailbox (inactive/soft-deleted/on-prem). License it or set GRAPH_SENDER to a licensed mailbox. Raw: ${body}`
      );
    }
    throw new Error(`Graph sendMail failed: ${res.status} ${body}`);
  }
};

// Pre-warm the Graph token in the background at boot so the first real send
// doesn't pay the ~1s token round-trip inside a user-facing request.
if (config.env !== "test" && isGraphEnabled()) {
  getGraphToken().catch(() => {});
}

/**
 * Sends email via Graph when GRAPH_* is configured, otherwise SMTP.
 * Throws on failure so callers (NotificationService) can mark failed status.
 * Strict parity with stemotics routing, but throwing instead of soft-fail
 * to preserve uptimeTools Notification sent/failed tracking.
 */
const sendMail = async ({ from, to, subject, html, text }) => {
  const path = config.env === "test" ? "test" : isGraphEnabled() ? "graph" : "smtp";
  if (path === "test") {
    logger.info(`Email skipped [path=test] to=${to} subject=${subject}`);
    return;
  }
  try {
    if (path === "graph") {
      await sendViaGraph({ to, subject, html, text });
    } else {
      if (!transporter) {
        throw new Error("SMTP not configured");
      }
      await transporter.sendMail({
        from: from || config.smtp.from,
        to: Array.isArray(to) ? to.join(",") : to,
        subject,
        html,
        text,
      });
    }
    logger.info(`Email sent [path=${path}] to=${to} subject=${subject}`);
  } catch (err) {
    logger.error(`Email failed [path=${path}]: ${err.message}`);
    throw err;
  }
};

module.exports = { sendMail, isGraphEnabled, getGraphToken, getGraphSender };
