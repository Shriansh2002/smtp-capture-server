// -------------------- IMPORTS --------------------
const SMTPServer = require("smtp-server").SMTPServer;
const { simpleParser } = require("mailparser");
const fs = require("fs");
const path = require("path");
const mkdirp = require("mkdirp");
const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const multer = require("multer");

// -------------------- USER CONFIGURATION --------------------
const USERS = {
	"user_a@domain.com": { password: "password_a", apiKey: "api_key_a" },
	"user_b@domain.com": { password: "password_b", apiKey: "api_key_b" },
	// Add more users as needed
};

// -------------------- CREATE DIRECTORIES --------------------
mkdirp.sync("emails/raw");
mkdirp.sync("emails/parsed"); // received emails
mkdirp.sync("emails/attachments"); // received email attachments
mkdirp.sync("emails/errors");
mkdirp.sync("emails/sent"); // sent emails
mkdirp.sync("emails/sent_attachments"); // sent email attachments

// -------------------- SMTP SERVER (RECEIVING) --------------------

const allowedDomains = ["google.in", "domain.com"];

const smtpServer = new SMTPServer({
	authOptional: true,
	onAuth(auth, session, callback) {
		// Only used for sending mail (client-authenticated SMTP)
		const { username, password } = auth;

		if (USERS[username] && USERS[username].password === password) {
			session.user = username;
			callback(null, { user: username });
		} else {
			callback(new Error("Invalid username or password"));
		}
	},
	onMailFrom(address, session, callback) {
		callback();
	},
	onRcptTo(address, session, callback) {
		// Only allow RCPT TO for our allowed domains
		const domain = address.address.split("@")[1]?.toLowerCase();
		if (allowedDomains.includes(domain)) {
			return callback();
		}
		return callback(
			new Error("Relay access denied: recipient domain not allowed")
		);
	},
	onData(stream, session, callback) {
		let rawChunks = [];
		stream.on("data", (chunk) => rawChunks.push(chunk));

		stream.on("end", async () => {
			const emailId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
			const rawPath = path.join("emails/raw", `${emailId}.eml`);
			const parsedPath = path.join("emails/parsed", `${emailId}.json`);
			const attachmentsDir = path.join("emails/attachments", emailId);
			mkdirp.sync(attachmentsDir);

			try {
				const rawEmail = Buffer.concat(rawChunks);
				fs.writeFileSync(rawPath, rawEmail);

				const parsed = await simpleParser(rawEmail);

				fs.writeFileSync(
					parsedPath,
					JSON.stringify(
						{
							id: emailId,
							type: "received",
							user: session.user || null,
							from: parsed.from?.text,
							to: parsed.to?.text,
							subject: parsed.subject,
							date: parsed.date,
							text: parsed.text,
							html: parsed.html,
							attachments: parsed.attachments.map((att) => ({
								filename: att.filename,
								contentType: att.contentType,
								size: att.size,
							})),
						},
						null,
						2
					)
				);

				// Save attachments
				for (const att of parsed.attachments) {
					const filename =
						att.filename ||
						`attachment-${Date.now()}-${Math.random().toString(36).slice(2)}`;
					fs.writeFileSync(path.join(attachmentsDir, filename), att.content);
				}

				console.log(`✅ Email received: ${parsed.subject || "No Subject"}`);
				callback();
			} catch (err) {
				console.error(`❌ Parsing failed for ${emailId}:`, err);
				fs.writeFileSync(
					path.join("emails/errors", `${emailId}.error.json`),
					JSON.stringify(
						{
							id: emailId,
							user: session.user || null,
							error: err.message,
							stack: err.stack,
						},
						null,
						2
					)
				);

				callback(err);
			}
		});
	},
});

const EC2_SERVER_IP = "0.0.0.0";
const PORT = 25;

smtpServer.listen(PORT, EC2_SERVER_IP, () => {
	console.log(`📬 SMTP Server running on port ${PORT}`);
});

// -------------------- EXPRESS API --------------------
const app = express();
app.use(cors());
app.use(express.json());

