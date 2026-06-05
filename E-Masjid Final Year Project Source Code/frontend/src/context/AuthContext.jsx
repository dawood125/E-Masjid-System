import { createContext, useState, useCallback, useEffect, useRef } from 'react'
import api from '../utils/api'
import { setActiveMosqueId } from '../utils/mosque.js'

export const AuthContext = createContext()

function getLogoutRedirectPath(role) {
  switch (role) {
    case 'admin': return '/admin/login'
    case 'manager': return '/manager/login'
    case 'committee': return '/committee/login'
    default: return '/login'
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const activityFlagRef = useRef(false)

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
            if (data.user?.mosqueId) setActiveMosqueId(data.user.mosqueId)
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

  // Activity tracking and token refresh
  useEffect(() => {
    const markActive = () => { activityFlagRef.current = true }

    const events = ['click', 'keypress', 'scroll', 'touchstart']
    events.forEach(evt => document.addEventListener(evt, markActive, { passive: true }))

    const interval = setInterval(async () => {
      if (!activityFlagRef.current) return
      activityFlagRef.current = false

      const token = localStorage.getItem('authToken')
      if (!token) return

      try {
        const data = await api.refreshToken()
        if (data.success && data.token) {
          localStorage.setItem('authToken', data.token)
        }
      } catch (err) {
        console.error('Token refresh failed:', err)
      }
    }, 5 * 60 * 1000)

    return () => {
      events.forEach(evt => document.removeEventListener(evt, markActive))
      clearInterval(interval)
    }
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
      if (data.user?.mosqueId) setActiveMosqueId(data.user.mosqueId)
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
      if (data.user?.mosqueId) setActiveMosqueId(data.user.mosqueId)
      return data.user
    } catch (err) {
      setError(err.message || 'Registration failed')
      throw err
    }
  }, [])

  const logout = useCallback(() => {
    const redirectPath = getLogoutRedirectPath(user?.role)
    setUser(null)
    localStorage.removeItem('user')
    localStorage.removeItem('authToken')
    setError(null)
    return redirectPath
  }, [user])

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
