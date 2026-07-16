"""
apps/audit/middleware.py + utils.py
"""

# ── middleware.py ──────────────────────────────────────────────────────────────
import logging
logger = logging.getLogger('apps.audit')


class AuditLogMiddleware:
    """
    Passive middleware — logs all non-200/204 responses to the security logger.
    Active audit entries are created via log_event() in individual views.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        if response.status_code in (401, 403):
            user = getattr(request, 'user', None)
            user_str = user.email if (user and user.is_authenticated) else 'anon'
            logger.warning(
                'HTTP %s | %s %s | user=%s | ip=%s',
                response.status_code,
                request.method,
                request.path,
                user_str,
                request.META.get('REMOTE_ADDR'),
            )
        return response
