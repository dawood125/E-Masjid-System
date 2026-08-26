import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useUI } from '../../../hooks/useUI.js'
import { useMosque } from '../../../hooks/useMosque.js'
import api from '../../../utils/api.js'
import { ROUTES } from '../../../utils/constants.js'
import { formatDate, formatTime } from '../../../utils/formatters.js'

import HeroSection from '../../Marketing/HeroSection.jsx'
import StatsSection from '../../Marketing/StatsSection.jsx'
import ImageCarousel from '../../Marketing/ImageCarousel.jsx'
import ImpactCounters from '../../Marketing/ImpactCounters.jsx'
import Testimonials from '../../Marketing/Testimonials.jsx'
import FeaturedCampaign from '../../Marketing/FeaturedCampaign.jsx'
import OtherCampaigns from '../../Marketing/OtherCampaigns.jsx'

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
  const { activeMosqueId } = useMosque()
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
  const [countdown, setCountdown] = useState(() => topEvents[0] ? getCountdown(topEvents[0].date) : null)
  const nextEventDate = topEvents[0]?.date

  useEffect(() => {
    let mounted = true
    const baseParams = activeMosqueId ? `mosqueId=${activeMosqueId}` : ''
    const eventsParams = baseParams ? `${baseParams}&limit=2&page=1` : 'limit=2&page=1'
    const announcementsParams = baseParams ? `${baseParams}&limit=3&page=1` : 'limit=3&page=1'
    ;(async () => {
      try {
        const [prayerRes, eventsRes, announcementsRes] = await Promise.all([
          api.getPrayerTimes(baseParams),
          api.getEvents(eventsParams),
          api.getAnnouncements(announcementsParams),
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
  
  }, [showToast, activeMosqueId])

  useEffect(() => {
    if (!nextEventDate) return
    const timer = setInterval(() => {
      setCountdown(getCountdown(nextEventDate))
    }, 60000)
    return () => clearInterval(timer)
  }, [nextEventDate])

  return (
    <div className="bg-white">

      <HeroSection />

      <StatsSection />

      <section className="relative z-20 pb-20 -mt-4 md:-mt-8">
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

      <ImpactCounters />

      <ImageCarousel />

      <section className="py-20 bg-white">
        <div className="container">
          <div className="mb-10 flex items-end justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-primary-50 border border-[#047857]/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#047857]">
                <i className="material-icons-round text-sm">campaign</i>
                Stay informed
              </span>
              <h2 className="mt-4 font-primary text-3xl md:text-4xl font-bold text-[#064e3b]">Latest Announcements</h2>
              <div className="mt-3 h-1 w-16 rounded-full bg-[#d4af37]" />
            </div>
            <Link to={ROUTES.ANNOUNCEMENTS} className="btn btn-secondary btn-sm">
              View All
              <i className="material-icons-round hidden sm:inline">arrow_forward</i>
            </Link>
          </div>

          {topAnnouncements.length === 0 ? (
            <p className="text-center text-gray-500 py-12">No announcements yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {topAnnouncements.map((item, index) => (
                <article
                  key={item.id}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-white p-7 shadow-sm border border-gray-100 transition-all hover:-translate-y-1 hover:shadow-xl animate-fade-in-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
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
          )}
        </div>
      </section>

      <FeaturedCampaign />

      <OtherCampaigns />

      <Testimonials />

      <section className="bg-primary-50 py-20">
        <div className="container grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-8">
          <div>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-primary text-3xl font-bold text-[#064e3b]">Upcoming Events</h2>
              <Link to={ROUTES.EVENTS} className="btn btn-secondary btn-sm">View All</Link>
            </div>

            {topEvents.length === 0 ? (
              <p className="text-gray-500 py-8 text-center">No upcoming events yet.</p>
            ) : (
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
            )}

            {topEvents[0] && countdown && (
              <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-md">
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

          <aside className="rounded-2xl bg-gradient-to-br from-[#064e3b] to-[#047857] p-8 text-white relative overflow-hidden">
            <span className="absolute -top-8 right-4 text-[9rem] leading-none text-white/10 font-serif">&quot;</span>
            <p className="text-[#d4af37] text-xs tracking-[0.12em] uppercase font-semibold">Hadith of the Day</p>
            <p className="mt-5 text-2xl italic leading-relaxed">
              {[
                { text: 'The best among you are those who have the best manners and character.', source: 'Sahih Bukhari 3559' },
                { text: 'None of you truly believes until he loves for his brother what he loves for himself.', source: 'Sahih Bukhari 13' },
                { text: 'The strong man is not one who wrestles well, but the strong man is one who controls himself when he is angry.', source: 'Sahih Bukhari 6114' },
                { text: 'Whoever believes in Allah and the Last Day, let him speak good or remain silent.', source: 'Sahih Bukhari 6018' },
                { text: 'Make things easy and do not make them difficult, cheer people up and do not drive them away.', source: 'Sahih Bukhari 69' },
                { text: 'The most beloved of deeds to Allah are those that are most consistent, even if they are small.', source: 'Sahih Bukhari 6464' },
                { text: 'A Muslim is one from whose tongue and hands other Muslims are safe.', source: 'Sahih Bukhari 10' },
              ][Math.floor((new Date().getTime() / 86400000)) % 7].text}
            </p>
            <p className="mt-4 text-white/70">
              {[
                'Sahih Bukhari 3559', 'Sahih Bukhari 13', 'Sahih Bukhari 6114',
                'Sahih Bukhari 6018', 'Sahih Bukhari 69', 'Sahih Bukhari 6464', 'Sahih Bukhari 10',
              ][Math.floor((new Date().getTime() / 86400000)) % 7]}
            </p>
          </aside>
        </div>
      </section>

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
