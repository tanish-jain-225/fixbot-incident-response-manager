# FixBot

FixBot is an AI-powered incident response platform that converts production logs and code context into actionable root-cause analysis and concrete remediation guidance.

The repository is organized as three independently deployable services:

- client: React and Vite frontend
- server: Express API with authentication and MongoDB persistence
- ml-server: Express AI reasoning service with provider fallback

## Table of Contents

1. Overview
2. Key Capabilities
3. System Architecture
4. Tech Stack
5. Repository Structure
6. Prerequisites
7. Environment Configuration
8. Local Development Setup
9. API Surface
10. AI Processing Flow
11. Scripts
12. Deployment Notes
13. Troubleshooting
14. Security and Operations

## Overview

FixBot is designed to reduce mean-time-to-resolution during incident response by combining:

- deterministic validation and persistence in the API layer,
- resilient provider routing in the ML layer,
- and a fast user workflow in the client layer.

Each analysis can be stored per authenticated user, filtered by severity, and optionally delivered by email.

## Key Capabilities

- Incident analysis from log text and optional code snippet
- Severity classification into Critical, Warning, or Minor
- Structured root cause, suggested fix, explanation, and confidence score
- JWT-based authentication with profile endpoint
- User-scoped incident history with pagination and filtering
- Incident deletion by ID and bulk clear for current user
- Optional SMTP email notifications with analysis attachment
- AI provider fallback strategy for improved availability

## System Architecture

```text
[Client: React + Vite]
        |
        | HTTP
        v
[Server: Express + MongoDB]
        |
        | HTTP
        v
[ML Server: Express]
   |                     \
   |                      \
[Resinix Primary]   [Gemini Fallback]
```

Default local ports:

- client: 5173
- server: 5000
- ml-server: 8000

## Tech Stack

Client:

- React 18
- Vite
- Tailwind CSS
- Axios

Server:

- Node.js and Express
- MongoDB and Mongoose
- JWT authentication
- Bcrypt password hashing
- Nodemailer for optional email notifications

ML Server:

- Node.js and Express
- Axios-based AI provider integration
- Resinix primary inference path
- Gemini fallback inference path

## Repository Structure

```text
fixbot-incident-response-manager/
  client/
  server/
  ml-server/
```

Important service entry points:

- client/src/main.jsx
- client/src/App.jsx
- server/server.js
- ml-server/mlServer.js

## Prerequisites

- Node.js 20.x recommended
- npm 9+
- MongoDB (local or Atlas)
- Resinix API key
- Gemini API key (recommended fallback)
- SMTP credentials (optional, for email notifications)

## Environment Configuration

Create environment files for each service.

Server environment, server/.env:

```env
# MongoDB
MONGO_URI=mongodb://localhost:27017
MONGO_DB_NAME=fixbot
USERS_COLLECTION_NAME=users
INCIDENTS_COLLECTION_NAME=incidents

# Server
PORT=5000
CORS_ORIGIN=http://localhost:5173

# Auth
JWT_SECRET=replace_with_a_long_random_secret

# ML integration
ML_SERVER_URL=http://localhost:8000

# Optional SMTP email notifications
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_app_password
EMAIL_FROM=<your_email@example.com>
```

ML server environment, ml-server/.env:

```env
PORT=8000
CORS_ORIGIN=*

# Resinix primary
RESINIX_API_KEY=your_resinix_api_key_here
RESINIX_API_URL=https://api.resinix.ai/v1/chat/completions
RESINIX_MODEL=resinix-default

# Gemini fallback
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
```

Client environment, client/.env:

```env
VITE_API_URL=http://localhost:5000
VITE_APP_NAME=FixBot
VITE_APP_VERSION=0.1.0
```

## Local Development Setup

1. Install dependencies in all services

```bash
cd client && npm install
cd ../server && npm install
cd ../ml-server && npm install
```

2. Configure env files as described above.

3. Start services in separate terminals

```bash
# terminal 1
cd ml-server
npm run dev
```

```bash
# terminal 2
cd server
npm run dev
```

```bash
# terminal 3
cd client
npm run dev
```

4. Open the application at http://localhost:5173.

## API Surface

Primary API base URL:

- http://localhost:5000

Authentication endpoints:

- POST /api/auth/signup
- POST /api/auth/login
- GET /api/auth/me

Incident endpoints, authenticated:

- POST /api/incidents/analyze
- GET /api/incidents
- GET /api/incidents/:id
- DELETE /api/incidents/:id
- DELETE /api/incidents

Health endpoints:

- server: GET /
- server: GET /health
- ml-server: GET /
- ml-server: GET /health

Common analyze request payload:

```json
{
  "logText": "TypeError: Cannot read properties of undefined",
  "codeSnippet": "function x(y){ return y.map(z => z.id); }"
}
```

Common analyze response fields:

- severity
- rootCause
- suggestedFix
- explanation
- confidenceScore
- persisted incident metadata

## AI Processing Flow

1. Client sends logText and optional codeSnippet to server.
2. Server validates payload and calls ml-server analyze endpoint.
3. ML server builds the debugging prompt.
4. Resinix provider is called as primary.
5. On eligible failures, Gemini fallback is attempted.
6. ML output is normalized to stable response fields.
7. Server persists the incident and returns the final response.
8. If SMTP is configured, an email report is sent.

## Scripts

Client scripts:

- npm run dev
- npm run build
- npm run preview
- npm run lint
- npm run lint:fix

Server scripts:

- npm run dev
- npm start
- npm run backfill:user-email

ML server scripts:

- npm run dev
- npm start

## Deployment Notes

Recommended deployment model is three separate projects:

- client
- server
- ml-server

Each service includes its own vercel.json and can be deployed independently.

Suggested deployment sequence:

1. Configure environment variables per service.
2. Deploy ml-server.
3. Deploy server with ML_SERVER_URL pointing to deployed ml-server.
4. Deploy client with VITE_API_URL pointing to deployed server.

Optional local Vercel smoke checks:

```bash
cd client && npx vercel build --yes
cd ../server && npx vercel build --yes
cd ../ml-server && npx vercel build --yes
```

## Troubleshooting

Server fails at startup:

- verify JWT_SECRET, MONGO_URI, MONGO_DB_NAME,
- verify USERS_COLLECTION_NAME and INCIDENTS_COLLECTION_NAME.

Incident analysis fails with service unavailable:

- ensure ml-server is running,
- ensure ML_SERVER_URL is correct and reachable.

CORS errors in browser:

- verify server CORS_ORIGIN,
- verify client VITE_API_URL.

No email notifications:

- SMTP is optional,
- verify EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_FROM.

AI auth or quota issues:

- verify Resinix and Gemini keys,
- check provider quotas and rate limits.

## Security and Operations

- Keep all .env files out of source control.
- Use a strong JWT secret in all non-local environments.
- Restrict CORS to trusted origins in production.
- Rotate API and SMTP credentials periodically.
- Monitor 401, 429, and 5xx rates across server and ml-server logs.
