from django.db import migrations

def seed_tracks(apps, schema_editor):
    Track = apps.get_model("roadmap", "Track")
    rows = [
        {"slug": "ds",   "title": "Data Structures", "order": 1},
        {"slug": "algo", "title": "Algorithms",      "order": 2},
        {"slug": "sys",  "title": "System Design",   "order": 3},
    ]
    for r in rows:
        Track.objects.get_or_create(
            slug=r["slug"],
            defaults={"title": r["title"], "order": r["order"]},
        )

def unseed_tracks(apps, schema_editor):
    Track = apps.get_model("roadmap", "Track")
    Track.objects.filter(slug__in=["ds", "algo", "sys"]).delete()

class Migration(migrations.Migration):

    dependencies = [
        ("roadmap", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_tracks, reverse_code=unseed_tracks),
    ]
