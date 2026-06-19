import { createContext, useContext, useState, useEffect } from 'react'
import { jwtDecode } from 'jwt-decode'
import { refreshToken } from '../services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function getNewToken() {
      return await refreshToken()
    }
    const token = localStorage.getItem('token')
    if (token && token !== 'mock-token-user' && token !== 'mock-token-admin') {
      try {
        let decoded = jwtDecode(token)
        const margemSeguranca = 15;

        const currentTime = Date.now() / 1000;
        if(!decoded.exp || (currentTime + margemSeguranca) > decoded.exp){
          decoded = getNewToken()
        }

        setUser({
          id: decoded.sub,
          name: decoded.name || '',
          email: decoded.email || '',
          isAdmin: decoded.isAdmin === 'True' || decoded.isAdmin === true
        })
      } catch (e) {
        setUser(null)
      }
    }
    setLoading(false)
  }, [])

  return (
    <AuthContext.Provider value={{ user, setUser, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
