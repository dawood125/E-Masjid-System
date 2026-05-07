import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../../hooks/useAuth.js'
import { ROUTES } from '../../../utils/constants.js'

export default function ManagerLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) { setError('All fields are required'); return }
    setLoading(true); setError('')
    try {
      await new Promise(r => setTimeout(r, 500))
      login(email, password, 'manager')
      navigate(ROUTES.MANAGER)
    } catch { setError('Invalid credentials') } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] p-4">
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-[#d4af37]/20 flex items-center justify-center mb-4">
            <i className="material-icons-round text-[#d4af37] text-3xl">admin_panel_settings</i>
          </div>
          <h1 className="text-3xl font-bold text-white">Mosque Manager</h1>
          <p className="mt-2 text-gray-400">Sign in to manage your mosques</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-8 shadow-2xl">
          {error && (
            <div className="mb-4 rounded-lg bg-red-500/20 border border-red-500/30 px-4 py-3 text-sm text-red-200 flex items-center gap-2">
              <i className="material-icons-round text-base">error</i>{error}
            </div>
          )}

          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
            <div className="relative">
              <i className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">email</i>
              <input type="email" className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#d4af37] focus:border-transparent" placeholder="manager@emasjid.pk" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
            <div className="relative">
              <i className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">lock</i>
              <input type={showPassword ? 'text' : 'password'} className="w-full pl-10 pr-12 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#d4af37] focus:border-transparent" placeholder="Enter password" value={password} onChange={e => setPassword(e.target.value)} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                <i className="material-icons-round text-xl">{showPassword ? 'visibility_off' : 'visibility'}</i>
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-[#d4af37] text-[#1a1a2e] font-bold hover:bg-[#b7791f] transition-all disabled:opacity-60">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <div className="mt-6 text-center">
            <Link to={ROUTES.LOGIN} className="text-sm text-gray-400 hover:text-[#d4af37] transition-colors">
              ← Back to Community Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
