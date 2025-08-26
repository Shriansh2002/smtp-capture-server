# Mail Server Backend

A production-ready email server with SMTP receiving capabilities and REST API for comprehensive email management. Built with Node.js, featuring modular architecture, secure authentication, and robust email processing.

## 🏗️ Architecture

The application follows a clean, modular architecture with clear separation of concerns:

```
mail-server-backend/
├── config/
│   ├── server.js                # Server configuration (SMTP & API settings)
│   └── users.js                 # User configuration (credentials & API keys)
├── smtp/
│   └── server.js                # SMTP server implementation
├── api/
│   ├── index.js                 # Express app & route registration
│   └── routes/
│       ├── auth.js              # Authentication routes (/auth/login)
│       ├── emails.js            # Received email routes (/emails/*)
│       ├── sent-emails.js       # Sent email routes (/sent-emails/*)
│       ├── all-emails.js        # Combined email routes (/all-emails)
│       ├── starred.js           # Starred email management (/starred/*)
│       ├── send.js              # Email sending routes (/send/*)
│       ├── users.js             # User management routes (/users)
│       └── health.js            # Health check routes (/health)
├── services/
│   ├── emailService.js          # Email business logic & processing
│   └── storageService.js        # File system operations & storage
├── utils/
│   ├── dateUtils.js             # Date handling utilities
│   └── emailUtils.js            # Email processing utilities
├── emails/                      # Runtime email storage directories
├── uploads/                     # Temporary upload directory
├── index.js                     # Application entry point
├── start.sh                     # Startup script
└── package.json
```

## 🚀 Features

### SMTP Server

- **Email Reception**: Receives emails on configurable port (default: 25)
- **Domain Filtering**: Only accepts emails for configured domains
- **User Authentication**: Supports SMTP authentication for sending
- **Raw Email Storage**: Preserves original email format
- **Attachment Processing**: Automatically extracts and stores attachments
- **Error Handling**: Comprehensive error logging and recovery

### REST API

- **API Key Authentication**: Secure authentication for all operations
- **Email Management**: Retrieve, send, star, and manage emails
- **Attachment Support**: Upload and download email attachments
- **User Management**: User listing and validation
- **Health Monitoring**: System health and status endpoints
- **CORS Support**: Cross-origin resource sharing enabled

### Storage System

- **Structured Storage**: Organized email storage by type (received, sent, starred)
- **Raw Email Preservation**: Maintains original email format
- **Parsed Metadata**: JSON storage for easy querying and filtering
- **Attachment Management**: Separate storage for email attachments
- **Error Logging**: Detailed error tracking and storage

## 📦 Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/Shriansh2002/Mail-Server-Backend
   cd Mail-Server-Backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**
   Create `.env.development.local` in the root directory:

   ```bash
   SMTP_HOST="0.0.0.0"
   API_HOST="0.0.0.0"
   SMTP_PORT=25
   API_PORT=4000
   ```

4. **Configure users**
   Edit `config/users.js` to add your users:

   ```javascript
   const USERS = {
   	"user@domain.com": {
   		password: "your_smtp_password",
   		apiKey: "your_api_key",
   	},
   };
   ```

5. **Configure server settings**
   Edit `config/server.js` to customize:

   - SMTP server host/port
   - API server host/port
   - Allowed domains
   - Storage directories

6. **Start the server**
   ```bash
   npm start
   # or
   ./start.sh
   ```

## 🔧 Configuration

### Server Configuration (`config/server.js`)

```javascript
const SERVER_CONFIG = {
	smtp: {
		host: "0.0.0.0", // SMTP server host
		port: 25, // SMTP server port
		allowedDomains: ["google.in", "domain.com"], // Allowed recipient domains
		authOptional: true, // Whether authentication is optional
	},
	api: {
		host: "0.0.0.0", // API server host
		port: 4000, // API server port
	},
	storage: {
		directories: {
			raw: "emails/raw", // Raw email storage
			parsed: "emails/parsed", // Parsed email metadata
			attachments: "emails/attachments", // Email attachments
			errors: "emails/errors", // Error logs
			sent: "emails/sent", // Sent emails
			sentAttachments: "emails/sent_attachments", // Sent email attachments
			uploads: "uploads", // Temporary uploads
			starred: "emails/starred", // Starred emails
		},
	},
};
```

