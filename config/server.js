const { SMTP_HOST, SMTP_PORT, API_HOST, API_PORT } = require("./env");

/**
 * Server configuration
 * Contains SMTP and API server settings
 */

const SERVER_CONFIG = {
	// SMTP Server Configuration
	smtp: {
		host: SMTP_HOST, // EC-2 SMTP Server Public IP
		port: SMTP_PORT,
		allowedDomains: ["google.in", "domain.com"],
		authOptional: true,
	},

	// API Server Configuration
	api: {
		host: API_HOST, // EC-2 Backend ServerPublic IP
		port: API_PORT,
	},

	// Email Storage Configuration
	storage: {
		directories: {
			raw: "emails/raw",
			parsed: "emails/parsed",
			attachments: "emails/attachments",
			errors: "emails/errors",
			sent: "emails/sent",
			sentAttachments: "emails/sent_attachments",
			uploads: "uploads",
			starred: "emails/starred",
		},
	},
};

module.exports = SERVER_CONFIG;
