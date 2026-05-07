import { Link } from 'react-router-dom'
import { mockMosques } from '../../../mocks/index.js'
import { ROUTES } from '../../../utils/constants.js'

export default function ManagerDashboard() {
  const mosques = mockMosques
  const activeMosques = mosques.filter(m => m.isActive).length
  const totalModules = mosques.reduce((acc, m) => acc + m.enabledModules.length, 0)

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Header */}
      <div className="rounded-2xl bg-gradient-to-br from-[#1a1a2e] to-[#16213e] p-8 text-white relative overflow-hidden">
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-[#d4af37]/10" />
        <div className="absolute -bottom-14 -left-14 h-48 w-48 rounded-full bg-white/5" />
        <div className="relative z-10">
          <p className="text-[#d4af37] text-sm font-semibold uppercase tracking-wider">Mosque Manager Dashboard</p>
          <h1 className="mt-2 font-primary text-3xl font-bold">Assalam-o-Alaikum!</h1>
          <p className="mt-2 text-gray-300 max-w-xl">Manage multiple mosques, configure modules, and oversee operations from a single dashboard.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <i className="material-icons-round text-blue-600 text-2xl">mosque</i>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Mosques</p>
              <p className="text-3xl font-bold text-gray-900">{mosques.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center">
              <i className="material-icons-round text-green-600 text-2xl">check_circle</i>
            </div>
            <div>
              <p className="text-sm text-gray-500">Active Mosques</p>
              <p className="text-3xl font-bold text-gray-900">{activeMosques}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center">
              <i className="material-icons-round text-amber-600 text-2xl">widgets</i>
            </div>
            <div>
              <p className="text-sm text-gray-500">Active Modules</p>
              <p className="text-3xl font-bold text-gray-900">{totalModules}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mosque List */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-primary text-2xl font-bold text-gray-900">Your Mosques</h2>
          <Link to={ROUTES.MANAGER_MOSQUES} className="btn btn-primary bg-[#047857] hover:bg-[#064e3b]">
            <i className="material-icons-round text-lg">add</i>
            Add Mosque
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {mosques.map((mosque) => (
            <div key={mosque.id} className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
              <div className="relative h-40 overflow-hidden">
                <img src={mosque.image} alt={mosque.name} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4">
                  <h3 className="text-lg font-bold text-white">{mosque.name}</h3>
                  <p className="text-sm text-white/80">{mosque.city}</p>
                </div>
                <span className={`absolute top-3 right-3 rounded-full px-3 py-1 text-xs font-semibold ${mosque.isActive ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}`}>
                  {mosque.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="p-5">
                <p className="text-sm text-gray-500 mb-3">{mosque.address}</p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {mosque.enabledModules.slice(0, 4).map((mod) => (
                    <span key={mod} className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-[#047857] capitalize">{mod}</span>
                  ))}
                  {mosque.enabledModules.length > 4 && (
                    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">+{mosque.enabledModules.length - 4} more</span>
                  )}
                </div>
                <Link to={ROUTES.MANAGER_MOSQUES} className="inline-flex items-center gap-1 text-sm font-semibold text-[#047857] hover:text-[#d4af37] transition-colors">
                  Manage <i className="material-icons-round text-base">arrow_forward</i>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
