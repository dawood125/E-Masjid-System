import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useUI } from '../../../hooks/useUI.js'
import api from '../../../utils/api.js'
import { formatCurrency, formatDate } from '../../../utils/formatters.js'
import { getActiveMosqueId } from '../../../utils/mosque.js'

const DATE_FILTER_OPTIONS = [
  { value: 'this-month', label: 'This Month' },
  { value: 'last-month', label: 'Last Month' },
  { value: 'last-3-months', label: 'Last 3 Months' },
  { value: 'this-year', label: 'This Year' },
  { value: 'last-year', label: 'Last Year' },
]

const DONATION_TYPE_COLORS = {
  zakat: 'bg-emerald-100 text-emerald-700',
  sadaqah: 'bg-sky-100 text-sky-700',
  'masjid fund': 'bg-amber-100 text-amber-700',
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
    const d = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth(), 0)
    return target >= d && target <= lastDay
  }
  if (range === 'last-3-months') {
    const d = new Date(now.getFullYear(), now.getMonth() - 3, 1)
    return target >= d && target <= now
  }
  if (range === 'this-year') {
    return target.getFullYear() === now.getFullYear()
  }
  if (range === 'last-year') {
    return target.getFullYear() === now.getFullYear() - 1
  }
  return true
}

export default function DonationsExpenses() {
  const { showToast } = useUI()
  const [donations, setDonations] = useState([])
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingDonation, setEditingDonation] = useState(null)
  const [recordForm, setRecordForm] = useState({
    donorName: '',
    amount: '',
    type: 'Sadaqah',
    paymentMethod: 'Cash',
    isAnonymous: false,
    description: '',
    category: 'Utilities',
  })

  const [activeTab, setActiveTab] = useState('donations')
  const [dateFilter, setDateFilter] = useState('this-month')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [donationPage, setDonationPage] = useState(1)
  const [expensePage, setExpensePage] = useState(1)

  useEffect(() => {
    let mounted = true
    const mosqueId = getActiveMosqueId()
    const params = mosqueId ? `mosqueId=${mosqueId}` : ''
    ;(async () => {
      try {
        const [donationRes, expenseRes] = await Promise.all([api.getDonations(params), api.getExpenses(params)])
        if (!mounted) return
        const d = Array.isArray(donationRes.data) ? donationRes.data : []
        const e = Array.isArray(expenseRes.data) ? expenseRes.data : []
        setDonations(d.map((item) => ({ ...item, id: item._id || item.id, date: item.createdAt || item.date })))
        setExpenses(e.map((item) => ({ ...item, id: item._id || item.id, date: item.createdAt || item.date })))
      } catch (err) {
        showToast(err.message || 'Failed to load donations/expenses.', 'error')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [showToast])

  const donationTypes = useMemo(() => {
    return ['all', ...new Set(donations.map((donation) => donation.type.toLowerCase()))]
  }, [donations])

  const expenseCategories = useMemo(() => {
    return ['all', ...new Set(expenses.map((expense) => expense.category.toLowerCase()))]
  }, [expenses])

  const filteredDonations = useMemo(() => {
    return donations.filter((donation) => {
      const matchesDate = isWithinRange(donation.date, dateFilter)
      const matchesCategory = categoryFilter === 'all' || donation.type.toLowerCase() === categoryFilter
      return matchesDate && matchesCategory
    })
  }, [dateFilter, categoryFilter, donations])

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const matchesDate = isWithinRange(expense.date, dateFilter)
      const matchesCategory = categoryFilter === 'all' || expense.category.toLowerCase() === categoryFilter
      return matchesDate && matchesCategory
    })
  }, [dateFilter, categoryFilter, expenses])

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
    setEditingDonation(null)
    setRecordForm({
      donorName: '',
      amount: '',
      type: 'Sadaqah',
      paymentMethod: 'Cash',
      isAnonymous: false,
      description: '',
      category: 'Utilities',
    })
    setIsCreateOpen(true)
  }

  const onEditDonation = (donation) => {
    setEditingDonation(donation)
    setRecordForm({
      donorName: donation.donorName || '',
      amount: String(donation.amount || ''),
      type: donation.type || 'Sadaqah',
      paymentMethod: donation.paymentMethod || 'Cash',
      isAnonymous: donation.isAnonymous || false,
      description: '',
      category: 'Utilities',
    })
    setIsCreateOpen(true)
  }

  const handleCreateRecord = async (event) => {
    event.preventDefault()
    try {
      if (activeTab === 'donations') {
        const payload = {
          donorName: recordForm.isAnonymous ? 'Anonymous' : (recordForm.donorName || 'Walk-in Donor'),
          amount: Number(recordForm.amount),
          type: recordForm.type,
          paymentMethod: recordForm.paymentMethod,
          isAnonymous: recordForm.isAnonymous,
        }

        if (editingDonation) {
          const res = await api.updateDonation(editingDonation.id, payload)
          setDonations((prev) =>
            prev.map((d) => (d.id === editingDonation.id ? { ...res.data, id: res.data._id || res.data.id, date: res.data.createdAt || res.data.date } : d))
          )
          showToast('Donation updated successfully.', 'success')
        } else {
          const res = await api.createDonation(payload)
          setDonations((prev) => [{ ...res.data, id: res.data._id || res.data.id, date: res.data.createdAt || res.data.date }, ...prev])
          showToast('Donation added successfully.', 'success')
        }
      } else {
        const payload = {
          description: recordForm.description,
          amount: Number(recordForm.amount),
          category: recordForm.category,
        }
        if (recordForm._editExpenseId) {
          const res = await api.updateExpense(recordForm._editExpenseId, payload)
          setExpenses((prev) =>
            prev.map((e) => (e.id === recordForm._editExpenseId ? { ...res.data, id: res.data._id || res.data.id, date: res.data.createdAt || res.data.date } : e))
          )
          showToast('Expense updated successfully.', 'success')
        } else {
          const res = await api.createExpense(payload)
          setExpenses((prev) => [{ ...res.data, id: res.data._id || res.data.id, date: res.data.createdAt || res.data.date }, ...prev])
          showToast('Expense added successfully.', 'success')
        }
      }
      setIsCreateOpen(false)
      setEditingDonation(null)
      setRecordForm({
        donorName: '',
        amount: '',
        type: 'Sadaqah',
        paymentMethod: 'Cash',
        isAnonymous: false,
        description: '',
        category: 'Utilities',
      })
    } catch (err) {
      showToast(err.message || 'Failed to add record.', 'error')
    }
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
            {netBalance >= 0 ? 'Healthy' : 'Needs Attention'}
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
                {loading && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                      Loading donations...
                    </td>
                  </tr>
                )}
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
                            onClick={() => onEditDonation(donation)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-600 transition-all duration-150 hover:bg-gray-100"
                          >
                            <i className="material-icons-round text-base">edit</i>
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await api.deleteDonation(donation.id)
                                setDonations((prev) => prev.filter((item) => item.id !== donation.id))
                                showToast('Donation deleted successfully.', 'success')
                              } catch (err) {
                                showToast(err.message || 'Failed to delete donation.', 'error')
                              }
                            }}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-red-200 text-red-600 transition-all duration-150 hover:bg-red-50"
                          >
                            <i className="material-icons-round text-base">delete</i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {!loading && !visibleDonations.length && (
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
                {loading && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                      Loading expenses...
                    </td>
                  </tr>
                )}
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
                            onClick={() => {
                              setRecordForm({
                                donorName: '',
                                amount: String(expense.amount),
                                type: 'Sadaqah',
                                paymentMethod: 'Cash',
                                isAnonymous: false,
                                description: expense.description || '',
                                category: expense.category || 'Utilities',
                                _editExpenseId: expense.id,
                              })
                              setActiveTab('expenses')
                              setIsCreateOpen(true)
                            }}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-600 transition-all duration-150 hover:bg-gray-100"
                          >
                            <i className="material-icons-round text-base">edit</i>
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await api.deleteExpense(expense.id)
                                setExpenses((prev) => prev.filter((item) => item.id !== expense.id))
                                showToast('Expense deleted successfully.', 'success')
                              } catch (err) {
                                showToast(err.message || 'Failed to delete expense.', 'error')
                              }
                            }}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-red-200 text-red-600 transition-all duration-150 hover:bg-red-50"
                          >
                            <i className="material-icons-round text-base">delete</i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {!loading && !visibleExpenses.length && (
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

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-bold text-gray-900">
                {activeTab === 'donations' ? (editingDonation ? 'Edit Donation' : 'Add Donation') : 'Add Expense'}
              </h3>
              <button type="button" onClick={() => { setIsCreateOpen(false); setEditingDonation(null) }} className="text-gray-500 hover:text-gray-700">
                <i className="material-icons-round">close</i>
              </button>
            </div>
            <form onSubmit={handleCreateRecord} className="space-y-4 px-6 py-5">
              {activeTab === 'donations' ? (
                <>
                  <label className="flex items-center gap-3 cursor-pointer select-none rounded-lg border border-gray-200 px-3 py-2.5">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-primary-700 focus:ring-primary-500"
                      checked={recordForm.isAnonymous}
                      onChange={(e) => setRecordForm((p) => ({ ...p, isAnonymous: e.target.checked, ...(e.target.checked ? { donorName: '' } : {}) }))}
                    />
                    <span className="text-sm font-medium text-gray-700">Anonymous Donor</span>
                  </label>
                  {!recordForm.isAnonymous && (
                    <label className="block space-y-2">
                      <span className="text-sm font-medium text-gray-700">Donor Name</span>
                      <input
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
                        value={recordForm.donorName}
                        onChange={(e) => setRecordForm((p) => ({ ...p, donorName: e.target.value }))}
                      />
                    </label>
                  )}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-gray-700">Type</span>
                      <select
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
                        value={recordForm.type}
                        onChange={(e) => setRecordForm((p) => ({ ...p, type: e.target.value }))}
                      >
                        <option>Sadaqah</option>
                        <option>Zakat</option>
                        <option>Masjid Fund</option>
                      </select>
                    </label>
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-gray-700">Payment Method</span>
                      <select
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
                        value={recordForm.paymentMethod}
                        onChange={(e) => setRecordForm((p) => ({ ...p, paymentMethod: e.target.value }))}
                        disabled
                      >
                        <option>Cash</option>
                      </select>
                    </label>
                  </div>
                </>
              ) : (
                <>
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-gray-700">Description</span>
                    <input
                      required
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
                      value={recordForm.description}
                      onChange={(e) => setRecordForm((p) => ({ ...p, description: e.target.value }))}
                    />
                  </label>
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-gray-700">Category</span>
                    <select
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
                      value={recordForm.category}
                      onChange={(e) => setRecordForm((p) => ({ ...p, category: e.target.value }))}
                    >
                      <option>Utilities</option>
                      <option>Salary</option>
                      <option>Renovation</option>
                      <option>Charity</option>
                      <option>Maintenance</option>
                      <option>Events</option>
                      <option>Education</option>
                      <option>Equipment</option>
                      <option>Other</option>
                    </select>
                  </label>
                </>
              )}
              <label className="block space-y-2">
                <span className="text-sm font-medium text-gray-700">Amount (PKR)</span>
                <input
                  type="number"
                  min="1"
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
                  value={recordForm.amount}
                  onChange={(e) => setRecordForm((p) => ({ ...p, amount: e.target.value }))}
                />
              </label>
              <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
                <button
                  type="button"
                  onClick={() => { setIsCreateOpen(false); setEditingDonation(null) }}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button type="submit" className="rounded-lg bg-primary-700 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-800">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
