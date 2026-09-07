import { useEffect, useState } from 'react'
import { useUI } from '../../../hooks/useUI.js'
import api from '../../../utils/api.js'
import FormField from '../../Common/FormField.jsx'

export default function ManageAdmins() {
  const [admins, setAdmins] = useState([])
  const [managedMosques, setManagedMosques] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterMosque, setFilterMosque] = useState('all')
  const [search, setSearch] = useState('')
  const [confirmToggle, setConfirmToggle] = useState(null)
  const [togglingId, setTogglingId] = useState(null)
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

  useEffect(() => { load()  }, [])

  const filtered = admins
    .filter((a) => filterMosque === 'all' || a.mosqueId?._id === filterMosque)
    .filter((a) => !search ||
      a.name?.toLowerCase().includes(search.toLowerCase()) ||
      a.email?.toLowerCase().includes(search.toLowerCase())
    )

  const activeCount = admins.filter((a) => a.isActive).length

  const toggleActive = async (admin) => {
    setTogglingId(admin._id)
    try {
      const next = !admin.isActive
      const res = await api.updateSuperAdminAdmin(admin._id, { isActive: next })
      setAdmins((prev) =>
        prev.map((item) => (item._id === admin._id ? { ...item, ...res.data, _id: item._id } : item))
      )
      showToast(
        next ? `${admin.name} re-activated.` : `${admin.name} deactivated.`,
        'success'
      )
      setConfirmToggle(null)
    } catch (err) {
      showToast(err.message || 'Failed to update admin status.', 'error')
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="font-primary text-3xl font-bold text-gray-900">Manage Admins</h1>
        <p className="mt-1 text-gray-500">
          All admin accounts across the {managedMosques.length} masjid(s) you manage
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total Admins</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{admins.length}</p>
        </article>
        <article className="rounded-xl border border-emerald-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Active</p>
          <p className="mt-2 text-2xl font-bold text-emerald-700">{activeCount}</p>
        </article>
        <article className="rounded-xl border border-amber-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Inactive</p>
          <p className="mt-2 text-2xl font-bold text-amber-700">{admins.length - activeCount}</p>
        </article>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormField
            name="search"
            label="Search by name or email"
            icon="search"
            optional
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="e.g. Haji Ahmad"
          />
          <FormField
            name="filterMosque"
            label="Filter by masjid"
            type="select"
            value={filterMosque}
            onChange={(e) => setFilterMosque(e.target.value)}
          >
            <option value="all">All masjids ({admins.length})</option>
            {managedMosques.map((m) => (
              <option key={m._id} value={m._id}>
                {m.name} — {m.city}
              </option>
            ))}
          </FormField>
        </div>
      </div>

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
                <th className="px-6 py-3 font-semibold text-gray-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">Loading admins…</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
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
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => setConfirmToggle(admin)}
                        disabled={togglingId === admin._id}
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-md border disabled:opacity-50 ${
                          admin.isActive
                            ? 'border-red-200 text-red-600 hover:bg-red-50'
                            : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                        }`}
                        title={admin.isActive ? 'Deactivate admin' : 'Activate admin'}
                      >
                        <i className="material-icons-round text-base">
                          {admin.isActive ? 'block' : 'check_circle'}
                        </i>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {confirmToggle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h3 className={`inline-flex items-center gap-2 text-lg font-bold ${confirmToggle.isActive ? 'text-red-700' : 'text-emerald-700'}`}>
                <i className="material-icons-round">{confirmToggle.isActive ? 'block' : 'check_circle'}</i>
                {confirmToggle.isActive ? 'Deactivate Admin' : 'Activate Admin'}
              </h3>
              <button type="button" onClick={() => setConfirmToggle(null)} className="text-gray-500 hover:text-gray-700">
                <i className="material-icons-round">close</i>
              </button>
            </div>
            <div className="space-y-4 px-6 py-5">
              <p className="text-sm text-gray-700">
                {confirmToggle.isActive ? (
                  <>Are you sure you want to mark <strong className="text-gray-900">{confirmToggle.name}</strong> as inactive? They will not be able to log in to the admin dashboard until re-activated. Their existing data will be preserved.</>
                ) : (
                  <>Are you sure you want to re-activate <strong className="text-gray-900">{confirmToggle.name}</strong>? They will once again be able to log in to the admin dashboard.</>
                )}
              </p>
              <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
                <button
                  type="button"
                  onClick={() => setConfirmToggle(null)}
                  disabled={togglingId === confirmToggle._id}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => toggleActive(confirmToggle)}
                  disabled={togglingId === confirmToggle._id}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${
                    confirmToggle.isActive
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {togglingId === confirmToggle._id ? 'Updating...' : (confirmToggle.isActive ? 'Mark Inactive' : 'Activate')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
