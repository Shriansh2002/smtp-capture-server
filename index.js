const SMTPServer = require("smtp-server").SMTPServer;
const { simpleParser } = require("mailparser");
const fs = require("fs");
const path = require("path");
const mkdirp = require("mkdirp");

mkdirp.sync("emails/raw");
mkdirp.sync("emails/parsed");
mkdirp.sync("emails/attachments");
mkdirp.sync("emails/errors");

const server = new SMTPServer({
	authOptional: true,
	onData(stream, session, callback) {
		let rawChunks = [];
		stream.on("data", (chunk) => rawChunks.push(chunk));

		stream.on("end", async () => {
			// Unique email ID: timestamp + random string
			const emailId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
			const rawPath = path.join("emails/raw", `${emailId}.eml`);
			const parsedPath = path.join("emails/parsed", `${emailId}.json`);
			const attachmentsDir = path.join("emails/attachments", emailId);
			mkdirp.sync(attachmentsDir);

			try {
				const rawEmail = Buffer.concat(rawChunks);

				// Save raw email
				fs.writeFileSync(rawPath, rawEmail);

				// Parse email
				const parsed = await simpleParser(rawEmail);

				// Save parsed JSON
				fs.writeFileSync(
					parsedPath,
					JSON.stringify(
						{
							id: emailId,
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

				// Save attachments in dedicated folder
				for (const att of parsed.attachments) {
					const filename =
						att.filename ||
						`attachment-${Date.now()}-${Math.random().toString(36).slice(2)}`;
					const attachmentPath = path.join(attachmentsDir, filename);
					fs.writeFileSync(attachmentPath, att.content);
				}

				console.log(`✅ Email saved: ${parsed.subject || "No Subject"}`);
				callback();
			} catch (err) {
				console.error(`❌ Parsing failed for email ${emailId}:`, err);

				// Save error details
				fs.writeFileSync(
					path.join("emails/errors", `${emailId}.error.json`),
					JSON.stringify(
						{
							id: emailId,
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

server.listen(25, "0.0.0.0", () => {
	console.log("📬 SMTP Server running on port 25");
});
