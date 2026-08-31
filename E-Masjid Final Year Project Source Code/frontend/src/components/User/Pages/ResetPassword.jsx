import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useUI } from '../../../hooks/useUI.js'
import api from '../../../utils/api.js'
import { ROUTES } from '../../../utils/constants.js'
import FormField from '../../Common/FormField.jsx'

const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d).{8,64}$/

function validate(form) {
  const errs = {}
  if (!form.password) errs.password = 'New password is required'
  else if (!PASSWORD_RULE.test(form.password))
    errs.password = 'Password must be 8-64 characters with at least one letter and one number'

  if (!form.confirmPassword) errs.confirmPassword = 'Please confirm your new password'
  else if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match'

  return errs
}

export default function ResetPassword() {
  const { token } = useParams()
  const navigate = useNavigate()
  const { showToast } = useUI()
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const update = (field, value) => {
    setFormData((p) => ({ ...p, [field]: value }))
    if (errors[field]) setErrors((p) => ({ ...p, [field]: null }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!token) {
      showToast('Invalid reset token.', 'error')
      return
    }

    const v = validate(formData)
    if (Object.keys(v).length > 0) {
      setErrors(v)
      const firstField = Object.keys(v)[0]
      const el = document.querySelector(`[name="${firstField}"]`)
      if (el && el.focus) el.focus()
      return
    }

    setLoading(true)
    try {
      await api.resetPassword(token, { password: formData.password, confirmPassword: formData.confirmPassword })
      setDone(true)
      showToast('Password reset successful. Please login.', 'success')
      setTimeout(() => navigate(ROUTES.LOGIN), 1200)
    } catch (err) {
      if (err.errors && Array.isArray(err.errors)) {
        const fieldErrors = {}
        err.errors.forEach((er) => {
          if (er.field) fieldErrors[er.field] = er.message
        })
        if (Object.keys(fieldErrors).length > 0) {
          setErrors(fieldErrors)
          showToast('Please fix the highlighted fields', 'error')
        } else {
          showToast(err.message || 'Failed to reset password.', 'error')
        }
      } else {
        showToast(err.message || 'Failed to reset password.', 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#f0fdf4] to-white py-20">
      <div className="container relative z-10">
        <div className="mx-auto max-w-xl rounded-3xl border border-gray-200 bg-white p-8 shadow-xl animate-fade-in-up">
          <Link to={ROUTES.LOGIN} className="inline-flex items-center gap-1 text-sm font-semibold text-[#047857] hover:text-[#065f46]">
            <i className="material-icons-round text-base">arrow_back</i>
            Back to Login
          </Link>

          <h1 className="mt-4 font-primary text-3xl font-bold text-gray-900">Reset Password</h1>
          <p className="mt-2 text-gray-600">Set a new password for your account.</p>

          {done ? (
            <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
              Password updated successfully. Redirecting to login...
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
              <FormField
                name="password"
                label="New Password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => update('password', e.target.value)}
                error={errors.password}
                hint="At least 8 characters with at least one letter and one number"
                autoComplete="new-password"
                showPasswordToggle
              />
              <FormField
                name="confirmPassword"
                label="Confirm Password"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) => update('confirmPassword', e.target.value)}
                error={errors.confirmPassword}
                autoComplete="new-password"
                showPasswordToggle
              />

              <button type="submit" disabled={loading} className="btn btn-primary w-full py-3 bg-[#047857] hover:bg-[#064e3b]">
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
