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

## Quality Checks

```powershell
npm run build
npm run lint
npm audit --omit=dev
```

## Current Notes

- Data is stored locally in the browser under `aqarati.*` keys.
- Report export libraries are code-split so the main app loads before Excel/PDF code is downloaded.
- Vite may still warn about the lazy Excel export chunk size because `exceljs` is large. This does not block the build.
- The next production step is to replace `localStorage` with a backend database and add user roles.
