from django.db import migrations

def slugify_simple(s: str) -> str:
    # very small slugify to avoid external deps
    return (
        s.strip().lower()
         .replace("&", "and")
         .replace("/", "-")
         .replace(" ", "-")
    )

def seed_tracks(apps, schema_editor):
    Track = apps.get_model("roadmap", "Track")
    rows = [
        {"name": "Data Structures", "description": "Core DS for interviews"},
        {"name": "Algorithms",      "description": "Sorting, DP, graphs, etc."},
        {"name": "System Design",   "description": "High-level design basics"},
    ]

    for r in rows:
        slug = slugify_simple(r["name"])
        # idempotent: won’t duplicate on re-run
        Track.objects.get_or_create(
            name=r["name"],
            defaults={"description": r["description"], "slug": slug},
        )
        # If an object exists without slug, backfill slug
        t = Track.objects.get(name=r["name"])
        if not t.slug:
            t.slug = slug
            t.save(update_fields=["slug"])

def unseed_tracks(apps, schema_editor):
    Track = apps.get_model("roadmap", "Track")
    Track.objects.filter(slug__in=[
        "data-structures", "algorithms", "system-design"
    ]).delete()

class Migration(migrations.Migration):

    dependencies = [
        ("roadmap", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_tracks, reverse_code=unseed_tracks),
    ]
