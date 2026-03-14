# FixBot Server

Backend API service for authentication and incident management.

## Features
- Email/password auth with JWT
- Analyze incident requests via ML service
- Incident history per authenticated email
- Clear all incident history for current user
- Optional SMTP email report with analysis attachment
- Health endpoints for service and database status

## Environment Variables
Create `.env` in this folder with:

- `PORT` (default: 5000)
- `MONGO_URI`
- `MONGO_DB_NAME`
- `USERS_COLLECTION_NAME`
- `INCIDENTS_COLLECTION_NAME`
- `JWT_SECRET`
- `ML_SERVER_URL` (default: http://localhost:8000)
- `CORS_ORIGIN` (default: *)

Optional (email notifications):

- `EMAIL_HOST`
- `EMAIL_PORT`
- `EMAIL_USER`
- `EMAIL_PASS`
- `EMAIL_FROM`

If email variables are not set, incident email sending is skipped and analysis still succeeds.

## Run
```bash
npm install
npm run dev
```

Production:

```bash
npm start
```

Utility script:

```bash
npm run backfill:user-email
```

## API Base
`http://localhost:5000`

Main routes:
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/incidents/analyze`
- `GET /api/incidents`
- `DELETE /api/incidents` (clear all for current user)
- `GET /api/incidents/:id`
- `DELETE /api/incidents/:id`

Health routes:

- `GET /` (service info)
- `GET /health` (service + MongoDB connection status)
