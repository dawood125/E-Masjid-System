import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useUI } from '../../../hooks/useUI.js'
import api from '../../../utils/api.js'
import { formatDate, formatTime } from '../../../utils/formatters.js'
import { getActiveMosqueId } from '../../../utils/mosque.js'

const PAGE_SIZE = 5

const STATUS_OPTIONS = ['all', 'upcoming', 'completed', 'cancelled']

const DATE_FILTERS = [
  { value: 'all', label: 'All Time' },
  { value: 'this-week', label: 'This Week' },
  { value: 'this-month', label: 'This Month' },
  { value: 'next-month', label: 'Next Month' },
]

const STATUS_STYLES = {
  upcoming: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-700',
}

const EVENT_ICON_BY_INDEX = ['mosque', 'school', 'volunteer_activism', 'menu_book', 'event_busy']

function inferStatus(dateString) {
  const today = new Date()
  const eventDate = new Date(dateString)
  const diffDays = Math.floor((eventDate - today) / (1000 * 60 * 60 * 24))

  if (diffDays < -5) {
    return 'completed'
  }

  if (diffDays < 0) {
    return 'cancelled'
  }

  return 'upcoming'
}

function matchDateFilter(dateString, filter) {
  if (filter === 'all') {
    return true
  }

  const now = new Date()
  const eventDate = new Date(dateString)

  if (filter === 'this-week') {
    const weekFromNow = new Date(now)
    weekFromNow.setDate(now.getDate() + 7)
    return eventDate >= now && eventDate <= weekFromNow
  }

  if (filter === 'this-month') {
    return eventDate.getFullYear() === now.getFullYear() && eventDate.getMonth() === now.getMonth()
  }

  if (filter === 'next-month') {
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    return eventDate.getFullYear() === nextMonth.getFullYear() && eventDate.getMonth() === nextMonth.getMonth()
  }

  return true
}

