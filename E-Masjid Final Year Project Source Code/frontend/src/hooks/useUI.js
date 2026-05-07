import { useContext } from 'react'
import { UIContext } from '../context/UIContext.jsx'

export function useUI() {
  const context = useContext(UIContext)
  if (!context) {
    throw new Error('useUI must be used within UIProvider')
  }
  return context
}
