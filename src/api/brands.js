import { apiFetch } from "./client";

// Listar todas las marcas
export function listBrands(token) {
  return apiFetch("/brands", {}, token); // [{id, nombre}]
}

// Crear nueva marca
export function createBrand(nombre, token) {
  return apiFetch("/brands", { method: "POST", body: { nombre } }, token);
}
