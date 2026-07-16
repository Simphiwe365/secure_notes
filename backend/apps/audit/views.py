"""
apps/audit/views.py — Admin-only read-only audit log endpoint
"""
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import AuditLog
from .serializers import AuditLogSerializer
from apps.notes.permissions import IsAdminRole


class AuditLogListView(generics.ListAPIView):
    """
    GET /api/audit/logs/
    CONTROL: Read-only; admin role required; supports filter by event, user
    """
    permission_classes = [IsAuthenticated, IsAdminRole]
    serializer_class   = AuditLogSerializer

    def get_queryset(self):
        qs = AuditLog.objects.select_related('user').all()
        event = self.request.query_params.get('event')
        user  = self.request.query_params.get('user')
        if event:
            qs = qs.filter(event__icontains=event)
        if user:
            qs = qs.filter(user__email__icontains=user)
        return qs
