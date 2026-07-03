import { createContext, useState, useCallback, useEffect, useRef } from 'react'
import api from '../utils/api'
import { getActiveMosqueId, setActiveMosqueId, clearActiveMosqueId } from '../utils/mosque.js'

export const MosqueContext = createContext()

/**
 * Global "active mosque" state for the public area of the app.
 *
 * - On mount, the user's `user.mosqueId` (if logged in) takes priority, then the
 *   previously-saved localStorage value, then the first mosque from the public
 *   list.
 * - All public pages (Home, Prayer Times, Events, Announcements, Transparency,
 *   Donate, Fund Request) read `activeMosqueId` from `useMosque()` and re-fetch
 *   their data when it changes.
 * - The Navbar's mosque selector dispatches updates via `setActiveMosque()`.
 * - When the user logs out, the saved selection is cleared so the next visitor
 *   gets a fresh auto-pick of the first active mosque.
 */
export function MosqueProvider({ children }) {
  const [activeMosqueId, setActiveMosqueIdState] = useState(() => getActiveMosqueId() || '')
  const [mosques, setMosques] = useState([])
  const [loading, setLoading] = useState(true)
  const hasHydratedRef = useRef(false)

  // Load the public list of active mosques on mount.
  useEffect(() => {
    let mounted = true
    async function loadMosques() {
      try {
        const res = await api.getPublicMosques()
        if (!mounted) return
        const list = Array.isArray(res?.data) ? res.data : []
        setMosques(list)
        // Auto-pick the first mosque if nothing is saved yet.
        if (!getActiveMosqueId() && list.length > 0) {
          setActiveMosqueIdState(list[0]._id)
          setActiveMosqueId(list[0]._id)
        }
      } catch {
        // Silent — public pages should still render their empty state.
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
