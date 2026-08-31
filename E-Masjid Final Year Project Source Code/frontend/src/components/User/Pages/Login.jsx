import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../../hooks/useAuth.js'
import { useUI } from '../../../hooks/useUI.js'
import { useForceLogoutOnMount } from '../../../hooks/useForceLogoutOnMount.js'
import { ROUTES } from '../../../utils/constants.js'
import FormField from '../../Common/FormField.jsx'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateLogin(form) {
  const errs = {}
  if (!form.email.trim()) errs.email = 'Email is required'
  else if (!EMAIL_RE.test(form.email.trim())) errs.email = 'Enter a valid email address'

  if (!form.password) errs.password = 'Password is required'
  return errs
}

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '', role: 'community', remember: false })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const { showToast } = useUI()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  useForceLogoutOnMount()

  useEffect(() => {
    const notice = sessionStorage.getItem('logoutNotice')
    if (notice) {
      sessionStorage.removeItem('logoutNotice')
      showToast(notice, 'error')
    }
  }, [showToast])

  const update = (field, value) => {
    setFormData((p) => ({ ...p, [field]: value }))
    if (errors[field]) setErrors((p) => ({ ...p, [field]: null }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const v = validateLogin(formData)
    if (Object.keys(v).length > 0) {
      setErrors(v)
      const firstField = Object.keys(v)[0]
      const el = document.querySelector(`[name="${firstField}"]`)
      if (el && el.focus) el.focus()
      return
    }
    setLoading(true)

    try {
      await login(formData.email.trim(), formData.password, formData.role)
      showToast('Successfully logged in!', 'success')

      const returnUrl = searchParams.get('returnUrl')
      if (returnUrl && returnUrl.startsWith('/') && !returnUrl.startsWith('//')) {
        navigate(returnUrl)
      } else if (formData.role === 'scholar') {
        navigate(ROUTES.SCHOLAR)
      } else {
        navigate(ROUTES.HOME)
      }
    } catch (err) {
      showToast(err.message || 'Login failed. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#f0fdf4] to-[#ffffff] py-20">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23047857' fill-opacity='0.08'%3E%3Cpath d='M40 40c0-8.8-7.2-16-16-16v-8c13.3 0 24 10.7 24 24h-8zm16 0c0-17.7-14.3-32-32-32V0c22.1 0 40 17.9 40 40h-8z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        }}
      />

      <div className="container relative z-10">
        <div className="mx-auto grid max-w-6xl overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl lg:grid-cols-2 animate-fade-in">
          <div className="px-6 py-10 sm:px-10 sm:py-12">
            <div className="max-w-md mx-auto">
              <div className="mb-8 text-center lg:text-left">
                <h1 className="font-primary text-4xl font-bold text-gray-900">Welcome Back!</h1>
                <p className="mt-2 text-gray-600">Sign in to access your E-Masjid account</p>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit} noValidate>
                <FormField
                  name="email"
                  label="Email Address"
                  type="email"
                  icon="mail"
                  required
                  value={formData.email}
                  onChange={(e) => update('email', e.target.value)}
                  error={errors.email}
                  placeholder="Enter your email"
                  autoComplete="email"
                />
                <FormField
                  name="password"
                  label="Password"
                  type="password"
                  icon="lock"
                  required
                  value={formData.password}
                  onChange={(e) => update('password', e.target.value)}
                  error={errors.password}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  showPasswordToggle
                />

                <div className="flex items-center justify-between gap-2 text-sm">
                  <FormField
                    name="remember"
                    type="checkbox"
                    value={formData.remember}
                    onChange={(e) => update('remember', e.target.checked)}
                    label="Remember me"
                  />
                  <Link to={ROUTES.FORGOT_PASSWORD} className="font-medium text-[#047857] hover:text-[#065f46]">
                    Forgot Password?
                  </Link>
                </div>

                <FormField
                  name="role"
                  label="Portal Access"
                  type="select"
                  icon="badge"
                  value={formData.role}
                  onChange={(e) => update('role', e.target.value)}
                >
                  <option value="community">Community Member</option>
                  <option value="scholar">Religious Scholar</option>
                </FormField>
                <p className="-mt-3 text-xs text-gray-500">
                  Mosque admin?{' '}
                  <Link to={ROUTES.ADMIN_LOGIN} className="font-semibold text-[#047857] hover:text-[#065f46]">
                    Use dedicated admin login
                  </Link>
                </p>

                <button type="submit" disabled={loading} className="btn btn-primary w-full py-3 text-base bg-[#047857] hover:bg-[#064e3b]">
                  <i className="material-icons-round">login</i>
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>

              <div className="mt-7 text-center text-gray-600">
                Don&apos;t have an account?{' '}
                <Link to={ROUTES.REGISTER} className="font-semibold text-[#047857] hover:text-[#065f46]">
                  Create Account
                </Link>
              </div>
            </div>
          </div>

          <div className="relative min-h-[420px] hidden lg:block">
            <img
              src="https://images.unsplash.com/photo-1585036156171-384164a8c675?w=1000"
              alt="Mosque interior"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-[#064e3b]/90 to-[#047857]/80" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.25),transparent_65%)]" />
            <div className="relative z-10 h-full p-10 flex flex-col items-center justify-center text-center text-white">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-white/30 bg-white/20 backdrop-blur">
                <i className="material-icons-round text-4xl">mosque</i>
              </div>
              <h2 className="font-primary text-3xl font-bold">Your Spiritual Hub Awaits</h2>
              <p className="mt-4 max-w-md text-white/90 leading-relaxed">
                The mosques of Allah are only to be maintained by those who believe in Allah and the Last Day and establish prayer.
              </p>
              <div className="mt-6 h-1 w-14 rounded-full bg-[#d4af37]" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
