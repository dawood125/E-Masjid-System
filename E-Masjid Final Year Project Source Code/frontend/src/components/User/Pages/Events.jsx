import { useEffect, useMemo, useState } from 'react'
import { useUI } from '../../../hooks/useUI.js'
import api from '../../../utils/api.js'
import { formatDate, formatTime } from '../../../utils/formatters.js'
import { getActiveMosqueId } from '../../../utils/mosque.js'

const categories = ['all', 'lecture', 'religious', 'education', 'community', 'youth']
const categoryLabel = {
  all: 'All Events',
  lecture: 'Lectures',
  religious: 'Religious',
  education: 'Education',
  community: 'Community',
  youth: 'Youth',
}

const eventImages = [
  'https://images.unsplash.com/photo-1585036156171-384164a8c675?w=900',
  'https://images.unsplash.com/photo-1529390079861-591f8f0f88cf?w=900',
  'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=900',
  'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=900',
  'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=900',
  'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=900',
]

function inferCategory(title) {
  const t = title.toLowerCase()
  if (t.includes('quiz') || t.includes('youth')) return 'youth'
  if (t.includes('school') || t.includes('class')) return 'education'
  if (t.includes('iftaar') || t.includes('service')) return 'community'
  if (t.includes('eid') || t.includes('ramadan')) return 'religious'
  return 'lecture'
}

function dateBadgeParts(dateString) {
  const d = new Date(dateString)
  return {
    month: d.toLocaleDateString('en-US', { month: 'short' }),
    day: d.toLocaleDateString('en-US', { day: '2-digit' }),
  }
}

