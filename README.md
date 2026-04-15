# HTTP Status Checker

Modern web app to check HTTP status codes for a single URL or in bulk, with a clean UI and fast feedback.

## Stack
- React 19 + Vite 8
- Tailwind CSS 4 (via `@tailwindcss/vite`)
- ESLint 9

## Features
- Single URL check with:
- Status code, status label, response time, protocol, and response details
- CORS-aware fallback detection (`direct`, `no-cors`, and unreachable/timeout states)
- Bulk URL check with:
- Configurable concurrency
- Real-time progress and counters
- Filters by class (`2xx`, `3xx`, `4xx`, `5xx`, `CORS`, `error`)
- Sorting (URL, status, elapsed time)
- CSV export

## Project Architecture
The project follows a layered structure focused on separation of concerns:

- `src/domain`: Pure business rules and status catalog
- `src/application`: Use cases and orchestration (`checkSingleUrl`, task pool, CSV export)
- `src/infra`: HTTP gateway and fetch behavior
- `src/shared`: Generic helpers (URL normalization, time formatting)
- `src/ui/hooks`: UI state and interaction logic
- `src/ui/components`: Presentational and feature components (`single`, `bulk`, `shared`)

## Getting Started
### 1. Install dependencies
```bash
npm install
```

### 2. Run development server
```bash
npm run dev
```

### 3. Build for production
```bash
npm run build
```

### 4. Preview production build
```bash
npm run preview
```

### 5. Lint
```bash
npm run lint
```

## Available Scripts
- `npm run dev`: Starts Vite dev server
- `npm run build`: Builds the production bundle
- `npm run preview`: Serves the production build locally
- `npm run lint`: Runs ESLint

## Notes
- URLs without protocol are normalized to `https://`.
- Browser security policies can hide exact status codes in some cases (CORS restrictions).
- Timeout is set in the HTTP gateway to avoid hanging requests.
