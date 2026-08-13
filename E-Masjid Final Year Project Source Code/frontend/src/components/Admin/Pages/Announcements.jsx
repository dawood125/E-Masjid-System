import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useUI } from '../../../hooks/useUI.js'
import { useAuth } from '../../../hooks/useAuth.js'
import { useMosque } from '../../../hooks/useMosque.js'
import api from '../../../utils/api.js'
import { formatDate } from '../../../utils/formatters.js'

const FILTERS = ['all', 'published', 'urgent', 'draft']
const PAGE_SIZE = 6

function getAnnouncementStatus(item) {
  if (item.isUrgent) return 'urgent'
  return item.status || 'published'
}

function localTodayISO() {
  return new Date().toLocaleDateString('sv-SE')
}

export default function Announcements() {
  const { showToast } = useUI()
  const { user } = useAuth()

  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState(null)
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    publishDate: '',
    urgent: false,
    mode: 'publish',
  })
  // FIX-ANN-005 (BUG-ANN-008): delete-confirmation modal state
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [confirmDeleteText, setConfirmDeleteText] = useState('')

  // FIX-ANN-004 (BUG-ANN-005): always use admin's own mosqueId, not navbar's.
  const { activeMosqueId: navbarMosqueId } = useMosque()
  const adminMosqueId = user?.mosqueId || null
  const mosqueMismatch = Boolean(adminMosqueId && navbarMosqueId && adminMosqueId !== navbarMosqueId)

  const fetchAnnouncements = async () => {
    try {
      const params = adminMosqueId ? `mosqueId=${adminMosqueId}&includeAll=true` : 'includeAll=true'
      const res = await api.getAnnouncements(params)
      setAnnouncements(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      showToast(err.message || 'Failed to load announcements.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnnouncements()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminMosqueId])

  const preparedAnnouncements = useMemo(() => {
    return announcements.map((item) => {
      const status = getAnnouncementStatus(item)
      return {
        ...item,
        id: item._id || item.id,
        date: item.createdAt || item.date,
        status,
      }
    })
  }, [announcements])

  const filtered = useMemo(() => {
    return preparedAnnouncements.filter((item) => {
      const text = `${item.title} ${item.content}`.toLowerCase()
      const matchesQuery = !query.trim() || text.includes(query.trim().toLowerCase())
      const matchesFilter = filter === 'all' || item.status === filter
      return matchesQuery && matchesFilter
    })
  }, [preparedAnnouncements, query, filter])

  const total = preparedAnnouncements.length
  const publishedCount = preparedAnnouncements.filter((item) => item.status === 'published').length
  const urgentCount = preparedAnnouncements.filter((item) => item.status === 'urgent').length
  const draftCount = preparedAnnouncements.filter((item) => item.status === 'draft').length

  const visible = filtered.slice(0, page * PAGE_SIZE)
  const hasMore = visible.length < filtered.length

  const todayStr = localTodayISO()

  const openCreateModal = () => {
    setEditingAnnouncement(null)
    setNewAnnouncement({ title: '', content: '', publishDate: '', urgent: false, mode: 'publish' })
    setIsModalOpen(true)
  }

  const openEditModal = (item) => {
    setEditingAnnouncement(item)
    setNewAnnouncement({
      title: item.title,
      content: item.content,
      publishDate: item.publishDate ? new Date(item.publishDate).toISOString().slice(0, 10) : '',
      urgent: item.isUrgent || false, // FIX-ANN-003 (BUG-ANN-010): pre-populate the urgent checkbox
      mode: item.status === 'draft' ? 'draft' : 'publish',
    })
    setIsModalOpen(true)
  }

  const handleAnnouncementSubmit = async (event) => {
    event.preventDefault()

    try {
      const payload = {
        title: newAnnouncement.title,
        content: newAnnouncement.content,
        isUrgent: newAnnouncement.urgent,
        publishedBy: user?.name || 'Admin', // FIX-ANN-006 (BUG-ANN-009)
        status: newAnnouncement.mode === 'draft' ? 'draft' : 'published',
      }
      if (newAnnouncement.publishDate) payload.publishDate = newAnnouncement.publishDate

      if (editingAnnouncement) {
        const res = await api.updateAnnouncement(editingAnnouncement.id, payload)
        setAnnouncements((prev) =>
          prev.map((a) => ((a._id || a.id) === editingAnnouncement.id ? res.data : a))
        )
        showToast('Announcement updated successfully.', 'success')
      } else {
        const res = await api.createAnnouncement(payload)
        setAnnouncements((prev) => [res.data, ...prev])
        showToast('Announcement created successfully.', 'success')
      }

      setIsModalOpen(false)
      setEditingAnnouncement(null)
      setNewAnnouncement({ title: '', content: '', publishDate: '', urgent: false, mode: 'publish' })
    } catch (err) {
      showToast(err.message || 'Failed to save announcement.', 'error')
    }
  }

  // FIX-ANN-003 (BUG-ANN-004): wire quick actions to real API calls
  const handleMarkUrgent = async (item) => {
    try {
      const newUrgent = !item.isUrgent
      const res = await api.updateAnnouncement(item.id, { isUrgent: newUrgent, publishedBy: item.publishedBy || 'Admin' })
      setAnnouncements((prev) =>
        prev.map((a) => ((a._id || a.id) === item.id ? res.data : a))
      )
      showToast(newUrgent ? 'Marked as urgent.' : 'Removed from urgent.', 'success')
    } catch (err) {
      showToast(err.message || 'Failed to update.', 'error')
    }
  }

  const handlePublishDraft = async (item) => {
    try {
      const res = await api.updateAnnouncement(item.id, {
        status: 'published',
        publishDate: new Date().toISOString(),
        publishedBy: item.publishedBy || 'Admin',
      })
      setAnnouncements((prev) =>
        prev.map((a) => ((a._id || a.id) === item.id ? res.data : a))
      )
      showToast('Announcement published.', 'success')
    } catch (err) {
      showToast(err.message || 'Failed to publish.', 'error')
    }
  }

  const openDeleteConfirm = (item) => {
    setConfirmDelete(item)
    setConfirmDeleteText('')
  }

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return
    if (confirmDeleteText.trim() !== (confirmDelete.title || '').trim()) {
      showToast('Title does not match. Please type the announcement title exactly to confirm.', 'error')
      return
    }
    try {
      await api.deleteAnnouncement(confirmDelete.id)
      setAnnouncements((prev) => prev.filter((a) => (a._id || a.id) !== confirmDelete.id))
      showToast('Announcement deleted successfully.', 'success')
      setConfirmDelete(null)
      setConfirmDeleteText('')
    } catch (err) {
      showToast(err.message || 'Failed to delete announcement.', 'error')
    }
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-1 text-sm text-gray-500">
            <span>Admin</span>
            <i className="material-icons-round text-base">chevron_right</i>
            <span>Announcements</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Announcements</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/announcements"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-primary-300 px-4 py-2 text-sm font-semibold text-primary-700 transition-all duration-150 hover:bg-primary-50"
          >
            <i className="material-icons-round text-base">visibility</i>
            View on Website
          </Link>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-700 px-4 py-2 text-sm font-semibold text-white transition-all duration-150 hover:bg-primary-800"
          >
            <i className="material-icons-round text-base">add</i>
            New Announcement
          </button>
        </div>
      </div>

      {/* FIX-ANN-004 (BUG-ANN-005): mosque-mismatch warning banner */}
      {mosqueMismatch && (
        <section className="rounded-xl border-2 border-amber-300 bg-amber-50 p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-200 text-amber-800">
              <i className="material-icons-round">warning</i>
            </div>
            <div className="text-sm text-amber-900">
              <p className="font-semibold">You&apos;re viewing a different mosque in the navbar.</p>
              <p className="mt-1">
                This page <strong>always</strong> shows <strong>your own mosque&apos;s</strong> announcements
                based on your login. Switching the navbar mosque will not change what gets managed here.
              </p>
            </div>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{total}</p>
        </article>
        <article className="rounded-xl border border-emerald-200 bg-white p-4 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Published</p>
          <p className="mt-2 text-2xl font-bold text-emerald-700">{publishedCount}</p>
        </article>
        <article className="rounded-xl border border-red-200 bg-white p-4 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Urgent</p>
          <p className="mt-2 text-2xl font-bold text-red-700">{urgentCount}</p>
        </article>
        <article className="rounded-xl border border-amber-200 bg-white p-4 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Drafts</p>
          <p className="mt-2 text-2xl font-bold text-amber-700">{draftCount}</p>
        </article>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
          <label className="relative flex-1">
            <i className="material-icons-round pointer-events-none absolute left-3 top-2.5 text-gray-400">search</i>
            <input
              type="text"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setPage(1)
              }}
              placeholder="Search announcements..."
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-primary-500 focus:outline-none"
            />
          </label>

          <div className="inline-flex flex-wrap rounded-lg bg-gray-100 p-1">
            {FILTERS.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => {
                  setFilter(status)
                  setPage(1)
                }}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-all duration-150 ${
                  filter === status ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-600'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {!loading && visible.length === 0 && (
          <section className="xl:col-span-2 rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
            <p className="text-gray-500">No announcements found for this filter.</p>
          </section>
        )}
        {visible.map((item) => {
          const badgeStyle =
            item.status === 'urgent'
              ? 'bg-red-100 text-red-700'
              : item.status === 'draft'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-emerald-100 text-emerald-700'

          const cardStyle = item.status === 'urgent' ? 'border-red-200 bg-red-50/30' : 'border-gray-200 bg-white'

          return (
            <article key={item.id} className={`flex h-full flex-col rounded-xl border p-5 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md ${cardStyle}`}>
              <div className="mb-3 flex items-start justify-between gap-3">
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${badgeStyle}`}>
                  {item.status}
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                  <i className="material-icons-round text-sm">calendar_today</i>
                  {formatDate(item.date)}
                </span>
              </div>

              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{item.content}</p>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-3">
                <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                  <i className="material-icons-round text-sm">person</i>
                  Published by {item.publishedBy}
                </span>

                <div className="flex items-center gap-2">
                  {!item.isUrgent && item.status !== 'draft' && (
                    <button
                      type="button"
                      onClick={() => handleMarkUrgent(item)}
                      title="Mark as urgent"
                      aria-label="Mark as urgent"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-amber-200 text-amber-700 hover:bg-amber-50"
                    >
                      <i className="material-icons-round text-base">priority_high</i>
                    </button>
                  )}

                  {item.isUrgent && (
                    <button
                      type="button"
                      onClick={() => handleMarkUrgent(item)}
                      title="Remove urgent flag"
                      aria-label="Remove urgent flag"
                      className="inline-flex h-8 items-center gap-1 rounded-md border border-amber-300 bg-amber-50 px-2 text-xs font-semibold text-amber-700 hover:bg-amber-100"
                    >
                      <i className="material-icons-round text-base">priority_high</i>
                      Urgent
                    </button>
                  )}

                  {item.status === 'draft' && (
                    <button
                      type="button"
                      onClick={() => handlePublishDraft(item)}
                      title="Publish this draft"
                      aria-label="Publish this draft"
                      className="rounded-lg bg-primary-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-800"
                    >
                      Publish
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => openEditModal(item)}
                    title="Edit announcement"
                    aria-label="Edit announcement"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-600 hover:bg-gray-100"
                  >
                    <i className="material-icons-round text-base">edit</i>
                  </button>
                  <button
                    type="button"
                    onClick={() => openDeleteConfirm(item)}
                    title="Delete announcement"
                    aria-label="Delete announcement"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-red-200 text-red-600 hover:bg-red-50"
                  >
                    <i className="material-icons-round text-base">delete</i>
                  </button>
                </div>
              </div>
            </article>
          )
        })}
      </div>

      {visible.length > 0 && (
        <section className="flex flex-col items-center gap-3 py-2">
          {hasMore && (
            <button
              type="button"
              onClick={() => setPage((prev) => prev + 1)}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
            >
              <i className="material-icons-round text-base">expand_more</i>
              Load More Announcements
            </button>
          )}
          <p className="text-xs text-gray-500">Showing {visible.length} of {filtered.length} announcements</p>
        </section>
      )}

      {/* Create/Edit modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h3 className="inline-flex items-center gap-2 text-lg font-bold text-gray-900">
                <i className="material-icons-round text-primary-700">{editingAnnouncement ? 'edit' : 'add_circle'}</i>
                {editingAnnouncement ? 'Edit Announcement' : 'Create New Announcement'}
              </h3>
              <button type="button" onClick={() => { setIsModalOpen(false); setEditingAnnouncement(null) }} className="text-gray-500 hover:text-gray-700">
                <i className="material-icons-round">close</i>
              </button>
            </div>

            <form onSubmit={handleAnnouncementSubmit} className="space-y-4 px-6 py-5">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-gray-700">Announcement Title *</span>
                <input
                  type="text"
                  value={newAnnouncement.title}
                  onChange={(event) => setNewAnnouncement((prev) => ({ ...prev, title: event.target.value }))}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-gray-700">Content *</span>
                <textarea
                  rows={6}
                  value={newAnnouncement.content}
                  onChange={(event) => setNewAnnouncement((prev) => ({ ...prev, content: event.target.value }))}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
                />
              </label>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-gray-700">Publication Date</span>
                  <input
                    type="date"
                    value={newAnnouncement.publishDate}
                    min={todayStr}
                    onChange={(event) => setNewAnnouncement((prev) => ({ ...prev, publishDate: event.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
                  />
                </label>

                <label className="inline-flex items-center gap-3 self-end rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={newAnnouncement.urgent}
                    onChange={(event) => setNewAnnouncement((prev) => ({ ...prev, urgent: event.target.checked }))}
                  />
                  Mark as urgent
                </label>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-gray-700">Status</p>
                <div className="flex flex-wrap gap-3">
                  <label className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700">
                    <input
                      type="radio"
                      name="status"
                      value="publish"
                      checked={newAnnouncement.mode === 'publish'}
                      onChange={(event) => setNewAnnouncement((prev) => ({ ...prev, mode: event.target.value }))}
                    />
                    Publish Now
                  </label>
                  <label className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700">
                    <input
                      type="radio"
                      name="status"
                      value="draft"
                      checked={newAnnouncement.mode === 'draft'}
                      onChange={(event) => setNewAnnouncement((prev) => ({ ...prev, mode: event.target.value }))}
                    />
                    Save as Draft
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); setEditingAnnouncement(null) }}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button type="submit" className="rounded-lg bg-primary-700 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-800">
                  {editingAnnouncement ? 'Update Announcement' : 'Create Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FIX-ANN-005 (BUG-ANN-008): delete-confirmation modal — type title to confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h3 className="inline-flex items-center gap-2 text-lg font-bold text-red-700">
                <i className="material-icons-round">delete</i>
                Delete Announcement
              </h3>
              <button type="button" onClick={() => { setConfirmDelete(null); setConfirmDeleteText('') }} className="text-gray-500 hover:text-gray-700">
                <i className="material-icons-round">close</i>
              </button>
            </div>
            <div className="space-y-4 px-6 py-5">
              <p className="text-sm text-gray-700">
                This will permanently delete the announcement <strong className="text-gray-900">{confirmDelete.title}</strong>.
                This action cannot be undone.
              </p>
              <p className="text-sm text-gray-700">
                To confirm, type the announcement title exactly:
              </p>
              <p className="rounded-lg bg-gray-100 px-3 py-2 font-mono text-sm font-semibold text-gray-800">
                {confirmDelete.title}
              </p>
              <input
                type="text"
                value={confirmDeleteText}
                onChange={(e) => setConfirmDeleteText(e.target.value)}
                placeholder="Type the title to confirm"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-red-500 focus:outline-none"
                aria-label="Confirm by typing the announcement title"
              />
              <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
                <button
                  type="button"
                  onClick={() => { setConfirmDelete(null); setConfirmDeleteText('') }}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={confirmDeleteText.trim() !== (confirmDelete.title || '').trim()}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Delete Permanently
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
