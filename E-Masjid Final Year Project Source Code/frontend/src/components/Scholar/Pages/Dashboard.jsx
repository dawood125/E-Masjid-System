import { useEffect, useMemo, useState } from 'react'
import { useUI } from '../../../hooks/useUI.js'
import api from '../../../utils/api.js'
import { formatDate, formatTime } from '../../../utils/formatters.js'

function getDaysLeft(dateString) {
  const now = new Date()
  const target = new Date(dateString)
  const diff = target - now
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export default function ScholarDashboard() {
  const { showToast } = useUI()
  const [bookings, setBookings] = useState([])
  const [selectedBookingId, setSelectedBookingId] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await api.getNikahBookings()
        if (!mounted) return
        const list = Array.isArray(res.data) ? res.data : []
        setBookings(list.map((item) => ({ ...item, id: item._id || item.id })))
      } catch (err) {
        showToast(err.message || 'Failed to load Nikah requests.', 'error')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [showToast])

  const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const pendingBookings = useMemo(
    () => bookings.filter((booking) => booking.status === 'pending'),
    [bookings]
  )

  const acceptedBookings = useMemo(
    () => bookings.filter((booking) => booking.status === 'accepted'),
    [bookings]
  )

  const selectedBooking = pendingBookings.find((booking) => booking.id === selectedBookingId) || null

  const acceptRequest = async (id) => {
    try {
      const target = bookings.find((booking) => booking.id === id)
      const res = await api.updateNikahBooking(id, {
        status: 'accepted',
        confirmedDate: target?.preferredDate,
        confirmedTime: target?.preferredTime,
      })
      setBookings((prev) => prev.map((booking) => (booking.id === id ? { ...booking, ...res.data, id } : booking)))
      showToast(`Booking ${String(id).slice(-6)} accepted.`, 'success')
      setSelectedBookingId(null)
    } catch (err) {
      showToast(err.message || 'Failed to accept booking.', 'error')
    }
  }

  const rejectRequest = async (id) => {
    try {
      const res = await api.updateNikahBooking(id, {
        status: 'rejected',
        rejectionReason: 'Not available at requested slot',
      })
      setBookings((prev) => prev.map((booking) => (booking.id === id ? { ...booking, ...res.data, id } : booking)))
      showToast(`Booking ${String(id).slice(-6)} rejected.`, 'warning')
      setSelectedBookingId(null)
    } catch (err) {
      showToast(err.message || 'Failed to reject booking.', 'error')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <section className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary-800 to-primary-700 px-6 py-6 text-white sm:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_60%)]" />
        <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">
              <span className="block text-base font-normal text-white/80">Assalam-o-Alaikum,</span>
              Maulana Abdullah!
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-white/90 sm:text-base">
              Manage Nikah ceremony requests, review pending submissions, and confirm upcoming ceremonies.
            </p>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-lg bg-white/15 px-3 py-2 text-sm font-medium backdrop-blur">
            <i className="material-icons-round text-base">calendar_today</i>
            {todayLabel}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <article className="flex items-center gap-3 rounded-xl border border-amber-200 bg-white p-4 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
            <i className="material-icons-round">hourglass_empty</i>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{pendingBookings.length}</p>
            <p className="text-sm text-gray-600">Pending Requests</p>
          </div>
        </article>

        <article className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-white p-4 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
            <i className="material-icons-round">check_circle</i>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{acceptedBookings.length}</p>
            <p className="text-sm text-gray-600">Confirmed This Month</p>
          </div>
        </article>

        <article className="flex items-center gap-3 rounded-xl border border-primary-200 bg-white p-4 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100 text-primary-700">
            <i className="material-icons-round">favorite</i>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">24</p>
            <p className="text-sm text-gray-600">Total Ceremonies</p>
          </div>
        </article>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="inline-flex items-start gap-2">
            <i className="material-icons-round mt-0.5 text-primary-700">pending_actions</i>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Pending Nikah Requests</h2>
              <p className="text-sm text-gray-600">Review and respond to ceremony booking requests.</p>
            </div>
          </div>
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
            {pendingBookings.length} Pending
          </span>
        </div>

        <div className="hidden overflow-x-auto rounded-lg border border-gray-200 lg:block">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Booking ID</th>
                <th className="px-4 py-3">Applicant</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Requested Date</th>
                <th className="px-4 py-3">Time Slot</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {pendingBookings.map((booking) => (
                <tr key={booking.id}>
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-700">NKH-{String(booking.id).slice(-6).toUpperCase()}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-900">{booking.groomName}</p>
                    <p className="text-xs text-gray-500">Groom: {booking.groomName} & Bride: {booking.brideName}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{booking.contact}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{formatDate(booking.preferredDate)}</td>
                  <td className="px-4 py-3 text-gray-700">{formatTime(booking.preferredTime)}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                      <i className="material-icons-round text-sm">hourglass_empty</i>
                      Pending
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedBookingId(booking.id)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-600 hover:bg-gray-100"
                      >
                        <i className="material-icons-round text-base">visibility</i>
                      </button>
                      <button
                        type="button"
                        onClick={() => rejectRequest(booking.id)}
                        className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => acceptRequest(booking.id)}
                        className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                      >
                        Accept
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!loading && !pendingBookings.length && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                    No pending requests right now.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 lg:hidden">
          {pendingBookings.map((booking) => (
            <article key={booking.id} className="rounded-lg border border-gray-200 p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-semibold text-gray-700">NKH-{String(booking.id).slice(-6).toUpperCase()}</span>
                <span className="rounded-full bg-amber-100 px-2 py-1 text-[11px] font-semibold text-amber-700">Pending</span>
              </div>

              <div className="space-y-1 text-sm text-gray-700">
                <p><strong>Applicant:</strong> {booking.groomName}</p>
                <p><strong>Couple:</strong> {booking.groomName} & {booking.brideName}</p>
                <p><strong>Contact:</strong> {booking.contact}</p>
                <p><strong>Date & Time:</strong> {formatDate(booking.preferredDate)} - {formatTime(booking.preferredTime)}</p>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => rejectRequest(booking.id)}
                  className="flex-1 rounded-md bg-red-600 px-3 py-2 text-xs font-semibold text-white"
                >
                  Reject
                </button>
                <button
                  type="button"
                  onClick={() => acceptRequest(booking.id)}
                  className="flex-1 rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white"
                >
                  Accept
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="inline-flex items-start gap-2">
            <i className="material-icons-round mt-0.5 text-primary-700">event_available</i>
            <div>
              <h2 className="text-xl font-bold text-gray-900">My Confirmed Ceremonies</h2>
              <p className="text-sm text-gray-600">Upcoming ceremonies assigned to you.</p>
            </div>
          </div>
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
            {acceptedBookings.length} Upcoming
          </span>
        </div>

        <div className="space-y-3">
          {acceptedBookings.map((booking) => (
            <article key={booking.id} className="flex flex-col gap-4 rounded-lg border border-emerald-200 p-4 md:flex-row md:items-center">
              <div className="inline-flex w-fit items-center gap-3 rounded-lg bg-emerald-50 px-3 py-2 text-emerald-700 md:w-36 md:flex-col md:gap-0 md:text-center">
                <span className="text-xl font-bold md:text-2xl">{new Date(booking.confirmedDate).getDate()}</span>
                <span className="text-xs uppercase font-semibold">
                  {new Date(booking.confirmedDate).toLocaleDateString('en-US', { month: 'short' })}
                </span>
              </div>

              <div className="flex-1">
                <h4 className="text-base font-bold text-gray-900">Nikah: {booking.groomName} & {booking.brideName}</h4>
                <p className="mt-1 text-sm text-gray-600">Time: {formatTime(booking.confirmedTime || booking.preferredTime)}</p>
                <p className="text-sm text-gray-600">Location: Masjid Al-Noor, Main Hall</p>
                <p className="text-sm text-gray-600">Contact: {booking.contact}</p>
              </div>

              <div className="text-sm font-semibold text-emerald-700">In {getDaysLeft(booking.confirmedDate || booking.preferredDate)} days</div>
            </article>
          ))}

          {!acceptedBookings.length && (
            <div className="rounded-lg bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
              No confirmed ceremonies scheduled.
            </div>
          )}
        </div>
      </section>

      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h3 className="inline-flex items-center gap-2 text-lg font-bold text-gray-900">
                <i className="material-icons-round text-primary-700">info</i>
                Nikah Booking Details
              </h3>
              <button type="button" onClick={() => setSelectedBookingId(null)} className="text-gray-500 hover:text-gray-700">
                <i className="material-icons-round">close</i>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 px-6 py-5 text-sm sm:grid-cols-2">
              <div><span className="font-semibold text-gray-500">Booking ID:</span> NKH-{String(selectedBooking.id).slice(-6).toUpperCase()}</div>
              <div><span className="font-semibold text-gray-500">Applicant:</span> {selectedBooking.groomName}</div>
              <div><span className="font-semibold text-gray-500">Groom:</span> {selectedBooking.groomName}</div>
              <div><span className="font-semibold text-gray-500">Bride:</span> {selectedBooking.brideName}</div>
              <div><span className="font-semibold text-gray-500">Contact:</span> {selectedBooking.contact}</div>
              <div><span className="font-semibold text-gray-500">Requested Date:</span> {formatDate(selectedBooking.preferredDate)}</div>
              <div><span className="font-semibold text-gray-500">Preferred Time:</span> {formatTime(selectedBooking.preferredTime)}</div>
              <div><span className="font-semibold text-gray-500">Venue:</span> Masjid Al-Noor Main Hall</div>
              <div className="sm:col-span-2">
                <span className="font-semibold text-gray-500">Additional Notes:</span> Expected guests: 50-60. Please confirm parking support.
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
              <button
                type="button"
                onClick={() => setSelectedBookingId(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => rejectRequest(selectedBooking.id)}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Reject
              </button>
              <button
                type="button"
                onClick={() => acceptRequest(selectedBooking.id)}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
