# FixBot - React Frontend (Vite)

Modern, fast React frontend for FixBot using Vite, React 18, and Tailwind CSS.

## Quick Start

### Prerequisites
- Node.js 16+ (LTS recommended)
- npm 8+ or yarn

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create environment file:**
   ```bash
   cp .env.example .env.local
   ```
   
   Update `VITE_API_URL` to match your backend server (default: `http://localhost:5000`)

3. **Start development server:**
   ```bash
   npm run dev
   ```
   
   Opens automatically at `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server with HMR
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Lint code with ESLint
- `npm run lint:fix` - Auto-fix linting issues

## Project Structure

```
src/
├── components/          # Reusable React components
│   ├── Header.jsx      # Navigation header
│   ├── AnalysisForm.jsx # Main input form
│   ├── ResultPanel.jsx  # Analysis results display
│   ├── LogInput.jsx     # Error log input
│   ├── CodeInput.jsx    # Code snippet input
│   ├── SeverityBadge.jsx # Severity indicator
│   ├── LoadingSpinner.jsx # Loading state
│   └── IncidentHistory.jsx # Past incidents list
├── pages/              # Page components
│   └── Home.jsx        # Main analysis page
├── services/           # API & utilities
│   └── api.js          # Axios API client
├── App.jsx             # Root component
├── main.jsx            # Entry point
└── index.css           # Global styles
```

## Component Overview

### AnalysisForm
Main form for submitting error logs and code snippets. Handles:
- Form input and validation
- API requests to `/api/incidents/analyze`
- Loading and error states
- Result display via ResultPanel

### ResultPanel
Displays AI analysis results:
- Severity badge (Critical/Warning/Minor)
- Root cause explanation
- Suggested code fix
- Fix strategy explanation
- Confidence score with progress bar

### Other Components
- **Header**: Navigation between pages
- **LogInput/CodeInput**: Textarea inputs with labels
- **SeverityBadge**: Color-coded severity indicator
- **LoadingSpinner**: Animated loading state
- **IncidentHistory**: Responsive list of past incidents

## Styling

- **Tailwind CSS** - Utility-first CSS framework
- **PostCSS** - CSS processing and vendor prefixing
- **Autoprefixer** - Browser compatibility
- **Dark mode ready** - Easily add dark mode support

### Custom Utilities
- `.fade-in` - Fade-in animation
- `.slide-up` - Slide-up animation
- `.pulse-subtle` - Subtle pulse effect

## API Integration

### Base Configuration
- Base URL: Read from `VITE_API_URL` environment variable (host + port)
- Timeout: 30 seconds

### Available Methods
- `api.analyzeIncident(data)` - POST `/api/incidents/analyze`
- `api.getIncidents()` - GET `/api/incidents`
- `api.getIncident(id)` - GET `/api/incidents/:id`
- `api.deleteIncident(id)` - DELETE `/api/incidents/:id`

### Request/Response Format
```javascript
// Analyze request
{
  logText: "Error message or stack trace",
  codeSnippet: "JavaScript/code that caused the error"
}

// Analyze response
{
  severity: "Critical|Warning|Minor",
  rootCause: "Explanation of the root cause",
  suggestedFix: "Fixed code",
  explanation: "Strategy behind the fix",
  confidenceScore: 85 // 0-100
}
```

## Development Tips

### HMR (Hot Module Replacement)
Vite provides instant updates during development. Changes are reflected without full page reload.

### Browser DevTools
React DevTools extension recommended for debugging components.

### Debugging API Calls
- Check Network tab in DevTools
- Inspect API responses and request payloads
- Review console for logged errors

### Building Components
- Keep components small and focused
- Use props for data passing
- Lift state up for shared state management
- Use custom hooks for reusable logic

## Deployment

### Build for Production
```bash
npm run build
```
Creates optimized build in `dist/` folder

### Deploy Options
1. **Vercel** (recommended for Vite)
   ```bash
   npm install -g vercel
   vercel
   ```

2. **Netlify**
   - Connect Git repository
   - Set build command: `npm run build`
   - Set publish directory: `dist`

3. **Traditional Server**
   - Upload `dist/` contents to web server
   - Configure server to serve index.html for all routes

## Environment Variables

Create `.env.local` file in project root:

```
# API Configuration
VITE_API_URL=http://localhost:5000

# App Info
VITE_APP_NAME=FixBot
VITE_APP_VERSION=0.1.0
```

## Troubleshooting

### Port Already in Use
Change port in `vite.config.js` or kill the process:
```bash
npm run dev -- --port 3000
```

### CORS Issues
Ensure backend CORS is configured to allow frontend origin.

### Build Size
Check bundle size:
```bash
npm install -g vite-plugin-visualizer
```

### API Connection Issues
- Verify `VITE_API_URL` in `.env.local`
- Check backend server is running
- Review Network tab in DevTools

## Browser Support

- Chrome (latest)
- Firefox (latest)  
- Safari (latest)
- Edge (latest)

## Performance Features

- Code splitting via Vite
- Tree shaking for unused imports
- Minification in production
- Asset optimization
- CSS purging with Tailwind

## Future Enhancements

- [ ] Dark mode support
- [ ] Incident search/filtering
- [ ] Export results to PDF/JSON
- [ ] Syntax highlighting for code
- [ ] More chart types
- [x] User authentication (email signup/login)
- [ ] Real-time notifications

## Contributing

1. Create feature branch
2. Make changes
3. Test with `npm run dev`
4. Lint with `npm run lint:fix`
5. Submit PR

## License

MIT - See LICENSE file
