# FixBot

AI-powered incident analysis platform that turns logs and stack traces into concrete root causes and production-ready code fixes.

FixBot is built as three deployable services:
- `client` - Vite + React UI
- `server` - Express API, auth, and MongoDB persistence
- `ml-server` - Express AI reasoning service with provider fallback

---

## Why FixBot

Production debugging is usually slow, manual, and inconsistent. FixBot shortens the incident-to-fix loop by:
- analyzing real log text and optional code snippets,
- classifying severity,
- generating context-aware fixes and explanations,
- storing history per authenticated user,
- emailing analysis reports automatically (when SMTP is configured),
- using resilient AI routing (Resinix primary, Gemini fallback).

---

## Core Features

- Log + code analysis endpoint with strict input validation
- Severity classification (`Critical`, `Warning`, `Minor`)
- Root-cause diagnosis and concrete fix suggestion
- Confidence score (`0-100`)
- JWT authentication (`signup`, `login`, `me`)
- User-scoped incident history
- Delete one incident or clear all incident history
- Optional email notification with incident analysis attachment
- Dual AI provider strategy for higher availability

---

## Architecture

```text
[React Client]
    |
    | HTTP
    v
[Server API + MongoDB]
    |
    | HTTP
    v
[ML Server]
  |        \
  |         \
Resinix   Gemini (fallback)
```

### Service Ports (Local)
- Client: `5173`
- Server: `5000`
- ML Server: `8000`

---

## Repository Layout

```text
Syrus2026_HackHunters/
  client/
  server/
  ml-server/
```

### Important Paths

```text
client/src/services/api.js
server/server.js
server/routes/authRoutes.js
server/routes/incidentRoutes.js
server/controllers/authController.js
server/controllers/incidentController.js
server/services/mlService.js
ml-server/mlServer.js
ml-server/routes/analyze.js
ml-server/services/resinixService.js
ml-server/prompts/debugPrompt.js
```

---

## Prerequisites

- Node.js `20.x` (recommended for Vercel compatibility)
- npm `9+`
- MongoDB instance (local or Atlas)
- Resinix API key
- Gemini API key (recommended as fallback)
- Optional SMTP credentials for email reports

---

## Local Setup

### 1. Install dependencies

```bash
cd client && npm install
cd ../server && npm install
cd ../ml-server && npm install
```

### 2. Configure environment variables

#### `server/.env`

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

# Optional email notifications
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_app_password
EMAIL_FROM=<your_email@example.com>
```

#### `ml-server/.env`

```env
PORT=8000
CORS_ORIGIN=*

# Primary AI
RESINIX_API_KEY=your_resinix_api_key_here
RESINIX_API_URL=https://api.resinix.ai/v1/chat/completions

# Fallback AI
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
```

#### `client/.env`

```env
VITE_API_URL=http://localhost:5000
VITE_APP_NAME=FixBot
VITE_APP_VERSION=0.1.0
```

### 3. Start services (3 terminals)

```bash
# Terminal 1
cd ml-server
npm run dev
```

```bash
# Terminal 2
cd server
npm run dev
```

```bash
# Terminal 3
cd client
npm run dev
```

Open `http://localhost:5173`.

---

## API Overview

Base URL (server): `http://localhost:5000`

### Auth

#### `POST /api/auth/signup`
Create a user account.

Request:
```json
{
  "email": "user@example.com",
  "password": "secret123"
}
```

Response:
```json
{
  "token": "jwt-token",
  "user": {
    "id": "...",
    "email": "user@example.com"
  }
}
```

#### `POST /api/auth/login`
Authenticate and return JWT.

#### `GET /api/auth/me`
Get current user profile. Requires `Authorization: Bearer <token>`.

### Incidents (Authenticated)

#### `POST /api/incidents/analyze`
Analyze an incident and persist it.

Request:
```json
{
  "logText": "TypeError: Cannot read properties of undefined",
  "codeSnippet": "function x(y){ return y.map(z => z.id); }"
}
```

Response fields include:
- `severity`
- `rootCause`
- `suggestedFix`
- `explanation`
- `confidenceScore`
- stored incident metadata (`_id`, timestamps, etc.)

#### `GET /api/incidents`
Get user incident history.

Query params:
- `severity`
- `limit` (default `50`, max `100`)
- `skip` (default `0`)

#### `GET /api/incidents/:id`
Get one incident by ID.

#### `DELETE /api/incidents/:id`
Delete one incident by ID.

#### `DELETE /api/incidents`
Clear all incidents for current user.

### Health Endpoints

- Server: `GET /health`
- ML Server: `GET /health`

---

## AI Flow

1. Client submits `logText` and optional `codeSnippet`.
2. Server validates payload and calls ML Server (`/api/analyze`).
3. ML Server builds a structured prompt.
4. Primary provider (Resinix) is called first.
5. On eligible failures, fallback provider (Gemini) is used.
6. Normalized analysis is returned and persisted.
7. Server returns the final incident object to client.

---

## Deployment (Vercel)

This repository is deployed as three separate Vercel projects:
- `client`
- `server`
- `ml-server`

Each service already has its own `vercel.json`.

### Recommended deployment process

1. Set Node.js runtime to `20.x` in each Vercel project settings.
2. Configure environment variables in each Vercel project.
3. Deploy each project from its own folder root.

### Local pre-deploy smoke checks

```bash
cd client && npx vercel build --yes
cd ../server && npx vercel build --yes
cd ../ml-server && npx vercel build --yes
```

If you see `Project Settings could not be retrieved`, re-link that folder using Vercel CLI.

---

## Scripts

### Client
- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run lint`
- `npm run lint:fix`

### Server
- `npm run dev`
- `npm run start`
- `npm run backfill:user-email`

### ML Server
- `npm run dev`
- `npm run start`

---

## Troubleshooting

### Server initialization fails
Check:
- `JWT_SECRET` exists
- `MONGO_URI` exists
- `MONGO_DB_NAME` exists

### Incidents fail with 503
Check:
- ML server is running
- `ML_SERVER_URL` is correct

### CORS errors in browser
Check:
- `server/.env` `CORS_ORIGIN`
- `client/.env` `VITE_API_URL`

### No email notifications
Email sending is optional. Configure SMTP env vars in server and verify credentials.

### AI authentication/rate-limit errors
Verify Resinix and Gemini API keys and quota status.

---

## Security Notes

- Keep `.env` files out of version control
- Use a strong `JWT_SECRET`
- Restrict CORS in production to known origins
- Rotate AI and SMTP keys periodically
