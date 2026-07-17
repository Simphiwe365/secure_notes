# SecureNotes - Full-Stack Web Application

> **IT Audit Portfolio Project** | Django REST Framework + React + Supabase PostgreSQL
> Demonstrates application-layer security controls aligned with GITC (General IT Controls) frameworks tested in IT audit engagements.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.11 · Django 5 · Django REST Framework |
| Auth | JWT via `djangorestframework-simplejwt` |
| Database | PostgreSQL|
| Frontend | React 18 · Vite · Zustand · React Router v6 |
| Hosting | Render (backend) · Vercel (frontend) — both free |

---

## Security Controls Implemented

| Control | Where | Audit Relevance |
|---------|-------|-----------------|
| Role-Based Access Control (RBAC) | `users/models.py`, `notes/permissions.py` | Mirrors GITC access control testing |
| JWT with short-lived tokens (15 min) | `config/settings.py` — SIMPLE_JWT | Session management controls |
| Refresh token blacklisting on logout | `users/views.py` — LogoutView | Token revocation / session termination |
| Account lockout after 5 failed logins | `users/views.py` — LoginView | Brute-force prevention |
| IP address logging on every login | `users/models.py` — last_login_ip | User activity monitoring |
| Parameterised queries (Django ORM) | All models | SQL injection prevention |
| Input validation + whitelist regex | `users/serializers.py` | Input validation controls |
| Password strength enforcement | `config/settings.py` — AUTH_PASSWORD_VALIDATORS | Password policy |
| PBKDF2-SHA256 password hashing | Django default | Credential storage security |
| Immutable audit log (append-only) | `audit/models.py` | Audit trail / non-repudiation |
| Soft delete (data retained) | `notes/models.py` — is_deleted | Audit trail integrity |
| Owner-scoped querysets | `notes/views.py` — get_queryset() | Horizontal privilege escalation prevention |
| HTTPS enforcement + HSTS | `config/settings.py` — SECURE_* | Transport security |
| CORS restriction to known origins | `config/settings.py` — CORS_ALLOWED_ORIGINS | Cross-origin request control |
| Rate throttling (20/hr anon, 1000/day user) | `config/settings.py` — REST_FRAMEWORK | DoS / brute-force mitigation |
| Security headers (XSS, content-type) | `config/settings.py` | Browser-level security controls |
| Admin-only audit log endpoint | `audit/views.py` | Separation of duties |
| Client-side role route guards | `components/ProtectedRoute.jsx` | Defence in depth (UX layer) |

---

## Project Structure

```
secure-notes/
├── backend/
│   ├── config/
│   │   ├── settings.py        # All Django config
│   │   ├── urls.py            # Root URL router
│   │   └── wsgi.py
│   ├── apps/
│   │   ├── users/             # Auth, User model, RBAC
│   │   │   ├── models.py      # Custom User with role field
│   │   │   ├── serializers.py # Input validation
│   │   │   └── views.py       # Register, Login, Logout, Profile
│   │   ├── notes/             # Note CRUD
│   │   │   ├── models.py      # Note + Tag, soft-delete
│   │   │   ├── permissions.py # IsEditorOrAdmin, IsOwnerOrAdmin
│   │   │   ├── serializers.py
│   │   │   └── views.py       # Scoped queryset, soft-delete
│   │   └── audit/             # Immutable event log
│   │       ├── models.py      # AuditLog (append-only)
│   │       ├── middleware.py  # Passive 401/403 logger
│   │       ├── utils.py       # log_event() helper
│   │       └── views.py       # Admin-only log reader
│   ├── manage.py
│   ├── requirements.txt
│   ├── render-build.sh        # Render deployment script
│   └── render.yaml
│
└── frontend/
    ├── src/
    │   ├── api/
    │   │   ├── client.js      # Axios + auto JWT refresh
    │   │   └── services.js    # All API calls
    │   ├── store/
    │   │   └── authStore.js   # Zustand auth state
    │   ├── components/
    │   │   ├── AppShell.jsx   # Sidebar layout
    │   │   └── ProtectedRoute.jsx  # Route guards
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── Dashboard.jsx  # Note grid + stats
    │   │   ├── NoteEditor.jsx # Create / edit
    │   │   ├── Tags.jsx
    │   │   └── AuditLog.jsx   # Admin audit viewer
    │   ├── styles/global.css
    │   ├── App.jsx            # Router
    │   └── main.jsx
    ├── vercel.json
    └── package.json
```

