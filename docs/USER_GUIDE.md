# User Guide

This guide is for company staff using Aqarati to manage properties, flats, shops, tenants, contracts, payments, maintenance, and reports.

## Opening The App

Ask your technical team for the app URL. In local development, the app opens at:

```text
http://127.0.0.1:3000/
```

The top status badge shows one of two modes:

- `متصل بالـ API`: data is connected to the local backend database.
- `وضع محلي`: data is saved in this browser only.

For real company work, use API mode.

## Main Sections

- `الرئيسية`: management dashboard with occupancy, annual rent, late payments, and alerts.
- `العقارات`: buildings and property groups.
- `الوحدات`: flats and shops inside properties.
- `المستأجرون`: tenant contact and identity records.
- `العقود`: Ejar-linked rental contracts.
- `الدفعات`: rent installments, due payments, paid payments, and late payments.
- `الصيانة`: maintenance requests and estimated costs.
- `التقارير`: manager summary and Excel/PDF export.
- `الإعدادات`: current Saudi-focused app settings.

## Daily Workflow

1. Add the property in `العقارات`.
2. Add flats or shops in `الوحدات`.
3. Add the tenant in `المستأجرون`.
4. Create the contract in `العقود` and enter the Ejar number.
5. Track installments in `الدفعات`.
6. Register maintenance requests in `الصيانة`.
7. Export manager reports from `التقارير`.

## Adding Data

Open the section you need and press the green add button.

Examples:

- `إضافة عقار`
- `إضافة وحدة`
- `إضافة مستأجر`
- `إضافة عقد`
- `إضافة دفعة`
- `إضافة طلب`

Fill the form and press `حفظ`.

## Editing And Deleting

Each row or card has two action buttons:

- Pencil icon: edit.
- Trash icon: delete.

Some deletes are blocked for safety. For example, you cannot delete a property that still has units, and you cannot delete a tenant that is linked to units or contracts.

## Contracts

Contracts should include:

- Ejar number.
- Unit.
- Tenant.
- Start date.
- End date.
- Rent value in Saudi Riyal.
- Payment frequency.
- VAT setting when applicable.

When a contract is saved, the linked unit is updated with the tenant, Ejar number, rent, and contract end date.

## Payments

Use `الدفعات` to track:

- `مدفوعة`: paid.
- `مستحقة`: due.
- `متأخرة`: late.

Late payments appear in dashboard and reports.

## Reports

The manager report summarizes:

- Collected amounts.
- Late amounts.
- Vacant units.
- Active contracts.
- Unit-level rent and tenant status.

Use:

- `Excel` for spreadsheet export.
- `PDF` for printable/exportable report.

## Important Notes

- This app is not a legal replacement for official Ejar, tax, or accounting systems.
- Confirm all contract and VAT details with your company policy and Saudi regulations.
- If the app shows local mode, data is saved only on the current browser.
- For production use, the company should enable authentication, backups, and role-based access.
