import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useUI } from '../../../hooks/useUI.js'
import api from '../../../utils/api.js'
import { ROUTES } from '../../../utils/constants.js'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const { showToast } = useUI()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      await api.forgotPassword(email)
      setSubmitted(true)
      showToast('Reset link sent to your email!', 'success')
    } catch (err) {
      showToast(err.message || 'Failed to send reset link', 'error')
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

              {!submitted ? (
                <>
                  <div className="mt-6 mb-6">
                    <h1 className="font-primary text-4xl font-bold text-gray-900">Forgot Password?</h1>
                    <p className="mt-2 text-gray-600">
                      No worries! Enter your email and we&apos;ll send you a reset link.
                    </p>
                  </div>

                  <div className="mb-6 rounded-xl border border-primary-200 bg-primary-50 p-4 text-sm text-gray-700">
                    <div className="flex items-start gap-2">
                      <i className="material-icons-round text-[#047857] mt-0.5">info</i>
                      <p>
                        Enter the email associated with your account. The reset link will be valid for <strong>24 hours</strong>.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <label className="form-label" htmlFor="email">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <i className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">mail</i>
                        <input
                          id="email"
                          type="email"
                          className="form-input pl-12"
                          placeholder="Enter your registered email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <button type="submit" disabled={loading} className="btn btn-primary w-full py-3 bg-[#047857] hover:bg-[#064e3b]">
                      <i className="material-icons-round">send</i>
                      {loading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                  </form>

                  <div className="mt-6 text-center text-sm text-gray-600">
                    Remember your password?{' '}
                    <Link to={ROUTES.LOGIN} className="font-semibold text-[#047857] hover:text-[#065f46]">Sign In</Link>
                  </div>
                </>
              ) : (
                <div className="mt-10 text-center">
                  <div className="mx-auto h-20 w-20 rounded-full bg-primary-50 text-[#047857] flex items-center justify-center">
                    <i className="material-icons-round text-4xl">mark_email_read</i>
                  </div>
                  <h2 className="mt-5 font-primary text-3xl font-bold text-gray-900">Check Your Email</h2>
                  <p className="mt-3 text-gray-600 leading-relaxed">
                    We&apos;ve sent a password reset link to<br />
                    <span className="font-semibold text-gray-800">{email}</span>
                  </p>

                  <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-left text-sm text-gray-700">
                    <div className="flex items-start gap-2">
                      <i className="material-icons-round text-amber-600 mt-0.5">tips_and_updates</i>
                      <p>
                        Click the link in the email to reset your password. If you don&apos;t see it, check your spam folder.
                      </p>
                    </div>
                  </div>

                  <p className="mt-4 text-sm text-gray-600">
                    Didn&apos;t receive the email?{' '}
                    <button
                      type="button"
                      className="font-semibold text-[#047857] hover:text-[#065f46]"
                      onClick={async () => {
                        try {
                          await api.forgotPassword(email)
                          showToast('Reset link sent again', 'success')
                        } catch (err) {
                          showToast(err.message || 'Failed to resend reset link', 'error')
                        }
                      }}
                    >
                      Resend
                    </button>
                  </p>

                  <Link to={ROUTES.LOGIN} className="btn btn-secondary mt-6 border border-[#047857] text-[#047857]">
                    <i className="material-icons-round">arrow_back</i>
                    Back to Login
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
              <h2 className="font-primary text-3xl font-bold">Secure Password Recovery</h2>
              <p className="mt-4 max-w-md text-white/90 leading-relaxed">
                Your account security is our priority. We&apos;ll help you regain access to your account safely.
              </p>
              <div className="mt-6 h-1 w-14 rounded-full bg-[#d4af37]" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
