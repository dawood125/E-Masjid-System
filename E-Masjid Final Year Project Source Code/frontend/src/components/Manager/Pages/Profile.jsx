import { useEffect, useState } from 'react'
import { useAuth } from '../../../hooks/useAuth.js'
import { useUI } from '../../../hooks/useUI.js'
import api from '../../../utils/api.js'
import FormField from '../../Common/FormField.jsx'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d).{8,64}$/

function validateProfile(form, emailChanged) {
  const errs = {}
  if (!form.name.trim()) errs.name = 'Name is required'
  else if (form.name.trim().length < 2) errs.name = 'Name must be at least 2 characters'
  else if (form.name.trim().length > 80) errs.name = 'Name is too long'

  if (!form.email.trim()) errs.email = 'Email is required'
  else if (!EMAIL_RE.test(form.email.trim())) errs.email = 'Enter a valid email address'

  if (form.phone.trim() && (form.phone.trim().length < 7 || form.phone.trim().length > 20)) {
    errs.phone = 'Phone must be between 7 and 20 characters'
  }

  if (emailChanged && !form.currentPassword) errs.currentPassword = 'Enter your current password to change your email'
  return errs
}

function validatePassword(form) {
  const errs = {}
  if (!form.currentPassword) errs.currentPassword = 'Current password is required'
  if (!form.newPassword) errs.newPassword = 'New password is required'
  else if (!PASSWORD_RE.test(form.newPassword)) errs.newPassword = 'Use at least 8 characters with at least one letter and one number'
  else if (form.newPassword === form.currentPassword) errs.newPassword = 'New password must be different from the current password'
  if (form.confirmPassword !== form.newPassword) errs.confirmPassword = 'Passwords do not match'
  return errs
}

function fieldErrorsFrom(err) {
  const out = {}
  if (err.errors && Array.isArray(err.errors)) {
    err.errors.forEach((er) => { if (er.field) out[er.field] = er.message })
  }
  return out
}

