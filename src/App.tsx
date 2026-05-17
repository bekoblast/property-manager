import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  AlertTriangle,
  Banknote,
  BarChart3,
  Building2,
  CalendarClock,
  Download,
  Edit3,
  FileSpreadsheet,
  FileText,
  Home,
  Plus,
  ReceiptText,
  Search,
  Settings,
  Store,
  Trash2,
  UserRound,
  Wrench,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import './App.css'

type View = 'dashboard' | 'properties' | 'units' | 'tenants' | 'contracts' | 'payments' | 'maintenance' | 'reports' | 'settings'
type PropertyType = 'سكني' | 'تجاري' | 'مختلط'
type UnitType = 'شقة' | 'محل'
type UnitStatus = 'مؤجرة' | 'شاغرة' | 'صيانة'
type ContractStatus = 'نشط' | 'ينتهي قريباً' | 'منتهي'
type PaymentStatus = 'مدفوعة' | 'مستحقة' | 'متأخرة'
type MaintenanceStatus = 'مفتوح' | 'قيد التنفيذ' | 'مغلق'

type Property = {
  id: string
  name: string
  city: string
  district: string
  type: PropertyType
  units: number
  manager: string
}

type Unit = {
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

type Tenant = {
  id: string
  name: string
  mobile: string
  nationalId: string
  email: string
}

type Contract = {
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

type Payment = {
  id: string
  contractId: string
  unitId: string
  tenantId: string
  dueDate: string
  amount: number
  status: PaymentStatus
}

type Maintenance = {
  id: string
  unitId: string
  title: string
  priority: 'عادية' | 'عاجلة'
  status: MaintenanceStatus
  date: string
  cost: number
}

type ModalKind = 'property' | 'unit' | 'tenant' | 'contract' | 'payment' | 'maintenance'
type ModalState = { kind: ModalKind; id?: string } | null
type FormValues = Record<string, string>

const money = new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR', maximumFractionDigits: 0 })
const number = new Intl.NumberFormat('ar-SA')

const seedProperties: Property[] = [
  { id: 'p1', name: 'برج الندى', city: 'الرياض', district: 'العليا', type: 'مختلط', units: 12, manager: 'خالد السالم' },
  { id: 'p2', name: 'مجمع الروضة', city: 'جدة', district: 'الروضة', type: 'سكني', units: 18, manager: 'نورة العتيبي' },
]

const seedTenants: Tenant[] = [
  { id: 't1', name: 'شركة أفق للتجارة', mobile: '0551234567', nationalId: '7001234567', email: 'info@ofuq.sa' },
  { id: 't2', name: 'محمد القحطاني', mobile: '0509876543', nationalId: '1012345678', email: 'm.qahtani@example.com' },
]

const seedUnits: Unit[] = [
  { id: 'u1', propertyId: 'p1', number: 'A-101', type: 'شقة', status: 'مؤجرة', rent: 42000, tenantId: 't2', ejar: 'EJ-2026-1001', contractEnd: '2026-12-31', nextDue: '2026-06-01', paid: 21000, overdue: 0, vat: false },
  { id: 'u2', propertyId: 'p1', number: 'S-05', type: 'محل', status: 'مؤجرة', rent: 96000, tenantId: 't1', ejar: 'EJ-2026-1002', contractEnd: '2026-09-30', nextDue: '2026-05-15', paid: 24000, overdue: 8000, vat: true },
  { id: 'u3', propertyId: 'p2', number: 'B-204', type: 'شقة', status: 'شاغرة', rent: 36000, tenantId: '', ejar: '', contractEnd: '', nextDue: '', paid: 0, overdue: 0, vat: false },
]

const seedContracts: Contract[] = [
  { id: 'c1', ejar: 'EJ-2026-1001', unitId: 'u1', tenantId: 't2', start: '2026-01-01', end: '2026-12-31', rent: 42000, frequency: 'ربع سنوي', status: 'نشط', vat: false },
  { id: 'c2', ejar: 'EJ-2026-1002', unitId: 'u2', tenantId: 't1', start: '2026-01-01', end: '2026-09-30', rent: 96000, frequency: 'ربع سنوي', status: 'ينتهي قريباً', vat: true },
]

const seedPayments: Payment[] = [
  { id: 'pay1', contractId: 'c1', unitId: 'u1', tenantId: 't2', dueDate: '2026-03-01', amount: 10500, status: 'مدفوعة' },
  { id: 'pay2', contractId: 'c1', unitId: 'u1', tenantId: 't2', dueDate: '2026-06-01', amount: 10500, status: 'مستحقة' },
  { id: 'pay3', contractId: 'c2', unitId: 'u2', tenantId: 't1', dueDate: '2026-05-15', amount: 24000, status: 'متأخرة' },
]

const seedMaintenance: Maintenance[] = [
  { id: 'm1', unitId: 'u2', title: 'صيانة تكييف المحل', priority: 'عاجلة', status: 'قيد التنفيذ', date: '2026-05-09', cost: 1800 },
  { id: 'm2', unitId: 'u3', title: 'دهان وتجهيز قبل التأجير', priority: 'عادية', status: 'مفتوح', date: '2026-05-12', cost: 2500 },
]

const navItems: Array<{ id: View; label: string; icon: LucideIcon }> = [
  { id: 'dashboard', label: 'الرئيسية', icon: Home },
  { id: 'properties', label: 'العقارات', icon: Building2 },
  { id: 'units', label: 'الوحدات', icon: Store },
  { id: 'tenants', label: 'المستأجرون', icon: UserRound },
  { id: 'contracts', label: 'العقود', icon: FileText },
  { id: 'payments', label: 'الدفعات', icon: ReceiptText },
  { id: 'maintenance', label: 'الصيانة', icon: Wrench },
  { id: 'reports', label: 'التقارير', icon: BarChart3 },
  { id: 'settings', label: 'الإعدادات', icon: Settings },
]

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function useStoredState<T>(key: string, seed: T[]) {
  const [items, setItems] = useState<T[]>(() => {
    const saved = localStorage.getItem(key)
    return saved ? (JSON.parse(saved) as T[]) : seed
  })

  const save = (next: T[]) => {
    setItems(next)
    localStorage.setItem(key, JSON.stringify(next))
  }

  return [items, save] as const
}

function App() {
  const [activeView, setActiveView] = useState<View>('dashboard')
  const [query, setQuery] = useState('')
  const [modal, setModal] = useState<ModalState>(null)
  const [form, setForm] = useState<FormValues>({})
  const [properties, setProperties] = useStoredState<Property>('aqarati.properties', seedProperties)
  const [units, setUnits] = useStoredState<Unit>('aqarati.units', seedUnits)
  const [tenants, setTenants] = useStoredState<Tenant>('aqarati.tenants', seedTenants)
  const [contracts, setContracts] = useStoredState<Contract>('aqarati.contracts', seedContracts)
  const [payments, setPayments] = useStoredState<Payment>('aqarati.payments', seedPayments)
  const [maintenance, setMaintenance] = useStoredState<Maintenance>('aqarati.maintenance', seedMaintenance)

  const propertyName = (id: string) => properties.find((property) => property.id === id)?.name || 'غير محدد'
  const tenantName = (id: string) => tenants.find((tenant) => tenant.id === id)?.name || 'بدون مستأجر'
  const unitLabel = (id: string) => {
    const unit = units.find((item) => item.id === id)
    return unit ? `${unit.number} - ${propertyName(unit.propertyId)}` : 'غير محدد'
  }

  const totals = useMemo(() => {
    const rented = units.filter((unit) => unit.status === 'مؤجرة').length
    const vacant = units.filter((unit) => unit.status === 'شاغرة').length
    const overdue = payments.filter((payment) => payment.status === 'متأخرة').reduce((sum, payment) => sum + payment.amount, 0)
    const annualRent = units.reduce((sum, unit) => sum + unit.rent, 0)
    const collected = payments.filter((payment) => payment.status === 'مدفوعة').reduce((sum, payment) => sum + payment.amount, 0)
    return { rented, vacant, overdue, annualRent, collected, occupancy: units.length ? Math.round((rented / units.length) * 100) : 0 }
  }, [payments, units])

  const filteredUnits = units.filter((unit) => {
    const text = `${unit.number} ${propertyName(unit.propertyId)} ${tenantName(unit.tenantId)} ${unit.ejar}`
    return text.toLowerCase().includes(query.toLowerCase())
  })

  const chartData = properties.map((property) => ({
    name: property.name,
    rent: units.filter((unit) => unit.propertyId === property.id).reduce((sum, unit) => sum + unit.rent, 0),
  }))

  const statusData = [
    { name: 'مؤجرة', value: totals.rented, color: '#0b6b4f' },
    { name: 'شاغرة', value: totals.vacant, color: '#d6a84f' },
    { name: 'صيانة', value: units.filter((unit) => unit.status === 'صيانة').length, color: '#c2410c' },
  ]

  const setField = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }))

  const openModal = (kind: ModalKind, id?: string) => {
    const existing = getExisting(kind, id)
    setForm(existing)
    setModal({ kind, id })
  }

  const getExisting = (kind: ModalKind, id?: string): FormValues => {
    if (kind === 'property') {
      const item = properties.find((property) => property.id === id)
      return item ? stringify(item) : { name: '', city: 'الرياض', district: '', type: 'سكني', units: '1', manager: '' }
    }
    if (kind === 'unit') {
      const item = units.find((unit) => unit.id === id)
      return item ? stringify(item) : { propertyId: properties[0]?.id || '', number: '', type: 'شقة', status: 'شاغرة', rent: '0', tenantId: '', ejar: '', contractEnd: '', nextDue: '', paid: '0', overdue: '0', vat: 'false' }
    }
    if (kind === 'tenant') {
      const item = tenants.find((tenant) => tenant.id === id)
      return item ? stringify(item) : { name: '', mobile: '', nationalId: '', email: '' }
    }
    if (kind === 'contract') {
      const item = contracts.find((contract) => contract.id === id)
      return item ? stringify(item) : { ejar: '', unitId: units[0]?.id || '', tenantId: tenants[0]?.id || '', start: '2026-01-01', end: '2026-12-31', rent: '0', frequency: 'سنوي', status: 'نشط', vat: 'false' }
    }
    if (kind === 'payment') {
      const item = payments.find((payment) => payment.id === id)
      return item ? stringify(item) : { contractId: contracts[0]?.id || '', unitId: units[0]?.id || '', tenantId: tenants[0]?.id || '', dueDate: '2026-05-10', amount: '0', status: 'مستحقة' }
    }
    const item = maintenance.find((request) => request.id === id)
    return item ? stringify(item) : { unitId: units[0]?.id || '', title: '', priority: 'عادية', status: 'مفتوح', date: '2026-05-10', cost: '0' }
  }

  const stringify = (item: Record<string, string | number | boolean>) =>
    Object.fromEntries(Object.entries(item).map(([key, value]) => [key, String(value)]))

  const submitForm = (event: FormEvent) => {
    event.preventDefault()
    if (!modal) return

    if (modal.kind === 'property') {
      const next: Property = { id: modal.id || uid('p'), name: form.name, city: form.city, district: form.district, type: form.type as PropertyType, units: Number(form.units), manager: form.manager }
      setProperties(upsert(properties, next))
    }
    if (modal.kind === 'unit') {
      const next: Unit = { id: modal.id || uid('u'), propertyId: form.propertyId, number: form.number, type: form.type as UnitType, status: form.status as UnitStatus, rent: Number(form.rent), tenantId: form.tenantId, ejar: form.ejar, contractEnd: form.contractEnd, nextDue: form.nextDue, paid: Number(form.paid), overdue: Number(form.overdue), vat: form.vat === 'true' }
      setUnits(upsert(units, next))
    }
    if (modal.kind === 'tenant') {
      const next: Tenant = { id: modal.id || uid('t'), name: form.name, mobile: form.mobile, nationalId: form.nationalId, email: form.email }
      setTenants(upsert(tenants, next))
    }
    if (modal.kind === 'contract') {
      const next: Contract = { id: modal.id || uid('c'), ejar: form.ejar, unitId: form.unitId, tenantId: form.tenantId, start: form.start, end: form.end, rent: Number(form.rent), frequency: form.frequency as Contract['frequency'], status: form.status as ContractStatus, vat: form.vat === 'true' }
      setContracts(upsert(contracts, next))
      setUnits(units.map((unit) => (unit.id === next.unitId ? { ...unit, status: 'مؤجرة', tenantId: next.tenantId, ejar: next.ejar, contractEnd: next.end, rent: next.rent, vat: next.vat } : unit)))
    }
    if (modal.kind === 'payment') {
      const next: Payment = { id: modal.id || uid('pay'), contractId: form.contractId, unitId: form.unitId, tenantId: form.tenantId, dueDate: form.dueDate, amount: Number(form.amount), status: form.status as PaymentStatus }
      setPayments(upsert(payments, next))
    }
    if (modal.kind === 'maintenance') {
      const next: Maintenance = { id: modal.id || uid('m'), unitId: form.unitId, title: form.title, priority: form.priority as Maintenance['priority'], status: form.status as MaintenanceStatus, date: form.date, cost: Number(form.cost) }
      setMaintenance(upsert(maintenance, next))
    }
    setModal(null)
  }

  const upsert = <T extends { id: string }>(items: T[], item: T) => (items.some((current) => current.id === item.id) ? items.map((current) => (current.id === item.id ? item : current)) : [item, ...items])

  const removeItem = (kind: ModalKind, id: string) => {
    if (kind === 'property' && units.some((unit) => unit.propertyId === id)) return alert('لا يمكن حذف عقار مرتبط بوحدات.')
    if (kind === 'tenant' && units.some((unit) => unit.tenantId === id)) return alert('لا يمكن حذف مستأجر مرتبط بوحدة أو عقد.')
    if (kind === 'property') setProperties(properties.filter((item) => item.id !== id))
    if (kind === 'unit') {
      setUnits(units.filter((item) => item.id !== id))
      setContracts(contracts.filter((item) => item.unitId !== id))
      setPayments(payments.filter((item) => item.unitId !== id))
    }
    if (kind === 'tenant') setTenants(tenants.filter((item) => item.id !== id))
    if (kind === 'contract') setContracts(contracts.filter((item) => item.id !== id))
    if (kind === 'payment') setPayments(payments.filter((item) => item.id !== id))
    if (kind === 'maintenance') setMaintenance(maintenance.filter((item) => item.id !== id))
  }

  const exportExcel = async () => {
    const ExcelJS = await import('exceljs')
    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('تقرير الأملاك')
    sheet.views = [{ rightToLeft: true }]
    sheet.columns = [
      { header: 'العقار', key: 'property', width: 22 },
      { header: 'الوحدة', key: 'unit', width: 14 },
      { header: 'المستأجر', key: 'tenant', width: 24 },
      { header: 'رقم إيجار', key: 'ejar', width: 18 },
      { header: 'الإيجار السنوي', key: 'rent', width: 16 },
      { header: 'الحالة', key: 'status', width: 14 },
      { header: 'المتأخرات', key: 'overdue', width: 16 },
    ]
    filteredUnits.forEach((unit) => sheet.addRow({ property: propertyName(unit.propertyId), unit: unit.number, tenant: tenantName(unit.tenantId), ejar: unit.ejar, rent: unit.rent, status: unit.status, overdue: unit.overdue }))
    const buffer = await workbook.xlsx.writeBuffer()
    downloadBlob(buffer, 'aqarati-report.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  }

  const exportPdf = async () => {
    const { default: jsPDF } = await import('jspdf')
    const { default: autoTable } = await import('jspdf-autotable')
    const doc = new jsPDF({ orientation: 'landscape' })
    doc.text('Aqarati Property Report', 14, 14)
    autoTable(doc, {
      head: [['Property', 'Unit', 'Tenant', 'Ejar', 'Annual Rent', 'Status', 'Overdue']],
      body: filteredUnits.map((unit) => [propertyName(unit.propertyId), unit.number, tenantName(unit.tenantId), unit.ejar || '-', unit.rent, unit.status, unit.overdue]),
    })
    doc.save('aqarati-report.pdf')
  }

  const downloadBlob = (content: BlobPart, filename: string, type: string) => {
    const url = URL.createObjectURL(new Blob([content], { type }))
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="app-shell" dir="rtl">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">ع</div>
          <div>
            <strong>عقارتي</strong>
            <span>إدارة الأملاك والإيجارات</span>
          </div>
        </div>
        <nav aria-label="التنقل الرئيسي">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <button key={item.id} className={`nav-item ${activeView === item.id ? 'active' : ''}`} onClick={() => setActiveView(item.id)}>
                <Icon size={18} />
                {item.label}
              </button>
            )
          })}
        </nav>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">المملكة العربية السعودية</p>
            <h1>{navItems.find((item) => item.id === activeView)?.label}</h1>
          </div>
          <div className="toolbar">
            <label className="search">
              <Search size={17} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="بحث بالوحدة، العقار، المستأجر أو رقم إيجار" />
            </label>
          </div>
        </header>

        {activeView === 'dashboard' && renderDashboard()}
        {activeView === 'properties' && renderProperties()}
        {activeView === 'units' && renderUnits()}
        {activeView === 'tenants' && renderTenants()}
        {activeView === 'contracts' && renderContracts()}
        {activeView === 'payments' && renderPayments()}
        {activeView === 'maintenance' && renderMaintenance()}
        {activeView === 'reports' && renderReports()}
        {activeView === 'settings' && renderSettings()}
      </main>

      {modal && renderModal()}
    </div>
  )

  function renderDashboard() {
    return (
      <>
        <section className="summary-grid">
          <Summary icon={Building2} label="العقارات" value={number.format(properties.length)} note="مدن ومواقع متعددة" />
          <Summary icon={Home} label="نسبة الإشغال" value={`${number.format(totals.occupancy)}%`} note={`${number.format(totals.rented)} مؤجرة من ${number.format(units.length)}`} />
          <Summary icon={Banknote} label="الإيجار السنوي" value={money.format(totals.annualRent)} note="بالريال السعودي" />
          <Summary icon={AlertTriangle} label="متأخرات" value={money.format(totals.overdue)} note="تحتاج متابعة" warning />
        </section>
        <section className="dashboard-grid">
          <div className="panel span-2">
            <PanelHead title="دخل العقارات" subtitle="إجمالي الإيجارات السنوية حسب العقار" />
            <div className="chart-box">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => money.format(Number(value))} />
                  <Bar dataKey="rent" fill="#0b6b4f" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="panel">
            <PanelHead title="حالة الوحدات" subtitle="مؤجرة، شاغرة، وصيانة" />
            <div className="donut-box">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90}>
                    {statusData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="legend">{statusData.map((item) => <span key={item.name}><i style={{ background: item.color }} />{item.name}</span>)}</div>
          </div>
        </section>
        <section className="alerts-row">
          <Alert icon={CalendarClock} title="استحقاقات قريبة" text={`${payments.filter((payment) => payment.status === 'مستحقة').length} دفعات تحتاج متابعة هذا الشهر.`} />
          <Alert icon={FileText} title="عقود إيجار" text={`${contracts.filter((contract) => contract.status === 'ينتهي قريباً').length} عقود تنتهي قريباً.`} />
          <Alert icon={Wrench} title="طلبات صيانة" text={`${maintenance.filter((request) => request.status !== 'مغلق').length} طلبات مفتوحة أو قيد التنفيذ.`} />
        </section>
      </>
    )
  }

  function renderProperties() {
    return (
      <section className="panel">
        <PanelHead title="العقارات" subtitle="إدارة المباني والمجمعات" action="إضافة عقار" onAction={() => openModal('property')} />
        <div className="property-grid">
          {properties.map((property) => (
            <article className="property-card" key={property.id}>
              <span>{property.city} - {property.district}</span>
              <h3>{property.name}</h3>
              <p>{property.type}</p>
              <div className="property-stats"><strong>{number.format(units.filter((unit) => unit.propertyId === property.id).length)} وحدة</strong><span>المدير: {property.manager}</span></div>
              <RowActions onEdit={() => openModal('property', property.id)} onDelete={() => removeItem('property', property.id)} />
            </article>
          ))}
        </div>
      </section>
    )
  }

  function renderUnits() {
    return (
      <section className="panel">
        <PanelHead title="الوحدات" subtitle="الشقق والمحلات وحالة التأجير" action="إضافة وحدة" onAction={() => openModal('unit')} />
        <Table headers={['الوحدة', 'العقار', 'المستأجر', 'رقم إيجار', 'الإيجار', 'نهاية العقد', 'الحالة', 'إجراءات']}>
          {filteredUnits.map((unit) => (
            <tr key={unit.id}>
              <td>{unit.number}<span>{unit.type}</span></td>
              <td>{propertyName(unit.propertyId)}</td>
              <td>{tenantName(unit.tenantId)}</td>
              <td>{unit.ejar || '-'}</td>
              <td>{money.format(unit.rent)}<span>{unit.vat ? 'يشمل ضريبة القيمة المضافة' : 'سكني بدون ضريبة'}</span></td>
              <td>{unit.contractEnd || '-'}</td>
              <td><Status text={unit.status} /></td>
              <td><RowActions onEdit={() => openModal('unit', unit.id)} onDelete={() => removeItem('unit', unit.id)} /></td>
            </tr>
          ))}
        </Table>
      </section>
    )
  }

  function renderTenants() {
    return (
      <section className="panel">
        <PanelHead title="المستأجرون" subtitle="بيانات التواصل والهوية" action="إضافة مستأجر" onAction={() => openModal('tenant')} />
        <div className="property-grid">
          {tenants.map((tenant) => (
            <article className="property-card" key={tenant.id}>
              <h3>{tenant.name}</h3>
              <div className="tenant-meta">
                <span>الجوال: {tenant.mobile}</span>
                <span>الهوية / السجل: {tenant.nationalId}</span>
                <span>البريد: {tenant.email}</span>
              </div>
              <RowActions onEdit={() => openModal('tenant', tenant.id)} onDelete={() => removeItem('tenant', tenant.id)} />
            </article>
          ))}
        </div>
      </section>
    )
  }

  function renderContracts() {
    return (
      <section className="panel">
        <PanelHead title="العقود" subtitle="عقود إيجار وربطها بالوحدات" action="إضافة عقد" onAction={() => openModal('contract')} />
        <Table headers={['رقم إيجار', 'الوحدة', 'المستأجر', 'البداية', 'النهاية', 'القيمة', 'الدورية', 'الحالة', 'إجراءات']}>
          {contracts.map((contract) => (
            <tr key={contract.id}>
              <td>{contract.ejar}</td>
              <td>{unitLabel(contract.unitId)}</td>
              <td>{tenantName(contract.tenantId)}</td>
              <td>{contract.start}</td>
              <td>{contract.end}</td>
              <td>{money.format(contract.rent)}</td>
              <td>{contract.frequency}</td>
              <td><Status text={contract.status} /></td>
              <td><RowActions onEdit={() => openModal('contract', contract.id)} onDelete={() => removeItem('contract', contract.id)} /></td>
            </tr>
          ))}
        </Table>
      </section>
    )
  }

  function renderPayments() {
    return (
      <section className="panel">
        <PanelHead title="الدفعات" subtitle="متابعة المستحق والمدفوع والمتأخر" action="إضافة دفعة" onAction={() => openModal('payment')} />
        <Table headers={['تاريخ الاستحقاق', 'العقد', 'الوحدة', 'المستأجر', 'المبلغ', 'الحالة', 'إجراءات']}>
          {payments.map((payment) => (
            <tr key={payment.id}>
              <td>{payment.dueDate}</td>
              <td>{contracts.find((contract) => contract.id === payment.contractId)?.ejar || '-'}</td>
              <td>{unitLabel(payment.unitId)}</td>
              <td>{tenantName(payment.tenantId)}</td>
              <td>{money.format(payment.amount)}</td>
              <td><Status text={payment.status} /></td>
              <td><RowActions onEdit={() => openModal('payment', payment.id)} onDelete={() => removeItem('payment', payment.id)} /></td>
            </tr>
          ))}
        </Table>
      </section>
    )
  }

  function renderMaintenance() {
    return (
      <section className="panel">
        <PanelHead title="الصيانة" subtitle="بلاغات الصيانة وتكاليفها" action="إضافة طلب" onAction={() => openModal('maintenance')} />
        <Table headers={['التاريخ', 'الوحدة', 'الطلب', 'الأولوية', 'الحالة', 'التكلفة', 'إجراءات']}>
          {maintenance.map((request) => (
            <tr key={request.id}>
              <td>{request.date}</td>
              <td>{unitLabel(request.unitId)}</td>
              <td>{request.title}</td>
              <td>{request.priority}</td>
              <td><Status text={request.status} /></td>
              <td>{money.format(request.cost)}</td>
              <td><RowActions onEdit={() => openModal('maintenance', request.id)} onDelete={() => removeItem('maintenance', request.id)} /></td>
            </tr>
          ))}
        </Table>
      </section>
    )
  }

  function renderReports() {
    return (
      <section className="panel report-panel">
        <div className="report-actions">
          <PanelHead title="تقرير المدير" subtitle="ملخص تنفيذي قابل للحفظ Excel و PDF" />
          <div className="action-buttons">
            <button onClick={exportExcel}><FileSpreadsheet size={17} /> Excel</button>
            <button onClick={exportPdf}><Download size={17} /> PDF</button>
          </div>
        </div>
        <div className="report-metrics">
          <Metric label="المحصّل" value={money.format(totals.collected)} />
          <Metric label="المتأخر" value={money.format(totals.overdue)} />
          <Metric label="الوحدات الشاغرة" value={number.format(totals.vacant)} />
          <Metric label="العقود النشطة" value={number.format(contracts.filter((contract) => contract.status === 'نشط').length)} />
        </div>
        <div className="report-list">
          {filteredUnits.map((unit) => (
            <div className="unit-card" key={unit.id}>
              <div><strong>{propertyName(unit.propertyId)}</strong><span>{unit.type} {unit.number}</span></div>
              <div><span>المستأجر</span><b>{tenantName(unit.tenantId)}</b></div>
              <div><span>التحصيل</span><b>{money.format(unit.paid)} / متأخر {money.format(unit.overdue)}</b></div>
            </div>
          ))}
        </div>
      </section>
    )
  }

  function renderSettings() {
    return (
      <section className="panel view-panel">
        <PanelHead title="الإعدادات" subtitle="ثوابت سعودية جاهزة للنسخة الحالية" />
        <div className="view-grid">
          <Metric label="العملة" value="ريال سعودي SAR" />
          <Metric label="العقود" value="متوافق مع رقم إيجار" />
          <Metric label="اللغة" value="العربية واتجاه RTL" />
        </div>
      </section>
    )
  }

  function renderModal() {
    if (!modal) return null
    const title = modalTitles[modal.kind]
    return (
      <div className="modal-backdrop">
        <form className="modal" onSubmit={submitForm}>
          <div className="modal-head">
            <div>
              <h2>{title}</h2>
              <p>أدخل البيانات الأساسية واحفظ التغيير.</p>
            </div>
            <button className="icon-button" type="button" onClick={() => setModal(null)}><X size={18} /></button>
          </div>
          <div className="form-grid">{fieldsFor(modal.kind).map(renderField)}</div>
          <div className="modal-actions">
            <button className="primary-action" type="submit">حفظ</button>
            <button className="secondary-action" type="button" onClick={() => setModal(null)}>إلغاء</button>
          </div>
        </form>
      </div>
    )
  }

  function renderField(field: Field) {
    if (field.type === 'select') {
      return (
        <label className="field" key={field.name}>
          <span>{field.label}</span>
          <select name={field.name} value={form[field.name] || ''} onChange={(event) => setField(field.name, event.target.value)} required={field.required}>
            {field.options.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
          </select>
        </label>
      )
    }

    return (
      <label className="field" key={field.name}>
        <span>{field.label}</span>
        <input name={field.name} value={form[field.name] || ''} type={field.type} onChange={(event) => setField(field.name, event.target.value)} required={field.required} />
      </label>
    )
  }

  function fieldsFor(kind: ModalKind): Field[] {
    const propertyOptions = properties.map((property) => ({ value: property.id, label: property.name }))
    const unitOptions = units.map((unit) => ({ value: unit.id, label: unitLabel(unit.id) }))
    const tenantOptions = [{ value: '', label: 'بدون مستأجر' }, ...tenants.map((tenant) => ({ value: tenant.id, label: tenant.name }))]
    const contractOptions = contracts.map((contract) => ({ value: contract.id, label: contract.ejar }))

    if (kind === 'property') return [
      text('name', 'اسم العقار'), text('city', 'المدينة'), text('district', 'الحي'), select('type', 'النوع', ['سكني', 'تجاري', 'مختلط']), numberField('units', 'عدد الوحدات'), text('manager', 'مدير العقار'),
    ]
    if (kind === 'unit') return [
      selectFrom('propertyId', 'العقار', propertyOptions), text('number', 'رقم الوحدة'), select('type', 'نوع الوحدة', ['شقة', 'محل']), select('status', 'الحالة', ['مؤجرة', 'شاغرة', 'صيانة']), numberField('rent', 'الإيجار السنوي'), selectFrom('tenantId', 'المستأجر', tenantOptions), text('ejar', 'رقم إيجار'), text('contractEnd', 'نهاية العقد'), text('nextDue', 'الاستحقاق القادم'), numberField('paid', 'المدفوع'), numberField('overdue', 'المتأخر'), selectFrom('vat', 'ضريبة القيمة المضافة', [{ value: 'false', label: 'لا' }, { value: 'true', label: 'نعم' }]),
    ]
    if (kind === 'tenant') return [text('name', 'الاسم'), text('mobile', 'الجوال'), text('nationalId', 'الهوية / السجل'), text('email', 'البريد الإلكتروني')]
    if (kind === 'contract') return [
      text('ejar', 'رقم إيجار'), selectFrom('unitId', 'الوحدة', unitOptions), selectFrom('tenantId', 'المستأجر', tenantOptions.filter((option) => option.value)), text('start', 'تاريخ البداية'), text('end', 'تاريخ النهاية'), numberField('rent', 'قيمة العقد'), select('frequency', 'الدورية', ['شهري', 'ربع سنوي', 'سنوي']), select('status', 'الحالة', ['نشط', 'ينتهي قريباً', 'منتهي']), selectFrom('vat', 'ضريبة القيمة المضافة', [{ value: 'false', label: 'لا' }, { value: 'true', label: 'نعم' }]),
    ]
    if (kind === 'payment') return [
      selectFrom('contractId', 'العقد', contractOptions), selectFrom('unitId', 'الوحدة', unitOptions), selectFrom('tenantId', 'المستأجر', tenantOptions.filter((option) => option.value)), text('dueDate', 'تاريخ الاستحقاق'), numberField('amount', 'المبلغ'), select('status', 'الحالة', ['مدفوعة', 'مستحقة', 'متأخرة']),
    ]
    return [selectFrom('unitId', 'الوحدة', unitOptions), text('title', 'وصف الطلب'), select('priority', 'الأولوية', ['عادية', 'عاجلة']), select('status', 'الحالة', ['مفتوح', 'قيد التنفيذ', 'مغلق']), text('date', 'التاريخ'), numberField('cost', 'التكلفة')]
  }
}

