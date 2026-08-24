import { useEffect, useMemo, useState } from 'react'
import api from '../../utils/api.js'
import { formatTime } from '../../utils/formatters.js'

const SLOTS = [
  { value: '10:00', label: '10:00 AM', hint: 'After Ishraq' },
  { value: '11:00', label: '11:00 AM', hint: '' },
  { value: '12:00', label: '12:00 PM', hint: 'Before Zuhr' },
  { value: '14:00', label: '02:00 PM', hint: 'After Zuhr' },
  { value: '15:00', label: '03:00 PM', hint: '' },
  { value: '16:00', label: '04:00 PM', hint: 'Before Asr' },
  { value: '17:00', label: '05:00 PM', hint: 'After Asr' },
  { value: '20:00', label: '08:00 PM', hint: 'After Maghrib' },
]

function toDayKey(date) {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function buildRange(offsetChunks = 0) {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() + offsetChunks * 14)
  const end = new Date(start)
  end.setDate(start.getDate() + 13)
  end.setHours(23, 59, 59, 999)
  return { from: toDayKey(start), to: toDayKey(end), startDate: start, endDate: end }
}

function initialOffset(value) {
  if (!value?.date) return 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(value.date)
  target.setHours(0, 0, 0, 0)
  const diffDays = Math.floor((target - today) / (1000 * 60 * 60 * 24))
  return diffDays < 0 ? 0 : Math.floor(diffDays / 14)
}

