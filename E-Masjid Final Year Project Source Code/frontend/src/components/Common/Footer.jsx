import { Link } from 'react-router-dom'
import { ROUTES } from '../../utils/constants.js'
import { useMosque } from '../../hooks/useMosque.js'

export default function Footer() {
  const currentYear = new Date().getFullYear()
  const { activeMosque } = useMosque()
  const mosqueName = activeMosque?.name || 'E-Masjid'
  const mosqueCity = activeMosque?.city || ''
  const mosqueAddress = activeMosque?.address || ''
  const mosquePhone = activeMosque?.phone || ''
  const mosqueEmail = activeMosque?.email || ''
  const addressLine = [mosqueAddress, mosqueCity].filter(Boolean).join(', ')

  return (
    <footer className="mt-0 border-t-4 border-[#d4af37] bg-[#111827] text-white">
      <div className="container py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-10 pb-10">
          <div>
            <div className="mb-4 h-12 w-12 rounded-xl bg-[#047857] flex items-center justify-center">
              <i className="material-icons-round text-white text-2xl">mosque</i>
            </div>
            <h3 className="font-primary text-2xl font-bold mb-3">{mosqueName}</h3>
            <p className="text-gray-400 leading-relaxed">
              A place for worship, learning, and community gathering. We are dedicated to serving the spiritual and social needs of our community.
            </p>
            <div className="mt-5 flex gap-3">
              {['facebook', 'smart_display', 'chat'].map((icon) => (
                <a
                  key={icon}
                  href="#"
                  aria-label={icon}
                  className="h-10 w-10 rounded-full bg-white/10 hover:bg-[#047857] transition-all hover:-translate-y-0.5 flex items-center justify-center"
                >
                  <i className="material-icons-round text-lg">{icon}</i>
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-primary text-xl font-semibold text-[#d4af37] mb-5">Quick Links</h4>
            <nav className="flex flex-col gap-3">
              {[
                { label: 'Home', to: ROUTES.HOME },
                { label: 'Prayer Times', to: ROUTES.PRAYER_TIMES },
                { label: 'Upcoming Events', to: ROUTES.EVENTS },
                { label: 'Make a Donation', to: ROUTES.DONATE },
                { label: 'Transparency Report', to: ROUTES.TRANSPARENCY },
              ].map((item) => (
                <Link key={item.label} to={item.to} className="text-gray-400 hover:text-white transition-all hover:translate-x-1 inline-flex items-center gap-2">
                  <i className="material-icons-round text-sm">chevron_right</i>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div>
            <h4 className="font-primary text-xl font-semibold text-[#d4af37] mb-5">Our Services</h4>
            <nav className="flex flex-col gap-3">
              {[
                { label: 'Nikah Services', to: ROUTES.NIKAH_BOOKING },
                { label: 'Fund Request', to: ROUTES.FUND_REQUEST },
                { label: 'Online Donation', to: ROUTES.DONATE },
                { label: 'My Bookings', to: ROUTES.MY_BOOKINGS },
                { label: 'Announcements', to: ROUTES.ANNOUNCEMENTS },
              ].map((item) => (
                <Link key={item.label} to={item.to} className="text-gray-400 hover:text-white transition-all hover:translate-x-1 inline-flex items-center gap-2">
                  <i className="material-icons-round text-sm">chevron_right</i>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div>
            <h4 className="font-primary text-xl font-semibold text-[#d4af37] mb-5">Contact Us</h4>
            <div className="space-y-4 text-gray-400">
              {addressLine && (
                <p className="flex items-start gap-3">
                  <i className="material-icons-round mt-0.5 text-[#10b981]">location_on</i>
                  <span>{addressLine}</span>
                </p>
              )}
              {mosquePhone && (
                <p className="flex items-center gap-3">
                  <i className="material-icons-round text-[#10b981]">call</i>
                  <a href={`tel:${mosquePhone.replace(/\s+/g, '')}`} className="hover:text-white transition-colors">{mosquePhone}</a>
                </p>
              )}
              {mosqueEmail && (
                <p className="flex items-center gap-3">
                  <i className="material-icons-round text-[#10b981]">mail</i>
                  <a href={`mailto:${mosqueEmail}`} className="hover:text-white transition-colors">{mosqueEmail}</a>
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 text-center text-sm text-gray-400">
          <p>
            © {currentYear} {mosqueName}{mosqueCity ? `, ${mosqueCity}` : ''}. All rights reserved. |
            <a href="#" className="ml-2 hover:text-white">Privacy Policy</a> |
            <a href="#" className="ml-2 hover:text-white">Terms of Use</a>
          </p>
        </div>
      </div>
    </footer>
  )
}
