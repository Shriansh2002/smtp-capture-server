const axios = require("axios");
const nodemailer = require("nodemailer");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");

// Configuration
const API_BASE_URL = "http://localhost:4000";
const SMTP_HOST = "127.0.0.1";
const SMTP_PORT = 25;

const USERS = {
	"user_a@domain.com": { password: "password_a", apiKey: "api_key_a" },
	"user_b@domain.com": { password: "password_b", apiKey: "api_key_b" },
};

// Test results tracking
let testResults = {
	passed: 0,
	failed: 0,
	tests: [],
};

function logTest(name, passed, details = "") {
	const status = passed ? "✅ PASS" : "❌ FAIL";
	console.log(`${status} ${name}`);
	if (details) console.log(`   ${details}`);

	testResults.tests.push({ name, passed, details });
	if (passed) testResults.passed++;
	else testResults.failed++;
}

// Helper function to create test file
function createTestFile() {
	const testContent = "This is a test attachment file.";
	const testFilePath = path.join(__dirname, "test-attachment.txt");
	fs.writeFileSync(testFilePath, testContent);
	return testFilePath;
}

// Helper function to clean up test file
function cleanupTestFile(filePath) {
	if (fs.existsSync(filePath)) {
		fs.unlinkSync(filePath);
	}
}

// Test API endpoints
async function testAPIEndpoints() {
	console.log("\n🌐 Testing API Endpoints...\n");

	// Test 1: Get users list
	try {
		const response = await axios.get(`${API_BASE_URL}/users`);
		const users = response.data;
		const expectedUsers = Object.keys(USERS);

		const passed =
			users.length === expectedUsers.length &&
			expectedUsers.every((user) => users.some((u) => u.username === user));

		logTest(
			"GET /users",
			passed,
			`Found ${users.length} users: ${users.map((u) => u.username).join(", ")}`
		);
	} catch (error) {
		logTest("GET /users", false, error.message);
	}

	// Test 2: Get received emails (should be empty initially)
	try {
		const response = await axios.get(`${API_BASE_URL}/emails`);
		const emails = response.data;
		logTest(
			"GET /emails (received)",
			true,
			`Found ${emails.length} received emails`
		);
	} catch (error) {
		logTest("GET /emails (received)", false, error.message);
	}

	// Test 3: Get sent emails (should be empty initially)
	try {
		const response = await axios.get(`${API_BASE_URL}/sent-emails`);
		const emails = response.data;
		logTest("GET /sent-emails", true, `Found ${emails.length} sent emails`);
	} catch (error) {
		logTest("GET /sent-emails", false, error.message);
	}

	// Test 4: Get all emails
	try {
		const response = await axios.get(`${API_BASE_URL}/all-emails`);
		const emails = response.data;
		logTest("GET /all-emails", true, `Found ${emails.length} total emails`);
	} catch (error) {
		logTest("GET /all-emails", false, error.message);
	}

	// Test 5: Get emails for specific user
	try {
		const response = await axios.get(
			`${API_BASE_URL}/emails?user=user_a@domain.com`
		);
		const emails = response.data;
		logTest(
			"GET /emails?user=user_a@domain.com",
			true,
			`Found ${emails.length} emails for user_a`
		);
	} catch (error) {
		logTest("GET /emails?user=user_a@domain.com", false, error.message);
	}
}

