from django.contrib import admin
from .models import Track, TrackProblem

class TrackProblemInline(admin.TabularInline):
    model = TrackProblem
    fk_name = 'track'
    extra = 0

@admin.register(Track)
class TrackAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "slug")
    prepopulated_fields = {"slug": ("name",)}
    inlines = [TrackProblemInline]
