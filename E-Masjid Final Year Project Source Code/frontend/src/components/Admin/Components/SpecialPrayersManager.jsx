import { useEffect, useMemo, useState } from 'react'
import { useUI } from '../../../hooks/useUI.js'
import api from '../../../utils/api.js'
import FormField from '../../Common/FormField.jsx'

const TYPE_OPTIONS = [
  { value: 'eid-fitr', label: 'Eid ul-Fitr', icon: 'celebration' },
  { value: 'eid-adha', label: 'Eid ul-Adha', icon: 'celebration' },
  { value: 'shab-meraj', label: 'Shab-e-Meraj', icon: 'auto_awesome' },
  { value: 'shab-barat', label: 'Shab-e-Barat', icon: 'nightlight' },
  { value: 'tarawih', label: 'Tarawih (Ramadan)', icon: 'menu_book' },
  { value: 'milad-un-nabi', label: 'Milad-un-Nabi', icon: 'volunteer_activism' },
  { value: 'janazah', label: 'Janazah (Funeral)', icon: 'groups' },
  { value: 'other', label: 'Custom', icon: 'auto_awesome' },
]

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function todayISO() {
  return new Date().toLocaleDateString('sv-SE')
}

function emptyForm() {
  return {
    _id: null,
    name: '',
    type: 'eid-fitr',
    date: todayISO(),
    time: '07:00',
    description: '',
    isActive: true,
  }
}

function validate(form) {
  const errs = {}
  if (!form.name || form.name.trim().length < 2) errs.name = 'Name is required (min 2 characters)'
  if (!DATE_RE.test(form.date)) errs.date = 'Pick a valid date'
  if (!TIME_RE.test(form.time)) errs.time = 'Enter a valid time (HH:MM)'
  if (form.description && form.description.length > 500) errs.description = 'Description must be under 500 characters'
  return errs
}

function formatDateLabel(iso) {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      weekday: 'short', year: 'numeric', month: 'long', day: 'numeric',
    })
  } catch {
    return iso
  }
}

function daysUntil(iso) {
  const target = new Date(iso)
  target.setHours(0, 0, 0, 0)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const diff = Math.round((target - now) / 86400000)
  if (diff === 0) return { label: 'Today', tone: 'urgent' }
  if (diff === 1) return { label: 'Tomorrow', tone: 'urgent' }
  if (diff > 1) return { label: `In ${diff} days`, tone: 'soon' }
  return { label: `${Math.abs(diff)} day${Math.abs(diff) === 1 ? '' : 's'} ago`, tone: 'past' }
}

function typeBadgeClass(type) {
  if (type === 'eid-fitr' || type === 'eid-adha') return 'bg-amber-100 text-amber-800 border-amber-300'
  if (type === 'tarawih') return 'bg-emerald-100 text-emerald-800 border-emerald-300'
  if (type === 'janazah') return 'bg-slate-100 text-slate-700 border-slate-300'
  return 'bg-blue-100 text-blue-800 border-blue-300'
}

