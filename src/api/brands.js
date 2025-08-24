import { apiFetch } from "./client";
export function listBrands(token) {
  return apiFetch("/brands", {}, token); // [{id, nombre}]
}
