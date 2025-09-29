// frontend/src/api/client.js

import axios from "axios";

// ----- Base URL (from Vercel/Vite env) -----
const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, ""); // strip trailing /
export const BASE = API_BASE; // for fetch-based helpers below

// ----- Token helpers (localStorage) -----
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

// ----- Refresh flow (DRF SimpleJWT) -----
async function refreshAccess() {
  const res = await fetch(`${API_BASE}/api/users/auth/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh: getRefresh() }),
  });
  if (!res.ok) throw new Error("refresh_failed");
  const data = await res.json();
  setTokens({ access: data.access });
  return data.access;
}

// ----- Fetch wrapper that auto-refreshes on 401 -----
export async function authFetch(path, options = {}) {
  const token = getAccess();
  const withAuth = (t) => ({
    ...options,
    headers: { ...(options.headers || {}), Authorization: `Bearer ${t}` },
  });

  const cleanPath = `/${String(path || "").replace(/^\/+/, "")}`;

  let res = await fetch(`${API_BASE}${cleanPath}`, withAuth(token));
  if (res.status !== 401) return res;

  const newToken = await refreshAccess();
  res = await fetch(`${API_BASE}${cleanPath}`, withAuth(newToken));
  return res;
}

// ===== Axios client (optional, if you use axios elsewhere) =====
const client = axios.create({
  baseURL: `${API_BASE}/api/`,
});

// Attach Authorization header from localStorage
client.interceptors.request.use((config) => {
  const t = getAccess();
  if (t) {
    config.headers = { ...(config.headers || {}), Authorization: `Bearer ${t}` };
  }
  return config;
});

// Auto-refresh once on 401 and retry the original request
client.interceptors.response.use(
  (r) => r,
  async (error) => {
    const { response, config } = error || {};
    if (response && response.status === 401 && !config?._retry) {
      try {
        config._retry = true;
        const newToken = await refreshAccess();
        config.headers = { ...(config.headers || {}), Authorization: `Bearer ${newToken}` };
        return client(config);
      } catch {
        clearTokens();
      }
    }
    return Promise.reject(error);
  }
);

export default client;
