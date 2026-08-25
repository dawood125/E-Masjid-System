import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../utils/api.js'
import { ROUTES } from '../../utils/constants.js'
import { useMosque } from '../../hooks/useMosque.js'

/**
 * Other Active Campaigns — a 3-up card grid showing every isActive=true,
 * isFeatured=false campaign. Pairs with FeaturedCampaign above so admins
 * can run multiple fundraising campaigns at once: ONE featured (big CTA)
 * and several smaller ones below.
 *
 * Phase 4.5 (post-feedback 2026-08-25): added so the "Active" toggle on
 * non-featured campaigns actually does something visible on the homepage
 * (previously the homepage only ever showed the featured campaign).
 */
function formatPKR(n) {
  return 'PKR ' + Number(n || 0).toLocaleString('en-PK')
}

export default function OtherCampaigns() {
  const [campaigns, setCampaigns] = useState([])
  const [loaded, setLoaded] = useState(false)
  const { activeMosqueId } = useMosque()

  useEffect(() => {
    let mounted = true
    api.getMarketingCampaigns(activeMosqueId)
      .then((res) => {
        if (!mounted) return
        const list = (res.data || []).filter((c) => !c.isFeatured)
        setCampaigns(list)
        setLoaded(true)
      })
      .catch(() => { if (mounted) setLoaded(true) })
    return () => { mounted = false }
  }, [activeMosqueId])

  if (loaded && campaigns.length === 0) return null
  if (campaigns.length === 0) return null

  return (
    <section className="py-20 bg-white">
      <div className="container">
        <div className="mb-10 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-50 border border-[#047857]/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#047857]">
            <i className="material-icons-round text-sm">volunteer_activism</i>
            Ongoing Campaigns
          </span>
          <h2 className="mt-4 font-primary text-3xl md:text-4xl font-bold text-[#064e3b]">
            Other Active Campaigns
          </h2>
          <p className="mt-3 text-gray-600 max-w-2xl mx-auto">
            Beyond our featured drive, these campaigns are still running. Every contribution counts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {campaigns.map((c) => {
            const pct = c.progressPercent ?? Math.min(Math.round((c.raisedAmount / c.targetAmount) * 100), 100)
            return (
              <article
                key={c._id}
                className="group relative flex flex-col overflow-hidden rounded-2xl bg-white p-7 shadow-sm border border-gray-100 transition-all hover:-translate-y-1 hover:shadow-xl"
              >
                {c.image && (
                  <img
                    src={c.image}
                    alt={c.title}
                    className="-mx-7 -mt-7 mb-5 h-40 w-[calc(100%+3.5rem)] object-cover"
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                )}
                <h3 className="font-primary text-xl font-bold text-[#064e3b] group-hover:text-[#047857] transition-colors">
                  {c.title}
                </h3>
                {c.subtitle && (
                  <p className="mt-2 text-sm text-gray-600 leading-relaxed line-clamp-2">{c.subtitle}</p>
                )}

                <div className="mt-5">
                  <div className="flex items-end justify-between mb-1">
                    <p className="text-xs uppercase tracking-wider text-gray-500">Raised</p>
                    <p className="text-sm font-bold text-[#047857]">{pct}%</p>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#047857] to-[#d4af37] rounded-full transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                    <span>{formatPKR(c.raisedAmount)}</span>
                    <span>of {formatPKR(c.targetAmount)}</span>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between text-xs text-gray-500">
                  <span className="inline-flex items-center gap-1">
                    <i className="material-icons-round text-base text-[#d4af37]">schedule</i>
                    {c.daysLeft || 0} days left
                  </span>
                </div>

                <div className="mt-5 pt-5 border-t border-gray-100 flex items-center justify-end">
                  <Link
                    to={ROUTES.DONATE}
                    className="inline-flex items-center gap-1 text-sm font-bold text-[#047857] hover:text-[#d4af37] transition-colors"
                  >
                    Donate
                    <i className="material-icons-round text-base transition-transform group-hover:translate-x-1">arrow_forward</i>
                  </Link>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}