/**
 * Email routes for received emails
 * Handles email retrieval and management
 */

const express = require("express");
const router = express.Router();
const emailService = require("../../services/emailService");

/**
 * GET /emails
 * Get received emails for a user
 */
router.get("/", (req, res) => {
	try {
		const { user, type } = req.query;

		if (type === "sent") {
			// Redirect to sent emails endpoint
			return res.redirect(`/sent-emails?user=${user || ""}`);
		}

		const emails = emailService.getEmails(user, "received");
		res.json(emails);
	} catch (error) {
		console.error("Error fetching received emails:", error);
		res.status(500).json({ error: "Internal server error" });
	}
});

/**
 * GET /emails/:id
 * Get a specific email by ID
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
		console.error("Error fetching email:", error);
		res.status(500).json({ error: "Internal server error" });
	}
});

/**
 * GET /emails/:id/attachments/:filename
 * Get attachment for a received email
 */
router.get("/:id/attachments/:filename", (req, res) => {
	try {
		const { user } = req.query;
		const { id, filename } = req.params;

		const attachmentPath = emailService.getAttachmentPath(id, filename, "received", user);

		if (!attachmentPath) {
			return res.status(404).json({ error: "Attachment not found" });
		}

		res.sendFile(attachmentPath);
	} catch (error) {
		console.error("Error fetching attachment:", error);
		res.status(500).json({ error: "Internal server error" });
	}
});

module.exports = router;