export default function ManagerProfile() {
  const { user, updateUser } = useAuth()
  const { showToast } = useUI()
  const [mosqueCount, setMosqueCount] = useState(null)

  const [profileForm, setProfileForm] = useState({ name: '', email: '', phone: '', currentPassword: '' })
  const [profileErrors, setProfileErrors] = useState({})
  const [profileBusy, setProfileBusy] = useState(false)

  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [passwordErrors, setPasswordErrors] = useState({})
  const [passwordBusy, setPasswordBusy] = useState(false)

  useEffect(() => {
    setProfileForm({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      currentPassword: '',
    })
  }, [user?.name, user?.email, user?.phone])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await api.getSuperAdminMosques()
        if (mounted) setMosqueCount((res.data || []).length)
      } catch {
        if (mounted) setMosqueCount(null)
      }
    })()
    return () => { mounted = false }
  }, [])

  const emailChanged = profileForm.email.trim().toLowerCase() !== (user?.email || '').toLowerCase()

  const updateProfileField = (field, value) => {
    setProfileForm((p) => ({ ...p, [field]: value }))
    if (profileErrors[field]) setProfileErrors((p) => ({ ...p, [field]: null }))
  }

  const updatePasswordField = (field, value) => {
    setPasswordForm((p) => ({ ...p, [field]: value }))
    if (passwordErrors[field]) setPasswordErrors((p) => ({ ...p, [field]: null }))
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    const v = validateProfile(profileForm, emailChanged)
    if (Object.keys(v).length > 0) {
      setProfileErrors(v)
      return
    }
    setProfileErrors({})
    setProfileBusy(true)
    try {
      const payload = {
        name: profileForm.name.trim(),
        email: profileForm.email.trim(),
        phone: profileForm.phone.trim(),
      }
      if (emailChanged) payload.currentPassword = profileForm.currentPassword
      const res = await api.updateMyProfile(payload)
      updateUser({ name: res.user.name, email: res.user.email, phone: res.user.phone })
      setProfileForm((p) => ({ ...p, currentPassword: '' }))
      showToast('Profile updated successfully.', 'success')
    } catch (err) {
      const fieldErrors = fieldErrorsFrom(err)
      if (Object.keys(fieldErrors).length > 0) setProfileErrors(fieldErrors)
      showToast(err.message || 'Failed to update profile.', 'error')
    } finally {
      setProfileBusy(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    const v = validatePassword(passwordForm)
    if (Object.keys(v).length > 0) {
      setPasswordErrors(v)
      return
    }
    setPasswordErrors({})
    setPasswordBusy(true)
    try {
      await api.changeMyPassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      showToast('Password changed successfully.', 'success')
    } catch (err) {
      const fieldErrors = fieldErrorsFrom(err)
      if (Object.keys(fieldErrors).length > 0) setPasswordErrors(fieldErrors)
      else if (err.message && err.message.toLowerCase().includes('current password')) {
        setPasswordErrors({ currentPassword: err.message })
      }
      showToast(err.message || 'Failed to change password.', 'error')
    } finally {
      setPasswordBusy(false)
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="font-primary text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="mt-1 text-gray-500">View and update your manager account details</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm h-fit">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#d4af37]/20">
              <i className="material-icons-round text-4xl text-[#b7791f]">person</i>
            </div>
            <h2 className="mt-4 font-primary text-xl font-bold text-gray-900">{user?.name || 'Manager'}</h2>
            <span className="mt-2 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-[#047857]">Mosque Manager</span>
          </div>
          <div className="mt-6 space-y-3 border-t border-gray-100 pt-5 text-sm">
            <p className="flex items-center gap-2 text-gray-700">
              <i className="material-icons-round text-base text-gray-400">email</i>
              <span className="break-all">{user?.email}</span>
            </p>
            <p className="flex items-center gap-2 text-gray-700">
              <i className="material-icons-round text-base text-gray-400">phone</i>
              {user?.phone || 'No phone added'}
            </p>
            <p className="flex items-center gap-2 text-gray-700">
              <i className="material-icons-round text-base text-gray-400">mosque</i>
              {mosqueCount === null ? 'Masjids managed: —' : `Masjids managed: ${mosqueCount}`}
            </p>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <form onSubmit={handleProfileSubmit} noValidate className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="font-primary text-xl font-bold text-gray-900">Edit Profile</h2>
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                name="name"
                label="Full Name"
                icon="badge"
                required
                value={profileForm.name}
                onChange={(e) => updateProfileField('name', e.target.value)}
                error={profileErrors.name}
                placeholder="Your full name"
              />
              <FormField
                name="phone"
                label="Phone"
                type="tel"
                icon="phone"
                optional
                value={profileForm.phone}
                onChange={(e) => updateProfileField('phone', e.target.value)}
                error={profileErrors.phone}
                placeholder="0300-XXXXXXX"
              />
              <div className="md:col-span-2">
                <FormField
                  name="email"
                  label="Email"
                  type="email"
                  icon="email"
                  required
                  value={profileForm.email}
                  onChange={(e) => updateProfileField('email', e.target.value)}
                  error={profileErrors.email}
                  hint="You log in with this email and password reset links are sent to it."
                  autoComplete="email"
                />
              </div>
              {emailChanged && (
                <div className="md:col-span-2">
                  <FormField
                    name="currentPassword"
                    label="Current Password"
                    type="password"
                    icon="lock"
                    required
                    value={profileForm.currentPassword}
                    onChange={(e) => updateProfileField('currentPassword', e.target.value)}
                    error={profileErrors.currentPassword}
                    hint="Required to confirm an email change."
                    autoComplete="current-password"
                    showPasswordToggle
                  />
                </div>
              )}
            </div>
            <div className="mt-5 flex justify-end">
              <button type="submit" disabled={profileBusy} className="btn btn-primary bg-[#047857] hover:bg-[#064e3b] disabled:opacity-60">
                <i className="material-icons-round text-lg">save</i>
                {profileBusy ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>

          <form onSubmit={handlePasswordSubmit} noValidate className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="font-primary text-xl font-bold text-gray-900">Change Password</h2>
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <FormField
                  name="currentPassword"
                  label="Current Password"
                  type="password"
                  icon="lock"
                  required
                  value={passwordForm.currentPassword}
                  onChange={(e) => updatePasswordField('currentPassword', e.target.value)}
                  error={passwordErrors.currentPassword}
                  autoComplete="current-password"
                  showPasswordToggle
                />
              </div>
              <FormField
                name="newPassword"
                label="New Password"
                type="password"
                icon="lock_reset"
                required
                value={passwordForm.newPassword}
                onChange={(e) => updatePasswordField('newPassword', e.target.value)}
                error={passwordErrors.newPassword}
                hint="At least 8 characters with a letter and a number."
                autoComplete="new-password"
                showPasswordToggle
              />
              <FormField
                name="confirmPassword"
                label="Confirm New Password"
                type="password"
                icon="lock_reset"
                required
                value={passwordForm.confirmPassword}
                onChange={(e) => updatePasswordField('confirmPassword', e.target.value)}
                error={passwordErrors.confirmPassword}
                autoComplete="new-password"
                showPasswordToggle
              />
            </div>
            <div className="mt-5 flex justify-end">
              <button type="submit" disabled={passwordBusy} className="btn btn-primary bg-[#047857] hover:bg-[#064e3b] disabled:opacity-60">
                <i className="material-icons-round text-lg">key</i>
                {passwordBusy ? 'Updating…' : 'Change Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
