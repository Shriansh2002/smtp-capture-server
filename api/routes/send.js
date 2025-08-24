/**
 * Send email routes
 * Handles email sending functionality
 */

const express = require("express");
const multer = require("multer");
const router = express.Router();
const emailService = require("../../services/emailService");
const SERVER_CONFIG = require("../../config/server");

// Configure multer for file uploads
const upload = multer({ dest: SERVER_CONFIG.storage.directories.uploads });

/**
 * POST /send-email
 * Send an email with optional attachments
 */
router.post("/email", upload.array("attachments"), async (req, res) => {
	try {
		const { to, subject, text, html, user, apiKey } = req.body;

		// Validate user and authentication
		if (!user || !apiKey) {
			return res.status(400).json({ 
				success: false, 
				error: "User and API key are required" 
			});
		}

		const userConfig = emailService.validateUser(user, apiKey);
		if (!userConfig) {
			return res.status(401).json({ 
				success: false, 
				error: "Authentication failed" 
			});
		}

		// Prepare email data
		const emailData = {
			to,
			subject,
			text,
			html,
			user
		};

		// Prepare attachments
		const attachments = req.files?.map(file => ({
			filename: file.originalname,
			path: file.path,
			size: file.size
		})) || [];

		// Send email
		const sendResult = await emailService.sendEmail(emailData, attachments);

		// Save sent email to storage
		const emailId = emailService.saveSentEmail(emailData, attachments);

		res.json({ 
			success: true, 
			messageId: sendResult.messageId,
			emailId: emailId
		});
	} catch (err) {
		console.error("❌ Failed to send email:", err);
		res.status(500).json({ 
			success: false, 
			error: err.message 
		});
	}
});

module.exports = router;
