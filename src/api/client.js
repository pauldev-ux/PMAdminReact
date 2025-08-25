// src/api/client.js
export const API_BASE =
  (import.meta?.env?.VITE_API_URL && import.meta.env.VITE_API_URL.trim()) ||
  "http://127.0.0.1:8000"; // fallback para localhost

export async function apiFetch(path, opts = {}, tokenMaybe) {
  // Compatibilidad: apiFetch(path, {}, token)
  const token = opts.token ?? tokenMaybe;

  const headers = { ...(opts.headers || {}) };
  const isForm = opts.body instanceof FormData;

  if (!isForm && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method: opts.method || "GET",
    headers,
    body: isForm ? opts.body : opts.body ? JSON.stringify(opts.body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    try {
      const j = JSON.parse(text);
      throw new Error((j.detail ?? text) || `HTTP ${res.status}`);
    } catch {
      throw new Error(text || `HTTP ${res.status} ${res.statusText}`);
    }
  }

  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : null;
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

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Credenciales inválidas");
  }
  return res.json(); // { access_token, token_type }
}

export function meRequest(token) {
  return apiFetch("/auth/me", {}, token);
}
