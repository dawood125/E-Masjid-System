import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useUI } from '../../../hooks/useUI.js'
import { useAuth } from '../../../hooks/useAuth.js'
import api from '../../../utils/api.js'
import { API_BASE_URL } from '../../../utils/constants.js'
import { formatDate, formatTime } from '../../../utils/formatters.js'
import { getActiveMosqueId } from '../../../utils/mosque.js'
import FormField from '../../Common/FormField.jsx'

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

function resolveImageUrl(path) {
  if (!path) return null
  return path.startsWith('http') ? path : `${API_BASE_URL}${path}`
}

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
  const { user } = useAuth()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('this-month')
  const [page, setPage] = useState(1)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [registrationsEvent, setRegistrationsEvent] = useState(null)
  const [registrations, setRegistrations] = useState([])
  const [registrationsLoading, setRegistrationsLoading] = useState(false)
  const [eventErrors, setEventErrors] = useState({})
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    endTime: '',
    location: '',
    locationPreset: '',
    customLocation: '',
    maxParticipants: '',
    registrationRequired: 'yes',
  })

  useEffect(() => {
    let mounted = true
    const params = user?.role === 'manager'
      ? `mosqueId=${getActiveMosqueId() || ''}`
      : ''
    ;(async () => {
      try {
        const res = await api.getAdminEvents(params)
        if (!mounted) return
        setEvents(Array.isArray(res.data) ? res.data : [])
      } catch (err) {
        showToast(err.message || 'Failed to load events.', 'error')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [showToast, user?.role])

  useEffect(() => {
    if (!imageFile) {
      setImagePreview(null)
      return
    }
    const url = URL.createObjectURL(imageFile)
    setImagePreview(url)
    return () => URL.revokeObjectURL(url)
  }, [imageFile])

  const preparedEvents = useMemo(() => {
    return events.map((event, index) => {
      const status = inferStatus(event.date)
      return {
        ...event,
        id: event._id || event.id,
        registeredCount: event.registeredUsers?.length || event.registeredCount || 0,
        status,
        icon: EVENT_ICON_BY_INDEX[index % EVENT_ICON_BY_INDEX.length],
        imageUrl: resolveImageUrl(event.image),
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

  const PRESET_LOCATIONS = ['Main Prayer Hall', 'Community Center', 'Mosque Courtyard', 'Classroom']

  const openEditModal = (evt) => {
    const existing = evt.location || ''
    const matchesPreset = PRESET_LOCATIONS.includes(existing)
    setEditingEvent(evt)
    setNewEvent({
      title: evt.title,
      description: evt.description || '',
      date: evt.date ? new Date(evt.date).toISOString().slice(0, 10) : '',
      time: evt.time || '',
      endTime: '',
      location: existing,
      locationPreset: matchesPreset ? existing : '__custom__',
      customLocation: matchesPreset ? '' : existing,
      maxParticipants: String(evt.maxParticipants || ''),
      registrationRequired: evt.requiresRegistration === false ? 'no' : 'yes',
    })
    setImageFile(null)
    setImagePreview(null)
    setEventErrors({})
    setIsModalOpen(true)
  }

  const openCreateModal = () => {
    setEditingEvent(null)
    setNewEvent({
      title: '', description: '', date: '', time: '', endTime: '',
      location: '', locationPreset: '', customLocation: '',
      maxParticipants: '', registrationRequired: 'yes',
    })
    setImageFile(null)
    setImagePreview(null)
    setEventErrors({})
    setIsModalOpen(true)
  }

  const handleSubmitEvent = async (event) => {
    event.preventDefault()

    const errs = {}
    if (!newEvent.title.trim()) errs.title = 'Event title is required'
    if (!newEvent.description.trim()) errs.description = 'Description is required'
    if (!newEvent.date) errs.date = 'Event date is required'
    if (!newEvent.time) errs.time = 'Start time is required'

    const resolvedLocation = newEvent.locationPreset === '__custom__'
      ? newEvent.customLocation.trim()
      : newEvent.locationPreset
    if (!resolvedLocation) {
      if (newEvent.locationPreset === '__custom__') errs.customLocation = 'Custom location is required'
      else errs.locationPreset = 'Please select a location'
    }

    if (newEvent.maxParticipants && Number(newEvent.maxParticipants) < 1) {
      errs.maxParticipants = 'Max participants must be at least 1'
    }

    if (Object.keys(errs).length > 0) {
      setEventErrors(errs)
      const firstField = Object.keys(errs)[0]
      const el = document.querySelector(`[name="${firstField}"]`)
      if (el && el.focus) el.focus()
      return
    }
    setEventErrors({})

    try {
      const fd = new FormData()
      fd.append('title', newEvent.title.trim())
      fd.append('description', newEvent.description.trim())
      fd.append('date', newEvent.date)
      fd.append('time', newEvent.time)
      fd.append('location', resolvedLocation)
      fd.append('maxParticipants', String(Number(newEvent.maxParticipants || 0)))
      fd.append('requiresRegistration', newEvent.registrationRequired === 'yes' ? 'true' : 'false')
      if (user?.role === 'manager') {
        const mId = getActiveMosqueId()
        if (mId) fd.append('mosqueId', mId)
      }
      if (imageFile) fd.append('image', imageFile)

      let res
      if (editingEvent) {
        res = await api.updateEventWithImage(editingEvent.id, fd)
        setEvents((prev) => prev.map((e) => ((e._id || e.id) === editingEvent.id ? res.data : e)))
        showToast('Event updated successfully.', 'success')
      } else {
        res = await api.createEventWithImage(fd)
        setEvents((prev) => [res.data, ...prev])
        showToast('Event created successfully.', 'success')
      }
      setIsModalOpen(false)
      setEditingEvent(null)
      setImageFile(null)
      setNewEvent({
        title: '', description: '', date: '', time: '', endTime: '',
        location: '', locationPreset: '', customLocation: '',
        maxParticipants: '', registrationRequired: 'yes',
      })
      setEventErrors({})
    } catch (err) {
      showToast(err.message || 'Failed to save event.', 'error')
    }
  }

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return
    setDeletingId(confirmDelete.id)
    try {
      await api.deleteEvent(confirmDelete.id)
      setEvents((prev) => prev.filter((e) => (e._id || e.id) !== confirmDelete.id))
      showToast('Event deleted successfully.', 'success')
      setConfirmDelete(null)
    } catch (err) {
      showToast(err.message || 'Failed to delete event.', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  const openRegistrationsModal = async (evt) => {
    setRegistrationsEvent(evt)
    setRegistrations([])
    setRegistrationsLoading(true)
    try {
      const res = await api.getEventRegistrations(evt.id)
      setRegistrations(Array.isArray(res.data?.registrations) ? res.data.registrations : [])
    } catch (err) {
      showToast(err.message || 'Failed to load registrations.', 'error')
      setRegistrationsEvent(null)
    } finally {
      setRegistrationsLoading(false)
    }
  }

  const closeRegistrationsModal = () => {
    setRegistrationsEvent(null)
    setRegistrations([])
    setRegistrationsLoading(false)
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
            onClick={openCreateModal}
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
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-primary-100">
                        {event.imageUrl ? (
                          <img src={event.imageUrl} alt={event.title} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-primary-700">
                            <i className="material-icons-round text-base">{event.icon}</i>
                          </div>
                        )}
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
                        onClick={() => openRegistrationsModal(event)}
                        title="View registrations"
                        aria-label="View registrations"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-600 hover:bg-gray-100"
                      >
                        <i className="material-icons-round text-base">groups</i>
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditModal(event)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-600 hover:bg-gray-100"
                      >
                        <i className="material-icons-round text-base">edit</i>
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(event)}
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
                <i className="material-icons-round text-primary-700">{editingEvent ? 'edit' : 'add_circle'}</i>
                {editingEvent ? 'Edit Event' : 'Create New Event'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false)
                  setEditingEvent(null)
                  setImageFile(null)
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <i className="material-icons-round">close</i>
              </button>
            </div>

            <form onSubmit={handleSubmitEvent} noValidate className="space-y-4 px-6 py-5">
              <FormField
                name="title"
                label="Event Title"
                required
                value={newEvent.title}
                onChange={(e) => {
                  setNewEvent((prev) => ({ ...prev, title: e.target.value }))
                  if (eventErrors.title) setEventErrors((p) => ({ ...p, title: null }))
                }}
                error={eventErrors.title}
                placeholder="e.g. Family Iftaar Gathering"
              />

              <FormField
                name="description"
                label="Description"
                type="textarea"
                rows={3}
                required
                value={newEvent.description}
                onChange={(e) => {
                  setNewEvent((prev) => ({ ...prev, description: e.target.value }))
                  if (eventErrors.description) setEventErrors((p) => ({ ...p, description: null }))
                }}
                error={eventErrors.description}
                placeholder="Describe what attendees should expect"
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <FormField
                  name="date"
                  label="Event Date"
                  type="date"
                  required
                  value={newEvent.date}
                  onChange={(e) => {
                    setNewEvent((prev) => ({ ...prev, date: e.target.value }))
                    if (eventErrors.date) setEventErrors((p) => ({ ...p, date: null }))
                  }}
                  error={eventErrors.date}
                />
                <FormField
                  name="time"
                  label="Start Time"
                  type="time"
                  required
                  value={newEvent.time}
                  onChange={(e) => {
                    setNewEvent((prev) => ({ ...prev, time: e.target.value }))
                    if (eventErrors.time) setEventErrors((p) => ({ ...p, time: null }))
                  }}
                  error={eventErrors.time}
                />
                <FormField
                  name="endTime"
                  label="End Time"
                  type="time"
                  optional
                  value={newEvent.endTime}
                  onChange={(e) => setNewEvent((prev) => ({ ...prev, endTime: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <FormField
                    name="locationPreset"
                    label="Location"
                    type="select"
                    required
                    value={newEvent.locationPreset}
                    onChange={(e) => {
                      setNewEvent((prev) => ({
                        ...prev,
                        locationPreset: e.target.value,
                        location: e.target.value === '__custom__' ? prev.customLocation : e.target.value,
                      }))
                      if (eventErrors.locationPreset) setEventErrors((p) => ({ ...p, locationPreset: null }))
                    }}
                    error={eventErrors.locationPreset}
                  >
                    <option value="">Select location</option>
                    <option value="Main Prayer Hall">Main Prayer Hall</option>
                    <option value="Community Center">Community Center</option>
                    <option value="Mosque Courtyard">Mosque Courtyard</option>
                    <option value="Classroom">Classroom</option>
                    <option value="__custom__">Other (specify)</option>
                  </FormField>
                  {newEvent.locationPreset === '__custom__' && (
                    <div className="mt-3">
                      <FormField
                        name="customLocation"
                        label="Custom Location"
                        required
                        value={newEvent.customLocation}
                        onChange={(e) => {
                          setNewEvent((prev) => ({ ...prev, customLocation: e.target.value, location: e.target.value }))
                          if (eventErrors.customLocation) setEventErrors((p) => ({ ...p, customLocation: null }))
                        }}
                        error={eventErrors.customLocation}
                        placeholder="Enter venue name or full address"
                      />
                    </div>
                  )}
                </div>
                <FormField
                  name="maxParticipants"
                  label="Maximum Participants"
                  type="number"
                  optional
                  value={newEvent.maxParticipants}
                  onChange={(e) => {
                    setNewEvent((prev) => ({ ...prev, maxParticipants: e.target.value }))
                    if (eventErrors.maxParticipants) setEventErrors((p) => ({ ...p, maxParticipants: null }))
                  }}
                  error={eventErrors.maxParticipants}
                  placeholder="e.g. 100"
                />
              </div>

              <div>
                <label className="form-label flex items-center gap-2">
                  Event Image
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">Optional</span>
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => setImageFile(event.target.files?.[0] || null)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                />
                {(imagePreview || (editingEvent && !imageFile)) && (
                  <div className="mt-3">
                    <p className="mb-1 text-xs font-medium text-gray-600">
                      {imageFile ? 'New image preview' : 'Current image'}
                    </p>
                    <div className="relative h-40 w-full max-w-sm overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                      <img
                        src={imagePreview || resolveImageUrl(editingEvent?.image)}
                        alt={imageFile ? 'Selected image preview' : 'Current event image'}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    {imageFile && (
                      <p className="mt-1 text-xs text-gray-500">{imageFile.name}</p>
                    )}
                  </div>
                )}
                {editingEvent?.image && !imageFile && (
                  <p className="mt-2 text-xs text-gray-500">Upload a new image to replace the current one.</p>
                )}
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
                  onClick={() => {
                    setIsModalOpen(false)
                    setEditingEvent(null)
                    setImageFile(null)
                    setEventErrors({})
                  }}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button type="submit" className="rounded-lg bg-primary-700 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-800">
                  {editingEvent ? 'Update Event' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h3 className="inline-flex items-center gap-2 text-lg font-bold text-red-700">
                <i className="material-icons-round">delete</i>
                Delete Event
              </h3>
              <button type="button" onClick={() => setConfirmDelete(null)} className="text-gray-500 hover:text-gray-700">
                <i className="material-icons-round">close</i>
              </button>
            </div>
            <div className="space-y-4 px-6 py-5">
              <p className="text-sm text-gray-700">
                Are you sure you want to delete the event <strong className="text-gray-900">{confirmDelete.title}</strong>?
                This action cannot be undone and will also remove all registrations.
              </p>
              <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(null)}
                  disabled={deletingId === confirmDelete.id}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={deletingId === confirmDelete.id}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {deletingId === confirmDelete.id ? 'Deleting...' : 'Delete Event'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {registrationsEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h3 className="inline-flex items-center gap-2 text-lg font-bold text-gray-900">
                  <i className="material-icons-round text-primary-700">groups</i>
                  Event Registrations
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  <span className="font-semibold text-gray-900">{registrationsEvent.title}</span>
                  <span className="mx-1">·</span>
                  <span>
                    {registrations.length}
                    {registrationsEvent.maxParticipants ? ` / ${registrationsEvent.maxParticipants}` : ''} registered
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={closeRegistrationsModal}
                aria-label="Close registrations"
                className="text-gray-500 hover:text-gray-700"
              >
                <i className="material-icons-round">close</i>
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
              {registrationsLoading ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <i className="material-icons-round animate-spin text-3xl">progress_activity</i>
                  <p className="mt-2 text-sm">Loading registrations...</p>
                </div>
              ) : registrations.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-12 text-center">
                  <i className="material-icons-round text-5xl text-gray-300">person_off</i>
                  <p className="mt-3 font-semibold text-gray-700">No registrations yet</p>
                  <p className="mt-1 text-sm text-gray-500">
                    When community members register for this event, they will appear here.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      <tr>
                        <th className="px-4 py-3">#</th>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">Phone</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {registrations.map((reg, idx) => (
                        <tr key={reg._id || reg.id || `${reg.email}-${idx}`} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                          <td className="px-4 py-3 font-medium text-gray-900">{reg.name || '—'}</td>
                          <td className="px-4 py-3 text-gray-700">
                            {reg.email ? (
                              <a href={`mailto:${reg.email}`} className="text-primary-700 hover:underline">
                                {reg.email}
                              </a>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-700">{reg.phone || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex justify-end border-t border-gray-200 px-6 py-4">
              <button
                type="button"
                onClick={closeRegistrationsModal}
                className="rounded-lg bg-primary-700 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
