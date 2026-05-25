import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useUI } from '../../../hooks/useUI.js'
import api from '../../../utils/api.js'
import { ROUTES } from '../../../utils/constants.js'

const timeSlots = [
  { value: '10:00', label: '10:00 AM - After Ishraq' },
  { value: '11:00', label: '11:00 AM' },
  { value: '12:00', label: '12:00 PM - Before Zuhr' },
  { value: '14:00', label: '02:00 PM - After Zuhr' },
  { value: '15:00', label: '03:00 PM' },
  { value: '16:00', label: '04:00 PM - Before Asr' },
  { value: '17:00', label: '05:00 PM - After Asr' },
  { value: '20:00', label: '08:00 PM - After Maghrib' },
]

const requirements = [
  'CNIC of Groom & Bride (Original + Copy)',
  "CNIC of Wali (Bride's Guardian)",
  'Two Muslim Male Witnesses with CNIC',
  '4 Passport Size Photos (Each)',
  'Divorce Decree / Death Certificate (if applicable)',
  'Meher Amount (to be agreed upon)',
]

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
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [bookingId, setBookingId] = useState('')
  const { showToast } = useUI()

  const minDate = useMemo(() => new Date().toISOString().slice(0, 10), [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await api.createNikahBooking({
        groomName: formData.groomName,
        brideName: formData.brideName,
        preferredDate: formData.ceremonyDate,
        preferredTime: formData.ceremonyTime,
        contact: formData.phone,
        notes: formData.notes,
      })
      const id = res.data?._id || res.data?.id || `${Date.now()}`
      setBookingId(id)
      setShowSuccess(true)
      showToast('Nikah booking request submitted successfully', 'success')
    } catch (err) {
      showToast(err.message || 'Failed to submit booking request', 'error')
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
            Begin your blessed journey with us. Fill out the form below to request a Nikah booking at Masjid Al-Noor, Sheikhupura.
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

            <form onSubmit={handleSubmit} className="space-y-7 p-6">
              <div>
                <h3 className="mb-4 inline-flex items-center gap-2 font-primary text-xl font-bold text-gray-900">
                  <i className="material-icons-round text-[#047857]">people</i>
                  Couple Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Groom&apos;s Full Name <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <i className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">person</i>
                      <input className="form-input pl-12" required value={formData.groomName} onChange={(e) => setFormData((p) => ({ ...p, groomName: e.target.value }))} placeholder="e.g. Abdullah Ahmed" />
                    </div>
                  </div>
                  <div>
                    <label className="form-label">Bride&apos;s Full Name <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <i className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">person</i>
                      <input className="form-input pl-12" required value={formData.brideName} onChange={(e) => setFormData((p) => ({ ...p, brideName: e.target.value }))} placeholder="e.g. Fatima Khan" />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-4 inline-flex items-center gap-2 font-primary text-xl font-bold text-gray-900">
                  <i className="material-icons-round text-[#047857]">contact_phone</i>
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Contact Number <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <i className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">call</i>
                      <input className="form-input pl-12" required value={formData.phone} onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))} placeholder="03XX-XXXXXXX" />
                    </div>
                  </div>
                  <div>
                    <label className="form-label">Email Address <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <i className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">mail</i>
                      <input type="email" className="form-input pl-12" required value={formData.email} onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))} placeholder="email@example.com" />
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="form-label">Residential Address <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <i className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">home</i>
                    <input className="form-input pl-12" required value={formData.address} onChange={(e) => setFormData((p) => ({ ...p, address: e.target.value }))} placeholder="House # 123, Street 5, Civil Lines, Sheikhupura" />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-primary-200 bg-primary-50 p-5">
                <h3 className="mb-4 inline-flex items-center gap-2 font-primary text-xl font-bold text-gray-900">
                  <i className="material-icons-round text-[#047857]">event</i>
                  Preferred Schedule
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Date of Ceremony <span className="text-red-500">*</span></label>
                    <input type="date" min={minDate} className="form-input" required value={formData.ceremonyDate} onChange={(e) => setFormData((p) => ({ ...p, ceremonyDate: e.target.value }))} />
                  </div>
                  <div>
                    <label className="form-label">Preferred Time <span className="text-red-500">*</span></label>
                    <select className="form-select" required value={formData.ceremonyTime} onChange={(e) => setFormData((p) => ({ ...p, ceremonyTime: e.target.value }))}>
                      <option value="" disabled>Select a time slot</option>
                      {timeSlots.map((slot) => (
                        <option key={slot.value} value={slot.value}>{slot.label}</option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-gray-500 inline-flex items-center gap-1"><i className="material-icons-round text-sm">info</i>Please arrive 30 minutes before your slot.</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="form-label">Special Requests or Notes (Optional)</label>
                <textarea rows={4} className="form-textarea" value={formData.notes} onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))} placeholder="Enter any additional requirements or special requests here..." />
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
                <p className="inline-flex items-center gap-2"><i className="material-icons-round text-[#047857] text-base">call</i>0321-5551234</p>
                <p className="inline-flex items-center gap-2"><i className="material-icons-round text-[#047857] text-base">schedule</i>Mon - Sat: 9:00 AM - 5:00 PM</p>
                <p className="inline-flex items-center gap-2"><i className="material-icons-round text-[#047857] text-base">location_on</i>Masjid Al-Noor, Sheikhupura</p>
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
            <p className="mt-3 text-sm text-gray-700">Booking ID: <span className="font-semibold text-[#047857]">{bookingId}</span></p>
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
