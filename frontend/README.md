# Library Book Catalog - web UI

React 19 + Vite frontend for the Flask API in the parent folder. See the main README for how to run it.

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server on http://localhost:5173, forwarding API calls to Flask (`API_URL`, default http://localhost:5000) |
| `npm run build` | Production build into `dist/`, served by Flask at `/ui/` |
| `npm run lint` | oxlint |

| File | Purpose |
| --- | --- |
| `src/api.js` | API client; turns every failed call into an `ApiError` and records it |
| `src/errorStore.js` | Frontend error store; reports each error to `POST /api/errors`; global `error` / `unhandledrejection` handlers |
| `src/components/ErrorBoundary.jsx` | Catches render errors in a component tree |
| `src/components/ErrorCenter.jsx` | Frontend errors and the backend error log, linked by error id |
| `src/components/ErrorBanner.jsx` | Shows the newest error at the top of the page |
| `src/components/ErrorTestPanel.jsx` | Buttons that trigger each kind of error |
| `src/components/BookList.jsx`, `AddBookForm.jsx`, `HealthBadge.jsx` | SCRUM-6, SCRUM-7, SCRUM-8 |
