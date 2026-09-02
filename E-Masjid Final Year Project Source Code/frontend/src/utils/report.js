import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatCurrency, formatDate } from './formatters.js'

export const EXPENSE_CATEGORIES = [
  'Maintenance', 'Utilities', 'Salary', 'Events',
  'Charity', 'Renovation', 'Education', 'Equipment', 'Other',
]

const COLORS = {
  primary: [4, 120, 87],
  primaryDark: [6, 78, 59],
  accent: [212, 175, 55],
  danger: [220, 38, 38],
  dangerDark: [127, 29, 29],
  text: [31, 41, 55],
  textMuted: [107, 114, 128],
  border: [229, 231, 235],
  bgLight: [249, 250, 251],
  bgAmber: [254, 243, 199],
  bgGreen: [220, 252, 231],
  white: [255, 255, 255],
}

function trendLabel(trend) {
  if (!trend) return ''
  if (!trend.lastMonth || trend.lastMonth <= 0) {
    if (!trend.thisMonth) return 'No prior data'
    return 'New this month'
  }
  const pct = Math.round(((trend.thisMonth - trend.lastMonth) / trend.lastMonth) * 100)
  if (Math.abs(pct) < 1) return 'Flat vs last month'
  const sign = pct > 0 ? '+' : ''
  return `${sign}${pct}% vs last month`
}

function drawHeader(doc, pageWidth, mosqueName) {
  const headerHeight = 34

  doc.setFillColor(...COLORS.primaryDark)
  doc.rect(0, 0, pageWidth, headerHeight, 'F')

  doc.setFillColor(...COLORS.accent)
  doc.rect(0, headerHeight, pageWidth, 1.5, 'F')

  doc.setTextColor(...COLORS.white)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.text('Financial Transparency Report', 14, 15)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.text(mosqueName || 'Selected Mosque', 14, 23)

  doc.setFontSize(9)
  doc.setTextColor(...COLORS.accent)
  doc.text('Audited by Mosque Committee', 14, 30)

  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
  const timeStr = new Date().toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit',
  })
  doc.setTextColor(...COLORS.white)
  doc.setFontSize(9)
  doc.text(`Generated: ${dateStr}`, pageWidth - 14, 15, { align: 'right' })
  doc.text(`at ${timeStr}`, pageWidth - 14, 21, { align: 'right' })
  doc.setFontSize(8)
  doc.setTextColor(...COLORS.accent)
  doc.text('e-masjid.me', pageWidth - 14, 29, { align: 'right' })

  return headerHeight + 8
}

function drawFilters(doc, x, y, pageWidth, filters) {
  doc.setDrawColor(...COLORS.border)
  doc.setLineWidth(0.2)
  doc.setFillColor(...COLORS.bgLight)
  doc.roundedRect(x, y - 4, pageWidth - x * 2, 12, 1.5, 1.5, 'FD')

  doc.setTextColor(...COLORS.textMuted)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text('FILTERS APPLIED', x + 4, y + 2)

  doc.setTextColor(...COLORS.text)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  const filterStr = `Month: ${filters.month || 'all'}    Type: ${filters.type || 'all'}    Category: ${filters.category || 'all'}`
  doc.text(filterStr, x + 36, y + 2)

  return y + 14
}

