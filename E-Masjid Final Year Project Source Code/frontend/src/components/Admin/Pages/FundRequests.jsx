import { useEffect, useMemo, useState } from 'react'
import api from '../../../utils/api.js'
import { formatDate, formatCurrency } from '../../../utils/formatters.js'
import { useUI } from '../../../hooks/useUI.js'
import { useMosque } from '../../../hooks/useMosque.js'
import FormField from '../../Common/FormField.jsx'

const statusConfig = {
  pending: { bg: 'bg-amber-100', text: 'text-amber-800', icon: 'schedule', label: 'Pending' },
  approved: { bg: 'bg-green-100', text: 'text-green-800', icon: 'check_circle', label: 'Approved' },
  rejected: { bg: 'bg-red-100', text: 'text-red-800', icon: 'cancel', label: 'Rejected' },
}

export default function AdminFundRequests() {
  const { showToast } = useUI()
  const { activeMosqueId } = useMosque()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState(null)
  const [finalNote, setFinalNote] = useState('')
  const [overrideStatus, setOverrideStatus] = useState('')
  const [finalErrors, setFinalErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let mounted = true

    async function load() {
      setLoading(true)
      try {
        const res = await api.getFundRequests()
        if (!mounted) return
        setRequests(res.data || [])
      } catch (e) {
        if (!mounted) return
        showToast(e.message || 'Failed to load fund requests', 'error')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => { mounted = false }
  }, [showToast, activeMosqueId])

  const tally = (req) => {
    const votes = req.votes || []
    let approve = 0
    let reject = 0
    votes.forEach((v) => {
      if (v.vote === 'approve') approve += 1
      else if (v.vote === 'reject') reject += 1
    })
    return { approve, reject, total: approve + reject, tied: approve === reject && approve > 0 }
  }

  const selected = useMemo(() => requests.find((r) => r._id === selectedId) || null, [requests, selectedId])
  const selectedTally = selected ? tally(selected) : null
  const autoStatus = selectedTally
    ? selectedTally.approve > selectedTally.reject ? 'approved'
      : selectedTally.reject > selectedTally.approve ? 'rejected'
      : 'tied'
    : null

  const openFinalize = (req) => {
    setSelectedId(req._id)
    setFinalNote('')
    setOverrideStatus('')
    setFinalErrors({})
  }

  const closeFinalize = () => {
    setSelectedId(null)
    setFinalNote('')
    setOverrideStatus('')
    setFinalErrors({})
  }

  const handleFinalize = async () => {
    if (!selected) return
    const errs = {}
    if (autoStatus === 'tied' && !overrideStatus) {
      errs.overrideStatus = 'Votes are tied — please pick approve or reject'
    }
    if (Object.keys(errs).length > 0) {
      setFinalErrors(errs)
      showToast(errs.overrideStatus, 'warning')
      return
    }
    setFinalErrors({})
    const body = {}
    if (autoStatus === 'tied') body.overrideStatus = overrideStatus
    if (finalNote.trim()) body.finalNote = finalNote.trim()

    setSubmitting(true)
    try {
      const res = await api.finalizeFundRequest(selected._id, body)
      const updated = res.data
      setRequests((prev) => prev.map((r) => (r._id === selected._id ? updated : r)))
      closeFinalize()
      showToast(`Request ${updated.status}! Email sent to requester.`, 'success')
    } catch (e) {
      if (e.errors && Array.isArray(e.errors)) {
        const fieldErrors = {}
        e.errors.forEach((er) => { if (er.field) fieldErrors[er.field] = er.message })
        if (Object.keys(fieldErrors).length > 0) setFinalErrors(fieldErrors)
      }
      showToast(e.message || 'Failed to finalize request', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-primary text-3xl font-bold text-gray-900">Fund Requests</h1>
        <p className="mt-1 text-gray-500">Review committee votes and finalize each request after the weekly meeting</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm text-center">
          <p className="text-3xl font-bold text-gray-900">{loading ? '—' : requests.length}</p>
          <p className="text-sm text-gray-500">Total Requests</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 shadow-sm text-center">
          <p className="text-3xl font-bold text-amber-700">{loading ? '—' : requests.filter(r => r.status === 'pending').length}</p>
          <p className="text-sm text-amber-600">Pending</p>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50 p-5 shadow-sm text-center">
          <p className="text-3xl font-bold text-green-700">{loading ? '—' : requests.filter(r => r.status === 'approved').length}</p>
          <p className="text-sm text-green-600">Approved</p>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 shadow-sm text-center">
          <p className="text-3xl font-bold text-red-700">{loading ? '—' : requests.filter(r => r.status === 'rejected').length}</p>
          <p className="text-sm text-red-600">Rejected</p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-5 py-3.5 text-left font-semibold text-gray-600">Date</th>
                <th className="px-5 py-3.5 text-left font-semibold text-gray-600">Requester</th>
                <th className="px-5 py-3.5 text-left font-semibold text-gray-600">Category</th>
                <th className="px-5 py-3.5 text-right font-semibold text-gray-600">Amount</th>
                <th className="px-5 py-3.5 text-center font-semibold text-gray-600">Status</th>
                <th className="px-5 py-3.5 text-center font-semibold text-gray-600">Votes</th>
                <th className="px-5 py-3.5 text-left font-semibold text-gray-600">Finalized By</th>
                <th className="px-5 py-3.5 text-right font-semibold text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="px-5 py-12 text-center text-gray-500">Loading...</td></tr>
              ) : requests.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-12 text-center text-gray-500">No fund requests yet</td></tr>
              ) : requests.map((req) => {
                const status = statusConfig[req.status]
                const t = tally(req)
                const decided = req.status !== 'pending'
                return (
                  <tr key={req._id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 text-gray-600">{formatDate(req.createdAt)}</td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-900">{req.requesterName}</p>
                      <p className="text-xs text-gray-500">{req.requesterEmail}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">{req.category}</span>
                    </td>
                    <td className="px-5 py-4 text-right font-semibold text-[#047857]">{formatCurrency(req.amount)}</td>
                    <td className="px-5 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${status.bg} ${status.text}`}>
                        <i className="material-icons-round text-sm">{status.icon}</i>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      {t.total === 0 ? (
                        <span className="text-xs text-gray-400">No votes</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold">
                          <span className="text-green-700">{t.approve}✓</span>
                          <span className="text-gray-400">·</span>
                          <span className="text-red-700">{t.reject}✗</span>
                          {t.tied && <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">TIED</span>}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-gray-600">{req.finalizedBy?.name || '—'}</td>
                    <td className="px-5 py-4 text-right">
                      {decided ? (
                        <span className="text-xs text-gray-400">Decided</span>
                      ) : t.total === 0 ? (
                        <span className="text-xs text-amber-600 font-medium">Awaiting votes</span>
                      ) : (
                        <button
                          onClick={() => openFinalize(req)}
                          className="inline-flex items-center gap-1 rounded-lg bg-[#047857] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#064e3b]"
                        >
                          <i className="material-icons-round text-sm">gavel</i>
                          Finalize
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="font-primary text-xl font-bold text-gray-900">Finalize Fund Request</h2>
              <p className="mt-1 text-sm text-gray-500">{selected.requesterName} · {selected.category} · {formatCurrency(selected.amount)}</p>
            </div>

            <div className="space-y-4 px-6 py-5">
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Committee Votes</p>
                <div className="mt-2 flex items-center gap-3">
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm font-bold text-green-800">
                    <i className="material-icons-round text-sm">thumb_up</i>
                    {selectedTally.approve} approve
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-sm font-bold text-red-800">
                    <i className="material-icons-round text-sm">thumb_down</i>
                    {selectedTally.reject} reject
                  </span>
                </div>
                {(selected.votes || []).length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(selected.votes || []).map((v, idx) => {
                      const memberName = v.member?.name || `Member ${idx + 1}`
                      return (
                        <span key={`${String(v.member?._id || v.member || idx)}-${idx}`} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${v.vote === 'approve' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                          <i className="material-icons-round text-sm">{v.vote === 'approve' ? 'check' : 'close'}</i>
                          {memberName}
                        </span>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className={`rounded-xl border-2 border-dashed p-4 ${finalErrors.overrideStatus ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Auto Outcome</p>
                {autoStatus === 'tied' ? (
                  <p className="mt-2 text-sm text-amber-700">
                    <i className="material-icons-round align-middle text-base">warning</i>
                    {' '}Votes are tied. Pick a side to override:
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-gray-700">
                    Outcome will be set to <strong className={autoStatus === 'approved' ? 'text-green-700' : 'text-red-700'}>{autoStatus}</strong> based on the majority.
                  </p>
                )}

                {autoStatus === 'tied' && (
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setOverrideStatus('approved')
                        if (finalErrors.overrideStatus) setFinalErrors((p) => ({ ...p, overrideStatus: null }))
                      }}
                      className={`flex-1 rounded-lg border-2 px-3 py-2 text-sm font-semibold ${overrideStatus === 'approved' ? 'border-green-600 bg-green-50 text-green-800' : 'border-gray-300 text-gray-600 hover:border-green-400'}`}
                    >
                      <i className="material-icons-round align-middle text-base">thumb_up</i> Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setOverrideStatus('rejected')
                        if (finalErrors.overrideStatus) setFinalErrors((p) => ({ ...p, overrideStatus: null }))
                      }}
                      className={`flex-1 rounded-lg border-2 px-3 py-2 text-sm font-semibold ${overrideStatus === 'rejected' ? 'border-red-600 bg-red-50 text-red-800' : 'border-gray-300 text-gray-600 hover:border-red-400'}`}
                    >
                      <i className="material-icons-round align-middle text-base">thumb_down</i> Reject
                    </button>
                  </div>
                )}
                {finalErrors.overrideStatus && (
                  <p className="form-error mt-2">{finalErrors.overrideStatus}</p>
                )}
              </div>

              <FormField
                name="finalNote"
                label={
                  <span>
                    Final Note <span className="text-gray-400 font-normal">(visible to requester in their email)</span>
                  </span>
                }
                type="textarea"
                rows={3}
                optional
                value={finalNote}
                onChange={(e) => setFinalNote(e.target.value)}
                placeholder="e.g. Approved; please collect from the office."
                disabled={submitting}
              />
            </div>

            <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-2">
              <button onClick={closeFinalize} disabled={submitting} className="btn btn-secondary">Cancel</button>
              <button
                onClick={handleFinalize}
                disabled={submitting || (autoStatus === 'tied' && !overrideStatus)}
                className={`btn ${autoStatus === 'approved' || overrideStatus === 'approved' ? 'bg-green-600 hover:bg-green-700' : autoStatus === 'rejected' || overrideStatus === 'rejected' ? 'bg-red-600 hover:bg-red-700' : 'bg-[#047857] hover:bg-[#064e3b]'} text-white disabled:opacity-50`}
              >
                <i className="material-icons-round text-lg">gavel</i>
                {submitting ? 'Finalizing...' : 'Finalize & notify'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}