/**
 * pages/Tags.jsx
 */
import { useState, useEffect } from 'react'
import { Plus, Tag, Trash2 } from 'lucide-react'
import { tagsAPI } from '../api/services'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'

export default function Tags() {
  const [tags, setTags]     = useState([])
  const [name, setName]     = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const isEditor = useAuthStore((s) => s.isEditor())

  async function load() {
    try {
      const { data } = await tagsAPI.list()
      setTags(data.results ?? data)
    } catch {
      toast.error('Failed to load tags.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function createTag(e) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    try {
      await tagsAPI.create({ name: name.trim() })
      toast.success('Tag created.')
      setName('')
      load()
    } catch (err) {
      const msg = err.response?.data?.name?.[0] || 'Failed to create tag.'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  async function deleteTag(id) {
    try {
      await tagsAPI.delete(id)
      toast.success('Tag deleted.')
      setTags((t) => t.filter((x) => x.id !== id))
    } catch {
      toast.error('Could not delete tag.')
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Tags</h1>
          <p className="page-subtitle">Organise your notes with labels</p>
        </div>
      </div>

      <div className="page-body">
        {isEditor && (
          <form onSubmit={createTag} className="row" style={{ maxWidth: 380, marginBottom: 32 }}>
            <input
              className="form-input"
              placeholder="New tag name…"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
            />
            <button className="btn btn-primary" type="submit" disabled={saving}>
              <Plus size={14} /> Add
            </button>
          </form>
        )}

        {loading ? (
          <div className="empty-state"><span className="spinner spinner-lg" /></div>
        ) : tags.length === 0 ? (
          <div className="empty-state">
            <Tag size={36} />
            <h3>No tags</h3>
            <p>Create tags to organise your notes.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {tags.map((t) => (
              <div
                key={t.id}
                className="badge badge-muted"
                style={{ fontSize: '0.8rem', padding: '6px 14px', gap: 10 }}
              >
                <Tag size={11} />
                {t.name}
                {isEditor && (
                  <button
                    onClick={() => deleteTag(t.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', display: 'flex', padding: 0 }}
                  >
                    <Trash2 size={11} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
