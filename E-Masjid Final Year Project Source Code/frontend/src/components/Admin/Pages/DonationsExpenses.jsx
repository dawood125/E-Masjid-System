import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useUI } from '../../../hooks/useUI.js'
import { mockDonations, mockExpenses, mockFinancialSummary } from '../../../mocks'
import { formatCurrency, formatDate } from '../../../utils/formatters.js'

const DATE_FILTER_OPTIONS = [
  { value: 'this-month', label: 'This Month' },
  { value: 'last-month', label: 'Last Month' },
  { value: 'last-3-months', label: 'Last 3 Months' },
  { value: 'this-year', label: 'This Year' },
]

const DONATION_TYPE_COLORS = {
  zakat: 'bg-emerald-100 text-emerald-700',
  sadaqah: 'bg-sky-100 text-sky-700',
  'mosque fund': 'bg-amber-100 text-amber-700',
  jummah: 'bg-purple-100 text-purple-700',
  default: 'bg-gray-100 text-gray-700',
}

const EXPENSE_CATEGORY_COLORS = {
  utilities: 'bg-blue-100 text-blue-700',
  salary: 'bg-red-100 text-red-700',
  renovation: 'bg-orange-100 text-orange-700',
  charity: 'bg-violet-100 text-violet-700',
  maintenance: 'bg-yellow-100 text-yellow-700',
  default: 'bg-gray-100 text-gray-700',
}

const PAGE_SIZE = 5

function isWithinRange(dateString, range) {
  const target = new Date(dateString)
  const now = new Date()

  if (range === 'this-month') {
    return target.getFullYear() === now.getFullYear() && target.getMonth() === now.getMonth()
  }

  if (range === 'last-month') {
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    return target.getFullYear() === lastMonth.getFullYear() && target.getMonth() === lastMonth.getMonth()
  }

  if (range === 'last-3-months') {
    const threeMonthsBack = new Date(now)
    threeMonthsBack.setMonth(now.getMonth() - 3)
    return target >= threeMonthsBack && target <= now
  }

  if (range === 'this-year') {
    return target.getFullYear() === now.getFullYear()
  }

  return true
}

