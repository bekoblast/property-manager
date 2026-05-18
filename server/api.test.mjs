import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, before, test } from 'node:test'

const port = 49124
const baseUrl = `http://127.0.0.1:${port}/api`
let child
let tempDir
let managerToken
let viewerToken

before(async () => {
  tempDir = await mkdtemp(join(tmpdir(), 'aqarati-api-'))
  child = spawn(process.execPath, ['server/index.mjs'], {
    cwd: join(import.meta.dirname, '..'),
    env: {
      ...process.env,
      API_PORT: String(port),
      DATABASE_PATH: join(tempDir, 'test.db'),
      BACKUP_DIR: join(tempDir, 'backups'),
    },
    stdio: 'ignore',
  })

  await waitForApi()
  managerToken = await login('manager@aqarati.local')
  viewerToken = await login('viewer@aqarati.local')
})

after(async () => {
  if (child && !child.killed) {
    child.kill()
    await new Promise((resolve) => child.once('exit', resolve))
  }
  await rm(tempDir, { recursive: true, force: true })
})

test('health and dashboard endpoints respond', async () => {
  const health = await publicRequest('/health')
  assert.equal(health.ok, true)

  const dashboard = await request('/dashboard')
  assert.equal(dashboard.properties, 2)
  assert.equal(dashboard.units, 3)
  assert.equal(dashboard.occupancy, 67)
})

test('business endpoints require authentication', async () => {
  const response = await fetch(`${baseUrl}/properties`)
  assert.equal(response.status, 401)
})

test('viewer role can read but cannot write', async () => {
  const listResponse = await fetch(`${baseUrl}/properties`, {
    headers: { Authorization: `Bearer ${viewerToken}` },
  })
  assert.equal(listResponse.status, 200)

  const writeResponse = await fetch(`${baseUrl}/properties`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${viewerToken}` },
    body: JSON.stringify({ name: 'Blocked', city: 'الرياض', district: 'النرجس', type: 'سكني', manager: 'Viewer' }),
  })
  assert.equal(writeResponse.status, 403)
})

test('manager can read audit logs', async () => {
  const logs = await request('/audit-logs')
  assert.ok(logs.some((log) => log.action === 'login' && log.resource === 'auth'))
})

test('manager can create and list backups', async () => {
  const backup = await request('/backups', { method: 'POST' })
  assert.match(backup.name, /^aqarati-\d{8}-\d{6}\.db$/)
  assert.ok(backup.size > 0)

  const backups = await request('/backups')
  assert.ok(backups.some((item) => item.name === backup.name))
})

test('viewer cannot create backups', async () => {
  const response = await fetch(`${baseUrl}/backups`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${viewerToken}` },
  })
  assert.equal(response.status, 403)
})

test('tenant validation requires key fields', async () => {
  const response = await fetch(`${baseUrl}/tenants`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${managerToken}` },
    body: JSON.stringify({ mobile: '0550000000', nationalId: '1234567890' }),
  })

  assert.equal(response.status, 422)
  assert.match((await response.json()).message, /name is required/)
})

test('unit validation rejects missing property references', async () => {
  const response = await fetch(`${baseUrl}/units`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${managerToken}` },
    body: JSON.stringify({
      propertyId: 'missing',
      number: 'QA-404',
      type: 'شقة',
      status: 'شاغرة',
      rent: 1000,
    }),
  })

  assert.equal(response.status, 422)
  assert.match((await response.json()).message, /propertyId/)
})

test('contract Ejar number must be unique', async () => {
  const response = await fetch(`${baseUrl}/contracts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${managerToken}` },
    body: JSON.stringify({
      ejar: 'EJ-2026-1001',
      unitId: 'u3',
      tenantId: 't2',
      start: '2026-05-01',
      end: '2027-04-30',
      rent: 36000,
      frequency: 'سنوي',
      status: 'نشط',
      vat: false,
    }),
  })

  assert.equal(response.status, 409)
  assert.match((await response.json()).message, /ejar/)
})

test('payment must match its contract unit and tenant', async () => {
  const response = await fetch(`${baseUrl}/payments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${managerToken}` },
    body: JSON.stringify({
      contractId: 'c1',
      unitId: 'u2',
      tenantId: 't1',
      dueDate: '2026-07-01',
      amount: 1000,
      status: 'مستحقة',
    }),
  })

  assert.equal(response.status, 422)
  assert.match((await response.json()).message, /must match/)
})

test('delete protection blocks property with units', async () => {
  const response = await fetch(`${baseUrl}/properties/p1`, { method: 'DELETE', headers: { Authorization: `Bearer ${managerToken}` } })
  assert.equal(response.status, 409)
  assert.match((await response.json()).message, /related units/)
})

test('contract save syncs linked unit details', async () => {
  const contract = await request('/contracts', {
    method: 'POST',
    body: JSON.stringify({
      ejar: 'EJ-QA-SYNC',
      unitId: 'u3',
      tenantId: 't2',
      start: '2026-05-01',
      end: '2027-04-30',
      rent: 44000,
      frequency: 'سنوي',
      status: 'نشط',
      vat: false,
    }),
  })

  assert.equal(contract.ejar, 'EJ-QA-SYNC')

  const unit = await request('/units/u3')
  assert.equal(unit.status, 'مؤجرة')
  assert.equal(unit.tenantId, 't2')
  assert.equal(unit.ejar, 'EJ-QA-SYNC')
  assert.equal(unit.contractEnd, '2027-04-30')
  assert.equal(unit.rent, 44000)
})

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${managerToken}`, ...options.headers },
  })
  assert.ok(response.ok, `${path} returned ${response.status}`)
  return response.json()
}

async function publicRequest(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  })
  assert.ok(response.ok, `${path} returned ${response.status}`)
  return response.json()
}

async function login(email) {
  const response = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'demo12345' }),
  })
  assert.equal(response.status, 200)
  return (await response.json()).token
}

async function waitForApi() {
  const deadline = Date.now() + 10000
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/health`)
      if (response.ok) return
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 150))
    }
  }
  throw new Error('API did not start in time')
}