export default function Events() {
  const { showToast } = useUI()
  const [searchTerm, setSearchTerm] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [visibleCount, setVisibleCount] = useState(6)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [registration, setRegistration] = useState({ name: '', phone: '', email: '' })

  useEffect(() => {
    let mounted = true
    const mosqueId = getActiveMosqueId()
    const params = mosqueId ? `mosqueId=${mosqueId}` : ''
    ;(async () => {
      try {
        const res = await api.getEvents(params)
        if (!mounted) return
        setEvents(Array.isArray(res.data) ? res.data : [])
      } catch (err) {
        showToast(err.message || 'Failed to load events.', 'error')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [showToast])

  const enrichedEvents = useMemo(
    () =>
      events.map((event, index) => ({
        ...event,
        id: event._id || event.id,
        registeredCount: event.registeredUsers?.length || event.registeredCount || 0,
        category: inferCategory(event.title),
        image: eventImages[index % eventImages.length],
      })),
    [events]
  )

  const featuredEvent = enrichedEvents[0]

  const filtered = enrichedEvents.filter((event) => {
    const matchSearch =
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchCategory = activeCategory === 'all' || event.category === activeCategory
    return matchSearch && matchCategory
  })

  const visibleEvents = filtered.slice(0, visibleCount)

  const openModal = (event) => {
    setSelectedEvent(event)
  }

  const closeModal = () => {
    setSelectedEvent(null)
    setRegistration({ name: '', phone: '', email: '' })
  }

  const submitRegistration = async (e) => {
    e.preventDefault()
    if (!selectedEvent?.id) return
    try {
      await api.registerForEvent(selectedEvent.id)
      showToast('Event registration submitted successfully.', 'success')
      setEvents((prev) =>
        prev.map((evt) =>
          (evt._id || evt.id) === selectedEvent.id
            ? { ...evt, registeredUsers: [...(evt.registeredUsers || []), 'self'] }
            : evt
        )
      )
      closeModal()
    } catch (err) {
      showToast(err.message || 'Failed to register for event.', 'error')
    }
  }

  return (
    <div className="bg-white">
      <section className="bg-primary-50 py-16 text-center">
        <div className="container">
          <h1 className="font-primary text-5xl font-bold text-[#064e3b]">Community Events</h1>
          <p className="mt-4 mx-auto max-w-3xl text-lg text-gray-600">
            Join us in our upcoming gatherings to strengthen faith, knowledge, and brotherhood. Register now to secure your spot.
          </p>
        </div>
      </section>

      <section className="border-y border-gray-200 bg-white py-5">
        <div className="container">
          <div className="flex flex-col gap-4">
            <div className="relative">
              <i className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">search</i>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search events..."
                className="w-full rounded-xl border border-gray-300 py-3 pl-12 pr-4 focus:border-[#047857] focus:outline-none focus:ring-2 focus:ring-[#047857]/20"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {categories.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveCategory(key)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                    activeCategory === key
                      ? 'bg-[#047857] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-primary-50 hover:text-[#047857]'
                  }`}
                >
                  {categoryLabel[key]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container space-y-8">
          {featuredEvent && (
            <article className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-lg animate-fade-in">
              <div className="grid grid-cols-1 xl:grid-cols-2">
                <div className="p-8 md:p-10">
                  <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-800">
                    <i className="material-icons-round text-sm">star</i>
                    Featured Event
                  </div>
                  <h2 className="mt-4 font-primary text-3xl font-bold text-gray-900">{featuredEvent.title}</h2>
                  <p className="mt-3 text-gray-600 leading-relaxed">{featuredEvent.description}</p>
                  <div className="mt-5 space-y-2 text-gray-700">
                    <p className="inline-flex items-center gap-2"><i className="material-icons-round text-base text-[#047857]">calendar_today</i>{formatDate(featuredEvent.date)}</p>
                    <p className="inline-flex items-center gap-2"><i className="material-icons-round text-base text-[#047857]">schedule</i>{formatTime(featuredEvent.time)}</p>
                    <p className="inline-flex items-center gap-2"><i className="material-icons-round text-base text-[#047857]">location_on</i>{featuredEvent.location}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openModal(featuredEvent)}
                    className="btn btn-lg mt-6 bg-[#d4af37] text-gray-900 hover:bg-[#b7791f]"
                  >
                    <i className="material-icons-round">how_to_reg</i>
                    Register Now
                  </button>
                </div>
                <div className="min-h-[320px]">
                  <img src={featuredEvent.image} alt={featuredEvent.title} className="h-full w-full object-cover" />
                </div>
              </div>
            </article>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {!loading && visibleEvents.length === 0 && (
              <div className="md:col-span-2 xl:col-span-3 rounded-xl border border-gray-200 p-8 text-center text-gray-500">
                No events found.
              </div>
            )}
            {visibleEvents.map((event, idx) => {
              const badge = dateBadgeParts(event.date)
              const spotsLeft = Math.max(event.maxParticipants - event.registeredCount, 0)

              return (
                <article key={event.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg animate-fade-in-up" style={{ animationDelay: `${idx * 80}ms` }}>
                  <div className="relative h-52">
                    <img src={event.image} alt={event.title} className="h-full w-full object-cover" />
                    <div className="absolute left-4 top-4 rounded-xl bg-white/95 px-3 py-2 text-center shadow">
                      <div className="text-xs uppercase text-gray-500">{badge.month}</div>
                      <div className="text-xl font-bold text-[#047857]">{badge.day}</div>
                    </div>
                    <span className="absolute right-4 top-4 rounded-full bg-[#047857] px-3 py-1 text-xs font-semibold uppercase text-white">
                      {event.category}
                    </span>
                  </div>

                  <div className="p-6">
                    <h3 className="font-primary text-xl font-semibold text-gray-900">{event.title}</h3>
                    <p className="mt-2 text-gray-600">{event.description}</p>

                    <p className={`mt-3 inline-flex items-center gap-1 text-sm font-semibold ${spotsLeft < 15 ? 'text-amber-700' : 'text-[#047857]'}`}>
                      <i className="material-icons-round text-base">group</i>
                      {spotsLeft > 0 ? `${spotsLeft} spots available` : 'Registration full'}
                    </p>

                    <div className="mt-4 space-y-2 text-sm text-gray-600">
                      <p className="inline-flex items-center gap-1"><i className="material-icons-round text-base text-[#047857]">schedule</i>{formatTime(event.time)}</p>
                      <p className="inline-flex items-center gap-1"><i className="material-icons-round text-base text-[#047857]">location_on</i>{event.location}</p>
                    </div>

                    <div className="mt-5">
                      <button type="button" onClick={() => openModal(event)} className="btn btn-primary w-full bg-[#047857] hover:bg-[#064e3b]">
                        Register
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>

          {visibleCount < filtered.length && (
            <div className="text-center">
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-full border border-gray-300 px-5 py-2.5 font-semibold text-gray-700 hover:bg-gray-100"
                onClick={() => setVisibleCount((prev) => prev + 3)}
              >
                <span>Load More Events</span>
                <i className="material-icons-round">expand_more</i>
              </button>
            </div>
          )}
        </div>
      </section>

      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl animate-fade-in-up">
            <div className="flex items-start justify-between border-b border-gray-200 p-5">
              <div>
                <h3 className="font-primary text-2xl font-bold text-gray-900">{selectedEvent.title}</h3>
                <p className="text-gray-600">Complete registration to secure your spot</p>
              </div>
              <button type="button" onClick={closeModal} className="rounded-lg p-1 text-gray-500 hover:bg-gray-100">
                <i className="material-icons-round">close</i>
              </button>
            </div>

            <form onSubmit={submitRegistration} className="space-y-4 p-5">
              <div className="rounded-xl bg-primary-50 p-4 text-sm text-gray-700">
                <p className="inline-flex items-center gap-1 mr-4"><i className="material-icons-round text-base text-[#047857]">calendar_today</i>{formatDate(selectedEvent.date)}</p>
                <p className="inline-flex items-center gap-1 mr-4"><i className="material-icons-round text-base text-[#047857]">schedule</i>{formatTime(selectedEvent.time)}</p>
                <p className="inline-flex items-center gap-1"><i className="material-icons-round text-base text-[#047857]">location_on</i>{selectedEvent.location}</p>
              </div>

              <div>
                <label className="form-label" htmlFor="name">Full Name</label>
                <input id="name" required className="form-input" value={registration.name} onChange={(e) => setRegistration((prev) => ({ ...prev, name: e.target.value }))} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="form-label" htmlFor="phone">Phone</label>
                  <input id="phone" required className="form-input" value={registration.phone} onChange={(e) => setRegistration((prev) => ({ ...prev, phone: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label" htmlFor="email">Email</label>
                  <input id="email" type="email" required className="form-input" value={registration.email} onChange={(e) => setRegistration((prev) => ({ ...prev, email: e.target.value }))} />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" onClick={closeModal} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary bg-[#047857] hover:bg-[#064e3b]">Confirm Registration</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
