import cors from 'cors'
import express from 'express'
import Database from 'better-sqlite3'
import { pbkdf2Sync, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto'
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dataDir = join(__dirname, 'data')
const dbPath = process.env.DATABASE_PATH || join(dataDir, 'aqarati.db')
const backupDir = process.env.BACKUP_DIR || join(dataDir, 'backups')
const migrationsDir = join(__dirname, 'migrations')

const selectedDataDir = dirname(dbPath)
if (!existsSync(selectedDataDir)) {
  mkdirSync(selectedDataDir, { recursive: true })
}
if (!existsSync(backupDir)) {
  mkdirSync(backupDir, { recursive: true })
}

const db = new Database(dbPath)
db.pragma('foreign_keys = ON')
runMigrations()

const app = express()
const port = Number(process.env.API_PORT || 4000)
const sessions = new Map()

app.use(cors({ origin: ['http://127.0.0.1:3000', 'http://localhost:3000'] }))
app.use(express.json())

const tables = {
  users: ['id', 'name', 'email', 'role', 'passwordHash', 'passwordSalt', 'active'],
  audit_logs: ['id', 'userId', 'userEmail', 'action', 'resource', 'recordId', 'createdAt', 'details'],
  properties: ['id', 'name', 'city', 'district', 'type', 'units', 'manager'],
  units: ['id', 'propertyId', 'number', 'type', 'status', 'rent', 'tenantId', 'ejar', 'contractEnd', 'nextDue', 'paid', 'overdue', 'vat'],
  tenants: ['id', 'name', 'mobile', 'nationalId', 'email'],
  contracts: ['id', 'ejar', 'unitId', 'tenantId', 'start', 'end', 'rent', 'frequency', 'status', 'vat'],
  payments: ['id', 'contractId', 'unitId', 'tenantId', 'dueDate', 'amount', 'status'],
  maintenance: ['id', 'unitId', 'title', 'priority', 'status', 'date', 'cost'],
}

const requiredFields = {
  users: ['name', 'email', 'role'],
  properties: ['name', 'city', 'district', 'type', 'manager'],
  units: ['propertyId', 'number', 'type', 'status'],
  tenants: ['name', 'mobile', 'nationalId'],
  contracts: ['ejar', 'unitId', 'tenantId', 'start', 'end', 'frequency', 'status'],
  payments: ['contractId', 'unitId', 'tenantId', 'dueDate', 'status'],
  maintenance: ['unitId', 'title', 'priority', 'status', 'date'],
}

const enums = {
  users: { role: ['manager', 'accountant', 'leasing', 'maintenance', 'viewer'] },
  properties: { type: ['سكني', 'تجاري', 'مختلط'] },
  units: { type: ['شقة', 'محل'], status: ['مؤجرة', 'شاغرة', 'صيانة'] },
  contracts: { frequency: ['شهري', 'ربع سنوي', 'سنوي'], status: ['نشط', 'ينتهي قريباً', 'منتهي'] },
  payments: { status: ['مدفوعة', 'مستحقة', 'متأخرة'] },
  maintenance: { priority: ['عادية', 'عاجلة'], status: ['مفتوح', 'قيد التنفيذ', 'مغلق'] },
}

const numericFields = {
  properties: ['units'],
  units: ['rent', 'paid', 'overdue'],
  contracts: ['rent'],
  payments: ['amount'],
  maintenance: ['cost'],
}

const rolePermissions = {
  manager: { read: ['*'], write: ['*'] },
  accountant: { read: ['dashboard', 'properties', 'units', 'tenants', 'contracts', 'payments', 'maintenance'], write: ['payments'] },
  leasing: { read: ['dashboard', 'properties', 'units', 'tenants', 'contracts', 'payments', 'maintenance'], write: ['properties', 'units', 'tenants', 'contracts'] },
  maintenance: { read: ['dashboard', 'properties', 'units', 'tenants', 'contracts', 'payments', 'maintenance'], write: ['maintenance'] },
  viewer: { read: ['dashboard', 'properties', 'units', 'tenants', 'contracts', 'payments', 'maintenance'], write: [] },
}

const hiddenResources = new Set(['users', 'audit_logs'])

const searchFields = {
  properties: ['name', 'city', 'district', 'type', 'manager'],
  units: ['number', 'type', 'status', 'ejar', 'contractEnd', 'nextDue'],
  tenants: ['name', 'mobile', 'nationalId', 'email'],
  contracts: ['ejar', 'start', 'end', 'frequency', 'status'],
  payments: ['dueDate', 'status'],
  maintenance: ['title', 'priority', 'status', 'date'],
}

const filterFields = {
  properties: ['city', 'district', 'type', 'manager'],
  units: ['propertyId', 'tenantId', 'type', 'status', 'vat'],
  tenants: ['mobile', 'nationalId', 'email'],
  contracts: ['unitId', 'tenantId', 'frequency', 'status', 'vat'],
  payments: ['contractId', 'unitId', 'tenantId', 'dueDate', 'status'],
  maintenance: ['unitId', 'priority', 'status', 'date'],
}

const seed = {
  users: [
    { id: 'user-manager', name: 'مدير النظام', email: 'manager@aqarati.local', role: 'manager', password: 'demo12345', active: 1 },
    { id: 'user-accountant', name: 'المحاسب', email: 'accountant@aqarati.local', role: 'accountant', password: 'demo12345', active: 1 },
    { id: 'user-leasing', name: 'مسؤول التأجير', email: 'leasing@aqarati.local', role: 'leasing', password: 'demo12345', active: 1 },
    { id: 'user-maintenance', name: 'مسؤول الصيانة', email: 'maintenance@aqarati.local', role: 'maintenance', password: 'demo12345', active: 1 },
    { id: 'user-viewer', name: 'مشاهد التقارير', email: 'viewer@aqarati.local', role: 'viewer', password: 'demo12345', active: 1 },
  ],
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
  response.json({ ok: true, database: dbPath, migrations: listAppliedMigrations().map((migration) => migration.filename) })
})

