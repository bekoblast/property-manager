# Developer Guide

This guide explains the current codebase structure and how to extend Aqarati safely.

## Architecture

Aqarati is currently a Vite React SPA with a local Express API and SQLite database.

```text
React UI -> src/api.ts -> Express API -> SQLite
       fallback -> localStorage
```

The frontend tries to connect to the API at `VITE_API_BASE_URL`. If the API is offline, it continues in local browser mode through `localStorage`.

When the API is online, users must log in before business data is loaded.

## Folder Structure

```text
docs/
  api-contract.md          Planned production API contract
  database-schema.sql      PostgreSQL-style production schema draft
  DEVELOPER_GUIDE.md       Developer documentation
  USER_GUIDE.md            End-user documentation
server/
  index.mjs                Express API and CRUD routes
  schema.sql               Local SQLite schema
  data/                    Ignored local SQLite database files
src/
  api.ts                   Frontend API client
  data.ts                  Shared frontend data types, seeds, and local storage hook
  App.tsx                  Main application UI and workflows
  App.css                  App layout and component styles
  main.tsx                 React entry point
```

## Running Locally

Install dependencies:

```powershell
npm install
```

Run the API:

```powershell
npm run api
```

Run the frontend:

```powershell
npm run dev
```

Open:

```text
http://127.0.0.1:3000/
```

## Environment

Copy `.env.example` to `.env` when you need local overrides.

```text
VITE_API_BASE_URL=http://127.0.0.1:4000/api
API_PORT=4000
```

## Quality Checks

Run all checks:

```powershell
npm run check
```

Or run them separately:

```powershell
npm run lint
npm run test:backend
npm run build
npm audit --omit=dev
```

## Frontend Data Flow

The app initializes from `localStorage` seeds in `src/data.ts`, then tries to load API data in `src/App.tsx`.

When the API is online:

1. `apiHealth()` checks `/api/health`.
2. `apiList()` loads all resources.
3. Save/delete operations call `apiSave()` and `apiDelete()`.
4. UI state is updated immediately for responsiveness.

When the API is offline:

1. The app shows local mode.
2. Data continues saving to `localStorage`.
3. The user can still use the prototype, but changes are browser-local.

## Backend Data Flow

`server/index.mjs`:

- Creates `server/data/aqarati.db` if missing.
- Runs `server/schema.sql`.
- Seeds the database on first run.
- Exposes `/api/health`, `/api/dashboard`, and CRUD endpoints.
- Exposes `/api/auth/login`, `/api/auth/logout`, and `/api/auth/me`.
- Requires bearer-token authentication for business endpoints.
- Applies role permissions for write operations.

The current backend is intentionally simple. It is a local development bridge, not the final production backend.

## Demo Users

All demo users use this password:

```text
demo12345
```

| Email | Role |
| --- | --- |
| `manager@aqarati.local` | manager |
| `accountant@aqarati.local` | accountant |
| `leasing@aqarati.local` | leasing |
| `maintenance@aqarati.local` | maintenance |
| `viewer@aqarati.local` | viewer |

Role summary:

- `manager`: full access.
- `accountant`: can write payments.
- `leasing`: can write properties, units, tenants, and contracts.
- `maintenance`: can write maintenance requests.
- `viewer`: read-only.

## Backend Validation

The API validates:

- Required fields.
- Allowed status/type values.
- Positive numeric values.
- Date strings in `YYYY-MM-DD` format.
- Existing foreign-key references.
- Unique Ejar contract numbers.
- Payment unit/tenant alignment with the selected contract.

Delete protection blocks removing parent records that still have related children, such as properties with units or contracts with payments.

## Audit Logs

The backend writes audit logs for:

- Login and logout.
- Create, update, and delete operations.
- Backup creation.
- Backup restore requests.

Managers can read recent audit logs through:

```text
GET /api/audit-logs
```

The Settings screen also shows recent audit activity for manager users.

## Backup And Restore

The local API stores SQLite backups in ignored `server/data/backups/` by default.

Endpoints:

```text
GET  /api/backups
POST /api/backups
POST /api/backups/:name/restore
```

Only managers can use backup endpoints.

Restore behavior is intentionally conservative for SQLite: the API responds with `restartRequired: true`, copies the selected backup over the active database file, and exits. Start `npm run api` again after restore.

## Main Resources

- `properties`: buildings or property groups.
- `units`: flats and shops.
- `tenants`: individuals or companies renting units.
- `contracts`: rental contracts with Ejar numbers.
- `payments`: rent installments.
- `maintenance`: maintenance requests.

## Adding A New Module

1. Add the TypeScript type in `src/data.ts`.
2. Add seed data if useful.
3. Add the SQLite table in `server/schema.sql`.
4. Add the table columns in `server/index.mjs`.
5. Add the API resource type in `src/api.ts`.
6. Add the UI section and nav item in `src/App.tsx`.
7. Run `npm run check`.

## Reports

Excel/PDF libraries are dynamically imported only when export buttons are clicked. This keeps the initial app load lighter, but the export chunks are still large because Excel/PDF libraries are heavy.

Future improvement: move official report generation to the backend.

## Production Roadmap

Before real company deployment:

- Add authentication.
- Add role-based permissions.
- Add backend validation.
- Add database migrations.
- Add automated API and UI tests.
- Add Arabic PDF report generation on the backend.
- Add database backups.
- Move from SQLite to PostgreSQL or a managed production database.
- Add deployment documentation.

## Known Limitations

- No login system yet.
- No server-side permissions yet.
- SQLite is local-development only.
- The frontend still supports local fallback.
- Report PDF Arabic shaping/fonts need production hardening.
- Ejar and VAT fields are stored, but this app does not integrate with official government services.
