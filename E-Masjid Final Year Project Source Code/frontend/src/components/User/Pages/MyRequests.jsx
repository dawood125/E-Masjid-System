import { Link } from 'react-router-dom'
import { mockFundRequests } from '../../../mocks/index.js'
import { ROUTES } from '../../../utils/constants.js'
import { formatDate, formatCurrency } from '../../../utils/formatters.js'

const statusConfig = {
  pending: { bg: 'bg-amber-100', text: 'text-amber-800', icon: 'schedule', label: 'Pending Review' },
  approved: { bg: 'bg-green-100', text: 'text-green-800', icon: 'check_circle', label: 'Approved' },
  rejected: { bg: 'bg-red-100', text: 'text-red-800', icon: 'cancel', label: 'Rejected' },
}

export default function MyRequests() {
  const requests = mockFundRequests

  return (
    <div className="bg-primary-50 min-h-screen">
      {/* Page Header */}
      <section className="relative py-16 bg-gradient-to-br from-[#064e3b] to-[#047857] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.15),transparent_60%)]" />
        <div className="container relative z-10">
          <h1 className="font-primary text-4xl md:text-5xl font-bold text-white">My Fund Requests</h1>
          <p className="mt-4 max-w-2xl text-lg text-white/80">Track the status of your Zakat/Sadaqah fund requests</p>
        </div>
      </section>

      <section className="py-12">
        <div className="container max-w-4xl">
          {/* Action Bar */}
          <div className="flex items-center justify-between mb-8">
            <p className="text-gray-600">{requests.length} request(s) found</p>
            <Link to={ROUTES.FUND_REQUEST} className="btn btn-primary bg-[#047857] hover:bg-[#064e3b]">
              <i className="material-icons-round text-lg">add</i>
              New Request
            </Link>
          </div>

          {requests.length === 0 ? (
            <div className="rounded-2xl bg-white p-12 text-center shadow-sm border border-gray-200">
              <i className="material-icons-round text-gray-300 text-6xl">inbox</i>
              <h3 className="mt-4 font-primary text-xl font-semibold text-gray-700">No Requests Yet</h3>
              <p className="mt-2 text-gray-500">You haven&apos;t submitted any fund requests.</p>
              <Link to={ROUTES.FUND_REQUEST} className="mt-6 btn btn-primary bg-[#047857] hover:bg-[#064e3b]">Submit a Request</Link>
            </div>
          ) : (
            <div className="space-y-5">
              {requests.map((req) => {
                const status = statusConfig[req.status]
                return (
                  <div key={req.id} className="rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
                    <div className="p-6">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${status.bg} ${status.text}`}>
                              <i className="material-icons-round text-sm">{status.icon}</i>
                              {status.label}
                            </span>
                            <span className="text-xs text-gray-400">{formatDate(req.createdAt)}</span>
                          </div>
                          <h3 className="font-primary text-lg font-semibold text-gray-900">
                            {req.category} Assistance
                          </h3>
                          <p className="mt-2 text-gray-600 text-sm leading-relaxed">{req.reason}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-gray-400 uppercase tracking-wider">Amount</p>
                          <p className="text-2xl font-bold text-[#047857]">{formatCurrency(req.amount)}</p>
                        </div>
                      </div>

                      {/* Review Info */}
                      {req.status !== 'pending' && req.reviewNote && (
                        <div className={`mt-4 rounded-xl p-4 ${req.status === 'approved' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                          <div className="flex items-center gap-2 mb-2">
                            <i className={`material-icons-round text-base ${req.status === 'approved' ? 'text-green-600' : 'text-red-600'}`}>
                              {req.status === 'approved' ? 'verified' : 'info'}
                            </i>
                            <span className="text-sm font-semibold text-gray-700">
                              Committee Decision {req.reviewerName && `by ${req.reviewerName}`}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{req.reviewNote}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
