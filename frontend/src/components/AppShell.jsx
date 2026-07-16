/**
 * components/AppShell.jsx
 * Persistent sidebar + main content layout
 */
import { NavLink, useNavigate } from 'react-router-dom'
import {
  FileText, Plus, Shield, LogOut,
  LayoutDashboard, Tag, Lock
} from 'lucide-react'
import useAuthStore from '../store/authStore'

export default function AppShell({ children }) {
  const { user, logout, isAdmin } = useAuthStore((s) => ({
    user:    s.user,
    logout:  s.logout,
    isAdmin: s.isAdmin(),
  }))
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  const initials = user?.username?.slice(0, 2).toUpperCase() || '??'

  return (
    <div className="app-shell">
      {/* ── Sidebar ──────────────────────────────────────────────── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-mark">
            <Lock size={16} />
            Secure<span>Notes</span>
          </div>
          <div className="build-tag">v1.0 · IT Audit Ready</div>
        </div>

        <nav className="sidebar-nav">
          <span className="nav-section-label">Workspace</span>

          <NavLink
            to="/dashboard"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <LayoutDashboard size={15} className="nav-icon" />
            Dashboard
          </NavLink>

          <NavLink
            to="/notes/new"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Plus size={15} className="nav-icon" />
            New Note
          </NavLink>

          <NavLink
            to="/tags"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Tag size={15} className="nav-icon" />
            Tags
          </NavLink>

          {isAdmin && (
            <>
              <span className="nav-section-label">Admin</span>
              <NavLink
                to="/admin/audit"
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <Shield size={15} className="nav-icon" />
                Audit Log
              </NavLink>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="user-avatar">{initials}</div>
            <div className="user-info">
              <div className="user-name">{user?.username}</div>
              <div className={`user-role role-${user?.role}`}>{user?.role}</div>
            </div>
            <button
              onClick={handleLogout}
              className="btn btn-ghost btn-sm"
              title="Sign out"
              style={{ padding: '6px' }}
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────────── */}
      <main className="main-content">{children}</main>
    </div>
  )
}
