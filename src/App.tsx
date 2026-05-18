import { useEffect, useMemo, useState } from 'react'
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
import { apiAuditLogs, apiBackups, apiCreateBackup, apiDelete, apiHealth, apiList, apiLogin, apiLogout, apiMe, apiRestoreBackup, apiSave, getAuthToken, setAuthToken } from './api'
import type { ApiResource, AuditLog, AuthUser, BackupFile, UserRole } from './api'
import {
  money,
  number,
  seedContracts,
  seedMaintenance,
  seedPayments,
  seedProperties,
  seedTenants,
  seedUnits,
  uid,
  useStoredState,
} from './data'
import type {
  Contract,
  ContractStatus,
  Maintenance,
  MaintenanceStatus,
  Payment,
  PaymentStatus,
  Property,
  PropertyType,
  Tenant,
  Unit,
  UnitStatus,
  UnitType,
  View,
} from './data'
import './App.css'

type ModalKind = 'property' | 'unit' | 'tenant' | 'contract' | 'payment' | 'maintenance'
type ModalState = { kind: ModalKind; id?: string } | null
type FormValues = Record<string, string>
type LoginForm = { email: string; password: string }

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

const roleViews: Record<UserRole, View[]> = {
  manager: ['dashboard', 'properties', 'units', 'tenants', 'contracts', 'payments', 'maintenance', 'reports', 'settings'],
  accountant: ['dashboard', 'properties', 'units', 'tenants', 'contracts', 'payments', 'reports'],
  leasing: ['dashboard', 'properties', 'units', 'tenants', 'contracts', 'reports'],
  maintenance: ['dashboard', 'units', 'maintenance'],
  viewer: ['dashboard', 'properties', 'units', 'tenants', 'contracts', 'payments', 'maintenance', 'reports'],
}

