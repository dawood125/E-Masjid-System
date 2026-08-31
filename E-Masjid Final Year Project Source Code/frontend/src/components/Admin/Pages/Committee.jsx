import { useEffect, useState } from 'react'
import { useUI } from '../../../hooks/useUI.js'
import api from '../../../utils/api.js'
import FormField from '../../Common/FormField.jsx'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d).{6,64}$/

function randomPassword() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let out = ''
  for (let i = 0; i < 10; i += 1) {
    out += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return out
}

function validateCommittee(form) {
  const errs = {}
  if (!form.name.trim()) errs.name = 'Full name is required'
  else if (form.name.trim().length < 2) errs.name = 'Please enter the full name'
  if (!form.email.trim()) errs.email = 'Email is required'
  else if (!EMAIL_RE.test(form.email.trim())) errs.email = 'Enter a valid email address'
  if (form.phone && form.phone.trim().length < 7) errs.phone = 'Phone number looks too short'
  if (!form.password) errs.password = 'Password is required'
  else if (!PASSWORD_RULE.test(form.password)) errs.password = 'Password must be 6-64 characters with at least 1 letter and 1 number'
  if (!form.confirmPassword) errs.confirmPassword = 'Please confirm the password'
  else if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match'
  return errs
}

function validateReset(form) {
  const errs = {}
  if (!form.password) errs.password = 'New password is required'
  else if (!PASSWORD_RULE.test(form.password)) errs.password = 'Password must be 6-64 characters with at least 1 letter and 1 number'
  if (!form.confirmPassword) errs.confirmPassword = 'Please confirm the new password'
  else if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match'
  return errs
}

