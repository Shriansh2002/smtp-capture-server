require("dotenv").config();
const nodemailer = require("nodemailer");

async function sendTestEmail() {
	// Test with user_a@domain.com
	const testUser = "user_a@domain.com";
	const testPassword = "password_a";

	// Connect to local SMTP server on port 25 with authentication
	const transporter = nodemailer.createTransport({
		host: "127.0.0.1",
		port: 25,
		secure: false,
		auth: {
			user: testUser,
			pass: testPassword,
		},
		tls: {
			rejectUnauthorized: false,
		},
	});

	try {
		let info = await transporter.sendMail({
			from: `"${testUser}" <${testUser}>`,
			to: "user_b@domain.com",
			subject: "Test Email with User Authentication",
			text: "This is a test email sent with user authentication.",
			html: "<p>This is a <b>test email</b> sent with user authentication.</p>",
			attachments: [],
		});

		console.log("✅ Test email sent:", info.messageId);
		console.log("📧 From:", testUser);
		console.log("📧 To: user_b@domain.com");
	} catch (err) {
		console.error("❌ Failed to send test email:", err);
	}
}

async function sendTestEmailAsUserB() {
	// Test with user_b@domain.com
	const testUser = "user_b@domain.com";
	const testPassword = "password_b";

	// Connect to local SMTP server on port 25 with authentication
	const transporter = nodemailer.createTransport({
		host: "127.0.0.1",
		port: 25,
		secure: false,
		auth: {
			user: testUser,
			pass: testPassword,
		},
		tls: {
			rejectUnauthorized: false,
		},
	});

	try {
		let info = await transporter.sendMail({
			from: `"${testUser}" <${testUser}>`,
			to: "user_a@domain.com",
			subject: "Reply from User B",
			text: "This is a reply email from user_b@domain.com.",
			html: "<p>This is a <b>reply email</b> from user_b@domain.com.</p>",
			attachments: [],
		});

		console.log("✅ Test email sent:", info.messageId);
		console.log("📧 From:", testUser);
		console.log("📧 To: user_a@domain.com");
	} catch (err) {
		console.error("❌ Failed to send test email:", err);
	}
}

async function testInvalidUser() {
	// Test with invalid credentials
	const testUser = "invalid@domain.com";
	const testPassword = "wrong_password";

	// Connect to local SMTP server on port 25 with authentication
	const transporter = nodemailer.createTransport({
		host: "127.0.0.1",
		port: 25,
		secure: false,
		auth: {
			user: testUser,
			pass: testPassword,
		},
		tls: {
			rejectUnauthorized: false,
		},
	});

	try {
		let info = await transporter.sendMail({
			from: `"${testUser}" <${testUser}>`,
			to: "user_a@domain.com",
			subject: "This should fail",
			text: "This email should not be sent due to invalid credentials.",
			attachments: [],
		});

		console.log("❌ This should not have succeeded:", info.messageId);
	} catch (err) {
		console.log("✅ Expected authentication failure:", err.message);
	}
}

async function runAllTests() {
	console.log("🧪 Running SMTP authentication tests...\n");

	console.log("1. Testing with user_a@domain.com:");
	await sendTestEmail();
	console.log("");

	console.log("2. Testing with user_b@domain.com:");
	await sendTestEmailAsUserB();
	console.log("");

	console.log("3. Testing with invalid credentials:");
	await testInvalidUser();
	console.log("");

	console.log("🎉 All tests completed!");
}

// Run all tests
runAllTests();
