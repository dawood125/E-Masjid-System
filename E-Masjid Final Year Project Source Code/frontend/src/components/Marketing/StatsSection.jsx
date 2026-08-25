import { useEffect, useState } from 'react'
import api from '../../utils/api.js'
import { useMosque } from '../../hooks/useMosque.js'

/**
 * Live stats ticker: 4 key numbers shown just below the hero.
 *
 * Values are fetched from GET /api/marketing/stats (auto-computed from the DB):
 *   - yearsServing      → years since the oldest active mosque was created
 *   - totalDonationsPKR → sum of confirmed/completed donations
 *   - activeRequests    → count of FundRequest with status='pending'
 *   - familiesHelped    → count of FundRequest with status='approved'/'fulfilled'
 *
 * Phase 4.5: Removed the hardcoded "Mosques Served" card (per partner feedback
 * — we only have one mosque at a time). Replaced with "Years Serving" which
 * is more meaningful for a community-mosque context.
 */
function useCountUp(target, durationMs = 1400) {
  const safeTarget = typeof target === 'number' && !isNaN(target) ? target : 0
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (safeTarget <= 0) return
    let raf
    const start = performance.now()
    const tick = (now) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / durationMs, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // easeOutCubic
      setValue(Math.floor(eased * safeTarget))
      if (progress < 1) raf = requestAnimationFrame(tick)
      else setValue(safeTarget)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [safeTarget, durationMs])
  return value
}

function StatCard({ label, value, icon, format = 'number', delay = 0 }) {
  const displayValue = useCountUp(value)
  const formatted = (() => {
    if (format === 'currency') {
      return 'PKR ' + displayValue.toLocaleString()
    }
    if (format === 'currency-k') {
      return 'PKR ' + displayValue.toLocaleString() + 'K'
    }
    return displayValue.toLocaleString()
  })()
  return (
    <div
      className="group relative overflow-hidden rounded-2xl bg-white border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-1"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="absolute -top-4 -right-4 h-20 w-20 rounded-full bg-[#047857]/5 group-hover:bg-[#047857]/10 transition-colors" />
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-[#047857] group-hover:bg-[#047857] group-hover:text-white transition-colors">
          <i className="material-icons-round text-2xl">{icon}</i>
        </div>
        <div className="min-w-0">
          <p className="text-2xl md:text-3xl font-bold text-[#064e3b] tabular-nums">
            {formatted}
          </p>
          <p className="mt-1 text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
            {label}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function StatsSection() {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState(null)
  const { activeMosqueId } = useMosque()

  useEffect(() => {
    let mounted = true
    api.getMarketingStats(activeMosqueId)
      .then((res) => { if (mounted) setStats(res.data) })
      .catch((e) => { if (mounted) setError(e.message || 'Failed to load stats') })
    return () => { mounted = false }
  }, [activeMosqueId])

  // Map backend keys to display config (icon, format, etc.)
  const config = [
    { key: 'yearsServing',     label: 'Years Serving',      icon: 'schedule',           format: 'number' },
    { key: 'totalDonationsPKR', label: 'Total Donations',    icon: 'volunteer_activism', format: 'currency' },
    { key: 'activeRequests',   label: 'Active Fund Requests', icon: 'request_quote',     format: 'number' },
    { key: 'familiesHelped',   label: 'Families Helped',     icon: 'family_restroom',    format: 'number' },
  ]

  return (
    <section className="relative -mt-12 md:-mt-16 z-20 pb-16">
      <div className="container">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {config.map((cfg, i) => (
            <StatCard
              key={cfg.key}
              label={cfg.label}
              icon={cfg.icon}
              format={cfg.format}
              value={stats?.[cfg.key] ?? 0}
              delay={i * 80}
            />
          ))}
        </div>
        {error && (
          <p className="mt-3 text-center text-xs text-red-500">{error}</p>
        )}
      </div>
    </section>
  )
}
