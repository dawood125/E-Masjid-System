import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '../../../utils/constants.js'

const CATEGORIES = ['Medical', 'Education', 'Housing', 'Food', 'Clothing', 'Debt', 'Other']

export default function FundRequest() {
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

  const validate = () => {
    const errs = {}
    if (!formData.name.trim()) errs.name = 'Full name is required'
    if (!formData.email.trim()) errs.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errs.email = 'Invalid email format'
    if (!formData.phone.trim()) errs.phone = 'Phone number is required'
    if (!formData.amount || Number(formData.amount) <= 0) errs.amount = 'Valid amount is required'
    if (!formData.category) errs.category = 'Please select a category'
    if (!formData.reason.trim()) errs.reason = 'Please explain why you need assistance'
    else if (formData.reason.trim().length < 30) errs.reason = 'Please provide more detail (at least 30 characters)'
    if (!formData.agreeTerms) errs.agreeTerms = 'You must agree to the terms'
    return errs
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setErrors({})
    setSubmitted(true)
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
      {/* Page Header */}
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

      {/* Form Section */}
      <section className="py-12">
        <div className="container max-w-3xl">
          <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-8 md:p-10 shadow-xl border border-gray-200">
            <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-200">
              <div className="h-12 w-12 rounded-xl bg-primary-50 flex items-center justify-center">
                <i className="material-icons-round text-[#047857] text-2xl">description</i>
              </div>
              <div>
                <h2 className="font-primary text-xl font-bold text-gray-900">Fund Request Application</h2>
                <p className="text-sm text-gray-500">All fields marked with * are required</p>
              </div>
            </div>

            {/* Personal Information */}
            <h3 className="font-primary text-sm font-semibold text-[#047857] uppercase tracking-wider mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
              <div>
                <label className="form-label">Full Name *</label>
                <div className="relative">
                  <i className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">person</i>
                  <input type="text" className={`form-input ${errors.name ? 'border-red-500 focus:ring-red-500' : ''}`} placeholder="Enter your full name" value={formData.name} onChange={e => handleChange('name', e.target.value)} />
                </div>
                {errors.name && <p className="form-error">{errors.name}</p>}
              </div>
              <div>
                <label className="form-label">Email Address *</label>
                <div className="relative">
                  <i className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">email</i>
                  <input type="email" className={`form-input ${errors.email ? 'border-red-500 focus:ring-red-500' : ''}`} placeholder="your.email@example.com" value={formData.email} onChange={e => handleChange('email', e.target.value)} />
                </div>
                {errors.email && <p className="form-error">{errors.email}</p>}
              </div>
              <div className="md:col-span-2">
                <label className="form-label">Phone Number *</label>
                <div className="relative">
                  <i className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">phone</i>
                  <input type="tel" className={`form-input ${errors.phone ? 'border-red-500 focus:ring-red-500' : ''}`} placeholder="03XX-XXXXXXX" value={formData.phone} onChange={e => handleChange('phone', e.target.value)} />
                </div>
                {errors.phone && <p className="form-error">{errors.phone}</p>}
              </div>
            </div>

            {/* Request Details */}
            <h3 className="font-primary text-sm font-semibold text-[#047857] uppercase tracking-wider mb-4">Request Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              <div>
                <label className="form-label">Amount Needed (PKR) *</label>
                <div className="relative">
                  <i className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">payments</i>
                  <input type="number" min="1" className={`form-input ${errors.amount ? 'border-red-500 focus:ring-red-500' : ''}`} placeholder="Enter amount in PKR" value={formData.amount} onChange={e => handleChange('amount', e.target.value)} />
                </div>
                {errors.amount && <p className="form-error">{errors.amount}</p>}
              </div>
              <div>
                <label className="form-label">Category *</label>
                <div className="relative">
                  <i className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">category</i>
                  <select className={`form-select ${errors.category ? 'border-red-500 focus:ring-red-500' : ''}`} value={formData.category} onChange={e => handleChange('category', e.target.value)}>
                    <option value="">Select category</option>
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                {errors.category && <p className="form-error">{errors.category}</p>}
              </div>
            </div>

            <div className="mb-8">
              <label className="form-label">Reason for Request *</label>
              <div className="relative">
                <textarea rows={5} className={`form-textarea pl-4 ${errors.reason ? 'border-red-500 focus:ring-red-500' : ''}`} placeholder="Please describe your situation in detail. The committee will use this information to evaluate your request..." value={formData.reason} onChange={e => handleChange('reason', e.target.value)} />
              </div>
              {errors.reason && <p className="form-error">{errors.reason}</p>}
              <p className="mt-1 text-xs text-gray-400">{formData.reason.length}/500 characters</p>
            </div>

            {/* Terms */}
            <div className="mb-8 rounded-xl bg-amber-50 border border-amber-200 p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" className="mt-1 h-4 w-4 rounded border-gray-300 text-[#047857] focus:ring-[#047857]" checked={formData.agreeTerms} onChange={e => handleChange('agreeTerms', e.target.checked)} />
                <span className="text-sm text-gray-700">
                  I confirm that the information provided is accurate and I understand that the mosque committee will review and verify my request. I agree to provide any additional information if needed. *
                </span>
              </label>
              {errors.agreeTerms && <p className="form-error mt-2">{errors.agreeTerms}</p>}
            </div>

            {/* Submit */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button type="submit" className="btn btn-lg bg-[#047857] text-white hover:bg-[#064e3b] flex-1 shadow-md">
                <i className="material-icons-round text-xl">send</i>
                Submit Request
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
