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
