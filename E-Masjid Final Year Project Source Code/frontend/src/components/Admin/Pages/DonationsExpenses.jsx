import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useUI } from '../../../hooks/useUI.js'
import api from '../../../utils/api.js'
import { formatCurrency, formatDate } from '../../../utils/formatters.js'
import { getActiveMosqueId } from '../../../utils/mosque.js'
import FormField from '../../Common/FormField.jsx'

function validateDonation(form) {
  const errs = {}
  if (!form.isAnonymous && !form.donorName.trim()) errs.donorName = 'Donor name is required when not anonymous'
  const amt = Number(form.amount)
  if (!form.amount && form.amount !== 0) errs.amount = 'Amount is required'
  else if (Number.isNaN(amt) || amt <= 0) errs.amount = 'Enter a valid amount greater than 0'
  return errs
}

function validateExpense(form) {
  const errs = {}
  if (!form.description.trim()) errs.description = 'Description is required'
  else if (form.description.trim().length < 3) errs.description = 'Please write a longer description'
  const amt = Number(form.amount)
  if (!form.amount && form.amount !== 0) errs.amount = 'Amount is required'
  else if (Number.isNaN(amt) || amt <= 0) errs.amount = 'Enter a valid amount greater than 0'
  return errs
}

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

const PAGE_SIZE = 20

