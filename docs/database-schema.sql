-- Aqarati production database draft
-- Target: PostgreSQL-compatible schema for a Saudi property-management system.

create table companies (
  id uuid primary key,
  name text not null,
  vat_number text,
  commercial_registration text,
  city text not null,
  created_at timestamptz not null default now()
);

create table users (
  id uuid primary key,
  company_id uuid not null references companies(id) on delete cascade,
  full_name text not null,
  email text not null,
  mobile text,
  role text not null check (role in ('manager', 'accountant', 'leasing', 'maintenance', 'viewer')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (company_id, email)
);

create table properties (
  id uuid primary key,
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  city text not null,
  district text not null,
  property_type text not null check (property_type in ('residential', 'commercial', 'mixed')),
  manager_user_id uuid references users(id),
  created_at timestamptz not null default now()
);

create table units (
  id uuid primary key,
  property_id uuid not null references properties(id) on delete cascade,
  unit_number text not null,
  unit_type text not null check (unit_type in ('flat', 'shop')),
  status text not null check (status in ('rented', 'vacant', 'maintenance')),
  annual_rent numeric(12, 2) not null default 0,
  vat_applicable boolean not null default false,
  created_at timestamptz not null default now(),
  unique (property_id, unit_number)
);

create table tenants (
  id uuid primary key,
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  tenant_type text not null check (tenant_type in ('individual', 'company')),
  national_id_or_cr text not null,
  mobile text not null,
  email text,
  created_at timestamptz not null default now(),
  unique (company_id, national_id_or_cr)
);

create table contracts (
  id uuid primary key,
  unit_id uuid not null references units(id),
  tenant_id uuid not null references tenants(id),
  ejar_number text not null,
  start_date date not null,
  end_date date not null,
  annual_rent numeric(12, 2) not null,
  payment_frequency text not null check (payment_frequency in ('monthly', 'quarterly', 'yearly')),
  vat_applicable boolean not null default false,
  status text not null check (status in ('active', 'ending_soon', 'expired')),
  created_at timestamptz not null default now(),
  unique (ejar_number)
);

create table payments (
  id uuid primary key,
  contract_id uuid not null references contracts(id) on delete cascade,
  due_date date not null,
  amount numeric(12, 2) not null,
  status text not null check (status in ('paid', 'due', 'overdue')),
  paid_at timestamptz,
  receipt_number text,
  created_at timestamptz not null default now()
);

create table maintenance_requests (
  id uuid primary key,
  unit_id uuid not null references units(id),
  title text not null,
  priority text not null check (priority in ('normal', 'urgent')),
  status text not null check (status in ('open', 'in_progress', 'closed')),
  requested_at date not null,
  estimated_cost numeric(12, 2) not null default 0,
  closed_at timestamptz
);

create index idx_units_property_id on units(property_id);
create index idx_contracts_unit_id on contracts(unit_id);
create index idx_contracts_tenant_id on contracts(tenant_id);
create index idx_payments_contract_id on payments(contract_id);
create index idx_payments_due_status on payments(due_date, status);
create index idx_maintenance_unit_id on maintenance_requests(unit_id);
