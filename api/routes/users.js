/**
 * User routes
 * Handles user-related operations
 */

const express = require("express");
const router = express.Router();
const userService = require("../../services/userService");

/**
 * GET /users
 * Get list of all users (without sensitive information)
 */
router.get("/", async (req, res) => {
	try {
		const users = await userService.listUsers();
		res.json(users.map((u) => ({ username: u.email, email: u.email })));
	} catch (error) {
		console.error("Error fetching users:", error);
		res.status(500).json({ error: "Internal server error" });
	}
});

module.exports = router;
