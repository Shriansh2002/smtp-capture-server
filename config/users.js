/**
 * User configuration for the mail server
 * Contains user credentials and API keys
 */

const USERS = {
	"user_a@domain.com": {
		password: "password_a",
		apiKey: "api_key_a",
		isActive: true,
	},
	"user_b@domain.com": {
		password: "password_b",
		apiKey: "api_key_b",
		isActive: false,
	},
	// Add more users as needed
};

module.exports = USERS;
