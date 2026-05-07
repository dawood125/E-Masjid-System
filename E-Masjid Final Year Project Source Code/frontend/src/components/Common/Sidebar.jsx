import { Link, useLocation } from 'react-router-dom'
import { useUI } from '../../hooks/useUI.js'
import { ROUTES } from '../../utils/constants.js'

export default function Sidebar({ role = 'admin' }) {
  const { sidebarOpen, closeSidebar } = useUI()
  const location = useLocation()

  const adminLinks = [
    { label: 'Dashboard', path: ROUTES.ADMIN_DASHBOARD, icon: 'dashboard' },
    { label: 'Donations & Expenses', path: ROUTES.ADMIN_DONATIONS, icon: 'account_balance_wallet' },
    { label: 'Prayer Times', path: ROUTES.ADMIN_PRAYER_TIMES, icon: 'schedule' },
    { label: 'Events', path: ROUTES.ADMIN_EVENTS, icon: 'event' },
    { label: 'Announcements', path: ROUTES.ADMIN_ANNOUNCEMENTS, icon: 'campaign' },
    { label: 'Manage Scholars', path: ROUTES.ADMIN_SCHOLARS, icon: 'school' },
    { label: 'Committee Members', path: ROUTES.ADMIN_COMMITTEE, icon: 'groups' },
    { label: 'Fund Requests', path: ROUTES.ADMIN_FUND_REQUESTS, icon: 'request_quote' },
  ]

  const scholarLinks = [
    { label: 'Dashboard', path: ROUTES.SCHOLAR_DASHBOARD, icon: 'dashboard' },
  ]

  const links = role === 'admin' ? adminLinks : scholarLinks

  return (
    <>
      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-50 transition-opacity duration-300 ease-in-out lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 z-40 h-screen w-sidebar transform overflow-y-auto bg-primary-dark text-white transition-transform duration-300 ease-in-out lg:z-30 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Sidebar Header */}
        <div className="p-6 border-b border-primary-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-white bg-opacity-20 rounded-lg">
              <i className="material-icons-round">mosque</i>
            </div>
            <div>
              <div className="font-bold">E-Masjid</div>
              <div className="text-xs text-primary-100">
                {role === 'admin' ? 'Admin Panel' : 'Scholar Panel'}
              </div>
            </div>
          </div>
          <button
            onClick={closeSidebar}
            className="rounded-lg p-2 transition-colors duration-150 hover:bg-primary-700 lg:hidden"
          >
            <i className="material-icons-round">close</i>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="p-4">
          {links.map((link) => {
            const isDashboardPath = link.path === ROUTES.ADMIN_DASHBOARD || link.path === ROUTES.SCHOLAR_DASHBOARD
            const isActive = isDashboardPath
              ? location.pathname === link.path
              : location.pathname === link.path || location.pathname.startsWith(`${link.path}/`)
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={closeSidebar}
                className={`mb-2 flex items-center gap-3 rounded-lg px-4 py-3 transition-all duration-150 ${
                  isActive
                    ? 'border-l-4 border-accent bg-primary-700 pl-3 text-white'
                    : 'text-primary-100 hover:bg-primary-700 hover:text-white'
                }`}
              >
                <i className="material-icons-round text-xl">{link.icon}</i>
                <span className="font-medium">{link.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Divider */}
        <div className="px-4 my-4 border-t border-primary-700" />

        {/* Logout */}
        <div className="p-4">
          <Link
            to={ROUTES.HOME}
            onClick={() => {
              localStorage.removeItem('user')
              closeSidebar()
            }}
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-primary-100 transition-colors duration-150 hover:bg-primary-700"
          >
            <i className="material-icons-round">logout</i>
            <span className="font-medium">Logout</span>
          </Link>
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-primary-700 bg-primary-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <i className="material-icons-round text-sm">person</i>
            </div>
            <div className="text-sm flex-1">
              <p className="font-medium">Haji Ahmad</p>
              <p className="text-primary-100 text-xs">Administrator</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
