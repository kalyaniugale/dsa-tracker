from django.db import models

class Problem(models.Model):
    DIFFICULTY = (("E","Easy"),("M","Medium"),("H","Hard"))
    title = models.CharField(max_length=200, unique=True)
    difficulty = models.CharField(max_length=1, choices=DIFFICULTY, default="E")

    def __str__(self):
        return self.title
