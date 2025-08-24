// src/api/client.js
export const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

export async function apiFetch(path, { method = "GET", headers = {}, body, token } = {}) {
  const h = { ...headers };
  if (!(body instanceof FormData)) h["Content-Type"] = h["Content-Type"] || "application/json";
  if (token) h["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: h,
    body: body && !(body instanceof FormData) ? JSON.stringify(body) : body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${res.statusText} — ${text}`);
  }
  return res.json();
}

export async function loginRequest(username, password) {
  const form = new URLSearchParams();
  form.set("username", username);
  form.set("password", password);
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
  });
  if (!res.ok) throw new Error("Credenciales inválidas");
  return res.json(); // { access_token, token_type }
}

export function meRequest(token) {
  return apiFetch("/auth/me", { token });
}
