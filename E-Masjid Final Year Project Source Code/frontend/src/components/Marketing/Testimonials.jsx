import { useEffect, useState } from 'react'
import api from '../../utils/api.js'

/**
 * Community testimonials: portrait cards with circular photos + a quote.
 *
 * Phase 4.5: Now fetched from GET /api/marketing/testimonials (managed by
 * the admin panel). Falls back to a single placeholder card if the DB is
 * empty so the section is never completely blank.
 *
 * Each testimonial record stores: name, role, quote, photo URL. Photos can
 * be the default Gemini-generated images in /public/assets/images/testimonials/
 * OR any other URL (e.g. an uploaded image).
 */

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

export default function Testimonials() {
  const [items, setItems] = useState([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let mounted = true
    api.getMarketingTestimonials()
      .then((res) => { if (mounted) { setItems(res.data || []); setLoaded(true) } })
      .catch(() => { if (mounted) setLoaded(true) })
    return () => { mounted = false }
  }, [])

  // If no testimonials yet, show the placeholder
  const display = items.length > 0 ? items : PLACEHOLDER_TESTIMONIALS
  const isPlaceholder = items.length === 0

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
            <p className="mt-2 text-xs text-amber-600 font-medium">
              Showing placeholder. Log in as admin and add testimonials via the admin panel.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-7">
          {display.slice(0, 3).map((t, i) => (
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
      </div>
    </section>
  )
}
