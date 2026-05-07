import { useState } from 'react'
import { mockFundRequests } from '../../../mocks/index.js'
import { formatDate, formatCurrency } from '../../../utils/formatters.js'
import { useUI } from '../../../hooks/useUI.js'

const statusConfig = {
  pending: { bg: 'bg-amber-100', text: 'text-amber-800', icon: 'schedule', label: 'Pending' },
  approved: { bg: 'bg-green-100', text: 'text-green-800', icon: 'check_circle', label: 'Approved' },
  rejected: { bg: 'bg-red-100', text: 'text-red-800', icon: 'cancel', label: 'Rejected' },
}

export default function CommitteeDashboard() {
  const [requests, setRequests] = useState(mockFundRequests)
  const [filter, setFilter] = useState('all')
  const [reviewingId, setReviewingId] = useState(null)
  const [reviewNote, setReviewNote] = useState('')
  const { showToast } = useUI()

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter)
  const pendingCount = requests.filter(r => r.status === 'pending').length

  const handleReview = (id, decision) => {
    if (!reviewNote.trim()) {
      showToast('Please provide a reason for your decision', 'warning')
      return
    }
    setRequests(prev => prev.map(r => r.id === id ? {
      ...r,
      status: decision,
      reviewedBy: 'cm1',
      reviewerName: 'Current User',
      reviewNote: reviewNote.trim(),
    } : r))
    setReviewingId(null)
    setReviewNote('')
    showToast(`Request ${decision}!`, decision === 'approved' ? 'success' : 'info')
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-br from-[#064e3b] to-[#047857] p-8 text-white relative overflow-hidden">
        <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-[#d4af37]/10" />
        <div className="relative z-10">
          <p className="text-[#d4af37] text-sm font-semibold uppercase tracking-wider">Committee Dashboard</p>
          <h1 className="mt-2 font-primary text-3xl font-bold">Fund Request Review</h1>
          <p className="mt-2 text-white/80">Review and process Zakat/Sadaqah fund requests from community members</p>
          {pendingCount > 0 && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-500/20 border border-amber-400/30 px-4 py-2">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-sm font-semibold text-amber-200">{pendingCount} pending request(s) need review</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
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

      {/* Filter */}
      <div className="flex items-center gap-2">
        {['all', 'pending', 'approved', 'rejected'].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${filter === f ? 'bg-[#047857] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="rounded-2xl bg-white border border-gray-200 p-12 text-center">
            <i className="material-icons-round text-gray-300 text-5xl">inbox</i>
            <p className="mt-3 text-gray-500">No {filter !== 'all' ? filter : ''} requests found</p>
          </div>
        ) : filtered.map((req) => {
          const status = statusConfig[req.status]
          return (
            <div key={req.id} className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden transition-all hover:shadow-md">
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

                {/* Review Info */}
                {req.status !== 'pending' && req.reviewNote && (
                  <div className={`mt-4 rounded-xl p-4 ${req.status === 'approved' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <p className="text-sm font-semibold text-gray-700 mb-1">
                      Decision by {req.reviewerName}
                    </p>
                    <p className="text-sm text-gray-600">{req.reviewNote}</p>
                  </div>
                )}

                {/* Review Actions for Pending */}
                {req.status === 'pending' && (
                  <div className="mt-5 border-t border-gray-100 pt-5">
                    {reviewingId === req.id ? (
                      <div className="space-y-3 animate-fade-in">
                        <textarea
                          rows={3}
                          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-[#047857] focus:border-transparent"
                          placeholder="Provide your reason/notes for this decision..."
                          value={reviewNote}
                          onChange={e => setReviewNote(e.target.value)}
                        />
                        <div className="flex flex-wrap gap-2">
                          <button onClick={() => handleReview(req.id, 'approved')} className="btn bg-green-600 text-white hover:bg-green-700">
                            <i className="material-icons-round text-lg">check_circle</i>Approve
                          </button>
                          <button onClick={() => handleReview(req.id, 'rejected')} className="btn bg-red-600 text-white hover:bg-red-700">
                            <i className="material-icons-round text-lg">cancel</i>Reject
                          </button>
                          <button onClick={() => { setReviewingId(null); setReviewNote('') }} className="btn btn-secondary">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setReviewingId(req.id)} className="btn btn-primary bg-[#047857] hover:bg-[#064e3b]">
                        <i className="material-icons-round text-lg">rate_review</i>
                        Review Request
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
