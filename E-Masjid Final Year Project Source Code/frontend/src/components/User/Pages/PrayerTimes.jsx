import { useEffect, useMemo, useState } from 'react'
import { mockPrayerTimes } from '../../../mocks/index.js'
import { formatTime } from '../../../utils/formatters.js'

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
  const [countdown, setCountdown] = useState(nextPrayerCountdown(mockPrayerTimes.today))
  const prayers = useMemo(
    () => prayersConfig.map((item) => ({ ...item, time: mockPrayerTimes.today[item.key] })),
    []
  )

  useEffect(() => {
    const t = setInterval(() => {
      setCountdown(nextPrayerCountdown(mockPrayerTimes.today))
    }, 1000)
    return () => clearInterval(t)
  }, [])

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

      <section className="-mt-10 pb-14">
        <div className="container">
          <div className="mb-8 rounded-2xl bg-[#064e3b] text-white p-6 shadow-xl animate-fade-in">
            <p className="text-sm uppercase tracking-wide text-white/80">Next Prayer</p>
            <p className="mt-1 text-2xl font-primary font-bold">{countdown.nextPrayerName}</p>
            <div className="mt-4 flex items-center gap-2 sm:gap-4">
              {[
                { label: 'Hours', value: countdown.left.h },
                { label: 'Minutes', value: countdown.left.m },
                { label: 'Seconds', value: countdown.left.s },
              ].map((item, i) => (
                <div key={item.label} className="flex items-center gap-2">
                  <div className="rounded-xl bg-white/15 px-4 py-3 min-w-[72px] text-center">
                    <div className="text-2xl font-bold">{item.value}</div>
                    <div className="text-xs text-white/80">{item.label}</div>
                  </div>
                  {i < 2 && <span className="text-xl font-bold text-white/70">:</span>}
                </div>
              ))}
            </div>
          </div>

          <div className="mb-5 inline-flex items-center gap-2 text-[#064e3b]">
            <i className="material-icons-round">schedule</i>
            <h2 className="font-primary text-2xl font-bold">{'Today\'s Schedule'}</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {prayers.map((prayer, i) => {
              const isActive = prayer.key === countdown.nextPrayerKey
              return (
                <div
                  key={prayer.key}
                  className={`relative rounded-2xl border p-5 shadow-sm transition-all animate-fade-in-up ${
                    isActive
                      ? 'bg-[#047857] border-[#047857] text-white shadow-lg'
                      : 'bg-white border-gray-200 hover:-translate-y-0.5 hover:shadow-md'
                  }`}
                  style={{ animationDelay: `${i * 90}ms` }}
                >
                  {isActive && (
                    <span className="absolute -top-2 left-4 rounded-full bg-[#d4af37] px-3 py-1 text-xs font-semibold text-gray-900">
                      Next Prayer
                    </span>
                  )}
                  <div className="flex items-center gap-2">
                    <i className="material-icons-round">{prayer.icon}</i>
                    <span className={`font-semibold ${isActive ? 'text-white/90' : 'text-gray-700'}`}>{prayer.name}</span>
                  </div>
                  <div className="mt-3 text-3xl font-bold">{formatTime(prayer.time)}</div>
                </div>
              )
            })}

            <div className="rounded-2xl border border-amber-300 bg-gradient-to-br from-amber-100 to-amber-300 p-5 shadow-sm animate-fade-in-up" style={{ animationDelay: '460ms' }}>
              <div className="flex items-center gap-2">
                <i className="material-icons-round">wb_sunny</i>
                <span className="font-semibold text-gray-800">Sunrise</span>
              </div>
              <div className="mt-3 text-3xl font-bold text-gray-900">{formatTime('06:45')}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-primary-50 py-16">
        <div className="container">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 text-[#064e3b]">
              <i className="material-icons-round">calendar_month</i>
              <h2 className="font-primary text-2xl font-bold">{'Weekly Jama\'ah Schedule'}</h2>
            </div>
            <p className="text-sm text-gray-500">Times may vary slightly based on sunset</p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-[#064e3b] text-white">
                  <tr>
                    <th className="px-4 py-3 text-left">Day / Date</th>
                    <th className="px-4 py-3 text-center">Fajr</th>
                    <th className="px-4 py-3 text-center">Dhuhr</th>
                    <th className="px-4 py-3 text-center">Asr</th>
                    <th className="px-4 py-3 text-center">Maghrib</th>
                    <th className="px-4 py-3 text-center">Isha</th>
                  </tr>
                </thead>
                <tbody>
                  {mockPrayerTimes.week.map((day) => {
                    const today = day.date === new Date().toISOString().slice(0, 10)
                    const hasJummah = Boolean(day.jummah)
                    return (
                      <tr key={day.date} className={`border-b last:border-b-0 ${today ? 'bg-primary-50' : 'bg-white'}`}>
                        <td className="px-4 py-3 font-semibold text-gray-800">
                          {new Date(day.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            day: '2-digit',
                            month: 'short',
                          })}
                          {today && <span className="ml-2 rounded-full bg-[#047857] px-2 py-0.5 text-xs text-white">Today</span>}
                        </td>
                        <td className="px-4 py-3 text-center">{formatTime(day.fajr)}</td>
                        <td className="px-4 py-3 text-center">
                          {hasJummah ? (
                            <span className="inline-flex flex-col items-center">
                              <span className="font-semibold text-[#047857]">{formatTime(day.jummah)}</span>
                              <span className="text-[10px] uppercase tracking-wide text-[#047857]">Jummah</span>
                            </span>
                          ) : (
                            formatTime(day.zuhr)
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">{formatTime(day.asr)}</td>
                        <td className="px-4 py-3 text-center">{formatTime(day.maghrib)}</td>
                        <td className="px-4 py-3 text-center">{formatTime(day.isha)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container">
          <div className="rounded-2xl bg-gradient-to-br from-[#064e3b] to-[#047857] px-6 py-10 text-center text-white shadow-lg animate-fade-in">
            <i className="material-icons-round text-5xl text-white/90">format_quote</i>
            <p className="mx-auto mt-4 max-w-3xl text-2xl leading-relaxed italic">
              The most beloved of deeds to Allah are those that are most consistent, even if they are small.
            </p>
            <p className="mt-3 text-white/80">Sahih Muslim</p>
          </div>
        </div>
      </section>
    </div>
  )
}