export default function SlotPicker({ value, onChange }) {
  const [availability, setAvailability] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [offset, setOffset] = useState(() => initialOffset(value))

  const range = useMemo(() => buildRange(offset), [offset])

  useEffect(() => {
    let mounted = true
    setLoading(true)
    ;(async () => {
      try {
        const res = await api.getNikahAvailability(range.from, range.to)
        if (!mounted) return
        setAvailability(res.data && typeof res.data === 'object' ? res.data : {})
        setError(null)
      } catch (err) {
        if (mounted) setError(err.message || 'Could not load slot availability')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [range.from, range.to])

  const days = useMemo(() => {
    const list = []
    const cursor = new Date(range.startDate)
    for (let i = 0; i < 14; i += 1) {
      const d = new Date(cursor)
      d.setDate(cursor.getDate() + i)
      list.push(d)
    }
    return list
  }, [range.startDate])

  function shiftWindow(delta) {
    setOffset((prev) => Math.max(0, prev + delta))
  }

  function bookedFor(dayKey, time) {
    const slots = availability[dayKey] || []
    return slots.find((slot) => slot.time === time) || null
  }

  function dayIsFull(dayKey) {
    if (loading) return false
    const slots = availability[dayKey] || []
    return SLOTS.every((slot) => slots.some((booked) => booked.time === slot.value))
  }

  function handlePickDay(day) {
    const dayKey = toDayKey(day)
    if (dayIsFull(dayKey)) return
    if (value?.date && toDayKey(value.date) === dayKey) return
    onChange({ date: dayKey, time: '' })
  }

  function handlePickSlot(dayKey, slotValue, booked) {
    if (booked) return
    onChange({ date: dayKey, time: slotValue })
  }

  const selectedDayKey = value?.date ? toDayKey(value.date) : null
  const selectedDaySlots = selectedDayKey ? availability[selectedDayKey] || [] : []

  return (
    <div className="space-y-5">
      {error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <i className="material-icons-round text-base align-middle">info</i> {error}
        </div>
      )}

      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <p className="text-sm font-medium text-gray-700">Choose a date</p>
            <span className="text-xs text-gray-500">
              {range.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {range.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {loading && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                <i className="material-icons-round text-sm animate-spin">progress_activity</i> Loading
              </span>
            )}
            <button
              type="button"
              onClick={() => shiftWindow(-1)}
              disabled={offset === 0}
              title="Previous 2 weeks"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-300"
            >
              <i className="material-icons-round text-base">chevron_left</i>
            </button>
            <button
              type="button"
              onClick={() => shiftWindow(1)}
              title="Next 2 weeks"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50"
            >
              <i className="material-icons-round text-base">chevron_right</i>
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {days.map((day) => {
            const dayKey = toDayKey(day)
            const isPast = dayKey < toDayKey(new Date())
            const full = dayIsFull(dayKey)
            const selected = selectedDayKey === dayKey
            const disabled = isPast || (loading ? false : full)

            return (
              <button
                key={dayKey}
                type="button"
                disabled={disabled}
                onClick={() => handlePickDay(day)}
                title={
                  disabled
                    ? isPast
                      ? 'Date is in the past'
                      : 'All slots booked'
                    : 'Select this date'
                }
                className={`relative flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-sm transition-all duration-150 ${
                  selected
                    ? 'border-[#047857] bg-primary-50 text-[#047857] shadow-sm'
                    : disabled
                    ? isPast
                      ? 'border-gray-100 bg-gray-50 text-gray-300'
                      : 'border-red-200 bg-red-50 text-red-700 cursor-not-allowed'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-primary-300 hover:bg-primary-50'
                }`}
              >
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                  {day.toLocaleDateString('en-US', { weekday: 'short' })}
                </span>
                <span className="text-lg font-bold leading-none">{day.getDate()}</span>
                <span className="text-[10px] text-gray-500">
                  {day.toLocaleDateString('en-US', { month: 'short' })}
                </span>
                {!loading && full && (
                  <span className="absolute top-1 right-1 inline-flex h-2 w-2 rounded-full bg-red-500" />
                )}
              </button>
            )
          })}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-500">
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded border border-gray-200 bg-white" /> Available
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded border border-primary-300 bg-primary-50" /> Selected
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded border border-red-200 bg-red-50" /> Fully booked
          </span>
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-gray-700">Choose a time slot</p>
        {!selectedDayKey ? (
          <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
            Select a date to see available time slots.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {SLOTS.map((slot) => {
              const booked = bookedFor(selectedDayKey, slot.value)
              const selected = value?.time === slot.value

              return (
                <button
                  key={slot.value}
                  type="button"
                  disabled={!!booked}
                  onClick={() => handlePickSlot(selectedDayKey, slot.value, booked)}
                  title={
                    booked
                      ? `Already booked by ${booked.scholarName || 'a scholar'}`
                      : 'Pick this slot'
                  }
                  className={`relative flex flex-col items-start gap-1 rounded-xl border px-3 py-3 text-left text-sm transition-all duration-150 ${
                    booked
                      ? 'border-red-200 bg-red-50 text-red-700 cursor-not-allowed'
                      : selected
                      ? 'border-[#047857] bg-primary-50 text-[#047857] shadow-sm'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-primary-300 hover:bg-primary-50'
                  }`}
                >
                  <span className="font-semibold">{slot.label}</span>
                  {slot.hint && (
                    <span className="text-[11px] text-gray-500">{slot.hint}</span>
                  )}
                  {booked ? (
                    <>
                      <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700">
                        <i className="material-icons-round text-[12px]">block</i> Booked
                      </span>
                      <span className="mt-1 text-[11px] text-red-700">
                        {booked.scholarName ? `Sheikh ${booked.scholarName}` : 'Assigned'}
                      </span>
                      <span className="truncate text-[10px] text-red-600">{booked.couple}</span>
                    </>
                  ) : (
                    selected && (
                      <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-primary-100 px-2 py-0.5 text-[11px] font-semibold text-[#047857]">
                        <i className="material-icons-round text-[12px]">check</i> Selected
                      </span>
                    )
                  )}
                </button>
              )
            })}
          </div>
        )}
        {selectedDayKey && selectedDaySlots.length > 0 && (
          <p className="mt-3 text-xs text-gray-500">
            {selectedDaySlots.length} of {SLOTS.length} slots already booked on this day.
          </p>
        )}
      </div>
    </div>
  )
}
