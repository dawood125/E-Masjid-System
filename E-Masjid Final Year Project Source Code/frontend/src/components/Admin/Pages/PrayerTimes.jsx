import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useUI } from '../../../hooks/useUI.js'
import { mockPrayerTimes } from '../../../mocks'
import { formatTime } from '../../../utils/formatters.js'

const PRAYER_ICONS = {
  fajr: 'wb_twilight',
  zuhr: 'wb_sunny',
  asr: 'wb_cloudy',
  maghrib: 'wb_twilight',
  isha: 'dark_mode',
  jummah: 'mosque',
}

function getInitialTimes() {
  return {
    fajr: mockPrayerTimes.today.fajr,
    zuhr: mockPrayerTimes.today.zuhr,
    asr: mockPrayerTimes.today.asr,
    maghrib: mockPrayerTimes.today.maghrib,
    isha: mockPrayerTimes.today.isha,
    jummah: mockPrayerTimes.today.jummah,
  }
}

export default function PrayerTimes() {
  const { showToast } = useUI()

  const [times, setTimes] = useState(getInitialTimes)
  const [specialEnabled, setSpecialEnabled] = useState(false)
  const [specialTimes, setSpecialTimes] = useState({
    occasion: '',
    taraweeh: '21:30',
    suhoor: '04:45',
    iftar: mockPrayerTimes.today.maghrib,
  })
  const [lastUpdated, setLastUpdated] = useState(new Date())

  const currentTimes = useMemo(
    () => [
      { key: 'fajr', name: 'Fajr', value: times.fajr },
      { key: 'zuhr', name: 'Zuhr', value: times.zuhr },
      { key: 'asr', name: 'Asr', value: times.asr },
      { key: 'maghrib', name: 'Maghrib', value: times.maghrib },
      { key: 'isha', name: 'Isha', value: times.isha },
      { key: 'jummah', name: "Jumu'ah", value: times.jummah },
    ],
    [times]
  )

  const updateTime = (field, value) => {
    setTimes((prev) => ({ ...prev, [field]: value }))
  }

  const updateSpecialTime = (field, value) => {
    setSpecialTimes((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setLastUpdated(new Date())
    showToast('Prayer times updated successfully!', 'success')
  }

  const resetForm = () => {
    setTimes(getInitialTimes())
    setSpecialEnabled(false)
    setSpecialTimes({
      occasion: '',
      taraweeh: '21:30',
      suhoor: '04:45',
      iftar: mockPrayerTimes.today.maghrib,
    })
    showToast('Form has been reset to defaults.', 'info')
  }

  const lastUpdatedLabel = lastUpdated.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-1 text-sm text-gray-500">
            <span>Admin</span>
            <i className="material-icons-round text-base">chevron_right</i>
            <span>Prayer Times</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Prayer Times</h1>
        </div>
        <Link
          to="/prayer-times"
          target="_blank"
          rel="noreferrer"
          className="inline-flex w-fit items-center gap-2 rounded-lg border border-primary-300 px-4 py-2 text-sm font-semibold text-primary-700 transition-all duration-150 hover:bg-primary-50"
        >
          <i className="material-icons-round text-base">visibility</i>
          View Public Page
        </Link>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="inline-flex items-center gap-2 text-lg font-bold text-gray-900">
            <i className="material-icons-round text-primary-700">schedule</i>
            Current Prayer Times
          </h2>
          <span className="inline-flex items-center gap-2 rounded-full bg-success-light px-3 py-1 text-xs font-semibold uppercase tracking-wide text-success">
            <span className="h-2 w-2 animate-pulse rounded-full bg-success" />
            Live on Website
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {currentTimes.map((prayer) => (
            <article
              key={prayer.key}
              className={`rounded-lg border p-4 ${
                prayer.key === 'jummah'
                  ? 'border-primary-700 bg-gradient-to-br from-primary-100 to-primary-50'
                  : 'border-gray-100 bg-gray-50'
              }`}
            >
              <div className="flex flex-col items-center gap-3 text-center">
                <div
                  className={`inline-flex h-12 w-12 items-center justify-center rounded-full shadow-sm ${
                    prayer.key === 'jummah' ? 'bg-primary-700 text-white' : 'bg-white text-primary-700'
                  }`}
                >
                  <i className="material-icons-round text-base">{PRAYER_ICONS[prayer.key]}</i>
                </div>
                <div className="space-y-1">
                  <p
                    className={`text-xs font-semibold uppercase tracking-wide ${
                      prayer.key === 'jummah' ? 'text-primary-900' : 'text-gray-500'
                    }`}
                  >
                    {prayer.name}
                  </p>
                  <p
                    className={`text-xl font-bold ${
                      prayer.key === 'jummah' ? 'text-primary-700' : 'text-gray-900'
                    }`}
                  >
                    {formatTime(prayer.value)}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>

        <p className="mt-4 inline-flex items-center gap-1 border-t border-gray-100 pt-4 text-sm text-gray-500">
          <i className="material-icons-round text-base">update</i>
          Last updated: <strong>{lastUpdatedLabel}</strong>
        </p>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="inline-flex items-center gap-2 text-lg font-bold text-gray-900">
            <i className="material-icons-round text-primary-700">edit</i>
            Update Prayer Times
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="divide-y divide-gray-100">
          <div className="space-y-4 py-6 first:pt-0">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Daily Prayer Times</h3>
              <p className="mt-1 text-sm text-gray-500">
                Set daily salah timings that will be displayed on the public website.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
              {currentTimes
                .filter((item) => item.key !== 'jummah')
                .map((prayer) => (
                  <label key={prayer.key} className="space-y-2">
                    <span className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
                      <i className="material-icons-round text-base text-primary-700">{PRAYER_ICONS[prayer.key]}</i>
                      {prayer.name}
                      <span className="text-error">*</span>
                    </span>
                    <input
                      type="time"
                      value={times[prayer.key]}
                      onChange={(event) => updateTime(prayer.key, event.target.value)}
                      required
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
                    />
                  </label>
                ))}
            </div>
          </div>

          <div className="space-y-4 py-6">
            <div>
              <h3 className="text-base font-semibold text-gray-900">{'Jumu\'ah (Friday Prayer)'}</h3>
              <p className="mt-1 text-sm text-gray-500">{'Set the Jumu\'ah congregational prayer time.'}</p>
            </div>

            <label className="block max-w-xs space-y-2">
              <span className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
                <i className="material-icons-round text-base text-primary-700">mosque</i>
                {'Jumu\'ah Prayer'}
                <span className="text-error">*</span>
              </span>
              <input
                type="time"
                value={times.jummah}
                onChange={(event) => updateTime('jummah', event.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
              />
            </label>
          </div>

          <div className="space-y-4 py-6">
            <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Special Timings (Ramadan/Eid)</h3>
                <p className="mt-1 text-sm text-gray-500">Enable to show Taraweeh, Suhoor and Iftar timings.</p>
              </div>

              <button
                type="button"
                onClick={() => setSpecialEnabled((prev) => !prev)}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-150 ${
                  specialEnabled ? 'bg-primary-700' : 'bg-gray-300'
                }`}
                aria-pressed={specialEnabled}
                aria-label="Toggle special timings"
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-all duration-150 ${
                    specialEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {specialEnabled && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-gray-700">Special Occasion</span>
                  <select
                    value={specialTimes.occasion}
                    onChange={(event) => updateSpecialTime('occasion', event.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
                  >
                    <option value="">Select occasion</option>
                    <option value="ramadan">Ramadan</option>
                    <option value="eid-ul-fitr">Eid ul-Fitr</option>
                    <option value="eid-ul-adha">Eid ul-Adha</option>
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-gray-700">Taraweeh Time (Ramadan)</span>
                  <input
                    type="time"
                    value={specialTimes.taraweeh}
                    onChange={(event) => updateSpecialTime('taraweeh', event.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-gray-700">Suhoor Ends</span>
                  <input
                    type="time"
                    value={specialTimes.suhoor}
                    onChange={(event) => updateSpecialTime('suhoor', event.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-gray-700">Iftar Time</span>
                  <input
                    type="time"
                    value={specialTimes.iftar}
                    onChange={(event) => updateSpecialTime('iftar', event.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
                  />
                </label>
              </div>
            )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 py-6 pb-0">
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition-all duration-150 hover:bg-gray-100"
            >
              <i className="material-icons-round text-base">refresh</i>
              Reset
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg bg-primary-700 px-4 py-2 text-sm font-semibold text-white transition-all duration-150 hover:bg-primary-800"
            >
              <i className="material-icons-round text-base">save</i>
              Update Prayer Times
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-blue-200 bg-blue-50 p-5">
        <div className="flex items-start gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
            <i className="material-icons-round">lightbulb</i>
          </div>
          <div>
            <h4 className="text-base font-bold text-blue-900">Tips for Managing Prayer Times</h4>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-blue-800">
              <li>Update timings regularly as sunrise and sunset shift across the year.</li>
              <li>Maghrib should reflect local sunset and can vary by location.</li>
              <li>Enable special timings during Ramadan for Suhoor, Iftar and Taraweeh.</li>
              <li>Changes apply immediately to the public prayer times page.</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}
