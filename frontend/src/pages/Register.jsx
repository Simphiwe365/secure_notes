/**
 * pages/Register.jsx
 */
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Lock, UserPlus } from 'lucide-react'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'

const INITIAL = { email: '', username: '', full_name: '', password: '', password2: '' }

export default function Register() {
  const [form, setForm]   = useState(INITIAL)
  const [errors, setErrors] = useState({})
  const { register, loading } = useAuthStore((s) => ({ register: s.register, loading: s.loading }))
  const navigate = useNavigate()

  function handle(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    setErrors((err) => ({ ...err, [e.target.name]: undefined }))
  }

  async function submit(e) {
    e.preventDefault()
    setErrors({})
    const result = await register(form)
    if (result.ok) {
      toast.success('Account created! Please sign in.')
      navigate('/login')
    } else {
      setErrors(result.errors || {})
    }
  }

  function fieldError(name) {
    const val = errors[name]
    if (!val) return null
    const msg = Array.isArray(val) ? val[0] : val
    return <p className="form-error">{msg}</p>
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-logo">
          <Lock size={18} style={{ display: 'inline', marginRight: 8, color: 'var(--amber)' }} />
          Secure<span>Notes</span>
        </div>
        <p className="auth-tagline">Encrypted. Auditable. Yours.</p>

        <h2 className="auth-title">Create your vault</h2>

        <form onSubmit={submit} className="col" style={{ gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input name="email" type="email" className="form-input"
              placeholder="you@example.com" value={form.email} onChange={handle} />
            {fieldError('email')}
          </div>

          <div className="form-group">
            <label className="form-label">Username</label>
            <input name="username" type="text" className="form-input"
              placeholder="your_handle" value={form.username} onChange={handle} />
            <span className="form-hint">Letters, numbers, underscores. 3–50 chars.</span>
            {fieldError('username')}
          </div>

          <div className="form-group">
            <label className="form-label">Full Name <span style={{color:'var(--text-muted)'}}>optional</span></label>
            <input name="full_name" type="text" className="form-input"
              placeholder="Jane Doe" value={form.full_name} onChange={handle} />
          </div>

          <div className="auth-divider">password</div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input name="password" type="password" className="form-input"
              placeholder="Min 10 chars" value={form.password} onChange={handle} />
            {fieldError('password')}
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input name="password2" type="password" className="form-input"
              placeholder="Repeat password" value={form.password2} onChange={handle} />
            {fieldError('password2')}
          </div>

          {errors.non_field_errors && (
            <p className="form-error">{errors.non_field_errors[0]}</p>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
            disabled={loading}
          >
            {loading ? <span className="spinner" /> : <UserPlus size={15} />}
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="auth-footer">
          Have an account? <Link to="/login">Sign in →</Link>
        </p>
      </div>
    </div>
  )
}