// Test sending emails via API
async function testSendEmailsViaAPI() {
	console.log("\n📤 Testing Send Email API...\n");

	const testFilePath = createTestFile();

	try {
		// Test sending email from user_a to user_b
		const formData = new FormData();
		formData.append("from", "user_a@domain.com");
		formData.append("to", "user_b@domain.com");
		formData.append("subject", "Test Email from API - User A to User B");
		formData.append(
			"text",
			"This is a test email sent via API from user_a to user_b"
		);
		formData.append(
			"html",
			"<p>This is a <b>test email</b> sent via API from user_a to user_b</p>"
		);
		formData.append("user", "user_a@domain.com");
		formData.append("apiKey", "api_key_a");
		formData.append("attachments", fs.createReadStream(testFilePath));

		const response = await axios.post(`${API_BASE_URL}/send-email`, formData, {
			headers: {
				...formData.getHeaders(),
			},
		});

		logTest(
			"POST /send-email (user_a to user_b)",
			response.data.success,
			`Message ID: ${response.data.messageId}`
		);
	} catch (error) {
		logTest(
			"POST /send-email (user_a to user_b)",
			false,
			error.response?.data?.error || error.message
		);
	}

	try {
		// Test sending email from user_b to user_a
		const formData = new FormData();
		formData.append("from", "user_b@domain.com");
		formData.append("to", "user_a@domain.com");
		formData.append("subject", "Test Email from API - User B to User A");
		formData.append(
			"text",
			"This is a test email sent via API from user_b to user_a"
		);
		formData.append(
			"html",
			"<p>This is a <b>test email</b> sent via API from user_b to user_a</p>"
		);
		formData.append("user", "user_b@domain.com");
		formData.append("apiKey", "api_key_b");

		const response = await axios.post(`${API_BASE_URL}/send-email`, formData, {
			headers: {
				...formData.getHeaders(),
			},
		});

		logTest(
			"POST /send-email (user_b to user_a)",
			response.data.success,
			`Message ID: ${response.data.messageId}`
		);
	} catch (error) {
		logTest(
			"POST /send-email (user_b to user_a)",
			false,
			error.response?.data?.error || error.message
		);
	}

	// Test invalid user
	try {
		const formData = new FormData();
		formData.append("from", "invalid@domain.com");
		formData.append("to", "user_a@domain.com");
		formData.append("subject", "This should fail");
		formData.append("text", "This should not be sent");
		formData.append("user", "invalid@domain.com");
		formData.append("apiKey", "wrong_api_key");

		await axios.post(`${API_BASE_URL}/send-email`, formData, {
			headers: {
				...formData.getHeaders(),
			},
		});

		logTest(
			"POST /send-email (invalid user)",
			false,
			"Should have failed but succeeded"
		);
	} catch (error) {
		logTest(
			"POST /send-email (invalid user)",
			true,
			"Correctly rejected invalid user"
		);
	}

	cleanupTestFile(testFilePath);
}

// Test sending emails via SMTP
async function testSendEmailsViaSMTP() {
	console.log("\n📧 Testing SMTP Email Sending...\n");

	// Test user_a sending to user_b via SMTP
	try {
		const transporter = nodemailer.createTransport({
			host: SMTP_HOST,
			port: SMTP_PORT,
			secure: false,
			auth: {
				user: "user_a@domain.com",
				pass: "password_a",
			},
			tls: { rejectUnauthorized: false },
		});

		const info = await transporter.sendMail({
			from: '"User A" <user_a@domain.com>',
			to: "user_b@domain.com",
			subject: "Test Email via SMTP - User A to User B",
			text: "This is a test email sent via SMTP from user_a to user_b",
			html: "<p>This is a <b>test email</b> sent via SMTP from user_a to user_b</p>",
		});

		logTest(
			"SMTP Send (user_a to user_b)",
			true,
			`Message ID: ${info.messageId}`
		);
	} catch (error) {
		logTest("SMTP Send (user_a to user_b)", false, error.message);
	}

	// Test user_b sending to user_a via SMTP with attachment
	try {
		const transporter = nodemailer.createTransport({
			host: SMTP_HOST,
			port: SMTP_PORT,
			secure: false,
			auth: {
				user: "user_b@domain.com",
				pass: "password_b",
			},
			tls: { rejectUnauthorized: false },
		});

		const testFilePath = createTestFile();

		const info = await transporter.sendMail({
			from: '"User B" <user_b@domain.com>',
			to: "user_a@domain.com",
			subject: "Test Email via SMTP with Attachment - User B to User A",
			text: "This is a test email with attachment sent via SMTP from user_b to user_a",
			html: "<p>This is a <b>test email with attachment</b> sent via SMTP from user_b to user_a</p>",
			attachments: [
				{
					filename: "test-attachment.txt",
					content: "This is a test attachment sent via SMTP",
				},
			],
		});

		cleanupTestFile(testFilePath);
		logTest(
			"SMTP Send with attachment (user_b to user_a)",
			true,
			`Message ID: ${info.messageId}`
		);
	} catch (error) {
		logTest(
			"SMTP Send with attachment (user_b to user_a)",
			false,
			error.message
		);
	}

	// Test invalid SMTP authentication
	try {
		const transporter = nodemailer.createTransport({
			host: SMTP_HOST,
			port: SMTP_PORT,
			secure: false,
			auth: {
				user: "invalid@domain.com",
				pass: "wrong_password",
			},
			tls: { rejectUnauthorized: false },
		});

		await transporter.sendMail({
			from: '"Invalid User" <invalid@domain.com>',
			to: "user_a@domain.com",
			subject: "This should fail",
			text: "This should not be sent",
		});

		logTest(
			"SMTP Send (invalid auth)",
			false,
			"Should have failed but succeeded"
		);
	} catch (error) {
		logTest(
			"SMTP Send (invalid auth)",
			true,
			"Correctly rejected invalid credentials"
		);
	}
}

