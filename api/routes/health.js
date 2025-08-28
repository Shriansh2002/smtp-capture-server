/**
 * Health check routes
 * Handles system health monitoring
 */

const express = require("express");
const router = express.Router();
const fs = require("fs");
const SERVER_CONFIG = require("../../config/server");
const pool = require("../../config/db");
const { formatDateForStorage, getLocalDate } = require("../../utils/dateUtils");

/**
 * GET /health
 * Get system health status
 */
router.get("/", async (req, res) => {
	try {
		const directories = SERVER_CONFIG.storage.directories;

		let postgres = { connected: false };
		try {
			await pool.query("SELECT 1");
			postgres.connected = true;
		} catch (e) {
			postgres.error = e.message;
		}

		const apiStatus = { connected: true };

		const smtpStatus = {
			connected: Boolean(SERVER_CONFIG.smtp.host && SERVER_CONFIG.smtp.port),
		};

		const healthStatus = {
			status: "ok",
			timestamp: formatDateForStorage(getLocalDate()),
			directories: {
				raw: fs.existsSync(directories.raw),
				parsed: fs.existsSync(directories.parsed),
				sent: fs.existsSync(directories.sent),
				attachments: fs.existsSync(directories.attachments),
				sentAttachments: fs.existsSync(directories.sentAttachments),
				uploads: fs.existsSync(directories.uploads),
				errors: fs.existsSync(directories.errors),
			},
			server: {
				smtp: smtpStatus,
				api: apiStatus,
			},
			database: postgres,
		};

		res.json(healthStatus);
	} catch (error) {
		console.error("Error in health check:", error);
		res.status(500).json({
			status: "error",
			error: "Health check failed",
		});
	}
});

module.exports = router;
