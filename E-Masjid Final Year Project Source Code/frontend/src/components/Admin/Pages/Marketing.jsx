import { useCallback, useEffect, useState } from 'react'
import api from '../../../utils/api.js'
import { useUI } from '../../../hooks/useUI.js'
import FormField from '../../Common/FormField.jsx'

const TABS = [
  { key: 'campaigns',   label: 'Campaigns',   icon: 'volunteer_activism' },
  { key: 'testimonials', label: 'Testimonials', icon: 'format_quote' },
  { key: 'hero-slides',  label: 'Hero Slides',  icon: 'image' },
]

function Field({ label, name, type = 'text', value, onChange, placeholder, required, optional, error, rows, children, onClearError }) {
  if (children) {
    return (
      <FormField
        name={name}
        label={label}
        type="select"
        required={required}
        optional={optional}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        error={error}
        placeholder={placeholder}
      >
        {children}
      </FormField>
    )
  }
  return (
    <FormField
      name={name}
      label={label}
      type={type === 'number' ? 'number' : rows ? 'textarea' : 'text'}
      required={required}
      optional={optional}
      value={value}
      onChange={(e) => {
        onChange(e.target.value)
        if (onClearError) onClearError()
      }}
      error={error}
      placeholder={placeholder}
      rows={rows}
    />
  )
}

function validateCampaign(form) {
  const errs = {}
  if (!form.title.trim()) errs.title = 'Title is required'
  else if (form.title.trim().length < 3) errs.title = 'Title must be at least 3 characters'
  const target = Number(form.targetAmount)
  if (form.targetAmount === '' || form.targetAmount === null || form.targetAmount === undefined) errs.targetAmount = 'Target amount is required'
  else if (Number.isNaN(target) || target < 0) errs.targetAmount = 'Enter a valid non-negative amount'
  const raised = Number(form.raisedAmount)
  if (form.raisedAmount !== '' && form.raisedAmount !== null && form.raisedAmount !== undefined) {
    if (Number.isNaN(raised) || raised < 0) errs.raisedAmount = 'Enter a valid non-negative amount'
  }
  const days = Number(form.daysLeft)
  if (days < 0) errs.daysLeft = 'Days left must be 0 or more'
  return errs
}

function validateTestimonial(form) {
  const errs = {}
  if (!form.name.trim()) errs.name = 'Name is required'
  if (!form.role.trim()) errs.role = 'Role is required'
  if (!form.quote.trim()) errs.quote = 'Quote is required'
  else if (form.quote.trim().length < 10) errs.quote = 'Quote must be at least 10 characters'
  return errs
}

