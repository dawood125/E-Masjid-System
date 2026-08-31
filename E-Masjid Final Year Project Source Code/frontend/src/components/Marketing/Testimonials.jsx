import { useEffect, useState, useRef, useCallback } from 'react'
import api from '../../utils/api.js'
import { useMosque } from '../../hooks/useMosque.js'

const PLACEHOLDER_TESTIMONIALS = [
  {
    _id: 'placeholder-1',
    name: 'Community Member',
    role: 'Awaiting your first testimonial',
    quote: 'When you log in as admin and add testimonials through the new admin panel, they will appear here in real time.',
    photo: '/assets/images/testimonials/testimonial-1.jpg',
  },
]

function QuoteMark() {
  return (
    <svg
      className="absolute -top-3 -left-2 h-12 w-12 text-[#047857]/15"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z" />
    </svg>
  )
}

function ChevronLeft(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z" />
    </svg>
  )
}
function ChevronRight(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
    </svg>
  )
}

export default function Testimonials() {
  const [items, setItems] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [pageIndex, setPageIndex] = useState(0)
  const [perPage, setPerPage] = useState(3)
  const [paused, setPaused] = useState(false)
  const timerRef = useRef(null)
  const { activeMosqueId } = useMosque()

  useEffect(() => {
    let mounted = true
    api.getMarketingTestimonials(activeMosqueId)
      .then((res) => { if (mounted) { setItems(res.data || []); setLoaded(true) } })
      .catch(() => { if (mounted) setLoaded(true) })
    return () => { mounted = false }
  }, [activeMosqueId])

  useEffect(() => {
    function handleResize() {
      const w = window.innerWidth
      setPerPage(w < 768 ? 1 : 3)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const display = items.length > 0 ? items : PLACEHOLDER_TESTIMONIALS
  const isPlaceholder = items.length === 0
  const totalPages = Math.max(1, Math.ceil(display.length / perPage))
  const safePageIndex = Math.min(pageIndex, totalPages - 1)

  const next = useCallback(() => setPageIndex((i) => (i + 1) % totalPages), [totalPages])
  const prev = useCallback(() => setPageIndex((i) => (i - 1 + totalPages) % totalPages), [totalPages])

  useEffect(() => {
    if (paused || totalPages <= 1) return
    timerRef.current = setInterval(next, 6000)
    return () => clearInterval(timerRef.current)
  }, [paused, next, totalPages])

  const visible = display.slice(safePageIndex * perPage, safePageIndex * perPage + perPage)

  return (
    <section className="py-20 bg-primary-50">
      <div className="container">
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 rounded-full bg-white border border-[#047857]/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#047857]">
            <i className="material-icons-round text-sm">favorite</i>
            Community Voices
          </span>
          <h2 className="mt-4 font-primary text-3xl md:text-4xl font-bold text-[#064e3b]">
            What Our Community Says
          </h2>
          <p className="mt-3 text-gray-600 max-w-2xl mx-auto">
            Real stories from the families, elders, and youth who make our mosque a home.
          </p>
          {isPlaceholder && loaded && (
            <p className="mt-2 text-xs text-gray-500 italic">
              No community stories shared yet. As members and visitors share their experiences, they will appear here.
            </p>
          )}
        </div>

        <div
          className="relative"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-7">
            {visible.map((t, i) => (
              <figure
                key={t._id || t.name}
                className="group relative overflow-hidden rounded-2xl bg-white p-7 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 border border-gray-100"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <QuoteMark />

                <blockquote className="relative text-gray-700 leading-relaxed italic min-h-[7.5rem]">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>

                <figcaption className="mt-6 flex items-center gap-3 pt-5 border-t border-gray-100">
                  <img
                    src={t.photo}
                    alt={t.name}
                    className="h-14 w-14 rounded-full object-cover ring-2 ring-[#047857]/20"
                    loading="lazy"
                    onError={(e) => { e.currentTarget.src = '/assets/images/testimonials/testimonial-1.jpg' }}
                  />
                  <div className="min-w-0">
                    <p className="font-bold text-[#064e3b] truncate">{t.name}</p>
                    <p className="text-xs text-gray-500 truncate">{t.role}</p>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>

          {totalPages > 1 && (
            <>
              <button
                onClick={prev}
                className="absolute left-0 md:-left-4 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-white text-[#047857] shadow-lg border border-gray-200 flex items-center justify-center hover:bg-primary-50 transition-colors"
                aria-label="Previous testimonials"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={next}
                className="absolute right-0 md:-right-4 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-white text-[#047857] shadow-lg border border-gray-200 flex items-center justify-center hover:bg-primary-50 transition-colors"
                aria-label="Next testimonials"
              >
                <ChevronRight className="h-6 w-6" />
              </button>

              <div className="mt-8 flex justify-center gap-2">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPageIndex(i)}
                    className={`h-2 rounded-full transition-all ${i === safePageIndex ? 'w-8 bg-[#d4af37]' : 'w-2 bg-gray-300 hover:bg-gray-400'}`}
                    aria-label={`Go to testimonials page ${i + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  )
}