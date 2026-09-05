import { createContext, useState, useCallback, useEffect, useRef, useContext } from 'react'
import api from '../utils/api'
import { getActiveMosqueId, setActiveMosqueId, clearActiveMosqueId } from '../utils/mosque.js'
import { AuthContext } from './AuthContext.jsx'

export const MosqueContext = createContext()

export function MosqueProvider({ children }) {
  const { user, updateUser } = useContext(AuthContext)
  const [activeMosqueId, setActiveMosqueIdState] = useState(() => getActiveMosqueId() || '')
  const [mosques, setMosques] = useState([])
  const [loading, setLoading] = useState(true)
  const [switching, setSwitching] = useState(false)
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

  const setActiveMosque = useCallback(async (mosqueId) => {
    if (!mosqueId) {
      clearActiveMosqueId()
      setActiveMosqueIdState('')
      return { ok: true, mosqueId: '' }
    }

    if (!user || !user._id) {
      setActiveMosqueId(mosqueId)
      setActiveMosqueIdState(mosqueId)
      return { ok: true, mosqueId }
    }

    setSwitching(true)
    try {
      const res = await api.updateMyMosque(mosqueId)
      if (res?.success && res?.user) {
        setActiveMosqueId(mosqueId)
        setActiveMosqueIdState(mosqueId)
        if (updateUser) {
          updateUser({ mosqueId: res.user.mosqueId || mosqueId })
        }
        return { ok: true, mosqueId: res.user.mosqueId || mosqueId, user: res.user }
      }
      return { ok: false, mosqueId, error: 'Server did not confirm mosque update' }
    } catch (err) {
      return { ok: false, mosqueId, error: err?.message || 'Failed to switch masjid' }
    } finally {
      setSwitching(false)
    }
  }, [user, updateUser])

  const activeMosque = activeMosqueId
    ? mosques.find((m) => String(m._id) === String(activeMosqueId)) || null
    : null

  const value = {
    activeMosqueId,
    activeMosque,
    mosques,
    loading,
    switching,
    setActiveMosque,
  }

  return (
    <MosqueContext.Provider value={value}>
      {children}
    </MosqueContext.Provider>
  )
}
