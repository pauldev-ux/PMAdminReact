import React, { createContext, useContext, useMemo, useState } from "react";

const CartContext = createContext(undefined);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  function addItem(p, opts = {}) {
    setItems(prev => {
      const i = prev.findIndex(x => x.product_id === p.id);
      const precio = opts.precio ?? Number(p.precio_venta ?? 0);
      const cantidad = opts.cantidad ?? 1;
      if (i >= 0) {
        const next = [...prev];
        next[i] = { ...next[i], cantidad: Math.min(next[i].cantidad + cantidad, p.cantidad) };
        return next;
      }
      return [...prev, {
        product_id: p.id, nombre: p.nombre, stock: p.cantidad ?? 0,
        precio, cantidad, image_url: p.image_url || null,
      }];
    });
  }

  function removeItem(product_id) { setItems(prev => prev.filter(x => x.product_id !== product_id)); }
  function setCantidad(product_id, cantidad, stock) {
    setItems(prev => prev.map(x => x.product_id === product_id
      ? { ...x, cantidad: Math.max(1, Math.min(Number(cantidad) || 1, stock ?? x.stock)) }
      : x));
  }
  function setPrecio(product_id, precio) {
    setItems(prev => prev.map(x => x.product_id === product_id
      ? { ...x, precio: Math.max(0, Number(String(precio).replace(",", ".")) || 0) }
      : x));
  }
  function clear() { setItems([]); }

  const total = useMemo(() => items.reduce((a, it) => a + it.precio * it.cantidad, 0), [items]);
  const count = useMemo(() => items.reduce((a, it) => a + it.cantidad, 0), [items]);

  const value = { items, addItem, removeItem, setCantidad, setPrecio, clear, total, count };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (ctx === undefined) {
    throw new Error("useCart debe usarse dentro de <CartProvider>.");
  }
  return ctx;
}
