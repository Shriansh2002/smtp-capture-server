/**
 * Email service for business logic
 * Handles email processing, sending, and retrieval operations
 */

const { simpleParser } = require("mailparser");
const nodemailer = require("nodemailer");
const storageService = require("./storageService");
const {
	getLocalDate,
	formatDateForStorage,
	generateEmailId,
} = require("../utils/dateUtils");
const { normalizeEmail, isAllowedDomain } = require("../utils/emailUtils");
const SERVER_CONFIG = require("../config/server");
const USERS = require("../config/users");

class EmailService {
	constructor() {
		this.allowedDomains = SERVER_CONFIG.smtp.allowedDomains;
	}

	/**
	 * Process and store received email
	 * @param {Buffer} rawEmail - Raw email data
	 * @param {string} user - User identifier
	 * @returns {Promise<string>} Email ID
	 */
	async processReceivedEmail(rawEmail, user = null) {
		const emailId = generateEmailId();

		try {
			// Save raw email
			storageService.saveRawEmail(emailId, rawEmail);

			// Parse email
			const parsed = await simpleParser(rawEmail);
			const localDate = getLocalDate(parsed.date);

			// Prepare email data
			const emailData = {
				id: emailId,
				type: "received",
				user: user || null,
				from: parsed.from?.text,
				to: parsed.to?.text,
				subject: parsed.subject,
				date: formatDateForStorage(localDate),
				text: parsed.text,
				html: parsed.html,
				attachments: parsed.attachments.map((att) => ({
					filename: att.filename,
					contentType: att.contentType,
					size: att.size,
				})),
			};

			// Save parsed email
			storageService.saveParsedEmail(emailId, emailData, "received");

			// Save attachments
			if (parsed.attachments.length > 0) {
				storageService.saveAttachments(emailId, parsed.attachments, "received");
			}

			return emailId;
		} catch (error) {
			console.error(`❌ Parsing failed for ${emailId}:`, error);
			storageService.saveError(emailId, error, user);
			throw error;
		}
	}

	/**
	 * Send email using SMTP
	 * @param {Object} emailData - Email data
	 * @param {Array} attachments - Array of attachment objects
	 * @returns {Promise<Object>} Send result
	 */
	async sendEmail(emailData, attachments = []) {
		const { to, subject, text, html, user } = emailData;

		// Validate user and authentication
		if (!user || !USERS[user]) {
			throw new Error("Invalid user");
		}

		const userConfig = USERS[user];

		// Validate recipient domain
		const toDomain = extractDomain(to);
		if (!toDomain) {
			throw new Error("Invalid recipient address");
		}

		// Create transporter
		const transporter = nodemailer.createTransport({
			host: SERVER_CONFIG.smtp.host,
			port: SERVER_CONFIG.smtp.port,
			secure: false,
			auth: {
				user: user,
				pass: userConfig.password,
			},
			tls: { rejectUnauthorized: false },
		});

		// Send email
		const info = await transporter.sendMail({
			from: `"${user}" <${user}>`,
			to,
			subject,
			text,
			html,
			attachments,
		});

		return info;
	}

	/**
	 * Save sent email to storage
	 * @param {Object} emailData - Email data
	 * @param {Array} attachments - Array of attachment objects
	 * @returns {string} Email ID
	 */
	saveSentEmail(emailData, attachments = []) {
		const emailId = generateEmailId();
		const { to, subject, text, html, user } = emailData;

		// Prepare sent email data
		const sentEmailData = {
			id: emailId,
			type: "sent",
			user: user,
			from: user,
			to,
			subject,
			date: formatDateForStorage(getLocalDate()),
			text,
			html,
			attachments: attachments.map((a) => ({
				filename: a.filename,
				size: a.size || null,
			})),
		};

		// Save sent email
		storageService.saveParsedEmail(emailId, sentEmailData, "sent");

		// Move attachments to sent attachments folder
		for (const file of attachments) {
			storageService.moveUploadedAttachment(emailId, file.path, file.filename);
		}

		return emailId;
	}