export default function Events() {
  const { showToast } = useUI()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('this-month')
  const [page, setPage] = useState(1)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    endTime: '',
    location: '',
    maxParticipants: '',
    registrationRequired: 'yes',
  })

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

  const preparedEvents = useMemo(() => {
    return events.map((event, index) => {
      const status = inferStatus(event.date)
      return {
        ...event,
        id: event._id || event.id,
        registeredCount: event.registeredUsers?.length || event.registeredCount || 0,
        status,
        icon: EVENT_ICON_BY_INDEX[index % EVENT_ICON_BY_INDEX.length],
      }
    })
  }, [events])

  const filteredEvents = useMemo(() => {
    return preparedEvents.filter((event) => {
      const query = search.trim().toLowerCase()
      const matchesSearch =
        !query ||
        event.title.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query)
      const matchesStatus = statusFilter === 'all' || event.status === statusFilter
      const matchesDate = matchDateFilter(event.date, dateFilter)

      return matchesSearch && matchesStatus && matchesDate
    })
  }, [preparedEvents, search, statusFilter, dateFilter])

  const totalEvents = preparedEvents.length
  const upcomingCount = preparedEvents.filter((event) => event.status === 'upcoming').length
  const completedCount = preparedEvents.filter((event) => event.status === 'completed').length
  const registrationsCount = preparedEvents.reduce((sum, event) => sum + event.registeredCount, 0)

  const pageCount = Math.max(1, Math.ceil(filteredEvents.length / PAGE_SIZE))
  const visibleEvents = filteredEvents.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleCreateEvent = async (event) => {
    event.preventDefault()
    try {
      const payload = {
        title: newEvent.title,
        description: newEvent.description,
        date: newEvent.date,
        time: newEvent.time,
        location: newEvent.location,
        maxParticipants: Number(newEvent.maxParticipants || 0),
      }
      const res = await api.createEvent(payload)
      setEvents((prev) => [res.data, ...prev])
      setIsModalOpen(false)
      setNewEvent({
        title: '',
        description: '',
        date: '',
        time: '',
        endTime: '',
        location: '',
        maxParticipants: '',
        registrationRequired: 'yes',
      })
      showToast('Event created successfully.', 'success')
    } catch (err) {
      showToast(err.message || 'Failed to create event.', 'error')
    }
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-1 text-sm text-gray-500">
            <span>Admin</span>
            <i className="material-icons-round text-base">chevron_right</i>
            <span>Events</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Events</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/events"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-primary-300 px-4 py-2 text-sm font-semibold text-primary-700 transition-all duration-150 hover:bg-primary-50"
          >
            <i className="material-icons-round text-base">visibility</i>
            View Public Page
          </Link>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-700 px-4 py-2 text-sm font-semibold text-white transition-all duration-150 hover:bg-primary-800"
          >
            <i className="material-icons-round text-base">add</i>
            Add New Event
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total Events</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{totalEvents}</p>
        </article>
        <article className="rounded-xl border border-emerald-200 bg-white p-4 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Upcoming</p>
          <p className="mt-2 text-2xl font-bold text-emerald-700">{upcomingCount}</p>
        </article>
        <article className="rounded-xl border border-blue-200 bg-white p-4 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Registrations</p>
          <p className="mt-2 text-2xl font-bold text-blue-700">{registrationsCount}</p>
        </article>
        <article className="rounded-xl border border-amber-200 bg-white p-4 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Completed</p>
          <p className="mt-2 text-2xl font-bold text-amber-700">{completedCount}</p>
        </article>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
          <label className="relative flex-1">
            <i className="material-icons-round pointer-events-none absolute left-3 top-2.5 text-gray-400">search</i>
            <input
              type="text"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
              placeholder="Search events by title or description..."
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-primary-500 focus:outline-none"
            />
          </label>

          <label className="relative">
            <i className="material-icons-round pointer-events-none absolute left-3 top-2.5 text-gray-400">calendar_month</i>
            <select
              value={dateFilter}
              onChange={(event) => {
                setDateFilter(event.target.value)
                setPage(1)
              }}
              className="min-w-[170px] rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-primary-500 focus:outline-none"
            >
              {DATE_FILTERS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="inline-flex flex-wrap rounded-lg bg-gray-100 p-1">
            {STATUS_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  setStatusFilter(option)
                  setPage(1)
                }}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-all duration-150 ${
                  statusFilter === option ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-600'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Event Details</th>
                <th className="px-4 py-3">Date & Time</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Registrations</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {!loading && visibleEvents.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                    No events found for this filter.
                  </td>
                </tr>
              )}
              {visibleEvents.map((event) => (
                <tr key={event.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-start gap-3">
                      <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-700">
                        <i className="material-icons-round text-base">{event.icon}</i>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{event.title}</p>
                        <p className="text-xs text-gray-500">{event.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{formatDate(event.date)}</p>
                    <p className="text-xs text-gray-500">{formatTime(event.time)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                      <i className="material-icons-round text-sm">location_on</i>
                      {event.location}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-gray-900">{event.registeredCount}</span>
                    <span className="text-gray-500">/{event.maxParticipants}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${STATUS_STYLES[event.status]}`}>
                      {event.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => showToast(`Viewing registrations for ${event.title}`, 'info')}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-600 hover:bg-gray-100"
                      >
                        <i className="material-icons-round text-base">groups</i>
                      </button>
                      <button
                        type="button"
                        onClick={() => showToast('Edit event flow is mock-only for semester scope.', 'info')}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-600 hover:bg-gray-100"
                      >
                        <i className="material-icons-round text-base">edit</i>
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await api.deleteEvent(event.id)
                            setEvents((prev) => prev.filter((e) => (e._id || e.id) !== event.id))
                            showToast('Event deleted successfully.', 'success')
                          } catch (err) {
                            showToast(err.message || 'Failed to delete event.', 'error')
                          }
                        }}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <i className="material-icons-round text-base">delete</i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-gray-200 px-4 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-gray-600">
            Showing <strong>{visibleEvents.length ? (page - 1) * PAGE_SIZE + 1 : 0}</strong> to{' '}
            <strong>{Math.min(page * PAGE_SIZE, filteredEvents.length)}</strong> of <strong>{filteredEvents.length}</strong> events
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className="rounded-lg border border-gray-300 px-3 py-1.5 font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= pageCount}
              onClick={() => setPage((prev) => Math.min(pageCount, prev + 1))}
              className="rounded-lg border border-gray-300 px-3 py-1.5 font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h3 className="inline-flex items-center gap-2 text-lg font-bold text-gray-900">
                <i className="material-icons-round text-primary-700">add_circle</i>
                Create New Event
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <i className="material-icons-round">close</i>
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4 px-6 py-5">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-gray-700">Event Title *</span>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(event) => setNewEvent((prev) => ({ ...prev, title: event.target.value }))}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-gray-700">Description *</span>
                <textarea
                  rows={3}
                  value={newEvent.description}
                  onChange={(event) => setNewEvent((prev) => ({ ...prev, description: event.target.value }))}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
                />
              </label>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-gray-700">Event Date *</span>
                  <input
                    type="date"
                    value={newEvent.date}
                    onChange={(event) => setNewEvent((prev) => ({ ...prev, date: event.target.value }))}
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-gray-700">Start Time *</span>
                  <input
                    type="time"
                    value={newEvent.time}
                    onChange={(event) => setNewEvent((prev) => ({ ...prev, time: event.target.value }))}
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-gray-700">End Time</span>
                  <input
                    type="time"
                    value={newEvent.endTime}
                    onChange={(event) => setNewEvent((prev) => ({ ...prev, endTime: event.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-gray-700">Location *</span>
                  <select
                    value={newEvent.location}
                    onChange={(event) => setNewEvent((prev) => ({ ...prev, location: event.target.value }))}
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
                  >
                    <option value="">Select location</option>
                    <option value="Main Prayer Hall">Main Prayer Hall</option>
                    <option value="Community Center">Community Center</option>
                    <option value="Mosque Courtyard">Mosque Courtyard</option>
                    <option value="Classroom">Classroom</option>
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-gray-700">Maximum Participants</span>
                  <input
                    type="number"
                    min="1"
                    value={newEvent.maxParticipants}
                    onChange={(event) => setNewEvent((prev) => ({ ...prev, maxParticipants: event.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
                  />
                </label>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-gray-700">Registration Required?</p>
                <div className="flex gap-4">
                  <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="radio"
                      name="registration"
                      value="yes"
                      checked={newEvent.registrationRequired === 'yes'}
                      onChange={(event) => setNewEvent((prev) => ({ ...prev, registrationRequired: event.target.value }))}
                    />
                    Yes
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="radio"
                      name="registration"
                      value="no"
                      checked={newEvent.registrationRequired === 'no'}
                      onChange={(event) => setNewEvent((prev) => ({ ...prev, registrationRequired: event.target.value }))}
                    />
                    No
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button type="submit" className="rounded-lg bg-primary-700 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-800">
                  Create Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
