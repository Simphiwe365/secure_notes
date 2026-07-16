"""
apps/audit/models.py
Immutable audit log — append-only event store
CONTROL: Provides audit trail for IT audit engagements
         Records who did what, when, from where
"""
import uuid
from django.db import models
from django.conf import settings


class AuditLog(models.Model):
    """
    Append-only event log. No updates. No deletes (enforced in admin).
    Each record answers: Who | What | When | Where
    """
    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user       = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True, blank=True,        # null for anonymous/pre-auth events
        on_delete=models.SET_NULL,
        related_name='audit_logs'
    )
    event      = models.CharField(max_length=80)    # e.g. LOGIN_SUCCESS, NOTE_DELETED
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=300, blank=True)
    path       = models.CharField(max_length=300, blank=True)
    method     = models.CharField(max_length=10, blank=True)
    extra      = models.JSONField(default=dict, blank=True)  # e.g. {'note_id': '...'}
    timestamp  = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'audit_logs'
        ordering = ['-timestamp']
        # CONTROL: Prevent edits — read + add only
        default_permissions = ('add', 'view')

    def __str__(self):
        user_str = self.user.email if self.user else 'anonymous'
        return f'[{self.timestamp:%Y-%m-%d %H:%M:%S}] {self.event} | {user_str} | {self.ip_address}'
