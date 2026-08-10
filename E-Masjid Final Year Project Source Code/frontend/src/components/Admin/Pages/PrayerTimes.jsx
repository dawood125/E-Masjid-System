import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useUI } from '../../../hooks/useUI.js'
import { useAuth } from '../../../hooks/useAuth.js'
import api from '../../../utils/api.js'
import { formatTime } from '../../../utils/formatters.js'
import { getActiveMosqueId } from '../../../utils/mosque.js'

const PRAYER_ICONS = {
  fajr: 'wb_twilight',
  zuhr: 'wb_sunny',
  asr: 'wb_cloudy',
  maghrib: 'wb_twilight',
  isha: 'dark_mode',
  jummah: 'mosque',
  sunrise: 'wb_sunny',
}

function getInitialTimes() {
  return {
    fajr: '05:30',
    zuhr: '12:45',
    asr: '15:45',
    maghrib: '18:25',
    isha: '19:45',
    jummah: '13:00',
    sunrise: '06:45',
    eidUlFitr: '',
    eidUlAdha: '',
  }
}

// FIX-PRAYER-001 (BUG-PRAYER-002): use local YYYY-MM-DD (PKT), not UTC slice.
// At 23:30 PKT the UTC date is already tomorrow, which silently misattributed
// saves. `toLocaleDateString('sv-SE')` reliably yields YYYY-MM-DD in the
// browser's local timezone.
function localTodayISO() {
  return new Date().toLocaleDateString('sv-SE')
}