export default function SpecialPrayersManager() {
  const { showToast } = useUI()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [showForm, setShowForm] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  async function loadList() {
    setLoading(true)
    try {
      const res = await api.getAdminSpecialPrayers('includeInactive=true')
      setItems(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      showToast(err.message || 'Failed to load special prayers.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadList()
  }, [])

  function resetForm() {
    setForm(emptyForm())
    setErrors({})
  }

  function startCreate() {
    resetForm()
    setShowForm(true)
  }

  function startEdit(item) {
    setForm({
      _id: item._id,
      name: item.name || '',
      type: item.type || 'other',
      date: item.date ? new Date(item.date).toLocaleDateString('sv-SE') : todayISO(),
      time: item.time || '07:00',
      description: item.description || '',
      isActive: item.isActive !== false,
    })
    setErrors({})
    setShowForm(true)
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
  }

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const v = validate(form)
    if (Object.keys(v).length > 0) {
      setErrors(v)
      showToast('Please fix the highlighted fields', 'error')
      return
    }
    setErrors({})
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        type: form.type,
        date: form.date,
        time: form.time,
        description: form.description.trim(),
        isActive: form.isActive,
      }
      if (form._id) {
        await api.updateSpecialPrayer(form._id, payload)
        showToast('Special prayer updated.', 'success')
      } else {
        await api.createSpecialPrayer(payload)
        showToast('Special prayer announced.', 'success')
      }
      resetForm()
      setShowForm(false)
      await loadList()
    } catch (err) {
      showToast(err.message || 'Failed to save special prayer.', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(item) {
    try {
      await api.toggleSpecialPrayer(item._id)
      showToast(`${item.name} is now ${item.isActive ? 'hidden' : 'visible'}.`, 'info')
      await loadList()
    } catch (err) {
      showToast(err.message || 'Failed to toggle.', 'error')
    }
  }

  async function handleDelete(id) {
    try {
      await api.deleteSpecialPrayer(id)
      showToast('Special prayer deleted.', 'success')
      setConfirmDeleteId(null)
      await loadList()
    } catch (err) {
      showToast(err.message || 'Failed to delete.', 'error')
    }
  }

  const upcoming = useMemo(
    () => items
      .filter((it) => it.isActive && new Date(it.date) >= new Date(new Date().setHours(0, 0, 0, 0)))
      .sort((a, b) => new Date(a.date) - new Date(b.date)),
    [items]
  )
  const past = useMemo(
    () => items
      .filter((it) => !it.isActive || new Date(it.date) < new Date(new Date().setHours(0, 0, 0, 0)))
      .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [items]
  )

  function renderRow(item, isPast) {
    const du = daysUntil(item.date)
    return (
      <div
        key={item._id}
        className={`rounded-lg border p-4 transition-all ${
          item.isActive ? 'border-gray-200 bg-white shadow-sm' : 'border-gray-200 bg-gray-50 opacity-70'
        }`}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-base font-semibold text-gray-900">{item.name}</h4>
              <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${typeBadgeClass(item.type)}`}>
                {TYPE_OPTIONS.find((t) => t.value === item.type)?.label || item.type}
              </span>
              {!item.isActive && (
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-700">
                  <i className="material-icons-round text-xs">visibility_off</i>
                  Hidden
                </span>
              )}
              {item.isActive && (
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                  du.tone === 'urgent' ? 'bg-amber-100 text-amber-800'
                    : du.tone === 'soon' ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  <i className="material-icons-round text-xs">schedule</i>
                  {du.label}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-gray-700">
              <strong>{formatDateLabel(item.date)}</strong> at <strong>{item.time}</strong>
            </p>
            {item.description && (
              <p className="mt-1 text-sm text-gray-500">{item.description}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleToggle(item)}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100"
            >
              <i className="material-icons-round text-sm">{item.isActive ? 'visibility_off' : 'visibility'}</i>
              {item.isActive ? 'Hide' : 'Show'}
            </button>
            <button
              type="button"
              onClick={() => startEdit(item)}
              className="inline-flex items-center gap-1 rounded-lg border border-primary-300 px-3 py-1.5 text-xs font-semibold text-primary-700 hover:bg-primary-50"
            >
              <i className="material-icons-round text-sm">edit</i>
              Edit
            </button>
            {confirmDeleteId === item._id ? (
              <>
                <button
                  type="button"
                  onClick={() => handleDelete(item._id)}
                  className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                >
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(null)}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDeleteId(item._id)}
                className="inline-flex items-center gap-1 rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
              >
                <i className="material-icons-round text-sm">delete</i>
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="inline-flex items-center gap-2 text-lg font-bold text-gray-900">
            <i className="material-icons-round text-primary-700">celebration</i>
            Special Prayers
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Announce Eid, Tarawih, Shab-e-Meraj, Janazah, or any other one-off prayer. Updates are live immediately on the public prayer times page.
          </p>
        </div>
        {!showForm && (
          <button
            type="button"
            onClick={startCreate}
            className="inline-flex w-fit items-center gap-1 rounded-lg bg-primary-700 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-800"
          >
            <i className="material-icons-round text-base">add</i>
            Announce Special Prayer
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} noValidate className="rounded-lg border border-primary-200 bg-primary-50 p-5 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-primary-900">
              {form._id ? 'Edit Special Prayer' : 'New Special Prayer'}
            </h3>
            <button
              type="button"
              onClick={() => { resetForm(); setShowForm(false) }}
              className="text-xs font-semibold text-gray-600 hover:text-gray-900"
            >
              <i className="material-icons-round text-sm align-middle">close</i>
              Cancel
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              name="name"
              label="Prayer Name"
              icon="title"
              required
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              error={errors.name}
              placeholder="e.g. Eid ul-Fitr Jama'ah"
            />
            <FormField
              name="type"
              label="Type"
              type="select"
              icon="category"
              required
              value={form.type}
              onChange={(e) => updateField('type', e.target.value)}
              error={errors.type}
            >
              {TYPE_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </FormField>
            <FormField
              name="date"
              label="Date"
              type="date"
              icon="event"
              required
              value={form.date}
              onChange={(e) => updateField('date', e.target.value)}
              error={errors.date}
            />
            <FormField
              name="time"
              label="Jama'ah Time"
              type="time"
              icon="schedule"
              required
              value={form.time}
              onChange={(e) => updateField('time', e.target.value)}
              error={errors.time}
            />
          </div>
          <FormField
            name="description"
            label="Notes (optional)"
            type="textarea"
            rows={3}
            value={form.description}
            onChange={(e) => updateField('description', e.target.value)}
            error={errors.description}
            placeholder="e.g. Main prayer hall, multiple rounds, khutbah follows immediately"
            hint={`${form.description.length}/500 characters`}
          />
          <div className="flex items-center justify-between gap-3">
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => updateField('isActive', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary-700 focus:ring-primary-500"
              />
              <span>Visible to community</span>
            </label>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1 rounded-lg bg-primary-700 px-5 py-2 text-sm font-semibold text-white hover:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i className="material-icons-round text-base">save</i>
              {saving ? 'Saving…' : form._id ? 'Update' : 'Announce'}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {loading ? (
          <p className="text-sm text-gray-500">Loading special prayers…</p>
        ) : upcoming.length === 0 && past.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6 text-center">
            <i className="material-icons-round text-3xl text-gray-400">celebration</i>
            <p className="mt-2 text-sm font-semibold text-gray-700">No special prayers announced yet</p>
            <p className="mt-1 text-xs text-gray-500">Click "Announce Special Prayer" to add Eid, Tarawih, or other special prayers.</p>
          </div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Upcoming ({upcoming.length})
                </h3>
                {upcoming.map((item) => renderRow(item, false))}
              </div>
            )}
            {past.length > 0 && (
              <details className="space-y-2">
                <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-gray-700">
                  Past & Hidden ({past.length}) — click to expand
                </summary>
                <div className="mt-2 space-y-2">
                  {past.map((item) => renderRow(item, true))}
                </div>
              </details>
            )}
          </>
        )}
      </div>
    </section>
  )
}
