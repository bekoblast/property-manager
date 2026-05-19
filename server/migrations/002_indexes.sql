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
