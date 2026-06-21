import { createContext, useContext, useState, useEffect } from 'react'
import { jwtDecode } from 'jwt-decode'
import { refreshToken } from '../services/authService'
import { TokenExpiredError } from '../services/errors_classes'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function carregarSessao() {
      const token = localStorage.getItem('token')
      if (!token) {
        setLoading(false)
        return
      }

      try {
        let decoded = jwtDecode(token)
        const margemSeguranca = 15
        const currentTime = Date.now() / 1000

        if (!decoded.exp || (currentTime + margemSeguranca) > decoded.exp) {
          await refreshToken()
          const novoToken = localStorage.getItem('token')
          decoded = jwtDecode(novoToken)
        }

        setUser({
          id: decoded.sub,
          name: decoded.name || '',
          email: decoded.email || '',
          isAdmin: decoded.isAdmin === 'True' || decoded.isAdmin === true,
        })
      } catch (error){
        if(error instanceof TokenExpiredError){
          alert("Sessão expirada. Realize novamente o login.")
          localStorage.removeItem('token')
          localStorage.removeItem('refreshToken')
          localStorage.removeItem('favorites')
        }
        
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    carregarSessao()
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
