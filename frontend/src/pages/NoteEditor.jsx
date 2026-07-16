/**
 * pages/NoteEditor.jsx
 * Create / Edit note — with meta panel for visibility, tags, pinning
 */
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Save, ArrowLeft, Loader } from 'lucide-react'
import { notesAPI, tagsAPI } from '../api/services'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'

const EMPTY = { title: '', content: '', visibility: 'private', is_pinned: false, tag_ids: [] }

export default function NoteEditor() {
  const { id }          = useParams()
  const isEdit          = !!id
  const navigate         = useNavigate()
  const isEditor         = useAuthStore((s) => s.isEditor())

  const [form, setForm]   = useState(EMPTY)
  const [tags, setTags]   = useState([])
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(isEdit)

  // Load existing note
  useEffect(() => {
    if (!isEdit) return
    notesAPI.get(id)
      .then(({ data }) => {
        setForm({
          title:      data.title,
          content:    data.content,
          visibility: data.visibility,
          is_pinned:  data.is_pinned,
          tag_ids:    data.tags?.map((t) => t.id) || [],
        })
      })
      .catch(() => { toast.error('Note not found.'); navigate('/dashboard') })
      .finally(() => setLoading(false))
  }, [id, isEdit, navigate])

  // Load user tags
  useEffect(() => {
    tagsAPI.list().then(({ data }) => setTags(data.results ?? data)).catch(() => {})
  }, [])

  function set(name, value) {
    setForm((f) => ({ ...f, [name]: value }))
    setErrors((e) => ({ ...e, [name]: undefined }))
  }

  function toggleTag(tagId) {
    setForm((f) => ({
      ...f,
      tag_ids: f.tag_ids.includes(tagId)
        ? f.tag_ids.filter((t) => t !== tagId)
        : [...f.tag_ids, tagId],
    }))
  }

  async function save() {
    if (!form.title.trim()) {
      setErrors({ title: 'Title is required.' })
      return
    }
    setSaving(true)
    try {
      if (isEdit) {
        await notesAPI.update(id, form)
        toast.success('Note saved.')
      } else {
        const { data } = await notesAPI.create(form)
        toast.success('Note created.')
        navigate(`/notes/${data.id}`, { replace: true })
      }
    } catch (err) {
      const data = err.response?.data
      if (typeof data === 'object') setErrors(data)
      else toast.error('Save failed.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <span className="spinner spinner-lg" />
        Loading note…
      </div>
    )
  }

  return (
    <>
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="page-header">
        <div className="row">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={14} /> Back
          </button>
          <div>
            <h1 className="page-title" style={{ fontSize: '1.2rem' }}>
              {isEdit ? 'Edit Note' : 'New Note'}
            </h1>
          </div>
        </div>
        {isEditor && (
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? <Loader size={14} className="spin" /> : <Save size={14} />}
            {saving ? 'Saving…' : 'Save Note'}
          </button>
        )}
      </div>

      {/* ── Editor Layout ───────────────────────────────────── */}
      <div className="page-body">
        <div className="editor-layout">
          {/* Main editor */}
          <div className="editor-card">
            <div className="form-group">
              <label className="form-label">Title</label>
              <input
                className="form-input"
                style={{ fontSize: '1rem', fontFamily: 'var(--font-display)', fontWeight: 600 }}
                placeholder="Note title…"
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                disabled={!isEditor}
              />
              {errors.title && <p className="form-error">{errors.title}</p>}
            </div>

            <div className="form-group">
              <label className="form-label">Content</label>
              <textarea
                className="form-textarea"
                style={{ minHeight: 320, fontFamily: 'var(--font-mono)' }}
                placeholder="Write your note here…"
                value={form.content}
                onChange={(e) => set('content', e.target.value)}
                disabled={!isEditor}
              />
              {errors.content && <p className="form-error">{errors.content}</p>}
            </div>
          </div>

          {/* Meta panel */}
          <div className="editor-meta-panel">
            {/* Visibility */}
            <div>
              <p className="meta-section-title">Visibility</p>
              <div className="toggle-group mt-8">
                <button
                  className={`toggle-btn ${form.visibility === 'private' ? 'active' : ''}`}
                  onClick={() => set('visibility', 'private')}
                  disabled={!isEditor}
                >
                  🔒 Private
                </button>
                <button
                  className={`toggle-btn ${form.visibility === 'shared' ? 'active' : ''}`}
                  onClick={() => set('visibility', 'shared')}
                  disabled={!isEditor}
                >
                  🌐 Shared
                </button>
              </div>
              <p className="form-hint mt-8">
                {form.visibility === 'private'
                  ? 'Only you (and admins) can see this note.'
                  : 'Visible to all users with shared access.'}
              </p>
            </div>

            {/* Pin */}
            <div>
              <p className="meta-section-title">Options</p>
              <label
                style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginTop: 10 }}
              >
                <input
                  type="checkbox"
                  checked={form.is_pinned}
                  onChange={(e) => set('is_pinned', e.target.checked)}
                  disabled={!isEditor}
                  style={{ accentColor: 'var(--amber)', width: 15, height: 15 }}
                />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  📌 Pin this note
                </span>
              </label>
            </div>

            {/* Tags */}
            <div>
              <p className="meta-section-title">Tags</p>
              {tags.length === 0 ? (
                <p className="form-hint mt-8">No tags yet. Create tags from the sidebar.</p>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                  {tags.map((t) => (
                    <button
                      key={t.id}
                      className={`badge ${form.tag_ids.includes(t.id) ? 'badge-amber' : 'badge-muted'}`}
                      style={{ cursor: 'pointer', border: '1px solid' }}
                      onClick={() => toggleTag(t.id)}
                      disabled={!isEditor}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {!isEditor && (
              <p className="form-hint" style={{ color: 'var(--amber)', marginTop: 4 }}>
                ⚠ View-only access
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
