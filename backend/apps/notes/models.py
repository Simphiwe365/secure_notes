"""
apps/notes/models.py
Notes model — owner-bound, tag support, soft-delete for audit trail integrity
CONTROL: Owner FK enforces data isolation between users
"""
import uuid
from django.db import models
from django.conf import settings


class Tag(models.Model):
    id    = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name  = models.CharField(max_length=50, unique=True)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='tags'
    )

    class Meta:
        db_table = 'tags'

    def __str__(self):
        return self.name


class Note(models.Model):
    class Visibility(models.TextChoices):
        PRIVATE = 'private', 'Private'   # Only owner can read
        SHARED  = 'shared',  'Shared'    # Admin + owner can read

    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner      = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notes'
    )
    title      = models.CharField(max_length=255)
    content    = models.TextField()
    visibility = models.CharField(
        max_length=10,
        choices=Visibility.choices,
        default=Visibility.PRIVATE
    )
    tags       = models.ManyToManyField(Tag, blank=True, related_name='notes')
    is_pinned  = models.BooleanField(default=False)

    # CONTROL: Soft delete preserves data for audit purposes
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'notes'
        ordering = ['-is_pinned', '-updated_at']
        indexes  = [
            models.Index(fields=['owner', 'is_deleted']),
            models.Index(fields=['updated_at']),
        ]

    def __str__(self):
        return f'[{self.owner}] {self.title[:40]}'
