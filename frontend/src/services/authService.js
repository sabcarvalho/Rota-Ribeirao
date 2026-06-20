import { api } from './api'
import { jwtDecode } from 'jwt-decode'
import { TokenExpiredError } from './errors_classes'

export async function login(email, password) {
  let data
  try {
    data = await api.post('admin', '/auth/login', { email: email, password: password })
  } catch (error) {
    // Credenciais rejeitadas pelo backend (tem status HTTP) -> mensagem do servidor
    if (error.status) {
      throw new Error(error.detail || 'E-mail ou senha inválidos.')
    }
    // Falha de rede / servidor indisponível
    throw new Error('Não foi possível conectar ao servidor. Tente novamente.')
  }

  const token = data.access_token || data.token
  if (!token) {
    throw new Error('Token não recebido do servidor')
  }

  localStorage.setItem('token', token)
  if (data.refresh_token) localStorage.setItem('refreshToken', data.refresh_token)
  // Novo login: descarta favoritos em cache de uma sessão anterior
  localStorage.removeItem('favorites')

  const decoded = jwtDecode(token)
  return {
    id: decoded.sub,
    name: decoded.name || 'Usuário',
    email: decoded.email || email,
    isAdmin: decoded.isAdmin === 'True' || decoded.isAdmin === true,
  }
}

export async function register(name, email, password) {
  let data
  try {
    data = await api.post('admin', '/auth/register', { name: name, email: email, password: password })
  } catch (error) {
    if (error.status) {
      throw new Error(error.detail || 'Não foi possível concluir o cadastro.')
    }
    throw new Error('Não foi possível conectar ao servidor. Tente novamente.')
  }

  if (data.access_token) localStorage.setItem('token', data.access_token)
  if (data.refresh_token) localStorage.setItem('refreshToken', data.refresh_token)
  localStorage.removeItem('favorites')
  return data.user
}

export function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('favorites')
}

export async function refreshToken(){
  try {
    const r_token = localStorage.getItem('refreshToken')
    const data = await api.post('admin', '/auth/refresh', {refresh_token: r_token })

    localStorage.setItem('token', data.access_token)
  } catch (error){
    if (error.detail?.code === "TOKEN_EXPIRED") {
      logout()
      throw new Error("Refresh Token expirado.")
    } else{
      // Mock para desenvolvimento
      const user = { id: Date.now(), name, email, isAdmin: false }
      localStorage.setItem('token', `mock-token-${Date.now()}`)
    }
    
  }
}

export function getStoredToken() {
  return localStorage.getItem('token')
}
