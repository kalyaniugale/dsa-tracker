from django.db import models

# Create your models here.
# apps/users/models.py
#
# What is this file?
# ------------------
# - It defines database tables ("models") for the users app.
# - We will NOT replace Django's built-in User model (simpler for beginners).
# - Instead, we create a Profile that stores extra fields like leetcode_username.
#
# How to apply this:
#   1) python manage.py makemigrations
#   2) python manage.py migrate
#   3) (optional) create a superuser to see it in admin: python manage.py createsuperuser

from django.db import models
from django.contrib.auth.models import User  # built-in User (username, email, password, etc.)

class Profile(models.Model):
    """
    One extra row of data for each Django User.

    Why not change the default User?
    - For beginners, it's safer to keep Django's User as-is.
    - We "attach" extra fields using OneToOneField.

    Example:
      user.username           -> "alice"
      user.profile.leetcode_username -> "alice_lc"
    """
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,          # if user is deleted, delete the profile too
        related_name="profile"             # so we can do user.profile to access it
    )

    # LeetCode-related info we’ll show in the dashboard
    leetcode_username = models.CharField(
        max_length=64,
        null=True, blank=True,
        db_index=True                      # faster lookups by LC username
    )
    avatar_url = models.URLField(null=True, blank=True)   # optional profile picture
    bio = models.TextField(null=True, blank=True)         # short about-me

    # Numbers we’ll either fill manually first, or later update via LeetCode sync
    total_solved  = models.PositiveIntegerField(default=0)
    easy_solved   = models.PositiveIntegerField(default=0)
    medium_solved = models.PositiveIntegerField(default=0)
    hard_solved   = models.PositiveIntegerField(default=0)
    streak_days   = models.PositiveIntegerField(default=0)

    # When did we last pull data from LeetCode?
    last_sync_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        # This is what appears in admin lists
        return f"Profile<{self.user.username}>"
