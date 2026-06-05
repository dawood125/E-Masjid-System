import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useUI } from '../../../hooks/useUI.js'
import api from '../../../utils/api.js'
import { ROUTES } from '../../../utils/constants.js'
import { formatDate } from '../../../utils/formatters.js'
import { getActiveMosqueId } from '../../../utils/mosque.js'

const filters = ['all', 'news', 'important', 'event', 'community']

function inferCategory(item) {
  const title = item.title.toLowerCase()
  const content = item.content.toLowerCase()

  if (item.isUrgent || title.includes('urgent') || title.includes('timing')) return 'important'
  if (title.includes('event') || title.includes('competition') || content.includes('register')) return 'event'
  if (title.includes('community') || content.includes('community')) return 'community'
  return 'news'
}

function categoryTagClass(category) {
  if (category === 'important') return 'bg-amber-100 text-amber-700'
  if (category === 'event') return 'bg-blue-100 text-blue-700'
  if (category === 'community') return 'bg-green-100 text-green-700'
  return 'bg-gray-100 text-gray-700'
}


export default function Announcements() {
  const { showToast } = useUI()
  const [query, setQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null)

  useEffect(() => {
    let mounted = true
    const mosqueId = getActiveMosqueId()
    const params = mosqueId ? `mosqueId=${mosqueId}` : ''
    ;(async () => {
      try {
        const res = await api.getAnnouncements(params)
        if (!mounted) return
        const list = Array.isArray(res.data) ? res.data : []
        setAnnouncements(
          list.map((item) => ({
            ...item,
            id: item._id || item.id,
            date: item.createdAt || item.date,
            publishedBy: item.publishedBy || 'Admin',
          }))
        )
      } catch (err) {
        showToast(err.message || 'Failed to load announcements.', 'error')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [showToast])

  const enriched = useMemo(
    () =>
      announcements.map((item) => ({
        ...item,
        category: inferCategory(item),
      })),
    [announcements]
  )

  const urgent = useMemo(() => enriched.find((item) => item.isUrgent) || enriched[0], [enriched])

  const filtered = useMemo(() => {
    const searched = enriched.filter((item) => {
      const text = `${item.title} ${item.content} ${item.publishedBy}`.toLowerCase()
      return text.includes(query.toLowerCase())
    })

    if (activeFilter === 'all') return searched
    return searched.filter((item) => item.category === activeFilter)
  }, [enriched, query, activeFilter])

  const pageSize = 6
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <div className="bg-white">
      <section className="py-12">
        <div className="container">
          <header className="mb-7">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="font-primary text-5xl font-bold text-[#064e3b]">Community Announcements</h1>
                <p className="mt-3 max-w-3xl text-lg text-gray-600">
                  Stay informed with the latest news, updates, and important announcements from Masjid Al-Noor, Sheikhupura.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-4 py-2 text-[#047857] border border-primary-200">
                <i className="material-icons-round">calendar_today</i>
                <span>15 Shawwal 1446 AH</span>
              </div>
            </div>
          </header>

          {urgent && (
            <article className="mb-7 overflow-hidden rounded-2xl border border-amber-200 bg-amber-50 shadow-sm animate-fade-in">
              <div className="p-8">
                <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-3 py-1 text-xs font-semibold uppercase text-white">
                  <i className="material-icons-round text-sm">campaign</i>
                  Urgent Notice
                </span>
                <h3 className="mt-4 font-primary text-3xl font-bold text-gray-900">{urgent.title}</h3>
                <p className="mt-3 text-gray-700 leading-relaxed text-lg max-w-4xl">{urgent.content}</p>
                <div className="mt-6">
                  <button type="button" onClick={() => setSelectedAnnouncement(urgent)} className="btn btn-primary bg-[#047857]">
                    <span>Read Full Details</span>
                    <i className="material-icons-round">arrow_forward</i>
                  </button>
                </div>
              </div>
            </article>
          )}

          <section className="mb-7 rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex flex-col gap-4">
              <div className="relative">
                <i className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">search</i>
                <input
                  className="w-full rounded-xl border border-gray-300 py-3 pl-12 pr-4 focus:border-[#047857] focus:outline-none focus:ring-2 focus:ring-[#047857]/20"
                  placeholder="Search announcements..."
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value)
                    setPage(1)
                  }}
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {filters.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => {
                      setActiveFilter(f)
                      setPage(1)
                    }}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                      activeFilter === f
                        ? 'bg-[#047857] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-primary-50 hover:text-[#047857]'
                    }`}
                  >
                    {f === 'all' ? 'All Updates' : f[0].toUpperCase() + f.slice(1)}
                  </button>
                ))}

                <div className="mx-1 h-6 w-px bg-gray-300" />

                <button type="button" className="inline-flex items-center gap-1 rounded-full border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-100">
                  <span>Newest First</span>
                  <i className="material-icons-round text-base">sort</i>
                </button>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {!loading && paged.length === 0 && (
              <div className="md:col-span-2 xl:col-span-3 rounded-2xl border border-gray-200 bg-white p-10 text-center">
                <i className="material-icons-round text-6xl text-gray-300">campaign</i>
                <h3 className="mt-3 font-primary text-2xl font-bold text-gray-900">No announcements found</h3>
                <p className="mt-2 text-gray-600">Try changing your search or filter options.</p>
              </div>
            )}
            {paged.map((item, idx) => (
              <article key={item.id} className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-gray-200 bg-white p-7 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl animate-fade-in-up" style={{ animationDelay: `${idx * 80}ms` }}>
                <div className={`absolute top-0 left-0 h-full w-1 ${
                  item.category === 'important' ? 'bg-amber-500' :
                  item.category === 'event' ? 'bg-blue-500' :
                  item.category === 'community' ? 'bg-green-500' : 'bg-gray-400'
                }`} />
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${categoryTagClass(item.category)}`}>
                      {item.category}
                    </span>
                    <p className="inline-flex items-center gap-1 text-sm font-medium text-gray-500">
                      <i className="material-icons-round text-base">calendar_today</i>
                      {formatDate(item.date)}
                    </p>
                  </div>
                  <h3 className="mb-3 font-primary text-xl font-bold text-gray-900 group-hover:text-[#047857] transition-colors">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed line-clamp-3">{item.content}</p>
                </div>
                <div className="mt-6 pt-5 border-t border-gray-50 flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">By {item.publishedBy || 'Admin'}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedAnnouncement(item)}
                    className="inline-flex items-center gap-1 font-bold text-[#047857] group-hover:text-[#d4af37] transition-colors"
                  >
                    Read Details
                    <i className="material-icons-round text-base transition-transform group-hover:translate-x-1">arrow_forward</i>
                  </button>
                </div>
              </article>
            ))}
          </section>

          <nav className="mt-8 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold disabled:opacity-40"
            >
              <i className="material-icons-round text-base">arrow_back</i>
              Previous
            </button>

            <div className="flex gap-1">
              {Array.from({ length: totalPages }).slice(0, 5).map((_, i) => {
                const pageNo = i + 1
                return (
                  <button
                    key={pageNo}
                    type="button"
                    onClick={() => setPage(pageNo)}
                    className={`h-9 w-9 rounded-lg text-sm font-semibold ${
                      currentPage === pageNo
                        ? 'bg-[#047857] text-white'
                        : 'border border-gray-300 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {pageNo}
                  </button>
                )
              })}
            </div>

            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold disabled:opacity-40"
            >
              Next
              <i className="material-icons-round text-base">arrow_forward</i>
            </button>
          </nav>

          <div className="mt-8 text-center">
            <Link to={ROUTES.HOME} className="text-[#047857] font-semibold hover:text-[#065f46]">Back to Home</Link>
          </div>
        </div>
      </section>

      {selectedAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-bold text-gray-900">Announcement Details</h3>
              <button type="button" onClick={() => setSelectedAnnouncement(null)} className="text-gray-500 hover:text-gray-700">
                <i className="material-icons-round">close</i>
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="flex items-center gap-3">
                <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${categoryTagClass(inferCategory(selectedAnnouncement))}`}>
                  {inferCategory(selectedAnnouncement)}
                </span>
                {selectedAnnouncement.isUrgent && (
                  <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-semibold uppercase text-white">
                    Urgent
                  </span>
                )}
              </div>
              <h2 className="font-primary text-2xl font-bold text-gray-900">{selectedAnnouncement.title}</h2>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="inline-flex items-center gap-1">
                  <i className="material-icons-round text-base">calendar_today</i>
                  {formatDate(selectedAnnouncement.date)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <i className="material-icons-round text-base">person</i>
                  {selectedAnnouncement.publishedBy || 'Admin'}
                </span>
              </div>
              <div className="border-t border-gray-100 pt-4">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">{selectedAnnouncement.content}</p>
              </div>
              <div className="flex justify-end border-t border-gray-200 pt-4">
                <button
                  type="button"
                  onClick={() => setSelectedAnnouncement(null)}
                  className="rounded-lg bg-[#047857] px-5 py-2 text-sm font-semibold text-white hover:bg-[#065f46]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