### User Configuration (`config/users.js`)

```javascript
const USERS = {
	"user@domain.com": {
		password: "smtp_password", // Password for SMTP authentication
		apiKey: "api_key_for_rest", // API key for REST API access
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

### Email Actions

- `POST /send/email` - Send email with attachments
- `POST /starred/:id` - Star/unstar an email
- `GET /starred` - Get starred emails

### System

- `GET /users` - List all users
- `GET /health` - System health check
- `GET /` - API information and endpoints

## 🔐 Authentication

The API uses API key authentication for all operations:

1. **Configure API Key**: Set in `config/users.js`
2. **Include in Requests**: Add to request body or headers
3. **User Validation**: API validates user and API key combination

### Example Authentication

```bash
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "user@domain.com", "apiKey": "your_api_key"}'
```

## 📧 Email Operations

### Sending Emails

Send emails via REST API with attachments:

```bash
curl -X POST http://localhost:4000/send/email \
  -F "user=user@domain.com" \
  -F "apiKey=your_api_key" \
  -F "to=recipient@example.com" \
  -F "subject=Test Email" \
  -F "text=Hello World" \
  -F "attachments=@file.pdf"
```

### Retrieving Emails

```bash
# Get all received emails
curl -H "Authorization: Bearer your_api_key" \
  http://localhost:4000/emails

# Get specific email
curl -H "Authorization: Bearer your_api_key" \
  http://localhost:4000/emails/email_id

# Get email attachment
curl -H "Authorization: Bearer your_api_key" \
  http://localhost:4000/emails/email_id/attachments/filename.pdf
```

## 🛡️ Security Features

- **Domain Filtering**: Only accepts emails for configured domains
- **API Key Authentication**: Required for all API operations
- **User Isolation**: Users can only access their own emails
- **Input Validation**: Comprehensive validation of all inputs
- **Secure Error Handling**: Error responses without sensitive data exposure
- **CORS Configuration**: Configurable cross-origin resource sharing

## 🧪 Testing & Development

### Development Mode

```bash
npm run dev  # Uses nodemon for auto-restart
```

### Production Start

```bash
npm start    # Uses start.sh script
```

### Health Check

```bash
curl http://localhost:4000/health
```

## 📊 Monitoring & Logging

### Health Check Response

```json
{
	"status": "healthy",
	"timestamp": "2024-01-01T00:00:00.000Z",
	"services": {
		"smtp": "running",
		"api": "running"
	},
	"storage": {
		"directories": "available",
		"users": 2
	}
}
```

### Logging

- **SMTP Logs**: Email reception and processing logs
- **API Logs**: Request/response logging
- **Error Logs**: Detailed error tracking in `emails/errors/`
- **Console Logs**: Real-time server status and operations

## 🔄 Development

### Adding New Features

1. **Services**: Add business logic to `services/`
2. **Routes**: Create new route files in `api/routes/`
3. **Utils**: Add utility functions to `utils/`
4. **Config**: Update configuration files in `config/`

### Code Style Guidelines

- **ES6+**: Use modern JavaScript features
- **JSDoc**: Document all functions and classes
- **Error Handling**: Comprehensive error handling with try-catch
- **Modularity**: Keep functions small and focused
- **Async/Await**: Use async/await for asynchronous operations

## 🚀 Deployment

### Production Considerations

1. **Environment Variables**: Use environment variables for sensitive data
2. **SSL/TLS**: Configure SSL certificates for secure communication
3. **Firewall**: Configure firewall rules for SMTP (25) and API (4000) ports
4. **Monitoring**: Set up monitoring and alerting for server health
5. **Backup**: Regular backup of email storage directories
6. **Process Management**: Use PM2 or similar for process management

## 📝 Dependencies

### Core Dependencies

- **express**: Web framework for REST API
- **smtp-server**: SMTP server implementation
- **nodemailer**: Email sending capabilities
- **mailparser**: Email parsing and processing
- **multer**: File upload handling
- **cors**: Cross-origin resource sharing
- **dotenv**: Environment variable management

### Development Dependencies

- **nodemon**: Auto-restart for development

## 📄 License

This project is licensed under the Apache  License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For issues and questions, please create an issue in the repository.
