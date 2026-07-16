"""
apps/audit/utils.py
Single helper used across all views to write to the audit log.
"""


def log_event(user, event: str, request, **extra):
    """
    Write an immutable audit record.
    Import lazily to avoid circular imports at module load time.
    """
    from .models import AuditLog

    xff = request.META.get('HTTP_X_FORWARDED_FOR')
    ip  = xff.split(',')[0].strip() if xff else request.META.get('REMOTE_ADDR')

    AuditLog.objects.create(
        user       = user,
        event      = event,
        ip_address = ip,
        user_agent = request.META.get('HTTP_USER_AGENT', '')[:300],
        path       = request.path,
        method     = request.method,
        extra      = extra or {},
    )
