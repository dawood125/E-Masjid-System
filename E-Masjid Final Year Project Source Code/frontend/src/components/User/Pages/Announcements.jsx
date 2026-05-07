import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { mockAnnouncements } from '../../../mocks/index.js'
import { ROUTES } from '../../../utils/constants.js'
import { formatDate } from '../../../utils/formatters.js'

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

const cardImages = [
  'https://images.unsplash.com/photo-1564769625905-50e93615e769?w=900',
  'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=900',
  'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=900',
  'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=900',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=900',
  'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=900',
]

export default function Announcements() {
  const [query, setQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [page, setPage] = useState(1)

  const enriched = useMemo(
    () =>
      mockAnnouncements.map((item, idx) => ({
        ...item,
        category: inferCategory(item),
        image: cardImages[idx % cardImages.length],
      })),
    []
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
              <div className="grid grid-cols-1 lg:grid-cols-[1.8fr_1fr]">
                <div className="p-6">
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-3 py-1 text-xs font-semibold uppercase text-white">
                    <i className="material-icons-round text-sm">campaign</i>
                    Urgent Notice
                  </span>
                  <h3 className="mt-3 font-primary text-3xl font-bold text-gray-900">{urgent.title}</h3>
                  <p className="mt-3 text-gray-700 leading-relaxed">{urgent.content}</p>
                  <div className="mt-4">
                    <button type="button" className="btn btn-primary bg-[#047857]">
                      <span>Read Full Details</span>
                      <i className="material-icons-round">arrow_forward</i>
                    </button>
                  </div>
                </div>
                <div className="min-h-[220px] bg-cover bg-center" style={{ backgroundImage: `url(${urgent.image})` }} />
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
            {paged.map((item, idx) => (
              <article key={item.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg animate-fade-in-up" style={{ animationDelay: `${idx * 80}ms` }}>
                <div className="relative h-48">
                  <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                  <span className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-semibold uppercase ${categoryTagClass(item.category)}`}>
                    {item.category}
                  </span>
                </div>
                <div className="p-5">
                  <p className="inline-flex items-center gap-1 text-sm text-gray-500">
                    <i className="material-icons-round text-base">calendar_today</i>
                    {formatDate(item.date)}
                  </p>
                  <h3 className="mt-2 font-primary text-xl font-semibold text-gray-900">{item.title}</h3>
                  <p className="mt-2 text-gray-600">{item.content}</p>
                  <button type="button" className="mt-4 inline-flex items-center gap-1 font-semibold text-[#047857] hover:text-[#d4af37]">
                    Read Details
                    <i className="material-icons-round text-base">arrow_forward</i>
                  </button>
                </div>
              </article>
            ))}
          </section>

          {paged.length === 0 && (
            <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-10 text-center">
              <i className="material-icons-round text-6xl text-gray-300">campaign</i>
              <h3 className="mt-3 font-primary text-2xl font-bold text-gray-900">No announcements found</h3>
              <p className="mt-2 text-gray-600">Try changing your search or filter options.</p>
            </div>
          )}

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
    </div>
  )
}
