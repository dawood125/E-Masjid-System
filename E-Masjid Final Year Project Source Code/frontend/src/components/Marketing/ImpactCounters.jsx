import { useEffect, useRef, useState } from 'react'
import api from '../../utils/api.js'
import { useMosque } from '../../hooks/useMosque.js'

/**
 * Impact counters: 4 BIG numbers that show cumulative impact of the mosque.
 *
 * Phase 4.5: Now fetched from GET /api/marketing/impact (auto-computed from DB).
 * Numbers count up from 0 when the section scrolls into view.
 */

const IMPACT_CONFIG = [
  { key: 'prayersTracked',   label: 'Prayers Tracked',         suffix: '+' },
  { key: 'studentsTaught',    label: 'Students Taught',         suffix: '+' },
  { key: 'nikahHosted',       label: 'Nikah Ceremonies Hosted', suffix: '' },
  { key: 'familiesSupported', label: 'Families Supported',      suffix: '+' },
]

function useCountUp(target, started, suffix, durationMs = 1800) {
  const safeTarget = typeof target === 'number' && !isNaN(target) ? target : 0
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!started || safeTarget <= 0) return
    let raf
    const start = performance.now()
    const tick = (now) => {
      const t = Math.min((now - start) / durationMs, 1)
      const eased = 1 - Math.pow(1 - t, 4)
      setVal(Math.floor(eased * safeTarget))
      if (t < 1) raf = requestAnimationFrame(tick)
      else setVal(safeTarget)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [safeTarget, started, durationMs])
  return <>{val.toLocaleString()}{suffix}</>
}

function ImpactCard({ value, label, suffix, started, index }) {
  return (
    <div
      className="text-center px-3"
      style={{ animationDelay: `${index * 120}ms` }}
    >
      <p className="font-primary text-5xl md:text-6xl font-bold text-[#d4af37] tabular-nums">
        {useCountUp(value, started, suffix)}
      </p>
      <p className="mt-2 text-xs sm:text-sm uppercase tracking-widest text-white/85 font-semibold">
        {label}
      </p>
    </div>
  )
}

export default function ImpactCounters() {
  const ref = useRef(null)
  const [started, setStarted] = useState(false)
  const [data, setData] = useState(null)
  const { activeMosqueId } = useMosque()

  useEffect(() => {
    if (!ref.current) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStarted(true) },
      { threshold: 0.3 }
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    let mounted = true
    api.getMarketingImpact(activeMosqueId)
      .then((res) => { if (mounted) setData(res.data) })
      .catch(() => { /* keep data as null and render zeros */ })
    return () => { mounted = false }
  }, [activeMosqueId])

  return (
    <section ref={ref} className="relative py-20 bg-[#064e3b] overflow-hidden">
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M30 0l6 12 12 6-12 6-6 12-6-12-12-6 12-6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        }}
      />
      <div className="container relative">
        <div className="text-center mb-12">
          <h2 className="font-primary text-3xl md:text-4xl font-bold text-white">
            Our Impact in <span className="text-[#d4af37]">Numbers</span>
          </h2>
          <p className="mt-3 text-white/75 max-w-2xl mx-auto">
            Every prayer, every student, every family — a small contribution to a larger story.
          </p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {IMPACT_CONFIG.map((item, i) => (
            <ImpactCard key={item.key} {...item} value={data?.[item.key] ?? 0} started={started} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
