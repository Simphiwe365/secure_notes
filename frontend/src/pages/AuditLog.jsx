/**
 * pages/AuditLog.jsx
 * Admin-only — reads from /api/audit/logs/
 * CONTROL: Demonstrates audit trail readiness for IT audit engagements
 */
import { useState, useEffect, useCallback } from 'react'
import { Shield, Search, RefreshCw } from 'lucide-react'
import { auditAPI } from '../api/services'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const SUCCESS_EVENTS = ['LOGIN_SUCCESS', 'USER_REGISTERED', 'PASSWORD_CHANGED', 'NOTE_RESTORED', 'LOGOUT']
const DANGER_EVENTS  = ['LOGIN_FAILED', 'LOGIN_BLOCKED_LOCKOUT', 'ACCOUNT_LOCKED', 'LOGIN_FAILED_UNKNOWN_EMAIL', 'NOTE_DELETED']
const WARN_EVENTS    = ['PASSWORD_CHANGE_FAILED', 'NOTE_UPDATED']

function eventClass(event) {
  if (SUCCESS_EVENTS.includes(event)) return 'success'
  if (DANGER_EVENTS.includes(event))  return 'danger'
  if (WARN_EVENTS.includes(event))    return 'warn'
  return ''
}

export default function AuditLog() {
  const [logs, setLogs]         = useState([])
  const [total, setTotal]       = useState(0)
  const [loading, setLoading]   = useState(true)
  const [page, setPage]         = useState(1)
  const [search, setSearch]     = useState('')
  const [eventFilter, setEventFilter] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page }
      if (search)      params.user  = search
      if (eventFilter) params.event = eventFilter
      const { data } = await auditAPI.logs(params)
      setLogs(data.results ?? data)
      setTotal(data.count ?? (data.results ?? data).length)
    } catch {
      toast.error('Failed to load audit logs.')
    } finally {
      setLoading(false)
    }
  }, [page, search, eventFilter])

  useEffect(() => { load() }, [load])

  const pageCount = Math.ceil(total / 20)

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Shield size={20} style={{ color: 'var(--amber)' }} />
            Audit Log
          </h1>
          <p className="page-subtitle">
            Immutable event trail — {total} events recorded
          </p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="toolbar">
        <div className="search-wrap">
          <Search size={14} className="search-icon" />
          <input
            className="search-input"
            placeholder="Filter by user email…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <select
          className="select"
          value={eventFilter}
          onChange={(e) => { setEventFilter(e.target.value); setPage(1) }}
        >
          <option value="">All events</option>
          <optgroup label="Auth">
            <option value="LOGIN_SUCCESS">LOGIN_SUCCESS</option>
            <option value="LOGIN_FAILED">LOGIN_FAILED</option>
            <option value="ACCOUNT_LOCKED">ACCOUNT_LOCKED</option>
            <option value="LOGOUT">LOGOUT</option>
            <option value="USER_REGISTERED">USER_REGISTERED</option>
          </optgroup>
          <optgroup label="Notes">
            <option value="NOTE_CREATED">NOTE_CREATED</option>
            <option value="NOTE_UPDATED">NOTE_UPDATED</option>
            <option value="NOTE_DELETED">NOTE_DELETED</option>
            <option value="NOTE_RESTORED">NOTE_RESTORED</option>
          </optgroup>
          <optgroup label="Account">
            <option value="PASSWORD_CHANGED">PASSWORD_CHANGED</option>
          </optgroup>
        </select>
      </div>

      <div className="page-body">
        {loading ? (
          <div className="empty-state"><span className="spinner spinner-lg" /></div>
        ) : logs.length === 0 ? (
          <div className="empty-state">
            <Shield size={36} />
            <h3>No events found</h3>
            <p>Events will appear here as users interact with the system.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Event</th>
                  <th>User</th>
                  <th>IP Address</th>
                  <th>Method</th>
                  <th>Path</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
                      {format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss')}
                    </td>
                    <td>
                      <span className={`event-tag ${eventClass(log.event)}`}>
                        {log.event}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-primary)' }}>
                      {log.user_email || <span style={{ color: 'var(--text-muted)' }}>anonymous</span>}
                    </td>
                    <td>{log.ip_address || '—'}</td>
                    <td>
                      <span className="badge badge-muted">{log.method}</span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {log.path}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {Object.keys(log.extra || {}).length > 0
                        ? JSON.stringify(log.extra)
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pageCount > 1 && (
          <div className="row" style={{ justifyContent: 'center', marginTop: 24, gap: 6 }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >← Prev</button>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', padding: '0 8px' }}>
              Page {page} of {pageCount}
            </span>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              disabled={page === pageCount}
            >Next →</button>
          </div>
        )}
      </div>
    </>
  )
}
