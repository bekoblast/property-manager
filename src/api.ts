const API_BASE_URL = 'http://127.0.0.1:4000/api'

export type ApiResource = 'properties' | 'units' | 'tenants' | 'contracts' | 'payments' | 'maintenance'

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

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
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
