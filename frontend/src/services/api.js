// api.js
import { TokenExpiredError, UnauthorizedError } from './errors_classes'

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

  try {
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
      let error

      // Mapeamento centralizado de erros
      if (res.status === 401) {
        if (errorBody.detail?.code === "TOKEN_EXPIRED") {
          error = new TokenExpiredError(errorBody.detail.message || "Token expirado.")
        } else {
          error = new UnauthorizedError(errorBody.detail || "Acesso não autorizado.")
        }
      } else {
        error = new Error(errorBody.detail || 'Erro na requisição')
      }
      
      error.status = res.status
      error.detail = errorBody.detail
      
      throw error
    }

    if (res.status === 204) return null
    return res.json()

  } catch (error) {
    /// Intercepta erros de autenticação e tenta reprocessar caso não seja um reenvio (_isRetry)
    if ((error instanceof TokenExpiredError || error.status === 401) && !options._isRetry) {
      try {
        //O import dinâmico resolve a dependência circular com o authService
        const { refreshToken } = await import('./authService')
        await refreshToken()

        //Dispara novamente a mesma requisição original, marcando-a como _isRetry
        return await request(service, path, { ...options, _isRetry: true })
      } catch (refreshErr) {
        console.error("Sessão expirada permanentemente. Forçando logout.")
        throw refreshErr
      }
    }

    // Se for qualquer outro tipo de erro, apenas repassa para o serviço tratar se necessário
    throw error
  }
}

export const api = {
  get:    (service, path)       => request(service, path),
  post:   (service, path, body) => request(service, path, { method: 'POST',   body: JSON.stringify(body) }),
  put:    (service, path, body) => request(service, path, { method: 'PUT',    body: JSON.stringify(body) }),
  patch:  (service, path, body) => request(service, path, { method: 'PATCH',   body: JSON.stringify(body) }),
  delete: (service, path)       => request(service, path, { method: 'DELETE' }),
}