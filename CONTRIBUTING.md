# Contributing

Thanks for helping improve Aqarati.

## Local Setup

```powershell
npm install
npm run api
npm run dev
```

Run checks before opening a pull request:

```powershell
npm run check
```

## Contribution Rules

- Keep UI text Arabic-first and RTL-friendly.
- Keep Saudi rental terminology clear and consistent.
- Do not commit local database files from `server/data/`.
- Do not add secrets, API keys, real tenant data, or private company data.
- Prefer small, focused pull requests.
- Update user or developer docs when behavior changes.

## Code Style

- Follow the existing React + TypeScript patterns.
- Keep business/data types in `src/data.ts` unless a larger module split is needed.
- Keep API calls inside `src/api.ts`.
- Keep backend route behavior in `server/index.mjs` until the server is split into modules.

## Public Data Safety

Use fake demo data only. Public issues and pull requests must not include:

- Real tenant names.
- Real phone numbers.
- Real national IDs or commercial registration numbers.
- Real contracts, Ejar numbers, invoices, or receipts.
