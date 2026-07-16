"""
apps/notes/serializers.py
"""
from rest_framework import serializers
from .models import Note, Tag


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Tag
        fields = ('id', 'name')
        read_only_fields = ('id',)


class NoteSerializer(serializers.ModelSerializer):
    owner_username = serializers.CharField(source='owner.username', read_only=True)
    tags           = TagSerializer(many=True, read_only=True)
    tag_ids        = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Tag.objects.none(), write_only=True,
        source='tags', required=False
    )

    class Meta:
        model  = Note
        fields = (
            'id', 'title', 'content', 'visibility', 'is_pinned',
            'tags', 'tag_ids', 'owner_username', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'owner_username', 'created_at', 'updated_at')

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            # CONTROL: Users can only tag with their own tags
            self.fields['tag_ids'].child_relation.queryset = Tag.objects.filter(
                owner=request.user
            )

    def validate_title(self, value):
        if len(value.strip()) < 1:
            raise serializers.ValidationError('Title cannot be blank.')
        return value.strip()


class NoteListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list view — excludes full content."""
    owner_username = serializers.CharField(source='owner.username', read_only=True)
    tags           = TagSerializer(many=True, read_only=True)

    class Meta:
        model  = Note
        fields = ('id', 'title', 'visibility', 'is_pinned', 'tags', 'owner_username', 'updated_at')
