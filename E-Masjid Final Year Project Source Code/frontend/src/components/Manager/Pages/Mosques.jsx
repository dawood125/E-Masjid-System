import { useEffect, useState } from 'react'
import { useUI } from '../../../hooks/useUI.js'
import { Link } from 'react-router-dom'
import { ROUTES } from '../../../utils/constants.js'
import api from '../../../utils/api.js'

export default function ManageMosques() {
  const [mosques, setMosques] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [adminModalMosque, setAdminModalMosque] = useState(null)
  const [adminForm, setAdminForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [adminFormBusy, setAdminFormBusy] = useState(false)
  const [lastCreatedAdmin, setLastCreatedAdmin] = useState(null)
  const [editModalMosque, setEditModalMosque] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', address: '', city: '', phone: '', email: '' })
  const [editFormBusy, setEditFormBusy] = useState(false)
  const { showToast } = useUI()
  const [loading, setLoading] = useState(true)

  const [formData, setFormData] = useState({
    name: '', address: '', city: '', phone: '', email: '',
  })

  const loadMosques = async () => {
    setLoading(true)
    try {
      
      
      const res = await api.getSuperAdminMosques()
      setMosques(res.data || [])
    } catch (e) {
      showToast(e.message || 'Failed to load mosques', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMosques()
    
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
          isActive: false,
        })
        const newMosque = res.data
        setMosques((prev) => [newMosque, ...prev])
        setFormData({ name: '', address: '', city: '', phone: '', email: '' })
        setShowForm(false)
        showToast('Mosque created. Now create the first admin for it.', 'success')
        
        setAdminModalMosque(newMosque)
        setAdminForm({ name: '', email: '', phone: '', password: '' })
        setLastCreatedAdmin(null)
      } catch (e) {
        showToast(e.message || 'Failed to create mosque', 'error')
      }
    })()
  }

  const handleCreateAdmin = (e) => {
    e.preventDefault()
    if (!adminForm.name || !adminForm.email) {
      showToast('Admin name and email are required', 'warning')
      return
    }
    setAdminFormBusy(true)
    ;(async () => {
      try {
        const payload = { name: adminForm.name, email: adminForm.email, phone: adminForm.phone }
        if (adminForm.password) payload.password = adminForm.password
        const res = await api.createSuperAdminAdmin(adminModalMosque._id, payload)
        setLastCreatedAdmin({ ...res.data, generatedPassword: res.generatedPassword })
        
        await loadMosques()
        showToast('Admin account created. Share the credentials securely.', 'success')
        setAdminForm({ name: '', email: '', phone: '', password: '' })
      } catch (e) {
        showToast(e.message || 'Failed to create admin', 'error')
      } finally {
        setAdminFormBusy(false)
      }
    })()
  }

  const closeAdminModal = () => {
    setAdminModalMosque(null)
    setLastCreatedAdmin(null)
    setAdminForm({ name: '', email: '', phone: '', password: '' })
  }

  const openEditModal = (mosque) => {
    setEditModalMosque(mosque)
    setEditForm({
      name: mosque.name || '',
      address: mosque.address || '',
      city: mosque.city || '',
      phone: mosque.phone || '',
      email: mosque.email || '',
    })
  }

  const closeEditModal = () => {
    setEditModalMosque(null)
    setEditForm({ name: '', address: '', city: '', phone: '', email: '' })
  }

  const handleEditMosque = (e) => {
    e.preventDefault()
    if (!editForm.name || !editForm.city) {
      showToast('Mosque name and city are required', 'warning')
      return
    }
    setEditFormBusy(true)
    ;(async () => {
      try {
        const res = await api.updateMosque(editModalMosque._id, editForm)
        setMosques((prev) => prev.map((m) => (m._id === editModalMosque._id ? res.data : m)))
        showToast('Mosque updated successfully', 'success')
        closeEditModal()
      } catch (err) {
        showToast(err.message || 'Failed to update mosque', 'error')
      } finally {
        setEditFormBusy(false)
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
          <p className="mt-1 text-gray-500">Create, configure and manage your mosques — Super Admin onboarding</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={ROUTES.MANAGER_ADMINS}
            className="btn btn-secondary"
          >
            <i className="material-icons-round text-lg">people</i>
            View All Admins
          </Link>
          <button onClick={() => { setShowForm(!showForm) }} className="btn btn-primary bg-[#047857] hover:bg-[#064e3b]">
            <i className="material-icons-round text-lg">{showForm ? 'close' : 'add'}</i>
            {showForm ? 'Cancel' : 'Add Mosque'}
          </button>
        </div>
      </div>

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

      <div className="space-y-6">
        {loading ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-gray-500">
            Loading mosques...
          </div>
        ) : mosques.map((mosque) => (
          <div key={mosque._id} className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">

            <div className="flex flex-col md:flex-row">
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
                      onClick={() => openEditModal(mosque)}
                      className="btn btn-secondary btn-sm"
                      title="Edit masjid details"
                    >
                      <i className="material-icons-round text-base">edit</i>
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        setAdminModalMosque(mosque)
                        setAdminForm({ name: '', email: '', phone: '', password: '' })
                        setLastCreatedAdmin(null)
                      }}
                      className="btn btn-secondary btn-sm"
                      title="Create a new admin account scoped to this masjid"
                    >
                      <i className="material-icons-round text-base">person_add</i>
                      Add Admin
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {adminModalMosque && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in"
          onClick={(e) => { if (e.target === e.currentTarget) closeAdminModal() }}
        >
          <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-primary text-xl font-bold text-gray-900">Create Admin Account</h2>
                <p className="mt-1 text-sm text-gray-500">
                  For masjid <span className="font-semibold text-gray-800">{adminModalMosque.name}</span>
                </p>
              </div>
              <button
                onClick={closeAdminModal}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                aria-label="Close"
              >
                <i className="material-icons-round">close</i>
              </button>
            </div>

            {!lastCreatedAdmin ? (
              <form onSubmit={handleCreateAdmin} className="mt-5 space-y-4">
                <div>
                  <label className="form-label">Full Name *</label>
                  <input
                    className="form-input"
                    placeholder="e.g. Haji Ahmad"
                    value={adminForm.name}
                    onChange={(e) => setAdminForm((p) => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="form-label">Email *</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="admin@masjid.pk"
                    value={adminForm.email}
                    onChange={(e) => setAdminForm((p) => ({ ...p, email: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="form-label">Phone (optional)</label>
                  <input
                    className="form-input"
                    placeholder="0300-XXXXXXX"
                    value={adminForm.phone}
                    onChange={(e) => setAdminForm((p) => ({ ...p, phone: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="form-label">Initial password (optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Leave blank to auto-generate"
                    value={adminForm.password}
                    onChange={(e) => setAdminForm((p) => ({ ...p, password: e.target.value }))}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    A random 10-character password is generated if you leave this blank.
                  </p>
                </div>
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button type="button" onClick={closeAdminModal} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={adminFormBusy}
                    className="btn btn-primary bg-[#047857] hover:bg-[#064e3b] disabled:opacity-60"
                  >
                    <i className="material-icons-round text-lg">person_add</i>
                    {adminFormBusy ? 'Creating…' : 'Create Admin'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="mt-5 space-y-4">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <div className="flex items-start gap-3">
                    <i className="material-icons-round text-emerald-700">check_circle</i>
                    <div className="text-sm text-emerald-900">
                      <p className="font-semibold">Admin account created for {adminModalMosque.name}.</p>
                      <p className="mt-1">
                        Share these credentials with the new admin through a secure channel.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm">
                  <p><span className="font-semibold text-gray-700">Email:</span> {lastCreatedAdmin.email}</p>
                  <p className="mt-1"><span className="font-semibold text-gray-700">Initial password:</span>{' '}
                    <code className="rounded bg-white px-2 py-0.5 font-mono text-[#047857]">{lastCreatedAdmin.generatedPassword}</code>
                  </p>
                </div>
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setLastCreatedAdmin(null)} className="btn btn-secondary">
                    Create Another
                  </button>
                  <button type="button" onClick={closeAdminModal} className="btn btn-primary bg-[#047857] hover:bg-[#064e3b]">
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {editModalMosque && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in"
          onClick={(e) => { if (e.target === e.currentTarget) closeEditModal() }}
        >
          <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-primary text-xl font-bold text-gray-900">Edit Masjid</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Update details for <span className="font-semibold text-gray-800">{editModalMosque.name}</span>
                </p>
              </div>
              <button
                onClick={closeEditModal}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                aria-label="Close"
              >
                <i className="material-icons-round">close</i>
              </button>
            </div>

            <form onSubmit={handleEditMosque} className="mt-5 space-y-4">
              <div>
                <label className="form-label">Mosque Name *</label>
                <input
                  className="form-input"
                  value={editForm.name}
                  onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="form-label">City *</label>
                <input
                  className="form-input"
                  value={editForm.city}
                  onChange={(e) => setEditForm((p) => ({ ...p, city: e.target.value }))}
                />
              </div>
              <div>
                <label className="form-label">Address</label>
                <input
                  className="form-input"
                  value={editForm.address}
                  onChange={(e) => setEditForm((p) => ({ ...p, address: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="form-label">Phone</label>
                  <input
                    className="form-input"
                    value={editForm.phone}
                    onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-input"
                    value={editForm.email}
                    onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={closeEditModal} className="btn btn-secondary">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editFormBusy}
                  className="btn btn-primary bg-[#047857] hover:bg-[#064e3b] disabled:opacity-60"
                >
                  <i className="material-icons-round text-lg">save</i>
                  {editFormBusy ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
