import React, { useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { createSale } from "../../api/sales";
import { API_BASE } from "../../api/client";

const input = { padding: 8, border: "1px solid #ddd", borderRadius: 10, width: "100%" };
const btn = { padding: "8px 12px", border: "1px solid #ddd", borderRadius: 10, background: "#f7f7f7", cursor: "pointer" };
const btnPrim = { padding: "10px 14px", border: "1px solid #0ea5e9", borderRadius: 10, background: "#0ea5e9", color: "white", cursor: "pointer" };
const imgStyle  = { width: 56, height: 56, objectFit: "cover", borderRadius: 8, border: "1px solid #eee", background: "#f9f9f9" };
const PLACEHOLDER_IMG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='56' height='56'><rect width='100%' height='100%' fill='#f0f0f0'/><text x='50%' y='52%' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='10' fill='#888'>IMG</text></svg>`);

export default function Sales() {
  const { token } = useAuth();
  const { items, setCantidad, setPrecio, removeItem, clear, total } = useCart();
  const [dateStr, setDateStr] = useState(() => new Date().toISOString().slice(0, 10));
  const [nota, setNota] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);
  const [ok, setOk] = useState(null);

  const canSubmit = items.length > 0 && items.every(it => it.cantidad > 0 && it.cantidad <= it.stock && it.precio >= 0);

  const payload = useMemo(() => ({
    fecha_venta: dateStr,
    items: items.map(it => ({
      product_id: it.product_id,
      cantidad: it.cantidad,
      precio_unitario_bob: Number(it.precio).toFixed(2), // mandamos precio explícito
    })),
    nota: nota || undefined,
  }), [items, dateStr, nota]);

  async function submit() {
    setErr(null); setOk(null);
    if (!canSubmit) { setErr("Revisa cantidades y precios."); return; }
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
        <div style={{ color: "#666" }}>No hay productos en el carrito. Ve a <b>Perfumes</b> y añade algunos.</div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 10, margin: "10px 0" }}>
            <div>
              <label>Fecha</label>
              <input type="date" value={dateStr} onChange={e => setDateStr(e.target.value)} style={input} />
            </div>
            <div>
              <label>Nota</label>
              <input value={nota} onChange={e => setNota(e.target.value)} style={input} placeholder="opcional…" />
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <Th>Producto</Th>
                  <Th>Stock</Th>
                  <Th>Cantidad</Th>
                  <Th>Precio (BOB)</Th>
                  <Th>Subtotal</Th>
                  <Th></Th>
                </tr>
              </thead>
              <tbody>
                {items.map(it => {
                  const img = it.image_url ? (it.image_url.startsWith("http") ? it.image_url : `${API_BASE}${it.image_url}`) : PLACEHOLDER_IMG;
                  const subtotal = it.precio * it.cantidad;
                  return (
                    <tr key={it.product_id}>
                      <Td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <img src={img} alt={it.nombre} style={imgStyle} onError={(e)=>{e.currentTarget.src=PLACEHOLDER_IMG}} />
                          <div>
                            <div><b>{it.nombre}</b></div>
                            <div style={{ color: "#666", fontSize: 12 }}>ID: {it.product_id}</div>
                          </div>
                        </div>
                      </Td>
                      <Td>{it.stock}</Td>
                      <Td>
                        <input
                          type="number" min="1" max={it.stock}
                          value={it.cantidad}
                          onChange={(e)=>setCantidad(it.product_id, e.target.value, it.stock)}
                          style={{ ...input, width: 100 }}
                        />
                      </Td>
                      <Td>
                        <input
                          type="number" min="0" step="0.01"
                          value={it.precio}
                          onChange={(e)=>setPrecio(it.product_id, e.target.value)}
                          style={{ ...input, width: 120 }}
                        />
                      </Td>
                      <Td>{subtotal.toFixed(2)}</Td>
                      <Td>
                        <button onClick={()=>removeItem(it.product_id)} style={{ ...btn, background: "#ffecec", borderColor: "#ffbdbd" }}>Quitar</button>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, alignItems: "center" }}>
            <button onClick={clear} style={btn}>Vaciar carrito</button>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <b>Total: {total.toFixed(2)} BOB</b>
              <button disabled={!canSubmit || saving} onClick={submit} style={btnPrim}>
                {saving ? "Guardando…" : "Finalizar venta"}
              </button>
            </div>
          </div>

          {err && <div style={{ color: "#b00020", marginTop: 8 }}>{err}</div>}
          {ok  && <div style={{ color: "#0a7e07", marginTop: 8 }}>{ok}</div>}
        </>
      )}
    </div>
  );
}

function Th({ children }) { return <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #eee", fontWeight: 600 }}>{children}</th>; }
function Td({ children }) { return <td style={{ padding: 8, borderBottom: "1px solid #f3f3f3" }}>{children}</td>; }
