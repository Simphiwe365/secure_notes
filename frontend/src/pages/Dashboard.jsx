/**
 * pages/Dashboard.jsx
 * Note list with search, filter, stats header
 */
import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search, Pin, Eye, EyeOff, FileText, Trash2 } from 'lucide-react'
import { notesAPI } from '../api/services'
import { formatDistanceToNow } from 'date-fns'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'

export default function Dashboard() {
  const [notes, setNotes]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [visibility, setVisibility] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const isEditor = useAuthStore((s) => s.isEditor())
  const navigate  = useNavigate()

  const fetchNotes = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (search)     params.search     = search
      if (visibility) params.visibility = visibility
      const { data } = await notesAPI.list(params)
      setNotes(data.results ?? data)
    } catch {
      toast.error('Failed to load notes.')
    } finally {
      setLoading(false)
    }
  }, [search, visibility])

  useEffect(() => {
    const t = setTimeout(fetchNotes, 300)
    return () => clearTimeout(t)
  }, [fetchNotes])

  async function confirmDelete() {
    try {
      await notesAPI.delete(deleteTarget.id)
      toast.success('Note deleted.')
      setDeleteTarget(null)
      fetchNotes()
    } catch {
      toast.error('Could not delete note.')
    }
  }

  const pinned   = notes.filter((n) => n.is_pinned)
  const unpinned = notes.filter((n) => !n.is_pinned)

  return (
    <>
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Your Vault</h1>
          <p className="page-subtitle">
            {notes.length} note{notes.length !== 1 ? 's' : ''} · end-to-end secured
          </p>
        </div>
        {isEditor && (
          <Link to="/notes/new" className="btn btn-primary">
            <Plus size={15} /> New Note
          </Link>
        )}
      </div>

      {/* ── Stats ───────────────────────────────────────────────── */}
      <div style={{ padding: '16px 40px 0' }}>
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-label">Total Notes</div>
            <div className="stat-value amber">{notes.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Pinned</div>
            <div className="stat-value">{pinned.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Private</div>
            <div className="stat-value green">
              {notes.filter((n) => n.visibility === 'private').length}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Shared</div>
            <div className="stat-value">
              {notes.filter((n) => n.visibility === 'shared').length}
            </div>
          </div>
        </div>
      </div>

      {/* ── Toolbar ─────────────────────────────────────────────── */}
      <div className="toolbar">
        <div className="search-wrap">
          <Search size={14} className="search-icon" />
          <input
            className="search-input"
            placeholder="Search notes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="select"
          value={visibility}
          onChange={(e) => setVisibility(e.target.value)}
        >
          <option value="">All visibility</option>
          <option value="private">Private</option>
          <option value="shared">Shared</option>
        </select>
      </div>

      {/* ── Note Grid ───────────────────────────────────────────── */}
      <div className="page-body">
        {loading ? (
          <div className="empty-state"><span className="spinner spinner-lg" /></div>
        ) : notes.length === 0 ? (
          <div className="empty-state">
            <FileText size={40} />
            <h3>No notes yet</h3>
            <p>Create your first note to get started.</p>
            {isEditor && (
              <Link to="/notes/new" className="btn btn-primary mt-16">
                <Plus size={14} /> New Note
              </Link>
            )}
          </div>
        ) : (
          <>
            {pinned.length > 0 && (
              <>
                <p style={{ fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12 }}>
                  📌 Pinned
                </p>
                <div className="notes-grid">
                  {pinned.map((n) => (
                    <NoteCard key={n.id} note={n} onDelete={isEditor ? setDeleteTarget : null}
                      onClick={() => navigate(`/notes/${n.id}`)} />
                  ))}
                </div>
                {unpinned.length > 0 && (
                  <p style={{ fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '24px 0 12px' }}>
                    All Notes
                  </p>
                )}
              </>
            )}
            <div className="notes-grid">
              {unpinned.map((n) => (
                <NoteCard key={n.id} note={n} onDelete={isEditor ? setDeleteTarget : null}
                  onClick={() => navigate(`/notes/${n.id}`)} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Delete Modal ────────────────────────────────────────── */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Delete Note</h3>
            <p className="modal-body">
              "{deleteTarget.title}" will be soft-deleted and retained in the audit log.
              Are you sure?
            </p>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function NoteCard({ note, onClick, onDelete }) {
  return (
    <div className={`note-card ${note.is_pinned ? 'pinned' : ''}`} onClick={onClick}>
      <div className="note-card-header">
        <h3 className="note-title">{note.title}</h3>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {note.is_pinned && <Pin size={12} style={{ color: 'var(--amber)', marginTop: 2 }} />}
          {onDelete && (
            <button
              className="btn btn-ghost btn-sm"
              style={{ padding: '3px 6px' }}
              onClick={(e) => { e.stopPropagation(); onDelete(note) }}
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>

      <div className="note-meta">
        <span className={`badge badge-${note.visibility === 'private' ? 'muted' : 'amber'}`}>
          {note.visibility === 'private' ? <EyeOff size={9} /> : <Eye size={9} />}
          {note.visibility}
        </span>
        <span>{formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })}</span>
      </div>

      {note.tags?.length > 0 && (
        <div className="note-tags">
          {note.tags.map((t) => (
            <span key={t.id} className="badge badge-muted">{t.name}</span>
          ))}
        </div>
      )}
    </div>
  )
}
