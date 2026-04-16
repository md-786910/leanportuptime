const nodemailer = require("nodemailer");
const config = require("../config");
const Notification = require("../models/Notification");
const logger = require("../utils/logger");

class NotificationService {
  constructor() {
    if (config.smtp.host) {
      this.transporter = nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.port === 465,
        auth: {
          user: config.smtp.user,
          pass: config.smtp.pass,
        },
      });
      logger.info(`SMTP configured: ${config.smtp.host}:${config.smtp.port}`);
    } else {
      logger.warn("SMTP not configured — email notifications disabled");
    }
  }

  async notify(userId, site, type, message) {
    const channels = [];
    if (site.notifications.email) channels.push("email");
    if (site.notifications.slack && site.notifications.slackUrl)
      channels.push("slack");
    if (site.notifications.discord && site.notifications.discordUrl)
      channels.push("discord");
    if (site.notifications.webhook && site.notifications.webhookUrl)
      channels.push("webhook");

    const results = await Promise.allSettled(
      channels.map((channel) =>
        this._send(userId, site, type, channel, message),
      ),
    );

    return results;
  }

  async _send(userId, site, type, channel, message) {
    const notification = await Notification.create({
      userId,
      siteId: site._id,
      type,
      channel,
      message,
      status: "pending",
    });

    try {
      switch (channel) {
        case "email":
          await this._sendEmail(site, type, message);
          break;
        case "slack":
          await this._sendSlack(site.notifications.slackUrl, site, message);
          break;
        case "discord":
          await this._sendDiscord(site.notifications.discordUrl, site, message);
          break;
        case "webhook":
          await this._sendWebhook(
            site.notifications.webhookUrl,
            site,
            type,
            message,
          );
          break;
      }

      notification.status = "sent";
      notification.sentAt = new Date();
      await notification.save();
    } catch (error) {
      notification.status = "failed";
      notification.error = error.message;
      await notification.save();
      logger.error(`Notification failed [${channel}]: ${error.message}`);
    }

    return notification;
  }

  async _sendEmail(site, type, message) {
    if (!this.transporter) {
      throw new Error("SMTP not configured");
    }

    // Also send to [sunil sir,saddam bhai and najme sir] for get ssl message when it get expired as well

    let recipients = [site.userId?.email];
    if (type === "ssl_expiry") {
      recipients = [...recipients, ...config.sslEmailListToSend].filter(
        Boolean,
      );
    }

    console.log("Recipients for SSL Expiry Notification:", {
      recipients,
      type,
    });

    await this.transporter.sendMail({
      from: config.smtp.from,
      to: recipients.join(","),
      subject: `[WP Sentinel] SSL: ${site.name} - ${type.toUpperCase()}`,
      html: `
    <h3>WP Sentinel SSL Alert</h3>
    <p><strong>${site.name}</strong> (${site.url})</p>
    <p>Status: <strong>${type.toUpperCase()}</strong></p>
    <p>${message}</p>
  `,
    });
  }

  async _sendSlack(webhookUrl, site, message) {
    const { default: fetch } = await import("node-fetch");
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `*WP Sentinel Alert*\n*Site:* ${site.name} (${site.url})\n${message}`,
      }),
    });
  }

  async _sendDiscord(webhookUrl, site, message) {
    const { default: fetch } = await import("node-fetch");
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [
          {
            title: "WP Sentinel Alert",
            description: message,
            fields: [
              { name: "Site", value: site.name },
              { name: "URL", value: site.url },
            ],
            color: 0xff0000,
          },
        ],
      }),
    });
  }

  async _sendWebhook(webhookUrl, site, type, message) {
    const { default: fetch } = await import("node-fetch");
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: type,
        site: { id: site._id, name: site.name, url: site.url },
        message,
        timestamp: new Date().toISOString(),
      }),
    });
  }
}

module.exports = new NotificationService();
