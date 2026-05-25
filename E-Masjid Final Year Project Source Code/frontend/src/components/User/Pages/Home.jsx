import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { mockPromotionalContent } from '../../../mocks/index.js'
import { useUI } from '../../../hooks/useUI.js'
import api from '../../../utils/api.js'
import { ROUTES } from '../../../utils/constants.js'
import { formatDate, formatTime } from '../../../utils/formatters.js'
import { getActiveMosqueId } from '../../../utils/mosque.js'

const prayerOrder = ['fajr', 'zuhr', 'asr', 'maghrib', 'isha']

function getNextPrayer(today) {
  const now = new Date()
  for (const prayer of prayerOrder) {
    const timeValue = today[prayer]
    if (!timeValue) continue
    const [hour, minute] = timeValue.split(':').map(Number)
    const prayerDate = new Date(now)
    prayerDate.setHours(hour, minute, 0, 0)
    if (prayerDate > now) return prayer
  }
  return 'fajr'
}

function getIslamicDateLabel() {
  try {
    return new Intl.DateTimeFormat('en-TN-u-ca-islamic', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date())
  } catch {
    return 'Islamic Date'
  }
}

function eventDateParts(dateValue) {
  const d = new Date(dateValue)
  return {
    day: d.toLocaleDateString('en-US', { day: '2-digit' }),
    month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
  }
}

function getCountdown(dateStr) {
  const now = new Date()
  const target = new Date(dateStr)
  const diff = target - now
  if (diff <= 0) return null
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  return { days, hours }
}