---

## Local Development Setup

### 1. Clone & set up backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env — fill in your Supabase DB credentials
```

### 3. Run migrations

```bash
python manage.py migrate
python manage.py createsuperuser  # Set role=admin in Django admin after
```

### 4. Start Django

```bash
python manage.py runserver        # Runs on http://localhost:8000
```

### 5. Set up frontend

```bash
cd ../frontend
npm install
cp .env.example .env              # VITE_API_URL can stay blank for dev
npm run dev                       # Runs on http://localhost:5173
```

---

## Supabase Setup

1. Go to [supabase.com](https://supabase.com) → New project
2. **Project Settings → Database** → copy the connection details
3. Paste into your `backend/.env`:
   ```
   DB_HOST=db.xxxxxxxxxxxx.supabase.co
   DB_NAME=postgres
   DB_USER=postgres
   DB_PASSWORD=<your-db-password>
   DB_PORT=5432
   ```
4. Run `python manage.py migrate` — Django will create all tables in Supabase

---

## Deployment

### Backend → Render

1. Push `backend/` to a GitHub repo
2. Go to [render.com](https://render.com) → **New Web Service**
3. Connect your repo, set:
   - **Build Command:** `./render-build.sh`
   - **Start Command:** `gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --workers 2`
4. Add all environment variables from `.env.example` in the Render dashboard
5. Deploy — your API will be at `https://your-app.onrender.com`

### Frontend → Vercel

1. Push `frontend/` to a GitHub repo (or same repo, set root to `frontend/`)
2. Go to [vercel.com](https://vercel.com) → **New Project** → import repo
3. Add environment variable:
   ```
   VITE_API_URL=https://your-backend.onrender.com/api
   ```
4. Deploy — your app will be at `https://your-app.vercel.app`
5. Update `CORS_ALLOWED_ORIGINS` on Render to include your Vercel URL

---

## API Reference

### Auth Endpoints (public)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register/` | Create account |
| POST | `/api/auth/login/` | Get JWT token pair |
| POST | `/api/auth/logout/` | Blacklist refresh token |
| POST | `/api/auth/token/refresh/` | Rotate access token |

### Auth Endpoints (authenticated)
| Method | Path | Description |
|--------|------|-------------|
| GET/PATCH | `/api/auth/profile/` | View / update profile |
| POST | `/api/auth/change-password/` | Change password |

### Notes (authenticated)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/notes/` | List own notes (search, filter) |
| POST | `/api/notes/` | Create note (editor+) |
| GET | `/api/notes/{id}/` | Get note |
| PATCH | `/api/notes/{id}/` | Update note (editor+, own) |
| DELETE | `/api/notes/{id}/` | Soft-delete (editor+, own) |
| POST | `/api/notes/{id}/restore/` | Restore deleted (admin only) |

### Admin
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/audit/logs/` | Paginated audit log (admin only) |

---

## Roles

| Role | Create/Edit Notes | Delete Notes | View Audit Log | View All Notes |
|------|:-----------------:|:------------:|:--------------:|:--------------:|
| viewer | ✗ | ✗ | ✗ | own only |
| editor | ✓ | ✓ (own) | ✗ | own only |
| admin | ✓ | ✓ (any) | ✓ | all |

> Roles are assigned in Django Admin. Default on register: `editor`.

---

## Portfolio Write-Up Points

- **GITC Access Controls:** RBAC with three roles enforced at both API permission class and queryset level — no note is returned unless it belongs to the requesting user (or user is admin).
- **Application Controls Testing:** Account lockout after 5 failed attempts simulates the brute-force detection controls tested in IT audits. Lockout events are captured in the audit log.
- **Audit Trail Readiness:** Every auth event, note mutation, and access attempt writes an immutable `AuditLog` record with timestamp, user, IP, HTTP method, path, and contextual JSON. Records are append-only (no update/delete permissions in admin).
- **Separation of Duties:** Audit log is readable only by admin role users. Note writers cannot read the audit log. Django admin write access to AuditLog is disabled.
- **Privilege Escalation Testing:** `get_queryset()` scoping and `IsOwnerOrAdmin` object-level permission prevent horizontal escalation. Role field on JWT claims prevents vertical escalation via token manipulation.
- **Input Validation:** All inbound data passes through DRF serializers with explicit field types, length limits, and regex whitelisting before touching the database.
