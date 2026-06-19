import { api } from './api'
import { jwtDecode } from 'jwt-decode'

export async function login(email, password) {
  try {
    const data = await api.post('admin', '/auth/login', {email: email, password: password })
    const token = data.access_token || data.token 
    if (token) {
      localStorage.setItem('token', token)
      localStorage.setItem("refreshToken", data.refresh_token)
      
      const decoded = jwtDecode(token)
      console.log("Dados de dentro do JWT:", decoded)
      
      const user = {
        id: decoded.sub,
        name: decoded.name || 'Admin',
        email: decoded.email,
        isAdmin: decoded.isAdmin === 'True' || decoded.isAdmin === true,
      }
      return user
    }
    throw new Error('Token não recebido do servidor')
  } catch {
    // Mock para desenvolvimento
    if (email === 'admin@rota.com' && password === '123456') {
      const user = { id: 1, name: 'Admin', email, isAdmin: true }
      localStorage.setItem('token', 'mock-token-admin')
      return user
    }
    if (email && password.length >= 4) {
      const name = email.split('@')[0]
      const user = { id: 2, name, email, isAdmin: false }
      localStorage.setItem('token', 'mock-token-user')
      return user
    }
    throw new Error('Email ou senha inválidos')
  }
}

export async function register(name, email, password) {
  try {
    const data = await api.post('admin', '/auth/register', {name: name, email: email, password: password })
    if (data.access_token) localStorage.setItem('token', data.access_token)
    return data.user
  } catch {
    // Mock para desenvolvimento
    const user = { id: Date.now(), name, email, isAdmin: false }
    localStorage.setItem('token', `mock-token-${Date.now()}`)
    return user
  }
}

export function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem("refreshToken")
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
