from django.apps import AppConfig


class UsersConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.users"   # <-- important: full dotted path
    # optional but nice:
    label = "users"