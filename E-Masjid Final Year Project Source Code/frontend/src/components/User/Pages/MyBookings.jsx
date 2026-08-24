import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useUI } from '../../../hooks/useUI.js'
import { useAuth } from '../../../context/AuthContext.jsx'
import api from '../../../utils/api.js'
import { ROUTES } from '../../../utils/constants.js'
import { formatDate } from '../../../utils/formatters.js'

function statusMeta(status) {
  if (status === 'accepted') {
    return {
      cls: 'bg-green-100 text-green-700',
      icon: 'check_circle',
      label: 'Accepted',
    }
  }
  if (status === 'rejected') {
    return {
      cls: 'bg-red-100 text-red-700',
      icon: 'cancel',
      label: 'Rejected',
    }
  }
  return {
    cls: 'bg-amber-100 text-amber-700',
    icon: 'hourglass_empty',
    label: 'Pending',
  }
}

export default function MyBookings() {
  const { showToast } = useUI()
  const { user } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState(null)

  const loadBookings = async () => {
    const res = await api.getNikahBookings()
    const list = Array.isArray(res.data) ? res.data : []
    return list.map((item) => ({ ...item, id: item._id || item.id }))
  }

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const list = await loadBookings()
        if (!mounted) return
        setBookings(list)
      } catch (err) {
        showToast(err.message || 'Failed to load booking status.', 'error')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [showToast])

  const stats = useMemo(() => {
    const pending = bookings.filter((b) => b.status === 'pending').length
    const accepted = bookings.filter((b) => b.status === 'accepted').length
    const rejected = bookings.filter((b) => b.status === 'rejected').length
    return {
      total: bookings.length,
      pending,
      accepted,
      rejected,
    }
  }, [bookings])

  const cancelPending = async (id) => {
    if (!id || cancellingId === id) return
    const ok = window.confirm('Cancel this booking? This action cannot be undone.')
    if (!ok) return

    setCancellingId(id)
    try {
      const res = await api.cancelNikahBooking(id)
      setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, ...res.data, id } : b)))
      showToast(`Booking NKH-${String(id).slice(-6).toUpperCase()} cancelled.`, 'warning')
    } catch (err) {
      showToast(err.message || 'Failed to cancel booking.', 'error')
    } finally {
      setCancellingId(null)
    }
  }

  const greetingName = user?.name || 'there'

  return (
    <div className="bg-white">
      <section className="bg-primary-50 border-b border-gray-200 py-10">
        <div className="container">
          <h1 className="font-primary text-4xl font-bold text-[#064e3b]">My Nikah Bookings</h1>
          <p className="mt-2 text-gray-600">Track and manage your Nikah ceremony booking requests</p>
          <nav className="mt-3 text-sm text-gray-500">
            <Link to={ROUTES.HOME} className="hover:text-[#047857]">Home</Link>
            <span className="mx-2">/</span>
            <span>My Nikah Bookings</span>
          </nav>
        </div>
      </section>

      <section className="py-12">
        <div className="container space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm animate-fade-in">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-primary-50 text-[#047857] flex items-center justify-center">
                  <i className="material-icons-round text-3xl">person</i>
                </div>
                <div>
                  <h2 className="font-primary text-2xl font-bold text-gray-900">Assalam-o-Alaikum, {greetingName}!</h2>
                  <p className="text-gray-600">Here are your Nikah booking requests and current status.</p>
                </div>
              </div>

              <div className="flex gap-6 text-center">
                <div>
                  <div className="text-2xl font-bold text-[#064e3b]">{stats.total}</div>
                  <div className="text-xs text-gray-500 uppercase">Total</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
                  <div className="text-xs text-gray-500 uppercase">Pending</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{stats.accepted}</div>
                  <div className="text-xs text-gray-500 uppercase">Accepted</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
                  <div className="text-xs text-gray-500 uppercase">Rejected</div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 animate-fade-in">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-semibold text-gray-700">Status Guide:</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-amber-700"><i className="material-icons-round text-sm">hourglass_empty</i>Pending</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-green-700"><i className="material-icons-round text-sm">check_circle</i>Accepted</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-red-700"><i className="material-icons-round text-sm">cancel</i>Rejected</span>
            </div>
          </div>

          <div className="space-y-4">
            {loading && (
              <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-gray-500">
                Loading bookings...
              </div>
            )}
            {bookings.map((booking, idx) => {
              const status = statusMeta(booking.status)
              return (
                <article key={booking.id} className="rounded-2xl border border-gray-200 bg-white shadow-sm animate-fade-in-up" style={{ animationDelay: `${idx * 80}ms` }}>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-4">
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-gray-700">
                      <i className="material-icons-round text-base">tag</i>
                      NKH-{String(booking.id).slice(-6).toUpperCase()}
                    </span>
                    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold ${status.cls}`}>
                      <i className="material-icons-round text-sm">{status.icon}</i>
                      {status.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 p-5">
                    <div>
                      <p className="text-xs uppercase text-gray-500">Ceremony Date</p>
                      <p className="mt-1 font-semibold text-gray-900">{formatDate(booking.preferredDate)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-gray-500">Time Slot</p>
                      <p className="mt-1 font-semibold text-gray-900">{booking.preferredTime}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-gray-500">Religious Scholar</p>
                      <p className="mt-1 font-semibold text-gray-900">{booking.scholarId?.name || booking.scholarName || booking.schollarName || 'Awaiting Assignment'}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-gray-500">Couple</p>
                      <p className="mt-1 font-semibold text-gray-900">{booking.groomName} & {booking.brideName}</p>
                    </div>
                  </div>

                  {booking.status === 'accepted' && (
                    <div className="mx-5 mb-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                      Booking confirmed for {formatDate(booking.confirmedDate)} at {booking.confirmedTime}.
                    </div>
                  )}

                  {booking.status === 'rejected' && (
                    <div className="mx-5 mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                      {booking.rejectionReason || 'Booking could not be scheduled for selected slot.'}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-5 py-4">
                    <span className="text-sm text-gray-600">Submitted on <strong>{formatDate(booking.preferredDate)}</strong></span>
                    {booking.status === 'pending' && (
                      <button
                        type="button"
                        className="btn btn-sm border border-red-400 text-red-600 hover:bg-red-50 disabled:opacity-60"
                        disabled={cancellingId === booking.id}
                        onClick={() => cancelPending(booking.id)}
                      >
                        {cancellingId === booking.id ? 'Cancelling...' : 'Cancel Booking'}
                      </button>
                    )}
                  </div>
                </article>
              )
            })}
          </div>

          {bookings.length === 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
              <i className="material-icons-round text-6xl text-gray-300">favorite</i>
              <h3 className="mt-3 font-primary text-2xl font-bold text-gray-900">No Booking Records</h3>
              <p className="mt-2 text-gray-600">Submit a new Nikah booking request and our team will respond soon.</p>
            </div>
          )}

          <div className="rounded-2xl border border-primary-200 bg-primary-50 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="inline-flex items-start gap-3">
              <i className="material-icons-round text-[#047857] text-3xl">add_circle</i>
              <div>
                <h3 className="font-primary text-xl font-bold text-gray-900">Need to Book Another Nikah Ceremony?</h3>
                <p className="text-gray-600">Submit a new request and our team will get back to you soon.</p>
              </div>
            </div>
            <Link to={ROUTES.NIKAH_BOOKING} className="btn btn-primary bg-[#047857]">
              <i className="material-icons-round">favorite</i>
              Book New Nikah
            </Link>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 flex flex-col md:flex-row gap-4 items-start">
            <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-700">
              <i className="material-icons-round">help_outline</i>
            </div>
            <div>
              <h4 className="font-primary text-xl font-bold text-gray-900">Need Help?</h4>
              <p className="mt-1 text-gray-600">If you have questions about your booking or need to make changes, please contact us:</p>
              <div className="mt-3 flex flex-wrap gap-3">
                <a href="tel:03215551234" className="inline-flex items-center gap-1 text-[#047857] font-semibold"><i className="material-icons-round text-base">call</i>0321-5551234</a>
                <a href="mailto:info@masjidalnoor.pk" className="inline-flex items-center gap-1 text-[#047857] font-semibold"><i className="material-icons-round text-base">mail</i>info@masjidalnoor.pk</a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
