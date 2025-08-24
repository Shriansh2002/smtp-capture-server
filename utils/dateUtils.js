/**
 * Date utility functions for email handling
 */

/**
 * Get local date from various input formats
 * @param {Date|string|null} date - Date to process
 * @returns {Date} Local date object
 */
function getLocalDate(date = null) {
	// If no date provided, use current time
	if (!date) {
		return new Date();
	}

	// If date is already a Date object, return it as is
	if (date instanceof Date) {
		return date;
	}

	// If date is a string or other format, parse it
	return new Date(date);
}

/**
 * Format date for storage in JSON files
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 */
function formatDateForStorage(date) {
	// Store date as local timezone string to preserve timezone information
	const localDate = new Date(date);
	return localDate.toString();
}

/**
 * Parse date from storage string
 * @param {string} dateString - Date string from storage
 * @returns {Date} Parsed date object
 */
function parseDateFromStorage(dateString) {
	// Parse date from storage and return as local Date object
	return new Date(dateString);
}

/**
 * Generate a unique email ID
 * @returns {string} Unique email identifier
 */
function generateEmailId() {
	return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

module.exports = {
	getLocalDate,
	formatDateForStorage,
	parseDateFromStorage,
	generateEmailId
};
