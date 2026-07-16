"""
Root URL Configuration
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from apps.users.views import (
    RegisterView, LoginView, LogoutView,
    UserProfileView, ChangePasswordView
)

urlpatterns = [
    path('admin/', admin.site.urls),

    # ── Auth ──────────────────────────────────────────────────────────────────
    path('api/auth/register/',        RegisterView.as_view(),       name='register'),
    path('api/auth/login/',           LoginView.as_view(),          name='login'),
    path('api/auth/logout/',          LogoutView.as_view(),         name='logout'),
    path('api/auth/token/refresh/',   TokenRefreshView.as_view(),   name='token_refresh'),
    path('api/auth/profile/',         UserProfileView.as_view(),    name='profile'),
    path('api/auth/change-password/', ChangePasswordView.as_view(), name='change_password'),

    # ── Notes ─────────────────────────────────────────────────────────────────
    path('api/', include('apps.notes.urls')),

    # ── Audit (admin only) ────────────────────────────────────────────────────
    path('api/', include('apps.audit.urls')),
]
