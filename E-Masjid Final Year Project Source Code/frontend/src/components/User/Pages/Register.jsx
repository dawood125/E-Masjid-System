import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../hooks/useAuth.js'
import { useUI } from '../../../hooks/useUI.js'
import { ROUTES } from '../../../utils/constants.js'
import MosqueSearchModal from '../../Auth/Pages/MosqueSearchModal.jsx'

// Same rule as backend/routes/auth.js (kept in sync with backend PASSWORD_RULE)
const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d).{8,64}$/

/**
 * Register (Phase 3.5) — 2-step registration flow.
 *
 *   Step 1: Basic info (name, email, phone, password, terms)
 *   Step 2: Address + home-mosque selection (uses MosqueSearchModal with
 *           live search + city filter + "use my location" button)
 *
 * If the user doesn't have a specific mosque in mind, they can skip Step 2
 * and register without a `mosqueId`. They can always pick one later from
 * the public Navbar dropdown.
 */
export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    terms: false,
    address: '',
    city: '',
    mosqueId: '',
    selectedMosque: null, // full mosque object (for display)
  })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [step, setStep] = useState(1)
  const [isMosqueModalOpen, setIsMosqueModalOpen] = useState(false)
  const { register } = useAuth()
  const { showToast } = useUI()
  const navigate = useNavigate()

  const handleSelectMosque = (mosque) => {
    setFormData((prev) => ({
      ...prev,
      mosqueId: mosque?._id || '',
      selectedMosque: mosque || null,
      // Auto-fill city from selected mosque
      city: mosque?.city || prev.city,
    }))
    setIsMosqueModalOpen(false)
  }

  const goToStep2 = (e) => {
    e?.preventDefault()
    setFieldErrors({})

    // Step 1 validation: ALL fields must be valid before moving on.
    // This matches the backend's PASSWORD_RULE so the user gets the same
    // feedback in both places, and prevents partially-filled forms from
    // reaching the address step.
    const errors = {}
    if (!formData.name || formData.name.trim().length < 2) {
      errors.name = 'Name is required (at least 2 characters)'
    }
    if (!formData.email || !/^\S+@\S+\.\S+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address'
    }
    if (!formData.phone || formData.phone.trim().length < 7) {
      errors.phone = 'Phone is required (at least 7 characters)'
    }
    if (!formData.password) {
      errors.password = 'Password is required'
    } else if (!PASSWORD_RULE.test(formData.password)) {
      errors.password = 'Password must be at least 8 characters and include at least 1 letter and 1 number'
    }
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }
    if (!formData.terms) {
      errors.terms = 'Please accept terms and privacy policy'
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      const summary = Object.values(errors).filter(Boolean).join(' • ')
      showToast(summary || 'Please fix the errors below.', 'error')
      return
    }
    setStep(2)
  }

  const goBackToStep1 = () => setStep(1)

  const handleSubmit = async () => {
    setFieldErrors({})
    setLoading(true)

    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        address: formData.address || undefined,
        city: formData.city || undefined,
        mosqueId: formData.mosqueId || undefined,
      })
      showToast(
        formData.selectedMosque
          ? `Account created! Welcome to ${formData.selectedMosque.name}.`
          : 'Account created successfully!',
        'success'
      )
      navigate(ROUTES.HOME)
    } catch (err) {
      if (err.errors && Array.isArray(err.errors) && err.errors.length > 0) {
        const next = {}
        for (const e of err.errors) {
          if (e && e.field) next[e.field] = e.message
        }
        setFieldErrors(next)
        const summary = err.errors.map((e) => e.message).filter(Boolean).join(' • ')
        showToast(summary || err.message || 'Please fix the errors below.', 'error')
      } else {
        showToast(err.message || 'Registration failed. Please try again.', 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  const FieldError = ({ name }) =>
    fieldErrors[name] ? (
      <p className="mt-1.5 text-xs text-red-600 inline-flex items-center gap-1">
        <i className="material-icons-round text-sm">error_outline</i>
        {fieldErrors[name]}
      </p>
    ) : null

  const inputClass = (name) =>
    `form-input pl-12${fieldErrors[name] ? ' border-red-400 focus:ring-red-200' : ''}`

  const passwordScore = Math.min(
    4,
    Number(formData.password.length >= 8) +
      Number(/[A-Z]/.test(formData.password)) +
      Number(/[0-9]/.test(formData.password)) +
      Number(/[^A-Za-z0-9]/.test(formData.password))
  )

  return (
    <section className="min-h-screen bg-gradient-to-br from-[#f0fdf4] via-white to-[#ecfdf5] py-16">
      <div className="container">
        <div className="mx-auto grid max-w-7xl overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl lg:grid-cols-2 animate-fade-in">
          {/* LEFT PANEL — unchanged promotional content */}
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
                { icon: 'volunteer_activism', title: 'Easy Donations', desc: 'Track and manage your contributions with full transparency.' },
                { icon: 'favorite',          title: 'Nikah Booking',  desc: 'Book religious scholar for marriage ceremonies online.' },
                { icon: 'event',             title: 'Event Registration', desc: 'Register for mosque events and programs easily.' },
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

          {/* RIGHT PANEL — 2-step form */}
          <div className="p-8 sm:p-10">
            <div className="mx-auto max-w-lg">
              {/* Step indicator */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`h-2 flex-1 rounded-full transition-colors ${step >= 1 ? 'bg-[#047857]' : 'bg-gray-200'}`} />
                  <div className={`h-2 flex-1 rounded-full transition-colors ${step >= 2 ? 'bg-[#047857]' : 'bg-gray-200'}`} />
                </div>
                <p className="text-xs text-gray-500 text-right">Step {step} of 2</p>
              </div>

              {step === 1 && (
                <>
                  <h2 className="font-primary text-3xl font-bold text-gray-900">Create Your Account</h2>
                  <p className="mt-2 text-gray-600">Please fill in your details to register</p>

                  <form onSubmit={goToStep2} className="mt-6 space-y-5" noValidate>
                    <div>
                      <label className="form-label" htmlFor="name">Full Name <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <i className="material-icons-round pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">person</i>
                        <input
                          id="name"
                          type="text"
                          className={inputClass('name')}
                          placeholder="Enter your full name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          autoComplete="name"
                          required
                        />
                      </div>
                      <FieldError name="name" />
                    </div>

                    <div>
                      <label className="form-label" htmlFor="email">Email Address <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <i className="material-icons-round pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">mail</i>
                        <input
                          id="email"
                          type="email"
                          className={inputClass('email')}
                          placeholder="Enter your email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          autoComplete="email"
                          required
                        />
                      </div>
                      <FieldError name="email" />
                    </div>

                    <div>
                      <label className="form-label" htmlFor="phone">Phone Number <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <i className="material-icons-round pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">phone</i>
                        <input
                          id="phone"
                          type="tel"
                          className={inputClass('phone')}
                          placeholder="03XX-XXXXXXX"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          autoComplete="tel"
                          required
                        />
                      </div>
                      <FieldError name="phone" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="form-label" htmlFor="password">Password <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <i className="material-icons-round pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">lock</i>
                          <input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            className={inputClass('password').replace('pl-12', 'pl-12 pr-12')}
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
                          At least 8 characters, with 1 letter and 1 number
                        </p>
                        <FieldError name="password" />
                      </div>

                      <div>
                        <label className="form-label" htmlFor="confirmPassword">Confirm Password <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <i className="material-icons-round pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">lock</i>
                          <input
                            id="confirmPassword"
                            type={showConfirmPassword ? 'text' : 'password'}
                            className={inputClass('confirmPassword').replace('pl-12', 'pl-12 pr-12')}
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
                        <FieldError name="confirmPassword" />
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
                        I agree to the <a href="#" className="text-[#047857] hover:underline">Terms &amp; Conditions</a> and <a href="#" className="text-[#047857] hover:underline">Privacy Policy</a> of Masjid Al-Noor E-Masjid System.
                      </span>
                    </label>

                    <button type="submit" className="btn btn-primary w-full py-3 text-base bg-[#047857] hover:bg-[#064e3b]">
                      Continue
                      <i className="material-icons-round">arrow_forward</i>
                    </button>
                  </form>
                </>
              )}

              {step === 2 && (
                <>
                  <h2 className="font-primary text-3xl font-bold text-gray-900">Find Your Home Mosque</h2>
                  <p className="mt-2 text-gray-600">Pick a mosque near you (or skip and add one later).</p>

                  <div className="mt-6 space-y-4">
                    <div>
                      <label className="form-label" htmlFor="address">Street Address (optional)</label>
                      <div className="relative">
                        <i className="material-icons-round pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">home</i>
                        <input
                          id="address"
                          type="text"
                          className="form-input pl-12"
                          placeholder="House #, Street, Area"
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="form-label" htmlFor="city">City</label>
                      <div className="relative">
                        <i className="material-icons-round pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">location_city</i>
                        <input
                          id="city"
                          type="text"
                          className="form-input pl-12"
                          placeholder="Lahore, Sheikhupura, Karachi..."
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="form-label">Home Mosque (optional)</label>
                      <button
                        type="button"
                        onClick={() => setIsMosqueModalOpen(true)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-[#047857]/40 bg-primary-50 hover:bg-primary-100 transition-colors text-left"
                      >
                        <div className="h-10 w-10 rounded-full bg-[#047857] text-white flex items-center justify-center shrink-0">
                          <i className="material-icons-round">mosque</i>
                        </div>
                        <div className="flex-1 min-w-0">
                          {formData.selectedMosque ? (
                            <>
                              <p className="font-semibold text-[#064e3b] truncate">{formData.selectedMosque.name}</p>
                              <p className="text-xs text-gray-500 truncate">{formData.selectedMosque.city}{formData.selectedMosque.address ? ` · ${formData.selectedMosque.address}` : ''}</p>
                            </>
                          ) : (
                            <>
                              <p className="font-semibold text-[#047857]">Choose a home mosque</p>
                              <p className="text-xs text-gray-500">Search by name or city</p>
                            </>
                          )}
                        </div>
                        {formData.selectedMosque ? (
                          <span className="text-xs text-[#047857] font-semibold">Change</span>
                        ) : (
                          <i className="material-icons-round text-[#047857]">chevron_right</i>
                        )}
                      </button>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={goBackToStep1}
                        className="btn btn-secondary flex-1"
                      >
                        <i className="material-icons-round">arrow_back</i>
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading}
                        className="btn btn-primary flex-1 py-3 text-base bg-[#047857] hover:bg-[#064e3b] disabled:opacity-50"
                      >
                        <i className="material-icons-round">person_add</i>
                        {loading ? 'Creating account...' : 'Create Account'}
                      </button>
                    </div>

                    {!formData.selectedMosque && (
                      <p className="text-center text-xs text-gray-500 -mt-2">
                        You can always add a mosque later from the public dropdown.
                      </p>
                    )}
                  </div>
                </>
              )}

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

      <MosqueSearchModal
        open={isMosqueModalOpen}
        onClose={() => setIsMosqueModalOpen(false)}
        onSelect={handleSelectMosque}
        initialCity={formData.city}
      />
    </section>
  )
}
