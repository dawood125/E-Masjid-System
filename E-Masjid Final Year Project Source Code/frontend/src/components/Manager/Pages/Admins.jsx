import { useEffect, useState } from 'react'
import { useUI } from '../../../hooks/useUI.js'
import api from '../../../utils/api.js'

/**
 * Super Admin (Manager) → Admins page
 *
 * Lists all admin accounts across the masjids this manager manages. Used
 * for support (password reset, deactivation, audit) — but not for editing
 * admin credentials directly. Each admin's masjid affiliation is shown so
 * the super admin can quickly find which masjid they belong to.
 */
export default function ManageAdmins() {
  const [admins, setAdmins] = useState([])
  const [managedMosques, setManagedMosques] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterMosque, setFilterMosque] = useState('all')
  const [search, setSearch] = useState('')
  const { showToast } = useUI()

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.getSuperAdminAdmins()
      setAdmins(res.data || [])
      setManagedMosques(res.managedMosques || [])
    } catch (e) {
      showToast(e.message || 'Failed to load admins', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() /* eslint-disable-line react-hooks/exhaustive-deps */ }, [])

  const filtered = admins
    .filter((a) => filterMosque === 'all' || a.mosqueId?._id === filterMosque)
    .filter((a) => !search ||
      a.name?.toLowerCase().includes(search.toLowerCase()) ||
      a.email?.toLowerCase().includes(search.toLowerCase())
    )

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="font-primary text-3xl font-bold text-gray-900">Manage Admins</h1>
        <p className="mt-1 text-gray-500">
          All admin accounts across the {managedMosques.length} masjid(s) you manage
        </p>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="form-label">Search by name or email</label>
            <input
              className="form-input"
              placeholder="e.g. Haji Ahmad"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div>
            <label className="form-label">Filter by masjid</label>
            <select
              className="form-input"
              value={filterMosque}
              onChange={(e) => setFilterMosque(e.target.value)}
            >
              <option value="all">All masjids ({admins.length})</option>
              {managedMosques.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.name} — {m.city}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-6 py-3 font-semibold text-gray-600">Name</th>
                <th className="px-6 py-3 font-semibold text-gray-600">Email</th>
                <th className="px-6 py-3 font-semibold text-gray-600">Phone</th>
                <th className="px-6 py-3 font-semibold text-gray-600">Masjid</th>
                <th className="px-6 py-3 font-semibold text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">Loading admins…</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No admins match your filter.
                  </td>
                </tr>
              ) : (
                filtered.map((admin) => (
                  <tr key={admin._id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-4 font-semibold text-gray-900">{admin.name}</td>
                    <td className="px-6 py-4 text-gray-700">{admin.email}</td>
                    <td className="px-6 py-4 text-gray-700">{admin.phone || '—'}</td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-[#047857]">
                        {admin.mosqueId?.name || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        admin.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {admin.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <div className="flex items-start gap-2">
          <i className="material-icons-round text-amber-700">info</i>
          <p>
            Admins are created from the <strong>Manage Mosques</strong> page using the <em>Add Admin</em> button on a masjid card.
            To reset an admin's password or deactivate their account, you can contact them directly (admins use the standard forgot-password flow).
          </p>
        </div>
      </div>
    </div>
  )
}