export default function Home() {
  const { showToast } = useUI()
  const [today, setToday] = useState({
    fajr: '05:30',
    zuhr: '12:45',
    asr: '15:45',
    maghrib: '18:25',
    isha: '19:45',
    jummah: '13:00',
  })
  const [announcements, setAnnouncements] = useState([])
  const [events, setEvents] = useState([])
  const nextPrayer = getNextPrayer(today)
  const topAnnouncements = announcements.slice(0, 3)
  const topEvents = events.slice(0, 2)
  const islamicDate = getIslamicDateLabel()
  const gregorianDate = formatDate(new Date().toISOString())
  const { mosquePhotos, message: promoMessage } = mockPromotionalContent

  // Carousel state
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % mosquePhotos.length)
  }, [mosquePhotos.length])

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + mosquePhotos.length) % mosquePhotos.length)
  }, [mosquePhotos.length])

  useEffect(() => {
    if (isPaused) return
    const timer = setInterval(nextSlide, 4500)
    return () => clearInterval(timer)
  }, [isPaused, nextSlide])

  useEffect(() => {
    let mounted = true
    const mosqueId = getActiveMosqueId()
    const params = mosqueId ? `mosqueId=${mosqueId}` : ''
    ;(async () => {
      try {
        const [prayerRes, eventsRes, announcementsRes] = await Promise.all([
          api.getPrayerTimes(params),
          api.getEvents(params),
          api.getAnnouncements(params),
        ])
        if (!mounted) return

        setToday(prayerRes.data?.today || today)
        setEvents(
          (Array.isArray(eventsRes.data) ? eventsRes.data : []).map((event) => ({
            ...event,
            id: event._id || event.id,
            date: event.date,
            time: event.time || '18:30',
          }))
        )
        setAnnouncements(
          (Array.isArray(announcementsRes.data) ? announcementsRes.data : []).map((item) => ({
            ...item,
            id: item._id || item.id,
            date: item.createdAt || item.date,
            publishedBy: item.publishedBy || 'Admin',
          }))
        )
      } catch (err) {
        showToast(err.message || 'Failed to load home data.', 'error')
      }
    })()
    return () => { mounted = false }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showToast])

  // Countdown for next event
  const [countdown, setCountdown] = useState(() => topEvents[0] ? getCountdown(topEvents[0].date) : null)
  const nextEventDate = topEvents[0]?.date
  useEffect(() => {
    const timer = setInterval(() => {
      if (nextEventDate) setCountdown(getCountdown(nextEventDate))
    }, 60000)
    return () => clearInterval(timer)
  }, [nextEventDate])

  return (
    <div className="bg-white">
      {/* ==================== HERO SECTION ==================== */}
      <section className="relative min-h-[620px] overflow-hidden flex items-center justify-center">
        <img
          src="https://images.unsplash.com/photo-1585036156171-384164a8c675?w=1920"
          alt="Beautiful mosque interior"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#064e3b]/95 to-[#047857]/85" />
        <div
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.06'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />

        <div className="relative z-10 container text-center py-14 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-5 py-2 backdrop-blur mb-6">
            <span className="h-2 w-2 rounded-full bg-[#d4af37] animate-pulse" />
            <span className="text-xs sm:text-sm tracking-wide font-semibold uppercase text-white">
              Serving the Community Since 1985
            </span>
          </div>

          <h1 className="font-primary text-white text-4xl md:text-6xl font-bold leading-tight">
            Welcome to <span className="text-[#d4af37]">Masjid Al-Noor</span>
          </h1>

          <p className="mt-5 mx-auto max-w-3xl text-lg md:text-xl text-white/90 leading-relaxed">
            Connecting hearts through faith, prayer, and community service. Your trusted digital platform for all mosque services.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link to={ROUTES.DONATE} className="btn btn-lg bg-[#d4af37] border-[#d4af37] text-[#1f2937] hover:bg-[#b7791f] hover:border-[#b7791f] shadow-lg hover:shadow-xl transition-all">
              <i className="material-icons-round text-xl">volunteer_activism</i>
              Donate Now
            </Link>
            <Link to={ROUTES.NIKAH_BOOKING} className="btn btn-lg border-2 border-white bg-transparent text-white hover:bg-white hover:text-[#047857] transition-all">
              <i className="material-icons-round text-xl">favorite</i>
              Book Nikah
            </Link>
          </div>
        </div>
      </section>

      {/* ==================== PRAYER TIMES WIDGET ==================== */}
      <section className="relative z-20 -mt-16 mb-16">
        <div className="container">
          <div className="overflow-hidden rounded-2xl border-t-[5px] border-[#d4af37] bg-white shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 px-6 py-5 border-b border-gray-200 bg-primary-50">
              <div className="flex items-center gap-3">
                <i className="material-icons-round text-[#047857] text-3xl">schedule</i>
                <h2 className="font-primary text-2xl font-bold text-[#064e3b]">Today&apos;s Prayer Times</h2>
              </div>
              <div className="flex items-center gap-2 text-[#047857] font-semibold">
                <i className="material-icons-round">calendar_today</i>
                <span>{islamicDate} | {gregorianDate}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
              {[
                { key: 'fajr', label: 'Fajr' },
                { key: 'zuhr', label: 'Dhuhr' },
                { key: 'asr', label: 'Asr' },
                { key: 'maghrib', label: 'Maghrib' },
                { key: 'isha', label: 'Isha' },
                { key: 'jummah', label: "Jumu'ah", isJummah: true },
              ].map((prayer) => {
                const isActive = prayer.key === nextPrayer
                const timeValue = today[prayer.key]
                return (
                  <div
                    key={prayer.key}
                    className={`relative border-r border-gray-200 last:border-r-0 px-4 py-6 text-center transition-all duration-300 ${
                      prayer.isJummah
                        ? 'bg-gradient-to-br from-amber-100 to-amber-300'
                        : isActive
                          ? 'bg-[#047857] scale-[1.02] shadow-lg'
                          : 'hover:bg-primary-50'
                    }`}
                  >
                    <p className={`text-xs tracking-[0.1em] uppercase font-semibold ${isActive ? 'text-white/80' : 'text-gray-500'}`}>
                      {prayer.label}
                    </p>
                    <p className={`mt-1 text-2xl font-bold ${isActive ? 'text-white' : 'text-gray-900'}`}>
                      {timeValue ? formatTime(timeValue) : '--:--'}
                    </p>
                    {isActive && (
                      <span className="mt-2 inline-flex rounded-full bg-[#d4af37] px-3 py-1 text-xs font-semibold text-gray-900 animate-pulse">
                        Next Prayer
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ==================== PROMOTIONAL SECTION (NEW) ==================== */}
      <section className="pb-20">
        <div className="container">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#d4af37]/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#b7791f]">
              <i className="material-icons-round text-base">auto_awesome</i>
              Discover Our Mosque
            </span>
            <h2 className="mt-4 font-primary text-4xl font-bold text-[#064e3b]">Life at Masjid Al-Noor</h2>
            <div className="mx-auto mt-3 h-1 w-16 rounded-full bg-[#d4af37]" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-8">
            {/* Photo Carousel */}
            <div
              className="relative overflow-hidden rounded-2xl shadow-2xl group"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              <div className="relative h-[400px] md:h-[480px]">
                {mosquePhotos.map((photo, index) => (
                  <div
                    key={photo.id}
                    className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                      index === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
                    }`}
                  >
                    <img src={photo.url} alt={photo.caption} className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                      <p className="text-white text-lg md:text-xl font-semibold drop-shadow-lg">{photo.caption}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Carousel Controls */}
              <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/40">
                <i className="material-icons-round">chevron_left</i>
              </button>
              <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/40">
                <i className="material-icons-round">chevron_right</i>
              </button>

              {/* Dots */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {mosquePhotos.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      index === currentSlide ? 'w-8 bg-[#d4af37]' : 'w-2.5 bg-white/50 hover:bg-white/80'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Promo Message + Event Highlights */}
            <div className="flex flex-col gap-6">
              {/* Promotional Message */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#064e3b] to-[#047857] p-8 text-white shadow-xl flex-1">
                <div className="absolute -top-6 -right-6 h-32 w-32 rounded-full bg-[#d4af37]/10" />
                <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white/5" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <i className="material-icons-round text-[#d4af37]">mosque</i>
                    <span className="text-[#d4af37] text-xs tracking-[0.15em] uppercase font-semibold">Welcome Message</span>
                  </div>
                  <p className="text-xl md:text-2xl leading-relaxed font-light italic">&ldquo;{promoMessage}&rdquo;</p>
                  <div className="mt-6 flex items-center gap-4">
                    <Link to={ROUTES.EVENTS} className="inline-flex items-center gap-2 rounded-full bg-[#d4af37] px-5 py-2.5 text-sm font-semibold text-[#064e3b] hover:bg-[#b7791f] transition-colors">
                      <i className="material-icons-round text-base">event</i>
                      Explore Events
                    </Link>
                    <Link to={ROUTES.FUND_REQUEST} className="inline-flex items-center gap-2 rounded-full border border-white/30 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10 transition-colors">
                      Need Help?
                    </Link>
                  </div>
                </div>
              </div>

              {/* Next Event Countdown */}
              {topEvents[0] && countdown && (
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md">
                  <div className="flex items-center gap-2 mb-3">
                    <i className="material-icons-round text-[#047857]">upcoming</i>
                    <span className="text-xs tracking-[0.1em] uppercase font-semibold text-[#047857]">Next Event</span>
                  </div>
                  <h3 className="font-primary text-lg font-bold text-gray-900">{topEvents[0].title}</h3>
                  <p className="mt-1 text-sm text-gray-500">{formatDate(topEvents[0].date)} • {formatTime(topEvents[0].time)}</p>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-primary-50 p-3 text-center">
                      <p className="text-3xl font-bold text-[#047857]">{countdown.days}</p>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Days</p>
                    </div>
                    <div className="rounded-xl bg-accent-50 p-3 text-center">
                      <p className="text-3xl font-bold text-[#b7791f]">{countdown.hours}</p>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Hours</p>
                    </div>
                  </div>
                  <Link to={ROUTES.EVENTS} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#047857] hover:text-[#d4af37] transition-colors">
                    Register Now <i className="material-icons-round text-base">arrow_forward</i>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ==================== ANNOUNCEMENTS SECTION ==================== */}
      <section className="pb-20">
        <div className="container">
          <div className="mb-10 flex items-end justify-between gap-4">
            <div>
              <h2 className="font-primary text-4xl font-bold text-[#064e3b]">Latest Announcements</h2>
              <div className="mt-3 h-1 w-16 rounded-full bg-[#d4af37]" />
            </div>
            <Link to={ROUTES.ANNOUNCEMENTS} className="btn btn-secondary btn-sm">
              View All
              <i className="material-icons-round">arrow_forward</i>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {topAnnouncements.map((item, index) => (
              <article key={item.id} className="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-white p-7 shadow-sm border border-gray-100 transition-all hover:-translate-y-1 hover:shadow-xl animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
                <div className={`absolute top-0 left-0 h-full w-1 ${
                  item.isUrgent ? 'bg-amber-500' :
                  item.title.toLowerCase().includes('event') ? 'bg-blue-500' :
                  item.title.toLowerCase().includes('community') ? 'bg-green-500' : 'bg-gray-400'
                }`} />
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                      item.isUrgent ? 'bg-amber-100 text-amber-700' :
                      item.title.toLowerCase().includes('event') ? 'bg-blue-100 text-blue-700' :
                      item.title.toLowerCase().includes('community') ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {item.isUrgent ? 'Urgent' : item.title.toLowerCase().includes('event') ? 'Event' : item.title.toLowerCase().includes('community') ? 'Community' : 'News'}
                    </span>
                    <span className="text-sm font-medium text-gray-500">{formatDate(item.date)}</span>
                  </div>
                  <h3 className="mb-3 font-primary text-xl font-bold text-gray-900 group-hover:text-[#047857] transition-colors">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed line-clamp-3">{item.content}</p>
                </div>
                <div className="mt-6 pt-5 border-t border-gray-50 flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">By {item.publishedBy || 'Admin'}</span>
                  <Link to={ROUTES.ANNOUNCEMENTS} className="inline-flex items-center gap-1 text-sm font-bold text-[#047857] group-hover:text-[#d4af37] transition-colors">
                    Read Details
                    <i className="material-icons-round text-base transition-transform group-hover:translate-x-1">arrow_forward</i>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== EVENTS & HADITH SECTION ==================== */}
      <section className="bg-primary-50 py-20">
        <div className="container grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-8">
          <div>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-primary text-3xl font-bold text-[#064e3b]">Upcoming Events</h2>
              <Link to={ROUTES.EVENTS} className="btn btn-secondary btn-sm">View All</Link>
            </div>

            <div className="space-y-4">
              {topEvents.map((event) => {
                const parts = eventDateParts(event.date)
                return (
                  <div key={event.id} className="flex flex-col md:flex-row gap-5 rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-primary-200 hover:shadow-md">
                    <div className="w-20 h-20 shrink-0 rounded-xl border-2 border-primary-200 bg-primary-50 flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold text-[#047857] leading-none">{parts.day}</span>
                      <span className="text-xs font-semibold tracking-wide text-[#047857]">{parts.month}</span>
                    </div>

                    <div className="flex-1">
                      <h3 className="font-primary text-lg font-semibold text-gray-900">{event.title}</h3>
                      <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-500">
                        <span className="inline-flex items-center gap-1">
                          <i className="material-icons-round text-base text-[#047857]">schedule</i>
                          {formatTime(event.time)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <i className="material-icons-round text-base text-[#047857]">location_on</i>
                          {event.location}
                        </span>
                      </div>
                      <p className="mt-2 text-gray-600">{event.description}</p>
                    </div>

                    <div className="flex items-center">
                      <Link to={ROUTES.EVENTS} className="btn btn-secondary btn-sm">Register</Link>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <aside className="rounded-2xl bg-gradient-to-br from-[#064e3b] to-[#047857] p-8 text-white relative overflow-hidden">
            <span className="absolute -top-8 right-4 text-[9rem] leading-none text-white/10 font-serif">&quot;</span>
            <p className="text-[#d4af37] text-xs tracking-[0.12em] uppercase font-semibold">Hadith of the Day</p>
            <p className="mt-5 text-2xl italic leading-relaxed">
              The best among you are those who have the best manners and character.
            </p>
            <p className="mt-4 text-white/70">Sahih Bukhari 3559</p>
          </aside>
        </div>
      </section>

      {/* ==================== FUND REQUEST CTA (NEW) ==================== */}
      <section className="py-16 bg-gradient-to-r from-amber-50 via-white to-amber-50">
        <div className="container">
          <div className="rounded-2xl border border-amber-200 bg-white p-8 md:p-12 shadow-sm flex flex-col md:flex-row items-center gap-8">
            <div className="flex-shrink-0 h-20 w-20 rounded-2xl bg-gradient-to-br from-[#d4af37] to-[#b7791f] flex items-center justify-center shadow-lg">
              <i className="material-icons-round text-white text-4xl">handshake</i>
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="font-primary text-2xl font-bold text-gray-900">Need Financial Assistance?</h3>
              <p className="mt-2 text-gray-600 leading-relaxed max-w-xl">
                If you or someone you know needs help with medical bills, education, or housing, you can submit a Zakat/Sadaqah fund request. Our committee will review and respond promptly.
              </p>
            </div>
            <Link to={ROUTES.FUND_REQUEST} className="btn btn-lg bg-[#d4af37] text-[#1f2937] hover:bg-[#b7791f] shadow-md hover:shadow-lg transition-all shrink-0">
              <i className="material-icons-round">request_quote</i>
              Submit Request
            </Link>
          </div>
        </div>
      </section>

      {/* ==================== CTA SECTION ==================== */}
      <section className="bg-gradient-to-br from-primary-50 to-green-100 py-20">
        <div className="container text-center">
          <h2 className="font-primary text-4xl font-bold text-[#064e3b]">Support Your Masjid</h2>
          <p className="mt-4 mx-auto max-w-2xl text-lg text-gray-600 leading-relaxed">
            Your generous donations help us maintain the mosque and serve the community better. Every contribution counts and is tracked transparently.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link to={ROUTES.DONATE} className="btn btn-primary btn-lg">
              <i className="material-icons-round text-xl">volunteer_activism</i>
              Donate Now
            </Link>
            <Link to={ROUTES.TRANSPARENCY} className="btn btn-secondary btn-lg">
              <i className="material-icons-round text-xl">visibility</i>
              View Transparency Report
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
