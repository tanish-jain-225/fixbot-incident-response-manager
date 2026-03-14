# FixBot Server

Backend API service for authentication and incident management.

## Features
- Email/password auth with JWT
- Analyze incident requests via ML service
- Incident history per authenticated email
- Clear all incident history for current user
- Email report sending with analysis attachment

## Environment Variables
Create `.env` in this folder with:

- `PORT` (default: 5000)
- `MONGO_URI`
- `JWT_SECRET`
- `ML_SERVER_URL` (default: http://localhost:8000)
- `CORS_ORIGIN` (default: *)
- `EMAIL_HOST`
- `EMAIL_PORT`
- `EMAIL_USER`
- `EMAIL_PASS`
- `EMAIL_FROM`

## Run
```bash
npm install
npm run dev
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
