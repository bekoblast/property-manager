create table if not exists users (
  id text primary key,
  name text not null,
  email text not null unique,
  role text not null,
  passwordHash text not null,
  passwordSalt text not null,
  active integer not null default 1
);

create table if not exists audit_logs (
  id text primary key,
  userId text,
  userEmail text,
  action text not null,
  resource text not null,
  recordId text,
  createdAt text not null,
  details text
);

create table if not exists properties (
  id text primary key,
  name text not null,
  city text not null,
  district text not null,
  type text not null,
  units integer not null default 0,
  manager text not null
);

create table if not exists tenants (
  id text primary key,
  name text not null,
  mobile text not null,
  nationalId text not null,
  email text
);

create table if not exists units (
  id text primary key,
  propertyId text not null references properties(id),
  number text not null,
  type text not null,
  status text not null,
  rent integer not null default 0,
  tenantId text,
  ejar text,
  contractEnd text,
  nextDue text,
  paid integer not null default 0,
  overdue integer not null default 0,
  vat integer not null default 0
);

create table if not exists contracts (
  id text primary key,
  ejar text not null unique,
  unitId text not null references units(id),
  tenantId text not null references tenants(id),
  start text not null,
  end text not null,
  rent integer not null default 0,
  frequency text not null,
  status text not null,
  vat integer not null default 0
);

create table if not exists payments (
  id text primary key,
  contractId text not null references contracts(id),
  unitId text not null references units(id),
  tenantId text not null references tenants(id),
  dueDate text not null,
  amount integer not null default 0,
  status text not null
);

create table if not exists maintenance (
  id text primary key,
  unitId text not null references units(id),
  title text not null,
  priority text not null,
  status text not null,
  date text not null,
  cost integer not null default 0
);

create index if not exists idx_audit_logs_created_at on audit_logs(createdAt);
create index if not exists idx_audit_logs_resource on audit_logs(resource);

create index if not exists idx_properties_city on properties(city);
create index if not exists idx_properties_type on properties(type);

create index if not exists idx_tenants_name on tenants(name);
create index if not exists idx_tenants_mobile on tenants(mobile);
create index if not exists idx_tenants_national_id on tenants(nationalId);

create index if not exists idx_units_property_id on units(propertyId);
create index if not exists idx_units_tenant_id on units(tenantId);
create index if not exists idx_units_status on units(status);
create index if not exists idx_units_ejar on units(ejar);

create index if not exists idx_contracts_unit_id on contracts(unitId);
create index if not exists idx_contracts_tenant_id on contracts(tenantId);
create index if not exists idx_contracts_status on contracts(status);
create index if not exists idx_contracts_end on contracts(end);

create index if not exists idx_payments_contract_id on payments(contractId);
create index if not exists idx_payments_unit_id on payments(unitId);
create index if not exists idx_payments_tenant_id on payments(tenantId);
create index if not exists idx_payments_due_date on payments(dueDate);
create index if not exists idx_payments_status on payments(status);

create index if not exists idx_maintenance_unit_id on maintenance(unitId);
create index if not exists idx_maintenance_status on maintenance(status);
create index if not exists idx_maintenance_priority on maintenance(priority);
create index if not exists idx_maintenance_date on maintenance(date);
