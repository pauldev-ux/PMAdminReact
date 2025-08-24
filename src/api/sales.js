import { apiFetch } from "./client";

// Lista ventas (intenta usar filtros del backend; si no existen, filtramos en el front)
export async function listSales({ from_date, to_date, product_name } = {}, token) {
  const qs = new URLSearchParams();
  if (from_date) qs.set("from_date", from_date);      // YYYY-MM-DD
  if (to_date)   qs.set("to_date", to_date);          // YYYY-MM-DD
  if (product_name) qs.set("product_name", product_name); // si tu backend lo soporta
  const q = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch(`/sales${q}`, {}, token);           // se espera [{id, fecha_venta, total_bob, items:[...]}]
}

// Detalle de una venta (fallback si /sales no envía items)
export function getSale(id, token) {
  return apiFetch(`/sales/${id}`, {}, token);
}

// Crear venta (si no lo tenías)
export function createSale(payload, token) {
  return apiFetch("/sales", { method: "POST", body: payload }, token);
}