// Test email retrieval after sending
async function testEmailRetrieval() {
	console.log("\n📥 Testing Email Retrieval...\n");

	// Wait a moment for emails to be processed
	await new Promise((resolve) => setTimeout(resolve, 2000));

	// Test getting received emails for user_a
	try {
		const response = await axios.get(
			`${API_BASE_URL}/emails?user=user_a@domain.com`
		);
		const emails = response.data;
		logTest(
			"GET /emails?user=user_a@domain.com",
			true,
			`Found ${emails.length} received emails for user_a`
		);

		if (emails.length > 0) {
			const email = emails[0];
			logTest(
				"Email structure validation",
				email.id && email.from && email.to && email.subject && email.date,
				`Email ID: ${email.id}, From: ${email.from}, To: ${email.to}`
			);
		}
	} catch (error) {
		logTest("GET /emails?user=user_a@domain.com", false, error.message);
	}

	// Test getting received emails for user_b
	try {
		const response = await axios.get(
			`${API_BASE_URL}/emails?user=user_b@domain.com`
		);
		const emails = response.data;
		logTest(
			"GET /emails?user=user_b@domain.com",
			true,
			`Found ${emails.length} received emails for user_b`
		);
	} catch (error) {
		logTest("GET /emails?user=user_b@domain.com", false, error.message);
	}

	// Test getting sent emails for user_a
	try {
		const response = await axios.get(
			`${API_BASE_URL}/sent-emails?user=user_a@domain.com`
		);
		const emails = response.data;
		logTest(
			"GET /sent-emails?user=user_a@domain.com",
			true,
			`Found ${emails.length} sent emails for user_a`
		);
	} catch (error) {
		logTest("GET /sent-emails?user=user_a@domain.com", false, error.message);
	}

	// Test getting sent emails for user_b
	try {
		const response = await axios.get(
			`${API_BASE_URL}/sent-emails?user=user_b@domain.com`
		);
		const emails = response.data;
		logTest(
			"GET /sent-emails?user=user_b@domain.com",
			true,
			`Found ${emails.length} sent emails for user_b`
		);
	} catch (error) {
		logTest("GET /sent-emails?user=user_b@domain.com", false, error.message);
	}

	// Test getting all emails for user_a
	try {
		const response = await axios.get(
			`${API_BASE_URL}/all-emails?user=user_a@domain.com`
		);
		const emails = response.data;
		logTest(
			"GET /all-emails?user=user_a@domain.com",
			true,
			`Found ${emails.length} total emails for user_a`
		);
	} catch (error) {
		logTest("GET /all-emails?user=user_a@domain.com", false, error.message);
	}

	// Test getting all emails for user_b
	try {
		const response = await axios.get(
			`${API_BASE_URL}/all-emails?user=user_b@domain.com`
		);
		const emails = response.data;
		logTest(
			"GET /all-emails?user=user_b@domain.com",
			true,
			`Found ${emails.length} total emails for user_b`
		);
	} catch (error) {
		logTest("GET /all-emails?user=user_b@domain.com", false, error.message);
	}
}

// Test individual email retrieval
async function testIndividualEmailRetrieval() {
	console.log("\n📄 Testing Individual Email Retrieval...\n");

	try {
		// Get a list of emails to test with
		const response = await axios.get(`${API_BASE_URL}/all-emails`);
		const emails = response.data;

		if (emails.length > 0) {
			const testEmail = emails[0];

			// Test getting individual email
			const emailResponse = await axios.get(
				`${API_BASE_URL}/emails/${testEmail.id}`
			);
			const email = emailResponse.data;

			logTest(
				`GET /emails/${testEmail.id}`,
				true,
				`Retrieved email: ${email.subject} from ${email.from} to ${email.to}`
			);

			// Test getting email with user filter
			const userResponse = await axios.get(
				`${API_BASE_URL}/emails/${testEmail.id}?user=${email.user}`
			);
			logTest(
				`GET /emails/${testEmail.id}?user=${email.user}`,
				true,
				`Retrieved email with user filter for ${email.user}`
			);

			// Test getting email with wrong user (should fail)
			try {
				await axios.get(
					`${API_BASE_URL}/emails/${testEmail.id}?user=wrong_user@domain.com`
				);
				logTest(
					`GET /emails/${testEmail.id}?user=wrong_user`,
					false,
					"Should have failed but succeeded"
				);
			} catch (error) {
				if (error.response?.status === 403) {
					logTest(
						`GET /emails/${testEmail.id}?user=wrong_user`,
						true,
						"Correctly denied access"
					);
				} else {
					logTest(
						`GET /emails/${testEmail.id}?user=wrong_user`,
						false,
						error.message
					);
				}
			}
		} else {
			logTest(
				"Individual email retrieval",
				true,
				"No emails available to test with"
			);
		}
	} catch (error) {
		logTest("Individual email retrieval", false, error.message);
	}
}

