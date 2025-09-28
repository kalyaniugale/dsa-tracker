from django.contrib import admin
from django.contrib import admin
from django.urls import path, include


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/",include('apps.roadmap.urls')),
    path("api/users/", include("apps.users.urls")),
     path("api/problems/", include("apps.problems.urls")),
]
