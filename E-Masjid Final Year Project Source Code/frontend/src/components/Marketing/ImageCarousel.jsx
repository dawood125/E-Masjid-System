import { useState, useEffect, useRef, useCallback } from 'react'
import api from '../../utils/api.js'
import { useMosque } from '../../hooks/useMosque.js'

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

export default function ImageCarousel() {
  const [slides, setSlides] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const timerRef = useRef(null)
  const { activeMosqueId } = useMosque()

  useEffect(() => {
    let mounted = true
    setLoaded(false)
    api.getMarketingHeroSlides(activeMosqueId)
      .then((res) => {
        if (!mounted) return
        const list = Array.isArray(res?.data) ? res.data : []
        setSlides(list.map((s) => ({
          _id: s._id,
          image: s.image,
          caption: s.caption || '',
          link: s.link || '',
        })))
      })
      .catch(() => {
        if (mounted) setSlides([])
      })
      .finally(() => {
        if (mounted) setLoaded(true)
      })
    return () => { mounted = false }
  }, [activeMosqueId])

  const next = useCallback(() => setIndex((i) => (i + 1) % slides.length), [slides.length])
  const prev = useCallback(() => setIndex((i) => (i - 1 + slides.length) % slides.length), [slides.length])

  useEffect(() => {
    if (paused) return
    timerRef.current = setInterval(next, 4500)
    return () => clearInterval(timerRef.current)
  }, [paused, next])

  if (!loaded || slides.length === 0) return null

  return (
    <section
      className="relative py-20 bg-white"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="container">
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-50 border border-[#047857]/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#047857]">
            <i className="material-icons-round text-sm">photo_library</i>
            Life at the Masjid
          </span>
          <h2 className="mt-4 font-primary text-3xl md:text-4xl font-bold text-[#064e3b]">
            Moments from Our Community
          </h2>
        </div>

        <div className="relative overflow-hidden rounded-3xl shadow-2xl group">
          <div className="relative h-[420px] md:h-[520px] bg-black">
            {slides.map((s, i) => {
              const imgEl = (
                <img
                  src={s.image}
                  alt={s.caption || ''}
                  loading="lazy"
                  className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${i === index ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`}
                />
              )
              return (
                <div
                  key={s._id || s.image}
                  className={`absolute inset-0 transition-opacity duration-700 ${i === index ? 'opacity-100' : 'opacity-0'}`}
                >
                  {s.link ? (
                    <a
                      href={s.link}
                      target={/^https?:\/\//i.test(s.link) ? '_blank' : undefined}
                      rel={/^https?:\/\//i.test(s.link) ? 'noopener noreferrer' : undefined}
                      className="block h-full w-full"
                      aria-label={s.caption || 'Open link'}
                    >
                      {imgEl}
                    </a>
                  ) : (
                    imgEl
                  )}
                </div>
              )
            })}
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/85 via-black/50 to-transparent pointer-events-none" />
            <div className="absolute bottom-0 inset-x-0 p-6 md:p-8 text-white pointer-events-none">
              <p className="font-primary text-xl md:text-2xl font-semibold drop-shadow-lg max-w-3xl">
                {slides[index].caption}
              </p>
              {slides[index].link && (
                <p className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[#d4af37]">
                  <i className="material-icons-round text-base">open_in_new</i>
                  Click to learn more
                </p>
              )}
            </div>
          </div>

          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-white/20 backdrop-blur text-white flex items-center justify-center hover:bg-white/40 transition-colors"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-white/20 backdrop-blur text-white flex items-center justify-center hover:bg-white/40 transition-colors"
            aria-label="Next slide"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
            {slides.map((s, i) => (
              <button
                key={s._id || s.image}
                onClick={() => setIndex(i)}
                className={`h-2 rounded-full transition-all ${i === index ? 'w-8 bg-[#d4af37]' : 'w-2 bg-white/50 hover:bg-white/80'}`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
