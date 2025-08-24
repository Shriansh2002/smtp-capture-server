/**
 * API Server
 * Express application with route registration
 */

const express = require("express");
const cors = require("cors");
const SERVER_CONFIG = require("../config/server");

// Import routes
const authRoutes = require("./routes/auth");
const emailRoutes = require("./routes/emails");
const sentEmailRoutes = require("./routes/sent-emails");
const allEmailRoutes = require("./routes/all-emails");
const sendRoutes = require("./routes/send");
const userRoutes = require("./routes/users");
const healthRoutes = require("./routes/health");

class APIServer {
	constructor() {
		this.app = express();
		this.config = SERVER_CONFIG.api;
		this.setupMiddleware();
		this.setupRoutes();
	}

	/**
	 * Setup middleware
	 */
	setupMiddleware() {
		// Enable CORS
		this.app.use(cors());

		// Parse JSON bodies
		this.app.use(express.json());

		// Parse URL-encoded bodies
		this.app.use(express.urlencoded({ extended: true }));
	}

	/**
	 * Setup API routes
	 */
	setupRoutes() {
		// Authentication routes
		this.app.use("/auth", authRoutes);

		// Email routes
		this.app.use("/emails", emailRoutes);

		// Sent email routes
		this.app.use("/sent-emails", sentEmailRoutes);

		// All emails routes
		this.app.use("/all-emails", allEmailRoutes);

		// Send email routes
		this.app.use("/send", sendRoutes);

		// User routes
		this.app.use("/users", userRoutes);

		// Health check routes
		this.app.use("/health", healthRoutes);

		// Root route
		this.app.get("/", (req, res) => {
			res.json({
				message: "Custom Mail Server API",
				version: "1.0.0",
				endpoints: {
					auth: "/auth",
					emails: "/emails",
					sentEmails: "/sent-emails",
					allEmails: "/all-emails",
					send: "/send",
					users: "/users",
					health: "/health",
				},
			});
		});

		// 404 handler - must be last
		this.app.use((req, res) => {
			res.status(404).json({ error: "Endpoint not found" });
		});

		// Error handler
		this.app.use((err, req, res, next) => {
			console.error("API Error:", err);
			res.status(500).json({ error: "Internal server error" });
		});
	}

	/**
	 * Start API server
	 */
	start() {
		this.app.listen(this.config.port, this.config.host, () => {
			console.log(
				`🌐 API Server running on ${this.config.host}:${this.config.port}`
			);
		});
	}

	/**
	 * Get Express app instance
	 */
	getApp() {
		return this.app;
	}
}

module.exports = new APIServer();
