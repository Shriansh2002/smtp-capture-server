/**
 * Storage service for file system operations
 * Handles email storage, directory management, and file operations
 */

const fs = require("fs");
const path = require("path");
const mkdirp = require("mkdirp");
const SERVER_CONFIG = require("../config/server");

class StorageService {
	constructor() {
		this.directories = SERVER_CONFIG.storage.directories;
		this.initializeDirectories();
	}

	/**
	 * Initialize all required directories
	 */
	initializeDirectories() {
		Object.values(this.directories).forEach((dir) => {
			mkdirp.sync(dir);
		});
	}

	/**
	 * Get file path for a user's starred email ids
	 * Uses one JSON file per user containing an array of email IDs
	 */
	getStarFilePath(user) {
		const safeUser = (user || "anonymous").replace(/[^a-zA-Z0-9@._-]/g, "_");
		return path.join(this.directories.starred, `${safeUser}.json`);
	}

	/**
	 * Read a user's starred set
	 */
	readStarredSet(user) {
		const filePath = this.getStarFilePath(user);
		if (!fs.existsSync(filePath)) {
			mkdirp.sync(path.dirname(filePath));
			fs.writeFileSync(filePath, JSON.stringify([]));
			return new Set();
		}
		try {
			const ids = JSON.parse(fs.readFileSync(filePath, "utf8"));
			return new Set(Array.isArray(ids) ? ids : []);
		} catch {
			return new Set();
		}
	}

	/**
	 * Persist a user's starred set
	 */
	writeStarredSet(user, starredSet) {
		const filePath = this.getStarFilePath(user);
		mkdirp.sync(path.dirname(filePath));
		fs.writeFileSync(filePath, JSON.stringify(Array.from(starredSet), null, 2));
	}

	addStar(user, emailId) {
		const set = this.readStarredSet(user);
		set.add(emailId);
		this.writeStarredSet(user, set);
	}

	removeStar(user, emailId) {
		const set = this.readStarredSet(user);
		set.delete(emailId);
		this.writeStarredSet(user, set);
	}

	isStarred(user, emailId) {
		return this.readStarredSet(user).has(emailId);
	}

	getStarredEmailIds(user) {
		return Array.from(this.readStarredSet(user));
	}

	listStarredEmails(user) {
		const ids = this.getStarredEmailIds(user);
		const emails = ids
			.map((id) => this.getEmailById(id))
			.filter((e) => e !== null && e !== undefined);
		return emails;
	}

	/**
	 * Save raw email to file system
	 * @param {string} emailId - Unique email identifier
	 * @param {Buffer} rawEmail - Raw email data
	 */
	saveRawEmail(emailId, rawEmail) {
		const rawPath = path.join(this.directories.raw, `${emailId}.eml`);
		fs.writeFileSync(rawPath, rawEmail);
	}

	/**
	 * Save parsed email metadata to JSON file
	 * @param {string} emailId - Unique email identifier
	 * @param {Object} emailData - Parsed email data
	 * @param {string} type - Email type ('received' or 'sent')
	 */
	saveParsedEmail(emailId, emailData, type = "received") {
		const directory =
			type === "sent" ? this.directories.sent : this.directories.parsed;
		const parsedPath = path.join(directory, `${emailId}.json`);

		fs.writeFileSync(parsedPath, JSON.stringify(emailData, null, 2));
	}

	/**
	 * Save email attachments
	 * @param {string} emailId - Unique email identifier
	 * @param {Array} attachments - Array of attachment objects
	 * @param {string} type - Email type ('received' or 'sent')
	 */
	saveAttachments(emailId, attachments, type = "received") {
		const attachmentsDir =
			type === "sent"
				? path.join(this.directories.sentAttachments, emailId)
				: path.join(this.directories.attachments, emailId);

		mkdirp.sync(attachmentsDir);

		for (const att of attachments) {
			const filename =
				att.filename ||
				`attachment-${Date.now()}-${Math.random().toString(36).slice(2)}`;
			fs.writeFileSync(path.join(attachmentsDir, filename), att.content);
		}
	}

