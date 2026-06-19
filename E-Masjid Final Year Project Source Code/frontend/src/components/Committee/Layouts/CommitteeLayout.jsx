import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuth } from '../../../hooks/useAuth.js'
import { useUI } from '../../../hooks/useUI.js'
import { ROUTES } from '../../../utils/constants.js'
import Toast from '../../Common/Toast'

export default function CommitteeLayout() {
  const { user, isAuthenticated, loading, logout } = useAuth()
  const { sidebarOpen, toggleSidebar, closeSidebar } = useUI()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (loading) return
    if (!isAuthenticated || user?.role !== 'committee') {
      navigate(ROUTES.COMMITTEE_LOGIN)
    }
  }, [isAuthenticated, user, navigate, loading])

  if (loading) return null
  if (!isAuthenticated || user?.role !== 'committee') return null

  const links = [
    { label: 'Fund Requests', path: ROUTES.COMMITTEE_DASHBOARD, icon: 'request_quote' },
  ]

  return (
    <div className="flex h-screen bg-gray-50">
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={closeSidebar} />}

      <aside className={`fixed left-0 top-0 z-40 h-screen w-[280px] overflow-y-auto bg-gradient-to-b from-[#064e3b] to-[#047857] text-white transition-transform duration-300 lg:z-30 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-white/15 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/15 rounded-lg flex items-center justify-center">
              <i className="material-icons-round">groups</i>
            </div>
            <div>
              <div className="font-bold">E-Masjid</div>
              <div className="text-xs text-white/70">Committee Panel</div>
            </div>
          </div>
          <button onClick={closeSidebar} className="lg:hidden p-2 hover:bg-white/10 rounded-lg">
            <i className="material-icons-round">close</i>
          </button>
        </div>

        <nav className="p-4">
          {links.map((link) => {
            const isActive = location.pathname === link.path
            return (
              <Link key={link.path} to={link.path} onClick={closeSidebar} className={`mb-2 flex items-center gap-3 rounded-lg px-4 py-3 transition-all ${isActive ? 'bg-white/20 text-white border-l-4 border-[#d4af37] pl-3' : 'text-white/80 hover:bg-white/10'}`}>
                <i className="material-icons-round text-xl">{link.icon}</i>
                <span className="font-medium">{link.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="px-4 my-4 border-t border-white/15" />
        <div className="p-4">
          <button type="button" onClick={() => { closeSidebar(); const path = logout(); if (path) navigate(path) }} className="w-full flex items-center gap-3 rounded-lg px-4 py-3 text-white/70 hover:bg-white/10 transition-colors">
            <i className="material-icons-round">logout</i>
            <span className="font-medium">Logout</span>
          </button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/15 bg-[#064e3b]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/15 rounded-full flex items-center justify-center">
              <i className="material-icons-round text-sm">person</i>
            </div>
            <div className="text-sm">
              <p className="font-medium">{user?.name || 'Committee Member'}</p>
              <p className="text-white/70 text-xs">Committee Member</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col lg:ml-[280px] overflow-hidden">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
          <div className="px-4 sm:px-6 lg:px-8 h-[70px] flex items-center justify-between">
            <button onClick={toggleSidebar} className="lg:hidden p-2 hover:bg-gray-100 rounded-lg">
              <i className="material-icons-round">menu</i>
            </button>
            <h1 className="text-xl font-bold text-gray-900">Committee Dashboard</h1>
            <div />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Outlet />
          </div>
        </main>
      </div>
      <Toast />
    </div>
  )
}
