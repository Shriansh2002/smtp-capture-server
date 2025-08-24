# Custom Mail Server Backend

A modular, production-ready email server with SMTP receiving capabilities and REST API for email management.

## 🏗️ Architecture

The codebase follows a clean, modular architecture with clear separation of concerns:

```
email-server/
├── config/
│   ├── users.js                 # User configuration (credentials & API keys)
│   └── server.js                # Server configuration (SMTP & API settings)
├── smtp/
│   └── server.js                # SMTP server implementation
├── api/
│   ├── routes/
│   │   ├── auth.js              # Authentication routes (/auth/login)
│   │   ├── emails.js            # Received email routes (/emails/*)
│   │   ├── sent-emails.js       # Sent email routes (/sent-emails/*)
│   │   ├── all-emails.js        # Combined email routes (/all-emails)
│   │   ├── send.js              # Email sending routes (/send/*)
│   │   ├── users.js             # User management routes (/users)
│   │   └── health.js            # Health check routes (/health)
│   └── index.js                 # Express app & route registration
├── services/
│   ├── emailService.js          # Email business logic
│   └── storageService.js        # File system operations
├── utils/
│   ├── dateUtils.js             # Date handling utilities
│   └── emailUtils.js            # Email processing utilities
├── emails/                      # Runtime storage directories
├── uploads/                     # Temporary upload directory
├── index.js                     # Application entry point
└── package.json
```

## 🚀 Features

### SMTP Server

- **Email Reception**: Receives emails on port 25
- **Domain Filtering**: Only accepts emails for configured domains
- **Authentication**: Supports user authentication for sending
- **Attachment Handling**: Automatically saves email attachments
- **Error Handling**: Comprehensive error logging and recovery

### REST API

- **Authentication**: API key-based authentication
- **Email Management**: Retrieve, send, and manage emails
- **Attachment Support**: Upload and download email attachments
- **User Management**: User listing and validation
- **Health Monitoring**: System health and status endpoints

### Storage

- **Structured Storage**: Organized email storage by type
- **Raw Email Storage**: Preserves original email format
- **Parsed Metadata**: JSON storage for easy querying
- **Attachment Management**: Separate storage for attachments
- **Error Logging**: Detailed error tracking

## 📦 Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/Shriansh2002/smtp-capture-server.git
   cd custom-mail-server-backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure users**
   Edit `config/users.js` to add your users:

   ```javascript
   const USERS = {
   	"user@domain.com": {
   		password: "your_password",
   		apiKey: "your_api_key",
   	},
   };
   ```

4. **Configure server settings**
   Edit `config/server.js` to customize:

   - SMTP server host/port
   - API server host/port
   - Allowed domains
   - Storage directories

5. **Start the server**
   ```bash
   npm start
   ```

## 🔧 Configuration

### Server Configuration (`config/server.js`)

```javascript
const SERVER_CONFIG = {
	smtp: {
		host: "0.0.0.0",
		port: 25,
		allowedDomains: ["google.in", "domain.com"],
		authOptional: true,
	},
	api: {
		host: "0.0.0.0",
		port: 4000,
	},
	storage: {
		directories: {
			raw: "emails/raw",
			parsed: "emails/parsed",
			attachments: "emails/attachments",
			errors: "emails/errors",
			sent: "emails/sent",
			sentAttachments: "emails/sent_attachments",
			uploads: "uploads",
		},
	},
};
```

### User Configuration (`config/users.js`)

```javascript
const USERS = {
	"user@domain.com": {
		password: "smtp_password",
		apiKey: "api_key_for_rest_api",
	},
};
```

## 📡 API Endpoints

### Authentication

- `POST /auth/login` - Authenticate user with API key

### Email Management

- `GET /emails` - Get received emails
- `GET /emails/:id` - Get specific received email
- `GET /emails/:id/attachments/:filename` - Get received email attachment
- `GET /sent-emails` - Get sent emails
- `GET /sent-emails/:id` - Get specific sent email
- `GET /sent-emails/:id/attachments/:filename` - Get sent email attachment
- `GET /all-emails` - Get all emails (sent + received)

### Email Sending

- `POST /send/email` - Send email with attachments

### System

- `GET /users` - List all users
- `GET /health` - System health check
- `GET /` - API information

## 🔐 Authentication

The API uses API key authentication:

1. **Get API Key**: Configure in `config/users.js`
2. **Include in Requests**: Add to request body or headers
3. **User Validation**: API validates user and API key combination

Example:

```bash
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "user@domain.com", "apiKey": "your_api_key"}'
```

## 📧 Email Sending

Send emails via REST API:

```bash
curl -X POST http://localhost:4000/send/email \
  -F "user=user@domain.com" \
  -F "apiKey=your_api_key" \
  -F "to=recipient@example.com" \
  -F "subject=Test Email" \
  -F "text=Hello World" \
  -F "attachments=@file.pdf"
```

## 🛡️ Security Features

- **Domain Filtering**: Only accepts emails for configured domains
- **Authentication Required**: API key authentication for all operations
- **User Isolation**: Users can only access their own emails
- **Input Validation**: Comprehensive validation of all inputs
- **Error Handling**: Secure error responses without sensitive data

## 🧪 Testing

Run the test suite:

```bash
# Test SMTP functionality
npm run test:mail-server

# Test API endpoints
npm run test:api

# Run all tests
npm run test:all
```

## 📊 Monitoring

### Health Check

Monitor system health:

```bash
curl http://localhost:4000/health
```

Response includes:

- System status
- Directory availability
- User count
- Server configuration

### Logging

- **SMTP Logs**: Email reception and processing
- **API Logs**: Request/response logging
- **Error Logs**: Detailed error tracking in `emails/errors/`

## 🔄 Development

### Adding New Features

1. **Services**: Add business logic to `services/`
2. **Routes**: Create new route files in `api/routes/`
3. **Utils**: Add utility functions to `utils/`
4. **Config**: Update configuration files in `config/`

### Code Style

- **ES6+**: Use modern JavaScript features
- **JSDoc**: Document all functions and classes
- **Error Handling**: Comprehensive error handling
- **Modularity**: Keep functions small and focused

## 🚀 Deployment

### Production Considerations

1. **Environment Variables**: Use environment variables for sensitive data
2. **SSL/TLS**: Configure SSL certificates for secure communication
3. **Firewall**: Configure firewall rules for SMTP and API ports
4. **Monitoring**: Set up monitoring and alerting
5. **Backup**: Regular backup of email storage

## 📝 License

This project is licensed under the MIT License.