/**
 * Authentication routes
 * Handles user login and authentication
 */

const express = require("express");
const router = express.Router();
const emailService = require("../../services/emailService");

/**
 * POST /auth/login
 * Authenticate user with username/email and API key
 */
router.post("/login", (req, res) => {
	const { username, email, apiKey } = req.body;

	// Support both username and email fields
	const userEmail = username || email;

	if (!userEmail) {
		return res.status(400).json({
			success: false,
			error: "Username/email is required",
		});
	}

	// Validate user and API key
	const userConfig = emailService.validateUser(userEmail, apiKey);

	// Check if account is active
	if (userConfig && userConfig.isActive === false) {
		return res.status(403).json({
			success: false,
			error: "Your Account is disabled, contact Admin",
		});
	}

	if (!userConfig) {
		return res.status(401).json({
			success: false,
			error: "Invalid username/email or API key",
		});
	}

	res.json({
		success: true,
		user: {
			id: userEmail,
			email: userEmail,
			username: userEmail,
		},
		message: "Login successful",
	});
});

module.exports = router;