type Field = { name: string; label: string; type: 'text' | 'number'; required: boolean } | { name: string; label: string; type: 'select'; required: boolean; options: Array<{ value: string; label: string }> }

const modalTitles: Record<ModalKind, string> = {
  property: 'بيانات العقار',
  unit: 'بيانات الوحدة',
  tenant: 'بيانات المستأجر',
  contract: 'بيانات العقد',
  payment: 'بيانات الدفعة',
  maintenance: 'طلب صيانة',
}

const text = (name: string, label: string): Field => ({ name, label, type: 'text', required: true })
const numberField = (name: string, label: string): Field => ({ name, label, type: 'number', required: true })
const select = (name: string, label: string, values: string[]): Field => ({ name, label, type: 'select', required: true, options: values.map((value) => ({ value, label: value })) })
const selectFrom = (name: string, label: string, options: Array<{ value: string; label: string }>): Field => ({ name, label, type: 'select', required: true, options })

function PanelHead({ title, subtitle, action, onAction }: { title: string; subtitle: string; action?: string; onAction?: () => void }) {
  return (
    <div className="panel-head">
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      {action && <button className="primary-action" onClick={onAction}><Plus size={17} />{action}</button>}
    </div>
  )
}

function Summary({ icon: Icon, label, value, note, warning }: { icon: LucideIcon; label: string; value: string; note: string; warning?: boolean }) {
  return (
    <article className={`summary-card ${warning ? 'warning' : ''}`}>
      <div className="summary-icon"><Icon size={20} /></div>
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{note}</p>
    </article>
  )
}

function Alert({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) {
  return (
    <article className="alert-card">
      <div><Icon size={22} /></div>
      <strong>{title}</strong>
      <p>{text}</p>
    </article>
  )
}

function Table({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <div className="table-wrap">
      <table>
        <thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

function Status({ text }: { text: string }) {
  const className = text.includes('متأخرة') || text.includes('عاجلة') ? 'late-status' : text.includes('شاغرة') || text.includes('منتهي') ? 'vacant' : text.includes('صيانة') || text.includes('قيد') ? 'maintenance' : 'rented'
  return <span className={`status ${className}`}>{text}</span>
}

function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="row-actions">
      <button type="button" onClick={onEdit} title="تعديل"><Edit3 size={16} /></button>
      <button type="button" onClick={onDelete} title="حذف"><Trash2 size={16} /></button>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="report-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

export default App