function drawSummaryCards(doc, x, y, pageWidth, summary, donationTrend, expenseTrend) {
  const gap = 4
  const cardWidth = (pageWidth - x * 2 - gap * 2) / 3
  const cardHeight = 30
  const totalDonations = summary?.totalDonations || 0
  const totalExpenses = summary?.totalExpenses || 0
  const balance = totalDonations - totalExpenses
  const balanceColor = balance < 0 ? [254, 226, 226] : [220, 252, 231]

  const cards = [
    {
      title: 'TOTAL DONATIONS',
      value: formatCurrency(totalDonations),
      accent: COLORS.primary,
      label: 'Received this period',
      trend: trendLabel(donationTrend),
      textColor: COLORS.white,
    },
    {
      title: 'TOTAL EXPENSES',
      value: formatCurrency(totalExpenses),
      accent: COLORS.danger,
      label: 'Funds utilized',
      trend: trendLabel(expenseTrend),
      textColor: COLORS.white,
    },
    {
      title: 'NET BALANCE',
      value: formatCurrency(balance),
      accent: balance < 0 ? COLORS.dangerDark : COLORS.primaryDark,
      label: balance < 0 ? 'Deficit - review needed' : 'Safe & Allocated',
      trend: balance < 0 ? 'Negative balance' : 'Available funds',
      textColor: COLORS.white,
    },
  ]

  cards.forEach((card, i) => {
    const cx = x + i * (cardWidth + gap)
    doc.setFillColor(...card.accent)
    doc.roundedRect(cx, y, cardWidth, cardHeight, 2, 2, 'F')

    doc.setTextColor(...card.textColor)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.text(card.title, cx + 4, y + 7)

    doc.setFontSize(15)
    doc.text(card.value, cx + 4, y + 17)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...COLORS.accent)
    doc.text(card.label, cx + 4, y + 23)
    doc.text(card.trend, cx + 4, y + 27)
  })

  return y + cardHeight + 10
}

function drawSectionTitle(doc, x, y, title, icon) {
  doc.setTextColor(...COLORS.primaryDark)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  if (icon) {
    doc.text(icon, x, y + 1)
    doc.text(title, x + 8, y + 1)
  } else {
    doc.text(title, x, y + 1)
  }
  doc.setDrawColor(...COLORS.accent)
  doc.setLineWidth(0.4)
  doc.line(x, y + 3, x + 30, y + 3)
  return y + 8
}

function buildDonationsTable(donations) {
  if (donations.length === 0) {
    return [['—', 'No donations match the current filters', '—', '—', '—']]
  }
  return donations.map((d) => [
    formatDate(d.createdAt || d.date),
    d.isAnonymous ? 'Anonymous' : d.donorName,
    d.type,
    d.paymentMethod || '—',
    formatCurrency(d.amount),
  ])
}

function buildExpensesTable(expenses) {
  if (expenses.length === 0) {
    return [['—', 'No expenses match the current filters', '—', '—']]
  }
  return expenses.map((e) => [
    formatDate(e.createdAt || e.date),
    e.category,
    e.description,
    formatCurrency(e.amount),
  ])
}

function buildTopDonorsTable(topDonors) {
  if (topDonors.length === 0) {
    return [['—', 'No donor data for this filter', '—', '—']]
  }
  return topDonors.map((d) => [
    String(d.rank),
    d.name,
    String(d.donationCount),
    formatCurrency(d.totalAmount),
  ])
}

function addFooter(doc) {
  const pageCount = doc.internal.getNumberOfPages()
  const pageHeight = doc.internal.pageSize.getHeight()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 14

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)

    doc.setDrawColor(...COLORS.accent)
    doc.setLineWidth(0.3)
    doc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14)

    doc.setTextColor(...COLORS.textMuted)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text('Audited by Mosque Committee', margin, pageHeight - 9)

    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.primaryDark)
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 9, { align: 'right' })

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...COLORS.textMuted)
    doc.setFontSize(7)
    doc.text('This report was generated from live records. For questions, contact the mosque committee.', pageWidth / 2, pageHeight - 5, { align: 'center' })
  }
}

