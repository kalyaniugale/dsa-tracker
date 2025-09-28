# server/apps/problems/views.py

from django.http import JsonResponse
from django.views.decorators.http import require_GET
from datetime import datetime, timezone, timedelta
from collections import defaultdict
import json
import requests

LEETCODE_GRAPHQL = "https://leetcode.com/graphql"

# =========================
# LeetCode STATS (rank + totals + difficulty split)
# =========================

_STATS_QUERY = """
query userProfile($username: String!) {
  matchedUser(username: $username) {
    username
    profile { ranking }
    submitStats: submitStatsGlobal {
      acSubmissionNum { difficulty count }
    }
  }
}
"""

@require_GET
def leetcode_stats(request, username: str):
    """
    GET /api/problems/leetcode/<username>/
    -> { username, ranking, totalSolved, easy, medium, hard }
    """
    try:
        headers = {
            "Content-Type": "application/json",
            "Referer": f"https://leetcode.com/{username}/",
            "Origin": "https://leetcode.com",
            "User-Agent": "dsa-tracker/1.0",
        }
        resp = requests.post(
            LEETCODE_GRAPHQL,
            json={"query": _STATS_QUERY, "variables": {"username": username}},
            headers=headers,
            timeout=15,
        )
        resp.raise_for_status()
        mu = (resp.json().get("data") or {}).get("matchedUser")
        if not mu:
            return JsonResponse({"error": "not_found"}, status=404)

        ranking = (mu.get("profile") or {}).get("ranking")
        ac = (mu.get("submitStats") or {}).get("acSubmissionNum") or []
        diff = {row.get("difficulty"): int(row.get("count") or 0) for row in ac}

        return JsonResponse({
            "username": mu.get("username"),
            "ranking": ranking,
            "totalSolved": diff.get("All", 0),
            "easy": diff.get("Easy", 0),
            "medium": diff.get("Medium", 0),
            "hard": diff.get("Hard", 0),
        }, status=200)

    except requests.HTTPError as e:
        return JsonResponse({"error": "stats_failed", "detail": f"http {e}"}, status=502)
    except Exception as e:
        return JsonResponse({"error": "stats_failed", "detail": str(e)}, status=502)


# =========================
# LeetCode CALENDAR (daily counts + streaks)
# =========================

def _graphql_user_calendar(username: str, year: int) -> dict:
    """Return dict {unix_ts_str: count} for a given year using GraphQL."""
    query = """
    query userCalendar($username: String!, $year: Int!) {
      userCalendar(username: $username, year: $year) {
        submissionCalendar
      }
    }
    """
    headers = {
        "Content-Type": "application/json",
        "Referer": f"https://leetcode.com/{username}/",
        "Origin": "https://leetcode.com",
        "User-Agent": "dsa-tracker/1.0",
    }
    r = requests.post(
        LEETCODE_GRAPHQL,
        json={"query": query, "variables": {"username": username, "year": year}},
        headers=headers,
        timeout=15,
    )
    r.raise_for_status()
    node = (r.json().get("data") or {}).get("userCalendar")
    if not node:
        return {}
    raw = node.get("submissionCalendar") or "{}"
    try:
        return json.loads(raw)
    except Exception:
        return {}

def _rest_user_calendar(username: str) -> dict:
    """Fallback to the REST endpoints. Returns dict {unix_ts_str: count}."""
    headers = {
        "User-Agent": "dsa-tracker/1.0",
        "Referer": f"https://leetcode.com/{username}/",
        "Origin": "https://leetcode.com",
    }
    # 1) path-style
    u1 = f"https://leetcode.com/api/user_submission_calendars/{username}/"
    r = requests.get(u1, headers=headers, timeout=15)
    if r.ok:
        try:
            payload = r.json()
            if isinstance(payload, str):
                payload = json.loads(payload or "{}")
            return payload or {}
        except Exception:
            pass

    # 2) query-style
    u2 = "https://leetcode.com/api/user_submission_calendar/"
    r = requests.get(u2, params={"username": username}, headers=headers, timeout=15)
    r.raise_for_status()
    try:
        payload = r.json()
        if isinstance(payload, str):
            payload = json.loads(payload or "{}")
        return payload or {}
    except Exception:
        return {}

def _fetch_leetcode_calendar(username: str) -> dict:
    """Combine current + previous year via GraphQL; fallback to REST."""
    today = datetime.now(timezone.utc).date()
    years = {today.year, (today - timedelta(days=180)).year}

    combined = {}
    try:
        for y in years:
            part = _graphql_user_calendar(username, y)
            combined.update(part or {})
    except Exception:
        pass  # fall through to REST

    if not combined:
        try:
            combined = _rest_user_calendar(username)
        except Exception:
            combined = {}

    # Normalize keys/values
    clean = {}
    for k, v in (combined or {}).items():
        try:
            ts = str(int(k))
            cnt = int(v or 0)
            clean[ts] = cnt
        except Exception:
            continue
    return clean

def _calc_streaks_from_days(day_counts: dict) -> tuple[int, int]:
    """day_counts: { 'YYYY-MM-DD': int } -> (current_streak, max_streak)."""
    if not day_counts:
        return 0, 0

    today = datetime.now(timezone.utc).date()
    start = min(datetime.fromisoformat(d).date() for d in day_counts.keys())

    cur = 0
    mx = 0
    d = start
    while d <= today:
        ds = d.isoformat()
        if day_counts.get(ds, 0) > 0:
            cur += 1
            mx = max(mx, cur)
        else:
            cur = 0
        d += timedelta(days=1)

    # current streak: consecutive days ending today
    cur_streak = 0
    d = today
    while day_counts.get(d.isoformat(), 0) > 0:
        cur_streak += 1
        d -= timedelta(days=1)

    return cur_streak, mx

@require_GET
def leetcode_calendar(request, username: str):
    """
    GET /api/problems/leetcode/<username>/calendar/
    -> { days: [{date, count}], currentStreak, maxStreak }
    """
    try:
        raw = _fetch_leetcode_calendar(username)  # {unix_ts_str: count}

        # Convert to per-day counts (UTC)
        per_day = defaultdict(int)
        for ts_str, cnt in (raw or {}).items():
            try:
                ts = int(ts_str)
            except Exception:
                continue
            date_str = datetime.fromtimestamp(ts, tz=timezone.utc).date().isoformat()
            per_day[date_str] += int(cnt or 0)

        # Last 180 days
        today = datetime.now(timezone.utc).date()
        start = today - timedelta(days=180)
        days = []
        d = start
        while d <= today:
            ds = d.isoformat()
            days.append({"date": ds, "count": per_day.get(ds, 0)})
            d += timedelta(days=1)

        streak_map = {x["date"]: x["count"] for x in days}
        current_streak, max_streak = _calc_streaks_from_days(streak_map)

        return JsonResponse({
            "days": days,
            "currentStreak": current_streak,
            "maxStreak": max_streak,
        }, status=200)

    except requests.HTTPError as e:
        return JsonResponse({"error": "calendar_failed", "detail": f"http {e}"}, status=502)
    except Exception as e:
        return JsonResponse({"error": "calendar_failed", "detail": str(e)}, status=502)
