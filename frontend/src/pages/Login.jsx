/**
 * pages/Login.jsx
 */
import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Lock, LogIn } from 'lucide-react'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'

export default function Login() {
  const [form, setForm]     = useState({ email: '', password: '' })
  const [error, setError]   = useState('')
  const { login, loading }  = useAuthStore((s) => ({ login: s.login, loading: s.loading }))
  const navigate             = useNavigate()
  const location             = useLocation()
  const from                 = location.state?.from?.pathname || '/dashboard'

  function handle(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    setError('')
  }

  async function submit(e) {
    e.preventDefault()
    if (!form.email || !form.password) {
      setError('Both fields are required.')
      return
    }
    const result = await login(form.email, form.password)
    if (result.ok) {
      toast.success('Welcome back.')
      navigate(from, { replace: true })
    } else {
      setError(result.error)
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-logo">
          <Lock size={18} style={{ display: 'inline', marginRight: 8, color: 'var(--amber)' }} />
          Secure<span>Notes</span>
        </div>
        <p className="auth-tagline">Encrypted. Auditable. Yours.</p>

        <h2 className="auth-title">Sign in to your vault</h2>

        <form onSubmit={submit} className="col" style={{ gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              name="email"
              type="email"
              autoComplete="email"
              className="form-input"
              placeholder="you@example.com"
              value={form.email}
              onChange={handle}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              className="form-input"
              placeholder="••••••••••"
              value={form.password}
              onChange={handle}
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
            disabled={loading}
          >
            {loading ? <span className="spinner" /> : <LogIn size={15} />}
            {loading ? 'Authenticating…' : 'Sign In'}
          </button>
        </form>

        <p className="auth-footer">
          No account?{' '}
          <Link to="/register">Create one →</Link>
        </p>
      </div>
    </div>
  )
}
