import { useCallback, useState } from 'react'

export type View = 'dashboard' | 'properties' | 'units' | 'tenants' | 'contracts' | 'payments' | 'maintenance' | 'reports' | 'settings'
export type PropertyType = 'سكني' | 'تجاري' | 'مختلط'
export type UnitType = 'شقة' | 'محل'
export type UnitStatus = 'مؤجرة' | 'شاغرة' | 'صيانة'
export type ContractStatus = 'نشط' | 'ينتهي قريباً' | 'منتهي'
export type PaymentStatus = 'مدفوعة' | 'مستحقة' | 'متأخرة'
export type MaintenanceStatus = 'مفتوح' | 'قيد التنفيذ' | 'مغلق'

export type Property = {
  id: string
  name: string
  city: string
  district: string
  type: PropertyType
  units: number
  manager: string
}

export type Unit = {
  id: string
  propertyId: string
  number: string
  type: UnitType
  status: UnitStatus
  rent: number
  tenantId: string
  ejar: string
  contractEnd: string
  nextDue: string
  paid: number
  overdue: number
  vat: boolean
}

export type Tenant = {
  id: string
  name: string
  mobile: string
  nationalId: string
  email: string
}

export type Contract = {
  id: string
  ejar: string
  unitId: string
  tenantId: string
  start: string
  end: string
  rent: number
  frequency: 'شهري' | 'ربع سنوي' | 'سنوي'
  status: ContractStatus
  vat: boolean
}

export type Payment = {
  id: string
  contractId: string
  unitId: string
  tenantId: string
  dueDate: string
  amount: number
  status: PaymentStatus
}

export type Maintenance = {
  id: string
  unitId: string
  title: string
  priority: 'عادية' | 'عاجلة'
  status: MaintenanceStatus
  date: string
  cost: number
}

export const money = new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR', maximumFractionDigits: 0 })
export const number = new Intl.NumberFormat('ar-SA')

export const seedProperties: Property[] = [
  { id: 'p1', name: 'برج الندى', city: 'الرياض', district: 'العليا', type: 'مختلط', units: 12, manager: 'خالد السالم' },
  { id: 'p2', name: 'مجمع الروضة', city: 'جدة', district: 'الروضة', type: 'سكني', units: 18, manager: 'نورة العتيبي' },
]

export const seedTenants: Tenant[] = [
  { id: 't1', name: 'شركة أفق للتجارة', mobile: '0551234567', nationalId: '7001234567', email: 'info@ofuq.sa' },
  { id: 't2', name: 'محمد القحطاني', mobile: '0509876543', nationalId: '1012345678', email: 'm.qahtani@example.com' },
]

export const seedUnits: Unit[] = [
  { id: 'u1', propertyId: 'p1', number: 'A-101', type: 'شقة', status: 'مؤجرة', rent: 42000, tenantId: 't2', ejar: 'EJ-2026-1001', contractEnd: '2026-12-31', nextDue: '2026-06-01', paid: 21000, overdue: 0, vat: false },
  { id: 'u2', propertyId: 'p1', number: 'S-05', type: 'محل', status: 'مؤجرة', rent: 96000, tenantId: 't1', ejar: 'EJ-2026-1002', contractEnd: '2026-09-30', nextDue: '2026-05-15', paid: 24000, overdue: 8000, vat: true },
  { id: 'u3', propertyId: 'p2', number: 'B-204', type: 'شقة', status: 'شاغرة', rent: 36000, tenantId: '', ejar: '', contractEnd: '', nextDue: '', paid: 0, overdue: 0, vat: false },
]

export const seedContracts: Contract[] = [
  { id: 'c1', ejar: 'EJ-2026-1001', unitId: 'u1', tenantId: 't2', start: '2026-01-01', end: '2026-12-31', rent: 42000, frequency: 'ربع سنوي', status: 'نشط', vat: false },
  { id: 'c2', ejar: 'EJ-2026-1002', unitId: 'u2', tenantId: 't1', start: '2026-01-01', end: '2026-09-30', rent: 96000, frequency: 'ربع سنوي', status: 'ينتهي قريباً', vat: true },
]

export const seedPayments: Payment[] = [
  { id: 'pay1', contractId: 'c1', unitId: 'u1', tenantId: 't2', dueDate: '2026-03-01', amount: 10500, status: 'مدفوعة' },
  { id: 'pay2', contractId: 'c1', unitId: 'u1', tenantId: 't2', dueDate: '2026-06-01', amount: 10500, status: 'مستحقة' },
  { id: 'pay3', contractId: 'c2', unitId: 'u2', tenantId: 't1', dueDate: '2026-05-15', amount: 24000, status: 'متأخرة' },
]

export const seedMaintenance: Maintenance[] = [
  { id: 'm1', unitId: 'u2', title: 'صيانة تكييف المحل', priority: 'عاجلة', status: 'قيد التنفيذ', date: '2026-05-09', cost: 1800 },
  { id: 'm2', unitId: 'u3', title: 'دهان وتجهيز قبل التأجير', priority: 'عادية', status: 'مفتوح', date: '2026-05-12', cost: 2500 },
]

export function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function useStoredState<T>(key: string, seed: T[]) {
  const [items, setItems] = useState<T[]>(() => {
    const saved = localStorage.getItem(key)
    return saved ? (JSON.parse(saved) as T[]) : seed
  })

  const save = useCallback((next: T[]) => {
    setItems(next)
    localStorage.setItem(key, JSON.stringify(next))
  }, [key])

  return [items, save] as const
}
