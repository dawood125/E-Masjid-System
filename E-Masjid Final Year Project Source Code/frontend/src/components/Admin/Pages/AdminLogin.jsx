import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../hooks/useAuth.js'
import { useUI } from '../../../hooks/useUI.js'
import { ROUTES } from '../../../utils/constants.js'

export default function AdminLogin() {
  const { isAuthenticated, user, login } = useAuth()
  const { showToast } = useUI()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      navigate(ROUTES.ADMIN, { replace: true })
    }
  }, [isAuthenticated, user, navigate])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 500))
      await login(formData.email, formData.password, 'admin')
      showToast('Admin logged in successfully.', 'success')
      navigate(ROUTES.ADMIN)
    } catch (err) {
      showToast(err.message || 'Admin login failed. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#f3faf7] via-white to-[#eef8f3] py-16">
      <div
        className="pointer-events-none absolute inset-0 opacity-35"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='90' height='90' viewBox='0 0 90 90' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none'%3E%3Cg fill='%23047857' fill-opacity='0.09'%3E%3Cpath d='M45 0l10 20 20 10-20 10-10 20-10-20-20-10 20-10z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        }}
      />

      <div className="container relative z-10">
        <div className="mx-auto grid max-w-6xl overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl lg:grid-cols-2 animate-fade-in">
          <div className="relative hidden min-h-[420px] lg:block">
            <img
              src="https://images.unsplash.com/photo-1466442929976-97f336a657be?w=1200"
              alt="Mosque dome architecture"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-[#053c2f]/90 to-[#047857]/80" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.22),transparent_65%)]" />

            <div className="relative z-10 flex h-full flex-col items-center justify-center px-10 text-center text-white">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-white/30 bg-white/20 backdrop-blur">
                <i className="material-icons-round text-4xl">admin_panel_settings</i>
              </div>
              <h2 className="font-primary text-3xl font-bold">E-Masjid Admin Portal</h2>
              <p className="mt-4 max-w-md leading-relaxed text-white/90">
                Manage donations, prayer times, events, announcements, and scholar assignments from one secure dashboard.
              </p>
              <div className="mt-6 h-1 w-14 rounded-full bg-[#d4af37]" />
            </div>
          </div>

          <div className="px-6 py-10 sm:px-10 sm:py-12">
            <div className="mx-auto max-w-md">
              <Link
                to={ROUTES.LOGIN}
                className="inline-flex items-center gap-1 text-sm font-semibold text-[#047857] hover:text-[#065f46]"
              >
                <i className="material-icons-round text-base">arrow_back</i>
                Back to Community Login
              </Link>

              <div className="mb-7 mt-6">
                <h1 className="font-primary text-4xl font-bold text-gray-900">Admin Login</h1>
                <p className="mt-2 text-gray-600">Authorized mosque administration access only.</p>
              </div>

              <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <div className="flex items-start gap-2">
                  <i className="material-icons-round mt-0.5 text-amber-600">security</i>
                  <p>
                    This portal is reserved for mosque administration and committee members.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="form-label" htmlFor="admin-email">
                    Admin Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <i className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">mail</i>
                    <input
                      id="admin-email"
                      type="email"
                      className="form-input pl-12"
                      placeholder="Enter admin email"
                      value={formData.email}
                      onChange={(event) => setFormData((prev) => ({ ...prev, email: event.target.value }))}
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label" htmlFor="admin-password">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <i className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">lock</i>
                    <input
                      id="admin-password"
                      type={showPassword ? 'text' : 'password'}
                      className="form-input pl-12 pr-12"
                      placeholder="Enter admin password"
                      value={formData.password}
                      onChange={(event) => setFormData((prev) => ({ ...prev, password: event.target.value }))}
                      autoComplete="current-password"
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

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary w-full bg-[#047857] py-3 text-base hover:bg-[#064e3b]"
                >
                  <i className="material-icons-round">login</i>
                  {loading ? 'Signing in...' : 'Sign In to Admin Panel'}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-gray-600">
                Scholar or community member?{' '}
                <Link to={ROUTES.LOGIN} className="font-semibold text-[#047857] hover:text-[#065f46]">
                  Use standard login
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
