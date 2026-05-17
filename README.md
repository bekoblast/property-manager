# Aqarati Property Manager

Arabic RTL web app for managing company properties in Saudi Arabia. The app covers buildings, flats, shops, tenants, Ejar contract numbers, payments, maintenance requests, and manager reports with Excel/PDF exports.

## Tech Stack

- React + TypeScript + Vite
- `lucide-react` for icons
- `recharts` for dashboard charts
- `exceljs`, `jspdf`, and `jspdf-autotable` loaded on demand for report exports
- Browser `localStorage` for the current prototype data layer

## Local Development

```powershell
npm install
npm run dev
```

The dev server runs at:

```text
http://127.0.0.1:3000/
```

Run the local API server in a second terminal:

```powershell
npm run api
```

The API runs at:

```text
http://127.0.0.1:4000/api/health
```

## Quality Checks

```powershell
npm run build
npm run lint
npm audit --omit=dev
```

## Current Notes

- Data is stored locally in the browser under `aqarati.*` keys.
- Shared domain types and seed data live in `src/data.ts` so the UI can later switch from `localStorage` to an API/database.
- The first backend draft is documented in `docs/database-schema.sql` and `docs/api-contract.md`.
- A local Express + SQLite API lives in `server/` and writes its development database to ignored `server/data/`.
- Report export libraries are code-split so the main app loads before Excel/PDF code is downloaded.
- Vite may still warn about the lazy Excel export chunk size because `exceljs` is large. This does not block the build.
- The next production step is to replace `localStorage` with a backend database and add user roles.
