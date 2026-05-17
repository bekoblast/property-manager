import cors from 'cors'
import express from 'express'
import Database from 'better-sqlite3'
import { randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dataDir = join(__dirname, 'data')
const dbPath = join(dataDir, 'aqarati.db')

if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true })
}

const db = new Database(dbPath)
db.pragma('foreign_keys = ON')
db.exec(readFileSync(join(__dirname, 'schema.sql'), 'utf8'))

const app = express()
const port = Number(process.env.API_PORT || 4000)

app.use(cors({ origin: ['http://127.0.0.1:3000', 'http://localhost:3000'] }))
app.use(express.json())

const tables = {
  properties: ['id', 'name', 'city', 'district', 'type', 'units', 'manager'],
  units: ['id', 'propertyId', 'number', 'type', 'status', 'rent', 'tenantId', 'ejar', 'contractEnd', 'nextDue', 'paid', 'overdue', 'vat'],
  tenants: ['id', 'name', 'mobile', 'nationalId', 'email'],
  contracts: ['id', 'ejar', 'unitId', 'tenantId', 'start', 'end', 'rent', 'frequency', 'status', 'vat'],
  payments: ['id', 'contractId', 'unitId', 'tenantId', 'dueDate', 'amount', 'status'],
  maintenance: ['id', 'unitId', 'title', 'priority', 'status', 'date', 'cost'],
}

const seed = {
  properties: [
    { id: 'p1', name: 'برج الندى', city: 'الرياض', district: 'العليا', type: 'مختلط', units: 12, manager: 'خالد السالم' },
    { id: 'p2', name: 'مجمع الروضة', city: 'جدة', district: 'الروضة', type: 'سكني', units: 18, manager: 'نورة العتيبي' },
  ],
  tenants: [
    { id: 't1', name: 'شركة أفق للتجارة', mobile: '0551234567', nationalId: '7001234567', email: 'info@ofuq.sa' },
    { id: 't2', name: 'محمد القحطاني', mobile: '0509876543', nationalId: '1012345678', email: 'm.qahtani@example.com' },
  ],
  units: [
    { id: 'u1', propertyId: 'p1', number: 'A-101', type: 'شقة', status: 'مؤجرة', rent: 42000, tenantId: 't2', ejar: 'EJ-2026-1001', contractEnd: '2026-12-31', nextDue: '2026-06-01', paid: 21000, overdue: 0, vat: 0 },
    { id: 'u2', propertyId: 'p1', number: 'S-05', type: 'محل', status: 'مؤجرة', rent: 96000, tenantId: 't1', ejar: 'EJ-2026-1002', contractEnd: '2026-09-30', nextDue: '2026-05-15', paid: 24000, overdue: 8000, vat: 1 },
    { id: 'u3', propertyId: 'p2', number: 'B-204', type: 'شقة', status: 'شاغرة', rent: 36000, tenantId: '', ejar: '', contractEnd: '', nextDue: '', paid: 0, overdue: 0, vat: 0 },
  ],
  contracts: [
    { id: 'c1', ejar: 'EJ-2026-1001', unitId: 'u1', tenantId: 't2', start: '2026-01-01', end: '2026-12-31', rent: 42000, frequency: 'ربع سنوي', status: 'نشط', vat: 0 },
    { id: 'c2', ejar: 'EJ-2026-1002', unitId: 'u2', tenantId: 't1', start: '2026-01-01', end: '2026-09-30', rent: 96000, frequency: 'ربع سنوي', status: 'ينتهي قريباً', vat: 1 },
  ],
  payments: [
    { id: 'pay1', contractId: 'c1', unitId: 'u1', tenantId: 't2', dueDate: '2026-03-01', amount: 10500, status: 'مدفوعة' },
    { id: 'pay2', contractId: 'c1', unitId: 'u1', tenantId: 't2', dueDate: '2026-06-01', amount: 10500, status: 'مستحقة' },
    { id: 'pay3', contractId: 'c2', unitId: 'u2', tenantId: 't1', dueDate: '2026-05-15', amount: 24000, status: 'متأخرة' },
  ],
  maintenance: [
    { id: 'm1', unitId: 'u2', title: 'صيانة تكييف المحل', priority: 'عاجلة', status: 'قيد التنفيذ', date: '2026-05-09', cost: 1800 },
    { id: 'm2', unitId: 'u3', title: 'دهان وتجهيز قبل التأجير', priority: 'عادية', status: 'مفتوح', date: '2026-05-12', cost: 2500 },
  ],
}

