import { useEffect, useRef } from 'react'
import { useAuth } from './useAuth.js'
import { useUI } from './useUI.js'

const ROLE_LABELS = {
  admin: 'Admin',
  manager: 'Manager',
  committee: 'Committee',
  scholar: 'Scholar',
  community: 'User',
}

/**
 * Forces a logout when a login page is mounted while a user is already
 * authenticated. Shows a toast so the user understands why they were
 * signed out. Runs only once on mount, never on re-renders.
 *
 * Use in every login page so cross-role logins (Admin -> Manager, etc.)
 * silently replace the previous session instead of stacking two sessions.
 */
export function useForceLogoutOnMount() {
  const { isAuthenticated, user, loading, logout } = useAuth()
  const { showToast } = useUI()
  const hasRunRef = useRef(false)

  useEffect(() => {
    if (hasRunRef.current) return
    if (loading) return
    if (!isAuthenticated || !user) {
      hasRunRef.current = true
      return
    }

    const roleLabel = ROLE_LABELS[user.role] || 'User'
    hasRunRef.current = true
    logout()
    showToast(`Signed out from your previous ${roleLabel} session. Please sign in below.`, 'info', 4000)
  }, [isAuthenticated, user, loading, logout, showToast])
}
