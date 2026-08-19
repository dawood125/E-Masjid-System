import { formatCurrency, formatDate } from './formatters.js'

const EXPENSE_CATEGORIES = [
  'Maintenance', 'Utilities', 'Salary', 'Events',
  'Charity', 'Renovation', 'Education', 'Equipment', 'Other',
]

function escapeCsv(value) {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function rowsToCsv(rows) {
  return rows.map((row) => row.map(escapeCsv).join(',')).join('\n')
}

function section(title, rows) {
  return [title, ...rowsToCsv(rows), '', '']
}

function buildReportPayload({ mosqueName, filters, donations, expenses, topDonors, summary }) {
  const date = new Date().toISOString().slice(0, 10)
  const totalDonations = summary?.totalDonations || 0
  const totalExpenses = summary?.totalExpenses || 0
  const balance = totalDonations - totalExpenses

  const donationByType = {}
  donations.forEach((d) => {
    const key = d.type || 'Other'
    donationByType[key] = (donationByType[key] || 0) + (d.amount || 0)
  })

  const expenseByCategory = {}
  expenses.forEach((e) => {
    const key = e.category || 'Other'
    expenseByCategory[key] = (expenseByCategory[key] || 0) + (e.amount || 0)
  })

  const meta = [
    ['E-Masjid Financial Report'],
    [`Mosque: ${mosqueName || 'Selected Mosque'}`],
    [`Generated: ${new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}`],
    [`Filters: month=${filters.month || 'all'}, type=${filters.type || 'all'}, category=${filters.category || 'all'}`],
    [],
    [],
  ]

  const donationsSummary = section(
    'DONATIONS SUMMARY',
    [
      ['Total Donations', formatCurrency(totalDonations)],
      [],
      ['By Type', 'Amount'],
      ...Object.entries(donationByType).map(([type, amount]) => [type, formatCurrency(amount)]),
    ],
  )

  const topDonorsSection = section(
    'TOP DONORS',
    [
      ['Rank', 'Donor', 'Total Amount', 'Donations'],
      ...(topDonors.length === 0
        ? [['—', 'No donor data for this filter', '—', '—']]
        : topDonors.map((d) => [d.rank, d.name, formatCurrency(d.totalAmount), d.donationCount])),
    ],
  )

  const recentDonations = section(
    'RECENT DONATIONS',
    [
      ['Date', 'Donor', 'Type', 'Method', 'Amount', 'Anonymous'],
      ...(donations.length === 0
        ? [['—', 'No donations for this filter', '—', '—', '—', '—']]
        : donations.map((d) => [
            formatDate(d.createdAt || d.date),
            d.isAnonymous ? 'Anonymous' : d.donorName,
            d.type,
            d.paymentMethod || '—',
            formatCurrency(d.amount),
            d.isAnonymous ? 'Yes' : 'No',
          ])),
    ],
  )

  const expensesSummary = section(
    'EXPENSES SUMMARY',
    [
      ['Total Expenses', formatCurrency(totalExpenses)],
      [],
      ['By Category', 'Amount'],
      ...Object.entries(expenseByCategory).map(([cat, amount]) => [cat, formatCurrency(amount)]),
    ],
  )

  const recentExpenses = section(
    'RECENT EXPENSES',
    [
      ['Date', 'Category', 'Description', 'Amount'],
      ...(expenses.length === 0
        ? [['—', 'No expenses for this filter', '—', '—']]
        : expenses.map((e) => [
            formatDate(e.createdAt || e.date),
            e.category,
            e.description,
            formatCurrency(e.amount),
          ])),
    ],
  )

  const balanceSection = section(
    'NET BALANCE',
    [
      ['Total Donations', formatCurrency(totalDonations)],
      ['Total Expenses', formatCurrency(totalExpenses)],
      ['Balance', formatCurrency(balance)],
    ],
  )

  return [
    ...meta,
    ...donationsSummary,
    ...topDonorsSection,
    ...recentDonations,
    ...expensesSummary,
    ...recentExpenses,
    ...balanceSection,
  ]
}

function rowsToCsvText(rows) {
  return rows.map((row) => row.map(escapeCsv).join(',')).join('\n')
}

export function downloadTransparencyReport({ mosqueName, filters, donations, expenses, topDonors, summary }) {
  const rows = buildReportPayload({ mosqueName, filters, donations, expenses, topDonors, summary })
  const csv = rowsToCsvText(rows)

  const bom = '﻿'
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const safeName = (mosqueName || 'Selected-Mosque').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '') || 'Selected-Mosque'
  const date = new Date().toISOString().slice(0, 10)
  const filename = `e-masjid-report-${safeName}-${date}.csv`

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  return { filename, rowCount: rows.length }
}

export { EXPENSE_CATEGORIES }