function App() {
  const [activeView, setActiveView] = useState<View>('dashboard')
  const [query, setQuery] = useState('')
  const [modal, setModal] = useState<ModalState>(null)
  const [form, setForm] = useState<FormValues>({})
  const [apiOnline, setApiOnline] = useState(false)
  const [syncMessage, setSyncMessage] = useState('محلي')
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [loginForm, setLoginForm] = useState<LoginForm>({ email: 'manager@aqarati.local', password: 'demo12345' })
  const [loginError, setLoginError] = useState('')
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [backups, setBackups] = useState<BackupFile[]>([])
  const [adminMessage, setAdminMessage] = useState('')
  const [properties, setProperties] = useStoredState<Property>('aqarati.properties', seedProperties)
  const [units, setUnits] = useStoredState<Unit>('aqarati.units', seedUnits)
  const [tenants, setTenants] = useStoredState<Tenant>('aqarati.tenants', seedTenants)
  const [contracts, setContracts] = useStoredState<Contract>('aqarati.contracts', seedContracts)
  const [payments, setPayments] = useStoredState<Payment>('aqarati.payments', seedPayments)
  const [maintenance, setMaintenance] = useStoredState<Maintenance>('aqarati.maintenance', seedMaintenance)

  useEffect(() => {
    let active = true

    async function loadApiData() {
      const online = await apiHealth()
      if (!active) return
      setApiOnline(online)
      setSyncMessage(online ? 'متصل بالـ API' : 'وضع محلي')

      if (!online) return

      if (getAuthToken()) {
        try {
          const user = await apiMe()
          if (!active) return
          setAuthUser(user)
        } catch {
          setAuthToken('')
          if (!active) return
          setAuthUser(null)
          setSyncMessage('تسجيل الدخول مطلوب')
          return
        }
      } else {
        setSyncMessage('تسجيل الدخول مطلوب')
        return
      }

      try {
        const [nextProperties, nextUnits, nextTenants, nextContracts, nextPayments, nextMaintenance] = await Promise.all([
          apiList<Property>('properties'),
          apiList<Unit>('units'),
          apiList<Tenant>('tenants'),
          apiList<Contract>('contracts'),
          apiList<Payment>('payments'),
          apiList<Maintenance>('maintenance'),
        ])

        if (!active) return
        setProperties(nextProperties)
        setUnits(nextUnits)
        setTenants(nextTenants)
        setContracts(nextContracts)
        setPayments(nextPayments)
        setMaintenance(nextMaintenance)
      } catch {
        if (!active) return
        setApiOnline(false)
        setSyncMessage('وضع محلي')
      }
    }

    loadApiData()

    return () => {
      active = false
    }
  }, [setContracts, setMaintenance, setPayments, setProperties, setTenants, setUnits])

  const allowedViews = useMemo(() => (authUser ? roleViews[authUser.role] : navItems.map((item) => item.id)), [authUser])
  const visibleNavItems = useMemo(() => navItems.filter((item) => allowedViews.includes(item.id)), [allowedViews])

  useEffect(() => {
    if (!apiOnline || authUser?.role !== 'manager' || activeView !== 'settings') return

    async function loadAdminData() {
      try {
        const [logs, nextBackups] = await Promise.all([apiAuditLogs(), apiBackups()])
        setAuditLogs(logs)
        setBackups(nextBackups)
      } catch {
        setAdminMessage('تعذر تحميل بيانات الإدارة.')
      }
    }

    loadAdminData()
  }, [activeView, apiOnline, authUser])

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

  const submitLogin = async (event: FormEvent) => {
    event.preventDefault()
    setLoginError('')

    try {
      const result = await apiLogin(loginForm.email, loginForm.password)
      setAuthUser(result.user)
      setActiveView(roleViews[result.user.role][0] || 'dashboard')
      setSyncMessage('متصل بالـ API')
      const [nextProperties, nextUnits, nextTenants, nextContracts, nextPayments, nextMaintenance] = await Promise.all([
        apiList<Property>('properties'),
        apiList<Unit>('units'),
        apiList<Tenant>('tenants'),
        apiList<Contract>('contracts'),
        apiList<Payment>('payments'),
        apiList<Maintenance>('maintenance'),
      ])
      setProperties(nextProperties)
      setUnits(nextUnits)
      setTenants(nextTenants)
      setContracts(nextContracts)
      setPayments(nextPayments)
      setMaintenance(nextMaintenance)
    } catch {
      setLoginError('بيانات الدخول غير صحيحة.')
    }
  }

  const logout = async () => {
    await apiLogout()
    setAuthUser(null)
    setActiveView('dashboard')
    setSyncMessage(apiOnline ? 'تسجيل الدخول مطلوب' : 'وضع محلي')
  }

  const createBackup = async () => {
    setAdminMessage('')
    try {
      const backup = await apiCreateBackup()
      setBackups((current) => [backup, ...current.filter((item) => item.name !== backup.name)])
      const logs = await apiAuditLogs()
      setAuditLogs(logs)
      setAdminMessage('تم إنشاء النسخة الاحتياطية.')
    } catch {
      setAdminMessage('تعذر إنشاء النسخة الاحتياطية.')
    }
  }

  const restoreBackup = async (name: string) => {
    setAdminMessage('')
    try {
      await apiRestoreBackup(name)
      setApiOnline(false)
      setSyncMessage('أعد تشغيل API بعد الاستعادة')
      setAdminMessage('تمت جدولة الاستعادة. أعد تشغيل API ثم سجل الدخول مرة أخرى.')
    } catch {
      setAdminMessage('تعذر استعادة النسخة الاحتياطية.')
    }
  }

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

  const submitForm = async (event: FormEvent) => {
    event.preventDefault()
    if (!modal) return

    const isExisting = Boolean(modal.id)

    if (modal.kind === 'property') {
      const next: Property = { id: modal.id || uid('p'), name: form.name, city: form.city, district: form.district, type: form.type as PropertyType, units: Number(form.units), manager: form.manager }
      setProperties(upsert(properties, next))
      await syncSave('properties', next, isExisting)
    }
    if (modal.kind === 'unit') {
      const next: Unit = { id: modal.id || uid('u'), propertyId: form.propertyId, number: form.number, type: form.type as UnitType, status: form.status as UnitStatus, rent: Number(form.rent), tenantId: form.tenantId, ejar: form.ejar, contractEnd: form.contractEnd, nextDue: form.nextDue, paid: Number(form.paid), overdue: Number(form.overdue), vat: form.vat === 'true' }
      setUnits(upsert(units, next))
      await syncSave('units', next, isExisting)
    }
    if (modal.kind === 'tenant') {
      const next: Tenant = { id: modal.id || uid('t'), name: form.name, mobile: form.mobile, nationalId: form.nationalId, email: form.email }
      setTenants(upsert(tenants, next))
      await syncSave('tenants', next, isExisting)
    }
    if (modal.kind === 'contract') {
      const next: Contract = { id: modal.id || uid('c'), ejar: form.ejar, unitId: form.unitId, tenantId: form.tenantId, start: form.start, end: form.end, rent: Number(form.rent), frequency: form.frequency as Contract['frequency'], status: form.status as ContractStatus, vat: form.vat === 'true' }
      const linkedUnit = units.find((unit) => unit.id === next.unitId)
      const syncedUnit = linkedUnit ? { ...linkedUnit, status: 'مؤجرة' as UnitStatus, tenantId: next.tenantId, ejar: next.ejar, contractEnd: next.end, rent: next.rent, vat: next.vat } : undefined
      setContracts(upsert(contracts, next))
      if (syncedUnit) setUnits(units.map((unit) => (unit.id === next.unitId ? syncedUnit : unit)))
      await syncSave('contracts', next, isExisting)
      if (syncedUnit) await syncSave('units', syncedUnit, true)
    }
    if (modal.kind === 'payment') {
      const next: Payment = { id: modal.id || uid('pay'), contractId: form.contractId, unitId: form.unitId, tenantId: form.tenantId, dueDate: form.dueDate, amount: Number(form.amount), status: form.status as PaymentStatus }
      setPayments(upsert(payments, next))
      await syncSave('payments', next, isExisting)
    }
    if (modal.kind === 'maintenance') {
      const next: Maintenance = { id: modal.id || uid('m'), unitId: form.unitId, title: form.title, priority: form.priority as Maintenance['priority'], status: form.status as MaintenanceStatus, date: form.date, cost: Number(form.cost) }
      setMaintenance(upsert(maintenance, next))
      await syncSave('maintenance', next, isExisting)
    }
    setModal(null)
  }

  const upsert = <T extends { id: string }>(items: T[], item: T) => (items.some((current) => current.id === item.id) ? items.map((current) => (current.id === item.id ? item : current)) : [item, ...items])

  const syncSave = async <T extends { id: string }>(resource: ApiResource, item: T, isExisting: boolean) => {
    if (!apiOnline) return

    try {
      await apiSave(resource, item, isExisting)
      setSyncMessage('متصل بالـ API')
    } catch {
      setApiOnline(false)
      setSyncMessage('وضع محلي')
    }
  }

  const syncDelete = async (resource: ApiResource, id: string) => {
    if (!apiOnline) return

    try {
      await apiDelete(resource, id)
      setSyncMessage('متصل بالـ API')
    } catch {
      setApiOnline(false)
      setSyncMessage('وضع محلي')
    }
  }

  const removeItem = async (kind: ModalKind, id: string) => {
    if (kind === 'property' && units.some((unit) => unit.propertyId === id)) return alert('لا يمكن حذف عقار مرتبط بوحدات.')
    if (kind === 'tenant' && units.some((unit) => unit.tenantId === id)) return alert('لا يمكن حذف مستأجر مرتبط بوحدة أو عقد.')
    if (kind === 'property') {
      setProperties(properties.filter((item) => item.id !== id))
      await syncDelete('properties', id)
    }
    if (kind === 'unit') {
      setUnits(units.filter((item) => item.id !== id))
      setContracts(contracts.filter((item) => item.unitId !== id))
      setPayments(payments.filter((item) => item.unitId !== id))
      await syncDelete('units', id)
    }
    if (kind === 'tenant') {
      setTenants(tenants.filter((item) => item.id !== id))
      await syncDelete('tenants', id)
    }
    if (kind === 'contract') {
      setContracts(contracts.filter((item) => item.id !== id))
      await syncDelete('contracts', id)
    }
    if (kind === 'payment') {
      setPayments(payments.filter((item) => item.id !== id))
      await syncDelete('payments', id)
    }
    if (kind === 'maintenance') {
      setMaintenance(maintenance.filter((item) => item.id !== id))
      await syncDelete('maintenance', id)
    }
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

  if (apiOnline && !authUser) {
    return (
      <main className="login-screen" dir="rtl">
        <form className="login-panel" onSubmit={submitLogin}>
          <div className="brand login-brand">
            <div className="brand-mark">ع</div>
            <div>
              <strong>عقارتي</strong>
              <span>إدارة الأملاك والإيجارات</span>
            </div>
          </div>
          <div>
            <p className="eyebrow">تسجيل الدخول</p>
            <h1>مرحباً بك</h1>
            <p>استخدم حساب تجريبي للدخول إلى النظام المحلي.</p>
          </div>
          <label className="field">
            <span>البريد الإلكتروني</span>
            <input name="email" value={loginForm.email} onChange={(event) => setLoginForm((current) => ({ ...current, email: event.target.value }))} />
          </label>
          <label className="field">
            <span>كلمة المرور</span>
            <input name="password" type="password" value={loginForm.password} onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))} />
          </label>
          {loginError && <p className="login-error">{loginError}</p>}
          <button className="primary-action" type="submit">دخول</button>
          <div className="login-help">
            <span>حساب المدير: manager@aqarati.local</span>
            <span>كلمة المرور: demo12345</span>
          </div>
        </form>
      </main>
    )
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
          {visibleNavItems.map((item) => {
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
            {authUser && <button className="secondary-action" onClick={logout}>خروج</button>}
            <span className="pill">{syncMessage}</span>
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
        {authUser?.role === 'manager' && (
          <div className="admin-grid">
            <section className="admin-box">
              <div className="panel-head">
                <div>
                  <h2>النسخ الاحتياطي</h2>
                  <p>إنشاء واستعادة نسخ SQLite المحلية.</p>
                </div>
                <button className="primary-action" onClick={createBackup}>إنشاء نسخة</button>
              </div>
              {adminMessage && <p className="empty-state">{adminMessage}</p>}
              <div className="report-list">
                {backups.length === 0 && <p className="empty-state">لا توجد نسخ احتياطية بعد.</p>}
                {backups.map((backup) => (
                  <div className="unit-card admin-row" key={backup.name}>
                    <div>
                      <strong>{backup.name}</strong>
                      <span>{new Date(backup.createdAt).toLocaleString('ar-SA')}</span>
                    </div>
                    <div>
                      <span>الحجم</span>
                      <b>{number.format(Math.round(backup.size / 1024))} KB</b>
                    </div>
                    <div>
                      <button className="secondary-action" onClick={() => restoreBackup(backup.name)}>استعادة</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
            <section className="admin-box">
              <PanelHead title="سجل النشاط" subtitle="آخر العمليات المهمة في النظام" />
              <div className="report-list">
                {auditLogs.slice(0, 8).map((log) => (
                  <div className="unit-card admin-row" key={log.id}>
                    <div>
                      <strong>{log.action} / {log.resource}</strong>
                      <span>{log.userEmail || 'النظام'}</span>
                    </div>
                    <div>
                      <span>السجل</span>
                      <b>{log.recordId || '-'}</b>
                    </div>
                    <div>
                      <span>الوقت</span>
                      <b>{new Date(log.createdAt).toLocaleString('ar-SA')}</b>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
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
