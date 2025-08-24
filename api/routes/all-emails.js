/**
 * All emails routes
 * Handles retrieval of both sent and received emails
 */

const express = require("express");
const router = express.Router();
const emailService = require("../../services/emailService");

/**
 * GET /all-emails
 * Get all emails (sent and received) for a user
 */
router.get("/", (req, res) => {
	try {
		const { user, type } = req.query;
		const emails = emailService.getEmails(user, "all");
		res.json(emails);
	} catch (error) {
		console.error("Error fetching all emails:", error);
		res.status(500).json({ error: "Internal server error" });
	}
});

module.exports = router;