function validateHeroSlide(form) {
  const errs = {}
  if (!form.image.trim()) errs.image = 'Image URL is required'
  else if (!/^https?:\/\/|\/assets\//.test(form.image.trim())) errs.image = 'Use an absolute http(s) URL or a /assets/ path'
  return errs
}

function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className={`bg-white rounded-2xl shadow-2xl ${wide ? 'max-w-2xl' : 'max-w-lg'} w-full max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h3 className="font-primary text-xl font-bold text-[#064e3b]">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl leading-none">&times;</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

function ConfirmDelete({ open, name, onCancel, onConfirm }) {
  if (!open) return null
  return (
    <Modal open={open} onClose={onCancel} title="Confirm Delete">
      <p className="text-gray-700">Are you sure you want to delete <span className="font-bold">{name}</span>? This cannot be undone.</p>
      <div className="mt-6 flex justify-end gap-3">
        <button onClick={onCancel} className="btn btn-secondary">Cancel</button>
        <button onClick={onConfirm} className="btn bg-red-600 text-white border-red-600 hover:bg-red-700 hover:border-red-700">Delete</button>
      </div>
    </Modal>
  )
}

function CampaignsTab({ showToast }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [isOpen, setIsOpen] = useState(false)
  const [confirmDel, setConfirmDel] = useState(null)
  const [form, setForm] = useState(blankCampaign)
  const [formErrors, setFormErrors] = useState({})

  function blankCampaign() {
    return { title: '', subtitle: '', targetAmount: '', raisedAmount: '', daysLeft: '30', image: '', isActive: true, isFeatured: false, order: '0' }
  }

  const load = useCallback(() => {
    api.adminListCampaigns()
      .then((res) => setItems(res.data || []))
      .catch((e) => showToast(e.message || 'Failed to load campaigns', 'error'))
      .finally(() => setLoading(false))
  }, [showToast])
  useEffect(() => { load() }, [load])

  const openNew = () => { setForm(blankCampaign()); setFormErrors({}); setEditing(null); setIsOpen(true) }
  const openEdit = (c) => {
    setForm({
      title: c.title || '',
      subtitle: c.subtitle || '',
      targetAmount: c.targetAmount ?? '',
      raisedAmount: c.raisedAmount ?? '',
      daysLeft: c.daysLeft ?? '30',
      image: c.image || '',
      isActive: c.isActive !== false,
      isFeatured: !!c.isFeatured,
      order: c.order ?? '0',
    })
    setFormErrors({})
    setEditing(c)
    setIsOpen(true)
  }
  const close = () => { setIsOpen(false); setEditing(null); setFormErrors({}) }

  const save = async () => {
    const v = validateCampaign(form)
    if (Object.keys(v).length > 0) {
      setFormErrors(v)
      const firstField = Object.keys(v)[0]
      const el = document.querySelector(`[name="${firstField}"]`)
      if (el && el.focus) el.focus()
      return
    }
    setFormErrors({})
    try {
      const payload = {
        ...form,
        targetAmount: Number(form.targetAmount) || 0,
        raisedAmount: Number(form.raisedAmount) || 0,
        daysLeft: Number(form.daysLeft) || 0,
        order: Number(form.order) || 0,
      }
      if (editing) {
        await api.adminUpdateCampaign(editing._id, payload)
        showToast('Campaign updated', 'success')
      } else {
        await api.adminCreateCampaign(payload)
        showToast('Campaign created', 'success')
      }
      close()
      load()
    } catch (e) {
      showToast(e.message || 'Failed to save campaign', 'error')
    }
  }

  const doDelete = async () => {
    if (!confirmDel) return
    try {
      await api.adminDeleteCampaign(confirmDel._id)
      showToast('Campaign deleted', 'success')
      setConfirmDel(null)
      load()
    } catch (e) {
      showToast(e.message || 'Failed to delete', 'error')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">Manage featured + all campaigns. Only one can be featured at a time.</p>
        <button onClick={openNew} className="btn btn-primary"><i className="material-icons-round">add</i> New Campaign</button>
      </div>

      {loading ? (
        <p className="text-center text-gray-500 py-8">Loading...</p>
      ) : items.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No campaigns yet. Click &ldquo;New Campaign&rdquo; to create one.</p>
      ) : (
        <div className="space-y-3">
          {items.map((c) => (
            <div key={c._id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border border-gray-200 bg-white hover:shadow-md transition-shadow">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-bold text-[#064e3b] truncate">{c.title}</h4>
                  {c.isFeatured && <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">FEATURED</span>}
                  {!c.isActive && <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs font-bold">INACTIVE</span>}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Target: PKR {Number(c.targetAmount).toLocaleString()} · Raised: PKR {Number(c.raisedAmount).toLocaleString()} ({c.progressPercent}%) · {c.daysLeft}d left
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => openEdit(c)} className="btn btn-secondary btn-sm">Edit</button>
                <button onClick={() => setConfirmDel(c)} className="btn bg-red-50 text-red-700 border-red-200 hover:bg-red-100 btn-sm">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={isOpen} onClose={close} title={editing ? 'Edit Campaign' : 'New Campaign'} wide>
        <form onSubmit={(e) => { e.preventDefault(); save() }} noValidate className="space-y-4">
          <Field label="Title" name="title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} required placeholder="Help Us Build a New Minaret" error={formErrors.title} onClearError={() => formErrors.title && setFormErrors((p) => ({ ...p, title: null }))} />
          <Field label="Subtitle" name="subtitle" value={form.subtitle} onChange={(v) => setForm({ ...form, subtitle: v })} placeholder="Our community has grown..." rows={2} />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Target Amount (PKR)" name="targetAmount" type="number" value={form.targetAmount} onChange={(v) => setForm({ ...form, targetAmount: v })} required placeholder="800000" error={formErrors.targetAmount} onClearError={() => formErrors.targetAmount && setFormErrors((p) => ({ ...p, targetAmount: null }))} />
            <Field label="Raised Amount (PKR)" name="raisedAmount" type="number" value={form.raisedAmount} onChange={(v) => setForm({ ...form, raisedAmount: v })} placeholder="320000" error={formErrors.raisedAmount} onClearError={() => formErrors.raisedAmount && setFormErrors((p) => ({ ...p, raisedAmount: null }))} />
            <Field label="Days Left" name="daysLeft" type="number" value={form.daysLeft} onChange={(v) => setForm({ ...form, daysLeft: v })} placeholder="30" error={formErrors.daysLeft} onClearError={() => formErrors.daysLeft && setFormErrors((p) => ({ ...p, daysLeft: null }))} />
            <Field label="Order" name="order" type="number" value={form.order} onChange={(v) => setForm({ ...form, order: v })} placeholder="0" />
            <Field label="Image URL (optional)" name="image" value={form.image} onChange={(v) => setForm({ ...form, image: v })} placeholder="https://..." />
          </div>
          <div className="flex items-center gap-6 pt-2">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="h-4 w-4 rounded" />
              <span className="text-sm font-medium">Active (visible on homepage)</span>
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} className="h-4 w-4 rounded" />
              <span className="text-sm font-medium">Featured (show in homepage section)</span>
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={close} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary">{editing ? 'Save Changes' : 'Create Campaign'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDelete open={!!confirmDel} name={confirmDel?.title} onCancel={() => setConfirmDel(null)} onConfirm={doDelete} />
    </div>
  )
}

function TestimonialsTab({ showToast }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [isOpen, setIsOpen] = useState(false)
  const [confirmDel, setConfirmDel] = useState(null)
  const [form, setForm] = useState({ name: '', role: '', quote: '', photo: '/assets/images/testimonials/testimonial-1.jpg', order: '0', isActive: true })
  const [formErrors, setFormErrors] = useState({})

  const load = useCallback(() => {
    api.adminListTestimonials()
      .then((res) => setItems(res.data || []))
      .catch((e) => showToast(e.message || 'Failed to load testimonials', 'error'))
      .finally(() => setLoading(false))
  }, [showToast])
  useEffect(() => { load() }, [load])

  const openNew = () => { setForm({ name: '', role: '', quote: '', photo: '/assets/images/testimonials/testimonial-1.jpg', order: '0', isActive: true }); setFormErrors({}); setEditing(null); setIsOpen(true) }
  const openEdit = (t) => {
    setForm({
      name: t.name || '',
      role: t.role || '',
      quote: t.quote || '',
      photo: t.photo || '',
      order: t.order ?? '0',
      isActive: t.isActive !== false,
    })
    setFormErrors({})
    setEditing(t)
    setIsOpen(true)
  }
  const close = () => { setIsOpen(false); setEditing(null); setFormErrors({}) }

  const save = async () => {
    const v = validateTestimonial(form)
    if (Object.keys(v).length > 0) {
      setFormErrors(v)
      const firstField = Object.keys(v)[0]
      const el = document.querySelector(`[name="${firstField}"]`)
      if (el && el.focus) el.focus()
      return
    }
    setFormErrors({})
    try {
      const payload = { ...form, order: Number(form.order) || 0 }
      if (editing) {
        await api.adminUpdateTestimonial(editing._id, payload)
        showToast('Testimonial updated', 'success')
      } else {
        await api.adminCreateTestimonial(payload)
        showToast('Testimonial created', 'success')
      }
      close()
      load()
    } catch (e) {
      showToast(e.message || 'Failed to save', 'error')
    }
  }

  const doDelete = async () => {
    if (!confirmDel) return
    try {
      await api.adminDeleteTestimonial(confirmDel._id)
      showToast('Testimonial deleted', 'success')
      setConfirmDel(null)
      load()
    } catch (e) {
      showToast(e.message || 'Failed to delete', 'error')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">Community voices shown in the &ldquo;What Our Community Says&rdquo; section.</p>
        <button onClick={openNew} className="btn btn-primary"><i className="material-icons-round">add</i> New Testimonial</button>
      </div>

      {loading ? (
        <p className="text-center text-gray-500 py-8">Loading...</p>
      ) : items.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No testimonials yet. Click &ldquo;New Testimonial&rdquo; to add one.</p>
      ) : (
        <div className="space-y-3">
          {items.map((t) => (
            <div key={t._id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border border-gray-200 bg-white hover:shadow-md transition-shadow">
              <img src={t.photo} alt={t.name} className="h-12 w-12 rounded-full object-cover shrink-0" onError={(e) => { e.currentTarget.src = '/assets/images/testimonials/testimonial-1.jpg' }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-bold text-[#064e3b] truncate">{t.name}</h4>
                  <span className="text-xs text-gray-500">· {t.role}</span>
                  {!t.isActive && <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs font-bold">INACTIVE</span>}
                </div>
                <p className="text-sm text-gray-600 mt-1 line-clamp-1 italic">&ldquo;{t.quote}&rdquo;</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => openEdit(t)} className="btn btn-secondary btn-sm">Edit</button>
                <button onClick={() => setConfirmDel(t)} className="btn bg-red-50 text-red-700 border-red-200 hover:bg-red-100 btn-sm">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={isOpen} onClose={close} title={editing ? 'Edit Testimonial' : 'New Testimonial'}>
        <form onSubmit={(e) => { e.preventDefault(); save() }} noValidate className="space-y-4">
          <Field label="Name" name="name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required error={formErrors.name} onClearError={() => formErrors.name && setFormErrors((p) => ({ ...p, name: null }))} />
          <Field label="Role / Title" name="role" value={form.role} onChange={(v) => setForm({ ...form, role: v })} required placeholder="Community Member, Mother of two" error={formErrors.role} onClearError={() => formErrors.role && setFormErrors((p) => ({ ...p, role: null }))} />
          <Field label="Quote" name="quote" value={form.quote} onChange={(v) => setForm({ ...form, quote: v })} required rows={4} placeholder="Our mosque changed my family's life..." error={formErrors.quote} onClearError={() => formErrors.quote && setFormErrors((p) => ({ ...p, quote: null }))} />
          <Field label="Photo URL" name="photo" optional value={form.photo} onChange={(v) => setForm({ ...form, photo: v })} placeholder="/assets/images/testimonials/testimonial-1.jpg" />
          <Field label="Display Order" name="order" type="number" value={form.order} onChange={(v) => setForm({ ...form, order: v })} placeholder="0" />
          <label className="inline-flex items-center gap-2 cursor-pointer pt-1">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="h-4 w-4 rounded" />
            <span className="text-sm font-medium">Active (visible on homepage)</span>
          </label>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={close} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary">{editing ? 'Save Changes' : 'Create Testimonial'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDelete open={!!confirmDel} name={confirmDel?.name} onCancel={() => setConfirmDel(null)} onConfirm={doDelete} />
    </div>
  )
}

function HeroSlidesTab({ showToast }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [isOpen, setIsOpen] = useState(false)
  const [confirmDel, setConfirmDel] = useState(null)
  const [form, setForm] = useState({ image: '/assets/images/gallery/gallery-fajr.jpg', mobileImage: '', caption: '', link: '', order: '0', isActive: true })
  const [formErrors, setFormErrors] = useState({})

  const load = useCallback(() => {
    api.adminListHeroSlides()
      .then((res) => setItems(res.data || []))
      .catch((e) => showToast(e.message || 'Failed to load hero slides', 'error'))
      .finally(() => setLoading(false))
  }, [showToast])
  useEffect(() => { load() }, [load])

  const openNew = () => { setForm({ image: '/assets/images/gallery/gallery-fajr.jpg', mobileImage: '', caption: '', link: '', order: '0', isActive: true }); setFormErrors({}); setEditing(null); setIsOpen(true) }
  const openEdit = (s) => {
    setForm({
      image: s.image || '',
      mobileImage: s.mobileImage || '',
      caption: s.caption || '',
      link: s.link || '',
      order: s.order ?? '0',
      isActive: s.isActive !== false,
    })
    setFormErrors({})
    setEditing(s)
    setIsOpen(true)
  }
  const close = () => { setIsOpen(false); setEditing(null); setFormErrors({}) }

  const save = async () => {
    const v = validateHeroSlide(form)
    if (Object.keys(v).length > 0) {
      setFormErrors(v)
      const firstField = Object.keys(v)[0]
      const el = document.querySelector(`[name="${firstField}"]`)
      if (el && el.focus) el.focus()
      return
    }
    setFormErrors({})
    try {
      const payload = { ...form, order: Number(form.order) || 0 }
      if (editing) {
        await api.adminUpdateHeroSlide(editing._id, payload)
        showToast('Hero slide updated', 'success')
      } else {
        await api.adminCreateHeroSlide(payload)
        showToast('Hero slide created', 'success')
      }
      close()
      load()
    } catch (e) {
      showToast(e.message || 'Failed to save', 'error')
    }
  }

  const doDelete = async () => {
    if (!confirmDel) return
    try {
      await api.adminDeleteHeroSlide(confirmDel._id)
      showToast('Hero slide deleted', 'success')
      setConfirmDel(null)
      load()
    } catch (e) {
      showToast(e.message || 'Failed to delete', 'error')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">Images in the homepage &ldquo;Life at the Masjid&rdquo; carousel. The 6 default Gemini images are pre-seeded.</p>
        <button onClick={openNew} className="btn btn-primary"><i className="material-icons-round">add</i> New Slide</button>
      </div>

      {loading ? (
        <p className="text-center text-gray-500 py-8">Loading...</p>
      ) : items.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No hero slides yet. Click &ldquo;New Slide&rdquo; to add one.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {items.map((s) => (
            <div key={s._id} className="relative group rounded-xl overflow-hidden border border-gray-200 bg-white">
              <img src={s.image} alt={s.caption || ''} className="w-full h-40 object-cover" />
              <div className="p-3">
                <p className="text-sm font-medium text-[#064e3b] truncate">{s.caption || '(no caption)'}</p>
                <p className="text-xs text-gray-500 truncate">{s.image}</p>
              </div>
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(s)} className="px-2 py-1 rounded bg-white/90 text-xs font-bold hover:bg-white">Edit</button>
                <button onClick={() => setConfirmDel(s)} className="px-2 py-1 rounded bg-red-600/90 text-white text-xs font-bold hover:bg-red-700">Delete</button>
              </div>
              {!s.isActive && <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs font-bold">INACTIVE</span>}
            </div>
          ))}
        </div>
      )}

      <Modal open={isOpen} onClose={close} title={editing ? 'Edit Hero Slide' : 'New Hero Slide'}>
        <form onSubmit={(e) => { e.preventDefault(); save() }} noValidate className="space-y-4">
          <Field label="Image URL" name="image" value={form.image} onChange={(v) => setForm({ ...form, image: v })} required placeholder="/assets/images/gallery/gallery-fajr.jpg" error={formErrors.image} onClearError={() => formErrors.image && setFormErrors((p) => ({ ...p, image: null }))} />
          <Field label="Mobile Image URL (optional, 9:16 crop)" name="mobileImage" optional value={form.mobileImage} onChange={(v) => setForm({ ...form, mobileImage: v })} placeholder="/assets/images/hero/hero-mobile.jpg" />
          <Field label="Caption" name="caption" optional value={form.caption} onChange={(v) => setForm({ ...form, caption: v })} placeholder="Fajr prayer at dawn" />
          <Field label="Link URL (optional)" name="link" optional value={form.link} onChange={(v) => setForm({ ...form, link: v })} placeholder="/events" />
          <Field label="Display Order" name="order" type="number" value={form.order} onChange={(v) => setForm({ ...form, order: v })} placeholder="0" />
          <label className="inline-flex items-center gap-2 cursor-pointer pt-1">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="h-4 w-4 rounded" />
            <span className="text-sm font-medium">Active (visible on homepage)</span>
          </label>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={close} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary">{editing ? 'Save Changes' : 'Create Slide'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDelete open={!!confirmDel} name={confirmDel?.caption || confirmDel?.image} onCancel={() => setConfirmDel(null)} onConfirm={doDelete} />
    </div>
  )
}

export default function Marketing() {
  const { showToast } = useUI()
  const [tab, setTab] = useState('campaigns')

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-primary text-2xl font-bold text-[#064e3b]">Marketing Content</h2>
        <p className="mt-1 text-sm text-gray-500">Manage all homepage marketing content: campaigns, community testimonials, and hero carousel slides. Changes appear on the public homepage within seconds.</p>
      </div>

      <div className="mb-6 border-b border-gray-200">
        <nav className="flex gap-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                tab === t.key
                  ? 'border-[#047857] text-[#047857]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <i className="material-icons-round text-base">{t.icon}</i>
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {tab === 'campaigns'   && <CampaignsTab showToast={showToast} />}
      {tab === 'testimonials' && <TestimonialsTab showToast={showToast} />}
      {tab === 'hero-slides'  && <HeroSlidesTab showToast={showToast} />}
    </div>
  )
}
