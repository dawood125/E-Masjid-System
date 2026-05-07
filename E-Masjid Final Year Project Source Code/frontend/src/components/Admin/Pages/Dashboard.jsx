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

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="inline-flex items-center gap-2 text-lg font-bold text-gray-900">
            <i className="material-icons-round text-info">analytics</i>
            Financial Summary
          </h2>
          <Link to="/admin/donations" className="text-sm font-semibold text-primary-700 hover:text-primary-800">
            Full Report
          </Link>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg bg-success-light/60 px-4 py-3">
            <p className="font-medium text-gray-800">Total Income</p>
            <p className="text-xl font-bold text-success">{formatCurrency(mockFinancialSummary.totalDonations)}</p>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-error-light/60 px-4 py-3">
            <p className="font-medium text-gray-800">Total Expenses</p>
            <p className="text-xl font-bold text-error">{formatCurrency(mockFinancialSummary.totalExpenses)}</p>
          </div>

          <div className="h-px bg-gray-200" />

          <div className="flex items-center justify-between rounded-lg bg-primary-50 px-4 py-3">
            <p className="text-base font-semibold text-gray-900">Current Balance</p>
            <p className={`text-2xl font-bold ${balanceTone}`}>{formatCurrency(mockFinancialSummary.balance)}</p>
          </div>
        </div>
      </section>
    </div>
  )
}