	/**
	 * Get emails by user and type
	 * @param {string} user - User email address
	 * @param {string} type - Email type ('received', 'sent', or 'all')
	 * @returns {Array} Array of email objects
	 */
	getEmails(user, type = "received") {
		if (type === "all") {
			// Get both received and sent emails
			const receivedEmails = storageService.getEmailsByUserAndType(
				user,
				"received"
			);
			const sentEmails = storageService.getEmailsByUserAndType(user, "sent");

			// Combine and sort by date
			const allEmails = [...receivedEmails, ...sentEmails];
			const { parseDateFromStorage } = require("../utils/dateUtils");

			allEmails.sort(
				(a, b) => parseDateFromStorage(b.date) - parseDateFromStorage(a.date)
			);

			return allEmails;
		}

		return storageService.getEmailsByUserAndType(user, type);
	}

	/**
	 * Mark an email as starred for a user
	 */
	starEmail(user, emailId) {
		const email = storageService.getEmailById(emailId);
		if (!email) {
			throw new Error("Email not found");
		}
		// Access control: user must be sender (sent) or recipient (received)
		const normalizedTo = normalizeEmail(email.to);
		if (email.user !== user && normalizedTo !== user) {
			throw new Error("Access denied");
		}
		storageService.addStar(user, emailId);
		return { success: true };
	}

	/**
	 * Remove starred mark for a user
	 */
	unstarEmail(user, emailId) {
		const email = storageService.getEmailById(emailId);
		if (!email) {
			throw new Error("Email not found");
		}
		const normalizedTo = normalizeEmail(email.to);
		if (email.user !== user && normalizedTo !== user) {
			throw new Error("Access denied");
		}
		storageService.removeStar(user, emailId);
		return { success: true };
	}

	/**
	 * List starred emails for a user
	 */
	getStarredEmails(user) {
		return storageService.listStarredEmails(user);
	}

	/**
	 * Get single email by ID
	 * @param {string} emailId - Email identifier
	 * @param {string} user - User email for access control
	 * @returns {Object|null} Email object or null if not found/access denied
	 */
	getEmailById(emailId, user = null) {
		const email = storageService.getEmailById(emailId);

		if (!email) {
			return null;
		}

		// Check user access
		if (user) {
			const normalizedTo = normalizeEmail(email.to);
			if (email.user !== user && normalizedTo !== user) {
				return null; // Access denied
			}
		}

		return email;
	}

	/**
	 * Get attachment file path with access control
	 * @param {string} emailId - Email identifier
	 * @param {string} filename - Attachment filename
	 * @param {string} type - Email type ('received' or 'sent')
	 * @param {string} user - User email for access control
	 * @returns {string|null} Attachment path or null if access denied
	 */
	getAttachmentPath(emailId, filename, type = "received", user = null) {
		// Check if attachment exists
		if (!storageService.attachmentExists(emailId, filename, type)) {
			return null;
		}

		// Check user access
		if (user) {
			const email = storageService.getEmailById(emailId);
			if (!email) return null;

			const normalizedTo = normalizeEmail(email.to);
			if (type === "sent") {
				if (email.user !== user) return null;
			} else {
				if (normalizedTo !== user) return null;
			}
		}

		return storageService.getAttachmentPath(emailId, filename, type);
	}

	/**
	 * Validate user authentication
	 * @param {string} username - Username/email
	 * @param {string} apiKey - API key
	 * @returns {Object|null} User config or null if invalid
	 */
	validateUser(username, apiKey) {
		if (!username || !USERS[username]) {
			return null;
		}

		const userConfig = USERS[username];

		if (apiKey && userConfig.apiKey !== apiKey) {
			return null;
		}

		return userConfig;
	}

	/**
	 * Check if domain is allowed for SMTP relay
	 * @param {string} domain - Domain to check
	 * @returns {boolean} True if domain is allowed
	 */
	isDomainAllowed(domain) {
		return isAllowedDomain(`test@${domain}`, this.allowedDomains);
	}
}

// Helper function for domain extraction
function extractDomain(email) {
	if (!email) return "";
	const parts = email.split("@");
	return parts.length > 1 ? parts[1].toLowerCase() : "";
}

module.exports = new EmailService();
