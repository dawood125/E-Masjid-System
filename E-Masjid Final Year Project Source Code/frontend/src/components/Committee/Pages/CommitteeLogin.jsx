import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../../hooks/useAuth.js'
import { ROUTES } from '../../../utils/constants.js'

export default function CommitteeLogin() {
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
      login(email, password, 'committee')
      navigate(ROUTES.COMMITTEE)
    } catch { setError('Invalid credentials') } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#064e3b] via-[#047857] to-[#065f46] p-4">
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-white/15 flex items-center justify-center mb-4">
            <i className="material-icons-round text-white text-3xl">groups</i>
          </div>
          <h1 className="text-3xl font-bold text-white">Committee Member</h1>
          <p className="mt-2 text-white/70">Sign in to review fund requests</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-8 shadow-2xl">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 flex items-center gap-2">
              <i className="material-icons-round text-base">error</i>{error}
            </div>
          )}

          <div className="mb-5">
            <label className="form-label">Email Address</label>
            <div className="relative">
              <i className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">email</i>
              <input type="email" className="form-input" placeholder="committee@emasjid.pk" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
          </div>

          <div className="mb-6">
            <label className="form-label">Password</label>
            <div className="relative">
              <i className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">lock</i>
              <input type={showPassword ? 'text' : 'password'} className="form-input pr-12" placeholder="Enter password" value={password} onChange={e => setPassword(e.target.value)} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <i className="material-icons-round text-xl">{showPassword ? 'visibility_off' : 'visibility'}</i>
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full btn btn-lg bg-[#047857] text-white hover:bg-[#064e3b] disabled:opacity-60">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <div className="mt-6 text-center">
            <Link to={ROUTES.LOGIN} className="text-sm text-gray-500 hover:text-[#047857] transition-colors">
              ← Back to Community Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
