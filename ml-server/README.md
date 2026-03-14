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
- `RESINIX_API_KEY`
- `RESINIX_API_URL` (default: https://api.resinix.ai/v1/chat/completions)
- `RESINIX_MODEL` (default: resinix-default)
- `GEMINI_API_KEY`
- `GEMINI_MODEL` (example: gemini-2.5-flash)

Notes:

- Resinix is the primary provider.
- Gemini is used as fallback for eligible network and 5xx failures.

## Run
```bash
npm install
npm run dev
```

Production:

```bash
npm start
```

## API Base
`http://localhost:8000`

Main routes:
- `POST /api/analyze`
- `GET /` (service info)
- `GET /health` (service + provider configuration status)
