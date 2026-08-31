import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useUI } from '../../../hooks/useUI.js'
import { useMosque } from '../../../hooks/useMosque.js'
import api from '../../../utils/api.js'
import { ROUTES } from '../../../utils/constants.js'
import FormField from '../../Common/FormField.jsx'
import SlotPicker from '../SlotPicker.jsx'

const requirements = [
  'CNIC of Groom & Bride (Original + Copy)',
  "CNIC of Wali (Bride's Guardian)",
  'Two Muslim Male Witnesses with CNIC',
  '4 Passport Size Photos (Each)',
  'Divorce Decree / Death Certificate (if applicable)',
  'Meher Amount (to be agreed upon)',
]

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validate(form) {
  const errors = {}
  if (!form.groomName.trim()) errors.groomName = 'Groom name is required'
  else if (form.groomName.trim().length < 2) errors.groomName = 'Groom name must be at least 2 characters'
  else if (form.groomName.trim().length > 100) errors.groomName = 'Groom name must be under 100 characters'

  if (!form.brideName.trim()) errors.brideName = 'Bride name is required'
  else if (form.brideName.trim().length < 2) errors.brideName = 'Bride name must be at least 2 characters'
  else if (form.brideName.trim().length > 100) errors.brideName = 'Bride name must be under 100 characters'

  if (!form.phone.trim()) errors.phone = 'Contact number is required'
  else if (form.phone.trim().length < 7) errors.phone = 'Contact number looks too short'
  else if (form.phone.trim().length > 20) errors.phone = 'Contact number is too long'

  if (!form.email.trim()) errors.email = 'Email is required'
  else if (!EMAIL_RE.test(form.email.trim())) errors.email = 'Enter a valid email address'

  if (!form.address.trim()) errors.address = 'Residential address is required'
  else if (form.address.trim().length < 3) errors.address = 'Address must be at least 3 characters'
  else if (form.address.trim().length > 500) errors.address = 'Address is too long'

  if (!form.ceremonyDate) errors.ceremonyDate = 'Please choose a ceremony date'
  if (!form.ceremonyTime) errors.ceremonyTime = 'Please choose a ceremony time'

  if (form.notes && form.notes.length > 1000) errors.notes = 'Notes must be under 1000 characters'

  return errors
}

