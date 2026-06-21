import { api } from './api'
import { jwtDecode } from 'jwt-decode'
import { TokenExpiredError } from './errors_classes'

export async function login(email, password) {
  let data
  try {
    data = await api.post('admin', '/auth/login', { email: email, password: password })
  } catch (error) {
    //credenciais rejeitadas pelo backend (tem status HTTP) -> mensagem do servidor
    if (error.status) {
      throw new Error(error.detail || 'E-mail ou senha inválidos.')
    }
    //falha de rede / servidor indisponível
    throw new Error('Não foi possível conectar ao servidor. Tente novamente.')
  }

  const token = data.access_token || data.token
  if (!token) {
    throw new Error('Token não recebido do servidor')
  }

  localStorage.setItem('token', token)
  if (data.refresh_token) localStorage.setItem('refreshToken', data.refresh_token)
  //novo login: descarta favoritos em cache de uma sessao anterior
  localStorage.removeItem('favorites')

  const decoded = jwtDecode(token)
  return {
    id: decoded.sub,
    name: decoded.name || 'Usuário',
    email: decoded.email || email,
    isAdmin: decoded.isAdmin === 'True' || decoded.isAdmin === true, //em pytoh, ha retorno de True com maiuscula
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
  //registro bem sucedido
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
  const r_token = localStorage.getItem('refreshToken')
  const data = await api.post('admin', '/auth/refresh', {refresh_token: r_token })

  localStorage.setItem('token', data.access_token)
}

export function getStoredToken() {
  return localStorage.getItem('token')
}
