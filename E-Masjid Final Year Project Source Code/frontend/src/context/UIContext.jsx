import { createContext, useState, useCallback } from 'react'

export const UIContext = createContext()

export function UIProvider({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [toast, setToast] = useState(null)

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev)
  }, [])

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false)
  }, [])

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen(prev => !prev)
  }, [])

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false)
  }, [])

  const showToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToast({ id, message, type })

    if (duration > 0) {
      setTimeout(() => {
        setToast(null)
      }, duration)
    }
  }, [])

  const closeToast = useCallback(() => {
    setToast(null)
  }, [])

  const value = {
    sidebarOpen,
    toggleSidebar,
    closeSidebar,
    mobileMenuOpen,
    toggleMobileMenu,
    closeMobileMenu,
    toast,
    showToast,
    closeToast,
  }

  return (
    <UIContext.Provider value={value}>
      {children}
    </UIContext.Provider>
  )
}
