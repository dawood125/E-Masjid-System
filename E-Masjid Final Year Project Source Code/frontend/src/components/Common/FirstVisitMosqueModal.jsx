import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { useMosque } from '../../hooks/useMosque.js'
import MosqueSearchModal from '../Auth/Pages/MosqueSearchModal.jsx'

const SEEN_KEY = 'masjidModalSeen'

export default function FirstVisitMosqueModal() {
  const { user } = useAuth()
  const { setActiveMosque, activeMosqueId } = useMosque()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (user) return
    if (activeMosqueId) return
    try {
      if (localStorage.getItem(SEEN_KEY)) return
    } catch {
      return
    }
    setOpen(true)
  }, [user, activeMosqueId])

  const handleClose = () => {
    try { localStorage.setItem(SEEN_KEY, '1') } catch {}
    setOpen(false)
  }

  const handleSelect = (mosque) => {
    setActiveMosque(mosque._id)
    handleClose()
  }

  return (
    <MosqueSearchModal
      open={open}
      onClose={handleClose}
      onSelect={handleSelect}
    />
  )
}
