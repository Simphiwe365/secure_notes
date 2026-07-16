"""
apps/users/views.py
Auth views — login lockout, IP tracking, token blacklisting on logout
CONTROLS: Account lockout | Audit logging | Token revocation
"""
import logging
from django.contrib.auth import authenticate
from django.utils import timezone
from datetime import timedelta
from rest_framework import status, generics
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from .models import User
from .serializers import (
    RegisterSerializer, LoginSerializer,
    UserProfileSerializer, ChangePasswordSerializer
)
from apps.audit.utils import log_event

logger = logging.getLogger('apps.audit')

MAX_FAILED_ATTEMPTS = 5
LOCKOUT_DURATION    = timedelta(minutes=30)


def get_client_ip(request):
    """Extract real IP — handles reverse proxy X-Forwarded-For."""
    xff = request.META.get('HTTP_X_FORWARDED_FOR')
    return xff.split(',')[0].strip() if xff else request.META.get('REMOTE_ADDR')


class RegisterView(generics.CreateAPIView):
    """
    POST /api/auth/register/
    CONTROL: open endpoint; no authentication required
    """
    permission_classes = [AllowAny]
    serializer_class   = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        log_event(None, 'USER_REGISTERED', request, target_user=user)
        return Response(
            {'detail': 'Account created. Please log in.'},
            status=status.HTTP_201_CREATED
        )


class LoginView(APIView):
    """
    POST /api/auth/login/
    CONTROLS: Account lockout after 5 failures | IP logging | JWT issuance
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email    = serializer.validated_data['email']
        password = serializer.validated_data['password']
        ip       = get_client_ip(request)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # CONTROL: Generic error — no user enumeration
            log_event(None, 'LOGIN_FAILED_UNKNOWN_EMAIL', request)
            return Response({'detail': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED)

        # CONTROL: Account lockout check
        if user.locked_until and timezone.now() < user.locked_until:
            remaining = int((user.locked_until - timezone.now()).total_seconds() // 60)
            log_event(user, 'LOGIN_BLOCKED_LOCKOUT', request)
            return Response(
                {'detail': f'Account locked. Try again in {remaining} minutes.'},
                status=status.HTTP_403_FORBIDDEN
            )

        auth_user = authenticate(request, username=email, password=password)

        if not auth_user:
            # CONTROL: Increment failure count; lock if threshold exceeded
            user.failed_login_count += 1
            if user.failed_login_count >= MAX_FAILED_ATTEMPTS:
                user.locked_until = timezone.now() + LOCKOUT_DURATION
                log_event(user, 'ACCOUNT_LOCKED', request)
            user.save(update_fields=['failed_login_count', 'locked_until'])
            log_event(user, 'LOGIN_FAILED', request)
            return Response({'detail': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED)

        # ── Successful login ──────────────────────────────────────────────────
        user.failed_login_count = 0
        user.locked_until       = None
        user.last_login_ip      = ip
        user.save(update_fields=['failed_login_count', 'locked_until', 'last_login_ip'])

        refresh = RefreshToken.for_user(user)
        # Embed role in JWT claims — CONTROL: server-side role enforcement
        refresh['role']     = user.role
        refresh['username'] = user.username

        log_event(user, 'LOGIN_SUCCESS', request)

        return Response({
            'access':  str(refresh.access_token),
            'refresh': str(refresh),
            'user':    UserProfileSerializer(user).data,
        })


class LogoutView(APIView):
    """
    POST /api/auth/logout/
    CONTROL: Blacklists refresh token — prevents token reuse after logout
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response({'detail': 'Refresh token required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()   # CONTROL: token revocation
            log_event(request.user, 'LOGOUT', request)
            return Response({'detail': 'Logged out successfully.'})
        except TokenError:
            return Response({'detail': 'Invalid or expired token.'}, status=status.HTTP_400_BAD_REQUEST)


class UserProfileView(generics.RetrieveUpdateAPIView):
    """GET / PATCH /api/auth/profile/"""
    permission_classes = [IsAuthenticated]
    serializer_class   = UserProfileSerializer

    def get_object(self):
        return self.request.user


class ChangePasswordView(APIView):
    """
    POST /api/auth/change-password/
    CONTROL: Requires current password to change — prevents privilege escalation
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        if not user.check_password(serializer.validated_data['old_password']):
            log_event(user, 'PASSWORD_CHANGE_FAILED', request)
            return Response({'detail': 'Current password is incorrect.'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(serializer.validated_data['new_password'])
        user.save()
        log_event(user, 'PASSWORD_CHANGED', request)
        return Response({'detail': 'Password updated successfully.'})
