import { useEffect, useState } from 'react'
import { useUI } from '../../../hooks/useUI.js'
import api from '../../../utils/api.js'

const ALL_MODULES = [
  { key: 'donations', label: 'Donations', icon: 'volunteer_activism', desc: 'Accept and track donations' },
  { key: 'expenses', label: 'Expenses', icon: 'payments', desc: 'Record and manage expenses' },
  { key: 'events', label: 'Events', icon: 'event', desc: 'Create and manage events' },
  { key: 'nikah', label: 'Nikah Services', icon: 'favorite', desc: 'Nikah booking system' },
  { key: 'announcements', label: 'Announcements', icon: 'campaign', desc: 'Post mosque announcements' },
  { key: 'prayerTimes', label: 'Prayer Times', icon: 'schedule', desc: 'Manage daily prayer times' },
  { key: 'fundRequests', label: 'Fund Requests', icon: 'handshake', desc: 'Zakat/Sadaqah fund system' },
]

export default function ManageMosques() {
  const [mosques, setMosques] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [selectedMosque, setSelectedMosque] = useState(null)
  const { showToast } = useUI()
  const [loading, setLoading] = useState(true)

  const [formData, setFormData] = useState({
    name: '', address: '', city: '', phone: '', email: '',
  })

  const loadMosques = async () => {
    setLoading(true)
    try {
      const res = await api.getMosques()
      setMosques(res.data || [])
    } catch (e) {
      showToast(e.message || 'Failed to load mosques', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMosques()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCreateMosque = (e) => {
    e.preventDefault()
    if (!formData.name || !formData.city) {
      showToast('Mosque name and city are required', 'warning')
      return
    }
    ;(async () => {
      try {
        const res = await api.createMosque({
          ...formData,
          enabledModules: ['prayerTimes', 'announcements'],
          isActive: true,
        })
        setMosques((prev) => [res.data, ...prev])
        setFormData({ name: '', address: '', city: '', phone: '', email: '' })
        setShowForm(false)
        showToast('Mosque created successfully!', 'success')
      } catch (e) {
        showToast(e.message || 'Failed to create mosque', 'error')
      }
    })()
  }

  const toggleModule = (mosqueId, moduleKey) => {
    const target = mosques.find((m) => m._id === mosqueId)
    if (!target) return
    const modules = target.enabledModules?.includes(moduleKey)
      ? target.enabledModules.filter((mod) => mod !== moduleKey)
      : [...(target.enabledModules || []), moduleKey]

    setMosques((prev) => prev.map((m) => (m._id === mosqueId ? { ...m, enabledModules: modules } : m)))
    ;(async () => {
      try {
        const res = await api.updateMosqueModules(mosqueId, modules)
        setMosques((prev) => prev.map((m) => (m._id === mosqueId ? res.data : m)))
        showToast('Module updated', 'success')
      } catch (e) {
        showToast(e.message || 'Failed to update module', 'error')
        loadMosques()
      }
    })()
  }

  const toggleActive = (mosqueId) => {
    const target = mosques.find((m) => m._id === mosqueId)
    if (!target) return
    const newStatus = !target.isActive
    setMosques((prev) => prev.map((m) => (m._id === mosqueId ? { ...m, isActive: newStatus } : m)))
    ;(async () => {
      try {
        const res = await api.updateMosque(mosqueId, { isActive: newStatus })
        setMosques((prev) => prev.map((m) => (m._id === mosqueId ? res.data : m)))
        showToast('Status updated', 'success')
      } catch (e) {
        showToast(e.message || 'Failed to update status', 'error')
        loadMosques()
      }
    })()
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-primary text-3xl font-bold text-gray-900">Manage Mosques</h1>
          <p className="mt-1 text-gray-500">Create, configure and manage your mosques</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setEditingId(null) }} className="btn btn-primary bg-[#047857] hover:bg-[#064e3b]">
          <i className="material-icons-round text-lg">{showForm ? 'close' : 'add'}</i>
          {showForm ? 'Cancel' : 'Add Mosque'}
        </button>
      </div>

      {/* Create Mosque Form */}
      {showForm && (
        <form onSubmit={handleCreateMosque} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm animate-fade-in-up">
          <h2 className="font-primary text-xl font-bold text-gray-900 mb-5">Create New Mosque</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <div>
              <label className="form-label">Mosque Name *</label>
              <div className="relative">
                <i className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">mosque</i>
                <input className="form-input" placeholder="e.g. Masjid Al-Noor" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="form-label">City *</label>
              <div className="relative">
                <i className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">location_city</i>
                <input className="form-input" placeholder="e.g. Sheikhupura" value={formData.city} onChange={e => setFormData(p => ({ ...p, city: e.target.value }))} />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="form-label">Address</label>
              <div className="relative">
                <i className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">place</i>
                <input className="form-input" placeholder="Full address" value={formData.address} onChange={e => setFormData(p => ({ ...p, address: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="form-label">Phone</label>
              <div className="relative">
                <i className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">phone</i>
                <input className="form-input" placeholder="0321-XXXXXXX" value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="form-label">Email</label>
              <div className="relative">
                <i className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">email</i>
                <input className="form-input" placeholder="info@mosque.pk" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} />
              </div>
            </div>
          </div>
          <button type="submit" className="btn btn-primary bg-[#047857] hover:bg-[#064e3b]">
            <i className="material-icons-round text-lg">check</i>
            Create Mosque
          </button>
        </form>
      )}

      {/* Mosque List with Module Config */}
      <div className="space-y-6">
        {loading ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-gray-500">
            Loading mosques...
          </div>
        ) : mosques.map((mosque) => (
          <div key={mosque._id} className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            {/* Mosque Header */}
            <div className="flex flex-col md:flex-row">
              <div className="relative w-full md:w-64 h-48 md:h-auto shrink-0">
                <img src={mosque.image} alt={mosque.name} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent md:bg-gradient-to-t" />
              </div>
              <div className="flex-1 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-primary text-xl font-bold text-gray-900">{mosque.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{mosque.address}, {mosque.city}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      {mosque.phone && (
                        <span className="flex items-center gap-1">
                          <i className="material-icons-round text-base">phone</i>{mosque.phone}
                        </span>
                      )}
                      {mosque.email && (
                        <span className="flex items-center gap-1">
                          <i className="material-icons-round text-base">email</i>{mosque.email}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleActive(mosque._id)}
                      className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${mosque.isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                    >
                      {mosque.isActive ? 'Active' : 'Inactive'}
                    </button>
                    <button
                      onClick={() => setSelectedMosque(selectedMosque === mosque._id ? null : mosque._id)}
                      className="btn btn-secondary btn-sm"
                    >
                      <i className="material-icons-round text-base">settings</i>
                      Configure Modules
                    </button>
                  </div>
                </div>

                {/* Module badges */}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {(mosque.enabledModules || []).map((mod) => (
                    <span key={mod} className="rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-[#047857] capitalize">
                      {mod}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Module Configuration Panel */}
            {selectedMosque === mosque._id && (
              <div className="border-t border-gray-200 bg-gray-50 p-6 animate-fade-in">
                <h4 className="font-primary text-lg font-semibold text-gray-900 mb-4">
                  <i className="material-icons-round text-[#047857] align-middle mr-2">tune</i>
                  Module Configuration — {mosque.name}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {ALL_MODULES.map((mod) => {
                    const isEnabled = mosque.enabledModules.includes(mod.key)
                    return (
                      <button
                        key={mod.key}
                        onClick={() => toggleModule(mosque._id, mod.key)}
                        className={`rounded-xl border p-4 text-left transition-all ${isEnabled ? 'border-[#047857] bg-primary-50 shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <i className={`material-icons-round text-xl ${isEnabled ? 'text-[#047857]' : 'text-gray-400'}`}>{mod.icon}</i>
                          <div className={`h-5 w-10 rounded-full transition-colors ${isEnabled ? 'bg-[#047857]' : 'bg-gray-300'} relative`}>
                            <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${isEnabled ? 'left-[22px]' : 'left-0.5'}`} />
                          </div>
                        </div>
                        <p className={`text-sm font-semibold ${isEnabled ? 'text-[#047857]' : 'text-gray-700'}`}>{mod.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{mod.desc}</p>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
