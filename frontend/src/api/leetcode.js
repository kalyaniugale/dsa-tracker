// NEW: src/api/leetcode.js
const BASE = import.meta.env.VITE_API_URL;

export async function getLeetCodeStats(username) {
  const res = await fetch(`${BASE}/api/problems/leetcode/${encodeURIComponent(username)}/`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "stats_failed");
  return data;
}
export async function getLeetCodeCalendar(username) {
  const res = await fetch(`${BASE}/api/problems/leetcode/${encodeURIComponent(username)}/calendar/`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "calendar_failed");
  return data;
}
