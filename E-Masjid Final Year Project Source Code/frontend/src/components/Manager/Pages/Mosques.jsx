import { useEffect, useState } from 'react'
import { useUI } from '../../../hooks/useUI.js'
import { Link } from 'react-router-dom'
import { ROUTES } from '../../../utils/constants.js'
import api from '../../../utils/api.js'
import FormField from '../../Common/FormField.jsx'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateMosqueForm(form) {
  const errs = {}
  if (!form.name.trim()) errs.name = 'Mosque name is required'
  else if (form.name.trim().length < 2) errs.name = 'Mosque name must be at least 2 characters'
  else if (form.name.trim().length > 120) errs.name = 'Mosque name is too long'

  if (!form.city.trim()) errs.city = 'City is required'
  else if (form.city.trim().length < 2) errs.city = 'Please enter a valid city'

  if (form.address && form.address.length > 500) errs.address = 'Address is too long'

  if (form.phone && form.phone.trim().length < 7) errs.phone = 'Phone number looks too short'

  if (form.email && !EMAIL_RE.test(form.email.trim())) errs.email = 'Enter a valid email address'
  return errs
}

function validateAdminForm(form) {
  const errs = {}
  if (!form.name.trim()) errs.name = 'Admin full name is required'
  else if (form.name.trim().length < 2) errs.name = 'Please enter the admin full name'

  if (!form.email.trim()) errs.email = 'Email is required'
  else if (!EMAIL_RE.test(form.email.trim())) errs.email = 'Enter a valid email address'

  if (form.phone && form.phone.trim().length < 7) errs.phone = 'Phone number looks too short'

  if (form.password) {
    if (form.password.length < 8) errs.password = 'Password must be at least 8 characters'
    else if (form.password.length > 64) errs.password = 'Password is too long'
  }
  return errs
}

