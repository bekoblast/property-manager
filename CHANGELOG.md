# Changelog

All notable changes to this project will be documented here.

## [Unreleased]

### Added

- Local demo authentication with seeded role-based users.
- Bearer-token protection for business API endpoints.
- Role-aware frontend navigation and login screen.
- Audit logs for auth, CRUD, backup, and restore actions.
- Manager backup/restore endpoints and Settings UI.
- Versioned SQLite migrations through `server/migrations`.
- Applied migration list in `/api/health`.
- Backend validation for required fields, enum values, dates, positive numbers, references, unique Ejar numbers, and payment-contract alignment.
- Backend delete protection for related records.
- Backend test suite using Node's built-in test runner.

## [0.1.0] - 2026-05-17

### Added

- Arabic RTL property-management SPA.
- Dashboard, properties, units, tenants, contracts, payments, maintenance, reports, and settings sections.
- Excel and PDF report exports.
- Local Express + SQLite API.
- API-backed frontend data loading with local fallback.
- User guide, developer guide, API contract, database draft, roadmap, security policy, contribution guide, and screenshots.
- GitHub issue templates, pull request template, and CI workflow.

### Known Limitations

- No authentication or role-based authorization yet.
- SQLite backend is local-development only.
- Official Arabic PDF report generation needs more production hardening.
- No official Ejar, payment gateway, tax, or accounting integration.
- Vite warns about large lazy export chunks because Excel/PDF libraries are heavy.
