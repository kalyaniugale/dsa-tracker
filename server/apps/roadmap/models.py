from django.db import models
from django.utils.text import slugify


class Track(models.Model):
    name = models.CharField(max_length=120, unique=True)
    description = models.TextField(blank=True)
    slug = models.SlugField(max_length=140, unique=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        return super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class TrackProblem(models.Model):
    track = models.ForeignKey(
        'roadmap.Track', on_delete=models.CASCADE, related_name='track_problems'
    )
    problem = models.ForeignKey('problems.Problem', on_delete=models.CASCADE)
    order = models.PositiveIntegerField()

    class Meta:
        unique_together = (('track', 'problem'), ('track', 'order'))
        ordering = ['order']

    def __str__(self):
        return f"{self.track.name} - {self.problem.title}"
