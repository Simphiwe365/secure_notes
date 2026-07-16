"""
apps/notes/permissions.py
Object-level permissions — RBAC + ownership enforcement
CONTROLS:
  - Viewers cannot create/edit/delete
  - Editors can only touch their own notes
  - Admins have full access
  These mirror IT Audit GITC access control principles
"""
from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsEditorOrAdmin(BasePermission):
    """Deny write operations to VIEWER role."""
    message = 'Your account role does not permit this action.'

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return request.user.is_authenticated and request.user.is_editor


class IsOwnerOrAdmin(BasePermission):
    """Object-level: only note owner or admin can access."""
    message = 'You do not have permission to access this note.'

    def has_object_permission(self, request, view, obj):
        if request.user.is_admin:
            return True
        return obj.owner == request.user


class IsAdminRole(BasePermission):
    """Only ADMIN role users."""
    message = 'Admin access required.'

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_admin