export default function DonationsExpenses() {
  const { showToast } = useUI()

  const [activeTab, setActiveTab] = useState('donations')
  const [dateFilter, setDateFilter] = useState('this-month')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [donationPage, setDonationPage] = useState(1)
  const [expensePage, setExpensePage] = useState(1)

  const donationTypes = useMemo(() => {
    return ['all', ...new Set(mockDonations.map((donation) => donation.type.toLowerCase()))]
  }, [])

  const expenseCategories = useMemo(() => {
    return ['all', ...new Set(mockExpenses.map((expense) => expense.category.toLowerCase()))]
  }, [])

  const filteredDonations = useMemo(() => {
    return mockDonations.filter((donation) => {
      const matchesDate = isWithinRange(donation.date, dateFilter)
      const matchesCategory = categoryFilter === 'all' || donation.type.toLowerCase() === categoryFilter
      return matchesDate && matchesCategory
    })
  }, [dateFilter, categoryFilter])

  const filteredExpenses = useMemo(() => {
    return mockExpenses.filter((expense) => {
      const matchesDate = isWithinRange(expense.date, dateFilter)
      const matchesCategory = categoryFilter === 'all' || expense.category.toLowerCase() === categoryFilter
      return matchesDate && matchesCategory
    })
  }, [dateFilter, categoryFilter])

  const donationMaxPage = Math.max(1, Math.ceil(filteredDonations.length / PAGE_SIZE))
  const expenseMaxPage = Math.max(1, Math.ceil(filteredExpenses.length / PAGE_SIZE))

  const visibleDonations = filteredDonations.slice((donationPage - 1) * PAGE_SIZE, donationPage * PAGE_SIZE)
  const visibleExpenses = filteredExpenses.slice((expensePage - 1) * PAGE_SIZE, expensePage * PAGE_SIZE)

  const totalDonations = filteredDonations.reduce((sum, donation) => sum + donation.amount, 0)
  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0)
  const netBalance = totalDonations - totalExpenses

  const categoryOptions = activeTab === 'donations' ? donationTypes : expenseCategories

  const handleSwitchTab = (tab) => {
    setActiveTab(tab)
    setCategoryFilter('all')
  }

  const onAddRecord = () => {
    showToast(activeTab === 'donations' ? 'Add Donation form opened (mock).' : 'Add Expense form opened (mock).', 'info')
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-1 text-sm text-gray-500">
            <span>Admin</span>
            <i className="material-icons-round text-base">chevron_right</i>
            <span>Donations & Expenses</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Donations & Expenses</h1>
        </div>
        <Link
          to="/transparency"
          target="_blank"
          rel="noreferrer"
          className="inline-flex w-fit items-center gap-2 rounded-lg border border-primary-300 px-4 py-2 text-sm font-semibold text-primary-700 transition-all duration-150 hover:bg-primary-50"
        >
          <i className="material-icons-round text-base">visibility</i>
          View Public Report
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <article className="rounded-xl border border-emerald-200 bg-white p-5 shadow-sm">
          <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
            <i className="material-icons-round">trending_up</i>
          </div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total Donations (Income)</p>
          <h3 className="mt-2 text-2xl font-bold text-emerald-700">{formatCurrency(totalDonations)}</h3>
          <p className="mt-2 text-sm text-emerald-700">+12% vs last month</p>
        </article>

        <article className="rounded-xl border border-red-200 bg-white p-5 shadow-sm">
          <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-red-100 text-red-700">
            <i className="material-icons-round">trending_down</i>
          </div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total Expenses (Spending)</p>
          <h3 className="mt-2 text-2xl font-bold text-red-700">{formatCurrency(totalExpenses)}</h3>
          <p className="mt-2 text-sm text-red-700">+5% vs last month</p>
        </article>

        <article className="rounded-xl bg-primary-700 p-5 text-white shadow-sm">
          <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-white/15">
            <i className="material-icons-round">account_balance_wallet</i>
          </div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary-100">Net Balance</p>
          <h3 className="mt-2 text-2xl font-bold">{formatCurrency(netBalance)}</h3>
          <span className="mt-2 inline-flex rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold">
            {mockFinancialSummary.balance >= 0 ? 'Healthy' : 'Needs Attention'}
          </span>
        </article>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="inline-flex rounded-lg bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => handleSwitchTab('donations')}
              className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-all duration-150 ${
                activeTab === 'donations' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-600'
              }`}
            >
              <i className="material-icons-round text-base">volunteer_activism</i>
              Donations (Income)
            </button>
            <button
              type="button"
              onClick={() => handleSwitchTab('expenses')}
              className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-all duration-150 ${
                activeTab === 'expenses' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-600'
              }`}
            >
              <i className="material-icons-round text-base">payments</i>
              Expenses (Spending)
            </button>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="relative">
                <span className="pointer-events-none absolute left-3 top-2.5 text-gray-400">
                  <i className="material-icons-round text-base">calendar_month</i>
                </span>
                <select
                  value={dateFilter}
                  onChange={(event) => {
                    setDateFilter(event.target.value)
                    setDonationPage(1)
                    setExpensePage(1)
                  }}
                  className="min-w-[170px] rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-primary-500 focus:outline-none"
                >
                  {DATE_FILTER_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="relative">
                <span className="pointer-events-none absolute left-3 top-2.5 text-gray-400">
                  <i className="material-icons-round text-base">filter_list</i>
                </span>
                <select
                  value={categoryFilter}
                  onChange={(event) => {
                    setCategoryFilter(event.target.value)
                    setDonationPage(1)
                    setExpensePage(1)
                  }}
                  className="min-w-[170px] rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-primary-500 focus:outline-none"
                >
                  {categoryOptions.map((option) => (
                    <option key={option} value={option}>
                      {option === 'all' ? 'All Categories' : option.replace(/(^\w|\s\w)/g, (m) => m.toUpperCase())}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <button
              type="button"
              onClick={onAddRecord}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-700 px-4 py-2 text-sm font-semibold text-white transition-all duration-150 hover:bg-primary-800"
            >
              <i className="material-icons-round text-base">add</i>
              {activeTab === 'donations' ? 'Add Donation' : 'Add Expense'}
            </button>
          </div>
        </div>
      </section>

      {activeTab === 'donations' ? (
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Donor Name</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3 text-right">Amount (PKR)</th>
                  <th className="px-4 py-3">Payment Method</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {visibleDonations.map((donation) => {
                  const tone = DONATION_TYPE_COLORS[donation.type.toLowerCase()] || DONATION_TYPE_COLORS.default
                  return (
                    <tr key={donation.id}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{formatDate(donation.date)}</p>
                        <p className="text-xs text-gray-500">10:30 AM</p>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">{donation.donorName}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>{donation.type}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{donation.type} contribution</td>
                      <td className="px-4 py-3 text-right font-semibold text-success">+ {donation.amount.toLocaleString('en-PK')}</td>
                      <td className="px-4 py-3 text-gray-700">{donation.paymentMethod}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => showToast('Edit donation flow will be connected to backend.', 'info')}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-600 transition-all duration-150 hover:bg-gray-100"
                          >
                            <i className="material-icons-round text-base">edit</i>
                          </button>
                          <button
                            type="button"
                            onClick={() => showToast('Delete action is disabled in demo mode.', 'warning')}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-red-200 text-red-600 transition-all duration-150 hover:bg-red-50"
                          >
                            <i className="material-icons-round text-base">delete</i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {!visibleDonations.length && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                      No donations found for this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-gray-200 px-4 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="text-gray-600">
              Showing <strong>{visibleDonations.length ? (donationPage - 1) * PAGE_SIZE + 1 : 0}</strong> to{' '}
              <strong>{Math.min(donationPage * PAGE_SIZE, filteredDonations.length)}</strong> of{' '}
              <strong>{filteredDonations.length}</strong> donations
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={donationPage === 1}
                onClick={() => setDonationPage((prev) => Math.max(1, prev - 1))}
                className="rounded-lg border border-gray-300 px-3 py-1.5 font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={donationPage >= donationMaxPage}
                onClick={() => setDonationPage((prev) => Math.min(donationMaxPage, prev + 1))}
                className="rounded-lg border border-gray-300 px-3 py-1.5 font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </section>
      ) : (
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3 text-right">Amount (PKR)</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {visibleExpenses.map((expense) => {
                  const tone = EXPENSE_CATEGORY_COLORS[expense.category.toLowerCase()] || EXPENSE_CATEGORY_COLORS.default
                  return (
                    <tr key={expense.id}>
                      <td className="px-4 py-3 font-medium text-gray-900">{formatDate(expense.date)}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>{expense.category}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{expense.description}</td>
                      <td className="px-4 py-3 text-right font-semibold text-error">- {expense.amount.toLocaleString('en-PK')}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => showToast('Edit expense flow will be connected to backend.', 'info')}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-600 transition-all duration-150 hover:bg-gray-100"
                          >
                            <i className="material-icons-round text-base">edit</i>
                          </button>
                          <button
                            type="button"
                            onClick={() => showToast('Delete action is disabled in demo mode.', 'warning')}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-red-200 text-red-600 transition-all duration-150 hover:bg-red-50"
                          >
                            <i className="material-icons-round text-base">delete</i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {!visibleExpenses.length && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                      No expenses found for this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-gray-200 px-4 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="text-gray-600">
              Showing <strong>{visibleExpenses.length ? (expensePage - 1) * PAGE_SIZE + 1 : 0}</strong> to{' '}
              <strong>{Math.min(expensePage * PAGE_SIZE, filteredExpenses.length)}</strong> of{' '}
              <strong>{filteredExpenses.length}</strong> expenses
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={expensePage === 1}
                onClick={() => setExpensePage((prev) => Math.max(1, prev - 1))}
                className="rounded-lg border border-gray-300 px-3 py-1.5 font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={expensePage >= expenseMaxPage}
                onClick={() => setExpensePage((prev) => Math.min(expenseMaxPage, prev + 1))}
                className="rounded-lg border border-gray-300 px-3 py-1.5 font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