function formatRecordTime(dateString) {
  if (!dateString) return ''
  const d = new Date(dateString)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function recordNote(item, activeTab) {
  if (!item) return ''
  if (activeTab === 'donations') {
    if (item.note && String(item.note).trim()) return item.note
    if (item.description && String(item.description).trim()) return item.description
    return `${item.type || 'Donation'} contribution`
  }
  return item.description || `${item.category || 'Expense'} expense`
}

export default function DonationsExpenses() {
  const { showToast } = useUI()
  const [donations, setDonations] = useState([])
  const [donationsTotal, setDonationsTotal] = useState(0)
  const [donationsTotalPages, setDonationsTotalPages] = useState(1)
  const [expenses, setExpenses] = useState([])
  const [expensesTotal, setExpensesTotal] = useState(0)
  const [expensesTotalPages, setExpensesTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const submittingRef = useRef(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingDonation, setEditingDonation] = useState(null)
  const [recordForm, setRecordForm] = useState({
    donorName: '',
    amount: '',
    type: 'Sadaqah',
    paymentMethod: 'Cash',
    isAnonymous: false,
    description: '',
    note: '',
    category: 'Utilities',
  })
  const [recordErrors, setRecordErrors] = useState({})

  const [activeTab, setActiveTab] = useState('donations')
  const [typeFilter, setTypeFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [anonFilter, setAnonFilter] = useState('all')
  const [donationPage, setDonationPage] = useState(1)
  const [expensePage, setExpensePage] = useState(1)
  const [confirmDeleteDonation, setConfirmDeleteDonation] = useState(null)
  const [confirmDeleteDonationText, setConfirmDeleteDonationText] = useState('')
  const [confirmDeleteExpense, setConfirmDeleteExpense] = useState(null)
  const [confirmDeleteExpenseText, setConfirmDeleteExpenseText] = useState('')
  const [deletingId, setDeletingId] = useState(null)

  const donationSafePage = Math.min(Math.max(1, donationPage), donationsTotalPages || 1)
  const expenseSafePage = Math.min(Math.max(1, expensePage), expensesTotalPages || 1)

  useEffect(() => {
    let cancelled = false
    const mosqueId = getActiveMosqueId()
    const donationParams = [`page=${donationSafePage}`, `limit=${PAGE_SIZE}`]
    const expenseParams = [`page=${expenseSafePage}`, `limit=${PAGE_SIZE}`]
    if (mosqueId) {
      donationParams.push(`mosqueId=${mosqueId}`)
      expenseParams.push(`mosqueId=${mosqueId}`)
    }
    if (typeFilter !== 'all') donationParams.push(`type=${typeFilter}`)
    if (anonFilter !== 'all') donationParams.push(`isAnonymous=${anonFilter}`)
    if (categoryFilter !== 'all') expenseParams.push(`category=${categoryFilter}`)
    ;(async () => {
      try {
        const [donationRes, expenseRes] = await Promise.all([
          api.getAdminDonations(donationParams.join('&')),
          api.getAdminExpenses(expenseParams.join('&')),
        ])
        if (cancelled) return
        const d = Array.isArray(donationRes.data) ? donationRes.data : []
        const e = Array.isArray(expenseRes.data) ? expenseRes.data : []
        setDonations(d.map((item) => ({ ...item, id: item._id || item.id, date: item.createdAt || item.date })))
        setDonationsTotal(typeof donationRes.total === 'number' ? donationRes.total : d.length)
        setDonationsTotalPages(typeof donationRes.totalPages === 'number' ? donationRes.totalPages : 1)
        setExpenses(e.map((item) => ({ ...item, id: item._id || item.id, date: item.createdAt || item.date })))
        setExpensesTotal(typeof expenseRes.total === 'number' ? expenseRes.total : e.length)
        setExpensesTotalPages(typeof expenseRes.totalPages === 'number' ? expenseRes.totalPages : 1)
      } catch (err) {
        if (!cancelled) showToast(err.message || 'Failed to load donations/expenses.', 'error')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  
  }, [donationSafePage, expenseSafePage, typeFilter, categoryFilter, anonFilter, showToast])

  const donationTypes = useMemo(() => {
    return ['all', ...new Set(donations.map((donation) => donation.type.toLowerCase()))]
  }, [donations])

  const expenseCategories = useMemo(() => {
    return ['all', ...new Set(expenses.map((expense) => expense.category.toLowerCase()))]
  }, [expenses])

  const totalDonations = donations.reduce((sum, donation) => sum + (donation.amount || 0), 0)
  const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0)
  const netBalance = totalDonations - totalExpenses

  const categoryOptions = activeTab === 'donations' ? donationTypes : expenseCategories

  const handleSwitchTab = (tab) => {
    setActiveTab(tab)
    setCategoryFilter('all')
    setAnonFilter('all')
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
      note: '',
      category: 'Utilities',
    })
    setRecordErrors({})
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
      note: donation.note || donation.description || '',
      category: 'Utilities',
    })
    setRecordErrors({})
    setIsCreateOpen(true)
  }

  const handleCreateRecord = async (event) => {
    event.preventDefault()
    if (submittingRef.current) return

    const v = activeTab === 'donations' ? validateDonation(recordForm) : validateExpense(recordForm)
    if (Object.keys(v).length > 0) {
      setRecordErrors(v)
      const firstField = Object.keys(v)[0]
      const el = document.querySelector(`[name="${firstField}"]`)
      if (el && el.focus) el.focus()
      return
    }
    setRecordErrors({})

    submittingRef.current = true
    setSubmitting(true)
    try {
      if (activeTab === 'donations') {
        const payload = {
          donorName: recordForm.isAnonymous ? 'Anonymous' : (recordForm.donorName || 'Walk-in Donor'),
          amount: Number(recordForm.amount),
          type: recordForm.type,
          paymentMethod: recordForm.paymentMethod,
          isAnonymous: recordForm.isAnonymous,
          note: recordForm.note || undefined,
        }

        if (editingDonation) {
          const res = await api.updateDonation(editingDonation.id, payload)
          setDonations((prev) =>
            prev.map((d) => (d.id === editingDonation.id ? { ...res.data, id: res.data._id || res.data.id, date: res.data.createdAt || res.data.date } : d))
          )
          showToast('Donation updated successfully.', 'success')
        } else {
          const res = await api.createDonation(payload)
          showToast('Donation added successfully.', 'success')
          setDonationPage(1)
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
          showToast('Expense added successfully.', 'success')
          setExpensePage(1)
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
        note: '',
        category: 'Utilities',
      })
    } catch (err) {
      if (err.errors && Array.isArray(err.errors)) {
        const fieldErrors = {}
        err.errors.forEach((er) => { if (er.field) fieldErrors[er.field] = er.message })
        if (Object.keys(fieldErrors).length > 0) {
          setRecordErrors(fieldErrors)
          showToast('Please fix the highlighted fields', 'error')
        } else {
          showToast(err.message || 'Failed to add record.', 'error')
        }
      } else {
        showToast(err.message || 'Failed to add record.', 'error')
      }
    } finally {
      submittingRef.current = false
      setSubmitting(false)
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
        </article>

        <article className="rounded-xl border border-red-200 bg-white p-5 shadow-sm">
          <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-red-100 text-red-700">
            <i className="material-icons-round">trending_down</i>
          </div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total Expenses (Spending)</p>
          <h3 className="mt-2 text-2xl font-bold text-red-700">{formatCurrency(totalExpenses)}</h3>
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
            <label className="relative">
              <span className="pointer-events-none absolute left-3 top-2.5 text-gray-400">
                <i className="material-icons-round text-base">filter_list</i>
              </span>
              <select
                value={activeTab === 'donations' ? typeFilter : categoryFilter}
                onChange={(event) => {
                  if (activeTab === 'donations') {
                    setTypeFilter(event.target.value)
                    setDonationPage(1)
                  } else {
                    setCategoryFilter(event.target.value)
                    setExpensePage(1)
                  }
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

            {activeTab === 'donations' && (
              <label className="relative">
                <span className="pointer-events-none absolute left-3 top-2.5 text-gray-400">
                  <i className="material-icons-round text-base">visibility_off</i>
                </span>
                <select
                  value={anonFilter}
                  onChange={(event) => {
                    setAnonFilter(event.target.value)
                    setDonationPage(1)
                  }}
                  className="min-w-[160px] rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-primary-500 focus:outline-none"
                >
                  <option value="all">All Donors</option>
                  <option value="false">Named Donors</option>
                  <option value="true">Anonymous Only</option>
                </select>
              </label>
            )}

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
                {donations.map((donation) => {
                  const tone = DONATION_TYPE_COLORS[donation.type.toLowerCase()] || DONATION_TYPE_COLORS.default
                  return (
                    <tr key={donation.id}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{formatDate(donation.date)}</p>
                        <p className="text-xs text-gray-500">{formatRecordTime(donation.date) || '—'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{donation.donorName}</span>
                          {donation.isAnonymous && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600" title="Donor chose to remain anonymous">
                              <i className="material-icons-round text-xs">visibility_off</i>
                              Anonymous
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>{donation.type}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{recordNote(donation, 'donations')}</td>
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
                            onClick={() => {
                              setConfirmDeleteDonation(donation)
                              setConfirmDeleteDonationText('')
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
                {!loading && !donations.length && (
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
              Showing <strong>{donations.length ? (donationSafePage - 1) * PAGE_SIZE + 1 : 0}</strong> to{' '}
              <strong>{Math.min(donationSafePage * PAGE_SIZE, donationsTotal)}</strong> of{' '}
              <strong>{donationsTotal}</strong> donations
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={donationSafePage === 1 || loading}
                onClick={() => setDonationPage((prev) => Math.max(1, prev - 1))}
                className="rounded-lg border border-gray-300 px-3 py-1.5 font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <span className="inline-flex items-center px-2 text-sm text-gray-700">Page {donationSafePage} of {donationsTotalPages}</span>
              <button
                type="button"
                disabled={donationSafePage >= donationsTotalPages || loading}
                onClick={() => setDonationPage((prev) => Math.min(donationsTotalPages, prev + 1))}
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
                {expenses.map((expense) => {
                  const tone = EXPENSE_CATEGORY_COLORS[expense.category.toLowerCase()] || EXPENSE_CATEGORY_COLORS.default
                  return (
                    <tr key={expense.id}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{formatDate(expense.date)}</p>
                        <p className="text-xs text-gray-500">{formatRecordTime(expense.date) || '—'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>{expense.category}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{recordNote(expense, 'expenses')}</td>
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
                                note: '',
                                category: expense.category || 'Utilities',
                                _editExpenseId: expense.id,
                              })
                              setRecordErrors({})
                              setActiveTab('expenses')
                              setIsCreateOpen(true)
                            }}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-600 transition-all duration-150 hover:bg-gray-100"
                          >
                            <i className="material-icons-round text-base">edit</i>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setConfirmDeleteExpense(expense)
                              setConfirmDeleteExpenseText('')
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
                {!loading && !expenses.length && (
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
              Showing <strong>{expenses.length ? (expenseSafePage - 1) * PAGE_SIZE + 1 : 0}</strong> to{' '}
              <strong>{Math.min(expenseSafePage * PAGE_SIZE, expensesTotal)}</strong> of{' '}
              <strong>{expensesTotal}</strong> expenses
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={expenseSafePage === 1 || loading}
                onClick={() => setExpensePage((prev) => Math.max(1, prev - 1))}
                className="rounded-lg border border-gray-300 px-3 py-1.5 font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <span className="inline-flex items-center px-2 text-sm text-gray-700">Page {expenseSafePage} of {expensesTotalPages}</span>
              <button
                type="button"
                disabled={expenseSafePage >= expensesTotalPages || loading}
                onClick={() => setExpensePage((prev) => Math.min(expensesTotalPages, prev + 1))}
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
                {activeTab === 'donations' ? (editingDonation ? 'Edit Donation' : 'Add Donation') : (recordForm._editExpenseId ? 'Edit Expense' : 'Add Expense')}
              </h3>
              <button type="button" onClick={() => { if (!submitting) { setIsCreateOpen(false); setEditingDonation(null) } }} disabled={submitting} className="text-gray-500 hover:text-gray-700 disabled:opacity-40">
                <i className="material-icons-round">close</i>
              </button>
            </div>
            <form onSubmit={handleCreateRecord} noValidate className="space-y-4 px-6 py-5">
              {activeTab === 'donations' ? (
                <>
                  <label className="flex items-center gap-3 cursor-pointer select-none rounded-lg border border-gray-200 px-3 py-2.5">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-primary-700 focus:ring-primary-500"
                      checked={recordForm.isAnonymous}
                      onChange={(e) => setRecordForm((p) => ({ ...p, isAnonymous: e.target.checked, ...(e.target.checked ? { donorName: '' } : {}) }))}
                      disabled={submitting}
                    />
                    <span className="text-sm font-medium text-gray-700">Anonymous Donor</span>
                  </label>
                  {!recordForm.isAnonymous && (
                    <FormField
                      name="donorName"
                      label="Donor Name"
                      required
                      value={recordForm.donorName}
                      onChange={(e) => {
                        setRecordForm((p) => ({ ...p, donorName: e.target.value }))
                        if (recordErrors.donorName) setRecordErrors((prev) => ({ ...prev, donorName: null }))
                      }}
                      error={recordErrors.donorName}
                      placeholder="Donor's full name (or walk-in)"
                      disabled={submitting}
                    />
                  )}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                      name="type"
                      label="Type"
                      type="select"
                      value={recordForm.type}
                      onChange={(e) => setRecordForm((p) => ({ ...p, type: e.target.value }))}
                      disabled={submitting}
                    >
                      <option>Sadaqah</option>
                      <option>Zakat</option>
                      <option>Masjid Fund</option>
                    </FormField>
                    <FormField
                      name="paymentMethod"
                      label="Payment Method"
                      type="select"
                      value={recordForm.paymentMethod}
                      onChange={(e) => setRecordForm((p) => ({ ...p, paymentMethod: e.target.value }))}
                      disabled
                      hint="Cash donations only at the moment"
                    >
                      <option>Cash</option>
                    </FormField>
                  </div>
                  <FormField
                    name="note"
                    label="Description / Note"
                    optional
                    value={recordForm.note}
                    onChange={(e) => setRecordForm((p) => ({ ...p, note: e.target.value }))}
                    error={recordErrors.note}
                    placeholder="e.g., For new carpet"
                    disabled={submitting}
                  />
                </>
              ) : (
                <>
                  <FormField
                    name="description"
                    label="Description"
                    required
                    value={recordForm.description}
                    onChange={(e) => {
                      setRecordForm((p) => ({ ...p, description: e.target.value }))
                      if (recordErrors.description) setRecordErrors((prev) => ({ ...prev, description: null }))
                    }}
                    error={recordErrors.description}
                    placeholder="What was this expense for?"
                    disabled={submitting}
                  />
                  <FormField
                    name="category"
                    label="Category"
                    type="select"
                    value={recordForm.category}
                    onChange={(e) => setRecordForm((p) => ({ ...p, category: e.target.value }))}
                    disabled={submitting}
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
                  </FormField>
                </>
              )}
              <FormField
                name="amount"
                label="Amount (PKR)"
                type="number"
                required
                value={recordForm.amount}
                onChange={(e) => {
                  setRecordForm((p) => ({ ...p, amount: e.target.value }))
                  if (recordErrors.amount) setRecordErrors((prev) => ({ ...prev, amount: null }))
                }}
                error={recordErrors.amount}
                placeholder="e.g., 5000"
                disabled={submitting}
              />
              <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
                <button
                  type="button"
                  onClick={() => { setIsCreateOpen(false); setEditingDonation(null); setRecordErrors({}) }}
                  disabled={submitting}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="rounded-lg bg-primary-700 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-60">
                  {submitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDeleteDonation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h3 className="inline-flex items-center gap-2 text-lg font-bold text-red-700">
                <i className="material-icons-round">delete</i>
                Delete Donation
              </h3>
              <button type="button" onClick={() => { setConfirmDeleteDonation(null); setConfirmDeleteDonationText('') }} className="text-gray-500 hover:text-gray-700">
                <i className="material-icons-round">close</i>
              </button>
            </div>
            <div className="space-y-4 px-6 py-5">
              <p className="text-sm text-gray-700">
                This will permanently delete the donation from <strong className="text-gray-900">{confirmDeleteDonation.donorName || 'Anonymous'}</strong>{' '}
                of <strong className="text-gray-900">PKR {Number(confirmDeleteDonation.amount).toLocaleString('en-PK')}</strong>.
                This action cannot be undone and will affect the Transparency page.
              </p>
              <p className="text-sm text-gray-700">
                To confirm, type the donor name exactly:
              </p>
              <p className="rounded-lg bg-gray-100 px-3 py-2 font-mono text-sm font-semibold text-gray-800">
                {confirmDeleteDonation.donorName || 'Anonymous'}
              </p>
              <input
                type="text"
                value={confirmDeleteDonationText}
                onChange={(e) => setConfirmDeleteDonationText(e.target.value)}
                placeholder="Type the donor name to confirm"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-red-500 focus:outline-none"
                aria-label="Confirm by typing the donor name"
              />
              <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
                <button
                  type="button"
                  onClick={() => { setConfirmDeleteDonation(null); setConfirmDeleteDonationText('') }}
                  disabled={deletingId === confirmDeleteDonation.id}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const expected = (confirmDeleteDonation.donorName || 'Anonymous').trim()
                    if (confirmDeleteDonationText.trim() !== expected) return
                    setDeletingId(confirmDeleteDonation.id)
                    try {
                      await api.deleteDonation(confirmDeleteDonation.id)
                      setDonations((prev) => prev.filter((item) => item.id !== confirmDeleteDonation.id))
                      showToast('Donation deleted successfully.', 'success')
                      setConfirmDeleteDonation(null)
                      setConfirmDeleteDonationText('')
                    } catch (err) {
                      showToast(err.message || 'Failed to delete donation.', 'error')
                    } finally {
                      setDeletingId(null)
                    }
                  }}
                  disabled={deletingId === confirmDeleteDonation.id || confirmDeleteDonationText.trim() !== (confirmDeleteDonation.donorName || 'Anonymous').trim()}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deletingId === confirmDeleteDonation.id ? 'Deleting...' : 'Delete Permanently'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h3 className="inline-flex items-center gap-2 text-lg font-bold text-red-700">
                <i className="material-icons-round">delete</i>
                Delete Expense
              </h3>
              <button type="button" onClick={() => { setConfirmDeleteExpense(null); setConfirmDeleteExpenseText('') }} className="text-gray-500 hover:text-gray-700">
                <i className="material-icons-round">close</i>
              </button>
            </div>
            <div className="space-y-4 px-6 py-5">
              <p className="text-sm text-gray-700">
                This will permanently delete the <strong className="text-gray-900">{confirmDeleteExpense.category}</strong> expense of{' '}
                <strong className="text-gray-900">PKR {Number(confirmDeleteExpense.amount).toLocaleString('en-PK')}</strong>{' '}
                (<span className="text-gray-600">{confirmDeleteExpense.description || 'no description'}</span>).
                This action cannot be undone.
              </p>
              <p className="text-sm text-gray-700">
                To confirm, type the amount exactly as shown:
              </p>
              <p className="rounded-lg bg-gray-100 px-3 py-2 font-mono text-sm font-semibold text-gray-800">
                {Number(confirmDeleteExpense.amount).toLocaleString('en-PK')}
              </p>
              <input
                type="text"
                value={confirmDeleteExpenseText}
                onChange={(e) => setConfirmDeleteExpenseText(e.target.value)}
                placeholder="Type the amount to confirm"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-red-500 focus:outline-none"
                aria-label="Confirm by typing the amount"
              />
              <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
                <button
                  type="button"
                  onClick={() => { setConfirmDeleteExpense(null); setConfirmDeleteExpenseText('') }}
                  disabled={deletingId === confirmDeleteExpense.id}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const expected = Number(confirmDeleteExpense.amount).toLocaleString('en-PK')
                    if (confirmDeleteExpenseText.trim() !== expected) return
                    setDeletingId(confirmDeleteExpense.id)
                    try {
                      await api.deleteExpense(confirmDeleteExpense.id)
                      setExpenses((prev) => prev.filter((item) => item.id !== confirmDeleteExpense.id))
                      showToast('Expense deleted successfully.', 'success')
                      setConfirmDeleteExpense(null)
                      setConfirmDeleteExpenseText('')
                    } catch (err) {
                      showToast(err.message || 'Failed to delete expense.', 'error')
                    } finally {
                      setDeletingId(null)
                    }
                  }}
                  disabled={deletingId === confirmDeleteExpense.id || confirmDeleteExpenseText.trim() !== Number(confirmDeleteExpense.amount).toLocaleString('en-PK')}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deletingId === confirmDeleteExpense.id ? 'Deleting...' : 'Delete Permanently'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
