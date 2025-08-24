/**
 * Sent email routes
 * Handles sent email retrieval and management
 */

const express = require("express");
const router = express.Router();
const emailService = require("../../services/emailService");

/**
 * GET /sent-emails
 * Get sent emails for a user
 */
router.get("/", (req, res) => {
	try {
		const { user } = req.query;
		const emails = emailService.getEmails(user, "sent");
		res.json(emails);
	} catch (error) {
		console.error("Error fetching sent emails:", error);
		res.status(500).json({ error: "Internal server error" });
	}
});

/**
 * GET /sent-emails/:id
 * Get a specific sent email by ID
 */
router.get("/:id", (req, res) => {
	try {
		const { user } = req.query;
		const emailId = req.params.id;

		const email = emailService.getEmailById(emailId, user);

		if (!email) {
			return res.status(404).json({ error: "Email not found" });
		}

		res.json(email);
	} catch (error) {
		console.error("Error fetching sent email:", error);
		res.status(500).json({ error: "Internal server error" });
	}
});

/**
 * GET /sent-emails/:id/attachments/:filename
 * Get attachment for a sent email
 */
router.get("/:id/attachments/:filename", (req, res) => {
	try {
		const { user } = req.query;
		const { id, filename } = req.params;

		const attachmentPath = emailService.getAttachmentPath(id, filename, "sent", user);

		if (!attachmentPath) {
			return res.status(404).json({ error: "Attachment not found" });
		}

		res.sendFile(attachmentPath);
	} catch (error) {
		console.error("Error fetching sent email attachment:", error);
		res.status(500).json({ error: "Internal server error" });
	}
});

module.exports = router;
