/**
 * User service backed by Postgres
 */

const pool = require("../config/db");

class UserService {
	/**
	 * Find user by email
	 * @param {string} email
	 * @returns {Promise<object|null>}
	 */
	async findByEmail(email) {
		if (!email) return null;
		const { rows } = await pool.query(
			`SELECT id, email, password, api_key AS "apiKey", is_active AS "isActive" FROM users WHERE email = $1 LIMIT 1`,
			[email.toLowerCase()]
		);
		return rows[0] || null;
	}

	/**
	 * Validate API auth (email + apiKey)
	 * @param {string} email
	 * @param {string} apiKey
	 * @returns {Promise<object|null>}
	 */
	async validateApiAuth(email, apiKey) {
		const user = await this.findByEmail(email);
		if (!user) return null;
		if (apiKey && user.apiKey !== apiKey) return null;
		return user;
	}

	/**
	 * Validate SMTP auth (email + password)
	 * @param {string} email
	 * @param {string} password
	 * @returns {Promise<object|null>}
	 */
	async validateSmtpAuth(email, password) {
		const user = await this.findByEmail(email);
		if (!user) return null;
		if (user.password !== password) return null;
		return user;
	}

	/**
	 * List user emails (non-sensitive)
	 * @returns {Promise<Array<{email: string}>>}
	 */
	async listUsers() {
		const { rows } = await pool.query(
			`SELECT email FROM users ORDER BY email ASC`
		);
		return rows.map((r) => ({ email: r.email }));
	}
}

module.exports = new UserService();
