import { Link } from 'react-router-dom'
import { ROUTES } from '../../../utils/constants.js'
import { useEffect, useMemo, useState } from 'react'
import api from '../../../utils/api.js'
import { useUI } from '../../../hooks/useUI.js'

export default function ManagerDashboard() {
  const { showToast } = useUI()
  const [mosques, setMosques] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      try {
        const res = await api.getMosques()
        if (!mounted) return
        setMosques(res.data || [])
      } catch (e) {
        if (!mounted) return
        showToast(e.message || 'Failed to load mosques', 'error')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [showToast])

  const activeMosques = useMemo(() => mosques.filter(m => m.isActive).length, [mosques])

  return (
    <div className="space-y-8 animate-fade-in">

      <div className="rounded-2xl bg-gradient-to-br from-[#1a1a2e] to-[#16213e] p-8 text-white relative overflow-hidden">
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-[#d4af37]/10" />
        <div className="absolute -bottom-14 -left-14 h-48 w-48 rounded-full bg-white/5" />
        <div className="relative z-10">
          <p className="text-[#d4af37] text-sm font-semibold uppercase tracking-wider">Super Admin Dashboard</p>
          <h1 className="mt-2 font-primary text-3xl font-bold">Assalam-o-Alaikum!</h1>
          <p className="mt-2 text-gray-300 max-w-xl">Manage multiple mosques, configure modules, and oversee operations from a single dashboard.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <i className="material-icons-round text-blue-600 text-2xl">mosque</i>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Mosques</p>
              <p className="text-3xl font-bold text-gray-900">{mosques.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center">
              <i className="material-icons-round text-green-600 text-2xl">check_circle</i>
            </div>
            <div>
              <p className="text-sm text-gray-500">Active Mosques</p>
              <p className="text-3xl font-bold text-gray-900">{activeMosques}</p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-primary text-2xl font-bold text-gray-900">Your Mosques</h2>
          <Link to={ROUTES.MANAGER_MOSQUES} className="btn btn-primary bg-[#047857] hover:bg-[#064e3b]">
            <i className="material-icons-round text-lg">add</i>
            Add Mosque
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {loading ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-gray-500">
              Loading mosques...
            </div>
          ) : mosques.map((mosque) => (
            <div key={mosque._id} className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{mosque.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{mosque.city}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${mosque.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {mosque.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {mosque.address && <p className="text-sm text-gray-500 mt-3">{mosque.address}</p>}
                <Link to={ROUTES.MANAGER_MOSQUES} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#047857] hover:text-[#d4af37] transition-colors">
                  Manage <i className="material-icons-round text-base">arrow_forward</i>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
