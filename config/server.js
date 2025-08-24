/**
 * Server configuration
 * Contains SMTP and API server settings
 */

const SERVER_CONFIG = {
	// SMTP Server Configuration
	smtp: {
		host: "0.0.0.0",
		port: 25,
		allowedDomains: ["google.in", "domain.com"],
		authOptional: true
	},
	
	// API Server Configuration
	api: {
		host: "0.0.0.0",
		port: 4000
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
			uploads: "uploads"
		}
	}
};

module.exports = SERVER_CONFIG;
