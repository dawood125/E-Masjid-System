import { createContext, useState, useCallback, useEffect } from 'react'
import api from '../utils/api'

export const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Initialize auth from localStorage and verify with backend
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('authToken')
      
      if (storedToken) {
        try {
          const data = await api.getMe()
          if (data.success) {
            setUser(data.user)
            localStorage.setItem('user', JSON.stringify(data.user))
          } else {
            throw new Error('Invalid session')
          }
        } catch (err) {
          console.error('Session restore failed:', err)
          localStorage.removeItem('user')
          localStorage.removeItem('authToken')
          setUser(null)
        }
      }
      setLoading(false)
    }
    
    checkAuth()
  }, [])

  const login = useCallback(async (email, password, expectedRole = null) => {
    try {
      setError(null)
      const data = await api.login(email, password)
      
      if (expectedRole && data.user.role !== expectedRole) {
        throw new Error(`Unauthorized role. Expected ${expectedRole}, got ${data.user.role}`)
      }
      
      setUser(data.user)
      localStorage.setItem('user', JSON.stringify(data.user))
      localStorage.setItem('authToken', data.token)
      return data.user
    } catch (err) {
      setError(err.message || 'Login failed')
      throw err
    }
  }, [])

  const register = useCallback(async (email, password, name, phone) => {
    try {
      setError(null)
      const data = await api.register({ email, password, name, phone })
      
      setUser(data.user)
      localStorage.setItem('user', JSON.stringify(data.user))
      localStorage.setItem('authToken', data.token)
      return data.user
    } catch (err) {
      setError(err.message || 'Registration failed')
      throw err
    }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem('user')
    localStorage.removeItem('authToken')
    setError(null)
  }, [])

  const isAuthenticated = !!user
  const userRole = user?.role || null

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated,
    userRole,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
