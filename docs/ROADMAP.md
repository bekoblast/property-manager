# Roadmap

This roadmap tracks the path from local prototype to production-ready property-management system.

## Phase 1: Public Prototype

Status: mostly complete.

- Arabic RTL React app.
- Local Express + SQLite API.
- API fallback to browser-local mode.
- Property, unit, tenant, contract, payment, maintenance, and report modules.
- Excel/PDF export.
- Public documentation and contribution files.

Remaining:

- Continue polishing screenshots as the UI evolves.
- Add automated UI smoke checks to CI.

## Phase 2: Production Backend

- Replace ad hoc SQLite setup with migration tooling. Done for local SQLite.
- Add server-side validation. Done for the current resources.
- Add structured error responses.
- Add pagination, filtering, and search endpoints.
- Move official report generation to the backend.
- Add backup and restore commands. Done for local SQLite.
- Prepare PostgreSQL deployment path.

## Phase 3: Authentication And Roles

- Add login. Done for local/demo use.
- Add manager, accountant, leasing, maintenance, and viewer roles. Done.
- Protect API endpoints by role. Done for current resources.
- Add audit logs for changes to contracts, payments, and tenant data. Done.

## Phase 4: Saudi Compliance Hardening

- Improve Arabic PDF fonts and RTL shaping.
- Add Hijri/Gregorian date support where needed.
- Improve VAT workflows for commercial units.
- Add receipt numbering and printable receipts.
- Add stronger Ejar number validation.

## Phase 5: Deployment

- Add production environment documentation.
- Add HTTPS/reverse proxy notes.
- Add managed database notes.
- Add CI checks for lint, build, audit, and tests.
- Add release versioning.

## Phase 6: Integrations

- Accounting export.
- SMS/WhatsApp reminders.
- Email report delivery.
- Optional payment gateway integration.
- Optional official platform integrations when requirements are clear.
