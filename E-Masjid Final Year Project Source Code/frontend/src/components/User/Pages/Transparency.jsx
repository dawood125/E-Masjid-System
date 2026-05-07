import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { mockDonations, mockExpenses, mockFinancialSummary, mockTopDonors } from '../../../mocks/index.js'
import { ROUTES } from '../../../utils/constants.js'
import { formatCurrency, formatDate } from '../../../utils/formatters.js'
import { useUI } from '../../../hooks/useUI.js'

function donationTypeClass(type) {
  const key = type.toLowerCase()
  if (key.includes('zakat')) return 'bg-blue-100 text-blue-700'
  if (key.includes('sadaqah')) return 'bg-green-100 text-green-700'
  if (key.includes('fund') || key.includes('jummah')) return 'bg-amber-100 text-amber-700'
  return 'bg-gray-100 text-gray-700'
}

function expenseTypeClass(type) {
  const key = type.toLowerCase()
  if (key.includes('utilities')) return 'bg-blue-100 text-blue-700'
  if (key.includes('maintenance')) return 'bg-amber-100 text-amber-700'
  if (key.includes('salary')) return 'bg-violet-100 text-violet-700'
  if (key.includes('renovation')) return 'bg-red-100 text-red-700'
  return 'bg-gray-100 text-gray-700'
}

function monthKey(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', { month: 'long' }).toLowerCase()
}

