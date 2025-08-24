/**
 * Health check routes
 * Handles system health monitoring
 */

const express = require("express");
const router = express.Router();
const fs = require("fs");
const SERVER_CONFIG = require("../../config/server");
const USERS = require("../../config/users");
const { formatDateForStorage, getLocalDate } = require("../../utils/dateUtils");

/**
 * GET /health
 * Get system health status
 */
router.get("/", (req, res) => {
	try {
		const directories = SERVER_CONFIG.storage.directories;
		
		const healthStatus = {
			status: "ok",
			timestamp: formatDateForStorage(getLocalDate()),
			users: Object.keys(USERS),
			directories: {
				raw: fs.existsSync(directories.raw),
				parsed: fs.existsSync(directories.parsed),
				sent: fs.existsSync(directories.sent),
				attachments: fs.existsSync(directories.attachments),
				sentAttachments: fs.existsSync(directories.sentAttachments),
				uploads: fs.existsSync(directories.uploads),
				errors: fs.existsSync(directories.errors)
			},
			server: {
				smtp: {
					host: SERVER_CONFIG.smtp.host,
					port: SERVER_CONFIG.smtp.port,
					allowedDomains: SERVER_CONFIG.smtp.allowedDomains
				},
				api: {
					host: SERVER_CONFIG.api.host,
					port: SERVER_CONFIG.api.port
				}
			}
		};

		res.json(healthStatus);
	} catch (error) {
		console.error("Error in health check:", error);
		res.status(500).json({ 
			status: "error", 
			error: "Health check failed" 
		});
	}
});

module.exports = router;