export function buildTransparencyPdf({ mosqueName, filters, donations, expenses, topDonors, summary, donationTrend, expenseTrend }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 14

  let cursorY = drawHeader(doc, pageWidth, mosqueName)
  cursorY = drawFilters(doc, margin, cursorY, pageWidth, filters)
  cursorY = drawSummaryCards(doc, margin, cursorY, pageWidth, summary, donationTrend, expenseTrend)

  cursorY = drawSectionTitle(doc, margin, cursorY, 'Top Donors', null)
  autoTable(doc, {
    startY: cursorY,
    head: [['Rank', 'Donor', 'Donations', 'Total Contributed']],
    body: buildTopDonorsTable(topDonors),
    theme: 'grid',
    headStyles: {
      fillColor: COLORS.primaryDark,
      textColor: COLORS.white,
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: { textColor: COLORS.text, fontSize: 9 },
    alternateRowStyles: { fillColor: COLORS.bgAmber },
    styles: { cellPadding: 2.5, lineColor: COLORS.border, lineWidth: 0.1 },
    columnStyles: {
      0: { cellWidth: 18, halign: 'center', fontStyle: 'bold', textColor: COLORS.accent },
      2: { cellWidth: 25, halign: 'center' },
      3: { halign: 'right', textColor: COLORS.primary, fontStyle: 'bold' },
    },
    margin: { left: margin, right: margin },
  })
  cursorY = doc.lastAutoTable.finalY + 10

  cursorY = drawSectionTitle(doc, margin, cursorY, 'Donation History', null)
  autoTable(doc, {
    startY: cursorY,
    head: [['Date', 'Donor', 'Type', 'Method', 'Amount']],
    body: buildDonationsTable(donations),
    theme: 'striped',
    headStyles: {
      fillColor: COLORS.primary,
      textColor: COLORS.white,
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: { textColor: COLORS.text, fontSize: 9 },
    alternateRowStyles: { fillColor: COLORS.bgLight },
    styles: { cellPadding: 2.5, lineColor: COLORS.border, lineWidth: 0.1 },
    columnStyles: {
      0: { cellWidth: 28 },
      2: { cellWidth: 22 },
      3: { cellWidth: 22 },
      4: { halign: 'right', textColor: COLORS.primary, fontStyle: 'bold', cellWidth: 28 },
    },
    margin: { left: margin, right: margin },
  })
  cursorY = doc.lastAutoTable.finalY + 10

  cursorY = drawSectionTitle(doc, margin, cursorY, 'Expense History', null)
  autoTable(doc, {
    startY: cursorY,
    head: [['Date', 'Category', 'Description', 'Amount']],
    body: buildExpensesTable(expenses),
    theme: 'striped',
    headStyles: {
      fillColor: COLORS.danger,
      textColor: COLORS.white,
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: { textColor: COLORS.text, fontSize: 9 },
    alternateRowStyles: { fillColor: COLORS.bgLight },
    styles: { cellPadding: 2.5, lineColor: COLORS.border, lineWidth: 0.1 },
    columnStyles: {
      0: { cellWidth: 28 },
      1: { cellWidth: 28 },
      3: { halign: 'right', textColor: COLORS.danger, fontStyle: 'bold', cellWidth: 28 },
    },
    margin: { left: margin, right: margin },
  })
  cursorY = doc.lastAutoTable.finalY + 12

  const pageHeight = doc.internal.pageSize.getHeight()
  const netBalance = (summary?.totalDonations || 0) - (summary?.totalExpenses || 0)
  if (cursorY + 30 < pageHeight) {
    doc.setFillColor(...COLORS.primaryDark)
    doc.roundedRect(margin, cursorY, pageWidth - margin * 2, 26, 2, 2, 'F')
    doc.setTextColor(...COLORS.white)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text('Net Balance Statement', margin + 5, cursorY + 8)

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(`Total Donations:  ${formatCurrency(summary?.totalDonations || 0)}`, margin + 5, cursorY + 14)
    doc.text(`Total Expenses:    ${formatCurrency(summary?.totalExpenses || 0)}`, margin + 5, cursorY + 19)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(...COLORS.accent)
    doc.text(`Net Balance:        ${formatCurrency(netBalance)}`, margin + 5, cursorY + 24)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...COLORS.white)
    doc.text(
      netBalance < 0
        ? 'Deficit - committee review required'
        : 'Funds safe and properly allocated',
      pageWidth - margin - 5,
      cursorY + 14,
      { align: 'right' },
    )
    doc.text('All amounts in PKR', pageWidth - margin - 5, cursorY + 19, { align: 'right' })
  }

  addFooter(doc)

  return doc
}

export function downloadTransparencyReport({ mosqueName, filters, donations, expenses, topDonors, summary, donationTrend, expenseTrend }) {
  const doc = buildTransparencyPdf({ mosqueName, filters, donations, expenses, topDonors, summary, donationTrend, expenseTrend })
  const safeName = (mosqueName || 'Selected-Mosque').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '') || 'Selected-Mosque'
  const date = new Date().toISOString().slice(0, 10)
  const filename = `e-masjid-report-${safeName}-${date}.pdf`
  doc.save(filename)
  return { filename, pageCount: doc.internal.getNumberOfPages() }
}
