import { createContext, useState, useCallback, useEffect, useRef, useContext } from 'react'
import api from '../utils/api'
import { getActiveMosqueId, setActiveMosqueId, clearActiveMosqueId } from '../utils/mosque.js'
import { AuthContext } from './AuthContext.jsx'

export const MosqueContext = createContext()

export function MosqueProvider({ children }) {
  const { user } = useContext(AuthContext)
  const [activeMosqueId, setActiveMosqueIdState] = useState(() => getActiveMosqueId() || '')
  const [mosques, setMosques] = useState([])
  const [loading, setLoading] = useState(true)
  const hasHydratedRef = useRef(false)

  
  
  
  useEffect(() => {
    if (user?.mosqueId) {
      setActiveMosqueIdState(user.mosqueId)
      setActiveMosqueId(user.mosqueId)
    }
  }, [user?._id, user?.mosqueId])

  
  useEffect(() => {
    let mounted = true
    async function loadMosques() {
      try {
        const res = await api.getPublicMosques()
        if (!mounted) return
        const list = Array.isArray(res?.data) ? res.data : []
        setMosques(list)
        
        if (!getActiveMosqueId() && list.length > 0) {
          setActiveMosqueIdState(list[0]._id)
          setActiveMosqueId(list[0]._id)
        }
      } catch {
        
      } finally {
        if (mounted) {
          setLoading(false)
          hasHydratedRef.current = true
        }
      }
    }
    loadMosques()
    return () => { mounted = false }
  }, [])

  const setActiveMosque = useCallback((mosqueId) => {
    if (!mosqueId) {
      clearActiveMosqueId()
      setActiveMosqueIdState('')
      return
    }
    setActiveMosqueId(mosqueId)
    setActiveMosqueIdState(mosqueId)
  }, [])

  const activeMosque = activeMosqueId
    ? mosques.find((m) => String(m._id) === String(activeMosqueId)) || null
    : null

  const value = {
    activeMosqueId,
    activeMosque,
    mosques,
    loading,
    setActiveMosque,
  }

  return (
    <MosqueContext.Provider value={value}>
      {children}
    </MosqueContext.Provider>
  )
}
