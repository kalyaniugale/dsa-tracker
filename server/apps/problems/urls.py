# ADD in problems/urls.py
from django.urls import path
from .views import leetcode_stats,leetcode_calendar

urlpatterns = [
    path("leetcode/<str:username>/", leetcode_stats, name="leetcode-stats"),
    path("leetcode/<str:username>/calendar/", leetcode_calendar, name="leetcode-calendar"),
]
