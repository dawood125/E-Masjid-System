import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../hooks/useAuth.js'
import { useUI } from '../../../hooks/useUI.js'
import { ROUTES } from '../../../utils/constants.js'

export default function Register() {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '', terms: false })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const {register} = useAuth()
  const { showToast } = useUI()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      showToast('Passwords do not match', 'error')
      return
    }

    if (!formData.terms) {
      showToast('Please accept terms and privacy policy', 'warning')
      return
    }

    setLoading(true)

    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      
      register(formData.email, formData.password, formData.name)
      showToast('Account created successfully!', 'success')
      navigate(ROUTES.HOME)
    } catch (error) {
      showToast('Registration failed. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const passwordScore = Math.min(
    4,
    Number(formData.password.length >= 6) +
      Number(/[A-Z]/.test(formData.password)) +
      Number(/[0-9]/.test(formData.password)) +
      Number(/[^A-Za-z0-9]/.test(formData.password))
  )

  return (
    <section className="min-h-screen bg-gradient-to-br from-[#f0fdf4] via-white to-[#ecfdf5] py-16">
      <div className="container">
        <div className="mx-auto grid max-w-7xl overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl lg:grid-cols-2 animate-fade-in">
          <div className="relative bg-gradient-to-br from-[#064e3b] to-[#047857] p-8 sm:p-10 text-white">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em]">
              <i className="material-icons-round text-base">verified</i>
              Official Community Portal
            </div>

            <h1 className="mt-6 font-primary text-4xl font-bold leading-tight">
              Join Our Growing <span className="text-[#d4af37]">Community</span>
            </h1>
            <p className="mt-4 text-white/90 leading-relaxed">
              Create an account to manage your donations, book Nikah services, register for events, and stay updated with prayer times and announcements.
            </p>

            <div className="mt-8 space-y-4">
              {[
                {
                  icon: 'volunteer_activism',
                  title: 'Easy Donations',
                  desc: 'Track and manage your contributions with full transparency.',
                },
                {
                  icon: 'favorite',
                  title: 'Nikah Booking',
                  desc: 'Book religious scholar for marriage ceremonies online.',
                },
                {
                  icon: 'event',
                  title: 'Event Registration',
                  desc: 'Register for mosque events and programs easily.',
                },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-3 rounded-xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                  <div className="mt-1 h-10 w-10 shrink-0 rounded-lg bg-[#d4af37] text-gray-900 flex items-center justify-center">
                    <i className="material-icons-round">{item.icon}</i>
                  </div>
                  <div>
                    <h3 className="font-primary text-lg font-semibold">{item.title}</h3>
                    <p className="text-white/85 text-sm">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 overflow-hidden rounded-2xl border border-white/20 bg-black/10">
              <img
                src="https://images.unsplash.com/photo-1585036156171-384164a8c675?w=900"
                alt="Masjid Al-Noor Interior"
                className="h-44 w-full object-cover"
              />
              <div className="px-4 py-3 text-sm text-white/90">Masjid Al-Noor, Sheikhupura</div>
            </div>
          </div>

          <div className="p-8 sm:p-10">
            <div className="mx-auto max-w-lg">
              <div className="mb-8">
                <h2 className="font-primary text-3xl font-bold text-gray-900">Create Your Account</h2>
                <p className="mt-2 text-gray-600">Please fill in your details to register</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="form-label" htmlFor="name">Full Name <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <i className="material-icons-round pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">person</i>
                    <input
                      id="name"
                      type="text"
                      className="form-input pl-12"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      autoComplete="name"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label" htmlFor="email">Email Address <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <i className="material-icons-round pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">mail</i>
                    <input
                      id="email"
                      type="email"
                      className="form-input pl-12"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label" htmlFor="phone">Phone Number <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <i className="material-icons-round pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">phone</i>
                    <input
                      id="phone"
                      type="tel"
                      className="form-input pl-12"
                      placeholder="03XX-XXXXXXX"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      autoComplete="tel"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label" htmlFor="password">Password <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <i className="material-icons-round pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">lock</i>
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        className="form-input pl-12 pr-12"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        autoComplete="new-password"
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
                    <div className="mt-3 grid grid-cols-4 gap-1.5">
                      {[1, 2, 3, 4].map((bar) => (
                        <div
                          key={bar}
                          className={`h-1.5 rounded-full ${bar <= passwordScore ? 'bg-[#047857]' : 'bg-gray-200'}`}
                        />
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-gray-500 inline-flex items-center gap-1">
                      <i className="material-icons-round text-sm">info</i>
                      At least 6 characters
                    </p>
                  </div>

                  <div>
                    <label className="form-label" htmlFor="confirmPassword">Confirm Password <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <i className="material-icons-round pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">lock</i>
                      <input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        className="form-input pl-12 pr-12"
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        autoComplete="new-password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-gray-500 hover:text-[#047857]"
                        aria-label="Toggle confirm password visibility"
                      >
                        <i className="material-icons-round">{showConfirmPassword ? 'visibility_off' : 'visibility'}</i>
                      </button>
                    </div>
                  </div>
                </div>

                <label className="flex items-start gap-3 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={formData.terms}
                    onChange={(e) => setFormData({ ...formData, terms: e.target.checked })}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-[#047857] focus:ring-[#047857]"
                  />
                  <span>
                    I agree to the <a href="#" className="text-[#047857] hover:underline">Terms & Conditions</a> and <a href="#" className="text-[#047857] hover:underline">Privacy Policy</a> of Masjid Al-Noor E-Masjid System.
                  </span>
                </label>

                <button type="submit" disabled={loading} className="btn btn-primary w-full py-3 text-base bg-[#047857] hover:bg-[#064e3b]">
                  <i className="material-icons-round">person_add</i>
                  {loading ? 'Creating account...' : 'Create Account'}
                </button>
              </form>

              <div className="mt-7 text-center text-gray-600">
                Already have an account?{' '}
                <Link to={ROUTES.LOGIN} className="font-semibold text-[#047857] hover:text-[#065f46]">
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
