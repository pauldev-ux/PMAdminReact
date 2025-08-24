import { apiFetch } from "./client";

// GET /lots?from_date=YYYY-MM-DD&to_date=YYYY-MM-DD
export function listLots(params = {}, token) {
  const qs = new URLSearchParams();
  if (params.from_date) qs.set("from_date", params.from_date);
  if (params.to_date)   qs.set("to_date", params.to_date);
  const q = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch(`/lots${q}`, {}, token);
}

// GET /lots/:id
export function getLot(id, token) {
  return apiFetch(`/lots/${id}`, {}, token);
}

// POST /lots  { nombre, fecha, descripcion?, items:[{product_id,cantidad,costo_unitario_bob}] }
export function createLot(payload, token) {
  return apiFetch(`/lots`, { method: "POST", body: payload }, token);
}

// POST /lots/:id/items  [{product_id,cantidad,costo_unitario_bob}]
export function addItemsToLot(id, items, token) {
  return apiFetch(`/lots/${id}/items`, { method: "POST", body: items }, token);
}
