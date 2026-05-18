const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:4000/api'

export type ApiResource = 'properties' | 'units' | 'tenants' | 'contracts' | 'payments' | 'maintenance'
export type UserRole = 'manager' | 'accountant' | 'leasing' | 'maintenance' | 'viewer'
export type AuthUser = { id: string; name: string; email: string; role: UserRole; active: boolean }
export type LoginResult = { token: string; user: AuthUser }
type ApiRequestInit = RequestInit & { skipAuth?: boolean }

let authToken = localStorage.getItem('aqarati.authToken') || ''

export function setAuthToken(token: string) {
  authToken = token
  if (token) {
    localStorage.setItem('aqarati.authToken', token)
  } else {
    localStorage.removeItem('aqarati.authToken')
  }
}

export function getAuthToken() {
  return authToken
}

export async function apiLogin(email: string, password: string): Promise<LoginResult> {
  const result = await request<LoginResult>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    skipAuth: true,
  })
  setAuthToken(result.token)
  return result
}

export async function apiMe(): Promise<AuthUser> {
  return (await request<{ user: AuthUser }>('/auth/me')).user
}

export async function apiLogout(): Promise<void> {
  try {
    await request<void>('/auth/logout', { method: 'POST' })
  } finally {
    setAuthToken('')
  }
}

export async function apiList<T>(resource: ApiResource): Promise<T[]> {
  return request<T[]>(`/${resource}`)
}

export async function apiSave<T extends { id: string }>(resource: ApiResource, item: T, isExisting: boolean): Promise<T> {
  return request<T>(`/${resource}${isExisting ? `/${item.id}` : ''}`, {
    method: isExisting ? 'PATCH' : 'POST',
    body: JSON.stringify(item),
  })
}

export async function apiDelete(resource: ApiResource, id: string): Promise<void> {
  await request<void>(`/${resource}/${id}`, { method: 'DELETE' })
}

export async function apiHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`)
    return response.ok
  } catch {
    return false
  }
}

async function request<T>(path: string, options: ApiRequestInit = {}): Promise<T> {
  const { skipAuth: _skipAuth, ...fetchOptions } = options
  const headers = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  } as Record<string, string>

  if (!_skipAuth && authToken) {
    headers.Authorization = `Bearer ${authToken}`
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...fetchOptions,
    headers,
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `API request failed: ${response.status}`)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}
