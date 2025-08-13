require("dotenv").config();
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

async function sendTestEmail() {
	// Create test attachments in /test/tmp if not exists
	const tmpDir = path.join(__dirname, "tmp");
	if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

	// Create a sample text file
	const textAttachmentPath = path.join(tmpDir, "note.txt");
	fs.writeFileSync(textAttachmentPath, "Hello from test attachment!");

	// Create a fake image file (not real image, just for testing)
	const imageAttachmentPath = path.join(tmpDir, "image.jpg");
	fs.writeFileSync(imageAttachmentPath, Buffer.alloc(100, 0xff));

	// Connect to local SMTP server on port 25
	const transporter = nodemailer.createTransport({
		host: "127.0.0.1",
		port: 25,
		secure: false,
		tls: {
			rejectUnauthorized: false,
		},
	});

	try {
		let info = await transporter.sendMail({
			from: '"Test Sender" <sender@example.com>',
			to: "recipient@example.com",
			subject: "Test Email with Attachments",
			text: "This is the plain text body.",
			html: "<p>This is the <b>HTML</b> body.</p>",
			attachments: [
				{
					filename: "note.txt",
					path: textAttachmentPath,
				},
				{
					filename: "image.jpg",
					path: imageAttachmentPath,
				},
			],
		});

		console.log("✅ Test email sent:", info.messageId);
	} catch (err) {
		console.error("❌ Failed to send test email:", err);
	}
}

sendTestEmail();