export default function ManageMosques() {
  const [mosques, setMosques] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [adminModalMosque, setAdminModalMosque] = useState(null)
  const [adminForm, setAdminForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [adminFormErrors, setAdminFormErrors] = useState({})
  const [adminFormBusy, setAdminFormBusy] = useState(false)
  const [lastCreatedAdmin, setLastCreatedAdmin] = useState(null)
  const [editModalMosque, setEditModalMosque] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', address: '', city: '', phone: '', email: '' })
  const [editFormErrors, setEditFormErrors] = useState({})
  const [editFormBusy, setEditFormBusy] = useState(false)
  const { showToast } = useUI()
  const [loading, setLoading] = useState(true)

  const [formData, setFormData] = useState({
    name: '', address: '', city: '', phone: '', email: '',
  })
  const [formErrors, setFormErrors] = useState({})

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

  const updateForm = (field, value) => {
    setFormData((p) => ({ ...p, [field]: value }))
    if (formErrors[field]) setFormErrors((p) => ({ ...p, [field]: null }))
  }

  const updateAdmin = (field, value) => {
    setAdminForm((p) => ({ ...p, [field]: value }))
    if (adminFormErrors[field]) setAdminFormErrors((p) => ({ ...p, [field]: null }))
  }

  const updateEdit = (field, value) => {
    setEditForm((p) => ({ ...p, [field]: value }))
    if (editFormErrors[field]) setEditFormErrors((p) => ({ ...p, [field]: null }))
  }

  const handleCreateMosque = (e) => {
    e.preventDefault()
    const v = validateMosqueForm(formData)
    if (Object.keys(v).length > 0) {
      setFormErrors(v)
      const firstField = Object.keys(v)[0]
      const el = document.querySelector(`[name="${firstField}"]`)
      if (el && el.focus) el.focus()
      return
    }
    ;(async () => {
      try {
        const res = await api.createMosque({
          name: formData.name.trim(),
          city: formData.city.trim(),
          address: formData.address.trim() || undefined,
          phone: formData.phone.trim() || undefined,
          email: formData.email.trim() || undefined,
          isActive: false,
        })
        const newMosque = res.data
        setMosques((prev) => [newMosque, ...prev])
        setFormData({ name: '', address: '', city: '', phone: '', email: '' })
        setFormErrors({})
        setShowForm(false)
        showToast('Mosque created. Now create the first admin for it.', 'success')
        setAdminModalMosque(newMosque)
        setAdminForm({ name: '', email: '', phone: '', password: '' })
        setAdminFormErrors({})
        setLastCreatedAdmin(null)
      } catch (e) {
        if (e.errors && Array.isArray(e.errors)) {
          const fieldErrors = {}
          e.errors.forEach((er) => { if (er.field) fieldErrors[er.field] = er.message })
          if (Object.keys(fieldErrors).length > 0) {
            setFormErrors(fieldErrors)
            showToast('Please fix the highlighted fields', 'error')
          } else {
            showToast(e.message || 'Failed to create mosque', 'error')
          }
        } else {
          showToast(e.message || 'Failed to create mosque', 'error')
        }
      }
    })()
  }

  const handleCreateAdmin = (e) => {
    e.preventDefault()
    const v = validateAdminForm(adminForm)
    if (Object.keys(v).length > 0) {
      setAdminFormErrors(v)
      const firstField = Object.keys(v)[0]
      const el = document.querySelector(`[name="${firstField}"]`)
      if (el && el.focus) el.focus()
      return
    }
    setAdminFormBusy(true)
    ;(async () => {
      try {
        const payload = { name: adminForm.name.trim(), email: adminForm.email.trim() }
        if (adminForm.phone.trim()) payload.phone = adminForm.phone.trim()
        if (adminForm.password.trim()) payload.password = adminForm.password
        const res = await api.createSuperAdminAdmin(adminModalMosque._id, payload)
        setLastCreatedAdmin({ ...res.data, generatedPassword: res.generatedPassword })
        await loadMosques()
        showToast('Admin account created. Share the credentials securely.', 'success')
        setAdminForm({ name: '', email: '', phone: '', password: '' })
        setAdminFormErrors({})
      } catch (e) {
        if (e.errors && Array.isArray(e.errors)) {
          const fieldErrors = {}
          e.errors.forEach((er) => { if (er.field) fieldErrors[er.field] = er.message })
          if (Object.keys(fieldErrors).length > 0) {
            setAdminFormErrors(fieldErrors)
            showToast('Please fix the highlighted fields', 'error')
          } else {
            showToast(e.message || 'Failed to create admin', 'error')
          }
        } else {
          showToast(e.message || 'Failed to create admin', 'error')
        }
      } finally {
        setAdminFormBusy(false)
      }
    })()
  }

  const closeAdminModal = () => {
    setAdminModalMosque(null)
    setLastCreatedAdmin(null)
    setAdminForm({ name: '', email: '', phone: '', password: '' })
    setAdminFormErrors({})
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
    setEditFormErrors({})
  }

  const closeEditModal = () => {
    setEditModalMosque(null)
    setEditForm({ name: '', address: '', city: '', phone: '', email: '' })
    setEditFormErrors({})
  }

  const handleEditMosque = (e) => {
    e.preventDefault()
    const v = validateMosqueForm(editForm)
    if (Object.keys(v).length > 0) {
      setEditFormErrors(v)
      return
    }
    setEditFormBusy(true)
    ;(async () => {
      try {
        const payload = {
          name: editForm.name.trim(),
          city: editForm.city.trim(),
          address: editForm.address.trim() || undefined,
          phone: editForm.phone.trim() || undefined,
          email: editForm.email.trim() || undefined,
        }
        const res = await api.updateMosque(editModalMosque._id, payload)
        setMosques((prev) => prev.map((m) => (m._id === editModalMosque._id ? res.data : m)))
        showToast('Mosque updated successfully', 'success')
        closeEditModal()
      } catch (err) {
        if (err.errors && Array.isArray(err.errors)) {
          const fieldErrors = {}
          err.errors.forEach((er) => { if (er.field) fieldErrors[er.field] = er.message })
          if (Object.keys(fieldErrors).length > 0) {
            setEditFormErrors(fieldErrors)
            showToast('Please fix the highlighted fields', 'error')
          } else {
            showToast(err.message || 'Failed to update mosque', 'error')
          }
        } else {
          showToast(err.message || 'Failed to update mosque', 'error')
        }
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
          <Link to={ROUTES.MANAGER_ADMINS} className="btn btn-secondary">
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
        <form onSubmit={handleCreateMosque} noValidate className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm animate-fade-in-up">
          <h2 className="font-primary text-xl font-bold text-gray-900 mb-5">Create New Mosque</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <FormField
              name="name"
              label="Mosque Name"
              icon="mosque"
              required
              value={formData.name}
              onChange={(e) => updateForm('name', e.target.value)}
              error={formErrors.name}
              placeholder="e.g. Masjid Al-Noor"
            />
            <FormField
              name="city"
              label="City"
              icon="location_city"
              required
              value={formData.city}
              onChange={(e) => updateForm('city', e.target.value)}
              error={formErrors.city}
              placeholder="e.g. Sheikhupura"
            />
            <div className="md:col-span-2">
              <FormField
                name="address"
                label="Address"
                icon="place"
                optional
                value={formData.address}
                onChange={(e) => updateForm('address', e.target.value)}
                error={formErrors.address}
                placeholder="Full address"
              />
            </div>
            <FormField
              name="phone"
              label="Phone"
              type="tel"
              icon="phone"
              optional
              value={formData.phone}
              onChange={(e) => updateForm('phone', e.target.value)}
              error={formErrors.phone}
              placeholder="0321-XXXXXXX"
            />
            <FormField
              name="email"
              label="Email"
              type="email"
              icon="email"
              optional
              value={formData.email}
              onChange={(e) => updateForm('email', e.target.value)}
              error={formErrors.email}
              placeholder="info@mosque.pk"
            />
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
                    <button onClick={() => openEditModal(mosque)} className="btn btn-secondary btn-sm" title="Edit masjid details">
                      <i className="material-icons-round text-base">edit</i>
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        setAdminModalMosque(mosque)
                        setAdminForm({ name: '', email: '', phone: '', password: '' })
                        setAdminFormErrors({})
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
              <button onClick={closeAdminModal} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100" aria-label="Close">
                <i className="material-icons-round">close</i>
              </button>
            </div>

            {!lastCreatedAdmin ? (
              <form onSubmit={handleCreateAdmin} noValidate className="mt-5 space-y-4">
                <FormField
                  name="name"
                  label="Full Name"
                  required
                  value={adminForm.name}
                  onChange={(e) => updateAdmin('name', e.target.value)}
                  error={adminFormErrors.name}
                  placeholder="e.g. Haji Ahmad"
                />
                <FormField
                  name="email"
                  label="Email"
                  type="email"
                  required
                  value={adminForm.email}
                  onChange={(e) => updateAdmin('email', e.target.value)}
                  error={adminFormErrors.email}
                  placeholder="admin@masjid.pk"
                />
                <FormField
                  name="phone"
                  label="Phone"
                  type="tel"
                  optional
                  value={adminForm.phone}
                  onChange={(e) => updateAdmin('phone', e.target.value)}
                  error={adminFormErrors.phone}
                  placeholder="0300-XXXXXXX"
                />
                <FormField
                  name="password"
                  label="Initial password"
                  type="text"
                  optional
                  value={adminForm.password}
                  onChange={(e) => updateAdmin('password', e.target.value)}
                  error={adminFormErrors.password}
                  placeholder="Leave blank to auto-generate"
                  hint="A random 10-character password is generated if you leave this blank."
                />
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button type="button" onClick={closeAdminModal} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" disabled={adminFormBusy} className="btn btn-primary bg-[#047857] hover:bg-[#064e3b] disabled:opacity-60">
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
                      <p className="mt-1">Share these credentials with the new admin through a secure channel.</p>
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
              <button onClick={closeEditModal} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100" aria-label="Close">
                <i className="material-icons-round">close</i>
              </button>
            </div>

            <form onSubmit={handleEditMosque} noValidate className="mt-5 space-y-4">
              <FormField
                name="name"
                label="Mosque Name"
                required
                value={editForm.name}
                onChange={(e) => updateEdit('name', e.target.value)}
                error={editFormErrors.name}
              />
              <FormField
                name="city"
                label="City"
                required
                value={editForm.city}
                onChange={(e) => updateEdit('city', e.target.value)}
                error={editFormErrors.city}
              />
              <FormField
                name="address"
                label="Address"
                optional
                value={editForm.address}
                onChange={(e) => updateEdit('address', e.target.value)}
                error={editFormErrors.address}
              />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  name="phone"
                  label="Phone"
                  type="tel"
                  optional
                  value={editForm.phone}
                  onChange={(e) => updateEdit('phone', e.target.value)}
                  error={editFormErrors.phone}
                />
                <FormField
                  name="email"
                  label="Email"
                  type="email"
                  optional
                  value={editForm.email}
                  onChange={(e) => updateEdit('email', e.target.value)}
                  error={editFormErrors.email}
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={closeEditModal} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={editFormBusy} className="btn btn-primary bg-[#047857] hover:bg-[#064e3b] disabled:opacity-60">
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
