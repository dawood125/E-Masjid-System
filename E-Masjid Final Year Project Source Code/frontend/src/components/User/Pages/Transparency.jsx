import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '../../../utils/constants.js'
import { formatCurrency, formatDate } from '../../../utils/formatters.js'
import { useUI } from '../../../hooks/useUI.js'
import { useMosque } from '../../../hooks/useMosque.js'
import api from '../../../utils/api.js'
import { downloadTransparencyReport, EXPENSE_CATEGORIES } from '../../../utils/report.js'

const PAGE_LIMIT = 6
const VIEW_ALL_LIMIT = 100

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
  const { activeMosqueId, activeMosque } = useMosque()
  const [monthFilter, setMonthFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [donationPage, setDonationPage] = useState(1)
  const [expensePage, setExpensePage] = useState(1)
  const [donationViewAll, setDonationViewAll] = useState(false)
  const [expenseViewAll, setExpenseViewAll] = useState(false)
  const { showToast } = useUI()
  const [donations, setDonations] = useState([])
  const [donationsTotalPages, setDonationsTotalPages] = useState(1)
  const [expenses, setExpenses] = useState([])
  const [expensesTotalPages, setExpensesTotalPages] = useState(1)
  const [topDonors, setTopDonors] = useState([])
  const [summary, setSummary] = useState({ totalDonations: 0, totalExpenses: 0, balance: 0 })
  const [donationTrend, setDonationTrend] = useState({ thisMonth: 0, lastMonth: 0 })
  const [expenseTrend, setExpenseTrend] = useState({ thisMonth: 0, lastMonth: 0 })
  const [loading, setLoading] = useState(true)
  const [donationFilterCategories, setDonationFilterCategories] = useState(['all', 'zakat', 'sadaqah', 'fund'])

  const allMonths = useMemo(() => {
    const set = new Set([...donations.map((d) => monthKey(d.createdAt || d.date)), ...expenses.map((e) => monthKey(e.createdAt || e.date))])
    return ['all', ...Array.from(set)]
  }, [donations, expenses])

  const donationSafePage = Math.max(1, donationPage)
  const expenseSafePage = Math.max(1, expensePage)

  useEffect(() => {
    let mounted = true

    async function load() {
      const mosqueId = activeMosqueId
      if (!mosqueId) {
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const donationLimit = donationViewAll ? VIEW_ALL_LIMIT : PAGE_LIMIT
        const expenseLimit = expenseViewAll ? VIEW_ALL_LIMIT : PAGE_LIMIT

        const donationParts = [
          `page=${donationSafePage}`,
          `limit=${donationLimit}`,
          `mosqueId=${encodeURIComponent(mosqueId)}`,
        ]
        if (typeFilter !== 'all') donationParts.push(`type=${encodeURIComponent(typeFilter)}`)
        if (monthFilter !== 'all') donationParts.push(`month=${encodeURIComponent(monthFilter)}`)

        const expenseParts = [
          `page=${expenseSafePage}`,
          `limit=${expenseLimit}`,
          `mosqueId=${encodeURIComponent(mosqueId)}`,
        ]
        if (categoryFilter !== 'all') expenseParts.push(`category=${encodeURIComponent(categoryFilter)}`)
        if (monthFilter !== 'all') expenseParts.push(`month=${encodeURIComponent(monthFilter)}`)

        const [donRes, expRes, topRes, donSumRes, expSumRes] = await Promise.all([
          api.getDonations(donationParts.join('&')),
          api.getExpenses(expenseParts.join('&')),
          api.getTopDonors(`mosqueId=${encodeURIComponent(mosqueId)}`),
          api.getDonationSummary(`mosqueId=${encodeURIComponent(mosqueId)}`),
          api.getExpenseSummary(`mosqueId=${encodeURIComponent(mosqueId)}`),
        ])

        if (!mounted) return
        setDonations(donRes.data || [])
        setDonationsTotalPages(donRes.totalPages || 1)
        setExpenses(expRes.data || [])
        setExpensesTotalPages(expRes.totalPages || 1)
        setTopDonors(topRes.data || [])

        const totalDonations = donSumRes.data?.totalDonations || 0
        const totalExpenses = expSumRes.data?.totalExpenses || 0
        setSummary({ totalDonations, totalExpenses, balance: totalDonations - totalExpenses })
        setDonationTrend({
          thisMonth: donSumRes.data?.thisMonth || 0,
          lastMonth: donSumRes.data?.lastMonth || 0,
        })
        setExpenseTrend({
          thisMonth: expSumRes.data?.thisMonth || 0,
          lastMonth: expSumRes.data?.lastMonth || 0,
        })
      } catch (e) {
        if (!mounted) return
        showToast(e.message || 'Failed to load transparency data', 'error')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => { mounted = false }
  }, [showToast, monthFilter, typeFilter, categoryFilter, donationSafePage, expenseSafePage, donationViewAll, expenseViewAll, activeMosqueId])

  function handleMonthChange(value) {
    setMonthFilter(value)
    setDonationPage(1)
    setExpensePage(1)
  }

  function handleTypeChange(value) {
    setTypeFilter(value)
    setDonationPage(1)
  }

  function handleCategoryChange(value) {
    setCategoryFilter(value)
    setExpensePage(1)
  }

  function handleResetFilters() {
    setMonthFilter('all')
    setTypeFilter('all')
    setCategoryFilter('all')
    setDonationPage(1)
    setExpensePage(1)
  }

  function handleViewAllDonations() {
    setDonationViewAll(true)
    setDonationPage(1)
  }

  function handleViewAllExpenses() {
    setExpenseViewAll(true)
    setExpensePage(1)
  }

  function handleDownloadReport() {
    try {
      const result = downloadTransparencyReport({
        mosqueName: activeMosque?.name,
        filters: { month: monthFilter, type: typeFilter, category: categoryFilter },
        donations,
        expenses,
        topDonors,
        summary,
      })
      showToast(`Report downloaded (${result.filename})`, 'success')
    } catch (err) {
      showToast(err.message || 'Failed to generate report', 'error')
    }
  }

  const totalDonations = summary.totalDonations
  const totalExpenses = summary.totalExpenses
  const balance = summary.balance

  function computeTrend(current, previous) {
    if (!previous || previous <= 0) {
      if (!current) return { label: 'No prior data', tone: 'muted', icon: 'info' }
      return { label: 'New this month', tone: 'positive', icon: 'trending_up' }
    }
    const diff = current - previous
    const pct = Math.round((diff / previous) * 100)
    if (Math.abs(pct) < 1) return { label: 'Flat vs last month', tone: 'muted', icon: 'remove' }
    const direction = pct > 0 ? 'up' : 'down'
    const tone = pct > 0 ? 'positive' : 'negative'
    const sign = pct > 0 ? '+' : ''
    return {
      label: `${sign}${pct}% from last month`,
      tone,
      icon: direction === 'up' ? 'trending_up' : 'trending_down',
    }
  }

  const donationTrendInfo = computeTrend(donationTrend.thisMonth, donationTrend.lastMonth)
  const expenseTrendInfo = computeTrend(expenseTrend.thisMonth, expenseTrend.lastMonth)

  const donationFilterChips = (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold uppercase text-gray-500">Donations:</span>
      {donationFilterCategories.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => handleTypeChange(c)}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
            typeFilter === c
              ? 'bg-[#047857] text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {c === 'all' ? 'All' : c === 'fund' ? 'Mosjid Fund' : c[0].toUpperCase() + c.slice(1)}
        </button>
      ))}
    </div>
  )

  const expenseFilterChips = (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs font-semibold uppercase text-gray-500">Expenses:</span>
      <button
        type="button"
        onClick={() => handleCategoryChange('all')}
        className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
          categoryFilter === 'all'
            ? 'bg-red-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        All
      </button>
      {EXPENSE_CATEGORIES.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => handleCategoryChange(c)}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
            categoryFilter === c
              ? 'bg-red-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {c}
        </button>
      ))}
    </div>
  )

  const activeFilterCount =
    (monthFilter !== 'all' ? 1 : 0) +
    (typeFilter !== 'all' ? 1 : 0) +
    (categoryFilter !== 'all' ? 1 : 0)

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
            </div>
            <p className="mt-3 text-sm text-gray-500">Total Donations Received</p>
            <h3 className="mt-1 text-3xl font-bold text-gray-900">{formatCurrency(totalDonations)}</h3>
            <p className={`mt-2 inline-flex items-center gap-1 text-sm ${
              donationTrendInfo.tone === 'positive' ? 'text-green-700' : donationTrendInfo.tone === 'negative' ? 'text-red-600' : 'text-gray-600'
            }`}>
              <i className="material-icons-round text-base">{donationTrendInfo.icon}</i>
              {donationTrendInfo.label}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm relative overflow-hidden">
            <div className="absolute left-0 top-0 h-full w-1 bg-red-600" />
            <div className="flex items-center justify-between">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-red-100 text-red-700">
                <i className="material-icons-round">account_balance_wallet</i>
              </span>
            </div>
            <p className="mt-3 text-sm text-gray-500">Total Funds Utilized</p>
            <h3 className="mt-1 text-3xl font-bold text-gray-900">{formatCurrency(totalExpenses)}</h3>
            <p className={`mt-2 inline-flex items-center gap-1 text-sm ${
              expenseTrendInfo.tone === 'positive' ? 'text-green-700' : expenseTrendInfo.tone === 'negative' ? 'text-red-600' : 'text-gray-600'
            }`}>
              <i className="material-icons-round text-base">{expenseTrendInfo.icon}</i>
              {expenseTrendInfo.label}
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

        <div className="rounded-xl border border-gray-200 bg-white p-4 animate-fade-in space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-gray-700">Filter by:</span>
              <select
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                value={monthFilter}
                onChange={(e) => handleMonthChange(e.target.value)}
              >
                {allMonths.map((m) => (
                  <option key={m} value={m}>
                    {m === 'all' ? 'All Months' : m[0].toUpperCase() + m.slice(1)}
                  </option>
                ))}
              </select>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  <i className="material-icons-round text-base align-middle">close</i>
                  <span className="ml-1">Reset ({activeFilterCount})</span>
                </button>
              )}
            </div>

            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-lg bg-[#047857] px-4 py-2 text-sm font-semibold text-white hover:bg-[#064e3b]"
              onClick={handleDownloadReport}
            >
              <i className="material-icons-round text-base">download</i>
              Download Report
            </button>
          </div>

          <div className="flex flex-col gap-2 border-t border-gray-100 pt-3">
            {donationFilterChips}
            {expenseFilterChips}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <section className="rounded-2xl border border-gray-200 bg-white shadow-sm animate-fade-in-up">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-5 py-4">
              <h3 className="inline-flex items-center gap-2 font-primary text-xl font-bold text-gray-900">
                <i className="material-icons-round text-[#047857]">history</i>
                Donation History
              </h3>
              {donationViewAll ? (
                <button type="button" className="inline-flex min-h-[44px] items-center gap-1 rounded-md px-3 py-2 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-100" onClick={() => setDonationViewAll(false)}>
                  <i className="material-icons-round text-base">unfold_less</i>
                  <span>Collapse</span>
                </button>
              ) : (
                <button type="button" className="inline-flex min-h-[44px] items-center gap-1 rounded-md px-3 py-2 text-sm font-semibold text-[#047857] transition-colors hover:bg-emerald-50" onClick={handleViewAllDonations}>
                  <span>View All</span>
                  <i className="material-icons-round text-base">arrow_forward</i>
                </button>
              )}
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
                  {donations.length === 0 && !loading ? (
                    <tr>
                      <td colSpan="4" className="px-4 py-8 text-center text-sm text-gray-500">
                        No donations match the current filter.
                      </td>
                    </tr>
                  ) : (
                    donations.map((d) => (
                      <tr key={d._id} className="border-t border-gray-100">
                        <td className="px-4 py-3">{formatDate(d.createdAt || d.date)}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">{d.isAnonymous ? 'Anonymous' : d.donorName}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${donationTypeClass(d.type)}`}>{d.type}</span>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-[#047857]">{formatCurrency(d.amount)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {!donationViewAll && (
              <div className="flex items-center justify-center gap-2 border-t border-gray-200 px-4 py-3">
                <button
                  type="button"
                  disabled={donationSafePage === 1 || loading}
                  onClick={() => setDonationPage((p) => Math.max(1, p - 1))}
                  className="h-8 w-8 rounded-md border border-gray-300 disabled:opacity-40"
                >
                  <i className="material-icons-round text-base">chevron_left</i>
                </button>
                <span className="text-xs text-gray-500">Page {donationSafePage} of {donationsTotalPages}</span>
                <button
                  type="button"
                  disabled={donationSafePage === donationsTotalPages || loading}
                  onClick={() => setDonationPage((p) => Math.min(donationsTotalPages, p + 1))}
                  className="h-8 w-8 rounded-md border border-gray-300 disabled:opacity-40"
                >
                  <i className="material-icons-round text-base">chevron_right</i>
                </button>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white shadow-sm animate-fade-in-up">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-5 py-4">
              <h3 className="inline-flex items-center gap-2 font-primary text-xl font-bold text-gray-900">
                <i className="material-icons-round text-[#047857]">receipt_long</i>
                Expense History
              </h3>
              {expenseViewAll ? (
                <button type="button" className="inline-flex min-h-[44px] items-center gap-1 rounded-md px-3 py-2 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-100" onClick={() => setExpenseViewAll(false)}>
                  <i className="material-icons-round text-base">unfold_less</i>
                  <span>Collapse</span>
                </button>
              ) : (
                <button type="button" className="inline-flex min-h-[44px] items-center gap-1 rounded-md px-3 py-2 text-sm font-semibold text-[#047857] transition-colors hover:bg-emerald-50" onClick={handleViewAllExpenses}>
                  <span>View All</span>
                  <i className="material-icons-round text-base">arrow_forward</i>
                </button>
              )}
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
                  {expenses.length === 0 && !loading ? (
                    <tr>
                      <td colSpan="4" className="px-4 py-8 text-center text-sm text-gray-500">
                        No expenses match the current filter.
                      </td>
                    </tr>
                  ) : (
                    expenses.map((e) => (
                      <tr key={e._id} className="border-t border-gray-100">
                        <td className="px-4 py-3">{formatDate(e.createdAt || e.date)}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${expenseTypeClass(e.category)}`}>{e.category}</span>
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">{e.description}</td>
                        <td className="px-4 py-3 text-right font-semibold text-red-600">{formatCurrency(e.amount)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {!expenseViewAll && (
              <div className="flex items-center justify-center gap-2 border-t border-gray-200 px-4 py-3">
                <button
                  type="button"
                  disabled={expenseSafePage === 1 || loading}
                  onClick={() => setExpensePage((p) => Math.max(1, p - 1))}
                  className="h-8 w-8 rounded-md border border-gray-300 disabled:opacity-40"
                >
                  <i className="material-icons-round text-base">chevron_left</i>
                </button>
                <span className="text-xs text-gray-500">Page {expenseSafePage} of {expensesTotalPages}</span>
                <button
                  type="button"
                  disabled={expenseSafePage === expensesTotalPages || loading}
                  onClick={() => setExpensePage((p) => Math.min(expensesTotalPages, p + 1))}
                  className="h-8 w-8 rounded-md border border-gray-300 disabled:opacity-40"
                >
                  <i className="material-icons-round text-base">chevron_right</i>
                </button>
              </div>
            )}
          </section>
        </div>

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
              {topDonors.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-6">No donor data available yet.</p>
              ) : (
                topDonors.map((donor) => {
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
                })
              )}
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
