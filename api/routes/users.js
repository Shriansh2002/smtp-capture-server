/**
 * User routes
 * Handles user-related operations
 */

const express = require("express");
const router = express.Router();
const USERS = require("../../config/users");

/**
 * GET /users
 * Get list of all users (without sensitive information)
 */
router.get("/", (req, res) => {
	try {
		const users = Object.keys(USERS).map(username => ({
			username,
			email: username,
			// Don't expose passwords or API keys in the API
		}));
		
		res.json(users);
	} catch (error) {
		console.error("Error fetching users:", error);
		res.status(500).json({ error: "Internal server error" });
	}
});

module.exports = router;
