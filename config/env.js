require("dotenv").config({
	path: "./.env.development.local",
});

module.exports = {
	SMTP_HOST: process.env.SMTP_HOST,
	SMTP_PORT: process.env.SMTP_PORT,
	API_HOST: process.env.API_HOST,
	API_PORT: process.env.API_PORT,
};
