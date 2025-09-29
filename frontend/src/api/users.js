import { authFetch, setTokens, clearTokens, BASE } from "./client.js";


export async function register({ username, email, password }) {
  const res = await fetch(`${BASE}/api/users/auth/register/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "register_failed");
  return data;
}

export async function login({ username, password }) {
  const res = await fetch(`${BASE}/api/users/auth/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "login_failed");
  setTokens(data);
  return data;
}

export function logout() { clearTokens(); }

export async function getMe() {
  const res = await authFetch(`/api/users/me/`);
  if (!res.ok) throw new Error("me_failed");
  return res.json();
}

export async function updateProfile(patch) {
  const res = await authFetch(`/api/users/me/update/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error("update_failed");
  return res.json();
}

export async function changePassword({ old_password, new_password }) {
  const res = await authFetch(`/api/users/me/password/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ old_password, new_password }),
  });
  if (!res.ok) throw new Error("password_change_failed");
  return res.json();
}

// darshan added
import client from "./client";

export const getTracks = () => client.get("roadmap/tracks/");
export const getTrackDetail = (id) => client.get(`roadmap/tracks/${id}/`);
