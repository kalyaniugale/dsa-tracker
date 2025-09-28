from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    ping, RegisterView, MeView, UpdateProfileView, PasswordChangeView,
    CookieTokenObtainPairView, CookieRefreshAccessView, LogoutView,
)

urlpatterns = [
    path("ping/", ping, name="users-ping"),

    # classic JWT auth
    path("auth/register/", RegisterView.as_view(), name="users-register"),
    path("auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    # cookie-based auth (for "stay logged in")
    path("auth/token/login/", CookieTokenObtainPairView.as_view(), name="cookie_login"),
    path("auth/token/refresh-cookie/", CookieRefreshAccessView.as_view(), name="cookie_refresh"),
    path("auth/logout/", LogoutView.as_view(), name="logout"),

    # profile
    path("me/", MeView.as_view(), name="users-me"),
    path("me/update/", UpdateProfileView.as_view(), name="users-update"),
    path("me/password/", PasswordChangeView.as_view(), name="users-password-change"),
]
