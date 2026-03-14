# FixBot Client

React frontend for FixBot, built with Vite and Tailwind CSS.

## Features
- Email/password authentication UI (login and signup)
- Incident analysis form (log + code snippet)
- AI result view with severity, fix, explanation, and confidence
- Account-scoped incident history with severity filters
- Session persistence using localStorage

## Requirements
- Node.js 16+
- npm 8+

## Environment Variables
Create `.env.local` in this folder (or use `.env`):

- `VITE_API_URL` (default: `http://localhost:5000`)
- `VITE_APP_NAME` (optional)
- `VITE_APP_VERSION` (optional)

Example:

```bash
VITE_API_URL=http://localhost:5000
VITE_APP_NAME=FixBot
VITE_APP_VERSION=0.1.0
```

## Run
```bash
npm install
npm run dev
```

Dev server runs on `http://localhost:5173`.

## Scripts
- `npm run dev` - Start Vite dev server
- `npm run build` - Build production bundle
- `npm run preview` - Preview production bundle locally
- `npm run lint` - Run ESLint for `src`
- `npm run lint:fix` - Auto-fix lint issues

## Project Structure
```text
src/
   components/
      AnalysisForm.jsx
      AuthForm.jsx
      CodeInput.jsx
      Header.jsx
      IncidentHistory.jsx
      LoadingSpinner.jsx
      LogInput.jsx
      ResultPanel.jsx
      SeverityBadge.jsx
   constants/
      storage.js
   pages/
      Home.jsx
   services/
      api.js
   utils/
      errors.js
      session.js
      severity.js
   App.jsx
   App.css
   index.css
   main.jsx
```

## API Integration
Axios client is configured in `src/services/api.js` with:

- Base URL from `VITE_API_URL` (fallback: `http://localhost:5000`)
- 30-second timeout
- `Authorization: Bearer <token>` request interceptor

Client API methods:

- `api.signup(data)` -> `POST /api/auth/signup`
- `api.login(data)` -> `POST /api/auth/login`
- `api.getProfile()` -> `GET /api/auth/me`
- `api.analyzeIncident(data)` -> `POST /api/incidents/analyze`
- `api.getIncidents()` -> `GET /api/incidents`
- `api.getIncident(id)` -> `GET /api/incidents/:id`
- `api.deleteIncident(id)` -> `DELETE /api/incidents/:id`
- `api.clearIncidents()` -> `DELETE /api/incidents`

## Routing and Proxy Notes
- Client-side page switching is internal state-based (`home` and `history`).
- Vite dev server proxies `/api/*` to `VITE_API_URL`.

## Build
```bash
npm run build
```

Output is generated in `dist/`.

## Troubleshooting
- If API requests fail, verify `VITE_API_URL` and ensure backend server is running.
- If auth appears broken, clear localStorage keys `fixbot_token` and `fixbot_user`.
- If port 5173 is busy, run `npm run dev -- --port <port>`.
