from django.http import JsonResponse
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.contrib.auth import update_session_auth_hash

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import generics, status

from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import UserSerializer, PasswordChangeSerializer

# --- test view ---
def ping(request):
    return JsonResponse({"status": "ok", "app": "users"})


# --- register ---
class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = (request.data.get("username") or "").strip()
        email = (request.data.get("email") or "").strip()
        password = request.data.get("password") or ""

        if not username or not password:
            return Response({"detail": "username and password are required"}, status=400)

        if User.objects.filter(username=username).exists():
            return Response({"detail": "username already taken"}, status=400)

        try:
            validate_password(password)
        except ValidationError as e:
            return Response({"detail": e.messages}, status=400)

        user = User.objects.create_user(username=username, email=email, password=password)
        return Response({"id": user.id, "username": user.username, "email": user.email},
                        status=status.HTTP_201_CREATED)


# --- get current user ---
class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        u = request.user
        return Response({
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "first_name": u.first_name,
            "last_name": u.last_name,
        })


# --- update current user ---
class UpdateProfileView(generics.UpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


# --- change password ---
class PasswordChangeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        old_password = serializer.validated_data["old_password"]
        new_password = serializer.validated_data["new_password"]

        if not user.check_password(old_password):
            return Response({"detail": "Old password is incorrect"}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()
        update_session_auth_hash(request, user)  # keep admin sessions valid

        return Response({"detail": "Password updated successfully"})


# =========================
# Cookie-based JWT handling
# =========================

REFRESH_COOKIE_NAME = "refresh_token"
REFRESH_COOKIE_MAX_AGE = 60 * 60 * 24 * 30  # 30 days

class CookieTokenObtainPairView(TokenObtainPairView):
    """
    POST {username,password} → sets HttpOnly refresh cookie + returns {access}
    """
    permission_classes = [AllowAny]
    serializer_class = TokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        resp = super().post(request, *args, **kwargs)  # contains access+refresh
        data = resp.data
        refresh = data.get("refresh")
        access = data.get("access")

        if refresh:
            resp.set_cookie(
                REFRESH_COOKIE_NAME,
                refresh,
                max_age=REFRESH_COOKIE_MAX_AGE,
                httponly=True,
                secure=False,  # set True in production (HTTPS)
                samesite="Lax",
                path="/",
            )
            try:
                del resp.data["refresh"]  # don’t expose refresh token in JSON
            except Exception:
                pass

        resp.data = {"access": access}
        return resp


class CookieRefreshAccessView(APIView):
    """
    POST (no body) → uses HttpOnly cookie to give a new access token
    """
    permission_classes = [AllowAny]

    def post(self, request):
        cookie_val = request.COOKIES.get(REFRESH_COOKIE_NAME)
        if not cookie_val:
            return Response({"detail": "No refresh cookie"}, status=401)
        try:
            token = RefreshToken(cookie_val)
            access = str(token.access_token)
            return Response({"access": access})
        except Exception:
            return Response({"detail": "Invalid refresh"}, status=401)


class LogoutView(APIView):
    """
    POST → clears refresh cookie
    """
    def post(self, request):
        resp = Response({"detail": "logged out"})
        resp.delete_cookie(REFRESH_COOKIE_NAME, path="/")
        return resp
