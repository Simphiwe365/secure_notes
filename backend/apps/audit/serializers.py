"""apps/audit/serializers.py"""
from rest_framework import serializers
from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', default='anonymous', read_only=True)

    class Meta:
        model  = AuditLog
        fields = ('id', 'user_email', 'event', 'ip_address', 'path', 'method', 'extra', 'timestamp')
