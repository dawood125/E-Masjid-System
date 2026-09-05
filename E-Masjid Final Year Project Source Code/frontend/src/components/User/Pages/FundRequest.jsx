import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ROUTES } from '../../../utils/constants.js'
import { useAuth } from '../../../hooks/useAuth.js'
import { useUI } from '../../../hooks/useUI.js'
import { useMosque } from '../../../hooks/useMosque.js'
import api from '../../../utils/api.js'
import FormField from '../../Common/FormField.jsx'

const CATEGORIES = ['Medical', 'Education', 'Housing', 'Food', 'Clothing', 'Debt', 'Other']
const DRAFT_KEY = 'fundRequestDraft'

export default function FundRequest() {
  const { isAuthenticated } = useAuth()
  const { showToast } = useUI()
  const { activeMosqueId } = useMosque()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    amount: '',
    category: '',
    reason: '',
    agreeTerms: false,
  })
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY)
      if (!raw) return
      const draft = JSON.parse(raw)
      if (draft && typeof draft === 'object') {
        setFormData((prev) => ({ ...prev, ...draft, agreeTerms: !!draft.agreeTerms }))
      }
    } catch (e) {}
    sessionStorage.removeItem(DRAFT_KEY)
  }, [])

  const validate = () => {
    const errs = {}
    if (!formData.name.trim()) errs.name = 'Full name is required'
    else if (formData.name.trim().length < 2) errs.name = 'Please enter your full name'

    if (!formData.email.trim()) errs.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) errs.email = 'Enter a valid email address'

    if (!formData.phone.trim()) errs.phone = 'Phone number is required'
    else if (formData.phone.trim().length < 7) errs.phone = 'Phone number looks too short'

    const amt = Number(formData.amount)
    if (!formData.amount) errs.amount = 'Amount is required'
    else if (Number.isNaN(amt) || amt <= 0) errs.amount = 'Enter a valid amount greater than zero'
    else if (amt > 10000000) errs.amount = 'Amount seems unreasonably high'

    if (!formData.category) errs.category = 'Please select a category'

    if (!formData.reason.trim()) errs.reason = 'Please explain why you need assistance'
    else if (formData.reason.trim().length < 30) errs.reason = 'Please provide more detail (at least 30 characters)'
    else if (formData.reason.trim().length > 500) errs.reason = 'Please keep it under 500 characters'

    if (!formData.agreeTerms) errs.agreeTerms = 'You must agree to the terms'

    if (!activeMosqueId) errs.mosqueId = 'Please select a mosque before submitting a request'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isAuthenticated) {
      try {
        sessionStorage.setItem(DRAFT_KEY, JSON.stringify(formData))
      } catch (e) {}
      showToast('Please sign in to submit a fund request', 'info')
      navigate(`${ROUTES.LOGIN}?returnUrl=${encodeURIComponent('/fund-request')}`)
      return
    }

    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      const firstField = Object.keys(errs)[0]
      const el = document.querySelector(`[name="${firstField}"]`)
      if (el && el.focus) el.focus()
      return
    }
    setErrors({})

    setSubmitting(true)
    try {
      const mosqueId = activeMosqueId
      await api.createFundRequest({
        requesterName: formData.name.trim(),
        requesterEmail: formData.email.trim(),
        requesterPhone: formData.phone.trim(),
        amount: Number(formData.amount),
        category: formData.category,
        reason: formData.reason.trim(),
        mosqueId,
      })
      setSubmitted(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      showToast('Request submitted successfully', 'success')
    } catch (e2) {
      if (e2.errors && Array.isArray(e2.errors)) {
        const fieldErrors = {}
        e2.errors.forEach((er) => {
          if (er.field) fieldErrors[er.field] = er.message
        })
        if (Object.keys(fieldErrors).length > 0) {
          setErrors(fieldErrors)
          showToast('Please fix the highlighted fields', 'error')
        } else {
          showToast(e2.message || 'Failed to submit request', 'error')
        }
      } else {
        showToast(e2.message || 'Failed to submit request', 'error')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }))
  }

  if (submitted) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-primary-50">
        <div className="container max-w-lg text-center animate-fade-in-up">
          <div className="rounded-2xl bg-white p-10 shadow-xl border border-gray-200">
            <div className="mx-auto h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
              <i className="material-icons-round text-[#047857] text-4xl">check_circle</i>
            </div>
            <h2 className="font-primary text-3xl font-bold text-[#064e3b]">Request Submitted</h2>
            <p className="mt-4 text-gray-600 leading-relaxed">
              Your fund request has been submitted successfully. Our committee members will review your application and you will be notified via email about the decision.
            </p>
            <p className="mt-3 text-sm text-gray-500">
              Reference ID: <span className="font-semibold text-[#047857]">FR-{Date.now().toString(36).toUpperCase()}</span>
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Link to={ROUTES.MY_REQUESTS} className="btn btn-primary bg-[#047857] hover:bg-[#064e3b]">
                <i className="material-icons-round text-lg">list_alt</i>
                View My Requests
              </Link>
              <Link to={ROUTES.HOME} className="btn btn-secondary">
                <i className="material-icons-round text-lg">home</i>
                Go Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-primary-50 min-h-screen">

      <section className="relative py-16 bg-gradient-to-br from-[#064e3b] to-[#047857] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.15),transparent_60%)]" />
        <div className="container relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold text-white/80 uppercase tracking-widest mb-4">
            <i className="material-icons-round text-[#d4af37] text-base">handshake</i>
            Zakat & Sadaqah Fund
          </div>
          <h1 className="font-primary text-4xl md:text-5xl font-bold text-white">Request Financial Assistance</h1>
          <p className="mt-4 max-w-2xl text-lg text-white/80 leading-relaxed">
            If you or someone you know is in need, submit a request below. Our mosque committee will review your application with care and confidentiality.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="container max-w-3xl">
          <form onSubmit={handleSubmit} noValidate className="rounded-2xl bg-white p-8 md:p-10 shadow-xl border border-gray-200">
            <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-200">
              <div className="h-12 w-12 rounded-xl bg-primary-50 flex items-center justify-center">
                <i className="material-icons-round text-[#047857] text-2xl">description</i>
              </div>
              <div>
                <h2 className="font-primary text-xl font-bold text-gray-900">Fund Request Application</h2>
                <p className="text-sm text-gray-500">All fields marked with * are required</p>
              </div>
            </div>

            {errors.mosqueId && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <i className="material-icons-round align-middle mr-1">error</i>
                {errors.mosqueId}
              </div>
            )}

            <h3 className="font-primary text-sm font-semibold text-[#047857] uppercase tracking-wider mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
              <FormField
                name="name"
                label="Full Name"
                icon="person"
                required
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                error={errors.name}
                placeholder="Enter your full name"
                autoComplete="name"
              />
              <FormField
                name="email"
                label="Email Address"
                type="email"
                icon="email"
                required
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                error={errors.email}
                placeholder="your.email@example.com"
                autoComplete="email"
              />
              <div className="md:col-span-2">
                <FormField
                  name="phone"
                  label="Phone Number"
                  type="tel"
                  icon="phone"
                  required
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  error={errors.phone}
                  placeholder="03XX-XXXXXXX"
                  autoComplete="tel"
                />
              </div>
            </div>

            <h3 className="font-primary text-sm font-semibold text-[#047857] uppercase tracking-wider mb-4">Request Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              <FormField
                name="amount"
                label="Amount Needed (PKR)"
                type="number"
                icon="payments"
                required
                value={formData.amount}
                onChange={(e) => handleChange('amount', e.target.value)}
                error={errors.amount}
                placeholder="Enter amount in PKR"
              />
              <FormField
                name="category"
                label="Category"
                type="select"
                icon="category"
                required
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                error={errors.category}
              >
                <option value="">Select category</option>
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </FormField>
            </div>

            <div className="mb-8">
              <FormField
                name="reason"
                label="Reason for Request"
                type="textarea"
                rows={5}
                required
                value={formData.reason}
                onChange={(e) => handleChange('reason', e.target.value)}
                error={errors.reason}
                placeholder="Please describe your situation in detail. The committee will use this information to evaluate your request..."
                hint={`${formData.reason.length}/500 characters`}
              />
            </div>

            <div className="mb-8 rounded-xl bg-amber-50 border border-amber-200 p-4">
              <FormField
                name="agreeTerms"
                type="checkbox"
                value={formData.agreeTerms}
                onChange={(e) => handleChange('agreeTerms', e.target.checked)}
                error={errors.agreeTerms}
                label="I confirm that the information provided is accurate and I understand that the mosque committee will review and verify my request. I agree to provide any additional information if needed."
                required
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button type="submit" disabled={submitting} className="btn btn-lg bg-[#047857] text-white hover:bg-[#064e3b] flex-1 shadow-md disabled:opacity-60 disabled:cursor-not-allowed">
                <i className="material-icons-round text-xl">send</i>
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
              <Link to={ROUTES.HOME} className="btn btn-lg btn-secondary">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </section>
    </div>
  )
}
