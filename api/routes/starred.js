/**
 * Starred email routes
 */

const express = require("express");
const router = express.Router();
const emailService = require("../../services/emailService");

// GET /starred?user=
router.get("/", (req, res) => {
	try {
		const { user } = req.query;
		if (!user) return res.status(400).json({ error: "User is required" });
		const emails = emailService.getStarredEmails(user);
		res.json(emails);
	} catch (error) {
		console.error("Error fetching starred emails:", error);
		res.status(500).json({ error: "Internal server error" });
	}
});

// POST /starred/:id?user=
router.post("/:id", (req, res) => {
	try {
		const { user } = req.query;
		const emailId = req.params.id;
		if (!user) return res.status(400).json({ error: "User is required" });
		emailService.starEmail(user, emailId);
		res.json({ success: true });
	} catch (error) {
		if (error.message === "Email not found") {
			return res.status(404).json({ error: error.message });
		}
		if (error.message === "Access denied") {
			return res.status(403).json({ error: error.message });
		}
		console.error("Error starring email:", error);
		res.status(500).json({ error: "Internal server error" });
	}
});

// DELETE /starred/:id?user=
router.delete("/:id", (req, res) => {
	try {
		const { user } = req.query;
		const emailId = req.params.id;
		if (!user) return res.status(400).json({ error: "User is required" });
		emailService.unstarEmail(user, emailId);
		res.json({ success: true });
	} catch (error) {
		if (error.message === "Email not found") {
			return res.status(404).json({ error: error.message });
		}
		if (error.message === "Access denied") {
			return res.status(403).json({ error: error.message });
		}
		console.error("Error unstarring email:", error);
		res.status(500).json({ error: "Internal server error" });
	}
});

module.exports = router;


