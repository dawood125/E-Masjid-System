import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import { useUI } from '../../hooks/useUI.js'
import { useMosque } from '../../hooks/useMosque.js'
import { ROUTES } from '../../utils/constants.js'
import MosqueSearchModal from '../Auth/Pages/MosqueSearchModal.jsx'

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
        <div className="absolute top-full left-0 mt-1 w-52 rounded-xl border border-gray-200 bg-white py-2 shadow-xl animate-fade-in z-[60]">
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

function UserAvatarMenu({ user, logout }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const name = user?.name || 'User'
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'U'

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        title={name}
        aria-label="Account menu"
        className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#047857] to-[#064e3b] text-sm font-bold text-white shadow-sm transition-all duration-150 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary-300"
      >
        <span aria-hidden="true">{initials}</span>
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 w-60 rounded-xl border border-gray-200 bg-white py-2 shadow-xl animate-fade-in z-[70]">
          <div className="border-b border-gray-100 px-4 py-3">
            <p className="text-sm font-semibold text-gray-900 truncate" title={name}>{name}</p>
            <p className="text-xs text-gray-500 truncate" title={user?.email || ''}>{user?.email || ''}</p>
            <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-[#047857]">
              {user?.role || 'member'}
            </p>
          </div>

          <div className="py-1">
            {user?.role === 'admin' && (
              <Link
                to={ROUTES.ADMIN}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-primary-50 hover:text-[#047857]"
              >
                <i className="material-icons-round text-lg text-gray-400">dashboard</i>
                Admin Dashboard
              </Link>
            )}
            {user?.role === 'scholar' && (
              <Link
                to={ROUTES.SCHOLAR}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-primary-50 hover:text-[#047857]"
              >
                <i className="material-icons-round text-lg text-gray-400">auto_stories</i>
                Scholar Dashboard
              </Link>
            )}
            {user?.role === 'committee' && (
              <Link
                to={ROUTES.COMMITTEE}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-primary-50 hover:text-[#047857]"
              >
                <i className="material-icons-round text-lg text-gray-400">groups</i>
                Committee Panel
              </Link>
            )}
            {user?.role === 'community' && (
              <Link
                to={ROUTES.MY_BOOKINGS}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-primary-50 hover:text-[#047857]"
              >
                <i className="material-icons-round text-lg text-gray-400">bookmark</i>
                My Bookings
              </Link>
            )}

            <button
              type="button"
              onClick={() => {
                logout()
                setOpen(false)
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              <i className="material-icons-round text-lg">logout</i>
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth()
  const { toggleMobileMenu, mobileMenuOpen, closeMobileMenu } = useUI()
  const { mosques, activeMosque, setActiveMosque } = useMosque()
  const location = useLocation()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMosqueModalOpen, setIsMosqueModalOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleMosqueChange = useCallback((mosque) => {
    // Phase 3.5: accepts a full mosque object from MosqueSearchModal
    if (!mosque) {
      setActiveMosque('')
    } else {
      setActiveMosque(mosque._id)
    }
    setIsMosqueModalOpen(false)
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
    <header className={`fixed top-0 left-0 right-0 z-[60] border-b border-gray-200 transition-all duration-300 ${isScrolled ? 'bg-white shadow-md' : 'bg-white shadow-sm'}`} style={{ overflow: 'visible' }}>
      <div className="container min-h-20 py-2 flex flex-wrap items-center gap-x-2 gap-y-2 lg:flex-nowrap lg:gap-4">
        {/* Logo */}
        <Link to={ROUTES.HOME} className="flex items-center gap-3 shrink-0 basis-auto min-w-0">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#047857] to-[#064e3b] shadow-md">
            <i className="material-icons-round text-white text-[26px]">mosque</i>
          </div>
          <div className="hidden sm:flex flex-col min-w-0 max-w-[7rem] lg:max-w-[7rem] xl:max-w-[12rem]">
            <span className="font-primary text-base lg:text-lg font-bold leading-tight text-[#064e3b] truncate" title={activeMosque?.name || 'E-Masjid'}>
              {activeMosque?.name || 'E-Masjid'}
            </span>
            <span className="text-xs font-medium text-gray-500 truncate" title={activeMosque?.city || 'Select a mosque'}>
              {activeMosque?.city || 'Select a mosque'}
            </span>
          </div>
        </Link>

        {/* Desktop Navigation — shown at lg+ (1024px) */}
        <nav className="hidden lg:flex items-center gap-1 flex-1 min-w-0 justify-end flex-nowrap">
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

        {/* Mosque Selector — shows at lg when logged in (compact), at xl only when logged out */}
        {mosques.length > 0 && (
          <div className={`items-center gap-2 shrink min-w-0 relative order-3 lg:order-none w-full lg:w-auto mt-2 lg:mt-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-gray-100 ${isAuthenticated ? 'hidden lg:flex' : 'hidden xl:flex'}`} style={{ zIndex: 70 }}>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Mosque</span>
            <button
              type="button"
              onClick={() => setIsMosqueModalOpen(true)}
              title={activeMosque ? `${activeMosque.name} (${activeMosque.city})` : 'Select a mosque'}
              className="min-w-0 w-32 2xl:w-48 truncate rounded-lg border border-gray-300 bg-white pl-2 pr-7 py-2 text-sm text-gray-700 text-left focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {activeMosque ? `${activeMosque.name}` : 'Select a mosque'}
            </button>
            <i className="material-icons-round absolute right-1 top-1/2 -translate-y-1/2 text-gray-500 text-base pointer-events-none">expand_more</i>
          </div>
        )}

        {/* Auth Buttons — always visible at sm+, never shrink */}
        <div className="flex items-center gap-2 shrink-0 ml-auto lg:ml-0 order-2 lg:order-none">
          {isAuthenticated ? (
            <div className="hidden lg:flex items-center gap-2 shrink-0 min-w-0">
              <UserAvatarMenu user={user} logout={logout} />
            </div>
          ) : (
            <div className="hidden lg:flex items-center gap-1.5 shrink-0">
              <Link to={ROUTES.LOGIN} className="btn btn-secondary btn-sm whitespace-nowrap px-3 py-1.5 text-sm">
                Login
              </Link>
              <Link to={ROUTES.REGISTER} className="btn btn-primary btn-sm whitespace-nowrap px-3 py-1.5 text-sm">
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
                  <button
                    type="button"
                    onClick={() => {
                      closeMobileMenu()
                      setIsMosqueModalOpen(true)
                    }}
                    className="w-full flex items-center gap-3 p-2 rounded-lg border border-gray-200 bg-white text-left hover:border-[#047857]/40"
                  >
                    <i className="material-icons-round text-[#047857]">mosque</i>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {activeMosque ? activeMosque.name : 'Choose a mosque'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {activeMosque ? `${activeMosque.city}` : 'Search by name or city'}
                      </p>
                    </div>
                    <i className="material-icons-round text-gray-400">chevron_right</i>
                  </button>
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
                  <div className="mb-4 flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#047857] to-[#064e3b] text-sm font-bold text-white">
                      {(user?.name || 'U')
                        .split(' ')
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((part) => part[0])
                        .join('')
                        .toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-900">{user?.name || 'User'}</p>
                      <p className="truncate text-xs text-gray-500">{user?.email || ''}</p>
                    </div>
                    <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-[#047857]">
                      {user?.role || 'member'}
                    </span>
                  </div>
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

      {/* Phase 3.5: reusable search modal (used by both desktop + mobile triggers) */}
      <MosqueSearchModal
        open={isMosqueModalOpen}
        onClose={() => setIsMosqueModalOpen(false)}
        onSelect={handleMosqueChange}
        initialCity={activeMosque?.city || ''}
      />
    </header>
  )
}
