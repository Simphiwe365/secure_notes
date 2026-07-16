/**
 * api/services.js
 * All API calls in one place — keeps components clean
 */
import client from './client'

// ── Auth ──────────────────────────────────────────────────────────────────
export const authAPI = {
  register:       (data)   => client.post('/auth/register/', data),
  login:          (data)   => client.post('/auth/login/', data),
  logout:         (refresh)=> client.post('/auth/logout/', { refresh }),
  getProfile:     ()       => client.get('/auth/profile/'),
  updateProfile:  (data)   => client.patch('/auth/profile/', data),
  changePassword: (data)   => client.post('/auth/change-password/', data),
}

// ── Notes ─────────────────────────────────────────────────────────────────
export const notesAPI = {
  list:   (params) => client.get('/notes/', { params }),
  get:    (id)     => client.get(`/notes/${id}/`),
  create: (data)   => client.post('/notes/', data),
  update: (id, d)  => client.patch(`/notes/${id}/`, d),
  delete: (id)     => client.delete(`/notes/${id}/`),
  restore:(id)     => client.post(`/notes/${id}/restore/`),
}

// ── Tags ──────────────────────────────────────────────────────────────────
export const tagsAPI = {
  list:   ()       => client.get('/tags/'),
  create: (data)   => client.post('/tags/', data),
  delete: (id)     => client.delete(`/tags/${id}/`),
}

// ── Audit (admin only) ────────────────────────────────────────────────────
export const auditAPI = {
  logs: (params) => client.get('/audit/logs/', { params }),
}