export default function Transparency() {
  const [monthFilter, setMonthFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [donationPage, setDonationPage] = useState(1)
  const [expensePage, setExpensePage] = useState(1)
  const { showToast } = useUI()

  const allMonths = useMemo(() => {
    const set = new Set([...mockDonations.map((d) => monthKey(d.date)), ...mockExpenses.map((e) => monthKey(e.date))])
    return ['all', ...Array.from(set)]
  }, [])

  const filteredDonations = useMemo(() => {
    return mockDonations.filter((item) => {
      const monthOk = monthFilter === 'all' || monthKey(item.date) === monthFilter
      const typeOk = typeFilter === 'all' || item.type.toLowerCase().includes(typeFilter)
      return monthOk && typeOk
    })
  }, [monthFilter, typeFilter])

  const filteredExpenses = useMemo(() => {
    return mockExpenses.filter((item) => {
      const monthOk = monthFilter === 'all' || monthKey(item.date) === monthFilter
      return monthOk
    })
  }, [monthFilter])

  const pageSize = 6
  const donationTotalPages = Math.max(1, Math.ceil(filteredDonations.length / pageSize))
  const expenseTotalPages = Math.max(1, Math.ceil(filteredExpenses.length / pageSize))

  const donationSafePage = Math.min(donationPage, donationTotalPages)
  const expenseSafePage = Math.min(expensePage, expenseTotalPages)

  const donationSlice = filteredDonations.slice((donationSafePage - 1) * pageSize, donationSafePage * pageSize)
  const expenseSlice = filteredExpenses.slice((expenseSafePage - 1) * pageSize, expenseSafePage * pageSize)

  const totalDonations = mockFinancialSummary.totalDonations
  const totalExpenses = mockFinancialSummary.totalExpenses
  const balance = mockFinancialSummary.balance

  return (
    <section className="py-12 bg-white">
      <div className="container space-y-7">
        <header className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm animate-fade-in">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-primary text-4xl md:text-5xl font-bold text-[#064e3b]">Transparency & Financial Records</h1>
              <p className="mt-3 max-w-3xl text-lg text-gray-600 leading-relaxed">
                We believe in complete transparency. Here is a real-time record of how your generous donations are helping maintain the mosque and serve the community.
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full border border-primary-200 bg-primary-50 px-4 py-2 text-sm font-semibold text-[#047857]">
              <i className="material-icons-round text-base">verified_user</i>
              Audited by Mosque Committee
            </span>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 animate-fade-in-up">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm relative overflow-hidden">
            <div className="absolute left-0 top-0 h-full w-1 bg-green-600" />
            <div className="flex items-center justify-between">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-green-100 text-green-700">
                <i className="material-icons-round">volunteer_activism</i>
              </span>
              <span className="text-xs uppercase text-gray-500">FY 2024-2025</span>
            </div>
            <p className="mt-3 text-sm text-gray-500">Total Donations Received</p>
            <h3 className="mt-1 text-3xl font-bold text-gray-900">{formatCurrency(totalDonations)}</h3>
            <p className="mt-2 inline-flex items-center gap-1 text-sm text-green-700">
              <i className="material-icons-round text-base">trending_up</i>
              +12% from last month
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm relative overflow-hidden">
            <div className="absolute left-0 top-0 h-full w-1 bg-red-600" />
            <div className="flex items-center justify-between">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-red-100 text-red-700">
                <i className="material-icons-round">account_balance_wallet</i>
              </span>
              <span className="text-xs uppercase text-gray-500">FY 2024-2025</span>
            </div>
            <p className="mt-3 text-sm text-gray-500">Total Funds Utilized</p>
            <h3 className="mt-1 text-3xl font-bold text-gray-900">{formatCurrency(totalExpenses)}</h3>
            <p className="mt-2 inline-flex items-center gap-1 text-sm text-gray-600">
              <i className="material-icons-round text-base">info</i>
              Maintenance & Operations
            </p>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-[#064e3b] to-[#047857] p-5 text-white shadow-sm relative overflow-hidden">
            <i className="material-icons-round absolute -right-2 -top-2 text-[72px] text-white/20">account_balance</i>
            <div className="flex items-center justify-between">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-white">
                <i className="material-icons-round">savings</i>
              </span>
              <span className="text-xs uppercase text-white/80">Current Balance</span>
            </div>
            <p className="mt-3 text-sm text-white/80">Remaining Funds</p>
            <h3 className="mt-1 text-3xl font-bold">{formatCurrency(balance)}</h3>
            <p className="mt-2 inline-flex items-center gap-1 text-sm text-white/90">
              <i className="material-icons-round text-base">check_circle</i>
              Safe & Allocated
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 animate-fade-in">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-gray-700">Filter by:</span>
              <select
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                value={monthFilter}
                onChange={(e) => {
                  setMonthFilter(e.target.value)
                  setDonationPage(1)
                  setExpensePage(1)
                }}
              >
                {allMonths.map((m) => (
                  <option key={m} value={m}>
                    {m === 'all' ? 'All Months' : m[0].toUpperCase() + m.slice(1)}
                  </option>
                ))}
              </select>
              <select
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value)
                  setDonationPage(1)
                }}
              >
                <option value="all">All Types</option>
                <option value="zakat">Zakat</option>
                <option value="sadaqah">Sadaqah</option>
                <option value="fund">Mosque Fund</option>
              </select>
            </div>

            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-lg bg-[#047857] px-4 py-2 text-sm font-semibold text-white hover:bg-[#064e3b]"
              onClick={() => showToast('Report downloaded successfully!', 'success')}
            >
              <i className="material-icons-round text-base">download</i>
              Download Report
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <section className="rounded-2xl border border-gray-200 bg-white shadow-sm animate-fade-in-up">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <h3 className="inline-flex items-center gap-2 font-primary text-xl font-bold text-gray-900">
                <i className="material-icons-round text-[#047857]">history</i>
                Donation History
              </h3>
              <button type="button" className="text-sm font-semibold text-[#047857]" onClick={() => showToast('Loading full records...', 'info')}>View All</button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Donor</th>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {donationSlice.map((d) => (
                    <tr key={d.id} className="border-t border-gray-100">
                      <td className="px-4 py-3">{formatDate(d.date)}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{d.donorName}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${donationTypeClass(d.type)}`}>{d.type}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-[#047857]">{formatCurrency(d.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-center gap-2 border-t border-gray-200 px-4 py-3">
              <button
                type="button"
                disabled={donationSafePage === 1}
                onClick={() => setDonationPage((p) => Math.max(1, p - 1))}
                className="h-8 w-8 rounded-md border border-gray-300 disabled:opacity-40"
              >
                <i className="material-icons-round text-base">chevron_left</i>
              </button>
              <span className="text-xs text-gray-500">Page {donationSafePage} of {donationTotalPages}</span>
              <button
                type="button"
                disabled={donationSafePage === donationTotalPages}
                onClick={() => setDonationPage((p) => Math.min(donationTotalPages, p + 1))}
                className="h-8 w-8 rounded-md border border-gray-300 disabled:opacity-40"
              >
                <i className="material-icons-round text-base">chevron_right</i>
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white shadow-sm animate-fade-in-up">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <h3 className="inline-flex items-center gap-2 font-primary text-xl font-bold text-gray-900">
                <i className="material-icons-round text-[#047857]">receipt_long</i>
                Expense History
              </h3>
              <button type="button" className="text-sm font-semibold text-[#047857]" onClick={() => showToast('Loading full records...', 'info')}>View All</button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Category</th>
                    <th className="px-4 py-3 text-left">Description</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {expenseSlice.map((e) => (
                    <tr key={e.id} className="border-t border-gray-100">
                      <td className="px-4 py-3">{formatDate(e.date)}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${expenseTypeClass(e.category)}`}>{e.category}</span>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">{e.description}</td>
                      <td className="px-4 py-3 text-right font-semibold text-red-600">{formatCurrency(e.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-center gap-2 border-t border-gray-200 px-4 py-3">
              <button
                type="button"
                disabled={expenseSafePage === 1}
                onClick={() => setExpensePage((p) => Math.max(1, p - 1))}
                className="h-8 w-8 rounded-md border border-gray-300 disabled:opacity-40"
              >
                <i className="material-icons-round text-base">chevron_left</i>
              </button>
              <span className="text-xs text-gray-500">Page {expenseSafePage} of {expenseTotalPages}</span>
              <button
                type="button"
                disabled={expenseSafePage === expenseTotalPages}
                onClick={() => setExpensePage((p) => Math.min(expenseTotalPages, p + 1))}
                className="h-8 w-8 rounded-md border border-gray-300 disabled:opacity-40"
              >
                <i className="material-icons-round text-base">chevron_right</i>
              </button>
            </div>
          </section>
        </div>

        {/* ==================== TOP DONORS SECTION (NEW) ==================== */}
        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden animate-fade-in-up">
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 bg-gradient-to-r from-amber-50 to-white">
            <h3 className="inline-flex items-center gap-2 font-primary text-xl font-bold text-gray-900">
              <i className="material-icons-round text-[#d4af37]">emoji_events</i>
              Top Donors
            </h3>
            <span className="text-xs text-gray-500 uppercase tracking-wider">Motivating Generosity</span>
          </div>
          <div className="p-5">
            <p className="text-sm text-gray-500 mb-5">These generous community members have contributed the most to our mosque. Their names appear here with their consent to inspire others.</p>
            <div className="space-y-3">
              {mockTopDonors.map((donor) => {
                const rankConfig = {
                  1: { bg: 'bg-gradient-to-r from-yellow-100 to-amber-100', border: 'border-yellow-300', icon: '🥇', textColor: 'text-yellow-700' },
                  2: { bg: 'bg-gradient-to-r from-gray-100 to-slate-100', border: 'border-gray-300', icon: '🥈', textColor: 'text-gray-600' },
                  3: { bg: 'bg-gradient-to-r from-orange-50 to-amber-50', border: 'border-orange-300', icon: '🥉', textColor: 'text-orange-700' },
                }
                const config = rankConfig[donor.rank] || { bg: 'bg-white', border: 'border-gray-200', icon: `#${donor.rank}`, textColor: 'text-gray-500' }

                return (
                  <div key={donor.rank} className={`flex items-center gap-4 rounded-xl border ${config.border} ${config.bg} p-4 transition-all hover:shadow-md`}>
                    <div className="text-2xl w-10 text-center shrink-0">
                      {typeof config.icon === 'string' && config.icon.startsWith('#') ? (
                        <span className={`text-lg font-bold ${config.textColor}`}>{config.icon}</span>
                      ) : (
                        <span>{config.icon}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{donor.name}</p>
                      <p className="text-xs text-gray-500">{donor.donationCount} donations</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-[#047857]">{formatCurrency(donor.totalAmount)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="mt-5 rounded-xl bg-amber-50 border border-amber-200 p-4 text-center">
              <p className="text-sm text-amber-800">
                <i className="material-icons-round text-base align-middle mr-1">lightbulb</i>
                <strong>Want to appear on this list?</strong> Your generous donations can inspire others to give too!
              </p>
            </div>
          </div>
        </section>

        <div className="rounded-2xl border border-primary-200 bg-primary-50 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fade-in">
          <div className="inline-flex items-start gap-3">
            <i className="material-icons-round text-[#047857] text-3xl">volunteer_activism</i>
            <div>
              <h4 className="font-primary text-xl font-bold text-gray-900">Want to contribute?</h4>
              <p className="text-gray-600">Your donations help us maintain the mosque and serve the community better.</p>
            </div>
          </div>
          <Link to={ROUTES.DONATE} className="btn btn-primary btn-lg bg-[#047857]">
            <i className="material-icons-round">favorite</i>
            Donate Now
          </Link>
        </div>
      </div>
    </section>
  )
}
