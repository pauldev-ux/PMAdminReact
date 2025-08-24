import { apiFetch } from "./client";

export function listProducts(params = {}, token) {
  const qs = new URLSearchParams();
  if (params.search) qs.set("search", params.search);
  if (typeof params.only_active === "boolean") qs.set("only_active", String(params.only_active));
  const q = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch(`/products${q}`, {}, token);
}
