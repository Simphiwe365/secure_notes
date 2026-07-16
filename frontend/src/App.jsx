/**
 * App.jsx — Root router
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute'
import AppShell from './components/AppShell'

import Login      from './pages/Login'
import Register   from './pages/Register'
import Dashboard  from './pages/Dashboard'
import NoteEditor from './pages/NoteEditor'
import Tags       from './pages/Tags'
import AuditLog   from './pages/AuditLog'

function Shell({ children }) {
  return (
    <ProtectedRoute>
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'var(--bg-elevated)',
            color:      'var(--text-primary)',
            border:     '1px solid var(--border-bright)',
            fontFamily: 'var(--font-mono)',
            fontSize:   '0.8rem',
          },
          success: { iconTheme: { primary: 'var(--green)', secondary: 'var(--bg-elevated)' } },
          error:   { iconTheme: { primary: 'var(--red)',   secondary: 'var(--bg-elevated)' } },
        }}
      />

      <Routes>
        {/* Public */}
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected */}
        <Route path="/dashboard"    element={<Shell><Dashboard /></Shell>} />
        <Route path="/notes/new"    element={<Shell><NoteEditor /></Shell>} />
        <Route path="/notes/:id"    element={<Shell><NoteEditor /></Shell>} />
        <Route path="/tags"         element={<Shell><Tags /></Shell>} />

        {/* Admin only */}
        <Route
          path="/admin/audit"
          element={
            <AdminRoute>
              <AppShell><AuditLog /></AppShell>
            </AdminRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
