import { mockFundRequests } from '../../../mocks/index.js'
import { formatDate, formatCurrency } from '../../../utils/formatters.js'

const statusConfig = {
  pending: { bg: 'bg-amber-100', text: 'text-amber-800', icon: 'schedule', label: 'Pending' },
  approved: { bg: 'bg-green-100', text: 'text-green-800', icon: 'check_circle', label: 'Approved' },
  rejected: { bg: 'bg-red-100', text: 'text-red-800', icon: 'cancel', label: 'Rejected' },
}

export default function AdminFundRequests() {
  const requests = mockFundRequests

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-primary text-3xl font-bold text-gray-900">Fund Requests</h1>
        <p className="mt-1 text-gray-500">View all Zakat/Sadaqah fund requests and their review status</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm text-center">
          <p className="text-3xl font-bold text-gray-900">{requests.length}</p>
          <p className="text-sm text-gray-500">Total Requests</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 shadow-sm text-center">
          <p className="text-3xl font-bold text-amber-700">{requests.filter(r => r.status === 'pending').length}</p>
          <p className="text-sm text-amber-600">Pending</p>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50 p-5 shadow-sm text-center">
          <p className="text-3xl font-bold text-green-700">{requests.filter(r => r.status === 'approved').length}</p>
          <p className="text-sm text-green-600">Approved</p>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 shadow-sm text-center">
          <p className="text-3xl font-bold text-red-700">{requests.filter(r => r.status === 'rejected').length}</p>
          <p className="text-sm text-red-600">Rejected</p>
        </div>
      </div>

      {/* Requests Table */}
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
                <th className="px-5 py-3.5 text-left font-semibold text-gray-600">Reviewed By</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => {
                const status = statusConfig[req.status]
                return (
                  <tr key={req.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
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
                    <td className="px-5 py-4 text-gray-600">{req.reviewerName || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
