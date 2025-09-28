from django.core.management.base import BaseCommand
from django.db import transaction
from apps.roadmap.models import Track, TrackProblem
from apps.problems.models import Problem

class Command(BaseCommand):
    help = "Seed sample tracks"

    @transaction.atomic
    def handle(self, *args, **kwargs):
        track, _ = Track.objects.get_or_create(
            name="LeetCode 75", defaults={"description": "Core set"}
        )
        TrackProblem.objects.filter(track=track).delete()

        problems = Problem.objects.order_by('id')  # all problems
        objs = [TrackProblem(track=track, problem=p, order=i)
                for i, p in enumerate(problems, start=1)]

        TrackProblem.objects.bulk_create(objs)  # <-- list of instances
        self.stdout.write(self.style.SUCCESS(f"Seeded {len(objs)} problems"))
