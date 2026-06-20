const SERVICES = {
  admin:          import.meta.env.VITE_ADMIN_URL          || 'http://localhost:8003',
  places:         import.meta.env.VITE_PLACES_URL         || 'http://localhost:8000',
  reviews:        import.meta.env.VITE_REVIEWS_URL        || 'http://localhost:8001',
  recommendation: import.meta.env.VITE_RECOMMENDATION_URL || 'http://localhost:8002',
}

async function request(service, path, options = {}) {
  const baseUrl = SERVICES[service]
  
  if (!baseUrl) {
    throw new Error(`Serviço inválido: "${service}". Escolha entre: ${Object.keys(SERVICES).join(', ')}`)
  }

  const token = localStorage.getItem('token')
  
  const cleanPath = path.startsWith('/') ? path : `/${path}`

  
  const res = await fetch(`${baseUrl}${cleanPath}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  })

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ detail: 'Erro na requisição' }))
    
    const error = new Error(errorBody.detail || 'Erro na requisição')
    
    error.status = res.status
    error.detail = errorBody.detail
    
    throw error
  }

  if (res.status === 204) return null

  return res.json()
}

// 3. O objeto exportado agora exige o nome do serviço como primeiro parâmetro
export const api = {
  get:    (service, path)       => request(service, path),
  post:   (service, path, body) => request(service, path, { method: 'POST',   body: JSON.stringify(body) }),
  put:    (service, path, body) => request(service, path, { method: 'PUT',    body: JSON.stringify(body) }),
  patch:  (service, path, body) => request(service, path, { method: 'PATCH',    body: JSON.stringify(body) }),
  delete: (service, path)       => request(service, path, { method: 'DELETE' }),
}