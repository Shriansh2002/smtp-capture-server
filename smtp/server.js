/**
 * SMTP Server module
 * Handles incoming email processing and storage
 */

const SMTPServer = require("smtp-server").SMTPServer;
const emailService = require("../services/emailService");
const SERVER_CONFIG = require("../config/server");
const userService = require("../services/userService");

class SMTPServerManager {
	constructor() {
		this.server = null;
		this.config = SERVER_CONFIG.smtp;
	}

	/**
	 * Create and configure SMTP server
	 */
	createServer() {
		this.server = new SMTPServer({
			authOptional: this.config.authOptional,
			onAuth: this.handleAuth.bind(this),
			onMailFrom: this.handleMailFrom.bind(this),
			onRcptTo: this.handleRcptTo.bind(this),
			onData: this.handleData.bind(this),
		});
	}

	/**
	 * Handle SMTP authentication
	 * @param {Object} auth - Authentication data
	 * @param {Object} session - Session object
	 * @param {Function} callback - Callback function
	 */
	async handleAuth(auth, session, callback) {
		const { username, password } = auth;
		try {
			const user = await userService.validateSmtpAuth(username, password);
			if (!user) {
				return callback(new Error("Invalid username or password"));
			}
			session.user = username;
			callback(null, { user: username });
		} catch (err) {
			callback(new Error("Authentication error"));
		}
	}

	/**
	 * Handle MAIL FROM command
	 * @param {Object} address - From address
	 * @param {Object} session - Session object
	 * @param {Function} callback - Callback function
	 */
	handleMailFrom(address, session, callback) {
		callback();
	}

	/**
	 * Handle RCPT TO command
	 * @param {Object} address - To address
	 * @param {Object} session - Session object
	 * @param {Function} callback - Callback function
	 */
	handleRcptTo(address, session, callback) {
		const domain = address.address.split("@")[1]?.toLowerCase();

		if (this.config.allowedDomains.includes(domain)) {
			return callback();
		}

		return callback(
			new Error("Relay access denied: recipient domain not allowed")
		);
	}

	/**
	 * Handle email data
	 * @param {Object} stream - Email data stream
	 * @param {Object} session - Session object
	 * @param {Function} callback - Callback function
	 */
	async handleData(stream, session, callback) {
		let rawChunks = [];

		stream.on("data", (chunk) => rawChunks.push(chunk));

		stream.on("end", async () => {
			try {
				const rawEmail = Buffer.concat(rawChunks);
				await emailService.processReceivedEmail(rawEmail, session.user || null);
				callback();
			} catch (err) {
				console.error("❌ Failed to process email:", err);
				callback(err);
			}
		});
	}

	/**
	 * Start SMTP server
	 */
	start() {
		if (!this.server) {
			this.createServer();
		}

		this.server.listen(this.config.port, this.config.host, () => {
			console.log(
				`📬 SMTP Server running on ${this.config.host}:${this.config.port}`
			);
		});
	}

	/**
	 * Stop SMTP server
	 */
	stop() {
		if (this.server) {
			this.server.close();
			console.log("📬 SMTP Server stopped");
		}
	}
}

module.exports = new SMTPServerManager();
