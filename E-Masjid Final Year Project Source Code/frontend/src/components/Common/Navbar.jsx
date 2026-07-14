import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import { useUI } from '../../hooks/useUI.js'
import { useMosque } from '../../hooks/useMosque.js'
import { ROUTES } from '../../utils/constants.js'

function DropdownMenu({ label, items, isActive, closeMobileMenu: closeMobileFn }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`relative flex items-center gap-1 rounded-md px-3 py-2 font-primary text-[0.95rem] font-medium transition-all duration-150 ${
          isActive
            ? 'bg-primary-50 text-[#047857]'
            : 'text-gray-700 hover:bg-primary-50 hover:text-[#047857]'
        }`}
      >
        {label}
        <i className={`material-icons-round text-base transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          expand_more
        </i>
        {isActive && (
          <span className="absolute left-1/2 bottom-0 h-[3px] w-8 -translate-x-1/2 rounded-full bg-[#d4af37]" />
        )}
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-52 rounded-xl border border-gray-200 bg-white py-2 shadow-xl animate-fade-in z-50">
          {items.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => {
                setOpen(false)
                if (closeMobileFn) closeMobileFn()
              }}
              className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-primary-50 hover:text-[#047857]"
            >
              <i className="material-icons-round text-lg text-gray-400">{item.icon}</i>
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth()
  const { toggleMobileMenu, mobileMenuOpen, closeMobileMenu } = useUI()
  const { mosques, activeMosque, activeMosqueId, setActiveMosque } = useMosque()
  const location = useLocation()
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleMosqueChange = useCallback((e) => {
    setActiveMosque(e.target.value)
  }, [setActiveMosque])

  // Primary nav links (always visible)
  const primaryLinks = [
    { label: 'Home', path: ROUTES.HOME },
    { label: 'Prayer Times', path: ROUTES.PRAYER_TIMES },
    { label: 'Events', path: ROUTES.EVENTS },
    { label: 'Donate', path: ROUTES.DONATE },
  ]

  // Services dropdown items
  const servicesItems = [
    { label: 'Nikah Booking', path: ROUTES.NIKAH_BOOKING, icon: 'favorite' },
    { label: 'My Bookings', path: ROUTES.MY_BOOKINGS, icon: 'bookmark' },
    { label: 'Transparency', path: ROUTES.TRANSPARENCY, icon: 'visibility' },
  ]

  // More dropdown items
  const moreItems = [
    { label: 'Announcements', path: ROUTES.ANNOUNCEMENTS, icon: 'campaign' },
    { label: 'Fund Request', path: ROUTES.FUND_REQUEST, icon: 'request_quote' },
    { label: 'My Requests', path: ROUTES.MY_REQUESTS, icon: 'assignment' },
  ]

  const isActive = (path) => {
    if (path === ROUTES.HOME) return location.pathname === ROUTES.HOME
    return location.pathname.startsWith(path)
  }

  const isServicesActive = servicesItems.some((item) => isActive(item.path))
  const isMoreActive = moreItems.some((item) => isActive(item.path))

  return (
    <header className={`fixed top-0 left-0 right-0 z-40 border-b border-gray-200 transition-all duration-300 overflow-x-hidden ${isScrolled ? 'bg-white shadow-md' : 'bg-white shadow-sm'}`}>
      <div className="container h-20 flex items-center gap-2 lg:gap-4">
        {/* Logo */}
        <Link to={ROUTES.HOME} className="flex items-center gap-3 shrink-0 min-w-0">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#047857] to-[#064e3b] shadow-md">
            <i className="material-icons-round text-white text-[26px]">mosque</i>
          </div>
          <div className="hidden sm:flex flex-col min-w-0">
            <span className="font-primary text-lg lg:text-xl font-bold leading-tight text-[#064e3b] truncate">
              {activeMosque?.name || 'E-Masjid'}
            </span>
            <span className="text-xs font-medium text-gray-500 truncate">
              {activeMosque?.city || 'Select a mosque'}
            </span>
          </div>
        </Link>

        {/* Desktop Navigation — shown at lg+ (1024px) */}
        <nav className="hidden lg:flex items-center gap-1 flex-1 min-w-0 justify-end">
          {primaryLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`relative whitespace-nowrap rounded-md px-2 xl:px-3 py-2 font-primary text-[0.9rem] xl:text-[0.95rem] font-medium transition-all duration-150 ${
                isActive(link.path)
                  ? 'bg-primary-50 text-[#047857]'
                  : 'text-gray-700 hover:bg-primary-50 hover:text-[#047857]'
              }`}
            >
              {link.label}
              {isActive(link.path) && (
                <span className="absolute left-1/2 bottom-0 h-[3px] w-8 -translate-x-1/2 rounded-full bg-[#d4af37]" />
              )}
            </Link>
          ))}

          {/* Services Dropdown */}
          <DropdownMenu
            label="Services"
            items={servicesItems}
            isActive={isServicesActive}
            closeMobileMenu={closeMobileMenu}
          />

          {/* More Dropdown */}
          <DropdownMenu
            label="More"
            items={moreItems}
            isActive={isMoreActive}
            closeMobileMenu={closeMobileMenu}
          />
        </nav>

        {/* Mosque Selector — hidden below xl, shows at xl+ only (to keep room for nav links at lg) */}
        {mosques.length > 0 && (
          <div className="hidden xl:flex items-center gap-2 shrink min-w-0 relative">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Mosque</span>
            <select
              className="min-w-0 w-32 2xl:w-44 truncate rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={activeMosqueId || ''}
              onChange={handleMosqueChange}
              title={activeMosque ? `${activeMosque.name} (${activeMosque.city})` : 'Select a mosque'}
            >
              {mosques.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.name} ({m.city})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Auth Buttons — always visible at sm+, never shrink */}
        <div className="flex items-center gap-2 shrink-0 ml-auto lg:ml-0">
          {isAuthenticated ? (
            <div className="hidden lg:flex items-center gap-2">
              <span className="hidden xl:inline text-sm font-medium text-gray-700 whitespace-nowrap">
                {user?.name || 'User'}
              </span>
              <button
                onClick={() => {
                  logout()
                  closeMobileMenu()
                }}
                className="btn btn-secondary btn-sm"
              >
                Logout
              </button>
              {user?.role === 'admin' && (
                <Link to={ROUTES.ADMIN} className="btn btn-primary btn-sm">
                  Admin
                </Link>
              )}
              {user?.role === 'scholar' && (
                <Link to={ROUTES.SCHOLAR} className="btn btn-primary btn-sm">
                  Dashboard
                </Link>
              )}
            </div>
          ) : (
            <div className="hidden lg:flex items-center gap-2">
              <Link to={ROUTES.LOGIN} className="btn btn-secondary btn-sm">
                Login
              </Link>
              <Link to={ROUTES.REGISTER} className="btn btn-primary btn-sm">
                Register
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle — shown below lg */}
          <button
            onClick={toggleMobileMenu}
            className="lg:hidden shrink-0 flex h-11 w-11 items-center justify-center rounded-md bg-primary-50 text-[#047857] transition-colors duration-150 hover:bg-primary-100"
            aria-label="Toggle menu"
          >
            <i className="material-icons-round">
              {mobileMenuOpen ? 'close' : 'menu'}
            </i>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed top-20 inset-x-0 bottom-0 bg-white border-t border-gray-200 shadow-lg animate-slide-in-right overflow-y-auto">
          <div className="container py-5">
            <nav className="flex flex-col gap-1">
              {mosques.length > 0 && (
                <div className="mb-3 rounded-xl border border-gray-200 bg-white p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Select Mosque</p>
                  <select
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                    value={activeMosqueId || ''}
                    onChange={(e) => {
                      setActiveMosque(e.target.value)
                      closeMobileMenu()
                    }}
                  >
                    {mosques.map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.name} ({m.city})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Main Pages */}
              <p className="px-5 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Main</p>
              {primaryLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={closeMobileMenu}
                  className={`rounded-lg px-5 py-3.5 text-base transition-colors duration-150 ${
                    isActive(link.path)
                      ? 'bg-primary-50 text-[#047857] font-semibold'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              {/* Services Section */}
              <p className="px-5 pt-4 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Services</p>
              {servicesItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={closeMobileMenu}
                  className={`flex items-center gap-3 rounded-lg px-5 py-3.5 text-base transition-colors duration-150 ${
                    isActive(item.path)
                      ? 'bg-primary-50 text-[#047857] font-semibold'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <i className="material-icons-round text-lg text-gray-400">{item.icon}</i>
                  {item.label}
                </Link>
              ))}

              {/* More Section */}
              <p className="px-5 pt-4 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Community</p>
              {moreItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={closeMobileMenu}
                  className={`flex items-center gap-3 rounded-lg px-5 py-3.5 text-base transition-colors duration-150 ${
                    isActive(item.path)
                      ? 'bg-primary-50 text-[#047857] font-semibold'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <i className="material-icons-round text-lg text-gray-400">{item.icon}</i>
                  {item.label}
                </Link>
              ))}

              {!isAuthenticated && (
                <div className="flex flex-col gap-2 mt-4 pt-4 border-t">
                  <Link
                    to={ROUTES.LOGIN}
                    onClick={closeMobileMenu}
                    className="btn btn-secondary w-full"
                  >
                    Login
                  </Link>
                  <Link
                    to={ROUTES.REGISTER}
                    onClick={closeMobileMenu}
                    className="btn btn-primary w-full"
                  >
                    Register
                  </Link>
                </div>
              )}

              {isAuthenticated && (
                <div className="mt-4 pt-4 border-t">
                  <button
                    onClick={() => {
                      logout()
                      closeMobileMenu()
                    }}
                    className="btn btn-secondary w-full"
                  >
                    Logout
                  </button>
                </div>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  )
}
