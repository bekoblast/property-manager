# Backend API Contract

This is the first production API shape for Aqarati. The frontend still uses `localStorage`, but the data model is now separated so these endpoints can replace local persistence with less UI churn.

## Auth And Roles

Roles:

- `manager`: full access, reports, settings, user management
- `accountant`: payments, receipts, financial reports
- `leasing`: properties, units, tenants, contracts
- `maintenance`: maintenance requests only
- `viewer`: read-only dashboard and reports

Every request should be scoped to the authenticated user's `company_id`.

## Core Endpoints

```text
GET    /api/dashboard
GET    /api/properties
POST   /api/properties
PATCH  /api/properties/:id
DELETE /api/properties/:id

GET    /api/units
POST   /api/units
PATCH  /api/units/:id
DELETE /api/units/:id

GET    /api/tenants
POST   /api/tenants
PATCH  /api/tenants/:id
DELETE /api/tenants/:id

GET    /api/contracts
POST   /api/contracts
PATCH  /api/contracts/:id
DELETE /api/contracts/:id

GET    /api/payments
POST   /api/payments
PATCH  /api/payments/:id
DELETE /api/payments/:id

GET    /api/maintenance
POST   /api/maintenance
PATCH  /api/maintenance/:id
DELETE /api/maintenance/:id

GET    /api/reports/portfolio
GET    /api/reports/portfolio.xlsx
GET    /api/reports/portfolio.pdf
```

List endpoints keep the simple array response when called with no query string:

```text
GET /api/units
```

When `q`, `page`, `perPage`, or supported filter fields are provided, list endpoints return a paginated response:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "perPage": 25,
    "total": 0,
    "pages": 0
  }
}
```

Examples:

```text
GET /api/units?q=A-101
GET /api/units?status=شاغرة&page=1&perPage=25
GET /api/payments?contractId=c1
```

## Important Rules

- Do not delete a property if it still has units.
- Do not delete a tenant if they have active contracts.
- A contract must have a unique Ejar number.
- Commercial units can have VAT enabled; residential units are normally VAT-free.
- Payment schedules should be generated when a contract is created.
- Reports must support Arabic RTL output and Saudi Riyal amounts.

## Frontend Migration Path

1. Keep `src/data.ts` as the shared domain model.
2. Add an API client module that returns the same shapes as the current local state.
3. Replace `useStoredState` with async query/mutation hooks.
4. Move Excel/PDF generation to the backend for official manager reports.
