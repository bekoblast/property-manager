# Security Policy

## Current Status

Aqarati is currently a prototype/local-development application. It is not production-ready for sensitive company data.

## Do Not Store Real Sensitive Data Yet

Until authentication, authorization, backups, and production database controls are implemented, do not store:

- Real tenant national IDs.
- Real contracts.
- Real payment records.
- Private company financial data.
- API keys or passwords.

## Reporting Security Issues

If this project is published publicly, report security issues privately to the repository owner instead of opening a public issue.

Include:

- A short description.
- Steps to reproduce.
- Impact.
- Suggested fix, if known.

## Before Production

Required security work:

- Authentication.
- Role-based authorization.
- Server-side validation.
- Audit logging for sensitive changes.
- Secure session or token handling.
- Database backup and restore process.
- HTTPS deployment.
- Secrets management.
- Dependency monitoring.
