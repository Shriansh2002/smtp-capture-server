/**
 * Email utility functions for processing and validation
 */

/**
 * Normalize email address by removing quotes and extracting from angle brackets
 * @param {string} email - Email address to normalize
 * @returns {string} Normalized email address
 */
function normalizeEmail(email) {
	if (!email) return "";

	email = email.replace(/"/g, "");

	const match = email.match(/<(.+?)>/);
	if (match) {
		return match[1];
	}

	return email.trim();
}

/**
 * Extract domain from email address
 * @param {string} email - Email address
 * @returns {string} Domain part of email
 */
function extractDomain(email) {
	if (!email) return "";
	const parts = email.split("@");
	return parts.length > 1 ? parts[1].toLowerCase() : "";
}

/**
 * Validate email format
 * @param {string} email - Email address to validate
 * @returns {boolean} True if valid email format
 */
function isValidEmail(email) {
	if (!email) return false;
	
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}

/**
 * Check if email domain is allowed
 * @param {string} email - Email address
 * @param {string[]} allowedDomains - List of allowed domains
 * @returns {boolean} True if domain is allowed
 */
function isAllowedDomain(email, allowedDomains) {
	const domain = extractDomain(email);
	return allowedDomains.includes(domain);
}

/**
 * Format email for display
 * @param {string} email - Email address
 * @returns {string} Formatted email for display
 */
function formatEmailForDisplay(email) {
	const normalized = normalizeEmail(email);
	return normalized || email;
}

module.exports = {
	normalizeEmail,
	extractDomain,
	isValidEmail,
	isAllowedDomain,
	formatEmailForDisplay
};
