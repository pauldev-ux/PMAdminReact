import { apiFetch } from "./client";

// ya existente
export function listProducts(params = {}, token) {
  const qs = new URLSearchParams();
  if (params.search) qs.set("search", params.search);
  if (typeof params.only_active === "boolean") qs.set("only_active", String(params.only_active));
  const q = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch(`/products${q}`, {}, token);
}

// NUEVO: crear producto
export function createProduct(product, token) {
  // product = { nombre, brand_id, precio_compra, precio_venta, cantidad, activo }
  return apiFetch("/products", { method: "POST", body: product }, token);
}

// NUEVO: subir imagen
export function uploadProductImage(productId, file, token) {
  const form = new FormData();
  form.append("file", file);
  return apiFetch(`/products/${productId}/image`, { method: "POST", body: form }, token);
}


export function getProduct(id, token) {
  return apiFetch(`/products/${id}`, {}, token);
}

export function updateProduct(id, partial, token) {
  // partial = { nombre?, brand_id?, precio_compra?, precio_venta?, cantidad?, activo?, image_url? }
  return apiFetch(`/products/${id}`, { method: "PATCH", body: partial }, token);
}