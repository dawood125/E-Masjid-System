import { Outlet, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuth } from '../../../hooks/useAuth.js'
import { useUI } from '../../../hooks/useUI.js'
import Sidebar from '../../Common/Sidebar'
import Toast from '../../Common/Toast'
import { ROUTES } from '../../../utils/constants.js'

export default function AdminLayout() {
  const { user, isAuthenticated } = useAuth()
  const { toggleSidebar } = useUI()
  const navigate = useNavigate()

  useEffect(() => {
    // Check if user is admin
    if (!isAuthenticated || user?.role !== 'admin') {
      navigate(ROUTES.LOGIN)
    }
  }, [isAuthenticated, user, navigate])

  if (!isAuthenticated || user?.role !== 'admin') {
    return null
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar role="admin" />

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-sidebar overflow-hidden">
        {/* Admin Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
          <div className="px-4 sm:px-6 lg:px-8 h-header flex items-center justify-between">
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <i className="material-icons-round">menu</i>
            </button>

            <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>

            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <i className="material-icons-round">notifications</i>
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <i className="material-icons-round">settings</i>
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Outlet />
          </div>
        </main>
      </div>

      <Toast />
    </div>
  )
}