// Test attachment endpoints
async function testAttachmentEndpoints() {
	console.log("\n📎 Testing Attachment Endpoints...\n");

	try {
		// Get emails with attachments
		const response = await axios.get(`${API_BASE_URL}/all-emails`);
		const emails = response.data;

		const emailsWithAttachments = emails.filter(
			(email) => email.attachments && email.attachments.length > 0
		);

		if (emailsWithAttachments.length > 0) {
			const testEmail = emailsWithAttachments[0];
			const testAttachment = testEmail.attachments[0];

			// Test getting received attachment (only for received emails)
			if (testEmail.type === "received") {
				try {
					const attachmentResponse = await axios.get(
						`${API_BASE_URL}/emails/${testEmail.id}/attachments/${testAttachment.filename}`
					);
					logTest(
						`GET /emails/${testEmail.id}/attachments/${testAttachment.filename}`,
						true,
						`Retrieved received attachment: ${testAttachment.filename}`
					);
				} catch (error) {
					logTest(
						`GET /emails/${testEmail.id}/attachments/${testAttachment.filename}`,
						false,
						error.message
					);
				}
			}

			// Test getting sent attachment (only for sent emails)
			if (testEmail.type === "sent") {
				try {
					const attachmentResponse = await axios.get(
						`${API_BASE_URL}/sent-emails/${testEmail.id}/attachments/${testAttachment.filename}`
					);
					logTest(
						`GET /sent-emails/${testEmail.id}/attachments/${testAttachment.filename}`,
						true,
						`Retrieved sent attachment: ${testAttachment.filename}`
					);
				} catch (error) {
					logTest(
						`GET /sent-emails/${testEmail.id}/attachments/${testAttachment.filename}`,
						false,
						error.message
					);
				}
			}

			// Test both endpoints for emails that have attachments
			if (testEmail.type === "received") {
				logTest(
					"Received attachment endpoint test",
					true,
					`Email ${testEmail.id} has ${testEmail.attachments.length} attachment(s)`
				);
			} else if (testEmail.type === "sent") {
				logTest(
					"Sent attachment endpoint test",
					true,
					`Email ${testEmail.id} has ${testEmail.attachments.length} attachment(s)`
				);
			}
		} else {
			logTest(
				"Attachment endpoints",
				true,
				"No emails with attachments available to test with"
			);
		}
	} catch (error) {
		logTest("Attachment endpoints", false, error.message);
	}
}

// Main test runner
async function runAllTests() {
	console.log("🧪 Starting Comprehensive Mail Server Tests...\n");
	console.log("=".repeat(60));

	try {
		// Test API endpoints first
		await testAPIEndpoints();

		// Test sending emails via API
		await testSendEmailsViaAPI();

		// Test sending emails via SMTP
		await testSendEmailsViaSMTP();

		// Test email retrieval
		await testEmailRetrieval();

		// Test individual email retrieval
		await testIndividualEmailRetrieval();

		// Test attachment endpoints
		await testAttachmentEndpoints();
	} catch (error) {
		console.error("❌ Test suite failed:", error.message);
	}

	// Print summary
	console.log("\n" + "=".repeat(60));
	console.log("📊 TEST SUMMARY");
	console.log("=".repeat(60));
	console.log(`✅ Passed: ${testResults.passed}`);
	console.log(`❌ Failed: ${testResults.failed}`);
	console.log(
		`📈 Success Rate: ${(
			(testResults.passed / (testResults.passed + testResults.failed)) *
			100
		).toFixed(1)}%`
	);

	if (testResults.failed > 0) {
		console.log("\n❌ Failed Tests:");
		testResults.tests
			.filter((t) => !t.passed)
			.forEach((test) => {
				console.log(`   - ${test.name}: ${test.details}`);
			});
	}

	console.log("\n🎉 Test suite completed!");
}

// Run the tests
runAllTests().catch(console.error);
