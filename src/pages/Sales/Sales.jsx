import React, { useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { createSale } from "../../api/sales";
import { API_BASE } from "../../api/client";

const PLACEHOLDER_IMG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='56' height='56'><rect width='100%' height='100%' fill='#f0f0f0'/><text x='50%' y='52%' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='10' fill='#888'>IMG</text></svg>`
  );

export default function Sales() {
  const { token } = useAuth();
  const { items, setCantidad, setPrecio, removeItem, clear, total } = useCart();

  const [dateStr, setDateStr] = useState(() => new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);
  const [ok, setOk] = useState(null);

  const canSubmit =
    items.length > 0 && items.every((it) => it.cantidad > 0 && it.cantidad <= it.stock && it.precio >= 0);

  const payload = useMemo(
    () => ({
      fecha_venta: dateStr,
      items: items.map((it) => ({
        product_id: it.product_id,
        cantidad: it.cantidad,
        precio_unitario_bob: Number(it.precio).toFixed(2),
      })),
      // sin nota
    }),
    [items, dateStr]
  );

  async function submit() {
    setErr(null);
    setOk(null);
    if (!canSubmit) {
      setErr("Revisa cantidades y precios.");
      return;
    }
    setSaving(true);
    try {
      const sale = await createSale(payload, token);
      setOk(`Venta #${sale.id} registrada. Total BOB ${Number(sale.total_bob).toFixed(2)}`);
      clear();
    } catch (e) {
      setErr(e.message || "No se pudo registrar la venta");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ padding: "16px 0" }}>
      <h2>Ventas</h2>

      {items.length === 0 ? (
        <div className="pm-muted">
          No hay productos en el carrito. Ve a <b>Perfumes</b> y añade algunos.
        </div>
      ) : (
        <>
          {/* Encabezado compacto */}
          <div className="pm-row wrap" style={{ gap: 10, margin: "10px 0" }}>
            <div style={{ minWidth: 220, flex: "0 1 240px" }}>
              <label className="pm-label">Fecha</label>
              <input
                type="date"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="pm-input"
              />
            </div>
          </div>

          {/* Carrito (cards) */}
          <div className="cart-list">
  {items.map((it) => {
    const img = it.image_url
      ? it.image_url.startsWith("http") ? it.image_url : `${API_BASE}${it.image_url}`
      : PLACEHOLDER_IMG;
    const subtotal = it.precio * it.cantidad;

    return (
      <article key={it.product_id} className="cart-item cart-row">
        <img
          src={img}
          alt={it.nombre}
          className="cart-thumb cart-thumb-lg"
          onError={(e)=>{ e.currentTarget.src = PLACEHOLDER_IMG; }}
          loading="lazy"
        />

        <div className="cart-main">
          {/* nombre a la izquierda, stock a la derecha */}
          <div className="cart-header">
            <b className="cart-name">{it.nombre}</b>
            <span className="pm-muted">Stock: <b>{it.stock}</b></span>
          </div>

          {/* campos compactos */}
          <div className="cart-fields">
            <label className="field sm">
              <span className="pm-label">Cantidad</span>
              <input
                type="number" min="1" max={it.stock}
                value={it.cantidad}
                onChange={(e)=>setCantidad(it.product_id, e.target.value, it.stock)}
                className="pm-input sm"
                inputMode="numeric"
              />
            </label>

            <label className="field sm">
              <span className="pm-label">Precio (BOB)</span>
              <input
                type="number" min="0" step="0.01"
                value={it.precio}
                onChange={(e)=>setPrecio(it.product_id, e.target.value)}
                className="pm-input sm"
                inputMode="decimal"
              />
            </label>
          </div>
        </div>

        <div className="cart-side">
          <div className="subtotal">
            <span className="pm-muted">Subtotal</span>
            <b className="subtotal-value">{subtotal.toFixed(2)}</b>
          </div>
          <button onClick={()=>removeItem(it.product_id)} className="pm-btn danger">
            Quitar
          </button>
        </div>
      </article>
    );
  })}
</div>


          {/* Footer acciones */}
          <div className="pm-row" style={{ justifyContent: "space-between", marginTop: 12 }}>
            <button onClick={clear} className="pm-btn">
              Vaciar carrito
            </button>
            <div className="pm-row">
              <b>Total: {total.toFixed(2)} BOB</b>
              <button
                disabled={!canSubmit || saving}
                onClick={submit}
                className="pm-btn primary"
              >
                {saving ? "Guardando…" : "Finalizar venta"}
              </button>
            </div>
          </div>

          {err && <div className="pm-alert error" style={{ marginTop: 8 }}>{err}</div>}
          {ok && <div className="pm-alert ok" style={{ marginTop: 8 }}>{ok}</div>}
        </>
      )}
    </div>
  );
}
