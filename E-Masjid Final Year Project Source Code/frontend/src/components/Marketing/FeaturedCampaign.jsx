import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../utils/api.js'
import { ROUTES } from '../../utils/constants.js'
import { useMosque } from '../../hooks/useMosque.js'

const DEFAULT_IMAGE = '/assets/images/gallery/gallery-courtyard.jpg'

function formatPKR(n) {
  return 'PKR ' + Number(n || 0).toLocaleString('en-PK')
}

export default function FeaturedCampaign() {
  const [campaign, setCampaign] = useState(null)
  const [loaded, setLoaded] = useState(false)
  const { activeMosqueId } = useMosque()

  useEffect(() => {
    let mounted = true
    api.getMarketingFeaturedCampaign(activeMosqueId)
      .then((res) => { if (mounted) { setCampaign(res.data); setLoaded(true) } })
      .catch(() => { if (mounted) setLoaded(true) })
    return () => { mounted = false }
  }, [activeMosqueId])

  if (loaded && !campaign) return null
  if (!campaign) return null

  const pct = campaign.progressPercent ?? Math.min(Math.round((campaign.raisedAmount / campaign.targetAmount) * 100), 100)

  return (
    <section className="py-20 bg-gradient-to-br from-[#064e3b] via-[#065f46] to-[#047857] text-white relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M40 0l8 16 16 8-16 8-8 16-8-16-16-8 16-8z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        }}
      />

      <div className="container relative">
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white">
            <span className="h-2 w-2 rounded-full bg-[#d4af37] animate-pulse" />
            Featured Campaign
          </span>
        </div>

        <div className="mb-10 rounded-2xl overflow-hidden border border-white/15 bg-white/5">
          <img
            src={campaign.image || DEFAULT_IMAGE}
            alt={campaign.title}
            className="w-full h-56 md:h-72 object-cover"
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = DEFAULT_IMAGE }}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="font-primary text-3xl md:text-5xl font-bold leading-tight">
              {campaign.title}
            </h2>
            {campaign.subtitle && (
              <p className="mt-4 text-white/85 text-lg leading-relaxed max-w-xl">
                {campaign.subtitle}
              </p>
            )}
            <div className="mt-6 flex flex-wrap items-center gap-5 text-sm text-white/80">
              <span className="inline-flex items-center gap-2">
                <i className="material-icons-round text-base text-[#d4af37]">schedule</i>
                {campaign.daysLeft || 0} days left
              </span>
              <span className="inline-flex items-center gap-2">
                <i className="material-icons-round text-base text-[#d4af37]">volunteer_activism</i>
                {pct}% funded
              </span>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to={ROUTES.DONATE}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-base font-semibold bg-[#d4af37] text-[#1f2937] border-2 border-[#d4af37] hover:bg-[#b7791f] hover:border-[#b7791f] shadow-lg transition-all"
              >
                <i className="material-icons-round">volunteer_activism</i>
                Donate Now
              </Link>
              <Link
                to={ROUTES.TRANSPARENCY}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-base font-semibold bg-transparent text-white border-2 border-white/40 hover:bg-white/10 transition-all"
              >
                See Full Transparency Report
                <i className="material-icons-round">arrow_forward</i>
              </Link>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-7 border border-white/15">
            <div className="flex items-end justify-between mb-2">
              <div>
                <p className="text-sm uppercase tracking-wider text-white/70">Raised so far</p>
                <p className="text-4xl font-bold text-white mt-1">{formatPKR(campaign.raisedAmount)}</p>
              </div>
              <p className="text-5xl font-bold text-[#d4af37] tabular-nums">{pct}%</p>
            </div>

            <div className="mt-3 h-3 w-full bg-white/15 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#d4af37] to-yellow-400 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${pct}%` }}
              />
            </div>

            <div className="mt-3 flex items-center justify-between text-sm text-white/80">
              <span>{pct}% funded</span>
              <span>Goal: {formatPKR(campaign.targetAmount)}</span>
            </div>

            <blockquote className="mt-6 pt-6 border-t border-white/15 text-center">
              <p className="text-white/85 italic text-sm leading-relaxed">
                &ldquo;The example of those who spend their wealth in the way of Allah is like a seed [of grain]
                which grows seven spikes; in each spike is a hundred grains.&rdquo;
              </p>
              <footer className="mt-2 text-xs tracking-widest uppercase text-[#d4af37] font-semibold">
                Qur&rsquo;an 2:261
              </footer>
            </blockquote>
          </div>
        </div>
      </div>
    </section>
  )
}
