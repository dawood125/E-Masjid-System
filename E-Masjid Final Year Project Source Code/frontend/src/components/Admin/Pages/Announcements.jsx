import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useUI } from '../../../hooks/useUI.js'
import { mockAnnouncements } from '../../../mocks'
import { formatDate } from '../../../utils/formatters.js'

const FILTERS = ['all', 'published', 'urgent', 'draft']
const PAGE_SIZE = 6

function getAnnouncementStatus(item, index) {
  if (item.isUrgent) {
    return 'urgent'
  }

  return index % 5 === 0 ? 'draft' : 'published'
}

export default function Announcements() {
  const { showToast } = useUI()

  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    publishDate: '',
    urgent: false,
    mode: 'publish',
  })

  const preparedAnnouncements = useMemo(() => {
    return mockAnnouncements.map((item, index) => {
      const status = getAnnouncementStatus(item, index)
      return {
        ...item,
        status,
      }
    })
  }, [])

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

  const createAnnouncement = (event) => {
    event.preventDefault()
    setIsModalOpen(false)
    setNewAnnouncement({
      title: '',
      content: '',
      publishDate: '',
      urgent: false,
      mode: 'publish',
    })
    showToast('Announcement created in demo mode.', 'success')
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
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-700 px-4 py-2 text-sm font-semibold text-white transition-all duration-150 hover:bg-primary-800"
          >
            <i className="material-icons-round text-base">add</i>
            New Announcement
          </button>
        </div>
      </div>

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
                  <i className="material-icons-round text-sm">
                    {item.status === 'urgent' ? 'priority_high' : item.status === 'draft' ? 'edit_note' : 'check_circle'}
                  </i>
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
                  {item.status !== 'urgent' && item.status !== 'draft' && (
                    <button
                      type="button"
                      onClick={() => showToast(`${item.title} marked urgent (demo).`, 'info')}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-amber-200 text-amber-700 hover:bg-amber-50"
                    >
                      <i className="material-icons-round text-base">priority_high</i>
                    </button>
                  )}

                  {item.status === 'draft' && (
                    <button
                      type="button"
                      onClick={() => showToast(`${item.title} published (demo).`, 'success')}
                      className="rounded-lg bg-primary-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-800"
                    >
                      Publish
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => showToast('Edit announcement flow is mock-only.', 'info')}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-600 hover:bg-gray-100"
                  >
                    <i className="material-icons-round text-base">edit</i>
                  </button>
                  <button
                    type="button"
                    onClick={() => showToast('Delete action is disabled in demo mode.', 'warning')}
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

      {!visible.length && (
        <section className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
          <p className="text-gray-500">No announcements found for this filter.</p>
        </section>
      )}

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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h3 className="inline-flex items-center gap-2 text-lg font-bold text-gray-900">
                <i className="material-icons-round text-primary-700">add_circle</i>
                Create New Announcement
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <i className="material-icons-round">close</i>
              </button>
            </div>

            <form onSubmit={createAnnouncement} className="space-y-4 px-6 py-5">
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
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button type="submit" className="rounded-lg bg-primary-700 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-800">
                  Create Announcement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
