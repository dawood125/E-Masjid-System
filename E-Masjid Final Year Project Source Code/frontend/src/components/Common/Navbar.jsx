import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import { useUI } from '../../hooks/useUI.js'
import { ROUTES } from '../../utils/constants.js'

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth()
  const { toggleMobileMenu, mobileMenuOpen, closeMobileMenu } = useUI()
  const location = useLocation()
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { label: 'Home', path: ROUTES.HOME },
    { label: 'Prayer Times', path: ROUTES.PRAYER_TIMES },
    { label: 'Events', path: ROUTES.EVENTS },
    { label: 'Donate', path: ROUTES.DONATE },
    { label: 'Nikah Services', path: ROUTES.NIKAH_BOOKING },
    { label: 'Transparency', path: ROUTES.TRANSPARENCY },
  ]

  const isActive = (path) => {
    if (path === ROUTES.HOME) return location.pathname === ROUTES.HOME
    return location.pathname.startsWith(path)
  }

  return (
    <header className={`fixed top-0 left-0 right-0 z-40 border-b border-gray-200 transition-all duration-300 ${isScrolled ? 'bg-white shadow-md' : 'bg-white shadow-sm'}`}>
      <div className="container h-20 flex items-center justify-between gap-5">
        {/* Logo */}
        <Link to={ROUTES.HOME} className="flex items-center gap-3 shrink-0">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#047857] to-[#064e3b] shadow-md">
            <i className="material-icons-round text-white text-[26px]">mosque</i>
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="font-primary text-xl font-bold leading-tight text-[#064e3b]">Masjid Al-Noor</span>
            <span className="text-xs font-medium text-gray-500">Sheikhupura</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden xl:flex items-center gap-2">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`relative rounded-md px-3 py-2 font-primary text-[0.95rem] font-medium transition-all duration-150 ${
                isActive(link.path)
                  ? 'bg-primary-50 text-[#047857]'
                  : 'text-gray-700 hover:bg-primary-50 hover:text-[#047857]'
              }`}
            >
              {link.label}
              {(isActive(link.path)) && (
                <span className="absolute left-1/2 bottom-0 h-[3px] w-8 -translate-x-1/2 rounded-full bg-[#d4af37]" />
              )}
            </Link>
          ))}
        </nav>

        {/* Auth Buttons */}
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline text-sm font-medium text-gray-700">
                {user?.name || 'User'}
              </span>
              <button
                onClick={() => {
                  logout()
                  closeMobileMenu()
                }}
                className="btn btn-secondary btn-sm border border-[#047857] text-[#047857]"
              >
                Logout
              </button>
              {user?.role === 'admin' && (
                <Link to={ROUTES.ADMIN} className="btn btn-primary btn-sm bg-[#047857] hover:bg-[#064e3b]">
                  Admin
                </Link>
              )}
              {user?.role === 'scholar' && (
                <Link to={ROUTES.SCHOLAR} className="btn btn-primary btn-sm bg-[#047857] hover:bg-[#064e3b]">
                  Dashboard
                </Link>
              )}
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link to={ROUTES.LOGIN} className="btn btn-secondary btn-sm border border-[#047857] text-[#047857] hover:bg-primary-50">
                Login
              </Link>
              <Link to={ROUTES.REGISTER} className="btn btn-primary btn-sm bg-[#047857] hover:bg-[#064e3b]">
                Register
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={toggleMobileMenu}
            className="xl:hidden flex h-11 w-11 items-center justify-center rounded-md bg-primary-50 text-[#047857] transition-colors duration-150 hover:bg-primary-100"
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
        <div className="xl:hidden fixed top-20 inset-x-0 bottom-0 bg-white border-t border-gray-200 shadow-lg animate-slide-in-right overflow-y-auto">
          <div className="container py-5">
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={closeMobileMenu}
                  className={`rounded-lg border-b border-gray-100 px-5 py-4 text-base transition-colors duration-150 ${
                    isActive(link.path)
                      ? 'bg-primary-50 text-[#047857] font-semibold'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              {!isAuthenticated && (
                <div className="flex flex-col gap-2 mt-4 pt-4 border-t">
                  <Link
                    to={ROUTES.LOGIN}
                    onClick={closeMobileMenu}
                    className="btn w-full border border-[#047857] text-[#047857] bg-white"
                  >
                    Login
                  </Link>
                  <Link
                    to={ROUTES.REGISTER}
                    onClick={closeMobileMenu}
                    className="btn w-full bg-[#047857] text-white"
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
                    className="btn w-full border border-[#047857] text-[#047857] bg-white"
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
