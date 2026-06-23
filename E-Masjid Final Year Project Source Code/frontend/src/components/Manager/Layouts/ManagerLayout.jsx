import { Outlet, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../../hooks/useAuth.js'
import { useUI } from '../../../hooks/useUI.js'
import { ROUTES } from '../../../utils/constants.js'

const managerLinks = [
  { label: 'Dashboard', path: ROUTES.MANAGER_DASHBOARD, icon: 'dashboard' },
  { label: 'Manage Mosques', path: ROUTES.MANAGER_MOSQUES, icon: 'mosque' },
]

export default function ManagerLayout() {
  const { user, isAuthenticated, loading, logout } = useAuth()
  const { sidebarOpen, toggleSidebar, closeSidebar } = useUI()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (loading) return
    if (!isAuthenticated || user?.role !== 'manager') {
      navigate(ROUTES.MANAGER_LOGIN)
    }
  }, [isAuthenticated, user, navigate, loading])

  if (loading) return null
  if (!isAuthenticated || user?.role !== 'manager') return null

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={closeSidebar} />
      )}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 z-40 h-screen w-[280px] transform overflow-y-auto bg-gradient-to-b from-[#1a1a2e] to-[#16213e] text-white transition-transform duration-300 lg:z-30 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-[#d4af37]/20 rounded-lg">
              <i className="material-icons-round text-[#d4af37]">admin_panel_settings</i>
            </div>
            <div>
              <div className="font-bold text-[#d4af37]">E-Masjid</div>
              <div className="text-xs text-gray-400">Mosque Manager</div>
            </div>
          </div>
          <button onClick={closeSidebar} className="rounded-lg p-2 hover:bg-white/10 lg:hidden">
            <i className="material-icons-round">close</i>
          </button>
        </div>

        <nav className="p-4">
          {managerLinks.map((link) => {
            const isActive = location.pathname === link.path || (link.path !== ROUTES.MANAGER_DASHBOARD && location.pathname.startsWith(link.path))
            return (
              <Link key={link.path} to={link.path} onClick={closeSidebar} className={`mb-2 flex items-center gap-3 rounded-lg px-4 py-3 transition-all ${isActive ? 'bg-[#d4af37]/20 text-[#d4af37] border-l-4 border-[#d4af37] pl-3' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}>
                <i className="material-icons-round text-xl">{link.icon}</i>
                <span className="font-medium">{link.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="px-4 my-4 border-t border-white/10" />

        <div className="p-4">
          <button type="button" onClick={() => { closeSidebar(); const path = logout(); if (path) navigate(path) }} className="w-full flex items-center gap-3 rounded-lg px-4 py-3 text-gray-400 hover:bg-white/10 hover:text-white transition-colors">
            <i className="material-icons-round">logout</i>
            <span className="font-medium">Logout</span>
          </button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10 bg-[#0f0f23]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#d4af37]/20 rounded-full flex items-center justify-center">
              <i className="material-icons-round text-[#d4af37] text-sm">person</i>
            </div>
            <div className="text-sm flex-1">
              <p className="font-medium text-white">{user?.name || 'Manager'}</p>
              <p className="text-gray-400 text-xs">Mosque Manager</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-[280px] overflow-hidden">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
          <div className="px-4 sm:px-6 lg:px-8 h-[70px] flex items-center justify-between">
            <button onClick={toggleSidebar} className="lg:hidden p-2 hover:bg-gray-100 rounded-lg">
              <i className="material-icons-round">menu</i>
            </button>
            <h1 className="text-xl font-bold text-gray-900">Mosque Manager Panel</h1>
            <div className="flex items-center gap-3">
              <Link to={ROUTES.HOME} className="btn btn-outline btn-sm border-[#047857] text-[#047857] hover:bg-primary-50" target="_blank">
                <i className="material-icons-round text-base">visibility</i>
                View Website
              </Link>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