app.post('/api/auth/login', (request, response) => {
  const email = String(request.body.email || '').trim().toLowerCase()
  const password = String(request.body.password || '')
  const user = db.prepare('select * from users where lower(email) = ? and active = 1').get(email)

  if (!user || !verifyPassword(password, user.passwordSalt, user.passwordHash)) {
    return response.status(401).json({ message: 'Invalid email or password' })
  }

  const token = randomBytes(32).toString('hex')
  sessions.set(token, publicUser(user))
  auditLog(publicUser(user), 'login', 'auth', user.id)
  response.json({ token, user: publicUser(user) })
})

app.post('/api/auth/logout', authenticate, (request, response) => {
  sessions.delete(request.token)
  auditLog(request.user, 'logout', 'auth', request.user.id)
  response.status(204).send()
})

app.get('/api/auth/me', authenticate, (request, response) => {
  response.json({ user: request.user })
})

app.get('/api/audit-logs', authenticate, authorize('audit_logs', 'read'), (_request, response) => {
  response.json(db.prepare('select * from audit_logs order by createdAt desc limit 200').all())
})

app.get('/api/backups', authenticate, authorize('backups', 'read'), (_request, response) => {
  response.json(listBackups())
})

app.post('/api/backups', authenticate, authorize('backups', 'write'), (request, response) => {
  const backup = createBackup()
  auditLog(request.user, 'backup', 'backups', backup.name)
  response.status(201).json(backup)
})

app.post('/api/backups/:name/restore', authenticate, authorize('backups', 'write'), (request, response) => {
  const backupPath = safeBackupPath(request.params.name)
  if (!existsSync(backupPath)) return response.status(404).json({ message: 'Backup not found' })
  auditLog(request.user, 'restore', 'backups', request.params.name)
  response.json({ restored: request.params.name, restartRequired: true })
  setTimeout(() => {
    db.close()
    copyFileSync(backupPath, dbPath)
    process.exit(0)
  }, 100)
})

