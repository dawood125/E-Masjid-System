import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../hooks/useAuth.js'
import { useUI } from '../../../hooks/useUI.js'
import { useMosque } from '../../../hooks/useMosque.js'
import { ROUTES } from '../../../utils/constants.js'
import MosqueSearchModal from '../../Auth/Pages/MosqueSearchModal.jsx'
import FormField from '../../Common/FormField.jsx'

const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d).{8,64}$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateStep1(form) {
  const errs = {}
  if (!form.name || form.name.trim().length < 2) errs.name = 'Name is required (at least 2 characters)'
  else if (form.name.trim().length > 100) errs.name = 'Name is too long'

  if (!form.email || !EMAIL_RE.test(form.email.trim())) errs.email = 'Please enter a valid email address'

  if (!form.phone || form.phone.trim().length < 7) errs.phone = 'Phone is required (at least 7 characters)'

  if (!form.password) errs.password = 'Password is required'
  else if (!PASSWORD_RULE.test(form.password)) errs.password = 'Password must be 8-64 characters with at least 1 letter and 1 number'

  if (!form.confirmPassword) errs.confirmPassword = 'Please confirm your password'
  else if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match'

  if (!form.terms) errs.terms = 'Please accept terms and privacy policy'

  return errs
}

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
    selectedMosque: null,
  })
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [step, setStep] = useState(1)
  const [isMosqueModalOpen, setIsMosqueModalOpen] = useState(false)
  const { register } = useAuth()
  const { showToast } = useUI()
  const { activeMosque } = useMosque()
  const navigate = useNavigate()

  const handleSelectMosque = (mosque) => {
    setFormData((prev) => ({
      ...prev,
      mosqueId: mosque?._id || '',
      selectedMosque: mosque || null,
      city: mosque?.city || prev.city,
    }))
    setIsMosqueModalOpen(false)
  }

  const update = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (fieldErrors[field]) setFieldErrors((prev) => ({ ...prev, [field]: null }))
  }

  const goToStep2 = (e) => {
    e?.preventDefault()
    const errs = validateStep1(formData)
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs)
      const firstField = Object.keys(errs)[0]
      const el = document.querySelector(`[name="${firstField}"]`)
      if (el && el.focus) el.focus()
      return
    }
    setFieldErrors({})
    setStep(2)
  }

  const isStep1Valid = useMemo(() => {
    return Object.keys(validateStep1(formData)).length === 0
  }, [formData])

  const goBackToStep1 = () => setStep(1)

  const handleSubmit = async () => {
    const errs = {}
    if (!formData.mosqueId) {
      errs.mosqueId = 'Please select a home masjid to continue'
    }
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs)
      const el = document.querySelector('[name="mosqueId"]')
      if (el && el.focus) el.focus()
      showToast(errs.mosqueId, 'warning')
      return
    }

    setFieldErrors({})
    setLoading(true)

    try {
      await register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone.trim(),
        address: formData.address.trim() || undefined,
        city: formData.city.trim() || undefined,
        mosqueId: formData.mosqueId,
      })
      showToast(
        `Account created! Welcome to ${formData.selectedMosque?.name || 'your masjid'}.`,
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
              <div className="px-4 py-3 text-sm text-white/90">{activeMosque?.name || 'E-Masjid'}{activeMosque?.city ? `, ${activeMosque.city}` : ''}</div>
            </div>
          </div>

          <div className="p-8 sm:p-10">
            <div className="mx-auto max-w-lg">

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
                    <FormField
                      name="name"
                      label="Full Name"
                      icon="person"
                      required
                      value={formData.name}
                      onChange={(e) => update('name', e.target.value)}
                      error={fieldErrors.name}
                      placeholder="Enter your full name"
                      autoComplete="name"
                    />
                    <FormField
                      name="email"
                      label="Email Address"
                      type="email"
                      icon="mail"
                      required
                      value={formData.email}
                      onChange={(e) => update('email', e.target.value)}
                      error={fieldErrors.email}
                      placeholder="Enter your email"
                      autoComplete="email"
                    />
                    <FormField
                      name="phone"
                      label="Phone Number"
                      type="tel"
                      icon="phone"
                      required
                      value={formData.phone}
                      onChange={(e) => update('phone', e.target.value)}
                      error={fieldErrors.phone}
                      placeholder="03XX-XXXXXXX"
                      autoComplete="tel"
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <FormField
                          name="password"
                          label="Password"
                          type="password"
                          icon="lock"
                          required
                          value={formData.password}
                          onChange={(e) => update('password', e.target.value)}
                          error={fieldErrors.password}
                          placeholder="••••••••"
                          autoComplete="new-password"
                          showPasswordToggle
                        />
                        <div className="mt-2 grid grid-cols-4 gap-1.5">
                          {[1, 2, 3, 4].map((bar) => (
                            <div
                              key={bar}
                              className={`h-1.5 rounded-full ${bar <= passwordScore ? 'bg-[#047857]' : 'bg-gray-200'}`}
                            />
                          ))}
                        </div>
                      </div>
                      <FormField
                        name="confirmPassword"
                        label="Confirm Password"
                        type="password"
                        icon="lock"
                        required
                        value={formData.confirmPassword}
                        onChange={(e) => update('confirmPassword', e.target.value)}
                        error={fieldErrors.confirmPassword}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        showPasswordToggle
                      />
                    </div>

                    <FormField
                      name="terms"
                      type="checkbox"
                      required
                      value={formData.terms}
                      onChange={(e) => update('terms', e.target.checked)}
                      error={fieldErrors.terms}
                      label={<>I agree to the <a href="#" className="text-[#047857] hover:underline">Terms &amp; Conditions</a> and <a href="#" className="text-[#047857] hover:underline">Privacy Policy</a> of Masjid Al-Noor E-Masjid System.</>}
                    />

                    <button
                      type="submit"
                      disabled={!isStep1Valid}
                      className="btn btn-primary w-full py-3 text-base bg-[#047857] hover:bg-[#064e3b] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Continue
                      <i className="material-icons-round">arrow_forward</i>
                    </button>
                    {!isStep1Valid && (
                      <p className="-mt-2 text-center text-xs text-gray-500">
                        Fill all required fields above to continue
                      </p>
                    )}
                  </form>
                </>
              )}

              {step === 2 && (
                <>
                  <h2 className="font-primary text-3xl font-bold text-gray-900">Find Your Home Mosque</h2>
                  <p className="mt-2 text-gray-600">Pick a masjid near you to finish creating your account.</p>

                  <div className="mt-6 space-y-4">
                    <FormField
                      name="address"
                      label="Street Address"
                      icon="home"
                      optional
                      value={formData.address}
                      onChange={(e) => update('address', e.target.value)}
                      placeholder="House #, Street, Area"
                    />
                    <FormField
                      name="city"
                      label="City"
                      icon="location_city"
                      optional
                      value={formData.city}
                      onChange={(e) => update('city', e.target.value)}
                      placeholder="Lahore, Sheikhupura, Karachi..."
                    />

                    <div>
                      <label htmlFor="mosqueId-trigger" className="form-label flex items-center gap-2">
                        <span>Home Mosque <span className="text-red-500">*</span></span>
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">Required</span>
                      </label>
                      <button
                        id="mosqueId-trigger"
                        name="mosqueId"
                        type="button"
                        onClick={() => {
                          if (fieldErrors.mosqueId) setFieldErrors((p) => ({ ...p, mosqueId: null }))
                          setIsMosqueModalOpen(true)
                        }}
                        aria-invalid={!!fieldErrors.mosqueId}
                        aria-describedby={fieldErrors.mosqueId ? 'mosqueId-error' : undefined}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 border-dashed text-left transition-colors ${
                          fieldErrors.mosqueId
                            ? 'border-red-400 bg-red-50'
                            : 'border-[#047857]/40 bg-primary-50 hover:bg-primary-100'
                        }`}
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
                              <p className="font-semibold text-[#047857]">Choose a home masjid</p>
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
                      {fieldErrors.mosqueId && (
                        <p id="mosqueId-error" className="form-error mt-2">
                          {fieldErrors.mosqueId}
                        </p>
                      )}
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
                        disabled={loading || !formData.mosqueId}
                        className="btn btn-primary flex-1 py-3 text-base bg-[#047857] hover:bg-[#064e3b] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <i className="material-icons-round">person_add</i>
                        {loading ? 'Creating account...' : 'Create Account'}
                      </button>
                    </div>

                    {!formData.selectedMosque && (
                      <p className="text-center text-xs text-gray-500 -mt-2">
                        A masjid is required so you can book nikah, submit fund requests, and receive announcements.
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