export default function PrayerTimes() {
  const { showToast } = useUI()
  const { user } = useAuth()

  const [selectedDate, setSelectedDate] = useState(localTodayISO)
  const [times, setTimes] = useState(getInitialTimes)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [eidEnabled, setEidEnabled] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date())

  // FIX-PRAYER-005 (BUG-PRAYER-004): compute the mosque-mismatch warning.
  // The admin's own mosqueId comes from the JWT-derived `user` object.
  // The navbar's active mosqueId is in localStorage. If they differ, show
  // a yellow banner and force the form to use the admin's own mosque.
  const adminMosqueId = user?.mosqueId || null
  const navbarMosqueId = getActiveMosqueId()
  const mosqueMismatch =
    adminMosqueId &&
    navbarMosqueId &&
    adminMosqueId !== navbarMosqueId

  // Fetch times for the selected date + admin's own mosque.
  // Re-fires when selectedDate, adminMosqueId, or mosqueMismatch changes
  // (the latter so switching the warning doesn't leave a stale cached form).
  useEffect(() => {
    let mounted = true
    // FIX-PRAYER-005: always use the admin's own mosqueId, never localStorage.
    const params = new URLSearchParams()
    if (adminMosqueId) params.set('mosqueId', adminMosqueId)
    if (selectedDate) params.set('date', selectedDate)
    ;(async () => {
      setLoading(true)
      try {
        const res = await api.getPrayerTimes(params.toString())
        if (!mounted) return
        const today = res.data?.today
        if (today) {
          setTimes((prev) => ({
            ...prev,
            fajr: today.fajr || prev.fajr,
            zuhr: today.zuhr || prev.zuhr,
            asr: today.asr || prev.asr,
            maghrib: today.maghrib || prev.maghrib,
            isha: today.isha || prev.isha,
            jummah: today.jummah || prev.jummah,
            sunrise: today.sunrise || prev.sunrise,
            eidUlFitr: today.eidUlFitr || '',
            eidUlAdha: today.eidUlAdha || '',
          }))
          if (today.eidUlFitr || today.eidUlAdha) setEidEnabled(true)
          if (today.updatedAt) setLastUpdated(new Date(today.updatedAt))
        }
      } catch (err) {
        showToast(err.message || 'Failed to load prayer times.', 'error')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [showToast, adminMosqueId, selectedDate])

  const currentTimes = useMemo(
    () => [
      { key: 'fajr', name: 'Fajr', value: times.fajr },
      { key: 'zuhr', name: 'Zuhr', value: times.zuhr },
      { key: 'asr', name: 'Asr', value: times.asr },
      { key: 'maghrib', name: 'Maghrib', value: times.maghrib },
      { key: 'isha', name: 'Isha', value: times.isha },
      { key: 'jummah', name: "Jumu'ah", value: times.jummah },
      { key: 'sunrise', name: 'Sunrise', value: times.sunrise },
    ],
    [times]
  )

  const updateTime = (field, value) => {
    setTimes((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      // FIX-PRAYER-001 (BUG-PRAYER-002): submit the admin's selected date,
      // not "today" (which was being computed with the buggy UTC slice).
      const payload = {
        date: selectedDate,
        fajr: times.fajr,
        zuhr: times.zuhr,
        asr: times.asr,
        maghrib: times.maghrib,
        isha: times.isha,
        jummah: times.jummah,
        sunrise: times.sunrise,
      }
      if (times.eidUlFitr) payload.eidUlFitr = times.eidUlFitr
      if (times.eidUlAdha) payload.eidUlAdha = times.eidUlAdha
      const res = await api.updatePrayerTimes(payload)
      setLastUpdated(new Date(res.data?.updatedAt || Date.now()))
      showToast(`Prayer times for ${selectedDate} updated successfully!`, 'success')
    } catch (err) {
      showToast(err.message || 'Failed to update prayer times.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setTimes(getInitialTimes())
    setEidEnabled(false)
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

      {/* FIX-PRAYER-005 (BUG-PRAYER-004): yellow warning banner when the
          navbar's active mosque differs from the admin's own mosqueId.
          Form always uses admin's own mosqueId (see useEffect above). */}
      {mosqueMismatch && (
        <section className="rounded-xl border-2 border-amber-300 bg-amber-50 p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-200 text-amber-800">
              <i className="material-icons-round">warning</i>
            </div>
            <div className="text-sm text-amber-900">
              <p className="font-semibold">You&apos;re viewing a different mosque in the navbar.</p>
              <p className="mt-1">
                This form <strong>always</strong> saves to <strong>your own mosque&apos;s</strong> schedule
                based on your login. Switching the navbar mosque will not change what gets saved here.
              </p>
            </div>
          </div>
        </section>
      )}

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

        {loading ? (
          <p className="text-sm text-gray-500">Loading prayer times for {selectedDate}...</p>
        ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-7">
          {currentTimes.map((prayer) => (
            <article
              key={prayer.key}
              className={`rounded-lg border p-4 ${
                prayer.key === 'jummah'
                  ? 'border-primary-700 bg-gradient-to-br from-primary-100 to-primary-50'
                  : prayer.key === 'sunrise'
                    ? 'border-amber-200 bg-amber-50'
                    : 'border-gray-100 bg-gray-50'
              }`}
            >
              <div className="flex flex-col items-center gap-3 text-center">
                <div
                  className={`inline-flex h-12 w-12 items-center justify-center rounded-full shadow-sm ${
                    prayer.key === 'jummah'
                      ? 'bg-primary-700 text-white'
                      : prayer.key === 'sunrise'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-white text-primary-700'
                  }`}
                >
                  <i className="material-icons-round text-base">{PRAYER_ICONS[prayer.key]}</i>
                </div>
                <div className="space-y-1">
                  <p
                    className={`text-xs font-semibold uppercase tracking-wide ${
                      prayer.key === 'jummah'
                        ? 'text-primary-900'
                        : prayer.key === 'sunrise'
                          ? 'text-amber-700'
                          : 'text-gray-500'
                    }`}
                  >
                    {prayer.name}
                  </p>
                  <p
                    className={`text-xl font-bold ${
                      prayer.key === 'jummah'
                        ? 'text-primary-700'
                        : prayer.key === 'sunrise'
                          ? 'text-amber-700'
                          : 'text-gray-900'
                    }`}
                  >
                    {formatTime(prayer.value)}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
        )}

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

        {/* FIX-PRAYER-006 (BUG-PRAYER-005): date picker so the admin can
            update any past, today, or future date. The form auto-populates
            with that date's existing row (or defaults if not yet set). */}
        <div className="mb-4 rounded-lg border border-primary-200 bg-primary-50 p-4">
          <label className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary-900">
              <i className="material-icons-round text-base">event</i>
              Editing date
            </span>
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="w-full sm:w-auto rounded-lg border border-primary-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
            />
            <span className="text-xs text-primary-700">
              Pick any date — past, today, or future (e.g. Ramadan 2027)
            </span>
          </label>
        </div>

        <form onSubmit={handleSubmit} className="divide-y divide-gray-100">
          <div className="space-y-4 py-6 first:pt-0">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Daily Prayer Times</h3>
              <p className="mt-1 text-sm text-gray-500">
                Set daily salah timings that will be displayed on the public website for the selected date.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
              {currentTimes
                .filter((item) => item.key !== 'jummah' && item.key !== 'sunrise')
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

          {/* FIX-PRAYER-006 (BUG-PRAYER-006): Sunrise field is now an editable input */}
          <div className="space-y-4 py-6">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Sunrise</h3>
              <p className="mt-1 text-sm text-gray-500">
                Per-mosque sunrise time for the selected date. If unset, the public Sunrise column is hidden.
              </p>
            </div>

            <label className="block max-w-xs space-y-2">
              <span className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
                <i className="material-icons-round text-base text-amber-600">wb_sunny</i>
                Sunrise Time
              </span>
              <input
                type="time"
                value={times.sunrise}
                onChange={(event) => updateTime('sunrise', event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
              />
            </label>
          </div>

          <div className="space-y-4 py-6">
            <div>
              <h3 className="text-base font-semibold text-gray-900">{'Jumu\'ah (Friday Prayer)'}</h3>
              <p className="mt-1 text-sm text-gray-500">{'Set the Jumu\'ah congregational prayer time. The public page shows this on Fridays in place of Dhuhr.'}</p>
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
                <h3 className="text-base font-semibold text-gray-900">Eid Prayer Timings</h3>
                <p className="mt-1 text-sm text-gray-500">Enable to set Eid ul-Fitr and Eid ul-Adha prayer times.</p>
              </div>

              <button
                type="button"
                onClick={() => setEidEnabled((prev) => !prev)}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-150 ${
                  eidEnabled ? 'bg-primary-700' : 'bg-gray-300'
                }`}
                aria-pressed={eidEnabled}
                aria-label="Toggle Eid prayer timings"
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-all duration-150 ${
                    eidEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {eidEnabled && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
                    <i className="material-icons-round text-base text-primary-700">celebration</i>
                    Eid-ul-Fitr Prayer Time
                  </span>
                  <input
                    type="time"
                    value={times.eidUlFitr}
                    onChange={(event) => updateTime('eidUlFitr', event.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
                  />
                </label>

                <label className="space-y-2">
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
                    <i className="material-icons-round text-base text-primary-700">celebration</i>
                    Eid-ul-Adha Prayer Time
                  </span>
                  <input
                    type="time"
                    value={times.eidUlAdha}
                    onChange={(event) => updateTime('eidUlAdha', event.target.value)}
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
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-primary-700 px-4 py-2 text-sm font-semibold text-white transition-all duration-150 hover:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i className="material-icons-round text-base">save</i>
              {saving ? 'Saving…' : `Update ${selectedDate}`}
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
              <li>Enable Eid timings to display Eid ul-Fitr and Eid ul-Adha prayer times.</li>
              <li>Changes apply immediately to the public prayer times page.</li>
              <li><strong>Future dates:</strong> pick a future date (e.g. next Ramadan) and pre-set its schedule. The public weekly table shows today + the next 7 days; future-only dates are admin-only.</li>
              <li><strong>Past dates:</strong> you can also update yesterday or older dates to fix any typos.</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}