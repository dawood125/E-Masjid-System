import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useUI } from '../../../hooks/useUI.js'
import { ROUTES } from '../../../utils/constants.js'
import api from '../../../utils/api.js'

export default function ResetPassword() {
  const { token } = useParams()
  const navigate = useNavigate()
  const { showToast } = useUI()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    try {
      await api.resetPassword(token, password)
      setSuccess(true)
      showToast('Password reset successfully!', 'success')
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to reset password. The link may have expired.'
      setError(message)
      showToast(message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#f0fdf4] to-white py-20">
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23047857' fill-opacity='0.08'%3E%3Cpath d='M40 0l8 16 16 8-16 8-8 16-8-16-16-8 16-8z'/%3E%3C/g%3E%3C/svg%3E\")",
        }}
      />

      <div className="container relative z-10">
        <div className="mx-auto grid max-w-6xl overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl lg:grid-cols-2 animate-fade-in">
          <div className="px-6 py-10 sm:px-10 sm:py-12">
            <div className="mx-auto max-w-md">
              <Link to={ROUTES.LOGIN} className="inline-flex items-center gap-1 text-sm font-semibold text-[#047857] hover:text-[#065f46]">
                <i className="material-icons-round text-base">arrow_back</i>
                Back to Login
              </Link>

              {!success ? (
                <>
                  <div className="mt-6 mb-6">
                    <h1 className="font-primary text-4xl font-bold text-gray-900">Set New Password</h1>
                    <p className="mt-2 text-gray-600">
                      Enter your new password below. Make sure it&apos;s at least 6 characters.
                    </p>
                  </div>

                  <div className="mb-6 rounded-xl border border-primary-200 bg-primary-50 p-4 text-sm text-gray-700">
                    <div className="flex items-start gap-2">
                      <i className="material-icons-round text-[#047857] mt-0.5">info</i>
                      <p>
                        This reset link can only be used <strong>once</strong> and expires in <strong>24 hours</strong>. Choose a strong password you haven&apos;t used before.
                      </p>
                    </div>
                  </div>

                  {error && (
                    <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                      <div className="flex items-start gap-2">
                        <i className="material-icons-round text-red-500 mt-0.5">error</i>
                        <p>{error}</p>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <label className="form-label" htmlFor="new-password">
                        New Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <i className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">lock</i>
                        <input
                          id="new-password"
                          type={showPassword ? 'text' : 'password'}
                          className="form-input pl-12 pr-12"
                          placeholder="Enter new password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          minLength={6}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-gray-500 hover:text-[#047857]"
                          aria-label="Toggle password visibility"
                        >
                          <i className="material-icons-round">{showPassword ? 'visibility_off' : 'visibility'}</i>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="form-label" htmlFor="confirm-password">
                        Confirm Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <i className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">lock_clock</i>
                        <input
                          id="confirm-password"
                          type={showConfirm ? 'text' : 'password'}
                          className="form-input pl-12 pr-12"
                          placeholder="Confirm new password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          minLength={6}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm((prev) => !prev)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-gray-500 hover:text-[#047857]"
                          aria-label="Toggle password visibility"
                        >
                          <i className="material-icons-round">{showConfirm ? 'visibility_off' : 'visibility'}</i>
                        </button>
                      </div>
                      {confirmPassword && password !== confirmPassword && (
                        <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                          <i className="material-icons-round text-sm">warning</i>
                          Passwords do not match
                        </p>
                      )}
                    </div>

                    {/* Password Strength Indicator */}
                    {password && (
                      <div className="space-y-2">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4].map((level) => {
                            const strength = password.length >= 12 ? 4 : password.length >= 8 ? 3 : password.length >= 6 ? 2 : 1
                            return (
                              <div
                                key={level}
                                className={`h-1.5 flex-1 rounded-full transition-colors ${
                                  level <= strength
                                    ? strength <= 1 ? 'bg-red-400' : strength <= 2 ? 'bg-amber-400' : strength <= 3 ? 'bg-green-400' : 'bg-[#047857]'
                                    : 'bg-gray-200'
                                }`}
                              />
                            )
                          })}
                        </div>
                        <p className="text-xs text-gray-500">
                          {password.length < 6 ? 'Too short' : password.length < 8 ? 'Fair' : password.length < 12 ? 'Good' : 'Strong'}
                        </p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading || password !== confirmPassword || password.length < 6}
                      className="btn btn-primary w-full py-3 bg-[#047857] hover:bg-[#064e3b] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <i className="material-icons-round">lock_reset</i>
                      {loading ? 'Resetting...' : 'Reset Password'}
                    </button>
                  </form>
                </>
              ) : (
                <div className="mt-10 text-center">
                  <div className="mx-auto h-20 w-20 rounded-full bg-primary-50 text-[#047857] flex items-center justify-center">
                    <i className="material-icons-round text-4xl">check_circle</i>
                  </div>
                  <h2 className="mt-5 font-primary text-3xl font-bold text-gray-900">Password Reset!</h2>
                  <p className="mt-3 text-gray-600 leading-relaxed">
                    Your password has been changed successfully.<br />
                    You can now sign in with your new password.
                  </p>

                  <Link to={ROUTES.LOGIN} className="btn btn-primary mt-8 bg-[#047857] hover:bg-[#064e3b]">
                    <i className="material-icons-round">login</i>
                    Sign In Now
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="relative min-h-[420px] hidden lg:block">
            <img
              src="https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=1000"
              alt="Mosque architecture"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-[#064e3b]/90 to-[#047857]/80" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.24),transparent_65%)]" />
            <div className="relative z-10 h-full p-10 flex flex-col items-center justify-center text-center text-white">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-white/30 bg-white/20 backdrop-blur">
                <i className="material-icons-round text-4xl">lock_reset</i>
              </div>
              <h2 className="font-primary text-3xl font-bold">Create New Password</h2>
              <p className="mt-4 max-w-md text-white/90 leading-relaxed">
                Choose a strong password to keep your account secure. We recommend using a mix of letters, numbers, and symbols.
              </p>
              <div className="mt-6 h-1 w-14 rounded-full bg-[#d4af37]" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
