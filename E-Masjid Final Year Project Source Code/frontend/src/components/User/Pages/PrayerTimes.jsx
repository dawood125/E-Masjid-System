import { useEffect, useMemo, useState } from 'react'
import { useUI } from '../../../hooks/useUI.js'
import api from '../../../utils/api.js'
import { formatTime } from '../../../utils/formatters.js'
import { getActiveMosqueId } from '../../../utils/mosque.js'

const prayersConfig = [
  { key: 'fajr', name: 'Fajr', icon: 'wb_twilight' },
  { key: 'zuhr', name: 'Dhuhr', icon: 'light_mode' },
  { key: 'asr', name: 'Asr', icon: 'wb_sunny' },
  { key: 'maghrib', name: 'Maghrib', icon: 'nights_stay' },
  { key: 'isha', name: 'Isha', icon: 'bedtime' },
]

function islamicDateLabel() {
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

function nextPrayerCountdown(todaySchedule) {
  const now = new Date()
  const upcoming = prayersConfig
    .map((prayer) => {
      const value = todaySchedule[prayer.key]
      if (!value) return null
      const [h, m] = value.split(':').map(Number)
      const dt = new Date(now)
      dt.setHours(h, m, 0, 0)
      return { ...prayer, dt }
    })
    .filter(Boolean)

  let next = upcoming.find((item) => item.dt > now)
  if (!next) {
    const first = upcoming[0]
    if (!first) {
      return { nextPrayerKey: 'fajr', nextPrayerName: 'Fajr', left: { h: '00', m: '00', s: '00' } }
    }
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(first.dt.getHours(), first.dt.getMinutes(), 0, 0)
    next = { ...first, dt: tomorrow }
  }

  const diff = Math.max(0, next.dt.getTime() - now.getTime())
  const totalSeconds = Math.floor(diff / 1000)
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0')
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0')
  const s = String(totalSeconds % 60).padStart(2, '0')

  return {
    nextPrayerKey: next.key,
    nextPrayerName: next.name,
    left: { h, m, s },
  }
}

export default function PrayerTimes() {
  const { showToast } = useUI()
  const defaultToday = useMemo(
    () => ({ fajr: '05:30', zuhr: '12:45', asr: '15:45', maghrib: '18:25', isha: '19:45', jummah: '13:00' }),
    []
  )
  const [todayTimes, setTodayTimes] = useState(defaultToday)
  const [weekTimes, setWeekTimes] = useState([])
  const [loading, setLoading] = useState(true)
  const [countdown, setCountdown] = useState(nextPrayerCountdown(defaultToday))

  const prayers = useMemo(
    () => prayersConfig.map((item) => ({ ...item, time: todayTimes[item.key] || '--:--' })),
    [todayTimes]
  )

  useEffect(() => {
    let mounted = true
    const mosqueId = getActiveMosqueId()
    const params = mosqueId ? `mosqueId=${mosqueId}` : ''
    ;(async () => {
      try {
        const res = await api.getPrayerTimes(params)
        if (!mounted) return
        const today = res.data?.today || defaultToday
        const week = Array.isArray(res.data?.week) ? res.data.week : []
        setTodayTimes(today)
        setWeekTimes(week)
      } catch (err) {
        showToast(err.message || 'Failed to load prayer times.', 'error')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [defaultToday, showToast])

  useEffect(() => {
    const t = setInterval(() => {
      setCountdown(nextPrayerCountdown(todayTimes))
    }, 1000)
    return () => clearInterval(t)
  }, [todayTimes])

  const islamic = islamicDateLabel()
  const gregorian = new Date().toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="bg-white">
      <section className="relative min-h-[360px] overflow-hidden flex items-center justify-center text-center">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1564769625905-50e93615e769?w=1920')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#064e3b]/90 to-[#047857]/80" />

        <div className="relative z-10 px-4 text-white animate-fade-in">
          <i className="material-icons-round text-6xl">mosque</i>
          <h1 className="mt-3 font-primary text-5xl font-bold">Prayer Times</h1>
          <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-[#d4af37]" />
          <p className="mt-4 text-lg text-white/90">{islamic} | {gregorian}</p>
        </div>
      </section>

      {/* Countdown Section */}
      <section className="-mt-14 relative z-20 pb-14">
        <div className="container">
          <div className="mx-auto max-w-2xl rounded-2xl bg-[#064e3b] text-white p-8 shadow-xl text-center border-t-[5px] border-[#d4af37] animate-fade-in">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-[#d4af37]">Next Prayer</h2>
            <p className="mt-2 font-primary text-4xl font-bold">{countdown.nextPrayerName}</p>
            <div className="mt-6 flex items-center justify-center gap-3 sm:gap-6">
              {[
                { label: 'HOURS', value: countdown.left.h },
                { label: 'MINUTES', value: countdown.left.m },
                { label: 'SECONDS', value: countdown.left.s },
              ].map((item, i) => (
                <div key={item.label} className="flex items-center gap-3 sm:gap-6">
                  <div className="flex flex-col items-center">
                    <div className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-xl bg-white/10 text-4xl sm:text-5xl font-bold shadow-inner">
                      {item.value}
                    </div>
                    <div className="mt-3 text-xs font-semibold uppercase tracking-wider text-white/70">{item.label}</div>
                  </div>
                  {i < 2 && <span className="text-3xl sm:text-4xl font-bold text-[#d4af37] pb-6">:</span>}
                </div>
              ))}
            </div>
          </div>

          <div className="mb-6 mt-16 inline-flex items-center gap-2 text-[#064e3b]">
            <i className="material-icons-round text-2xl">schedule</i>
            <h2 className="font-primary text-2xl font-bold">{'Today\'s Schedule'}</h2>
          </div>

          {/* Prayer Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
            {/* Fajr */}
            <div className={`relative rounded-2xl border p-6 shadow-sm transition-all animate-fade-in-up ${
              'fajr' === countdown.nextPrayerKey
                ? 'bg-[#047857] border-[#047857] text-white shadow-lg -translate-y-1'
                : 'bg-white border-gray-200 hover:-translate-y-1 hover:shadow-md'
            }`} style={{ animationDelay: '0ms' }}>
              {'fajr' === countdown.nextPrayerKey && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#d4af37] px-4 py-1 text-xs font-bold uppercase tracking-wider text-gray-900 shadow-md whitespace-nowrap">
                  Next Prayer
                </span>
              )}
              <div className="flex flex-col items-center text-center">
                <i className={`material-icons-round text-4xl mb-2 ${'fajr' === countdown.nextPrayerKey ? 'text-[#d4af37]' : 'text-[#047857]'}`}>wb_twilight</i>
                <span className={`font-semibold text-lg ${'fajr' === countdown.nextPrayerKey ? 'text-white' : 'text-gray-700'}`}>Fajr</span>
                <div className="mt-3 font-primary text-3xl font-bold">{formatTime(todayTimes.fajr)}</div>
              </div>
            </div>

            {/* Sunrise (Secondary Card) */}
            <div className="relative rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm animate-fade-in-up hover:-translate-y-1 hover:shadow-md transition-all" style={{ animationDelay: '90ms' }}>
              <div className="flex flex-col items-center text-center">
                <i className="material-icons-round text-4xl mb-2 text-amber-500">wb_sunny</i>
                <span className="font-semibold text-lg text-amber-900">Sunrise</span>
                <div className="mt-3 font-primary text-3xl font-bold text-amber-900">{formatTime('06:45')}</div>
              </div>
            </div>

            {/* Dhuhr, Asr, Maghrib, Isha */}
            {prayers.slice(1).map((prayer, i) => {
              const isActive = prayer.key === countdown.nextPrayerKey
              return (
                <div
                  key={prayer.key}
                  className={`relative rounded-2xl border p-6 shadow-sm transition-all animate-fade-in-up ${
                    isActive
                      ? 'bg-[#047857] border-[#047857] text-white shadow-lg -translate-y-1'
                      : 'bg-white border-gray-200 hover:-translate-y-1 hover:shadow-md'
                  }`}
                  style={{ animationDelay: `${(i + 2) * 90}ms` }}
                >
                  {isActive && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#d4af37] px-4 py-1 text-xs font-bold uppercase tracking-wider text-gray-900 shadow-md whitespace-nowrap">
                      Next Prayer
                    </span>
                  )}
                  <div className="flex flex-col items-center text-center">
                    <i className={`material-icons-round text-4xl mb-2 ${isActive ? 'text-[#d4af37]' : 'text-[#047857]'}`}>{prayer.icon}</i>
                    <span className={`font-semibold text-lg ${isActive ? 'text-white' : 'text-gray-700'}`}>{prayer.name}</span>
                    <div className="mt-3 font-primary text-3xl font-bold">{formatTime(prayer.time)}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Special Prayer Timings (Eid) */}
      {(todayTimes.eidUlFitr || todayTimes.eidUlAdha) && (
        <section className="pb-14">
          <div className="container">
            <div className="mb-6 inline-flex items-center gap-2 text-[#064e3b]">
              <i className="material-icons-round text-2xl">celebration</i>
              <h2 className="font-primary text-2xl font-bold">Special Prayer Timings</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl">
              {todayTimes.eidUlFitr && (
                <div className="rounded-2xl border-2 border-[#d4af37] bg-gradient-to-br from-amber-50 to-white p-6 shadow-sm">
                  <div className="flex flex-col items-center text-center">
                    <i className="material-icons-round text-4xl mb-2 text-[#d4af37]">celebration</i>
                    <span className="font-semibold text-lg text-gray-700">Eid ul-Fitr</span>
                    <div className="mt-3 font-primary text-3xl font-bold text-[#064e3b]">{formatTime(todayTimes.eidUlFitr)}</div>
                  </div>
                </div>
              )}
              {todayTimes.eidUlAdha && (
                <div className="rounded-2xl border-2 border-[#d4af37] bg-gradient-to-br from-amber-50 to-white p-6 shadow-sm">
                  <div className="flex flex-col items-center text-center">
                    <i className="material-icons-round text-4xl mb-2 text-[#d4af37]">celebration</i>
                    <span className="font-semibold text-lg text-gray-700">Eid ul-Adha</span>
                    <div className="mt-3 font-primary text-3xl font-bold text-[#064e3b]">{formatTime(todayTimes.eidUlAdha)}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Weekly Schedule Table */}
      <section className="bg-primary-50 py-16">
        <div className="container">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-3 text-[#064e3b]">
              <i className="material-icons-round text-3xl">calendar_month</i>
              <h2 className="font-primary text-3xl font-bold">{'Weekly Jama\'ah Schedule'}</h2>
            </div>
            <p className="text-sm font-medium text-gray-500 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200">Times may vary slightly based on sunset</p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full text-base">
                <thead className="bg-[#064e3b] text-white">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold">Day / Date</th>
                    <th className="px-6 py-4 text-center font-semibold">Fajr</th>
                    <th className="px-6 py-4 text-center font-semibold text-amber-200">Sunrise</th>
                    <th className="px-6 py-4 text-center font-semibold">Dhuhr</th>
                    <th className="px-6 py-4 text-center font-semibold">Asr</th>
                    <th className="px-6 py-4 text-center font-semibold">Maghrib</th>
                    <th className="px-6 py-4 text-center font-semibold">Isha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {(weekTimes.length > 0 ? weekTimes : []).map((day) => {
                    const today = day.date === new Date().toISOString().slice(0, 10)
                    const hasJummah = Boolean(day.jummah)
                    return (
                      <tr key={day.date} className={`transition-colors ${today ? 'bg-[#f0fdf4]' : 'bg-white hover:bg-gray-50'}`}>
                        <td className="px-6 py-4 font-semibold text-gray-800 whitespace-nowrap">
                          {new Date(day.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'short',
                          })}
                          {today && <span className="ml-3 rounded-full bg-[#047857] px-3 py-1 text-xs font-bold uppercase text-white shadow-sm">Today</span>}
                        </td>
                        <td className="px-6 py-4 text-center font-medium text-gray-700">{formatTime(day.fajr)}</td>
                        <td className="px-6 py-4 text-center font-medium text-amber-600 bg-amber-50/50">{formatTime('06:45')}</td>
                        <td className="px-6 py-4 text-center font-medium text-gray-700">
                          {hasJummah ? (
                            <span className="inline-flex flex-col items-center">
                              <span className="font-bold text-[#047857]">{formatTime(day.jummah)}</span>
                              <span className="text-[11px] font-bold uppercase tracking-wider text-[#047857] mt-1">Jummah</span>
                            </span>
                          ) : (
                            formatTime(day.zuhr)
                          )}
                        </td>
                        <td className="px-6 py-4 text-center font-medium text-gray-700">{formatTime(day.asr)}</td>
                        <td className="px-6 py-4 text-center font-medium text-gray-700">{formatTime(day.maghrib)}</td>
                        <td className="px-6 py-4 text-center font-medium text-gray-700">{formatTime(day.isha)}</td>
                      </tr>
                    )
                  })}
                  {!loading && weekTimes.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-6 text-center text-gray-500">No prayer schedule available yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container">
          <div className="rounded-3xl bg-gradient-to-br from-[#064e3b] to-[#047857] px-8 py-14 text-center text-white shadow-xl relative overflow-hidden animate-fade-in">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M40 40c0-8.8-7.2-16-16-16v-8c13.3 0 24 10.7 24 24h-8zm16 0c0-17.7-14.3-32-32-32V0c22.1 0 40 17.9 40 40h-8z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
            <i className="material-icons-round text-6xl text-[#d4af37] relative z-10 mb-4">format_quote</i>
            <p className="mx-auto max-w-3xl font-primary text-3xl leading-relaxed font-medium relative z-10">
              &ldquo;The most beloved of deeds to Allah are those that are most consistent, even if they are small.&rdquo;
            </p>
            <div className="mt-8 mx-auto h-1 w-16 rounded-full bg-[#d4af37] relative z-10" />
            <p className="mt-6 text-lg font-semibold text-[#d4af37] uppercase tracking-widest relative z-10">Sahih Muslim</p>
          </div>
        </div>
      </section>
    </div>
  )
}
