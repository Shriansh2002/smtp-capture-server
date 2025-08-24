/**
 * Custom Mail Server - Entry Point
 * Starts both SMTP and API servers
 */

const smtpServer = require("./smtp/server");
const apiServer = require("./api");

/**
 * Graceful shutdown handler
 */
function gracefulShutdown() {
	console.log("\n🛑 Shutting down servers...");

	// Stop SMTP server
	smtpServer.stop();

	// Exit process
	process.exit(0);
}

/**
 * Start all servers
 */
function startServers() {
	try {
		// Start SMTP server
		smtpServer.start();

		// Start API server
		apiServer.start();
	} catch (error) {
		console.error("❌ Failed to start servers:", error);
		process.exit(1);
	}
}

// Handle graceful shutdown
process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
	console.error("❌ Uncaught Exception:", error);
	gracefulShutdown();
});

process.on("unhandledRejection", (reason, promise) => {
	console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
	gracefulShutdown();
});

// Start the application
startServers();