	/**
	 * Save error information for failed email processing
	 * @param {string} emailId - Unique email identifier
	 * @param {Error} error - Error object
	 * @param {string} user - User identifier
	 */
	saveError(emailId, error, user = null) {
		const errorPath = path.join(
			this.directories.errors,
			`${emailId}.error.json`
		);
		const errorData = {
			id: emailId,
			user,
			error: error.message,
			stack: error.stack,
			timestamp: new Date().toString(),
		};

		fs.writeFileSync(errorPath, JSON.stringify(errorData, null, 2));
	}

	/**
	 * Get emails by user and type
	 * @param {string} user - User email address
	 * @param {string} type - Email type ('received' or 'sent')
	 * @returns {Array} Array of email objects
	 */
	getEmailsByUserAndType(user, type) {
		const directory =
			type === "sent" ? this.directories.sent : this.directories.parsed;

		// Check if directory exists
		if (!fs.existsSync(directory)) {
			mkdirp.sync(directory);
			return [];
		}

		const files = fs.readdirSync(directory).filter((f) => f.endsWith(".json"));

		const emails = files
			.map((file) => {
				try {
					const email = JSON.parse(
						fs.readFileSync(path.join(directory, file), "utf8")
					);
					return email;
				} catch (error) {
					console.error(`Error parsing email file ${file}:`, error);
					return null;
				}
			})
			.filter((email) => email !== null);

		// Filter by user if specified
		let filteredEmails = emails;
		if (user) {
			if (type === "sent") {
				// For sent emails, filter by sender (email.user)
				filteredEmails = emails.filter((email) => email.user === user);
			} else {
				// For received emails, filter by recipient (email.to)
				const { normalizeEmail } = require("../utils/emailUtils");
				filteredEmails = emails.filter((email) => {
					const normalizedTo = normalizeEmail(email.to);
					return normalizedTo === user;
				});
			}
		}

		// Sort by date (newest first)
		const { parseDateFromStorage } = require("../utils/dateUtils");
		filteredEmails.sort(
			(a, b) => parseDateFromStorage(b.date) - parseDateFromStorage(a.date)
		);

		return filteredEmails;
	}

	/**
	 * Get single email by ID
	 * @param {string} emailId - Email identifier
	 * @returns {Object|null} Email object or null if not found
	 */
	getEmailById(emailId) {
		// Check both received and sent emails
		let emailPath = path.join(this.directories.parsed, `${emailId}.json`);
		let email = null;

		if (fs.existsSync(emailPath)) {
			email = JSON.parse(fs.readFileSync(emailPath, "utf8"));
		} else {
			emailPath = path.join(this.directories.sent, `${emailId}.json`);
			if (fs.existsSync(emailPath)) {
				email = JSON.parse(fs.readFileSync(emailPath, "utf8"));
			}
		}

		return email;
	}

	/**
	 * Get attachment file path
	 * @param {string} emailId - Email identifier
	 * @param {string} filename - Attachment filename
	 * @param {string} type - Email type ('received' or 'sent')
	 * @returns {string} Full path to attachment file
	 */
	getAttachmentPath(emailId, filename, type = "received") {
		const attachmentsDir =
			type === "sent"
				? this.directories.sentAttachments
				: this.directories.attachments;
		// Ensure an absolute path is returned for sendFile
		return path.resolve(attachmentsDir, emailId, filename);
	}

	/**
	 * Check if attachment exists
	 * @param {string} emailId - Email identifier
	 * @param {string} filename - Attachment filename
	 * @param {string} type - Email type ('received' or 'sent')
	 * @returns {boolean} True if attachment exists
	 */
	attachmentExists(emailId, filename, type = "received") {
		const attachmentPath = this.getAttachmentPath(emailId, filename, type);
		return fs.existsSync(attachmentPath);
	}

	/**
	 * Move uploaded file to sent attachments
	 * @param {string} emailId - Email identifier
	 * @param {string} sourcePath - Source file path
	 * @param {string} filename - Target filename
	 */
	moveUploadedAttachment(emailId, sourcePath, filename) {
		const sentAttachmentsDir = path.join(
			this.directories.sentAttachments,
			emailId
		);
		mkdirp.sync(sentAttachmentsDir);

		const destPath = path.join(sentAttachmentsDir, filename);
		fs.copyFileSync(sourcePath, destPath);
		fs.unlinkSync(sourcePath); // Remove temp file
	}
}

module.exports = new StorageService();