export default function NikahBooking() {
  const [formData, setFormData] = useState({
    groomName: '',
    brideName: '',
    phone: '',
    email: '',
    address: '',
    ceremonyDate: '',
    ceremonyTime: '',
    notes: '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [bookingId, setBookingId] = useState('')
  const { showToast } = useUI()
  const { activeMosque } = useMosque()

  const update = (field, value) => {
    setFormData((p) => ({ ...p, [field]: value }))
    if (errors[field]) setErrors((p) => ({ ...p, [field]: undefined }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const v = validate(formData)
    if (Object.keys(v).length > 0) {
      setErrors(v)
      const firstField = Object.keys(v)[0]
      const el = document.querySelector(`[name="${firstField}"]`)
      if (el && el.focus) el.focus()
      return
    }
    setLoading(true)
    setErrors({})

    try {
      const res = await api.createNikahBooking({
        groomName: formData.groomName.trim(),
        brideName: formData.brideName.trim(),
        ceremonyDate: formData.ceremonyDate,
        ceremonyTime: formData.ceremonyTime,
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
        notes: formData.notes.trim() || undefined,
      })
      const id = res.data?._id || res.data?.id || `${Date.now()}`
      setBookingId(id)
      setShowSuccess(true)
      showToast('Nikah booking request submitted successfully', 'success')
    } catch (err) {
      if (err.errors && Array.isArray(err.errors)) {
        const fieldErrors = {}
        err.errors.forEach((er) => {
          if (er.field) fieldErrors[er.field] = er.message
        })
        if (Object.keys(fieldErrors).length > 0) {
          setErrors(fieldErrors)
          showToast('Please fix the highlighted fields', 'error')
        } else {
          showToast(err.message || 'Failed to submit booking request', 'error')
        }
      } else {
        showToast(err.message || 'Failed to submit booking request', 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  const closeSuccess = () => {
    setShowSuccess(false)
    setFormData({
      groomName: '',
      brideName: '',
      phone: '',
      email: '',
      address: '',
      ceremonyDate: '',
      ceremonyTime: '',
      notes: '',
    })
    setErrors({})
  }

  return (
    <div className="bg-white">
      <section className="relative min-h-[320px] overflow-hidden flex items-center justify-center text-center">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1564769625905-50e93615e769?w=1920')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#064e3b]/90 to-[#047857]/80" />
        <div className="relative z-10 px-4 text-white animate-fade-in">
          <h1 className="font-primary text-5xl font-bold">Book Your Nikah Ceremony</h1>
          <p className="mt-4 mx-auto max-w-3xl text-lg text-white/90">
            Begin your blessed journey with us. Fill out the form below to request a Nikah booking at {activeMosque?.name || 'our masjid'}{activeMosque?.city ? `, ${activeMosque.city}` : ''}.
          </p>
        </div>
      </section>

      <section className="py-14">
        <div className="container grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-8">
          <div className="rounded-2xl border border-gray-200 bg-white shadow-lg animate-fade-in-up">
            <div className="border-b border-gray-200 px-6 py-5">
              <h2 className="inline-flex items-center gap-2 font-primary text-2xl font-bold text-gray-900">
                <i className="material-icons-round text-[#047857]">edit_note</i>
                Nikah Application Form
              </h2>
              <p className="mt-2 text-gray-600">Please provide accurate details for the official registry.</p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-7 p-6">
              <div>
                <h3 className="mb-4 inline-flex items-center gap-2 font-primary text-xl font-bold text-gray-900">
                  <i className="material-icons-round text-[#047857]">people</i>
                  Couple Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    name="groomName"
                    label="Groom's Full Name"
                    icon="person"
                    required
                    value={formData.groomName}
                    onChange={(e) => update('groomName', e.target.value)}
                    error={errors.groomName}
                    placeholder="e.g. Abdullah Ahmed"
                  />
                  <FormField
                    name="brideName"
                    label="Bride's Full Name"
                    icon="person"
                    required
                    value={formData.brideName}
                    onChange={(e) => update('brideName', e.target.value)}
                    error={errors.brideName}
                    placeholder="e.g. Fatima Khan"
                  />
                </div>
              </div>

              <div>
                <h3 className="mb-4 inline-flex items-center gap-2 font-primary text-xl font-bold text-gray-900">
                  <i className="material-icons-round text-[#047857]">contact_phone</i>
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    name="phone"
                    label="Contact Number"
                    type="tel"
                    icon="call"
                    required
                    value={formData.phone}
                    onChange={(e) => update('phone', e.target.value)}
                    error={errors.phone}
                    placeholder="03XX-XXXXXXX"
                    autoComplete="tel"
                  />
                  <FormField
                    name="email"
                    label="Email Address"
                    type="email"
                    icon="mail"
                    required
                    value={formData.email}
                    onChange={(e) => update('email', e.target.value)}
                    error={errors.email}
                    placeholder="email@example.com"
                    autoComplete="email"
                  />
                </div>
                <div className="mt-4">
                  <FormField
                    name="address"
                    label="Residential Address"
                    icon="home"
                    required
                    value={formData.address}
                    onChange={(e) => update('address', e.target.value)}
                    error={errors.address}
                    placeholder="House # 123, Street 5, Civil Lines, Sheikhupura"
                    autoComplete="street-address"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-primary-200 bg-primary-50 p-5">
                <h3 className="mb-4 inline-flex items-center gap-2 font-primary text-xl font-bold text-gray-900">
                  <i className="material-icons-round text-[#047857]">event</i>
                  Preferred Schedule
                </h3>
                <SlotPicker
                  value={{ date: formData.ceremonyDate, time: formData.ceremonyTime }}
                  onChange={({ date, time }) => {
                    setFormData((p) => ({
                      ...p,
                      ceremonyDate: date !== undefined ? date : p.ceremonyDate,
                      ceremonyTime: time !== undefined ? time : p.ceremonyTime,
                    }))
                    setErrors((p) => ({
                      ...p,
                      ceremonyDate: date ? undefined : p.ceremonyDate,
                      ceremonyTime: time ? undefined : p.ceremonyTime,
                    }))
                  }}
                />
                {(errors.ceremonyDate || errors.ceremonyTime) && (
                  <p className="mt-2 text-sm text-red-600">
                    {errors.ceremonyDate || errors.ceremonyTime}
                  </p>
                )}
                <p className="mt-3 inline-flex items-center gap-1 text-xs text-gray-500">
                  <i className="material-icons-round text-sm">info</i>Please arrive 30 minutes before your slot. Already-confirmed slots are disabled.
                </p>
              </div>

              <div>
                <FormField
                  name="notes"
                  label="Special Requests or Notes"
                  type="textarea"
                  rows={4}
                  optional
                  value={formData.notes}
                  onChange={(e) => update('notes', e.target.value)}
                  error={errors.notes}
                  placeholder="Enter any additional requirements or special requests here..."
                />
              </div>

              <div className="border-t border-gray-200 pt-5">
                <button disabled={loading} type="submit" className="btn btn-primary btn-lg w-full bg-[#047857] hover:bg-[#064e3b]">
                  <i className="material-icons-round">send</i>
                  {loading ? 'Submitting...' : 'Submit Application'}
                </button>
                <p className="mt-3 text-center text-sm text-gray-600">
                  By submitting, you agree to our <a href="#" className="text-[#047857]">Terms of Service</a> and <a href="#" className="text-[#047857]">Privacy Policy</a>.
                </p>
              </div>
            </form>
          </div>

          <aside className="space-y-5">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm animate-fade-in-up">
              <h3 className="inline-flex items-center gap-2 font-primary text-xl font-bold text-gray-900">
                <i className="material-icons-round text-[#047857]">verified</i>
                Required Documents
              </h3>
              <p className="mt-3 text-sm text-gray-600">Please bring original copies of the following documents on the day of ceremony:</p>
              <ul className="mt-4 space-y-2">
                {requirements.map((item) => (
                  <li key={item} className="inline-flex items-start gap-2 text-sm text-gray-700">
                    <i className="material-icons-round text-[#16a34a] text-base mt-0.5">check_circle</i>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-primary-200 bg-primary-50 p-5 shadow-sm animate-fade-in-up">
              <h3 className="inline-flex items-center gap-2 font-primary text-xl font-bold text-gray-900">
                <i className="material-icons-round text-[#047857]">help</i>
                Need Assistance?
              </h3>
              <p className="mt-3 text-sm text-gray-700">If you have questions regarding the Nikah process or requirements, please contact our office.</p>
              <div className="mt-4 space-y-2 text-sm text-gray-700">
                {activeMosque?.phone && (
                  <p className="inline-flex items-center gap-2"><i className="material-icons-round text-[#047857] text-base">call</i>{activeMosque.phone}</p>
                )}
                <p className="inline-flex items-center gap-2"><i className="material-icons-round text-[#047857] text-base">schedule</i>Mon - Sat: 9:00 AM - 5:00 PM</p>
                {activeMosque?.name && (
                  <p className="inline-flex items-center gap-2"><i className="material-icons-round text-[#047857] text-base">location_on</i>{activeMosque.name}{activeMosque.city ? `, ${activeMosque.city}` : ''}</p>
                )}
              </div>
            </div>
          </aside>
        </div>
      </section>

      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 text-center shadow-2xl animate-fade-in-up">
            <div className="mx-auto h-20 w-20 rounded-full bg-primary-50 text-[#047857] flex items-center justify-center">
              <i className="material-icons-round text-5xl">check</i>
            </div>
            <h3 className="mt-5 font-primary text-3xl font-bold text-gray-900">Application Submitted!</h3>
            <p className="mt-3 text-gray-600 leading-relaxed">
              Your Nikah booking request has been submitted successfully. Our team will review your application and contact you within 24-48 hours.
            </p>
            <p className="mt-3 text-sm text-gray-700">Booking ID: <span className="font-semibold text-[#047857]">NKH-{String(bookingId).slice(-6).toUpperCase()}</span></p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link to={ROUTES.MY_BOOKINGS} className="btn btn-primary bg-[#047857]">View My Bookings</Link>
              <button type="button" className="btn btn-secondary" onClick={closeSuccess}>Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
