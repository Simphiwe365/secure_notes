"""
apps/users/serializers.py
Input validation on all auth data — CONTROL: prevents injection, enforces schema
"""
import re
from django.contrib.auth.password_validation import validate_password
from django.utils import timezone
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User


class RegisterSerializer(serializers.ModelSerializer):
    password  = serializers.CharField(write_only=True, min_length=10)
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model  = User
        fields = ('email', 'username', 'full_name', 'password', 'password2')

    def validate_username(self, value):
        # CONTROL: Whitelist validation — only alphanumeric + underscore
        if not re.match(r'^[a-zA-Z0-9_]{3,50}$', value):
            raise serializers.ValidationError(
                'Username must be 3–50 characters: letters, numbers, underscores only.'
            )
        return value

    def validate_password(self, value):
        validate_password(value)   # Runs Django's built-in validators
        return value

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({'password2': 'Passwords do not match.'})
        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        return User.objects.create_user(**validated_data)


class LoginSerializer(serializers.Serializer):
    email    = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model  = User
        fields = ('id', 'email', 'username', 'full_name', 'role', 'created_at', 'last_login_ip')
        read_only_fields = ('id', 'email', 'role', 'created_at', 'last_login_ip')


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=10)

    def validate_new_password(self, value):
        validate_password(value)
        return value


class TokenPairSerializer(serializers.Serializer):
    """Returned after successful login"""
    access  = serializers.CharField()
    refresh = serializers.CharField()
    user    = UserProfileSerializer()