seedDatabase()

app.get('/api/health', (_request, response) => {
  response.json({ ok: true, database: dbPath })
})

app.get('/api/dashboard', (_request, response) => {
  const units = list('units')
  const payments = list('payments')
  const contracts = list('contracts')
  const maintenance = list('maintenance')
  const rented = units.filter((unit) => unit.status === 'مؤجرة').length
  const vacant = units.filter((unit) => unit.status === 'شاغرة').length

  response.json({
    properties: db.prepare('select count(*) as count from properties').get().count,
    units: units.length,
    rented,
    vacant,
    occupancy: units.length ? Math.round((rented / units.length) * 100) : 0,
    annualRent: units.reduce((sum, unit) => sum + unit.rent, 0),
    collected: payments.filter((payment) => payment.status === 'مدفوعة').reduce((sum, payment) => sum + payment.amount, 0),
    overdue: payments.filter((payment) => payment.status === 'متأخرة').reduce((sum, payment) => sum + payment.amount, 0),
    endingContracts: contracts.filter((contract) => contract.status === 'ينتهي قريباً').length,
    openMaintenance: maintenance.filter((request) => request.status !== 'مغلق').length,
  })
})

for (const table of Object.keys(tables)) {
  app.get(`/api/${table}`, (_request, response) => {
    response.json(list(table))
  })

  app.get(`/api/${table}/:id`, (request, response) => {
    const item = find(table, request.params.id)
    if (!item) return response.status(404).json({ message: 'Record not found' })
    response.json(item)
  })

  app.post(`/api/${table}`, (request, response) => {
    const item = normalize(table, { ...request.body, id: request.body.id || randomUUID() })
    insert(table, item)
    response.status(201).json(find(table, item.id))
  })

  app.patch(`/api/${table}/:id`, (request, response) => {
    const existing = find(table, request.params.id)
    if (!existing) return response.status(404).json({ message: 'Record not found' })
    const item = normalize(table, { ...existing, ...request.body, id: request.params.id })
    update(table, item)
    response.json(find(table, item.id))
  })

  app.delete(`/api/${table}/:id`, (request, response) => {
    const existing = find(table, request.params.id)
    if (!existing) return response.status(404).json({ message: 'Record not found' })
    db.prepare(`delete from ${table} where id = ?`).run(request.params.id)
    response.status(204).send()
  })
}

app.use((error, _request, response, _next) => {
  response.status(400).json({ message: error.message || 'Unexpected API error' })
})

app.listen(port, () => {
  console.log(`Aqarati API listening on http://127.0.0.1:${port}`)
})

function seedDatabase() {
  const count = db.prepare('select count(*) as count from properties').get().count
  if (count > 0) return

  const transaction = db.transaction(() => {
    for (const [table, rows] of Object.entries(seed)) {
      rows.forEach((row) => insert(table, row))
    }
  })
  transaction()
}

function list(table) {
  return db.prepare(`select * from ${table}`).all().map((row) => normalizeFromDb(table, row))
}

function find(table, id) {
  const row = db.prepare(`select * from ${table} where id = ?`).get(id)
  return row ? normalizeFromDb(table, row) : null
}

function insert(table, row) {
  const columns = tables[table]
  const placeholders = columns.map(() => '?').join(', ')
  db.prepare(`insert into ${table} (${columns.join(', ')}) values (${placeholders})`).run(columns.map((column) => row[column] ?? ''))
}

function update(table, row) {
  const columns = tables[table].filter((column) => column !== 'id')
  const assignments = columns.map((column) => `${column} = ?`).join(', ')
  db.prepare(`update ${table} set ${assignments} where id = ?`).run([...columns.map((column) => row[column] ?? ''), row.id])
}

function normalize(table, row) {
  const next = { ...row }
  for (const column of ['units', 'rent', 'paid', 'overdue', 'amount', 'cost']) {
    if (column in next) next[column] = Number(next[column] || 0)
  }
  if ('vat' in next) next.vat = next.vat === true || next.vat === 'true' || next.vat === 1 ? 1 : 0
  return Object.fromEntries(tables[table].map((column) => [column, next[column] ?? '']))
}

function normalizeFromDb(_table, row) {
  const next = { ...row }
  if ('vat' in next) next.vat = Boolean(next.vat)
  return next
}
