# Public Release Checklist

Use this checklist before pushing the project to a public GitHub repository.

## Repository Safety

- [ ] Confirm `git status` is clean.
- [ ] Confirm `server/data/` is ignored and no local database file is committed.
- [ ] Confirm no `.env` file is committed.
- [ ] Confirm no real tenant, contract, payment, or company data exists in the repo.
- [ ] Confirm demo data is clearly fake.

## Project Files

- [ ] `README.md` explains what the project does.
- [ ] `docs/USER_GUIDE.md` exists.
- [ ] `docs/DEVELOPER_GUIDE.md` exists.
- [ ] `docs/api-contract.md` exists.
- [ ] `docs/database-schema.sql` exists.
- [ ] `.env.example` exists.
- [ ] `CONTRIBUTING.md` exists.
- [ ] `SECURITY.md` exists.
- [ ] `LICENSE` exists.

## Quality

- [ ] `npm install` works from a clean checkout.
- [ ] `npm run api` starts the API.
- [ ] `npm run dev` starts the frontend.
- [ ] `npm run check` passes.
- [ ] App works when API is online.
- [ ] App falls back when API is offline.

## Public Messaging

- [ ] README states the app is not production-ready yet.
- [ ] README states this is not legal/tax/accounting advice.
- [ ] Roadmap is clear.
- [ ] Known limitations are clear.

## Recommended Screenshots

Add screenshots before public announcement:

- [ ] Dashboard.
- [ ] Properties.
- [ ] Units.
- [ ] Contracts.
- [ ] Reports.
