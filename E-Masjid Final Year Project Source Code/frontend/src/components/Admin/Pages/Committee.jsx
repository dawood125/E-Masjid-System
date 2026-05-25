import { useEffect, useState } from 'react'
import { useUI } from '../../../hooks/useUI.js'
import api from '../../../utils/api.js'

export default function AdminCommittee() {
  const [members, setMembers] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' })
  const [loading, setLoading] = useState(true)
  const { showToast } = useUI()

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await api.getCommitteeMembers()
        if (!mounted) return
        const list = Array.isArray(res.data) ? res.data : []
        setMembers(list.map((item) => ({ ...item, id: item._id || item.id, mosqueName: item.mosqueName || 'Current Mosque' })))
      } catch (err) {
        showToast(err.message || 'Failed to load committee members.', 'error')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [showToast])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!formData.name || !formData.email) { showToast('Name and email are required', 'warning'); return }
    try {
      const res = await api.createCommitteeMember(formData)
      const created = {
        ...res.data,
        id: res.data._id || res.data.id,
        isActive: true,
        mosqueName: 'Current Mosque',
      }
      setMembers((prev) => [created, ...prev])
      setFormData({ name: '', email: '', phone: '' })
      setShowForm(false)
      if (res.tempPassword) {
        showToast(`Member created. Temp password: ${res.tempPassword}`, 'success')
      } else {
        showToast('Committee member created successfully.', 'success')
      }
    } catch (err) {
      showToast(err.message || 'Failed to create committee member.', 'error')
    }
  }

  const toggleActive = async (id) => {
    const current = members.find((member) => member.id === id)
    if (!current) return
    try {
      const res = await api.updateCommitteeMember(id, { isActive: !current.isActive })
      setMembers((prev) =>
        prev.map((member) =>
          member.id === id ? { ...member, ...res.data, id: member.id, mosqueName: member.mosqueName } : member
        )
      )
      showToast('Status updated', 'success')
    } catch (err) {
      showToast(err.message || 'Failed to update status.', 'error')
    }
  }

  const deleteMember = async (id) => {
    try {
      await api.deleteCommitteeMember(id)
      setMembers((prev) => prev.filter((member) => member.id !== id))
      showToast('Committee member removed', 'info')
    } catch (err) {
      showToast(err.message || 'Failed to remove committee member.', 'error')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-primary text-3xl font-bold text-gray-900">Committee Members</h1>
          <p className="mt-1 text-gray-500">Manage Zakat/Sadaqah fund review committee</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary bg-[#047857] hover:bg-[#064e3b]">
          <i className="material-icons-round text-lg">{showForm ? 'close' : 'person_add'}</i>
          {showForm ? 'Cancel' : 'Add Member'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm animate-fade-in-up">
          <h2 className="font-primary text-xl font-bold text-gray-900 mb-5">Add Committee Member</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            <div>
              <label className="form-label">Full Name *</label>
              <div className="relative">
                <i className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">person</i>
                <input className="form-input" placeholder="Full name" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="form-label">Email *</label>
              <div className="relative">
                <i className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">email</i>
                <input type="email" className="form-input" placeholder="email@example.com" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="form-label">Phone</label>
              <div className="relative">
                <i className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">phone</i>
                <input className="form-input" placeholder="03XX-XXXXXXX" value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} />
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-400 mb-4">A temporary password will be emailed to the committee member for login.</p>
          <button type="submit" className="btn btn-primary bg-[#047857] hover:bg-[#064e3b]">
            <i className="material-icons-round text-lg">check</i>Create Member
          </button>
        </form>
      )}

      {/* Members Table */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-5 py-3.5 text-left font-semibold text-gray-600">Name</th>
                <th className="px-5 py-3.5 text-left font-semibold text-gray-600">Email</th>
                <th className="px-5 py-3.5 text-left font-semibold text-gray-600">Phone</th>
                <th className="px-5 py-3.5 text-left font-semibold text-gray-600">Mosque</th>
                <th className="px-5 py-3.5 text-center font-semibold text-gray-600">Status</th>
                <th className="px-5 py-3.5 text-center font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!loading && members.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-gray-500">No committee members found.</td>
                </tr>
              )}
              {members.map((member) => (
                <tr key={member.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary-100 flex items-center justify-center text-[#047857] font-semibold text-sm">
                        {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <span className="font-medium text-gray-900">{member.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-600">{member.email}</td>
                  <td className="px-5 py-4 text-gray-600">{member.phone || '—'}</td>
                  <td className="px-5 py-4 text-gray-600">{member.mosqueName}</td>
                  <td className="px-5 py-4 text-center">
                    <button onClick={() => toggleActive(member.id)} className={`rounded-full px-3 py-1 text-xs font-semibold ${member.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {member.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <button onClick={() => deleteMember(member.id)} className="rounded-lg p-2 text-red-500 hover:bg-red-50 transition-colors">
                      <i className="material-icons-round text-lg">delete</i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
