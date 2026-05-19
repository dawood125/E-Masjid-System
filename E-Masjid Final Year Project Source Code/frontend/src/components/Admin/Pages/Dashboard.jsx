import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import {
  mockFinancialSummary,
  mockDonations,
  mockExpenses,
  mockEvents,
  mockNikahBookings,
} from '../../../mocks'
import { formatCurrency, formatDate } from '../../../utils/formatters.js'

const QUICK_ACTIONS = [
  {
    to: '/admin/donations',
    icon: 'add_circle',
    label: 'Add Donation',
    tone: 'bg-primary-700 text-white hover:bg-primary-800',
  },
  {
    to: '/admin/donations',
    icon: 'receipt_long',
    label: 'Record Expense',
    tone: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100',
  },
  {
    to: '/admin/announcements',
    icon: 'campaign',
    label: 'New Announcement',
    tone: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100',
  },
  {
    to: '/admin/events',
    icon: 'event',
    label: 'Create Event',
    tone: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100',
  },
  {
    to: '/admin/prayer-times',
    icon: 'schedule',
    label: 'Update Prayer Times',
    tone: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100',
  },
  {
    to: '/admin/scholars',
    icon: 'person_add',
    label: 'Add Scholar',
    tone: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100',
  },
]

export default function Dashboard() {
  const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const pendingNikahCount = useMemo(
    () => mockNikahBookings.filter((booking) => booking.status === 'pending').length,
    []
  )

  const upcomingEventsCount = useMemo(() => {
    const now = new Date()
    const nextWeek = new Date(now)
    nextWeek.setDate(now.getDate() + 7)

    return mockEvents.filter((event) => {
      const eventDate = new Date(event.date)
      return eventDate >= now && eventDate <= nextWeek
    }).length
  }, [])

  const recentDonations = useMemo(
    () => [...mockDonations].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3),
    []
  )

  const recentExpenses = useMemo(
    () => [...mockExpenses].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3),
    []
  )

  const balanceTone = mockFinancialSummary.balance >= 0 ? 'text-success' : 'text-error'

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary-800">Assalam-o-Alaikum, Haji Ahmad</h1>
          <p className="text-sm text-gray-500">{todayLabel}</p>
        </div>
        <Link
          to="/"
          target="_blank"
          rel="noreferrer"
          className="inline-flex w-fit items-center gap-2 rounded-lg border border-primary-300 px-4 py-2 text-sm font-semibold text-primary-700 transition-all duration-150 hover:bg-primary-50"
        >
          <i className="material-icons-round text-base">visibility</i>
          View Website
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100 text-primary-700">
            <i className="material-icons-round">volunteer_activism</i>
          </div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total Donations</p>
          <h3 className="mt-2 text-2xl font-bold text-gray-900">{formatCurrency(mockFinancialSummary.totalDonations)}</h3>
          <p className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-success">
            <i className="material-icons-round text-base">trending_up</i>
            +12% this month
          </p>
        </article>

        <article className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-warning-light text-warning">
            <i className="material-icons-round">payments</i>
          </div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total Expenses</p>
          <h3 className="mt-2 text-2xl font-bold text-gray-900">{formatCurrency(mockFinancialSummary.totalExpenses)}</h3>
          <p className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-gray-500">
            <i className="material-icons-round text-base">trending_flat</i>
            This month
          </p>
        </article>

        <article className="rounded-xl border border-amber-200 bg-white p-6 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md">
          <div className="mb-4 flex items-start justify-between">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <i className="material-icons-round">favorite</i>
            </div>
            <span className="rounded-full bg-error-light px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-error">
              Action Needed
            </span>
          </div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Pending Nikah</p>
          <h3 className="mt-2 text-2xl font-bold text-gray-900">{pendingNikahCount} Requests</h3>
          <Link to="/admin/scholars" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary-700 hover:text-primary-800">
            Assign to Scholar
            <i className="material-icons-round text-base">arrow_forward</i>
          </Link>
        </article>

        <article className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-info-light text-info">
            <i className="material-icons-round">event</i>
          </div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Upcoming Events</p>
          <h3 className="mt-2 text-2xl font-bold text-gray-900">{upcomingEventsCount} This Week</h3>
          <Link to="/admin/events" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary-700 hover:text-primary-800">
            View All
            <i className="material-icons-round text-base">arrow_forward</i>
          </Link>
        </article>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <i className="material-icons-round text-primary-700">bolt</i>
          <h2 className="text-lg font-bold text-gray-900">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.label}
              to={action.to}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-all duration-150 ${action.tone}`}
            >
              <i className="material-icons-round text-base">{action.icon}</i>
              {action.label}
            </Link>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="inline-flex items-center gap-2 text-lg font-bold text-gray-900">
              <i className="material-icons-round text-success">volunteer_activism</i>
              Recent Donations
            </h2>
            <Link to="/admin/donations" className="text-sm font-semibold text-primary-700 hover:text-primary-800">
              View All
            </Link>
          </div>

          <div className="space-y-4">
            {recentDonations.map((donation) => (
              <article key={donation.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                <div className="flex items-center gap-3">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-success-light text-success">
                    <i className="material-icons-round text-base">attach_money</i>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{donation.donorName} donated</p>
                    <p className="text-xs text-gray-500">{donation.type} • {formatDate(donation.date)}</p>
                  </div>
                </div>
                <p className="font-bold text-success">{formatCurrency(donation.amount)}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="inline-flex items-center gap-2 text-lg font-bold text-gray-900">
              <i className="material-icons-round text-warning">payments</i>
              Recent Expenses
            </h2>
            <Link to="/admin/donations" className="text-sm font-semibold text-primary-700 hover:text-primary-800">
              View All
            </Link>
          </div>

          <div className="space-y-4">
            {recentExpenses.map((expense) => (
              <article key={expense.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                <div className="flex items-center gap-3">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-warning-light text-warning">
                    <i className="material-icons-round text-base">receipt_long</i>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{expense.description}</p>
                    <p className="text-xs text-gray-500">{expense.category} • {formatDate(expense.date)}</p>
                  </div>
                </div>
                <p className="font-bold text-error">{formatCurrency(expense.amount)}</p>
              </article>
            ))}
          </div>
        </section>
      </div>

      {/* ==================== CHARTS SECTION ==================== */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Income vs Expenses Bar Chart */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="inline-flex items-center gap-2 text-lg font-bold text-gray-900">
              <i className="material-icons-round text-info">bar_chart</i>
              Income vs Expenses
            </h2>
            <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">FY 2024-25</span>
          </div>

          <div className="space-y-5">
            {/* Income bar */}
            <div>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">Total Income</span>
                <span className="font-bold text-success">{formatCurrency(mockFinancialSummary.totalDonations)}</span>
              </div>
              <div className="h-8 w-full overflow-hidden rounded-lg bg-gray-100">
                <div
                  className="h-full rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 transition-all duration-1000 ease-out flex items-center justify-end pr-2"
                  style={{ width: '100%' }}
                >
                  <span className="text-xs font-bold text-white">100%</span>
                </div>
              </div>
            </div>

            {/* Expenses bar */}
            <div>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">Total Expenses</span>
                <span className="font-bold text-red-600">{formatCurrency(mockFinancialSummary.totalExpenses)}</span>
              </div>
              <div className="h-8 w-full overflow-hidden rounded-lg bg-gray-100">
                <div
                  className="h-full rounded-lg bg-gradient-to-r from-red-400 to-red-500 transition-all duration-1000 ease-out flex items-center justify-end pr-2"
                  style={{ width: `${Math.round((mockFinancialSummary.totalExpenses / mockFinancialSummary.totalDonations) * 100)}%` }}
                >
                  <span className="text-xs font-bold text-white">
                    {Math.round((mockFinancialSummary.totalExpenses / mockFinancialSummary.totalDonations) * 100)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Balance bar */}
            <div>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">Remaining Balance</span>
                <span className={`font-bold ${balanceTone}`}>{formatCurrency(mockFinancialSummary.balance)}</span>
              </div>
              <div className="h-8 w-full overflow-hidden rounded-lg bg-gray-100">
                <div
                  className="h-full rounded-lg bg-gradient-to-r from-[#047857] to-[#065f46] transition-all duration-1000 ease-out flex items-center justify-end pr-2"
                  style={{ width: `${Math.round((mockFinancialSummary.balance / mockFinancialSummary.totalDonations) * 100)}%` }}
                >
                  <span className="text-xs font-bold text-white">
                    {Math.round((mockFinancialSummary.balance / mockFinancialSummary.totalDonations) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Summary cards at bottom */}
          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-green-50 p-3 text-center">
              <p className="text-xs text-gray-500">Income</p>
              <p className="text-sm font-bold text-green-700">{formatCurrency(mockFinancialSummary.totalDonations)}</p>
            </div>
            <div className="rounded-lg bg-red-50 p-3 text-center">
              <p className="text-xs text-gray-500">Expenses</p>
              <p className="text-sm font-bold text-red-600">{formatCurrency(mockFinancialSummary.totalExpenses)}</p>
            </div>
            <div className="rounded-lg bg-primary-50 p-3 text-center">
              <p className="text-xs text-gray-500">Balance</p>
              <p className={`text-sm font-bold ${balanceTone}`}>{formatCurrency(mockFinancialSummary.balance)}</p>
            </div>
          </div>
        </section>

        {/* Donation Breakdown Donut Chart */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="inline-flex items-center gap-2 text-lg font-bold text-gray-900">
              <i className="material-icons-round text-[#d4af37]">donut_large</i>
              Donation Breakdown
            </h2>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">By Type</span>
          </div>

          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            {/* CSS Donut chart */}
            {(() => {
              const total = mockFinancialSummary.donationsByType.zakat + mockFinancialSummary.donationsByType.sadaqah + mockFinancialSummary.donationsByType.mosqueFund
              const zakatPct = (mockFinancialSummary.donationsByType.zakat / total) * 100
              const sadaqahPct = (mockFinancialSummary.donationsByType.sadaqah / total) * 100
              const fundPct = (mockFinancialSummary.donationsByType.mosqueFund / total) * 100

              return (
                <div className="relative shrink-0" style={{ width: 180, height: 180 }}>
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    {/* Zakat */}
                    <circle
                      cx="18" cy="18" r="15.91"
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="3.5"
                      strokeDasharray={`${zakatPct} ${100 - zakatPct}`}
                      strokeDashoffset="0"
                      className="transition-all duration-1000"
                    />
                    {/* Sadaqah */}
                    <circle
                      cx="18" cy="18" r="15.91"
                      fill="none"
                      stroke="#16a34a"
                      strokeWidth="3.5"
                      strokeDasharray={`${sadaqahPct} ${100 - sadaqahPct}`}
                      strokeDashoffset={`${-zakatPct}`}
                      className="transition-all duration-1000"
                    />
                    {/* Mosque Fund */}
                    <circle
                      cx="18" cy="18" r="15.91"
                      fill="none"
                      stroke="#d4af37"
                      strokeWidth="3.5"
                      strokeDasharray={`${fundPct} ${100 - fundPct}`}
                      strokeDashoffset={`${-(zakatPct + sadaqahPct)}`}
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(total)}</p>
                    <p className="text-xs text-gray-500">Total</p>
                  </div>
                </div>
              )
            })()}

            {/* Legend */}
            <div className="flex-1 space-y-4 w-full">
              {[
                { label: 'Zakat', amount: mockFinancialSummary.donationsByType.zakat, color: 'bg-blue-600', pct: Math.round((mockFinancialSummary.donationsByType.zakat / (mockFinancialSummary.donationsByType.zakat + mockFinancialSummary.donationsByType.sadaqah + mockFinancialSummary.donationsByType.mosqueFund)) * 100) },
                { label: 'Sadaqah', amount: mockFinancialSummary.donationsByType.sadaqah, color: 'bg-green-600', pct: Math.round((mockFinancialSummary.donationsByType.sadaqah / (mockFinancialSummary.donationsByType.zakat + mockFinancialSummary.donationsByType.sadaqah + mockFinancialSummary.donationsByType.mosqueFund)) * 100) },
                { label: 'Mosque Fund', amount: mockFinancialSummary.donationsByType.mosqueFund, color: 'bg-[#d4af37]', pct: Math.round((mockFinancialSummary.donationsByType.mosqueFund / (mockFinancialSummary.donationsByType.zakat + mockFinancialSummary.donationsByType.sadaqah + mockFinancialSummary.donationsByType.mosqueFund)) * 100) },
              ].map((item) => (
                <div key={item.label}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className={`inline-block h-3 w-3 rounded-full ${item.color}`} />
                      <span className="font-medium text-gray-700">{item.label}</span>
                    </div>
                    <span className="font-semibold text-gray-900">{formatCurrency(item.amount)}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={`h-full rounded-full ${item.color} transition-all duration-700`}
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                  <p className="mt-0.5 text-right text-xs text-gray-400">{item.pct}%</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Expense Breakdown by Category */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="inline-flex items-center gap-2 text-lg font-bold text-gray-900">
            <i className="material-icons-round text-warning">pie_chart</i>
            Expense Breakdown
          </h2>
          <Link to="/admin/donations" className="text-sm font-semibold text-primary-700 hover:text-primary-800">
            Full Report
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {[
            { label: 'Utilities', amount: mockFinancialSummary.expensesByCategory.utilities, icon: 'bolt', color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Salary', amount: mockFinancialSummary.expensesByCategory.salary, icon: 'groups', color: 'text-violet-600', bg: 'bg-violet-50' },
            { label: 'Renovation', amount: mockFinancialSummary.expensesByCategory.renovation, icon: 'construction', color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Charity', amount: mockFinancialSummary.expensesByCategory.charity, icon: 'favorite', color: 'text-rose-600', bg: 'bg-rose-50' },
            { label: 'Maintenance', amount: mockFinancialSummary.expensesByCategory.maintenance, icon: 'build', color: 'text-green-600', bg: 'bg-green-50' },
          ].map((cat) => (
            <div key={cat.label} className={`rounded-xl ${cat.bg} p-4 text-center transition-all hover:-translate-y-0.5 hover:shadow-md`}>
              <i className={`material-icons-round text-2xl ${cat.color}`}>{cat.icon}</i>
              <p className="mt-2 text-xs font-medium text-gray-500">{cat.label}</p>
              <p className="mt-1 text-lg font-bold text-gray-900">{formatCurrency(cat.amount)}</p>
              <p className="text-xs text-gray-400">{Math.round((cat.amount / mockFinancialSummary.totalExpenses) * 100)}%</p>
            </div>
          ))}
        </div>

        {/* Horizontal stacked bar showing expense distribution */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-gray-500 mb-2">Distribution</p>
          <div className="flex h-6 w-full overflow-hidden rounded-full bg-gray-100">
            {[
              { amount: mockFinancialSummary.expensesByCategory.utilities, color: 'bg-blue-500' },
              { amount: mockFinancialSummary.expensesByCategory.salary, color: 'bg-violet-500' },
              { amount: mockFinancialSummary.expensesByCategory.renovation, color: 'bg-amber-500' },
              { amount: mockFinancialSummary.expensesByCategory.charity, color: 'bg-rose-500' },
              { amount: mockFinancialSummary.expensesByCategory.maintenance, color: 'bg-green-500' },
            ].map((seg, idx) => (
              <div
                key={idx}
                className={`${seg.color} h-full transition-all duration-700 first:rounded-l-full last:rounded-r-full`}
                style={{ width: `${(seg.amount / mockFinancialSummary.totalExpenses) * 100}%` }}
                title={`${Math.round((seg.amount / mockFinancialSummary.totalExpenses) * 100)}%`}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-3 mt-2">
            {[
              { label: 'Utilities', color: 'bg-blue-500' },
              { label: 'Salary', color: 'bg-violet-500' },
              { label: 'Renovation', color: 'bg-amber-500' },
              { label: 'Charity', color: 'bg-rose-500' },
              { label: 'Maintenance', color: 'bg-green-500' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1.5 text-xs text-gray-600">
                <span className={`inline-block h-2 w-2 rounded-full ${item.color}`} />
                {item.label}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
