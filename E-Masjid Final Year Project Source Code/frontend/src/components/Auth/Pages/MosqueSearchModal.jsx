import { useEffect, useRef, useState } from 'react'
import api from '../../../utils/api.js'
import { useUI } from '../../../hooks/useUI.js'

export default function MosqueSearchModal({ open, onClose, onSelect, initialCity = '' }) {
  const { showToast } = useUI()

  const [query, setQuery] = useState('')
  const [city, setCity] = useState(initialCity)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(null)
  const debounceRef = useRef(null)
  const inputRef = useRef(null)

  
  useEffect(() => {
    if (open && inputRef.current) {
      const t = setTimeout(() => inputRef.current?.focus(), 100)
      return () => clearTimeout(t)
    }
  }, [open])

  
  useEffect(() => {
    if (!open) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (query.trim()) params.set('query', query.trim())
        if (city.trim()) params.set('city', city.trim())
        const res = await api.searchMosques(params.toString())
        setResults(res.data || [])
      } catch (e) {
        showToast(e.message || 'Failed to search mosques', 'error')
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)
  }, [query, city, open, showToast])

  
  useEffect(() => {
    if (open) {
      const original = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = original }
    }
  }, [open])

  
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  const handleConfirm = () => {
    if (!selected) {
      showToast('Please select a mosque to continue', 'warning')
      return
    }
    onSelect(selected)
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">

        <div className="flex items-center justify-between p-5 border-b border-gray-200 shrink-0">
          <div>
            <h3 className="font-primary text-xl font-bold text-[#064e3b]">Select Your Home Mosque</h3>
            <p className="text-xs text-gray-500 mt-0.5">Search by name, city, or address</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="p-5 border-b border-gray-100 shrink-0 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <i className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none">search</i>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or address..."
                className="form-input pl-10"
              />
            </div>
            <div className="relative w-40">
              <i className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base pointer-events-none">location_city</i>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City..."
                className="form-input pl-9 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-2 min-h-[200px] max-h-[40vh]">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-gray-50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="text-center text-gray-500 py-10">
              <i className="material-icons-round text-4xl mb-2">search_off</i>
              <p className="text-sm">No mosques match your search.</p>
              <p className="text-xs mt-1">Try a different city or mosque name.</p>
            </div>
          ) : (
            <div className="space-y-2 pb-3">
              {results.map((m) => {
                const isSelected = selected?._id === m._id
                return (
                  <button
                    key={m._id}
                    type="button"
                    onClick={() => setSelected(m)}
                    className={`w-full text-left p-3 rounded-xl border-2 transition-colors ${
                      isSelected
                        ? 'border-[#047857] bg-primary-50'
                        : 'border-gray-200 hover:border-[#047857]/40 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-[#047857] text-white' : 'bg-primary-50 text-[#047857]'
                      }`}>
                        <i className="material-icons-round">mosque</i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[#064e3b] truncate">{m.name}</p>
                        <p className="text-xs text-gray-500 truncate">{m.city}{m.address ? ` · ${m.address}` : ''}</p>
                      </div>
                      {isSelected && (
                        <i className="material-icons-round text-[#047857]">check_circle</i>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="p-5 border-t border-gray-200 flex justify-end gap-3 shrink-0 bg-gray-50">
          <button onClick={onClose} className="btn btn-secondary">Cancel</button>
          <button
            onClick={handleConfirm}
            disabled={!selected}
            className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i className="material-icons-round">check</i>
            Confirm Selection
          </button>
        </div>
      </div>
    </div>
  )
}
