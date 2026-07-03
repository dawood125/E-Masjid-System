import { useContext } from 'react'
import { MosqueContext } from '../context/MosqueContext.jsx'

export function useMosque() {
  const context = useContext(MosqueContext)
  if (!context) {
    throw new Error('useMosque must be used within MosqueProvider')
  }
  return context
}
