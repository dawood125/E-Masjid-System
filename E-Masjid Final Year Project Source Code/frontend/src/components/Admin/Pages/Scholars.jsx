import { useEffect, useState } from 'react'
import { useUI } from '../../../hooks/useUI.js'
import api from '../../../utils/api.js'
import { formatDate } from '../../../utils/formatters.js'

function randomCompletedCount(seedIndex) {
  return 8 + seedIndex * 7
}

function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text)
  }
  const el = document.createElement('textarea')
  el.value = text
  el.style.position = 'fixed'
  el.style.opacity = '0'
  document.body.appendChild(el)
  el.select()
  try { document.execCommand('copy') } catch (e) {}
  document.body.removeChild(el)
  return Promise.resolve()
}

export default function Scholars() {
  const { showToast } = useUI()

  const [scholars, setScholars] = useState([])
  const [assignments, setAssignments] = useState([])
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isResetModalOpen, setIsResetModalOpen] = useState(false)
  const [selectedScholar, setSelectedScholar] = useState(null)
  const [revealedPassword, setRevealedPassword] = useState(null)
  const [showAddPassword, setShowAddPassword] = useState(false)
  const [showResetPassword, setShowResetPassword] = useState(false)
  const [newScholar, setNewScholar] = useState({
    name: '',
    email: '',
    phone: '',
    specialization: '',
    password: '',
    confirmPassword: '',
  })
  const [editForm, setEditForm] = useState({ name: '', phone: '', specialization: '', email: '' })
  const [resetForm, setResetForm] = useState({ password: '', confirmPassword: '' })
  const [loading, setLoading] = useState(true)
  const [assigningId, setAssigningId] = useState(null)

  const loadScholars = async () => {
    const res = await api.getScholars()
    const list = Array.isArray(res.data) ? res.data : []
    return list.map((item) => ({ ...item, id: item._id || item.id, isActive: item.isActive }))
  }

  const loadAssignments = async () => {
    const res = await api.getNikahBookings()
    const list = Array.isArray(res.data) ? res.data : []
    return list
      .filter((b) => b.status === 'pending' && !b.scholarId)
      .map((item) => ({ ...item, id: item._id || item.id }))
  }

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const [scholarList, assignmentList] = await Promise.all([loadScholars(), loadAssignments()])
        if (!mounted) return
        setScholars(scholarList)
        setAssignments(assignmentList)
      } catch (err) {
        showToast(err.message || 'Failed to load scholars.', 'error')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [showToast])

  const activeCount = scholars.filter((scholar) => scholar.isActive).length

  const totalCompletedNikah = scholars.reduce((sum, _, index) => sum + randomCompletedCount(index), 0)

  const openEditScholar = (scholar) => {
    setSelectedScholar(scholar)
    setEditForm({
      name: scholar.name || '',
      email: scholar.email || '',
      phone: scholar.phone || '',
      specialization: scholar.specialization || '',
    })
    setIsEditModalOpen(true)
  }

  const openResetPassword = (scholar) => {
    setSelectedScholar(scholar)
    setResetForm({ password: '', confirmPassword: '' })
    setRevealedPassword(null)
    setIsResetModalOpen(true)
  }

  const submitAddScholar = async (event) => {
    event.preventDefault()

    if (newScholar.password.length < 6) {
      showToast('Password must be at least 6 characters.', 'warning')
      return
    }

    if (newScholar.password !== newScholar.confirmPassword) {
      showToast('Passwords do not match.', 'error')
      return
    }

    try {
      const res = await api.createScholar({
        name: newScholar.name,
        email: newScholar.email,
        phone: newScholar.phone,
        specialization: newScholar.specialization || 'Nikah Services',
        password: newScholar.password,
      })
      const created = { ...res.data, isActive: true }
      setScholars((prev) => [created, ...prev])
      setIsAddModalOpen(false)
      setNewScholar({
        name: '',
        email: '',
        phone: '',
        specialization: '',
        password: '',
        confirmPassword: '',
      })
      if (res.tempPassword) {
        showToast(`Scholar created. Login password: ${res.tempPassword}`, 'success')
      } else {
        showToast('Scholar account created successfully.', 'success')
      }
    } catch (err) {
      showToast(err.message || 'Failed to create scholar.', 'error')
    }
  }

  const submitEditScholar = async (event) => {
    event.preventDefault()
    if (!selectedScholar) return

    try {
      const res = await api.updateScholar(selectedScholar.id, {
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        specialization: editForm.specialization,
      })
      setScholars((prev) =>
        prev.map((item) => (item.id === selectedScholar.id ? { ...item, ...res.data, id: item.id } : item))
      )
      setIsEditModalOpen(false)
      setSelectedScholar(null)
      showToast(`${editForm.name} updated.`, 'success')
    } catch (err) {
      showToast(err.message || 'Failed to update scholar.', 'error')
    }
  }

  const submitResetPassword = async (event) => {
    event.preventDefault()

    if (resetForm.password.length < 6) {
      showToast('Password must be at least 6 characters.', 'warning')
      return
    }

    if (resetForm.password !== resetForm.confirmPassword) {
      showToast('Passwords do not match.', 'error')
      return
    }

    try {
      const res = await api.resetScholarPassword(selectedScholar.id, resetForm.password)
      setRevealedPassword(res.newPassword)
      setResetForm({ password: '', confirmPassword: '' })
      showToast(`Password reset for ${selectedScholar.name}. Share the new password with them.`, 'success')
    } catch (err) {
      showToast(err.message || 'Failed to reset password.', 'error')
    }
  }

  const assignScholar = async (bookingId, scholarId) => {
    if (!scholarId || assigningId === bookingId) return

    const scholar = scholars.find((item) => item.id === scholarId)
    if (!scholar || !scholar.isActive) {
      showToast('Scholar must be active before assigning.', 'warning')
      return
    }

    setAssigningId(bookingId)
    try {
      await api.assignNikahBooking(bookingId, scholarId)
      setAssignments((prev) => prev.filter((item) => item.id !== bookingId))
      showToast(`Booking NKH-${String(bookingId).slice(-6).toUpperCase()} assigned to ${scholar.name}.`, 'success')
    } catch (err) {
      showToast(err.message || 'Failed to assign scholar.', 'error')
    } finally {
      setAssigningId(null)
    }
  }

  const toggleActive = (scholar) => {
    ;(async () => {
      try {
        const next = !scholar.isActive
        const res = await api.updateScholar(scholar.id, { isActive: next })
        setScholars((prev) =>
          prev.map((item) => (item.id === scholar.id ? { ...item, ...res.data, id: item.id, isActive: next } : item))
        )
        showToast(
          next ? `${scholar.name} re-activated.` : `${scholar.name} marked inactive.`,
          'success'
        )
      } catch (err) {
        showToast(err.message || 'Failed to update scholar.', 'error')
      }
    })()
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-1 text-sm text-gray-500">
            <span>Admin</span>
            <i className="material-icons-round text-base">chevron_right</i>
            <span>Manage Scholars</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Religious Scholars</h1>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex w-fit items-center gap-2 rounded-lg bg-primary-700 px-4 py-2 text-sm font-semibold text-white transition-all duration-150 hover:bg-primary-800"
        >
          <i className="material-icons-round text-base">person_add</i>
          Add New Scholar
        </button>
      </div>

      <section className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
            <i className="material-icons-round">info</i>
          </div>
          <div>
            <h4 className="text-base font-bold text-blue-900">About Scholar Accounts</h4>
            <p className="mt-1 text-sm text-blue-800">
              Religious scholars handle Nikah bookings and can accept or reject assigned requests from their dashboard.
            </p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total Scholars</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{scholars.length}</p>
        </article>
        <article className="rounded-xl border border-emerald-200 bg-white p-4 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Active</p>
          <p className="mt-2 text-2xl font-bold text-emerald-700">{activeCount}</p>
        </article>
        <article className="rounded-xl border border-amber-200 bg-white p-4 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Inactive</p>
          <p className="mt-2 text-2xl font-bold text-amber-700">{scholars.length - activeCount}</p>
        </article>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="inline-flex items-center gap-2 text-lg font-bold text-gray-900">
            <i className="material-icons-round text-primary-700">people</i>
            Registered Scholars
          </h2>
          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
            {scholars.length} scholars
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          {!loading && scholars.map((scholar, index) => (
            <article key={scholar.id} className="flex h-full flex-col rounded-xl border border-gray-200 p-4 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md">
              <div className="mb-4 flex items-center justify-between">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary-100 text-primary-700">
                  <i className="material-icons-round">person</i>
                </div>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                    scholar.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {scholar.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="flex-1 space-y-3">
                <h3 className="text-lg font-bold text-gray-900">{scholar.name}</h3>
                <p className="inline-flex items-center gap-1 text-sm text-gray-600">
                  <i className="material-icons-round text-base">workspace_premium</i>
                  {scholar.specialization}
                </p>

                <div className="space-y-1.5 text-sm text-gray-600">
                  <p className="inline-flex items-center gap-1">
                    <i className="material-icons-round text-base">mail</i>
                    {scholar.email}
                  </p>
                  <p className="inline-flex items-center gap-1">
                    <i className="material-icons-round text-base">call</i>
                    {scholar.phone}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 rounded-lg bg-gray-50 p-3 text-center">
                  <div>
                    <p className="text-lg font-bold text-gray-900">{randomCompletedCount(index)}</p>
                    <p className="text-xs text-gray-500">Nikah Performed</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900">{index % 3}</p>
                    <p className="text-xs text-gray-500">Pending Requests</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-3">
                <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                  <i className="material-icons-round text-sm">calendar_today</i>
                  Joined 2025
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => openResetPassword(scholar)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-amber-200 text-amber-700 hover:bg-amber-50"
                    title="Reset password"
                  >
                    <i className="material-icons-round text-base">key</i>
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditScholar(scholar)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-600 hover:bg-gray-100"
                    title="Edit scholar"
                  >
                    <i className="material-icons-round text-base">edit</i>
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleActive(scholar)}
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-md border ${
                      scholar.isActive
                        ? 'border-red-200 text-red-600 hover:bg-red-50'
                        : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                    }`}
                    title={scholar.isActive ? 'Deactivate' : 'Activate'}
                  >
                    <i className="material-icons-round text-base">
                      {scholar.isActive ? 'delete' : 'check_circle'}
                    </i>
                  </button>
                </div>
              </div>
            </article>
          ))}

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex min-h-[270px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-4 text-center transition-all duration-150 hover:border-primary-400 hover:bg-primary-50"
          >
            <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-700">
              <i className="material-icons-round">person_add</i>
            </div>
            <h4 className="text-base font-bold text-gray-900">Add New Scholar</h4>
            <p className="mt-1 text-sm text-gray-600">Register a new scholar to handle Nikah ceremonies.</p>
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="inline-flex items-center gap-2 text-lg font-bold text-gray-900">
            <i className="material-icons-round text-primary-700">assignment</i>
            Pending Nikah Assignments
          </h2>
          <span className="rounded-full bg-warning-light px-2.5 py-1 text-xs font-semibold text-warning">
            {assignments.length} Unassigned
          </span>
        </div>

        <p className="mb-4 text-sm text-gray-600">These requests need scholar assignment.</p>

        <div className="space-y-3">
          {assignments.map((assignment) => (
            <article
              key={assignment.id}
              className="flex flex-col gap-3 rounded-lg border border-gray-200 p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-rose-100 text-rose-700">
                  <i className="material-icons-round">favorite</i>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">
                    Booking NKH-{String(assignment.id).slice(-6).toUpperCase()}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {assignment.groomName} & {assignment.brideName} - {formatDate(assignment.preferredDate)} at {assignment.preferredTime}
                  </p>
                </div>
              </div>

              <select
                defaultValue=""
                disabled={assigningId === assignment.id}
                onChange={(event) => assignScholar(assignment.id, event.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none disabled:opacity-60"
              >
                <option value="">{assigningId === assignment.id ? 'Assigning...' : 'Assign Scholar'}</option>
                {scholars.map((scholar) => (
                  <option key={scholar.id} value={scholar.id} disabled={!scholar.isActive}>
                    {scholar.name}{scholar.isActive ? '' : ' (inactive)'}
                  </option>
                ))}
              </select>
            </article>
          ))}

          {!assignments.length && (
            <div className="rounded-lg bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
              All pending bookings are assigned.
            </div>
          )}
        </div>
      </section>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h3 className="inline-flex items-center gap-2 text-lg font-bold text-gray-900">
                <i className="material-icons-round text-primary-700">person_add</i>
                Add New Scholar
              </h3>
              <button type="button" onClick={() => setIsAddModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <i className="material-icons-round">close</i>
              </button>
            </div>

            <form onSubmit={submitAddScholar} className="space-y-4 px-6 py-5">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-gray-700">Full Name *</span>
                <input
                  type="text"
                  required
                  value={newScholar.name}
                  onChange={(event) => setNewScholar((prev) => ({ ...prev, name: event.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-gray-700">Email *</span>
                <input
                  type="email"
                  required
                  value={newScholar.email}
                  onChange={(event) => setNewScholar((prev) => ({ ...prev, email: event.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-gray-700">Phone *</span>
                <input
                  type="tel"
                  required
                  value={newScholar.phone}
                  onChange={(event) => setNewScholar((prev) => ({ ...prev, phone: event.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-gray-700">Specialization</span>
                <input
                  type="text"
                  value={newScholar.specialization}
                  onChange={(event) => setNewScholar((prev) => ({ ...prev, specialization: event.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-gray-700">Initial Password *</span>
                <div className="relative">
                  <input
                    type={showAddPassword ? 'text' : 'password'}
                    minLength={6}
                    required
                    value={newScholar.password}
                    onChange={(event) => setNewScholar((prev) => ({ ...prev, password: event.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 focus:border-primary-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAddPassword((prev) => !prev)}
                    className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
                  >
                    <i className="material-icons-round text-base">{showAddPassword ? 'visibility_off' : 'visibility'}</i>
                  </button>
                </div>
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-gray-700">Confirm Password *</span>
                <input
                  type="password"
                  minLength={6}
                  required
                  value={newScholar.confirmPassword}
                  onChange={(event) => setNewScholar((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
                />
              </label>

              <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button type="submit" className="rounded-lg bg-primary-700 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-800">
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h3 className="inline-flex items-center gap-2 text-lg font-bold text-gray-900">
                <i className="material-icons-round text-primary-700">edit</i>
                Edit Scholar
              </h3>
              <button type="button" onClick={() => setIsEditModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <i className="material-icons-round">close</i>
              </button>
            </div>

            <form onSubmit={submitEditScholar} className="space-y-4 px-6 py-5">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-gray-700">Full Name *</span>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, name: event.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-gray-700">Email *</span>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, email: event.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-gray-700">Phone *</span>
                <input
                  type="tel"
                  required
                  value={editForm.phone}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, phone: event.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-gray-700">Specialization</span>
                <input
                  type="text"
                  value={editForm.specialization}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, specialization: event.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
                />
              </label>

              <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button type="submit" className="rounded-lg bg-primary-700 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-800">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h3 className="inline-flex items-center gap-2 text-lg font-bold text-gray-900">
                <i className="material-icons-round text-primary-700">key</i>
                Reset Password
              </h3>
              <button type="button" onClick={() => { setIsResetModalOpen(false); setRevealedPassword(null) }} className="text-gray-500 hover:text-gray-700">
                <i className="material-icons-round">close</i>
              </button>
            </div>

            <div className="space-y-4 px-6 py-5">
              <p className="text-sm text-gray-600">
                Reset password for <span className="font-semibold text-gray-900">{selectedScholar?.name}</span>
              </p>

              {!revealedPassword && (
                <form onSubmit={submitResetPassword} className="space-y-4">
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-gray-700">New Password *</span>
                    <div className="relative">
                      <input
                        type={showResetPassword ? 'text' : 'password'}
                        minLength={6}
                        required
                        value={resetForm.password}
                        onChange={(event) => setResetForm((prev) => ({ ...prev, password: event.target.value }))}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 focus:border-primary-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowResetPassword((prev) => !prev)}
                        className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
                      >
                        <i className="material-icons-round text-base">{showResetPassword ? 'visibility_off' : 'visibility'}</i>
                      </button>
                    </div>
                  </label>

                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-gray-700">Confirm New Password *</span>
                    <input
                      type="password"
                      minLength={6}
                      required
                      value={resetForm.confirmPassword}
                      onChange={(event) => setResetForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
                    />
                  </label>

                  <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
                    <button
                      type="button"
                      onClick={() => { setIsResetModalOpen(false); setRevealedPassword(null) }}
                      className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="rounded-lg bg-primary-700 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-800">
                      Reset Password
                    </button>
                  </div>
                </form>
              )}

              {revealedPassword && (
                <div className="space-y-4">
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                    <p className="text-sm font-semibold text-emerald-900">Password updated successfully</p>
                    <p className="mt-2 text-xs text-emerald-800">Share this new password with the scholar through a secure channel (in person, WhatsApp, etc.).</p>
                    <div className="mt-3 flex items-center gap-2">
                      <code className="flex-1 break-all rounded-md bg-white px-3 py-2 font-mono text-sm text-gray-900 ring-1 ring-emerald-200">
                        {revealedPassword}
                      </code>
                      <button
                        type="button"
                        onClick={async () => {
                          await copyToClipboard(revealedPassword)
                          showToast('Copied to clipboard.', 'success')
                        }}
                        className="inline-flex items-center gap-1 rounded-md bg-emerald-700 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-800"
                      >
                        <i className="material-icons-round text-sm">content_copy</i>
                        Copy
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
                    <button
                      type="button"
                      onClick={() => { setIsResetModalOpen(false); setRevealedPassword(null) }}
                      className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
