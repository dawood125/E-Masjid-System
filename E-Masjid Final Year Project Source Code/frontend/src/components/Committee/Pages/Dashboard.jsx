import { useEffect, useMemo, useState } from 'react'
import { formatDate, formatCurrency } from '../../../utils/formatters.js'
import { useAuth } from '../../../hooks/useAuth.js'
import { useUI } from '../../../hooks/useUI.js'
import { useMosque } from '../../../hooks/useMosque.js'
import api from '../../../utils/api.js'
import FormField from '../../Common/FormField.jsx'

const statusConfig = {
  pending: { bg: 'bg-amber-100', text: 'text-amber-800', icon: 'schedule', label: 'Pending' },
  approved: { bg: 'bg-green-100', text: 'text-green-800', icon: 'check_circle', label: 'Approved' },
  rejected: { bg: 'bg-red-100', text: 'text-red-800', icon: 'cancel', label: 'Rejected' },
}

export default function CommitteeDashboard() {
  const [requests, setRequests] = useState([])
  const [filter, setFilter] = useState('all')
  const [votingId, setVotingId] = useState(null)
  const [voteNote, setVoteNote] = useState('')
  const { user } = useAuth()
  const { showToast } = useUI()
  const { activeMosqueId } = useMosque()
  const [loading, setLoading] = useState(true)
  const [submittingId, setSubmittingId] = useState(null)

  const filtered = useMemo(() => (filter === 'all' ? requests : requests.filter(r => r.status === filter)), [filter, requests])
  const pendingCount = useMemo(() => requests.filter(r => r.status === 'pending').length, [requests])

  const tally = (req) => {
    const votes = req.votes || []
    let approve = 0
    let reject = 0
    let mineAppro = false
    let mineReject = false
    const myId = String(user?._id || '')
    votes.forEach((v) => {
      const memberId = String(v.member?._id || v.member || '')
      if (v.vote === 'approve') {
        approve += 1
        if (myId && memberId === myId) mineAppro = true
      } else if (v.vote === 'reject') {
        reject += 1
        if (myId && memberId === myId) mineReject = true
      }
    })
    return { approve, reject, total: approve + reject, myVote: mineAppro ? 'approve' : mineReject ? 'reject' : null }
  }

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
        showToast(e.message || 'Failed to load requests', 'error')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => { mounted = false }
  }, [showToast, activeMosqueId])

  const handleVote = async (id, decision) => {
    setSubmittingId(id)
    try {
      const res = await api.voteFundRequest(id, { vote: decision, note: voteNote.trim() })
      const updated = res.data
      setRequests((prev) => prev.map((r) => (r._id === id ? updated : r)))
      setVotingId(null)
      setVoteNote('')
      showToast(`Vote recorded: ${decision}`, 'success')
    } catch (e) {
      showToast(e.message || 'Failed to record vote', 'error')
    } finally {
      setSubmittingId(null)
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="rounded-2xl bg-gradient-to-br from-[#064e3b] to-[#047857] p-8 text-white relative overflow-hidden">
        <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-[#d4af37]/10" />
        <div className="relative z-10">
          <p className="text-[#d4af37] text-sm font-semibold uppercase tracking-wider">Committee Dashboard</p>
          <h1 className="mt-2 font-primary text-3xl font-bold">Fund Request Voting</h1>
          <p className="mt-2 text-white/80">Cast your vote on every pending request. The admin will finalize after the committee meeting.</p>
          {pendingCount > 0 && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-500/20 border border-amber-400/30 px-4 py-2">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-sm font-semibold text-amber-200">{pendingCount} pending request(s) need votes</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Pending', count: requests.filter(r => r.status === 'pending').length, color: 'amber', icon: 'schedule' },
          { label: 'Approved', count: requests.filter(r => r.status === 'approved').length, color: 'green', icon: 'check_circle' },
          { label: 'Rejected', count: requests.filter(r => r.status === 'rejected').length, color: 'red', icon: 'cancel' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg bg-${stat.color}-100 flex items-center justify-center`}>
                <i className={`material-icons-round text-${stat.color}-600`}>{stat.icon}</i>
              </div>
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.count}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        {['all', 'pending', 'approved', 'rejected'].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${filter === f ? 'bg-[#047857] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="rounded-2xl bg-white border border-gray-200 p-12 text-center">
            <i className="material-icons-round text-gray-300 text-5xl">hourglass_top</i>
            <p className="mt-3 text-gray-500">Loading requests...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl bg-white border border-gray-200 p-12 text-center">
            <i className="material-icons-round text-gray-300 text-5xl">inbox</i>
            <p className="mt-3 text-gray-500">No {filter !== 'all' ? filter : ''} requests found</p>
          </div>
        ) : filtered.map((req) => {
          const status = statusConfig[req.status]
          const t = tally(req)
          const decided = req.status !== 'pending'
          return (
            <div key={req._id} className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden transition-all hover:shadow-md">
              <div className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${status.bg} ${status.text}`}>
                        <i className="material-icons-round text-sm">{status.icon}</i>
                        {status.label}
                      </span>
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">{req.category}</span>
                      <span className="text-xs text-gray-400">{formatDate(req.createdAt)}</span>
                    </div>

                    <h3 className="font-primary text-lg font-semibold text-gray-900">{req.requesterName}</h3>
                    <div className="flex flex-wrap gap-4 mt-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1"><i className="material-icons-round text-base">email</i>{req.requesterEmail}</span>
                      <span className="flex items-center gap-1"><i className="material-icons-round text-base">phone</i>{req.requesterPhone}</span>
                    </div>
                    <p className="mt-3 text-gray-600 leading-relaxed">{req.reason}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-400 uppercase tracking-wider">Amount Requested</p>
                    <p className="text-3xl font-bold text-[#047857]">{formatCurrency(req.amount)}</p>
                  </div>
                </div>

                {!decided && (
                  <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-4 text-sm">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 font-semibold text-green-800">
                          <i className="material-icons-round text-sm">thumb_up</i>
                          {t.approve} approve
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 font-semibold text-red-800">
                          <i className="material-icons-round text-sm">thumb_down</i>
                          {t.reject} reject
                        </span>
                        <span className="text-gray-500">{t.total} vote(s) recorded</span>
                      </div>
                      {t.myVote && (
                        <span className="text-xs font-semibold text-[#047857]">
                          Your vote: {t.myVote.toUpperCase()}
                        </span>
                      )}
                    </div>
                    {(req.votes || []).length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(req.votes || []).map((v, idx) => {
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
                )}

                {decided && (
                  <div className={`mt-4 rounded-xl p-4 ${req.status === 'approved' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <p className="text-sm font-semibold text-gray-700 mb-1">
                      Final decision by {req.finalizedBy?.name || 'Admin'}
                    </p>
                    {req.finalNote && <p className="text-sm text-gray-600">{req.finalNote}</p>}
                    {(req.votes || []).length > 0 && (
                      <p className="mt-2 text-xs text-gray-500">{t.approve} approve · {t.reject} reject among {t.total} committee member(s)</p>
                    )}
                  </div>
                )}

                {!decided && (
                  <div className="mt-5 border-t border-gray-100 pt-5">
                    {votingId === req._id ? (
                      <div className="space-y-3 animate-fade-in">
                        <FormField
                          name={`voteNote-${req._id}`}
                          label="Note for your vote"
                          type="textarea"
                          rows={3}
                          optional
                          value={voteNote}
                          onChange={(e) => setVoteNote(e.target.value)}
                          placeholder="Optional note: what you saw during investigation..."
                          disabled={submittingId === req._id}
                          hint="Visible to other committee members and the admin"
                        />
                        <div className="flex flex-wrap gap-2">
                          <button onClick={() => handleVote(req._id, 'approve')} disabled={submittingId === req._id} className="btn bg-green-600 text-white hover:bg-green-700 disabled:opacity-50">
                            <i className="material-icons-round text-lg">thumb_up</i>Approve
                          </button>
                          <button onClick={() => handleVote(req._id, 'reject')} disabled={submittingId === req._id} className="btn bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">
                            <i className="material-icons-round text-lg">thumb_down</i>Reject
                          </button>
                          <button onClick={() => { setVotingId(null); setVoteNote('') }} disabled={submittingId === req._id} className="btn btn-secondary">Cancel</button>
                        </div>
                        {t.myVote && (
                          <p className="text-xs text-gray-500">
                            You already voted <strong>{t.myVote.toUpperCase()}</strong>. Submitting again will replace your previous vote.
                          </p>
                        )}
                      </div>
                    ) : (
                      <button onClick={() => setVotingId(req._id)} className="btn btn-primary bg-[#047857] hover:bg-[#064e3b]">
                        <i className="material-icons-round text-lg">how_to_vote</i>
                        {t.myVote ? 'Change my vote' : 'Cast my vote'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}