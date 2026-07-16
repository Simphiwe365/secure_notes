"""
apps/notes/views.py
CONTROLS enforced here:
  - get_queryset() scopes to owner — prevents horizontal privilege escalation
  - Soft delete preserves audit trail
  - All mutations logged via AuditLog
"""
from django.utils import timezone
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from .models import Note, Tag
from .serializers import NoteSerializer, NoteListSerializer, TagSerializer
from .permissions import IsEditorOrAdmin, IsOwnerOrAdmin
from apps.audit.utils import log_event


class NoteViewSet(viewsets.ModelViewSet):
    """
    CRUD for Notes.
    list   GET    /api/notes/
    create POST   /api/notes/
    read   GET    /api/notes/{id}/
    update PUT    /api/notes/{id}/
    patch  PATCH  /api/notes/{id}/
    delete DELETE /api/notes/{id}/   → soft delete
    """
    permission_classes  = [IsEditorOrAdmin, IsOwnerOrAdmin]
    filter_backends     = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields    = ['visibility', 'is_pinned']
    search_fields       = ['title', 'content', 'tags__name']
    ordering_fields     = ['created_at', 'updated_at', 'title']

    def get_serializer_class(self):
        if self.action == 'list':
            return NoteListSerializer
        return NoteSerializer

    def get_queryset(self):
        """
        CONTROL: Scope queryset to the authenticated user's notes only.
        Admins can optionally see all notes via ?all=true.
        Soft-deleted notes are excluded by default.
        """
        user = self.request.user
        qs   = Note.objects.filter(is_deleted=False)

        if user.is_admin and self.request.query_params.get('all') == 'true':
            return qs.select_related('owner').prefetch_related('tags')

        return qs.filter(owner=user).select_related('owner').prefetch_related('tags')

    def perform_create(self, serializer):
        note = serializer.save(owner=self.request.user)
        log_event(self.request.user, 'NOTE_CREATED', self.request, note_id=str(note.id))

    def perform_update(self, serializer):
        note = serializer.save()
        log_event(self.request.user, 'NOTE_UPDATED', self.request, note_id=str(note.id))

    def perform_destroy(self, instance):
        # CONTROL: Soft delete — data retained for audit; not physically removed
        instance.is_deleted = True
        instance.deleted_at = timezone.now()
        instance.save(update_fields=['is_deleted', 'deleted_at'])
        log_event(self.request.user, 'NOTE_DELETED', self.request, note_id=str(instance.id))

    @action(detail=True, methods=['post'], url_path='restore')
    def restore(self, request, pk=None):
        """ADMIN ONLY: restore a soft-deleted note."""
        if not request.user.is_admin:
            return Response({'detail': 'Admin only.'}, status=status.HTTP_403_FORBIDDEN)
        note = Note.objects.filter(pk=pk, is_deleted=True).first()
        if not note:
            return Response({'detail': 'Note not found.'}, status=status.HTTP_404_NOT_FOUND)
        note.is_deleted = False
        note.deleted_at = None
        note.save(update_fields=['is_deleted', 'deleted_at'])
        log_event(request.user, 'NOTE_RESTORED', request, note_id=str(note.id))
        return Response(NoteSerializer(note, context={'request': request}).data)


class TagViewSet(viewsets.ModelViewSet):
    """CRUD for user-owned tags."""
    serializer_class   = TagSerializer
    permission_classes = [IsEditorOrAdmin]

    def get_queryset(self):
        return Tag.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)
