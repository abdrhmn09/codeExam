const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000'

type ApiOptions = {
  method?: 'GET' | 'POST' | 'DELETE'
  body?: unknown
}

export async function apiRequest<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const hasBody = options.body !== undefined

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    credentials: 'include',
    headers: hasBody
      ? {
          'Content-Type': 'application/json',
        }
      : undefined,
    body: hasBody ? JSON.stringify(options.body) : undefined,
  })

  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(payload.message ?? 'Terjadi kesalahan pada server')
  }

  return payload as T
}
