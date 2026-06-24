import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useUI } from '../../../hooks/useUI.js'
import api from '../../../utils/api.js'
import { ROUTES } from '../../../utils/constants.js'

export default function ResetPassword() {
  const { token } = useParams()
  const navigate = useNavigate()
  const { showToast } = useUI()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d).{8,64}$/

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!PASSWORD_RULE.test(password)) {
      showToast('Password must be at least 8 characters and include at least one letter and one number.', 'warning')
      return
    }
    if (password !== confirmPassword) {
      showToast('Passwords do not match.', 'warning')
      return
    }
    if (!token) {
      showToast('Invalid reset token.', 'error')
      return
    }

    setLoading(true)
    try {
      await api.resetPassword(token, { password, confirmPassword })
      setDone(true)
      showToast('Password reset successful. Please login.', 'success')
      setTimeout(() => navigate(ROUTES.LOGIN), 1200)
    } catch (err) {
      showToast(err.message || 'Failed to reset password.', 'error')
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
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="form-label" htmlFor="password">New Password</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className="form-input pr-12"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    aria-label="Toggle password visibility"
                  >
                    <i className="material-icons-round text-base">{showPassword ? 'visibility_off' : 'visibility'}</i>
                  </button>
                </div>
              </div>

              <div>
                <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

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
