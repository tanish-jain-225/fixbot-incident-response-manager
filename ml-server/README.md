# FixBot ML Server

AI analysis service for FixBot incident debugging.

## Features
- Accepts log/code payloads
- Builds structured debug prompts
- Calls primary Resinix model
- Falls back to Gemini on eligible failures
- Normalizes output for backend consumption

## Environment Variables
Create `.env` in this folder with:

- `PORT` (default: 8000)
- `CORS_ORIGIN` (default: *)
- `PUBLIC_BASE_URL` (default: http://localhost:8000)
- `RESINIX_API_KEY`
- `RESINIX_API_URL`
- `GEMINI_API_KEY`
- `GEMINI_MODEL` (example: gemini-2.5-flash)

## Run
```bash
npm install
npm run dev
```

## API Base
`http://localhost:8000`

Main routes:
- `POST /api/analyze`
- `GET /health`