app.get('/api/dashboard', authenticate, authorize('dashboard', 'read'), (_request, response) => {
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
  if (hiddenResources.has(table)) continue

  app.get(`/api/${table}`, authenticate, authorize(table, 'read'), (request, response) => {
    if (hasListQuery(request.query)) {
      const result = queryList(table, request.query)
      return response.json({
        data: result.data.map((item) => serialize(table, item)),
        meta: result.meta,
      })
    }

    response.json(list(table).map((item) => serialize(table, item)))
  })

  app.get(`/api/${table}/:id`, authenticate, authorize(table, 'read'), (request, response) => {
    const item = find(table, request.params.id)
    if (!item) return response.status(404).json({ message: 'Record not found' })
    response.json(serialize(table, item))
  })

  app.post(`/api/${table}`, authenticate, authorize(table, 'write'), (request, response) => {
    const item = normalize(table, { ...request.body, id: request.body.id || randomUUID() })
    validate(table, item)
    insert(table, item)
    applySideEffects(table, item)
    auditLog(request.user, 'create', table, item.id)
    response.status(201).json(serialize(table, find(table, item.id)))
  })

  app.patch(`/api/${table}/:id`, authenticate, authorize(table, 'write'), (request, response) => {
    const existing = find(table, request.params.id)
    if (!existing) return response.status(404).json({ message: 'Record not found' })
    const item = normalize(table, { ...existing, ...request.body, id: request.params.id })
    validate(table, item)
    update(table, item)
    applySideEffects(table, item)
    auditLog(request.user, 'update', table, item.id)
    response.json(serialize(table, find(table, item.id)))
  })

  app.delete(`/api/${table}/:id`, authenticate, authorize(table, 'write'), (request, response) => {
    const existing = find(table, request.params.id)
    if (!existing) return response.status(404).json({ message: 'Record not found' })
    protectDelete(table, request.params.id)
    db.prepare(`delete from ${table} where id = ?`).run(request.params.id)
    auditLog(request.user, 'delete', table, request.params.id)
    response.status(204).send()
  })
}

app.use((error, _request, response, _next) => {
  response.status(error.status || 400).json({ message: error.message || 'Unexpected API error' })
})

app.listen(port, () => {
  console.log(`Aqarati API listening on http://127.0.0.1:${port}`)
})

function seedDatabase() {
  const userCount = db.prepare('select count(*) as count from users').get().count
  if (userCount === 0) {
    seed.users.forEach((row) => insert('users', normalize('users', row)))
  }

  const count = db.prepare('select count(*) as count from properties').get().count
  if (count > 0) return

  const transaction = db.transaction(() => {
    for (const [table, rows] of Object.entries(seed)) {
      if (table === 'users') continue
      rows.forEach((row) => insert(table, normalize(table, row)))
    }
  })
  transaction()
}

function runMigrations() {
  db.exec(`
    create table if not exists schema_migrations (
      filename text primary key,
      appliedAt text not null
    )
  `)

  const files = readdirSync(migrationsDir)
    .filter((name) => /^\d+_.+\.sql$/.test(name))
    .sort((a, b) => a.localeCompare(b))
  const applied = new Set(listAppliedMigrations().map((migration) => migration.filename))
  const applyMigration = db.transaction((filename, sql) => {
    db.exec(sql)
    db.prepare('insert into schema_migrations (filename, appliedAt) values (?, ?)').run(filename, new Date().toISOString())
  })

  for (const filename of files) {
    if (applied.has(filename)) continue
    applyMigration(filename, readFileSync(join(migrationsDir, filename), 'utf8'))
  }
}

function listAppliedMigrations() {
  return db.prepare('select filename, appliedAt from schema_migrations order by filename').all()
}

function list(table) {
  return db.prepare(`select * from ${table}`).all().map((row) => normalizeFromDb(table, row))
}

function queryList(table, query) {
  const page = clampNumber(query.page, 1, 1, 100000)
  const perPage = clampNumber(query.perPage, 25, 1, 100)
  const offset = (page - 1) * perPage
  const clauses = []
  const params = []
  const q = typeof query.q === 'string' ? query.q.trim() : ''

  if (q) {
    const fields = searchFields[table] || []
    clauses.push(`(${fields.map((field) => `${field} like ?`).join(' or ')})`)
    params.push(...fields.map(() => `%${q}%`))
  }

  for (const field of filterFields[table] || []) {
    const value = query[field]
    if (typeof value !== 'string' || value.trim() === '') continue
    clauses.push(`${field} = ?`)
    params.push(normalizeQueryValue(value))
  }

  const where = clauses.length ? ` where ${clauses.join(' and ')}` : ''
  const total = db.prepare(`select count(*) as count from ${table}${where}`).get(...params).count
  const rows = db.prepare(`select * from ${table}${where} order by id limit ? offset ?`).all(...params, perPage, offset)

  return {
    data: rows.map((row) => normalizeFromDb(table, row)),
    meta: { page, perPage, total, pages: Math.ceil(total / perPage) },
  }
}

function hasListQuery(query) {
  return ['q', 'page', 'perPage'].some((key) => key in query) || Object.keys(query).length > 0
}

function clampNumber(value, fallback, min, max) {
  const number = Number(value || fallback)
  if (!Number.isFinite(number)) return fallback
  return Math.min(Math.max(Math.trunc(number), min), max)
}

function normalizeQueryValue(value) {
  if (value === 'true') return 1
  if (value === 'false') return 0
  return value.trim()
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

function validate(table, row) {
  for (const field of requiredFields[table] || []) {
    if (row[field] === undefined || row[field] === null || String(row[field]).trim() === '') {
      throw httpError(422, `${field} is required`)
    }
  }

  for (const [field, values] of Object.entries(enums[table] || {})) {
    if (!values.includes(row[field])) {
      throw httpError(422, `${field} must be one of: ${values.join(', ')}`)
    }
  }

  for (const field of numericFields[table] || []) {
    if (!Number.isFinite(row[field]) || row[field] < 0) {
      throw httpError(422, `${field} must be a positive number`)
    }
  }

  if ('start' in row && !isDate(row.start)) throw httpError(422, 'start must use YYYY-MM-DD')
  if ('end' in row && !isDate(row.end)) throw httpError(422, 'end must use YYYY-MM-DD')
  if ('dueDate' in row && !isDate(row.dueDate)) throw httpError(422, 'dueDate must use YYYY-MM-DD')
  if ('date' in row && !isDate(row.date)) throw httpError(422, 'date must use YYYY-MM-DD')
  if ('start' in row && 'end' in row && row.end < row.start) throw httpError(422, 'end must be after start')

  if (table === 'units') requireRecord('properties', row.propertyId, 'propertyId')
  if (table === 'users') {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) throw httpError(422, 'email must be valid')
    const existing = db.prepare('select id from users where lower(email) = lower(?) and id != ?').get(row.email, row.id)
    if (existing) throw httpError(409, 'email must be unique')
  }
  if (table === 'contracts') {
    requireRecord('units', row.unitId, 'unitId')
    requireRecord('tenants', row.tenantId, 'tenantId')
    const existing = db.prepare('select id from contracts where ejar = ? and id != ?').get(row.ejar, row.id)
    if (existing) throw httpError(409, 'ejar must be unique')
  }
  if (table === 'payments') {
    requireRecord('contracts', row.contractId, 'contractId')
    requireRecord('units', row.unitId, 'unitId')
    requireRecord('tenants', row.tenantId, 'tenantId')
    const contract = find('contracts', row.contractId)
    if (contract.unitId !== row.unitId || contract.tenantId !== row.tenantId) {
      throw httpError(422, 'payment unit and tenant must match the contract')
    }
  }
  if (table === 'maintenance') requireRecord('units', row.unitId, 'unitId')
}

function protectDelete(table, id) {
  const relations = {
    properties: [['units', 'propertyId']],
    tenants: [['units', 'tenantId'], ['contracts', 'tenantId'], ['payments', 'tenantId']],
    units: [['contracts', 'unitId'], ['payments', 'unitId'], ['maintenance', 'unitId']],
    contracts: [['payments', 'contractId']],
  }

  for (const [childTable, column] of relations[table] || []) {
    const count = db.prepare(`select count(*) as count from ${childTable} where ${column} = ?`).get(id).count
    if (count > 0) {
      throw httpError(409, `Cannot delete ${table} while related ${childTable} records exist`)
    }
  }
}

function applySideEffects(table, row) {
  if (table !== 'contracts') return

  db.prepare(`
    update units
    set status = ?, tenantId = ?, ejar = ?, contractEnd = ?, rent = ?, vat = ?
    where id = ?
  `).run('مؤجرة', row.tenantId, row.ejar, row.end, row.rent, row.vat, row.unitId)
}

function normalize(table, row) {
  const next = { ...row }
  for (const column of ['units', 'rent', 'paid', 'overdue', 'amount', 'cost']) {
    if (tables[table].includes(column)) next[column] = Number(next[column] || 0)
  }
  if ('vat' in next) next.vat = next.vat === true || next.vat === 'true' || next.vat === 1 ? 1 : 0
  if ('active' in next) next.active = next.active === false || next.active === 'false' || next.active === 0 ? 0 : 1
  if (table === 'users') {
    next.email = String(next.email || '').trim().toLowerCase()
    if (next.password) {
      const credentials = hashPassword(String(next.password))
      next.passwordSalt = credentials.salt
      next.passwordHash = credentials.hash
    }
    if (!next.passwordSalt || !next.passwordHash) {
      throw httpError(422, 'password is required')
    }
  }
  return Object.fromEntries(tables[table].map((column) => [column, next[column] ?? '']))
}

function normalizeFromDb(_table, row) {
  const next = { ...row }
  if ('vat' in next) next.vat = Boolean(next.vat)
  if ('active' in next) next.active = Boolean(next.active)
  return next
}

function serialize(table, item) {
  if (table !== 'users') return item
  return publicUser(item)
}

function authenticate(request, response, next) {
  const header = request.get('authorization') || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  const user = sessions.get(token)

  if (!user) {
    return response.status(401).json({ message: 'Authentication required' })
  }

  request.token = token
  request.user = user
  next()
}

function authorize(resource, action) {
  return (request, response, next) => {
    const permissions = rolePermissions[request.user.role]
    const allowed = permissions?.[action] || []

    if (!allowed.includes('*') && !allowed.includes(resource)) {
      return response.status(403).json({ message: 'Permission denied' })
    }

    next()
  }
}

function requireRecord(table, id, field) {
  if (!id || !find(table, id)) {
    throw httpError(422, `${field} must reference an existing ${table} record`)
  }
}

function isDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`))
}

function httpError(status, message) {
  const error = new Error(message)
  error.status = status
  return error
}

function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  return {
    salt,
    hash: pbkdf2Sync(password, salt, 100000, 32, 'sha256').toString('hex'),
  }
}

function verifyPassword(password, salt, expectedHash) {
  const actual = Buffer.from(hashPassword(password, salt).hash, 'hex')
  const expected = Buffer.from(expectedHash, 'hex')
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    active: Boolean(user.active),
  }
}

function auditLog(user, action, resource, recordId = '', details = {}) {
  insert('audit_logs', {
    id: randomUUID(),
    userId: user?.id || '',
    userEmail: user?.email || '',
    action,
    resource,
    recordId,
    createdAt: new Date().toISOString(),
    details: JSON.stringify(details),
  })
}

function listBackups() {
  return readdirSync(backupDir)
    .filter((name) => /^aqarati-\d{8}-\d{6}\.db$/.test(name))
    .map((name) => {
      const stats = statSync(join(backupDir, name))
      return { name, size: stats.size, createdAt: stats.birthtime.toISOString() }
    })
    .sort((a, b) => b.name.localeCompare(a.name))
}

function createBackup() {
  db.pragma('wal_checkpoint(FULL)')
  const now = new Date()
  const stamp = now.toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15)
  const name = `aqarati-${stamp}.db`
  const target = join(backupDir, name)
  copyFileSync(dbPath, target)
  const stats = statSync(target)
  return { name, size: stats.size, createdAt: stats.birthtime.toISOString() }
}

function safeBackupPath(name) {
  if (!/^aqarati-\d{8}-\d{6}\.db$/.test(name)) {
    throw httpError(400, 'Invalid backup name')
  }

  return join(backupDir, name)
}