export default function AdminCommittee() {
  const [members, setMembers] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' })
  const [formErrors, setFormErrors] = useState({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [createdCredentials, setCreatedCredentials] = useState(null)
  const [resetTarget, setResetTarget] = useState(null)
  const [resetData, setResetData] = useState({ password: '', confirmPassword: '' })
  const [resetErrors, setResetErrors] = useState({})
  const [resetSubmitting, setResetSubmitting] = useState(false)
  const [resetResult, setResetResult] = useState(null)
  const [copied, setCopied] = useState(false)
  const { showToast } = useUI()

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await api.getCommitteeMembers()
        if (!mounted) return
        const list = Array.isArray(res.data) ? res.data : []
        setMembers(list.map((item) => ({ ...item, id: item._id || item.id, mosqueName: item.mosqueName || 'Current Mosque' })))
      } catch (err) {
        showToast(err.message || 'Failed to load committee members.', 'error')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [showToast])

  const update = (field, value) => {
    setFormData((p) => ({ ...p, [field]: value }))
    if (formErrors[field]) setFormErrors((p) => ({ ...p, [field]: null }))
  }

  const generateNewPassword = () => {
    const pwd = randomPassword()
    setFormData((p) => ({ ...p, password: pwd, confirmPassword: pwd }))
    setFormErrors((p) => ({ ...p, password: null, confirmPassword: null }))
  }

  const resetCreateForm = () => {
    setFormData({ name: '', email: '', phone: '', password: '', confirmPassword: '' })
    setFormErrors({})
    setShowForm(false)
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    const v = validateCommittee(formData)
    if (Object.keys(v).length > 0) {
      setFormErrors(v)
      const firstField = Object.keys(v)[0]
      const el = document.querySelector(`[name="${firstField}"]`)
      if (el && el.focus) el.focus()
      return
    }
    setSubmitting(true)
    try {
      const res = await api.createCommitteeMember({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        password: formData.password,
      })
      const created = {
        ...res.data,
        id: res.data._id || res.data.id,
        isActive: true,
        mosqueName: 'Current Mosque',
      }
      setMembers((prev) => [created, ...prev])
      setCreatedCredentials({
        name: created.name,
        email: created.email,
        password: res.password,
      })
      resetCreateForm()
    } catch (err) {
      if (err.errors && Array.isArray(err.errors)) {
        const fieldErrors = {}
        err.errors.forEach((er) => { if (er.field) fieldErrors[er.field] = er.message })
        if (Object.keys(fieldErrors).length > 0) {
          setFormErrors(fieldErrors)
          showToast('Please fix the highlighted fields', 'error')
        } else {
          showToast(err.message || 'Failed to create committee member.', 'error')
        }
      } else {
        showToast(err.message || 'Failed to create committee member.', 'error')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleCopy = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      showToast(`${label} copied to clipboard`, 'success')
      setTimeout(() => setCopied(false), 2000)
    } catch (e) {
      showToast('Could not copy. Select the text manually.', 'warning')
    }
  }

  const toggleActive = async (id) => {
    const current = members.find((member) => member.id === id)
    if (!current) return
    try {
      const res = await api.updateCommitteeMember(id, { isActive: !current.isActive })
      setMembers((prev) =>
        prev.map((member) =>
          member.id === id ? { ...member, ...res.data, id: member.id, mosqueName: member.mosqueName } : member
        )
      )
      showToast('Status updated', 'success')
    } catch (err) {
      showToast(err.message || 'Failed to update status.', 'error')
    }
  }

  const deleteMember = async (id) => {
    setDeletingId(id)
    try {
      await api.deleteCommitteeMember(id)
      setMembers((prev) => prev.filter((member) => member.id !== id))
      showToast('Committee member removed', 'info')
      setConfirmDelete(null)
    } catch (err) {
      showToast(err.message || 'Failed to remove committee member.', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  const openReset = (member) => {
    setResetTarget(member)
    setResetData({ password: randomPassword(), confirmPassword: '' })
    setResetErrors({})
    setResetResult(null)
  }

  const closeReset = () => {
    setResetTarget(null)
    setResetData({ password: '', confirmPassword: '' })
    setResetErrors({})
    setResetResult(null)
  }

  const updateReset = (field, value) => {
    setResetData((p) => ({ ...p, [field]: value }))
    if (resetErrors[field]) setResetErrors((p) => ({ ...p, [field]: null }))
  }

  const handleResetSubmit = async (e) => {
    e?.preventDefault()
    if (!resetTarget) return
    const v = validateReset(resetData)
    if (Object.keys(v).length > 0) {
      setResetErrors(v)
      const firstField = Object.keys(v)[0]
      const el = document.querySelector(`[name="reset-${firstField}"]`)
      if (el && el.focus) el.focus()
      return
    }
    setResetSubmitting(true)
    try {
      const res = await api.resetCommitteeMemberPassword(resetTarget.id, resetData.password)
      setResetResult({ password: res.password })
      showToast('Password updated successfully. Please share the new credentials with the member.', 'success')
    } catch (err) {
      if (err.errors && Array.isArray(err.errors)) {
        const fieldErrors = {}
        err.errors.forEach((er) => { if (er.field) fieldErrors[er.field] = er.message })
        if (Object.keys(fieldErrors).length > 0) setResetErrors(fieldErrors)
      }
      showToast(err.message || 'Failed to reset password.', 'error')
    } finally {
      setResetSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-primary text-3xl font-bold text-gray-900">Committee Members</h1>
          <p className="mt-1 text-gray-500">Manage Zakat/Sadaqah fund review committee</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary bg-[#047857] hover:bg-[#064e3b]">
          <i className="material-icons-round text-lg">{showForm ? 'close' : 'person_add'}</i>
          {showForm ? 'Cancel' : 'Add Member'}
        </button>
      </div>

      {createdCredentials && !showForm && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-5 animate-fade-in-up">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <i className="material-icons-round text-green-700">check_circle</i>
                <h3 className="font-primary text-lg font-bold text-green-900">Member created — share these credentials</h3>
              </div>
              <p className="mt-1 text-sm text-green-800">
                Please share these credentials with the new committee member through a secure channel
                before closing this notification.
              </p>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-lg border border-green-200 bg-white p-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Name</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900 break-all">{createdCredentials.name}</p>
                </div>
                <div className="rounded-lg border border-green-200 bg-white p-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Email (login)</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900 break-all">{createdCredentials.email}</p>
                </div>
                <div className="rounded-lg border border-green-200 bg-white p-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Password</p>
                  <div className="mt-1 flex items-center gap-2">
                    <code className="flex-1 break-all rounded bg-gray-900 px-2 py-1 text-sm font-mono text-green-300">{createdCredentials.password}</code>
                    <button
                      type="button"
                      onClick={() => handleCopy(createdCredentials.password, 'Password')}
                      className="shrink-0 rounded p-1 text-gray-500 hover:bg-gray-100"
                      title="Copy password"
                    >
                      <i className="material-icons-round text-base">{copied ? 'check' : 'content_copy'}</i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setCreatedCredentials(null)}
              className="rounded p-1 text-green-700 hover:bg-green-100"
              title="Dismiss"
            >
              <i className="material-icons-round">close</i>
            </button>
          </div>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleCreate} noValidate className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm animate-fade-in-up">
          <h2 className="font-primary text-xl font-bold text-gray-900 mb-5">Add Committee Member</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <FormField
              name="name"
              label="Full Name"
              icon="person"
              required
              value={formData.name}
              onChange={(e) => update('name', e.target.value)}
              error={formErrors.name}
              placeholder="Full name"
            />
            <FormField
              name="email"
              label="Email"
              type="email"
              icon="email"
              required
              value={formData.email}
              onChange={(e) => update('email', e.target.value)}
              error={formErrors.email}
              placeholder="email@example.com"
            />
            <FormField
              name="phone"
              label="Phone"
              type="tel"
              icon="phone"
              optional
              value={formData.phone}
              onChange={(e) => update('phone', e.target.value)}
              error={formErrors.phone}
              placeholder="03XX-XXXXXXX"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <FormField
              name="password"
              label="Password"
              type="password"
              icon="lock"
              required
              value={formData.password}
              onChange={(e) => update('password', e.target.value)}
              error={formErrors.password}
              placeholder="Set a password for the member"
              showPasswordToggle
              autoComplete="new-password"
              hint="6-64 chars, at least 1 letter and 1 number"
            />
            <FormField
              name="confirmPassword"
              label="Confirm Password"
              type="password"
              icon="lock"
              required
              value={formData.confirmPassword}
              onChange={(e) => update('confirmPassword', e.target.value)}
              error={formErrors.confirmPassword}
              placeholder="Re-enter the password"
              showPasswordToggle
              autoComplete="new-password"
            />
          </div>

          <div className="flex items-center gap-3 mb-4">
            <button
              type="button"
              onClick={generateNewPassword}
              className="text-sm font-semibold text-[#047857] hover:text-[#064e3b] hover:underline"
            >
              <i className="material-icons-round align-middle text-base">autorenew</i> Generate a strong password
            </button>
            <span className="text-xs text-gray-500">
              The password must be shared with the committee member directly.
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button type="submit" disabled={submitting} className="btn btn-primary bg-[#047857] hover:bg-[#064e3b] disabled:opacity-50">
              <i className="material-icons-round text-lg">check</i>
              {submitting ? 'Creating...' : 'Create Member'}
            </button>
            <button type="button" onClick={resetCreateForm} className="btn btn-secondary">Cancel</button>
          </div>
        </form>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-5 py-3.5 text-left font-semibold text-gray-600">Name</th>
                <th className="px-5 py-3.5 text-left font-semibold text-gray-600">Email</th>
                <th className="px-5 py-3.5 text-left font-semibold text-gray-600">Phone</th>
                <th className="px-5 py-3.5 text-left font-semibold text-gray-600">Mosque</th>
                <th className="px-5 py-3.5 text-center font-semibold text-gray-600">Status</th>
                <th className="px-5 py-3.5 text-center font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!loading && members.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-gray-500">No committee members found.</td>
                </tr>
              )}
              {members.map((member) => (
                <tr key={member.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary-100 flex items-center justify-center text-[#047857] font-semibold text-sm">
                        {member.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                      </div>
                      <span className="font-medium text-gray-900">{member.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-600">{member.email}</td>
                  <td className="px-5 py-4 text-gray-600">{member.phone || '—'}</td>
                  <td className="px-5 py-4 text-gray-600">{member.mosqueName}</td>
                  <td className="px-5 py-4 text-center">
                    <button onClick={() => toggleActive(member.id)} className={`rounded-full px-3 py-1 text-xs font-semibold ${member.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {member.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={() => openReset(member)}
                        title="Reset password"
                        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-[#047857] transition-colors"
                      >
                        <i className="material-icons-round text-lg">lock_reset</i>
                      </button>
                      <button
                        onClick={() => setConfirmDelete(member)}
                        title="Remove member"
                        className="rounded-lg p-2 text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <i className="material-icons-round text-lg">delete</i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h3 className="inline-flex items-center gap-2 text-lg font-bold text-red-700">
                <i className="material-icons-round">delete</i>
                Remove Committee Member
              </h3>
              <button type="button" onClick={() => setConfirmDelete(null)} className="text-gray-500 hover:text-gray-700">
                <i className="material-icons-round">close</i>
              </button>
            </div>
            <div className="space-y-4 px-6 py-5">
              <p className="text-sm text-gray-700">
                Are you sure you want to remove <strong className="text-gray-900">{confirmDelete.name}</strong> from the committee?
                They will lose access to the committee panel immediately.
              </p>
              <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(null)}
                  disabled={deletingId === confirmDelete.id}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => deleteMember(confirmDelete.id)}
                  disabled={deletingId === confirmDelete.id}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {deletingId === confirmDelete.id ? 'Removing...' : 'Remove Member'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {resetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 animate-fade-in">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h3 className="inline-flex items-center gap-2 text-lg font-bold text-gray-900">
                <i className="material-icons-round text-[#047857]">lock_reset</i>
                Reset Password
              </h3>
              <button type="button" onClick={closeReset} className="text-gray-500 hover:text-gray-700">
                <i className="material-icons-round">close</i>
              </button>
            </div>

            <form onSubmit={handleResetSubmit} noValidate className="space-y-4 px-6 py-5">
              <p className="text-sm text-gray-600">
                Set a new password for <strong className="text-gray-900">{resetTarget.name}</strong>.
                The new password will be returned so you can share it.
              </p>

              {resetResult ? (
                <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                  <div className="flex items-center gap-2">
                    <i className="material-icons-round text-green-700">check_circle</i>
                    <p className="text-sm font-semibold text-green-900">Password updated</p>
                  </div>
                  <div className="mt-3 rounded-lg border border-green-200 bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">New Password</p>
                    <div className="mt-1 flex items-center gap-2">
                      <code className="flex-1 break-all rounded bg-gray-900 px-2 py-1 text-sm font-mono text-green-300">{resetResult.password}</code>
                      <button
                        type="button"
                        onClick={() => handleCopy(resetResult.password, 'New password')}
                        className="shrink-0 rounded p-1 text-gray-500 hover:bg-gray-100"
                        title="Copy password"
                      >
                        <i className="material-icons-round text-base">{copied ? 'check' : 'content_copy'}</i>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <FormField
                    name="reset-password"
                    label="New Password"
                    type="password"
                    icon="lock"
                    required
                    value={resetData.password}
                    onChange={(e) => updateReset('password', e.target.value)}
                    error={resetErrors.password}
                    placeholder="Set a new password"
                    showPasswordToggle
                    autoComplete="new-password"
                  />
                  <FormField
                    name="reset-confirmPassword"
                    label="Confirm New Password"
                    type="password"
                    icon="lock"
                    required
                    value={resetData.confirmPassword}
                    onChange={(e) => updateReset('confirmPassword', e.target.value)}
                    error={resetErrors.confirmPassword}
                    placeholder="Re-enter the new password"
                    showPasswordToggle
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const pwd = randomPassword()
                      setResetData((p) => ({ ...p, password: pwd, confirmPassword: pwd }))
                      setResetErrors((p) => ({ ...p, password: null, confirmPassword: null }))
                    }}
                    className="text-sm font-semibold text-[#047857] hover:text-[#064e3b] hover:underline"
                  >
                    <i className="material-icons-round align-middle text-base">autorenew</i> Generate a strong password
                  </button>
                </>
              )}

              <div className="flex justify-end gap-2 border-t border-gray-200 pt-4">
                <button
                  type="button"
                  onClick={closeReset}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
                >
                  {resetResult ? 'Close' : 'Cancel'}
                </button>
                {!resetResult && (
                  <button
                    type="submit"
                    disabled={resetSubmitting}
                    className="rounded-lg bg-[#047857] px-4 py-2 text-sm font-semibold text-white hover:bg-[#064e3b] disabled:opacity-50"
                  >
                    {resetSubmitting ? 'Resetting...' : 'Reset Password'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
