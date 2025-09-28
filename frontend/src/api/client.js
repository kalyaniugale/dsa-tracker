const BASE = import.meta.env.VITE_API_URL;

export function getAccess()  { return localStorage.getItem("access"); }
export function getRefresh() { return localStorage.getItem("refresh"); }

export function setTokens({ access, refresh }) {
  if (access)  localStorage.setItem("access", access);
  if (refresh) localStorage.setItem("refresh", refresh);
}
export function clearTokens() {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
}

async function refreshAccess() {
  const res = await fetch(`${BASE}/api/users/auth/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh: getRefresh() }),
  });
  if (!res.ok) throw new Error("refresh_failed");
  const data = await res.json();
  setTokens({ access: data.access });
  return data.access;
}

export async function authFetch(path, options = {}) {
  const token = getAccess();
  const withAuth = (t) => ({
    ...options,
    headers: { ...(options.headers || {}), Authorization: `Bearer ${t}` },
  });

  let res = await fetch(`${BASE}${path}`, withAuth(token));
  if (res.status !== 401) return res;

  const newToken = await refreshAccess();
  res = await fetch(`${BASE}${path}`, withAuth(newToken));
  return res;
}

// darshan added
import axios from "axios";

const client = axios.create({
  baseURL: "http://127.0.0.1:8000/api/",  // your Django API
});

export default client;