// -------------------- HELPER FUNCTIONS --------------------
function normalizeEmail(email) {
	if (!email) return "";

	email = email.replace(/"/g, "");

	const match = email.match(/<(.+?)>/);
	if (match) {
		return match[1];
	}

	return email.trim();
}

function getEmailsByUserAndType(user, type) {
	const directory = type === "sent" ? "emails/sent" : "emails/parsed";
	const files = fs.readdirSync(directory).filter((f) => f.endsWith(".json"));

	const emails = files.map((file) => {
		const email = JSON.parse(
			fs.readFileSync(path.join(directory, file), "utf8")
		);
		return email;
	});

	// Filter by user if specified
	let filteredEmails = emails;
	if (user) {
		if (type === "sent") {
			// For sent emails, filter by sender (email.user)
			filteredEmails = emails.filter((email) => email.user === user);
		} else {
			// For received emails, filter by recipient (email.to)
			filteredEmails = emails.filter((email) => {
				const normalizedTo = normalizeEmail(email.to);
				return normalizedTo === user;
			});
		}
	}

	// Sort by date (newest first)
	filteredEmails.sort((a, b) => new Date(b.date) - new Date(a.date));

	return filteredEmails;
}
// -------------------- AUTHENTICATION --------------------
app.post("/auth/login", (req, res) => {
	const { username, apiKey } = req.body;

	if (!username || !USERS[username]) {
		return res.status(401).json({
			success: false,
			error: "Invalid username or user not found",
		});
	}

	const userConfig = USERS[username];

	if (apiKey && userConfig.apiKey !== apiKey) {
		return res.status(401).json({
			success: false,
			error: "Invalid API key",
		});
	}

	res.json({
		success: true,
		user: {
			username: username,
		},
		message: "Authentication successful",
	});
});

// -------------------- GET RECEIVED EMAILS --------------------
app.get("/emails", (req, res) => {
	const { user, type } = req.query;

	if (type === "sent") {
		// Redirect to sent emails endpoint
		return res.redirect(`/sent-emails?user=${user || ""}`);
	}

	const emails = getEmailsByUserAndType(user, "received");
	res.json(emails);
});

// -------------------- GET SENT EMAILS --------------------
app.get("/sent-emails", (req, res) => {
	const { user } = req.query;
	const emails = getEmailsByUserAndType(user, "sent");
	res.json(emails);
});

// -------------------- GET ALL EMAILS (SENT + RECEIVED) --------------------
app.get("/all-emails", (req, res) => {
	const { user, type } = req.query;

	let emails = [];

	if (!type || type === "received") {
		const receivedEmails = getEmailsByUserAndType(user, "received");
		emails = emails.concat(receivedEmails);
	}

	if (!type || type === "sent") {
		const sentEmails = getEmailsByUserAndType(user, "sent");
		emails = emails.concat(sentEmails);
	}

	// Sort by date (newest first)
	emails.sort((a, b) => new Date(b.date) - new Date(a.date));

	res.json(emails);
});

// -------------------- GET SINGLE EMAIL --------------------
app.get("/emails/:id", (req, res) => {
	const { user } = req.query;

	// Check both received and sent emails
	let emailPath = path.join("emails/parsed", `${req.params.id}.json`);
	let email = null;

	if (fs.existsSync(emailPath)) {
		email = JSON.parse(fs.readFileSync(emailPath, "utf8"));
	} else {
		emailPath = path.join("emails/sent", `${req.params.id}.json`);
		if (fs.existsSync(emailPath)) {
			email = JSON.parse(fs.readFileSync(emailPath, "utf8"));
		}
	}

	if (!email) {
		return res.status(404).json({ error: "Email not found" });
	}

	// Filter by user if specified
	if (user && email.user !== user) {
		return res.status(403).json({ error: "Access denied" });
	}

	res.json(email);
});

// -------------------- GET RECEIVED ATTACHMENT --------------------
app.get("/emails/:id/attachments/:filename", (req, res) => {
	const { user } = req.query;
	const attachmentPath = path.join(
		"emails/attachments",
		req.params.id,
		req.params.filename
	);

	if (!fs.existsSync(attachmentPath)) {
		return res.status(404).json({ error: "Attachment not found" });
	}

	// Check user access for received emails
	if (user) {
		const emailPath = path.join("emails/parsed", `${req.params.id}.json`);
		if (fs.existsSync(emailPath)) {
			const email = JSON.parse(fs.readFileSync(emailPath, "utf8"));
			if (email.to !== user) {
				return res.status(403).json({ error: "Access denied" });
			}
		}
	}

	res.sendFile(path.resolve(attachmentPath));
});

// -------------------- GET SENT ATTACHMENT --------------------
app.get("/sent-emails/:id/attachments/:filename", (req, res) => {
	const { user } = req.query;
	const attachmentPath = path.join(
		"emails/sent_attachments",
		req.params.id,
		req.params.filename
	);

	if (!fs.existsSync(attachmentPath)) {
		return res.status(404).json({ error: "Attachment not found" });
	}

	// Check user access for sent emails
	if (user) {
		const emailPath = path.join("emails/sent", `${req.params.id}.json`);
		if (fs.existsSync(emailPath)) {
			const email = JSON.parse(fs.readFileSync(emailPath, "utf8"));
			if (email.user !== user) {
				return res.status(403).json({ error: "Access denied" });
			}
		}
	}

	res.sendFile(path.resolve(attachmentPath));
});

// -------------------- SEND EMAIL --------------------
const upload = multer({ dest: "uploads/" });

app.post("/send-email", upload.array("attachments"), async (req, res) => {
	try {
		const { to, subject, text, html, user, apiKey } = req.body;

		// Validate user and authentication
		if (!user || !USERS[user]) {
			return res.status(400).json({ success: false, error: "Invalid user" });
		}

		// Check authentication API key
		const userConfig = USERS[user];
		const isAuthenticated = apiKey && apiKey === userConfig.apiKey;

		if (!isAuthenticated) {
			return res
				.status(401)
				.json({ success: false, error: "Authentication failed" });
		}

		// Prevent open relay abuse — only allow sending FROM authenticated user
		const allowedDomain = user.split("@")[1].toLowerCase();
		const toDomain = (to || "").split("@")[1]?.toLowerCase();
		if (!toDomain) {
			return res
				.status(400)
				.json({ success: false, error: "Invalid recipient address" });
		}

		const attachments =
			req.files?.map((file) => ({
				filename: file.originalname,
				path: file.path,
			})) || [];

		const transporter = nodemailer.createTransport({
			host: EC2_SERVER_IP, // Local SMTP server (your EC2 instance)
			port: 25,
			secure: false,
			auth: {
				user: user,
				pass: userConfig.password, // Use stored password for SMTP
			},
			tls: { rejectUnauthorized: false },
		});

		const info = await transporter.sendMail({
			from: `"${user}" <${user}>`,
			to,
			subject,
			text,
			html,
			attachments,
		});

		// Save sent email info
		const emailId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
		const sentPath = path.join("emails/sent", `${emailId}.json`);
		const sentAttachmentsDir = path.join("emails/sent_attachments", emailId);
		mkdirp.sync(sentAttachmentsDir);

		fs.writeFileSync(
			sentPath,
			JSON.stringify(
				{
					id: emailId,
					type: "sent",
					user: user, // Add user information
					from: user,
					to,
					subject,
					date: new Date(),
					text,
					html,
					attachments: attachments.map((a) => ({
						filename: a.filename,
						size: fs.existsSync(a.path) ? fs.statSync(a.path).size : null,
					})),
				},
				null,
				2
			)
		);

		// Move attachments to sent_attachments folder & clean up temp files
		for (const file of attachments) {
			const destPath = path.join(sentAttachmentsDir, file.filename);
			fs.copyFileSync(file.path, destPath);
			fs.unlinkSync(file.path); // remove temp file
		}

		console.log(`✅ Email sent by ${user}: ${info.messageId}`);
		res.json({ success: true, messageId: info.messageId });
	} catch (err) {
		console.error("❌ Failed to send email:", err);
		res.status(500).json({ success: false, error: err.message });
	}
});

// -------------------- GET USERS LIST --------------------
app.get("/users", (req, res) => {
	const users = Object.keys(USERS).map((username) => ({
		username,
		// Don't expose passwords in the API
	}));
	res.json(users);
});

// -------------------- START API SERVER --------------------
app.listen(4000, () => {
	console.log("🌐 API Server running on port 4000");
});
