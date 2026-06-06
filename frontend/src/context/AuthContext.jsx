import { createContext, useContext, useState, useEffect } from 'react'
import { jwtDecode } from 'jwt-decode'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token && token !== 'mock-token-user' && token !== 'mock-token-admin') {
      try {
        const decoded = jwtDecode(token)
        setUser({
          id: decoded.sub,
          isAdmin: decoded.admin || false
        })
      } catch (e) {
        localStorage.removeItem('token')
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